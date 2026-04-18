ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_Driver_fkey";
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_Order_fkey";
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_Product_fkey";
ALTER TABLE "Review" DROP CONSTRAINT IF EXISTS "Review_Store_fkey";

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "contextType" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "contextId" TEXT;

UPDATE "Review"
SET "productId" = "entityId"
WHERE "entityType" = 'PRODUCT' AND "productId" IS NULL;

UPDATE "Review"
SET "storeId" = "entityId"
WHERE "entityType" = 'STORE' AND "storeId" IS NULL;

UPDATE "Review"
SET "orderId" = "entityId"
WHERE "entityType" = 'ORDER' AND "orderId" IS NULL;

UPDATE "Review"
SET "driverId" = "entityId"
WHERE "entityType" = 'DRIVER' AND "driverId" IS NULL;

UPDATE "Review"
SET "contextType" = 'order', "contextId" = "orderId"
WHERE "entityType" = 'ORDER' AND "orderId" IS NOT NULL AND "contextId" IS NULL;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Review_driverId_idx" ON "Review"("driverId");
