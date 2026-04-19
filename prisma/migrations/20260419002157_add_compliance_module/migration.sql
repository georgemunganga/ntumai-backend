-- CreateTable
CREATE TABLE "compliance_cases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "strikeCount" INTEGER NOT NULL DEFAULT 0,
    "suspensionState" TEXT NOT NULL DEFAULT 'clear',
    "evidence" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_appeals" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_appeals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_cases_userId_role_status_idx" ON "compliance_cases"("userId", "role", "status");

-- CreateIndex
CREATE INDEX "compliance_cases_occurredAt_idx" ON "compliance_cases"("occurredAt");

-- CreateIndex
CREATE INDEX "compliance_appeals_caseId_createdAt_idx" ON "compliance_appeals"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "compliance_appeals_userId_createdAt_idx" ON "compliance_appeals"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "compliance_cases" ADD CONSTRAINT "compliance_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_appeals" ADD CONSTRAINT "compliance_appeals_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "compliance_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_appeals" ADD CONSTRAINT "compliance_appeals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
