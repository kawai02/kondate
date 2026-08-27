import Link from "next/link";
import { logout } from "@/lib/auth-actions";
import styles from "@/app/_components/kondate-theme.module.css";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/recipes" className={`${styles.backLink} text-sm`}>
          ← レシピ一覧
        </Link>
      </div>
      <h1 className={`${styles.heading} mb-6 text-xl text-[var(--outline)]`}>設定</h1>

      <section className={`${styles.card} mb-6 p-4`}>
        <h2 className="mb-2 font-bold text-[var(--ink)]">データのバックアップ</h2>
        <p className="mb-3 text-sm text-[var(--ink-soft)]">
          全レシピ・献立・感想をJSONでダウンロードできる。無料枠の仕様変更やサービス終了に備えた保険。
        </p>
        <a
          href="/api/export"
          className={`${styles.chunky} ${styles.cSky} inline-flex h-11 items-center px-4 text-sm`}
        >
          データをダウンロード
        </a>
      </section>

      <form action={logout}>
        <button type="submit" className={`${styles.chunky} ${styles.cPink} h-11 w-full text-sm`}>
          ログアウト
        </button>
      </form>
    </main>
  );
}
