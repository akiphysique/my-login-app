"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";

interface SessionData {
  type?: string;
  storeName?: string;
  storeAddress?: string;
}

export default function SettingsPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.type !== "store") { router.push("/"); return; }
        setSession(data);
      });
  }, [router]);

  // パスワード変更処理
  const handlePasswordChange = async () => {
    // バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("すべての項目を入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません");
      return;
    }
    if (newPassword.length < 8) {
      setError("パスワードは8文字以上にしてください");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/stores/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "エラーが発生しました");
      } else {
        setSuccess("パスワードを変更しました");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">設定</h1>
      </header>
      <HomeButton href="/store" />
      <div className="p-4 pb-24 space-y-4">

        {/* 店舗情報 */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="font-bold text-gray-800 text-base mb-3">店舗情報</h2>
          <div className="space-y-2">
            <div>
              <p className="text-gray-500 text-base">店舗名</p>
              <p className="text-gray-800 text-base font-bold">{session.storeName}</p>
            </div>
            <div>
              <p className="text-gray-500 text-base">住所</p>
              <p className="text-gray-800 text-base">{session.storeAddress}</p>
            </div>
          </div>
        </div>

        {/* QR登録リンク */}
        <Link href="/store/qr"
          className="flex items-center justify-between bg-white px-4 py-4 rounded-xl text-gray-800 text-base shadow">
          <span>QRコード管理</span>
          <span className="text-blue-500">→</span>
        </Link>

        {/* パスワード変更 */}
        <div className="bg-white rounded-xl p-4 shadow">
          <h2 className="font-bold text-gray-800 text-base mb-3">パスワード変更</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-gray-600 text-base mb-1">現在のパスワード</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-base mb-1">新しいパスワード（8文字以上）</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              />
            </div>
            <div>
              <label className="block text-gray-600 text-base mb-1">新しいパスワード（確認）</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-base mt-3">{error}</p>}
          {success && <p className="text-green-600 font-bold text-base mt-3">{success}</p>}
          <button
            onClick={handlePasswordChange}
            disabled={loading}
            className="w-full mt-4 bg-blue-500 text-white py-3 rounded-xl font-bold text-base disabled:opacity-50"
          >
            {loading ? "変更中..." : "パスワードを変更する"}
          </button>
        </div>
      </div>
    </div>
  );
}
