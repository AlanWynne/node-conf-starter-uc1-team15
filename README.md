# Payment Dispute Triage — Node Conf Starter

A full-stack **Node.js + React** application for triaging and routing customer payment disputes. Built on a TypeScript monorepo with an Express backend, SQLite via Prisma, and a React + Tailwind frontend.

## What It Does

Operations staff use this tool to capture a customer payment dispute, receive an instant deterministic recommendation, and track the full case lifecycle. The triage engine evaluates a set of ordered business rules and returns a recommended next action — auto refund, manual review, escalate to fraud, or contact customer — consistently and without manual interpretation.

Key capabilities:
- Submit a dispute with payment type, issue category, transaction details, and description
- Receive an instant recommended action with a clear urgency indicator
- Browse and paginate all past disputes
- View full dispute details including status history
- Reopen or escalate resolved disputes with a mandatory reason

## Tech Stack

**Backend** (`server/`)
- Node.js 22 LTS + Express 4 (TypeScript, ES modules)
- SQLite + Prisma ORM
- Vitest + fast-check for unit and property-based tests

**Frontend** (`client/`)
- React 18 + Vite (TypeScript)
- Tailwind CSS
- Vitest + Testing Library for component tests
- Playwright for end-to-end tests

The repo is an **npm workspaces monorepo**: one `npm install` at the root sets up both packages.

## Prerequisites

- **Node.js 20+** (the repo pins **Node 22 LTS** via `.nvmrc`)
- **npm 10+** (ships with Node 20/22)

```bash
nvm use      # or: fnm use
```

## Quick Start

```bash
# 1. Clone
git clone https://github.com/thandog/node-conf-starter.git
cd node-conf-starter

# 2. Install
npm install

# 3. Set up the database
cp server/.env.example server/.env
npm run db:migrate --workspace=server

# 4. Run both apps
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- The Vite dev server proxies `/api/*` to the backend automatically.

> The backend listens on port **3001** by default. Override with `PORT` in `server/.env` if needed.

## Common Scripts

Run from the repo root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start backend + frontend together (hot reload) |
| `npm run build` | Type-check and build both apps for production |
| `npm start` | Run the built backend (`server/dist`) |
| `npm test` | Run all unit/component tests once (backend + frontend) |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run lint` | Lint all code with ESLint |
| `npm run format` | Format all code with Prettier (`format:check` to verify) |

Per-workspace scripts (append `--workspace=server` or `--workspace=client`):

| Command | Workspace | What it does |
| --- | --- | --- |
| `npm run dev` | both | Start that app's dev server |
| `npm run build` | both | Build that app |
| `npm test` | both | Run tests once |
| `npm run test:watch` | both | Run tests in watch mode |
| `npm run test:coverage` | both | Run tests with a coverage report |
| `npm run preview` | client | Preview the production build |

## Database

SQLite + Prisma is required for the dispute triage feature. Set it up before running:

```bash
cp server/.env.example server/.env
npm run db:generate --workspace=server
npm run db:migrate --workspace=server
```

Other database scripts (run with `--workspace=server`):

| Command | What it does |
| --- | --- |
| `npm run db:studio` | Open Prisma Studio to view/edit data |
| `npm run db:migrate:deploy` | Apply migrations in production |

The Prisma schema lives in `server/prisma/schema.prisma`. The SQLite file and generated client are git-ignored.

## Testing

Unit and property-based tests run once and exit (CI-friendly):

```bash
npm test                              # both workspaces
npm run test:watch --workspace=client # watch mode while developing
npm run test:coverage --workspace=server
```

The test suite includes **property-based tests** using [fast-check](https://github.com/dubzzz/fast-check) that run 100 iterations each, covering the triage rules engine, validation, and UI component behaviour.

### End-to-end (Playwright)

```bash
npx playwright install    # once per machine
npm run test:e2e
```

E2E tests live in `client/e2e/`. Playwright starts the client dev server automatically and requires the backend to be running.

## Project Structure

```
node-conf-starter/
├── server/                 # Express backend (TypeScript, ESM)
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── triage-engine.ts      # Pure-function rules engine
│   │   ├── validation.ts         # Input validation helpers
│   │   ├── constants.ts          # Business rule thresholds and limits
│   │   ├── db.ts                 # Singleton Prisma client
│   │   ├── dispute-ref.ts        # DSP-YYYYMMDD-XXXX reference generator
│   │   ├── routes/disputes.ts    # Disputes API router
│   │   └── middleware/           # Error handler middleware
│   ├── prisma/schema.prisma      # Dispute and DisputeStatusHistory models
│   ├── tests/                    # Vitest unit + integration tests
│   └── tsconfig.json
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx               # Root component — tab navigation
│   │   └── components/
│   │       ├── DisputeForm.tsx   # New dispute form with triage result
│   │       ├── DisputeList.tsx   # Paginated dispute table
│   │       ├── DisputeDetail.tsx # Full dispute view + reopen/escalate
│   │       ├── TriageResult.tsx  # Recommendation card with urgency indicator
│   │       └── StatusHistory.tsx # Status change timeline
│   ├── tests/                    # Vitest + Testing Library component tests
│   ├── e2e/                      # Playwright end-to-end tests
│   └── tsconfig.json
├── docs/
│   ├── api-spec.md               # Full API contract reference
│   ├── architecture.md           # Architecture and design decisions
│   └── ui-spec.md                # UI component specifications
├── .kiro/specs/payment-dispute-triage/
│   ├── requirements.md           # Feature requirements
│   ├── design.md                 # Technical design and properties
│   └── tasks.md                  # Implementation task list
├── tsconfig.json           # Shared, strict compiler base
├── .nvmrc                  # Pinned Node version
└── package.json            # npm workspaces + root scripts
```

## API

The backend exposes the Payment Dispute Triage API plus the original utility endpoints:

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/disputes` | Create a dispute and run triage |
| GET | `/api/disputes` | List disputes (paginated, newest first) |
| GET | `/api/disputes/:id` | Get full dispute with status history |
| PATCH | `/api/disputes/:id/status` | Reopen or escalate a resolved dispute |
| PATCH | `/api/disputes/:id/resolve` | Mark a dispute as resolved |
| GET | `/health` | Server liveness check |
| GET | `/api/health` | API health + uptime |
| GET | `/api/info` | API name/version/environment |
| POST | `/api/echo` | Echoes the JSON body back |

See [`docs/api-spec.md`](docs/api-spec.md) for the full contract including request/response shapes, error codes, and triage rule reference.

## Triage Rules

The `recommendedAction` is determined by these rules, evaluated in order. First match wins.

| Condition | Action |
| --- | --- |
| `unauthorized_transaction` AND `amount > 500` | `escalate_to_fraud` |
| `unauthorized_transaction` AND `amount <= 500` | `manual_review` |
| `duplicate_charge` AND `transactionStatus === completed` | `auto_refund` |
| `failed_transfer` AND `transactionStatus === failed` | `contact_customer` |
| `missing_payment` AND `disputeAge > 30 days` | `escalate_to_fraud` |
| `missing_payment` AND `disputeAge <= 30 days` | `manual_review` |
| `incorrect_amount` | `manual_review` |
| *(no rule matched)* | `manual_review` |

## License

MIT
