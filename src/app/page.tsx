import Link from "next/link";
import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { listMenuEntries } from "@/lib/menu";
import { listRecipeSummaries } from "@/lib/recipes";
import { DayMenuList } from "@/app/_components/DayMenuList";
import { MonthGrid } from "@/app/_components/MonthGrid";
import { RecipeDragPanel } from "@/app/_components/RecipeDragPanel";
import styles from "@/app/_components/kondate-theme.module.css";

const RANGE_DAYS = 14;

function todayISO(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function ViewToggle({ view }: { view: "list" | "month" }) {
  return (
    <div className={`${styles.viewToggle} mb-4 text-sm`}>
      <Link
        href="/"
        className={`${styles.chunky} ${view === "list" ? styles.cOrange : styles.cCream} flex-1 px-4 py-2`}
      >
        リスト
      </Link>
      <Link
        href={`/?view=month&month=${format(new Date(), "yyyy-MM")}`}
        className={`${styles.chunky} ${view === "month" ? styles.cOrange : styles.cCream} flex-1 px-4 py-2`}
      >
        月
      </Link>
    </div>
  );
}

export default async function CalendarPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const view = searchParams.view === "month" ? "month" : "list";

  const headerNav = (
    <>
      <div className={`${styles.appHeader} mb-3`}>
        <h1 className={`${styles.chunky} ${styles.cCream} ${styles.appTitle}`}>献立</h1>
        <div className={`${styles.headerLinks}`}>
          <Link href="/menu/suggest" className={`${styles.chunky} ${styles.cGreen} px-3 py-1.5 text-xs`}>
            AIに提案
          </Link>
          <Link href="/menu/copy" className={`${styles.chunky} ${styles.cOrange} px-3 py-1.5 text-xs`}>
            コピー
          </Link>
        </div>
      </div>
      <div className={`${styles.mascotRow} mb-4`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/cat-mascot.jpg" alt="" className={styles.mascotImg} />
        <div className={styles.bubble}>今日はなに作るニャ？🐾</div>
      </div>
    </>
  );

  if (view === "month") {
    const monthParam = typeof searchParams.month === "string" ? searchParams.month : format(new Date(), "yyyy-MM");
    const monthDate = parseISO(`${monthParam}-01`);
    const gridStart = startOfWeek(startOfMonth(monthDate));
    const gridEnd = endOfWeek(endOfMonth(monthDate));

    const [entries, recipes] = await Promise.all([
      listMenuEntries(format(gridStart, "yyyy-MM-dd"), format(gridEnd, "yyyy-MM-dd")),
      listRecipeSummaries(),
    ]);
    const pickerRecipes = recipes.map((r) => ({ id: r.id, title: r.title, tags: r.tags, thumbnail_url: r.thumbnail_url }));

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

  const [entries, recipes] = await Promise.all([
    listMenuEntries(start, end),
    listRecipeSummaries(),
  ]);
  const pickerRecipes = recipes.map((r) => ({ id: r.id, title: r.title, tags: r.tags, thumbnail_url: r.thumbnail_url }));

  const days = eachDayOfInterval({ start: startDate, end: endDate }).map((d) =>
    format(d, "yyyy-MM-dd")
  );

  const entriesByDate: Record<string, typeof entries> = {};
  for (const entry of entries) {
    const list = entriesByDate[entry.date] ?? [];
    list.push(entry);
    entriesByDate[entry.date] = list;
  }

  const today = todayISO();
  const prevStart = format(addDays(startDate, -RANGE_DAYS), "yyyy-MM-dd");
  const nextStart = format(addDays(startDate, RANGE_DAYS), "yyyy-MM-dd");

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {headerNav}
      <ViewToggle view="list" />

      <div className={`${styles.chunky} ${styles.cCream} ${styles.weekNav} mb-6`}>
        <Link href={`/?start=${prevStart}`} className={styles.weekNavSide}>
          ← 前の2週間
        </Link>
        <Link href="/" className={`${styles.chunky} ${styles.cPink} px-3 py-1 text-xs`}>
          今日
        </Link>
        <Link href={`/?start=${nextStart}`} className={styles.weekNavSide}>
          次の2週間 →
        </Link>
      </div>

      <DayMenuList
        days={days}
        entriesByDate={entriesByDate}
        pickerRecipes={pickerRecipes}
        today={today}
      />
    </main>
  );
}
