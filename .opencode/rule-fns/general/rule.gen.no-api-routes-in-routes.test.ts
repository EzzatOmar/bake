import { expect, test, describe } from "bun:test";
import { ruleNoApiRoutesInRoutes } from "./rule.gen.no-api-routes-in-routes";

describe("ruleNoApiRoutesInRoutes", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
    };

    test("should allow files without API imports", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts",
            content: `
import { db } from '@/database/users/conn.users';

export default function getUsers() {
    return db.select().from(users);
}
            `
        });

        expect(result).toBeUndefined();
    });

    test("should allow api-router.ts to import API routes", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api-router.ts",
            content: `
import { Elysia } from 'elysia';
import { apiHealth } from './api/api.health';

export default new Elysia({ name: 'api-router' })
  .use(apiHealth);
            `
        });

        expect(result).toBeUndefined();
    });

    test("should allow files in src/api/ to import each other", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/api.users.ts",
            content: `
import { Elysia } from 'elysia';
import { apiAuth } from './api.auth';

export const apiUsers = new Elysia({ prefix: '/users' })
  .use(apiAuth);
            `
        });

        expect(result).toBeUndefined();
    });

    test("should reject direct import from src/api/ path", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts",
            content: `
import { apiHealth } from 'src/api/api.health';

export default function test() {
    return apiHealth;
}
            `
        });

        expect(result?.error).toContain("API routes must NOT be imported directly");
        expect(result?.error).toContain("Found import: 'src/api/api.health'");
        expect(result?.error).toContain("API routes should be added as subrouters in src/api-router.ts using .use()");
        expect(result?.error).toContain("You might want to read .opencode/agent/api-builder.md");
    });

    test("should reject direct import from @/api/ path", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts",
            content: `
import { apiHealth } from '@/api/api.health';

export default function test() {
    return apiHealth;
}
            `
        });

        expect(result?.error).toContain("API routes must NOT be imported directly");
        expect(result?.error).toContain("Found import: '@/api/api.health'");
    });

    test("should reject relative import from ../api/", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts",
            content: `
import { apiHealth } from '../api/api.health';

export default function test() {
    return apiHealth;
}
            `
        });

        expect(result?.error).toContain("API routes must NOT be imported directly");
        expect(result?.error).toContain("Found import: '../api/api.health'");
    });

    test("should reject relative import from ./api/", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/ctrl.users.ts",
            content: `
import { apiHealth } from './api/api.health';

export default function test() {
    return apiHealth;
}
            `
        });

        expect(result?.error).toContain("API routes must NOT be imported directly");
        expect(result?.error).toContain("Found import: './api/api.health'");
    });

    test("should allow imports from non-api paths", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts",
            content: `
import { db } from '@/database/users/conn.users';
import { someFn } from '@/function/fn.helper';
import { Component } from '@/component/Button';

export default function test() {
    return db;
}
            `
        });

        expect(result).toBeUndefined();
    });

    test("should handle Windows paths", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake\\src\\controller\\ctrl.users.ts",
            content: `
import { apiHealth } from '@/api/api.health';

export default function test() {
    return apiHealth;
}
            `
        });

        expect(result?.error).toContain("API routes must NOT be imported directly");
    });

    test("should allow Windows path for api-router.ts", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake\\src\\api-router.ts",
            content: `
import { Elysia } from 'elysia';
import { apiHealth } from './api/api.health';

export default new Elysia({ name: 'api-router' })
  .use(apiHealth);
            `
        });

        expect(result).toBeUndefined();
    });

    test("should allow Windows path for files in src/api/", async () => {
        const result = await ruleNoApiRoutesInRoutes({
            ...baseArgs,
            filePath: "C:\\Users\\omarezzat\\Workspace\\metaframework\\bake\\src\\api\\api.users.ts",
            content: `
import { Elysia } from 'elysia';
import { apiAuth } from './api.auth';

export const apiUsers = new Elysia({ prefix: '/users' });
            `
        });

        expect(result).toBeUndefined();
    });
});
