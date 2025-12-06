import { describe, expect, test } from "bun:test";
import {
    assertDatabaseFileName,
    assertDatabaseFileNameMatchesDirectory,
    assertDatabasePathDepth,
    checkDbBeforeWrite,
    checkDbBeforeEdit,
    checkDbAfterWrite,
    checkDbAfterEdit,
} from "./database-checks";
import path from "node:path";

const mockDirectory = "/Users/test/project";

describe("assertDatabaseFileName", () => {
    test("allows conn.<dbname>.ts files", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/magic-cards/conn.magic-cards.ts"),
            });
        }).not.toThrow();
    });

    test("allows schema.<dbname>.ts files", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/magic-cards/schema.magic-cards.ts"),
            });
        }).not.toThrow();
    });

    test("allows schema.<type>.<dbname>.ts files", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/magic-cards/schema.custom.magic-cards.ts"),
            });
        }).not.toThrow();

        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/server/schema.better-auth.server.ts"),
            });
        }).not.toThrow();
    });

    test("allows auth.<dbname>.ts files", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/server/auth.server.ts"),
            });
        }).not.toThrow();
    });

    test("rejects queries files", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/magic-cards/queries.list-cards.ts"),
            });
        }).toThrow(/Only 'conn\.<dbname>\.ts', 'schema\.<type>\.<dbname>\.ts', and 'auth\.<dbname>\.ts' files are allowed/);
    });

    test("rejects helper files", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/users/helpers.ts"),
            });
        }).toThrow(/Only 'conn\.<dbname>\.ts', 'schema\.<type>\.<dbname>\.ts', and 'auth\.<dbname>\.ts' files are allowed/);
    });

    test("rejects utils files", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/users/utils.get-user.ts"),
            });
        }).toThrow(/Only 'conn\.<dbname>\.ts', 'schema\.<type>\.<dbname>\.ts', and 'auth\.<dbname>\.ts' files are allowed/);
    });

    test("rejects arbitrary file names", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/users/some-file.ts"),
            });
        }).toThrow(/should be placed in src\/function\/ directory/);
    });

    test("error message mentions function-builder", () => {
        try {
            assertDatabaseFileName({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/users/queries.ts"),
            });
            expect(true).toBe(false); // Should not reach here
        } catch (e) {
            expect((e as Error).message).toContain("function-builder");
        }
    });
});

describe("assertDatabaseFileNameMatchesDirectory", () => {
    test("allows conn file that matches directory name", () => {
        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/magic-cards/conn.magic-cards.ts"),
            });
        }).not.toThrow();
    });

    test("allows schema file that matches directory name", () => {
        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/users/schema.users.ts"),
            });
        }).not.toThrow();
    });

    test("allows schema.<type>.<dbname> files that match directory", () => {
        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/server/schema.custom.server.ts"),
            });
        }).not.toThrow();

        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/server/schema.better-auth.server.ts"),
            });
        }).not.toThrow();
    });

    test("allows auth.<dbname> files that match directory", () => {
        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/server/auth.server.ts"),
            });
        }).not.toThrow();
    });

    test("rejects conn file that doesn't match directory name", () => {
        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/users/conn.magic-cards.ts"),
            });
        }).toThrow(/Database file name must match the directory name/);
    });

    test("rejects schema file that doesn't match directory name", () => {
        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/magic-cards/schema.users.ts"),
            });
        }).toThrow(/Expected patterns: conn\.magic-cards\.ts, auth\.magic-cards\.ts, or schema\.<type>\.magic-cards\.ts/);
    });

    test("error message shows expected file names", () => {
        try {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/products/conn.items.ts"),
            });
            expect(true).toBe(false); // Should not reach here
        } catch (e) {
            const message = (e as Error).message;
            expect(message).toContain("conn.products.ts");
            expect(message).toContain("auth.products.ts");
            expect(message).toContain("schema.<type>.products.ts");
        }
    });

    test("handles database names with hyphens", () => {
        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/my-db-name/conn.my-db-name.ts"),
            });
        }).not.toThrow();
    });
});

