"use client";

import { useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { addMenuEntryForDateAction, moveMenuEntryToDateAction } from "@/lib/menu-actions";
import { MenuEntryCard } from "@/app/_components/MenuEntryCard";
import { RecipePickerSheet } from "@/app/_components/RecipePickerSheet";
import type { MenuEntryWithRecipe } from "@/lib/types";
import styles from "@/app/_components/kondate-theme.module.css";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const DND_PREFIX = "kondate";

type PickerRecipe = { id: string; title: string; tags: string[]; thumbnail_url: string | null };

function todayISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export function MonthGrid({
  month,
  entries,
  pickerRecipes,
}: {
  month: string;
  entries: MenuEntryWithRecipe[];
  pickerRecipes: PickerRecipe[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const dragDepth = useRef<Map<string, number>>(new Map());
  const [, startTransition] = useTransition();

  // 既存エントリの日付移動は、サーバー往復を待たずに先に見た目を動かす
  // （revalidatePathの反映を待つと1〜数百msタイルが動かず引っかかって見える）。
  const [optimisticEntries, applyOptimisticMove] = useOptimistic(
    entries,
    (state: MenuEntryWithRecipe[], action: { id: string; newDate: string }) =>
      state.map((e) => (e.id === action.id ? { ...e, date: action.newDate } : e))
  );

  const monthDate = parseISO(`${month}-01`);
  const gridStart = startOfWeek(startOfMonth(monthDate));
  const gridEnd = endOfWeek(endOfMonth(monthDate));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((d) =>
    format(d, "yyyy-MM-dd")
  );

  const entriesByDate = useMemo(() => {
    const map = new Map<string, MenuEntryWithRecipe[]>();
    for (const entry of optimisticEntries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [optimisticEntries]);

  const today = todayISO();
  const prevMonth = format(subMonths(monthDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");

  function handleDragEnter(date: string) {
    const depth = (dragDepth.current.get(date) ?? 0) + 1;
    dragDepth.current.set(date, depth);
    setDragOverDate(date);
  }

  function handleDragLeave(date: string) {
    const depth = (dragDepth.current.get(date) ?? 0) - 1;
    dragDepth.current.set(date, depth);
    if (depth <= 0) {
      dragDepth.current.set(date, 0);
      setDragOverDate((prev) => (prev === date ? null : prev));
    }
  }

  function handleDrop(date: string, e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current.set(date, 0);
    setDragOverDate(null);

    const raw = e.dataTransfer.getData("text/plain");
    const parts = raw.split(":");
    if (parts.length < 3 || parts[0] !== DND_PREFIX) return;
    const kind = parts[1];
    const id = parts.slice(2).join(":");

    if (kind === "recipe") {
      // revalidatePath側で既に最新のRSCペイロードが返るため、router.refresh()は呼ばない
      // （呼ぶとページ全体の再レンダリング・再クエリが二重に走ってしまう）。
      addMenuEntryForDateAction(date, id);
    } else if (kind === "entry") {
      startTransition(() => {
        applyOptimisticMove({ id, newDate: date });
      });
      moveMenuEntryToDateAction(id, date);
    }
  }

  return (
    <div>
      <div className={`${styles.chunky} ${styles.cCream} ${styles.weekNav} mb-4`}>
        <Link href={`/?view=month&month=${prevMonth}`} className={styles.weekNavSide}>
          ← 前の月
        </Link>
        <span className={`${styles.heading} text-sm text-[var(--outline)]`}>
          {format(monthDate, "yyyy年M月")}
        </span>
        <Link href={`/?view=month&month=${nextMonth}`} className={styles.weekNavSide}>
          次の月 →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--ink-soft)]">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const d = parseISO(date);
          const dayEntries = entriesByDate.get(date) ?? [];
          const inMonth = isSameMonth(d, monthDate);
          const isToday = date === today;
          const isDragOver = dragOverDate === date;
          const isSelected = selectedDate === date;

          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelectedDate((prev) => (prev === date ? null : date))}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => handleDragEnter(date)}
              onDragLeave={() => handleDragLeave(date)}
              onDrop={(e) => handleDrop(date, e)}
              className={`${styles.monthCell} min-h-20 p-1 text-left align-top ${
                isSelected
                  ? styles.monthCellSelected
                  : isDragOver
                    ? styles.monthCellDragOver
                    : isToday
                      ? styles.monthCellToday
                      : ""
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center text-xs ${
                  isToday ? styles.monthDateBadgeToday : styles.monthDateBadge
                }`}
              >
                {d.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEntries.slice(0, 2).map((entry) => (
                  <div
                    key={entry.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("text/plain", `${DND_PREFIX}:entry:${entry.id}`);
                    }}
                    className={`${styles.monthEntryChip} flex items-center gap-1 px-1 text-[10px]`}
                  >
                    {entry.recipe.thumbnail_url && (
                      <Image
                        src={entry.recipe.thumbnail_url}
                        alt=""
                        width={20}
                        height={20}
                        className="h-4 w-4 shrink-0 rounded border border-[var(--outline)] object-cover"
                      />
                    )}
                    <span className="truncate">{entry.recipe.title}</span>
                  </div>
                ))}
                {dayEntries.length > 2 && (
                  <div className="text-[10px] font-bold text-[var(--ink-soft)]">
                    他{dayEntries.length - 2}件
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <section className={`${styles.card} mt-4 p-3`}>
          <h2 className={`${styles.heading} mb-2 text-sm text-[var(--outline)]`}>
            {format(parseISO(selectedDate), "M月d日")}（
            {WEEKDAY_LABELS[parseISO(selectedDate).getDay()]}）
          </h2>
          <div className="space-y-2">
            {(entriesByDate.get(selectedDate) ?? []).map((entry, i, arr) => (
              <MenuEntryCard
                key={entry.id}
                entry={entry}
                isFirst={i === 0}
                isLast={i === arr.length - 1}
              />
            ))}
          </div>
          <div className="mt-2">
            <RecipePickerSheet
              recipes={pickerRecipes}
              onPick={addMenuEntryForDateAction.bind(null, selectedDate)}
            />
          </div>
        </section>
      )}
    </div>
  );
}
