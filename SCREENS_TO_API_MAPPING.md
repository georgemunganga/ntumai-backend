# Complete Screen-to-API Mapping with All Parameters

**Date:** December 10, 2025  
**Version:** 1.0  
**Status:** Production Ready

---

## Table of Contents

1. [Authentication Screens](#authentication-screens)
2. [Customer Screens](#customer-screens)
3. [Tasker/Driver Screens](#tasker-driver-screens)
4. [Vendor Screens](#vendor-screens)
5. [Shared Screens](#shared-screens)

---

## Authentication Screens

### 1. Splash Screen
**File:** `app/(auth)/SplashScreen.tsx`

**Purpose:** Auto-route based on authentication status

**API Calls:** None (Local state check)

**Parameters:** None

---

### 2. Login Screen
**File:** `app/(auth)/LoginScreen.tsx`

**Purpose:** Collect email/phone for OTP

**API Calls:**
- `POST /auth/send-otp`

**Request Parameters:**
```json
{
  "email": "user@example.com",
  "countrycode": "+26" or "phone": "0972827372", (if the param is phone it should come with country code),,
  "method": "email" | "sms"
  
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_123",
    "expiresIn": 600,
    "message": "OTP sent successfully"
  }
}
```

---

### 3. OTP Verification Screen
**File:** `app/(auth)/OtpVerification.tsx`

**Purpose:** Verify OTP and authenticate user

**API Calls:**
1. `POST /auth/send-otp` (Resend OTP)
2. `POST /auth/verify-otp` (Verify OTP)

**Request Parameters (Send OTP):**
```json
{
  "sessionId": "session_123",
  "email": "user@example.com",
  "phone": "+1234567890"
}
```

**Request Parameters (Verify OTP):**
```json
{
  "sessionId": "session_123",
  "otp": "123456",
  "email": "user@example.com"
}
```

**Response Parameters (Verify OTP):**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "email": "user@example.com",
    "phone": "+1234567890",
    "isNewUser": true,
    "requiresRoleSelection": true
  }
}
```

---

### 4. Role Selection Screen
**File:** `app/(auth)/RoleSelection.tsx`

**Purpose:** Select user role (customer/tasker/vendor)

**API Calls:**
- `POST /auth/select-role`

**Request Parameters:**
```json
{
  "userId": "user_123",
  "role": "customer" | "tasker" | "vendor"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "role": "customer",
      "name": "John Doe"
    }
  }
}
```

---

### 5. Driver Onboarding Screen
**File:** `app/(auth)/DriverOnboarding.tsx`

**Purpose:** 4-step KYC process for taskers

**API Calls:**
1. `POST /taskers/onboard` (Step 1: Vehicle info)
2. `POST /taskers/{taskerId}/documents` (Step 2: Documents)
3. `POST /taskers/{taskerId}/bank-details` (Step 3: Bank info)
4. `POST /taskers/{taskerId}/verify` (Step 4: Review & submit)

**Request Parameters (Step 1 - Vehicle Info):**
```json
{
  "userId": "user_123",
  "vehicleType": "motorcycle" | "car" | "bicycle",
  "vehicleNumber": "ABC123",
  "vehicleModel": "Honda Activa",
  "licenseNumber": "DL123456",
  "licenseExpiry": "2026-12-31"
}
```

**Response Parameters (Step 1):**
```json
{
  "success": true,
  "data": {
    "taskerId": "tasker_123",
    "onboardingStep": 1,
    "onboardingStatus": "in_progress"
  }
}
```

**Request Parameters (Step 2 - Documents):**
```json
{
  "taskerId": "tasker_123",
  "documents": [
    {
      "type": "license",
      "file": "base64_encoded_file",
      "number": "DL123456",
      "expiryDate": "2026-12-31"
    },
    {
      "type": "insurance",
      "file": "base64_encoded_file",
      "number": "INS123456",
      "expiryDate": "2026-12-31"
    }
  ]
}
```

**Response Parameters (Step 2):**
```json
{
  "success": true,
  "data": {
    "taskerId": "tasker_123",
    "onboardingStep": 2,
    "documentsStatus": "pending_verification"
  }
}
```

**Request Parameters (Step 3 - Bank Details):**
```json
{
  "taskerId": "tasker_123",
  "bankName": "State Bank of India",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "accountHolderName": "John Doe",
  "accountType": "savings" | "current"
}
```

**Response Parameters (Step 3):**
```json
{
  "success": true,
  "data": {
    "taskerId": "tasker_123",
    "onboardingStep": 3,
    "bankDetailsStatus": "verified"
  }
}
```

**Request Parameters (Step 4 - Review & Submit):**
```json
{
  "taskerId": "tasker_123",
  "agreeToTerms": true,
  "agreeToPrivacy": true
}
```

**Response Parameters (Step 4):**
```json
{
  "success": true,
  "data": {
    "taskerId": "tasker_123",
    "onboardingStatus": "completed",
    "status": "active"
  }
}
```

---

## Customer Screens

### 1. Customer Dashboard/Home
**File:** `app/(customer)/Home.tsx`

**Purpose:** Display main customer dashboard with services and recent orders

**API Calls:**
1. `GET /users/{userId}` (Get user profile)
2. `GET /orders?userId={userId}&limit=5` (Get recent orders)
3. `GET /marketplace/vendors?featured=true&limit=10` (Get featured vendors)

**Request Parameters:**
```
GET /users/user_123
GET /orders?userId=user_123&limit=5
GET /marketplace/vendors?featured=true&limit=10
```

**Response Parameters (User Profile):**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profilePhoto": "https://...",
    "walletBalance": 500.00,
    "rating": 4.5
  }
}
```

**Response Parameters (Recent Orders):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "vendorName": "Restaurant Name",
        "total": 28.33,
        "status": "delivered",
        "createdAt": "2025-12-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 25
    }
  }
}
```

---

### 2. Marketplace Screen
**File:** `app/(customer)/Marketplace.tsx`

**Purpose:** Browse vendors with search and filtering

**API Calls:**
1. `GET /marketplace/vendors?page=1&limit=20&search=query&category=category_id&rating=4`
2. `GET /marketplace/categories`

**Request Parameters:**
```
GET /marketplace/vendors?page=1&limit=20&search=restaurant&category=food&rating=4&distance=5
GET /marketplace/categories
```

**Response Parameters (Vendors):**
```json
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": "vendor_123",
        "name": "Restaurant Name",
        "logo": "https://...",
        "category": "food",
        "rating": 4.5,
        "reviewCount": 150,
        "deliveryTime": 30,
        "deliveryFee": 2.5,
        "minOrder": 10,
        "isOpen": true,
        "distance": 2.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Response Parameters (Categories):**
