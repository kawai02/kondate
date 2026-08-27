import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { TabBar } from "@/app/_components/TabBar";
import { KondateGoogleFonts } from "@/app/_components/KondateGoogleFonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "献立管理",
  description: "夫婦2人の献立・レシピ管理",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "献立管理",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b2a2e",
  viewportFit: "cover",
};

// 全ページがSupabase上の共有データを扱う認証必須アプリのため、
// 静的プリレンダリングの恩恵がない。ビルド時にSupabase未設定で失敗するのも防ぐ。
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {/* <head>を手書きせず<link>をそのまま返す。Reactがbody内のどこに書いても
            自動的に<head>へ集約・重複排除してくれる（Metadata APIのtitle/meta等と
            競合しないよう、Next公式が非推奨とする手書き<head>要素は使わない）。 */}
        <KondateGoogleFonts />
        <div className="flex-1 pb-4">{children}</div>
        <Suspense fallback={null}>
          <TabBar />
        </Suspense>
      </body>
    </html>
  );
}
