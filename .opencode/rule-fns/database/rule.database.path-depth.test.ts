import { expect, test, describe } from "bun:test";
import { ruleDatabasePathDepth } from "./rule.database.path-depth";

describe("ruleDatabasePathDepth", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow correct path depth", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/conn.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow correct path depth for schema files", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/schema.custom.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow correct path depth for auth files", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/auth.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject nested subdirectories", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/subdir/conn.users.ts"
        });

        expect(result?.error).toContain("Database files must be at src/database/<dbname>/<file>.ts");
        expect(result?.error).toContain("No subdirectories or additional nesting allowed");
        expect(result?.error).toContain("Found: src/database/users/subdir/conn.users.ts");
        expect(result?.error).toContain("You might want to read .opencode/agent/database-manager.md");
    });

    test("should reject deeply nested files", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/users/nested/deep/conn.users.ts"
        });

        expect(result?.error).toContain("Database files must be at src/database/<dbname>/<file>.ts");
        expect(result?.error).toContain("Found: src/database/users/nested/deep/conn.users.ts");
    });

    test("should reject files directly in database directory", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/conn.users.ts"
        });

        expect(result?.error).toContain("Database files must be at src/database/<dbname>/<file>.ts");
        expect(result?.error).toContain("Found: src/database/conn.users.ts");
    });

    test("should reject files in src directory", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/conn.users.ts"
        });

        expect(result?.error).toContain("Database files must be at src/database/<dbname>/<file>.ts");
        expect(result?.error).toContain("Found: src/conn.users.ts");
    });

    test("should handle Windows paths", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake\\src\\database\\users\\conn.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject nested directories on Windows", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake\\src\\database\\users\\subdir\\conn.users.ts"
        });

        expect(result?.error).toContain("Database files must be at src/database/<dbname>/<file>.ts");
        expect(result?.error).toContain("Found: src/database/users/subdir/conn.users.ts");
    });

    test("should allow complex database names", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/database/user-profiles/conn.user-profiles.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject files outside src directory", async () => {
        const result = await ruleDatabasePathDepth({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/database/users/conn.users.ts"
        });

        expect(result?.error).toContain("Database files must be at src/database/<dbname>/<file>.ts");
        expect(result?.error).toContain("Found: database/users/conn.users.ts");
    });
});