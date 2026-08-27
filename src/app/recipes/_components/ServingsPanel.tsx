"use client";

import { useState, useTransition } from "react";
import { rewriteStepsAction } from "@/lib/scaling-actions";
import { scaleIngredients } from "@/lib/scaling";
import type { Recipe, Step } from "@/lib/types";
import styles from "@/app/_components/kondate-theme.module.css";

export function ServingsPanel({ recipe }: { recipe: Recipe }) {
  const baseServings = recipe.base_servings;
  const [servings, setServings] = useState<number>(baseServings ?? 1);
  const [rewrittenSteps, setRewrittenSteps] = useState<Step[] | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleServingsChange(value: number) {
    setServings(value);
    setRewrittenSteps(null);
    setShowOriginal(false);
    setError(null);
  }

  function handleRewrite() {
    setError(null);
    startTransition(async () => {
      const result = await rewriteStepsAction(recipe.id, servings);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRewrittenSteps(result.steps);
      setShowOriginal(false);
    });
  }

  const scaled =
    baseServings != null ? scaleIngredients(recipe.ingredients, baseServings, servings) : null;
  const isDifferentServings = baseServings != null && servings !== baseServings;
  const displayedSteps = !showOriginal && rewrittenSteps ? rewrittenSteps : recipe.steps;

  return (
    <>
      {baseServings != null && (
        <section className={`${styles.card} mt-6 p-4`}>
          <label className="block text-sm font-bold" htmlFor="servings">
            人数を変更する
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="servings"
              type="number"
              step="0.5"
              min="0.5"
              value={servings}
              onChange={(e) => handleServingsChange(Number(e.target.value))}
              className={`${styles.searchInput} h-11 w-24 px-3 text-base`}
            />
            <span className="text-sm font-bold text-[var(--ink-soft)]">人前</span>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className={`${styles.heading} mb-3 text-lg text-[var(--outline)]`}>材料</h2>
        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">材料未登録</p>
        ) : (
          <ul className="space-y-1">
            {(scaled ?? recipe.ingredients.map((i) => ({ ...i, originalAmount: null }))).map(
              (ing, i) => (
                <li
                  key={i}
                  className="flex justify-between border-b-2 border-[var(--card-2)] py-1.5 text-sm"
                >
                  <span>
                    {ing.name}
                    {ing.is_pantry && (
                      <span className="ml-2 text-xs font-bold text-[var(--ink-soft)]">常備品</span>
                    )}
                  </span>
                  <span className="text-[var(--ink-soft)]">
                    {ing.amount ?? ""}
                    {ing.unit ?? ""}
                    {isDifferentServings && ing.originalAmount != null && (
                      <span className="ml-1 text-xs text-[var(--ink-soft)]">
                        （元: {baseServings}人前で{ing.originalAmount}
                        {ing.unit ?? ""}）
                      </span>
                    )}
                  </span>
                </li>
              )
            )}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className={`${styles.heading} text-lg text-[var(--outline)]`}>手順</h2>
          {isDifferentServings && (
            <div className="flex items-center gap-3 text-sm">
              {rewrittenSteps && (
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  className="font-bold text-[var(--ink-soft)] underline"
                >
                  {showOriginal
                    ? `${servings}人前の手順を表示`
                    : `元の手順（${baseServings}人前）を表示`}
                </button>
              )}
              {!rewrittenSteps && (
                <button
                  type="button"
                  onClick={handleRewrite}
                  disabled={pending}
                  className={`${styles.chunky} ${styles.cOrange} h-9 px-3 text-xs disabled:opacity-50`}
                >
                  {pending ? "書き換え中…" : "この人数に合わせて手順を書き換える"}
                </button>
              )}
            </div>
          )}
        </div>

        {error && <p className={`${styles.dangerLink} mb-3 text-sm`}>{error}</p>}

        {displayedSteps.length === 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">手順未登録</p>
        ) : (
          <ol className="space-y-3">
            {displayedSteps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-bold text-[var(--ink-soft)]">{i + 1}</span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
