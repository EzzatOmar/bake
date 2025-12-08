import { expect, test, describe } from "bun:test";
import { ruleTxFirstParameterType } from "./rule.tx.first-parameter-type";

describe("ruleTxFirstParameterType", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/tx.create-user.ts"
    };

    test("should allow Portal type as first parameter", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs): TErrTriple<User> {
                return [portal.db.insert(args.user), null, []];
            }
        `;

        const result = await ruleTxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow UserPortal type as first parameter", async () => {
        const content = `
            export default function txCreateUser(portal: UserPortal, args: TArgs): TErrTriple<User> {
                return [portal.db.insert(args.user), null, []];
            }
        `;

        const result = await ruleTxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow Portal type in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTriple<User> => {
                return [portal.db.insert(args.user), null, []];
            };
        `;

        const result = await ruleTxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject non-Portal first parameter", async () => {
        const content = `
            export default function txCreateUser(db: Database, args: TArgs): TErrTriple<User> {
                return [db.insert(args.user), null, []];
            }
        `;

        const result = await ruleTxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function first parameter must be a Portal type (contains 'Portal')");
        expect(result?.error).toContain("Found: Database");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject Request type as first parameter", async () => {
        const content = `
            export default function txCreateUser(req: Request, args: TArgs): TErrTriple<User> {
                return [null, { code: 'ERROR' }, []];
            }
        `;

        const result = await ruleTxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function first parameter must be a Portal type (contains 'Portal')");
        expect(result?.error).toContain("Found: Request");
    });

    test("should reject any type as first parameter", async () => {
        const content = `
            export default function txCreateUser(portal: any, args: TArgs): TErrTriple<User> {
                return [null, { code: 'ERROR' }, []];
            }
        `;

        const result = await ruleTxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function first parameter must be a Portal type (contains 'Portal')");
        expect(result?.error).toContain("Found: any");
    });

    test("should reject missing type annotation", async () => {
        const content = `
            export default function txCreateUser(portal, args: TArgs): TErrTriple<User> {
                return [null, { code: 'ERROR' }, []];
            }
        `;

        const result = await ruleTxFirstParameterType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function first parameter must be a Portal type (contains 'Portal')");
        expect(result?.error).toContain("Found: any");
    });

    test("should reject single parameter", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal): TErrTriple<User> {
                return [null, { code: 'ERROR' }, []];
            }
        `;

        const result = await ruleTxFirstParameterType({
            ...baseArgs,
            content
        });

        // This should pass because the rule only checks the first parameter type, not count
        // Parameter count is checked by rule.tx.parameter-count
        expect(result).toBeUndefined();
    });
});