"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import styles from "@/app/_components/kondate-theme.module.css";

export type PickerRecipe = {
  id: string;
  title: string;
  tags: string[];
  thumbnail_url: string | null;
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
    <div className={`${styles.root} ${styles.dialogOverlay}`}>
      <div className={`${styles.card} ${styles.dialogPanel} max-h-[80vh] w-full overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={`${styles.heading} text-base text-[var(--outline)]`}>🐾 レシピを選択</h2>
          <button
            type="button"
            onClick={onClose}
            className={`${styles.chunky} ${styles.cCream} px-3 py-1 text-xs`}
          >
            閉じる
          </button>
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="レシピ名で検索"
          className={`${styles.searchInput} mb-3 h-11 w-full px-3 text-base`}
        />

        {tagOptions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`${styles.tagChip} ${selectedTags.includes(tag) ? styles.tagChipActive : ""} h-8 px-3 text-xs`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="h-8 px-2 text-xs font-bold text-[var(--ink-soft)] underline"
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
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-[var(--card-2)] disabled:opacity-50"
              >
                {r.thumbnail_url ? (
                  <Image
                    src={r.thumbnail_url}
                    alt=""
                    width={80}
                    height={56}
                    className="h-14 w-20 shrink-0 rounded-xl border-2 border-[var(--outline)] object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--outline)] bg-[var(--card-2)] text-xl">
                    🍽
                  </div>
                )}
                <span className="min-w-0 flex-1">
                  {r.title}
                  {r.tags.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-[var(--ink-soft)]">
                      {r.tags.slice(0, 2).map((t) => `#${t}`).join(" ")}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-[var(--ink-soft)]">該当レシピなし</p>
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
      <button type="button" onClick={() => setOpen(true)} className={`${styles.addEntry} h-10 w-full`}>
        {triggerLabel}
      </button>

      {open && (
        <RecipePickerDialog recipes={recipes} onPick={onPick} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
