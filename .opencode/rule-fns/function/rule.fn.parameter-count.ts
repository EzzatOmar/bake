import { parseTypeScript, getDefaultExportParameterCount } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

export const ruleFnParameterCount: TRuleFn = async ({content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    const paramCount = getDefaultExportParameterCount(sourceFile);
    
    if (paramCount !== 1) {
        return {
            error: "Pure function must have exactly 1 parameter (TArgs). " +
            `Found: ${paramCount} parameters. ` +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}