import { parseTypeScript, getDefaultExportReturnType } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

export const ruleTxReturnType: TRuleFn = async ({content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    const returnType = getDefaultExportReturnType(sourceFile);
    
    if (!returnType) {
        return {
            error: "Transactional function must have an explicit return type. " +
            "Expected: TErrTriple<Data>. " +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
    
    if (!returnType.includes("TErrTriple")) {
        return {
            error: "Transactional function must return TErrTriple<Data>. " +
            `Found: ${returnType}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}