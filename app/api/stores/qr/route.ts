import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import QRCode from 'qrcode'
import { randomUUID } from 'crypto'

// GET: QRコードデータURLを返す
export async function GET(req: NextRequest) {
  const session = await getSession()
  // 店舗セッションのみ許可
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    select: { storeToken: true },
  })
  if (!store) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // トークンがない場合は自動生成して保存
  let token = store.storeToken
  if (!token) {
    token = randomUUID()
    await prisma.store.update({ where: { id: session.storeId }, data: { storeToken: token } })
  }

  // 自己登録URLを組み立てる（開発時はhttp、本番はhttps）
  const host = req.headers.get('host') ?? 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const registrationUrl = `${protocol}://${host}/register?token=${token}`

  // QRコードを画像データURL（Base64 PNG）として生成
  const qrDataUrl = await QRCode.toDataURL(registrationUrl, { width: 300, margin: 2 })

  return NextResponse.json({ qrDataUrl, registrationUrl, token })
}

// POST: QRトークンを再発行する
export async function POST() {
  const session = await getSession()
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 新しいトークンを生成して保存
  const newToken = randomUUID()
  await prisma.store.update({ where: { id: session.storeId }, data: { storeToken: newToken } })

  return NextResponse.json({ ok: true })
}
