import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// POST /api/coupon/auth/logout
// 回数券システム用ログアウト
export async function POST() {
  const session = await getSession()
  session.destroy() // セッション情報をすべて削除
  return NextResponse.json({ ok: true })
}
