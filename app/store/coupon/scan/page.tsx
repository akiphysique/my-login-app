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

// スキャンで取得した顧客情報の型
interface ScannedUser {
  id: string;
  email: string;
  role: string;
}

// 回数券システム：スタッフ用QRコード読み取りページ
// お客様のスマホ画面にあるQRコードを読み取り、顧客を特定する
export default function CouponScanPage() {
  const [ready, setReady] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedUser, setScannedUser] = useState<ScannedUser | null>(null);
  const [scanError, setScanError] = useState("");
  const [looking, setLooking] = useState(false);
  const router = useRouter();

  // セッション確認（店舗ログインのみ許可）
  useEffect(() => {
    fetch("/api/session").then((r) => r.json()).then((data) => {
      if (data.type !== "store") { router.push("/"); return; }
      setReady(true);
    });
  }, [router]);

  // QRコードスキャン成功時の処理
  const handleScan = useCallback(async (text: string) => {
    // スキャナーを閉じる
    setShowScanner(false);
    setScanError("");
    setScannedUser(null);

    // マタキテのQRコードかどうかチェック（プレフィックス確認）
    const PREFIX = "matakite-coupon-user:";
    if (!text.startsWith(PREFIX)) {
      setScanError("このQRコードはマタキテの顧客QRコードではありません");
      return;
    }

    // ユーザーIDを抽出
    const userId = text.slice(PREFIX.length);

    // APIで顧客情報を取得（store_id照合も行われる）
    setLooking(true);
    try {
      const res = await fetch(`/api/coupon/users/scan?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!res.ok) {
        setScanError(data.error || "顧客情報を取得できませんでした");
      } else {
        setScannedUser(data);
      }
    } catch {
      setScanError("通信エラーが発生しました。もう一度お試しください");
    } finally {
      setLooking(false);
    }
  }, []);

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
        <h1 className="font-bold text-gray-800 text-base">QRコードでお客様特定</h1>
      </header>
      <HomeButton href="/store" />

      {/* QRスキャナー（カメラ起動オーバーレイ） */}
      {showScanner && (
        <CouponQrScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="p-4 pb-24 space-y-4 max-w-sm mx-auto">

        {/* 操作説明 */}
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-gray-700 text-base">
            お客様のスマホ画面にあるQRコードを読み取ることで、
            お客様を特定できます。
          </p>
        </div>

        {/* QR読み取りボタン */}
        <button
          onClick={() => {
            setScannedUser(null);
            setScanError("");
            setShowScanner(true);
          }}
          className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3"
          style={{ minHeight: "60px" }}
        >
          <span style={{ fontSize: "24px" }}>📷</span>
          <span>QRコードを読み取る</span>
        </button>

        {/* 読み取り中インジケーター */}
        {looking && (
          <div className="bg-white rounded-xl p-4 shadow text-center">
            <p className="text-gray-500 text-base">顧客情報を確認中...</p>
          </div>
        )}

        {/* エラーメッセージ */}
        {scanError && (
          <div className="bg-red-50 rounded-xl p-4 shadow">
            <p className="text-red-600 text-base font-bold mb-1">読み取りエラー</p>
            <p className="text-red-500 text-base">{scanError}</p>
            <button
              onClick={() => {
                setScanError("");
                setShowScanner(true);
              }}
              className="mt-3 w-full bg-red-500 text-white py-2 rounded-lg text-base font-bold"
            >
              もう一度読み取る
            </button>
          </div>
        )}

        {/* スキャン成功：顧客情報を表示して確認 */}
        {scannedUser && (
          <div className="bg-green-50 rounded-xl p-5 shadow">
            <p className="text-green-700 text-base font-bold mb-3">
              ✅ お客様を確認しました
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-base">メールアドレス：</span>
                <span className="font-bold text-gray-800 text-base">{scannedUser.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-base">ユーザーID：</span>
                <span className="text-gray-600 text-sm font-mono break-all">{scannedUser.id}</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              ※ お客様本人であることをご確認のうえ操作してください
            </p>
            <button
              onClick={() => {
                setScannedUser(null);
                setShowScanner(true);
              }}
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg text-base font-bold"
            >
              別のQRコードを読み取る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
