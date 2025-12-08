import { expect, test, describe } from "bun:test";
import { ruleFxParameterCount } from "./rule.fx.parameter-count";

describe("ruleFxParameterCount", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-users.ts"
    };

    test("should allow exactly 2 parameters", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow 2 parameters in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
        `;

        const result = await ruleFxParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject single parameter", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function must have exactly 2 parameters (TPortal, TArgs)");
        expect(result?.error).toContain("Found: 1 parameters");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject three parameters", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs, extra: string): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function must have exactly 2 parameters (TPortal, TArgs)");
        expect(result?.error).toContain("Found: 3 parameters");
    });

    test("should reject zero parameters", async () => {
        const content = `
            export default function fxGetUsers(): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFxParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function must have exactly 2 parameters (TPortal, TArgs)");
        expect(result?.error).toContain("Found: 0 parameters");
    });

    test("should allow parameters without explicit type annotations", async () => {
        const content = `
            export default function fxGetUsers(portal, args): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleFxParameterCount({
            ...baseArgs,
            content
        });

        // Parameter count is 2, so this passes the count check
        // Type annotation checking is a different rule
        expect(result).toBeUndefined();
    });
});