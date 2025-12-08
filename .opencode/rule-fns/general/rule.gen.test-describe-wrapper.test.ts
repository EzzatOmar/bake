import { expect, test, describe } from "bun:test";
import { ruleGenTestDescribeWrapper } from "./rule.gen.test-describe-wrapper";

describe("ruleGenTestDescribeWrapper", () => {
    const baseArgs = {
        directory: "/Users/omarezzat/Workspace/metaframework/bake",
        content: ""
    };

    test("should allow single describe with nested tests", async () => {
        const content = `
            describe("MyModule", () => {
                test("should work", () => {
                    expect(true).toBe(true);
                });
                
                test("should also work", () => {
                    expect(false).toBe(false);
                });
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result).toBeUndefined();
    });

    test("should allow nested describe blocks", async () => {
        const content = `
            describe("MyModule", () => {
                describe("nested", () => {
                    test("should work", () => {
                        expect(true).toBe(true);
                    });
                });
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result).toBeUndefined();
    });

    test("should reject top-level test calls", async () => {
        const content = `
            test("should work", () => {
                expect(true).toBe(true);
            });
            
            describe("MyModule", () => {
                test("should also work", () => {
                    expect(false).toBe(false);
                });
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result?.error).toContain("Top-level test() calls are not allowed in test files");
        expect(result?.error).toContain("Found 1 top-level test() call(s)");
        expect(result?.error).toContain("All test() calls must be wrapped inside a single top-level describe() block");
        expect(result?.error).toContain("Example:\ndescribe(\"ModuleName\", () => {\n  test(\"should do something\", () => { ... });\n});");
    });

    test("should reject multiple top-level test calls", async () => {
        const content = `
            test("should work 1", () => {
                expect(true).toBe(true);
            });
            
            test("should work 2", () => {
                expect(false).toBe(false);
            });
            
            describe("MyModule", () => {
                test("should also work", () => {
                    expect(true).toBe(true);
                });
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result?.error).toContain("Top-level test() calls are not allowed in test files");
        expect(result?.error).toContain("Found 2 top-level test() call(s)");
    });

    test("should reject no describe blocks", async () => {
        const content = `
            test("should work", () => {
                expect(true).toBe(true);
            });
            
            test("should also work", () => {
                expect(false).toBe(false);
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result?.error).toContain("Top-level test() calls are not allowed in test files");
        expect(result?.error).toContain("All test() calls must be wrapped inside a single top-level describe() block");
        expect(result?.error).toContain("Example:");
    });

    test("should reject multiple describe blocks", async () => {
        const content = `
            describe("Module1", () => {
                test("should work", () => {
                    expect(true).toBe(true);
                });
            });
            
            describe("Module2", () => {
                test("should also work", () => {
                    expect(false).toBe(false);
                });
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result?.error).toContain("Test files must have exactly ONE top-level describe() block");
        expect(result?.error).toContain("Found 2 top-level describe() calls");
        expect(result?.error).toContain("Please consolidate all tests into a single describe() block");
        expect(result?.error).toContain("You can use nested describe() blocks inside the single top-level describe()");
    });

    test("should ignore test calls in strings", async () => {
        const content = `
            describe("MyModule", () => {
                test("should work", () => {
                    const code = "test('should not be detected');";
                    expect(code).toContain("test");
                });
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result).toBeUndefined();
    });

    test("should ignore test calls in template literals", async () => {
        const content = `
            describe("MyModule", () => {
                test("should work", () => {
                    const template = \`test('should not be detected')\`;
                    expect(template).toContain("test");
                });
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result).toBeUndefined();
    });

    test("should ignore test calls in comments", async () => {
        const content = `
            // test('this is a comment')
            /* test('this is also a comment') */
            
            describe("MyModule", () => {
                test("should work", () => {
                    expect(true).toBe(true);
                });
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.test.ts",
            content
        });

        expect(result).toBeUndefined();
    });

    test("should skip non-test files", async () => {
        const content = `
            test("should work", () => {
                expect(true).toBe(true);
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/src/function/user/fn.get-users.ts",
            content
        });

        expect(result).toBeUndefined();
    });

    test("should skip files outside src", async () => {
        const content = `
            test("should work", () => {
                expect(true).toBe(true);
            });
        `;

        const result = await ruleGenTestDescribeWrapper({
            ...baseArgs,
            filePath: "/Users/omarezzat/Workspace/metaframework/bake/docs/test-example.test.ts",
            content
        });

        expect(result).toBeUndefined();
    });
});