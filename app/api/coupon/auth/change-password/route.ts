import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

// POST /api/coupon/auth/change-password
// 初回ログイン時のパスワード変更（代理登録ユーザー向け）
// 変更後に password_changed = true に更新する
export async function POST(req: NextRequest) {
  const session = await getSession()

  // ログイン済み（回数券ユーザー）のみ許可
  if (session.type !== 'coupon' || !session.couponUserId) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const { newPassword, confirmPassword } = await req.json()

  // 入力チェック
  if (!newPassword || !confirmPassword) {
    return NextResponse.json({ error: '新しいパスワードを入力してください' }, { status: 400 })
  }

  // パスワードの一致チェック
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'パスワードが一致しません' }, { status: 400 })
  }

  // パスワードの長さチェック（8文字以上）
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 })
  }

  // 新しいパスワードを暗号化して保存・password_changed を true に更新
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.couponUser.update({
    where: { id: session.couponUserId },
    data: {
      passwordHash,
      passwordChanged: true, // パスワード変更済みフラグを立てる
    },
  })

  // セッションのフラグも更新
  session.couponPasswordChanged = true
  await session.save()

  return NextResponse.json({ ok: true })
}
