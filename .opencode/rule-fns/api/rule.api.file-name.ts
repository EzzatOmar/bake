import path from "node:path";
import type { TRuleFn } from "../rule-types";

export const ruleApiFileName: TRuleFn = async ({filePath}) => {
    const fileName = path.basename(filePath, ".ts");

    // Allow .model.ts files for validation schemas
    if (fileName.endsWith(".model")) {
        return;
    }

    if (!fileName.startsWith("api.")) {
        return {
            error: "API file names must start with 'api.'. " +
            `Found: ${fileName}.ts. ` +
            "You might want to read .opencode/agent/api-builder.md"
        }
    }
}