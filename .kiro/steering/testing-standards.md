---
inclusion: fileMatch
fileMatchPattern: "{server/tests/**,client/tests/**,client/e2e/**}"
---

# Testing Standards

These standards apply to all test files across the monorepo.

## Test File Location

| Test type | Location |
|---|---|
| Backend unit tests | `server/tests/` |
| Frontend component tests | `client/tests/` |
| End-to-end tests | `client/e2e/` |

Mirror the source file structure: `server/src/routes/disputes.ts` → `server/tests/routes/disputes.test.ts`

## Naming

- Test files: `<source-name>.test.ts` or `<source-name>.test.tsx` for unit/component tests.
- E2E files: `<feature-name>.spec.ts`.
- Describe blocks: name the unit under test — `describe('triageEngine', () => { ... })`.
- Test cases: describe the **behaviour**, not the implementation — use "returns", "displays", "rejects", "creates":
  ```ts
  it('returns escalate_to_fraud when unauthorized_transaction amount exceeds 500', () => { ... })
  it('displays a validation error when amount is missing', () => { ... })
  ```

## Determinism

- **Stub all external calls**: network requests, timers, `Date.now()`, `Math.random()`.
- Global stubs for frontend tests are set up in `client/tests/setup.ts` — add shared stubs there.
- Do not rely on test execution order — each test must be independently runnable.

## Backend Tests (Vitest)

- Test business logic (e.g., triage rules) in pure unit tests — no Express, no database.
- Use `supertest` for route integration tests when needed; mock the Prisma client.
- One `describe` block per route or function; group happy path and error cases separately.

## Frontend Tests (Vitest + Testing Library)

- Use Testing Library queries in priority order: `getByRole` > `getByLabelText` > `getByTestId`.
- Use `data-testid` only when semantic queries are not practical.
- Stub `fetch` for all API calls — do not make real HTTP requests in component tests.
- Test rendered output and user interactions, not internal state or implementation details.

## E2E Tests (Playwright)

- E2E tests live in `client/e2e/` and target the running application (both server and client must be up).
- Locate elements using `data-testid` attributes — set these in components explicitly.
- Each spec file covers one user journey (e.g., `submit-dispute.spec.ts`, `dispute-list.spec.ts`).
- Clean up any data created during the test run — use a dedicated test seed or reset endpoint.

## Running Tests

```bash
# All unit and component tests
npm test

# Backend tests only
npm run test --workspace=server

# Frontend tests only
npm run test --workspace=client

# With coverage
npm run test:coverage --workspace=server

# E2E (requires dev server running)
npm run test:e2e
```

## Coverage

- Aim for coverage on all triage business rule branches — every rule combination should have a corresponding test case.
- Do not commit code with untested rule paths.

#[[file:client/tests/setup.ts]]
