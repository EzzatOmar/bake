import path from "node:path";
import { SourceFile } from "typescript";
import { fileLog } from "./file-logger";
import { isTestFile } from "./path-checks";
import {
    getDefaultExportParameters,
    getDefaultExportReturnType,
    hasDefaultExport,
    isDefaultExportFunction,
    parseTypeScript,
    getImportedFunctionNames,
    findTypeAlias,
    getTypeLiteralPropertyNames
} from "./ts-analyzer";




/**
 * Rule: Controller file name must start with ctrl.
 */
export function assertControllerFileName(args: { directory: string, filePath: string }) {
    const fileName = path.basename(args.filePath, ".ts");
    
    if (!fileName.startsWith("ctrl.")) {
        fileLog("assertControllerFileName", "invalid controller file name", fileName);
        throw new Error(
            "Controller file names must start with 'ctrl.'. " +
            `Found: ${fileName}.ts. ` +
            "You might want to read .opencode/agent/ctrl-builder.md"
        );
    }
    
}

/**
 * Rule: Controller must have a default export
 */
export function assertControllerDefaultExport(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    if (!hasDefaultExport(args.sourceFile)) {
        fileLog("assertControllerDefaultExport", "no default export");
        throw new Error(
            "Controller must have a default export function. " +
            "You might want to read .opencode/agent/controller-builder.md"
        );
    }
}

/**
 * Rule: Controller default export must be a function
 */
export function assertControllerDefaultExportIsFunction(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    if (!isDefaultExportFunction(args.sourceFile)) {
        fileLog("assertControllerDefaultExportIsFunction", "not a function");
        throw new Error(
            "Controller default export must be a function. " +
            "You might want to read .opencode/agent/controller-builder.md"
        );
    }
}

/**
 * Rule: Controller function must have exactly 2 parameters
 */
export function assertControllerParameterCount(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const parameters = getDefaultExportParameters(args.sourceFile);
    if (parameters.length !== 2) {
        fileLog("assertControllerParameterCount", "wrong parameter count", parameters.length);
        throw new Error(
            `Controller function must have exactly 2 parameters (TPortal, TArgs), found ${parameters.length}. ` +
            "You might want to read .opencode/agent/controller-builder.md"
        );
    }
}

/**
 * Rule: First parameter must be a portal type
 */
export function assertControllerFirstParameterIsPortal(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const parameters = getDefaultExportParameters(args.sourceFile);
    const firstParam = parameters[0];
    if (!firstParam.type.includes('Portal') && !firstParam.type.includes('portal')) {
        fileLog("assertControllerFirstParameterIsPortal", "first param not portal", firstParam.type);
        throw new Error(
            `First parameter must be a portal type (TPortal), found: ${firstParam.type}. ` +
            "You might want to read .opencode/agent/controller-builder.md"
        );
    }
}

/**
 * Rule: Second parameter must be an args type
 */
export function assertControllerSecondParameterIsArgs(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const parameters = getDefaultExportParameters(args.sourceFile);
    const secondParam = parameters[1];
    if (!secondParam.type.includes('Args') && !secondParam.type.includes('args')) {
        fileLog("assertControllerSecondParameterIsArgs", "second param not args", secondParam.type);
        throw new Error(
            `Second parameter must be an args type (TArgs), found: ${secondParam.type}. ` +
            "You might want to read .opencode/agent/controller-builder.md"
        );
    }
}

/**
 * Rule: Controller must return proper tuple type
 */
export function assertControllerReturnType(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const returnType = getDefaultExportReturnType(args.sourceFile);
    if (!returnType) {
        fileLog("assertControllerReturnType", "no return type");
        throw new Error(
            "Controller function must have an explicit return type. " +
            "Expected: TErrTuple<Data>. " +
            "You might want to read .opencode/agent/ctrl-builder.md"
        );
    }

// Check if return type matches the expected pattern
    // Controllers should return TErrTuple<T> directly (not wrapped in Promise)
    const hasPromise = returnType.includes('Promise');
    const hasTErrTuple = returnType.includes('TErrTuple');
    const hasUnion = returnType.includes('|');
    const hasNullFirst = returnType.includes('[null,') || returnType.includes('[ null,');
    const hasNullSecond = returnType.includes(', null]') || returnType.includes(', null ]');
    const hasTErrorEntry = returnType.includes('TErrorEntry') || returnType.includes('any') || returnType.includes('Error');
    
    // Controllers should ONLY return TErrTuple<T> (with or without Promise wrapper)
    // Promise<[Data, null] | [null, TErrorEntry]> is NOT allowed
    const isValidPattern = hasTErrTuple;
    
    if (!isValidPattern) {
        fileLog("assertControllerReturnType", "invalid return type", returnType);
        throw new Error(
            "Controller function must return TErrTuple<Data>. " +
            `Found: ${returnType}. ` +
            "You might want to read .opencode/agent/ctrl-builder.md"
        );
    }
}

