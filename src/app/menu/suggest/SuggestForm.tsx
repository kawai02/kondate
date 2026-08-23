"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  suggestWeeklyMenuAction,
  confirmSuggestionAction,
  type SuggestedDay,
} from "@/lib/suggest-actions";
import { RecipePickerSheet } from "@/app/_components/RecipePickerSheet";

function today(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

export function SuggestForm({
  pickerRecipes,
}: {
  pickerRecipes: { id: string; title: string; tags: string[] }[];
}) {
  const [startDate, setStartDate] = useState(today());
  const [extraInstruction, setExtraInstruction] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const recipeById = new Map(pickerRecipes.map((r) => [r.id, r]));

  function handleSuggest() {
    setError(null);
    startTransition(async () => {
      const result = await suggestWeeklyMenuAction(startDate, extraInstruction);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuggestions(result.data);
    });
  }

  function handleSwap(date: string, recipeId: string) {
    const recipe = recipeById.get(recipeId);
    if (!recipe) return;
    setSuggestions((prev) =>
      (prev ?? []).map((s) =>
        s.date === date
          ? { ...s, recipeId: recipe.id, recipeTitle: recipe.title, reason: "手動で差し替え" }
          : s
      )
    );
  }

  function handleRemove(date: string) {
    setSuggestions((prev) => (prev ?? []).filter((s) => s.date !== date));
  }

  function handleConfirm() {
    if (!suggestions || suggestions.length === 0) return;
    setError(null);
    startTransition(async () => {
      await confirmSuggestionAction(
        suggestions.map((s) => ({ date: s.date, recipe_id: s.recipeId }))
      );
      router.push("/");
    });
  }

  if (!suggestions) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="start-date">
            開始日
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-11 rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="extra-instruction">
            リクエスト（任意）
          </label>
          <textarea
            id="extra-instruction"
            value={extraInstruction}
            onChange={(e) => setExtraInstruction(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="例: 今週は野菜多めで。金曜は来客があるので豪華に。麺類は避けて。"
            className="w-full rounded-lg border border-black/20 px-3 py-2 text-base dark:border-white/20 dark:bg-transparent"
          />
          <p className="text-xs text-black/50 dark:text-white/50">
            AIは「肉と魚を偏らせない」「最近作ったものを避ける」「平日は時短・週末は手の込んだもの」を基本方針にする。ここに書いた要望はそれより優先される。
          </p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleSuggest}
          disabled={pending}
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "提案中…" : "1週間分を提案"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {suggestions.map((s) => (
          <li key={s.date} className="rounded-xl border border-black/10 p-3 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {formatDate(s.date)}（{s.weekday}）
              </span>
              <button
                type="button"
                onClick={() => handleRemove(s.date)}
                className="text-xs text-red-600 dark:text-red-400"
              >
                削除
              </button>
            </div>
            <p className="mt-1 font-medium">{s.recipeTitle}</p>
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">{s.reason}</p>
            <div className="mt-2">
              <RecipePickerSheet
                recipes={pickerRecipes}
                onPick={(recipeId) => handleSwap(s.date, recipeId)}
                triggerLabel="差し替える"
              />
            </div>
          </li>
        ))}
      </ul>

      {suggestions.length === 0 && (
        <p className="text-center text-sm text-black/50 dark:text-white/50">
          全て削除された。提案をやり直すか、カレンダーから手動で配置してほしい。
        </p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSuggestions(null)}
          className="h-12 flex-1 rounded-lg border border-black/20 text-sm font-medium dark:border-white/20"
        >
          もう一度提案
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || suggestions.length === 0}
          className="h-12 flex-1 rounded-lg bg-black text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "確定中…" : "確定してカレンダーに反映"}
        </button>
      </div>
    </div>
  );
}
