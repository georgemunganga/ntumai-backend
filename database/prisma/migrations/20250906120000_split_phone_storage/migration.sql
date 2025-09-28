-- DropIndex
DROP INDEX IF EXISTS "User_phone_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_countryCode_key" ON "public"."User"("phone", "countryCode");
