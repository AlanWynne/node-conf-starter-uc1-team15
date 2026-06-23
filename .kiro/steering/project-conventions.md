# Project Conventions

## General

- This is a full-stack TypeScript monorepo using npm workspaces.
- Backend is Express with ES modules. Frontend is React + Vite.
- All code must pass `npm run lint` and `npm run format:check` before merging.

## Backend

- Route files live in `server/src/routes/`, one file per resource.
- Export routers as named exports: `export const <name>Router = Router();`
- Use the centralized error handler middleware — throw errors with `status` and `code` properties.
- Prisma is optional. If used, models go in `server/prisma/schema.prisma`.

## Frontend

- Components live in `client/src/`.
- Use Tailwind utility classes for styling.
- Use `data-testid` attributes for elements that E2E tests need to locate.

## Testing

- Unit/component tests go in `<workspace>/tests/`.
- E2E tests go in `client/e2e/`.
- Tests must be deterministic — stub external calls (see `client/tests/setup.ts`).
