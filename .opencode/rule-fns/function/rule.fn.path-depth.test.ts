import { expect, test, describe } from "bun:test";
import { ruleFunctionPathDepth } from "./rule.fn.path-depth";

describe("ruleFunctionPathDepth", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow direct function files", async () => {
        const result = await ruleFunctionPathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject one level of module nesting", async () => {
        const result = await ruleFunctionPathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/profile/fn.get-profile.ts"
        });

        // Path parts: ['user', 'profile', 'fn.get-profile.ts'] = 3 parts > 2, so it fails
        expect(result?.error).toContain("Function path cannot have more than 1 level of module nesting");
        expect(result?.error).toContain("Found 3 levels: user/profile/fn.get-profile.ts");
    });

    test("should reject two levels of nesting", async () => {
        const result = await ruleFunctionPathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/profile/settings/fn.get-settings.ts"
        });

        expect(result?.error).toContain("Function path cannot have more than 1 level of module nesting");
        expect(result?.error).toContain("Found 4 levels: user/profile/settings/fn.get-settings.ts");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject three levels of nesting", async () => {
        const result = await ruleFunctionPathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/a/b/c/fn.test.ts"
        });

        expect(result?.error).toContain("Function path cannot have more than 1 level of module nesting");
        expect(result?.error).toContain("Found 5 levels: user/a/b/c/fn.test.ts");
    });

    test("should allow files directly in function directory", async () => {
        const result = await ruleFunctionPathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/fn.helpers.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject deeply nested files", async () => {
        const result = await ruleFunctionPathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/very/deep/nested/path/fn.get-users.ts"
        });

        expect(result?.error).toContain("Function path cannot have more than 1 level of module nesting");
        expect(result?.error).toContain("Found 6 levels: user/very/deep/nested/path/fn.get-users.ts");
    });

    test("should handle complex module names", async () => {
        const result = await ruleFunctionPathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user-profiles/fx.get-profiles.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should skip files outside function directory", async () => {
        const result = await ruleFunctionPathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
        });

        expect(result).toBeUndefined();
    });
});