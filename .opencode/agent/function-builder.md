---
description: You build low level function primitives in src/function
mode: subagent
---

Functions are located in `src/function/<MODULE>`.

- **Always export default function**
- Have prefix `fn.`, `fx.`, or `tx.`
- e.g. `src/function/payment/tx.send-money.ts`

## Quick Start

Use the template scripts to create functions:
```bash
# Pure function (no side effects)
bun run .opencode/scripts/add-fn.ts <module> <name>

# Effectful function (side effects, no rollback)
bun run .opencode/scripts/add-fx.ts <module> <name>

# Transactional function (side effects with rollback)
bun run .opencode/scripts/add-tx.ts <module> <name>
```

Examples:
```bash
bun run .opencode/scripts/add-fn.ts user validate-email
bun run .opencode/scripts/add-fx.ts user get-by-id
bun run .opencode/scripts/add-tx.ts user create
```

## Function Types

### Pure Functions `fn.*`

No side effects. Synchronous. Same input always produces same output.

```ts
// src/function/user/fn.validate-email.ts
type TArgs = { email: string };
type TData = { isValid: boolean; normalized: string };

function fnUserValidateEmail(args: TArgs): TErrTuple<TData> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(args.email)) {
    return [null, {
      code: ErrCode.FN_USER_INVALID_EMAIL,
      statusCode: 400,
      externalMessage: { en: 'Invalid email format' },
    }];
  }

  return [{
    isValid: true,
    normalized: args.email.toLowerCase().trim(),
  }, null];
}

export default fnUserValidateEmail;
```

**Use fn.* when:**
- Validating data
- Transforming data
- Calculating values
- Parsing input

### Effectful Functions `fx.*`

Side effects (reads from db, external APIs). Returns `TErrTuple<T>`.

```ts
// src/function/user/fx.get-by-id.ts
type TPortal = {
  db: typeof mainDb;
};

type TArgs = { id: string };
type TData = { id: string; name: string; email: string };

async function fxUserGetById(
  portal: TPortal,
  args: TArgs
): Promise<TErrTuple<TData>> {
  const user = await portal.db.query.users.findFirst({
    where: eq(schema.users.id, args.id),
  });

  if (!user) {
    return [null, {
      code: ErrCode.FX_USER_NOT_FOUND,
      statusCode: 404,
      externalMessage: { en: 'User not found' },
    }];
  }

  return [user, null];
}

export default fxUserGetById;
```

**Use fx.* when:**
- Reading from database
- Calling external APIs (read-only)
- Operations that don't need rollback

### Transactional Functions `tx.*`

Side effects with rollback support. Returns `TErrTriple<T>`.

```ts
// src/function/user/tx.create.ts
type TPortal = {
  db: typeof mainDb;
};

type TArgs = { name: string; email: string };
type TData = { id: string; name: string; email: string };

async function txUserCreate(
  portal: TPortal,
  args: TArgs
): Promise<TErrTriple<TData>> {
  const rollbacks: TExternalRollback[] = [];

  try {
    const [user] = await portal.db.insert(schema.users)
      .values({ name: args.name, email: args.email })
      .returning();

    // Add rollback for this operation
    rollbacks.push(async () => {
      try {
        await portal.db.delete(schema.users).where(eq(schema.users.id, user.id));
        return [`Deleted user ${user.id}`, null, []];
      } catch (e) {
        return [null, {
          code: ErrCode.TX_USER_ROLLBACK_FAILED,
          statusCode: 500,
          externalMessage: { en: 'Rollback failed' },
        }, []];
      }
    });

    return [user, null, rollbacks];
  } catch (error) {
    return [null, {
      code: ErrCode.TX_USER_CREATE_FAILED,
      statusCode: 500,
      externalMessage: { en: 'Failed to create user' },
    }, rollbacks];
  }
}

export default txUserCreate;
```

**Use tx.* when:**
- Creating/updating/deleting database records
- Calling external APIs that modify state
- Operations that need rollback on failure

