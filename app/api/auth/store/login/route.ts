import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const store = await prisma.store.findUnique({ where: { email } })
  if (!store || !(await bcrypt.compare(password, store.passwordHash))) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが違います' }, { status: 401 })
  }
  const session = await getSession()
  session.type = 'store'
  session.storeId = store.id
  session.name = store.name
  session.storeName = store.name
  session.storeAddress = store.address
  await session.save()
  return NextResponse.json({ ok: true })
}
