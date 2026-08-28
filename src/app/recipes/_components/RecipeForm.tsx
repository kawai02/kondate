"use client";

import { useId, useState, useTransition } from "react";
import { INITIAL_TAGS } from "@/lib/tags";
import { rotateImage90 } from "@/lib/rotate-image";
import { uploadRotatedImageAction } from "@/lib/import-actions";
import type { Ingredient, RecipeFormValues, SourceType, Step } from "@/lib/types";
import styles from "@/app/_components/kondate-theme.module.css";

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
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    initial?.thumbnail_url ?? null
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [rotating, startRotate] = useTransition();

  function handleRotate() {
    if (!thumbnailUrl || rotating) return;
    setImageError(null);
    startRotate(async () => {
      try {
        const res = await fetch(thumbnailUrl);
        if (!res.ok) throw new Error("fetch failed");
        const rotated = await rotateImage90(await res.blob());

        const formData = new FormData();
        formData.append("image", rotated);
        formData.append("old_url", thumbnailUrl);
        const result = await uploadRotatedImageAction(formData);
        if (!result.ok) {
          setImageError(result.message);
          return;
        }
        setThumbnailUrl(result.data.url);
      } catch {
        setImageError("画像の回転に失敗した");
      }
    });
  }

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
      <input type="hidden" name="thumbnail_url" value={thumbnailUrl ?? ""} />
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
        <div className={`${styles.noticeCard} px-4 py-3 text-sm`}>
          AIによる抽出の精度が低い可能性がある。材料・手順を確認・修正してから保存してほしい。
        </div>
      )}

      {thumbnailUrl && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">写真</h2>
          <div className="overflow-hidden rounded-xl border-2 border-[var(--outline)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt=""
              className="max-h-72 w-full bg-[var(--card-2)] object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleRotate}
            disabled={rotating}
            className={`${styles.chunky} ${styles.cCream} h-10 px-4 text-sm disabled:opacity-50`}
          >
            {rotating ? "回転中…" : "↻ 90°回転"}
          </button>
          {imageError && <p className={`${styles.dangerLink} text-sm`}>{imageError}</p>}
        </section>
      )}

      <section className="space-y-2">
        <label className="block text-sm font-bold" htmlFor="title">
          タイトル
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={initial?.title}
          className={`${styles.searchInput} h-12 w-full px-4 text-base`}
        />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold" htmlFor="base_servings">
            人数（何人前）
          </label>
          <input
            id="base_servings"
            name="base_servings"
            type="number"
            step="0.5"
            min="0"
            defaultValue={initial?.base_servings ?? undefined}
            className={`${styles.searchInput} h-12 w-full px-4 text-base`}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold" htmlFor="cook_time_min">
            調理時間（分）
          </label>
          <input
            id="cook_time_min"
            name="cook_time_min"
            type="number"
            min="0"
            defaultValue={initial?.cook_time_min ?? undefined}
            className={`${styles.searchInput} h-12 w-full px-4 text-base`}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">材料</h2>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="材料名"
                value={ing.name}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
                className={`${styles.searchInput} h-11 min-w-0 flex-1 px-3 text-base`}
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
                className={`${styles.searchInput} h-11 w-20 px-2 text-base`}
              />
              <input
                placeholder="単位"
                value={ing.unit ?? ""}
                onChange={(e) => updateIngredient(i, { unit: e.target.value })}
                className={`${styles.searchInput} h-11 w-16 px-2 text-base`}
              />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={ing.is_pantry}
                  onChange={(e) => updateIngredient(i, { is_pantry: e.target.checked })}
                  className="h-5 w-5 accent-[var(--orange)]"
                />
                常備品
              </label>
              <button
                type="button"
                onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                className={`${styles.chunky} ${styles.cPink} h-11 w-11 shrink-0 text-lg`}
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
          className={`${styles.addEntry} h-11 w-full`}
        >
          + 材料を追加
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">手順</h2>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-3 w-6 shrink-0 text-sm font-bold text-[var(--ink-soft)]">
                {i + 1}
              </span>
              <textarea
                value={step.text}
                onChange={(e) => updateStep(i, e.target.value)}
                rows={2}
                className={`${styles.searchInput} min-h-11 min-w-0 flex-1 px-3 py-2 text-base`}
              />
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveStep(i, "up")}
                  className={`${styles.chunky} ${styles.cCream} h-8 w-8 text-sm`}
                  aria-label="上へ"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(i, "down")}
                  className={`${styles.chunky} ${styles.cCream} h-8 w-8 text-sm`}
                  aria-label="下へ"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                className={`${styles.chunky} ${styles.cPink} h-11 w-11 shrink-0 text-lg`}
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
          className={`${styles.addEntry} h-11 w-full`}
        >
          + 手順を追加
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">タグ</h2>
        <div className="flex flex-wrap gap-2">
          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`${styles.tagChip} ${tags.includes(tag) ? styles.tagChipActive : ""} h-9 px-3 text-sm`}
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
            className={`${styles.searchInput} h-10 flex-1 px-3 text-sm`}
          />
          <button
            type="button"
            onClick={addCustomTag}
            className={`${styles.chunky} ${styles.cCream} h-10 px-3 text-sm`}
          >
            追加
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <label className="block text-sm font-bold" htmlFor="memo">
          メモ
        </label>
        <textarea
          id="memo"
          name="memo"
          rows={3}
          defaultValue={initial?.memo ?? undefined}
          className={`${styles.searchInput} w-full px-4 py-2 text-base`}
        />
      </section>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          name="is_planned"
          defaultChecked={initial?.is_planned ?? true}
          className="h-5 w-5 accent-[var(--orange)]"
        />
        作りたいリストに入れる
      </label>

      <button type="submit" className={`${styles.chunky} ${styles.cOrange} h-12 w-full text-base`}>
        保存
      </button>
    </form>
  );
}
