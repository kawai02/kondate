import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/recipes";
import { deleteRecipeAction } from "@/lib/recipe-actions";
import { AddToCalendarButton } from "@/app/recipes/_components/AddToCalendarButton";
import { SourceEmbed } from "@/app/recipes/_components/SourceEmbed";
import { ServingsPanel } from "@/app/recipes/_components/ServingsPanel";
import { CookingHistory } from "@/app/recipes/_components/CookingHistory";
import styles from "@/app/_components/kondate-theme.module.css";

// 人数変更の手順書き換え（Gemini）がタイムアウトしないよう実行時間上限を延長する。
export const maxDuration = 30;

export default async function RecipeDetailPage(props: PageProps<"/recipes/[id]">) {
  const { id } = await props.params;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const deleteAction = deleteRecipeAction.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/recipes" className={`${styles.backLink} text-sm`}>
          ← レシピ一覧
        </Link>
        <div className="flex gap-3 text-sm">
          <Link href={`/recipes/${id}/edit`} className="font-bold text-[var(--ink-soft)]">
            編集
          </Link>
          <form action={deleteAction}>
            <button type="submit" className={`${styles.dangerLink} text-sm`}>
              削除
            </button>
          </form>
        </div>
      </div>

      <h1 className={`${styles.heading} text-2xl text-[var(--outline)]`}>{recipe.title}</h1>

      <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold text-[var(--ink-soft)]">
        {recipe.base_servings != null && <span>{recipe.base_servings}人前</span>}
        {recipe.cook_time_min != null && <span>約{recipe.cook_time_min}分</span>}
      </div>

      {recipe.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <span key={tag} className={`${styles.tagChip} px-3 py-1 text-xs`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <SourceEmbed recipe={recipe} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <AddToCalendarButton recipeId={recipe.id} recipeTitle={recipe.title} />
        <Link
          href={`/recipes/${id}/cook`}
          className={`${styles.chunky} ${styles.cGreen} flex h-11 items-center px-4 text-sm`}
        >
          調理モード
        </Link>
      </div>

      <ServingsPanel recipe={recipe} />

      {recipe.memo && (
        <section className="mt-8">
          <h2 className={`${styles.heading} mb-2 text-lg text-[var(--outline)]`}>メモ</h2>
          <p className="whitespace-pre-wrap text-sm text-[var(--ink-soft)]">{recipe.memo}</p>
        </section>
      )}

      <CookingHistory recipeId={recipe.id} />
    </main>
  );
}
