"use server";

import { addDays, format, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/require-session";
import { listRecipeSummaries } from "@/lib/recipes";
import { getCookingStatsMap } from "@/lib/cooking-logs";
import { addMenuEntries } from "@/lib/menu";
import { suggestWeeklyMenu, GeminiExtractionError } from "@/lib/gemini";
import type { WeeklyMenuCandidate, WeeklyMenuDay } from "@/lib/gemini";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export type SuggestedDay = {
  date: string;
  weekday: string;
  recipeId: string;
  recipeTitle: string;
  reason: string;
};

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

const MAX_EXTRA_INSTRUCTION_LENGTH = 500;

export async function suggestWeeklyMenuAction(
  startDate: string,
  extraInstruction?: string
): Promise<ActionResult<SuggestedDay[]>> {
  await requireSession();

  const [recipes, statsMap] = await Promise.all([
    listRecipeSummaries(),
    getCookingStatsMap(),
  ]);
  if (recipes.length === 0) {
    return { ok: false, message: "レシピが登録されていない" };
  }

  const candidates: WeeklyMenuCandidate[] = recipes.map((r) => ({
    title: r.title,
    tags: r.tags,
    cookTimeMin: r.cook_time_min,
    lastCookedOn: statsMap.get(r.id)?.lastCookedOn ?? null,
  }));

  const start = parseISO(startDate);
  const days: WeeklyMenuDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    const weekday = WEEKDAY_LABELS[d.getDay()];
    return {
      dayOffset: i,
      date: format(d, "yyyy-MM-dd"),
      weekday,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    };
  });

  try {
    const result = await suggestWeeklyMenu({
      candidates,
      days,
      // 長すぎる入力でトークンを浪費しないよう上限で切り詰める。
      extraInstruction: extraInstruction?.slice(0, MAX_EXTRA_INSTRUCTION_LENGTH),
    });

    const suggestions: SuggestedDay[] = [];
    for (const assignment of result.assignments) {
      const day = days.find((d) => d.dayOffset === assignment.day_offset);
      const recipe = recipes[assignment.recipe_index];
      if (!day || !recipe) continue;
      suggestions.push({
        date: day.date,
        weekday: day.weekday,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        reason: assignment.reason,
      });
    }

    suggestions.sort((a, b) => a.date.localeCompare(b.date));
    return { ok: true, data: suggestions };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof GeminiExtractionError ? err.message : "献立の提案に失敗した",
    };
  }
}

export async function confirmSuggestionAction(
  entries: { date: string; recipe_id: string }[]
): Promise<void> {
  await requireSession();
  await addMenuEntries(
    entries.map((entry) => ({ date: entry.date, recipe_id: entry.recipe_id, servings: null }))
  );
  revalidatePath("/");
}
