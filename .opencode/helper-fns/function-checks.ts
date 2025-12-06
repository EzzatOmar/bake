import path from "node:path";
import { SourceFile } from "typescript";
import { fileLog } from "./file-logger";
import { isTestFile } from "./path-checks";
import { getDatabaseVariableNames } from "./get-db-names";

import {
    getDefaultExportReturnType,
    getDefaultExportParameterCount,
    getDefaultExportParameters,
    hasDefaultExport,
    isDefaultExportFunction,
    parseTypeScript,
} from "./ts-analyzer";




/**
 * Rule: Function file name must start with fn., fx., or tx.
 */
export function assertFunctionFileName(args: { directory: string, filePath: string }) {
    const fileName = path.basename(args.filePath, ".ts");
    
    const isFn = fileName.startsWith("fn.");
    const isFx = fileName.startsWith("fx.");
    const isTx = fileName.startsWith("tx.");
    
    if (!isFn && !isFx && !isTx) {
        fileLog("assertFunctionFileName", "invalid function file name", fileName);
        throw new Error(
            "Function file names must start with 'fn.', 'fx.', or 'tx.'. " +
            `Found: ${fileName}.ts. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
}

/**
 * Rule: Function path cannot have more than 1 level of module nesting
 * Allow: src/function/<fn-name> (1 part)
 * Allow: src/function/<module>/<fn-name> (2 parts)
 * Reject: src/function/<module>/<submodule>/... (3+ parts)
 */
export function assertFunctionPathDepth(args: { directory: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);
    
    // Remove src/function/ prefix
    const pathAfterFunction = relativePath.replace("src/function/", "");
    const parts = pathAfterFunction.split("/");
    
    if (parts.length > 2) {
        fileLog("assertFunctionPathDepth", "too many levels", parts.length);
        throw new Error(
            "Function path cannot have more than 1 level of module nesting. " +
            `Found ${parts.length} levels: ${pathAfterFunction}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertFunctionPathDepth", "valid depth", parts.length);
}

/**
 * Rule: Function must have a default export
 */
export function assertFunctionDefaultExport(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    if (!hasDefaultExport(args.sourceFile)) {
        fileLog("assertFunctionDefaultExport", "no default export");
        throw new Error(
            "Function must have a default export. " +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
}

/**
 * Rule: Function default export must be a function
 */
export function assertFunctionDefaultExportIsFunction(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    if (!isDefaultExportFunction(args.sourceFile)) {
        fileLog("assertFunctionDefaultExportIsFunction", "not a function");
        throw new Error(
            "Function default export must be a function. " +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
}

/**
 * Rule: Pure function (fn.) must return TErrTuple
 */
export function assertFnReturnType(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const returnType = getDefaultExportReturnType(args.sourceFile);
    
    if (!returnType) {
        fileLog("assertFnReturnType", "no return type");
        throw new Error(
            "Pure function must have an explicit return type. " +
            "Expected: TErrTuple<Data>. " +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    if (!returnType.includes("TErrTuple")) {
        fileLog("assertFnReturnType", "returnType is not TErrTuple", returnType);
        throw new Error(
            "Pure function must return TErrTuple<Data>. " +
            `Found: ${returnType}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertFnReturnType", "valid TErrTuple return type", returnType);
}

/**
 * Rule: Pure function (fn.) must have exactly 1 parameter (TArgs)
 */
export function assertFnParameterCount(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const paramCount = getDefaultExportParameterCount(args.sourceFile);
    
    if (paramCount !== 1) {
        fileLog("assertFnParameterCount", "wrong parameter count", paramCount);
        throw new Error(
            "Pure function must have exactly 1 parameter (TArgs). " +
            `Found: ${paramCount} parameters. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertFnParameterCount", "valid parameter count", paramCount);
}

/**
 * Rule: Effectful function (fx.) must return TErrTuple
 */
export function assertFxReturnType(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const returnType = getDefaultExportReturnType(args.sourceFile);
    
    if (!returnType) {
        fileLog("assertFxReturnType", "no return type");
        throw new Error(
            "Effectful function must have an explicit return type. " +
            "Expected: TErrTuple<Data>. " +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    if (!returnType.includes("TErrTuple")) {
        fileLog("assertFxReturnType", "returnType is not TErrTuple", returnType);
        throw new Error(
            "Effectful function must return TErrTuple<Data>. " +
            `Found: ${returnType}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertFxReturnType", "valid TErrTuple return type", returnType);
}

/**
 * Rule: Effectful function (fx.) must have exactly 2 parameters (TPortal, TArgs)
 */
export function assertFxParameterCount(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const paramCount = getDefaultExportParameterCount(args.sourceFile);
    
    if (paramCount !== 2) {
        fileLog("assertFxParameterCount", "wrong parameter count", paramCount);
        throw new Error(
            "Effectful function must have exactly 2 parameters (TPortal, TArgs). " +
            `Found: ${paramCount} parameters. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertFxParameterCount", "valid parameter count", paramCount);
}

/**
 * Rule: Effectful function (fx.) first parameter must contain "Portal"
 */
export function assertFxFirstParameterType(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const parameters = getDefaultExportParameters(args.sourceFile);
    
    if (parameters.length === 0) {
        fileLog("assertFxFirstParameterType", "no parameters found");
        throw new Error(
            "Effectful function must have 2 parameters. " +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    const firstParamType = parameters[0].type;
    if (!firstParamType.includes("Portal")) {
        fileLog("assertFxFirstParameterType", "first parameter not Portal type", firstParamType);
        throw new Error(
            "Effectful function first parameter must be a Portal type (contains 'Portal'). " +
            `Found: ${firstParamType}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertFxFirstParameterType", "valid first parameter type", firstParamType);
}

/**
 * Rule: Transactional function (tx.) must return TErrTriple
 */
export function assertTxReturnType(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const returnType = getDefaultExportReturnType(args.sourceFile);
    
    if (!returnType) {
        fileLog("assertTxReturnType", "no return type");
        throw new Error(
            "Transactional function must have an explicit return type. " +
            "Expected: TErrTriple<Data>. " +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    if (!returnType.includes("TErrTriple")) {
        fileLog("assertTxReturnType", "returnType is not TErrTriple", returnType);
        throw new Error(
            "Transactional function must return TErrTriple<Data>. " +
            `Found: ${returnType}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertTxReturnType", "valid TErrTriple return type", returnType);
}

/**
 * Rule: Transactional function (tx.) must have exactly 2 parameters (TPortal, TArgs)
 */
export function assertTxParameterCount(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const paramCount = getDefaultExportParameterCount(args.sourceFile);
    
    if (paramCount !== 2) {
        fileLog("assertTxParameterCount", "wrong parameter count", paramCount);
        throw new Error(
            "Transactional function must have exactly 2 parameters (TPortal, TArgs). " +
            `Found: ${paramCount} parameters. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertTxParameterCount", "valid parameter count", paramCount);
}

/**
 * Rule: Transactional function (tx.) first parameter must contain "Portal"
 */
export function assertTxFirstParameterType(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const parameters = getDefaultExportParameters(args.sourceFile);
    
    if (parameters.length === 0) {
        fileLog("assertTxFirstParameterType", "no parameters found");
        throw new Error(
            "Transactional function must have 2 parameters. " +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    const firstParamType = parameters[0].type;
    if (!firstParamType.includes("Portal")) {
        fileLog("assertTxFirstParameterType", "first parameter not Portal type", firstParamType);
        throw new Error(
            "Transactional function first parameter must be a Portal type (contains 'Portal'). " +
            `Found: ${firstParamType}. ` +
            "You might want to read .opencode/agent/function-builder.md"
        );
    }
    
    fileLog("assertTxFirstParameterType", "valid first parameter type", firstParamType);
}

/**
 * Rule: TPortal's db variable must be properly typed
 */
export async function assertDbPortalType(args: { directory: string, content: string, filePath: string }) {
    // Use regex to find TPortal definition and db property type
    const portalRegex = /export\s+type\s+TPortal\s*=\s*{([^}]+)}/s;
    const portalMatch = args.content.match(portalRegex);
    
    if (!portalMatch) {
        fileLog("assertDbPortalType", "no TPortal found");
        return; // Rule doesn't apply
    }
    
    const portalBody = portalMatch[1];
    
    // Find db property in TPortal
    const dbPropertyRegex = /db\s*:\s*typeof\s+(\w+)/;
    const dbMatch = portalBody.match(dbPropertyRegex);
    
    if (!dbMatch) {
        fileLog("assertDbPortalType", "no db property found");
        return; // Rule doesn't apply
    }
    
    const dbTypeVariable = dbMatch[1];
    
    // Get all database variable names
    const dbVariables = await getDatabaseVariableNames(args.directory);
    
    if (dbVariables.length === 0) {
        fileLog("assertDbPortalType", "No database variables found in conn.*.ts files");
        return;
    }
    
    // Check if db property type is typeof one of the database variables
    if (!dbVariables.includes(dbTypeVariable)) {
        const dbVarsList = dbVariables.join(', ');
        fileLog("assertDbPortalType", "invalid db type", dbTypeVariable);
        throw new Error(
            `TPortal.db must be typeof one of the database variables: ${dbVarsList}. ` +
            `Found: typeof ${dbTypeVariable}. ` +
            `Available database variables: ${dbVarsList}. ` +
            `You might want to read .opencode/agent/function-builder.md`
        );
    }
    
    fileLog("assertDbPortalType", `TPortal.db is correctly typed as typeof ${dbTypeVariable}`);
}

/**
 * Check if file is in function folder
 */
function isFunctionFolder(args: { directory: string, filePath: string }): boolean {
    const relativePath = path.relative(args.directory, args.filePath);
    if (!relativePath.startsWith("src/function/")) {
        return false;
    }

    return true;
}

/**
 * Check if file name starts with fn. prefix
 */
export function isFnFunction(args: { directory: string, filePath: string }): boolean {
    const fileName = path.basename(args.filePath, ".ts");
    return fileName.startsWith("fn.");
}

/**
 * Check if file name starts with fx. prefix
 */
export function isFxFunction(args: { directory: string, filePath: string }): boolean {
    const fileName = path.basename(args.filePath, ".ts");
    return fileName.startsWith("fx.");
}

/**
 * Check if file name starts with tx. prefix
 */
export function isTxFunction(args: { directory: string, filePath: string }): boolean {
    const fileName = path.basename(args.filePath, ".ts");
    return fileName.startsWith("tx.");
}

/**
 * Get the corresponding function file path from a test file path
 * Example: src/function/magic-cards/fx.get-user.test.ts -> src/function/magic-cards/fx.get-user.ts
 */
function getCorrespondingFunctionFile(args: { filePath: string }): string {
    return args.filePath.replace(".test.ts", ".ts");
}

/**
 * Check if the function file uses a database in TPortal
 * Returns the database variable name if found, null otherwise
 */
async function getFunctionDbVariable(args: { directory: string, functionFilePath: string }): Promise<string | null> {
    try {
        const content = await Bun.file(args.functionFilePath).text();
        
        // Look for TPortal definition - use a more robust approach
        // Find the start of TPortal
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
        
        return dbMatch[1]; // Return the database variable name (e.g., magicCardsDb)
    } catch (error) {
        fileLog("getFunctionDbVariable", "error reading function file", args.functionFilePath, String(error));
        return null;
    }
}

/**
 * Get the testing database function name from a database variable name
 * Example: magicCardsDb -> createTestingMagicCardsDb
 */
function getTestingDbFunctionName(dbVariableName: string): string {
    // Remove 'Db' suffix and convert to PascalCase
    // magicCardsDb -> magicCards -> MagicCards -> createTestingMagicCardsDb
    const withoutDb = dbVariableName.replace(/Db$/, '');
    const pascalCase = withoutDb.charAt(0).toUpperCase() + withoutDb.slice(1);
    return `createTesting${pascalCase}Db`;
}

/**
 * Check if test file imports the testing database function
 */
function hasTestingDbImport(args: { content: string, testingDbFunctionName: string }): boolean {
    // Check for import statement containing the testing function name
    const importRegex = new RegExp(`import\\s+{[^}]*${args.testingDbFunctionName}[^}]*}\\s+from\\s+['"](.*?)conn\\.[^'"]+['"]`);
    return importRegex.test(args.content);
}

/**
 * Rule: If function uses database, test file must import testing database
 */
export async function assertTestFileImportsTestingDb(args: { directory: string, content: string, filePath: string }) {
    const functionFilePath = getCorrespondingFunctionFile({ filePath: args.filePath });
    
    // Check if corresponding function file exists
    if (!(await Bun.file(functionFilePath).exists())) {
        fileLog("assertTestFileImportsTestingDb", "function file not found", functionFilePath);
        return; // Rule doesn't apply if function file doesn't exist
    }
    
    // Check if function uses database
    const dbVariable = await getFunctionDbVariable({ directory: args.directory, functionFilePath });
    
    if (!dbVariable) {
        fileLog("assertTestFileImportsTestingDb", "no db variable in function", functionFilePath);
        return; // Rule doesn't apply if function doesn't use database
    }
    
    // Get expected testing function name
    const testingDbFunctionName = getTestingDbFunctionName(dbVariable);
    
    // Check if test file imports the testing database function
    if (!hasTestingDbImport({ content: args.content, testingDbFunctionName })) {
        fileLog("assertTestFileImportsTestingDb", "missing testing db import", testingDbFunctionName);
        throw new Error(
            `Test file must import the testing database function when testing database operations. ` +
            `Expected import: import { ${testingDbFunctionName} } from '@/src/database/.../conn....ts'. ` +
            `Your function uses database variable '${dbVariable}', so tests must use '${testingDbFunctionName}()' instead of mocking. ` +
            `You might want to read .opencode/agent/function-builder.md`
        );
    }
    
    fileLog("assertTestFileImportsTestingDb", "valid testing db import", testingDbFunctionName);
}


// ===== COMBINED CHECK FUNCTIONS =====

export async function checkFnBeforeWrite(args: { directory: string, content: string, filePath: string }) {
    if (!isFunctionFolder(args)) return;
    
    // Test files have different checks
    if (isTestFile(args)) {
        return; // Path checks don't apply to test files
    }
    
    assertFunctionFileName(args);
    assertFunctionPathDepth(args);
}

export async function checkFnBeforeEdit(args: { directory: string, content: string, filePath: string }) {
    if (!isFunctionFolder(args)) return;
    
    // Test files have different checks
    if (isTestFile(args)) {
        return; // Path checks don't apply to test files
    }
    
    assertFunctionFileName(args);
    assertFunctionPathDepth(args);
}

export async function checkFnAfterWrite(args: { directory: string, content: string, filePath: string }) {
    if (!isFunctionFolder(args)) return;
    
    // Test files have different checks
    if (isTestFile(args)) {
        assertTestFileImportsTestingDb(args);
        return;
    }

    const sourceFile = parseTypeScript(args.content);
    
    assertFunctionFileName(args);
    assertFunctionPathDepth(args);
    assertFunctionDefaultExport({ sourceFile, ...args });
    assertFunctionDefaultExportIsFunction({ sourceFile, ...args });
    
    // Check return types and parameters based on function prefix
    if (isFnFunction(args)) {
        assertFnReturnType({ sourceFile, ...args });
        assertFnParameterCount({ sourceFile, ...args });
    }
    if (isFxFunction(args)) {
        assertFxReturnType({ sourceFile, ...args });
        assertFxParameterCount({ sourceFile, ...args });
        assertFxFirstParameterType({ sourceFile, ...args });
    }
    if (isTxFunction(args)) {
        assertTxReturnType({ sourceFile, ...args });
        assertTxParameterCount({ sourceFile, ...args });
        assertTxFirstParameterType({ sourceFile, ...args });
    }
    
    // Check db portal type for effectful and transactional functions
    if (isFxFunction(args) || isTxFunction(args)) {
        await assertDbPortalType(args);
    }
}

export async function checkFnAfterEdit(args: { directory: string, content: string, filePath: string }) {
    if (!isFunctionFolder(args)) return;
    
    // Test files have different checks
    if (isTestFile(args)) {
        assertTestFileImportsTestingDb(args);
        return;
    }

    const sourceFile = parseTypeScript(args.content);
    
    assertFunctionFileName(args);
    assertFunctionPathDepth(args);
    assertFunctionDefaultExport({ sourceFile, ...args });
    assertFunctionDefaultExportIsFunction({ sourceFile, ...args });
    
    // Check return types and parameters based on function prefix
    if (isFnFunction(args)) {
        assertFnReturnType({ sourceFile, ...args });
        assertFnParameterCount({ sourceFile, ...args });
    }
    if (isFxFunction(args)) {
        assertFxReturnType({ sourceFile, ...args });
        assertFxParameterCount({ sourceFile, ...args });
        assertFxFirstParameterType({ sourceFile, ...args });
    }
    if (isTxFunction(args)) {
        assertTxReturnType({ sourceFile, ...args });
        assertTxParameterCount({ sourceFile, ...args });
        assertTxFirstParameterType({ sourceFile, ...args });
    }
    
    // Check db portal type for effectful and transactional functions
    if (isFxFunction(args) || isTxFunction(args)) {
        await assertDbPortalType(args);
    }
}
