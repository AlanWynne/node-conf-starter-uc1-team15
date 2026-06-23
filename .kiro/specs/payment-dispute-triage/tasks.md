# Implementation Plan: Payment Dispute Triage

## Overview

Implement the Payment Dispute Triage feature as a full-stack TypeScript application. The backend is an Express server with a pure-function triage rules engine persisting to SQLite via Prisma. The frontend is a React + Tailwind UI with a dispute form, list, and detail view. Property-based tests (fast-check) cover the triage engine's correctness properties throughout.

## Tasks

- [x] 1. Extend Prisma schema and set up the database layer
  - Replace the placeholder `User` model in `server/prisma/schema.prisma` with the `Dispute` and `DisputeStatusHistory` models and all required enums (`PaymentType`, `IssueCategory`, `TransactionStatus`, `RecommendedAction`, `DisputeStatus`) as specified in the design
  - Create `server/src/db.ts` exporting a singleton `PrismaClient` instance
  - Run `npx prisma migrate dev --name init` to generate and apply the migration
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implement the triage rules engine
  - [x] 2.1 Create `server/src/triage-engine.ts` with the `TriageInput` and `RecommendedAction` types and the `triageDispute` pure function implementing rules 1–7 plus the default fallback in the exact order specified in the design
    - `disputeAge` is passed in as a pre-calculated integer; the function has no I/O or Date calls
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [x] 2.2 Write property test for rule priority — first matching rule wins (Property 2)
    - **Property 2: Rule priority — first matching rule wins**
    - **Validates: Requirements 2.1**
    - Install `fast-check` in the server workspace: `npm install --save-dev fast-check --workspace=server`
    - Create `server/tests/triage-engine.test.ts`; annotate with `// Feature: payment-dispute-triage, Property 2: Rule priority — first matching rule wins`
    - Use `fc.record(...)` to generate valid `TriageInput` values and assert the result equals the first matching rule's action

  - [x] 2.3 Write property test for unauthorized transaction threshold (Property 3)
    - **Property 3: Unauthorized transaction threshold**
    - **Validates: Requirements 2.2, 2.3**
    - In `server/tests/triage-engine.test.ts`, annotate with `// Feature: payment-dispute-triage, Property 3: Unauthorized transaction threshold`
    - Generate `TriageInput` with fixed `issueCategory: 'unauthorized_transaction'` and varied `amount`; assert `escalate_to_fraud` when `amount > 500`, `manual_review` when `amount <= 500`

  - [x] 2.4 Write property test for missing payment age threshold (Property 4)
    - **Property 4: Missing payment age threshold**
    - **Validates: Requirements 2.6, 2.7**
    - Annotate with `// Feature: payment-dispute-triage, Property 4: Missing payment age threshold`
    - Generate `TriageInput` with fixed `issueCategory: 'missing_payment'` and varied `disputeAge`; assert `escalate_to_fraud` when `disputeAge > 30`, `manual_review` when `disputeAge <= 30`

  - [x] 2.5 Write property test for specific rule branches (Property 5)
    - **Property 5: Specific rule branches produce correct actions**
    - **Validates: Requirements 2.4, 2.5, 2.8**
    - Annotate with `// Feature: payment-dispute-triage, Property 5: Specific rule branches produce correct actions`
    - Generate inputs for `duplicate_charge`+`completed`, `failed_transfer`+`failed`, and `incorrect_amount`; assert correct actions

  - [x] 2.6 Write property test for default fallback to manual_review (Property 6)
    - **Property 6: Default fallback to manual_review**
    - **Validates: Requirements 2.9**
    - Annotate with `// Feature: payment-dispute-triage, Property 6: Default fallback to manual_review`
    - Generate inputs that satisfy none of rules 1–7 and assert the result is `manual_review`

  - [x] 2.7 Write example-based boundary tests for the triage engine
    - Test amount exactly at 500 (→ `manual_review`) and 500.01 (→ `escalate_to_fraud`) for `unauthorized_transaction`
    - Test `disputeAge` exactly at 30 (→ `manual_review`) and 31 (→ `escalate_to_fraud`) for `missing_payment`
    - Test the default fallback with an input that matches no rule

