-- DropIndex
DROP INDEX "Review_customerId_idx";

-- DropIndex
DROP INDEX "Review_driverId_idx";

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "placed_by_role" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "courier_comment" TEXT,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_at" TIMESTAMP(3),
    "order_status" TEXT NOT NULL DEFAULT 'booked',
    "payment_method" TEXT,
    "payment_calc_payload" JSONB,
    "payment_calc_sig" TEXT,
    "payment_currency" TEXT,
    "payment_amount" DOUBLE PRECISION,
    "payment_expires_at" TIMESTAMP(3),
    "more_info" TEXT,
    "rider_id" TEXT,
    "ready_token" TEXT,
    "ready_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_stops" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "notes" TEXT,
    "geo" JSONB,
    "address" JSONB,
    "completed_at" TIMESTAMP(3),
    "proof_photo_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deliveries_created_by_user_id_placed_by_role_created_at_idx" ON "deliveries"("created_by_user_id", "placed_by_role", "created_at");

-- CreateIndex
CREATE INDEX "deliveries_rider_id_created_at_idx" ON "deliveries"("rider_id", "created_at");

-- CreateIndex
CREATE INDEX "deliveries_order_status_created_at_idx" ON "deliveries"("order_status", "created_at");

-- CreateIndex
CREATE INDEX "deliveries_vehicle_type_order_status_idx" ON "deliveries"("vehicle_type", "order_status");

-- CreateIndex
CREATE INDEX "delivery_stops_delivery_id_sequence_idx" ON "delivery_stops"("delivery_id", "sequence");

-- AddForeignKey
ALTER TABLE "delivery_stops" ADD CONSTRAINT "delivery_stops_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
