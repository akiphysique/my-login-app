"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// 店舗情報の型
interface StoreInfo {
  storeName: string;
  storeAddress: string;
}

// QR自己登録フォームの本体
function RegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // URLからトークンを取得

  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [form, setForm] = useState({ name: "", furigana: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("URLが無効です");
      setLoading(false);
      return;
    }
    // トークンを検証して店舗情報を取得
    fetch(`/api/users/self-register?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.storeName) {
          setStoreInfo(data);
        } else {
          setTokenError("QRコードが無効または期限切れです");
        }
        setLoading(false);
      })
      .catch(() => {
        setTokenError("通信エラーが発生しました");
        setLoading(false);
      });
  }, [token]);

  // 登録処理
  const handleSubmit = async () => {
    // 必須項目チェック
    if (!form.name || !form.furigana || !form.email) {
      setError("お名前・フリガナ・メールアドレスは必須です");
      return;
    }
    // メールアドレス形式チェック
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setError("メールアドレスの形式が正しくありません");
      return;
    }
    // 電話番号バリデーション（入力された場合のみ・数字とハイフンのみ）
    if (form.phone && !/^[0-9-]+$/.test(form.phone)) {
      setError("電話番号は数字とハイフンのみ使用できます（例：090-1234-5678）");
      return;
    }
    // パスワードが入力されている場合は長さチェック
    if (form.password && form.password.length < 8) {
      setError("パスワードは8文字以上にしてください");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/users/self-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  // ローディング中
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>;
  }

  // トークンエラー
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-sm w-full">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-500 text-base font-bold">{tokenError}</p>
          <p className="text-gray-500 text-base mt-2">お店のスタッフにお声がけください</p>
        </div>
      </div>
    );
  }

  // 登録完了
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-sm w-full">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">登録が完了しました！</h1>
          <p className="text-gray-600 text-base mb-4">
            {storeInfo?.storeName} へようこそ！
          </p>
          <p className="text-gray-500 text-base text-left bg-gray-50 p-3 rounded-lg">
            ログインはメールアドレスと、登録時に設定したパスワードを使ってください。<br />
            パスワードを省略した場合は <strong>matakite123</strong> です。
          </p>
          <Link href="/customer/login"
            className="block mt-6 bg-green-500 text-white py-3 rounded-xl font-bold text-base text-center">
            ログインする
          </Link>
        </div>
      </div>
    );
  }

  // 登録フォーム
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー：店舗名・住所を目立つ位置に表示（仕様要件） */}
      <header className="bg-white shadow-sm px-4 py-4 border-b">
        <p className="font-bold text-gray-800 text-xl">{storeInfo?.storeName}</p>
        <p className="text-gray-600 text-base">{storeInfo?.storeAddress}</p>
      </header>
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold text-gray-800">会員登録</h1>

        <div className="bg-white rounded-xl p-4 shadow space-y-3">
          {/* お名前（必須） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              お名前 <span className="text-red-500">*</span>
              <span className="text-gray-400 text-sm ml-1">（漢字・ローマ字どちらでも可）</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="山田太郎"
            />
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
          {/* パスワード（省略可） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              パスワード{" "}
              <span className="text-gray-400">（省略すると matakite123 になります）</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 text-base text-gray-900"
              placeholder="8文字以上"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-base">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-base disabled:opacity-50"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>
      </div>
    </div>
  );
}

// Suspenseで囲む（useSearchParamsに必要）
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
