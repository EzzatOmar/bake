import { expect, test, describe } from "bun:test";
import { ruleDbPortalType } from "./rule.fn.db-portal-type";

describe("ruleDbPortalType", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-users.ts"
    };

    test("should skip when no database variables exist in project", async () => {
        const content = `
            export type TPortal = {
                db: typeof usersDb;
            };

            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDbPortalType({
            ...baseArgs,
            content
        });

        // No database variables exist in the project, so rule doesn't apply
        expect(result).toBeUndefined();
    });

    test("should skip when no database variables exist (invalid name)", async () => {
        const content = `
            export type TPortal = {
                db: typeof invalidDb;
            };

            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDbPortalType({
            ...baseArgs,
            content
        });

        // No database variables exist in the project, so rule doesn't apply
        expect(result).toBeUndefined();
    });

    test("should skip if no TPortal defined", async () => {
        const content = `
            export default function fxGetUsers(portal: any): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDbPortalType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should skip if no db property in TPortal", async () => {
        const content = `
            export type TPortal = {
                cache: CacheService;
            };

            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleDbPortalType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should skip when no database variables exist (complex names)", async () => {
        const content = `
            export type TPortal = {
                db: typeof userProfilesDb;
            };

            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDbPortalType({
            ...baseArgs,
            content
        });

        // No database variables exist in the project, so rule doesn't apply
        expect(result).toBeUndefined();
    });

    test("should skip when no database variables exist (multiple properties)", async () => {
        const content = `
            export type TPortal = {
                db: typeof usersDb;
                cache: CacheService;
                logger: Logger;
            };

            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDbPortalType({
            ...baseArgs,
            content
        });

        // No database variables exist in the project, so rule doesn't apply
        expect(result).toBeUndefined();
    });

    test("should skip when no database variables exist (whitespace)", async () => {
        const content = `
            export type TPortal = {
                db    :   typeof   usersDb   ;
            };

            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleDbPortalType({
            ...baseArgs,
            content
        });

        // No database variables exist in the project, so rule doesn't apply
        expect(result).toBeUndefined();
    });
});
