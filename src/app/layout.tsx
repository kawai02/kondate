import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { TabBar } from "@/app/_components/TabBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  themeColor: "#171717",
  viewportFit: "cover",
};

// 全ページがSupabase上の共有データを扱う認証必須アプリのため、
// 静的プリレンダリングの恩恵がない。ビルド時にSupabase未設定で失敗するのも防ぐ。
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="flex-1 pb-4">{children}</div>
        <Suspense fallback={null}>
          <TabBar />
        </Suspense>
      </body>
    </html>
  );
}
