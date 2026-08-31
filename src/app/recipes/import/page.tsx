import Link from "next/link";
import styles from "@/app/_components/kondate-theme.module.css";

const OPTIONS = [
  {
    href: "/recipes/import/youtube",
    title: "YouTube",
    description: "動画のURLを貼って、概要欄から材料・手順を抽出する",
  },
  {
    href: "/recipes/import/photo",
    title: "写真",
    description: "料理本のページなどを撮影して、写真から材料・手順を抽出する",
  },
  {
    href: "/recipes/import/instagram",
    title: "Instagram",
    description: "投稿を埋め込み表示し、キャプションを貼り付けて抽出する",
  },
  {
    href: "/recipes/import/blog",
    title: "ブログ",
    description: "料理ブログ記事のURLを貼って、本文から材料・手順を抽出する",
  },
] as const;

export default function ImportSelectPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/recipes" className={`${styles.backLink} text-sm`}>
          ← レシピ一覧
        </Link>
      </div>
      <h1 className={`${styles.heading} mb-6 text-xl text-[var(--outline)]`}>レシピを取り込む</h1>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <Link key={opt.href} href={opt.href} className={`${styles.linkCard} block p-4`}>
            <h2 className={`${styles.heading} text-sm text-[var(--outline)]`}>{opt.title}</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{opt.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
