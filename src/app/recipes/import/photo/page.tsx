import Link from "next/link";
import { listAllTags } from "@/lib/recipes";
import { PhotoImporter } from "@/app/recipes/import/photo/PhotoImporter";

// AI解析（Gemini構造化出力）がタイムアウトしないよう、
// このページ上のServer Actions全体の実行時間上限を延長する。
export const maxDuration = 30;

export default async function PhotoImportPage() {
  const existingTags = await listAllTags();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/recipes/import" className="text-sm text-black/60 dark:text-white/60">
          ← 取り込み方法を選ぶ
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">写真から取り込む</h1>
      <PhotoImporter existingTags={existingTags} />
    </main>
  );
}
