import path from "node:path";
import { fileLog } from "./file-logger";
import { isTestFile } from "./path-checks";

/**
 * Rule: Component file name must start with comp. if it ends with .tsx
 */
export function assertComponentFileName(args: { directory: string, filePath: string }) {
    const fileName = path.basename(args.filePath);
    
    // Only check .tsx files in component folder
    if (!fileName.endsWith('.tsx')) {
        return; // Rule doesn't apply to non-.tsx files
    }
    
    const isComp = fileName.startsWith("comp.");
    
    if (!isComp) {
        fileLog("assertComponentFileName", "invalid component file name", fileName);
        throw new Error(
            "Component files ending with .tsx must start with 'comp.'. " +
            `Found: ${fileName}. ` +
            "You might want to read .opencode/agent/frontend-builder.md"
        );
    }
    
    fileLog("assertComponentFileName", "valid component file name", fileName);
}

/**
 * Check if file is in component folder
 */
function isComponentFolder(args: { directory: string, filePath: string }): boolean {
    const relativePath = path.relative(args.directory, args.filePath);
    if (!relativePath.startsWith("src/component/")) {
        return false;
    }

    return true;
}

// ===== COMBINED CHECK FUNCTIONS =====

export async function checkComponentBeforeWrite(args: { directory: string, content: string, filePath: string }) {
    if (!isComponentFolder(args)) return;
    
    // Test files have different checks
    if (isTestFile(args)) {
        return; // Path checks don't apply to test files
    }
    
    assertComponentFileName(args);
}

export async function checkComponentBeforeEdit(args: { directory: string, content: string, filePath: string }) {
    if (!isComponentFolder(args)) return;
    
    // Test files have different checks
    if (isTestFile(args)) {
        return; // Path checks don't apply to test files
    }
    
    assertComponentFileName(args);
}

export async function checkComponentAfterWrite(args: { directory: string, content: string, filePath: string }) {
    if (!isComponentFolder(args)) return;
    
    // Test files have different checks
    if (isTestFile(args)) {
        return;
    }

    assertComponentFileName(args);
}

export async function checkComponentAfterEdit(args: { directory: string, content: string, filePath: string }) {
    if (!isComponentFolder(args)) return;
    
    // Test files have different checks
    if (isTestFile(args)) {
        return;
    }

    assertComponentFileName(args);
}