---
description: You build API layer handlers in src/api
mode: subagent
---

API handlers are located in `src/api/<MODULE>`.

## Required Structure (Elysia Pattern)

Each API file exports an Elysia instance with a prefix matching the route path.

```ts
import { Elysia, t } from 'elysia';
import ctrlUserList from '@/src/controller/user/ctrl.user-list';
import { toErrorResponse } from '@/src/error/err.response';

export default new Elysia({ prefix: '/api/users' })
  .get('/', async ({ query, set }) => {
    const portal = { db: drizzleDb, session: null };
    const [result, error] = await ctrlUserList(portal, { page: query.page });

    if (error) {
      set.status = error.statusCode;
      return toErrorResponse({ error });
    }
    return result;
  }, {
    query: t.Object({
      page: t.Optional(t.Numeric()),
    }),
  });
```

## Critical Requirements

- **Import Elysia**: `import { Elysia, t } from 'elysia'`
- **File name**: Must start with `api.` prefix (e.g., `api.users.ts`)
- **Default export**: Must be `new Elysia({ prefix: '/api/...' })`
- **Prefix option**: REQUIRED - must start with `/api/`
- **Controller import**: Must import at least one `ctrl.*` file
- **File location**: `src/api/<module>/api.<name>.ts`

## Authentication

Use the auth plugin directly in API files that need authentication. The plugin **must** be `.use()`'d in the child router (not api-router.ts) to get proper type inference for `{ user, session }`.

### Setup

```ts
import { Elysia, t } from 'elysia';
import { fooAuthPlugin } from '@/src/database/foo/plugin.auth.foo';

export default new Elysia({ prefix: '/api/users' })
  .use(fooAuthPlugin)  // REQUIRED for { user, session } types
  .get('/me', ({ user }) => user, { auth: true })  // Protected
  .get('/public', () => 'hello')                   // Public
```

### Key Points

- **Plugin in child router**: Must `.use(authPlugin)` in each API file, not just api-router.ts
- **Protected routes**: Add `{ auth: true }` - returns 401 if no session
- **Public routes**: Omit `{ auth: true }` - no auth check
- **Context access**: `{ user, session }` available in protected route handlers
- **Type safety**: Types only resolve when plugin is used in same Elysia instance

### Multiple Auth Instances

Different API files can use different auth plugins:

```ts
// api.foo.ts - uses foo database auth
import { fooAuthPlugin } from '@/src/database/foo/plugin.auth.foo';
export default new Elysia({ prefix: '/api/foo' })
  .use(fooAuthPlugin)
  .get('/me', ({ user }) => user, { auth: true })

// api.bar.ts - uses bar database auth
import { barAuthPlugin } from '@/src/database/bar/plugin.auth.bar';
export default new Elysia({ prefix: '/api/bar' })
  .use(barAuthPlugin)
  .get('/me', ({ user }) => user, { auth: true })

// api.health.ts - no auth needed
export default new Elysia({ prefix: '/api/health' })
  .get('/', () => 'ok')
```

## File Naming Convention

Match the endpoint path with file name:
- `/api/users` → `api.users.ts`
- `/api/users/:id` → `api.users.:id.ts`
- `/api/boards/:boardId/cards` → `api.boards.:boardId.cards.ts`

## Validation with TypeBox

Use Elysia's built-in `t` (TypeBox) for validation. This provides:
- Runtime validation
- TypeScript type inference
- OpenAPI schema generation

```ts
import { Elysia, t } from 'elysia';

export default new Elysia({ prefix: '/api/users/:id' })
  .get('/', async ({ params, query }) => {
    // params.id is typed as string
    // query.include is typed as string[] | undefined
  }, {
    params: t.Object({
      id: t.String({ format: 'uuid' }),
    }),
    query: t.Object({
      include: t.Optional(t.Array(t.String())),
    }),
  })
  .put('/', async ({ params, body }) => {
    // body is typed with full inference
  }, {
    params: t.Object({
      id: t.String({ format: 'uuid' }),
    }),
    body: t.Object({
      name: t.String({ minLength: 1, maxLength: 100 }),
      email: t.String({ format: 'email' }),
    }),
  });
```

## Common TypeBox Validators

