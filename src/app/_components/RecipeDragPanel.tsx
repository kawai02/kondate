"use client";

import { useState } from "react";

type PickerRecipe = { id: string; title: string; tags: string[] };

// PC幅でのみ表示し、レシピを月グリッドの日付セルへドラッグできるようにするパネル。
// タッチ端末はHTML5 Drag and Dropが効かないため、スマホでは月グリッドのセルタップ経由で配置する。
export function RecipeDragPanel({ recipes }: { recipes: PickerRecipe[] }) {
  const [q, setQ] = useState("");
  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="hidden w-64 shrink-0 lg:block">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="レシピ名で検索"
        className="mb-2 h-10 w-full rounded-lg border border-black/20 px-3 text-sm dark:border-white/20 dark:bg-transparent"
      />
      <p className="mb-2 text-xs text-black/40 dark:text-white/40">
        日付セルへドラッグして配置できる
      </p>
      <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
        {filtered.map((r) => (
          <li
            key={r.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", `kondate:recipe:${r.id}`);
            }}
            className="cursor-grab rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
          >
            {r.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
