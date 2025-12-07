# Plugin Testing Todo List

This document contains test cases to verify that each rule in the plugin is working correctly.

Run opencode with `opencode --model zai-coding-plan/glm-4.6 run --model [message]`
e.g. `opencode run --model zai-coding-plan/glm-4.6 'write hello to ./hello.txt'`

## How to use this list:

1. For each item below, create a file that violates the rule
2. Try to create/edit the file using the Write or Edit tool
3. Verify that the plugin catches the violation with a clear error message
4. Mark as completed when verified

---

### API: api.default-export-is-elysia

**Test:** Create a file that violates `api.default-export-is-elysia`

**Action:** `write src/api/test/api.test.ts - content 'export default {}'`
**Description:** Create API file with non-elysia default export

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/api/rule.api.default-export-is-elysia.ts`

---

### API: api.elysia-has-prefix

**Test:** Create a file that violates `api.elysia-has-prefix`

**Action:** `write src/api/test/api.test.ts - content 'export default new Elixir()'`
**Description:** Create API file with elyisa instance not starting with 'api'

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/api/rule.api.elysia-has-prefix.ts`

---

### API: api.file-name

**Test:** Create a file that violates `api.file-name`

**Action:** `write src/api/test/invalid.ts - content 'export default api'`
**Description:** Create API file without 'api.' prefix

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/api/rule.api.file-name.ts`

---

### API: api.imports-controller

**Test:** Create a file that violates `api.imports-controller`

**Action:** `write src/api/test/api.test.ts - content 'import { something } from "../controller"; export default api'`
**Description:** Create API file that imports from controller

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/api/rule.api.imports-controller.ts`

---

### API: api.imports-elysia

**Test:** Create a file that violates `api.imports-elysia`

**Action:** `write src/api/test/api.test.ts - content 'import { Something } from "elysia"; export default api'`
**Description:** Create API file that imports from elysia

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/api/rule.api.imports-elysia.ts`

---

### CONTROLLER: ctrl.default-export-is-function

**Test:** Create a file that violates `ctrl.default-export-is-function`

**Action:** `write src/controller/test/ctrl.test.ts - content 'export default {}'`
**Description:** Create controller file with non-function default export

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/controller/rule.ctrl.default-export-is-function.ts`

---

### CONTROLLER: ctrl.default-export

**Test:** Create a file that violates `ctrl.default-export`

**Action:** `write src/controller/test/ctrl.test.ts - content 'export const something = () => {}'`
**Description:** Create controller file without default export

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/controller/rule.ctrl.default-export.ts`

---

### CONTROLLER: ctrl.file-name

**Test:** Create a file that violates `ctrl.file-name`

**Action:** `write src/controller/test/invalid.ts - content 'export default function ctrlTest() {}'`
**Description:** Create controller file without 'ctrl.' prefix

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/controller/rule.ctrl.file-name.ts`

---

### CONTROLLER: ctrl.first-parameter-is-portal

**Test:** Create a file that violates `ctrl.first-parameter-is-portal`

**Action:** `write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(req: Request, args: any) {}'`
**Description:** Create controller function with non-Portal first parameter

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/controller/rule.ctrl.first-parameter-is-portal.ts`

---

### CONTROLLER: ctrl.parameter-count

**Test:** Create a file that violates `ctrl.parameter-count`

**Action:** `write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(portal: any) {}'`
**Description:** Create controller function with wrong number of parameters

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/controller/rule.ctrl.parameter-count.ts`

---

### CONTROLLER: ctrl.portal-does-not-contain-functions

**Test:** Create a file that violates `ctrl.portal-does-not-contain-functions`

**Action:** `write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(portal: { fn: () => {} }, args: any) {}'`
**Description:** Create controller function with Portal containing functions

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/controller/rule.ctrl.portal-does-not-contain-functions.ts`

---

### CONTROLLER: ctrl.return-type

**Test:** Create a file that violates `ctrl.return-type`

**Action:** `write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(portal: any, args: any): string { return "hello" }'`
**Description:** Create controller function with wrong return type

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/controller/rule.ctrl.return-type.ts`

---

### CONTROLLER: ctrl.second-parameter-is-args

**Test:** Create a file that violates `ctrl.second-parameter-is-args`

**Action:** `write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(portal: any, req: Request) {}'`
**Description:** Create controller function with non-Args second parameter

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/controller/rule.ctrl.second-parameter-is-args.ts`

---

### DATABASE: database.file-name-matches-directory

**Test:** Create a file that violates `database.file-name-matches-directory`

**Action:** `write src/database/testdb/wrong-name.ts - content 'export default {}'`
**Description:** Create database file with name not matching directory

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/database/rule.database.file-name-matches-directory.ts`

---

### DATABASE: database.file-name

**Test:** Create a file that violates `database.file-name`

**Action:** `write src/database/testdb/invalid.ts - content 'export default {}'`
**Description:** Create database file with invalid name pattern

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/database/rule.database.file-name.ts`

---

### DATABASE: database.not-better-auth-schema

**Test:** Create a file that violates `database.not-better-auth-schema`

**Action:** `write src/database/testdb/schema.custom.testdb.ts - content 'export const auth = {}'`
**Description:** Create database file with better auth schema

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/database/rule.database.not-better-auth-schema.ts`

---

### DATABASE: database.path-depth

**Test:** Create a file that violates `database.path-depth`

