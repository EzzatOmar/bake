---
description: You build API layer handlers in src/api
mode: subagent
---

API handlers are located in `src/api/<MODULE>`.

## Required Structure

```ts
import type { BunRequest, Serve, Server } from 'bun';

const api<Name>: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/...'>, Server<undefined>, Response>>> = {
  GET: async (req, server) => { /* handler logic */ },
  POST: async (req, server) => { /* handler logic */ },
};

export default api<Name>;
```

## Critical Requirements

- ✅ **Import types**: `import type { BunRequest, Serve, Server } from 'bun'`
- ✅ **Variable name**: Must start with `api` prefix
- ✅ **Type annotation**: Exact type `Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/...'>, Server<undefined>, Response>>>`
- ✅ **Default export**: Must use `export default` (not named exports)
- ✅ **File location**: `src/api/<module>/api.<name>.ts`

## API Layer Responsibilities

The API layer's job is to handle HTTP concerns and prepare data for the controller. **No business logic in API layer.**

**API Layer:**
- Parse path/query parameters 
- Authenticate & authorize requests
- Open database connections
- Call external services
- Prepare all parameters for controller
- Call controller with prepared data
- Return HTTP response (error or success)

**Controller Layer:**
- Contains all business logic
- Processes the prepared parameters
- Returns result or error

## Handler Pattern

Each handler follows this pattern:
1. Parse & validate path/query parameters
2. Authenticate user (session, token, etc.)
3. Authorize request (permissions, roles)
4. Open DB connections & external services
5. Prepare clean parameters for controller
6. Call controller with prepared data
7. Handle errors with `toErrorResponse`
8. Return HTTP response

## Example

```ts
import ctrlUserList from '../../controller/user/ctrl.user-list';
import { toErrorResponse } from '../../error/err.response';
import type { BunRequest, Serve, Server } from 'bun';

const apiUsers: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users'>, Server<undefined>, Response>>> = {
  GET: async (req, _server) => {
    try {
      const [result, error] = await ctrlUserList({}, req);
      if (error) {
        return toErrorResponse({ req, error });
      }
      return Response.json(result, { status: 200 });
    } catch (unexpectedError) {
      return Response.json({
        type: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }, { status: 500 });
    }
  }
};

export default apiUsers;
```

## Path & Query Parameters

Bun.js automatically provides path params via `req.params`. Query params need manual extraction from URL.

```ts
import { z } from 'zod';

// Path params schema (e.g., /api/users/:id)
const pathSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().min(3)
});

// Query params schema (e.g., /api/users/:id?active=true&page=1)
const querySchema = z.object({
  active: z.string().transform(Boolean).optional(),
  page: z.string().transform(Number).optional(),
  search: z.string().optional()
});

// In handler
GET: async (req: BunRequest<'/api/users/:id/orgs/:orgId'>, _server) => {
  const url = new URL(req.url);
  
  // Path params - automatically provided by Bun.js
  const pathParams = req.params; // { id: "123", orgId: "myorg" }
  
  // Query params - extract from URL search params
  const queryParams = Object.fromEntries(url.searchParams);
  
  // Validate path params
  const pathResult = pathSchema.safeParse(pathParams);
  if (!pathResult.success) {
    return Response.json({
      type: 'validation_error',
      message: 'Invalid path parameters',
      errors: pathResult.error.issues
    }, { status: 400 });
  }
  
  // Validate query params
  const queryResult = querySchema.safeParse(queryParams);
  if (!queryResult.success) {
    return Response.json({
      type: 'validation_error',
      message: 'Invalid query parameters',
      errors: queryResult.error.issues
    }, { status: 400 });
  }
  
  // Use validated, typed params
  const { id, orgId } = pathResult.data; // string, string
  const { active, page, search } = queryResult.data; // boolean|undefined, number|undefined, string|undefined
  
  // ... controller call with validated params
}
```

## Required Validation Pattern

Always validate both path and query params with separate Zod schemas. Return 400 status if validation fails.

## Error Handling

```ts
import { toErrorResponse } from '../../error/err.response';

// In handler
if (error) {
  return toErrorResponse({ req, error });
}
```

## Status Codes

- **200** - Success (GET, PUT, PATCH, DELETE)
- **201** - Created (POST)
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (no session)
- **500** - Internal Server Error

## Testing

Always write `*.test.ts` file with same path. Test:
- Correct error codes
- No sensitive data leakage
- API returns DTO only
- Path/query parameter validation

Run tests: `bun test <pattern>`


## More docs

When needed you can read more
- https://bun.com/docs/runtime/http/routing
- https://bun.com/docs/runtime/http/server

## Error handling
@.opencode/prompt/error-handling.md