/**
 * Rule: TPortal must not contain function imports
 * Controllers should receive only variables (like db connections) in TPortal, not functions.
 * Functions should be imported and called directly in the controller.
 */
export function assertPortalDoesNotContainFunctions(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    // Get all imported function names from src/function/
    const importedFunctions = getImportedFunctionNames(args.sourceFile);
    
    if (importedFunctions.length === 0) {
        // No function imports, so no violation possible
        return;
    }
    
    // Find TPortal type definition
    const tPortalType = findTypeAlias(args.sourceFile, 'TPortal');
    if (!tPortalType) {
        // No TPortal defined, skip check
        return;
    }
    
    // Get property names from TPortal
    const portalProperties = getTypeLiteralPropertyNames(tPortalType.type);
    
    // Check if any imported function names appear in TPortal properties
    const functionsInPortal = portalProperties.filter(prop => 
        importedFunctions.includes(prop)
    );
    
    if (functionsInPortal.length > 0) {
        fileLog("assertPortalDoesNotContainFunctions", "functions in portal", functionsInPortal);
        throw new Error(
            `TPortal must not contain function imports. Found: ${functionsInPortal.join(', ')}. ` +
            `Controllers should import and call functions directly, not pass them through TPortal. ` +
            `TPortal should only contain variables (like db connections) that need to be mocked for testing. ` +
            `If the function needs dependencies (like a db connection), pass those variables in TPortal or TArgs, ` +
            `and let the controller call the function with those dependencies. ` +
            `You might want to read .opencode/agent/ctrl-builder.md`
        );
    }
}

function isControllerFolder(args: { directory: string, filePath: string }): boolean {
    const relativePath = path.relative(args.directory, args.filePath);
    if (!relativePath.startsWith("src/controller/")) {
        return false;
    }

    return true;
}


// ===== COMBINED CHECK FUNCTIONS =====

export async function checkCtrlBeforeWrite(args: { directory: string, content: string, filePath: string }) {
    if (!isControllerFolder(args)) return;
    if (isTestFile(args)) return;
    assertControllerFileName(args);
}

export async function checkCtrlBeforeEdit(args: { directory: string, content: string, filePath: string }) {
    if (!isControllerFolder(args)) return;
    if (isTestFile(args)) return;
    assertControllerFileName(args);
}

export async function checkCtrlAfterWrite(args: { directory: string, content: string, filePath: string }) {
    if (!isControllerFolder(args)) return;
    if (isTestFile(args)) return;

    const sourceFile = parseTypeScript(args.content);
    assertControllerFileName(args);
    assertControllerDefaultExport({ sourceFile, ...args });
    assertControllerDefaultExportIsFunction({ sourceFile, ...args });
    assertControllerParameterCount({ sourceFile, ...args });
    assertControllerFirstParameterIsPortal({ sourceFile, ...args });
    assertControllerSecondParameterIsArgs({ sourceFile, ...args });
    assertControllerReturnType({ sourceFile, ...args });
    assertPortalDoesNotContainFunctions({ sourceFile, ...args });
}

export async function checkCtrlAfterEdit(args: { directory: string, content: string, filePath: string }) {
    if (!isControllerFolder(args)) return;
    if (isTestFile(args)) return;
    

    const sourceFile = parseTypeScript(args.content);
    assertControllerFileName(args);
    assertControllerDefaultExport({ sourceFile, ...args });
    assertControllerDefaultExportIsFunction({ sourceFile, ...args });
    assertControllerParameterCount({ sourceFile, ...args });
    assertControllerFirstParameterIsPortal({ sourceFile, ...args });
    assertControllerSecondParameterIsArgs({ sourceFile, ...args });
    assertControllerReturnType({ sourceFile, ...args });
    assertPortalDoesNotContainFunctions({ sourceFile, ...args });
}


