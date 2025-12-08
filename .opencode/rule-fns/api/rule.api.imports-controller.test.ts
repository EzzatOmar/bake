import { expect, test, describe } from "bun:test";
import { ruleApiImportsController } from "./rule.api.imports-controller";

describe("ruleApiImportsController", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts"
    };

    test("should allow controller import with relative path", async () => {
        const content = `
            import { Elysia } from 'elysia';
            import { ctrlGetUsers } from '../controller/ctrl.users';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ctrlGetUsers());
        `;

        const result = await ruleApiImportsController({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow controller import with absolute path", async () => {
        const content = `
            import { Elysia } from 'elysia';
            import { ctrlCreateUser } from '@/src/controller/ctrl.create-user';
            
            export default new Elysia({ prefix: '/api/users' })
                .post('/', () => ctrlCreateUser());
        `;

        const result = await ruleApiImportsController({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow multiple controller imports", async () => {
        const content = `
            import { Elysia } from 'elysia';
            import { ctrlGetUsers } from '../controller/ctrl.users';
            import { ctrlCreateUser } from '../controller/ctrl.create-user';
            import { ctrlUpdateUser } from '../controller/ctrl.update-user';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ctrlGetUsers())
                .post('/', () => ctrlCreateUser())
                .put('/:id', () => ctrlUpdateUser());
        `;

        const result = await ruleApiImportsController({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing controller import", async () => {
        const content = `
            import { Elysia } from 'elysia';
            import { someUtil } from '../utils/helpers';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiImportsController({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import at least one controller file (ctrl.*)");
        expect(result?.error).toContain("does not import any controller");
        expect(result?.error).toContain("Controllers handle business logic and database operations");
        expect(result?.error).toContain("You might want to read .opencode/agent/api-builder.md and .opencode/agent/ctrl-builder.md");
    });

    test("should reject import of non-controller files", async () => {
        const content = `
            import { Elysia } from 'elysia';
            import { fxGetUsers } from '../function/fx.get-users';
            import { validateUser } from '../utils/validation';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => fxGetUsers());
        `;

        const result = await ruleApiImportsController({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import at least one controller file (ctrl.*)");
        expect(result?.error).toContain("does not import any controller");
    });

    test("should reject empty file", async () => {
        const content = "";

        const result = await ruleApiImportsController({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import at least one controller file (ctrl.*)");
    });

    test("should reject file with only Elysia import", async () => {
        const content = `
            import { Elysia } from 'elysia';
            
            export default new Elysia({ prefix: '/api/users' })
                .get('/', () => ({ users: [] }));
        `;

        const result = await ruleApiImportsController({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("API files must import at least one controller file (ctrl.*)");
    });
});