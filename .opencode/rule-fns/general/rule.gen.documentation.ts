import path from "node:path";
import type { TRuleFn } from "../rule-types";
import { fileLog } from "../../helper-fns/file-logger";
import { isInDocsFolder, isInOneOffScriptsFolder, isInOpencodeFolder } from "../../helper-fns/isInWhichFolder";

/**
 * All markdown must be written in the /docs folder
 */
export const ruleGenDocumentation: TRuleFn = async ({directory, filePath}) => {
    // Skip if in allowed folders
    if (isInDocsFolder({ directory, filePath }) || isInOpencodeFolder({ directory, filePath }) || isInOneOffScriptsFolder({ directory, filePath })) {
        return;
    }

    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    
    // Check for .md or .txt files
    if (ext === '.md' || ext === '.txt') {
        const fileName = path.basename(filePath);
        fileLog("ruleGenDocumentation", "Documentation file attempted outside /docs", { 
            fileName, 
            extension: ext 
        });
        return {
            error: `Documentation files (${ext}) should only be created in the /docs or /one-off-scripts folders. ` +
            `Attempted to create: ${fileName}. ` +
            `Agents should not add useless documentation. ` +
            `If documentation is really needed, use JSDoc comments in the code instead. ` +
            `Usually agents can read the code directly, which is sufficient. ` +
            `Only add JSDoc for non-trivial usage patterns. ` +
            `Agents should not engage in over-engineering documentation - no example scripts or similar files are needed.`
        }
    }
}