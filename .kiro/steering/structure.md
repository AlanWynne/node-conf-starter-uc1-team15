# File Organisation and Naming Conventions

## Monorepo Layout

```
node-conf-starter/
├── server/                        # Express backend package
│   ├── src/
│   │   ├── index.ts               # App entry point — Express setup, middleware, port binding
│   │   ├── routes/                # One file per resource, e.g. disputes.ts
│   │   └── middleware/            # Shared middleware, e.g. errorHandler.ts
│   ├── prisma/
│   │   └── schema.prisma          # Prisma data models
│   ├── tests/                     # Backend unit tests
│   └── .env.example               # Environment variable template
├── client/                        # React + Vite frontend package
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Root component
│   │   ├── components/            # Reusable UI components
│   │   └── index.css              # Tailwind directives
│   ├── tests/                     # Component unit tests (Vitest + Testing Library)
│   ├── e2e/                       # Playwright end-to-end tests
│   └── public/                    # Static assets
├── .kiro/
│   ├── steering/                  # Steering files (this directory)
│   ├── specs/                     # Feature specs (requirements, design, tasks)
│   └── hooks/                     # Agent hook definitions
├── conference/                    # Demo scripts and talk materials
├── chat-log/                      # Chat session logs (hook demo artefacts)
└── package.json                   # Root workspace config
```

## Naming Rules

### Files and Directories

- Use **kebab-case** for all file and directory names: `dispute-router.ts`, `triage-engine.ts`
- Test files mirror their source file name with a `.test.ts` / `.test.tsx` suffix: `disputes.test.ts`
- E2E spec files use `.spec.ts` suffix: `dispute-form.spec.ts`

### Backend Routes

- One route file per resource in `server/src/routes/`
- Example: disputes resource → `server/src/routes/disputes.ts`
- Export the router as a named export: `export const disputesRouter = Router();`

### Frontend Components

- Component files use **PascalCase**: `DisputeForm.tsx`, `DisputeList.tsx`
- Each component lives in `client/src/components/`
- Co-locate component-specific types in the same file unless shared

### Prisma Models

- Model names use **PascalCase** singular: `Dispute`, `User`
- Field names use **camelCase**: `createdAt`, `paymentType`

### Environment Variables

- All caps with underscores: `DATABASE_URL`, `PORT`
- Defined in `server/.env` (from `.env.example`); never committed to source control

## Import Paths

- Use `.js` extension in server imports (required for ES module resolution with TypeScript): `import { errorHandler } from './middleware/errorHandler.js'`
- Client imports do not need extensions (Vite resolves them)
