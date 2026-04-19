-- CreateTable
CREATE TABLE "earnings_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earnings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "earnings_goals_userId_status_createdAt_idx" ON "earnings_goals"("userId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "earnings_goals" ADD CONSTRAINT "earnings_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
