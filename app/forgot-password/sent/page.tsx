"use client";

import { useRouter } from "next/navigation";

export default function SentPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900">メールを送りました</h1>
        <p className="text-sm text-gray-500 mb-6">
          入力したメールアドレスに再設定用のリンクを送りました。メールをご確認ください。
        </p>

        <button
          onClick={() => router.push("/")}
          className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600"
        >
          ログインに戻る
        </button>
      </div>
    </div>
  );
}