# Errands Module API Documentation

## Overview
The Errands module manages task-based services where users can create, assign, and track completion of various errands. This module follows Domain-Driven Design (DDD) principles and is completely self-contained.

## Core Features
- Create and manage errands
- Assign errands to performers
- Track errand status and progress
- Maintain audit logs
- Handle proof of completion
- Template management for common errands

## API Endpoints

### 1. Create Errand
**Endpoint:** `POST /api/v1/errands`

**Description:** Create a new errand with title, description, locations, and optional pricing.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "title": "string (required, max 200 chars)",
  "description": "string (required, max 1000 chars)",
  "pickupLocation": {
    "address": "string (required)",
    "latitude": "number (optional)",
    "longitude": "number (optional)",
    "instructions": "string (optional, max 500 chars)"
  },
  "dropoffLocation": {
    "address": "string (required)",
    "latitude": "number (optional)",
    "longitude": "number (optional)",
    "instructions": "string (optional, max 500 chars)"
  },
  "price": "number (optional, min 0)",
  "priority": "low|medium|high (default: medium)",
  "deadline": "ISO8601 datetime (optional)",
  "category": "string (optional)",
  "requirements": "string[] (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "title": "string",
    "description": "string",
    "pickupLocation": {
      "address": "string",
      "latitude": "number",
      "longitude": "number",
      "instructions": "string"
    },
    "dropoffLocation": {
      "address": "string",
      "latitude": "number",
      "longitude": "number",
      "instructions": "string"
    },
    "price": "number",
    "priority": "string",
    "deadline": "ISO8601 datetime",
    "category": "string",
    "requirements": "string[]",
    "status": "pending",
    "createdBy": "string (user ID)",
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid authentication
- `422 Unprocessable Entity`: Validation errors

---

### 2. Get Errand Details
**Endpoint:** `GET /api/v1/errands/{id}`

**Description:** Retrieve complete information about a specific errand.

**Authentication:** Required (JWT)

**Path Parameters:**
- `id`: string (UUID) - Errand identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "title": "string",
    "description": "string",
    "pickupLocation": {
      "address": "string",
      "latitude": "number",
      "longitude": "number",
      "instructions": "string"
    },
    "dropoffLocation": {
      "address": "string",
      "latitude": "number",
      "longitude": "number",
      "instructions": "string"
    },
    "price": "number",
    "priority": "string",
    "deadline": "ISO8601 datetime",
    "category": "string",
    "requirements": "string[]",
    "status": "pending|assigned|in_progress|completed|cancelled",
    "assignedTo": "string (user ID) | null",
    "assignedAt": "ISO8601 datetime | null",
    "startedAt": "ISO8601 datetime | null",
    "completedAt": "ISO8601 datetime | null",
    "proofs": [
      {
        "type": "photo|receipt|signature|document",
        "url": "string",
        "description": "string",
        "uploadedAt": "ISO8601 datetime"
      }
    ],
    "createdBy": "string (user ID)",
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: No access to this errand
- `404 Not Found`: Errand not found

---

### 3. List Errands
**Endpoint:** `GET /api/v1/errands`

**Description:** Fetch errands with optional filtering and pagination.

**Authentication:** Required (JWT)

