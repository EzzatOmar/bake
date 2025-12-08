import { expect, test, describe } from "bun:test";
import { ruleFxFirstParameterType } from "./rule.fx.first-parameter-type";

describe("ruleFxFirstParameterType", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-users.ts"
    };

    test("should allow Portal type as first parameter", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow UserPortal type as first parameter", async () => {
        const content = `
            export default function fxGetUsers(portal: UserPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow Portal type in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
        `;

        const result = await ruleFxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject non-Portal first parameter", async () => {
        const content = `
            export default function fxGetUsers(db: Database, args: TArgs): TErrTuple<User[]> {
                return [db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function first parameter must be a Portal type (contains 'Portal')");
        expect(result?.error).toContain("Found: Database");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject Request type as first parameter", async () => {
        const content = `
            export default function fxGetUsers(req: Request, args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function first parameter must be a Portal type (contains 'Portal')");
        expect(result?.error).toContain("Found: Request");
    });

    test("should reject any type as first parameter", async () => {
        const content = `
            export default function fxGetUsers(portal: any, args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function first parameter must be a Portal type (contains 'Portal')");
        expect(result?.error).toContain("Found: any");
    });

    test("should reject missing type annotation", async () => {
        const content = `
            export default function fxGetUsers(portal, args: TArgs): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function first parameter must be a Portal type (contains 'Portal')");
        expect(result?.error).toContain("Found: any");
    });

    test("should reject single parameter", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxFirstParameterType({
            ...baseArgs,
            content
        });

        // This should pass because the rule only checks the first parameter type, not count
        // Parameter count is checked by rule.fx.parameter-count
        expect(result).toBeUndefined();
    });
});