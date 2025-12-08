import { expect, test, describe } from "bun:test";
import { ruleGenNoTsFileInRoot } from "./rule.gen.no-ts-file-in-root";

describe("ruleGenNoTsFileInRoot", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow .ts files in src folder", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .ts files in nested folders", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .tsx files in src folder", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/pages/index.tsx"
        });

        expect(result).toBeUndefined();
    });

    test("should reject .ts files in root", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/config.ts"
        });

        expect(result?.error).toContain(".ts and .tsx files are not allowed in the project root");
        expect(result?.error).toContain("Please place TypeScript files in the appropriate src/ subdirectory");
        expect(result?.error).toContain("If you need to create one off scripts place them in one-off-scripts/ directory");
    });

    test("should reject .tsx files in root", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/app.tsx"
        });

        expect(result?.error).toContain(".ts and .tsx files are not allowed in the project root");
        expect(result?.error).toContain("Please place TypeScript files in the appropriate src/ subdirectory");
    });

    test("should allow .ts files in one-off-scripts", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/one-off-scripts/migration.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .tsx files in one-off-scripts", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/one-off-scripts/setup.tsx"
        });

        expect(result).toBeUndefined();
    });

    test("should allow other file types in root", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/README.md"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .json files in root", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/package.json"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .js files in root", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/legacy.js"
        });

        expect(result).toBeUndefined();
    });

    test("should handle Windows paths", async () => {
        const result = await ruleGenNoTsFileInRoot({
            directory: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake",
            filePath: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake\\config.ts",
            content: ""
        });

        expect(result?.error).toContain(".ts and .tsx files are not allowed in the project root");
    });

    test("should allow .ts files in .opencode", async () => {
        const result = await ruleGenNoTsFileInRoot({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/.opencode/plugin/bake.ts"
        });

        expect(result).toBeUndefined();
    });
});