import Link from "next/link";
import { logout } from "@/lib/auth-actions";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/recipes" className="text-sm text-black/60 dark:text-white/60">
          ← レシピ一覧
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">設定</h1>

      <section className="mb-6 rounded-xl border border-black/10 p-4 dark:border-white/10">
        <h2 className="mb-2 font-medium">データのバックアップ</h2>
        <p className="mb-3 text-sm text-black/60 dark:text-white/60">
          全レシピ・献立・感想をJSONでダウンロードできる。無料枠の仕様変更やサービス終了に備えた保険。
        </p>
        <a
          href="/api/export"
          className="inline-flex h-11 items-center rounded-lg border border-black/20 px-4 text-sm font-medium dark:border-white/20"
        >
          データをダウンロード
        </a>
      </section>

      <form action={logout}>
        <button
          type="submit"
          className="h-11 w-full rounded-lg border border-black/20 text-sm font-medium text-red-600 dark:border-white/20 dark:text-red-400"
        >
          ログアウト
        </button>
      </form>
    </main>
  );
}
