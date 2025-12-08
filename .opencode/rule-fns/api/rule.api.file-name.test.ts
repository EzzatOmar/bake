import { expect, test, describe } from "bun:test";
import { ruleApiFileName } from "./rule.api.file-name";

describe("ruleApiFileName", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow valid api. prefix", async () => {
        const result = await ruleApiFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow nested api. prefix", async () => {
        const result = await ruleApiFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.profile.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .model.ts files", async () => {
        const result = await ruleApiFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/user.model.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow nested .model.ts files", async () => {
        const result = await ruleApiFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/validation/user.model.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject files without api. prefix", async () => {
        const result = await ruleApiFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/users.ts"
        });

        expect(result?.error).toContain("API file names must start with 'api.'");
        expect(result?.error).toContain("Found: users.ts");
        expect(result?.error).toContain("You might want to read .opencode/agent/api-builder.md");
    });

    test("should reject files with different prefix", async () => {
        const result = await ruleApiFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/handler.users.ts"
        });

        expect(result?.error).toContain("API file names must start with 'api.'");
        expect(result?.error).toContain("Found: handler.users.ts");
    });

    test("should reject files with prefix but not api.", async () => {
        const result = await ruleApiFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/endpoint.users.ts"
        });

        expect(result?.error).toContain("API file names must start with 'api.'");
        expect(result?.error).toContain("Found: endpoint.users.ts");
    });

    test("should reject .model files without proper extension", async () => {
        const result = await ruleApiFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/user.model.js"
        });

        expect(result?.error).toContain("API file names must start with 'api.'");
        expect(result?.error).toContain("Found: user.model.js");
    });
});