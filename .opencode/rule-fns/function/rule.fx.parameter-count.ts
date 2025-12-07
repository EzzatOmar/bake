import { parseTypeScript, getDefaultExportParameterCount } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

export const ruleFxParameterCount: TRuleFn = async ({content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    const paramCount = getDefaultExportParameterCount(sourceFile);
    
    if (paramCount !== 2) {
        return {
            error: "Effectful function must have exactly 2 parameters (TPortal, TArgs). " +
            `Found: ${paramCount} parameters. ` +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}