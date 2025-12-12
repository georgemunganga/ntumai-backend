# Module Structure Analysis: Staging vs Main Branch

## Overview
This document compares the module structures between the `staging` and `main` branches to identify which modules can be integrated.

## Staging Branch Modules (DDD Architecture)
The staging branch uses a Domain-Driven Design (DDD) pattern with the following structure:
- `src/` (flat structure with modules at root level)
  - auth/
  - communications/
  - deliveries/
  - marketplace/ (contains: cart, catalog, orders, promotions, reviews, vendor)
  - matching/
  - notifications/
  - orders/
  - payments/
  - pricing/
  - shared/
  - shifts/
  - tracking/
  - user/

### Staging Module Structure (DDD Pattern)
Each module follows:
```
module/
├── application/
│   ├── dtos/
│   └── services/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── value-objects/
├── infrastructure/
│   ├── adapters/
│   ├── repositories/
│   └── websocket/
├── presentation/
│   └── controllers/
└── module.ts
```

## Main Branch Modules (Current Structure)
The main branch uses a different organization:
- `src/modules/` (grouped structure)
  - auth/
  - communication/
  - customers/
  - kafka/
  - kyc/
  - location/
  - notifications/
  - orders/
  - payments/
  - pricing/
  - products/
  - ratings/
  - taskers/
  - tasks/
  - transactions/
  - users/
  - vendors/
  - wallets/

## Module Compatibility Analysis

### Modules Present in Both (Can be Merged)
1. **auth** - Both have authentication
2. **communications/communication** - Email/notification services
3. **notifications** - Push notifications
4. **orders** - Order management
5. **payments** - Payment processing
6. **pricing** - Price calculations
7. **users/user** - User management

### Staging-Only Modules (Valuable for Integration)
1. **deliveries** - Delivery tracking and management
2. **marketplace** - E-commerce features (cart, catalog, promotions, reviews, vendor)
3. **matching** - Order matching engine with WebSocket support
4. **shifts** - Shift management for delivery personnel
5. **tracking** - Real-time tracking with WebSocket
6. **shared** - Common utilities and configurations

### Main-Only Modules (Unique to Current Implementation)
1. **customers** - Customer management
2. **kafka** - Event streaming
3. **kyc** - Know Your Customer verification
4. **location** - Location services
5. **products** - Product catalog
6. **ratings** - Review ratings
7. **taskers** - Tasker/worker management
8. **tasks** - Task management
9. **transactions** - Transaction history
10. **vendors** - Vendor management
11. **wallets** - Digital wallet functionality

## Recommended Integration Strategy

### Phase 1: Copy Staging Modules (Non-Conflicting)
These modules don't exist in main and should be copied as-is:
- [ ] deliveries/
- [ ] marketplace/ (with all sub-modules)
- [ ] matching/
- [ ] shifts/
- [ ] tracking/
- [ ] shared/ (merge with existing shared/)

### Phase 2: Merge Conflicting Modules
These exist in both branches and need careful integration:
- [ ] auth/ - Merge DDD patterns with current implementation
- [ ] communications/ - Already integrated, verify compatibility
- [ ] notifications/ - Merge WebSocket support
- [ ] orders/ - Merge with existing orders module
- [ ] payments/ - Merge payment adapters
- [ ] pricing/ - Merge pricing logic
- [ ] users/user/ - Merge with users module

### Phase 3: Database Schema Integration
- [ ] Review and merge prisma/schema.prisma
- [ ] Create migration files for new tables
- [ ] Create seeders for initial data

## Database Schema Comparison

### Staging Schema (752 lines)
Key models:
- Address, Banner, Brand, Cart, CartItem, Category, Chat
- Delivery, DeliveryAssignment, DeliveryLocation
- DiscountCode, Favorite, Notification, Order, OrderItem
- Payment, PaymentIntent, PaymentSession
- Product, ProductImage, ProductVariant
- Review, Shift, Store, Tracking, User, UserRole
- Vendor, WalletTransaction

### Main Schema
Need to compare and identify differences

## Seeders and Migrations

### Staging Branch
- No dedicated seeder files found in staging
- Schema is in `prisma/schema.prisma`

### Main Branch
- Check for existing seeders
- Check for migration history

## Next Steps
1. Copy non-conflicting modules from staging
2. Analyze and merge conflicting modules
3. Merge database schemas
4. Create seeders for roles, initial data
5. Create migration files
6. Test module compatibility
7. Commit changes

## Notes
- Staging uses DDD pattern consistently
- Main uses a more traditional layered architecture
- Both use Prisma ORM
- Both use NestJS framework
- Staging has WebSocket support in multiple modules
- Main has some unique modules (KYC, Wallets, etc.)
