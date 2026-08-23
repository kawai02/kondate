"use client";

import { useState, useTransition } from "react";
import { rewriteStepsAction } from "@/lib/scaling-actions";
import { scaleIngredients } from "@/lib/scaling";
import type { Recipe, Step } from "@/lib/types";

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
        <section className="mt-6 rounded-xl border border-black/10 p-4 dark:border-white/10">
          <label className="block text-sm font-medium" htmlFor="servings">
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
              className="h-11 w-24 rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
            />
            <span className="text-sm text-black/60 dark:text-white/60">人前</span>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">材料</h2>
        {recipe.ingredients.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">材料未登録</p>
        ) : (
          <ul className="space-y-1">
            {(scaled ?? recipe.ingredients.map((i) => ({ ...i, originalAmount: null }))).map(
              (ing, i) => (
                <li
                  key={i}
                  className="flex justify-between border-b border-black/5 py-1.5 text-sm dark:border-white/10"
                >
                  <span>
                    {ing.name}
                    {ing.is_pantry && (
                      <span className="ml-2 text-xs text-black/40 dark:text-white/40">常備品</span>
                    )}
                  </span>
                  <span className="text-black/60 dark:text-white/60">
                    {ing.amount ?? ""}
                    {ing.unit ?? ""}
                    {isDifferentServings && ing.originalAmount != null && (
                      <span className="ml-1 text-xs text-black/40 dark:text-white/40">
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
          <h2 className="text-lg font-semibold">手順</h2>
          {isDifferentServings && (
            <div className="flex items-center gap-3 text-sm">
              {rewrittenSteps && (
                <button
                  type="button"
                  onClick={() => setShowOriginal((v) => !v)}
                  className="text-black/60 underline dark:text-white/60"
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
                  className="h-9 rounded-lg bg-black px-3 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {pending ? "書き換え中…" : "この人数に合わせて手順を書き換える"}
                </button>
              )}
            </div>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {displayedSteps.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">手順未登録</p>
        ) : (
          <ol className="space-y-3">
            {displayedSteps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-medium text-black/40 dark:text-white/40">{i + 1}</span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
