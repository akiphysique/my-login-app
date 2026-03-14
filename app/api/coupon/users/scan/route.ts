import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/coupon/users/scan?userId=xxx
// スタッフがQRコードを読み取った後、顧客情報を取得するAPI
// セキュリティ：自店舗の顧客のみ取得可能（store_idで照合）
export async function GET(req: NextRequest) {
  const session = await getSession()

  // 店舗セッションのみ許可（スタッフのみが顧客を検索できる）
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: '店舗ログインが必要です' }, { status: 401 })
  }

  // URLパラメータからユーザーIDを取得
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 })
  }

  // 顧客を検索
  const user = await prisma.couponUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      storeId: true,
      role: true,
    },
  })

  // 顧客が存在しない場合
  if (!user) {
    return NextResponse.json({ error: 'このQRコードは無効です' }, { status: 404 })
  }

  // 他店舗の顧客には使えないようにする（store_idで必ず照合）
  if (user.storeId !== session.storeId) {
    return NextResponse.json({ error: 'このQRコードはこの店舗では使用できません' }, { status: 403 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
  })
}
