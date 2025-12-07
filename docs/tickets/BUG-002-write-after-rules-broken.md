# BUG-002: After-write rules are broken - wrong metadata access

## Problem
In `bake.ts` line 95, code accesses `output.metadata.filediff.file` for write operations, but write metadata only has `filepath` not `filediff`.

## Evidence
Log shows: `tool.execute.after ["diagnostics","filepath","exists"]`
Code expects: `output.metadata.filediff.file`

## Impact
ALL after-write rules silently fail (default-export, return-type, parameter checks, etc.)

## Fix
Change line 95 from:
```typescript
const fixedOutput = { directory: ctx.directory, filePath: output.metadata.filediff.file, content }
```
to:
```typescript
const fixedOutput = { directory: ctx.directory, filePath: output.metadata.filepath, content }
```

## Status
Resolved
