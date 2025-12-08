import path from "node:path";
import { fileLog } from "../../helper-fns/file-logger";
import type { TRuleFn } from "../rule-types";

/**
 * No TypeScript files should be in the project root
 */
export const ruleGenNoTsFileInRoot: TRuleFn = async ({directory, filePath}) => {
    // Normalize paths to handle Windows/Unix differences
    const normalizedDirectory = directory.replace(/\\/g, '/');
    const normalizedFilePath = filePath.replace(/\\/g, '/');

    const relativePath = path.relative(normalizedDirectory, normalizedFilePath);

    // Normalize the relative path too
    const normalizedRelativePath = relativePath.replace(/\\/g, '/');

    // Check if file is directly in project root (no directory separator)
    const isInRoot = !normalizedRelativePath.includes("/");

    if (isInRoot && (normalizedRelativePath.endsWith(".ts") || normalizedRelativePath.endsWith(".tsx"))) {
        fileLog("ruleGenNoTsFileInRoot", "ts/tsx file in root", normalizedRelativePath);
        return {
            error: ".ts and .tsx files are not allowed in the project root. " +
            "Please place TypeScript files in the appropriate src/ subdirectory. " +
            "If you need to create one off scripts place them in one-off-scripts/ directory."
        }
    }
}


