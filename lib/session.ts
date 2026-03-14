import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  // 既存：店舗ログイン（type='store'）・お客様ログイン（type='customer'）
  type?: 'store' | 'customer' | 'coupon'
  storeId?: string
  customerId?: string
  name?: string
  storeName?: string
  storeAddress?: string
  // 回数券システム用：CouponUserのセッション情報
  couponUserId?: string
  couponUserRole?: string    // 'customer' または 'staff'
  couponPasswordChanged?: boolean  // false=パスワード未変更（代理登録時）
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'matakite-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}
