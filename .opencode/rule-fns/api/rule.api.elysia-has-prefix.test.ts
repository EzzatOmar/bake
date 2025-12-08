import { expect, test, describe } from "bun:test";
import { ruleApiElysiaHasPrefix } from "./rule.api.elysia-has-prefix";

describe("ruleApiElysiaHasPrefix", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
    };

    test("should allow valid /api/ prefix", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiElysiaHasPrefix({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow nested /api/ prefix", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ prefix: '/api/users/profile' })
                .get('/', () => ({ profile: {} }));
        `;

        const result = await ruleApiElysiaHasPrefix({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing prefix", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia()
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiElysiaHasPrefix({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API Elysia instance must have a 'prefix' option");
        expect(result?.error).toContain("is missing prefix");
        expect(result?.error).toContain("You might want to read .opencode/agent/api-builder.md");
    });

    test("should reject non-/api/ prefix", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ prefix: '/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiElysiaHasPrefix({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API Elysia prefix must start with '/api/'");
        expect(result?.error).toContain("Found prefix: '/users'");
        expect(result?.error).toContain("You might want to read .opencode/agent/api-builder.md");
    });

    test("should reject prefix without leading slash", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ prefix: 'api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiElysiaHasPrefix({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API Elysia prefix must start with '/api/'");
        expect(result?.error).toContain("Found prefix: 'api/users'");
    });

    test("should reject empty object as prefix", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({})
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiElysiaHasPrefix({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API Elysia instance must have a 'prefix' option");
    });

    test("should reject prefix with different property name", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ basePath: '/api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiElysiaHasPrefix({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API Elysia instance must have a 'prefix' option");
    });
});