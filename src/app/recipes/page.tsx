import Link from "next/link";
import { Suspense } from "react";
import { listRecipeSummaries, listAllTags } from "@/lib/recipes";
import { getCookingStatsMap } from "@/lib/cooking-logs";
import { RecipeFilters } from "@/app/recipes/_components/RecipeFilters";
import type { RecipeSort } from "@/lib/types";

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
        <h1 className="text-xl font-semibold">レシピ</h1>
        <div className="flex gap-2">
          <Link
            href="/recipes/import"
            className="h-10 rounded-lg border border-black/20 px-4 text-sm font-medium leading-9 dark:border-white/20"
          >
            取り込み
          </Link>
          <Link
            href="/recipes/new"
            className="h-10 rounded-lg bg-black px-4 text-sm font-medium leading-10 text-white dark:bg-white dark:text-black"
          >
            + 登録
          </Link>
        </div>
      </div>

      <Link
        href="/recipes?sort=last_cooked"
        className="mb-4 flex h-11 items-center justify-center rounded-lg border border-dashed border-black/30 text-sm font-medium dark:border-white/30"
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
                className="block rounded-xl border border-black/10 p-4 dark:border-white/10"
              >
                <h2 className="font-medium">{recipe.title}</h2>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-black/50 dark:text-white/50">
                  {recipe.cook_time_min != null && <span>約{recipe.cook_time_min}分</span>}
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
                <div className="mt-1 text-xs text-black/40 dark:text-white/40">
                  {stats && stats.count > 0
                    ? `${stats.count}回作った・最終${
                        stats.lastCookedOn ? formatLastCooked(stats.lastCookedOn) : ""
                      }`
                    : "まだ作っていない"}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {recipes.length === 0 && (
        <p className="mt-8 text-center text-sm text-black/50 dark:text-white/50">
          レシピがありません
        </p>
      )}

      <div className="mt-10 text-center">
        <Link href="/settings" className="text-xs text-black/40 dark:text-white/40">
          設定
        </Link>
      </div>
    </main>
  );
}
