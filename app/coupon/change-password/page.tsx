"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 回数券システム：初回ログイン時パスワード変更画面
// password_changed = false のユーザーがログイン後に自動遷移する画面
// パスワード変更後に password_changed = true に更新してホーム画面へ進む
export default function ChangePasswordPage() {
  const [ready, setReady] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // セッション確認
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.type !== "coupon") {
          // 回数券ユーザーでなければログイン画面へ
          router.push("/coupon/login");
          return;
        }
        if (data.couponPasswordChanged) {
          // すでにパスワード変更済みならホームへ
          router.push("/coupon");
          return;
        }
        setStoreName(data.storeName || "");
        setReady(true);
      });
  }, [router]);

  const handleSubmit = async () => {
    // 入力チェック
    if (!form.newPassword || !form.confirmPassword) {
      setError("新しいパスワードを入力してください");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("パスワードは8文字以上にしてください");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/coupon/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "パスワードの変更に失敗しました");
      } else {
        // 変更完了 → ホーム画面へ遷移
        router.push("/coupon");
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-base">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        {/* ヘッダー */}
        <h1
          className="font-bold text-center mb-1"
          style={{ fontSize: "2rem", color: "#2196F3" }}
        >
          パスワードの変更
        </h1>
        {storeName && (
          <p className="text-center text-gray-500 text-base mb-2">{storeName}</p>
        )}
        <div className="bg-blue-50 rounded-lg p-3 mb-6">
          <p className="text-gray-700 text-base">
            スタッフが仮のパスワードで登録しました。<br />
            新しいパスワードを設定してください。
          </p>
        </div>

        {/* 新しいパスワード */}
        <div className="mb-4">
          <label className="block text-gray-600 text-base mb-1">
            新しいパスワード <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 pr-10 text-base text-gray-900"
              placeholder="8文字以上"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showNew ? "パスワードを隠す" : "パスワードを表示"}
            >
              {showNew ? "🙈" : "👁️"}
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">8文字以上で設定してください</p>
        </div>

        {/* 新しいパスワード（確認） */}
        <div className="mb-4">
          <label className="block text-gray-600 text-base mb-1">
            新しいパスワード（確認） <span className="text-red-500">*</span>
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

        {/* エラーメッセージ */}
        {error && <p className="text-red-500 text-base mb-4">{error}</p>}

        {/* 変更ボタン */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold text-base hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "変更中..." : "パスワードを変更する"}
        </button>
      </div>
    </div>
  );
}
