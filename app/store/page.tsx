"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LogoutDialog from "@/components/LogoutDialog";

interface SessionData { storeName?: string; storeAddress?: string; type?: string; }

export default function StoreDashboard() {
  const [session, setSession] = useState<SessionData | null>(null);
  // ログアウト確認ダイアログの表示状態
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/session").then((r) => r.json()).then((data) => {
      if (data.type !== "store") { router.push("/"); } else { setSession(data); }
    });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/store/logout", { method: "POST" });
    router.push("/");
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ログアウト確認ダイアログ */}
      {showLogoutDialog && (
        <LogoutDialog
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutDialog(false)}
        />
      )}
      {/* ヘッダー：店舗名・住所を目立つ位置に表示（仕様要件） */}
      <header className="bg-white shadow-sm px-4 py-3">
        <p className="text-gray-500 text-base">管理中</p>
        <p className="font-bold text-gray-800 text-lg">{session.storeName}</p>
        <p className="text-gray-500 text-base">{session.storeAddress}</p>
      </header>

      {/* ナビゲーションメニュー */}
      <nav className="p-4 space-y-3">
        {/* ポイント付与（最重要・一番上・青色で目立たせる） */}
        <Link href="/store/points/add"
          className="flex items-center justify-between bg-blue-500 text-white px-4 py-4 rounded-xl font-bold text-base shadow">
          <span>ポイント付与</span><span>→</span>
        </Link>
        <Link href="/store/customers"
          className="flex items-center justify-between bg-white px-4 py-4 rounded-xl text-gray-800 text-base shadow">
          <span>お客様一覧</span><span>→</span>
        </Link>
        <Link href="/store/customers/register"
          className="flex items-center justify-between bg-white px-4 py-4 rounded-xl text-gray-800 text-base shadow">
          <span>お客様登録</span><span>→</span>
        </Link>
        <Link href="/store/points/history"
          className="flex items-center justify-between bg-white px-4 py-4 rounded-xl text-gray-800 text-base shadow">
          <span>ポイント履歴</span><span>→</span>
        </Link>
        <Link href="/store/settings"
          className="flex items-center justify-between bg-white px-4 py-4 rounded-xl text-gray-800 text-base shadow">
          <span>設定</span><span>→</span>
        </Link>
      </nav>

      <div className="px-4 mt-2 pb-6">
        <button onClick={() => setShowLogoutDialog(true)} className="logout-btn">
          ログアウト
        </button>
      </div>
    </div>
  );
}
