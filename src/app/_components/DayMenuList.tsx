"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { addMenuEntryForDateAction } from "@/lib/menu-actions";
import { MenuEntryCard } from "@/app/_components/MenuEntryCard";
import { RecipePickerDialog, type PickerRecipe } from "@/app/_components/RecipePickerSheet";
import type { MenuEntryWithRecipe } from "@/lib/types";
import styles from "@/app/_components/kondate-theme.module.css";

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
            <section key={date} className={`${styles.card} ${styles.dayCard}`}>
              <div className={`${styles.dayHead} ${isToday ? styles.dayHeadToday : ""}`}>
                <span>
                  {format(d, "M月d日")}（{WEEKDAY_LABELS[d.getDay()]}）
                </span>
                {isToday && <span className={styles.todayFlag}>TODAY</span>}
              </div>
              <div className="space-y-2 p-3">
                {dayEntries.map((entry, i) => (
                  <MenuEntryCard
                    key={entry.id}
                    entry={entry}
                    isFirst={i === 0}
                    isLast={i === dayEntries.length - 1}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setActiveDate(date)}
                  className={`${styles.addEntry} h-10 w-full`}
                >
                  ＋ レシピを追加
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
