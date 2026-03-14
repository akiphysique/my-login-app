"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HomeButton from "@/components/HomeButton";

// Stripe URLの形式チェック（buy.stripe.com または stripe.com のみ許可）
const STRIPE_URL_PATTERN = /^https:\/\/(buy\.stripe\.com|stripe\.com)\//;

// 回数券マスタの型
interface Ticket {
  id: string;
  name: string;
  count: number;
  stripeLink: string | null;
  qrDataUrl?: string; // QRコード画像（クライアント側で生成）
}

// QRコードをStripe URLから生成してdata URLとして返す（クライアントサイド）
async function generateQrFromUrl(url: string): Promise<string> {
  const QRCode = await import("qrcode");
  return QRCode.default.toDataURL(url, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

// 回数券設定ページ
// 店舗が回数券の種類を登録・管理する
export default function CouponTicketsPage() {
  const [ready, setReady] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // 新規作成フォームの入力値
  const [name, setName] = useState("");
  const [count, setCount] = useState(1);
  const [stripeLink, setStripeLink] = useState("");

  // フォーム入力中のプレビューQR
  const [previewQr, setPreviewQr] = useState("");

  // 送信状態
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const router = useRouter();

  // 回数券一覧を取得してQRコードも生成する
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupon/tickets");
      const data = await res.json();
      if (!data.tickets) return;

      // 各チケットのStripe URLからQRコードを生成
      const withQr: Ticket[] = await Promise.all(
        data.tickets.map(async (t: Ticket) => {
          if (t.stripeLink) {
            try {
              const qrDataUrl = await generateQrFromUrl(t.stripeLink);
              return { ...t, qrDataUrl };
            } catch {
              return t;
            }
          }
          return t;
        })
      );
      setTickets(withQr);
    } catch {
      // 取得失敗時は空リストのまま
    } finally {
      setLoading(false);
    }
  }, []);

  // セッション確認 → 一覧取得
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.type !== "store") { router.push("/"); return; }
        setReady(true);
        fetchTickets();
      })
      .catch(() => {});
  }, [router, fetchTickets]);

  // stripeLink の入力が変わるたびにプレビューQRを生成
  useEffect(() => {
    if (!stripeLink || !STRIPE_URL_PATTERN.test(stripeLink)) {
      setPreviewQr("");
      return;
    }
    generateQrFromUrl(stripeLink)
      .then(setPreviewQr)
      .catch(() => setPreviewQr(""));
  }, [stripeLink]);

  // 新規作成フォームの送信処理
  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    // フロントエンド側バリデーション
    if (!name.trim()) {
      setErrorMsg("回数券名を入力してください");
      return;
    }
    if (count < 1 || !Number.isInteger(count)) {
      setErrorMsg("回数は1以上の整数を入力してください");
      return;
    }
    if (!stripeLink.trim()) {
      setErrorMsg("Stripe支払いリンクを入力してください");
      return;
    }
    if (!STRIPE_URL_PATTERN.test(stripeLink.trim())) {
      setErrorMsg(
        "Stripe支払いリンクは https://buy.stripe.com/ または https://stripe.com/ で始まるURLを入力してください"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/coupon/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          count,
          stripeLink: stripeLink.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "登録に失敗しました");
      } else {
        setSuccessMsg(`「${name.trim()}」を登録しました`);
        // フォームをリセット
        setName("");
        setCount(1);
        setStripeLink("");
        setPreviewQr("");
        // 一覧を再取得
        await fetchTickets();
      }
    } catch {
      setErrorMsg("通信エラーが発生しました。もう一度お試しください");
    } finally {
      setSubmitting(false);
    }
  };

  // QRコードをPNG画像としてダウンロードする
  const handleDownload = (qrDataUrl: string, ticketName: string) => {
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${ticketName}-QRコード.png`;
    a.click();
  };

  // QRコードを印刷用ウィンドウで開いて印刷する
  const handlePrint = (qrDataUrl: string, ticketName: string, ticketCount: number) => {
    const win = window.open("", "_blank");
    if (!win) {
      alert("ポップアップがブロックされました。ブラウザの設定を確認してください。");
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="utf-8" />
          <title>${ticketName} QRコード</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            h2 { font-size: 24px; margin-bottom: 8px; }
            p { font-size: 16px; color: #555; margin-bottom: 20px; }
            img { width: 280px; height: 280px; }
          </style>
        </head>
        <body>
          <h2>${ticketName}</h2>
          <p>${ticketCount}回券 ／ QRコードをスキャンしてお支払いください</p>
          <img src="${qrDataUrl}" alt="${ticketName} QRコード" />
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
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
        <h1 className="font-bold text-gray-800 text-base">回数券設定</h1>
      </header>
      <HomeButton href="/store" />

      <div className="p-4 pb-24 space-y-6 max-w-sm mx-auto">

        {/* 新規作成フォーム */}
        <div className="bg-white rounded-xl p-4 shadow space-y-4">
          <p className="font-bold text-gray-800 text-base">回数券を新規登録</p>

          {/* 成功メッセージ */}
          {successMsg && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-green-700 text-base font-bold">{successMsg}</p>
            </div>
          )}

          {/* 回数券名 */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              回数券名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：5回券"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800"
            />
          </div>

          {/* 回数 */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              回数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              inputMode="numeric"
              placeholder="例：5"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800"
            />
          </div>

          {/* Stripe支払いリンク */}
          <div>
            <label className="block text-gray-700 text-base mb-1">
              Stripe支払いリンク <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={stripeLink}
              onChange={(e) => setStripeLink(e.target.value)}
              placeholder="https://buy.stripe.com/..."
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-800"
            />
            <p className="text-gray-400 text-sm mt-1">
              https://buy.stripe.com/ または https://stripe.com/ で始まるURLを入力してください
            </p>
          </div>

          {/* プレビューQRコード（URLを入力したら自動表示） */}
          {previewQr && (
            <div className="text-center pt-2">
              <p className="text-gray-500 text-base mb-2">QRコードプレビュー</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewQr}
                alt="QRコードプレビュー"
                style={{ width: 180, height: 180, margin: "0 auto", display: "block" }}
              />
            </div>
          )}

          {/* エラーメッセージ */}
          {errorMsg && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-red-600 text-base">{errorMsg}</p>
            </div>
          )}

          {/* 登録ボタン */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold text-base"
            style={{ minHeight: "56px", opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? "登録中..." : "回数券を登録する"}
          </button>
        </div>

        {/* 登録済み回数券一覧 */}
        <div className="space-y-4">
          <p className="font-bold text-gray-800 text-base">登録済みの回数券</p>

          {loading ? (
            <p className="text-gray-400 text-base text-center">読み込み中...</p>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-xl p-4 shadow">
              <p className="text-gray-400 text-base text-center">
                まだ回数券が登録されていません
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-xl p-4 shadow space-y-3">
                {/* 回数券の基本情報 */}
                <div>
                  <p className="font-bold text-gray-800 text-lg">{ticket.name}</p>
                  <p className="text-gray-500 text-base">{ticket.count}回券</p>
                  {ticket.stripeLink && (
                    <p className="text-gray-400 text-sm break-all mt-1">{ticket.stripeLink}</p>
                  )}
                </div>

                {/* QRコード表示とボタン */}
                {ticket.qrDataUrl ? (
                  <div className="text-center">
                    <p className="text-gray-500 text-base mb-2">Stripe支払いQRコード</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ticket.qrDataUrl}
                      alt={`${ticket.name} QRコード`}
                      style={{ width: 200, height: 200, margin: "0 auto", display: "block" }}
                    />

                    {/* ダウンロード・印刷ボタン */}
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => handleDownload(ticket.qrDataUrl!, ticket.name)}
                        className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-lg text-base font-bold"
                        style={{ minHeight: "48px" }}
                      >
                        ⬇ ダウンロード
                      </button>
                      <button
                        onClick={() => handlePrint(ticket.qrDataUrl!, ticket.name, ticket.count)}
                        className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-lg text-base font-bold"
                        style={{ minHeight: "48px" }}
                      >
                        🖨 印刷
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-base text-center">
                    Stripe URLが設定されていません
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
