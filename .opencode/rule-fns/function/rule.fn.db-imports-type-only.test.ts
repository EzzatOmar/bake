import { expect, test, describe } from "bun:test";
import { ruleDatabaseConnectionImportsAreTypeOnly } from "./rule.fn.db-imports-type-only";

describe("ruleDatabaseConnectionImportsAreTypeOnly", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-users.ts"
    };

    test("should allow type-only database imports", async () => {
        const content = `
            import type { db } from '@/src/database/users/conn.users.ts';
            
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDatabaseConnectionImportsAreTypeOnly({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow inline type database imports", async () => {
        const content = `
            import { type db } from '@/src/database/users/conn.users.ts';
            
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDatabaseConnectionImportsAreTypeOnly({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow mixed type and value imports", async () => {
        const content = `
            import { type db, SOME_CONSTANT } from '@/src/database/users/conn.users.ts';
            
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDatabaseConnectionImportsAreTypeOnly({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject non-type-only database imports", async () => {
        const content = `
            import { db } from '@/src/database/users/conn.users.ts';
            
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDatabaseConnectionImportsAreTypeOnly({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Database connection imports must be type-only");
        expect(result?.error).toContain("Found non-type-only import: import { db } from '@/src/database/users/conn.users.ts'");
        expect(result?.error).toContain("Use 'import type { db } from \"@/src/database/users/conn.users.ts\"'");
        expect(result?.error).toContain("Database connections should only be used for typing, not runtime values");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject default database imports", async () => {
        const content = `
            import db from '@/src/database/users/conn.users.ts';
            
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDatabaseConnectionImportsAreTypeOnly({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Database connection imports must be type-only");
        expect(result?.error).toContain("Found non-type-only import: import db from '@/src/database/users/conn.users.ts'");
    });

    test("should reject mixed non-type database imports", async () => {
        const content = `
            import { db, helper } from '@/src/database/users/conn.users.ts';
            
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDatabaseConnectionImportsAreTypeOnly({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Database connection imports must be type-only");
        expect(result?.error).toContain("Found non-type-only import: import { db, helper } from '@/src/database/users/conn.users.ts'");
        expect(result?.error).toContain("Use 'import type { db, helper } from \"@/src/database/users/conn.users.ts\"'");
    });

    test("should allow non-database imports", async () => {
        const content = `
            import { someUtil } from '../utils/helpers';
            import { CONSTANT } from '../constants';
            
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [someUtil(), null];
            }
        `;

        const result = await ruleDatabaseConnectionImportsAreTypeOnly({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject namespace database imports", async () => {
        const content = `
            import * as db from '@/src/database/users/conn.users.ts';
            
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDatabaseConnectionImportsAreTypeOnly({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Database connection imports must be type-only");
        expect(result?.error).toContain("Found non-type-only import: import * as db from '@/src/database/users/conn.users.ts'");
    });
});