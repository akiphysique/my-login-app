"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";

interface SessionData { storeName?: string; storeAddress?: string; type?: string; }

// 電話番号バリデーション（数字とハイフンのみ）
const PHONE_REGEX = /^[0-9-]+$/

export default function NewCustomer() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [form, setForm] = useState({
    name: "",
    furigana: "",
    email: "",
    phone: "",
    password: "",
    memo: "",
  });
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
    if (!form.name || !form.furigana || !form.email || !form.password) {
      setError("氏名・フリガナ・メールアドレス・パスワードは必須です");
      return;
    }
    // メールアドレス形式チェック
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setError("メールアドレスの形式が正しくありません");
      return;
    }
    // 電話番号バリデーション（入力された場合のみ）
    if (form.phone && !PHONE_REGEX.test(form.phone)) {
      setError("電話番号は数字とハイフンのみ使用できます（例：090-1234-5678）");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        <h1 className="font-bold text-gray-800 text-base">お客様登録</h1>
      </header>
      <HomeButton href="/store" />
      <div className="p-4 pb-24 space-y-4">

        {/* 登録先店舗の表示（仕様書要件） */}
        <div className="bg-blue-50 rounded-xl px-4 py-3">
          <p className="text-gray-500 text-base">登録先店舗</p>
          <p className="font-bold text-gray-800 text-base">{session.storeName}</p>
          <p className="text-gray-600 text-base">{session.storeAddress}</p>
          <p className="text-gray-400 text-base mt-1">※ 店舗IDはサーバー側で自動付与されます</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow space-y-3">

          {/* 氏名（必須） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              氏名 <span className="text-red-500">*</span>
              <span className="text-gray-400 text-sm ml-1">（漢字・ローマ字どちらでも可）</span>
            </label>
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

          {/* フリガナ（必須） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              フリガナ <span className="text-red-500">*</span>
              <span className="text-gray-400 text-sm ml-1">（カタカナ・ローマ字どちらでも可）</span>
            </label>
            <input
              type="text"
              value={form.furigana}
              onChange={(e) => setForm({ ...form, furigana: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="ヤマダタロウ"
            />
          </div>

          {/* メールアドレス（必須） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="yamada@example.com"
            />
          </div>

          {/* 電話番号（任意） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              電話番号
              <span className="text-gray-400 text-sm ml-1">（任意）</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="090-1234-5678"
            />
            <p className="text-gray-400 text-sm mt-1">店舗からの連絡に使用します</p>
          </div>

          {/* パスワード（必須） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="8文字以上推奨"
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
