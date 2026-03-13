import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "マタキテ",
  description: "回数券アプリ マタキテ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // デフォルトはダークモード（FOUCスクリプトがlocalStorageの値で上書き）
    <html lang="ja" data-theme="dark">
      <head>
        {/*
          FOUC（画面ちらつき）防止スクリプト
          Reactが読み込まれる前にlocalStorageのテーマを即座に適用する
          ※ FOUCとは：最初に間違ったテーマが一瞬表示される現象
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('matakite-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ThemeProviderがテーマ状態の管理と切り替えボタンの表示を担当 */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
