"use client";

import { useEffect, useRef, useState } from "react";

// QRスキャナーコンポーネントのプロパティ型
interface CouponQrScannerProps {
  // スキャン成功時：読み取ったテキストを渡す
  onScan: (text: string) => void;
  // スキャン終了（カメラを閉じる）
  onClose: () => void;
}

// 顧客QRコードを読み取るためのカメラスキャナー
// html5-qrcode を動的インポートして使用（SSR回避）
export default function CouponQrScanner({ onScan, onClose }: CouponQrScannerProps) {
  const containerId = "coupon-qr-reader";
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let html5Qrcode: unknown = null;

    // html5-qrcode はブラウザ専用のためサーバーサイドでは実行しない
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode(containerId);
      html5Qrcode = scanner;
      scannerRef.current = scanner;

      // 背面カメラを優先してQRコードスキャンを開始
      scanner
        .start(
          { facingMode: "environment" }, // 背面カメラ（スマホの外カメラ）
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            // スキャン成功：読み取った値をコールバックに渡す
            onScan(decodedText);
          },
          () => {
            // QRコードが検出されない間は何もしない（ログを出さない）
          }
        )
        .then(() => {
          setStarted(true);
        })
        .catch((err: unknown) => {
          // カメラへのアクセス許可が拒否された場合など
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("Permission")) {
            setError("カメラの使用を許可してください。ブラウザの設定から許可できます。");
          } else {
            setError("カメラを起動できませんでした。お使いのブラウザが対応しているか確認してください。");
          }
        });
    });

    // コンポーネントがアンマウントされたらカメラを停止
    return () => {
      if (html5Qrcode && (html5Qrcode as { isScanning?: boolean }).isScanning) {
        (html5Qrcode as { stop: () => Promise<void> }).stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="coupon-qr-scanner-overlay" onClick={onClose}>
      {/* ダイアログ本体（タップが背景に伝わらないよう stopPropagation） */}
      <div
        className="coupon-qr-scanner-box"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="coupon-qr-scanner-title">QRコードを読み取る</p>
        <p className="coupon-qr-scanner-desc">
          お客様のスマホ画面にあるQRコードを<br />枠内に合わせてください
        </p>

        {/* html5-qrcode がここにカメラ映像を描画する */}
        <div id={containerId} className="coupon-qr-video-area" />

        {/* エラーメッセージ */}
        {error && (
          <p className="coupon-qr-error">{error}</p>
        )}

        {/* 起動中のインジケーター */}
        {!started && !error && (
          <p className="coupon-qr-loading">カメラを起動中...</p>
        )}

        {/* 閉じるボタン */}
        <button onClick={onClose} className="coupon-qr-close-btn">
          キャンセル
        </button>
      </div>
    </div>
  );
}