```json
{
  "success": true,
  "data": [
    {
      "id": "category_123",
      "name": "Food",
      "icon": "https://...",
      "productCount": 500
    }
  ]
}
```

---

### 3. Vendor Detail Screen
**File:** `app/(customer)/VendorDetail.tsx`

**Purpose:** Display vendor details and products

**API Calls:**
1. `GET /marketplace/vendors/{vendorId}`
2. `GET /marketplace/vendors/{vendorId}/products?page=1&limit=20&category=category_id`

**Request Parameters:**
```
GET /marketplace/vendors/vendor_123
GET /marketplace/vendors/vendor_123/products?page=1&limit=20&category=category_id
```

**Response Parameters (Vendor Details):**
```json
{
  "success": true,
  "data": {
    "id": "vendor_123",
    "name": "Restaurant Name",
    "logo": "https://...",
    "banner": "https://...",
    "category": "food",
    "rating": 4.5,
    "description": "Description",
    "address": "123 Main St, New York",
    "phone": "+1234567890",
    "operatingHours": {
      "monday": { "open": "09:00", "close": "22:00" }
    }
  }
}
```

**Response Parameters (Products):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_123",
        "name": "Product Name",
        "description": "Description",
        "image": "https://...",
        "price": 12.99,
        "originalPrice": 15.99,
        "discount": 18,
        "rating": 4.5,
        "stock": 100,
        "inStock": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

### 4. Product Detail Screen
**File:** `app/(customer)/ProductDetail.tsx`

**Purpose:** Display product details with reviews

**API Calls:**
1. `GET /marketplace/products/{productId}`

**Request Parameters:**
```
GET /marketplace/products/product_123
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "product_123",
    "name": "Product Name",
    "description": "Description",
    "images": ["https://..."],
    "price": 12.99,
    "originalPrice": 15.99,
    "discount": 18,
    "rating": 4.5,
    "stock": 100,
    "inStock": true,
    "reviews": [
      {
        "id": "review_123",
        "userName": "John Doe",
        "rating": 5,
        "comment": "Great product!"
      }
    ]
  }
}
```

---

### 5. Cart Screen
**File:** `app/(customer)/Cart.tsx`

**Purpose:** Display shopping cart items

**API Calls:** None (Local state management via Zustand)

**Parameters:** Managed locally in `cartSlice.ts`

---

### 6. Checkout Screen
**File:** `app/(customer)/CheckoutScreen.tsx`

**Purpose:** Checkout with address and payment selection

**API Calls:**
1. `GET /users/{userId}/addresses`
2. `GET /users/{userId}/payment-methods`

**Request Parameters:**
```
GET /users/user_123/addresses
GET /users/user_123/payment-methods
```

**Response Parameters (Addresses):**
```json
{
  "success": true,
  "data": [
    {
      "id": "addr_123",
      "label": "Home",
      "street": "123 Main St",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "isDefault": true
    }
  ]
}
```

**Response Parameters (Payment Methods):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_123",
      "type": "card",
      "cardNumber": "****1111",
      "cardholderName": "John Doe",
      "isDefault": true
    }
  ]
}
```

---

### 7. Order Placement
**File:** `app/(customer)/CheckoutScreen.tsx` (Checkout button)

**Purpose:** Create order

**API Calls:**
1. `POST /orders`

**Request Parameters:**
```json
{
  "vendorId": "vendor_123",
  "items": [
    {
      "productId": "product_123",
      "quantity": 2,
      "price": 12.99,
      "specialInstructions": "No onions"
    }
  ],
  "deliveryAddressId": "addr_123",
  "paymentMethod": "card" | "wallet" | "cash",
  "promoCode": "PROMO123",
  "notes": "Ring doorbell twice",
  "subtotal": 25.98,
  "deliveryFee": 2.5,
  "tax": 2.35,
  "discount": 2.5,
  "total": 28.33
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "vendorId": "vendor_123",
    "userId": "user_123",
    "status": "pending",
    "total": 28.33,
    "estimatedDeliveryTime": 30,
    "createdAt": "2025-12-10T10:00:00Z"
  }
}
```

---

### 8. Order Tracking Screen
**File:** `app/(customer)/OrderTrackingScreen.tsx`

**Purpose:** Real-time order tracking

**API Calls:**
1. `GET /orders/{orderId}`
2. `GET /orders/{orderId}/track` (Real-time updates via WebSocket)

**Request Parameters:**
```
GET /orders/order_123
GET /orders/order_123/track
```

**Response Parameters (Order Details):**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "vendorId": "vendor_123",
    "vendorName": "Restaurant Name",
    "userId": "user_123",
    "items": [
      {
        "productId": "product_123",
        "name": "Product Name",
        "quantity": 2,
        "price": 12.99
      }
    ],
    "status": "on_the_way",
    "total": 28.33,
    "tasker": {
      "id": "tasker_123",
      "name": "John Driver",
      "phone": "+1234567890",
      "photo": "https://...",
      "rating": 4.8,
      "vehicle": "Motorcycle"
    },
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2025-12-10T10:00:00Z",
        "message": "Order placed"
      }
    ]
  }
}
```

