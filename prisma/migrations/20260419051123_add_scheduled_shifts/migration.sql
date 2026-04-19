-- CreateTable
CREATE TABLE "scheduled_shifts" (
    "id" TEXT NOT NULL,
    "riderUserId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringDays" JSONB,
    "estimatedEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualEarnings" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_shifts_riderUserId_date_status_idx" ON "scheduled_shifts"("riderUserId", "date", "status");

-- AddForeignKey
ALTER TABLE "scheduled_shifts" ADD CONSTRAINT "scheduled_shifts_riderUserId_fkey" FOREIGN KEY ("riderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
