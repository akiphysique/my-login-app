import { PrismaClient } from '@prisma/client'

// グローバル変数にPrismaClientを保持する（Next.jsの開発時ホットリロードで接続が増えすぎないようにする）
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
