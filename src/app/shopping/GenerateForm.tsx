"use client";

import { useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { generateShoppingListAction } from "@/lib/shopping-actions";
import styles from "@/app/_components/kondate-theme.module.css";

function today(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export function GenerateForm() {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(format(addDays(new Date(today()), 6), "yyyy-MM-dd"));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      // generateShoppingListAction側のrevalidatePathで最新のRSCペイロードが返るため、
      // router.refresh()は呼ばない（呼ぶとページ全体の再クエリが二重に走る）。
      const result = await generateShoppingListAction(start, end);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${styles.addEntry} mb-6 h-11 w-full`}
      >
        + 新しいリストを作る
      </button>
    );
  }

  return (
    <div className={`${styles.card} mb-6 space-y-3 p-4`}>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className={`${styles.searchInput} h-11 px-3 text-base`}
        />
        <span className="text-sm text-[var(--ink-soft)]">〜</span>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className={`${styles.searchInput} h-11 px-3 text-base`}
        />
      </div>
      {error && <p className={`${styles.dangerLink} text-sm`}>{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className={`${styles.chunky} ${styles.cOrange} h-11 flex-1 text-sm disabled:opacity-50`}
        >
          {pending ? "生成中…" : "生成する"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 px-4 text-sm font-bold text-[var(--ink-soft)]"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
