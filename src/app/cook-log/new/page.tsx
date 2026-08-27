import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/recipes";
import { listAuthors } from "@/lib/cooking-logs";
import { CookLogForm } from "@/app/cook-log/new/CookLogForm";

export default async function NewCookLogPage(props: PageProps<"/cook-log/new">) {
  const searchParams = await props.searchParams;
  const recipeId = typeof searchParams.recipe_id === "string" ? searchParams.recipe_id : "";
  const menuEntryId =
    typeof searchParams.menu_entry_id === "string" ? searchParams.menu_entry_id : null;

  const [recipe, authors] = await Promise.all([getRecipe(recipeId), listAuthors()]);
  if (!recipe) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href={`/recipes/${recipeId}`} className="text-sm text-black/60 dark:text-white/60">
          ← {recipe.title}
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">感想を記録</h1>
      <CookLogForm recipeId={recipeId} menuEntryId={menuEntryId} existingAuthors={authors} />
    </main>
  );
}
