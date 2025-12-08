import { expect, test, describe } from "bun:test";
import { ruleTxReturnType } from "./rule.tx.return-type";

describe("ruleTxReturnType", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/tx.create-user.ts"
    };

    test("should allow TErrTriple return type", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs): TErrTriple<User> {
                return [portal.db.insert(args.user), null, []];
            }
        `;

        const result = await ruleTxReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TErrTriple with generic", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs): TErrTriple<{ user: User }> {
                return [{ user: portal.db.insert(args.user) }, null, []];
            }
        `;

        const result = await ruleTxReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow TErrTriple in arrow function", async () => {
        const content = `
            export default (portal: TPortal, args: TArgs): TErrTriple<User> => {
                return [portal.db.insert(args.user), null, []];
            };
        `;

        const result = await ruleTxReturnType({
            ...baseArgs,
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject missing return type", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs) {
                return [portal.db.insert(args.user), null, []];
            }
        `;

        const result = await ruleTxReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function must have an explicit return type");
        expect(result?.error).toContain("Expected: TErrTriple<Data>");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should reject TErrTuple return type", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs): TErrTuple<User> {
                return [portal.db.insert(args.user), null];
            }
        `;

        const result = await ruleTxReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function must return TErrTriple<Data>");
        expect(result?.error).toContain("Found: TErrTuple<User>");
        expect(result?.error).toContain("You might want to read .opencode/agent/function-builder.md");
    });

    test("should allow Promise return type that wraps TErrTriple", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs): Promise<TErrTriple<User>> {
                return Promise.resolve([portal.db.insert(args.user), null, []]);
            }
        `;

        const result = await ruleTxReturnType({
            ...baseArgs,
            content
        });

        // Promise<TErrTriple<...>> contains "TErrTriple" so it passes
        // If we want to reject wrapped TErrTriple, we need a more sophisticated check
        expect(result).toBeUndefined();
    });

    test("should reject union return type", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs): [User, null] | [null, Error] {
                return [portal.db.insert(args.user), null];
            }
        `;

        const result = await ruleTxReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function must return TErrTriple<Data>");
        expect(result?.error).toContain("Found: [User, null] | [null, Error]");
    });

    test("should reject void return type", async () => {
        const content = `
            export default function txCreateUser(portal: TPortal, args: TArgs): void {
                console.log(args.user);
            }
        `;

        const result = await ruleTxReturnType({
            ...baseArgs,
            content
        });

        expect(result?.error).toContain("Transactional function must return TErrTriple<Data>");
        expect(result?.error).toContain("Found: void");
    });
});