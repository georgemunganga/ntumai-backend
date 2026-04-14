# Storage Roadmap

This is a later-have plan, not a current blocker for KYC/mobile integration.

## Current Phase

KYC document uploads currently use local server filesystem storage:

- backend saves files under `public/uploads/kyc`
- backend stores the document URL in `UserRoleAssignment.metadata`
- mobile consumes document metadata through the KYC REST endpoints

This is acceptable for the current single-server development phase.

## Later-Have Target

Add a backend-wide storage module that all features use instead of writing directly to disk.

Planned module:

- `src/modules/storage`

Core responsibilities:

- save files
- delete files
- resolve public URLs
- generate private/signed read URLs
- support multiple storage providers
- keep storage implementation out of feature controllers

Supported drivers:

- `local` for VPS/dev
- `s3-compatible` for object storage later, such as S3, Cloudflare R2, Wasabi, or MinIO

## File Metadata

Long term, add a `StoredFile` table so features store file references instead of raw URLs.

Recommended fields:

- `id`
- `provider`
- `bucket`
- `key`
- `visibility`
- `category`
- `mimeType`
- `originalName`
- `size`
- `checksum`
- `uploadedByUserId`
- `createdAt`

Feature-owned records should reference `StoredFile`.

Examples:

- KYC document -> `storedFileId`
- product image -> `storedFileId`
- user avatar -> `storedFileId`
- delivery proof photo -> `storedFileId`

## Visibility Rules

Use explicit visibility.

- `public`: product images, store logos, optional avatars
- `private`: KYC documents, payout documents, dispute evidence, sensitive delivery proof

KYC should move to private storage before production review workflows become sensitive.

## Object Key Convention

Use object-storage-friendly keys even for local storage:

- `kyc/vendor/{userId}/{fileId}.jpg`
- `kyc/tasker/{userId}/{fileId}.jpg`
- `marketplace/products/{productId}/{fileId}.jpg`
- `users/{userId}/avatar/{fileId}.jpg`
- `deliveries/{deliveryId}/proof/{fileId}.jpg`

This makes local-to-bucket migration easier.

## Admin Access Model

Admin frontends should not browse raw folders.

Admin should access files through backend domain endpoints:

- KYC submission details
- attached document metadata
- signed or proxied private document URLs

That keeps review access auditable and independent from the storage provider.

## Environment Shape

Local:

```env
STORAGE_DRIVER=local
STORAGE_LOCAL_ROOT=/var/ntumai/storage
STORAGE_PUBLIC_BASE_URL=https://api.ntumai.com/files
```

S3-compatible later:

```env
STORAGE_DRIVER=s3
STORAGE_S3_ENDPOINT=
STORAGE_S3_REGION=
STORAGE_S3_BUCKET=
STORAGE_S3_ACCESS_KEY=
STORAGE_S3_SECRET_KEY=
STORAGE_S3_FORCE_PATH_STYLE=false
```

## Implementation Phases

1. Add storage module abstraction with local driver.
2. Move local files outside the repo tree to `/var/ntumai/storage`.
3. Add `StoredFile` metadata table.
4. Change KYC documents to reference stored files instead of raw URLs.
5. Add private file proxy or signed URL read endpoints for admin review.
6. Add S3-compatible driver and switch using env config.
7. Migrate existing local KYC uploads into the configured storage provider.
