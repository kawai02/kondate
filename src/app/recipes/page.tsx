import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { listRecipeSummaries, listAllTags } from "@/lib/recipes";
import { getCookingStatsMap } from "@/lib/cooking-logs";
import { RecipeFilters } from "@/app/recipes/_components/RecipeFilters";
import type { RecipeSort } from "@/lib/types";
import styles from "@/app/_components/kondate-theme.module.css";

function formatLastCooked(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}月${Number(d)}日`;
}

function parseSort(value: string | string[] | undefined): RecipeSort {
  if (value === "cook_time") return "cook_time";
  if (value === "last_cooked") return "last_cooked";
  return "new";
}

export default async function RecipesPage(props: PageProps<"/recipes">) {
  const searchParams = await props.searchParams;
  const tagParam = searchParams.tag;
  const tags = Array.isArray(tagParam) ? tagParam : tagParam ? [tagParam] : [];
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const sort = parseSort(searchParams.sort);
  const planned = searchParams.planned === "1";

  const [statsMap, existingTags] = await Promise.all([getCookingStatsMap(), listAllTags()]);
  const recipes = await listRecipeSummaries({ tags, q, sort, planned, statsMap });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className={`${styles.heading} text-xl text-[var(--outline)]`}>レシピ</h1>
        <div className="flex gap-2">
          <Link
            href="/recipes/import"
            className={`${styles.chunky} ${styles.cSky} h-10 px-4 text-sm`}
          >
            取り込み
          </Link>
          <Link
            href="/recipes/new"
            className={`${styles.chunky} ${styles.cOrange} h-10 px-4 text-sm`}
          >
            + 登録
          </Link>
        </div>
      </div>

      <Link
        href="/recipes?sort=last_cooked"
        className={`${styles.addEntry} mb-4 flex h-11 items-center justify-center`}
      >
        しばらく作っていないレシピを見る
      </Link>

      <Suspense fallback={null}>
        <RecipeFilters existingTags={existingTags} />
      </Suspense>

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {recipes.map((recipe) => {
          const stats = statsMap.get(recipe.id);
          return (
            <li key={recipe.id}>
              <Link
                href={`/recipes/${recipe.id}`}
                className={`${styles.linkCard} block overflow-hidden`}
              >
                {recipe.thumbnail_url ? (
                  <Image
                    src={recipe.thumbnail_url}
                    alt=""
                    width={480}
                    height={192}
                    className="h-36 w-full border-b-2 border-[var(--outline)] object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center border-b-2 border-[var(--outline)] bg-[var(--card-2)] text-4xl">
                    🍳
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-bold text-[var(--ink)]">{recipe.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {recipe.cook_time_min != null && (
                      <span className={styles.entryMetaTag}>約{recipe.cook_time_min}分</span>
                    )}
                    {recipe.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.entryMetaTag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1.5 text-xs font-bold text-[var(--ink-soft)]">
                    {stats && stats.count > 0
                      ? `${stats.count}回作った・最終${
                          stats.lastCookedOn ? formatLastCooked(stats.lastCookedOn) : ""
                        }`
                      : "まだ作っていない"}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {recipes.length === 0 && (
        <p className="mt-8 text-center text-sm text-[var(--ink-soft)]">レシピがありません</p>
      )}

      <div className="mt-10 text-center">
        <Link href="/settings" className="text-xs font-bold text-[var(--ink-soft)]">
          設定
        </Link>
      </div>
    </main>
  );
}
