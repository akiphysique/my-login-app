import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const customer = await prisma.customer.findFirst({ where: { email }, include: { store: true } })
  if (!customer || !(await bcrypt.compare(password, customer.passwordHash))) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが違います' }, { status: 401 })
  }
  const session = await getSession()
  session.type = 'customer'
  session.storeId = customer.storeId
  session.customerId = customer.id
  session.name = customer.name
  session.storeName = customer.store.name
  session.storeAddress = customer.store.address
  await session.save()
  return NextResponse.json({ ok: true })
}
