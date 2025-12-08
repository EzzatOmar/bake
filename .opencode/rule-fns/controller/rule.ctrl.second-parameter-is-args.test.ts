import { expect, test, describe } from "bun:test";
import { ruleControllerSecondParameterIsArgs } from "./rule.ctrl.second-parameter-is-args";

describe("ruleControllerSecondParameterIsArgs", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts"
    };

    test("should allow TArgs as second parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow args type as second parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: UserArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TArgs in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TArgs in function expression", async () => {
        const content = `
            const ctrlUsers = function(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            };
            export default ctrlUsers;
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject non-args second parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, req: Request): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Second parameter must be an args type (TArgs), found: Request");
        expect(result?.error).toContain("You might want to read .opencode/agent/controller-builder.md");
    });

    test("should reject any type as second parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: any): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Second parameter must be an args type (TArgs), found: any");
    });

    test("should reject missing type annotation", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Second parameter must be an args type (TArgs), found: any");
    });

    test("should skip when only one parameter exists", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        // Rule doesn't apply when there's only 1 parameter (parameter-count rule handles this)
        expect(result).toBeUndefined();
    });

    test("should reject database type as second parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, db: Database): TErrTuple<User[]> {
                return [db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Second parameter must be an args type (TArgs), found: Database");
    });

    test("should reject Request type as second parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, request: Request): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerSecondParameterIsArgs({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Second parameter must be an args type (TArgs), found: Request");
    });
});