import { parseTypeScript, getDefaultExportParameters } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

export const ruleFxFirstParameterType: TRuleFn = async ({content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    const parameters = getDefaultExportParameters(sourceFile);
    
    if (parameters.length === 0) {
        return {
            error: "Effectful function must have 2 parameters. " +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
    
    const firstParamType = parameters[0].type;
    if (!firstParamType.includes("Portal")) {
        return {
            error: "Effectful function first parameter must be a Portal type (contains 'Portal'). " +
            `Found: ${firstParamType}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}