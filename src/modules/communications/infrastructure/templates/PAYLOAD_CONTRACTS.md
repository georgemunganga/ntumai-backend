# Template Payload Contracts

This file defines the reusable payload shape for the email system.

## Shared Base Context

Available to every template through `sendEmail()`:

- `year`
- `appUrl`
- `appName`
- `supportEmail`
- `companyName`
- `companyUrl`
- `brandPrimary`
- `brandPrimaryDark`
- `brandAccent`
- `fontFamily`
- `emailTitle`
- `preheader`

## Reusable Optional Fields

Use these fields across templates instead of inventing new structures each time:

- `headline: string`
- `subheadline: string`
- `message: string`
- `ctaLabel: string`
- `ctaUrl: string`
- `details: Array<{ label: string; value: string }>`

## Template-Specific Required Fields

### OTP
- `otp`
- `purpose`
- `expiryMinutes`

### Welcome
- `firstName`

### Password reset
- `otp`
- `expiryMinutes`

### Marketing promo templates
- `headline`
- `subheadline`
- `message`

## Recommended Detail Rows by Flow

### Order and delivery
- `Order ID`
- `Items`
- `Delivery Address`
- `Amount`
- `ETA`
- `Rider`
- `Phone`

### Payments
- `Transaction ID`
- `Amount`
- `Currency`
- `Payment Method`
- `Reference`
- `Date`

### Vendor reports
- `Period`
- `Total Orders`
- `Revenue`
- `Completion Rate`
- `Average Rating`

### Tasker reports
- `Period`
- `Completed Jobs`
- `Earnings`
- `Acceptance Rate`
- `Rating`

### Admin alerts
- `Alert Type`
- `Severity`
- `Entity`
- `Reference`
- `Triggered At`

## Rendering Rule

Prefer:
- `details[]` for structured data
- `ctaLabel` and `ctaUrl` for actions

Avoid:
- one-off HTML blocks inside service methods
- ad hoc context keys when `details[]` can represent the same data cleanly
