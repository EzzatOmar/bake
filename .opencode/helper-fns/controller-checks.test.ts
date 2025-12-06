import { describe, it, expect, beforeEach } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import * as controllerChecks from "./controller-checks";
import { parseTypeScript } from "./ts-analyzer";

describe("Controller Checks", () => {
    const testDir = "/tmp/controller-checks-test";
    const srcDir = path.join(testDir, "src");
    const controllerDir = path.join(srcDir, "controller");

    beforeEach(() => {
        // Clean up and recreate test directory structure
        rmSync(testDir, { recursive: true, force: true });
        mkdirSync(controllerDir, { recursive: true });
    });

    describe("assertControllerFileName", () => {
        it("should pass for valid controller file name", () => {
            expect(() => {
                controllerChecks.assertControllerFileName({
                    directory: testDir,
                    filePath: path.join(controllerDir, "ctrl.create.ts")
                });
            }).not.toThrow();
        });

        it("should throw error for files without ctrl. prefix", () => {
            expect(() => {
                controllerChecks.assertControllerFileName({
                    directory: testDir,
                    filePath: path.join(controllerDir, "invalid.ts")
                });
            }).toThrow("Controller file names must start with 'ctrl.'");
        });

        it("should throw error for files with wrong prefix", () => {
            expect(() => {
                controllerChecks.assertControllerFileName({
                    directory: testDir,
                    filePath: path.join(controllerDir, "fn.create.ts")
                });
            }).toThrow("Controller file names must start with 'ctrl.'");
        });
    });

    describe("assertControllerDefaultExport", () => {
        it("should pass for files with default export", () => {
            const content = "export default function test() {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerDefaultExport({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for files without default export", () => {
            const content = "export const test = 1;";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerDefaultExport({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller must have a default export function");
        });

        it("should throw error for files with only named exports", () => {
            const content = "export function test() {} export const x = 1;";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerDefaultExport({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller must have a default export function");
        });
    });

    describe("assertControllerDefaultExportIsFunction", () => {
        it("should pass for function default export", () => {
            const content = "export default function test() {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerDefaultExportIsFunction({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for non-function default export", () => {
            const content = "export default 1;";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerDefaultExportIsFunction({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller default export must be a function");
        });

        it("should throw error for object default export", () => {
            const content = "export default { test: 'value' };";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerDefaultExportIsFunction({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller default export must be a function");
        });
    });

    describe("assertControllerParameterCount", () => {
        it("should pass for exactly 2 parameters", () => {
            const content = "export default function test(param1: any, param2: any) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerParameterCount({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for no parameters", () => {
            const content = "export default function test() {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerParameterCount({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller function must have exactly 2 parameters");
        });

        it("should throw error for 1 parameter", () => {
            const content = "export default function test(param1: any) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerParameterCount({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller function must have exactly 2 parameters");
        });

        it("should throw error for 3 parameters", () => {
            const content = "export default function test(param1: any, param2: any, param3: any) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerParameterCount({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller function must have exactly 2 parameters");
        });
    });

    describe("assertControllerFirstParameterIsPortal", () => {
        it("should pass for TPortal first parameter", () => {
            const content = "export default function test(param1: TPortal, param2: any) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerFirstParameterIsPortal({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should pass for portal first parameter", () => {
            const content = "export default function test(param1: MyPortal, param2: any) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerFirstParameterIsPortal({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for non-portal first parameter", () => {
            const content = "export default function test(param1: any, param2: any) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerFirstParameterIsPortal({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("First parameter must be a portal type");
        });

        it("should throw error for string first parameter", () => {
            const content = "export default function test(param1: string, param2: any) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerFirstParameterIsPortal({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("First parameter must be a portal type");
        });
    });

    describe("assertControllerSecondParameterIsArgs", () => {
        it("should pass for TArgs second parameter", () => {
            const content = "export default function test(param1: TPortal, param2: TArgs) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerSecondParameterIsArgs({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should pass for args second parameter", () => {
            const content = "export default function test(param1: TPortal, param2: MyArgs) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerSecondParameterIsArgs({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for non-args second parameter", () => {
            const content = "export default function test(param1: TPortal, param2: any) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerSecondParameterIsArgs({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Second parameter must be an args type");
        });

        it("should throw error for string second parameter", () => {
            const content = "export default function test(param1: TPortal, param2: string) {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerSecondParameterIsArgs({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Second parameter must be an args type");
        });
    });

    describe("assertControllerReturnType", () => {
        it("should pass for TErrTuple return type", () => {
            const content = "export default function test(): TErrTuple<string> {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerReturnType({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should pass for Promise<TErrTuple> return type", () => {
            const content = "export default function test(): Promise<TErrTuple<string>> {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerReturnType({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).not.toThrow();
        });

        it("should throw error for missing return type", () => {
            const content = "export default function test() {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerReturnType({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller function must have an explicit return type");
        });

        it("should throw error for any return type", () => {
            const content = "export default function test(): any {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerReturnType({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller function must return TErrTuple<Data>");
        });

        it("should throw error for string return type", () => {
            const content = "export default function test(): string {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerReturnType({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller function must return TErrTuple<Data>");
        });

        it("should throw error for Promise<[Data, null] | [null, TErrorEntry]> return type", () => {
            const content = "export default function test(): Promise<[string, null] | [null, TErrorEntry]> {}";
            const sourceFile = parseTypeScript(content);
            
            expect(() => {
                controllerChecks.assertControllerReturnType({
                    directory: testDir,
                    content,
                    filePath: path.join(controllerDir, "ctrl.create.ts"),
                    sourceFile
                });
            }).toThrow("Controller function must return TErrTuple<Data>");
        });
    });
});