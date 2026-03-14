"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";

interface SessionData { storeName?: string; storeAddress?: string; type?: string; }

// 回数券システム：スタッフによる顧客代理登録画面
// スタッフが顧客のメールアドレスと仮パスワードを入力して登録する
// 登録された顧客は初回ログイン時にパスワード変更を求められる（password_changed = false）
export default function CouponUserProxyRegisterPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [form, setForm] = useState({ email: "", tempPassword: "", confirmPassword: "" });
  const [showTemp, setShowTemp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // セッション確認（店舗ログインのみ許可）
  useEffect(() => {
    fetch("/api/session").then((r) => r.json()).then((data) => {
      if (data.type !== "store") { router.push("/"); return; }
      setSession(data);
    });
  }, [router]);

  const handleSubmit = async () => {
    // 入力チェック
    if (!form.email || !form.tempPassword || !form.confirmPassword) {
      setError("すべての項目を入力してください");
      return;
    }
    // メールアドレス形式チェック
    if (!form.email.includes("@") || !form.email.includes(".")) {
      setError("メールアドレスの形式が正しくありません");
      return;
    }
    // 仮パスワードの一致チェック
    if (form.tempPassword !== form.confirmPassword) {
      setError("仮パスワードが一致しません");
      return;
    }
    // 仮パスワードの長さチェック
    if (form.tempPassword.length < 8) {
      setError("仮パスワードは8文字以上にしてください");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/coupon/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      setLoading(false);
    }
  };

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>;
  }

  // 登録完了画面
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
          <h1 className="font-bold text-gray-800 text-base">代理登録</h1>
        </header>
        <div className="p-4 text-center">
          <p className="text-5xl mt-8 mb-4">✅</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">登録が完了しました</h2>
          <p className="text-gray-600 text-base mb-2">
            お客様に以下をお伝えください：
          </p>
          <div className="bg-blue-50 rounded-xl p-4 text-left mb-6 mx-auto max-w-xs">
            <p className="text-gray-700 text-base">
              📧 登録したメールアドレスと、<br />
              お伝えした仮パスワードでログインしてください。<br />
              <br />
              初回ログイン後、パスワードの変更画面が表示されます。
            </p>
          </div>
          <p className="text-gray-500 text-base mb-1">ログイン先：</p>
          <p className="text-blue-500 text-base font-bold mb-6">/coupon/login</p>
          <div className="space-y-3 max-w-xs mx-auto">
            <button
              onClick={() => { setSuccess(false); setForm({ email: "", tempPassword: "", confirmPassword: "" }); }}
              className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-base"
            >
              続けて登録する
            </button>
            <Link
              href="/store"
              className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-base"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">お客様代理登録（回数券）</h1>
      </header>
      <HomeButton href="/store" />

      <div className="p-4 pb-24 space-y-4 max-w-sm mx-auto">

        {/* 登録先店舗の表示 */}
        <div className="bg-blue-50 rounded-xl px-4 py-3">
          <p className="text-gray-500 text-base">登録先店舗</p>
          <p className="font-bold text-gray-800 text-base">{session.storeName}</p>
        </div>

        {/* 説明 */}
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-gray-600 text-base">
            お客様のメールアドレスと仮パスワードを入力して登録します。<br />
            お客様が初めてログインした際、パスワードの変更画面が自動的に表示されます。
          </p>
        </div>

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

          {/* 仮パスワード */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              仮パスワード <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showTemp ? "text" : "password"}
                value={form.tempPassword}
                onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                className="w-full border rounded-lg px-4 py-3 pr-10 text-base text-gray-900"
                placeholder="8文字以上"
              />
              <button
                type="button"
                onClick={() => setShowTemp(!showTemp)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showTemp ? "パスワードを隠す" : "パスワードを表示"}
              >
                {showTemp ? "🙈" : "👁️"}
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              お客様にこの仮パスワードを口頭でお伝えください
            </p>
          </div>

          {/* 仮パスワード（確認） */}
          <div>
            <label className="block text-gray-600 text-base mb-1">
              仮パスワード（確認） <span className="text-red-500">*</span>
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
          disabled={loading}
          className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold text-base disabled:opacity-50"
        >
          {loading ? "登録中..." : "登録する"}
        </button>
      </div>
    </div>
  );
}
