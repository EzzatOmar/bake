import { describe, test, expect } from "bun:test";
import { assertDocumentationLocation, checkDocumentationBeforeWrite } from "./documentation-checks";
import path from "node:path";

const directory = "/test/project";

describe("assertDocumentationLocation", () => {
    test("should allow .md files in /docs folder", () => {
        const filePath = path.join(directory, "docs", "guide.md");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow .txt files in /docs folder", () => {
        const filePath = path.join(directory, "docs", "notes.txt");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow .md files in nested /docs subfolders", () => {
        const filePath = path.join(directory, "docs", "api", "endpoints.md");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow .md files in /.opencode folder", () => {
        const filePath = path.join(directory, ".opencode", "agent", "builder.md");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow .txt files in /.opencode folder", () => {
        const filePath = path.join(directory, ".opencode", "prompt", "notes.txt");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow .md files in /one-off-scripts folder", () => {
        const filePath = path.join(directory, "one-off-scripts", "script-docs.md");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow .txt files in /one-off-scripts folder", () => {
        const filePath = path.join(directory, "one-off-scripts", "notes.txt");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow files in nested /one-off-scripts subfolders", () => {
        const filePath = path.join(directory, "one-off-scripts", "migrations", "readme.md");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should throw for .md files in project root", () => {
        const filePath = path.join(directory, "README.md");
        expect(() => assertDocumentationLocation({ directory, filePath })).toThrow(
            "Documentation files (.md) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should throw for .txt files in project root", () => {
        const filePath = path.join(directory, "notes.txt");
        expect(() => assertDocumentationLocation({ directory, filePath })).toThrow(
            "Documentation files (.txt) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should throw for .md files in /src folder", () => {
        const filePath = path.join(directory, "src", "README.md");
        expect(() => assertDocumentationLocation({ directory, filePath })).toThrow(
            "Documentation files (.md) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should throw for .txt files in /src/function", () => {
        const filePath = path.join(directory, "src", "function", "guide.txt");
        expect(() => assertDocumentationLocation({ directory, filePath })).toThrow(
            "Documentation files (.txt) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should throw for .md files in /src/api", () => {
        const filePath = path.join(directory, "src", "api", "docs.md");
        expect(() => assertDocumentationLocation({ directory, filePath })).toThrow(
            "Documentation files (.md) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should allow .ts files anywhere", () => {
        const filePath = path.join(directory, "src", "function", "fx.test.ts");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow .tsx files anywhere", () => {
        const filePath = path.join(directory, "src", "index.tsx");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should allow .json files anywhere", () => {
        const filePath = path.join(directory, "package.json");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });

    test("should handle Windows-style paths for .md in root", () => {
        const filePath = "C:\\test\\project\\README.md";
        const windowsDirectory = "C:\\test\\project";
        expect(() => assertDocumentationLocation({ directory: windowsDirectory, filePath })).toThrow(
            "Documentation files (.md) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should handle Windows-style paths for .md in /docs", () => {
        const filePath = "C:\\test\\project\\docs\\guide.md";
        const windowsDirectory = "C:\\test\\project";
        expect(() => assertDocumentationLocation({ directory: windowsDirectory, filePath })).not.toThrow();
    });

    test("should handle Windows-style paths for .md in /.opencode", () => {
        const filePath = "C:\\test\\project\\.opencode\\agent\\builder.md";
        const windowsDirectory = "C:\\test\\project";
        expect(() => assertDocumentationLocation({ directory: windowsDirectory, filePath })).not.toThrow();
    });

    test("should handle Windows-style paths for .md in /one-off-scripts", () => {
        const filePath = "C:\\test\\project\\one-off-scripts\\script.md";
        const windowsDirectory = "C:\\test\\project";
        expect(() => assertDocumentationLocation({ directory: windowsDirectory, filePath })).not.toThrow();
    });

    test("should throw for uppercase .MD extension", () => {
        const filePath = path.join(directory, "src", "README.MD");
        expect(() => assertDocumentationLocation({ directory, filePath })).toThrow(
            "Documentation files (.md) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should throw for uppercase .TXT extension", () => {
        const filePath = path.join(directory, "NOTES.TXT");
        expect(() => assertDocumentationLocation({ directory, filePath })).toThrow(
            "Documentation files (.txt) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should allow mixed case extensions in /docs", () => {
        const filePath = path.join(directory, "docs", "README.MD");
        expect(() => assertDocumentationLocation({ directory, filePath })).not.toThrow();
    });
});

describe("checkDocumentationBeforeWrite", () => {
    test("should call assertDocumentationLocation for root files", () => {
        const filePath = path.join(directory, "README.md");
        expect(() => checkDocumentationBeforeWrite({ directory, filePath })).toThrow(
            "Documentation files (.md) should only be created in the /docs or /one-off-scripts folders"
        );
    });

    test("should allow valid documentation in /docs", () => {
        const filePath = path.join(directory, "docs", "api.md");
        expect(() => checkDocumentationBeforeWrite({ directory, filePath })).not.toThrow();
    });

    test("should allow valid files in /one-off-scripts", () => {
        const filePath = path.join(directory, "one-off-scripts", "migration.md");
        expect(() => checkDocumentationBeforeWrite({ directory, filePath })).not.toThrow();
    });
});