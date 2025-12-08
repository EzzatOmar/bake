import { fileLog } from "../../helper-fns/file-logger";
import type { TRuleFn } from "../rule-types";

/**
 * Rule: Database files must be exactly at src/database/<dbname>/<file>.ts
 * No subdirectories allowed
 */
export const ruleDatabasePathDepth: TRuleFn = async ({directory, filePath}) => {
    // Normalize both paths to forward slashes for cross-platform compatibility
    const normalizedDirectory = directory.replace(/\\/g, "/");
    let normalizedFilePath = filePath.replace(/\\/g, "/");

    // Remove Windows drive letter if present (e.g., "C:" from "C:/Users/...")
    normalizedFilePath = normalizedFilePath.replace(/^[A-Z]:/, "");

    // Get relative path from directory
    const relativePath = normalizedFilePath.replace(normalizedDirectory + "/", "");
    const pathParts = relativePath.split("/");

    // Expected structure: src/database/<dbname>/<file>.ts = 4 parts
    if (pathParts.length !== 4) {
        fileLog("ruleDatabasePathDepth", "invalid path depth", {
            pathParts,
            depth: pathParts.length
        });
        return {
            error:
                "Database files must be at src/database/<dbname>/<file>.ts. " +
                "No subdirectories or additional nesting allowed. " +
                `Found: ${relativePath}. ` +
                "You might want to read .opencode/agent/database-manager.md"
        };
    }
}