import { expect, test, describe } from "bun:test";
import { ruleFunctionDefaultExport } from "./rule.fn.default-export";

describe("ruleFunctionDefaultExport", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.ts"
    };

    test("should allow default export function", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFunctionDefaultExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow default export arrow function", async () => {
        const content = `
            export default (args: TArgs): TErrTuple<User[]> => {
                return [[], null];
            };
        `;

        const result = await ruleFunctionDefaultExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow default export variable", async () => {
        const content = `
            const fnGetUsers = (args: TArgs): TErrTuple<User[]> => {
                return [[], null];
            };
            export default fnGetUsers;
        `;

        const result = await ruleFunctionDefaultExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow default export with named exports", async () => {
        const content = `
            export type TArgs = { id: string };
            export const LIMIT = 10;
            
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFunctionDefaultExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing default export", async () => {
        const content = `
            export function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFunctionDefaultExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Function must have a default export");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject only named exports", async () => {
        const content = `
            export type TArgs = { id: string };
            export const helper = () => {};
        `;

        const result = await ruleFunctionDefaultExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Function must have a default export");
    });

    test("should reject empty file", async () => {
        const content = "";

        const result = await ruleFunctionDefaultExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Function must have a default export");
    });
});