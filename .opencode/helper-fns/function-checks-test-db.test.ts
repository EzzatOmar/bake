import { test, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { assertTestFileImportsTestingDb } from "./function-checks";

// Create a temporary test directory
const TEST_DIR = path.join(import.meta.dir, "test-temp-db-checks");
const FUNCTION_DIR = path.join(TEST_DIR, "src", "function", "magic-cards");
const DATABASE_DIR = path.join(TEST_DIR, "src", "database", "magic-cards");

beforeEach(() => {
    // Clean up and create fresh test directory
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true });
    }
    fs.mkdirSync(FUNCTION_DIR, { recursive: true });
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
});

afterEach(() => {
    // Clean up
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true });
    }
});

test('assertTestFileImportsTestingDb - should pass when test imports testing database', () => {
    // Create function file with database
    const functionFile = path.join(FUNCTION_DIR, "fx.get-user.ts");
    fs.writeFileSync(functionFile, `
import type { magicCardsDb } from '@/src/database/magic-cards/conn.magic-cards';

export type TPortal = {
    db: typeof magicCardsDb;
};

export type TArgs = { userId: number };

export default async function fxGetUser(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
    return [{}, null];
}
    `);

    // Create test file WITH the testing database import
    const testFile = path.join(FUNCTION_DIR, "fx.get-user.test.ts");
    const testContent = `
import { test, expect } from "bun:test";
import { createTestingMagicCardsDb } from '@/src/database/magic-cards/conn.magic-cards';
import fxGetUser from './fx.get-user';

test('should work', async () => {
    const testDb = createTestingMagicCardsDb();
    const portal = { db: testDb };
    const [result, error] = await fxGetUser(portal, { userId: 1 });
    expect(error).toBeNull();
});
    `;

    // Should NOT throw
    expect(() => {
        assertTestFileImportsTestingDb({
            directory: TEST_DIR,
            content: testContent,
            filePath: testFile
        });
    }).not.toThrow();
});

test('assertTestFileImportsTestingDb - should throw when test does NOT import testing database', () => {
    // Create function file with database
    const functionFile = path.join(FUNCTION_DIR, "fx.get-user.ts");
    fs.writeFileSync(functionFile, `
import type { magicCardsDb } from '@/src/database/magic-cards/conn.magic-cards';

export type TPortal = {
    db: typeof magicCardsDb;
};

export type TArgs = { userId: number };

export default async function fxGetUser(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
    return [{}, null];
}
    `);

    // Create test file WITHOUT the testing database import (uses mock instead)
    const testFile = path.join(FUNCTION_DIR, "fx.get-user.test.ts");
    const testContent = `
import { test, expect } from "bun:test";
import fxGetUser from './fx.get-user';

test('should work', async () => {
    const mockDb = { select: () => {} };
    const portal = { db: mockDb as any };
    const [result, error] = await fxGetUser(portal, { userId: 1 });
    expect(error).toBeNull();
});
    `;

    // Should throw
    expect(async () => {
        await assertTestFileImportsTestingDb({
            directory: TEST_DIR,
            content: testContent,
            filePath: testFile
        });
    }).toThrow(/Test file must import the testing database function/);
});

test('assertTestFileImportsTestingDb - should not throw when function does NOT use database', () => {
    // Create function file WITHOUT database (pure function)
    const functionFile = path.join(FUNCTION_DIR, "fn.calculate.ts");
    fs.writeFileSync(functionFile, `
export type TArgs = { a: number, b: number };

export default function fnCalculate(args: TArgs): TErrTuple<number> {
    return [args.a + args.b, null];
}
    `);

    // Create test file without testing database import (which is fine for pure functions)
    const testFile = path.join(FUNCTION_DIR, "fn.calculate.test.ts");
    const testContent = `
import { test, expect } from "bun:test";
import fnCalculate from './fn.calculate';

test('should add numbers', () => {
    const [result, error] = fnCalculate({ a: 1, b: 2 });
    expect(result).toBe(3);
    expect(error).toBeNull();
});
    `;

    // Should NOT throw (function doesn't use database)
    expect(() => {
        assertTestFileImportsTestingDb({
            directory: TEST_DIR,
            content: testContent,
            filePath: testFile
        });
    }).not.toThrow();
});

