import Link from "next/link";
import { listRecipeSummaries } from "@/lib/recipes";
import { SuggestForm } from "@/app/menu/suggest/SuggestForm";

// Gemini呼び出し（1週間分の献立提案）がタイムアウトしないよう実行時間上限を延長する。
export const maxDuration = 30;

export default async function MenuSuggestPage() {
  const recipes = await listRecipeSummaries();
  const pickerRecipes = recipes.map((r) => ({ id: r.id, title: r.title, tags: r.tags }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/" className="text-sm text-black/60 dark:text-white/60">
          ← 献立
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">AIに献立を提案してもらう</h1>
      <SuggestForm pickerRecipes={pickerRecipes} />
    </main>
  );
}
