import { expect, test, describe } from "bun:test";
import { ruleGenNoJsFiles } from "./rule.gen.no-js-files";

describe("ruleGenNoJsFiles", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow .ts files", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .tsx files", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/pages/index.tsx"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .json files", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/package.json"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .md files", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/README.md"
        });

        expect(result).toBeUndefined();
    });

    test("should reject .js files in src", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/legacy-handler.js"
        });

        expect(result?.error).toContain(".js files are not allowed in this project");
        expect(result?.error).toContain("Please use TypeScript (.ts) files instead");
    });

    test("should reject .js files in root", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/old-script.js"
        });

        expect(result?.error).toContain(".js files are not allowed in this project");
        expect(result?.error).toContain("Please use TypeScript (.ts) files instead");
    });

    test("should reject .js files in any directory", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/scripts/build.js"
        });

        expect(result?.error).toContain(".js files are not allowed in this project");
        expect(result?.error).toContain("Please use TypeScript (.ts) files instead");
    });

    test("should reject .JS files (uppercase)", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/UPPERCASE.JS"
        });

        expect(result?.error).toContain(".js files are not allowed in this project");
        expect(result?.error).toContain("Please use TypeScript (.ts) files instead");
    });

    test("should allow .js files in node_modules", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/node_modules/some-package/index.js"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .js.map files", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/compiled.js.map"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .js files in .git", async () => {
        const result = await ruleGenNoJsFiles({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/.git/hooks/pre-commit.js"
        });

        expect(result).toBeUndefined();
    });
});