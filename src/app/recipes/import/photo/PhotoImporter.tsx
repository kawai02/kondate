"use client";

import { useState, useTransition } from "react";
import { extractFromPhotosAction } from "@/lib/import-actions";
import { createRecipeAction } from "@/lib/recipe-actions";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import { resizeImage } from "@/lib/resize-image";
import type { RecipeFormValues } from "@/lib/types";

export function PhotoImporter({ existingTags }: { existingTags: string[] }) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"high" | "low" | undefined>(undefined);
  const [initial, setInitial] = useState<Partial<RecipeFormValues> | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSelect(fileList: FileList | null) {
    if (!fileList) return;
    const selected = Array.from(fileList).slice(0, 4);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }

  function handleExtract() {
    setError(null);
    startTransition(async () => {
      try {
        const resized = await Promise.all(files.map(resizeImage));
        const formData = new FormData();
        resized.forEach((f) => formData.append("photos", f));

        const result = await extractFromPhotosAction(formData);
        if (!result.ok) {
          setError(result.message);
          return;
        }

        setConfidence(result.data.confidence);
        setInitial({
          title: result.data.title,
          source_type: "photo",
          source_url: null,
          thumbnail_url: result.data.thumbnail_url,
          raw_text: result.data.raw_text ?? null,
          base_servings: result.data.base_servings,
          cook_time_min: result.data.cook_time_min,
          ingredients: result.data.ingredients,
          steps: result.data.steps.map((s, i) => ({ order: i, text: s.text })),
          tags: result.data.tags,
          memo: null,
          is_planned: true,
        });
      } catch {
        setError("画像の処理に失敗した");
      }
    });
  }

  if (initial) {
    return (
      <RecipeForm
        action={createRecipeAction}
        initial={initial}
        existingTags={existingTags}
        confidence={confidence}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="photos">
          写真（複数可、料理本の見開きなど）
        </label>
        <input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={(e) => handleSelect(e.target.files)}
          className="block w-full text-sm"
        />
        <p className="text-xs text-black/50 dark:text-white/50">
          保存されるのは1枚目のみ。解析には選んだ写真すべてを使う。
        </p>
      </div>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" className="h-24 w-24 rounded-lg object-cover" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleExtract}
        disabled={pending || files.length === 0}
        className="h-12 w-full rounded-lg bg-black text-base font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "解析中…" : "AIで解析"}
      </button>
    </div>
  );
}
