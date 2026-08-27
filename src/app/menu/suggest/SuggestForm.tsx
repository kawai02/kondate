"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  suggestWeeklyMenuAction,
  confirmSuggestionAction,
  type SuggestedDay,
} from "@/lib/suggest-actions";
import { RecipePickerSheet } from "@/app/_components/RecipePickerSheet";
import styles from "@/app/_components/kondate-theme.module.css";

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
          <label className="block text-sm font-bold" htmlFor="start-date">
            開始日
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`${styles.searchInput} h-11 px-3 text-base`}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold" htmlFor="extra-instruction">
            リクエスト（任意）
          </label>
          <textarea
            id="extra-instruction"
            value={extraInstruction}
            onChange={(e) => setExtraInstruction(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="例: 今週は野菜多めで。金曜は来客があるので豪華に。麺類は避けて。"
            className={`${styles.searchInput} w-full px-3 py-2 text-base`}
          />
          <p className="text-xs text-[var(--ink-soft)]">
            AIは「肉と魚を偏らせない」「最近作ったものを避ける」「平日は時短・週末は手の込んだもの」を基本方針にする。ここに書いた要望はそれより優先される。
          </p>
        </div>

        {error && <p className={`${styles.dangerLink} text-sm`}>{error}</p>}
        <button
          type="button"
          onClick={handleSuggest}
          disabled={pending}
          className={`${styles.chunky} ${styles.cOrange} h-12 w-full text-base disabled:opacity-50`}
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
          <li key={s.date} className={`${styles.card} p-3`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--ink)]">
                {formatDate(s.date)}（{s.weekday}）
              </span>
              <button
                type="button"
                onClick={() => handleRemove(s.date)}
                className={`${styles.dangerLink} text-xs`}
              >
                削除
              </button>
            </div>
            <p className="mt-1 font-bold text-[var(--ink)]">{s.recipeTitle}</p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">{s.reason}</p>
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
        <p className="text-center text-sm text-[var(--ink-soft)]">
          全て削除された。提案をやり直すか、カレンダーから手動で配置してほしい。
        </p>
      )}

      {error && <p className={`${styles.dangerLink} text-sm`}>{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSuggestions(null)}
          className={`${styles.chunky} ${styles.cCream} h-12 flex-1 text-sm`}
        >
          もう一度提案
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending || suggestions.length === 0}
          className={`${styles.chunky} ${styles.cGreen} h-12 flex-1 text-sm disabled:opacity-50`}
        >
          {pending ? "確定中…" : "確定してカレンダーに反映"}
        </button>
      </div>
    </div>
  );
}
