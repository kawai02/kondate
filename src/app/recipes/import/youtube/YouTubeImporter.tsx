"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  fetchYouTubeMetadataAction,
  extractFromTextAction,
  type YouTubeMetadata,
} from "@/lib/import-actions";
import { createRecipeAction } from "@/lib/recipe-actions";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import type { RecipeFormValues } from "@/lib/types";
import styles from "@/app/_components/kondate-theme.module.css";

type Step = "url" | "metadata" | "form";

export function YouTubeImporter({ existingTags }: { existingTags: string[] }) {
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateRecipeId, setDuplicateRecipeId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"high" | "low" | undefined>(undefined);
  const [initial, setInitial] = useState<Partial<RecipeFormValues> | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFetchMetadata() {
    setError(null);
    setDuplicateRecipeId(null);
    startTransition(async () => {
      const result = await fetchYouTubeMetadataAction(url);
      if (!result.ok) {
        setError(result.message);
        setDuplicateRecipeId(result.duplicateRecipeId ?? null);
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
        <label className="block text-sm font-bold" htmlFor="youtube-url">
          動画のURL
        </label>
        <input
          id="youtube-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className={`${styles.searchInput} h-12 w-full px-4 text-base`}
        />
        <button
          type="button"
          onClick={handleFetchMetadata}
          disabled={pending || !url.trim()}
          className={`${styles.chunky} ${styles.cOrange} h-11 px-4 text-sm disabled:opacity-50`}
        >
          {pending && step === "url" ? "取得中…" : "取得"}
        </button>
      </div>

      {error && (
        <div className={`${styles.dangerLink} text-sm`}>
          <p>{error}</p>
          {duplicateRecipeId && (
            <Link href={`/recipes/${duplicateRecipeId}`} className="underline">
              既存のレシピを見る
            </Link>
          )}
        </div>
      )}

      {step === "metadata" && metadata && (
        <div className="space-y-4 border-t-2 border-[var(--card-2)] pt-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={metadata.thumbnailUrl}
              alt=""
              className="h-16 w-28 rounded-xl border-2 border-[var(--outline)] object-cover"
            />
            <p className="font-bold text-[var(--ink)]">{metadata.title}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold" htmlFor="description">
              概要欄のテキスト（材料・手順が無ければここに貼り替えてほしい）
            </label>
            <textarea
              id="description"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className={`${styles.searchInput} w-full px-3 py-2 text-sm`}
            />
          </div>

          <button
            type="button"
            onClick={handleExtract}
            disabled={pending || !text.trim()}
            className={`${styles.chunky} ${styles.cOrange} h-12 w-full text-base disabled:opacity-50`}
          >
            {pending ? "解析中…" : "AIで解析"}
          </button>
        </div>
      )}
    </div>
  );
}
