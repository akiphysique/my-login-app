"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function DashboardContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center">
        <div className="text-6xl mb-4">👤</div>
        <p className="text-gray-500 text-sm mb-2">ログイン成功！ようこそ</p>
        <h1 className="text-3xl font-bold mb-6 text-gray-900">{name} さん</h1>

        <button
          onClick={() => router.push("/")}
          className="w-full border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}