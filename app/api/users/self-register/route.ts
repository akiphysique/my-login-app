import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET: トークンを検証して店舗名・住所を返す（フォーム表示前に呼ぶ）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'トークンが必要です' }, { status: 400 })
  }

  // トークンに対応する店舗を検索
  const store = await prisma.store.findUnique({
    where: { storeToken: token },
    select: { name: true, address: true },
  })

  if (!store) {
    return NextResponse.json({ error: '無効なトークンです' }, { status: 404 })
  }

  return NextResponse.json({ storeName: store.name, storeAddress: store.address })
}

// POST: QRコード経由でお客様が自己登録する
export async function POST(req: NextRequest) {
  const { token, name, email, phone, password } = await req.json()

  // 必須項目のバリデーション
  if (!token || !name || !email || !phone) {
    return NextResponse.json({ error: 'お名前・メールアドレス・電話番号は必須です' }, { status: 400 })
  }

  // メールアドレスの形式チェック（簡易）
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
  }

  // トークンからstoreIdを取得（クライアントからstore_idは受け取らない）
  const store = await prisma.store.findUnique({ where: { storeToken: token } })
  if (!store) {
    return NextResponse.json({ error: '無効なトークンです。お店のスタッフにお声がけください' }, { status: 400 })
  }

  // 同じ店舗に同じメールアドレスがすでに登録されていないか確認
  const existing = await prisma.customer.findFirst({
    where: { storeId: store.id, email },
  })
  if (existing) {
    return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 })
  }

  // パスワードをハッシュ化（指定なければデフォルトを使用）
  const passwordHash = await bcrypt.hash(password || 'matakite123', 10)

  // 顧客を登録（registeredBy = "self" で自己登録を識別）
  const customer = await prisma.customer.create({
    data: {
      storeId: store.id,
      name,
      email,
      phone,
      registeredBy: 'self',
      passwordHash,
    },
  })

  return NextResponse.json({ ok: true, customerId: customer.id }, { status: 201 })
}
