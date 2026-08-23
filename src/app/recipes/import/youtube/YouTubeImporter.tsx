"use client";

import { useState, useTransition } from "react";
import {
  fetchYouTubeMetadataAction,
  extractFromTextAction,
  type YouTubeMetadata,
} from "@/lib/import-actions";
import { createRecipeAction } from "@/lib/recipe-actions";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import type { RecipeFormValues } from "@/lib/types";

type Step = "url" | "metadata" | "form";

export function YouTubeImporter({ existingTags }: { existingTags: string[] }) {
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"high" | "low" | undefined>(undefined);
  const [initial, setInitial] = useState<Partial<RecipeFormValues> | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFetchMetadata() {
    setError(null);
    startTransition(async () => {
      const result = await fetchYouTubeMetadataAction(url);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMetadata(result.data);
      setText(result.data.description);
      setStep("metadata");
    });
  }

  function handleExtract() {
    setError(null);
    startTransition(async () => {
      const result = await extractFromTextAction(text);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfidence(result.data.confidence);
      setInitial({
        title: result.data.title || metadata?.title || "",
        source_type: "youtube",
        source_url: metadata?.sourceUrl ?? null,
        thumbnail_url: metadata?.thumbnailUrl ?? null,
        raw_text: result.data.raw_text ?? text,
        base_servings: result.data.base_servings,
        cook_time_min: result.data.cook_time_min,
        ingredients: result.data.ingredients,
        steps: result.data.steps.map((s, i) => ({ order: i, text: s.text })),
        tags: result.data.tags,
        memo: null,
        is_planned: true,
      });
      setStep("form");
    });
  }

  if (step === "form" && initial) {
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
        <label className="block text-sm font-medium" htmlFor="youtube-url">
          動画のURL
        </label>
        <input
          id="youtube-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="h-12 w-full rounded-lg border border-black/20 px-4 text-base dark:border-white/20 dark:bg-transparent"
        />
        <button
          type="button"
          onClick={handleFetchMetadata}
          disabled={pending || !url.trim()}
          className="h-11 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending && step === "url" ? "取得中…" : "取得"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {step === "metadata" && metadata && (
        <div className="space-y-4 border-t border-black/10 pt-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={metadata.thumbnailUrl}
              alt=""
              className="h-16 w-28 rounded-lg object-cover"
            />
            <p className="font-medium">{metadata.title}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="description">
              概要欄のテキスト（材料・手順が無ければここに貼り替えてほしい）
            </label>
            <textarea
              id="description"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
            />
          </div>

          <button
            type="button"
            onClick={handleExtract}
            disabled={pending || !text.trim()}
            className="h-12 w-full rounded-lg bg-black text-base font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {pending ? "解析中…" : "AIで解析"}
          </button>
        </div>
      )}
    </div>
  );
}
