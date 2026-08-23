import Link from "next/link";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { listMenuEntries } from "@/lib/menu";
import { listRecipes } from "@/lib/recipes";
import { addMenuEntryForDateAction } from "@/lib/menu-actions";
import { MenuEntryCard } from "@/app/_components/MenuEntryCard";
import { RecipePickerSheet } from "@/app/_components/RecipePickerSheet";
import { MonthGrid } from "@/app/_components/MonthGrid";
import { RecipeDragPanel } from "@/app/_components/RecipeDragPanel";

const RANGE_DAYS = 14;
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function todayISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function ViewToggle({ view }: { view: "list" | "month" }) {
  return (
    <div className="mb-4 flex gap-2 text-sm">
      <Link
        href="/"
        className={`rounded-lg px-3 py-1 ${
          view === "list"
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "border border-black/20 dark:border-white/20"
        }`}
      >
        リスト
      </Link>
      <Link
        href={`/?view=month&month=${format(new Date(), "yyyy-MM")}`}
        className={`rounded-lg px-3 py-1 ${
          view === "month"
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "border border-black/20 dark:border-white/20"
        }`}
      >
        月
      </Link>
    </div>
  );
}

export default async function CalendarPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const view = searchParams.view === "month" ? "month" : "list";

  const recipes = await listRecipes();
  const pickerRecipes = recipes.map((r) => ({ id: r.id, title: r.title, tags: r.tags }));

  const headerNav = (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold">献立</h1>
      <div className="flex gap-3 text-sm">
        <Link href="/menu/suggest" className="text-black/60 underline dark:text-white/60">
          AIに提案してもらう
        </Link>
        <Link href="/menu/copy" className="text-black/60 underline dark:text-white/60">
          献立をコピー
        </Link>
      </div>
    </div>
  );

  if (view === "month") {
    const monthParam = typeof searchParams.month === "string" ? searchParams.month : format(new Date(), "yyyy-MM");
    const monthDate = parseISO(`${monthParam}-01`);
    const gridStart = startOfWeek(startOfMonth(monthDate));
    const gridEnd = endOfWeek(endOfMonth(monthDate));

    const entries = await listMenuEntries(format(gridStart, "yyyy-MM-dd"), format(gridEnd, "yyyy-MM-dd"));

    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        {headerNav}
        <ViewToggle view="month" />
        <div className="flex gap-6">
          <div className="flex-1">
            <MonthGrid month={monthParam} entries={entries} pickerRecipes={pickerRecipes} />
          </div>
          <RecipeDragPanel recipes={pickerRecipes} />
        </div>
      </main>
    );
  }

  const startParam = typeof searchParams.start === "string" ? searchParams.start : undefined;
  const start = startParam ?? todayISO();
  const startDate = parseISO(start);
  const endDate = addDays(startDate, RANGE_DAYS - 1);
  const end = format(endDate, "yyyy-MM-dd");

  const entries = await listMenuEntries(start, end);

  const days = eachDayOfInterval({ start: startDate, end: endDate }).map((d) =>
    format(d, "yyyy-MM-dd")
  );

  const entriesByDate = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = entriesByDate.get(entry.date) ?? [];
    list.push(entry);
    entriesByDate.set(entry.date, list);
  }

  const today = todayISO();
  const prevStart = format(addDays(startDate, -RANGE_DAYS), "yyyy-MM-dd");
  const nextStart = format(addDays(startDate, RANGE_DAYS), "yyyy-MM-dd");

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {headerNav}
      <ViewToggle view="list" />

      <div className="mb-6 flex items-center justify-between text-sm">
        <Link href={`/?start=${prevStart}`} className="text-black/60 dark:text-white/60">
          ← 前の2週間
        </Link>
        <Link href="/" className="font-medium">
          今日
        </Link>
        <Link href={`/?start=${nextStart}`} className="text-black/60 dark:text-white/60">
          次の2週間 →
        </Link>
      </div>

      <div className="space-y-4">
        {days.map((date) => {
          const dayEntries = entriesByDate.get(date) ?? [];
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
                <RecipePickerSheet
                  recipes={pickerRecipes}
                  onPick={addMenuEntryForDateAction.bind(null, date)}
                />
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
