import Link from "next/link";
import { CopyForm } from "@/app/menu/copy/CopyForm";
import styles from "@/app/_components/kondate-theme.module.css";

export default function MenuCopyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/" className={`${styles.backLink} text-sm`}>
          ← 献立
        </Link>
      </div>
      <h1 className={`${styles.heading} mb-6 text-xl text-[var(--outline)]`}>献立をコピー</h1>
      <CopyForm />
    </main>
  );
}
