"use client";

import { useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { generateShoppingListAction } from "@/lib/shopping-actions";

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
        className="mb-6 h-11 w-full rounded-lg border border-dashed border-black/30 text-sm dark:border-white/30"
      >
        + 新しいリストを作る
      </button>
    );
  }

  return (
    <div className="mb-6 space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="h-11 rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
        />
        <span className="text-sm text-black/50 dark:text-white/50">〜</span>
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="h-11 rounded-lg border border-black/20 px-3 text-base dark:border-white/20 dark:bg-transparent"
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className="h-11 flex-1 rounded-lg bg-black text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "生成中…" : "生成する"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 rounded-lg px-4 text-sm text-black/50 dark:text-white/50"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
