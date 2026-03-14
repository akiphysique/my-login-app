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

// 顧客が持っている回数券（残数込み）の型
interface UserTicket {
  id: string;
  remainingCount: number;
  ticket: {
    id: string;
    name: string;
    count: number;
  };
}

// QRスキャンで取得した顧客情報の型
interface ScannedUser {
  id: string;
  email: string;
}

// 回数券消化ページ
// スタッフが顧客のQRコードを読み取り、回数券を消化（使用）する
export default function CouponRedeemPage() {
  const [ready, setReady] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // フォームの入力値
  const [ticketId, setTicketId] = useState("");
  const [count, setCount] = useState(1);
  const [staffName, setStaffName] = useState("");
  const [reason, setReason] = useState("施術1回分");

  // 送信状態
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  // セッション確認
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.type !== "store") { router.push("/"); return; }
        setReady(true);
      })
      .catch(() => {});
  }, [router]);

  // 顧客の回数券残数一覧を取得する
  const fetchUserTickets = useCallback(async (userId: string) => {
    setLoadingTickets(true);
    setUserTickets([]);
    setTicketId("");
    try {
      const res = await fetch(`/api/coupon/user-tickets?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (res.ok && data.userTickets) {
        setUserTickets(data.userTickets);
        // 残数が1枚以上の種類だけを候補にして、1種類なら自動選択
        const available = data.userTickets.filter((ut: UserTicket) => ut.remainingCount > 0);
        if (available.length === 1) {
          setTicketId(available[0].ticket.id);
        }
      }
    } catch {
      // 取得失敗時はエラーを出さず空のまま（UIで「なし」と表示）
    } finally {
      setLoadingTickets(false);
    }
  }, []);

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
        // 顧客特定後、その顧客の回数券残数を取得
        fetchUserTickets(data.id);
      }
    } catch {
      setScanError("通信エラーが発生しました。もう一度お試しください");
    } finally {
      setScanning(false);
    }
  }, [fetchUserTickets]);

  // 消化ボタン押下時の処理
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
      setErrorMsg("消化回数は1以上を入力してください");
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
      const res = await fetch("/api/coupon/redeem", {
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
        setErrorMsg(data.error || "消化に失敗しました");
      } else {
        // 成功したらフォームをリセット
        const ut = userTickets.find((ut) => ut.ticket.id === ticketId);
        const ticketName = ut?.ticket.name ?? "";
        const newRemaining = (ut?.remainingCount ?? count) - count;
        setSuccessMsg(`✅ ${scannedUser.email} の「${ticketName}」を${count}回消化しました（残り${newRemaining}回）`);
        setScannedUser(null);
        setUserTickets([]);
        setTicketId("");
        setCount(1);
        setStaffName("");
        setReason("施術1回分");
      }
    } catch {
      setErrorMsg("通信エラーが発生しました。もう一度お試しください");
    } finally {
      setSubmitting(false);
    }
  };

  // 消化可能な回数券（残数1以上）だけをフィルタ
  const availableTickets = userTickets.filter((ut) => ut.remainingCount > 0);

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
        <h1 className="font-bold text-gray-800 text-base">回数券消化</h1>
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
                  setUserTickets([]);
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

        {/* STEP 2：消化する内容を入力 */}
        <div className="bg-white rounded-xl p-4 shadow space-y-4">
          <p className="font-bold text-gray-800 text-base">② 消化内容を入力する</p>

          {/* 回数券の種類（顧客が持っているもののみ表示） */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              回数券の種類 <span className="text-red-500">*</span>
            </label>
            {!scannedUser ? (
              <p className="text-gray-400 text-base">先にQRコードを読み取ってください</p>
            ) : loadingTickets ? (
              <p className="text-gray-400 text-base">読み込み中...</p>
            ) : availableTickets.length === 0 ? (
              <p className="text-red-500 text-base">
                このお客様は使用できる回数券を持っていません
              </p>
            ) : (
              <select
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800 bg-white"
              >
                <option value="">選択してください</option>
                {availableTickets.map((ut) => (
                  <option key={ut.ticket.id} value={ut.ticket.id}>
                    {ut.ticket.name}（残り{ut.remainingCount}回）
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 消化回数 */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              消化回数 <span className="text-red-500">*</span>
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
              placeholder="例：施術1回分"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800"
            />
          </div>

          {/* エラーメッセージ */}
          {errorMsg && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-600 text-base">{errorMsg}</p>
            </div>
          )}

          {/* 消化ボタン */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-base"
            style={{ minHeight: "56px", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "消化中..." : "回数券を消化する"}
          </button>
        </div>
      </div>
    </div>
  );
}