- [x] 3. Implement input validation helpers
  - [x] 3.1 Create `server/src/validation.ts` with a `validateDisputeInput` function that returns `ValidationError[]` (with `field` and `message` properties)
    - Validate all required fields are present and non-empty
    - Validate enum fields (`paymentType`, `issueCategory`, `transactionStatus`) against their valid value sets; include the list of valid values in the error message
    - Validate `amount` is a number between 0.01 and 999999999.99 inclusive
    - Validate `transactionDate` is a valid ISO 8601 date that is not in the future
    - Collect and return all failures in a single pass (do not stop at first error)
    - _Requirements: 2.10, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 3.2 Write property test for validation — all invalid fields reported (Property 7)
    - **Property 7: Validation reports all invalid fields**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 2.10**
    - Create `server/tests/validation.test.ts`; annotate with `// Feature: payment-dispute-triage, Property 7: Validation reports all invalid fields`
    - Generate request bodies with one or more invalid fields and assert `details` contains exactly one entry per invalid field, each citing the correct field name, and no valid field is flagged

  - [x] 3.3 Write property test for amount boundary acceptance (Property 8)
    - **Property 8: Amount boundary**
    - **Validates: Requirements 1.4, 5.4**
    - Annotate with `// Feature: payment-dispute-triage, Property 8: Amount boundary`
    - Assert amounts in `[0.01, 999999999.99]` are accepted; amounts `<= 0` or `> 999999999.99` are rejected with `VALIDATION_ERROR` citing `amount`

  - [x] 3.4 Write example-based multi-error validation tests
    - Submit a body with one missing field, one invalid enum, and one out-of-range amount simultaneously; assert all three errors appear in `details`

- [x] 4. Implement the disputes Express router
  - [x] 4.1 Create `server/src/routes/disputes.ts` with the named export `disputesRouter`
    - `POST /` — validate input with `validateDisputeInput`, compute `disputeAge`, call `triageDispute`, persist with Prisma, respond 201 with the full dispute object including empty `statusHistory`
    - `GET /` — accept `page` and `pageSize` query params (defaults 1 and 50, max 100), query Prisma ordered by `createdAt` descending, return paginated envelope
    - `GET /:id` — fetch dispute with `statusHistory` included; throw 404 if not found
    - `PATCH /:id/status` — validate `action` (`reopen`|`escalate`) and non-empty `reason`; throw 422 if `disputeStatus !== 'resolved'`; update `disputeStatus` and append to `statusHistory`; on `escalate`, also set `recommendedAction` to `escalate_to_fraud`
    - Use `try/catch` and `next(err)` on all async handlers; throw errors with `status` and `code` properties
    - _Requirements: 1.2, 2.1–2.9, 4.1, 6.1–6.4, 7.2, 7.3, 7.4, 7.7_

  - [x] 4.2 Register `disputesRouter` in `server/src/index.ts` under `/api/disputes`
    - _Requirements: 1.2, 4.1_

  - [x] 4.3 Write property test for dispute creation round-trip (Property 1)
    - **Property 1: Dispute creation round-trip**
    - **Validates: Requirements 1.2, 6.1, 6.2**
    - Create `server/tests/disputes.test.ts`; annotate with `// Feature: payment-dispute-triage, Property 1: Dispute creation round-trip`
    - Use a mock Prisma client; generate valid dispute inputs, call the route, assert the response contains a unique `id`, all submitted fields unchanged, and a `createdAt` timestamp

  - [x] 4.4 Write property test for dispute list ordering (Property 9)
    - **Property 9: Dispute list ordered by creation date descending**
    - **Validates: Requirements 4.1**
    - Annotate with `// Feature: payment-dispute-triage, Property 9: Dispute list ordered by creation date descending`
    - Seed mock disputes with varied `createdAt` timestamps; assert `data[i].createdAt >= data[i+1].createdAt` for all adjacent pairs

  - [x] 4.5 Write property test for status transition and history round-trip (Property 10)
    - **Property 10: Status transition and history round-trip**
    - **Validates: Requirements 7.2, 7.3, 7.4, 7.7**
    - Annotate with `// Feature: payment-dispute-triage, Property 10: Status transition and history round-trip`
    - Generate non-empty reason strings; apply `reopen` and `escalate` actions on a resolved dispute via mock Prisma; assert `statusHistory` receives a new entry with correct status, reason, and `changedAt`; assert `GET /:id` returns full history in chronological order

  - [x] 4.6 Write example-based tests for 404 and 422 responses
    - Test `GET /non-existent-id` → 404 `DISPUTE_NOT_FOUND`
    - Test `PATCH /:id/status` on an open dispute → 422 `INVALID_STATUS_TRANSITION` with current status in message

