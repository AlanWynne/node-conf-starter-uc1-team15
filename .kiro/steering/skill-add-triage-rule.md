---
inclusion: manual
---

# Skill: Add a New Triage Rule

Use this skill when adding or modifying a business rule in `server/src/triage-engine.ts`.

## Current Rule Order (must not change without design approval)

```
Rule 1: unauthorized_transaction + amount > 500          → escalate_to_fraud
Rule 2: unauthorized_transaction + amount <= 500         → manual_review
Rule 3: duplicate_charge + transactionStatus = completed → auto_refund
Rule 4: failed_transfer + transactionStatus = failed     → contact_customer
Rule 5: missing_payment + disputeAge > 30                → escalate_to_fraud
Rule 6: missing_payment + disputeAge <= 30               → manual_review
Rule 7: incorrect_amount                                 → manual_review
Default:                                                 → manual_review
```

## Steps to Add a New Rule

1. **Decide where it fits in the order** — rules are evaluated top to bottom, first match wins. Earlier rules take priority.

2. **Add the condition in `triageDispute`** in `server/src/triage-engine.ts`:
   ```ts
   // Rule N: <description>
   if (issueCategory === 'new_category' && someCondition) {
     return 'recommended_action';
   }
   ```

3. **Add the new `RecommendedAction` value** (if new) to the union type in `triage-engine.ts`.

4. **Update the Prisma enum** in `server/prisma/schema.prisma` if adding a new `RecommendedAction` or `IssueCategory`:
   ```prisma
   enum RecommendedAction {
     // ... existing values
     new_action
   }
   ```
   Then run: `npx prisma migrate dev --name add_new_action`

5. **Update `validateDisputeInput`** in `server/src/validation.ts` to include the new enum value in the valid set.

6. **Update named constants** in `server/src/constants.ts` if the rule uses a threshold value.

7. **Write tests** in `server/tests/triage-engine.test.ts`:
   - Example-based test: one test with a concrete input that triggers exactly this rule
   - Boundary test: if the rule has a numeric threshold, test at boundary ± 1
   - Property-based test: use `fc.record(...)` to assert the rule holds for all matching inputs

8. **Update the rule table** in `.kiro/specs/payment-dispute-triage/design.md`.

9. **Update requirements.md** if this rule implements a new or changed requirement.

## Rule Template

```ts
// Rule N: <human readable description>
// Validates: Requirement X.Y
if (issueCategory === 'xxx' && transactionStatus === 'yyy') {
  return 'recommended_action';
}
```

## Boundary Test Template

```ts
it('returns escalate_to_fraud when amount is 500.01 (above threshold)', () => {
  expect(triageDispute({ ...baseInput, issueCategory: 'unauthorized_transaction', amount: 500.01 }))
    .toBe('escalate_to_fraud');
});

it('returns manual_review when amount is exactly 500 (at threshold)', () => {
  expect(triageDispute({ ...baseInput, issueCategory: 'unauthorized_transaction', amount: 500 }))
    .toBe('manual_review');
});
```
