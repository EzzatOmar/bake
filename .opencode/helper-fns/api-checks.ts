import path from "node:path";
import { SourceFile } from "typescript";
import { fileLog } from "./file-logger";
import { isTestFile } from "./path-checks";
import {
    parseTypeScript,
    hasDefaultExport,
    findDefaultExportDeclaration,
} from "./ts-analyzer";
import ts from 'typescript';
import type { TCheckResult } from "../plugin/vb";


// ===== ELYSIA PATTERN ASSERTIONS =====

/**
 * Rule: API file name must start with api.
 */
export function assertApiFileName(args: { directory: string, filePath: string }) {
    const fileName = path.basename(args.filePath, ".ts");

    // Allow .model.ts files for validation schemas
    if (fileName.endsWith(".model")) {
        return;
    }

    if (!fileName.startsWith("api.")) {
        fileLog("assertApiFileName", "invalid API file name", fileName);
        throw new Error(
            "API file names must start with 'api.'. " +
            `Found: ${fileName}.ts. ` +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
}

/**
 * Rule: API must import Elysia from 'elysia'
 */
export function assertApiImportsElysia(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);

    // Check for Elysia import
    let hasElysiaImport = false;

    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text === 'elysia') {
                // Check if Elysia is imported
                const importClause = node.importClause;
                if (importClause && importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
                    for (const element of importClause.namedBindings.elements) {
                        if (element.name.text === 'Elysia') {
                            hasElysiaImport = true;
                            return;
                        }
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(args.sourceFile);

    if (!hasElysiaImport) {
        fileLog("assertApiImportsElysia", "no Elysia import found");
        throw new Error(
            "API files must import Elysia from 'elysia'. " +
            `File ${relativePath} does not import Elysia. ` +
            "Add: import { Elysia } from 'elysia'; " +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
}

/**
 * Rule: API must export default a new Elysia() instance
 */
export function assertApiDefaultExportIsElysia(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);

    // Find export default statement
    let foundElysiaExport = false;

    function visit(node: ts.Node) {
        // Check for: export default new Elysia(...)
        if (ts.isExportAssignment(node) && !node.isExportEquals) {
            const expr = node.expression;
            if (ts.isNewExpression(expr)) {
                const exprText = expr.expression;
                if (ts.isIdentifier(exprText) && exprText.text === 'Elysia') {
                    foundElysiaExport = true;
                    return;
                }
            }
            // Check for chained: export default new Elysia(...).get(...).post(...)
            if (ts.isCallExpression(expr)) {
                let current: ts.Expression = expr;
                while (ts.isCallExpression(current)) {
                    if (ts.isPropertyAccessExpression(current.expression)) {
                        current = current.expression.expression;
                    } else {
                        break;
                    }
                }
                if (ts.isNewExpression(current)) {
                    const exprText = current.expression;
                    if (ts.isIdentifier(exprText) && exprText.text === 'Elysia') {
                        foundElysiaExport = true;
                        return;
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(args.sourceFile);

    if (!foundElysiaExport) {
        fileLog("assertApiDefaultExportIsElysia", "default export is not Elysia instance");
        throw new Error(
            "API files must default export a new Elysia() instance. " +
            `File ${relativePath} does not export an Elysia instance. ` +
            "Use: export default new Elysia({ prefix: '/api/...' }).get(...); " +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
}

/**
 * Rule: Elysia instance must have a prefix option
 */
export function assertApiElysiaHasPrefix(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);

    let foundPrefix = false;
    let prefixValue: string | null = null;

    function visit(node: ts.Node) {
        if (ts.isNewExpression(node)) {
            const exprText = node.expression;
            if (ts.isIdentifier(exprText) && exprText.text === 'Elysia') {
                // Check arguments for { prefix: '...' }
                if (node.arguments && node.arguments.length > 0) {
                    const firstArg = node.arguments[0];
                    if (ts.isObjectLiteralExpression(firstArg)) {
                        for (const prop of firstArg.properties) {
                            if (ts.isPropertyAssignment(prop) &&
                                ts.isIdentifier(prop.name) &&
                                prop.name.text === 'prefix') {
                                foundPrefix = true;
                                if (ts.isStringLiteral(prop.initializer)) {
                                    prefixValue = prop.initializer.text;
                                }
                                return;
                            }
                        }
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(args.sourceFile);

    if (!foundPrefix) {
        fileLog("assertApiElysiaHasPrefix", "Elysia instance missing prefix option");
        throw new Error(
            "API Elysia instance must have a 'prefix' option. " +
            `File ${relativePath} is missing prefix. ` +
            "Use: new Elysia({ prefix: '/api/module/endpoint' }) " +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }

    // Validate prefix starts with /api/
    if (prefixValue !== null) {
        const prefix = prefixValue as string; // Type assertion
        if (!prefix.startsWith('/api/')) {
            fileLog("assertApiElysiaHasPrefix", "prefix must start with /api/", prefix);
            throw new Error(
                "API Elysia prefix must start with '/api/'. " +
                `Found prefix: '${prefix}' in ${relativePath}. ` +
                "You might want to read .opencode/agent/api-builder.md"
            );
        }
    }
}

/**
 * Rule: API must have a default export
 */
export function assertApiDefaultExport(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    if (!hasDefaultExport(args.sourceFile)) {
        const relativePath = path.relative(args.directory, args.filePath);
        fileLog("assertApiDefaultExport", "no default export");
        throw new Error(
            "API files must have a default export. " +
            `File ${relativePath} has no default export. ` +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
}

/**
 * Rule: API default export must be a variable declaration
 */
export function assertApiDefaultExportIsVariable(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);
    const defaultExportDeclaration = findDefaultExportDeclaration(args.sourceFile);
    
    if (!defaultExportDeclaration) {
        fileLog("assertApiDefaultExportIsVariable", "no default export declaration");
        throw new Error(
            "API files must have a default export. " +
            `File ${relativePath} has no default export. ` +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
    
    let exportedVariable: ts.VariableDeclaration | null = null;
    
    // Handle 'default export' syntax (VariableStatement with ExportKeyword)
    if (ts.isVariableStatement(defaultExportDeclaration)) {
        // Get the first variable declaration from the list
        if (defaultExportDeclaration.declarationList.declarations.length > 0) {
            exportedVariable = defaultExportDeclaration.declarationList.declarations[0] as ts.VariableDeclaration;
        }
    }
    // Handle 'export default' syntax (ExportAssignment)
    else if (ts.isExportAssignment(defaultExportDeclaration) && !defaultExportDeclaration.isExportEquals) {
        // If it's an identifier, find the variable declaration
        if (ts.isIdentifier(defaultExportDeclaration.expression)) {
            const variable = findVariableDeclaration(args.sourceFile, defaultExportDeclaration.expression.text);
            if (variable) {
                exportedVariable = variable;
            }
        }
    }
    
    if (!exportedVariable) {
        fileLog("assertApiDefaultExportIsVariable", "default export is not a variable");
        throw new Error(
            "API files must default export a variable declaration. " +
            `Found invalid default export in ${relativePath}. ` +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
}

/**
 * Rule: API variable name must start with "api"
 */
export function assertApiVariableName(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);
    const defaultExportDeclaration = findDefaultExportDeclaration(args.sourceFile);
    
    if (!defaultExportDeclaration) {
        return; // Will be caught by assertApiDefaultExportIsVariable
    }
    
    let exportedVariable: ts.VariableDeclaration | null = null;
    
    if (ts.isVariableStatement(defaultExportDeclaration)) {
        if (defaultExportDeclaration.declarationList.declarations.length > 0) {
            exportedVariable = defaultExportDeclaration.declarationList.declarations[0] as ts.VariableDeclaration;
        }
    } else if (ts.isExportAssignment(defaultExportDeclaration) && !defaultExportDeclaration.isExportEquals) {
        if (ts.isIdentifier(defaultExportDeclaration.expression)) {
            const variable = findVariableDeclaration(args.sourceFile, defaultExportDeclaration.expression.text);
            if (variable) {
                exportedVariable = variable;
            }
        }
    }
    
    if (!exportedVariable) {
        return; // Will be caught by assertApiDefaultExportIsVariable
    }
    
    const variableDecl = exportedVariable as ts.VariableDeclaration;
    const variableNameNode = variableDecl.name;
    
    if (!variableNameNode || !ts.isIdentifier(variableNameNode)) {
        fileLog("assertApiVariableName", "variable name is not an identifier");
        throw new Error(
            "API files must default export a named variable. " +
            `Found invalid variable declaration in ${relativePath}. ` +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
    
    const variableName = variableNameNode.text;
    if (!variableName.startsWith("api")) {
        fileLog("assertApiVariableName", "variable name does not start with 'api'", variableName);
        throw new Error(
            "API variables must start with 'api' prefix. " +
            `Found '${variableName}' in ${relativePath}. ` +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
}

/**
 * Rule: API variable must have explicit type annotation
 */
export function assertApiVariableType(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);
    const defaultExportDeclaration = findDefaultExportDeclaration(args.sourceFile);
    
    if (!defaultExportDeclaration) {
        return; // Will be caught by assertApiDefaultExportIsVariable
    }
    
    let exportedVariable: ts.VariableDeclaration | null = null;
    
    if (ts.isVariableStatement(defaultExportDeclaration)) {
        if (defaultExportDeclaration.declarationList.declarations.length > 0) {
            exportedVariable = defaultExportDeclaration.declarationList.declarations[0] as ts.VariableDeclaration;
        }
    } else if (ts.isExportAssignment(defaultExportDeclaration) && !defaultExportDeclaration.isExportEquals) {
        if (ts.isIdentifier(defaultExportDeclaration.expression)) {
            const variable = findVariableDeclaration(args.sourceFile, defaultExportDeclaration.expression.text);
            if (variable) {
                exportedVariable = variable;
            }
        }
    }
    
    if (!exportedVariable) {
        return; // Will be caught by assertApiDefaultExportIsVariable
    }
    
    const variableDecl = exportedVariable as ts.VariableDeclaration;
    const variableNameNode = variableDecl.name;
    
    if (!variableNameNode || !ts.isIdentifier(variableNameNode)) {
        return; // Will be caught by assertApiVariableName
    }
    
    const variableName = variableNameNode.text;
    
    // Check if the variable has a type annotation
    if (!variableDecl.type) {
        fileLog("assertApiVariableType", "missing type annotation", variableName);
        throw new Error(
            "API variables must have explicit type annotation. " +
            `Missing type annotation for '${variableName}' in ${relativePath}. ` +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
    
    // Extract the type string
    const typeString = variableDecl.type.getText(args.sourceFile);
    
    // Check if the type matches the expected API handler type
    // The type should be: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/...'>, Server<undefined>, Response>>>
    const expectedTypePattern = /^Partial<Record<Serve\.HTTPMethod,\s*Serve\.Handler<BunRequest<['"][^'"]*['"]>\s*,\s*Server<undefined>,\s*Response>>>$/;
    
    if (!expectedTypePattern.test(typeString)) {
        fileLog("assertApiVariableType", "invalid type annotation", typeString);
        throw new Error(
            "API variables must have the correct type: " +
            "`Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/...'>, Server<undefined>, Response>>>`. " +
            `Found '${typeString}' for '${variableName}' in ${relativePath}. ` +
            "You might want to read .opencode/agent/api-builder.md"
        );
    }
    
    fileLog("assertApiVariableType", "valid type annotation", typeString);
}

/**
 * Rule: API must import at least one controller file (ctrl.*)
 */
export function assertApiImportsController(args: { sourceFile: SourceFile, directory: string, content: string, filePath: string }) {
    const relativePath = path.relative(args.directory, args.filePath);
    
    // Get all import declarations
    const imports: string[] = [];
    
    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
            // Get the module specifier (the import path)
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier)) {
                imports.push(moduleSpecifier.text);
            }
        }
        ts.forEachChild(node, visit);
    }
    
    visit(args.sourceFile);
    
    // Check if any import contains a controller file (ctrl.*)
    const hasControllerImport = imports.some(importPath => {
        // Extract the filename from the import path
        const filename = importPath.split('/').pop() || '';
        return filename.startsWith('ctrl.');
    });
    
    if (!hasControllerImport) {
        fileLog("assertApiImportsController", "no controller import found", JSON.stringify(imports));
        throw new Error(
            "API files must import at least one controller file (ctrl.*). " +
            `File ${relativePath} does not import any controller. ` +
            "Controllers handle business logic and database operations. " +
            "API handlers should delegate to controllers and pass all necessary parameters including database connections. " +
            "You might want to read .opencode/agent/api-builder.md and .opencode/agent/ctrl-builder.md"
        );
    }
    
    fileLog("assertApiImportsController", "controller import found", JSON.stringify(imports));
}

/**
 * Check if file is in api folder
 */
function isApiFolder(args: { directory: string, filePath: string }): boolean {
    const relativePath = path.relative(args.directory, args.filePath);
    if (!relativePath.startsWith("src/api/")) {
        return false;
    }

    return true;
}

/**
 * Check if file is a model file (api.<name>.model.ts)
 */
function isApiModelFile(args: { filePath: string }): boolean {
    const fileName = path.basename(args.filePath, ".ts");
    return fileName.endsWith(".model");
}

/**
 * Check if file is the router file
 */
function isRouterFile(args: { directory: string, filePath: string }): boolean {
    const relativePath = path.relative(args.directory, args.filePath);
    return relativePath === "src/api/router.ts";
}


// ===== COMBINED CHECK FUNCTIONS =====

export async function checkApiBeforeWrite(args: { directory: string, content: string, filePath: string }) {
    if (!isApiFolder(args)) return;
    if (isTestFile(args)) return;
    if (isRouterFile(args)) return; // Router file has different rules

    assertApiFileName(args);
}

export async function checkApiBeforeEdit(args: { directory: string, content: string, filePath: string }) {
    if (!isApiFolder(args)) return;
    if (isTestFile(args)) return;
    if (isRouterFile(args)) return;

    assertApiFileName(args);
}

export async function checkApiAfterWrite(args: { directory: string, content: string, filePath: string }): Promise<TCheckResult> {
    if (!isApiFolder(args)) return;
    if (isTestFile(args)) return;
    if (isRouterFile(args)) return;
    if (isApiModelFile(args)) return; // Model files only need filename check

    const sourceFile = parseTypeScript(args.content);

    assertApiFileName(args);
    // Elysia pattern assertions
    assertApiImportsElysia({ sourceFile, ...args });
    assertApiDefaultExportIsElysia({ sourceFile, ...args });
    assertApiElysiaHasPrefix({ sourceFile, ...args });
    assertApiImportsController({ sourceFile, ...args });

    return {
        message: "<hint>Add this API route to src/api/router.ts using .use()</hint>"
    }
}

export async function checkApiAfterEdit(args: { directory: string, content: string, filePath: string }): Promise<TCheckResult> {
    if (!isApiFolder(args)) return;
    if (isTestFile(args)) return;
    if (isRouterFile(args)) return;
    if (isApiModelFile(args)) return;

    const sourceFile = parseTypeScript(args.content);

    assertApiFileName(args);
    // Elysia pattern assertions
    assertApiImportsElysia({ sourceFile, ...args });
    assertApiDefaultExportIsElysia({ sourceFile, ...args });
    assertApiElysiaHasPrefix({ sourceFile, ...args });
    assertApiImportsController({ sourceFile, ...args });

    return {
        message: "<hint>Add this API route to src/api/router.ts using .use()</hint>"
    }
}


// ===== HELPER FUNCTIONS =====

/**
 * Find a variable declaration by name in the source file
 */
function findVariableDeclaration(sourceFile: ts.SourceFile, name: string): ts.VariableDeclaration | null {
    let found: ts.VariableDeclaration | null = null;
    
    function visit(node: ts.Node) {
        if (ts.isVariableStatement(node)) {
            for (const declaration of node.declarationList.declarations) {
                if (ts.isVariableDeclaration(declaration) && 
                    declaration.name && 
                    ts.isIdentifier(declaration.name) && 
                    declaration.name.text === name) {
                    found = declaration;
                    return;
                }
            }
        }
        
        if (!found) {
            ts.forEachChild(node, visit);
        }
    }
    
    visit(sourceFile);
    return found;
}
