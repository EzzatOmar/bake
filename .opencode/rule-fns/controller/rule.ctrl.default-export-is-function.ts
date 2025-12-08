import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

function isDefaultExportFunction(sourceFile: ts.SourceFile): boolean {
    let isFunction = false;

    function visit(node: ts.Node) {
        // Check for: export default function ...
        if (ts.isFunctionDeclaration(node) && node.modifiers) {
            const hasExportKeyword = node.modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
            const hasDefaultKeyword = node.modifiers.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);
            if (hasExportKeyword && hasDefaultKeyword) {
                isFunction = true;
                return;
            }
        }

        if (ts.isExportAssignment(node) && !node.isExportEquals) {
            // Check if the exported value is a function
            if (ts.isFunctionExpression(node.expression) ||
                ts.isArrowFunction(node.expression) ||
                ts.isFunctionDeclaration(node.expression)) {
                isFunction = true;
                return;
            }

            // Check if it's an identifier pointing to a function
            if (ts.isIdentifier(node.expression)) {
                // Find the declaration of this identifier
                const functionName = node.expression.text;
                function findDeclaration(node: ts.Node): ts.FunctionDeclaration | null {
                    if (ts.isFunctionDeclaration(node) &&
                        node.name &&
                        node.name.text === functionName) {
                        return node;
                    }
                    if (ts.isVariableStatement(node)) {
                        for (const declaration of node.declarationList.declarations) {
                                if (ts.isVariableDeclaration(declaration) &&
                                ts.isIdentifier(declaration.name) &&
                                declaration.name.text === functionName &&
                                declaration.initializer &&
                                (ts.isFunctionExpression(declaration.initializer) ||
                                 ts.isArrowFunction(declaration.initializer))) {
                                return declaration.initializer as any;
                            }
                        }
                    }
                    let result: ts.FunctionDeclaration | null = null;
                    ts.forEachChild(node, (child) => {
                        if (!result) result = findDeclaration(child);
                    });
                    return result;
                }
                const funcDecl = findDeclaration(sourceFile);
                if (funcDecl) {
                    isFunction = true;
                    return;
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return isFunction;
}

export const ruleControllerDefaultExportIsFunction: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );
    
    if (!isDefaultExportFunction(sourceFile)) {
        return {
            error: "Controller default export must be a function. " +
            "You might want to read .opencode/agent/controller-builder.md"
        };
    }
}