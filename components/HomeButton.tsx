"use client";

import Link from "next/link";

interface HomeButtonProps {
  // 遷移先：店舗側は /store、お客様側は /customer
  href: "/store" | "/customer";
}

// 画面下部中央に固定表示するホームボタン
export default function HomeButton({ href }: HomeButtonProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9998,
      }}
    >
      <Link href={href} className="home-btn">
        <span style={{ fontSize: "24px", lineHeight: 1 }}>🏠</span>
        <span style={{ fontSize: "12px", fontWeight: "bold" }}>ホーム</span>
      </Link>
    </div>
  );
}
