-- AlterEnum
ALTER TYPE "DiscountType" ADD VALUE 'FREE_DELIVERY';

-- AlterTable
ALTER TABLE "DiscountCode" ADD COLUMN     "description" TEXT,
ADD COLUMN     "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "storeId" TEXT;

-- CreateIndex
CREATE INDEX "DiscountCode_storeId_isActive_idx" ON "DiscountCode"("storeId", "isActive");

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
