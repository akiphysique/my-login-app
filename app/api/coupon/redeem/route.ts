import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

// POST /api/coupon/redeem
// 顧客の回数券を消化する（残数を減らす）
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
    return NextResponse.json({ error: '消化回数は1以上の整数を入力してください' }, { status: 400 })
  }
  if (!staffName || typeof staffName !== 'string' || staffName.trim() === '') {
    return NextResponse.json({ error: 'スタッフ名を入力してください' }, { status: 400 })
  }
  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    return NextResponse.json({ error: '理由を入力してください' }, { status: 400 })
  }

  // 顧客の所属店舗を確認
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

  // 顧客の回数券残数を取得
  const userTicket = await prisma.userTicket.findFirst({
    where: { userId, ticketId, storeId: session.storeId },
  })

  if (!userTicket) {
    return NextResponse.json({ error: 'この顧客はこの種類の回数券を持っていません' }, { status: 400 })
  }

  // 残数チェック（仕様：残り0の場合は消化を禁止する）
  if (userTicket.remainingCount < count) {
    return NextResponse.json(
      { error: `残り回数が不足しています（残り${userTicket.remainingCount}回）` },
      { status: 400 }
    )
  }

  // トランザクションで残数更新＋履歴記録を一括処理
  await prisma.$transaction(async (tx) => {
    // 残数を消化回数分だけ減算
    await tx.userTicket.update({
      where: { id: userTicket.id },
      data: { remainingCount: { decrement: count } },
    })

    // 消化の操作履歴を記録（変化量は負の数）
    await tx.ticketLog.create({
      data: {
        userId,
        ticketId,
        storeId: session.storeId!,
        change: -count,          // 消化は負の数（例：-1）
        staffName: staffName.trim(),
        reason: reason.trim(),
      },
    })
  })

  return NextResponse.json({ ok: true })
}
