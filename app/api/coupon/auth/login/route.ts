import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

// POST /api/coupon/auth/login
// 回数券システム用ログイン（顧客・スタッフ共通）
export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  // 必須項目チェック
  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 })
  }

  // ユーザーをメールアドレスで検索（店舗情報も一緒に取得）
  const user = await prisma.couponUser.findFirst({
    where: { email },
    include: { store: true },
  })

  // ユーザーが存在しない、またはパスワードが違う場合はエラー
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが違います' }, { status: 401 })
  }

  // セッションに回数券ユーザー情報を保存
  const session = await getSession()
  session.type = 'coupon'
  session.couponUserId = user.id
  session.couponUserRole = user.role
  session.couponPasswordChanged = user.passwordChanged
  session.storeId = user.storeId
  session.storeName = user.store.name
  session.storeAddress = user.store.address
  await session.save()

  // パスワード未変更（代理登録）の場合はフロントに通知して変更画面へ誘導
  return NextResponse.json({
    ok: true,
    passwordChanged: user.passwordChanged,
  })
}
