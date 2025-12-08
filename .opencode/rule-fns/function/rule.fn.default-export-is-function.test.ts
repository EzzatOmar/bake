import { expect, test, describe } from "bun:test";
import { ruleFunctionDefaultExportIsFunction } from "./rule.fn.default-export-is-function";

describe("ruleFunctionDefaultExportIsFunction", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.ts"
    };

    test("should allow function default export", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFunctionDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow arrow function default export", async () => {
        const content = `
            export default (args: TArgs): TErrTuple<User[]> => {
                return [[], null];
            };
        `;

        const result = await ruleFunctionDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow function expression assigned to variable", async () => {
        const content = `
            const fnGetUsers = function(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            };
            export default fnGetUsers;
        `;

        const result = await ruleFunctionDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow arrow function assigned to variable", async () => {
        const content = `
            const fnGetUsers = (args: TArgs): TErrTuple<User[]> => {
                return [[], null];
            };
            export default fnGetUsers;
        `;

        const result = await ruleFunctionDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject object default export", async () => {
        const content = `
            export default {
                getUsers: () => [],
                helper: () => {}
            };
        `;

        const result = await ruleFunctionDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Function default export must be a function");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject class default export", async () => {
        const content = `
            export default class UserService {
                getUsers() {
                    return [];
                }
            }
        `;

        const result = await ruleFunctionDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Function default export must be a function");
    });

    test("should reject string default export", async () => {
        const content = `
            export default "not a function";
        `;

        const result = await ruleFunctionDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Function default export must be a function");
    });

    test("should reject variable that is not a function", async () => {
        const content = `
            const fnGetUsers = { getUsers: () => [] };
            export default fnGetUsers;
        `;

        const result = await ruleFunctionDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Function default export must be a function");
    });
});