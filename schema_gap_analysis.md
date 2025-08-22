# Schema Gap Analysis for New Modules

## Current Schema Status ✅

Our schema is comprehensive with 25+ models covering:
- User management with roles and authentication
- E-commerce functionality (Products, Orders, Cart, Payments)
- Delivery and task management
- Communication (Chat, Notifications)
- Loyalty and rewards system
- Reviews and ratings

## Missing Schema Components for New Modules

### 1. 🔴 **Onboarding Module** - Schema Gaps

**Missing Models:**
```prisma
enum OnboardingStepType {
  PROFILE_SETUP
  ROLE_SELECTION
  PAYMENT_METHOD
  DOCUMENT_UPLOAD
  TUTORIAL
  VERIFICATION
}

enum OnboardingStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

model OnboardingFlow {
  id          String             @id @default(uuid())
  userRole    UserRole
  steps       OnboardingStep[]
  isActive    Boolean            @default(true)
  version     String             @default("1.0")
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}

model OnboardingStep {
  id          String             @id @default(uuid())
  flowId      String
  flow        OnboardingFlow     @relation(fields: [flowId], references: [id])
  stepType    OnboardingStepType
  title       String
  description String?
  isRequired  Boolean            @default(true)
  sortOrder   Int
  config      Json?              // Step-specific configuration
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  
  @@index([flowId, sortOrder])
}

model UserOnboardingProgress {
  id          String            @id @default(uuid())
  userId      String
  user        User              @relation(fields: [userId], references: [id])
  stepId      String
  step        OnboardingStep    @relation(fields: [stepId], references: [id])
  status      OnboardingStatus  @default(NOT_STARTED)
  completedAt DateTime?
  data        Json?             // Step completion data
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  @@unique([userId, stepId])
  @@index([userId])
}
```

**Required User Model Enhancement:**
```prisma
// Add to User model:
onboardingCompleted Boolean @default(false)
onboardingProgress  UserOnboardingProgress[]
```

### 2. 🔴 **KYC Module** - Schema Gaps

**Missing Models:**
```prisma
enum DocumentType {
  NATIONAL_ID
  DRIVERS_LICENSE
  PASSPORT
  BUSINESS_REGISTRATION
  TAX_CERTIFICATE
  BANK_STATEMENT
  UTILITY_BILL
}

enum KYCStatus {
  NOT_STARTED
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

enum VerificationMethod {
  MANUAL
  AI_ASSISTED
  THIRD_PARTY_API
}

model KYCProfile {
  id              String        @id @default(uuid())
  userId          String        @unique
  user            User          @relation(fields: [userId], references: [id])
  status          KYCStatus     @default(NOT_STARTED)
  submittedAt     DateTime?
  reviewedAt      DateTime?
  approvedAt      DateTime?
  rejectedAt      DateTime?
  expiresAt       DateTime?
  reviewerId      String?       // Admin who reviewed
  reviewer        User?         @relation("KYCReviewer", fields: [reviewerId], references: [id])
  rejectionReason String?
  documents       KYCDocument[]
  verifications   KYCVerification[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([status])
  @@index([userId])
}

model KYCDocument {
  id          String       @id @default(uuid())
  kycId       String
  kyc         KYCProfile   @relation(fields: [kycId], references: [id])
  type        DocumentType
  fileName    String
  fileUrl     String
  fileSize    Int?
  mimeType    String?
  status      KYCStatus    @default(PENDING)
  uploadedAt  DateTime     @default(now())
  reviewedAt  DateTime?
  notes       String?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@index([kycId])
  @@index([type])
}

model KYCVerification {
  id              String             @id @default(uuid())
  kycId           String
  kyc             KYCProfile         @relation(fields: [kycId], references: [id])
  documentId      String?
  document        KYCDocument?       @relation(fields: [documentId], references: [id])
  method          VerificationMethod
  status          KYCStatus
  confidence      Float?             // AI confidence score
  externalRef     String?            // Third-party API reference
  result          Json?              // Verification result data
  verifiedAt      DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  
  @@index([kycId])
}
```

