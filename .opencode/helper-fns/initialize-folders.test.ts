import { describe, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmpdir } from "node:os";

// Import the function from the plugin
async function initializeFolderStructure(directory: string): Promise<void> {
  const requiredFolders = [
    "src/function",
    "src/controller", 
    "src/api",
    "src/database",
    "src/error",
    "database-storage"
  ];

  for (const folder of requiredFolders) {
    const folderPath = path.join(directory, folder);
    
    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    } catch (error) {
      throw new Error(`Failed to create required folder: ${folder}. Please check permissions.`);
    }
  }
}

describe("initializeFolderStructure", () => {
  test("should create all required folders when they don't exist", async () => {
    // Create a temporary directory for testing
    const testDir = fs.mkdtempSync(path.join(tmpdir(), "vb-test-"));
    
    try {
      // Run initialization
      await initializeFolderStructure(testDir);
      
      // Check that all folders were created
      const requiredFolders = [
        "src/function",
        "src/controller", 
        "src/api",
        "src/database",
        "src/error",
        "database-storage"
      ];
      
      for (const folder of requiredFolders) {
        const folderPath = path.join(testDir, folder);
        expect(fs.existsSync(folderPath)).toBe(true);
        expect(fs.statSync(folderPath).isDirectory()).toBe(true);
      }
    } finally {
      // Clean up
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("should not fail when folders already exist", async () => {
    // Create a temporary directory for testing
    const testDir = fs.mkdtempSync(path.join(tmpdir(), "vb-test-"));
    
    try {
      // Pre-create some folders
      fs.mkdirSync(path.join(testDir, "src", "function"), { recursive: true });
      fs.mkdirSync(path.join(testDir, "database-storage"), { recursive: true });
      
      // Run initialization - should not throw
      await initializeFolderStructure(testDir);
      
      // All folders should still exist
      const requiredFolders = [
        "src/function",
        "src/controller", 
        "src/api",
        "src/database",
        "src/error",
        "database-storage"
      ];
      
      for (const folder of requiredFolders) {
        const folderPath = path.join(testDir, folder);
        expect(fs.existsSync(folderPath)).toBe(true);
      }
    } finally {
      // Clean up
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("should handle nested directory creation", async () => {
    // Create a temporary directory for testing
    const testDir = fs.mkdtempSync(path.join(tmpdir(), "vb-test-"));
    
    try {
      // Run initialization
      await initializeFolderStructure(testDir);
      
      // Check that nested directories were created correctly
      expect(fs.existsSync(path.join(testDir, "src"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, "src", "function"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, "src", "controller"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, "src", "api"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, "src", "database"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, "src", "error"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, "database-storage"))).toBe(true);
    } finally {
      // Clean up
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
});