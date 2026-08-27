import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe } from "@/lib/recipes";
import { scaleIngredients } from "@/lib/scaling";
import { WakeLockKeeper } from "@/app/_components/WakeLockKeeper";
import styles from "@/app/_components/kondate-theme.module.css";

export default async function CookModePage(props: PageProps<"/recipes/[id]/cook">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const servingsParam =
    typeof searchParams.servings === "string" ? Number(searchParams.servings) : null;
  const servings =
    servingsParam && servingsParam > 0 ? servingsParam : recipe.base_servings ?? null;

  const ingredients =
    recipe.base_servings != null && servings != null
      ? scaleIngredients(recipe.ingredients, recipe.base_servings, servings)
      : recipe.ingredients.map((i) => ({ ...i, originalAmount: null }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <WakeLockKeeper />

      <div className="mb-4">
        <Link href={`/recipes/${id}`} className={`${styles.backLink} text-sm`}>
          ← {recipe.title}
        </Link>
      </div>

      <h1 className={`${styles.heading} text-2xl text-[var(--outline)]`}>{recipe.title}</h1>

      {recipe.base_servings != null && (
        <form method="get" className="mt-4 flex items-center gap-2">
          <label htmlFor="servings" className="text-base font-bold">
            人数
          </label>
          <input
            id="servings"
            name="servings"
            type="number"
            step="0.5"
            min="0.5"
            defaultValue={servings ?? undefined}
            className={`${styles.searchInput} h-12 w-24 px-3 text-lg`}
          />
          <span className="text-base font-bold">人前</span>
          <button type="submit" className={`${styles.chunky} ${styles.cOrange} h-12 px-4 text-base`}>
            変更
          </button>
        </form>
      )}

      <section className="mt-8">
        <h2 className={`${styles.heading} mb-3 text-xl text-[var(--outline)]`}>材料</h2>
        <ul className="space-y-2">
          {ingredients.map((ing, i) => (
            <li
              key={i}
              className="flex justify-between border-b-2 border-[var(--card-2)] py-3 text-lg"
            >
              <span>{ing.name}</span>
              <span className="text-[var(--ink-soft)]">
                {ing.amount ?? ""}
                {ing.unit ?? ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className={`${styles.heading} mb-3 text-xl text-[var(--outline)]`}>手順</h2>
        <ol className="space-y-5">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-4 text-lg leading-relaxed">
              <span className="font-bold text-[var(--ink-soft)]">{i + 1}</span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
