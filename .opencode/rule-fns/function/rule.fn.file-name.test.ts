import { expect, test, describe } from "bun:test";
import { ruleFunctionFileName } from "./rule.fn.file-name";

describe("ruleFunctionFileName", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow fn. prefix", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow fx. prefix", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow tx. prefix", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/tx.create-user.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow nested function files with valid prefixes", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/profile/fn.get-profile.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject files without valid prefix", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/get-users.ts"
        });

        expect(result?.error).toContain("Function file names must start with 'fn.', 'fx.', or 'tx.'");
        expect(result?.error).toContain("Found: get-users.ts");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject files with wrong prefix", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/helper.get-users.ts"
        });

        expect(result?.error).toContain("Function file names must start with 'fn.', 'fx.', or 'tx.'");
        expect(result?.error).toContain("Found: helper.get-users.ts");
    });

    test("should reject files with uppercase prefix", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/FN.get-users.ts"
        });

        expect(result?.error).toContain("Function file names must start with 'fn.', 'fx.', or 'tx.'");
        expect(result?.error).toContain("Found: FN.get-users.ts");
    });

    test("should reject files with prefix but not dot", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fnget-users.ts"
        });

        expect(result?.error).toContain("Function file names must start with 'fn.', 'fx.', or 'tx.'");
        expect(result?.error).toContain("Found: fnget-users.ts");
    });

    test("should allow complex function names with valid prefixes", async () => {
        const result = await ruleFunctionFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-user-by-email.ts"
        });

        expect(result).toBeUndefined();
    });
});