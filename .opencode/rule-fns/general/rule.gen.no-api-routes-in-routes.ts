import ts from 'typescript';
import type { TRuleFn } from "../rule-types";

/**
 * Rule: No direct imports of API routes
 * API routes should be added as subrouters via .use() in src/api-router.ts
 * This prevents circular dependencies and ensures proper route organization
 */
export const ruleNoApiRoutesInRoutes: TRuleFn = async ({content, filePath}) => {
    // Skip the api-router.ts file itself
    if (filePath.endsWith('/api-router.ts') || filePath.endsWith('\\api-router.ts')) {
        return undefined;
    }

    // Skip files within src/api/ directory - they can import each other
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (normalizedPath.includes('/src/api/')) {
        return undefined;
    }

    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
    );

    let hasApiImport = false;
    let importPath = '';

    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
            const moduleSpecifier = node.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier)) {
                const importText = moduleSpecifier.text;

                // Check for imports from src/api/ or @/api/ or ../api/ or ./api/
                if (
                    importText.startsWith('src/api/') ||
                    importText.startsWith('@/api/') ||
                    importText.includes('/src/api/') ||
                    (importText.includes('/api/') && (importText.startsWith('../') || importText.startsWith('./')))
                ) {
                    hasApiImport = true;
                    importPath = importText;
                    return;
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    if (hasApiImport) {
        return {
            error:
                "API routes must NOT be imported directly. " +
                `Found import: '${importPath}'\n\n` +
                "API routes should be added as subrouters in src/api-router.ts using .use().\n\n" +
                "Example:\n" +
                "```typescript\n" +
                "// In src/api-router.ts\n" +
                "import { apiHealth } from './api/api.health';\n\n" +
                "export default new Elysia({ name: 'api-router' })\n" +
                "  .use(apiHealth)\n" +
                "```\n\n" +
                "You might want to read .opencode/agent/api-builder.md"
        };
    }
}
