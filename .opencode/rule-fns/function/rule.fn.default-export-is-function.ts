import { parseTypeScript, isDefaultExportFunction } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

export const ruleFunctionDefaultExportIsFunction: TRuleFn = async ({content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    if (!isDefaultExportFunction(sourceFile)) {
        return {
            error: "Function default export must be a function. " +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}