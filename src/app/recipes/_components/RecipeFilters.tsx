"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { INITIAL_TAGS } from "@/lib/tags";

const SEARCH_DEBOUNCE_MS = 300;

export function RecipeFilters({ existingTags }: { existingTags: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedTags = searchParams.getAll("tag");
  const sort = searchParams.get("sort") ?? "new";
  const planned = searchParams.get("planned") === "1";

  // 検索入力は1文字ごとに即遷移させると毎回ページ全体を再取得してしまうため、
  // 見た目上の入力値はローカルstateで持ち、URL反映（サーバー往復）はデバウンスする。
  const [qInput, setQInput] = useState(searchParams.get("q") ?? "");

  const tagOptions = useMemo(
    () => Array.from(new Set([...INITIAL_TAGS, ...existingTags])),
    [existingTags]
  );

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    startTransition(() => {
      router.replace(`/recipes?${params.toString()}`);
    });
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setQInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams((params) => {
        if (value) params.set("q", value);
        else params.delete("q");
      });
    }, SEARCH_DEBOUNCE_MS);
  }

  function toggleTag(tag: string) {
    updateParams((params) => {
      const current = params.getAll("tag");
      params.delete("tag");
      const next = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      next.forEach((t) => params.append("tag", t));
    });
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={qInput}
        placeholder="レシピ名・材料名で検索"
        onChange={(e) => handleSearchChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-black/20 px-4 text-base dark:border-white/20 dark:bg-transparent"
      />

      <div className="flex flex-wrap gap-2">
        {tagOptions.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`h-9 rounded-full border px-3 text-sm ${
              selectedTags.includes(tag)
                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                : "border-black/20 dark:border-white/20"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <select
          value={sort}
          onChange={(e) =>
            updateParams((params) => params.set("sort", e.target.value))
          }
          className="h-10 rounded-lg border border-black/20 px-2 dark:border-white/20 dark:bg-transparent"
        >
          <option value="new">新しい順</option>
          <option value="cook_time">調理時間が短い順</option>
          <option value="last_cooked">しばらく作っていない順</option>
        </select>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={planned}
            onChange={(e) =>
              updateParams((params) => {
                if (e.target.checked) params.set("planned", "1");
                else params.delete("planned");
              })
            }
            className="h-5 w-5"
          />
          作りたいのみ
        </label>
      </div>
    </div>
  );
}