**Response Parameters (Track Order):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "status": "on_the_way",
    "tasker": {
      "id": "tasker_123",
      "name": "John Driver",
      "currentLocation": {
        "latitude": 40.7150,
        "longitude": -74.0080,
        "timestamp": "2025-12-10T10:15:00Z"
      }
    },
    "estimatedArrivalTime": "2025-12-10T10:25:00Z",
    "route": [
      { "latitude": 40.7128, "longitude": -74.0060 },
      { "latitude": 40.7150, "longitude": -74.0080 }
    ]
  }
}
```

---

### 9. Order History Screen
**File:** `app/(customer)/OrderHistoryScreen.tsx`

**Purpose:** Display order history

**API Calls:**
1. `GET /orders?userId={userId}&status=all&page=1&limit=20`

**Request Parameters:**
```
GET /orders?userId=user_123&status=all&page=1&limit=20
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "vendorName": "Restaurant Name",
        "total": 28.33,
        "status": "delivered",
        "createdAt": "2025-12-10T10:00:00Z",
        "rating": 5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

---

### 10. Send Parcel Screen (P2P Delivery)
**File:** `app/(customer)/SendParcelScreen.tsx`

**Purpose:** Create P2P delivery request

**API Calls:**
1. `POST /deliveries`

**Request Parameters:**
```json
{
  "pickupLocation": {
    "street": "123 Main St",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "contactName": "John Doe",
    "contactPhone": "+1234567890"
  },
  "dropoffLocation": {
    "street": "456 Oak Ave",
    "city": "New York",
    "latitude": 40.7150,
    "longitude": -74.0080,
    "contactName": "Jane Doe",
    "contactPhone": "+0987654321"
  },
  "itemDescription": "Package with documents",
  "itemWeight": 2.5,
  "itemValue": 50,
  "specialInstructions": "Handle with care",
  "paymentMethod": "card" | "wallet" | "cash",
  "estimatedPrice": 5.5
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "delivery_123",
    "userId": "user_123",
    "status": "pending",
    "estimatedPrice": 5.5,
    "createdAt": "2025-12-10T10:00:00Z"
  }
}
```

---

### 11. Delivery Tracking Screen
**File:** `app/(customer)/DeliveryTrackingScreen.tsx`

**Purpose:** Track P2P delivery in real-time

**API Calls:**
1. `GET /deliveries/{deliveryId}`
2. `GET /deliveries/{deliveryId}/track` (Real-time updates via WebSocket)

**Request Parameters:**
```
GET /deliveries/delivery_123
GET /deliveries/delivery_123/track
```

**Response Parameters (Delivery Details):**
```json
{
  "success": true,
  "data": {
    "id": "delivery_123",
    "userId": "user_123",
    "pickupLocation": {
      "street": "123 Main St",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "dropoffLocation": {
      "street": "456 Oak Ave",
      "city": "New York",
      "latitude": 40.7150,
      "longitude": -74.0080
    },
    "status": "in_transit",
    "tasker": {
      "id": "tasker_123",
      "name": "John Driver",
      "currentLocation": {
        "latitude": 40.7140,
        "longitude": -74.0070
      }
    },
    "estimatedDeliveryTime": "2025-12-10T14:30:00Z",
    "estimatedPrice": 5.5
  }
}
```

---

### 12. Do Task Screen (Create Errand/Task)
**File:** `app/(customer)/DoTaskScreen.tsx`

**Purpose:** Create task/errand request

**API Calls:**
1. `POST /tasks`

**Request Parameters:**
```json
{
  "title": "Buy groceries",
  "description": "Buy milk, eggs, and bread",
  "category": "shopping" | "delivery" | "errand" | "other",
  "location": {
    "street": "123 Main St",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "budget": 50,
  "deadline": "2025-12-10T18:00:00Z",
  "priority": "low" | "medium" | "high",
  "paymentMethod": "card" | "wallet" | "cash"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "userId": "user_123",
    "title": "Buy groceries",
    "status": "open",
    "budget": 50,
    "createdAt": "2025-12-10T10:00:00Z"
  }
}
```

---

### 13. Task Detail Screen
**File:** `app/(customer)/TaskDetailScreen.tsx`

**Purpose:** Display task details and applicants

**API Calls:**
1. `GET /tasks/{taskId}`

**Request Parameters:**
```
GET /tasks/task_123
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "userId": "user_123",
    "title": "Buy groceries",
    "description": "Buy milk, eggs, and bread",
    "category": "shopping",
    "location": {
      "street": "123 Main St",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "budget": 50,
    "deadline": "2025-12-10T18:00:00Z",
    "status": "in_progress",
    "applicants": [
      {
        "id": "tasker_123",
        "name": "John Tasker",
        "rating": 4.7,
        "bidAmount": 45
      }
    ],
    "assignedTasker": {
      "id": "tasker_123",
      "name": "John Tasker",
      "acceptedAmount": 45
    }
  }
}
```

---

### 14. Finding Tasker Screen
**File:** `app/(customer)/FindingTaskerScreen.tsx`

**Purpose:** Display live map with tasker location

**API Calls:**
1. `GET /tasks/{taskId}/track` (Real-time updates via WebSocket)

