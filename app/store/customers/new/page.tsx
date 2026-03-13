"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SessionData { storeName?: string; storeAddress?: string; type?: string; }

export default function NewCustomer() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", memo: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // セッション確認と店舗情報取得
  useEffect(() => {
    fetch("/api/session").then((r) => r.json()).then((data) => {
      if (data.type !== "store") { router.push("/"); return; }
      setSession(data);
    });
  }, [router]);

  const handleSubmit = async () => {
    // 必須項目チェック
    if (!form.name || !form.email || !form.phone) {
      setError("名前・メール・電話番号は必須です");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // パスワードはデフォルト値を使用（仕様書にパスワード欄の記載なし）
        body: JSON.stringify({ ...form, password: "matakite123" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
      } else {
        router.push("/store/customers");
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
        <Link href="/store/customers" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">顧客登録</h1>
      </header>
      <div className="p-4 space-y-4">

        {/* 登録先店舗の表示（仕様書要件） */}
        <div className="bg-blue-50 rounded-xl px-4 py-3">
          <p className="text-gray-500 text-base">登録先店舗</p>
          <p className="font-bold text-gray-800 text-base">{session.storeName}</p>
          <p className="text-gray-600 text-base">{session.storeAddress}</p>
          <p className="text-gray-400 text-base mt-1">※ 店舗IDはサーバー側で自動付与されます</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow space-y-3">
          {/* 名前 */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              名前 <span className="text-red-500">*</span>
            </label>
            {/* 入力欄と「様」を横並びにする */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="flex-1 border rounded-lg px-4 py-3 text-base text-gray-900"
                placeholder="山田太郎"
              />
              <span className="text-gray-800 text-base font-bold whitespace-nowrap">様</span>
            </div>
          </div>
          {/* メール */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              メール <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="yamada@example.com"
            />
          </div>
          {/* 電話番号 */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="090-1234-5678"
            />
          </div>
          {/* メモ（任意） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">メモ（任意）</label>
            <input
              type="text"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="紙カード移行など"
            />
          </div>
        </div>

        {/* 初期パスワードについての案内 */}
        <p className="text-gray-400 text-base text-center">
          お客様の初期パスワードは <strong className="text-gray-600">matakite123</strong> です。<br />
          ログイン後に変更をお勧めください。
        </p>

        {error && <p className="text-red-500 text-base">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-base disabled:opacity-50"
        >
          {loading ? "登録中..." : "登録する"}
        </button>
      </div>
    </div>
  );
}
