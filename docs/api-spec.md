# API Specification — Payment Dispute Triage

## Overview

Base URL (development): `http://localhost:3001`

All requests and responses use JSON. Timestamps are ISO 8601 UTC
(`2026-06-22T10:30:00.000Z`). Field names use camelCase throughout.

The frontend proxies `/api/*` to `localhost:3001` via Vite, so client
code uses relative paths (`/api/disputes`).

---

## Shared Conventions

### Success response codes

| Scenario | Code |
|---|---|
| Resource created | `201 Created` |
| Resource fetched or updated | `200 OK` |

### Error envelope

All errors return a consistent JSON envelope:

```json
{
  "error": {
    "code": "DISPUTE_NOT_FOUND",
    "message": "No dispute found with id clx1abc123"
  }
}
```

Validation errors additionally include a `details` array, one entry per
failing field:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "paymentType",
        "message": "Must be one of: card_transaction, bank_transfer, direct_debit, standing_order"
      },
      {
        "field": "amount",
        "message": "Must be between 0.01 and 999999999.99"
      }
    ]
  }
}
```

### Error codes

| Code | HTTP status | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | One or more request fields are missing, empty, or invalid |
| `DISPUTE_NOT_FOUND` | 404 | No dispute exists for the given `id` |
| `DUPLICATE_TRANSACTION_REF` | 409 | A dispute for the given `transactionRef` already exists |
| `INVALID_STATUS_TRANSITION` | 422 | Status action attempted on a non-resolved dispute |
| `INTERNAL_ERROR` | 500 | Unexpected server or database failure |

### Valid enum values

| Field | Valid values |
|---|---|
| `paymentType` | `card_transaction`, `bank_transfer`, `direct_debit`, `standing_order` |
| `issueCategory` | `duplicate_charge`, `failed_transfer`, `missing_payment`, `unauthorized_transaction`, `incorrect_amount` |
| `transactionStatus` | `pending`, `completed`, `failed`, `reversed` |
| `recommendedAction` | `auto_refund`, `manual_review`, `escalate_to_fraud`, `contact_customer`, `reject_dispute` |
| `disputeStatus` | `open`, `resolved`, `escalated`, `reopened` |

---

## Endpoints

---

### POST /api/disputes

Create a new dispute and run the triage engine.

The server calculates `disputeAge` (calendar days from `transactionDate`
to today) and applies the deterministic rules engine to determine
`recommendedAction`. The dispute is persisted and returned in the
response.

**Request body:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `customerName` | string | yes | max 200 characters |
| `transactionRef` | string | yes | max 50 characters |
| `paymentType` | enum | yes | see valid values above |
| `issueCategory` | enum | yes | see valid values above |
| `transactionStatus` | enum | yes | see valid values above |
| `amount` | number | yes | 0.01 – 999,999,999.99 inclusive |
| `transactionDate` | string | yes | ISO 8601 date, not in the future |
| `description` | string | no | max 2000 characters |

**Example request:**

```json
{
  "customerName": "Jane Smith",
  "transactionRef": "TXN-20240601-001",
  "paymentType": "card_transaction",
  "issueCategory": "unauthorized_transaction",
  "transactionStatus": "completed",
  "amount": 750.00,
  "transactionDate": "2026-05-15T00:00:00.000Z",
  "description": "Customer did not authorise this transaction."
}
```

**201 Created — response body:**

```json
{
  "id": "clx1abc123",
  "disputeRef": "DSP-20260622-K7M2",
  "customerName": "Jane Smith",
  "transactionRef": "TXN-20240601-001",
  "paymentType": "card_transaction",
  "issueCategory": "unauthorized_transaction",
  "transactionStatus": "completed",
  "amount": 750.00,
  "transactionDate": "2026-05-15T00:00:00.000Z",
  "description": "Customer did not authorise this transaction.",
  "recommendedAction": "escalate_to_fraud",
  "disputeStatus": "open",
  "createdAt": "2026-06-22T10:30:00.000Z",
  "updatedAt": "2026-06-22T10:30:00.000Z",
  "statusHistory": []
}
```

**Error responses:**

- `400 VALIDATION_ERROR` — one or more fields missing, empty, or invalid (all failures returned together in `details`)
- `409 DUPLICATE_TRANSACTION_REF` — a dispute for the given `transactionRef` already exists

---

### GET /api/disputes

List disputes ordered by `createdAt` descending, paginated.

Returns a summary projection — not the full dispute record. Use
`GET /api/disputes/:id` to retrieve full details.

**Query parameters:**

| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `page` | integer | 1 | — | Page number (1-based) |
| `pageSize` | integer | 50 | 100 | Records per page |

**Example request:**

```
GET /api/disputes?page=1&pageSize=25
```

**200 OK — response body:**

```json
{
  "data": [
    {
      "id": "clx1abc123",
      "disputeRef": "DSP-20260622-K7M2",
      "customerName": "Jane Smith",
      "paymentType": "card_transaction",
      "issueCategory": "unauthorized_transaction",
      "recommendedAction": "escalate_to_fraud",
      "disputeStatus": "open",
      "amount": 750.00,
      "createdAt": "2026-06-22T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 1
  }
}
```

**Notes:**
- Returns an empty `data` array (not an error) when no disputes exist.
- `total` reflects the total number of disputes across all pages, used to determine whether to show pagination controls.

---

### GET /api/disputes/:id

Retrieve a single dispute with all fields and full status history.

**Path parameter:**

| Param | Description |
|---|---|
| `id` | Unique dispute identifier (cuid) |

**Example request:**

```
GET /api/disputes/clx1abc123
```

**200 OK — response body:**

```json
{
  "id": "clx1abc123",
  "disputeRef": "DSP-20260622-K7M2",
  "customerName": "Jane Smith",
  "transactionRef": "TXN-20240601-001",
  "paymentType": "card_transaction",
  "issueCategory": "unauthorized_transaction",
  "transactionStatus": "completed",
  "amount": 750.00,
  "transactionDate": "2026-05-15T00:00:00.000Z",
  "description": "Customer did not authorise this transaction.",
  "recommendedAction": "escalate_to_fraud",
  "disputeStatus": "escalated",
  "createdAt": "2026-06-22T10:30:00.000Z",
  "updatedAt": "2026-06-22T11:00:00.000Z",
  "statusHistory": [
    {
      "id": "clx2def456",
      "disputeId": "clx1abc123",
      "status": "escalated",
      "reason": "Confirmed fraud by customer callback.",
      "changedAt": "2026-06-22T11:00:00.000Z"
    }
  ]
}
```

**Error responses:**

- `404 DISPUTE_NOT_FOUND` — no dispute exists for the given `id`

---

### PATCH /api/disputes/:id/status

Reopen or escalate a resolved dispute. The dispute must currently have
`disputeStatus === "resolved"` — any other status returns 422.

A `reopen` action sets `disputeStatus` to `reopened`.  
An `escalate` action sets `disputeStatus` to `escalated` and also
updates `recommendedAction` to `escalate_to_fraud`.

Both actions require a non-empty reason, which is persisted to
`statusHistory`.

**Path parameter:**

| Param | Description |
|---|---|
| `id` | Unique dispute identifier |

**Request body:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `action` | string | yes | `"reopen"` or `"escalate"` |
| `reason` | string | yes | non-empty |

**Example request (reopen):**

```json
{
  "action": "reopen",
  "reason": "Customer provided new evidence of fraud."
}
```

**200 OK — response body:**

Full dispute object (same shape as `GET /api/disputes/:id`) with updated
`disputeStatus`, updated `recommendedAction` (escalate only), and a new
entry appended to `statusHistory`.

```json
{
  "id": "clx1abc123",
  "disputeStatus": "reopened",
  "recommendedAction": "escalate_to_fraud",
  "statusHistory": [
    {
      "id": "clx2def456",
      "disputeId": "clx1abc123",
      "status": "resolved",
      "reason": "Closed after investigation.",
      "changedAt": "2026-06-22T10:00:00.000Z"
    },
    {
      "id": "clx3ghi789",
      "disputeId": "clx1abc123",
      "status": "reopened",
      "reason": "Customer provided new evidence of fraud.",
      "changedAt": "2026-06-22T11:30:00.000Z"
    }
  ]
}
```

**Error responses:**

- `400 VALIDATION_ERROR` — `action` is not `"reopen"` or `"escalate"`, or `reason` is empty or missing
- `404 DISPUTE_NOT_FOUND` — no dispute exists for the given `id`
- `422 INVALID_STATUS_TRANSITION` — dispute is not in `resolved` state

**422 example:**

```json
{
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Dispute must be in 'resolved' state to reopen or escalate. Current status: open"
  }
}
```

---

### PATCH /api/disputes/:id/resolve

Mark a dispute as resolved. This endpoint is used by E2E tests to seed
resolved disputes and is a valid operations action in its own right.

**Path parameter:**

| Param | Description |
|---|---|
| `id` | Unique dispute identifier |

**Request body:**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `reason` | string | yes | non-empty |

**Example request:**

```json
{
  "reason": "Issue confirmed resolved after customer callback."
}
```

**200 OK — response body:**

Full dispute object with `disputeStatus` set to `"resolved"` and a new
`resolved` entry appended to `statusHistory`.

**Error responses:**

- `400 VALIDATION_ERROR` — `reason` is empty or missing
- `404 DISPUTE_NOT_FOUND` — no dispute exists for the given `id`

---

## Triage Rules Reference

The `recommendedAction` returned on `POST /api/disputes` is determined
by these rules, evaluated in order. The first match wins.

| Priority | Condition | Recommended Action |
|---|---|---|
| 1 | `issueCategory === unauthorized_transaction` AND `amount > 500` | `escalate_to_fraud` |
| 2 | `issueCategory === unauthorized_transaction` AND `amount <= 500` | `manual_review` |
| 3 | `issueCategory === duplicate_charge` AND `transactionStatus === completed` | `auto_refund` |
| 4 | `issueCategory === failed_transfer` AND `transactionStatus === failed` | `contact_customer` |
| 5 | `issueCategory === missing_payment` AND `disputeAge > 30 days` | `escalate_to_fraud` |
| 6 | `issueCategory === missing_payment` AND `disputeAge <= 30 days` | `manual_review` |
| 7 | `issueCategory === incorrect_amount` | `manual_review` |
| Default | No rule matched | `manual_review` |

`disputeAge` is the number of calendar days between `transactionDate`
and the date the dispute is submitted. It is calculated server-side and
is not a request field.

**Key boundary conditions:**
- `amount` exactly at 500 → `manual_review` (rule 2)
- `disputeAge` exactly at 30 → `manual_review` (rule 6)

---

## HTTP Status Code Reference

| Code | Meaning | When used |
|---|---|---|
| 200 OK | Request succeeded | `GET`, `PATCH` success |
| 201 Created | Resource created | `POST /api/disputes` |
| 400 Bad Request | Client sent invalid data | Validation failures |
| 404 Not Found | Resource does not exist | Unknown dispute `id` |
| 409 Conflict | Request conflicts with current state | Duplicate `transactionRef` on `POST /api/disputes` |
| 422 Unprocessable Entity | Request is valid but conflicts with business rules | Status transition on non-resolved dispute |
| 500 Internal Server Error | Unexpected server failure | Database errors, unhandled exceptions |
