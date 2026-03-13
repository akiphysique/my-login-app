import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  return NextResponse.json({
    type: session.type,
    storeId: session.storeId,
    customerId: session.customerId,
    name: session.name,
    storeName: session.storeName,
    storeAddress: session.storeAddress,
  })
}
