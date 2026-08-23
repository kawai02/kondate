"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
    <nav className="sticky bottom-0 z-10 flex border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-black/95">
      {TABS.map((tab) => {
        const isPlannedTab = tab.href.includes("planned=1");
        const basePath = tab.href.split("?")[0];
        const active =
          pathname === basePath && (isPlannedTab ? planned : !planned || basePath !== "/recipes");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-12 flex-1 items-center justify-center text-sm font-medium ${
              active ? "text-black dark:text-white" : "text-black/50 dark:text-white/50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
