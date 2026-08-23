"use client";

import { useState, useTransition } from "react";

type PickerRecipe = {
  id: string;
  title: string;
  tags: string[];
};

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
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(q.toLowerCase())
  );

  function pick(recipeId: string) {
    startTransition(async () => {
      await onPick(recipeId);
      setOpen(false);
      setQ("");
    });
  }

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
        <div className="fixed inset-0 z-20 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">レシピを選択</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-black/50 dark:text-white/50"
              >
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
      )}
    </>
  );
}