- [x] 5. Checkpoint — Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement the `TriageResult` frontend component
  - [x] 6.1 Create `client/src/components/TriageResult.tsx` accepting `{ action: RecommendedAction }` props
    - Render a labelled result card with the human-readable label for each action value
    - Apply the high-urgency (red) variant for `escalate_to_fraud`; standard-priority variants (green / blue / amber / grey) for all other actions
    - Add `data-testid="triage-result"`, `data-testid="triage-urgency-high"` and `data-testid="triage-urgency-standard"`
    - Style with Tailwind utility classes only
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 6.2 Write property test for urgency indicator mapping (Property 12)
    - **Property 12: Urgency indicator maps correctly to recommended action**
    - **Validates: Requirements 3.3, 3.4**
    - Install `fast-check` in the client workspace: `npm install --save-dev fast-check --workspace=client`
    - Create `client/tests/TriageResult.test.tsx`; annotate with `// Feature: payment-dispute-triage, Property 12: Urgency indicator maps correctly to recommended action`
    - Use `fc.constantFrom(...)` over all `RecommendedAction` values; assert high-urgency renders iff `action === 'escalate_to_fraud'`

- [x] 7. Implement the `StatusHistory` frontend component
  - [x] 7.1 Create `client/src/components/StatusHistory.tsx` accepting `DisputeStatusHistory[]` props
    - Render a chronological list; each entry shows a status badge, reason text, and formatted `changedAt` timestamp
    - Add `data-testid="status-history-list"`
    - _Requirements: 7.7_

- [x] 8. Implement the `DisputeForm` frontend component
  - [x] 8.1 Create `client/src/components/DisputeForm.tsx` as a controlled form
    - Fields: customer name, transaction reference, `paymentType` (select), `issueCategory` (select), `transactionStatus` (select), amount (numeric), transaction date (date), description (textarea)
    - Client-side validation mirroring server rules (required fields, amount range, date not in future, description max 2000 chars); show inline errors without clearing populated fields
    - Description field displays remaining character count as `2000 - description.length`
    - On successful submit: POST to `/api/disputes`, render `<TriageResult>` with `recommendedAction`, show a success banner containing the dispute reference (`disputeRef`)
    - On API error: display `error.message` from the response envelope inline
    - Use `AbortController` with 10-second timeout; show error banner with Retry button on abort
    - Add `data-testid` attributes on all inputs matching field names (e.g., `data-testid="customer-name"`) and `data-testid="submit-dispute"` on the submit button
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 8.2 Write example-based tests for DisputeForm validation display and success flow
    - Create `client/tests/DisputeForm.test.tsx`
    - Test that submitting with missing required fields shows per-field error messages without clearing other fields
    - Test that a successful API response renders `TriageResult` and the success banner with the dispute reference (`disputeRef`)
    - Test that a network timeout (> 10 s) shows the error banner with a Retry button