**Required User Model Enhancement:**
```prisma
// Add to User model:
kycProfile      KYCProfile?
kycReviews      KYCProfile[]  @relation("KYCReviewer")
```

### 3. 🔴 **Inventory Management Module** - Schema Gaps

**Missing Models:**
```prisma
enum InventoryAction {
  STOCK_IN
  STOCK_OUT
  ADJUSTMENT
  TRANSFER
  DAMAGED
  EXPIRED
}

enum AlertType {
  LOW_STOCK
  OUT_OF_STOCK
  EXPIRY_WARNING
  RESTOCK_REMINDER
}

model InventoryLog {
  id          String          @id @default(uuid())
  productId   String
  product     Product         @relation(fields: [productId], references: [id])
  action      InventoryAction
  quantity    Int
  previousStock Int
  newStock    Int
  reason      String?
  reference   String?         // Order ID, Transfer ID, etc.
  userId      String?         // Who performed the action
  user        User?           @relation(fields: [userId], references: [id])
  createdAt   DateTime        @default(now())
  
  @@index([productId])
  @@index([action])
  @@index([createdAt])
}

model StockAlert {
  id          String    @id @default(uuid())
  productId   String
  product     Product   @relation(fields: [productId], references: [id])
  type        AlertType
  threshold   Int?      // Stock level that triggered alert
  message     String
  isActive    Boolean   @default(true)
  resolvedAt  DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([productId])
  @@index([type])
  @@index([isActive])
}

model RestockSchedule {
  id            String    @id @default(uuid())
  productId     String
  product       Product   @relation(fields: [productId], references: [id])
  scheduledDate DateTime
  quantity      Int
  supplierId    String?   // Future: Supplier model
  status        String    @default("PENDING") // PENDING, ORDERED, RECEIVED
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([productId])
  @@index([scheduledDate])
}
```

**Required Product Model Enhancement:**
```prisma
// Add to Product model:
inventoryLogs     InventoryLog[]
stockAlerts       StockAlert[]
restockSchedules  RestockSchedule[]
expiryDate        DateTime?
batchNumber       String?
```

**Required User Model Enhancement:**
```prisma
// Add to User model:
inventoryLogs     InventoryLog[]
```

### 4. 🔴 **Geolocation & Mapping Module** - Schema Gaps

**Missing Models:**
```prisma
model LocationHistory {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  latitude    Float
  longitude   Float
  accuracy    Float?   // GPS accuracy in meters
  altitude    Float?
  speed       Float?   // Speed in km/h
  heading     Float?   // Direction in degrees
  timestamp   DateTime @default(now())
  
  @@index([userId])
  @@index([timestamp])
  @@index([latitude, longitude])
}

model RouteOptimization {
  id              String   @id @default(uuid())
  driverId        String
  driver          User     @relation(fields: [driverId], references: [id])
  startLocation   Json     // {latitude, longitude, address}
  endLocation     Json     // {latitude, longitude, address}
  waypoints       Json[]   // Array of waypoint objects
  optimizedRoute  Json?    // Optimized route data from mapping API
  distance        Float?   // Total distance in km
  estimatedTime   Int?     // Estimated time in minutes
  actualTime      Int?     // Actual completion time
  status          String   @default("PENDING") // PENDING, OPTIMIZED, IN_PROGRESS, COMPLETED
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([driverId])
  @@index([status])
}

model GeofenceZone {
  id          String   @id @default(uuid())
  name        String
  description String?
  centerLat   Float
  centerLng   Float
  radius      Float    // Radius in meters
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([centerLat, centerLng])
  @@index([isActive])
}
```

**Required User Model Enhancement:**
```prisma
// Add to User model:
locationHistory   LocationHistory[]
routeOptimizations RouteOptimization[]
currentLatitude   Float?
currentLongitude  Float?
lastLocationUpdate DateTime?
```

