---
inclusion: manual
---

# Skill: Write a Property-Based Test

Use this skill when writing fast-check property tests for the triage engine, validation, or route handlers.

## Setup

fast-check is installed in both workspaces:
```bash
npm install --save-dev fast-check --workspace=server
npm install --save-dev fast-check --workspace=client
```

## Test File Structure

```ts
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { triageDispute } from '../src/triage-engine.js';

// Feature: payment-dispute-triage, Property N: <property description>
describe('triageDispute — Property N: <name>', () => {
  it('<what holds for all inputs>', () => {
    fc.assert(
      fc.property(
        fc.record({
          paymentType: fc.constantFrom('card_transaction', 'bank_transfer', 'direct_debit', 'standing_order'),
          issueCategory: fc.constantFrom('duplicate_charge', 'failed_transfer', 'missing_payment', 'unauthorized_transaction', 'incorrect_amount'),
          transactionStatus: fc.constantFrom('pending', 'completed', 'failed', 'reversed'),
          amount: fc.float({ min: 0.01, max: 999999999.99, noNaN: true }),
          disputeAge: fc.integer({ min: 0, max: 3650 }),
        }),
        (input) => {
          const result = triageDispute(input);
          // assert the property
          return VALID_ACTIONS.includes(result);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Required Annotation

Every property test must have this comment directly above the `describe` block:
```ts
// Feature: payment-dispute-triage, Property N: <property description>
```

## Common Arbitraries

```ts
// Pick one value from a fixed set
fc.constantFrom('a', 'b', 'c')

// Integer in range
fc.integer({ min: 0, max: 100 })

// Float in range
fc.float({ min: 0.01, max: 999.99, noNaN: true })

// Non-empty string
fc.string({ minLength: 1 })

// Object with specific fields
fc.record({ field1: fc.string(), field2: fc.integer() })

// Array of records
fc.array(fc.record({ ... }), { minLength: 1, maxLength: 10 })
```

## Property Patterns for This Project

**Threshold property:**
```ts
fc.property(
  fc.float({ min: 500.01, max: 100000, noNaN: true }),
  (amount) => {
    const result = triageDispute({ ...validInput, issueCategory: 'unauthorized_transaction', amount });
    return result === 'escalate_to_fraud';
  }
)
```

**Conditional property:**
```ts
fc.property(
  fc.record({ ... }),
  fc.boolean(),
  (input, flag) => {
    // use fc.pre() to filter inputs
    fc.pre(input.issueCategory === 'missing_payment');
    // now assert
  }
)
```

**Round-trip property:**
```ts
fc.property(
  validDisputeArbitrary,
  async (input) => {
    const created = await createDispute(input);
    const fetched = await getDispute(created.id);
    return fetched.customerName === input.customerName;
  }
)
```

## Minimum Runs

Always pass `{ numRuns: 100 }` as the second argument to `fc.assert()`.
