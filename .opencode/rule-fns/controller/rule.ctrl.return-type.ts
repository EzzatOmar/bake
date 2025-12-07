import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

function getDefaultExportReturnType(sourceFile: ts.SourceFile): string | null {
    let returnType: string | null = null;
    
    function visit(node: ts.Node) {
        if (ts.isExportAssignment(node) && !node.isExportEquals) {
            // Handle function expression
            if (ts.isFunctionExpression(node.expression)) {
                returnType = node.expression.type ? node.expression.type.getText(sourceFile) : null;
                return;
            }
            
            // Handle arrow function
            if (ts.isArrowFunction(node.expression)) {
                returnType = node.expression.type ? node.expression.type.getText(sourceFile) : null;
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
                        returnType = funcDecl.type ? funcDecl.type.getText(sourceFile) : null;
                    } else if (ts.isVariableDeclaration(funcDecl) && funcDecl.initializer) {
                        if (ts.isFunctionExpression(funcDecl.initializer) || ts.isArrowFunction(funcDecl.initializer)) {
                            returnType = funcDecl.initializer.type ? funcDecl.initializer.type.getText(sourceFile) : null;
                        }
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    return returnType;
}

export const ruleControllerReturnType: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );
    
    const returnType = getDefaultExportReturnType(sourceFile);
    if (!returnType) {
        return {
            error: "Controller function must have an explicit return type. " +
            "Expected: TErrTuple<Data>. " +
            "You might want to read .opencode/agent/ctrl-builder.md"
        };
    }

    // Check if return type matches expected pattern
    // Controllers should return TErrTuple<T> directly (not wrapped in Promise)
    const hasTErrTuple = returnType.includes('TErrTuple');
    
    // Controllers should ONLY return TErrTuple<T> (with or without Promise wrapper)
    // Promise<[Data, null] | [null, TErrorEntry]> is NOT allowed
    const isValidPattern = hasTErrTuple;
    
    if (!isValidPattern) {
        return {
            error: "Controller function must return TErrTuple<Data>. " +
            `Found: ${returnType}. ` +
            "You might want to read .opencode/agent/ctrl-builder.md"
        };
    }
}