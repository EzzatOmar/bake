import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import {
    assertFunctionFileName,
    assertFunctionPathDepth,
    assertFunctionDefaultExport,
    assertFunctionDefaultExportIsFunction,
    assertFnReturnType,
    assertFnParameterCount,
    assertFxReturnType,
    assertFxParameterCount,
    assertFxFirstParameterType,
    assertTxReturnType,
    assertTxParameterCount,
    assertTxFirstParameterType,
    assertDbPortalType
} from "./function-checks";
import { parseTypeScript } from "./ts-analyzer";

// Mock the file system for testing
const mockDirectory = "/tmp/test-project";

describe("Function Checks", () => {
    beforeEach(() => {
        // Create mock directory structure
        if (!fs.existsSync(mockDirectory)) {
            fs.mkdirSync(mockDirectory, { recursive: true });
        }
        
        // Create src directory structure
        const srcDir = path.join(mockDirectory, "src");
        fs.mkdirSync(srcDir, { recursive: true });
        
        const functionDir = path.join(srcDir, "function");
        fs.mkdirSync(functionDir, { recursive: true });

        // Create database directory and connection file for db portal tests
        const databaseDir = path.join(srcDir, "database");
        fs.mkdirSync(databaseDir, { recursive: true });
        
        const connFile = path.join(databaseDir, "conn.test-db.ts");
        fs.writeFileSync(connFile, "export const testDb = {};");
    });

    afterEach(() => {
        // Clean up mock directory
        if (fs.existsSync(mockDirectory)) {
            fs.rmSync(mockDirectory, { recursive: true, force: true });
        }
    });

    describe("assertFunctionFileName", () => {
        test("should pass for fn. prefix", () => {
            const filePath = path.join(mockDirectory, "src", "function", "fn.get-data.ts");
            
            expect(() => {
                assertFunctionFileName({
                    directory: mockDirectory,
                    filePath
                });
            }).not.toThrow();
        });

        test("should pass for fx. prefix", () => {
            const filePath = path.join(mockDirectory, "src", "function", "fx.get-data.ts");
            
            expect(() => {
                assertFunctionFileName({
                    directory: mockDirectory,
                    filePath
                });
            }).not.toThrow();
        });

        test("should pass for tx. prefix", () => {
            const filePath = path.join(mockDirectory, "src", "function", "tx.create-data.ts");
            
            expect(() => {
                assertFunctionFileName({
                    directory: mockDirectory,
                    filePath
                });
            }).not.toThrow();
        });

        test("should throw for invalid prefix", () => {
            const filePath = path.join(mockDirectory, "src", "function", "invalid.get-data.ts");
            
            expect(() => {
                assertFunctionFileName({
                    directory: mockDirectory,
                    filePath
                });
            }).toThrow("Function file names must start with 'fn.', 'fx.', or 'tx.'");
        });

        test("should throw for no prefix", () => {
            const filePath = path.join(mockDirectory, "src", "function", "get-data.ts");
            
            expect(() => {
                assertFunctionFileName({
                    directory: mockDirectory,
                    filePath
                });
            }).toThrow("Function file names must start with 'fn.', 'fx.', or 'tx.'");
        });

        test("should work with complex fn. names", () => {
            const filePath = path.join(mockDirectory, "src", "function", "fn.get-user-by-id-and-email.ts");
            
            expect(() => {
                assertFunctionFileName({
                    directory: mockDirectory,
                    filePath
                });
            }).not.toThrow();
        });
    });

    describe("assertFunctionPathDepth", () => {
        test("should pass for direct function file", () => {
            const filePath = path.join(mockDirectory, "src", "function", "fn.get-data.ts");
            
            expect(() => {
                assertFunctionPathDepth({
                    directory: mockDirectory,
                    filePath
                });
            }).not.toThrow();
        });

        test("should pass for one level of nesting", () => {
            const filePath = path.join(mockDirectory, "src", "function", "users", "fn.get-user.ts");
            
            expect(() => {
                assertFunctionPathDepth({
                    directory: mockDirectory,
                    filePath
                });
            }).not.toThrow();
        });

        test("should throw for too many levels of nesting", () => {
            const filePath = path.join(mockDirectory, "src", "function", "users", "admin", "fn.get-admin.ts");
            
            expect(() => {
                assertFunctionPathDepth({
                    directory: mockDirectory,
                    filePath
                });
            }).toThrow("Function path cannot have more than 1 level of module nesting");
        });

        test("should throw for deeply nested paths", () => {
            const filePath = path.join(mockDirectory, "src", "function", "a", "b", "c", "d", "fn.deep.ts");
            
            expect(() => {
                assertFunctionPathDepth({
                    directory: mockDirectory,
                    filePath
                });
            }).toThrow("Function path cannot have more than 1 level of module nesting");
        });
    });

    describe("assertFunctionDefaultExport", () => {
        test("should pass for function with default export", () => {
            const content = "export default function test() {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFunctionDefaultExport({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for function without default export", () => {
            const content = "export function test() {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFunctionDefaultExport({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).toThrow("Function must have a default export");
        });

        test("should throw for empty file", () => {
            const content = "";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFunctionDefaultExport({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).toThrow("Function must have a default export");
        });
    });

    describe("assertFunctionDefaultExportIsFunction", () => {
        test("should pass for function default export", () => {
            const content = "export default function test() {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFunctionDefaultExportIsFunction({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for variable default export", () => {
            const content = "const test = 42; export default test;";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFunctionDefaultExportIsFunction({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).toThrow("Function default export must be a function");
        });

        test("should throw for object default export", () => {
            const content = "export default { test: 42 };";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFunctionDefaultExportIsFunction({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).toThrow("Function default export must be a function");
        });
    });

    describe("assertFnReturnType", () => {
        test("should pass for fn function with TErrTuple return type", () => {
            const content = "export default function fnTest(): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFnReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for fn function without return type", () => {
            const content = "export default function fnTest() { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFnReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).toThrow("Pure function must have an explicit return type");
        });

        test("should throw for fn function with wrong return type", () => {
            const content = "export default function fnTest(): string { return 'test'; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFnReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).toThrow("Pure function must return TErrTuple<Data>");
        });
    });

    describe("assertFnParameterCount", () => {
        test("should pass for fn function with 1 parameter", () => {
            const content = "export default function fnTest(args: TArgs): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFnParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for fn function with no parameters", () => {
            const content = "export default function fnTest(): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFnParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).toThrow("Pure function must have exactly 1 parameter (TArgs)");
        });

        test("should throw for fn function with 2 parameters", () => {
            const content = "export default function fnTest(portal: TPortal, args: TArgs): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFnParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fn.test.ts")
                });
            }).toThrow("Pure function must have exactly 1 parameter (TArgs)");
        });
    });

    describe("assertFxReturnType", () => {
        test("should pass for fx function with TErrTuple return type", () => {
            const content = "export default function fxTest(): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for fx function without return type", () => {
            const content = "export default function fxTest() { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).toThrow("Effectful function must have an explicit return type");
        });

        test("should throw for fx function with wrong return type", () => {
            const content = "export default function fxTest(): string { return 'test'; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).toThrow("Effectful function must return TErrTuple<Data>");
        });
    });

    describe("assertFxParameterCount", () => {
        test("should pass for fx function with 2 parameters", () => {
            const content = "export default function fxTest(portal: TPortal, args: TArgs): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for fx function with 1 parameter", () => {
            const content = "export default function fxTest(args: TArgs): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).toThrow("Effectful function must have exactly 2 parameters (TPortal, TArgs)");
        });

        test("should throw for fx function with 3 parameters", () => {
            const content = "export default function fxTest(portal: TPortal, args: TArgs, extra: any): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).toThrow("Effectful function must have exactly 2 parameters (TPortal, TArgs)");
        });
    });

    describe("assertFxFirstParameterType", () => {
        test("should pass for fx function with Portal type as first parameter", () => {
            const content = "export default function fxTest(portal: TPortal, args: TArgs): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxFirstParameterType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).not.toThrow();
        });

        test("should pass for fx function with custom Portal type", () => {
            const content = "export default function fxTest(portal: MyPortal, args: TArgs): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxFirstParameterType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for fx function with non-Portal first parameter", () => {
            const content = "export default function fxTest(args: TArgs, portal: TPortal): TErrTuple<string> { return [null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertFxFirstParameterType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).toThrow("Effectful function first parameter must be a Portal type (contains 'Portal')");
        });
    });

    describe("assertTxReturnType", () => {
        test("should pass for tx function with TErrTriple return type", () => {
            const content = "export default function txTest(): TErrTriple<string> { return [null, null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for tx function without return type", () => {
            const content = "export default function txTest() { return [null, null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).toThrow("Transactional function must have an explicit return type");
        });

        test("should throw for tx function with wrong return type", () => {
            const content = "export default function txTest(): string { return 'test'; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxReturnType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).toThrow("Transactional function must return TErrTriple<Data>");
        });
    });

    describe("assertTxParameterCount", () => {
        test("should pass for tx function with 2 parameters", () => {
            const content = "export default function txTest(portal: TPortal, args: TArgs): TErrTriple<string> { return [null, null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for tx function with 1 parameter", () => {
            const content = "export default function txTest(args: TArgs): TErrTriple<string> { return [null, null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).toThrow("Transactional function must have exactly 2 parameters (TPortal, TArgs)");
        });

        test("should throw for tx function with 3 parameters", () => {
            const content = "export default function txTest(portal: TPortal, args: TArgs, extra: any): TErrTriple<string> { return [null, null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxParameterCount({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).toThrow("Transactional function must have exactly 2 parameters (TPortal, TArgs)");
        });
    });

    describe("assertTxFirstParameterType", () => {
        test("should pass for tx function with Portal type as first parameter", () => {
            const content = "export default function txTest(portal: TPortal, args: TArgs): TErrTriple<string> { return [null, null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxFirstParameterType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).not.toThrow();
        });

        test("should pass for tx function with custom Portal type", () => {
            const content = "export default function txTest(portal: MyPortal, args: TArgs): TErrTriple<string> { return [null, null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxFirstParameterType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for tx function with non-Portal first parameter", () => {
            const content = "export default function txTest(args: TArgs, portal: TPortal): TErrTriple<string> { return [null, null, 'test']; }";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                assertTxFirstParameterType({
                    sourceFile,
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "tx.test.ts")
                });
            }).toThrow("Transactional function first parameter must be a Portal type (contains 'Portal')");
        });
    });

    describe("assertDbPortalType", () => {
        test("should pass for valid TPortal with correct db type", async () => {
            const content = `
                export type TPortal = {
                    db: typeof testDb,
                    logger: Logger
                };
            `;
            
            expect(async () => {
                await assertDbPortalType({
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).not.toThrow();
        });

        test("should throw for TPortal with invalid db type", async () => {
            const content = `
                export type TPortal = {
                    db: typeof invalidDb,
                    logger: Logger
                };
            `;
            
            expect(async () => {
                await assertDbPortalType({
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).toThrow("TPortal.db must be typeof one of the database variables");
        });

        test("should pass when no TPortal is found", async () => {
            const content = "export default function fxTest() {}";
            
            expect(async () => {
                await assertDbPortalType({
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).not.toThrow();
        });

        test("should pass when TPortal has no db property", async () => {
            const content = `
                export type TPortal = {
                    logger: Logger
                };
            `;
            
            expect(async () => {
                await assertDbPortalType({
                    directory: mockDirectory,
                    content,
                    filePath: path.join(mockDirectory, "src", "function", "fx.test.ts")
                });
            }).not.toThrow();
        });
    });
});