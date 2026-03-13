"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";

export default function QRPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const router = useRouter();

  // QRコードを読み込む関数
  const loadQR = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/stores/qr");
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setQrDataUrl(data.qrDataUrl);
    setRegistrationUrl(data.registrationUrl);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // セッション確認してからQRを読み込む
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.type !== "store") { router.push("/"); return; }
        loadQR();
      });
  }, [router, loadQR]);

  // QRトークンを再発行する
  const handleRegenerate = async () => {
    if (!confirm("QRコードを再発行しますか？\n古いQRコードは使えなくなります。")) return;
    setRegenerating(true);
    await fetch("/api/stores/qr", { method: "POST" });
    await loadQR();
    setRegenerating(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-base">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
        <Link href="/store" className="text-blue-500 text-base">← 戻る</Link>
        <h1 className="font-bold text-gray-800 text-base">QR登録</h1>
      </header>
      <HomeButton href="/store" />
      <div className="p-4 pb-24 space-y-4">

        {/* QRコード表示 */}
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <p className="text-gray-700 text-base mb-4">
            お客様にこのQRコードをスキャンしていただいてください。
          </p>
          {qrDataUrl && (
            <div className="flex justify-center mb-4">
              {/* QRコード画像（サーバー側で生成済みのBase64 PNG） */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="お客様登録用QRコード" className="w-64 h-64" />
            </div>
          )}
          <p className="text-gray-500 text-base">
            ※ お客様のスマホからスキャンすると登録フォームが開きます
          </p>
        </div>

        {/* 登録URL表示（参考用） */}
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-gray-600 text-base mb-2">登録URL（参考）</p>
          <p className="text-gray-800 text-base break-all bg-gray-50 p-3 rounded-lg">{registrationUrl}</p>
        </div>

        {/* 再発行ボタン */}
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-base disabled:opacity-50"
        >
          {regenerating ? "再発行中..." : "QRコードを再発行する"}
        </button>
        <p className="text-gray-400 text-base text-center">
          ※ 再発行すると古いQRコードは使えなくなります
        </p>
      </div>
    </div>
  );
}
