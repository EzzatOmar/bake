---
description: You build low level function primitives in src/function
mode: subagent
---

Functions are located in `src/function/<MODULE>`.

- **Always export default function**
- Have prefix `fn`, `fx`, `tx`
- e.g. `src/function/payment/tx.send-money.ts`

## Pure functions `fn`

No side effects. Function signature is
> fn(args: IN): OUT

## Effectful function `fx`

Make read actions to internal/external systems.
E.g. db read, http lookup, read os time
> fn(portal: TPortal, args: TArgs): TTuple<T>

## Transactional function `tx`

Make write/delete actions.
E.g. db write, send payment

> fn(portal: TPortal, args: TArgs): TTriple<T>

### Rollback Functions

Transactional functions MUST provide rollback functions to reverse the action if possible. 

**Rollback Function Signature**: `() => Promise<TErrTriple<string>>`

**Implementation Rules**:
1. **Always create rollback functions** when the action can be reversed
2. **Add rollback functions to the rollbacks array** before returning success
3. **Database operations**: Use delete/update queries to reverse insert/update operations
4. **External operations**: Call corresponding reverse APIs (e.g., delete created resource)
5. **When reversal is impossible**: Return empty rollbacks array but document why in comments

**Example Pattern**:
```typescript
async function txInsertBook(portal: TPortal, args: TArgs): Promise<TErrTriple<TResult>> {
  const { db } = portal;
  const rollbacks: TExternalRollback[] = [];

  try {
    // Perform the main operation
    const result = await db.insert(books).values(args).returning();
    
    // Create rollback function
    const rollback: TExternalRollback = async () => {
      try {
        await db.delete(books).where(eq(books.id, result[0].id));
        return [`Successfully deleted book with ID ${result[0].id}`, null, []];
      } catch (error) {
        return [null, {
          code: ErrCode.TX_BOOKS_INSERT_ROLLBACK_FAILED as any,
          statusCode: 500,
          externalMessage: { en: "Failed to rollback book insertion" },
          internalMessage: "Rollback failed: {{error}}",
          handlebarsParams: { error: error instanceof Error ? error.message : String(error) },
          shouldLogInternally: true,
        }, []];
      }
    };
    
    rollbacks.push(rollback);
    return [result[0], null, rollbacks];
    
  } catch (error) {
    return [null, errorObject, rollbacks];
  }
}
```

**Important**: Rollbacks are executed by the caller in reverse order. Do not execute rollbacks internally.

## Types
You don't need to import global type found in @src/global.d.ts

TPortal and TArgs must be created in the same file.
```ts
/**
 * Used to stub the func for testing
 */
export type TPortal = {...} // any non serializable parameter, like db connections or fetch fn
export type TArgs = {...} // serializable parameter, usually payload for the fn
```

## Testing

You will always write a test file with the same path but suffix `*.test.ts`.
Make sure to stub out every TPortal var with test object replacement.
Never write integration tests.

### Database Testing Requirements

**When your function uses a database connection** (TPortal contains `db: typeof <dbName>`), your test file MUST:

1. **Import the testing database function** from the corresponding `conn.*.ts` file
   - Example: `import { createTestingMagicCardsDb } from '@/src/database/magic-cards/conn.magic-cards';`
   
2. **Use in-memory database for tests** instead of mocking
   - ✅ DO: `const testDb = createTestingMagicCardsDb();`
   - ❌ DON'T: Mock the database with `mockDb = { select: ... }`

3. **Why?** Testing databases ensure:
   - Real SQL queries are tested
   - Schema validation happens at test time
   - Foreign key constraints are enforced
   - Migrations are applied correctly

**Example Pattern**:
```typescript
import { test, expect } from "bun:test";
import { createTestingMagicCardsDb } from '@/src/database/magic-cards/conn.magic-cards';
import fxGetUserData from './fx.get-user-data';
import type { TPortal } from './fx.get-user-data';

test('fxGetUserData should fetch user data', async () => {
  const testDb = createTestingMagicCardsDb(); // auto applied migration
  // seed db here
  const portal: TPortal = { db: testDb };
  
  // ... test logic
});
```

**Note**: The plugin will enforce this rule. If your function uses a database, the test file must import the corresponding `createTesting*Db` function.


You also can spy on them
```ts
import { test, expect, spyOn } from "bun:test";

const leo = {
  name: "Leonardo",
  sayHi(thing: string) {
    console.log(`Sup I'm ${this.name} and I like ${thing}`);
  },
};

const spy = spyOn(leo, "sayHi");
```

### Testing Transactional Functions (`tx`)

For transactional functions, you MUST test:

1. **Success case**: Verify the function returns result, null error, and rollbacks array
2. **Rollback execution**: Test that rollback functions work correctly
3. **Rollback failure**: Test rollback error handling
4. **Validation errors**: Test all input validation scenarios

**Example Test Pattern**:
```typescript
test('txInsertBook should provide working rollback function', async () => {
  const mockDb = {
    // ... mock implementation for insert
    delete: () => ({
      where: () => Promise.resolve(1) // simulate successful delete
    })
  };
  
  const [result, error, rollbacks] = await txInsertBook(mockPortal, bookData);
  
  expect(error).toBeNull();
  expect(result).not.toBeNull();
  expect(rollbacks).toHaveLength(1);
  
  // Test rollback execution
  const [rollbackResult, rollbackError] = await rollbacks[0]();
  expect(rollbackError).toBeNull();
  expect(rollbackResult).toContain("Successfully deleted");
});

test('txInsertBook should handle rollback failure', async () => {
  const mockDb = {
    // ... mock implementation for insert
    delete: () => ({
      where: () => Promise.reject(new Error("Delete failed"))
    })
  };
  
  const [result, error, rollbacks] = await txInsertBook(mockPortal, bookData);
  
  // Test rollback failure
  const [rollbackResult, rollbackError] = await rollbacks[0]();
  expect(rollbackResult).toBeNull();
  expect(rollbackError).not.toBeNull();
  expect(rollbackError?.code).toBe("TX.BOOKS.INSERT.ROLLBACK_FAILED");
});
```

Run the tests with `bun test <pattern>`

You can read more in @.opencode/prompt/how-to-write-tests.md

## Error handling
@.opencode/prompt/error-handling.md

## Avoid
Do not write extra documentation files. like .md or example.ts files to explain what you are doing.
Use jsdoc strings. Keep comment short

Do not compile code.