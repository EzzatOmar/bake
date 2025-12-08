import { expect, test, describe } from "bun:test";
import { ruleControllerReturnType } from "./rule.ctrl.return-type";

describe("ruleControllerReturnType", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts"
    };

    test("should allow TErrTuple return type", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TErrTuple with generic", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<{ users: User[] }> {
                return [{ users: portal.db.query("SELECT * FROM users") }, null];
            }
        `;

        const result = await ruleControllerReturnType({
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

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TErrTuple in function expression", async () => {
        const content = `
            const ctrlUsers = function(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            };
            export default ctrlUsers;
        `;

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing return type", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs) {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must have an explicit return type");
        expect(result?.error).toContain("Expected: TErrTuple<Data>");
        expect(result?.error).toContain("You might want to read .opencode/agent/ctrl-builder.md");
    });

    test("should allow Promise return type that wraps TErrTuple", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): Promise<TErrTuple<User[]>> {
                return Promise.resolve([portal.db.query("SELECT * FROM users"), null]);
            }
        `;

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        // Promise<TErrTuple<...>> contains "TErrTuple" so it passes
        expect(result).toBeUndefined();
    });

    test("should reject Promise union return type", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): Promise<[User[], null] | [null, TErrorEntry]> {
                return Promise.resolve([portal.db.query("SELECT * FROM users"), null]);
            }
        `;

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: Promise<[User[], null] | [null, TErrorEntry]>");
    });

    test("should reject union return type", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): [User[], null] | [null, TErrorEntry] {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: [User[], null] | [null, TErrorEntry]");
    });

    test("should reject array return type", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): User[] {
                return portal.db.query("SELECT * FROM users");
            }
        `;

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: User[]");
    });

    test("should reject void return type", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): void {
                console.log(portal.db.query("SELECT * FROM users"));
            }
        `;

        const result = await ruleControllerReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must return TErrTuple<Data>");
        expect(result?.error).toContain("Found: void");
    });
});