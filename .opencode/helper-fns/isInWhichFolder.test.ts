import { describe, test, expect } from "bun:test";
import path from "node:path";
import {
    isInApiFolder,
    isInControllerFolder,
    isInFunctionFolder,
    isInDatabaseFolder,
    isInDocsFolder,
    isInOpencodeFolder,
    isInOneOffScriptsFolder
} from "./isInWhichFolder";

describe("isInWhichFolder - BUG-001: Relative path matching", () => {
    const testDirectory = "/Users/omarezzat/Workspace/metaframework/bake";

    describe("with absolute paths (should work)", () => {
        test("should detect API folder with absolute path", () => {
            const result = isInApiFolder({
                directory: testDirectory,
                filePath: path.join(testDirectory, "src/api/test/api.test.ts")
            });
            expect(result).toBe(true);
        });

        test("should detect controller folder with absolute path", () => {
            const result = isInControllerFolder({
                directory: testDirectory,
                filePath: path.join(testDirectory, "src/controller/test/ctrl.test.ts")
            });
            expect(result).toBe(true);
        });

        test("should detect function folder with absolute path", () => {
            const result = isInFunctionFolder({
                directory: testDirectory,
                filePath: path.join(testDirectory, "src/function/test/fn.test.ts")
            });
            expect(result).toBe(true);
        });

        test("should detect database folder with absolute path", () => {
            const result = isInDatabaseFolder({
                directory: testDirectory,
                filePath: path.join(testDirectory, "src/database/test/db.test.ts")
            });
            expect(result).toBe(true);
        });
    });

    describe("with relative paths (BUG-001: currently broken)", () => {
        test("should detect API folder with relative path", () => {
            const result = isInApiFolder({
                directory: testDirectory,
                filePath: "src/api/test/api.test.ts"
            });
            expect(result).toBe(true);
        });

        test("should detect controller folder with relative path", () => {
            const result = isInControllerFolder({
                directory: testDirectory,
                filePath: "src/controller/test/ctrl.test.ts"
            });
            expect(result).toBe(true);
        });

        test("should detect function folder with relative path", () => {
            const result = isInFunctionFolder({
                directory: testDirectory,
                filePath: "src/function/test/fn.test.ts"
            });
            expect(result).toBe(true);
        });

        test("should detect database folder with relative path", () => {
            const result = isInDatabaseFolder({
                directory: testDirectory,
                filePath: "src/database/test/db.test.ts"
            });
            expect(result).toBe(true);
        });

        test("should detect docs folder with relative path", () => {
            const result = isInDocsFolder({
                directory: testDirectory,
                filePath: "docs/test.md"
            });
            expect(result).toBe(true);
        });

        test("should detect opencode folder with relative path", () => {
            const result = isInOpencodeFolder({
                directory: testDirectory,
                filePath: ".opencode/test.ts"
            });
            expect(result).toBe(true);
        });

        test("should detect one-off-scripts folder with relative path", () => {
            const result = isInOneOffScriptsFolder({
                directory: testDirectory,
                filePath: "one-off-scripts/test.ts"
            });
            expect(result).toBe(true);
        });
    });

    describe("edge cases", () => {
        test("should handle relative paths with leading ./", () => {
            const result = isInApiFolder({
                directory: testDirectory,
                filePath: "./src/api/test/api.test.ts"
            });
            expect(result).toBe(true);
        });

        test("should handle relative paths with leading ../", () => {
            const result = isInApiFolder({
                directory: testDirectory,
                filePath: "../bake/src/api/test/api.test.ts"
            });
            expect(result).toBe(true);
        });

        test("should not match unrelated relative paths", () => {
            const result = isInApiFolder({
                directory: testDirectory,
                filePath: "src/controller/test/ctrl.test.ts"
            });
            expect(result).toBe(false);
        });
    });
});