**Action:** `write src/database/testdb/subdir/file.ts - content 'export default {}'`
**Description:** Create database file with too much path depth

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/database/rule.database.path-depth.ts`

---

### FUNCTION: fn.db-imports-type-only

**Test:** Create a file that violates `fn.db-imports-type-only`

**Action:** `write src/function/test/fn.test.ts - content 'import db from "../../database/testdb"; export default function fnTest() {}'`
**Description:** Create function file with non-type-only db import

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.db-imports-type-only.ts`

---

### FUNCTION: fn.db-portal-type

**Test:** Create a file that violates `fn.db-portal-type`

**Action:** `write src/function/test/fn.test.ts - content 'export default function fnTest(db: any) {}'`
**Description:** Create function file with wrong db portal type

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.db-portal-type.ts`

---

### FUNCTION: fn.default-export-is-function

**Test:** Create a file that violates `fn.default-export-is-function`

**Action:** `write src/function/test/fn.test.ts - content 'export default {}'`
**Description:** Create function file with non-function default export

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.default-export-is-function.ts`

---

### FUNCTION: fn.default-export

**Test:** Create a file that violates `fn.default-export`

**Action:** `write src/function/test/fn.test.ts - content 'export const something = () => {}'`
**Description:** Create function file without default export

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.default-export.ts`

---

### FUNCTION: fn.file-name

**Test:** Create a file that violates `fn.file-name`

**Action:** `write src/function/test/invalid.ts - content 'export default function fnTest() {}'`
**Description:** Create function file without fn/fx/tx prefix

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.file-name.ts`

---

### FUNCTION: fn.parameter-count

**Test:** Create a file that violates `fn.parameter-count`

**Action:** `write src/function/test/fn.test.ts - content 'export default function fnTest(db: any, extra: any) {}'`
**Description:** Create function file with wrong number of parameters

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.parameter-count.ts`

---

### FUNCTION: fn.path-depth

**Test:** Create a file that violates `fn.path-depth`

**Action:** `write src/function/test/subdir/fn.test.ts - content 'export default function fnTest() {}'`
**Description:** Create function file with too much path depth

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.path-depth.ts`

---

### FUNCTION: fn.return-type

**Test:** Create a file that violates `fn.return-type`

**Action:** `write src/function/test/fn.test.ts - content 'export default function fnTest(): string { return "hello" }'`
**Description:** Create function file with wrong return type

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.return-type.ts`

---

### FUNCTION: fn.test-imports-testing-db

**Test:** Create a file that violates `fn.test-imports-testing-db`

**Action:** `write src/function/test/fn.test.ts - content 'import testDb from "../../database/testdb"; export default function fnTest() {}'`
**Description:** Create function file that imports testing db

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fn.test-imports-testing-db.ts`

---

### FUNCTION: fx.first-parameter-type

**Test:** Create a file that violates `fx.first-parameter-type`

**Action:** `write src/function/test/fx.test.ts - content 'export default function fxTest(req: Request) {}'`
**Description:** Create fx function with wrong first parameter type

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fx.first-parameter-type.ts`

---

### FUNCTION: fx.parameter-count

**Test:** Create a file that violates `fx.parameter-count`

**Action:** `write src/function/test/fx.test.ts - content 'export default function fxTest() {}'`
**Description:** Create fx function with wrong number of parameters

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fx.parameter-count.ts`

---

### FUNCTION: fx.return-type

**Test:** Create a file that violates `fx.return-type`

**Action:** `write src/function/test/fx.test.ts - content 'export default function fxTest(): string { return "hello" }'`
**Description:** Create fx function with wrong return type

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.fx.return-type.ts`

---

### FUNCTION: tx.first-parameter-type

**Test:** Create a file that violates `tx.first-parameter-type`

**Action:** `write src/function/test/tx.test.ts - content 'export default function txTest(req: Request) {}'`
**Description:** Create tx function with wrong first parameter type

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.tx.first-parameter-type.ts`

---

### FUNCTION: tx.parameter-count

**Test:** Create a file that violates `tx.parameter-count`

**Action:** `write src/function/test/tx.test.ts - content 'export default function txTest() {}'`
**Description:** Create tx function with wrong number of parameters

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.tx.parameter-count.ts`

---

### FUNCTION: tx.return-type

**Test:** Create a file that violates `tx.return-type`

**Action:** `write src/function/test/tx.test.ts - content 'export default function txTest(): string { return "hello" }'`
**Description:** Create tx function with wrong return type

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/function/rule.tx.return-type.ts`

---

### GENERAL: gen.documentation

**Test:** Create a file that violates `gen.documentation`

**Action:** `write src/component/comp.test.tsx - content 'export default function Comp() { return <div>Test</div> }'`
**Description:** Create component without documentation

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/general/rule.gen.documentation.ts`

---

### GENERAL: gen.no-js-files

**Test:** Create a file that violates `gen.no-js-files`

**Action:** `write src/test.js - content 'console.log("hello")'`
**Description:** Create .js file anywhere in project

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/general/rule.gen.no-js-files.ts`

---

### GENERAL: gen.no-ts-file-in-root

**Test:** Create a file that violates `gen.no-ts-file-in-root`

**Action:** `write test.ts - content 'export const test = 1'`
**Description:** Create .ts file in project root

**Expected:** Plugin should prevent the operation with a clear error message

**Status:** [ ] Not tested

**File to check:** `.opencode/rule-fns/general/rule.gen.no-ts-file-in-root.ts`

---

