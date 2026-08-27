"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { addMenuEntryForDateAction } from "@/lib/menu-actions";
import { MenuEntryCard } from "@/app/_components/MenuEntryCard";
import { RecipePickerDialog, type PickerRecipe } from "@/app/_components/RecipePickerSheet";
import type { MenuEntryWithRecipe } from "@/lib/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// リスト表示（14日分）の献立。レシピ選択ダイアログは日ごとに個別マウントすると
// 全レシピ配列がRSCペイロードに日数分重複してシリアライズされてしまうため、
// 1つのダイアログを全日で共有し、開くときに対象日をstateで渡す形にしている。
export function DayMenuList({
  days,
  entriesByDate,
  pickerRecipes,
  today,
}: {
  days: string[];
  entriesByDate: Record<string, MenuEntryWithRecipe[]>;
  pickerRecipes: PickerRecipe[];
  today: string;
}) {
  const [activeDate, setActiveDate] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-4">
        {days.map((date) => {
          const dayEntries = entriesByDate[date] ?? [];
          const d = parseISO(date);
          const isToday = date === today;
          return (
            <section
              key={date}
              className={`rounded-2xl border p-3 ${
                isToday
                  ? "border-black bg-black/[0.03] dark:border-white dark:bg-white/[0.05]"
                  : "border-black/10 dark:border-white/10"
              }`}
            >
              <h2 className="mb-2 text-sm font-medium">
                {format(d, "M月d日")}（{WEEKDAY_LABELS[d.getDay()]}）
                {isToday && <span className="ml-2 text-xs text-black/50 dark:text-white/50">今日</span>}
              </h2>
              <div className="space-y-2">
                {dayEntries.map((entry, i) => (
                  <MenuEntryCard
                    key={entry.id}
                    entry={entry}
                    isFirst={i === 0}
                    isLast={i === dayEntries.length - 1}
                  />
                ))}
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setActiveDate(date)}
                  className="h-10 w-full rounded-lg border border-dashed border-black/30 text-sm text-black/60 dark:border-white/30 dark:text-white/60"
                >
                  ＋ 追加
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {activeDate && (
        <RecipePickerDialog
          recipes={pickerRecipes}
          onPick={(recipeId) => addMenuEntryForDateAction(activeDate, recipeId)}
          onClose={() => setActiveDate(null)}
        />
      )}
    </>
  );
}
