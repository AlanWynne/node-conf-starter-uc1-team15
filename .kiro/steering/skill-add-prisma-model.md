---
inclusion: manual
---

# Skill: Add a Prisma Model

Use this skill when adding a new data model to `server/prisma/schema.prisma`.

## Steps

1. **Add the model** to `server/prisma/schema.prisma`:
   ```prisma
   model MyModel {
     id        String   @id @default(cuid())
     name      String   @db.VarChar(200)
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   ```

2. **Run the migration**:
   ```bash
   npx prisma migrate dev --name add_my_model
   ```
   This generates a migration file in `server/prisma/migrations/` and applies it to `dev.db`.

3. **Verify the client is regenerated** — `prisma migrate dev` runs `prisma generate` automatically. If you only change the schema without migrating, run:
   ```bash
   npx prisma generate
   ```

4. **Use the singleton** from `server/src/db.ts` — never instantiate `PrismaClient` anywhere else:
   ```ts
   import db from '../db.js';
   const record = await db.myModel.create({ data: { ... } });
   ```

5. **Update types** in any route handlers or validation files that need the new model.

## Model Conventions

- IDs: `@id @default(cuid())` — short, URL-safe, collision-resistant
- Timestamps: always include `createdAt` and `updatedAt`
- String lengths: use `@db.VarChar(n)` to match frontend validation limits
- Optional fields: use `String?` not empty string defaults
- Enums: define as Prisma `enum` blocks, not string fields
- Relations: use explicit `@relation(fields: [...], references: [...])` syntax

## Common Issues

- **"Cannot find module @prisma/client"** after schema change → run `npx prisma generate`
- **Migration conflict** → check `server/prisma/migrations/migration_lock.toml` and ensure you're on `provider = "prisma-migrate"`
- **SQLite locked** → stop the dev server before running migrations
- **Rollback** → SQLite migrations are not reversible; restore `dev.db` from a backup or reset with `npx prisma migrate reset` (destroys all data)