describe("assertDatabasePathDepth", () => {
    test("allows files at correct depth (src/database/<dbname>/<file>.ts)", () => {
        expect(() => {
            assertDatabasePathDepth({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/magic-cards/conn.magic-cards.ts"),
            });
        }).not.toThrow();
    });

    test("rejects files in subdirectories", () => {
        expect(() => {
            assertDatabasePathDepth({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/users/queries/list-users.ts"),
            });
        }).toThrow(/Database files must be at src\/database\/<dbname>\/<file>\.ts/);
    });

    test("rejects files in nested subdirectories", () => {
        expect(() => {
            assertDatabasePathDepth({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/users/helpers/utils/format.ts"),
            });
        }).toThrow(/No subdirectories or additional nesting allowed/);
    });

    test("rejects files directly in src/database/", () => {
        expect(() => {
            assertDatabasePathDepth({
                directory: mockDirectory,
                filePath: path.join(mockDirectory, "src/database/conn.ts"),
            });
        }).toThrow(/Database files must be at src\/database\/<dbname>\/<file>\.ts/);
    });
});

describe("checkDbBeforeWrite", () => {
    test("allows valid conn file", async () => {
        await expect(async () => {
            await checkDbBeforeWrite({
                directory: mockDirectory,
                content: "export const db = ...",
                filePath: path.join(mockDirectory, "src/database/magic-cards/conn.magic-cards.ts"),
            });
        }).not.toThrow();
    });

    test("allows valid schema file", async () => {
        await expect(async () => {
            await checkDbBeforeWrite({
                directory: mockDirectory,
                content: "export const users = sqliteTable(...)",
                filePath: path.join(mockDirectory, "src/database/users/schema.users.ts"),
            });
        }).not.toThrow();
    });

    test("allows writing schema.custom files", async () => {
        await expect(async () => {
            await checkDbBeforeWrite({
                directory: mockDirectory,
                content: "export const users = sqliteTable(...)",
                filePath: path.join(mockDirectory, "src/database/server/schema.custom.server.ts"),
            });
        }).not.toThrow();
    });

    test("rejects writing schema.better-auth files", async () => {
        await expect(
            checkDbBeforeWrite({
                directory: mockDirectory,
                content: "export const user = sqliteTable(...)",
                filePath: path.join(mockDirectory, "src/database/server/schema.better-auth.server.ts"),
            })
        ).rejects.toThrow(/AUTOGENERATED FILE. DO NOT EDIT/);
    });

    test("rejects invalid file name", async () => {
        await expect(
            checkDbBeforeWrite({
                directory: mockDirectory,
                content: "export function listCards() {}",
                filePath: path.join(mockDirectory, "src/database/magic-cards/queries.list-cards.ts"),
            })
        ).rejects.toThrow(/Only 'conn\.<dbname>\.ts', 'schema\.<type>\.<dbname>\.ts', and 'auth\.<dbname>\.ts' files are allowed/);
    });

    test("skips test files", async () => {
        await expect(async () => {
            await checkDbBeforeWrite({
                directory: mockDirectory,
                content: "test('should work', () => {})",
                filePath: path.join(mockDirectory, "src/database/magic-cards/queries.test.ts"),
            });
        }).not.toThrow();
    });

    test("skips non-database files", async () => {
        await expect(async () => {
            await checkDbBeforeWrite({
                directory: mockDirectory,
                content: "export function foo() {}",
                filePath: path.join(mockDirectory, "src/function/foo.ts"),
            });
        }).not.toThrow();
    });
});

