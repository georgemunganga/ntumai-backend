-- CreateTable
CREATE TABLE "store_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_favorites_userId_idx" ON "store_favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "store_favorites_userId_storeId_key" ON "store_favorites"("userId", "storeId");

-- AddForeignKey
ALTER TABLE "store_favorites" ADD CONSTRAINT "store_favorites_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_favorites" ADD CONSTRAINT "store_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
