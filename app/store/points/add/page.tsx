"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";

interface Customer { id: string; name: string; points: number; }

function AddPointsContent() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [staffName, setStaffName] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch("/api/session").then((r) => r.json()).then(async (data) => {
      if (data.type !== "store") { router.push("/"); return; }
      const res = await fetch("/api/customers");
      const list: Customer[] = await res.json();
      setCustomers(list);
      const preId = searchParams.get("customerId");
      if (preId) {
        const found = list.find((c) => c.id === preId) || null;
        setSelectedCustomer(found);
      }
    });
  }, [router, searchParams]);

  const handleSubmit = async () => {
    if (!selectedCustomer) { setError("お客様を選択してください"); return; }
    if (!staffName.trim()) { setError("スタッフ名を入力してください"); return; }
    if (!amount || Number(amount) <= 0) { setError("付与ポイントを入力してください"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/points/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selectedCustomer.id, amount: Number(amount), staffName: staffName.trim(), memo }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "エラーが発生しました"); }
      else {
        setSuccess(`${selectedCustomer.name}様に ${amount}pt 付与しました！`);
        setSelectedCustomer((prev) => prev ? { ...prev, points: prev.points + Number(amount) } : null);
        setAmount(""); setMemo(""); setStaffName("");
      }
    } catch { setError("通信エラーが発生しました"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">ポイント付与</h1>
      </header>
      <HomeButton href="/store" />
      <div className="p-4 pb-24 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow">
          <label className="block text-gray-600 text-base mb-2">お客様 <span className="text-red-500">*</span></label>
          <select
            value={selectedCustomer?.id || ""}
            onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) || null)}
            className="w-full border rounded-lg px-4 py-2 text-base text-gray-900"
          >
            <option value="">選択してください</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedCustomer && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="font-bold text-gray-800 text-base">{selectedCustomer.name}様</p>
              <p className="text-blue-500 font-bold text-base">現在のポイント：{selectedCustomer.points} pt</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <label className="block text-gray-600 text-base mb-2">操作スタッフ名 <span className="text-red-500">*</span></label>
          <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 text-base text-gray-900" placeholder="スタッフA" />
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <label className="block text-gray-600 text-base mb-2">付与ポイント <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-2 mb-3">
            <input type="number" value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              className="flex-1 border rounded-lg px-4 py-2 text-base text-gray-900" placeholder="0" min="1" />
            <span className="text-gray-600 text-base">pt</span>
          </div>
          <div className="flex gap-2">
            {[10, 20, 50, 100].map((v) => (
              <button key={v} onClick={() => setAmount(v)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg text-base font-bold">
                +{v}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <label className="block text-gray-600 text-base mb-2">メモ（任意）</label>
          <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 text-base text-gray-900" placeholder="紙カード移行分" />
        </div>

        {error && <p className="text-red-500 text-base">{error}</p>}
        {success && <p className="text-green-600 font-bold text-base">{success}</p>}

        <button onClick={handleSubmit} disabled={loading}
          className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-base disabled:opacity-50">
          {loading ? "処理中..." : "ポイントを付与する"}
        </button>
      </div>
    </div>
  );
}

export default function AddPointsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>}>
      <AddPointsContent />
    </Suspense>
  );
}
