import { expect, test, describe } from "bun:test";
import { ruleTxParameterCount } from "./rule.tx.parameter-count";

describe("ruleTxParameterCount", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/tx.create-user.ts"
    };

    test("should allow exactly 2 parameters", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs): TErrTriple<User> {
                return [portal.db.insert(args.user), null, []];
            }
        `;

        const result = await ruleTxParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow 2 parameters in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTriple<User> => {
                return [portal.db.insert(args.user), null, []];
            };
        `;

        const result = await ruleTxParameterCount({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject single parameter", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal): TErrTriple<User> {
                return [null, { code: 'ERROR' }, []];
            }
        `;

        const result = await ruleTxParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function must have exactly 2 parameters (TPortal, TArgs)");
        expect(result?.error).toContain("Found: 1 parameters");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject three parameters", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs, extra: string): TErrTriple<User> {
                return [portal.db.insert(args.user), null, []];
            }
        `;

        const result = await ruleTxParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function must have exactly 2 parameters (TPortal, TArgs)");
        expect(result?.error).toContain("Found: 3 parameters");
    });

    test("should reject zero parameters", async () => {
        const content = `
            export default function txCreateUser(): TErrTriple<User> {
                return [null, { code: 'ERROR' }, []];
            }
        `;

        const result = await ruleTxParameterCount({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function must have exactly 2 parameters (TPortal, TArgs)");
        expect(result?.error).toContain("Found: 0 parameters");
    });

    test("should allow parameters without explicit type annotations", async () => {
        const content = `
            export default function txCreateUser(portal, args): TErrTriple<User> {
                return [null, { code: 'ERROR' }, []];
            }
        `;

        const result = await ruleTxParameterCount({
            ...baseArgs,
            content
        });

        // Parameter count is 2, so this passes the count check
        // Type annotation checking is a different rule
        expect(result).toBeUndefined();
    });
});