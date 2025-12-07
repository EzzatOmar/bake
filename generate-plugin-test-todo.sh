#!/bin/bash

echo "# Plugin Testing Todo List"
echo ""
echo "This document contains test cases to verify that each rule in the plugin is working correctly."
echo ""
echo "## How to use this list:"
echo ""
echo "1. For each item below, create a file that violates the rule"
echo "2. Try to create/edit the file using the Write or Edit tool"
echo "3. Verify that the plugin catches the violation with a clear error message"
echo "4. Mark as completed when verified"
echo ""
echo "---"
echo ""

# Find all rule files
for file in $(find .opencode/rule-fns -name "rule.*.ts" | sort); do
    # Extract rule name
    rule_name=$(basename "$file" .ts | sed 's/^rule\.//')
    
    # Extract category
    category=$(echo "$file" | cut -d'/' -f3)
    
    # Convert category to uppercase (compatible way)
    category_upper=$(echo "$category" | tr '[:lower:]' '[:upper:]')
    
    echo "### ${category_upper}: ${rule_name}"
    echo ""
    echo "**Test:** Create a file that violates \`${rule_name}\`"
    echo ""
    
    # Generate specific test case based on rule name
    case "$rule_name" in
        "api.default-export-is-elysia")
            echo "**Action:** \`write src/api/test/api.test.ts - content 'export default {}'\`"
            echo "**Description:** Create API file with non-elysia default export"
            ;;
        "api.elysia-has-prefix")
            echo "**Action:** \`write src/api/test/api.test.ts - content 'export default new Elixir()'\`"
            echo "**Description:** Create API file with elyisa instance not starting with 'api'"
            ;;
        "api.file-name")
            echo "**Action:** \`write src/api/test/invalid.ts - content 'export default api'\`"
            echo "**Description:** Create API file without 'api.' prefix"
            ;;
        "api.imports-controller")
            echo "**Action:** \`write src/api/test/api.test.ts - content 'import { something } from \"../controller\"; export default api'\`"
            echo "**Description:** Create API file that imports from controller"
            ;;
        "api.imports-elysia")
            echo "**Action:** \`write src/api/test/api.test.ts - content 'import { Something } from \"elysia\"; export default api'\`"
            echo "**Description:** Create API file that imports from elysia"
            ;;
        "ctrl.default-export-is-function")
            echo "**Action:** \`write src/controller/test/ctrl.test.ts - content 'export default {}'\`"
            echo "**Description:** Create controller file with non-function default export"
            ;;
        "ctrl.default-export")
            echo "**Action:** \`write src/controller/test/ctrl.test.ts - content 'export const something = () => {}'\`"
            echo "**Description:** Create controller file without default export"
            ;;
        "ctrl.file-name")
            echo "**Action:** \`write src/controller/test/invalid.ts - content 'export default function ctrlTest() {}'\`"
            echo "**Description:** Create controller file without 'ctrl.' prefix"
            ;;
        "ctrl.first-parameter-is-portal")
            echo "**Action:** \`write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(req: Request, args: any) {}'\`"
            echo "**Description:** Create controller function with non-Portal first parameter"
            ;;
        "ctrl.parameter-count")
            echo "**Action:** \`write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(portal: any) {}'\`"
            echo "**Description:** Create controller function with wrong number of parameters"
            ;;
        "ctrl.portal-does-not-contain-functions")
            echo "**Action:** \`write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(portal: { fn: () => {} }, args: any) {}'\`"
            echo "**Description:** Create controller function with Portal containing functions"
            ;;
        "ctrl.return-type")
            echo "**Action:** \`write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(portal: any, args: any): string { return \"hello\" }'\`"
            echo "**Description:** Create controller function with wrong return type"
            ;;
        "ctrl.second-parameter-is-args")
            echo "**Action:** \`write src/controller/test/ctrl.test.ts - content 'export default function ctrlTest(portal: any, req: Request) {}'\`"
            echo "**Description:** Create controller function with non-Args second parameter"
            ;;
        "database.file-name-matches-directory")
            echo "**Action:** \`write src/database/testdb/wrong-name.ts - content 'export default {}'\`"
            echo "**Description:** Create database file with name not matching directory"
            ;;
        "database.file-name")
            echo "**Action:** \`write src/database/testdb/invalid.ts - content 'export default {}'\`"
            echo "**Description:** Create database file with invalid name pattern"
            ;;
        "database.not-better-auth-schema")
            echo "**Action:** \`write src/database/testdb/schema.custom.testdb.ts - content 'export const auth = {}'\`"
            echo "**Description:** Create database file with better auth schema"
            ;;
        "database.path-depth")
            echo "**Action:** \`write src/database/testdb/subdir/file.ts - content 'export default {}'\`"
            echo "**Description:** Create database file with too much path depth"
            ;;
        "fn.db-imports-type-only")
            echo "**Action:** \`write src/function/test/fn.test.ts - content 'import db from \"../../database/testdb\"; export default function fnTest() {}'\`"
            echo "**Description:** Create function file with non-type-only db import"
            ;;
        "fn.db-portal-type")
            echo "**Action:** \`write src/function/test/fn.test.ts - content 'export default function fnTest(db: any) {}'\`"
            echo "**Description:** Create function file with wrong db portal type"
            ;;
        "fn.default-export-is-function")
            echo "**Action:** \`write src/function/test/fn.test.ts - content 'export default {}'\`"
            echo "**Description:** Create function file with non-function default export"
            ;;
        "fn.default-export")
            echo "**Action:** \`write src/function/test/fn.test.ts - content 'export const something = () => {}'\`"
            echo "**Description:** Create function file without default export"
            ;;
        "fn.file-name")
            echo "**Action:** \`write src/function/test/invalid.ts - content 'export default function fnTest() {}'\`"
            echo "**Description:** Create function file without fn/fx/tx prefix"
            ;;
        "fn.parameter-count")
            echo "**Action:** \`write src/function/test/fn.test.ts - content 'export default function fnTest(db: any, extra: any) {}'\`"
            echo "**Description:** Create function file with wrong number of parameters"
            ;;
        "fn.path-depth")
            echo "**Action:** \`write src/function/test/subdir/fn.test.ts - content 'export default function fnTest() {}'\`"
            echo "**Description:** Create function file with too much path depth"
            ;;
        "fn.return-type")
            echo "**Action:** \`write src/function/test/fn.test.ts - content 'export default function fnTest(): string { return \"hello\" }'\`"
            echo "**Description:** Create function file with wrong return type"
            ;;
        "fn.test-imports-testing-db")
            echo "**Action:** \`write src/function/test/fn.test.ts - content 'import testDb from \"../../database/testdb\"; export default function fnTest() {}'\`"
            echo "**Description:** Create function file that imports testing db"
            ;;
        "fx.first-parameter-type")
            echo "**Action:** \`write src/function/test/fx.test.ts - content 'export default function fxTest(req: Request) {}'\`"
            echo "**Description:** Create fx function with wrong first parameter type"
            ;;
        "fx.parameter-count")
            echo "**Action:** \`write src/function/test/fx.test.ts - content 'export default function fxTest() {}'\`"
            echo "**Description:** Create fx function with wrong number of parameters"
            ;;
        "fx.return-type")
            echo "**Action:** \`write src/function/test/fx.test.ts - content 'export default function fxTest(): string { return \"hello\" }'\`"
            echo "**Description:** Create fx function with wrong return type"
            ;;
        "tx.first-parameter-type")
            echo "**Action:** \`write src/function/test/tx.test.ts - content 'export default function txTest(req: Request) {}'\`"
            echo "**Description:** Create tx function with wrong first parameter type"
            ;;
        "tx.parameter-count")
            echo "**Action:** \`write src/function/test/tx.test.ts - content 'export default function txTest() {}'\`"
            echo "**Description:** Create tx function with wrong number of parameters"
            ;;
        "tx.return-type")
            echo "**Action:** \`write src/function/test/tx.test.ts - content 'export default function txTest(): string { return \"hello\" }'\`"
            echo "**Description:** Create tx function with wrong return type"
            ;;
        "gen.documentation")
            echo "**Action:** \`write src/component/comp.test.tsx - content 'export default function Comp() { return <div>Test</div> }'\`"
            echo "**Description:** Create component without documentation"
            ;;
        "gen.no-js-files")
            echo "**Action:** \`write src/test.js - content 'console.log(\"hello\")'\`"
            echo "**Description:** Create .js file anywhere in project"
            ;;
        "gen.no-ts-file-in-root")
            echo "**Action:** \`write test.ts - content 'export const test = 1'\`"
            echo "**Description:** Create .ts file in project root"
            ;;
        *)
            echo "**Action:** \`write src/test/${rule_name}.ts - content '// Violating ${rule_name}'\`"
            echo "**Description:** Create file that violates ${rule_name}"
            ;;
    esac
    
    echo ""
    echo "**Expected:** Plugin should prevent the operation with a clear error message"
    echo ""
    echo "**Status:** [ ] Not tested"
    echo ""
    echo "**File to check:** \`${file}\`"
    echo ""
    echo "---"
    echo ""
done
