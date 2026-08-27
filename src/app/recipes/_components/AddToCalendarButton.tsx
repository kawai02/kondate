"use client";

import { useState, useTransition } from "react";
import { addMenuEntryAction } from "@/lib/menu-actions";
import styles from "@/app/_components/kondate-theme.module.css";

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
        className={`${styles.chunky} ${styles.cSky} h-11 px-4 text-sm`}
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
        className={`${styles.searchInput} h-11 px-3 text-sm`}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={pending}
        className={`${styles.chunky} ${styles.cOrange} h-11 px-4 text-sm disabled:opacity-50`}
      >
        {pending ? "追加中…" : "この日に追加"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="h-11 px-3 text-sm font-bold text-[var(--ink-soft)]"
      >
        キャンセル
      </button>
    </div>
  );
}
