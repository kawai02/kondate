"use client";

import { useMemo, useState, useTransition } from "react";
import { extractFromTextAction } from "@/lib/import-actions";
import { createRecipeAction } from "@/lib/recipe-actions";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import type { RecipeFormValues } from "@/lib/types";

function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.replace(/^www\./, "").includes("instagram.com")) return null;
    const match = u.pathname.match(/^\/(p|reel|tv)\/([^/]+)/);
    if (!match) return null;
    return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
  } catch {
    return null;
  }
}

export function InstagramImporter({ existingTags }: { existingTags: string[] }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<"high" | "low" | undefined>(undefined);
  const [initial, setInitial] = useState<Partial<RecipeFormValues> | null>(null);
  const [pending, startTransition] = useTransition();

  const embed = useMemo(() => embedUrl(url), [url]);

  function handleExtract() {
    setError(null);
    startTransition(async () => {
      const result = await extractFromTextAction(caption);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfidence(result.data.confidence);
      setInitial({
        title: result.data.title,
        source_type: "instagram",
        source_url: url || null,
        thumbnail_url: null,
        raw_text: result.data.raw_text ?? caption,
        base_servings: result.data.base_servings,
        cook_time_min: result.data.cook_time_min,
        ingredients: result.data.ingredients,
        steps: result.data.steps.map((s, i) => ({ order: i, text: s.text })),
        tags: result.data.tags,
        memo: null,
        is_planned: true,
      });
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
        <label className="block text-sm font-medium" htmlFor="instagram-url">
          投稿のURL
        </label>
        <input
          id="instagram-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.instagram.com/p/..."
          className="h-12 w-full rounded-lg border border-black/20 px-4 text-base dark:border-white/20 dark:bg-transparent"
        />
      </div>

      {embed && (
        <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <iframe src={embed} className="h-[520px] w-full" title="Instagram投稿" />
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="caption">
          キャプション（自動取得はできないため手動で貼り付けてほしい）
        </label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={8}
          placeholder="投稿のキャプションをコピーしてここに貼り付ける"
          className="w-full rounded-lg border border-black/20 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleExtract}
        disabled={pending || !caption.trim()}
        className="h-12 w-full rounded-lg bg-black text-base font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "解析中…" : "AIで解析"}
      </button>
    </div>
  );
}
