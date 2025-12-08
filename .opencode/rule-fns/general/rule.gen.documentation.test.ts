import { expect, test, describe } from "bun:test";
import { ruleGenDocumentation } from "./rule.gen.documentation";

describe("ruleGenDocumentation", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow .md files in docs folder", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/docs/api-guide.md"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .txt files in docs folder", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/docs/notes.txt"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .md files in one-off-scripts folder", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/one-off-scripts/migration.md"
        });

        expect(result).toBeUndefined();
    });

    test("should allow .md files in .opencode folder", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/.opencode/prompt/api-builder.md"
        });

        expect(result).toBeUndefined();
    });

    test("should reject .md files in src folder", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/readme.md"
        });

        expect(result?.error).toContain("Documentation files (.md) should only be created in the /docs or /one-off-scripts folders");
        expect(result?.error).toContain("Attempted to create: readme.md");
        expect(result?.error).toContain("Agents should not add useless documentation");
        expect(result?.error).toContain("If documentation is really needed, use JSDoc comments in the code instead");
        expect(result?.error).toContain("Usually agents can read the code directly, which is sufficient");
        expect(result?.error).toContain("Only add JSDoc for non-trivial usage patterns");
        expect(result?.error).toContain("Agents should not engage in over-engineering documentation - no example scripts or similar files are needed");
    });

    test("should reject .txt files in src folder", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/todo.txt"
        });

        expect(result?.error).toContain("Documentation files (.txt) should only be created in the /docs or /one-off-scripts folders");
        expect(result?.error).toContain("Attempted to create: todo.txt");
    });

    test("should reject .md files in root", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/guide.md"
        });

        expect(result?.error).toContain("Documentation files (.md) should only be created in the /docs or /one-off-scripts folders");
        expect(result?.error).toContain("Attempted to create: guide.md");
    });

    test("should reject .txt files in root", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/notes.txt"
        });

        expect(result?.error).toContain("Documentation files (.txt) should only be created in the /docs or /one-off-scripts folders");
        expect(result?.error).toContain("Attempted to create: notes.txt");
    });

    test("should allow .md files in nested docs folder", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/docs/api/endpoint-guide.md"
        });

        expect(result).toBeUndefined();
    });

    test("should reject other file types", async () => {
        const result = await ruleGenDocumentation({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/docs/config.json"
        });

        expect(result).toBeUndefined();
    });
});