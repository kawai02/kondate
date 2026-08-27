"use client";

import { useMemo, useState, useTransition } from "react";

export type PickerRecipe = {
  id: string;
  title: string;
  tags: string[];
};

// モーダル本体。トップページの日別追加ボタンのように、1つのダイアログを
// 複数のトリガーで共有したい場合はこちらを直接使う（RecipePickerSheetは単体トリガー用）。
export function RecipePickerDialog({
  recipes,
  onPick,
  onClose,
}: {
  recipes: PickerRecipe[];
  onPick: (recipeId: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  // 登録済みレシピが実際に使っているタグだけを候補にする（空振りする選択肢を出さない）。
  const tagOptions = useMemo(
    () => Array.from(new Set(recipes.flatMap((r) => r.tags))).sort(),
    [recipes]
  );

  // タグはAND条件で絞り込む（レシピ一覧の絞り込みと同じ挙動に揃える）。
  const filtered = useMemo(
    () =>
      recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(q.toLowerCase()) &&
          selectedTags.every((t) => r.tags.includes(t))
      ),
    [recipes, q, selectedTags]
  );

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function pick(recipeId: string) {
    startTransition(async () => {
      await onPick(recipeId);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">レシピを選択</h2>
          <button type="button" onClick={onClose} className="text-black/50 dark:text-white/50">
            閉じる
          </button>
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="レシピ名で検索"
          className="mb-3 h-11 w-full rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
        />

        {tagOptions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`h-8 rounded-full border px-3 text-xs ${
                  selectedTags.includes(tag)
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/20 dark:border-white/20"
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="h-8 px-2 text-xs text-black/50 underline dark:text-white/50"
              >
                クリア
              </button>
            )}
          </div>
        )}

        <ul className="space-y-1">
          {filtered.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => pick(r.id)}
                className="w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
              >
                {r.title}
                {r.tags.length > 0 && (
                  <span className="ml-2 text-xs text-black/40 dark:text-white/40">
                    {r.tags.slice(0, 2).map((t) => `#${t}`).join(" ")}
                  </span>
                )}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-black/50 dark:text-white/50">
              該当レシピなし
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}

export function RecipePickerSheet({
  recipes,
  onPick,
  triggerLabel = "＋ 追加",
}: {
  recipes: PickerRecipe[];
  onPick: (recipeId: string) => void | Promise<void>;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 w-full rounded-lg border border-dashed border-black/30 text-sm text-black/60 dark:border-white/30 dark:text-white/60"
      >
        {triggerLabel}
      </button>

      {open && (
        <RecipePickerDialog recipes={recipes} onPick={onPick} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
