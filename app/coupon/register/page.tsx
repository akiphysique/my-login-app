"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// 回数券システム：顧客自己登録画面
// 店舗のQRコードを読み取るとURLにトークンが付いた状態でこの画面が開く
function CouponRegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // URLから店舗トークンを取得
  const router = useRouter();

  const [storeName, setStoreName] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // トークンを検証して店舗名を取得
  useEffect(() => {
    if (!token) {
      setTokenError("URLが無効です。店舗のQRコードから再度お試しください");
      setLoading(false);
      return;
    }
    fetch(`/api/users/self-register?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.storeName) {
          setStoreName(data.storeName);
        } else {
          setTokenError("QRコードが無効または期限切れです。店舗スタッフにお声がけください");
        }
        setLoading(false);
      })
      .catch(() => {
        setTokenError("通信エラーが発生しました");
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async () => {
    // 入力チェック
    if (!form.email || !form.password || !form.confirmPassword) {
      setError("すべての項目を入力してください");
      return;
    }
    // メールアドレス形式チェック
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setError("メールアドレスの形式が正しくありません");
      return;
    }
    // パスワードの一致チェック
    if (form.password !== form.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    // パスワードの長さチェック
    if (form.password.length < 8) {
      setError("パスワードは8文字以上にしてください");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/coupon/register", {
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
    return (
      <div className="min-h-screen flex items-center justify-center text-base">
        読み込み中...
      </div>
    );
  }

  // トークンエラー
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-sm w-full">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-500 text-base font-bold">{tokenError}</p>
        </div>
      </div>
    );
  }

  // 登録完了
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-sm w-full">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">登録が完了しました！</h1>
          <p className="text-gray-600 text-base mb-6">
            {storeName} の回数券アカウントが作成されました
          </p>
          <button
            onClick={() => router.push("/coupon/login")}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-base"
          >
            ログインする
          </button>
        </div>
      </div>
    );
  }

  // 登録フォーム
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm px-4 py-4 border-b">
        <p className="font-bold text-gray-800 text-xl">{storeName}</p>
        <p className="text-gray-600 text-base">回数券アカウント登録</p>
      </header>

      <div className="p-4 space-y-4 max-w-sm mx-auto">
        <h1 className="text-xl font-bold text-gray-800">新規登録</h1>

        <div className="bg-white rounded-xl p-4 shadow space-y-4">

          {/* メールアドレス */}
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

          {/* パスワード */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              パスワード <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border rounded-lg px-4 py-3 pr-10 text-base text-gray-900"
                placeholder="8文字以上"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-1">8文字以上で設定してください</p>
          </div>

          {/* パスワード（確認） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              パスワード（確認） <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full border rounded-lg px-4 py-3 pr-10 text-base text-gray-900"
                placeholder="もう一度入力してください"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirm ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-base">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-base disabled:opacity-50"
        >
          {submitting ? "登録中..." : "登録する"}
        </button>

        <p className="text-center text-base">
          <a href="/coupon/login" className="text-blue-500 hover:underline">
            すでにアカウントがある方はこちら
          </a>
        </p>
      </div>
    </div>
  );
}

// useSearchParams を使うため Suspense でラップ
export default function CouponRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>}>
      <CouponRegisterForm />
    </Suspense>
  );
}