### 5. 🔴 **Reports/Audit Logs Module** - Schema Gaps

**Missing Models:**
```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  APPROVE
  REJECT
  PAYMENT
  REFUND
}

enum AuditEntityType {
  USER
  ORDER
  PRODUCT
  STORE
  PAYMENT
  KYC
  TASK
  DELIVERY
}

model AuditLog {
  id          String           @id @default(uuid())
  userId      String?
  user        User?            @relation(fields: [userId], references: [id])
  action      AuditAction
  entityType  AuditEntityType
  entityId    String
  oldValues   Json?            // Previous state
  newValues   Json?            // New state
  ipAddress   String?
  userAgent   String?
  sessionId   String?
  metadata    Json?            // Additional context
  timestamp   DateTime         @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([timestamp])
}

model SystemEvent {
  id          String   @id @default(uuid())
  eventType   String   // LOGIN_ATTEMPT, PAYMENT_FAILED, etc.
  severity    String   @default("INFO") // DEBUG, INFO, WARN, ERROR, CRITICAL
  message     String
  source      String?  // Module or service name
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  metadata    Json?    // Event-specific data
  timestamp   DateTime @default(now())
  
  @@index([eventType])
  @@index([severity])
  @@index([timestamp])
  @@index([userId])
}

model Report {
  id          String   @id @default(uuid())
  name        String
  description String?
  type        String   // SALES, INVENTORY, USER_ACTIVITY, etc.
  parameters  Json?    // Report parameters
  data        Json?    // Generated report data
  generatedBy String?
  generator   User?    @relation(fields: [generatedBy], references: [id])
  generatedAt DateTime @default(now())
  expiresAt   DateTime?
  
  @@index([type])
  @@index([generatedAt])
}
```

**Required User Model Enhancement:**
```prisma
// Add to User model:
auditLogs       AuditLog[]
systemEvents    SystemEvent[]
generatedReports Report[]
```

## Summary of Required Schema Changes

### New Models to Add: 15
1. OnboardingFlow
2. OnboardingStep  
3. UserOnboardingProgress
4. KYCProfile
5. KYCDocument
6. KYCVerification
7. InventoryLog
8. StockAlert
9. RestockSchedule
10. LocationHistory
11. RouteOptimization
12. GeofenceZone
13. AuditLog
14. SystemEvent
15. Report

### New Enums to Add: 8
1. OnboardingStepType
2. OnboardingStatus
3. DocumentType
4. KYCStatus
5. VerificationMethod
6. InventoryAction
7. AlertType
8. AuditAction
9. AuditEntityType

### User Model Enhancements
- Add 15+ new relationship fields
- Add onboarding completion tracking
- Add current location fields
- Add KYC status tracking

### Product Model Enhancements
- Add inventory management relationships
- Add expiry and batch tracking

### Existing Models Already Support
✅ **Coupon & Discount Module** - Fully covered by DiscountCode model
✅ **Basic Location** - Address model with lat/lng exists
✅ **User Roles** - Comprehensive role system exists
✅ **Authentication** - OTP and DeviceSession models exist

## Implementation Priority

### Phase 1 (Week 1-2): Critical MVP
1. **Onboarding Models** - Essential for user experience
2. **KYC Models** - Required for driver/vendor verification
3. **Basic Inventory** - InventoryLog and StockAlert

### Phase 2 (Week 3-4): Enhanced Features
4. **Geolocation Models** - LocationHistory and RouteOptimization
5. **Audit Models** - AuditLog and SystemEvent
6. **Advanced Inventory** - RestockSchedule and GeofenceZone

### Phase 3 (Week 5+): Analytics & Reporting
7. **Report Models** - Report generation system
8. **Advanced Geofencing** - GeofenceZone implementation

This comprehensive schema enhancement will support all required new modules while maintaining data integrity and performance.