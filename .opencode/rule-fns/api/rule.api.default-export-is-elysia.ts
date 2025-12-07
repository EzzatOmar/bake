import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

export const ruleApiDefaultExportIsElysia: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

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

    visit(sourceFile);

    if (!foundElysiaExport) {
        return {
            error: "API files must default export a new Elysia() instance. " +
            `File ${filePath} does not export an Elysia instance. ` +
            "Use: export default new Elysia({ prefix: '/api/...' }).get(...); " +
            "You might want to read .opencode/agent/api-builder.md"
        };
    }
}