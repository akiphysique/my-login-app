"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (email === "taro@example.com" && password === "password123") {
      router.push("/dashboard?name=Aki Physique");
    } else {
      setError("メールアドレスまたはパスワードが違います");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">ログイン</h1>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 text-sm text-gray-900"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 text-sm text-gray-900"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600"
        >
          ログイン
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center">
          テスト用: taro@example.com / password123
        </p>

        <button
          onClick={() => router.push("/forgot-password")}
          className="w-full text-blue-400 text-sm mt-2 hover:text-blue-600"
        >
          パスワードを忘れた方はこちら
        </button>
      </div>
    </div>
  );
}