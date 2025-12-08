import { parseTypeScript, findTypeAlias, getTypeLiteralPropertyNames } from "../../helper-fns/ts-analyzer";
import { getDatabaseVariableNames } from "../../helper-fns/get-db-names";
import type { TRuleFn } from "../rule-types";

function getCorrespondingFunctionFile(filePath: string): string {
    return filePath.replace(".test.ts", ".ts");
}

function getTestingDbFunctionName(dbVariableName: string): string {
    // Remove 'Db' suffix and convert to PascalCase
    // magicCardsDb -> magicCards -> MagicCards -> createTestingMagicCardsDb
    const withoutDb = dbVariableName.replace(/Db$/, '');
    const pascalCase = withoutDb.charAt(0).toUpperCase() + withoutDb.slice(1);
    return `createTesting${pascalCase}Db`;
}

function hasTestingDbImport(content: string, testingDbFunctionName: string): boolean {
    // Check for import statement containing testing function name
    const importRegex = new RegExp(`import\\s+{[^}]*${testingDbFunctionName}[^}]*}\\s+from\\s+['"](.*?)conn\\.[^'"]+['"]`);
    return importRegex.test(content);
}

async function getFunctionDbVariable(directory: string, functionFilePath: string): Promise<string | null> {
    try {
        const content = await Bun.file(functionFilePath).text();
        
        // Look for TPortal definition - use a more robust approach
        // Find start of TPortal
        const portalStartRegex = /export\s+type\s+TPortal\s*=\s*{/;
        const startMatch = content.match(portalStartRegex);
        
        if (!startMatch) {
            return null;
        }
        
        // Find matching closing brace by counting braces
        const startIndex = startMatch.index! + startMatch[0].length;
        let braceCount = 1;
        let endIndex = startIndex;
        
        for (let i = startIndex; i < content.length && braceCount > 0; i++) {
            if (content[i] === '{') braceCount++;
            if (content[i] === '}') braceCount--;
            endIndex = i;
        }
        
        const portalBody = content.substring(startIndex, endIndex);
        
        // Find db property: db: typeof dbVariableName
        const dbPropertyRegex = /db\s*:\s*typeof\s+(\w+)/;
        const dbMatch = portalBody.match(dbPropertyRegex);
        
        if (!dbMatch) {
            return null;
        }
        
        return dbMatch[1]; // Return database variable name (e.g., magicCardsDb)
    } catch (error) {
        return null;
    }
}

export const ruleTestFileImportsTestingDb: TRuleFn = async ({directory, content, filePath}) => {
    const functionFilePath = getCorrespondingFunctionFile(filePath);
    
    // Check if corresponding function file exists
    if (!(await Bun.file(functionFilePath).exists())) {
        return; // Rule doesn't apply if function file doesn't exist
    }
    
    // Check if function uses database
    const dbVariable = await getFunctionDbVariable(directory, functionFilePath);
    
    if (!dbVariable) {
        return; // Rule doesn't apply if function doesn't use database
    }
    
    // Get expected testing function name
    const testingDbFunctionName = getTestingDbFunctionName(dbVariable);
    
    // Check if test file imports testing database function
    if (!hasTestingDbImport(content, testingDbFunctionName)) {
        return {
            error: `Test file must import testing database function when testing database operations. ` +
            `Expected import: import { ${testingDbFunctionName} } from '@/src/database/.../conn....ts'. ` +
            `Your function uses database variable '${dbVariable}', so tests must use '${testingDbFunctionName}()' instead of mocking. ` +
            `You might want to read .opencode/agent/function-builder.md`
        };
    }
}