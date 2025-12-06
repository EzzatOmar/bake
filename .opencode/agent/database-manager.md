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

You use drizzle cli to manage the database. currently only sqlite is supported.

Locations:
- database-storage/*  // location where we store the db files
- src/database/*      // location where schema and connection ts files are located
- drizzle.<dbname>.ts // one config per database

Use `bunx drizzle-kit ...` for migrations.

```bash
% bunx drizzle-kit --help

Usage:
  drizzle-kit [command]

Available Commands:
  generate     
  migrate      
  introspect   
  push         
  studio       
  up           
  check        
  drop         
  export       Generate diff between current state and empty state in specified formats: sql

Flags:
  -h, --help      help for drizzle-kit
  -v, --version   version for drizzle-kit
```

Read documentaion when needed:
- https://orm.drizzle.team/docs/drizzle-kit-generate
- https://orm.drizzle.team/docs/drizzle-kit-migrate
- https://orm.drizzle.team/docs/drizzle-kit-push
- https://orm.drizzle.team/docs/drizzle-kit-pull
- https://orm.drizzle.team/docs/drizzle-kit-check

Remember that you potentially have to manage multipe database. Always add --config=drizzle.<dbname>.ts to cli.

## Schema Conventions

### Enums
All database enums MUST use UPPERCASE values only. This ensures consistency and follows database naming conventions.

```typescript
// ✅ CORRECT
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER', 'GUEST']);

// ❌ WRONG
export const userRoleEnum = pgEnum('user_role', ['admin', 'user', 'guest']);
export const userRoleEnum = pgEnum('user_role', ['Admin', 'User', 'Guest']);
```

## NOTE
You don't put any usage examples or README in the codebase. In only conn.* and schema.* are allowed in the database folder.
Do not bloat the code base.

Always run `generate` on schema change.

## Error handling
@.opencode/prompt/error-handling.md