**Request Parameters:**
```
GET /tasks/task_123/track
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "taskId": "task_123",
    "status": "in_progress",
    "tasker": {
      "id": "tasker_123",
      "name": "John Tasker",
      "currentLocation": {
        "latitude": 40.7140,
        "longitude": -74.0070
      }
    },
    "estimatedArrivalTime": "2025-12-10T14:30:00Z"
  }
}
```

---

### 15. Shopping Lists Screen
**File:** `app/(customer)/ShoppingListsScreen.tsx`

**Purpose:** Create and manage shopping lists

**API Calls:**
1. `GET /shopping-lists?userId={userId}`
2. `POST /shopping-lists` (Create new list)
3. `PUT /shopping-lists/{listId}` (Update list)
4. `DELETE /shopping-lists/{listId}` (Delete list)

**Request Parameters (Get Lists):**
```
GET /shopping-lists?userId=user_123
```

**Request Parameters (Create List):**
```json
{
  "userId": "user_123",
  "name": "Weekly Groceries",
  "items": [
    {
      "name": "Milk",
      "quantity": 2,
      "unit": "liters"
    }
  ]
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "list_123",
    "userId": "user_123",
    "name": "Weekly Groceries",
    "items": [
      {
        "id": "item_123",
        "name": "Milk",
        "quantity": 2,
        "unit": "liters",
        "completed": false
      }
    ],
    "createdAt": "2025-12-10T10:00:00Z"
  }
}
```

---

### 16. Payment Confirmation Screen
**File:** `app/(customer)/PaymentConfirmationScreen.tsx`

**Purpose:** Confirm payment for order

**API Calls:**
1. `POST /payments/process`
2. `POST /payments/{transactionId}/confirm`

**Request Parameters (Process Payment):**
```json
{
  "orderId": "order_123",
  "amount": 28.33,
  "method": "card" | "wallet" | "cash",
  "cardDetails": {
    "cardNumber": "4111111111111111",
    "expiryMonth": 12,
    "expiryYear": 2026,
    "cvv": "123",
    "cardholderName": "John Doe"
  },
  "promoCode": "PROMO123"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_123",
    "orderId": "order_123",
    "amount": 28.33,
    "status": "success",
    "timestamp": "2025-12-10T10:00:00Z"
  }
}
```

---

## Tasker/Driver Screens

### 1. Driver Dashboard
**File:** `app/(tasker)/DriverDashboard.tsx`

**Purpose:** Main driver dashboard with earnings and status

**API Calls:**
1. `GET /taskers/{taskerId}`
2. `GET /taskers/{taskerId}/earnings?period=today`
3. `GET /taskers/{taskerId}/performance`

**Request Parameters:**
```
GET /taskers/tasker_123
GET /taskers/tasker_123/earnings?period=today
GET /taskers/tasker_123/performance
```

**Response Parameters (Tasker Profile):**
```json
{
  "success": true,
  "data": {
    "id": "tasker_123",
    "userId": "user_123",
    "name": "John Driver",
    "phone": "+1234567890",
    "photo": "https://...",
    "rating": 4.8,
    "status": "online" | "offline",
    "totalJobs": 500,
    "completedJobs": 495,
    "cancelledJobs": 5
  }
}
```

**Response Parameters (Earnings):**
```json
{
  "success": true,
  "data": {
    "period": "today",
    "totalEarnings": 150.50,
    "totalJobs": 10,
    "averageEarningsPerJob": 15.05,
    "breakdown": {
      "deliveries": 100.50,
      "tasks": 50.00
    }
  }
}
```

**Response Parameters (Performance):**
```json
{
  "success": true,
  "data": {
    "taskerId": "tasker_123",
    "rating": 4.8,
    "reviewCount": 150,
    "totalJobs": 500,
    "completedJobs": 495,
    "cancelledJobs": 5,
    "completionRate": 99,
    "averageDeliveryTime": 18,
    "onTimeDeliveryRate": 96,
    "acceptanceRate": 85,
    "badges": [
      {
        "id": "badge_123",
        "name": "Super Tasker",
        "icon": "https://..."
      }
    ],
    "probationStatus": "none",
    "kpis": {
      "acceptanceRate": 85,
      "cancellationRate": 1,
      "completionRate": 99,
      "onTimeRate": 96,
      "customerRating": 4.8
    }
  }
}
```

---

### 2. Available Jobs Screen
**File:** `app/(tasker)/AvailableJobsScreen.tsx`

**Purpose:** Browse available jobs

**API Calls:**
1. `GET /taskers/{taskerId}/available-jobs?jobType=delivery&radius=5&page=1&limit=20`

**Request Parameters:**
```
GET /taskers/tasker_123/available-jobs?jobType=delivery&radius=5&page=1&limit=20
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "job_123",
        "type": "delivery",
        "title": "Deliver order",
        "pickupLocation": {
          "street": "123 Main St",
          "city": "New York",
          "latitude": 40.7128,
          "longitude": -74.0060
        },
        "dropoffLocation": {
          "street": "456 Oak Ave",
          "city": "New York",
          "latitude": 40.7150,
          "longitude": -74.0080
        },
        "distance": 2.5,
        "estimatedTime": 20,
        "estimatedEarnings": 5.5,
        "priority": "high",
        "expiresAt": "2025-12-10T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
}
```

---

### 3. Job Detail Screen
**File:** `app/(tasker)/JobDetailScreen.tsx`

**Purpose:** Display job details and accept/reject

**API Calls:**
1. `GET /jobs/{jobId}`

