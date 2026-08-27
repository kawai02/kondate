import Link from "next/link";
import Image from "next/image";
import { deleteMenuEntryAction, moveMenuEntryAction } from "@/lib/menu-actions";
import type { MenuEntryWithRecipe } from "@/lib/types";
import styles from "@/app/_components/kondate-theme.module.css";

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
    <div className={`${styles.entry} flex items-center gap-2 border-b-2 border-[var(--card-2)] pb-3 last:border-b-0 last:pb-0`}>
      <Link href={`/recipes/${entry.recipe.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        {entry.recipe.thumbnail_url ? (
          <Image
            src={entry.recipe.thumbnail_url}
            alt=""
            width={112}
            height={64}
            className="h-14 w-20 shrink-0 rounded-xl border-2 border-[var(--outline)] object-cover"
          />
        ) : (
          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--outline)] bg-[var(--card-2)] text-xl">
            🍽
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`${styles.entryTitle} truncate`}>{entry.recipe.title}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {servings != null && <span className={styles.entryMetaTag}>{servings}人前</span>}
            {entry.recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag} className={styles.entryMetaTag}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/cook-log/new?recipe_id=${entry.recipe.id}&menu_entry_id=${entry.id}`}
          className={`${styles.chunky} ${styles.cGreen} h-8 px-2.5 text-[11px]`}
        >
          作った
        </Link>
        <form action={moveMenuEntryAction.bind(null, entry.date, entry.id, "up")}>
          <button
            type="submit"
            disabled={isFirst}
            className={`${styles.chunky} ${styles.cCream} h-8 w-8 text-sm`}
            aria-label="上へ"
          >
            ↑
          </button>
        </form>
        <form action={moveMenuEntryAction.bind(null, entry.date, entry.id, "down")}>
          <button
            type="submit"
            disabled={isLast}
            className={`${styles.chunky} ${styles.cCream} h-8 w-8 text-sm`}
            aria-label="下へ"
          >
            ↓
          </button>
        </form>
        <form action={deleteMenuEntryAction.bind(null, entry.id)}>
          <button
            type="submit"
            className={`${styles.chunky} ${styles.cPink} h-8 w-8 text-sm`}
            aria-label="削除"
          >
            ×
          </button>
        </form>
      </div>
    </div>
  );
}
