-- ============================================================
-- Customerテーブルにfuriganaを追加・phoneをNULL許可に変更
-- ============================================================

-- furiganaカラムを追加（既存レコードはデフォルト空文字で補完）
ALTER TABLE "Customer" ADD COLUMN "furigana" TEXT NOT NULL DEFAULT '';

-- phoneをNULL許可に変更（任意項目のため）
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL;

-- ============================================================
-- 回数券テーブルを新規作成（coupon_spec.md セクション6）
-- ============================================================

-- 6.0 users：顧客・スタッフのアカウント情報
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChanged" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 6.1 tickets：回数券マスタ（種類・回数・Stripe URL）
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "stripeLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- 6.2 user_tickets：顧客の回数券残数（種類ごと）
CREATE TABLE "user_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "remainingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tickets_pkey" PRIMARY KEY ("id")
);

-- 6.3 ticket_logs：付与・消化の操作履歴
CREATE TABLE "ticket_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "staffName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_logs_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- 外部キー制約
-- ============================================================

ALTER TABLE "users" ADD CONSTRAINT "users_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tickets" ADD CONSTRAINT "tickets_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ticket_logs" ADD CONSTRAINT "ticket_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ticket_logs" ADD CONSTRAINT "ticket_logs_storeId_fkey"
    FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ticket_logs" ADD CONSTRAINT "ticket_logs_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
