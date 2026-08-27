"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  toggleShoppingItemAction,
  addManualItemAction,
  deleteShoppingItemAction,
} from "@/lib/shopping-actions";
import type { ShoppingCategory, ShoppingItem } from "@/lib/types";
import type { ShoppingListWithItems } from "@/lib/shopping";
import styles from "@/app/_components/kondate-theme.module.css";

const CATEGORY_ORDER: (ShoppingCategory | "未分類")[] = [
  "野菜",
  "肉",
  "魚",
  "乳製品",
  "その他",
  "調味料",
  "未分類",
];

function buildCopyText(items: ShoppingItem[]): string {
  const lines: string[] = [];
  for (const category of CATEGORY_ORDER) {
    const group = items.filter((i) => (i.category ?? "未分類") === category);
    if (group.length === 0) continue;
    lines.push(`【${category}】`);
    for (const item of group) {
      lines.push(`- ${item.name}${item.amount != null ? ` ${item.amount}${item.unit ?? ""}` : ""}`);
    }
  }
  return lines.join("\n");
}

export function ShoppingItemsView({ list }: { list: ShoppingListWithItems }) {
  const [showPantry, setShowPantry] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  // チェック操作はサーバー往復を待たずに即座に反映する
  // （従来はrevalidatePath+router.refresh()の2回のページ再生成が終わるまで見た目が変わらなかった）。
  const [optimisticItems, applyOptimisticToggle] = useOptimistic(
    list.items,
    (state: ShoppingItem[], action: { id: string; checked: boolean }) =>
      state.map((item) => (item.id === action.id ? { ...item, checked: action.checked } : item))
  );

  const visibleItems = showPantry ? optimisticItems : optimisticItems.filter((i) => !i.is_pantry);

  function handleToggle(id: string, checked: boolean) {
    startTransition(async () => {
      applyOptimisticToggle({ id, checked });
      await toggleShoppingItemAction(id, checked);
    });
  }

  async function handleCopy() {
    const text = buildCopyText(visibleItems);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
          <input
            type="checkbox"
            checked={showPantry}
            onChange={(e) => setShowPantry(e.target.checked)}
            className="h-5 w-5 accent-[var(--orange)]"
          />
          常備品も表示する
        </label>
        <button
          type="button"
          onClick={handleCopy}
          className={`${styles.chunky} ${styles.cSky} h-9 px-3 text-sm`}
        >
          {copied ? "コピーした" : "テキストでコピー"}
        </button>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const group = visibleItems.filter((i) => (i.category ?? "未分類") === category);
        if (group.length === 0) return null;
        return (
          <section key={category}>
            <h2 className={`${styles.heading} mb-2 text-sm text-[var(--outline)]`}>{category}</h2>
            <ul className="space-y-1">
              {group.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 border-b-2 border-[var(--card-2)] py-2"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => handleToggle(item.id, e.target.checked)}
                    className="h-5 w-5 shrink-0 accent-[var(--orange)]"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.checked ? "text-[var(--ink-soft)] line-through" : "text-[var(--ink)]"
                    }`}
                  >
                    {item.name}
                    {item.amount != null && (
                      <span className="ml-2 text-[var(--ink-soft)]">
                        {item.amount}
                        {item.unit ?? ""}
                      </span>
                    )}
                  </span>
                  <form action={deleteShoppingItemAction.bind(null, item.id)}>
                    <button
                      type="submit"
                      className={`${styles.chunky} ${styles.cPink} h-8 w-8 shrink-0 text-sm`}
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className={`${styles.card} border-dashed p-4`}>
        <h2 className="mb-3 text-sm font-bold text-[var(--ink)]">手動で追加</h2>
        <form action={addManualItemAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="list_id" value={list.id} />
          <input
            name="name"
            placeholder="品目名"
            required
            className={`${styles.searchInput} h-10 min-w-0 flex-1 px-3 text-sm`}
          />
          <input
            name="amount"
            type="number"
            step="0.1"
            placeholder="数量"
            className={`${styles.searchInput} h-10 w-20 px-2 text-sm`}
          />
          <input
            name="unit"
            placeholder="単位"
            className={`${styles.searchInput} h-10 w-16 px-2 text-sm`}
          />
          <button type="submit" className={`${styles.chunky} ${styles.cOrange} h-10 px-4 text-sm`}>
            追加
          </button>
        </form>
      </section>
    </div>
  );
}
