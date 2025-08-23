/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "role",
ADD COLUMN     "currentRole" "public"."UserRole" NOT NULL DEFAULT 'CUSTOMER';

-- CreateTable
CREATE TABLE "public"."UserRole_Assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRole_Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRole_Assignment_userId_idx" ON "public"."UserRole_Assignment"("userId");

-- CreateIndex
CREATE INDEX "UserRole_Assignment_role_idx" ON "public"."UserRole_Assignment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_Assignment_userId_role_key" ON "public"."UserRole_Assignment"("userId", "role");

-- AddForeignKey
ALTER TABLE "public"."UserRole_Assignment" ADD CONSTRAINT "UserRole_Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
