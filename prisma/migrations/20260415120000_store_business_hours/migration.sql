-- AlterTable
ALTER TABLE "Store" ADD COLUMN "autoOffline" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StoreBusinessHour" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreBusinessHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreHoliday" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreBusinessHour_storeId_dayOfWeek_key" ON "StoreBusinessHour"("storeId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "StoreBusinessHour_storeId_idx" ON "StoreBusinessHour"("storeId");

-- CreateIndex
CREATE INDEX "StoreHoliday_storeId_date_idx" ON "StoreHoliday"("storeId", "date");

-- AddForeignKey
ALTER TABLE "StoreBusinessHour" ADD CONSTRAINT "StoreBusinessHour_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreHoliday" ADD CONSTRAINT "StoreHoliday_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