- [x] 9. Implement the `DisputeList` frontend component
  - [x] 9.1 Create `client/src/components/DisputeList.tsx`
    - Fetch `GET /api/disputes?page=1&pageSize=50` on mount
    - Render a table with columns: Customer Name, Payment Type, Issue Category, Recommended Action, Status, Created At
    - Each row has `data-testid="dispute-row-{id}"`; clicking a row calls an `onSelect(id)` callback
    - Show pagination controls when `total > pageSize`
    - Empty state: `data-testid="dispute-list-empty"`; error state: `data-testid="dispute-list-error"` with Retry button `data-testid="retry-list"`
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [x] 9.2 Write example-based tests for DisputeList states
    - Create `client/tests/DisputeList.test.tsx`
    - Test empty state renders `data-testid="dispute-list-empty"`
    - Test error state renders the error banner with `data-testid="retry-list"`
    - Test pagination controls appear when `total > pageSize`

- [x] 10. Implement the `DisputeDetail` frontend component
  - [x] 10.1 Create `client/src/components/DisputeDetail.tsx` accepting `{ id: string }` prop
    - Fetch `GET /api/disputes/:id` on mount; display all fields including description and `statusHistory` via `<StatusHistory>`
    - Render `<TriageResult>` with `recommendedAction`
    - For resolved disputes: render "Reopen" (`data-testid="reopen-btn"`) and "Escalate" (`data-testid="escalate-btn"`) buttons
    - Clicking either opens an inline confirmation panel with a required reason textarea and a confirm button; on confirm PATCH `/api/disputes/:id/status`, then refresh the dispute record
    - For non-resolved disputes: buttons are not rendered
    - Show error message with Retry button on detail load failure
    - _Requirements: 4.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 10.2 Write property test for action button visibility (Property 11)
    - **Property 11: Action button visibility conditional on dispute status**
    - **Validates: Requirements 7.1, 7.6**
    - Create `client/tests/DisputeDetail.test.tsx`; annotate with `// Feature: payment-dispute-triage, Property 11: Action button visibility conditional on dispute status`
    - Use `fc.constantFrom('open', 'escalated', 'reopened', 'resolved')` to drive the dispute status; assert both buttons render only when `disputeStatus === 'resolved'`

  - [x] 10.3 Write example-based tests for DisputeDetail confirmation flow
    - Test Reopen confirmation flow: enter reason, confirm, assert PATCH called with `{ action: 'reopen', reason }` and dispute refreshes
    - Test Escalate confirmation flow: confirm status updates and success message displays

- [x] 11. Wire up App.tsx with navigation
  - [x] 11.1 Update `client/src/App.tsx` to render tab or route switching between `DisputeForm` and `DisputeList`
    - Selecting a dispute from `DisputeList` navigates to `DisputeDetail` for that `id`
    - Navigating back to the list resets the selected dispute
    - _Requirements: 4.2, 4.3_

- [x] 12. Checkpoint — Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Add E2E tests
  - [x] 13.1 Create `client/e2e/dispute-form.spec.ts`
    - Full happy-path: fill all fields, submit, assert `data-testid="triage-result"` is visible with a recommendation label
    - _Requirements: 1.2, 3.1, 3.2_

  - [x] 13.2 Create `client/e2e/dispute-list.spec.ts`
    - Create a dispute via the form, navigate to the list view, assert the new dispute row appears
    - _Requirements: 4.2_

  - [x] 13.3 Create `client/e2e/dispute-detail.spec.ts`
    - Open a resolved dispute, click Reopen, enter a reason, confirm, assert the status badge updates and the reason appears in status history
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 5, 12, 14) provide incremental validation gates
- Property tests validate universal correctness properties using fast-check with a minimum of 100 iterations (`{ numRuns: 100 }`)
- Unit/example tests validate specific scenarios and boundary conditions
- All server imports use the `.js` extension (required for ES module resolution with TypeScript)
- Prisma `PrismaClient` must be imported from the shared `db.ts` singleton — never instantiated in route handlers
- Throw errors with `status` and `code` properties so the existing `errorHandler` middleware handles them

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 5, "tasks": ["6.1", "7.1"] },
    { "id": 6, "tasks": ["6.2", "8.1", "9.1"] },
    { "id": 7, "tasks": ["8.2", "9.2", "10.1"] },
    { "id": 8, "tasks": ["10.2", "10.3", "11.1"] },
    { "id": 9, "tasks": ["13.1", "13.2", "13.3"] }
  ]
}
```