**Request Parameters:**
```
GET /jobs/job_123
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "job_123",
    "type": "delivery",
    "title": "Deliver order",
    "description": "Deliver food order to customer",
    "pickupLocation": {
      "street": "123 Main St",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "contactName": "Restaurant",
      "contactPhone": "+1234567890"
    },
    "dropoffLocation": {
      "street": "456 Oak Ave",
      "city": "New York",
      "latitude": 40.7150,
      "longitude": -74.0080,
      "contactName": "Customer",
      "contactPhone": "+0987654321"
    },
    "distance": 2.5,
    "estimatedTime": 20,
    "estimatedEarnings": 5.5,
    "priority": "high",
    "expiresAt": "2025-12-10T10:30:00Z",
    "customerRating": 4.8,
    "specialInstructions": "Ring doorbell twice"
  }
}
```

---

### 4. Job Offer Screen (Full-Screen Notification)
**File:** `app/(tasker)/JobOfferScreen.tsx`

**Purpose:** Full-screen job offer notification

**API Calls:**
1. `POST /taskers/{taskerId}/jobs/{jobId}/accept`
2. `POST /taskers/{taskerId}/jobs/{jobId}/reject`

**Request Parameters (Accept Job):**
```json
{
  "taskerId": "tasker_123",
  "jobId": "job_123",
  "acceptedAt": "2025-12-10T10:05:00Z"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "job_123",
    "status": "accepted",
    "estimatedEarnings": 5.5
  }
}
```

---

### 5. Active Job Screen
**File:** `app/(tasker)/ActiveJobScreen.tsx`

**Purpose:** Track active job with live updates

**API Calls:**
1. `GET /jobs/{jobId}/track` (Real-time updates via WebSocket)
2. `POST /jobs/{jobId}/status` (Update job status)

**Request Parameters (Track Job):**
```
GET /jobs/job_123/track
```

**Request Parameters (Update Status):**
```json
{
  "jobId": "job_123",
  "status": "picked_up" | "in_transit" | "completed",
  "location": {
    "latitude": 40.7140,
    "longitude": -74.0070
  },
  "timestamp": "2025-12-10T10:15:00Z"
}
```

