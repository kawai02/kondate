import Link from "next/link";
import { notFound } from "next/navigation";
import { RecipeForm } from "@/app/recipes/_components/RecipeForm";
import { updateRecipeAction } from "@/lib/recipe-actions";
import { getRecipe, listAllTags } from "@/lib/recipes";

export default async function EditRecipePage(props: PageProps<"/recipes/[id]/edit">) {
  const { id } = await props.params;
  const [recipe, existingTags] = await Promise.all([getRecipe(id), listAllTags()]);
  if (!recipe) notFound();
  const action = updateRecipeAction.bind(null, id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/recipes/${id}`} className="text-sm text-black/60 dark:text-white/60">
          ← レシピ詳細
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">レシピを編集</h1>
      <RecipeForm action={action} initial={recipe} existingTags={existingTags} />
    </main>
  );
}
