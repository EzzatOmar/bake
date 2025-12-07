import path from "node:path";
import type { TRuleFn } from "../rule-types";

export const ruleFunctionPathDepth: TRuleFn = async ({directory, filePath}) => {
    const relativePath = path.relative(directory, filePath);
    
    // Remove src/function/ prefix
    const pathAfterFunction = relativePath.replace("src/function/", "");
    const parts = pathAfterFunction.split("/");
    
    if (parts.length > 2) {
        return {
            error: "Function path cannot have more than 1 level of module nesting. " +
            `Found ${parts.length} levels: ${pathAfterFunction}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}