import path from "node:path";
import { fileLog } from "../../helper-fns/file-logger";
import type { TRuleFn } from "../rule-types";

/**
 * No TypeScript files should be in the project root
 */
export const ruleGenNoTsFileInRoot: TRuleFn = async ({directory, filePath}) => {
    const relativePath = path.relative(directory, filePath);
    
    // Check if file is directly in project root (no directory separator)
    const isInRoot = !relativePath.includes("/") && !relativePath.includes("\\");
    
    if (isInRoot && (relativePath.endsWith(".ts") || relativePath.endsWith(".tsx"))) {
        fileLog("ruleGenNoTsFileInRoot", "ts/tsx file in root", relativePath);
        return {
            error: ".ts and .tsx files are not allowed in the project root. " +
            "Please place TypeScript files in the appropriate src/ subdirectory. " +
            "If you need to create one off scripts place them in one-off-scripts/ directory."
        }
    }
}


