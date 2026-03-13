"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// パンくずリストの各アイテムの型定義
// hrefがある場合はリンク、ない場合は現在ページ（太字・リンクなし）
type BreadcrumbItem = {
  label: string;
  href?: string;
};

// パス → パンくずアイテム一覧のマッピング
// 最後のアイテム（hrefなし）が現在ページ
const BREADCRUMB_MAP: Record<string, BreadcrumbItem[]> = {
  "/store/customers": [
    { label: "ホーム", href: "/store" },
    { label: "お客様一覧" },
  ],
  "/store/customers/new": [
    { label: "ホーム", href: "/store" },
    { label: "お客様一覧", href: "/store/customers" },
    { label: "新規登録" },
  ],
  "/store/points/add": [
    { label: "ホーム", href: "/store" },
    { label: "ポイント追加" },
  ],
  "/store/points/history": [
    { label: "ホーム", href: "/store" },
    { label: "ポイント履歴" },
  ],
  "/store/qr": [
    { label: "ホーム", href: "/store" },
    { label: "QRコード" },
  ],
  "/store/settings": [
    { label: "ホーム", href: "/store" },
    { label: "設定" },
  ],
};

// パンくずリストコンポーネント
// ログイン画面・ホーム画面では何も表示しない（MAPに定義がないパスは非表示）
export default function Breadcrumb() {
  // 現在のURLパスを取得
  const pathname = usePathname();
  const items = BREADCRUMB_MAP[pathname];

  // パンくずが不要なページ（ログイン・ホームなど）は何も表示しない
  if (!items) return null;

  return (
    <nav className="breadcrumb-nav" aria-label="パンくずリスト">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {/* 2番目以降のアイテムの前に区切り文字を表示 */}
          {index > 0 && <span className="breadcrumb-sep">&gt;</span>}

          {item.href ? (
            // リンクあり：クリックで遷移できる
            <Link href={item.href} className="breadcrumb-link">
              {item.label}
            </Link>
          ) : (
            // リンクなし：現在ページ（太字で表示）
            <span className="breadcrumb-current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