## Rollback Functions

**Signature**: `() => Promise<TErrTriple<string>>`

**Rules:**
1. Always create rollback functions when the action can be reversed
2. Add rollback to array BEFORE returning success
3. For DB: Use transactions when possible, rollback functions for external resources
4. Rollbacks are executed by the CALLER in reverse order

```ts
const rollback: TExternalRollback = async () => {
  try {
    await deleteExternalResource(resourceId);
    return [`Deleted resource ${resourceId}`, null, []];
  } catch (error) {
    return [null, {
      code: ErrCode.ROLLBACK_FAILED,
      statusCode: 500,
      internalMessage: error instanceof Error ? error.message : 'Unknown',
    }, []];
  }
};
rollbacks.push(rollback);
```

## Types

Global types in `src/global.d.ts` are auto-imported:
- `TErrTuple<T>` - `[T, null] | [null, TErrorEntry]`
- `TErrTriple<T>` - `[T, null, TExternalRollback[]] | [null, TErrorEntry, TExternalRollback[]]`
- `TExternalRollback` - `() => Promise<TErrTriple<string>>`
- `TErrorEntry` - Error object with code, statusCode, messages

TPortal and TArgs must be defined in the same file:
```ts
type TPortal = { db: typeof mainDb };
type TArgs = { userId: string };
```

## Testing

Write test files with `.test.ts` suffix in the same directory.

### Database Testing

When your function uses a database, use the testing database factory:

```ts
import { describe, test, expect } from 'bun:test';
import { createTestingMainDb } from '@/src/database/main/conn.main';
import fxUserGetById from './fx.get-by-id';

describe('fxUserGetById', () => {
  test('returns user when found', async () => {
    const testDb = createTestingMainDb(); // In-memory, auto-migrated

    // Seed test data
    await testDb.insert(schema.users).values({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    });

    const portal = { db: testDb };
    const [result, error] = await fxUserGetById(portal, { id: 'user-1' });

    expect(error).toBeNull();
    expect(result?.name).toBe('Test User');
  });

  test('returns error when not found', async () => {
    const testDb = createTestingMainDb();
    const portal = { db: testDb };

    const [result, error] = await fxUserGetById(portal, { id: 'non-existent' });

    expect(result).toBeNull();
    expect(error?.statusCode).toBe(404);
  });
});
```

### Testing Transactional Functions

Test both success and rollback scenarios:

```ts
describe('txUserCreate', () => {
  test('returns user and rollback on success', async () => {
    const testDb = createTestingMainDb();
    const portal = { db: testDb };

    const [result, error, rollbacks] = await txUserCreate(portal, {
      name: 'New User',
      email: 'new@example.com',
    });

    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(rollbacks).toHaveLength(1);
  });

  test('rollback deletes created user', async () => {
    const testDb = createTestingMainDb();
    const portal = { db: testDb };

    const [result, _, rollbacks] = await txUserCreate(portal, {
      name: 'New User',
      email: 'new@example.com',
    });

    // Execute rollback
    const [rollbackMsg, rollbackErr] = await rollbacks[0]();
    expect(rollbackErr).toBeNull();

    // Verify user deleted
    const user = await testDb.query.users.findFirst({
      where: eq(schema.users.id, result!.id),
    });
    expect(user).toBeUndefined();
  });
});
```

Run tests: `bun test <pattern>`

See @.opencode/prompt/how-to-write-tests.md for more testing patterns.

## Function Responsibilities

**DO:**
- Single responsibility per function
- Return proper error tuples
- Provide rollbacks for tx.* functions
- Use typed portals and args
- Handle errors gracefully

**DON'T:**
- Mix pure and effectful logic
- Execute rollbacks internally (caller does this)
- Write documentation files
- Import HTTP/framework-specific code

## Error Handling

@.opencode/prompt/error-handling.md

## Avoid

- Do not write extra documentation files (.md or example.ts)
- Use JSDoc strings sparingly, keep comments short
- Do not compile code
