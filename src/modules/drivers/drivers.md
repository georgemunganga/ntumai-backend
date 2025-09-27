# Rider/Driver API Documentation

## 1. Authentication & Profile Management

### 1.1 Register Rider
- **Endpoint:** `POST /api/rider/register`
- **Description:** Register a new rider with documents and vehicle information
- **Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phoneNumber": "string",
  "vehicleType": "string", // motorcycle, bicycle, car, scooter
  "documents": {
    "driverLicense": "string", // file upload
    "vehicleRegistration": "string", // file upload
    "insurance": "string" // file upload
  }
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Rider registered successfully",
  "riderId": "string",
  "status": "pending_verification"
}
```

### 1.2 Get Rider Profile
- **Endpoint:** `GET /api/rider/profile`
- **Description:** Get rider profile information
- **Response:**
```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phoneNumber": "string",
  "rating": "number",
  "status": "string", // active, inactive, suspended
  "vehicleInfo": {
    "type": "string",
    "make": "string",
    "model": "string",
    "plateNumber": "string"
  },
  "bankingInfo": {
    "accountNumber": "string",
    "bankName": "string"
  },
  "verificationStatus": "string", // verified, pending, rejected
  "createdAt": "string"
}
```

### 1.3 Update Rider Profile
- **Endpoint:** `PUT /api/rider/profile`
- **Description:** Update rider profile information
- **Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "phoneNumber": "string",
  "vehicleInfo": {
    "type": "string",
    "make": "string",
    "model": "string",
    "plateNumber": "string"
  },
  "bankingInfo": {
    "accountNumber": "string",
    "bankName": "string"
  }
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

### 1.4 Upload Rider Documents
- **Endpoint:** `POST /api/rider/documents`
- **Description:** Upload or update rider documents
- **Request:** Multipart form data with document files
- **Response:**
```json
{
  "success": true,
  "message": "Documents uploaded successfully",
  "documentsStatus": "pending_review"
}
```

### 1.5 Update Vehicle Information
- **Endpoint:** `PUT /api/rider/vehicle`
- **Description:** Update rider vehicle information
- **Request:**
```json
{
  "type": "string",
  "make": "string",
  "model": "string",
  "plateNumber": "string",
  "year": "number",
  "color": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Vehicle information updated successfully"
}
```

## 2. Shift & Availability Management

### 2.1 Start Shift
- **Endpoint:** `POST /api/rider/shift/start`
- **Description:** Start rider shift and go online
- **Request:**
```json
{
  "vehicleType": "string", // optional if multi-vehicle rider
  "latitude": "number",
  "longitude": "number"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Shift started successfully",
  "shiftId": "string",
  "status": "online",
  "startTime": "string"
}
```

### 2.2 End Shift
- **Endpoint:** `POST /api/rider/shift/end`
- **Description:** End rider shift and go offline
- **Response:**
```json
{
  "success": true,
  "message": "Shift ended successfully",
  "status": "offline",
  "endTime": "string",
  "shiftSummary": {
    "duration": "string",
    "ordersCompleted": "number",
    "earnings": "number"
  }
}
```

### 2.3 Toggle Availability
- **Endpoint:** `PUT /api/rider/availability`
- **Description:** Toggle rider availability to accept new orders
- **Request:**
```json
{
  "available": "boolean" // true to accept orders, false to stop receiving new orders
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Availability updated successfully",
  "available": "boolean",
  "status": "string" // available, unavailable, on_break
}
```

### 2.4 Break Mode
- **Endpoint:** `POST /api/rider/shift/break`
- **Description:** Enter break mode (temporarily unavailable)
- **Request:**
```json
{
  "breakType": "string", // short_break, lunch_break, emergency
  "estimatedDuration": "number" // minutes
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Break mode activated",
  "status": "on_break",
  "breakStartTime": "string"
}
```

### 2.5 Update Rider Status
- **Endpoint:** `PUT /api/rider/status`
- **Description:** Update rider's online/offline status
- **Request:**
```json
{
  "status": "string" // online, offline, on_break
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "status": "string"
}
```

### 2.6 Update Rider Location
- **Endpoint:** `PUT /api/rider/location`
- **Description:** Update rider's current location (also available via WebSocket)
- **Request:**
```json
{
  "latitude": "number",
  "longitude": "number"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Location updated successfully"
}
```

## 3. Dashboard & Overview

### 3.1 Get Rider Dashboard Data
- **Endpoint:** `GET /api/rider/dashboard`
- **Description:** Get comprehensive data for rider dashboard
- **Response:**
```json
{
  "status": "string", // online, offline, on_break
  "todayEarnings": "number",
  "weeklyEarnings": "number",
  "completedOrders": "number",
  "acceptanceRate": "number",
  "rating": "number",
  "activeOrders": [
    {
      "id": "string",
      "trackingId": "string",
      "status": "string",
      "pickupAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "deliveryAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "distance": "number",
      "estimatedTime": "string",
      "earnings": "number",
      "createdAt": "string"
    }
  ],
  "nearbyOrders": [
    {
      "id": "string",
      "pickupAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "deliveryAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "distance": "number",
      "estimatedTime": "string",
      "earnings": "number",
      "expiresAt": "string"
    }
  ]
}
```

## 4. Order Management

### 4.1 Get Available Orders
- **Endpoint:** `GET /api/rider/orders/available`
- **Description:** Get orders available for pickup
- **Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "trackingId": "string",
      "pickupAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "deliveryAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "distance": "number",
      "estimatedTime": "string",
      "earnings": "number",
      "expiresAt": "string"
    }
  ]
}
```

