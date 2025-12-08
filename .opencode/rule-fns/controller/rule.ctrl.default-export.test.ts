import { expect, test, describe } from "bun:test";
import { ruleControllerDefaultExport } from "./rule.ctrl.default-export";

describe("ruleControllerDefaultExport", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts"
    };

    test("should allow default export function", async () => {
        const content = `
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerDefaultExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow default export arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
        `;

        const result = await ruleControllerDefaultExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow default export variable", async () => {
        const content = `
            const ctrlUsers = (portal: TPortal, args: TArgs): TErrTuple<User[]> => {
                return [portal.db.query("SELECT * FROM users"), null];
            };
            export default ctrlUsers;
        `;

        const result = await ruleControllerDefaultExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow default export with named exports", async () => {
        const content = `
            export type TPortal = { db: Database };
            export type TArgs = { id: string };
            
            export default function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerDefaultExport({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing default export", async () => {
        const content = `
            export function ctrlUsers(portal: TPortal, args: TArgs): TErrTuple<User[]> {
                return [portal.db.query("SELECT * FROM users"), null];
            }
        `;

        const result = await ruleControllerDefaultExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller must have a default export function");
        expect(result?.error).toContain("You might want to read .opencode/agent/controller-builder.md");
    });

    test("should reject only named exports", async () => {
        const content = `
            export type TPortal = { db: Database };
            export type TArgs = { id: string };
            export const helper = () => {};
        `;

        const result = await ruleControllerDefaultExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller must have a default export function");
    });

    test("should reject empty file", async () => {
        const content = "";

        const result = await ruleControllerDefaultExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller must have a default export function");
    });

    test("should reject only export equals", async () => {
        const content = `
            export = function ctrlUsers() {
                return [];
            };
        `;

        const result = await ruleControllerDefaultExport({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Controller must have a default export function");
    });
});