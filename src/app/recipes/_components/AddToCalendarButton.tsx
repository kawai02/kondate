"use client";

import { useState, useTransition } from "react";
import { addMenuEntryAction } from "@/lib/menu-actions";

function today(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function AddToCalendarButton({
  recipeId,
}: {
  recipeId: string;
  recipeTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleAdd() {
    startTransition(async () => {
      await addMenuEntryAction({ date, recipe_id: recipeId, servings: null });
      setDone(true);
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 rounded-lg border border-black/20 px-4 text-sm font-medium dark:border-white/20"
      >
        {done ? "カレンダーに追加しました（もう1件追加）" : "＋ カレンダーに追加"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-11 rounded-lg border border-black/20 px-3 text-sm dark:border-white/20 dark:bg-transparent"
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={pending}
        className="h-11 rounded-lg bg-black px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "追加中…" : "この日に追加"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-11 rounded-lg px-3 text-sm text-black/50 dark:text-white/50"
      >
        キャンセル
      </button>
    </div>
  );
}
