import { expect, test, describe } from "bun:test";
import { ruleControllerDefaultExportIsFunction } from "./rule.ctrl.default-export-is-function";

describe("ruleControllerDefaultExportIsFunction", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts"
    };

    test("should allow function expression default export", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow arrow function default export", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow function expression assigned to variable", async () => {
        const content = `
            const ctrlUsers = function(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            };
            export default ctrlUsers;
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow arrow function assigned to variable", async () => {
        const content = `
            const ctrlUsers = (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
            export default ctrlUsers;
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject object default export", async () => {
        const content = `
            export default {
                getUsers: () => [],
                createUser: () => ({ id: 1 })
            };
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller default export must be a function");
        expect(result?.error).toContain("You might want to read .opencode/agent/controller-builder.md");
    });

    test("should reject class default export", async () => {
        const content = `
            export default class UserController {
                getUsers() {
                    return [];
                }
            }
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller default export must be a function");
    });

    test("should reject string default export", async () => {
        const content = `
            export default "not a function";
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller default export must be a function");
    });

    test("should reject number default export", async () => {
        const content = `
            export default 42;
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller default export must be a function");
    });

    test("should reject variable that is not a function", async () => {
        const content = `
            const ctrlUsers = { getUsers: () => [] };
            export default ctrlUsers;
        `;

        const result = await ruleControllerDefaultExportIsFunction({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller default export must be a function");
    });
});