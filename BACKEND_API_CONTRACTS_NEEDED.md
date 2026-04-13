# Backend API Contracts Needed

This document lists the backend contracts still needed to replace the remaining mock APIs in the app.

The remaining mocks are primarily implemented in `src/api/mockServices.ts` and `src/api/mockAuthServices.ts`, and are consumed by the stores in `src/store/slices/*`.

## Transport Recommendations

Use this as the default split for the VPS backend:

- Use `REST` for request/response flows:
  - auth
  - marketplace browsing
  - product/vendor detail
  - delivery creation
  - task creation
  - payment setup and confirmation
  - wallet reads and mutations
  - notifications list/read/delete
  - vendor admin CRUD
- Use `WebSocket` for live state:
  - incoming tasker job offers
  - live driver/tasker location
  - live order or delivery status changes
  - push-style in-app notification events
- Use `REST + WebSocket` together where both are needed:
  - tasker dispatch: REST to accept/reject/go online, WebSocket to receive offers
  - delivery tracking: REST for initial detail, WebSocket for live movement/status
  - notifications: REST for inbox/history, WebSocket for new event delivery

## What The VPS Should Expose

At minimum, the custom VPS should provide:

- `HTTPS REST API`
  - JSON endpoints
  - bearer-token auth
  - pagination on list endpoints
  - consistent error format
- `WSS WebSocket endpoint`
  - authenticated socket connection
  - subscribe/unsubscribe by channel, order, delivery, tasker, or user
  - server-to-client events for realtime updates
- `Persistent storage`
  - users
  - auth sessions / refresh tokens
  - deliveries
  - tasks / bookings
  - products / stores / vendor data
  - wallet / payment records
  - notifications
- `Background job support`
  - OTP delivery
  - notification fanout
  - delivery status propagation
  - payout / payment webhooks if needed

Recommended base shape:

- REST base: `https://your-domain.com/api/v1`
- WebSocket base: `wss://your-domain.com/ws`

Recommended cross-cutting behavior:

- JWT or opaque bearer access tokens
- refresh token flow
- request IDs in responses
- ISO datetime strings
- stable enum values
- idempotency on payment-creation endpoints
- webhook support for payment gateways

## Priority 1: Auth

Used by:
- `src/store/slices/authSlice.improved.ts`
- `src/api/modules/auth/otp.ts`

Recommended transport:
- `REST only`

What the VPS should provide:
- OTP send/verify endpoints over HTTPS
- token issuance
- refresh token storage
- logout / session invalidation
- role-selection onboarding endpoint

Needed contracts:

### `POST /api/v1/auth/otp/start`

Request:

```json
{
  "email": "optional",
  "phone": "optional",
  "deviceId": "optional"
}
```

Response:

```json
{
  "sessionId": "string",
  "expiresIn": 600,
  "flowType": "login | signup",
  "channelsSent": ["sms", "email"],
  "message": "optional"
}
```

### `POST /api/v1/auth/otp/verify`

Request:

```json
{
  "sessionId": "string",
  "otp": "string",
  "deviceId": "optional"
}
```

Response for existing user:

```json
{
  "flowType": "login",
  "requiresRoleSelection": false,
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600,
  "user": {}
}
```

Response for new user:

```json
{
  "flowType": "signup",
  "requiresRoleSelection": true,
  "onboardingToken": "string",
  "user": {}
}
```

### `POST /api/v1/auth/select-role`

Request:

```json
{
  "onboardingToken": "string",
  "role": "customer | tasker | vendor"
}
```

Response:

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": 3600,
  "user": {}
}
```

### Also Needed

- `GET /api/v1/auth/me`
- refresh-token endpoint
- logout endpoint

Exact enums needed:
- `flowType`
- `role`
- auth/session error codes

## Priority 2: Marketplace

Used by:
- `src/store/slices/marketplaceSlice.ts`

Recommended transport:
- `REST only`

What the VPS should provide:
- searchable store and product endpoints
- category endpoints
- pagination and filtering
- image URLs for stores/products

Needed contracts:
- `GET /marketplace/stores?lat&lng&search`
- `GET /marketplace/stores/:storeId`
- `GET /marketplace/stores/:storeId/products?categoryId`
- `GET /marketplace/stores/:storeId/categories` or equivalent
- `GET /marketplace/products/:productId`
- `GET /marketplace/products/search?q&filters...`

Expected store fields:

### Store

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "logo": "string",
  "rating": 0,
  "reviewCount": 0,
  "deliveryTime": "string",
  "deliveryFee": 0,
  "minimumOrder": 0,
  "isOpen": true
}
```

