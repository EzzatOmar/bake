import { parseTypeScript, getDatabaseConnectionImports } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

export const ruleDatabaseConnectionImportsAreTypeOnly: TRuleFn = async ({content, filePath}) => {
    const sourceFile = parseTypeScript(content);
    
    const dbImports = getDatabaseConnectionImports(sourceFile);
    
    for (const dbImport of dbImports) {
        if (!dbImport.isTypeOnly) {
            return {
                error: `Database connection imports must be type-only. ` +
                `Found non-type-only import: ${dbImport.importText}. ` +
                `Use 'import type { ${dbImport.importedNames.join(', ')} } from "${dbImport.modulePath}"' ` +
                `or 'import { type ${dbImport.importedNames.join(', type ')} } from "${dbImport.modulePath}"'. ` +
                `Database connections should only be used for typing, not runtime values. ` +
                `You might want to read .opencode/agent/function-builder.md`
            };
        }
    }
}