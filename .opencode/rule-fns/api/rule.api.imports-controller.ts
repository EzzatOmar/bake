import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

export const ruleApiImportsController: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );
    
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
    
    visit(sourceFile);
    
    // Check if any import contains a controller file (ctrl.*)
    const hasControllerImport = imports.some(importPath => {
        // Extract the filename from the import path
        const filename = importPath.split('/').pop() || '';
        return filename.startsWith('ctrl.');
    });
    
    if (!hasControllerImport) {
        return {
            error: "API files must import at least one controller file (ctrl.*). " +
            `File ${filePath} does not import any controller. ` +
            "Controllers handle business logic and database operations. " +
            "API handlers should delegate to controllers and pass all necessary parameters including database connections. " +
            "You might want to read .opencode/agent/api-builder.md and .opencode/agent/ctrl-builder.md"
        };
    }
}