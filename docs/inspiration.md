# Inspiration

This document captures the current product inspiration and extracted implementation guidance from the NTUMAI delivery app documentation files:

- `NTUMAIDELIVERYAPPDOCUMENTATION.docx`
- `NTUMAIDELIVERYAPPDOCUMENTATION(1).docx`

It is written as working product reference, not as a final specification.

## Source Summary

The documentation describes a multi-role on-demand platform with three main roles:

- Customer
- Driver / Rider
- Merchant / Vendor

The product is modeled around food delivery, marketplace ordering, parcel delivery, and errand-style task execution, with live tracking, payments, ratings, and role-specific operations.

## Core Workflow Families

### 1. Customer

#### Onboarding

Flow:

1. App launch
2. Splash screen
3. Welcome screen
4. Login or Sign Up
5. Verification
6. Profile setup
7. Home screen

States:

- Not logged in
- Verifying
- Profile setup
- Logged in

Edge cases:

- Wrong or expired verification code
- Email or phone already registered
- Location permission denied

#### Food / Marketplace Ordering

Flow:

1. Browse restaurants or categories
2. Search or filter items
3. Open store
4. View menu and product details
5. Add items to cart
6. Review cart and notes
7. Checkout
8. Select address, delivery time, promo, payment
9. Place order
10. Track order
11. Receive delivery
12. Rate food and delivery

States:

- Browsing
- Selecting
- Customizing
- Checking out
- Confirmed
- On the way
- Delivered
- Rated

Key screens:

- Home
- Restaurant List
- Menu
- Cart
- Checkout
- Order Confirmation
- Live Tracking
- Payment
- Rating

Edge cases:

- Restaurant closed
- Out of stock during checkout
- Driver cannot find address
- Customer unavailable at delivery
- Payment failure

#### Send Package / Courier

Flow:

1. Tap `Send Package`
2. Select item type
3. Enter description
4. Set pickup and dropoff
5. Add instructions and proof requirements
6. Choose schedule
7. Review estimate and payment
8. Place order
9. Track package
10. Complete delivery

States:

- Mode selection
- Item description
- Address setup
- Instructions
- Scheduling
- Driver matching
- Picked up
- On the way
- Delivered
- Paid

Edge cases:

- Item too large
- Recipient unavailable
- Fragile item damaged
- Incorrect address

#### Retail / Store Ordering

Flow:

1. Browse retail categories
2. Select store
3. View catalog
4. Add products
5. Checkout
6. Choose delivery timing
7. Choose payment method
8. Place order
9. Track courier
10. Inspect on delivery
11. Complete rating

States:

- Category browsing
- Store selection
- Product viewing
- Adding options
- Checking out
- Processing
- Delivering
- Verifying
- Completed

Edge cases:

- Product out of stock
- Wrong item delivered
- Damaged delivery
- Warranty activation failure
- Return or refund request

#### Payment Flow

Flow:

1. Review cart
2. Review payment info
3. Proceed to checkout
4. Add shipping address
5. Select payment method
6. Enter card details or choose saved method
7. Payment processing
8. On success, move to active orders

States:

- Payment method selection
- Processing
- Success
- Failed

Edge cases:

- Insufficient funds
- Card declined
- Network failure
- Partial payment success
- Gateway timeout

#### Live Tracking

Flow:

1. Order placed
2. View confirmation
3. Track order
4. View live delivery state
5. View driver, buyer, store, and product information
6. Contact driver from tracking

States:

- Order accepted
- On the way
- Delivered

Edge cases:

- Unexpected route
- Restaurant delay
- Address issues
- Mid-delivery instruction changes

#### Order History and Ratings

Flow:

1. Open order history
2. View past orders
3. Open details
4. Rate restaurant or delivery
5. Optionally upload image
6. Submit rating

States:

- Viewing history
- Selecting order
- Rating
- Submission complete

Edge cases:

- User wants to modify rating
- Driver no longer on platform

#### Profile Management

Flow:

1. Open profile
2. Edit personal information
3. Manage password
4. Manage saved addresses
5. Manage payment methods
6. Update preferences

States:

- Viewing profile
- Editing
- Saving
- Updated

Edge cases:

- Duplicate email or phone
- Invalid address format
- Payment method verification failed

### 2. Driver / Rider / Tasker

#### Registration / Onboarding

Flow:

1. Download app
2. Select sign up
3. Enter personal details
4. Upload documents
5. Admin review
6. Approval
7. Vehicle setup

States:

- Application started
- Document upload
- Under review
- Approved / Rejected
- Active

Edge cases:

- Rejected documents
- Background check failure
- Unsupported vehicle type
- Duplicate application

#### Online / Offline

Flow:

