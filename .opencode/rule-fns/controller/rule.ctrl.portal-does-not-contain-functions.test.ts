import { expect, test, describe } from "bun:test";
import { rulePortalDoesNotContainFunctions } from "./rule.ctrl.portal-does-not-contain-functions";

describe("rulePortalDoesNotContainFunctions", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts"
    };

    test("should allow TPortal without function imports", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }

            type TPortal = {
                db: Database;
                cache: CacheService;
            };
        `;

        const result = await rulePortalDoesNotContainFunctions({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow function imports not in TPortal", async () => {
        const content = `
            import { fxGetUsers } from '../function/fx.get-users';
            
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return fxGetUsers(portal.db);
            }

            type TPortal = {
                db: Database;
                cache: CacheService;
            };
        `;

        const result = await rulePortalDoesNotContainFunctions({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow no TPortal type defined", async () => {
        const content = `
            import { fxGetUsers } from '../function/fx.get-users';
            
            export default function ctrlUsers(portal: any, args: TArgs): TErrTuple<User[]> {
                return fxGetUsers(portal.db);
            }
        `;

        const result = await rulePortalDoesNotContainFunctions({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow no function imports", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }

            type TPortal = {
                db: Database;
                fxGetUsers: Function;
            };
        `;

        const result = await rulePortalDoesNotContainFunctions({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject function imports in TPortal", async () => {
        const content = `
            import { fxGetUsers } from '../function/fx.get-users';
            
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return portal.fxGetUsers();
            }

            type TPortal = {
                db: Database;
                fxGetUsers: typeof fxGetUsers;
            };
        `;

        const result = await rulePortalDoesNotContainFunctions({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("TPortal must not contain function imports. Found: fxGetUsers");
        expect(result?.error).toContain("Controllers should import and call functions directly, not pass them through TPortal");
        expect(result?.error).toContain("TPortal should only contain variables (like db connections) that need to be mocked for testing");
        expect(result?.error).toContain("You might want to read .opencode/agent/ctrl-builder.md");
    });

    test("should reject multiple function imports in TPortal", async () => {
        const content = `
            import { fxGetUsers, fxCreateUser } from '../function/fx.get-users';
            
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return portal.fxGetUsers();
            }

            type TPortal = {
                db: Database;
                fxGetUsers: typeof fxGetUsers;
                fxCreateUser: typeof fxCreateUser;
            };
        `;

        const result = await rulePortalDoesNotContainFunctions({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("TPortal must not contain function imports. Found: fxGetUsers, fxCreateUser");
    });

    test("should reject function import with alias in TPortal", async () => {
        const content = `
            import { fxGetUsers as getUsers } from '../function/fx.get-users';
            
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return portal.getUsers();
            }

            type TPortal = {
                db: Database;
                getUsers: typeof getUsers;
            };
        `;

        const result = await rulePortalDoesNotContainFunctions({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("TPortal must not contain function imports. Found: getUsers");
    });

    test("should reject function from nested path in TPortal", async () => {
        const content = `
            import { fxGetUsers } from '../src/function/user/fx.get-users';
            
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return portal.fxGetUsers();
            }

            type TPortal = {
                db: Database;
                fxGetUsers: typeof fxGetUsers;
            };
        `;

        const result = await rulePortalDoesNotContainFunctions({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("TPortal must not contain function imports. Found: fxGetUsers");
    });
});