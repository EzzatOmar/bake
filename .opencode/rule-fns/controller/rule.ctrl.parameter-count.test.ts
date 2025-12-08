import { expect, test, describe } from "bun:test";
import { ruleControllerParameterCount } from "./rule.ctrl.parameter-count";

describe("ruleControllerParameterCount", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts"
    };

    test("should allow exactly 2 parameters", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow exactly 2 parameters in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
        `;

        const result = await ruleControllerParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow exactly 2 parameters in function expression", async () => {
        const content = `
            const ctrlUsers = function(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            };
            export default ctrlUsers;
        `;

        const result = await ruleControllerParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject single parameter", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must have exactly 2 parameters (TPortal, TArgs), found 1");
        expect(result?.error).toContain("You might want to read .opencode/agent/controller-builder.md");
    });

    test("should reject three parameters", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs, extra: string): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must have exactly 2 parameters (TPortal, TArgs), found 3");
    });

    test("should reject zero parameters", async () => {
        const content = `
            export default function ctrlUsers(): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleControllerParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must have exactly 2 parameters (TPortal, TArgs), found 0");
    });

    test("should reject four parameters", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs, extra1: string, extra2: number): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller function must have exactly 2 parameters (TPortal, TArgs), found 4");
    });

    test("should allow parameters without explicit type annotations", async () => {
        const content = `
            export default function ctrlUsers(portal, args): TErrTuple<User[]> {
                return [[], null];
            }
        `;

        const result = await ruleControllerParameterCount({
            ...baseArgs,
            content
        });

        // Parameter count is 2, which is correct. Type checking is a different rule.
        expect(result).toBeUndefined();
    });
});