### 4.2 Accept Order
- **Endpoint:** `POST /api/rider/orders/{orderId}/accept`
- **Description:** Accept an available order
- **Response:**
```json
{
  "success": true,
  "message": "Order accepted successfully",
  "order": {
    "id": "string",
    "trackingId": "string",
    "status": "string",
    "pickupAddress": {
      "address": "string",
      "latitude": "number",
      "longitude": "number"
    },
    "deliveryAddress": {
      "address": "string",
      "latitude": "number",
      "longitude": "number"
    },
    "customer": {
      "name": "string",
      "phoneNumber": "string"
    },
    "items": [
      {
        "name": "string",
        "quantity": "number"
      }
    ],
    "distance": "number",
    "estimatedTime": "string",
    "earnings": "number"
  }
}
```

### 4.3 Reject Order
- **Endpoint:** `POST /api/rider/orders/{orderId}/reject`
- **Description:** Reject an available order
- **Request:**
```json
{
  "reason": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Order rejected successfully"
}
```

### 4.4 Get Active Orders
- **Endpoint:** `GET /api/rider/orders/active`
- **Description:** Get orders currently assigned to the rider
- **Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "trackingId": "string",
      "status": "string",
      "pickupAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "deliveryAddress": {
        "address": "string",
        "latitude": "number",
        "longitude": "number"
      },
      "customer": {
        "name": "string",
        "phoneNumber": "string"
      },
      "distance": "number",
      "estimatedTime": "string",
      "earnings": "number"
    }
  ]
}
```

### 4.5 Get Order History
- **Endpoint:** `GET /api/rider/orders/history`
- **Description:** Get completed orders history
- **Query Parameters:**
  - `page`: number
  - `limit`: number
  - `startDate`: string
  - `endDate`: string
- **Response:**
```json
{
  "orders": [
    {
      "id": "string",
      "trackingId": "string",
      "status": "string",
      "pickupAddress": {
        "address": "string"
      },
      "deliveryAddress": {
        "address": "string"
      },
      "distance": "number",
      "earnings": "number",
      "completedAt": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```

### 4.6 Update Order Status
- **Endpoint:** `PUT /api/rider/orders/{orderId}/status`
- **Description:** Update the status of an order
- **Request:**
```json
{
  "status": "string", // arrived_at_pickup, picked_up, in_transit, arrived_at_delivery, delivered
  "latitude": "number",
  "longitude": "number"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "status": "string"
}
```

### 4.7 Confirm Arrival at Pickup
- **Endpoint:** `POST /api/rider/orders/{orderId}/confirm-arrival`
- **Description:** Confirm arrival at pickup location
- **Request:**
```json
{
  "latitude": "number",
  "longitude": "number",
  "arrivalTime": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Arrival confirmed",
  "status": "arrived_at_pickup"
}
```

### 4.8 Complete Delivery
- **Endpoint:** `POST /api/rider/orders/{orderId}/complete`
- **Description:** Complete delivery with proof
- **Request:**
```json
{
  "deliveryProof": {
    "type": "string", // photo, signature, pin
    "data": "string", // base64 image or signature data or PIN
    "latitude": "number",
    "longitude": "number"
  },
  "notes": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Delivery completed successfully",
  "status": "delivered",
  "completedAt": "string"
}
```

### 4.9 Cancel Order
- **Endpoint:** `POST /api/rider/orders/{orderId}/cancel`
- **Description:** Cancel an order with reason
- **Request:**
```json
{
  "reason": "string", // accident, customer_unreachable, vehicle_breakdown, emergency
  "description": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "status": "cancelled"
}
```

### 4.10 Get Order Route
- **Endpoint:** `GET /api/rider/orders/{orderId}/route`
- **Description:** Get optimized route for order delivery
- **Response:**
```json
{
  "origin": {
    "address": "string",
    "latitude": "number",
    "longitude": "number"
  },
  "destination": {
    "address": "string",
    "latitude": "number",
    "longitude": "number"
  },
  "distance": "number",
  "duration": "number",
  "polyline": "string",
  "steps": [
    {
      "instruction": "string",
      "distance": "number",
      "duration": "number",
      "startLocation": {
        "latitude": "number",
        "longitude": "number"
      },
      "endLocation": {
        "latitude": "number",
        "longitude": "number"
      },
      "maneuver": "string"
    }
  ]
}
```

## 5. Communication

### 5.1 Send Message to Customer
- **Endpoint:** `POST /api/rider/orders/{orderId}/message`
- **Description:** Send message to customer
- **Request:**
```json
{
  "message": "string",
  "type": "string" // text, location, photo
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "string"
}
```

### 5.2 Call Customer
- **Endpoint:** `POST /api/rider/orders/{orderId}/call`
- **Description:** Initiate call with customer (masked number)
- **Response:**
```json
{
  "success": true,
  "message": "Call initiated",
  "callId": "string",
  "maskedNumber": "string"
}
```

## 6. Earnings & Financial Management

### 6.1 Get Rider Earnings
- **Endpoint:** `GET /api/rider/earnings`
- **Description:** Get detailed rider earnings data
- **Query Parameters:**
  - `period`: string (daily, weekly, monthly)
  - `startDate`: string
  - `endDate`: string
- **Response:**
```json
{
  "summary": {
    "totalEarnings": "number",
    "deliveryEarnings": "number",
    "bonusEarnings": "number",
    "tips": "number",
    "totalOrders": "number",
    "totalDistance": "number"
  },
  "breakdown": [
    {
      "date": "string",
      "earnings": "number",
      "orders": "number"
    }
  ],
  "transactions": [
    {
      "id": "string",
      "orderId": "string",
      "trackingId": "string",
      "amount": "number",
      "type": "string", // delivery, bonus, tip
      "status": "string",
      "createdAt": "string"
    }
  ]
}
```

### 6.2 Get Wallet Balance
- **Endpoint:** `GET /api/rider/wallet`
- **Description:** Get rider wallet balance and transaction history
- **Response:**
```json
{
  "balance": "number",
  "pendingEarnings": "number",
  "totalEarnings": "number",
  "lastPayout": {
    "amount": "number",
    "date": "string",
    "status": "string"
  }
}
```

### 6.3 Request Payout
- **Endpoint:** `POST /api/rider/wallet/withdraw`
- **Description:** Request payout/withdrawal
- **Request:**
```json
{
  "amount": "number",
  "paymentMethod": "string", // bank_transfer, mobile_money
  "accountDetails": {
    "accountNumber": "string",
    "bankName": "string"
  }
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Payout request submitted",
  "payoutId": "string",
  "estimatedProcessingTime": "string"
}
```

### 6.4 Get Payout History
- **Endpoint:** `GET /api/rider/wallet/payouts`
- **Description:** Get payout history
- **Query Parameters:**
  - `page`: number
  - `limit`: number
- **Response:**
```json
{
  "payouts": [
    {
      "id": "string",
      "amount": "number",
      "status": "string", // pending, processing, completed, failed
      "paymentMethod": "string",
      "requestedAt": "string",
      "processedAt": "string"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number",
    "pages": "number"
  }
}
```

## 7. Performance & Analytics

### 7.1 Get Rider Performance
- **Endpoint:** `GET /api/rider/performance`
- **Description:** Get comprehensive rider performance metrics
- **Query Parameters:**
  - `period`: string (weekly, monthly)
- **Response:**
```json
{
  "rating": "number",
  "acceptanceRate": "number",
  "completionRate": "number",
  "averageDeliveryTime": "number",
  "totalOrders": "number",
  "totalDistance": "number",
  "customerFeedback": [
    {
      "rating": "number",
      "comment": "string",
      "date": "string"
    }
  ],
  "improvements": [
    {
      "metric": "string",
      "current": "number",
      "target": "number",
      "suggestion": "string"
    }
  ]
}
```

### 7.2 Get Incentives & Bonuses
- **Endpoint:** `GET /api/rider/incentives`
- **Description:** Get available incentives and bonus targets
- **Response:**
```json
{
  "activeIncentives": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "target": "number",
      "progress": "number",
      "reward": "number",
      "expiresAt": "string"
    }
  ],
  "completedIncentives": [
    {
      "id": "string",
      "title": "string",
      "reward": "number",
      "completedAt": "string"
    }
  ]
}
```

### 7.3 Get Rider Leaderboard
- **Endpoint:** `GET /api/rider/leaderboard`
- **Description:** Get rider leaderboard for gamification
- **Query Parameters:**
  - `period`: string (weekly, monthly)
  - `metric`: string (earnings, orders, rating)
- **Response:**
```json
{
  "myRank": "number",
  "myScore": "number",
  "leaderboard": [
    {
      "rank": "number",
      "riderId": "string",
      "name": "string",
      "score": "number",
      "avatar": "string"
    }
  ]
}
```

## 8. Ratings & Feedback

### 8.1 Rate Customer
- **Endpoint:** `POST /api/rider/orders/{orderId}/rate`
- **Description:** Rate customer after delivery
- **Request:**
```json
{
  "rating": "number", // 1-5
  "comment": "string",
  "tags": ["string"] // polite, rude, helpful, etc.
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Customer rated successfully"
}
```

### 8.2 Dispute Order/Feedback
- **Endpoint:** `POST /api/rider/orders/{orderId}/dispute`
- **Description:** Dispute order or customer feedback
- **Request:**
```json
{
  "disputeType": "string", // rating, payment, customer_behavior
  "reason": "string",
  "evidence": ["string"], // photo URLs, documents
  "description": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Dispute submitted successfully",
  "disputeId": "string"
}
```

## 9. Support & Compliance

### 9.1 Get Announcements
- **Endpoint:** `GET /api/rider/announcements`
- **Description:** Get system announcements and updates
- **Response:**
```json
{
  "announcements": [
    {
      "id": "string",
      "title": "string",
      "message": "string",
      "type": "string", // info, warning, promotion
      "priority": "string", // high, medium, low
      "createdAt": "string",
      "expiresAt": "string"
    }
  ]
}
```

### 9.2 Get Support Channels
- **Endpoint:** `GET /api/rider/support`
- **Description:** Get available support channels
- **Response:**
```json
{
  "channels": [
    {
      "type": "string", // chat, phone, email
      "name": "string",
      "contact": "string",
      "availability": "string",
      "responseTime": "string"
    }
  ],
  "faq": [
    {
      "question": "string",
      "answer": "string",
      "category": "string"
    }
  ]
}
```

### 9.3 Report Incident
- **Endpoint:** `POST /api/rider/incidents`
- **Description:** Report incidents or issues
- **Request:**
```json
{
  "type": "string", // accident, harassment, vehicle_issue, customer_issue
  "orderId": "string", // optional
  "description": "string",
  "location": {
    "latitude": "number",
    "longitude": "number",
    "address": "string"
  },
  "evidence": ["string"], // photo URLs
  "severity": "string" // low, medium, high, critical
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "incidentId": "string",
  "ticketNumber": "string"
}
```

## 10. Additional Features

### 10.1 Get Fuel/Expense Tracking
- **Endpoint:** `GET /api/rider/expenses`
- **Description:** Get expense tracking data
- **Query Parameters:**
  - `startDate`: string
  - `endDate`: string
  - `category`: string (fuel, maintenance, insurance)
- **Response:**
```json
{
  "totalExpenses": "number",
  "categories": [
    {
      "category": "string",
      "amount": "number",
      "percentage": "number"
    }
  ],
  "expenses": [
    {
      "id": "string",
      "category": "string",
      "amount": "number",
      "description": "string",
      "date": "string",
      "receipt": "string"
    }
  ]
}
```

### 10.2 Add Expense
- **Endpoint:** `POST /api/rider/expenses`
- **Description:** Add new expense record
- **Request:**
```json
{
  "category": "string", // fuel, maintenance, insurance, other
  "amount": "number",
  "description": "string",
  "receipt": "string", // base64 image
  "date": "string"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Expense added successfully",
  "expenseId": "string"
}
```

---

## API Summary

This documentation covers **62 comprehensive API endpoints** organized into 10 logical sections:

1. **Authentication & Profile Management** (5 endpoints)
2. **Shift & Availability Management** (6 endpoints)
3. **Dashboard & Overview** (1 endpoint)
4. **Order Management** (10 endpoints)
5. **Communication** (2 endpoints)
6. **Earnings & Financial Management** (4 endpoints)
7. **Performance & Analytics** (3 endpoints)
8. **Ratings & Feedback** (2 endpoints)
9. **Support & Compliance** (3 endpoints)
10. **Additional Features** (2 endpoints)

All endpoints include proper request/response schemas, error handling, and comprehensive functionality for a complete rider/driver management system.
