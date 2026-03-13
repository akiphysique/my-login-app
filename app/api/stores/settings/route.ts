import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

// PATCH: パスワードを変更する
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  // 店舗セッションのみ許可
  if (session.type !== 'store' || !session.storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  // バリデーション（必須チェック）
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: '現在のパスワードと新しいパスワードを入力してください' }, { status: 400 })
  }

  // パスワードの長さチェック
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上にしてください' }, { status: 400 })
  }

  // 現在のパスワードを確認
  const store = await prisma.store.findUnique({ where: { id: session.storeId } })
  if (!store || !(await bcrypt.compare(currentPassword, store.passwordHash))) {
    return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 })
  }

  // 新しいパスワードをハッシュ化して保存
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.store.update({ where: { id: session.storeId }, data: { passwordHash } })

  return NextResponse.json({ ok: true })
}
