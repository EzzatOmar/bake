import { expect, test, describe } from "bun:test";
import { checkNoTsFilesInRoot, checkNoJsFiles } from "./root-file-checks";
import path from "node:path";

describe("checkNoTsFilesInRoot", () => {
  const mockDirectory = "/Users/test/project";

  describe("should throw error for .ts files in root", () => {
    test("rejects .ts file directly in project root", () => {
      const filePath = path.join(mockDirectory, "test.ts");
      
      expect(() => {
        checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      }).toThrow(".ts and .tsx files are not allowed in the project root");
    });

    test("rejects .tsx file directly in project root", () => {
      const filePath = path.join(mockDirectory, "component.tsx");
      
      expect(() => {
        checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      }).toThrow(".ts and .tsx files are not allowed in the project root");
    });

    test("rejects .ts file with complex name in root", () => {
      const filePath = path.join(mockDirectory, "my.config.test.ts");
      
      expect(() => {
        checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      }).toThrow(".ts and .tsx files are not allowed in the project root");
    });
  });

  describe("should allow .ts/.tsx files in subdirectories", () => {
    test("allows .ts file in src directory", () => {
      const filePath = path.join(mockDirectory, "src", "index.ts");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("allows .tsx file in src directory", () => {
      const filePath = path.join(mockDirectory, "src", "App.tsx");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("allows .ts file in nested subdirectory", () => {
      const filePath = path.join(mockDirectory, "src", "components", "Button.ts");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("allows .ts file in .opencode directory", () => {
      const filePath = path.join(mockDirectory, ".opencode", "plugin", "vb.ts");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("allows .ts file deeply nested", () => {
      const filePath = path.join(mockDirectory, "src", "api", "user", "handlers", "create.ts");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });
  });

  describe("should allow non-TypeScript files in root", () => {
    test("allows .json file in root", () => {
      const filePath = path.join(mockDirectory, "package.json");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("allows .js file in root", () => {
      const filePath = path.join(mockDirectory, "config.js");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("allows .md file in root", () => {
      const filePath = path.join(mockDirectory, "README.md");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("allows .txt file in root", () => {
      const filePath = path.join(mockDirectory, "LICENSE.txt");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("allows file without extension in root", () => {
      const filePath = path.join(mockDirectory, "Dockerfile");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    test("handles file with .ts in name but different extension", () => {
      const filePath = path.join(mockDirectory, "typescript-config.json");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("handles .tsx in middle of filename", () => {
      const filePath = path.join(mockDirectory, "my.tsx.backup");
      
      const result = checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
      expect(result).toBeNull();
    });

    test("handles Windows-style paths", () => {
      const windowsDirectory = "C:\\Users\\test\\project";
      const filePath = path.join(windowsDirectory, "src", "index.ts");
      
      const result = checkNoTsFilesInRoot({ directory: windowsDirectory, filePath });
      expect(result).toBeNull();
    });

    test("rejects .ts file in root with Windows paths", () => {
      const windowsDirectory = "C:\\Users\\test\\project";
      const filePath = path.join(windowsDirectory, "test.ts");
      
      expect(() => {
        checkNoTsFilesInRoot({ directory: windowsDirectory, filePath });
      }).toThrow(".ts and .tsx files are not allowed in the project root");
    });
  });

  describe("error message validation", () => {
    test("error message includes helpful guidance", () => {
      const filePath = path.join(mockDirectory, "index.ts");
      
      try {
        checkNoTsFilesInRoot({ directory: mockDirectory, filePath });
        throw new Error("Should have thrown");
      } catch (error) {
        expect(error.message).toContain("not allowed in the project root");
        expect(error.message).toContain("appropriate src/ subdirectory");
      }
    });
  });
});
