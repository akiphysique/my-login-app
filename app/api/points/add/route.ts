import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { customerId, amount, staffName, memo } = await req.json()
  if (!customerId || !amount || !staffName) {
    return NextResponse.json({ error: 'customerId・amount・staffNameは必須です' }, { status: 400 })
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'amountは正の整数である必要があります' }, { status: 400 })
  }
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer || customer.storeId !== session.storeId) {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 403 })
  }
  await prisma.$transaction([
    prisma.pointLog.create({
      data: { customerId, storeId: session.storeId, amount, staffName, memo: memo || null },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: { points: { increment: amount } },
    }),
  ])
  return NextResponse.json({ ok: true }, { status: 201 })
}
