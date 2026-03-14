import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST /api/coupon/register
// 顧客自身による新規登録
// 登録時に password_changed = true で保存（自分で設定したパスワードのため）
export async function POST(req: NextRequest) {
  const { token, email, password, confirmPassword } = await req.json()

  // 必須項目チェック
  if (!token || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: 'すべての項目を入力してください' }, { status: 400 })
  }

  // メールアドレス形式チェック
  if (!email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
  }

  // パスワードの一致チェック
  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'パスワードが一致しません' }, { status: 400 })
  }

  // パスワードの長さチェック（8文字以上）
  if (password.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 })
  }

  // トークンから店舗を特定（storeIdはクライアントから受け取らない）
  const store = await prisma.store.findUnique({ where: { storeToken: token } })
  if (!store) {
    return NextResponse.json({ error: '無効なQRコードです。店舗スタッフにお声がけください' }, { status: 400 })
  }

  // 同じ店舗に同じメールアドレスがすでに登録されていないか確認
  const existing = await prisma.couponUser.findFirst({
    where: { storeId: store.id, email },
  })
  if (existing) {
    return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 })
  }

  // パスワードを暗号化して保存
  const passwordHash = await bcrypt.hash(password, 10)

  // 顧客を登録（password_changed = true：自分で設定したパスワードのため変更不要）
  await prisma.couponUser.create({
    data: {
      email,
      passwordHash,
      passwordChanged: true, // 自己登録なので最初から変更済み扱い
      role: 'customer',
      storeId: store.id,
    },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