1. Login
2. Tap `Go Online`
3. Receive delivery requests
4. Tap `Go Offline`
5. View time and earnings summary

States:

- Offline
- Going online
- Online
- Going offline
- Offline

Edge cases:

- Poor connection
- Admin forced offline

#### Job Assignment

Flow:

1. Receive request notification
2. View pickup, dropoff, earnings, items, distance
3. Accept or decline
4. Accepted jobs move to active queue
5. Declined jobs move to another rider

States:

- Request received
- Reviewing
- Accepted / Declined
- Added to queue

Edge cases:

- Missed background notification
- Multiple simultaneous requests
- Expired request
- Acceptance failure

#### Pickup to Dropoff

Flow:

1. Navigate to pickup
2. Arrive at pickup
3. Wait if needed
4. Confirm pickup
5. Navigate to dropoff
6. Arrive at dropoff
7. Hand over item
8. Confirm completion
9. Earnings updated

States:

- To pickup
- Arrived at pickup
- Order received
- To dropoff
- Arrived at dropoff
- Delivered
- Completed

Edge cases:

- Order not ready
- Wrong order
- Customer unavailable
- Address inaccessible
- Customer refusal

#### Earnings and Payouts

Flow:

1. View earnings dashboard
2. See delivery-by-delivery breakdown
3. Open payouts
4. Set payout method
5. Request payout
6. View payout history

States:

- Earnings accruing
- Payout requested
- Processing
- Transferred

Edge cases:

- Disputed orders
- Failed bank verification

### 3. Merchant / Vendor

#### Onboarding

Flow:

1. Register business
2. Enter business details
3. Upload business documents
4. Set payout account
5. Admin review
6. Receive approval and access

States:

- Registered
- Document submission
- Under review
- Approved
- Active

Edge cases:

- Invalid documents
- Duplicate listing
- Regulated goods requirements

#### Accept / Manage Orders

Flow:

1. Receive new order
2. View items and instructions
3. Accept order
4. Prepare order
5. Mark ready for pickup
6. Driver notified
7. Handover with optional OTP
8. Track completion

States:

- New order
- Accepted
- Preparing
- Ready
- Picked up
- Completed

Edge cases:

- Cancellation before prep
- Out of stock after acceptance
- Modification request
- Late pickup

#### Menu / Services / Pricing Management

Flow:

1. Open menu dashboard
2. Add items
3. Edit items
4. Delete items
5. Manage categories, brands, promotions

States:

- Viewing menu
- Editing
- Saving
- Updated

Edge cases:

- Price sync errors
- Failed image upload
- Bulk editing needs
- Time-based pricing

## Key Product Features

### Customer

- Marketplace discovery
- Search and category filters
- Live tracking
- Flexible payments
- Order history and ratings
- Profile and saved addresses

### Driver / Rider

- Intelligent assignment
- Online / offline state
- Job offer review
- Navigation to pickup and dropoff
- Earnings dashboard
- Safety tooling
- Surge map concepts

### Merchant / Vendor

- Store onboarding
- Order management
- Product and menu management
- Promotions and pricing controls
- Analytics and reporting

## Advanced / Nice-to-Have Concepts

- Ntumai Plus membership
- Group orders
- Safety shield
- Gamification and tiers
- Surge pricing
- Advanced merchant analytics

These should be treated as later-phase features unless a backend contract already exists.

## Screen Inventory Reference

### Customer

- Splash
- Welcome / Onboarding
- Login
- Signup
- Home
- Marketplace / Restaurant Detail
- Cart
- Checkout
- Payment
- Tracking
- Order History
- Help Center

### Driver / Rider

- Login
- Home
- Online / Offline dashboard
- Job Offer
- Active Job
- Earnings
- Profile
- Safety Center

### Merchant / Vendor

- Dashboard
- Order Management
- Product / Menu Management
- Promotions
- Brands

## Finance / Wallet Interpretation From Docs

The documentation clearly supports the need for finance flows, but it does not define a complete ledger architecture.

What the docs imply:

- Customers need payment methods and payment processing
- Riders need earnings visibility and payout requests
- Merchants need business payout configuration and payout visibility

What the docs do **not** fully define:

- a stored-value customer wallet model
- a wallet ledger and reconciliation model
- pending vs available balance rules
- settlement timing and dispute handling rules
- commission and payout calculation rules

For implementation, this means:

1. Tasker earnings can be treated as real finance summary data
2. Vendor finance can be derived from completed order data
3. Payout requests should be modeled explicitly
4. A true stored-value wallet should not be invented unless the backend product contract is defined

## Current Product Guidance

Use this document as implementation inspiration for:

- role workflows
- expected user states
- edge-case handling
- screen inventory
- finance scope boundaries
- tracking, chat, and notification expectations

Do **not** treat it as final API contract or final product spec.
