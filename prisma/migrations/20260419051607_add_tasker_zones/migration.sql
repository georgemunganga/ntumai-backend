-- CreateTable
CREATE TABLE "tasker_zones" (
    "id" TEXT NOT NULL,
    "riderUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasker_zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasker_zones_riderUserId_isActive_idx" ON "tasker_zones"("riderUserId", "isActive");

-- AddForeignKey
ALTER TABLE "tasker_zones" ADD CONSTRAINT "tasker_zones_riderUserId_fkey" FOREIGN KEY ("riderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
