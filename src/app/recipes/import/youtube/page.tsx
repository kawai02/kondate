import Link from "next/link";
import { listAllTags } from "@/lib/recipes";
import { YouTubeImporter } from "@/app/recipes/import/youtube/YouTubeImporter";
import styles from "@/app/_components/kondate-theme.module.css";

// AI解析（Gemini構造化出力）がタイムアウトしないよう、
// このページ上のServer Actions全体の実行時間上限を延長する。
export const maxDuration = 30;

export default async function YouTubeImportPage() {
  const existingTags = await listAllTags();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/recipes/import" className={`${styles.backLink} text-sm`}>
          ← 取り込み方法を選ぶ
        </Link>
      </div>
      <h1 className={`${styles.heading} mb-6 text-xl text-[var(--outline)]`}>YouTubeから取り込む</h1>
      <YouTubeImporter existingTags={existingTags} />
    </main>
  );
}
