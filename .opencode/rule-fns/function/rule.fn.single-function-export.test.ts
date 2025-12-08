import { expect, test, describe } from "bun:test";
import { ruleSingleFunctionExport } from "./rule.fn.single-function-export";

describe("ruleSingleFunctionExport", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.ts"
    };

    test("should allow only default export function", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleSingleFunctionExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow default export with types and constants", async () => {
        const content = `
            export type TArgs = { id: string };
            export type TPortal = { db: Database };
            export const LIMIT = 10;
            
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleSingleFunctionExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow default export with interfaces", async () => {
        const content = `
            export interface User {
                id: string;
                name: string;
            }
            
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleSingleFunctionExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject additional named function exports", async () => {
        const content = `
            export function helper() {
                return {};
            }
            
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleSingleFunctionExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Single file, single function principle violated");
        expect(result?.error).toContain("Found additional exported function(s): helper");
        expect(result?.error).toContain("fn/fx/tx files should only export ONE function (the default export)");
        expect(result?.error).toContain("You can export types, interfaces, and constants, but not additional functions");
        expect(result?.error).toContain("If you need helper functions, either make them non-exported or move them to a separate file");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject additional arrow function exports", async () => {
        const content = `
            export const helper = () => {};
            
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleSingleFunctionExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Single file, single function principle violated");
        expect(result?.error).toContain("Found additional exported function(s): helper");
    });

    test("should reject multiple additional function exports", async () => {
        const content = `
            export function helper1() {}
            export const helper2 = () => {};
            export function helper3() {}
            
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleSingleFunctionExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Single file, single function principle violated");
        expect(result?.error).toContain("Found additional exported function(s): helper1, helper2, helper3");
    });

    test("should allow non-exported helper functions", async () => {
        const content = `
            function helper() {
                return {};
            }
            
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return helper();
            }
        `;

        const result = await ruleSingleFunctionExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject exported function expressions", async () => {
        const content = `
            export const helper = function() {};
            
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleSingleFunctionExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Single file, single function principle violated");
        expect(result?.error).toContain("Found additional exported function(s): helper");
    });
});