-- Harden OTP verification storage with hashed codes, attempt limits, and resend throttle metadata

-- OTP codes are ephemeral; remove existing rows to avoid mismatched hashing formats
DELETE FROM "OTPVerification";

ALTER TABLE "OTPVerification" RENAME COLUMN "otp" TO "otpHash";

ALTER TABLE "OTPVerification"
  ALTER COLUMN "requestId" SET NOT NULL;

ALTER TABLE "OTPVerification"
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "resendAvailableAt" TIMESTAMP(3),
  ADD COLUMN "consumedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "OTPVerification_identifier_type_idx"
  ON "OTPVerification" ("identifier", "type");
