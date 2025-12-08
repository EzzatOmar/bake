import { expect, test, describe } from "bun:test";
import { ruleControllerFileName } from "./rule.ctrl.file-name";

describe("ruleControllerFileName", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow valid ctrl. prefix", async () => {
        const result = await ruleControllerFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow nested ctrl. prefix", async () => {
        const result = await ruleControllerFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.users.create.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should allow ctrl. with multiple dots", async () => {
        const result = await ruleControllerFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrl.user.profile.ts"
        });

        expect(result).toBeUndefined();
    });

    test("should reject files without ctrl. prefix", async () => {
        const result = await ruleControllerFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/users.ts"
        });

        expect(result?.error).toContain("Controller file names must start with 'ctrl.'");
        expect(result?.error).toContain("Found: users.ts");
        expect(result?.error).toContain("You might want to read .opencode/agent/ctrl-builder.md");
    });

    test("should reject files with different prefix", async () => {
        const result = await ruleControllerFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/handler.users.ts"
        });

        expect(result?.error).toContain("Controller file names must start with 'ctrl.'");
        expect(result?.error).toContain("Found: handler.users.ts");
    });

    test("should reject files with prefix but not ctrl.", async () => {
        const result = await ruleControllerFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/controller.users.ts"
        });

        expect(result?.error).toContain("Controller file names must start with 'ctrl.'");
        expect(result?.error).toContain("Found: controller.users.ts");
    });

    test("should reject files starting with ctrl but not ctrl.", async () => {
        const result = await ruleControllerFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/ctrlusers.ts"
        });

        expect(result?.error).toContain("Controller file names must start with 'ctrl.'");
        expect(result?.error).toContain("Found: ctrlusers.ts");
    });

    test("should reject files with uppercase prefix", async () => {
        const result = await ruleControllerFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/controller/Ctrl.users.ts"
        });

        expect(result?.error).toContain("Controller file names must start with 'ctrl.'");
        expect(result?.error).toContain("Found: Ctrl.users.ts");
    });
});