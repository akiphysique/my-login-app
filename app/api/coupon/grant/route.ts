import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// POST /api/coupon/grant
// 顧客に回数券を付与する
// 入力：{ userId, ticketId, count, staffName, reason }
export async function POST(req: NextRequest) {
  const session = await getSession()

  // 店舗セッションのみ許可
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: '店舗ログインが必要です' }, { status: 401 })
  }

  // リクエストボディを取得
  let body: { userId?: unknown; ticketId?: unknown; count?: unknown; staffName?: unknown; reason?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 })
  }

  const { userId, ticketId, count, staffName, reason } = body

  // バリデーション（入力チェック）
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: '顧客が選択されていません' }, { status: 400 })
  }
  if (!ticketId || typeof ticketId !== 'string') {
    return NextResponse.json({ error: '回数券の種類を選択してください' }, { status: 400 })
  }
  if (!count || typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
    return NextResponse.json({ error: '付与回数は1以上の整数を入力してください' }, { status: 400 })
  }
  if (!staffName || typeof staffName !== 'string' || staffName.trim() === '') {
    return NextResponse.json({ error: 'スタッフ名を入力してください' }, { status: 400 })
  }
  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    return NextResponse.json({ error: '理由を入力してください' }, { status: 400 })
  }

  // 顧客の所属店舗を確認（他店舗への付与を防ぐ）
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

  // 回数券の種類が自店舗のものか確認
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { storeId: true, name: true },
  })

  if (!ticket || ticket.storeId !== session.storeId) {
    return NextResponse.json({ error: '指定された回数券が見つかりません' }, { status: 404 })
  }

  // トランザクションで残数更新＋履歴記録を一括処理（どちらかだけ成功する状態を防ぐ）
  await prisma.$transaction(async (tx) => {
    // user_tickets に既存レコードがあれば更新、なければ新規作成
    const existing = await tx.userTicket.findFirst({
      where: { userId, ticketId, storeId: session.storeId! },
    })

    if (existing) {
      // 既存の残数に付与回数を加算
      await tx.userTicket.update({
        where: { id: existing.id },
        data: { remainingCount: { increment: count } },
      })
    } else {
      // 初めてこの種類の回数券を付与する場合は新規作成
      await tx.userTicket.create({
        data: {
          userId,
          ticketId,
          storeId: session.storeId!,
          remainingCount: count,
        },
      })
    }

    // 付与の操作履歴を記録（不正防止のため必須）
    await tx.ticketLog.create({
      data: {
        userId,
        ticketId,
        storeId: session.storeId!,
        change: count,           // 付与は正の数（例：+5）
        staffName: staffName.trim(),
        reason: reason.trim(),
      },
    })
  })

  return NextResponse.json({ ok: true })
}