### Product

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": 0,
  "image": "string",
  "category": "string",
  "vendorId": "string",
  "vendorName": "string",
  "rating": 0,
  "reviewCount": 0,
  "isAvailable": true,
  "preparationTime": 0
}
```

## Priority 3: Customer Delivery / Send Parcel

Used by:
- `src/store/slices/deliverySlice.ts`

Recommended transport:
- `REST + WebSocket`

What the VPS should provide:
- REST for create/list/detail/estimate
- WebSocket for live delivery status and courier location

Needed contracts:
- `POST /deliveries`
- `GET /deliveries?userId&role`
- `GET /deliveries/:id`
- tracking endpoint for delivery status and driver location
- pricing/estimate endpoint

Expected response fields:

```json
{
  "id": "string",
  "status": "string",
  "pickupLocation": {},
  "dropoffLocation": {},
  "estimatedPrice": 0,
  "estimatedTime": "string",
  "distance": "string",
  "driverLocation": {
    "latitude": 0,
    "longitude": 0,
    "timestamp": "string"
  }
}
```

## Priority 4: Task / Errand Bookings

Used by:
- `src/store/slices/taskSlice.ts`

Recommended transport:
- `REST`
- `WebSocket recommended later` if live assignment/progress updates are needed

What the VPS should provide:
- REST for create/list/detail/update/rate
- optionally WebSocket events for assignment and completion updates

Needed contracts:
- `POST /matching/bookings`
- `GET /matching/bookings?userId&role`
- `GET /matching/bookings/:bookingId`
- status/progress update endpoint
- rating/review endpoint

Expected fields:

```json
{
  "id": "string",
  "customerId": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "items": [],
  "budget": 0,
  "status": "string",
  "location": {},
  "assignedTo": "optional",
  "rating": "optional",
  "review": "optional"
}
```

## Priority 5: Tasker / Dispatch / Jobs

Used by:
- `src/store/slices/taskerSlice.ts`

Recommended transport:
- `REST + WebSocket`

What the VPS should provide:
- REST for go online/offline, fetch current jobs, accept/reject
- WebSocket for incoming offers and live dispatch state
- optional heartbeat/presence updates for active taskers

Needed contracts:
- nearby jobs endpoint
- accept job endpoint
- reject job endpoint
- incoming offers endpoint or realtime event
- go online endpoint
- go offline endpoint
- tasker stats endpoint
- tasker earnings endpoint
- location update endpoint

Expected job fields:

```json
{
  "id": "string",
  "type": "order | task",
  "customerName": "string",
  "amount": "string | number",
  "pickupAddress": "string",
  "dropoffAddress": "string",
  "status": "string"
}
```

## Priority 6: Wallet / Payments

Used by:
- `src/store/slices/walletSlice.ts`

Recommended transport:
- `REST only`

What the VPS should provide:
- payment method CRUD
- payment intent creation
- payment confirmation
- wallet balance and transactions
- withdraw request handling
- webhook receiver for payment provider callbacks

Needed contracts:
- wallet balance endpoint
- wallet transactions endpoint
- add funds endpoint
- withdraw endpoint
- `GET /payments/methods`
- `POST /payments/methods`
- payment intent/create endpoint
- payment confirm endpoint

Expected fields:

### Wallet

```json
{
  "balance": 0,
  "currency": "ZMW"
}
```

### Transaction

```json
{
  "id": "string",
  "type": "credit | debit",
  "amount": 0,
  "description": "string",
  "timestamp": "string",
  "status": "pending | completed | failed"
}
```

### Payment Method

```json
{
  "id": "string",
  "type": "card | cash | paypal | mobile_money",
  "last4": "optional",
  "brand": "optional",
  "isDefault": true
}
```

### Payment Intent

```json
{
  "paymentId": "string",
  "orderId": "string",
  "amount": 0,
  "status": "string",
  "clientSecret": "string"
}
```

## Priority 7: Notifications

Used by:
- `src/store/slices/notificationSlice.ts`

Recommended transport:
- `REST + WebSocket`

What the VPS should provide:
- REST for notification history and read/delete actions
- WebSocket for new notification events in-app
- optional push-token registration endpoint

Needed contracts:
- `GET /notifications?limit`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `DELETE /notifications/:id`
- optional device registration endpoint

Expected fields:

```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "title": "string",
  "message": "string",
  "isRead": false,
  "createdAt": "string"
}
```

## Priority 8: Vendor Admin

Mock service exists in:
- `src/api/mockServices.ts`

Recommended transport:
- `REST only`

What the VPS should provide:
- vendor profile CRUD
- store product CRUD
- vendor order management
- analytics summary endpoints

Needed contracts:
- vendor profile get/update
- vendor orders list
- vendor order status update
- vendor products CRUD
- vendor analytics/stats

## Priority 9: Realtime Contracts

Needed to remove simulated flows:
- incoming job offer event
- order status update event
- driver/tasker location update event
- notification push event

Suggested delivery:
- WebSocket or SSE contract
- event names
- payload schema per event
- auth method for socket connection

Recommended transport:
- `WebSocket preferred`
- `SSE acceptable` for one-way streams, but WebSocket is better here because the app likely needs bidirectional presence/ack flows

What the VPS should provide:
- authenticated socket connect
- channel subscription model
- reconnect-safe event delivery strategy
- event payload versioning
- optional ack IDs for critical events

## Preferred Backend Handoff Format

Best options:
- OpenAPI spec
- Postman collection
- Markdown/API doc with exact request and response samples

For each endpoint, include:
- method
- path
- auth requirement
- request body
- success response
- error response
- enum values exactly as returned by backend

For each realtime event, include:
- socket path
- auth handshake format
- event name
- subscription key
- event payload
- reconnect behavior

## Notes

Current endpoint constants already suggest the intended backend surface in:
- `src/api/config.ts`

The main remaining mock consumers are:
- `src/store/slices/authSlice.improved.ts`
- `src/store/slices/marketplaceSlice.ts`
- `src/store/slices/deliverySlice.ts`
- `src/store/slices/taskSlice.ts`
- `src/store/slices/taskerSlice.ts`
- `src/store/slices/walletSlice.ts`
- `src/store/slices/notificationSlice.ts`
