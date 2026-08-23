import { getLatestShoppingList } from "@/lib/shopping";
import { GenerateForm } from "@/app/shopping/GenerateForm";
import { ShoppingItemsView } from "@/app/shopping/ShoppingItemsView";

// 名寄せ・カテゴリ分類（Gemini構造化出力）がタイムアウトしないよう実行時間上限を延長する。
export const maxDuration = 30;

export default async function ShoppingPage() {
  const list = await getLatestShoppingList();

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <h1 className="mb-4 text-xl font-semibold">買い物リスト</h1>
      <GenerateForm />

      {list ? (
        <ShoppingItemsView list={list} />
      ) : (
        <p className="mt-8 text-center text-sm text-black/50 dark:text-white/50">
          まだリストが無い。期間を指定して作成してほしい。
        </p>
      )}
    </main>
  );
}
