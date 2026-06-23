# Coding Style and Patterns

## General

- All code must pass `npm run lint` and `npm run format:check` before merging.
- TypeScript strict mode is on — no `any` unless explicitly justified with a comment.
- Prefer explicit return types on exported functions and route handlers.
- Use `const` by default; use `let` only when reassignment is required.

## Backend (Express)

### Route Handlers

- Export routers as named exports from `server/src/routes/`:
  ```ts
  export const disputesRouter = Router();
  ```
- Register routers in `server/src/index.ts` under a versioned or resource path:
  ```ts
  app.use('/api/disputes', disputesRouter);
  ```

### Error Handling

- Throw errors with `status` and `code` properties to work with the centralised error handler:
  ```ts
  const err = new Error('Not found') as any;
  err.status = 404;
  err.code = 'DISPUTE_NOT_FOUND';
  throw err;
  ```
- Do not send error responses directly from route handlers — always throw and let `errorHandler` middleware handle it.

### Validation

- Validate all request inputs at the route layer before calling any business logic.
- Return all validation errors in a single response (not just the first failure).
- Use plain TypeScript type guards or a lightweight validation utility — do not introduce heavy validation libraries without agreement.

### Async Routes

- Wrap async route handlers to catch unhandled rejections:
  ```ts
  disputesRouter.post('/', async (req, res, next) => {
    try {
      // logic
    } catch (err) {
      next(err);
    }
  });
  ```

### Prisma

- Instantiate a single `PrismaClient` and export it from a shared module (e.g., `server/src/db.ts`).
- Do not instantiate `PrismaClient` inside route handlers or business logic functions.

## Frontend (React)

### Components

- Use functional components with hooks only — no class components.
- Keep components focused: one responsibility per component.
- Use `data-testid` attributes on interactive and key display elements so tests can locate them:
  ```tsx
  <button data-testid="submit-dispute">Submit</button>
  ```

### Styling

- Use Tailwind utility classes for all styling — no inline `style` props, no CSS modules.
- Follow mobile-first responsive design where layout matters.

### State and Side Effects

- Use `useState` for local UI state, `useEffect` for side effects such as data fetching.
- Keep data fetching close to where it is used — no global state library for this prototype.

### API Calls

- All `fetch` calls go to `/api/*` (Vite proxies to the Express server in dev).
- Always handle loading and error states in the UI.

## Testing

- Tests must be **deterministic** — stub all external calls (network, timers, random values).
- See `client/tests/setup.ts` for the global test setup and available stubs.
- Unit/component tests go in `<workspace>/tests/`.
- E2E tests go in `client/e2e/`.
- Name test cases clearly: describe what the component or function does, not just what it is.
  ```ts
  it('returns manual_review when issue category is incorrect_amount', () => { ... })
  ```

## Commit Style

- Use conventional commit prefixes: `feat:`, `fix:`, `test:`, `chore:`, `docs:`
- Keep commit messages concise and in the imperative mood: `feat: add dispute triage endpoint`

## Team Conventions (Enforced)

The following conventions are enforced automatically via agent hooks on file save.

### High Priority — Correctness and Consistency

#### No `res.json()` for Errors in Route Handlers
All error responses **must** go through `next(err)`. Never call `res.status(...).json(...)` directly for error cases in route handlers. Errors must carry `status` and `code` properties:
```ts
// WRONG
res.status(404).json({ error: { code: 'NOT_FOUND', message: '...' } });

// CORRECT
const err = new Error('Not found') as any;
err.status = 404;
err.code = 'DISPUTE_NOT_FOUND';
throw err; // caught by next(err) in try/catch
```

#### Every New Route Must Have a Corresponding Test
Any new Express route handler added to `server/src/routes/` must have at least one test in `server/tests/`. Routes without tests must not be merged.

#### `data-testid` on Every Interactive Element
Every `<button>`, `<input>`, `<select>`, `<textarea>`, and key display element must have a `data-testid` attribute. This is non-negotiable — it enables E2E and component tests without relying on fragile text or CSS selectors.

#### No Business Logic in Route Handlers
Route handlers are thin orchestrators only:
- Input validation → `validation.ts`
- Business rules → domain modules (e.g., `triage-engine.ts`)
- Database access → via Prisma through `db.ts`

A route handler should: validate → call business logic → persist → respond. Nothing more.

### Maintainability

#### Conventional Commits
All commit messages must use a conventional prefix:
- `feat:` — new feature
- `fix:` — bug fix
- `test:` — adding or updating tests
- `chore:` — tooling, dependencies, config
- `docs:` — documentation only

Example: `feat: add dispute escalation endpoint`

#### No Magic Numbers
Threshold values used in business logic must be named constants, not inline literals:
```ts
// WRONG
if (amount > 500) { ... }
if (disputeAge > 30) { ... }

// CORRECT
const FRAUD_ESCALATION_THRESHOLD_AMOUNT = 500;
const MISSING_PAYMENT_ESCALATION_DAYS = 30;
if (amount > FRAUD_ESCALATION_THRESHOLD_AMOUNT) { ... }
```
Constants belong in a `constants.ts` file co-located with the module that uses them.

#### Single Responsibility
Each module, component, or function should do one thing. Indicators that a unit is doing too much:
- A component that fetches data, manages form state, AND renders results
- A route handler that contains validation logic, business rules, AND DB queries
- A function longer than ~50 lines

#### No `console.log` in Committed Code
`console.log` statements must not be committed. Use structured error logging (via the error handler middleware) or remove debug statements before merge.

### Banking Context Conventions

#### No Direct External HTTP Calls Without Approval
All `fetch` or HTTP client calls must target `/api/*` (proxied locally). Any call to an external URL (non-localhost, non-relative) must be explicitly approved. This enforces the "no real integrations" constraint.

#### Status Changes Must Write to `statusHistory`
Any code path that updates `disputeStatus` on a `Dispute` record must also create a corresponding `DisputeStatusHistory` entry in the same transaction/operation. Updating status without recording history is a bug.
