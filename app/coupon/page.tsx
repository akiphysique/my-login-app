"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutDialog from "@/components/LogoutDialog";

// セッション情報の型
interface SessionData {
  type?: string;
  couponUserId?: string;
  couponUserRole?: string;
  couponPasswordChanged?: boolean;
  storeName?: string;
  storeAddress?: string;
}

// 回数券システム：顧客ホーム画面
// ログイン済みの CouponUser が最初に見る画面
export default function CouponHomePage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.type !== "coupon") {
          // 回数券ユーザーでなければログイン画面へ
          router.push("/coupon/login");
          return;
        }
        if (!data.couponPasswordChanged) {
          // パスワード未変更ならパスワード変更画面へ自動遷移
          router.push("/coupon/change-password");
          return;
        }
        setSession(data);
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/coupon/auth/logout", { method: "POST" });
    router.push("/coupon/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-base">
        読み込み中...
      </div>
    );
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

      {/* ヘッダー：店舗名・住所を目立つ位置に表示（不正防止のため仕様要件） */}
      <header className="bg-white shadow-sm px-4 py-4 border-b">
        <p className="font-bold text-gray-800 text-xl">{session?.storeName}</p>
        <p className="text-gray-600 text-base">{session?.storeAddress}</p>
      </header>

      <div className="p-4 space-y-4 max-w-sm mx-auto">

        {/* 案内カード */}
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <p className="text-5xl mb-3">🎟️</p>
          <p className="font-bold text-gray-800 text-lg mb-1">回数券マイページ</p>
          <p className="text-gray-500 text-base">
            回数券の残数・利用履歴はこちらで確認できます
          </p>
        </div>

        {/* 今後追加予定の機能案内 */}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-gray-700 text-base font-bold mb-2">🚧 準備中</p>
          <p className="text-gray-600 text-base">
            回数券の残数・履歴表示機能は近日公開予定です
          </p>
        </div>
      </div>

      {/* ログアウトボタン */}
      <div className="px-4 mt-4 pb-8">
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="logout-btn"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
