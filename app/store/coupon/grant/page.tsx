"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";
import dynamic from "next/dynamic";

// CouponQrScanner はカメラAPIを使うためSSRを無効にして動的インポート
const CouponQrScanner = dynamic(() => import("@/components/CouponQrScanner"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-base">
      カメラを準備中...
    </div>
  ),
});

// 回数券の種類の型
interface Ticket {
  id: string;
  name: string;
  count: number;
}

// QRスキャンで取得した顧客情報の型
interface ScannedUser {
  id: string;
  email: string;
}

// 回数券付与ページ
// スタッフが顧客のQRコードを読み取り、回数券を付与する
export default function CouponGrantPage() {
  const [ready, setReady] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);

  // フォームの入力値
  const [ticketId, setTicketId] = useState("");
  const [count, setCount] = useState(1);
  const [staffName, setStaffName] = useState("");
  const [reason, setReason] = useState("回数券購入");

  // 送信状態
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  // セッション確認と回数券種類の取得
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.type !== "store") { router.push("/"); return; }
        setReady(true);
        // 自店舗の回数券マスタを取得
        return fetch("/api/coupon/tickets");
      })
      .then((res) => {
        if (!res) return;
        return res.json();
      })
      .then((data) => {
        if (data?.tickets) {
          setTickets(data.tickets);
          // 種類が1つだけなら自動選択
          if (data.tickets.length === 1) {
            setTicketId(data.tickets[0].id);
          }
        }
      })
      .catch(() => {});
  }, [router]);

  // QRコードスキャン成功時の処理
  const handleScan = useCallback(async (text: string) => {
    setShowScanner(false);
    setScanError("");

    // マタキテのQRコードかどうかチェック
    const PREFIX = "matakite-coupon-user:";
    if (!text.startsWith(PREFIX)) {
      setScanError("このQRコードはマタキテの顧客QRコードではありません");
      return;
    }

    const userId = text.slice(PREFIX.length);

    // APIで顧客情報を取得（store_id照合も行われる）
    setScanning(true);
    try {
      const res = await fetch(`/api/coupon/users/scan?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error || "顧客情報を取得できませんでした");
      } else {
        setScannedUser(data);
        setSuccessMsg("");
        setErrorMsg("");
      }
    } catch {
      setScanError("通信エラーが発生しました。もう一度お試しください");
    } finally {
      setScanning(false);
    }
  }, []);

  // 付与ボタン押下時の処理
  const handleSubmit = async () => {
    if (!scannedUser) {
      setErrorMsg("先にQRコードを読み取って顧客を選択してください");
      return;
    }
    if (!ticketId) {
      setErrorMsg("回数券の種類を選択してください");
      return;
    }
    if (count < 1) {
      setErrorMsg("付与回数は1以上を入力してください");
      return;
    }
    if (!staffName.trim()) {
      setErrorMsg("スタッフ名を入力してください");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("理由を入力してください");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/coupon/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: scannedUser.id,
          ticketId,
          count,
          staffName: staffName.trim(),
          reason: reason.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "付与に失敗しました");
      } else {
        // 成功したらフォームをリセット
        const ticketName = tickets.find((t) => t.id === ticketId)?.name ?? "";
        setSuccessMsg(`✅ ${scannedUser.email} に「${ticketName}」を${count}回付与しました`);
        setScannedUser(null);
        setCount(1);
        setStaffName("");
        setReason("回数券購入");
      }
    } catch {
      setErrorMsg("通信エラーが発生しました。もう一度お試しください");
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">回数券付与</h1>
      </header>
      <HomeButton href="/store" />

      {/* QRスキャナーオーバーレイ */}
      {showScanner && (
        <CouponQrScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="p-4 pb-24 space-y-4 max-w-sm mx-auto">

        {/* 成功メッセージ */}
        {successMsg && (
          <div className="bg-green-50 rounded-xl p-4 shadow">
            <p className="text-green-700 text-base font-bold">{successMsg}</p>
          </div>
        )}

        {/* STEP 1：顧客をQRコードで特定 */}
        <div className="bg-white rounded-xl p-4 shadow space-y-3">
          <p className="font-bold text-gray-800 text-base">① お客様を特定する</p>

          <button
            onClick={() => {
              setScanError("");
              setShowScanner(true);
            }}
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3"
            style={{ minHeight: "56px" }}
          >
            <span style={{ fontSize: "22px" }}>📷</span>
            <span>QRコードを読み取る</span>
          </button>

          {/* スキャン中インジケーター */}
          {scanning && (
            <p className="text-gray-500 text-base text-center">確認中...</p>
          )}

          {/* スキャンエラー */}
          {scanError && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-600 text-base font-bold">読み取りエラー</p>
              <p className="text-red-500 text-base">{scanError}</p>
            </div>
          )}

          {/* スキャン成功：顧客情報を表示 */}
          {scannedUser && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-700 text-base font-bold mb-1">✅ お客様を確認しました</p>
              <p className="text-gray-700 text-base">{scannedUser.email}</p>
              <button
                onClick={() => {
                  setScannedUser(null);
                  setScanError("");
                  setShowScanner(true);
                }}
                className="mt-2 text-blue-500 text-base underline"
              >
                別のQRコードを読み取る
              </button>
            </div>
          )}
        </div>

        {/* STEP 2：付与する内容を入力 */}
        <div className="bg-white rounded-xl p-4 shadow space-y-4">
          <p className="font-bold text-gray-800 text-base">② 付与内容を入力する</p>

          {/* 回数券の種類 */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              回数券の種類 <span className="text-red-500">*</span>
            </label>
            {tickets.length === 0 ? (
              <p className="text-gray-400 text-base">
                回数券が登録されていません。先に回数券を設定してください。
              </p>
            ) : (
              <select
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800 bg-white"
              >
                <option value="">選択してください</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.count}回）
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 付与回数 */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              付与回数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              inputMode="numeric"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800"
            />
          </div>

          {/* スタッフ名 */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              スタッフ名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="例：田中"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800"
            />
          </div>

          {/* 理由 */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              理由 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="例：回数券購入"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800"
            />
          </div>

          {/* エラーメッセージ */}
          {errorMsg && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-600 text-base">{errorMsg}</p>
            </div>
          )}

          {/* 付与ボタン */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-base"
            style={{ minHeight: "56px", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "付与中..." : "回数券を付与する"}
          </button>
        </div>
      </div>
    </div>
  );
}
