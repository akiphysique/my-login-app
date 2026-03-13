import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getSession()
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const customers = await prisma.customer.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, phone: true, points: true, memo: true, createdAt: true },
  })
  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name, email, phone, memo, password } = await req.json()
  if (!name || !email || !phone) {
    return NextResponse.json({ error: '名前・メール・電話番号は必須です' }, { status: 400 })
  }
  const passwordHash = await bcrypt.hash(password || 'changeme123', 10)
  const customer = await prisma.customer.create({
    data: { storeId: session.storeId, name, email, phone, memo: memo || null, registeredBy: 'store', passwordHash },
  })
  return NextResponse.json(customer, { status: 201 })
}
