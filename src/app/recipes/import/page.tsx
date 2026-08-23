import Link from "next/link";

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
] as const;

export default function ImportSelectPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/recipes" className="text-sm text-black/60 dark:text-white/60">
          ← レシピ一覧
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">レシピを取り込む</h1>

      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="block rounded-xl border border-black/10 p-4 dark:border-white/10"
          >
            <h2 className="font-medium">{opt.title}</h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">{opt.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
