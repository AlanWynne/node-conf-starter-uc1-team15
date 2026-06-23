# Project Overview: Payment Dispute Triage — node-conf-starter

## What Is This?

A full-stack **Node.js + React** monorepo that implements a **Payment Dispute Triage** tool for banking operations staff. The application captures customer payment disputes, applies a deterministic rules engine to recommend the next action, and tracks the full lifecycle of each case.

Built as a conference demo project showcasing Kiro's AI-partnered development workflow (spec-driven development, hooks, and steering files). The Payment Dispute Triage feature was designed and implemented entirely through Kiro's requirements → design → tasks workflow.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS 3 |
| Backend | Node.js 22 LTS, Express 4, TypeScript (ES modules) |
| Database | SQLite + Prisma ORM |
| Unit/Component Tests | Vitest + Testing Library |
| Property-Based Tests | fast-check |
| E2E Tests | Playwright |
| Linting | ESLint 9 (flat config) |
| Formatting | Prettier 3 |
| Monorepo | npm workspaces |

---

## Project Structure

```
node-conf-starter/
├── server/                        # Express backend package
│   ├── src/
│   │   ├── index.ts               # Entry point (Express app, port 3001)
│   │   ├── triage-engine.ts       # Pure-function rules engine
│   │   ├── validation.ts          # Input validation helpers
│   │   ├── constants.ts           # Business rule thresholds and limits
│   │   ├── db.ts                  # Singleton Prisma client
│   │   ├── dispute-ref.ts         # DSP-YYYYMMDD-XXXX reference generator
│   │   ├── routes/
│   │   │   ├── disputes.ts        # Disputes API router
│   │   │   └── api.ts             # Utility routes (health, echo, info)
│   │   └── middleware/
│   │       └── errorHandler.ts    # Centralised error middleware
│   ├── prisma/
│   │   └── schema.prisma          # Dispute and DisputeStatusHistory models
│   ├── tests/                     # Vitest unit + integration tests
│   └── .env.example               # Environment variable template
├── client/                        # React + Vite frontend package
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Root — tab navigation between views
│   │   ├── components/
│   │   │   ├── DisputeForm.tsx    # New dispute form + triage result display
│   │   │   ├── DisputeList.tsx    # Paginated dispute table
│   │   │   ├── DisputeDetail.tsx  # Full dispute view + reopen/escalate actions
│   │   │   ├── TriageResult.tsx   # Recommendation card with urgency indicator
│   │   │   └── StatusHistory.tsx  # Status change timeline
│   │   └── index.css              # Tailwind directives
│   ├── tests/                     # Vitest + Testing Library component tests
│   ├── e2e/                       # Playwright end-to-end tests
│   └── public/                    # Static assets
├── docs/
│   ├── api-spec.md                # Full API contract reference
│   ├── architecture.md            # Architecture and design decisions
│   └── ui-spec.md                 # UI component specifications
├── .kiro/
│   ├── steering/                  # Steering files (coding conventions, product context)
│   ├── specs/payment-dispute-triage/
│   │   ├── requirements.md        # Feature requirements (7 requirements, 48 criteria)
│   │   ├── design.md              # Technical design, API contract, and correctness properties
│   │   └── tasks.md               # Implementation task list (14 tasks, all complete)
│   └── hooks/                     # Agent hook definitions
├── conference/                    # Talk materials for conference demos
├── chat-log/                      # Chat session logs (hook demo artefacts)
└── package.json                   # Root workspace config
```

---

## What the Application Does

Operations staff use the tool through a three-view UI:

**New Dispute (DisputeForm)**
- Fill in customer name, transaction reference, payment type, issue category, transaction status, amount, date, and description
- Submit to receive an instant recommended action with a colour-coded urgency indicator
- High-urgency (red) for `escalate_to_fraud`; standard (green/blue/amber/grey) for all other actions

**Disputes List (DisputeList)**
- Browse all submitted disputes newest-first with pagination
- Columns: Customer Name, Payment Type, Issue Category, Recommended Action, Status, Created At
- Click any row to open the full detail view

**Dispute Detail (DisputeDetail)**
- View all fields including description and full status history
- For resolved disputes: Reopen or Escalate with a mandatory reason
- Status history shows each transition with reason and timestamp

---

## Backend API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/disputes` | Create a dispute and run the triage engine |
| GET | `/api/disputes` | List disputes (paginated, `createdAt` desc) |
| GET | `/api/disputes/:id` | Get full dispute with status history |
| PATCH | `/api/disputes/:id/status` | Reopen or escalate a resolved dispute |
| PATCH | `/api/disputes/:id/resolve` | Mark a dispute as resolved |
| GET | `/health` | Server liveness check |
| GET | `/api/health` | API health + uptime |
| GET | `/api/info` | API name/version/environment |
| POST | `/api/echo` | Echoes the JSON body back |

---

## Triage Rules Engine

A pure TypeScript function (`triageDispute`) in `server/src/triage-engine.ts`. No I/O, no side effects — same inputs always produce the same output.

| Priority | Condition | Recommended Action |
|----------|-----------|-------------------|
| 1 | `unauthorized_transaction` AND `amount > 500` | `escalate_to_fraud` |
| 2 | `unauthorized_transaction` AND `amount <= 500` | `manual_review` |
| 3 | `duplicate_charge` AND `transactionStatus === completed` | `auto_refund` |
| 4 | `failed_transfer` AND `transactionStatus === failed` | `contact_customer` |
| 5 | `missing_payment` AND `disputeAge > 30 days` | `escalate_to_fraud` |
| 6 | `missing_payment` AND `disputeAge <= 30 days` | `manual_review` |
| 7 | `incorrect_amount` | `manual_review` |
| Default | *(no rule matched)* | `manual_review` |

---

## Test Coverage

**100 automated tests — all passing**

| Suite | Type | Tests |
|-------|------|-------|
| Triage engine | Property-based (fast-check, 100 runs/property) + boundary | 15 |
| Input validation | Example-based | 27 |
| Disputes API routes | Route integration (Prisma mocked) | 15 |
| Sample | Baseline | 2 |
| TriageResult component | Property-based + example | 8 |
| DisputeForm component | Example-based | 8 |
| DisputeList component | Example-based | 8 |
| DisputeDetail component | Property-based + example | 11 |
| App navigation | Example-based | 6 |

E2E tests (Playwright) cover the happy-path form submission, list navigation, and the reopen/escalate confirmation flow. They require both dev servers to be running: `npm run test:e2e`.

---

## What You Can Do

### Run the App

```bash
npm install
cp server/.env.example server/.env
npm run db:migrate --workspace=server
npm run dev
```

### Run Tests

```bash
npm test                                  # all unit/component tests
npm run test:coverage --workspace=server  # coverage report
npx playwright install && npm run test:e2e  # E2E tests
```

### Lint and Format

```bash
npm run lint
npm run format
```

---

## Conference Demo Context

This project was prepared for a conference talk on **"The Kiro Engineer — AI-Partnered Development in Practice"**. The Payment Dispute Triage feature demonstrates the full Kiro spec-driven workflow:

1. **Requirements** — 7 requirements, 48 acceptance criteria in `.kiro/specs/payment-dispute-triage/requirements.md`
2. **Design** — Architecture, API contract, triage rules, and 12 correctness properties in `design.md`
3. **Tasks** — 14 implementation tasks executed in dependency order in `tasks.md`

The `conference/` folder contains the talk script and outline. The `.kiro/hooks/` folder contains agent hooks used in the demo, including automated chat logging.

---

## Prerequisites

- Node.js 20+ (pinned to Node 22 LTS via `.nvmrc`)
- npm 10+
