import Link from "next/link";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import { createRecipeAction } from "@/lib/recipe-actions";
import { listAllTags } from "@/lib/recipes";

export default async function NewRecipePage() {
  const existingTags = await listAllTags();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/recipes" className="text-sm text-black/60 dark:text-white/60">
          ← レシピ一覧
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">レシピを登録</h1>
      <RecipeForm action={createRecipeAction} existingTags={existingTags} />
    </main>
  );
}
