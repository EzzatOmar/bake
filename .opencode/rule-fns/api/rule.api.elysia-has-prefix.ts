import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

export const ruleApiElysiaHasPrefix: TRuleFn = async ({content, filePath}) => {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

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

    visit(sourceFile);

    if (!foundPrefix) {
        return {
            error: "API Elysia instance must have a 'prefix' option. " +
            `File ${filePath} is missing prefix. ` +
            "Use: new Elysia({ prefix: '/api/module/endpoint' }) " +
            "You might want to read .opencode/agent/api-builder.md"
        };
    }

    // Validate prefix starts with /api/
    if (prefixValue !== null) {
        const prefix = prefixValue as string; // Type assertion
        if (!prefix.startsWith('/api/')) {
            return {
                error: "API Elysia prefix must start with '/api/'. " +
                `Found prefix: '${prefix}' in ${filePath}. ` +
                "You might want to read .opencode/agent/api-builder.md"
            };
        }
    }
}