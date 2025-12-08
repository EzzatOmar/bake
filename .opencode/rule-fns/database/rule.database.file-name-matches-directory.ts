
import { fileLog } from "../../helper-fns/file-logger";
import type { TRuleFn } from "../rule-types";

/**
 * Helper to extract just the filename from a path, handling both Unix and Windows paths
 */
function getFileName(filePath: string): string {
    // Normalize path separators to forward slashes
    const normalizedPath = filePath.replace(/\\/g, "/");
    // Get the last part (filename)
    const parts = normalizedPath.split("/");
    const fileName = parts[parts.length - 1];
    // Remove .ts extension
    return fileName.replace(/\.ts$/, "");
}

/**
 * Rule: Database files must follow the naming pattern:
 * - conn.<dbname>.ts
 * - schema.<type>.<dbname>.ts (e.g., schema.custom.<dbname>.ts, schema.better-auth.<dbname>.ts)
 * - auth.<dbname>.ts
 * where <dbname> matches the parent directory name
 */
export const ruleDatabaseFileNameMatchesDirectory: TRuleFn = async ({directory, filePath}) => {
    const fileName = getFileName(filePath);
    
    // Normalize both paths to forward slashes for cross-platform compatibility
    const normalizedDirectory = directory.replace(/\\/g, "/");
    const normalizedFilePath = filePath.replace(/\\/g, "/");
    
    // Get relative path from directory
    const relativePath = normalizedFilePath.replace(normalizedDirectory + "/", "");
    const pathParts = relativePath.split("/");
    
    if (pathParts.length < 3 || pathParts[0] !== "src" || pathParts[1] !== "database") {
        return; // Not in database folder, skip this check
    }
    
    const dbName = pathParts[2];
    
    // Check if fileName matches allowed patterns
    const isValidConn = fileName === `conn.${dbName}`;
    const isValidAuth = fileName === `auth.${dbName}`;
    // Schema files can have a type in between: schema.<type>.<dbname>
    const isValidSchema = fileName.startsWith("schema.") && fileName.endsWith(`.${dbName}`);
    
    if (!isValidConn && !isValidAuth && !isValidSchema) {
        fileLog("ruleDatabaseFileNameMatchesDirectory", "file name doesn't match directory", {
            fileName,
            dbName,
        });
        return {
            error: 
                `Database file name must match the directory name. ` +
                `Expected patterns: conn.${dbName}.ts, auth.${dbName}.ts, or schema.<type>.${dbName}.ts. ` +
                `Found: ${fileName}.ts in src/database/${dbName}/. ` +
                "You might want to read .opencode/agent/database-manager.md"
        };
    }
}