test('assertTestFileImportsTestingDb - should not throw when function file does not exist', () => {
    // Test file exists but function file doesn't
    const testFile = path.join(FUNCTION_DIR, "fx.nonexistent.test.ts");
    const testContent = `
import { test, expect } from "bun:test";

test('should work', () => {
    expect(true).toBe(true);
});
    `;

    // Should NOT throw (rule doesn't apply if function file doesn't exist)
    expect(() => {
        assertTestFileImportsTestingDb({
            directory: TEST_DIR,
            content: testContent,
            filePath: testFile
        });
    }).not.toThrow();
});

test('assertTestFileImportsTestingDb - should work with different database names', () => {
    // Create function file with different database name
    const functionFile = path.join(FUNCTION_DIR, "fx.get-book.ts");
    fs.writeFileSync(functionFile, `
import type { booksDb } from '@/src/database/books/conn.books';

export type TPortal = {
    db: typeof booksDb;
};

export type TArgs = { bookId: number };

export default async function fxGetBook(portal: TPortal, args: TArgs): Promise<TErrTuple<any>> {
    return [{}, null];
}
    `);

    // Create test file WITH correct testing database for books
    const testFile = path.join(FUNCTION_DIR, "fx.get-book.test.ts");
    const testContentValid = `
import { test, expect } from "bun:test";
import { createTestingBooksDb } from '@/src/database/books/conn.books';
import fxGetBook from './fx.get-book';

test('should work', async () => {
    const testDb = createTestingBooksDb();
    const portal = { db: testDb };
    const [result, error] = await fxGetBook(portal, { bookId: 1 });
    expect(error).toBeNull();
});
    `;

    // Should NOT throw with correct testing database
    expect(() => {
        assertTestFileImportsTestingDb({
            directory: TEST_DIR,
            content: testContentValid,
            filePath: testFile
        });
    }).not.toThrow();

    // Should throw with wrong testing database
    const testContentInvalid = `
import { test, expect } from "bun:test";
import { createTestingMagicCardsDb } from '@/src/database/magic-cards/conn.magic-cards';
import fxGetBook from './fx.get-book';

test('should work', async () => {
    const testDb = createTestingMagicCardsDb();
    const portal = { db: testDb };
    const [result, error] = await fxGetBook(portal, { bookId: 1 });
    expect(error).toBeNull();
});
    `;

    expect(async () => {
        await assertTestFileImportsTestingDb({
            directory: TEST_DIR,
            content: testContentInvalid,
            filePath: testFile
        });
    }).toThrow(/createTestingBooksDb/);
});

test('assertTestFileImportsTestingDb - should handle transactional functions', () => {
    // Create transactional function file with database
    const functionFile = path.join(FUNCTION_DIR, "tx.create-user.ts");
    fs.writeFileSync(functionFile, `
import type { magicCardsDb } from '@/src/database/magic-cards/conn.magic-cards';

export type TPortal = {
    db: typeof magicCardsDb;
};

export type TArgs = { username: string };

export default async function txCreateUser(portal: TPortal, args: TArgs): Promise<TErrTriple<any>> {
    return [{}, null, []];
}
    `);

    // Create test file WITH the testing database import
    const testFile = path.join(FUNCTION_DIR, "tx.create-user.test.ts");
    const testContent = `
import { test, expect } from "bun:test";
import { createTestingMagicCardsDb } from '@/src/database/magic-cards/conn.magic-cards';
import txCreateUser from './tx.create-user';

test('should create user', async () => {
    const testDb = createTestingMagicCardsDb();
    const portal = { db: testDb };
    const [result, error, rollbacks] = await txCreateUser(portal, { username: 'test' });
    expect(error).toBeNull();
});
    `;

    // Should NOT throw
    expect(() => {
        assertTestFileImportsTestingDb({
            directory: TEST_DIR,
            content: testContent,
            filePath: testFile
        });
    }).not.toThrow();
});
