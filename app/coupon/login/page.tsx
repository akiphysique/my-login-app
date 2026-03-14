"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 回数券システム：ログイン画面
// 顧客・スタッフ共通のログイン画面
export default function CouponLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    // 入力チェック
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/coupon/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
      } else {
        // password_changed = false の場合はパスワード変更画面へ自動遷移
        if (!data.passwordChanged) {
          router.push("/coupon/change-password");
        } else {
          router.push("/coupon");
        }
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // Enterキーでログイン
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        {/* タイトル */}
        <h1
          className="font-bold text-center mb-1"
          style={{ fontSize: "2.5rem", color: "#2196F3" }}
        >
          マタキテ
        </h1>
        <p
          className="text-center font-bold mb-6 login-subtitle"
          style={{ fontSize: "1.25rem" }}
        >
          回数券ログイン
        </p>

        {/* メールアドレス */}
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full border rounded-lg px-4 py-3 mb-4 text-base text-gray-900"
        />

        {/* パスワード（表示切り替えボタン付き） */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border rounded-lg px-4 py-3 pr-10 text-base text-gray-900"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </button>
        </div>

        {/* エラーメッセージ */}
        {error && <p className="text-red-500 text-base mb-4">{error}</p>}

        {/* ログインボタン */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold text-base hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>

        {/* 新規登録リンク（店舗のQRコードがある場合） */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-500 text-sm">
            はじめての方は、店舗のQRコードから登録してください
          </p>
        </div>
      </div>
    </div>
  );
}
