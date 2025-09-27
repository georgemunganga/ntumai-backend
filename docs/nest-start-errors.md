# Nest Start TypeScript Errors

This document records the TypeScript errors observed when running `npx nest start` on the `main` branch during debugging.

## Summary
- 3,730 TypeScript errors were reported on the latest run (see `npx nest start` output captured on 2024-05-09).
- Primary categories involve mismatched DTO/controller response shapes, outdated repository implementations referencing legacy domain APIs, and security logging interfaces.

## Key Error Buckets
1. **Marketplace gift card persistence**
   - File: `src/modules/marketplace/infrastructure/repositories/promotion.repository.impl.ts`
   - Issues: references to `GiftCard` getters such as `getMessage()` and `getStatus()` that no longer exist on the domain entity.
   - Suggested fix: align the repository with the current `GiftCard` entity (use `message`, `status`, `expiryDate`, etc.).

2. **Marketplace controllers vs DTOs**
   - Files: `brands.controller.ts`, `cart.controller.ts`, `gift-cards.controller.ts`, `orders.controller.ts`.
   - Issues: controllers return properties (`totalProducts`, `tax`, `stockIssues`, etc.) not defined in DTO contracts, and repositories still expect method-based accessors (`getStock()`, `getLowStockThreshold()`, etc.) on `Product` entities that are now exposed as getters.
   - Suggested fix: update DTO definitions or controller responses so the API contracts stay consistent, and refactor repositories to use the exposed accessors without invoking them as functions.

3. **Security communication and logging**
   - Files: `security-communication.service.ts`, `security-logger.service.ts`, `token.service.ts`.
   - Issues: logging interface signature mismatches, Prisma service access to a non-existent `securityLog` model, and refresh-token schema assumptions (e.g., `sessionId`).
   - Suggested fix: reconcile interfaces with implementations, add guards/casts for optional Prisma models, and update the token service to match the current Prisma schema.

4. **Drivers performance tracking**
   - File: `drivers/domain/services/performance-tracking.service.ts`
   - Issue: exported interface references a private type alias `ReliabilityPerformanceMetrics`.
   - Suggested fix: export the underlying type or adjust interface exposure.

## Next Steps
- Prioritize fixing shared infrastructure (e.g., `SecurityLogger`/`ISecurityLogger`) to unblock dependent services.
- Refactor marketplace repositories to match the updated domain entities to prevent cascading DTO/controller issues.
- Adjust OTP integration examples so that `ValidateOtpRequest` payloads omit `userId`, and update calls expecting plain strings to handle optional `otpCode` values safely.
- After code adjustments, rerun `npx nest start` to verify the reduction or elimination of TypeScript errors.