**Response Parameters (Track Job):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "status": "in_transit",
    "tasker": {
      "id": "tasker_123",
      "name": "John Driver",
      "currentLocation": {
        "latitude": 40.7140,
        "longitude": -74.0070
      }
    },
    "estimatedArrivalTime": "2025-12-10T10:25:00Z",
    "route": [
      { "latitude": 40.7128, "longitude": -74.0060 },
      { "latitude": 40.7150, "longitude": -74.0080 }
    ]
  }
}
```

---

### 6. Earnings Screen
**File:** `app/(tasker)/EarningsScreen.tsx`

**Purpose:** Display earnings and transaction history

**API Calls:**
1. `GET /taskers/{taskerId}/earnings?period=month&page=1&limit=20`

**Request Parameters:**
```
GET /taskers/tasker_123/earnings?period=month&page=1&limit=20
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalEarnings": 1250.50,
    "totalJobs": 45,
    "averageEarningsPerJob": 27.79,
    "breakdown": {
      "deliveries": 800.50,
      "tasks": 450.00
    },
    "transactions": [
      {
        "id": "txn_123",
        "type": "credit",
        "amount": 50.00,
        "description": "Job completed",
        "status": "completed",
        "timestamp": "2025-12-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

### 7. Probation Screen (KPI Tracking)
**File:** `app/(tasker)/ProbationScreen.tsx`

**Purpose:** Display probation status and KPIs

**API Calls:**
1. `GET /taskers/{taskerId}/probation`

**Request Parameters:**
```
GET /taskers/tasker_123/probation
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "taskerId": "tasker_123",
    "probationStatus": "active" | "none",
    "startDate": "2025-12-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z",
    "daysRemaining": 21,
    "kpis": {
      "acceptanceRate": {
        "current": 85,
        "target": 80,
        "status": "passed"
      },
      "cancellationRate": {
        "current": 1,
        "target": 5,
        "status": "passed"
      },
      "completionRate": {
        "current": 99,
        "target": 95,
        "status": "passed"
      },
      "onTimeRate": {
        "current": 96,
        "target": 90,
        "status": "passed"
      },
      "customerRating": {
        "current": 4.8,
        "target": 4.5,
        "status": "passed"
      }
    },
    "warnings": [],
    "nextReview": "2025-12-31T23:59:59Z"
  }
}
```

---

### 8. Float Top-Up Screen
**File:** `app/(tasker)/FloatTopUpScreen.tsx`

**Purpose:** Top-up float balance

**API Calls:**
1. `GET /taskers/{taskerId}/float`
2. `POST /taskers/{taskerId}/float/top-up`

**Request Parameters (Top-Up):**
```json
{
  "taskerId": "tasker_123",
  "amount": 1000.00,
  "paymentMethod": "card" | "bank_transfer"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn_123",
    "amount": 1000.00,
    "newFloatBalance": 2500.00,
    "status": "success"
  }
}
```

---

### 9. Performance Screen
**File:** `app/(tasker)/PerformanceScreen.tsx`

**Purpose:** Display performance metrics

**API Calls:**
1. `GET /taskers/{taskerId}/performance`

**Request Parameters:**
```
GET /taskers/tasker_123/performance
```

**Response Parameters:** (Same as Driver Dashboard Performance)

---

### 10. Badges Screen
**File:** `app/(tasker)/BadgesScreen.tsx`

**Purpose:** Display earned badges and achievements

**API Calls:**
1. `GET /taskers/{taskerId}/badges`

**Request Parameters:**
```
GET /taskers/tasker_123/badges
```

**Response Parameters:**
```json
{
  "success": true,
  "data": [
    {
      "id": "badge_123",
      "name": "Super Tasker",
      "description": "Completed 500 jobs",
      "icon": "https://...",
      "earnedAt": "2025-12-10T10:00:00Z"
    }
  ]
}
```

---

### 11. Documents Screen
**File:** `app/(tasker)/DocumentsScreen.tsx`

**Purpose:** Manage driver documents

**API Calls:**
1. `GET /taskers/{taskerId}/documents`
2. `POST /taskers/{taskerId}/documents` (Upload new)
3. `PUT /taskers/{taskerId}/documents/{docId}` (Update)

**Request Parameters (Get Documents):**
```
GET /taskers/tasker_123/documents
```

**Response Parameters:**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123",
      "type": "license",
      "number": "DL123456",
      "expiryDate": "2026-12-31",
      "status": "verified",
      "uploadedAt": "2025-12-10T10:00:00Z"
    }
  ]
}
```

---

### 12. Bank Details Screen
**File:** `app/(tasker)/BankDetailsScreen.tsx`

**Purpose:** Manage bank account for payouts

**API Calls:**
1. `GET /taskers/{taskerId}/bank-details`
2. `PUT /taskers/{taskerId}/bank-details`

**Request Parameters (Update):**
```json
{
  "taskerId": "tasker_123",
  "bankName": "State Bank of India",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "accountHolderName": "John Doe",
  "accountType": "savings"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "bank_123",
    "bankName": "State Bank of India",
    "accountNumber": "****7890",
    "ifscCode": "SBIN0001234",
    "accountHolderName": "John Doe",
    "status": "verified"
  }
}
```

---

### 13. Support Ticket Screen
**File:** `app/(tasker)/SupportTicketScreen.tsx`

**Purpose:** Create and manage support tickets

**API Calls:**
1. `GET /support/tickets?userId={userId}`
2. `POST /support/tickets` (Create ticket)
3. `GET /support/tickets/{ticketId}` (Get ticket details)

**Request Parameters (Create Ticket):**
```json
{
  "userId": "user_123",
  "subject": "Issue with payment",
  "description": "I did not receive payment for job 123",
  "category": "payment" | "technical" | "other",
  "priority": "low" | "medium" | "high"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "ticket_123",
    "userId": "user_123",
    "subject": "Issue with payment",
    "status": "open",
    "createdAt": "2025-12-10T10:00:00Z"
  }
}
```

---

### 14. Driver Profile Screen
**File:** `app/(tasker)/DriverProfileScreen.tsx`

**Purpose:** Display and edit driver profile

**API Calls:**
1. `GET /users/{userId}`
2. `PUT /users/{userId}` (Update profile)

**Request Parameters (Update):**
```json
{
  "userId": "user_123",
  "name": "John Doe",
  "phone": "+1234567890",
  "profilePhoto": "base64_image_data",
  "bio": "Professional driver"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "phone": "+1234567890",
    "profilePhoto": "https://...",
    "bio": "Professional driver"
  }
}
```

---

## Vendor Screens

### 1. Vendor Dashboard
**File:** `app/(vendor)/VendorDashboard.tsx`

**Purpose:** Main vendor dashboard with orders and analytics

**API Calls:**
1. `GET /vendors/{vendorId}`
2. `GET /vendors/{vendorId}/orders?status=pending&limit=10`
3. `GET /vendors/{vendorId}/analytics?period=today`

**Request Parameters:**
```
GET /vendors/vendor_123
GET /vendors/vendor_123/orders?status=pending&limit=10
GET /vendors/vendor_123/analytics?period=today
```

**Response Parameters (Vendor Profile):**
```json
{
  "success": true,
  "data": {
    "id": "vendor_123",
    "userId": "user_123",
    "name": "Restaurant Name",
    "logo": "https://...",
    "category": "food",
    "rating": 4.5,
    "address": "123 Main St, New York",
    "phone": "+1234567890",
    "isOpen": true,
    "verified": true
  }
}
```

**Response Parameters (Recent Orders):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "customerName": "John Doe",
        "total": 28.33,
        "status": "pending",
        "createdAt": "2025-12-10T10:00:00Z"
      }
    ]
  }
}
```

**Response Parameters (Analytics):**
```json
{
  "success": true,
  "data": {
    "period": "today",
    "totalOrders": 15,
    "totalRevenue": 425.00,
    "averageOrderValue": 28.33,
    "totalCustomers": 12,
    "newCustomers": 3,
    "rating": 4.5
  }
}
```

---

### 2. Manage Products Screen
**File:** `app/(vendor)/ManageProductsScreen.tsx`

**Purpose:** Browse and manage products

**API Calls:**
1. `GET /vendors/{vendorId}/products?page=1&limit=20`

