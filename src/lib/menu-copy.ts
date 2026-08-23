import "server-only";
import { addDays, differenceInCalendarDays, format, getDay, parseISO } from "date-fns";
import { getSupabase } from "@/lib/supabase";
import { listMenuEntries } from "@/lib/menu";
import type { MenuEntryWithRecipe } from "@/lib/types";

export type CopyMode = "weekday" | "date";
export type ConflictMode = "overwrite" | "skip" | "append";

export async function copyMenuEntries(params: {
  sourceStart: string;
  sourceEnd: string;
  targetStart: string;
  mode: CopyMode;
  conflict: ConflictMode;
}): Promise<{ copied: number; skipped: number }> {
  const supabase = getSupabase();
  const sourceEntries = await listMenuEntries(params.sourceStart, params.sourceEnd);
  if (sourceEntries.length === 0) return { copied: 0, skipped: 0 };

  const sourceStartDate = parseISO(params.sourceStart);
  const targetStartDate = parseISO(params.targetStart);

  // 曜日基準: コピー先開始日を、コピー元開始日と同じ曜日になるまで前方に進めてから
  // 同じ日数差で写す。週の並びがそのまま保たれる（仕様書4.7）。
  let effectiveTargetStart = targetStartDate;
  if (params.mode === "weekday") {
    const sourceWeekday = getDay(sourceStartDate);
    const targetWeekday = getDay(targetStartDate);
    const diff = (sourceWeekday - targetWeekday + 7) % 7;
    effectiveTargetStart = addDays(targetStartDate, diff);
  }

  const byTargetDate = new Map<string, MenuEntryWithRecipe[]>();
  for (const entry of sourceEntries) {
    const offset = differenceInCalendarDays(parseISO(entry.date), sourceStartDate);
    const targetDate = format(addDays(effectiveTargetStart, offset), "yyyy-MM-dd");
    const list = byTargetDate.get(targetDate) ?? [];
    list.push(entry);
    byTargetDate.set(targetDate, list);
  }

  let copied = 0;
  let skipped = 0;

  for (const [targetDate, entries] of byTargetDate) {
    const { data: existing, error: existingError } = await supabase
      .from("menu_entries")
      .select("id")
      .eq("date", targetDate)
      .eq("meal_type", "dinner");
    if (existingError) throw existingError;

    const existingCount = existing?.length ?? 0;

    if (params.conflict === "skip" && existingCount > 0) {
      skipped += entries.length;
      continue;
    }

    if (params.conflict === "overwrite" && existingCount > 0) {
      const { error: deleteError } = await supabase
        .from("menu_entries")
        .delete()
        .eq("date", targetDate)
        .eq("meal_type", "dinner");
      if (deleteError) throw deleteError;
    }

    let position = params.conflict === "append" ? existingCount : 0;

    const ordered = [...entries].sort((a, b) => a.position - b.position);
    for (const entry of ordered) {
      const { error: insertError } = await supabase.from("menu_entries").insert({
        date: targetDate,
        meal_type: "dinner",
        recipe_id: entry.recipe_id,
        servings: entry.servings,
        position,
      });
      if (insertError) throw insertError;
      position += 1;
      copied += 1;
    }
  }

  return { copied, skipped };
}
