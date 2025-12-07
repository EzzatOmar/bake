import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

function hasDefaultExport(sourceFile: ts.SourceFile): boolean {
    let hasDefaultExport = false;
    
    function visit(node: ts.Node) {
        if (ts.isExportAssignment(node) && !node.isExportEquals) {
            hasDefaultExport = true;
            return;
        }
        if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
            for (const exportElement of node.exportClause.elements) {
                if (exportElement.name.text === 'default') {
                    hasDefaultExport = true;
                    return;
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    return hasDefaultExport;
}

export const ruleControllerDefaultExport: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );
    
    if (!hasDefaultExport(sourceFile)) {
        return {
            error: "Controller must have a default export function. " +
            "You might want to read .opencode/agent/controller-builder.md"
        };
    }
}