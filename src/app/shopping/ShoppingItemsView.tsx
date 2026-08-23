"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleShoppingItemAction,
  addManualItemAction,
  deleteShoppingItemAction,
} from "@/lib/shopping-actions";
import type { ShoppingCategory, ShoppingItem } from "@/lib/types";
import type { ShoppingListWithItems } from "@/lib/shopping";

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
  const router = useRouter();

  const visibleItems = showPantry ? list.items : list.items.filter((i) => !i.is_pantry);

  function handleToggle(id: string, checked: boolean) {
    startTransition(async () => {
      await toggleShoppingItemAction(id, checked);
      router.refresh();
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPantry}
            onChange={(e) => setShowPantry(e.target.checked)}
            className="h-5 w-5"
          />
          常備品も表示する
        </label>
        <button
          type="button"
          onClick={handleCopy}
          className="h-9 rounded-lg border border-black/20 px-3 text-sm dark:border-white/20"
        >
          {copied ? "コピーした" : "テキストでコピー"}
        </button>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const group = visibleItems.filter((i) => (i.category ?? "未分類") === category);
        if (group.length === 0) return null;
        return (
          <section key={category}>
            <h2 className="mb-2 text-sm font-medium text-black/60 dark:text-white/60">
              {category}
            </h2>
            <ul className="space-y-1">
              {group.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 border-b border-black/5 py-2 dark:border-white/10"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => handleToggle(item.id, e.target.checked)}
                    className="h-5 w-5 shrink-0"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.checked ? "text-black/30 line-through dark:text-white/30" : ""
                    }`}
                  >
                    {item.name}
                    {item.amount != null && (
                      <span className="ml-2 text-black/50 dark:text-white/50">
                        {item.amount}
                        {item.unit ?? ""}
                      </span>
                    )}
                  </span>
                  <form action={deleteShoppingItemAction.bind(null, item.id)}>
                    <button
                      type="submit"
                      className="h-8 w-8 shrink-0 rounded-lg border border-black/20 text-sm dark:border-white/20"
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

      <section className="rounded-xl border border-dashed border-black/20 p-4 dark:border-white/20">
        <h2 className="mb-3 text-sm font-medium">手動で追加</h2>
        <form action={addManualItemAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="list_id" value={list.id} />
          <input
            name="name"
            placeholder="品目名"
            required
            className="h-10 flex-1 min-w-0 rounded-lg border border-black/20 px-3 text-sm dark:border-white/20 dark:bg-transparent"
          />
          <input
            name="amount"
            type="number"
            step="0.1"
            placeholder="数量"
            className="h-10 w-20 rounded-lg border border-black/20 px-2 text-sm dark:border-white/20 dark:bg-transparent"
          />
          <input
            name="unit"
            placeholder="単位"
            className="h-10 w-16 rounded-lg border border-black/20 px-2 text-sm dark:border-white/20 dark:bg-transparent"
          />
          <button
            type="submit"
            className="h-10 rounded-lg bg-black px-4 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            追加
          </button>
        </form>
      </section>
    </div>
  );
}
