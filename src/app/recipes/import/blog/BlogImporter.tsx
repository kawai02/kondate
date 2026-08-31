"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  fetchBlogArticleAction,
  extractFromTextAction,
  type BlogArticleMetadata,
} from "@/lib/import-actions";
import { createRecipeAction } from "@/lib/recipe-actions";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import type { RecipeFormValues } from "@/lib/types";
import styles from "@/app/_components/kondate-theme.module.css";

type Step = "url" | "article" | "form";

export function BlogImporter({ existingTags }: { existingTags: string[] }) {
  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [article, setArticle] = useState<BlogArticleMetadata | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateRecipeId, setDuplicateRecipeId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"high" | "low" | undefined>(undefined);
  const [initial, setInitial] = useState<Partial<RecipeFormValues> | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFetch() {
    setError(null);
    setDuplicateRecipeId(null);
    startTransition(async () => {
      const result = await fetchBlogArticleAction(url);
      if (!result.ok) {
        setError(result.message);
        setDuplicateRecipeId(result.duplicateRecipeId ?? null);
        return;
      }
      setArticle(result.data);
      setText(result.data.text);
      setStep("article");
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
        title: result.data.title || article?.title || "",
        source_type: "blog",
        source_url: article?.sourceUrl ?? null,
        thumbnail_url: article?.thumbnailUrl ?? null,
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
        <label className="block text-sm font-bold" htmlFor="blog-url">
          記事のURL
        </label>
        <input
          id="blog-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://ameblo.jp/.../entry-....html"
          className={`${styles.searchInput} h-12 w-full px-4 text-base`}
        />
        <button
          type="button"
          onClick={handleFetch}
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

      {step === "article" && article && (
        <div className="space-y-4 border-t-2 border-[var(--card-2)] pt-4">
          <div className="flex items-center gap-3">
            {article.thumbnailUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={article.thumbnailUrl}
                alt=""
                className="h-16 w-28 rounded-xl border-2 border-[var(--outline)] object-cover"
              />
            )}
            <p className="font-bold text-[var(--ink)]">{article.title}</p>
          </div>

          {!article.isAmeblo && (
            <p className="text-sm text-[var(--ink-soft)]">
              このブログは自動抽出に対応していないため、本文がうまく取れていないことがある。
              下のテキストを確認・修正してから解析してほしい。
            </p>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold" htmlFor="article-text">
              記事本文（レシピと関係ない雑談は削るとAI解析の精度が上がる）
            </label>
            <textarea
              id="article-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
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
