import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/coupon/user-tickets?userId=xxx
// 顧客が持っている回数券の残数一覧を取得する
// 消化ページで「どの種類を消化するか」を選ぶために使用
export async function GET(req: NextRequest) {
  const session = await getSession()

  // 店舗セッションのみ許可（スタッフが操作するため）
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: '店舗ログインが必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 })
  }

  // 顧客の所属店舗を確認（他店舗の顧客は参照不可）
  const user = await prisma.couponUser.findUnique({
    where: { id: userId },
    select: { storeId: true },
  })

  if (!user) {
    return NextResponse.json({ error: '顧客が見つかりません' }, { status: 404 })
  }

  if (user.storeId !== session.storeId) {
    return NextResponse.json({ error: 'この顧客は別の店舗に所属しています' }, { status: 403 })
  }

  // 顧客の回数券残数一覧を取得（0枚でも表示する）
  const userTickets = await prisma.userTicket.findMany({
    where: { userId, storeId: session.storeId },
    include: {
      ticket: {
        select: { id: true, name: true, count: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ userTickets })
}
