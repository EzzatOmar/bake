import { expect, test, describe } from "bun:test";
import { ruleApiImportsElysia } from "./rule.api.imports-elysia";

describe("ruleApiImportsElysia", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
    };

    test("should allow Elysia named import", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiImportsElysia({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow Elysia import with other named imports", async () => {
        const content = `
            import { Elysia, t } from 'elysia';
            import { ctrlGetUsers } from '../controller/ctrl.users';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ctrlGetUsers())
                .post('/', ({ body }) => body, {
                    body: t.Object({
                        name: t.String()
                    })
                });
        `;

        const result = await ruleApiImportsElysia({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing Elysia import", async () => {
        const content = `
            import { ctrlGetUsers } from '../controller/ctrl.users';
            
            export default {
                get: () => ctrlGetUsers()
            };
        `;

        const result = await ruleApiImportsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import Elysia from 'elysia'");
        expect(result?.error).toContain("does not import Elysia");
        expect(result?.error).toContain("Add: import { Elysia } from 'elysia';");
        expect(result?.error).toContain("You might want to read .opencode/agent/api-builder.md");
    });

    test("should reject import from wrong module", async () => {
        const content = `
            import { Elysia } from 'other-framework';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiImportsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import Elysia from 'elysia'");
        expect(result?.error).toContain("does not import Elysia");
    });

    test("should reject default import", async () => {
        const content = `
            import Elysia from 'elysia';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiImportsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import Elysia from 'elysia'");
        expect(result?.error).toContain("does not import Elysia");
    });

    test("should reject import with wrong name", async () => {
        const content = `
            import { App } from 'elysia';
            
            export default new App({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiImportsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import Elysia from 'elysia'");
        expect(result?.error).toContain("does not import Elysia");
    });

    test("should reject empty file", async () => {
        const content = "";

        const result = await ruleApiImportsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import Elysia from 'elysia'");
        expect(result?.error).toContain("does not import Elysia");
    });

    test("should reject import with alias but not Elysia", async () => {
        const content = `
            import { t as Type } from 'elysia';
            
            export default {
                validate: () => Type.String()
            };
        `;

        const result = await ruleApiImportsElysia({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import Elysia from 'elysia'");
        expect(result?.error).toContain("does not import Elysia");
    });
});