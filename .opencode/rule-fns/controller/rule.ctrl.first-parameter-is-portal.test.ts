import { expect, test, describe } from "bun:test";
import { ruleControllerFirstParameterIsPortal } from "./rule.ctrl.first-parameter-is-portal";

describe("ruleControllerFirstParameterIsPortal", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts"
    };

    test("should allow TPortal as first parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow portal type as first parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: UserPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TPortal in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TPortal in function expression", async () => {
        const content = `
            const ctrlUsers = function(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            };
            export default ctrlUsers;
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject non-portal first parameter", async () => {
        const content = `
            export default function ctrlUsers(req: Request, args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("First parameter must be a portal type (TPortal), found: Request");
        expect(result?.error).toContain("You might want to read .opencode/agent/controller-builder.md");
    });

    test("should reject any type as first parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: any, args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("First parameter must be a portal type (TPortal), found: any");
    });

    test("should reject missing type annotation", async () => {
        const content = `
            export default function ctrlUsers(portal, args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("First parameter must be a portal type (TPortal), found: any");
    });

    test("should reject single parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: Request): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("First parameter must be a portal type (TPortal), found: Request");
    });

    test("should reject database type as first parameter", async () => {
        const content = `
            export default function ctrlUsers(db: Database, args: TArgs): TErrTuple<User[]> {
                return [db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerFirstParameterIsPortal({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("First parameter must be a portal type (TPortal), found: Database");
    });
});