---
description: You build controller primitives in src/controller
mode: subagent
---

Controllers are located in `src/controller/<MODULE>`.

- **Always export the controller function**
- Have prefix `ctrl`
- e.g. `src/controller/data/ctrl.get-data.ts`

## Controller Structure

Controllers handle business logic and coordinate between different layers. They:
- Accept a portal object containing non-serializable dependencies
- Accept args object containing serializable parameters
- Use DTOs for all input and output data
- Return tuples in the format `[data, error]`
- Handle error transformation and logging

## Function Signature

```ts
export async function ctrlName(
  portal: TPortal, 
  args: TArgs
): Promise<TTuple<TResponse>>
```

## Types

TPortal and TArgs must be created in the same file.

**IMPORTANT**: TPortal should **only contain variables** (like db connections, session data), **NOT functions**. 
Controllers should import and call functions directly. This keeps the architecture clean:
- Functions that need dependencies (like db) should accept them as parameters
- The controller imports the function and calls it with the needed variables from TPortal
- TPortal is for mocking non-serializable dependencies in tests, not for dependency injection of functions

```ts
// other imports
import { Database } from 'bun:sqlite';
import * as users from './schema.user'; // user database schema

// ✅ CORRECT: Import functions to use them directly
import fxGetUserData from '@/src/function/user/fx.get-user-data';

/**
 * Used to stub the controller for testing
 */
export type TPortal = {
  session: TSession; // e.g. api layer resolves this
  db: BunSQLiteDatabase<typeof users> & { $client: Database; }; // always pass db object in portal to be able to mock the ctrl
  // other non-serializable dependencies or mockable data (NO FUNCTIONS!)
}; 

export type TArgs = {
  // serializable parameters, usually payload for the controller
};

// ✅ CORRECT: Call function directly in controller
export async function ctrlExample(portal: TPortal, args: TArgs): Promise<TErrTuple<TResponse>> {
  // Call the function with db from portal
  const [data, err] = await fxGetUserData({ db: portal.db }, { userId: args.userId });
  // ...
}
```

**Anti-pattern (DO NOT DO THIS)**:
```ts
// ❌ WRONG: Do not pass functions through TPortal
export type TPortal = {
  session: TSession;
  db: BunSQLiteDatabase<typeof users> & { $client: Database; };
  fxGetUserData: typeof fxGetUserData; // ❌ NO! Functions should not be in TPortal
};
```

## Database Usage

Use the drizzle instance from `@src/database/user/conn.user.ts`:
```ts
import { drizzleDb } from "@src/database/user/conn.user.ts";
```

## Error Handling

Always wrap controller logic in try-catch and return proper error tuples:
```ts
try {
  // controller logic
  return [response, null];
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  const err: TErrorEntry = {
    code: ErrorCode.CONTROLLER_<MODULE>_<ACTION>_FAILED,
    statusCode: 500,
    externalMessage: {
      en: 'Failed to process request',
      de: 'Anforderung konnte nicht verarbeitet werden',
      fr: 'Échec du traitement de la demande'
    },
    internalMessage: msg,
    shouldLogInternally: true,
    internalLogLevel: "error",
    handlebarsParams: {},
    internalMetadata: {},
    needsInspection: false
  };
  return [null, err];
}
```

## DTOs

All data in and out must be DTOs. Import DTOs from `@dto/` namespace and use transformation functions.

## Testing

You will always write a test file with the same path but suffix `*.test.ts`.
Make sure to stub out every TPortal var with test object replacement.
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

Run the tests with `bun test <pattern>`

You can read more in @.opencode/prompt/how-to-write-tests.md

## Error handling
@.opencode/prompt/error-handling.md