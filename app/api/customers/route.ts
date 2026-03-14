import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

// 電話番号のバリデーション（数字とハイフンのみ許可）
const PHONE_REGEX = /^[0-9-]+$/

export async function GET() {
  const session = await getSession()
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const customers = await prisma.customer.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, furigana: true, email: true, phone: true, points: true, memo: true, createdAt: true },
  })
  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, furigana, email, phone, memo, password } = await req.json()

  // 必須項目チェック
  if (!name || !furigana || !email || !password) {
    return NextResponse.json({ error: '氏名・フリガナ・メールアドレス・パスワードは必須です' }, { status: 400 })
  }

  // メールアドレス形式チェック
  if (!email.includes('@') || !email.includes('.')) {
    return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
  }

  // 電話番号バリデーション（入力された場合のみ）
  if (phone && !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: '電話番号は数字とハイフンのみ使用できます' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const customer = await prisma.customer.create({
    data: {
      storeId: session.storeId,
      name,
      furigana,
      email,
      phone: phone || null,       // 任意項目：空の場合はnull
      memo: memo || null,
      registeredBy: 'store',
      passwordHash,
    },
  })
  return NextResponse.json(customer, { status: 201 })
}
