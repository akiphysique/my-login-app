"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";

interface Customer { id: string; name: string; email: string; phone: string; points: number; memo?: string; }

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/session").then((r) => r.json()).then(async (data) => {
      if (data.type !== "store") { router.push("/"); return; }
      const res = await fetch("/api/customers");
      setCustomers(await res.json());
      setLoading(false);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">お客様一覧</h1>
      </header>
      <HomeButton href="/store" />
      <div className="p-4 pb-24">
        {loading ? (
          <p className="text-gray-500 text-base">読み込み中...</p>
        ) : customers.length === 0 ? (
          <p className="text-gray-500 text-base">お客様が登録されていません</p>
        ) : (
          <div className="space-y-3">
            {customers.map((c) => (
              <div key={c.id} className="bg-white rounded-xl px-4 py-3 shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800 text-base">{c.name}様</p>
                    <p className="text-gray-500 text-base">{c.email}</p>
                    <p className="text-gray-500 text-base">{c.phone}</p>
                    {c.memo && <p className="text-gray-400 text-base">{c.memo}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-500 text-base">{c.points} pt</p>
                    <Link
                      href={`/store/points/add?customerId=${c.id}`}
                      className="text-blue-400 text-base hover:text-blue-600"
                    >
                      ポイント付与
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/store/customers/new"
          className="block mt-4 text-center bg-blue-500 text-white py-3 rounded-xl font-bold text-base">
          新規お客様登録
        </Link>
      </div>
    </div>
  );
}
