import { getLatestShoppingList } from "@/lib/shopping";
import { GenerateForm } from "@/app/shopping/GenerateForm";
import { ShoppingItemsView } from "@/app/shopping/ShoppingItemsView";
import styles from "@/app/_components/kondate-theme.module.css";

// 名寄せ・カテゴリ分類（Gemini構造化出力）がタイムアウトしないよう実行時間上限を延長する。
export const maxDuration = 30;

export default async function ShoppingPage() {
  const list = await getLatestShoppingList();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <h1 className={`${styles.heading} mb-4 text-xl text-[var(--outline)]`}>買い物リスト</h1>
      <GenerateForm />

      {list ? (
        <ShoppingItemsView list={list} />
      ) : (
        <p className="mt-8 text-center text-sm text-[var(--ink-soft)]">
          まだリストが無い。期間を指定して作成してほしい。
        </p>
      )}
    </main>
  );
}
