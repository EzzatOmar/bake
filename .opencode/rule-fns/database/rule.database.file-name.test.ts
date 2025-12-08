import { expect, test, describe } from "bun:test";
import { ruleDatabaseFileName } from "./rule.database.file-name";

describe("ruleDatabaseFileName", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow conn.<dbname>.ts files", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/conn.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow schema.custom.<dbname>.ts files", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/schema.custom.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow schema.better-auth.<dbname>.ts files", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/schema.better-auth.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow auth.<dbname>.ts files", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/auth.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow schema.validation.<dbname>.ts files", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/schema.validation.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject queries.<dbname>.ts files", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/queries.users.ts"
        });

        expect(result?.error).toContain("Only 'conn.<dbname>.ts', 'schema.<type>.<dbname>.ts', and 'auth.<dbname>.ts' files are allowed in src/database/<dbname>/");
        expect(result?.error).toContain("Found: queries.users.ts");
        expect(result?.error).toContain("Database queries and helper functions should be placed in src/function/ directory");
        expect(result?.error).toContain("The function-builder subagent can help you create properly structured functions");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject helper.<dbname>.ts files", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/helper.users.ts"
        });

        expect(result?.error).toContain("Only 'conn.<dbname>.ts', 'schema.<type>.<dbname>.ts', and 'auth.<dbname>.ts' files are allowed in src/database/<dbname>/");
        expect(result?.error).toContain("Found: helper.users.ts");
    });

    test("should reject utils.<dbname>.ts files", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/utils.users.ts"
        });

        expect(result?.error).toContain("Only 'conn.<dbname>.ts', 'schema.<type>.<dbname>.ts', and 'auth.<dbname>.ts' files are allowed in src/database/<dbname>/");
        expect(result?.error).toContain("Found: utils.users.ts");
    });

    test("should reject generic file names", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/users.ts"
        });

        expect(result?.error).toContain("Only 'conn.<dbname>.ts', 'schema.<type>.<dbname>.ts', and 'auth.<dbname>.ts' files are allowed in src/database/<dbname>/");
        expect(result?.error).toContain("Found: users.ts");
    });

    test("should reject files with wrong prefix", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/connection.users.ts"
        });

        expect(result?.error).toContain("Only 'conn.<dbname>.ts', 'schema.<type>.<dbname>.ts', and 'auth.<dbname>.ts' files are allowed in src/database/<dbname>/");
        expect(result?.error).toContain("Found: connection.users.ts");
    });

    test("should handle Windows paths", async () => {
        const result = await ruleDatabaseFileName({
            ...baseArgs,
            filePath: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake\\src\\database\\users\\conn.users.ts"
        });

        expect(result).toBeUndefined();
    });
});