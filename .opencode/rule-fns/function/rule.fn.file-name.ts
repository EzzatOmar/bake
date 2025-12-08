import path from "node:path";
import type { TRuleFn } from "../rule-types";

export const ruleFunctionFileName: TRuleFn = async ({filePath}) => {
    const fileName = path.basename(filePath, ".ts");
    
    const isFn = fileName.startsWith("fn.");
    const isFx = fileName.startsWith("fx.");
    const isTx = fileName.startsWith("tx.");
    
    if (!isFn && !isFx && !isTx) {
        return {
            error: "Function file names must start with 'fn.', 'fx.', or 'tx.'. " +
            `Found: ${fileName}.ts. ` +
            "You might want to read .opencode/agent/function-builder.md"
        };
    }
}