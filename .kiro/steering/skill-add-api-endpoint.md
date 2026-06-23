---
inclusion: manual
---

# Skill: Add a New API Endpoint

Use this skill when adding a new Express route to the backend.

## Checklist

1. **Create or update the route file** in `server/src/routes/`
   - One file per resource (e.g., `disputes.ts`, `customers.ts`)
   - Named export: `export const xyzRouter = Router();`
   - All handlers wrapped in `try/catch` with `next(err)`

2. **Add input validation** in `server/src/validation.ts` (or a new `validateXyz.ts`)
   - Return `ValidationError[]` with `{ field, message }` shape
   - Validate all fields in a single pass — collect all errors, don't stop at first

3. **Implement business logic** in a dedicated module (not in the route handler)
   - Route handlers call functions, they don't contain logic

4. **Register the router** in `server/src/index.ts`:
   ```ts
   import { xyzRouter } from './routes/xyz.js';
   app.use('/api/xyz', xyzRouter);
   ```

5. **Write tests** in `server/tests/xyz.test.ts`
   - Happy path (201/200)
   - Validation failure (400 VALIDATION_ERROR with details array)
   - Not found (404 RESOURCE_NOT_FOUND)
   - Any domain-specific error (422)

## Error Pattern

```ts
router.post('/', async (req, res, next) => {
  try {
    const errors = validateXyzInput(req.body);
    if (errors.length > 0) {
      const err = new Error('Request validation failed') as any;
      err.status = 400;
      err.code = 'VALIDATION_ERROR';
      err.details = errors;
      throw err;
    }
    // business logic + Prisma
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});
```

## Response Shape

- **201 Created**: full resource object
- **200 OK**: full resource or paginated envelope `{ data, pagination }`
- **400**: `{ error: { code: 'VALIDATION_ERROR', message, details: [...] } }`
- **404**: `{ error: { code: 'RESOURCE_NOT_FOUND', message } }`
- **422**: `{ error: { code: 'DOMAIN_ERROR_CODE', message } }`

## Imports Reminder

All server-side imports need the `.js` extension:
```ts
import { db } from '../db.js';
import { validateXyzInput } from '../validation.js';
```
