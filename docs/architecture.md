# Architecture Document — Payment Dispute Triage

## References

- Prisma docs: https://www.prisma.io/docs
- Prisma schema reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- Prisma Client API: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
- Express.js: https://expressjs.com/en/4x/api.html
- Express routing: https://expressjs.com/en/guide/routing.html
- Express error handling: https://expressjs.com/en/guide/error-handling.html

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser  (React + Vite  :5173)                                 │
│                                                                 │
│  DisputeForm  ──┐                                               │
│  DisputeList  ──┼──  fetch /api/*  ──→  Vite proxy             │
│  DisputeDetail ─┘                        │                      │
└──────────────────────────────────────────┼──────────────────────┘
                                           │ proxied to :3001
┌──────────────────────────────────────────▼──────────────────────┐
│  Express Server  (:3001)                                        │
│                                                                 │
│  cors() ──→ express.json() ──→ Router                          │
│                                                                 │
│  /api/health, /api/echo, /api/info   (api.ts)                  │
│  /api/disputes                       (disputes.ts)             │
│                                                                 │
│  validateDisputeInput()   validation.ts                        │
│  triageDispute()          triage-engine.ts  (pure function)    │
│  db.*                     db.ts  (PrismaClient singleton)      │
│                                                                 │
│  errorHandler middleware  (last in chain)                      │
└──────────────────────────────────────────┬──────────────────────┘
                                           │ Prisma Client
┌──────────────────────────────────────────▼──────────────────────┐
│  SQLite  (file: server/prisma/dev.db)                           │
│                                                                 │
│  Dispute                                                        │
│  DisputeStatusHistory                                           │
└─────────────────────────────────────────────────────────────────┘
```

Data flows in one direction. The browser issues `fetch` calls to
`/api/*`. Vite proxies these to `localhost:3001` in development. The
Express route handler validates, delegates to the pure-function triage
engine, writes via Prisma, and returns the result. No I/O happens
inside the triage engine — it is a plain TypeScript function with no
imports from Prisma or Express.

---

## Components

| File | Role |
|---|---|
| `server/src/index.ts` | App entry — mounts middleware and routers, binds port |
| `server/src/routes/api.ts` | Utility routes: `/api/health`, `/api/echo`, `/api/info` |
| `server/src/routes/disputes.ts` | Resource router — all dispute CRUD and status transitions |
| `server/src/triage-engine.ts` | Pure function `triageDispute(input)` — zero I/O |
| `server/src/validation.ts` | `validateDisputeInput(body)` — returns `ValidationError[]` |
| `server/src/db.ts` | Singleton `PrismaClient` export |
| `server/src/constants.ts` | Named threshold and limit constants |
| `server/src/middleware/errorHandler.ts` | Centralised error middleware |
| `server/prisma/schema.prisma` | Data model and database configuration |

---

## Data Model

### Actual Prisma schema (`server/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // resolves from server/.env → DATABASE_URL=file:./dev.db
}

model Dispute {
  id                String                 @id @default(cuid())
  customerName      String
  transactionRef    String
  paymentType       String
  issueCategory     String
  transactionStatus String
  amount            Float
  transactionDate   DateTime
  description       String?
  recommendedAction String
  disputeStatus     String                 @default("open")
  createdAt         DateTime               @default(now())
  updatedAt         DateTime               @updatedAt
  statusHistory     DisputeStatusHistory[]
}

model DisputeStatusHistory {
  id        String   @id @default(cuid())
  disputeId String
  status    String
  reason    String
  changedAt DateTime @default(now())
  dispute   Dispute  @relation(fields: [disputeId], references: [id])
}
```

### Design decisions

**Strings instead of Prisma enums.** The schema uses `String` for
`paymentType`, `issueCategory`, `transactionStatus`,
`recommendedAction`, and `disputeStatus`. Enum validation is enforced
in `validation.ts` at the application layer, not at the database layer.
This avoids the need for a migration whenever a new enum value is added
during prototyping. TypeScript union types in `triage-engine.ts` provide
compile-time safety.

**`Float` for `amount`.** SQLite has no `DECIMAL` or `NUMERIC` type
with fixed precision. `Float` (IEEE 754 double) is acceptable for a
prototype with mock data. A production system would store amounts as
integer cents (`Int`) to avoid floating-point rounding.

**`cuid()` for IDs.** Collision-resistant, URL-safe, roughly sortable
by creation time. Shorter than UUID and without hyphens in the useful
part.

**`DisputeStatusHistory` as a separate table.** Storing history as a
JSON column would make it opaque to queries and harder to extend. A
relation table means history entries can be ordered, filtered, and
augmented with new fields without schema migration.

**`@updatedAt` on `Dispute`.** Prisma auto-updates this field on every
`update()` call. The frontend uses it for cache-busting checks.

### Entity relationship

```
Dispute  1 ──── * DisputeStatusHistory
  │                      │
  id ←──── disputeId ────┘
```

### Field constraints (enforced at application layer)

| Field | Constraint |
|---|---|
| `customerName` | max 200 chars |
| `transactionRef` | max 50 chars |
| `paymentType` | one of: `card_transaction`, `bank_transfer`, `direct_debit`, `standing_order` |
| `issueCategory` | one of: `duplicate_charge`, `failed_transfer`, `missing_payment`, `unauthorized_transaction`, `incorrect_amount` |
| `transactionStatus` | one of: `pending`, `completed`, `failed`, `reversed` |
| `amount` | 0.01 – 999,999,999.99 |
| `transactionDate` | valid ISO 8601, not in the future |
| `description` | optional, max 2000 chars |
| `recommendedAction` | one of: `auto_refund`, `manual_review`, `escalate_to_fraud`, `contact_customer`, `reject_dispute` |
| `disputeStatus` | one of: `open`, `resolved`, `escalated`, `reopened` |

### Prisma migrations

```bash
# Create and apply a new migration (development)
npx prisma migrate dev --name <description>   # runs from server/

# Apply existing migrations (CI / production)
npx prisma migrate deploy

# Regenerate the Prisma Client after schema changes
npx prisma generate

# Open Prisma Studio (GUI browser for the database)
npx prisma studio
```

The migration files live in `server/prisma/migrations/`. The generated
client is written to `server/node_modules/.prisma/client/` and must be
regenerated after any schema change.

### Prisma Client usage patterns

The client is instantiated once and exported as a default:

```ts
// server/src/db.ts
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
export default db;
```

**Never** instantiate `PrismaClient` inside a route handler or business
logic function. SQLite allows only one concurrent writer; multiple
client instances cause locking errors.

Common query patterns used in this project:

```ts
// Create with nested relation
await db.dispute.create({
  data: { ...fields },
  include: { statusHistory: true },
});

// Paginated list, ordered, summary projection
await db.dispute.findMany({
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize,
  select: { id: true, customerName: true, ... },
});

// Single record with full history
await db.dispute.findUnique({
  where: { id },
  include: { statusHistory: true },
});

// Update with nested history append
await db.dispute.update({
  where: { id },
  data: {
    disputeStatus: 'resolved',
    statusHistory: { create: { status: 'resolved', reason } },
  },
  include: { statusHistory: true },
});

// Total count for pagination envelope
await db.dispute.count();
```

---

## Express.js Application Structure

### Entry point (`server/src/index.ts`)

```ts
import 'dotenv/config';          // loads server/.env before any other import
import express from 'express';
import cors from 'cors';
import { apiRouter }      from './routes/api.js';
import { disputesRouter } from './routes/disputes.js';
import { errorHandler }   from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());            // allow cross-origin from Vite :5173
app.use(express.json());    // parse JSON request bodies

app.use('/api',          apiRouter);       // health, echo, info
app.use('/api/disputes', disputesRouter);  // all dispute routes

app.get('/health', (_req, res) =>          // legacy health check
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use(errorHandler);      // MUST be last — catches errors from all routes

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

**Important:** `errorHandler` must be registered **after** all routers.
Express identifies error-handling middleware by its four-argument
signature `(err, req, res, next)`.

### Middleware chain

```
Request
  │
  ├─ cors()               adds CORS headers
  ├─ express.json()       parses body, sets req.body
  ├─ /api  (apiRouter)    utility endpoints
  ├─ /api/disputes        dispute resource endpoints
  └─ errorHandler         catches any thrown error
```

### Router pattern (`server/src/routes/disputes.ts`)

Each route file exports a named `Router` instance:

```ts
import { Router, Request, Response, NextFunction } from 'express';
export const disputesRouter = Router();
```

All async handlers follow the same try/catch/next pattern:

```ts
disputesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. validate
    // 2. call pure business logic
    // 3. write to db
    // 4. respond
  } catch (err) {
    next(err);   // delegates to errorHandler — never res.json() for errors
  }
});
```

### Error handling middleware (`server/src/middleware/errorHandler.ts`)

All route errors are thrown as plain `Error` objects decorated with
`status` and `code` properties:

```ts
const err = new Error('No dispute found with id xyz') as AppError;
err.status = 404;
err.code   = 'DISPUTE_NOT_FOUND';
throw err;
```

The centralised handler reads those properties and returns the standard
error envelope:

```ts
export const errorHandler = (err: AppError, _req, res, _next) => {
  const status  = err.status  || 500;
  const code    = err.code    || 'INTERNAL_ERROR';
  const message = err.message || 'Internal Server Error';

  const body: Record<string, unknown> = { code, message, status,
    timestamp: new Date().toISOString() };

  if (err.details !== undefined) body.details = err.details;   // validation errors

  res.status(status).json({ error: body });
};
```

Validation errors additionally carry a `details` array populated by
`validateDisputeInput`:

```ts
const err = new Error('Request validation failed') as AppError;
err.status  = 400;
err.code    = 'VALIDATION_ERROR';
err.details = errors;   // ValidationError[]  — one entry per failing field
throw err;
```

### Business constants (`server/src/constants.ts`)

All magic numbers are named constants. No inline literals in rule logic
or validation.

```ts
// Triage thresholds
export const FRAUD_ESCALATION_AMOUNT_THRESHOLD = 500;
export const MISSING_PAYMENT_ESCALATION_DAYS   = 30;

// Validation limits
export const MIN_DISPUTE_AMOUNT          = 0.01;
export const MAX_DISPUTE_AMOUNT          = 999999999.99;
export const MAX_DESCRIPTION_LENGTH      = 2000;
export const MAX_CUSTOMER_NAME_LENGTH    = 200;
export const MAX_TRANSACTION_REF_LENGTH  = 50;

// Pagination defaults
export const DEFAULT_PAGE      = 1;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE     = 100;
```

### Triage engine (`server/src/triage-engine.ts`)

A **pure function** — no imports from Prisma, Express, or any I/O
module. `disputeAge` is calculated in the route handler before the call
so the engine has no `Date` dependency:

```ts
// In the route handler:
const disputeAge = Math.floor(
  (Date.now() - new Date(req.body.transactionDate).getTime()) / (1000 * 60 * 60 * 24)
);
const recommendedAction = triageDispute({ ...fields, disputeAge });
```

Rule evaluation is a sequential `if` chain — the first match returns
immediately. This matches Requirement 2.1 (first matching rule wins)
exactly and is trivially readable and auditable.

---

## Key Architectural Decisions

### 1. No Prisma enums in schema

**Decision:** Domain enums are TypeScript union types enforced by
`validation.ts`, not Prisma schema enums.

**Rationale:** SQLite represents Prisma enums as plain text strings
internally. There is no database-level enforcement either way. Using
application-layer validation keeps the schema migration surface small
during iteration and avoids the need to run `prisma migrate dev`
whenever an enum value name changes. TypeScript union types still catch
typos at compile time.

### 2. Pure-function triage engine

**Decision:** `triageDispute` has no I/O, no Prisma, no `Date.now()`.

**Rationale:** A pure function can be unit-tested without any setup,
mocking, or teardown. Property-based tests (fast-check) can generate
thousands of inputs and verify all rules in milliseconds. The route
handler supplies `disputeAge` as a pre-calculated integer, eliminating
date coupling from the engine.

### 3. Single PrismaClient singleton

**Decision:** `db.ts` instantiates exactly one `PrismaClient` and all
modules import it.

**Rationale:** SQLite only supports one concurrent writer. Multiple
`PrismaClient` instances would cause `SQLITE_BUSY` lock errors under
concurrent requests. A singleton prevents this.

### 4. `DisputeStatusHistory` as a relation table

**Decision:** Status changes are stored in a separate table, not a JSON
column on `Dispute`.

**Rationale:** A relation table supports ordered retrieval, future
filtering (e.g. "show only escalations"), and adding new fields without
schema migration. The `include: { statusHistory: true }` option in
Prisma returns the full history in a single query.

### 5. ES modules throughout

**Decision:** Both packages use `"type": "module"`. All server imports
use the `.js` extension at the import site.

**Rationale:** Node.js 22 LTS treats `.js` as ESM when `"type":
"module"` is set. TypeScript compiles `.ts` → `.js` and the runtime
resolves the `.js` extension. Without the explicit extension, ESM
resolution fails. This is a TypeScript + Node.js ESM requirement, not
a convention choice.

---

## Directory Structure

```
server/
├── prisma/
│   ├── schema.prisma          ← data model and db config
│   ├── dev.db                 ← SQLite database file (gitignored)
│   └── migrations/            ← migration history
├── src/
│   ├── index.ts               ← Express app setup and port binding
│   ├── db.ts                  ← PrismaClient singleton
│   ├── constants.ts           ← all named thresholds and limits
│   ├── triage-engine.ts       ← pure triage function + types
│   ├── validation.ts          ← input validation returning ValidationError[]
│   ├── routes/
│   │   ├── api.ts             ← /api/health, /api/echo, /api/info
│   │   └── disputes.ts        ← /api/disputes resource router
│   └── middleware/
│       └── errorHandler.ts    ← centralised error middleware
└── tests/
    ├── triage-engine.test.ts  ← property + example tests for triage rules
    ├── validation.test.ts     ← property + example tests for validation
    ├── disputes.test.ts       ← route integration tests (mocked Prisma)
    └── sample.test.ts         ← scaffold test
```

---

## Environment Configuration

The server reads configuration from `server/.env` (never committed).
Copy `server/.env.example` to `server/.env` to bootstrap:

```
DATABASE_URL="file:./prisma/dev.db"
PORT=3001
NODE_ENV=development
```

`dotenv/config` is imported as the first line of `index.ts`, before any
other module, so environment variables are available everywhere.

---

## Running the Server

```bash
# Development (tsx — no compile step, hot restart not included)
npm run dev --workspace=server

# Production build then run
npm run build --workspace=server
npm run start --workspace=server

# Database
npm run db:migrate  --workspace=server   # create + apply migration
npm run db:generate --workspace=server   # regenerate Prisma Client
npm run db:studio   --workspace=server   # open Prisma Studio GUI

# Tests
npm test            --workspace=server
npm run test:coverage --workspace=server
```
