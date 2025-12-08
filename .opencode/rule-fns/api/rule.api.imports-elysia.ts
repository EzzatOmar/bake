import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

export const ruleApiImportsElysia: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

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

    visit(sourceFile);

    if (!hasElysiaImport) {
        return {
            error: "API files must import Elysia from 'elysia'. " +
            `File ${filePath} does not import Elysia. ` +
            "Add: import { Elysia } from 'elysia'; " +
            "You might want to read .opencode/agent/api-builder.md"
        };
    }
}