```ts
import { t } from 'elysia';

// Primitives
t.String()
t.Number()
t.Boolean()
t.Numeric()           // String that coerces to number

// With constraints
t.String({ minLength: 1, maxLength: 100 })
t.Number({ minimum: 0, maximum: 100 })
t.String({ format: 'email' })
t.String({ format: 'uuid' })

// Optional & nullable
t.Optional(t.String())
t.Nullable(t.String())

// Arrays & objects
t.Array(t.String())
t.Object({ name: t.String() })

// Union & literal
t.Union([t.Literal('admin'), t.Literal('user')])
```

## Separate Model Files (Optional)

For complex validation schemas, create a separate model file:

```ts
// src/api/user/api.users.model.ts
import { t } from 'elysia';

export const userCreateBody = t.Object({
  email: t.String({ format: 'email' }),
  name: t.String({ minLength: 2, maxLength: 100 }),
  role: t.Optional(t.Union([
    t.Literal('admin'),
    t.Literal('user'),
  ])),
});

// Extract type for use in controllers
export type TUserCreateBody = typeof userCreateBody.static;
```

Then import in your API file:
```ts
import { userCreateBody } from './api.users.model';

export default new Elysia({ prefix: '/api/users' })
  .post('/', handler, { body: userCreateBody });
```

## API Layer Responsibilities

The API layer handles HTTP concerns and prepares data for controllers. **No business logic in API layer.**

**API Layer:**
- Parse and validate path/query/body parameters (via Elysia schemas)
- Authenticate & authorize requests
- Open database connections
- Prepare portal object with dependencies
- Call controller with prepared data
- Return HTTP response

**Controller Layer:**
- Contains all business logic
- Framework-agnostic (no knowledge of Elysia)
- Processes prepared parameters
- Returns result or error tuple

## Handler Pattern

```ts
import { Elysia, t } from 'elysia';
import ctrlCreateUser from '@/src/controller/user/ctrl.create-user';
import { drizzleDb } from '@/src/database/user/conn.user';
import { toErrorResponse } from '@/src/error/err.response';

export default new Elysia({ prefix: '/api/users' })
  .post('/', async ({ body, set }) => {
    // 1. Prepare portal (framework concerns)
    const portal = {
      db: drizzleDb,
      session: null, // TODO: resolve from auth
    };

    // 2. Call framework-agnostic controller
    const [result, error] = await ctrlCreateUser(portal, body);

    // 3. Handle error
    if (error) {
      set.status = error.statusCode;
      return toErrorResponse({ error });
    }

    // 4. Return success
    set.status = 201;
    return result;
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      name: t.String({ minLength: 1 }),
    }),
    detail: {
      tags: ['Users'],
      summary: 'Create a new user',
    },
  });
```

## Router Composition

After creating an API file, add it to `src/api/router.ts`:

```ts
import { Elysia } from 'elysia';

import apiUsers from './user/api.users';
import apiUsersId from './user/api.users.:id';

export default new Elysia({ name: 'api-router' })
  .use(apiUsers)
  .use(apiUsersId);
```

**Important**: Always use `.use()` for composition to preserve type chain.

## Error Handling

```ts
import { toErrorResponse } from '@/src/error/err.response';

// In handler
if (error) {
  set.status = error.statusCode;
  return toErrorResponse({ error });
}
```

## Status Codes

- **200** - Success (GET, PUT, PATCH, DELETE)
- **201** - Created (POST)
- **400** - Bad Request (validation errors - handled by Elysia)
- **401** - Unauthorized (no session)
- **404** - Not Found
- **500** - Internal Server Error

## OpenAPI Documentation

Elysia auto-generates OpenAPI docs. Add metadata with `detail`:

```ts
.get('/users', handler, {
  detail: {
    tags: ['Users'],
    summary: 'List all users',
    description: 'Returns paginated list of users',
  },
})
```

## Testing

Write `*.test.ts` files with same path. Use Elysia's `.handle()` for unit testing:

```ts
import { describe, test, expect } from 'bun:test';
import apiUsers from './api.users';

describe('GET /api/users', () => {
  test('returns user list', async () => {
    const response = await apiUsers.handle(
      new Request('http://localhost/api/users')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

Run tests: `bun test <pattern>`

## More Documentation

- https://elysiajs.com/essential/route.html
- https://elysiajs.com/essential/validation.html
- https://elysiajs.com/essential/plugin.html

## Error Handling

@.opencode/prompt/error-handling.md
