import { expect, test, describe } from "bun:test";
import { ruleDatabaseFileNameMatchesDirectory } from "./rule.database.file-name-matches-directory";

describe("ruleDatabaseFileNameMatchesDirectory", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow conn.<dbname>.ts matching directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/conn.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow auth.<dbname>.ts matching directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/auth.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow schema.custom.<dbname>.ts matching directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/schema.custom.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow schema.better-auth.<dbname>.ts matching directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/schema.better-auth.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow schema.validation.<dbname>.ts matching directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/schema.validation.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject conn.<wrongdb>.ts not matching directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/conn.products.ts"
        });

        expect(result?.error).toContain("Database file name must match the directory name");
        expect(result?.error).toContain("Expected patterns: conn.users.ts, auth.users.ts, or schema.<type>.users.ts");
        expect(result?.error).toContain("Found: conn.products.ts in src/database/users/");
        expect(result?.error).toContain("You might want to read .opencode/agent/database-manager.md");
    });

    test("should reject auth.<wrongdb>.ts not matching directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/auth.products.ts"
        });

        expect(result?.error).toContain("Database file name must match the directory name");
        expect(result?.error).toContain("Expected patterns: conn.users.ts, auth.users.ts, or schema.<type>.users.ts");
        expect(result?.error).toContain("Found: auth.products.ts in src/database/users/");
    });

    test("should reject schema.custom.<wrongdb>.ts not matching directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/schema.custom.products.ts"
        });

        expect(result?.error).toContain("Database file name must match the directory name");
        expect(result?.error).toContain("Expected patterns: conn.users.ts, auth.users.ts, or schema.<type>.users.ts");
        expect(result?.error).toContain("Found: schema.custom.products.ts in src/database/users/");
    });

    test("should reject non-matching file names", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/queries.users.ts"
        });

        expect(result?.error).toContain("Database file name must match the directory name");
        expect(result?.error).toContain("Expected patterns: conn.users.ts, auth.users.ts, or schema.<type>.users.ts");
        expect(result?.error).toContain("Found: queries.users.ts in src/database/users/");
    });

    test("should skip files not in database directory", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should handle Windows paths", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake\\src\\database\\users\\conn.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should handle nested database names", async () => {
        const result = await ruleDatabaseFileNameMatchesDirectory({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/user-profiles/conn.user-profiles.ts"
        });

        expect(result).toBeUndefined();
    });
});