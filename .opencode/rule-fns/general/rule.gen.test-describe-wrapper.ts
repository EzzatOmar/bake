import path from "node:path";
import { fileLog } from "../../helper-fns/file-logger";
import type { TRuleFn } from "../rule-types";

/**
 * All test files (*.test.ts, *.test.tsx) must have all test() calls wrapped
 * in a single top-level describe() block. Top-level test() calls are not allowed.
 *
 * ✅ Valid:
 * describe("MyModule", () => {
 *   test("should work", () => { ... });
 *   test("should also work", () => { ... });
 * });
 *
 * ❌ Invalid:
 * test("should work", () => { ... }); // top-level test not allowed
 *
 * ❌ Invalid:
 * describe("A", () => { ... });
 * describe("B", () => { ... }); // multiple top-level describes not allowed
 */
export const ruleGenTestDescribeWrapper: TRuleFn = async ({ directory, filePath, content }) => {
    const relativePath = path.relative(directory, filePath);

    // Only apply to test files in src/ folder
    if (!relativePath.startsWith("src/") && !relativePath.startsWith("src\\")) {
        return;
    }

    // Only apply to test files
    if (!relativePath.endsWith(".test.ts") && !relativePath.endsWith(".test.tsx")) {
        return;
    }

    // Remove comments and strings to avoid false positives
    const cleanedContent = removeCommentsAndStrings(content);

    // Find all top-level test() calls (not inside describe)
    const topLevelTests = findTopLevelTestCalls(cleanedContent);
    if (topLevelTests.length > 0) {
        fileLog("ruleGenTestDescribeWrapper", "top-level test() found", { relativePath, tests: topLevelTests });
        return {
            error: `Top-level test() calls are not allowed in test files. ` +
                `Found ${topLevelTests.length} top-level test() call(s). ` +
                `All test() calls must be wrapped inside a single top-level describe() block. ` +
                `Example:\n` +
                `describe("ModuleName", () => {\n` +
                `  test("should do something", () => { ... });\n` +
                `});`
        };
    }

    // Find all top-level describe() calls
    const topLevelDescribes = findTopLevelDescribeCalls(cleanedContent);
    if (topLevelDescribes.length === 0) {
        fileLog("ruleGenTestDescribeWrapper", "no top-level describe() found", { relativePath });
        return {
            error: `Test files must have a single top-level describe() block. ` +
                `No describe() block found. ` +
                `Example:\n` +
                `describe("ModuleName", () => {\n` +
                `  test("should do something", () => { ... });\n` +
                `});`
        };
    }

    if (topLevelDescribes.length > 1) {
        fileLog("ruleGenTestDescribeWrapper", "multiple top-level describe() found", { relativePath, count: topLevelDescribes.length });
        return {
            error: `Test files must have exactly ONE top-level describe() block. ` +
                `Found ${topLevelDescribes.length} top-level describe() calls. ` +
                `Please consolidate all tests into a single describe() block. ` +
                `You can use nested describe() blocks inside the single top-level describe().`
        };
    }
};

/**
 * Remove comments and string literals to avoid false positives
 */
function removeCommentsAndStrings(content: string): string {
    // Remove single-line comments
    let result = content.replace(/\/\/.*$/gm, "");

    // Remove multi-line comments
    result = result.replace(/\/\*[\s\S]*?\*\//g, "");

    // Remove template literals (backticks) - replace with placeholder
    result = result.replace(/`(?:[^`\\]|\\.)*`/g, '""');

    // Remove double-quoted strings
    result = result.replace(/"(?:[^"\\]|\\.)*"/g, '""');

    // Remove single-quoted strings
    result = result.replace(/'(?:[^'\\]|\\.)*'/g, '""');

    return result;
}

/**
 * Find top-level test() or it() calls that are not inside a describe block
 */
function findTopLevelTestCalls(content: string): string[] {
    const results: string[] = [];
    const lines = content.split("\n");

    let braceDepth = 0;
    let insideDescribe = false;
    let describeDepth = 0;

    for (const line of lines) {
        // Track brace depth
        for (const char of line) {
            if (char === "{") {
                braceDepth++;
            } else if (char === "}") {
                braceDepth--;
                if (insideDescribe && braceDepth < describeDepth) {
                    insideDescribe = false;
                }
            }
        }

        // Check for describe at depth 0 (before incrementing for this line's braces)
        const describeMatch = line.match(/^\s*describe\s*\(/);
        if (describeMatch && !insideDescribe) {
            insideDescribe = true;
            describeDepth = braceDepth;
        }

        // Check for top-level test() or it() calls
        const testMatch = line.match(/^\s*(test|it)\s*\(/);
        if (testMatch && !insideDescribe) {
            results.push(line.trim());
        }
    }

    return results;
}

/**
 * Find top-level describe() calls
 */
function findTopLevelDescribeCalls(content: string): string[] {
    const results: string[] = [];
    const lines = content.split("\n");

    let braceDepth = 0;

    for (const line of lines) {
        // Check for describe at current depth (before processing this line's braces)
        const describeMatch = line.match(/^\s*describe\s*\(/);
        if (describeMatch && braceDepth === 0) {
            results.push(line.trim());
        }

        // Track brace depth
        for (const char of line) {
            if (char === "{") {
                braceDepth++;
            } else if (char === "}") {
                braceDepth--;
            }
        }
    }

    return results;
}
