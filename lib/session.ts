import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  type?: 'store' | 'customer'
  storeId?: string
  customerId?: string
  name?: string
  storeName?: string
  storeAddress?: string
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
