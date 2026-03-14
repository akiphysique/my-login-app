import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import QRCode from 'qrcode'

// GET /api/coupon/qr/me
// ログイン中の顧客専用QRコードを生成して返す
// QRコードにはユーザーIDを埋め込む（スタッフが読み取り顧客を特定するため）
export async function GET() {
  const session = await getSession()

  // 回数券ユーザーのセッションのみ許可
  if (session.type !== 'coupon' || !session.couponUserId) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  // QRコードにユーザーIDを埋め込む
  // プレフィックスを付けてマタキテ専用と識別できるようにする
  const qrContent = `matakite-coupon-user:${session.couponUserId}`

  // QRコードを画像データURL（Base64 PNG）として生成
  const qrDataUrl = await QRCode.toDataURL(qrContent, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M',
  })

  return NextResponse.json({ qrDataUrl, userId: session.couponUserId })
}
