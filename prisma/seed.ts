import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const storeHash = await bcrypt.hash('password123', 10)
  const customerHash = await bcrypt.hash('customer123', 10)

  const store = await prisma.store.upsert({
    where: { email: 'salon@example.com' },
    update: {},
    create: {
      name: 'サンプルサロン',
      address: '東京都杉並区荻窪1-2-3',
      email: 'salon@example.com',
      passwordHash: storeHash,
      storeToken: 'sample-store-token-abc123', // QR自己登録用トークン
    },
  })

  const customer = await prisma.customer.upsert({
    where: { id: 'customer-seed-1' },
    update: {},
    create: {
      id: 'customer-seed-1',
      storeId: store.id,
      name: '山田太郎',
      email: 'yamada@example.com',
      phone: '090-1234-5678',
      points: 120,
      passwordHash: customerHash,
    },
  })

  await prisma.pointLog.createMany({
    data: [
      { customerId: customer.id, storeId: store.id, amount: 100, staffName: 'スタッフA', memo: '紙カード移行分' },
      { customerId: customer.id, storeId: store.id, amount: 20, staffName: 'スタッフB', memo: '来店ポイント' },
    ],
  })

  console.log('Seed complete.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
