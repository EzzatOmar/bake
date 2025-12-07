import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

function getDefaultExportParameters(sourceFile: ts.SourceFile): Array<{name: string, type: string}> {
    let parameters: Array<{name: string, type: string}> = [];
    
    function visit(node: ts.Node) {
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

export const ruleControllerParameterCount: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );
    
    const parameters = getDefaultExportParameters(sourceFile);
    if (parameters.length !== 2) {
        return {
            error: `Controller function must have exactly 2 parameters (TPortal, TArgs), found ${parameters.length}. ` +
            "You might want to read .opencode/agent/controller-builder.md"
        };
    }
}