"use client";

import { useId, useState } from "react";
import { INITIAL_TAGS } from "@/lib/tags";
import type { Ingredient, RecipeFormValues, SourceType, Step } from "@/lib/types";

type Props = {
  action: (formData: FormData) => void;
  initial?: Partial<RecipeFormValues>;
  existingTags: string[];
  confidence?: "high" | "low";
};

function emptyIngredient(): Ingredient {
  return { name: "", amount: null, unit: null, is_pantry: false };
}

function emptyStep(order: number): Step {
  return { order, text: "" };
}

export function RecipeForm({ action, initial, existingTags, confidence }: Props) {
  const formId = useId();
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initial?.ingredients?.length ? initial.ingredients : [emptyIngredient()]
  );
  const [steps, setSteps] = useState<Step[]>(
    initial?.steps?.length ? initial.steps : [emptyStep(0)]
  );
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [customTag, setCustomTag] = useState("");

  const sourceType: SourceType = initial?.source_type ?? "manual";

  const tagOptions = Array.from(new Set([...INITIAL_TAGS, ...existingTags]));

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const t = customTag.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setCustomTag("");
  }

  function updateIngredient(index: number, patch: Partial<Ingredient>) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing))
    );
  }

  function updateStep(index: number, text: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, text } : s)));
  }

  function moveStep(index: number, direction: "up" | "down") {
    setSteps((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  }

  return (
    <form action={action} id={formId} className="space-y-6 pb-24">
      <input type="hidden" name="source_type" value={sourceType} />
      <input type="hidden" name="source_url" value={initial?.source_url ?? ""} />
      <input type="hidden" name="thumbnail_url" value={initial?.thumbnail_url ?? ""} />
      <input type="hidden" name="raw_text" value={initial?.raw_text ?? ""} />
      <input type="hidden" name="tags" value={tags.join(",")} />
      <input
        type="hidden"
        name="ingredients_json"
        value={JSON.stringify(ingredients.filter((i) => i.name.trim().length > 0))}
      />
      <input
        type="hidden"
        name="steps_json"
        value={JSON.stringify(steps.filter((s) => s.text.trim().length > 0))}
      />

      {confidence === "low" && (
        <div className="rounded-lg border border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-200">
          AIによる抽出の精度が低い可能性がある。材料・手順を確認・修正してから保存してほしい。
        </div>
      )}

      <section className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="title">
          タイトル
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title}
          className="h-12 w-full rounded-lg border border-black/20 px-4 text-base dark:border-white/20 dark:bg-transparent"
        />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="base_servings">
            人数（何人前）
          </label>
          <input
            id="base_servings"
            name="base_servings"
            type="number"
            step="0.5"
            min="0"
            defaultValue={initial?.base_servings ?? undefined}
            className="h-12 w-full rounded-lg border border-black/20 px-4 text-base dark:border-white/20 dark:bg-transparent"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="cook_time_min">
            調理時間（分）
          </label>
          <input
            id="cook_time_min"
            name="cook_time_min"
            type="number"
            min="0"
            defaultValue={initial?.cook_time_min ?? undefined}
            className="h-12 w-full rounded-lg border border-black/20 px-4 text-base dark:border-white/20 dark:bg-transparent"
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">材料</h2>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="材料名"
                value={ing.name}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
                className="h-11 flex-1 min-w-0 rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
              />
              <input
                placeholder="分量"
                type="number"
                step="0.1"
                value={ing.amount ?? ""}
                onChange={(e) =>
                  updateIngredient(i, {
                    amount: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="h-11 w-20 rounded-lg border border-black/20 px-2 text-base dark:border-white/20 dark:bg-transparent"
              />
              <input
                placeholder="単位"
                value={ing.unit ?? ""}
                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                className="h-11 w-16 rounded-lg border border-black/20 px-2 text-base dark:border-white/20 dark:bg-transparent"
              />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={ing.is_pantry}
                  onChange={(e) => updateIngredient(i, { is_pantry: e.target.checked })}
                  className="h-5 w-5"
                />
                常備品
              </label>
              <button
                type="button"
                onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                className="h-11 w-11 shrink-0 rounded-lg border border-black/20 text-lg dark:border-white/20"
                aria-label="材料を削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])}
          className="h-11 w-full rounded-lg border border-dashed border-black/30 text-sm dark:border-white/30"
        >
          + 材料を追加
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">手順</h2>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-3 w-6 shrink-0 text-sm text-black/50 dark:text-white/50">
                {i + 1}
              </span>
              <textarea
                value={step.text}
                onChange={(e) => updateStep(i, e.target.value)}
                rows={2}
                className="min-h-11 flex-1 min-w-0 rounded-lg border border-black/20 px-3 py-2 text-base dark:border-white/20 dark:bg-transparent"
              />
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveStep(i, "up")}
                  className="h-8 w-8 rounded-lg border border-black/20 text-sm dark:border-white/20"
                  aria-label="上へ"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(i, "down")}
                  className="h-8 w-8 rounded-lg border border-black/20 text-sm dark:border-white/20"
                  aria-label="下へ"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                className="h-11 w-11 shrink-0 rounded-lg border border-black/20 text-lg dark:border-white/20"
                aria-label="手順を削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSteps((prev) => [...prev, emptyStep(prev.length)])}
          className="h-11 w-full rounded-lg border border-dashed border-black/30 text-sm dark:border-white/30"
        >
          + 手順を追加
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium">タグ</h2>
        <div className="flex flex-wrap gap-2">
          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`h-9 rounded-full border px-3 text-sm ${
                tags.includes(tag)
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/20 dark:border-white/20"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            placeholder="自由入力タグ"
            className="h-10 flex-1 rounded-lg border border-black/20 px-3 text-sm dark:border-white/20 dark:bg-transparent"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="h-10 rounded-lg border border-black/20 px-3 text-sm dark:border-white/20"
          >
            追加
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="memo">
          メモ
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={initial?.memo ?? undefined}
          className="w-full rounded-lg border border-black/20 px-4 py-2 text-base dark:border-white/20 dark:bg-transparent"
        />
      </section>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_planned"
          defaultChecked={initial?.is_planned ?? true}
          className="h-5 w-5"
        />
        作りたいリストに入れる
      </label>

      <button
        type="submit"
        className="h-12 w-full rounded-lg bg-black text-base font-medium text-white dark:bg-white dark:text-black"
      >
        保存
      </button>
    </form>
  );
}
