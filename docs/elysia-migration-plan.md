# Elysia Migration Plan

## Goal

Replace the current Bun.serve API pattern with Elysia.js to gain:
- Built-in validation (TypeBox)
- Type-safe API client (Eden)
- Better error handling
- OpenAPI generation

**Constraints:**
- Keep one API endpoint per file in `src/api/`
- Controllers remain framework-agnostic (no Elysia knowledge)
- Many smaller files for AI agent consumption
- Preserve Elysia's type system (no breaking the chain)

---

## Architecture Overview

### Current Structure
```
src/
├── api/
│   └── <module>/
│       └── api.<name>.ts  # Exports Partial<Record<HTTPMethod, Handler>>
├── controller/
│   └── <module>/
│       └── ctrl.<name>.ts  # Framework-agnostic business logic
├── function/
│   └── <module>/
│       └── fx.<name>.ts    # Pure functions
└── index.ts               # Bun.serve with routes object
```

### New Structure
```
src/
├── api/
│   ├── <module>/
│   │   ├── api.<name>.ts      # Exports Elysia instance (route plugin)
│   │   └── api.<name>.model.ts # Optional: validation schemas for this route
│   └── router.ts              # Composes all route plugins
├── controller/
│   └── <module>/
│       └── ctrl.<name>.ts     # UNCHANGED - framework-agnostic
├── function/
│   └── <module>/
│       └── fx.<name>.ts       # UNCHANGED
└── index.ts                   # Main Elysia app
```

---

## File Patterns

### 1. API Route File (`src/api/<module>/api.<name>.ts`)

Each file exports an Elysia instance with a single logical endpoint.

```typescript
import { Elysia, t } from 'elysia';
import ctrlUserList from '@/src/controller/user/ctrl.user-list';
import { toErrorResponse } from '@/src/error/err.response';
import { drizzleDb } from '@/src/database/user/conn.user';

// Validation models defined inline or imported from api.<name>.model.ts
const queryModel = t.Object({
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric({ default: 20 })),
});

// Export Elysia instance as default
export default new Elysia({ prefix: '/api/users' })
  .get('/', async ({ query, set }) => {
    // Prepare portal (framework concerns here)
    const portal = {
      db: drizzleDb,
      session: null, // resolved from auth middleware
    };

    // Call framework-agnostic controller
    const [result, error] = await ctrlUserList(portal, {
      page: query.page,
      limit: query.limit,
    });

    if (error) {
      set.status = error.statusCode;
      return toErrorResponse({ error });
    }

    return result;
  }, {
    query: queryModel,
    detail: {
      tags: ['Users'],
      summary: 'List all users',
    },
  });
```

**Key Rules:**
- File name: `api.<endpoint-name>.ts`
- Variable/export: Elysia instance with prefix matching route
- One logical endpoint per file (can have multiple methods)
- Controllers called with prepared `portal` and `args`

### 2. API Model File (`src/api/<module>/api.<name>.model.ts`) - Optional

For complex endpoints, separate validation schemas into their own file.

```typescript
import { t } from 'elysia';

export const userCreateBody = t.Object({
  email: t.String({ format: 'email' }),
  name: t.String({ minLength: 2, maxLength: 100 }),
  role: t.Optional(t.Union([
    t.Literal('admin'),
    t.Literal('user'),
  ])),
});

export const userIdParams = t.Object({
  id: t.String({ format: 'uuid' }),
});

// Extract types for use in controllers
export type TUserCreateBody = typeof userCreateBody.static;
export type TUserIdParams = typeof userIdParams.static;
```

### 3. Router File (`src/api/router.ts`)

Composes all API routes into a single plugin.

```typescript
import { Elysia } from 'elysia';

// Import all API route plugins
import apiUsers from './user/api.users';
import apiUserId from './user/api.users.:id';
import apiBoards from './board/api.boards';

export default new Elysia({ name: 'api-router' })
  .use(apiUsers)
  .use(apiUserId)
  .use(apiBoards);
```

**Note:** The router preserves Elysia's type chain by explicit `.use()` composition.

### 4. Main Entry (`src/index.ts`)

```typescript
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import apiRouter from './api/router';

const app = new Elysia()
  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'Visual Backend API',
        version: '1.0.0',
      },
    },
  }))
  .use(apiRouter)
  .get('/health', () => ({ status: 'ok' }))
  .onError(({ error, set }) => {
    console.error(error);
    set.status = 500;
    return { error: 'Internal Server Error' };
  })
  .listen(process.env.PORT || 3000);

console.log(`Server running on http://localhost:${app.server?.port}`);

