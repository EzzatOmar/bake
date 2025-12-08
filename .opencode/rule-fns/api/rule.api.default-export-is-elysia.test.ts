import { expect, test, describe } from "bun:test";
import { ruleApiDefaultExportIsElysia } from "./rule.api.default-export-is-elysia";

describe("ruleApiDefaultExportIsElysia", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
    };

    test("should allow valid Elysia export", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }))
                .post('/', () => ({ success: true }));
        `;

        const result = await ruleApiDefaultExportIsElysia({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow chained Elysia methods", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }))
                .post('/', () => ({ success: true }))
                .put('/:id', () => ({ updated: true }))
                .delete('/:id', () => ({ deleted: true }));
        `;

        const result = await ruleApiDefaultExportIsElysia({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject non-Elysia export", async () => {
        const content = `
            export default {
                get: () => ({ users: [] }),
                post: () => ({ success: true })
            };
        `;

        const result = await ruleApiDefaultExportIsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must default export a new Elysia() instance");
        expect(result?.error).toContain("does not export an Elysia instance");
        expect(result?.error).toContain("You might want to read .opencode/agent/api-builder.md");
    });

    test("should reject variable export", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            const app = new Elysia({ prefix: '/api/users' });
            export default app;
        `;

        const result = await ruleApiDefaultExportIsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must default export a new Elysia() instance");
    });

    test("should reject different class instantiation", async () => {
        const content = `
            import { OtherFramework } from 'other-framework';
            
            export default new OtherFramework({ prefix: '/api/users' });
        `;

        const result = await ruleApiDefaultExportIsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must default export a new Elysia() instance");
    });

    test("should reject export without default", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export const app = new Elysia({ prefix: '/api/users' });
        `;

        const result = await ruleApiDefaultExportIsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must default export a new Elysia() instance");
    });
});