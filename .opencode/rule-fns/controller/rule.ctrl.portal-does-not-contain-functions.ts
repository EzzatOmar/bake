import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

function getImportedFunctionNames(sourceFile: ts.SourceFile): string[] {
    const functionNames: string[] = [];
    
    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier) && moduleSpecifier.text.includes('src/function/')) {
                if (node.importClause && node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
                    for (const element of node.importClause.namedBindings.elements) {
                        functionNames.push(element.name.text);
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    return functionNames;
}

function findTypeAlias(sourceFile: ts.SourceFile, typeName: string): ts.TypeAliasDeclaration | null {
    let found: ts.TypeAliasDeclaration | null = null;
    
    function visit(node: ts.Node) {
        if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
            found = node;
            return;
        }
        ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    return found;
}

function getTypeLiteralPropertyNames(typeNode: ts.TypeNode): string[] {
    const propertyNames: string[] = [];
    
    function visit(node: ts.Node) {
        if (ts.isPropertySignature(node) && node.name && ts.isIdentifier(node.name)) {
            propertyNames.push(node.name.text);
        }
        ts.forEachChild(node, visit);
    }
    
    visit(typeNode);
    return propertyNames;
}

export const rulePortalDoesNotContainFunctions: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );
    
    // Get all imported function names from src/function/
    const importedFunctions = getImportedFunctionNames(sourceFile);
    
    if (importedFunctions.length === 0) {
        // No function imports, so no violation possible
        return;
    }
    
    // Find TPortal type definition
    const tPortalType = findTypeAlias(sourceFile, 'TPortal');
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
        return {
            error: `TPortal must not contain function imports. Found: ${functionsInPortal.join(', ')}. ` +
            `Controllers should import and call functions directly, not pass them through TPortal. ` +
            `TPortal should only contain variables (like db connections) that need to be mocked for testing. ` +
            `If function needs dependencies (like a db connection), pass those variables in TPortal or TArgs, ` +
            `and let the controller call the function with those dependencies. ` +
            `You might want to read .opencode/agent/ctrl-builder.md`
        };
    }
}