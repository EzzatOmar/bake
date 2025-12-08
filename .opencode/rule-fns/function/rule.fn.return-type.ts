import { parseTypeScript, getDefaultExportReturnType } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

export const ruleFnReturnType: TRuleFn = async ({content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    const returnType = getDefaultExportReturnType(sourceFile);
    
    if (!returnType) {
        return {
            error: "Pure function must have an explicit return type. " +
            "Expected: TErrTuple<Data>. " +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
    
    if (!returnType.includes("TErrTuple")) {
        return {
            error: "Pure function must return TErrTuple<Data>. " +
            `Found: ${returnType}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}