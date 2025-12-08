import path from "node:path";
import type { TRuleFn } from "../rule-types";

export const ruleControllerFileName: TRuleFn = async ({filePath}) => {
    const fileName = path.basename(filePath, ".ts");
    
    if (!fileName.startsWith("ctrl.")) {
        return {
            error: "Controller file names must start with 'ctrl.'. " +
            `Found: ${fileName}.ts. ` +
            "You might want to read .opencode/agent/ctrl-builder.md"
        };
    }
}