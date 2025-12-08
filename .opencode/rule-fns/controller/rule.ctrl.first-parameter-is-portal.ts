import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

function getDefaultExportParameters(sourceFile: ts.SourceFile): Array<{name: string, type: string}> {
    let parameters: Array<{name: string, type: string}> = [];

    function visit(node: ts.Node) {
        // Check for: export default function ...
        if (ts.isFunctionDeclaration(node) && node.modifiers) {
            const hasExportKeyword = node.modifiers.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
            const hasDefaultKeyword = node.modifiers.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);
            if (hasExportKeyword && hasDefaultKeyword) {
                parameters = node.parameters.map(param => ({
                    name: param.name ? (param.name as ts.Identifier).text : 'unknown',
                    type: param.type ? param.type.getText(sourceFile) : 'any'
                }));
                return;
            }
        }

        // Check for: export default (arrow function or expression)
        if (ts.isExportAssignment(node) && !node.isExportEquals) {
            // Handle function expression
            if (ts.isFunctionExpression(node.expression)) {
                parameters = node.expression.parameters.map(param => ({
                    name: param.name ? (param.name as ts.Identifier).text : 'unknown',
                    type: param.type ? param.type.getText(sourceFile) : 'any'
                }));
                return;
            }

            // Handle arrow function
            if (ts.isArrowFunction(node.expression)) {
                parameters = node.expression.parameters.map(param => ({
                    name: param.name ? (param.name as ts.Identifier).text : 'unknown',
                    type: param.type ? param.type.getText(sourceFile) : 'any'
                }));
                return;
            }

            // Handle identifier pointing to function
            if (ts.isIdentifier(node.expression)) {
                const functionName = node.expression.text;
                function findFunctionDeclaration(node: ts.Node): ts.FunctionDeclaration | ts.VariableDeclaration | null {
                    if (ts.isFunctionDeclaration(node) &&
                        node.name &&
                        node.name.text === functionName) {
                        return node;
                    }
                    if (ts.isVariableStatement(node)) {
                        for (const declaration of node.declarationList.declarations) {
                            if (ts.isVariableDeclaration(declaration) &&
                                ts.isIdentifier(declaration.name) &&
                                declaration.name.text === functionName) {
                                return declaration;
                            }
                        }
                    }
                    let result: ts.FunctionDeclaration | ts.VariableDeclaration | null = null;
                    ts.forEachChild(node, (child) => {
                        if (!result) result = findFunctionDeclaration(child);
                    });
                    return result;
                }

                const funcDecl = findFunctionDeclaration(sourceFile);
                if (funcDecl) {
                    if (ts.isFunctionDeclaration(funcDecl)) {
                        parameters = funcDecl.parameters.map(param => ({
                            name: param.name ? (param.name as ts.Identifier).text : 'unknown',
                            type: param.type ? param.type.getText(sourceFile) : 'any'
                        }));
                    } else if (ts.isVariableDeclaration(funcDecl) && funcDecl.initializer) {
                        if (ts.isFunctionExpression(funcDecl.initializer) || ts.isArrowFunction(funcDecl.initializer)) {
                            parameters = funcDecl.initializer.parameters.map(param => ({
                                name: param.name ? (param.name as ts.Identifier).text : 'unknown',
                                type: param.type ? param.type.getText(sourceFile) : 'any'
                            }));
                        }
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return parameters;
}

export const ruleControllerFirstParameterIsPortal: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

    const parameters = getDefaultExportParameters(sourceFile);

    if (parameters.length === 0) {
        return; // No parameters found, rule doesn't apply (parameter count rule will catch this)
    }

    const firstParam = parameters[0];
    if (!firstParam.type.includes('Portal') && !firstParam.type.includes('portal')) {
        return {
            error: `First parameter must be a portal type (TPortal), found: ${firstParam.type}. ` +
            "You might want to read .opencode/agent/controller-builder.md"
        };
    }
}