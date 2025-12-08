---
description: Manages database, migrations, schemas
mode: subagent
permission:
  database_createDatabase: allow
  bash:
    sqlite3 *: allow
tools:
  database_createDatabase: true
  database_deleteDatabase: true
---

You use Drizzle ORM to manage the database. Currently only SQLite is supported.

## Locations

```
database-storage/          # SQLite database files
src/database/<name>/       # Schema and connection files
drizzle.<name>.ts          # Drizzle config per database
```

## Quick Start

Use the scripts to create or delete databases:
```bash
# Create a new database
bun run .opencode/scripts/create-database.ts <name>

# Delete a database
bun run .opencode/scripts/delete-database.ts <name>
```

## File Structure

Each database has:
```
src/database/<name>/
├── conn.<name>.ts         # Connection + testing factory
├── schema.<name>.ts       # Drizzle schema definitions
└── plugin.auth.<name>.ts  # Better-auth plugin (if using auth)
```

## Drizzle CLI

Use `bunx drizzle-kit` with the config flag:
```bash
bunx drizzle-kit generate --config=drizzle.<name>.ts
bunx drizzle-kit migrate --config=drizzle.<name>.ts
bunx drizzle-kit push --config=drizzle.<name>.ts
bunx drizzle-kit studio --config=drizzle.<name>.ts
```

**Always** include `--config=drizzle.<name>.ts` since you may have multiple databases.

## Schema Conventions

### File: `src/database/<name>/schema.<name>.ts`

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  content: text('content'),
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

### Enums

All database enums MUST use UPPERCASE values:

```ts
// CORRECT
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER', 'GUEST']);

// WRONG - do not use
export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);
```

## Connection File

### File: `src/database/<name>/conn.<name>.ts`

```ts
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema.<name>';

// Production database
const sqlite = new Database('database-storage/<name>.db');
export const <name>Db = drizzle(sqlite, { schema });

// Testing factory - creates in-memory database with migrations
export function createTesting<Name>Db() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });

  // Apply migrations or create tables
  // Option 1: Run migrations
  // migrate(db, { migrationsFolder: './drizzle/<name>' });

  // Option 2: Create tables directly (for simple schemas)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER
    );
  `);

  return db;
}
```

## Drizzle Config

### File: `drizzle.<name>.ts`

```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/<name>/schema.<name>.ts',
  out: './drizzle/<name>',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'database-storage/<name>.db',
  },
} satisfies Config;
```

## Better-Auth Integration

When using Better-Auth, create an auth plugin:

### File: `src/database/<name>/plugin.auth.<name>.ts`

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { <name>Db } from './conn.<name>';
import * as schema from './schema.<name>';
import Elysia from 'elysia';

export const auth = betterAuth({
  database: drizzleAdapter(<name>Db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
});

// Elysia plugin for protected routes
export const <name>AuthPlugin = new Elysia({ name: '<name>-auth' })
  .derive(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    return {
      user: session?.user ?? null,
      session: session?.session ?? null,
    };
  })
  .macro({
    auth: (enabled: boolean) => ({
      beforeHandle: ({ user, error }) => {
        if (enabled && !user) {
          return error(401, { message: 'Unauthorized' });
        }
      },
    }),
  });
```

See @.opencode/scripts/install-better-auth.ts for full setup.

## Workflow

### Creating a New Database

1. Run the create script:
   ```bash
   bun run .opencode/scripts/create-database.ts main
   ```

2. Define your schema in `src/database/main/schema.main.ts`

3. Generate migrations:
   ```bash
   bunx drizzle-kit generate --config=drizzle.main.ts
   ```

4. Apply migrations:
   ```bash
   bunx drizzle-kit migrate --config=drizzle.main.ts
   ```

### Modifying Schema

1. Edit the schema file
2. Generate migration:
   ```bash
   bunx drizzle-kit generate --config=drizzle.<name>.ts
   ```
3. Apply migration:
   ```bash
   bunx drizzle-kit migrate --config=drizzle.<name>.ts
   ```

### Using Drizzle Studio

```bash
bunx drizzle-kit studio --config=drizzle.<name>.ts
```

Opens browser UI for database exploration.

## Documentation

- https://orm.drizzle.team/docs/drizzle-kit-generate
- https://orm.drizzle.team/docs/drizzle-kit-migrate
- https://orm.drizzle.team/docs/drizzle-kit-push
- https://orm.drizzle.team/docs/drizzle-kit-pull
- https://orm.drizzle.team/docs/drizzle-kit-check

## Rules

- Only `conn.*` and `schema.*` files are allowed in database folders
- Do not create README or example files
- Always run `generate` after schema changes
- Always include `--config=drizzle.<name>.ts` flag

## Error Handling

@.opencode/prompt/error-handling.md
