---
inclusion: fileMatch
fileMatchPattern: "server/src/routes/**"
---

# API Standards

These standards apply to all Express route files under `server/src/routes/`.

## URL Design

- Use **plural nouns** for resource paths: `/api/disputes`, `/api/disputes/:id`
- Use **kebab-case** for multi-word segments: `/api/dispute-types`
- Do not include verbs in URLs — use the HTTP method to express the action.

## HTTP Methods

| Action | Method | Example |
|---|---|---|
| List resources | GET | `GET /api/disputes` |
| Get one resource | GET | `GET /api/disputes/:id` |
| Create resource | POST | `POST /api/disputes` |
| Full update | PUT | `PUT /api/disputes/:id` |
| Partial update | PATCH | `PATCH /api/disputes/:id` |
| Delete resource | DELETE | `DELETE /api/disputes/:id` |

## Request and Response Format

- All request and response bodies must be **JSON**.
- Set `Content-Type: application/json` — Express does this automatically with `res.json()`.
- Use **camelCase** for all JSON field names: `paymentType`, `createdAt`, `recommendedAction`.

## Success Responses

| Scenario | Status Code |
|---|---|
| Resource created | `201 Created` |
| Resource fetched or updated | `200 OK` |
| No content to return | `204 No Content` |

Always include the created/updated resource in the response body for `201` and `200`.

## Error Responses

All errors must follow this envelope:
```json
{
  "error": {
    "code": "DISPUTE_NOT_FOUND",
    "message": "No dispute found with id abc123"
  }
}
```

For validation errors, include a `details` array listing each failure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "paymentType", "message": "Must be one of: card_transaction, bank_transfer, direct_debit, standing_order" },
      { "field": "amount", "message": "Must be greater than 0" }
    ]
  }
}
```

| Scenario | Status Code | Code |
|---|---|---|
| Validation failure | `400 Bad Request` | `VALIDATION_ERROR` |
| Resource not found | `404 Not Found` | `<RESOURCE>_NOT_FOUND` |
| Unexpected server error | `500 Internal Server Error` | `INTERNAL_ERROR` |

## Pagination

- List endpoints that may return large result sets must support `page` and `pageSize` query parameters.
- Default `pageSize` is 50; maximum is 100.
- Response envelope for paginated lists:
  ```json
  {
    "data": [...],
    "pagination": {
      "page": 1,
      "pageSize": 50,
      "total": 120
    }
  }
  ```

## Timestamps

- All timestamps must be **ISO 8601 UTC**: `2026-06-22T10:30:00.000Z`
- Use `createdAt` and `updatedAt` as standard field names.
