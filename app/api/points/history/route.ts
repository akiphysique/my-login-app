import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const where = session.type === 'store'
    ? { storeId: session.storeId }
    : { customerId: session.customerId! }
  const logs = await prisma.pointLog.findMany({
    where,
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json(logs)
}
