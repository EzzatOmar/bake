import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { addAuthToRouter } from "./add-auth-to-router";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("addAuthToRouter", () => {
  let tempDir: string;
  let indexPath: string;

  beforeEach(() => {
    // Create a temporary directory for each test
    tempDir = mkdtempSync(join(tmpdir(), "auth-router-test-"));
    indexPath = join(tempDir, "index.tsx");
  });

  afterEach(() => {
    // Clean up temporary directory
    rmSync(tempDir, { recursive: true, force: true });
  });

  test("should add auth handler to empty router", () => {
    const content = `try {
  const server = Bun.serve({
    routes: {
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });
} catch (error) {
  console.error('Failed to start server:', error);
}`;

    writeFileSync(indexPath, content);
    const result = addAuthToRouter(indexPath, "meetup");

    expect(result.success).toBe(true);
    expect(result.message).toContain("Successfully added auth.handler");

    const updated = readFileSync(indexPath, "utf-8");
    expect(updated).toContain('import { auth } from "@/src/database/meetup/auth.meetup";');
    expect(updated).toContain('"/api/auth/*": auth.handler,');
  });

  test("should add auth handler before wildcard routes", () => {
    const content = `try {
  const server = Bun.serve({
    routes: {
      "/api/*": () => Response.json({ message: "Not found" }, { status: 404 }),
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });
} catch (error) {
  console.error('Failed to start server:', error);
}`;

    writeFileSync(indexPath, content);
    const result = addAuthToRouter(indexPath, "users");

    expect(result.success).toBe(true);

    const updated = readFileSync(indexPath, "utf-8");
    expect(updated).toContain('import { auth } from "@/src/database/users/auth.users";');
    expect(updated).toContain('"/api/auth/*": auth.handler,');
    
    // Verify auth.handler comes before other routes
    const authIndex = updated.indexOf('"/api/auth/*": auth.handler');
    const apiWildcardIndex = updated.indexOf('"/api/*":');
    expect(authIndex).toBeLessThan(apiWildcardIndex);
  });

  test("should detect existing auth.handler and return error", () => {
    const content = `import { auth } from "@/src/database/existing/auth.existing";

try {
  const server = Bun.serve({
    routes: {
      "/api/auth/*": auth.handler,
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });
} catch (error) {
  console.error('Failed to start server:', error);
}`;

    writeFileSync(indexPath, content);
    const result = addAuthToRouter(indexPath, "newdb");

    expect(result.success).toBe(false);
    expect(result.message).toContain("Another better-auth handler already exists");
    expect(result.message).toContain("not good practice");
  });

  test("should handle router with existing imports", () => {
    const content = `import { someFunction } from "./utils";

try {
  const server = Bun.serve({
    routes: {
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });
} catch (error) {
  console.error('Failed to start server:', error);
}`;

    writeFileSync(indexPath, content);
    const result = addAuthToRouter(indexPath, "app");

    expect(result.success).toBe(true);

    const updated = readFileSync(indexPath, "utf-8");
    // Auth import should be added before existing imports
    const authImportIndex = updated.indexOf('import { auth }');
    const someImportIndex = updated.indexOf('import { someFunction }');
    expect(authImportIndex).toBeLessThan(someImportIndex);
  });

  test("should handle different database names", () => {
    const content = `try {
  const server = Bun.serve({
    routes: {
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });
} catch (error) {
  console.error('Failed to start server:', error);
}`;

    writeFileSync(indexPath, content);
    const result = addAuthToRouter(indexPath, "my-custom-db");

    expect(result.success).toBe(true);

    const updated = readFileSync(indexPath, "utf-8");
    expect(updated).toContain('import { auth } from "@/src/database/my-custom-db/auth.my-custom-db";');
  });

  test("should not duplicate import if already exists", () => {
    const content = `import { auth } from "@/src/database/meetup/auth.meetup";

try {
  const server = Bun.serve({
    routes: {
      "/*": () => new Response("NOT FOUND", { status: 404 })
    },
    port: 3000,
  });
} catch (error) {
  console.error('Failed to start server:', error);
}`;

    writeFileSync(indexPath, content);
    addAuthToRouter(indexPath, "meetup");

    const updated = readFileSync(indexPath, "utf-8");
    const importCount = (updated.match(/import { auth } from "@\/src\/database\/meetup\/auth.meetup"/g) || []).length;
    expect(importCount).toBe(1);
  });
});
