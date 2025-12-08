import * as ts from 'typescript';
import { parseTypeScript } from "../../helper-fns/ts-analyzer";
import type { TRuleFn } from "../rule-types";

/**
 * Count the number of exported functions in a file.
 * This excludes:
 * - Type exports (type aliases, interfaces)
 * - Const/let/var exports (variables that are not functions)
 *
 * It counts:
 * - Named function exports: export function fnName() {}
 * - Arrow function exports: export const fnName = () => {}
 * - Default export functions are counted separately (they're the main export)
 */
export function countExportedFunctions(sourceFile: ts.SourceFile): {
    defaultExportFunction: boolean;
    namedExportFunctions: string[];
} {
    let defaultExportFunction = false;
    const namedExportFunctions: string[] = [];

    function isFunction(node: ts.Node): boolean {
        return ts.isFunctionDeclaration(node) ||
               ts.isFunctionExpression(node) ||
               ts.isArrowFunction(node);
    }

    function visit(node: ts.Node) {
        // Check for default export function
        if (ts.isExportAssignment(node) && !node.isExportEquals) {
            if (ts.isFunctionExpression(node.expression) ||
                ts.isArrowFunction(node.expression)) {
                defaultExportFunction = true;
            } else if (ts.isIdentifier(node.expression)) {
                // Check if the identifier refers to a function
                const name = node.expression.text;
                const symbol = findSymbol(sourceFile, name);
                if (symbol && (ts.isFunctionDeclaration(symbol) ||
                    (ts.isVariableDeclaration(symbol) && symbol.initializer &&
                     (ts.isFunctionExpression(symbol.initializer) ||
                      ts.isArrowFunction(symbol.initializer))))) {
                    defaultExportFunction = true;
                }
            }
        }

        // Check for exported function declarations: export function fnName() {}
        if (ts.isFunctionDeclaration(node) && node.name) {
            const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
            const hasExport = modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
            const hasDefault = modifiers?.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);

            if (hasExport) {
                if (hasDefault) {
                    defaultExportFunction = true;
                } else {
                    namedExportFunctions.push(node.name.text);
                }
            }
        }

        // Check for exported variable declarations that are functions
        // export const fnName = () => {} or export const fnName = function() {}
        if (ts.isVariableStatement(node)) {
            const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
            const hasExport = modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
            const hasDefault = modifiers?.some(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);

            if (hasExport) {
                node.declarationList.declarations.forEach(decl => {
                    if (ts.isIdentifier(decl.name) && decl.initializer) {
                        if (ts.isFunctionExpression(decl.initializer) ||
                            ts.isArrowFunction(decl.initializer)) {
                            if (hasDefault) {
                                defaultExportFunction = true;
                            } else {
                                namedExportFunctions.push(decl.name.text);
                            }
                        }
                    }
                });
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return {
        defaultExportFunction,
        namedExportFunctions
    };
}

function findSymbol(source: ts.SourceFile, name: string): ts.Node | undefined {
    let found: ts.Node | undefined;

    function search(node: ts.Node) {
        if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
            found = node;
        } else if (ts.isVariableDeclaration(node) &&
                   ts.isIdentifier(node.name) &&
                   node.name.text === name) {
            found = node;
        }
        if (!found) {
            ts.forEachChild(node, search);
        }
    }

    search(source);
    return found;
}

/**
 * Rule: Single File, Single Function
 *
 * fn/fx/tx files should only have ONE function export (the default export).
 * Other exports like types, interfaces, and constants are allowed.
 *
 * ❌ Wrong:
 * export function helper() { }
 * export default function fxMain() { }
 *
 * ❌ Wrong:
 * export const helper = () => { }
 * export default function fxMain() { }
 *
 * ✅ Right:
 * export type TArgs = { ... }
 * export const LIMIT = 10;
 * export default function fxMain() { }
 */
export const ruleSingleFunctionExport: TRuleFn = async ({ content, filePath }) => {
    const sourceFile = parseTypeScript(content);
    const { defaultExportFunction, namedExportFunctions } = countExportedFunctions(sourceFile);

    if (namedExportFunctions.length > 0) {
        const functionNames = namedExportFunctions.join(', ');
        return {
            error: `Single file, single function principle violated. ` +
                `Found additional exported function(s): ${functionNames}. ` +
                `fn/fx/tx files should only export ONE function (the default export). ` +
                `You can export types, interfaces, and constants, but not additional functions. ` +
                `If you need helper functions, either make them non-exported or move them to a separate file. ` +
                `You might want to read .opencode/agent/function-builder.md`
        };
    }
}
