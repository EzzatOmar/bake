---
description: You build controller primitives in src/controller
mode: subagent
---

Controllers are located in `src/controller/<MODULE>`.

- **Always export default the controller function**
- Have prefix `ctrl.`
- e.g. `src/controller/user/ctrl.get-profile.ts`

## Quick Start

Use the template script to create a new controller:
```bash
bun run .opencode/scripts/add-ctrl.ts <module> <name>
# Example: bun run .opencode/scripts/add-ctrl.ts user get-profile
```

## Controller Structure

Controllers handle business logic orchestration. They:
- Accept a portal object containing non-serializable dependencies (db, session)
- Accept args object containing serializable parameters
- Return tuples in the format `[data, error]` using `TErrTuple<T>`
- Coordinate calls to functions (fn.*, fx.*, tx.*)

## Function Signature

```ts
async function ctrlModuleName(
  portal: TPortal,
  args: TArgs
): Promise<TErrTuple<TData>>

export default ctrlModuleName;
```

## Types

TPortal and TArgs must be created in the same file.

**IMPORTANT**: TPortal should **only contain variables** (like db connections, session data), **NOT functions**.
Controllers should import and call functions directly.

```ts
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import type { Database } from 'bun:sqlite';
import * as schema from '@/src/database/main/schema.main';

// Import functions to use them directly
import fxGetUserData from '@/src/function/user/fx.get-user-data';

/** Portal: non-serializable dependencies */
type TPortal = {
  db: BunSQLiteDatabase<typeof schema> & { $client: Database };
  session: TSession | null;
  // NO FUNCTIONS in portal!
};

/** Args: serializable parameters */
type TArgs = {
  userId: string;
};

/** Data: return type on success */
type TData = {
  id: string;
  name: string;
  email: string;
};

async function ctrlUserGetProfile(
  portal: TPortal,
  args: TArgs
): Promise<TErrTuple<TData>> {
  // Call imported function with db from portal
  const [data, err] = await fxGetUserData({ db: portal.db }, { userId: args.userId });
  if (err) return [null, err];

  return [data, null];
}

export default ctrlUserGetProfile;
```

**Anti-pattern (DO NOT DO THIS)**:
```ts
// WRONG: Do not pass functions through TPortal
type TPortal = {
  db: ...;
  fxGetUserData: typeof fxGetUserData; // NO!
};
```

## Complete Example

```ts
/**
 * Controller: ctrl.get-profile
 * Module: user
 */

import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import type { Database } from 'bun:sqlite';
import * as schema from '@/src/database/main/schema.main';
import fxUserGetById from '@/src/function/user/fx.get-by-id';
import { ErrCode } from '@/src/error/err.enum';

type TPortal = {
  db: BunSQLiteDatabase<typeof schema> & { $client: Database };
  session: { userId: string } | null;
};

type TArgs = {
  userId: string;
};

type TData = {
  id: string;
  name: string;
  email: string;
};

async function ctrlUserGetProfile(
  portal: TPortal,
  args: TArgs
): Promise<TErrTuple<TData>> {
  // Authorization check
  if (!portal.session) {
    return [null, {
      code: ErrCode.CTRL_USER_UNAUTHORIZED,
      statusCode: 401,
      externalMessage: { en: 'Authentication required' },
    }];
  }

  // Call effectful function
  const [user, err] = await fxUserGetById(
    { db: portal.db },
    { id: args.userId }
  );

  if (err) return [null, err];

  return [{
    id: user.id,
    name: user.name,
    email: user.email,
  }, null];
}

export default ctrlUserGetProfile;
```

## Handling Transactional Functions

When calling `tx.*` functions, handle rollbacks on error:

```ts
async function ctrlUserCreate(
  portal: TPortal,
  args: TArgs
): Promise<TErrTuple<TData>> {
  // Call transactional function
  const [result, err, rollbacks] = await txUserCreate(
    { db: portal.db },
    args
  );

  if (err) {
    // Execute rollbacks in reverse order
    for (let i = rollbacks.length - 1; i >= 0; i--) {
      await rollbacks[i]();
    }
    return [null, err];
  }

  return [result, null];
}
```

## Error Handling

Always wrap controller logic in try-catch for unexpected errors:

```ts
async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<TData>> {
  try {
    // controller logic...
    return [response, null];
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return [null, {
      code: ErrCode.CTRL_EXAMPLE_UNEXPECTED,
      statusCode: 500,
      externalMessage: { en: 'An unexpected error occurred' },
      internalMessage: msg,
      shouldLogInternally: true,
      internalLogLevel: 'error',
    }];
  }
}
```

## Testing

Write test files with the same path but `.test.ts` suffix:

```ts
import { describe, test, expect, mock } from 'bun:test';
import ctrlUserGetProfile from './ctrl.get-profile';
import type { TPortal } from './ctrl.get-profile';

describe('ctrlUserGetProfile', () => {
  test('returns user profile when authenticated', async () => {
    const mockDb = {
      // mock drizzle methods
    };

    const portal: TPortal = {
      db: mockDb as any,
      session: { userId: 'user-123' },
    };

    const [result, error] = await ctrlUserGetProfile(portal, {
      userId: 'user-123',
    });

    expect(error).toBeNull();
    expect(result).toHaveProperty('id');
  });

  test('returns error when not authenticated', async () => {
    const portal: TPortal = {
      db: {} as any,
      session: null,
    };

    const [result, error] = await ctrlUserGetProfile(portal, {
      userId: 'user-123',
    });

    expect(result).toBeNull();
    expect(error?.statusCode).toBe(401);
  });
});
```

Run tests: `bun test <pattern>`

See @.opencode/prompt/how-to-write-tests.md for more testing patterns.

## Controller Responsibilities

**DO:**
- Orchestrate calls to functions (fn.*, fx.*, tx.*)
- Handle authorization checks
- Transform data between layers
- Handle rollbacks for transactional operations
- Return appropriate error tuples

**DON'T:**
- Contain direct business logic (use functions)
- Access HTTP request/response objects (that's API layer)
- Import Elysia or HTTP-specific code
- Make direct database queries (use fx.* functions)

## Error Handling

@.opencode/prompt/error-handling.md
