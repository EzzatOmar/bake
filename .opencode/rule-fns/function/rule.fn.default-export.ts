import { parseTypeScript, hasDefaultExport } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

export const ruleFunctionDefaultExport: TRuleFn = async ({content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    if (!hasDefaultExport(sourceFile)) {
        return {
            error: "Function must have a default export. " +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}