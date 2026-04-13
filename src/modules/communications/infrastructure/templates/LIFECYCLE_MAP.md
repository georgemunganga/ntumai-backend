# Communications Lifecycle Map

This file maps communication templates to product lifecycle stages so the same system can be reused consistently later.

## 1. Authentication and Security

Lifecycle moments:
- account verification
- password reset
- new login detection
- suspicious account activity

Templates:
- `otp-email.hbs`
- `password-reset-email.hbs`
- `login-alert-email.hbs`
- `suspicious-activity-alert-email.hbs`

Primary actors:
- customer
- tasker
- vendor
- admin

Core payload:
- `subject`
- `preheader`
- `details[]`
- `ctaLabel`
- `ctaUrl`

## 2. User Lifecycle

Lifecycle moments:
- account created
- role-specific onboarding
- profile incomplete
- first transaction encouragement
- inactivity and winback

Templates:
- `welcome-email.hbs`
- `welcome-customer-email.hbs`
- `welcome-tasker-email.hbs`
- `welcome-vendor-email.hbs`
- `profile-completion-reminder-email.hbs`
- `first-order-encouragement-email.hbs`
- `inactivity-reengagement-email.hbs`

Primary actors:
- customer
- tasker
- vendor

Core payload:
- `firstName`
- `details[]`
- `ctaLabel`
- `ctaUrl`

## 3. Order and Delivery Flow

Lifecycle moments:
- order placed
- order accepted
- order being prepared
- tasker assigned
- tasker en route
- delivery completed
- delivery failed or rescheduled

Templates:
- `order-confirmation-email.hbs`
- `order-accepted-email.hbs`
- `order-preparing-email.hbs`
- `tasker-assigned-email.hbs`
- `tasker-on-the-way-email.hbs`
- `delivery-completed-email.hbs`
- `delivery-failed-email.hbs`

Primary actors:
- customer

Core payload:
- `details[]` containing fields like order id, amount, address, eta, rider info
- `ctaLabel`
- `ctaUrl`

## 4. Payments and Wallet

Lifecycle moments:
- payment success
- payment failure
- refund issued
- wallet balance activity
- earnings summary
- receipt generation

Templates:
- `payment-success-email.hbs`
- `payment-failed-email.hbs`
- `refund-processed-email.hbs`
- `wallet-activity-email.hbs`
- `weekly-earnings-email.hbs`
- `invoice-receipt-email.hbs`

Primary actors:
- customer
- tasker
- vendor

Core payload:
- `details[]` containing amount, currency, transaction id, payout period, payment method
- `ctaLabel`
- `ctaUrl`

## 5. Vendor Operations

Lifecycle moments:
- new order received
- order still waiting on acceptance
- payout completed
- performance review
- stock threshold reached

Templates:
- `vendor-new-order-email.hbs`
- `vendor-order-reminder-email.hbs`
- `payout-processed-email.hbs`
- `vendor-performance-report-email.hbs`
- `stock-alert-email.hbs`

Primary actors:
- vendor

Core payload:
- `details[]` containing order count, amount, sku, payout batch, report period
- `ctaLabel`
- `ctaUrl`

## 6. Tasker Operations

Lifecycle moments:
- new nearby job
- job assigned
- daily earnings summary
- weekly performance report
- account warning or suspension risk

Templates:
- `new-job-available-email.hbs`
- `job-assigned-email.hbs`
- `daily-earnings-summary-email.hbs`
- `weekly-performance-report-email.hbs`
- `account-warning-email.hbs`

Primary actors:
- tasker

Core payload:
- `details[]` containing job id, payout estimate, area, shift period, policy issue
- `ctaLabel`
- `ctaUrl`

## 7. Reviews and Support

Lifecycle moments:
- ask for rating after completion
- complaint opened
- complaint updated

Templates:
- `rate-delivery-email.hbs`
- `rate-vendor-email.hbs`
- `complaint-received-email.hbs`
- `resolution-update-email.hbs`

Primary actors:
- customer
- vendor
- tasker

Core payload:
- `details[]`
- `ctaLabel`
- `ctaUrl`

## 8. Marketing and Growth

Lifecycle moments:
- promo blast
- nearby vendor discovery
- abandoned cart recovery
- referral push
- seasonal campaign

Templates:
- `promotion-email.hbs`
- `new-vendors-near-you-email.hbs`
- `abandoned-cart-email.hbs`
- `referral-program-email.hbs`
- `seasonal-campaign-email.hbs`

Primary actors:
- customer
- vendor
- tasker

Core payload:
- `headline`
- `subheadline`
- `message`
- `details[]`
- `ctaLabel`
- `ctaUrl`

## 9. System and Admin

Lifecycle moments:
- operations alert
- vendor approved
- tasker approved
- tasker rejected

Templates:
- `admin-alert-email.hbs`
- `vendor-onboarding-approved-email.hbs`
- `tasker-verification-approved-email.hbs`
- `tasker-verification-rejected-email.hbs`

Primary actors:
- admin
- vendor
- tasker

Core payload:
- `details[]`
- `ctaLabel`
- `ctaUrl`

## Missing High-Value Templates

These are still worth adding later:

- `email-verification-link-email.hbs`
- `delivery-rescheduled-email.hbs`
- `delivery-cancelled-email.hbs`
- `vendor-payout-failed-email.hbs`
- `tasker-account-suspended-email.hbs`
- `admin-payment-issue-email.hbs`
- `admin-failed-order-email.hbs`
- `receipt-with-line-items-email.hbs`
- `monthly-vendor-performance-report-email.hbs`
- `monthly-tasker-performance-report-email.hbs`

## Missing Wiring

Templates exist, but the service layer still lacks dedicated methods for most of them.

Current dedicated methods:
- `sendOtp`
- `sendWelcomeEmail`
- `sendPasswordResetEmail`
- `sendNotification`

Needs implementation:
- role-aware welcome methods
- order flow methods
- payment flow methods
- vendor operation methods
- tasker operation methods
- review and support methods
- marketing campaign methods
- admin alert methods
