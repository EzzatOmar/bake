import { expect, test, describe } from "bun:test";
import { ruleFnParameterCount } from "./rule.fn.parameter-count";

describe("ruleFnParameterCount", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.ts"
    };

    test("should allow exactly 1 parameter", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFnParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow 1 parameter in arrow function", async () => {
        const content = `
            export default (args: TArgs): TErrTuple<User[]> => {
                return [[], null];
            };
        `;

        const result = await ruleFnParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject zero parameters", async () => {
        const content = `
            export default function fnGetUsers(): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFnParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Pure function must have exactly 1 parameter (TArgs)");
        expect(result?.error).toContain("Found: 0 parameters");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject two parameters", async () => {
        const content = `
            export default function fnGetUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFnParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Pure function must have exactly 1 parameter (TArgs)");
        expect(result?.error).toContain("Found: 2 parameters");
    });

    test("should reject three parameters", async () => {
        const content = `
            export default function fnGetUsers(portal: TPortal, args: TArgs, extra: string): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFnParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Pure function must have exactly 1 parameter (TArgs)");
        expect(result?.error).toContain("Found: 3 parameters");
    });

    test("should allow parameters without explicit type annotations", async () => {
        const content = `
            export default function fnGetUsers(args): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFnParameterCount({
            ...baseArgs,
            content
        });

        // Parameter count is 1, so this passes the count check
        // Type annotation checking is a different rule
        expect(result).toBeUndefined();
    });
});