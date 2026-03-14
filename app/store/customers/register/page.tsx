"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";

export default function CustomerRegisterMethodPage() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // セッション確認（店舗でなければトップへリダイレクト）
  useEffect(() => {
    fetch("/api/session").then((r) => r.json()).then((data) => {
      if (data.type !== "store") { router.push("/"); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">お客様登録</h1>
      </header>
      <HomeButton href="/store" />

      <div className="p-4 pb-24 space-y-4">
        <p className="text-gray-600 text-base">登録方法を選んでください</p>

        {/* カード1：お客様にて登録（QRコード） */}
        <Link href="/store/qr" className="register-method-card">
          <span className="register-method-icon">📱</span>
          <div className="register-method-body">
            <p className="register-method-title">お客様にて登録</p>
            <p className="register-method-desc">お客様がQRコードを読み込んで登録します</p>
          </div>
          <span className="register-method-arrow">→</span>
        </Link>

        {/* カード2：店舗様にて登録（スタッフが入力） */}
        <Link href="/store/customers/new" className="register-method-card">
          <span className="register-method-icon">✏️</span>
          <div className="register-method-body">
            <p className="register-method-title">店舗様にて登録</p>
            <p className="register-method-desc">スタッフが情報を入力して登録します</p>
          </div>
          <span className="register-method-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}
