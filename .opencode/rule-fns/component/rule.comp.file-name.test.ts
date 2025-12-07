import { expect, test, describe } from "bun:test";
import { ruleComponentFileName } from "./rule.comp.file-name";

describe("ruleComponentFileName", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow valid component file names", async () => {
        const result = await ruleComponentFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/component/comp.button.tsx"
        });

        expect(result?.message).toBe("Component file name comp.button.tsx is valid");
    });

    test("should reject component files without comp. prefix", async () => {
        const result = await ruleComponentFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/component/button.tsx"
        });

        expect(result?.error).toContain("Component files ending with .tsx must start with 'comp.'");
        expect(result?.error).toContain("Found: button.tsx");
    });

    test("should ignore non-.tsx files", async () => {
        const result = await ruleComponentFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/component/button.css"
        });

        expect(result).toBeUndefined();
    });

    test("should reject .tsx files outside component folder without comp. prefix", async () => {
        const result = await ruleComponentFileName({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/pages/button.tsx"
        });

        // The rule applies to all .tsx files, regardless of folder
        expect(result?.error).toContain("Component files ending with .tsx must start with 'comp.'");
        expect(result?.error).toContain("Found: button.tsx");
    });
});