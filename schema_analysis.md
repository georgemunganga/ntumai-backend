# Prisma Schema Analysis - Missing Elements for API Requirements

## Analysis Overview
This document identifies missing fields, models, and relationships in the current Prisma schema compared to the API requirements.

## Current Schema Models
- User (with UserRole enum)
- Category
- Brand
- Store
- Product
- ProductVariant
- Order (with OrderStatus enum)
- OrderItem
- Payment (with PaymentStatus, PaymentMethod enums)
- DeliveryAssignment (with DeliveryStatus enum)
- Task (with TaskStatus, TaskType enums)
- Notification (with NotificationType enum)
- Chat
- LoyaltyPoint
- Reward (with RewardType enum)
- Promotion (with PromotionType enum)
- Review (with ReviewEntityType enum)

## MISSING MODELS

### 1. Address Model
**Required by APIs:** User Profile, Address Management, Checkout
**Current Status:** Referenced in comments but not implemented
**Required Fields:**
```prisma
model Address {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  type       String   // home, work, other
  address    String
  city       String
  state      String
  country    String
  postalCode String?
  latitude   Float
  longitude  Float
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### 2. Banner Model
**Required by APIs:** Home Page Data, Marketplace Data
**Current Status:** Missing entirely
**Required Fields:**
```prisma
model Banner {
  id         String   @id @default(uuid())
  imageUrl   String
  title      String
  subtitle   String?
  actionText String?
  actionUrl  String?
  type       String
  isActive   Boolean  @default(true)
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### 3. Favorite Model
**Required by APIs:** Toggle Favorite, Get Favorites
**Current Status:** Missing entirely
**Required Fields:**
```prisma
model Favorite {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  createdAt DateTime @default(now())
  
  @@unique([userId, productId])
}
```

### 4. Cart Model
**Required by APIs:** Cart Management
**Current Status:** Missing entirely
**Required Fields:**
```prisma
model Cart {
  id        String     @id @default(uuid())
  userId    String     @unique
  user      User       @relation(fields: [userId], references: [id])
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id             String @id @default(uuid())
  cartId         String
  cart           Cart   @relation(fields: [cartId], references: [id])
  productId      String
  product        Product @relation(fields: [productId], references: [id])
  quantity       Int
  variantOptions Json?  // Store variant selections
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([cartId, productId])
}
```

### 5. DiscountCode/Coupon Model
**Required by APIs:** Apply Discount Code, Remove Discount
**Current Status:** Missing entirely
**Required Fields:**
```prisma
model DiscountCode {
  id            String    @id @default(uuid())
  code          String    @unique
  type          String    // percentage, fixed
  value         Float
  minOrderValue Float?
  maxDiscount   Float?
  usageLimit    Int?
  usedCount     Int       @default(0)
  isActive      Boolean   @default(true)
  startDate     DateTime
  endDate       DateTime
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### 6. OTP/Verification Model
**Required by APIs:** Register, Verify OTP, Forgot Password
**Current Status:** Missing entirely
**Required Fields:**
```prisma
model OTPVerification {
  id          String    @id @default(uuid())
  identifier  String    // phone or email
  otp         String
  type        String    // registration, login, password_reset
  requestId   String?   @unique
  isVerified  Boolean   @default(false)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
}
```

### 7. DeviceSession Model
**Required by APIs:** Login, Logout, Refresh Token
**Current Status:** Missing entirely
**Required Fields:**
```prisma
model DeviceSession {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  deviceId     String
  deviceType   String
  refreshToken String    @unique
  isActive     Boolean   @default(true)
  lastUsedAt   DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  @@unique([userId, deviceId])
}
```

## MISSING FIELDS IN EXISTING MODELS

### User Model Missing Fields
- `profileImage: String?` (for profile image URL)
- `countryCode: String?` (for phone number country code)
- `isEmailVerified: Boolean @default(false)`
- `isPhoneVerified: Boolean @default(false)`
- `lastLoginAt: DateTime?`

### Product Model Missing Fields
- `discountedPrice: Float?` (for promotional pricing)
- `discountPercentage: Float?` (calculated field or stored)
- `tags: String[]` (for product tags)
- `isActive: Boolean @default(true)` (for product status)
- `averageRating: Float?` (calculated from reviews)
- `reviewCount: Int @default(0)` (count of reviews)

### Store Model Missing Fields
- `vendorId: String` (reference to vendor user)
- `vendor: User @relation(fields: [vendorId], references: [id])`
- `imageUrl: String?` (store image)
- `isActive: Boolean @default(true)`
- `averageRating: Float?` (calculated from reviews)

### Order Model Missing Fields
- `trackingId: String @unique` (for order tracking)
- `discountAmount: Float @default(0)` (applied discount)
- `discountCode: String?` (applied discount code)
- `deliveryFee: Float @default(0)`
- `tax: Float @default(0)`
- `subtotal: Float` (before discount and fees)

### Brand Model Missing Fields
- `isActive: Boolean @default(true)`

### Category Model Missing Fields
- `isActive: Boolean @default(true)`

## MISSING RELATIONSHIPS

1. **User ↔ Address**: One-to-many relationship (completely missing)
2. **User ↔ Favorite**: One-to-many relationship (completely missing)
3. **User ↔ Cart**: One-to-one relationship (completely missing)
4. **User ↔ DeviceSession**: One-to-many relationship (completely missing)
5. **Store ↔ User**: Many-to-one (vendor relationship) - Store needs vendorId field
6. **Product ↔ Favorite**: One-to-many relationship (completely missing)
7. **Product ↔ CartItem**: One-to-many relationship (completely missing)
8. **User ↔ Review**: Missing "DriverReviews" relation in User model (referenced in Review but not defined)
9. **Store ↔ Review**: One-to-many relationship (missing in Store model)

## EXISTING RELATIONSHIP ISSUES

1. **Review Model**: References `User @relation("DriverReviews")` but User model doesn't define this relation
2. **Task Model**: Has `assignedDriver` relation but uses same User model without proper relation name
3. **DeliveryAssignment**: References `driver` but User model doesn't have corresponding relation

## ENUM UPDATES NEEDED

### UserRole Enum
- **Current**: `CUSTOMER, DRIVER, VENDOR, ADMIN`
- **API expects**: Based on API requirements, roles are referenced as:
  - `customer` (for marketplace APIs)
  - `rider`/`driver` (for delivery)
  - `seller`/`vendor` (for store management)
- **Issue**: Case mismatch and terminology differences
- **Action**: Either update enum values to lowercase or handle mapping in application layer

### OrderStatus Enum
- **Current**: `PENDING, ACCEPTED, PREPARING, PACKING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED, COMPLETED`
- **API expects**: Based on API requirements:
  - `PENDING` (initial state)
  - `IN_PROGRESS` (covers ACCEPTED, PREPARING, PACKING, OUT_FOR_DELIVERY)
  - `DELIVERED` (final success state)
  - `CANCELLED` (cancellation state)
- **Issue**: Too granular status values for API requirements
- **Action**: Either simplify enum or create mapping logic

### PaymentStatus Enum
- **Current**: `PENDING, PAID, REFUNDED, FAILED`
- **API expects**: Appears to align with current values
- **Status**: ✅ No changes needed

### PaymentMethod Enum
- **Current**: `CREDIT_CARD, DEBIT_CARD, MOBILE_MONEY, CASH_ON_DELIVERY, OTHER`
- **API expects**: Based on requirements, payment methods include card payments and mobile money
- **Status**: ✅ Appears adequate, may need regional adjustments

### DeliveryStatus Enum
- **Current**: `PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED`
- **API expects**: Detailed tracking status for real-time updates
- **Status**: ✅ Appears comprehensive for delivery tracking

### Missing Enums
- **DiscountType**: `PERCENTAGE, FIXED_AMOUNT` (for discount codes)
- **AddressType**: `HOME, WORK, OTHER` (for address management)
- **BannerType**: `PROMOTIONAL, CATEGORY, PRODUCT` (for banner management)
- **OTPType**: `REGISTRATION, LOGIN, PASSWORD_RESET` (for OTP verification)

## PRIORITY RECOMMENDATIONS

### High Priority (Required for MVP)
1. **Address Model** - Critical for user profiles and checkout
2. **Cart Models** - Essential for e-commerce functionality
3. **Favorite Model** - Core user experience feature
4. **OTP Model** - Required for authentication flow
5. **Missing User fields** - profileImage, verification flags
6. **Missing Product fields** - discountedPrice, rating fields
7. **Missing Order fields** - trackingId, discount fields

### Medium Priority
1. **Banner Model** - For marketing and promotions
2. **DiscountCode Model** - For promotional campaigns
3. **DeviceSession Model** - For better session management
4. **Store vendor relationship** - For vendor management

### Low Priority
1. **Additional enum alignments** - Can be handled in application layer initially
2. **Additional metadata fields** - Can be added incrementally

## COMPREHENSIVE SUMMARY OF MISSING ELEMENTS

### Critical Missing Models (7 models)
1. **Address** - User addresses for delivery and billing
2. **Banner** - Marketing banners for home page
3. **Favorite** - User favorite products
4. **Cart & CartItem** - Shopping cart functionality
5. **DiscountCode** - Promotional discount codes
6. **OTPVerification** - Phone/email verification
7. **DeviceSession** - Device-based session management

### Missing Fields in Existing Models (15+ fields)
- **User**: profileImage, countryCode, isEmailVerified, isPhoneVerified, lastLoginAt
- **Product**: discountedPrice, discountPercentage, tags, isActive, averageRating, reviewCount
- **Store**: vendorId, vendor relation, imageUrl, isActive, averageRating
- **Order**: trackingId, discountAmount, discountCode, deliveryFee, tax, subtotal
- **Brand**: isActive
- **Category**: isActive

### Missing Relationships (9+ relationships)
- User ↔ Address, Favorite, Cart, DeviceSession
- Store ↔ User (vendor), Review
- Product ↔ Favorite, CartItem
- Existing relationship issues in Review, Task, and DeliveryAssignment models

### Enum Issues (4 enums + 4 missing)
- **UserRole**: Case mismatch with API expectations
- **OrderStatus**: Too granular for API requirements
- **Missing Enums**: DiscountType, AddressType, BannerType, OTPType

### Database Impact Assessment
- **New Tables**: 7 new models requiring migration
- **Schema Changes**: 15+ new columns across existing tables
- **Relationship Updates**: 9+ new foreign key constraints
- **Index Requirements**: New indexes for performance (user favorites, cart items, etc.)

## IMPLEMENTATION ROADMAP

### Phase 1: Core E-commerce Features (Week 1)
1. **Address Model** - Critical for checkout and delivery
2. **Cart Models** - Essential for shopping functionality
3. **Favorite Model** - Core user experience
4. **Missing User fields** - Profile management
5. **Missing Product fields** - Product display and pricing

### Phase 2: Authentication & Security (Week 2)
1. **OTP Model** - Phone/email verification
2. **DeviceSession Model** - Session management
3. **Missing Order fields** - Order tracking and pricing

### Phase 3: Marketing & Promotions (Week 3)
1. **Banner Model** - Marketing content
2. **DiscountCode Model** - Promotional campaigns
3. **Store vendor relationship** - Vendor management

### Phase 4: Data Integrity & Performance (Week 4)
1. **Fix existing relationship issues**
2. **Enum alignment or mapping**
3. **Database indexes and constraints**
4. **Data migration and seeding**

## NEXT STEPS
1. Implement Phase 1 models and fields
2. Create database migration scripts
3. Update Prisma client generation
4. Implement API endpoints for new models
5. Update existing endpoints to use new fields
6. Create seed data for new models
7. Test all changes thoroughly