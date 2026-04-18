DO $$
BEGIN
  ALTER TYPE "ReviewEntityType" ADD VALUE 'CUSTOMER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Review_customerId_idx" ON "Review"("customerId");