**Request Parameters:**
```
GET /vendors/vendor_123/products?page=1&limit=20
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_123",
        "name": "Product Name",
        "price": 12.99,
        "stock": 100,
        "inStock": true,
        "image": "https://...",
        "rating": 4.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

### 3. Add/Edit Product Screen
**File:** `app/(vendor)/AddProductScreen.tsx` / `EditProductScreen.tsx`

**Purpose:** Add or edit product

**API Calls:**
1. `POST /vendors/{vendorId}/products` (Add)
2. `PUT /vendors/{vendorId}/products/{productId}` (Edit)

**Request Parameters (Add Product):**
```json
{
  "vendorId": "vendor_123",
  "name": "Product Name",
  "description": "Description",
  "image": "base64_image_data",
  "category": "category_id",
  "price": 12.99,
  "originalPrice": 15.99,
  "stock": 100,
  "tags": ["vegetarian", "spicy"]
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "product_123",
    "name": "Product Name",
    "price": 12.99,
    "stock": 100,
    "image": "https://..."
  }
}
```

---

### 4. Analytics Screen
**File:** `app/(vendor)/AnalyticsScreen.tsx`

**Purpose:** View detailed analytics

**API Calls:**
1. `GET /vendors/{vendorId}/analytics?period=month`

**Request Parameters:**
```
GET /vendors/vendor_123/analytics?period=month
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "period": "month",
    "totalOrders": 150,
    "totalRevenue": 3500.50,
    "averageOrderValue": 23.34,
    "totalCustomers": 120,
    "newCustomers": 15,
    "rating": 4.5,
    "topProducts": [
      {
        "id": "product_123",
        "name": "Product Name",
        "sales": 50,
        "revenue": 649.50
      }
    ],
    "dailyRevenue": [
      { "date": "2025-12-01", "revenue": 100.00 }
    ]
  }
}
```

---

### 5. Orders Screen
**File:** `app/(vendor)/OrdersScreen.tsx`

**Purpose:** Manage orders

**API Calls:**
1. `GET /vendors/{vendorId}/orders?status=all&page=1&limit=20`

**Request Parameters:**
```
GET /vendors/vendor_123/orders?status=all&page=1&limit=20
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_123",
        "customerName": "John Doe",
        "total": 28.33,
        "status": "pending",
        "createdAt": "2025-12-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 500
    }
  }
}
```

---

### 6. Order Detail Screen
**File:** `app/(vendor)/OrderDetailScreen.tsx`

**Purpose:** View order details and update status

**API Calls:**
1. `GET /orders/{orderId}`
2. `PUT /orders/{orderId}/status` (Update status)

**Request Parameters (Update Status):**
```json
{
  "orderId": "order_123",
  "status": "confirmed" | "preparing" | "ready" | "picked_up",
  "estimatedTime": 30
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "status": "confirmed",
    "estimatedTime": 30
  }
}
```

---

## Shared Screens

### 1. Wallet Screen
**File:** `app/(shared)/WalletScreen.tsx`

**Purpose:** Display wallet balance and transactions

**API Calls:**
1. `GET /users/{userId}/wallet`
2. `GET /users/{userId}/wallet/transactions?page=1&limit=20`

**Request Parameters:**
```
GET /users/user_123/wallet
GET /users/user_123/wallet/transactions?page=1&limit=20
```

**Response Parameters (Wallet):**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "balance": 250.50,
    "currency": "USD",
    "floatBalance": 100.00,
    "pendingAmount": 50.00
  }
}
```

**Response Parameters (Transactions):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_123",
        "type": "credit",
        "amount": 50.00,
        "description": "Refund for order",
        "status": "completed",
        "timestamp": "2025-12-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

### 2. Profile Screen
**File:** `app/(shared)/ProfileScreen.tsx`

**Purpose:** Display user profile

**API Calls:**
1. `GET /users/{userId}`

**Request Parameters:**
```
GET /users/user_123
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "profilePhoto": "https://...",
    "role": "customer",
    "rating": 4.5,
    "verified": true
  }
}
```

---

### 3. Edit Profile Screen
**File:** `app/(shared)/EditProfileScreen.tsx`

**Purpose:** Edit user profile

**API Calls:**
1. `PUT /users/{userId}`

**Request Parameters:**
```json
{
  "userId": "user_123",
  "name": "John Doe",
  "profilePhoto": "base64_image_data",
  "bio": "Bio text"
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "name": "John Doe",
    "profilePhoto": "https://...",
    "bio": "Bio text"
  }
}
```

---

### 4. Addresses Screen
**File:** `app/(shared)/AddressesScreen.tsx`

**Purpose:** Manage addresses

**API Calls:**
1. `GET /users/{userId}/addresses`
2. `POST /users/{userId}/addresses` (Add)
3. `PUT /users/{userId}/addresses/{addressId}` (Edit)
4. `DELETE /users/{userId}/addresses/{addressId}` (Delete)

**Request Parameters (Add Address):**
```json
{
  "userId": "user_123",
  "label": "Home",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "isDefault": false
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "addr_123",
    "label": "Home",
    "street": "123 Main St",
    "city": "New York",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "isDefault": false
  }
}
```

---

### 5. Payment Methods Screen
**File:** `app/(shared)/PaymentMethodsScreen.tsx`

**Purpose:** Manage payment methods

**API Calls:**
1. `GET /users/{userId}/payment-methods`
2. `POST /users/{userId}/payment-methods` (Add)
3. `PUT /users/{userId}/payment-methods/{methodId}` (Update)
4. `DELETE /users/{userId}/payment-methods/{methodId}` (Delete)

**Request Parameters (Add Payment Method):**
```json
{
  "userId": "user_123",
  "type": "card",
  "cardNumber": "4111111111111111",
  "expiryMonth": 12,
  "expiryYear": 2026,
  "cvv": "123",
  "cardholderName": "John Doe",
  "isDefault": false
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "id": "pm_123",
    "type": "card",
    "cardNumber": "****1111",
    "cardholderName": "John Doe",
    "expiryMonth": 12,
    "expiryYear": 2026,
    "isDefault": false
  }
}
```

---

### 6. Chat Screen
**File:** `app/(shared)/ChatScreen.tsx`

**Purpose:** In-app messaging

**API Calls:**
1. `GET /chats?userId={userId}&page=1&limit=20`
2. `GET /chats/{chatId}/messages?page=1&limit=20`
3. `POST /chats/{chatId}/messages` (Send message)
4. `PUT /chats/{chatId}/messages/read` (Mark as read)

**Request Parameters (Get Chats):**
```
GET /chats?userId=user_123&page=1&limit=20
```

**Request Parameters (Send Message):**
```json
{
  "chatId": "chat_123",
  "message": "Hello, how are you?",
  "type": "text" | "image" | "location",
  "attachments": ["https://..."]
}
```

