import Link from "next/link";
import { CopyForm } from "@/app/menu/copy/CopyForm";

export default function MenuCopyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4">
        <Link href="/" className="text-sm text-black/60 dark:text-white/60">
          ← 献立
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">献立をコピー</h1>
      <CopyForm />
    </main>
  );
}
