# Database Migration Guide

## Overview
This document outlines the database migrations needed to integrate staging modules into the main branch.

## Prisma Schema Integration

### Current Status
- ✅ Staging schema.prisma has been integrated (752 lines)
- ✅ Contains all models for: deliveries, marketplace, matching, shifts, tracking
- ✅ Uses PostgreSQL with Prisma Client

### Key Models Included

#### E-Commerce Models
- **Product** - Product catalog with variants and images
- **Category** - Product categories
- **Brand** - Product brands
- **Cart** - Shopping cart management
- **CartItem** - Items in cart
- **Order** - Customer orders
- **OrderItem** - Items in orders
- **Review** - Product reviews
- **Favorite** - User favorites

#### Delivery Models
- **Delivery** - Delivery orders
- **DeliveryAssignment** - Delivery assignments to drivers
- **DeliveryLocation** - Delivery location tracking
- **Tracking** - Real-time tracking events

#### User & Account Models
- **User** - User accounts
- **UserRole** - User roles and permissions
- **Address** - Delivery addresses
- **Store** - Vendor stores
- **Vendor** - Vendor information

#### Payment & Transaction Models
- **Payment** - Payment records
- **PaymentIntent** - Payment intents
- **PaymentSession** - Payment sessions
- **WalletTransaction** - Wallet transactions

#### Marketplace Models
- **Shift** - Delivery shifts
- **Notification** - User notifications
- **Chat** - Chat messages
- **Banner** - Marketing banners
- **DiscountCode** - Discount codes

## Migration Steps

### Step 1: Generate Prisma Client
```bash
npm run prisma:generate
```

### Step 2: Create Database Migrations
```bash
npm run prisma:migrate:dev -- --name initial_schema
```

### Step 3: Run Seeders
```bash
npm run prisma:seed
```

### Step 4: Verify Database
```bash
npm run prisma:studio
```

## Seeding Strategy

### Initial Data to Seed
1. **Categories** - Product categories (Electronics, Clothing, Food, Home)
2. **Brands** - Product brands (TechPro, StyleMax, FreshFoods)
3. **Delivery Zones** - Geographic delivery zones
4. **Shift Templates** - Default shift configurations
5. **Discount Codes** - Promotional codes

### Seeder Files
- `prisma/seed.ts` - Main seeder for categories, brands
- `prisma/seed-auth.ts` - User roles and permissions seeder

## Running Migrations

### Development Environment
```bash
# Create and apply migrations
npm run prisma:migrate:dev

# Reset database (WARNING: Deletes all data)
npm run prisma:migrate:reset

# View database in Prisma Studio
npm run prisma:studio
```

### Production Environment
```bash
# Apply existing migrations
npm run prisma:migrate:deploy

# Create migration without applying
npm run prisma:migrate:create -- --name migration_name
```

## Enum Types

The schema uses several enums:

### AddressType
- HOME
- OFFICE
- OTHER

### BannerType
- PROMOTIONAL
- INFORMATIONAL
- FEATURED

### DeliveryStatus
- PENDING
- ASSIGNED
- IN_TRANSIT
- DELIVERED
- CANCELLED

### OrderStatus
- PENDING
- CONFIRMED
- PROCESSING
- READY_FOR_PICKUP
- IN_TRANSIT
- DELIVERED
- CANCELLED

### PaymentStatus
- PENDING
- PROCESSING
- COMPLETED
- FAILED
- REFUNDED

### UserRole
- CUSTOMER
- VENDOR
- DELIVERY_PARTNER
- ADMIN

## Indexes

Key indexes have been created for:
- `addresses` - userId, isDefault
- `orders` - userId, status, createdAt
- `deliveries` - status, assignedDriverId
- `products` - categoryId, storeId
- `users` - email, phone

## Backup & Recovery

### Backup Database
```bash
# PostgreSQL backup
pg_dump DATABASE_URL > backup.sql
```

### Restore Database
```bash
# PostgreSQL restore
psql DATABASE_URL < backup.sql
```

## Troubleshooting

### Migration Conflicts
If migrations conflict:
1. Check git history for conflicting changes
2. Resolve conflicts in schema.prisma
3. Create new migration: `npm run prisma:migrate:dev -- --name resolve_conflict`

### Seeding Failures
If seeding fails:
1. Check database connection
2. Verify all required tables exist
3. Check for unique constraint violations
4. Review seed.ts for errors

### Prisma Client Out of Sync
```bash
npm run prisma:generate
```

## Next Steps
1. Run migrations in development
2. Test all modules with new schema
3. Run seeders for initial data
4. Verify database integrity
5. Deploy to staging environment
6. Run migrations in production

## Related Documentation
- See `MODULES_ANALYSIS.md` for module structure
- See `CHANGES_SUMMARY.md` for SMTP configuration
- See individual module READMEs for specific requirements
