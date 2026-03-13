import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (session.type !== 'customer' || !session.customerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { id: true, name: true, points: true, email: true, phone: true },
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}
