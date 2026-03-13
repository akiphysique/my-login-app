"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutDialog from "@/components/LogoutDialog";

// お客様情報の型
interface CustomerData {
  name: string;
  points: number;
  email: string;
}

// ポイント履歴1件の型
interface PointLog {
  id: string;
  amount: number;
  staffName: string;
  memo?: string;
  createdAt: string;
}

// セッション情報の型
interface SessionData {
  type?: string;
  storeName?: string;
  storeAddress?: string;
}

export default function CustomerMyPage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  // ログアウト確認ダイアログの表示状態
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      // セッション確認（お客様でなければログインページへ）
      const sessionRes = await fetch("/api/session");
      const sessionData = await sessionRes.json();
      if (sessionData.type !== "customer") {
        router.push("/customer/login");
        return;
      }
      setSession(sessionData);

      // 顧客情報とポイント履歴を並行取得
      const [customerRes, logsRes] = await Promise.all([
        fetch("/api/customers/me"),
        fetch("/api/points/history"),
      ]);
      setCustomer(await customerRes.json());
      setLogs(await logsRes.json());
      setLoading(false);
    };
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/customer/logout", { method: "POST" });
    router.push("/customer/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>;
  }
  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ログアウト確認ダイアログ */}
      {showLogoutDialog && (
        <LogoutDialog
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutDialog(false)}
        />
      )}
      {/* ヘッダー：店舗名と住所を目立つ位置に表示（仕様要件） */}
      <header className="bg-white shadow-sm px-4 py-4 border-b">
        <p className="font-bold text-gray-800 text-xl">{session?.storeName}</p>
        <p className="text-gray-600 text-base">{session?.storeAddress}</p>
      </header>

      <div className="p-4 space-y-4">
        {/* ポイント残高カード */}
        <div className="bg-white rounded-xl p-6 shadow text-center">
          <p className="text-gray-600 text-base mb-2">{customer.name} 様のポイント残高</p>
          <p className="text-6xl font-bold text-blue-500">{customer.points}</p>
          <p className="text-gray-500 text-base mt-1">ポイント</p>
        </div>

        {/* ポイント履歴 */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="font-bold text-gray-800 text-base mb-3">ポイント履歴</h2>
          {logs.length === 0 ? (
            <p className="text-gray-500 text-base">まだ履歴がありません</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* 日付 */}
                      <p className="text-gray-500 text-base">
                        {new Date(log.createdAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </p>
                      {/* メモ（任意） */}
                      {log.memo && (
                        <p className="text-gray-700 text-base">理由：{log.memo}</p>
                      )}
                      <p className="text-gray-500 text-base">操作：{log.staffName}</p>
                    </div>
                    {/* ポイント数 */}
                    <p className="font-bold text-blue-500 text-base ml-4">＋{log.amount} pt</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ログアウトボタン */}
      <div className="px-4 mt-2 pb-8">
        <button onClick={() => setShowLogoutDialog(true)} className="logout-btn">
          ログアウト
        </button>
      </div>
    </div>
  );
}
