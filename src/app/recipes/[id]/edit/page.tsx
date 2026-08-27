import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import { updateRecipeAction } from "@/lib/recipe-actions";
import { getRecipe, listAllTags } from "@/lib/recipes";
import styles from "@/app/_components/kondate-theme.module.css";

export default async function EditRecipePage(props: PageProps<"/recipes/[id]/edit">) {
  const { id } = await props.params;
  const [recipe, existingTags] = await Promise.all([getRecipe(id), listAllTags()]);
  if (!recipe) notFound();
  const action = updateRecipeAction.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/recipes/${id}`} className={`${styles.backLink} text-sm`}>
          ← レシピ詳細
        </Link>
      </div>
      <h1 className={`${styles.heading} mb-6 text-xl text-[var(--outline)]`}>レシピを編集</h1>
      <RecipeForm action={action} initial={recipe} existingTags={existingTags} />
    </main>
  );
}
