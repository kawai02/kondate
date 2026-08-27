"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "@/app/_components/kondate-theme.module.css";

const TABS = [
  { href: "/", label: "献立" },
  { href: "/recipes", label: "レシピ" },
  { href: "/recipes?planned=1", label: "作りたい" },
  { href: "/shopping", label: "買い物" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const planned = searchParams.get("planned") === "1";

  return (
    <nav className="sticky bottom-0 z-10 flex gap-1.5 border-t-[3px] border-[var(--outline)] bg-[var(--card)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      {TABS.map((tab) => {
        const isPlannedTab = tab.href.includes("planned=1");
        const basePath = tab.href.split("?")[0];
        const active =
          pathname === basePath && (isPlannedTab ? planned : !planned || basePath !== "/recipes");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-xl text-xs font-bold ${
              active
                ? `${styles.chunky} ${styles.cGreen}`
                : "text-[var(--ink-soft)]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
