import { TRuleFn } from "../rule-types";
import path from "node:path";

/**
 * Rule: Component file name must start with comp. if it ends with .tsx
 */
export const ruleComponentFileName: TRuleFn = async (args) => {
    const fileName = path.basename(args.filePath);
    
    // Only check .tsx files in component folder
    if (!fileName.endsWith('.tsx')) {
        return; // Rule doesn't apply to non-.tsx files
    }
    
    const isComp = fileName.startsWith("comp.");
    
    if (!isComp) {
        return {
            error: 
                "Component files ending with .tsx must start with 'comp.'. " +
                `Found: ${fileName}. ` +
                "You might want to read .opencode/agent/frontend-builder.md"
        };
    }
    
    return {
        message: `Component file name ${fileName} is valid`
    };
};