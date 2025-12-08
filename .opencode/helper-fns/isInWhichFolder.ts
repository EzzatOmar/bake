import path from "node:path";

/**
 * Normalize path to forward slashes for consistent comparison
 */
function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

/**
 * Resolve relative path to absolute path for consistent comparison
 */
function resolvePath(args: { directory: string, filePath: string }): string {
    // If filePath is already absolute, return as-is
    if (path.isAbsolute(args.filePath)) {
        return normalizePath(args.filePath);
    }
    
    // Resolve relative path against the directory
    const absolutePath = path.resolve(args.directory, args.filePath);
    return normalizePath(absolutePath);
}

/**
 * Check if the file is in the /src/api folder
 */
export function isInApiFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const resolvedFilePath = resolvePath(args);
    
    return resolvedFilePath.startsWith(normalizedDirectory + "/src/api/");
}

/**
 * Check if the file is in the /src/controller folder
 */
export function isInControllerFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const resolvedFilePath = resolvePath(args);
    
    return resolvedFilePath.startsWith(normalizedDirectory + "/src/controller/");
}

/**
 * Check if the file is in the /src/function folder
 */
export function isInFunctionFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const resolvedFilePath = resolvePath(args);
    
    return resolvedFilePath.startsWith(normalizedDirectory + "/src/function/");
}

/**
 * Check if the file is in the /src/database folder
 */
export function isInDatabaseFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const resolvedFilePath = resolvePath(args);
    
    return resolvedFilePath.startsWith(normalizedDirectory + "/src/database/");
}

/**
 * Check if the file is in the /docs folder
 */
export function isInDocsFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const resolvedFilePath = resolvePath(args);
    
    // Remove trailing slash from directory if present
    const cleanDirectory = normalizedDirectory.endsWith('/') 
        ? normalizedDirectory.slice(0, -1) 
        : normalizedDirectory;
    
    // Check if file path starts with directory/docs/
    const docsPath = `${cleanDirectory}/docs/`;
    return resolvedFilePath.startsWith(docsPath);
}

/**
 * Check if the file is in the /.opencode folder (hidden from user)
 */
export function isInOpencodeFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const resolvedFilePath = resolvePath(args);
    
    // Remove trailing slash from directory if present
    const cleanDirectory = normalizedDirectory.endsWith('/') 
        ? normalizedDirectory.slice(0, -1) 
        : normalizedDirectory;
    
    // Check if file path starts with directory/.opencode/
    const opencodePath = `${cleanDirectory}/.opencode/`;
    return resolvedFilePath.startsWith(opencodePath);
}

/**
 * Check if the file is in the /one-off-scripts folder
 */
export function isInOneOffScriptsFolder(args: { directory: string, filePath: string }): boolean {
    const normalizedDirectory = normalizePath(args.directory);
    const resolvedFilePath = resolvePath(args);
    
    // Remove trailing slash from directory if present
    const cleanDirectory = normalizedDirectory.endsWith('/') 
        ? normalizedDirectory.slice(0, -1) 
        : normalizedDirectory;
    
    // Check if file path starts with directory/one-off-scripts/
    const scriptsPath = `${cleanDirectory}/one-off-scripts/`;
    return resolvedFilePath.startsWith(scriptsPath);
}
