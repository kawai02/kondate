import Link from "next/link";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import { createRecipeAction } from "@/lib/recipe-actions";
import { listAllTags } from "@/lib/recipes";
import styles from "@/app/_components/kondate-theme.module.css";

export default async function NewRecipePage() {
  const existingTags = await listAllTags();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/recipes" className={`${styles.backLink} text-sm`}>
          ← レシピ一覧
        </Link>
      </div>
      <h1 className={`${styles.heading} mb-6 text-xl text-[var(--outline)]`}>レシピを登録</h1>
      <RecipeForm action={createRecipeAction} existingTags={existingTags} />
    </main>
  );
}
