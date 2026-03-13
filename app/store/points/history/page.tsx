"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ポイント履歴1件の型
interface PointLog {
  id: string;
  amount: number;
  staffName: string;
  memo?: string;
  createdAt: string;
  customer: { name: string };
}

export default function PointHistoryPage() {
  const [logs, setLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // セッション確認 → 履歴を取得
    fetch("/api/session")
      .then((r) => r.json())
      .then(async (data) => {
        if (data.type !== "store") {
          router.push("/");
          return;
        }
        const res = await fetch("/api/points/history");
        setLogs(await res.json());
        setLoading(false);
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">ポイント履歴</h1>
      </header>
      <div className="p-4">
        {loading ? (
          <p className="text-gray-500 text-base">読み込み中...</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-base">履歴はありません</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-xl px-4 py-3 shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* 日付 */}
                    <p className="text-gray-500 text-base">
                      {new Date(log.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </p>
                    {/* お客様名 */}
                    <p className="font-bold text-gray-800 text-base">{log.customer.name}様</p>
                    {/* メモ（任意） */}
                    {log.memo && <p className="text-gray-600 text-base">理由：{log.memo}</p>}
                    <p className="text-gray-500 text-base">操作：{log.staffName}</p>
                  </div>
                  {/* 付与ポイント */}
                  <p className="font-bold text-blue-500 text-base ml-4">＋{log.amount} pt</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
