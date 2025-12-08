import { expect, test, describe } from "bun:test";
import { ruleFnReturnType } from "./rule.fn.return-type";

describe("ruleFnReturnType", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.ts"
    };

    test("should allow TErrTuple return type", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFnReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TErrTuple with generic", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): TErrTuple<{ users: User[] }> {
                return [{ users: [] }, null];
            }
        `;

        const result = await ruleFnReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TErrTuple in arrow function", async () => {
        const content = `
            export default (args: TArgs): TErrTuple<User[]> => {
                return [[], null];
            };
        `;

        const result = await ruleFnReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing return type", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs) {
                return [[], null];
            }
        `;

        const result = await ruleFnReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Pure function must have an explicit return type");
        expect(result?.error).toContain("Expected: TErrTuple<Data>");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject non-TErrTuple return type", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): User[] {
                return [];
            }
        `;

        const result = await ruleFnReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Pure function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: User[]");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should allow Promise return type that wraps TErrTuple", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): Promise<TErrTuple<User[]>> {
                return Promise.resolve([[], null]);
            }
        `;

        const result = await ruleFnReturnType({
            ...baseArgs,
            content
        });

        // Promise<TErrTuple<...>> contains "TErrTuple" so it passes
        // If we want to reject wrapped TErrTuple, we need a more sophisticated check
        expect(result).toBeUndefined();
    });

    test("should reject union return type", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): [User[], null] | [null, Error] {
                return [[], null];
            }
        `;

        const result = await ruleFnReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Pure function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: [User[], null] | [null, Error]");
    });

    test("should reject void return type", async () => {
        const content = `
            export default function fnGetUsers(args: TArgs): void {
                console.log(args);
            }
        `;

        const result = await ruleFnReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Pure function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: void");
    });
});