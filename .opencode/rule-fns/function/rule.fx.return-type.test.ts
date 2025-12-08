import { expect, test, describe } from "bun:test";
import { ruleFxReturnType } from "./rule.fx.return-type";

describe("ruleFxReturnType", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fx.get-users.ts"
    };

    test("should allow TErrTuple return type", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TErrTuple with generic", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs): TErrTuple<{ users: User[] }> {
                return [{ users: portal.db.query("SELECT * FROM users") }, null];
            }
        `;

        const result = await ruleFxReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TErrTuple in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
        `;

        const result = await ruleFxReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing return type", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs) {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleFxReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function must have an explicit return type");
        expect(result?.error).toContain("Expected: TErrTuple<Data>");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject non-TErrTuple return type", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs): User[] {
                return portal.db.query("SELECT * FROM users");
            }
        `;

        const result = await ruleFxReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: User[]");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should allow Promise return type that wraps TErrTuple", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs): Promise<TErrTuple<User[]>> {
                return Promise.resolve([portal.db.query("SELECT * FROM users"), null]);
            }
        `;

        const result = await ruleFxReturnType({
            ...baseArgs,
            content
        });

        // Promise<TErrTuple<...>> contains "TErrTuple" so it passes
        // If we want to reject wrapped TErrTuple, we need a more sophisticated check
        expect(result).toBeUndefined();
    });

    test("should reject TErrTriple return type", async () => {
        const content = `
            export default function fxGetUsers(portal: TPortal, args: TArgs): TErrTriple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null, []];
            }
        `;

        const result = await ruleFxReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Effectful function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: TErrTriple<User[]>");
    });
});