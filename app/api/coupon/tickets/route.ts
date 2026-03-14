import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// Stripe支払いリンクのURLバリデーション（仕様：buy.stripe.com または stripe.com のみ許可）
const STRIPE_URL_PATTERN = /^https:\/\/(buy\.stripe\.com|stripe\.com)\//

// GET /api/coupon/tickets
// 自店舗の回数券マスタ（種類一覧）を取得する
// 付与・消化・設定ページで使用（stripeLink含む）
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
      stripeLink: true,   // 設定ページでQR生成に使用するため追加
    },
  })

  return NextResponse.json({ tickets })
}

// POST /api/coupon/tickets
// 新しい回数券を登録する
// 入力：{ name, count, stripeLink }
export async function POST(req: NextRequest) {
  const session = await getSession()

  // 店舗セッションのみ許可
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: '店舗ログインが必要です' }, { status: 401 })
  }

  // リクエストボディを取得
  let body: { name?: unknown; count?: unknown; stripeLink?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 })
  }

  const { name, count, stripeLink } = body

  // バリデーション（入力チェック）
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: '回数券名を入力してください' }, { status: 400 })
  }
  if (!count || typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
    return NextResponse.json({ error: '回数は1以上の整数を入力してください' }, { status: 400 })
  }
  if (!stripeLink || typeof stripeLink !== 'string' || stripeLink.trim() === '') {
    return NextResponse.json({ error: 'Stripe支払いリンクを入力してください' }, { status: 400 })
  }

  // Stripe URLの形式チェック（不正なURLを防ぐ）
  if (!STRIPE_URL_PATTERN.test(stripeLink.trim())) {
    return NextResponse.json(
      { error: 'Stripe支払いリンクは https://buy.stripe.com/ または https://stripe.com/ で始まるURLを入力してください' },
      { status: 400 }
    )
  }

  // 回数券を新規作成（storeIdはセッションから取得・クライアントからは受け取らない）
  const ticket = await prisma.ticket.create({
    data: {
      storeId: session.storeId,
      name: name.trim(),
      count,
      stripeLink: stripeLink.trim(),
    },
  })

  return NextResponse.json({ ticket }, { status: 201 })
}
