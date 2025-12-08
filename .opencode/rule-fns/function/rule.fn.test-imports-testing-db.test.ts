import { expect, test, describe } from "bun:test";
import { ruleTestFileImportsTestingDb } from "./rule.fn.test-imports-testing-db";

describe("ruleTestFileImportsTestingDb", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-users.test.ts"
    };

    test("should allow test file with testing db import", async () => {
        const content = `
            import { createTestingUsersDb } from '@/src/database/users/conn.users.ts';
            import { fxGetUsers } from './fx.get-users';

            test('should get users', () => {
                const portal = { db: createTestingUsersDb() };
                const [users, error] = fxGetUsers(portal, {});
                expect(error).toBeNull();
                expect(users).toEqual([]);
            });
        `;

        const result = await ruleTestFileImportsTestingDb({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should skip when corresponding function file doesn't exist", async () => {
        const content = `
            import { fxGetUsers } from './fx.get-users';

            test('should get users', () => {
                const portal = { db: mockDb };
                const [users, error] = fxGetUsers(portal, {});
                expect(error).toBeNull();
                expect(users).toEqual([]);
            });
        `;

        const result = await ruleTestFileImportsTestingDb({
            ...baseArgs,
            content
        });

        // The corresponding function file doesn't exist, so rule doesn't apply
        expect(result).toBeUndefined();
    });

    test("should skip if function file doesn't exist", async () => {
        const result = await ruleTestFileImportsTestingDb({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/non-existent.test.ts",
            content: `
                import { fxNonExistent } from './fx.non-existent';

                test('should work', () => {
                    expect(true).toBe(true);
                });
            `
        });

        expect(result).toBeUndefined();
    });

    test("should allow files outside function directory", async () => {
        const result = await ruleTestFileImportsTestingDb({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/api/users.ts",
            content: ""
        });

        expect(result).toBeUndefined();
    });

    test("should skip if function doesn't use database", async () => {
        const content = `
            import { fnCalculateTotal } from './fn.calculate-total';

            test('should calculate total', () => {
                const [total, error] = fnCalculateTotal({ items: [] });
                expect(error).toBeNull();
                expect(total).toBe(0);
            });
        `;

        const result = await ruleTestFileImportsTestingDb({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/math/fn.calculate-total.test.ts",
            content
        });

        expect(result).toBeUndefined();
    });

    test("should handle complex database names", async () => {
        const content = `
            import { createTestingUserProfilesDb } from '@/src/database/user-profiles/conn.user-profiles.ts';
            import { fxGetProfiles } from './fx.get-profiles';

            test('should get profiles', () => {
                const portal = { db: createTestingUserProfilesDb() };
                const [profiles, error] = fxGetProfiles(portal, {});
                expect(error).toBeNull();
                expect(profiles).toEqual([]);
            });
        `;

        const result = await ruleTestFileImportsTestingDb({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-profiles.test.ts",
            content
        });

        expect(result).toBeUndefined();
    });
});
