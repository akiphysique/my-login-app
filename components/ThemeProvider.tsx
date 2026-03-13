"use client";

import { useEffect, useState } from "react";

// localStorageに保存するキー名
const STORAGE_KEY = "matakite-theme";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // デフォルトはダーク（サーバーサイドもダーク想定）
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // 初回マウント時：localStorageからテーマを読み込んでhtmlタグに反映
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as "dark" | "light" | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  // テーマ切り替え処理
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <>
      {/* テーマ切り替えボタン（全画面共通・右上固定・最前面） */}
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        className="theme-toggle-btn"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
      {children}
    </>
  );
}
