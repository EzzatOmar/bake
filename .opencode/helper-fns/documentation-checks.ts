import path from "node:path";
import { fileLog } from "./file-logger";

/**
 * Normalize path to forward slashes for consistent comparison
 */
function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

/**
 * Check if the file is in the /docs folder
 */
function isInDocsFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const normalizedFilePath = normalizePath(args.filePath);
    
    // Remove trailing slash from directory if present
    const cleanDirectory = normalizedDirectory.endsWith('/') 
        ? normalizedDirectory.slice(0, -1) 
        : normalizedDirectory;
    
    // Check if file path starts with directory/docs/
    const docsPath = `${cleanDirectory}/docs/`;
    return normalizedFilePath.startsWith(docsPath);
}

/**
 * Check if the file is in the /.opencode folder (hidden from user)
 */
function isInOpencodeFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const normalizedFilePath = normalizePath(args.filePath);
    
    // Remove trailing slash from directory if present
    const cleanDirectory = normalizedDirectory.endsWith('/') 
        ? normalizedDirectory.slice(0, -1) 
        : normalizedDirectory;
    
    // Check if file path starts with directory/.opencode/
    const opencodePath = `${cleanDirectory}/.opencode/`;
    return normalizedFilePath.startsWith(opencodePath);
}

/**
 * Check if the file is in the /one-off-scripts folder
 */
function isInOneOffScriptsFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const normalizedFilePath = normalizePath(args.filePath);
    
    // Remove trailing slash from directory if present
    const cleanDirectory = normalizedDirectory.endsWith('/') 
        ? normalizedDirectory.slice(0, -1) 
        : normalizedDirectory;
    
    // Check if file path starts with directory/one-off-scripts/
    const scriptsPath = `${cleanDirectory}/one-off-scripts/`;
    return normalizedFilePath.startsWith(scriptsPath);
}

/**
 * Assert that markdown and text files are only in /docs, /.opencode, or /one-off-scripts folders
 */
export function assertDocumentationLocation(args: { directory: string, filePath: string }) {
    // Skip if in allowed folders
    if (isInDocsFolder(args) || isInOpencodeFolder(args) || isInOneOffScriptsFolder(args)) {
        return;
    }

    // Get file extension
    const ext = path.extname(args.filePath).toLowerCase();
    
    // Check for .md or .txt files
    if (ext === '.md' || ext === '.txt') {
        const fileName = path.basename(args.filePath);
        fileLog("assertDocumentationLocation", "Documentation file attempted outside /docs", { 
            fileName, 
            extension: ext 
        });
        throw new Error(
            `Documentation files (${ext}) should only be created in the /docs or /one-off-scripts folders. ` +
            `Attempted to create: ${fileName}. ` +
            `Agents should not add useless documentation. ` +
            `If documentation is really needed, use JSDoc comments in the code instead. ` +
            `Usually agents can read the code directly, which is sufficient. ` +
            `Only add JSDoc for non-trivial usage patterns. ` +
            `Agents should not engage in overengineering documentation - no example scripts or similar files are needed.`
        );
    }
}

/**
 * Check function for before write to prevent documentation files outside /docs
 */
export function checkDocumentationBeforeWrite(args: { directory: string, filePath: string }) {
    assertDocumentationLocation(args);
}