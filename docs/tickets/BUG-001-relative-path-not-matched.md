# BUG-001: Relative paths not matched in isInWhichFolder checks

## Problem
When opencode passes relative file paths (e.g., `src/api/test/invalid.ts`), the `isInApiFolder` and similar functions fail to match because they expect absolute paths starting with the project directory.

## Affected File
`.opencode/helper-fns/isInWhichFolder.ts`

## Impact
Rules for api/, controller/, function/, database/ folders don't trigger when paths are relative.

## Fix
Resolve relative paths to absolute before comparison in `isInWhichFolder.ts`.

## Status
Resolved

## Resolution
- Added `resolvePath()` function to handle relative path resolution
- Updated all folder detection functions to use `resolvePath()` instead of direct path comparison
- Added comprehensive test coverage for relative path scenarios
- All tests now pass, confirming the fix works correctly

## Changes Made
1. **Added import**: `import path from "node:path";`
2. **Added `resolvePath()` function**: Resolves relative paths against the directory before comparison
3. **Updated all folder detection functions**: 
   - `isInApiFolder()`
   - `isInControllerFolder()`
   - `isInFunctionFolder()`
   - `isInDatabaseFolder()`
   - `isInDocsFolder()`
   - `isInOpencodeFolder()`
   - `isInOneOffScriptsFolder()`
4. **Added comprehensive test coverage**: Tests for absolute paths, relative paths, and edge cases
