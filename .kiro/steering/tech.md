# Tech Stack

## Overview

This is a TypeScript monorepo using npm workspaces. The backend and frontend are separate packages managed from the root.

## Runtime

- **Node.js 22 LTS** (pinned via `.nvmrc`). Minimum supported version is Node 20.
- Both packages use `"type": "module"` — ES module syntax (`import`/`export`) throughout.

## Backend (`server/`)

| Concern | Choice |
|---|---|
| Framework | Express 4 |
| Language | TypeScript 5 |
| Dev runner | `tsx` (no compile step in development) |
| Production build | `tsc` → `dist/` |
| Database | SQLite via Prisma ORM |
| Environment | `dotenv` — copy `.env.example` to `.env` |

Key dependencies: `express`, `cors`, `@prisma/client`, `dotenv`

## Frontend (`client/`)

| Concern | Choice |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Dev server | `:5173`, proxies `/api/*` → `localhost:3001` |

Key dependencies: `react`, `react-dom`, `vite`, `tailwindcss`

## Testing

| Scope | Tool |
|---|---|
| Backend unit tests | Vitest |
| Frontend component tests | Vitest + Testing Library |
| End-to-end tests | Playwright |
| Coverage | `@vitest/coverage-v8` |

## Tooling

| Tool | Purpose |
|---|---|
| ESLint 9 (flat config) | Linting — `eslint.config.mjs` at root |
| Prettier 3 | Formatting — `.prettierrc.json` at root |
| concurrently | Run backend + frontend together with `npm run dev` |

## Ports

- Backend: `3001`
- Frontend dev server: `5173`

## Adding Dependencies

- Pin exact or tilde versions — avoid open ranges (`^` is acceptable for devDependencies).
- Install server dependencies: `npm install <pkg> --workspace=server`
- Install client dependencies: `npm install <pkg> --workspace=client`
