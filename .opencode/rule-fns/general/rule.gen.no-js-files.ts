import path from "node:path";
import { fileLog } from "../../helper-fns/file-logger";
import type { TRuleFn } from "../rule-types";

/**
 * No JavaScript files should be in the project
 */
export const ruleGenNoJsFiles: TRuleFn = async ({directory, filePath}) => {
    const relativePath = path.relative(directory, filePath);

    // Skip node_modules and .git directories
    if (relativePath.includes('node_modules/') || relativePath.includes('.git/')) {
        return;
    }

    // Check for .js extension (case-insensitive)
    if (relativePath.toLowerCase().endsWith(".js")) {
        fileLog("ruleGenNoJsFiles", "js file detected", relativePath);
        return {
            error: ".js files are not allowed in this project. " +
            "Please use TypeScript (.ts) files instead."
        }
    }
}