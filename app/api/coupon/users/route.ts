import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

// POST /api/coupon/users
// スタッフによる顧客代理登録
// 登録時に password_changed = false で保存（顧客が初回ログイン時にパスワード変更を求める）
export async function POST(req: NextRequest) {
  const session = await getSession()

  // 店舗セッションのみ許可（スタッフのみが代理登録できる）
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: '店舗ログインが必要です' }, { status: 401 })
  }

  const { email, tempPassword, confirmPassword } = await req.json()

  // 必須項目チェック
  if (!email || !tempPassword || !confirmPassword) {
    return NextResponse.json({ error: 'メールアドレスと仮パスワードを入力してください' }, { status: 400 })
  }

  // メールアドレス形式チェック
  if (!email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
  }

  // 仮パスワードの一致チェック
  if (tempPassword !== confirmPassword) {
    return NextResponse.json({ error: '仮パスワードが一致しません' }, { status: 400 })
  }

  // 仮パスワードの長さチェック（8文字以上）
  if (tempPassword.length < 8) {
    return NextResponse.json({ error: '仮パスワードは8文字以上にしてください' }, { status: 400 })
  }

  // 同じ店舗に同じメールアドレスがすでに登録されていないか確認
  const existing = await prisma.couponUser.findFirst({
    where: { storeId: session.storeId, email },
  })
  if (existing) {
    return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 })
  }

  // 仮パスワードを暗号化して保存
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  // 顧客を代理登録（password_changed = false：初回ログイン時にパスワード変更を求める）
  const user = await prisma.couponUser.create({
    data: {
      email,
      passwordHash,
      passwordChanged: false, // 代理登録なので未変更フラグを付ける
      role: 'customer',
      storeId: session.storeId, // store_idはセッションから取得（クライアントから受け取らない）
    },
  })

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 })
}
