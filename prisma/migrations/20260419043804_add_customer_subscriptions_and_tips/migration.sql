-- CreateTable
CREATE TABLE "customer_tips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "deliveryId" TEXT,
    "bookingId" TEXT,
    "driverId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ZMW',
    "orderTotal" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryAddress" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextDeliveryDate" TIMESTAMP(3) NOT NULL,
    "lastDeliveryDate" TIMESTAMP(3),
    "pausedUntil" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "totalSaved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_tips_userId_createdAt_idx" ON "customer_tips"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "customer_tips_orderId_idx" ON "customer_tips"("orderId");

-- CreateIndex
CREATE INDEX "customer_tips_deliveryId_idx" ON "customer_tips"("deliveryId");

-- CreateIndex
CREATE INDEX "customer_tips_bookingId_idx" ON "customer_tips"("bookingId");

-- CreateIndex
CREATE INDEX "customer_tips_driverId_idx" ON "customer_tips"("driverId");

-- CreateIndex
CREATE INDEX "customer_subscriptions_userId_status_createdAt_idx" ON "customer_subscriptions"("userId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "customer_tips" ADD CONSTRAINT "customer_tips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tips" ADD CONSTRAINT "customer_tips_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tips" ADD CONSTRAINT "customer_tips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