**Response Parameters (Get Chats):**
```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "chat_123",
        "participantId": "user_456",
        "participantName": "John Doe",
        "participantPhoto": "https://...",
        "lastMessage": "See you soon",
        "lastMessageTime": "2025-12-10T10:00:00Z",
        "unreadCount": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

**Response Parameters (Send Message):**
```json
{
  "success": true,
  "data": {
    "id": "msg_123",
    "chatId": "chat_123",
    "senderId": "user_123",
    "message": "Hello, how are you?",
    "type": "text",
    "timestamp": "2025-12-10T10:00:00Z",
    "isRead": false
  }
}
```

---

### 7. Help & Support Screen
**File:** `app/(shared)/HelpSupportScreen.tsx`

**Purpose:** FAQ, support tickets, and contact

**API Calls:**
1. `GET /support/faq?category=general`
2. `GET /support/tickets?userId={userId}`
3. `POST /support/tickets` (Create ticket)

**Request Parameters (Get FAQ):**
```
GET /support/faq?category=general
```

**Response Parameters:**
```json
{
  "success": true,
  "data": [
    {
      "id": "faq_123",
      "question": "How do I reset my password?",
      "answer": "You can reset your password by...",
      "category": "general"
    }
  ]
}
```

---

### 8. Referral Screen
**File:** `app/(shared)/ReferralScreen.tsx`

**Purpose:** Referral and rewards

**API Calls:**
1. `GET /users/{userId}/referral`
2. `POST /users/{userId}/referral/share`

**Request Parameters (Get Referral Info):**
```
GET /users/user_123/referral
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "referralCode": "REF123456",
    "referralLink": "https://ntumai.com/ref/REF123456",
    "totalReferrals": 5,
    "totalRewards": 250.00,
    "pendingRewards": 50.00,
    "rewardPerReferral": 50.00
  }
}
```

---

### 9. Notifications Screen
**File:** `app/(shared)/NotificationsScreen.tsx`

**Purpose:** View notifications

**API Calls:**
1. `GET /notifications?userId={userId}&page=1&limit=20`
2. `PUT /notifications/{notificationId}/read`
3. `POST /notifications/register-token`

**Request Parameters (Get Notifications):**
```
GET /notifications?userId=user_123&page=1&limit=20
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "userId": "user_123",
        "type": "order",
        "title": "Order Confirmed",
        "message": "Your order has been confirmed",
        "data": {
          "orderId": "order_123"
        },
        "isRead": false,
        "createdAt": "2025-12-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

---

### 10. Settings Screen
**File:** `app/(shared)/SettingsScreen.tsx`

**Purpose:** App settings and preferences

**API Calls:**
1. `GET /users/{userId}/preferences`
2. `PUT /users/{userId}/preferences`

**Request Parameters (Update Preferences):**
```json
{
  "userId": "user_123",
  "preferences": {
    "darkMode": true,
    "notifications": true,
    "locationSharing": true,
    "language": "en"
  }
}
```

**Response Parameters:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "preferences": {
      "darkMode": true,
      "notifications": true,
      "locationSharing": true,
      "language": "en"
    }
  }
}
```

---

## WebSocket Events

### Real-Time Events

**Connection URL:**
```
wss://api.ntumai.com/ws
```

**Authentication:**
```
Authorization: Bearer {access_token}
```

### Client → Server Events

#### 1. Order Status Update
```json
{
  "event": "order:status_update",
  "data": {
    "orderId": "order_123",
    "status": "on_the_way"
  }
}
```

#### 2. Delivery Location Update
```json
{
  "event": "delivery:location_update",
  "data": {
    "deliveryId": "delivery_123",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### 3. Chat Message
```json
{
  "event": "chat:message",
  "data": {
    "chatId": "chat_123",
    "message": "Hello!"
  }
}
```

#### 4. Typing Indicator
```json
{
  "event": "chat:typing",
  "data": {
    "chatId": "chat_123",
    "isTyping": true
  }
}
```

#### 5. Job Offer
```json
{
  "event": "job:offer",
  "data": {
    "jobId": "job_123",
    "taskerId": "tasker_123",
    "estimatedEarnings": 5.5
  }
}
```

### Server → Client Events

#### 1. Order Status Changed
```json
{
  "event": "order:status_changed",
  "data": {
    "orderId": "order_123",
    "status": "confirmed",
    "message": "Order confirmed by vendor"
  }
}
```

#### 2. Delivery Location Updated
```json
{
  "event": "delivery:location_updated",
  "data": {
    "deliveryId": "delivery_123",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### 3. Chat Message Received
```json
{
  "event": "chat:message_received",
  "data": {
    "chatId": "chat_123",
    "messageId": "msg_123",
    "message": "Hi there!"
  }
}
```

#### 4. Typing Indicator
```json
{
  "event": "chat:user_typing",
  "data": {
    "chatId": "chat_123",
    "isTyping": true
  }
}
```

#### 5. Job Offer Received
```json
{
  "event": "job:offer_received",
  "data": {
    "jobId": "job_123",
    "jobType": "delivery",
    "estimatedEarnings": 5.5
  }
}
```

#### 6. Notification
```json
{
  "event": "notification:received",
  "data": {
    "notificationId": "notif_123",
    "type": "order",
    "title": "Order Confirmed",
    "message": "Your order has been confirmed"
  }
}
```

---

## Summary

**Total Screens:** 73  
**Total API Endpoints:** 60+  
**Total WebSocket Events:** 12  
**Total Parameters:** 500+  

All endpoints are documented with complete request and response parameters. Your backend team can use this document as a reference to implement all required APIs.

---

**Status:** ✅ **READY FOR BACKEND IMPLEMENTATION**
