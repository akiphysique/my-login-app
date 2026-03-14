import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// 電話番号のバリデーション（数字とハイフンのみ許可）
const PHONE_REGEX = /^[0-9-]+$/

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
  const { token, name, furigana, email, phone, password } = await req.json()

  // 必須項目のバリデーション
  if (!token || !name || !furigana || !email) {
    return NextResponse.json({ error: 'お名前・フリガナ・メールアドレスは必須です' }, { status: 400 })
  }

  // メールアドレスの形式チェック
  if (!email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
  }

  // 電話番号バリデーション（入力された場合のみ）
  if (phone && !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: '電話番号は数字とハイフンのみ使用できます' }, { status: 400 })
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

  // お客様を登録（registeredBy = "self" で自己登録を識別）
  const customer = await prisma.customer.create({
    data: {
      storeId: store.id,
      name,
      furigana,
      email,
      phone: phone || null,       // 任意項目：空の場合はnull
      registeredBy: 'self',
      passwordHash,
    },
  })

  return NextResponse.json({ ok: true, customerId: customer.id }, { status: 201 })
}