export type App = typeof app;
```

---

## Plugin Check Updates

### File: `.opencode/helper-fns/api-checks.ts`

Update validation rules for the new Elysia pattern.

#### New Assertions

| Assertion | Rule |
|-----------|------|
| `assertApiFileName` | File must start with `api.` (UNCHANGED) |
| `assertApiDefaultExportIsElysia` | Default export must be Elysia instance |
| `assertApiHasPrefix` | Elysia constructor must have `prefix` option |
| `assertApiPrefixMatchesPath` | Prefix must match `/api/<module>/<name>` pattern |
| `assertApiImportsController` | Must import at least one `ctrl.*` file |

#### Removed Assertions

- `assertApiDefaultExportIsVariable` - replaced by Elysia check
- `assertApiVariableName` - no longer needed
- `assertApiVariableType` - Elysia handles types

#### Detection Pattern

```typescript
// Check for Elysia pattern
const hasElysiaImport = /import\s+{\s*Elysia[^}]*}\s+from\s+['"]elysia['"]/.test(content);
const hasElysiaInstance = /new\s+Elysia\s*\(/.test(content);
const hasPrefix = /new\s+Elysia\s*\(\s*{\s*prefix\s*:/.test(content);
const exportsElysia = /export\s+default\s+new\s+Elysia/.test(content);
```

---

## Controller Layer (UNCHANGED)

Controllers remain completely framework-agnostic:

```typescript
// src/controller/user/ctrl.user-list.ts
export type TPortal = {
  db: DrizzleDb;
  session: TSession | null;
};

export type TArgs = {
  page?: number;
  limit?: number;
};

export default async function ctrlUserList(
  portal: TPortal,
  args: TArgs
): Promise<TErrTuple<TUserListResponse>> {
  // Business logic here - no knowledge of Elysia
}
```

---

## Migration Steps

### Phase 1: Setup
1. Install Elysia: `bun add elysia @elysiajs/swagger`
2. Create `src/api/router.ts`
3. Update `src/index.ts` to use Elysia

### Phase 2: Update Plugin Checks
1. Update `.opencode/helper-fns/api-checks.ts` with new assertions
2. Add tests for new assertions
3. Update `.opencode/agent/api-builder.md` with new pattern

### Phase 3: Migrate API Files
1. Convert existing API files to Elysia pattern
2. Replace Zod validation with TypeBox (`t`)
3. Test each endpoint

### Phase 4: Add Eden Client (Optional)
1. Export app type from `src/index.ts`
2. Create client package for type-safe API calls

---

## Type Safety Considerations

### Preserving the Type Chain

Elysia's type inference relies on method chaining. To maintain type safety across files:

1. **Always use `.use()` for composition** - don't spread or destructure plugins
2. **Export Elysia instances directly** - don't wrap in functions
3. **Keep the router explicit** - don't use dynamic imports

```typescript
// CORRECT - preserves types
export default new Elysia({ prefix: '/api/users' })
  .get('/', handler);

// INCORRECT - breaks type chain
const routes = new Elysia();
routes.get('/', handler);
export default routes;
```

### Model Sharing

When controllers need the same types as API validation:

```typescript
// api.users.model.ts
export const userBody = t.Object({ name: t.String() });
export type TUserBody = typeof userBody.static;

// ctrl.create-user.ts
import type { TUserBody } from '@/src/api/user/api.users.model';

export type TArgs = TUserBody & { createdBy: string };
```

---

## Error Handling

Elysia provides built-in error handling. Update pattern:

```typescript
// In API route
.get('/', async ({ set }) => {
  const [result, error] = await ctrlSomething(portal, args);

  if (error) {
    set.status = error.statusCode;
    return {
      code: error.code,
      message: error.externalMessage.en,
    };
  }

  return result;
})
```

Or use `.onError()` at the app level for global handling.

---

## Files to Modify

| File | Action |
|------|--------|
| `src/index.ts` | Replace Bun.serve with Elysia |
| `src/api/router.ts` | Create new file |
| `src/api/<module>/api.*.ts` | Convert to Elysia pattern |
| `.opencode/helper-fns/api-checks.ts` | Update assertions |
| `.opencode/agent/api-builder.md` | Update documentation |
| `package.json` | Add elysia dependencies |

---

## Benefits

1. **Validation** - TypeBox validates at runtime + compile time
2. **Type Safety** - End-to-end types from route to client (Eden)
3. **OpenAPI** - Auto-generated docs from schemas
4. **Error Handling** - Built-in error types and handlers
5. **Performance** - Optimized for Bun runtime
6. **AI Agent Friendly** - Small files, clear patterns, explicit composition