describe("checkDbBeforeEdit", () => {
    test("allows editing valid conn file", async () => {
        await expect(async () => {
            await checkDbBeforeEdit({
                directory: mockDirectory,
                content: "export const db = ...",
                filePath: path.join(mockDirectory, "src/database/magic-cards/conn.magic-cards.ts"),
            });
        }).not.toThrow();
    });

    test("allows editing schema.custom files", async () => {
        await expect(async () => {
            await checkDbBeforeEdit({
                directory: mockDirectory,
                content: "export const users = sqliteTable(...)",
                filePath: path.join(mockDirectory, "src/database/server/schema.custom.server.ts"),
            });
        }).not.toThrow();
    });

    test("rejects editing schema.better-auth files", async () => {
        await expect(
            checkDbBeforeEdit({
                directory: mockDirectory,
                content: "export const user = sqliteTable(...)",
                filePath: path.join(mockDirectory, "src/database/server/schema.better-auth.server.ts"),
            })
        ).rejects.toThrow(/AUTOGENERATED FILE. DO NOT EDIT/);
    });

    test("error message for better-auth schema includes migration instructions", async () => {
        try {
            await checkDbBeforeEdit({
                directory: mockDirectory,
                content: "export const user = sqliteTable(...)",
                filePath: path.join(mockDirectory, "src/database/foo/schema.better-auth.foo.ts"),
            });
            expect(true).toBe(false); // Should not reach here
        } catch (e) {
            const message = (e as Error).message;
            expect(message).toContain("auth.foo.ts");
            expect(message).toContain("bunx --bun @better-auth/cli@latest generate");
            expect(message).toContain("drizzle-kit generate");
            expect(message).toContain("drizzle-kit migrate");
        }
    });

    test("rejects editing invalid file", async () => {
        await expect(
            checkDbBeforeEdit({
                directory: mockDirectory,
                content: "export function listCards() {}",
                filePath: path.join(mockDirectory, "src/database/magic-cards/queries.list-cards.ts"),
            })
        ).rejects.toThrow(/Only 'conn\.<dbname>\.ts', 'schema\.<type>\.<dbname>\.ts', and 'auth\.<dbname>\.ts' files are allowed/);
    });
});

describe("checkDbAfterWrite", () => {
    test("allows valid file after write", async () => {
        await expect(async () => {
            await checkDbAfterWrite({
                directory: mockDirectory,
                content: "export const db = drizzle(...)",
                filePath: path.join(mockDirectory, "src/database/magic-cards/conn.magic-cards.ts"),
            });
        }).not.toThrow();
    });

    test("rejects invalid file after write", async () => {
        await expect(
            checkDbAfterWrite({
                directory: mockDirectory,
                content: "export function listCards() {}",
                filePath: path.join(mockDirectory, "src/database/magic-cards/queries.list-cards.ts"),
            })
        ).rejects.toThrow(/Only 'conn\.<dbname>\.ts', 'schema\.<type>\.<dbname>\.ts', and 'auth\.<dbname>\.ts' files are allowed/);
    });
});

describe("checkDbAfterEdit", () => {
    test("allows valid file after edit", async () => {
        await expect(async () => {
            await checkDbAfterEdit({
                directory: mockDirectory,
                content: "export const magicCardsDb = drizzle(...)",
                filePath: path.join(mockDirectory, "src/database/magic-cards/conn.magic-cards.ts"),
            });
        }).not.toThrow();
    });

    test("rejects invalid file after edit", async () => {
        await expect(
            checkDbAfterEdit({
                directory: mockDirectory,
                content: "export function listCards() {}",
                filePath: path.join(mockDirectory, "src/database/magic-cards/queries.list-cards.ts"),
            })
        ).rejects.toThrow(/Only 'conn\.<dbname>\.ts', 'schema\.<type>\.<dbname>\.ts', and 'auth\.<dbname>\.ts' files are allowed/);
    });
});

describe("Windows path compatibility", () => {
    const windowsDirectory = "C:\\Users\\test\\project";

    test("handles Windows paths in assertDatabaseFileName", () => {
        expect(() => {
            assertDatabaseFileName({
                directory: windowsDirectory,
                filePath: windowsDirectory + "\\src\\database\\magic-cards\\conn.magic-cards.ts",
            });
        }).not.toThrow();
    });

    test("handles Windows paths in assertDatabaseFileNameMatchesDirectory", () => {
        expect(() => {
            assertDatabaseFileNameMatchesDirectory({
                directory: windowsDirectory,
                filePath: windowsDirectory + "\\src\\database\\users\\schema.users.ts",
            });
        }).not.toThrow();
    });

    test("handles Windows paths in assertDatabasePathDepth", () => {
        expect(() => {
            assertDatabasePathDepth({
                directory: windowsDirectory,
                filePath: windowsDirectory + "\\src\\database\\magic-cards\\conn.magic-cards.ts",
            });
        }).not.toThrow();
    });
});
