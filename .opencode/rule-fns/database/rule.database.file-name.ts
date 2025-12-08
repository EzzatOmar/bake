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
 * Rule: Only conn.<dbname>.ts, schema.<type>.<dbname>.ts, and auth.<dbname>.ts files are allowed in src/database/<dbname>/
 * All other files (queries, helpers, utils) should go in src/function/
 */
export const ruleDatabaseFileName: TRuleFn = async ({directory, filePath}) => {
    const fileName = getFileName(filePath);
    
    const isConn = fileName.startsWith("conn.");
    const isSchema = fileName.startsWith("schema.");
    const isAuth = fileName.startsWith("auth.");
    
    if (!isConn && !isSchema && !isAuth) {
        fileLog("ruleDatabaseFileName", "invalid database file name", fileName);
        return {
            error: 
                "Only 'conn.<dbname>.ts', 'schema.<type>.<dbname>.ts', and 'auth.<dbname>.ts' files are allowed in src/database/<dbname>/. " +
                `Found: ${fileName}.ts. ` +
                "Database queries and helper functions should be placed in src/function/ directory. " +
                "The function-builder subagent can help you create properly structured functions. " +
                "You might want to read .opencode/agent/function-builder.md"
        };
    }
}