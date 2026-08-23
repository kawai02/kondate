import Link from "next/link";
import { listRecipes } from "@/lib/recipes";
import { InstagramImporter } from "@/app/recipes/import/instagram/InstagramImporter";

// AI解析（Gemini構造化出力）がタイムアウトしないよう、
// このページ上のServer Actions全体の実行時間上限を延長する。
export const maxDuration = 30;

export default async function InstagramImportPage() {
  const recipes = await listRecipes();
  const existingTags = Array.from(new Set(recipes.flatMap((r) => r.tags)));

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/recipes/import" className="text-sm text-black/60 dark:text-white/60">
          ← 取り込み方法を選ぶ
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">Instagramから取り込む</h1>
      <InstagramImporter existingTags={existingTags} />
    </main>
  );
}
