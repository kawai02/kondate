"use client";

import { useMemo, useState } from "react";
import styles from "@/app/_components/kondate-theme.module.css";

type PickerRecipe = { id: string; title: string; tags: string[] };

// PC幅でのみ表示し、レシピを月グリッドの日付セルへドラッグできるようにするパネル。
// タッチ端末はHTML5 Drag and Dropが効かないため、スマホでは月グリッドのセルタップ経由で配置する。
export function RecipeDragPanel({ recipes }: { recipes: PickerRecipe[] }) {
  const [q, setQ] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 登録済みレシピが実際に使っているタグだけを候補にする（空振りする選択肢を出さない）。
  const tagOptions = useMemo(
    () => Array.from(new Set(recipes.flatMap((r) => r.tags))).sort(),
    [recipes]
  );

  // タグはAND条件で絞り込む（レシピ一覧・レシピ選択モーダルと同じ挙動に揃える）。
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

  return (
    <div className={`${styles.card} hidden w-64 shrink-0 p-3 lg:block`}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="レシピ名で検索"
        className={`${styles.searchInput} mb-2 h-10 w-full px-3 text-sm`}
      />

      {tagOptions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`${styles.tagChip} ${selectedTags.includes(tag) ? styles.tagChipActive : ""} h-7 px-2 text-xs`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="h-7 px-1 text-xs font-bold text-[var(--ink-soft)] underline"
            >
              クリア
            </button>
          )}
        </div>
      )}

      <p className="mb-2 text-xs font-bold text-[var(--ink-soft)]">日付セルへドラッグして配置できる</p>

      <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
        {filtered.map((r) => (
          <li
            key={r.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", `kondate:recipe:${r.id}`);
            }}
            className="cursor-grab rounded-xl border-2 border-[var(--card-2)] bg-[var(--paper)] px-3 py-2 text-sm font-bold hover:border-[var(--outline)]"
          >
            {r.title}
          </li>
        ))}
        {filtered.length === 0 && (
          <p className="py-4 text-center text-xs text-[var(--ink-soft)]">該当レシピなし</p>
        )}
      </ul>
    </div>
  );
}
