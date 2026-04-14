-- CreateEnum
CREATE TYPE "CustomerPaymentMethodType" AS ENUM ('CARD', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "MobileMoneyProvider" AS ENUM ('MTN', 'AIRTEL', 'ZAMTEL');

-- CreateTable
CREATE TABLE "customer_payment_methods" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CustomerPaymentMethodType" NOT NULL,
    "provider" "MobileMoneyProvider",
    "label" TEXT NOT NULL,
    "cardBrand" TEXT,
    "last4" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "cardholderName" TEXT,
    "phoneNumber" TEXT,
    "accountName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_payment_methods_userId_isDefault_idx" ON "customer_payment_methods"("userId", "isDefault");

-- AddForeignKey
ALTER TABLE "customer_payment_methods" ADD CONSTRAINT "customer_payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
