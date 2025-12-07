/**
 * Normalize path to forward slashes for consistent comparison
 */
function normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

/**
 * Check if the file is in the /docs folder
 */
export function isInDocsFolder(args: { directory: string, filePath: string }): boolean {
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
export function isInOpencodeFolder(args: { directory: string, filePath: string }): boolean {
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
export function isInOneOffScriptsFolder(args: { directory: string, filePath: string }): boolean {
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
