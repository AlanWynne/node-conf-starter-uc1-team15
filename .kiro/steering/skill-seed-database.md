---
inclusion: manual
---

# Skill: Seed the Database

Use this skill when populating the local SQLite database with sample data for development or demos.

## Quick Seed via API

The fastest way to seed is to POST sample disputes directly to the running API:

```bash
curl -X POST http://localhost:3001/api/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jane Smith",
    "transactionRef": "TXN-2026-001",
    "paymentType": "card_transaction",
    "issueCategory": "unauthorized_transaction",
    "transactionStatus": "completed",
    "amount": 750.00,
    "transactionDate": "2026-05-15T00:00:00.000Z",
    "description": "Customer did not authorise this transaction."
  }'
```

## Prisma Seed Script

For repeatable seeding, create `server/prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  await db.dispute.createMany({
    data: [
      {
        customerName: 'Jane Smith',
        transactionRef: 'TXN-2026-001',
        paymentType: 'card_transaction',
        issueCategory: 'unauthorized_transaction',
        transactionStatus: 'completed',
        amount: 750.00,
        transactionDate: new Date('2026-05-15'),
        description: 'Customer did not authorise this transaction.',
        recommendedAction: 'escalate_to_fraud',
        disputeStatus: 'open',
      },
      // add more records...
    ],
  });
  console.log('Seed complete');
}

main().catch(console.error).finally(() => db.$disconnect());
```

Add to `server/package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Run with: `npx prisma db seed`

## Reset and Reseed

```bash
# WARNING: destroys all data and reruns migrations + seed
npx prisma migrate reset
```

## Sample Data Coverage

When seeding for demo purposes, include disputes for each:
- Payment type: `card_transaction`, `bank_transfer`, `direct_debit`, `standing_order`
- Issue category: all 5 types
- Status: `open`, `resolved`, `escalated`, `reopened`
- Triage outcome: each of the 5 `RecommendedAction` values
- Age: some recent (< 30 days), some old (> 30 days) for `missing_payment` to show both branches
