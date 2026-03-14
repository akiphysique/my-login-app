import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// GET /api/coupon/tickets
// 自店舗の回数券マスタ（種類一覧）を取得する
// 付与・消化ページで回数券の種類を選択するために使用
export async function GET() {
  const session = await getSession()

  // 店舗セッションのみ許可
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: '店舗ログインが必要です' }, { status: 401 })
  }

  const tickets = await prisma.ticket.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      count: true,
    },
  })

  return NextResponse.json({ tickets })
}
