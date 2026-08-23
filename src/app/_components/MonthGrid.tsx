"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const DND_PREFIX = "kondate";

type PickerRecipe = { id: string; title: string; tags: string[] };

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
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const dragDepth = useRef<Map<string, number>>(new Map());

  const monthDate = parseISO(`${month}-01`);
  const gridStart = startOfWeek(startOfMonth(monthDate));
  const gridEnd = endOfWeek(endOfMonth(monthDate));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((d) =>
    format(d, "yyyy-MM-dd")
  );

  const entriesByDate = useMemo(() => {
    const map = new Map<string, MenuEntryWithRecipe[]>();
    for (const entry of entries) {
      const list = map.get(entry.date) ?? [];
      list.push(entry);
      map.set(entry.date, list);
    }
    return map;
  }, [entries]);

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
      addMenuEntryForDateAction(date, id).then(() => router.refresh());
    } else if (kind === "entry") {
      moveMenuEntryToDateAction(id, date).then(() => router.refresh());
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href={`/?view=month&month=${prevMonth}`} className="text-black/60 dark:text-white/60">
          ← 前の月
        </Link>
        <span className="font-medium">{format(monthDate, "yyyy年M月")}</span>
        <Link href={`/?view=month&month=${nextMonth}`} className="text-black/60 dark:text-white/60">
          次の月 →
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-black/50 dark:text-white/50">
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
              className={`min-h-20 rounded-lg border p-1 text-left align-top ${
                isSelected
                  ? "border-black dark:border-white"
                  : isDragOver
                    ? "border-black bg-black/5 dark:border-white dark:bg-white/10"
                    : "border-black/10 dark:border-white/10"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <span
                className={`text-xs ${
                  isToday
                    ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black"
                    : "text-black/60 dark:text-white/60"
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
                    className="truncate rounded bg-black/5 px-1 text-[10px] dark:bg-white/10"
                  >
                    {entry.recipe.title}
                  </div>
                ))}
                {dayEntries.length > 2 && (
                  <div className="text-[10px] text-black/40 dark:text-white/40">
                    他{dayEntries.length - 2}件
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <section className="mt-4 rounded-xl border border-black/10 p-3 dark:border-white/10">
          <h2 className="mb-2 text-sm font-medium">
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
