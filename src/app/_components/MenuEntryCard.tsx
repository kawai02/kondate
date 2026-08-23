import Link from "next/link";
import Image from "next/image";
import { deleteMenuEntryAction, moveMenuEntryAction } from "@/lib/menu-actions";
import type { MenuEntryWithRecipe } from "@/lib/types";

export function MenuEntryCard({
  entry,
  isFirst,
  isLast,
}: {
  entry: MenuEntryWithRecipe;
  isFirst: boolean;
  isLast: boolean;
}) {
  const servings = entry.servings ?? entry.recipe.base_servings;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-black/10 p-3 dark:border-white/10">
      <Link href={`/recipes/${entry.recipe.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        {entry.recipe.thumbnail_url ? (
          <Image
            src={entry.recipe.thumbnail_url}
            alt=""
            width={112}
            height={64}
            className="h-14 w-20 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-black/5 text-xl dark:bg-white/10">
            🍽
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{entry.recipe.title}</p>
          <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-black/50 dark:text-white/50">
            {servings != null && <span>{servings}人前</span>}
            {entry.recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/cook-log/new?recipe_id=${entry.recipe.id}&menu_entry_id=${entry.id}`}
          className="flex h-9 items-center rounded-lg border border-black/20 px-2 text-xs dark:border-white/20"
        >
          作った
        </Link>
        <form action={moveMenuEntryAction.bind(null, entry.date, entry.id, "up")}>
          <button
            type="submit"
            disabled={isFirst}
            className="h-9 w-9 rounded-lg border border-black/20 text-sm disabled:opacity-30 dark:border-white/20"
            aria-label="上へ"
          >
            ↑
          </button>
        </form>
        <form action={moveMenuEntryAction.bind(null, entry.date, entry.id, "down")}>
          <button
            type="submit"
            disabled={isLast}
            className="h-9 w-9 rounded-lg border border-black/20 text-sm disabled:opacity-30 dark:border-white/20"
            aria-label="下へ"
          >
            ↓
          </button>
        </form>
        <form action={deleteMenuEntryAction.bind(null, entry.id)}>
          <button
            type="submit"
            className="h-9 w-9 rounded-lg border border-black/20 text-sm text-red-600 dark:border-white/20 dark:text-red-400"
            aria-label="削除"
          >
            ×
          </button>
        </form>
      </div>
    </div>
  );
}
