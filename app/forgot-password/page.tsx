"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    if (email) {
      router.push("/forgot-password/sent");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">パスワードを忘れた方へ</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          登録したメールアドレスを入力してください
        </p>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 text-sm text-gray-900"
        />

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600 mb-4"
        >
          再設定メールを送る
        </button>

        <button
          onClick={() => router.push("/")}
          className="w-full text-gray-400 text-sm hover:text-gray-600"
        >
          ← ログインに戻る
        </button>
      </div>
    </div>
  );
}