**Query Parameters:**
- `status`: string (optional) - Filter by status: `pending|assigned|in_progress|completed|cancelled`
- `assignedTo`: string (optional) - Filter by assigned user ID
- `createdBy`: string (optional) - Filter by creator user ID
- `category`: string (optional) - Filter by category
- `priority`: string (optional) - Filter by priority: `low|medium|high`
- `dateFrom`: ISO8601 datetime (optional) - Filter from date
- `dateTo`: ISO8601 datetime (optional) - Filter to date
- `page`: number (optional, default: 1) - Page number
- `limit`: number (optional, default: 20, max: 100) - Items per page
- `sortBy`: string (optional, default: createdAt) - Sort field
- `sortOrder`: string (optional, default: desc) - Sort order: `asc|desc`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "errands": [
      {
        "id": "string (UUID)",
        "title": "string",
        "status": "pending|assigned|in_progress|completed|cancelled",
        "priority": "string",
        "category": "string",
        "price": "number",
        "deadline": "ISO8601 datetime",
        "assignedTo": "string (user ID) | null",
        "createdBy": "string (user ID)",
        "createdAt": "ISO8601 datetime",
        "updatedAt": "ISO8601 datetime"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "totalPages": "number",
      "hasNext": "boolean",
      "hasPrev": "boolean"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Missing or invalid authentication

---

### 4. Assign Errand
**Endpoint:** `PATCH /api/v1/errands/{id}/assign`

**Description:** Assign an errand to a performer.

**Authentication:** Required (JWT)
**Authorization:** Errand creator or admin role

**Path Parameters:**
- `id`: string (UUID) - Errand identifier

**Request Body:**
```json
{
  "assignedTo": "string (required, user ID)",
  "notes": "string (optional, max 500 chars)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "status": "assigned",
    "assignedTo": "string (user ID)",
    "assignedAt": "ISO8601 datetime",
    "notes": "string",
    "updatedAt": "ISO8601 datetime"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data or errand cannot be assigned
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: No permission to assign this errand
- `404 Not Found`: Errand not found
- `409 Conflict`: Errand already assigned or not in assignable state

---

### 5. Start Errand
**Endpoint:** `PATCH /api/v1/errands/{id}/start`

**Description:** Mark an errand as started (in progress).

**Authentication:** Required (JWT)
**Authorization:** Assigned performer only

**Path Parameters:**
- `id`: string (UUID) - Errand identifier

**Request Body:**
```json
{
  "startLocation": {
    "latitude": "number (optional)",
    "longitude": "number (optional)"
  },
  "notes": "string (optional, max 500 chars)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "status": "in_progress",
    "startedAt": "ISO8601 datetime",
    "startLocation": {
      "latitude": "number",
      "longitude": "number"
    },
    "notes": "string",
    "updatedAt": "ISO8601 datetime"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Errand cannot be started
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not assigned to this errand
- `404 Not Found`: Errand not found
- `409 Conflict`: Errand not in startable state

---

### 6. Complete Errand
**Endpoint:** `PATCH /api/v1/errands/{id}/complete`

**Description:** Mark an errand as completed with proof of completion.

**Authentication:** Required (JWT)
**Authorization:** Assigned performer only

**Path Parameters:**
- `id`: string (UUID) - Errand identifier

**Request Body:**
```json
{
  "proofs": [
    {
      "type": "photo|receipt|signature|document (required)",
      "url": "string (required, file URL)",
      "description": "string (optional, max 200 chars)"
    }
  ],
  "completionNotes": "string (optional, max 1000 chars)",
  "completionLocation": {
    "latitude": "number (optional)",
    "longitude": "number (optional)"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "status": "completed",
    "completedAt": "ISO8601 datetime",
    "proofs": [
      {
        "type": "string",
        "url": "string",
        "description": "string",
        "uploadedAt": "ISO8601 datetime"
      }
    ],
    "completionNotes": "string",
    "completionLocation": {
      "latitude": "number",
      "longitude": "number"
    },
    "updatedAt": "ISO8601 datetime"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid completion data or errand cannot be completed
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Not assigned to this errand
- `404 Not Found`: Errand not found
- `409 Conflict`: Errand not in completable state
- `422 Unprocessable Entity`: Invalid proof files

---

### 7. Cancel Errand
**Endpoint:** `PATCH /api/v1/errands/{id}/cancel`

**Description:** Cancel an errand following business rules.

**Authentication:** Required (JWT)
**Authorization:** Errand creator, assigned performer, or admin role

**Path Parameters:**
- `id`: string (UUID) - Errand identifier

**Request Body:**
```json
{
  "reason": "string (required, max 500 chars)",
  "refundRequested": "boolean (optional, default: false)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "status": "cancelled",
    "cancelledAt": "ISO8601 datetime",
    "cancelledBy": "string (user ID)",
    "cancellationReason": "string",
    "refundRequested": "boolean",
    "updatedAt": "ISO8601 datetime"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid cancellation data or errand cannot be cancelled
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: No permission to cancel this errand
- `404 Not Found`: Errand not found
- `409 Conflict`: Errand not in cancellable state

---

### 8. Get Errand History
**Endpoint:** `GET /api/v1/errands/{id}/history`

**Description:** Retrieve audit log of all status changes and actions for an errand.

**Authentication:** Required (JWT)
**Authorization:** Errand creator, assigned performer, or admin role

**Path Parameters:**
- `id`: string (UUID) - Errand identifier

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "errandId": "string (UUID)",
    "history": [
      {
        "id": "string (UUID)",
        "action": "created|assigned|started|completed|cancelled|updated",
        "status": "pending|assigned|in_progress|completed|cancelled",
        "performedBy": "string (user ID)",
        "timestamp": "ISO8601 datetime",
        "details": {
          "previousStatus": "string",
          "newStatus": "string",
          "changes": "object",
          "notes": "string"
        },
        "metadata": {
          "ipAddress": "string",
          "userAgent": "string",
          "location": {
            "latitude": "number",
            "longitude": "number"
          }
        }
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: No access to this errand's history
- `404 Not Found`: Errand not found

---

### 9. Get Errand Templates
**Endpoint:** `GET /api/v1/errands/templates`

**Description:** Retrieve predefined errand templates for common tasks.

**Authentication:** Required (JWT)

**Query Parameters:**
- `category`: string (optional) - Filter by template category
- `active`: boolean (optional, default: true) - Filter by active status

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "string (UUID)",
        "name": "string",
        "category": "string",
        "description": "string",
        "template": {
          "title": "string",
          "description": "string",
          "category": "string",
          "priority": "string",
          "requirements": "string[]",
          "estimatedPrice": "number",
          "estimatedDuration": "number (minutes)"
        },
        "isActive": "boolean",
        "usageCount": "number",
        "createdAt": "ISO8601 datetime",
        "updatedAt": "ISO8601 datetime"
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication

## Status Flow
```
pending → assigned → in_progress → completed
   ↓         ↓           ↓
cancelled ← cancelled ← cancelled
```

## Business Rules
1. Only errand creators or admins can assign errands
2. Only assigned performers can start and complete errands
3. Errands can be cancelled at any stage before completion
4. Proof of completion is required for marking errands as completed
5. All status changes are logged in the audit trail
6. Templates can only be created/modified by admin users

## Error Handling
All endpoints follow standard HTTP status codes and return errors in the format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "object (optional)"
  }
}
```