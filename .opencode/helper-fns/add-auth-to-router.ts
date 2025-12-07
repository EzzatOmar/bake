import ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

/**
 * Add better-auth handler mount to the Elysia router
 *
 * This mounts auth.handler to expose /api/auth/* endpoints (login, signup, etc.)
 * The auth plugin with macro should be used in child API files for { user, session } types.
 *
 * @param indexPath - Path to src/index.tsx or src/index.ts
 * @param dbName - Name of the database (e.g., "meetup")
 * @returns Object with success status and optional message
 */
export function addAuthToRouter(indexPath: string, dbName: string): { success: boolean; message: string } {
  const projectRoot = path.resolve(indexPath, '..');
  const apiRouterPath = path.join(projectRoot, 'api-router.ts');

  // Check if api-router.ts exists
  try {
    const apiRouterContent = readFileSync(apiRouterPath, 'utf-8');
    const apiRouterSourceFile = ts.createSourceFile(
      apiRouterPath,
      apiRouterContent,
      ts.ScriptTarget.Latest,
      true
    );

    // Check if auth handler already exists in api-router
    if (hasAuthHandlerInElysia(apiRouterSourceFile, dbName)) {
      return {
        success: false,
        message: `Auth handler for "${dbName}" already exists in the router.`
      };
    }

    // Generate import statement for auth
    const newImport = `import { auth } from "@/src/database/${dbName}/auth.${dbName}";`;

    // Insert new import at the top
    const updatedContent = insertAuthImport(apiRouterContent, newImport);

    // Insert auth.handler mount in Elysia chain
    const finalContent = insertAuthHandlerInElysia(updatedContent);

    // Write updated content
    writeFileSync(apiRouterPath, finalContent);

    return {
      success: true,
      message: `Successfully mounted auth.handler for "${dbName}" in api-router.ts`
    };
  } catch (error) {
    return {
      success: false,
      message: `Could not update api-router.ts: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check if auth handler already exists in the Elysia router
 */
function hasAuthHandlerInElysia(sourceFile: ts.SourceFile, dbName: string): boolean {
  let found = false;

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const text = node.getText(sourceFile);
      // Check for .mount(auth.handler) pattern
      if (text.includes('.mount(auth.handler)') || text.includes(`auth.${dbName}`)) {
        found = true;
      }
    }

    if (!found) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return found;
}

/**
 * Insert auth import at the top of the file
 */
function insertAuthImport(content: string, newImport: string): string {
  const lines = content.split('\n');
  
  // Check if import already exists
  if (lines.some(line => line.trim() === newImport.trim())) {
    return content;
  }

  // Find the first import line or insert at the top
  let firstImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      firstImportIndex = i;
      break;
    }
  }

  if (firstImportIndex === -1) {
    // No imports found, add at the beginning
    lines.unshift(newImport);
  } else {
    // Insert before the first import
    lines.splice(firstImportIndex, 0, newImport);
  }

  return lines.join('\n');
}

/**
 * Insert auth.handler mount in the Elysia chain
 * Find the Elysia chain and insert .mount(auth.handler) after the constructor
 */
function insertAuthHandlerInElysia(content: string): string {
  const lines = content.split('\n');

  // Find the line with new Elysia({ or the closing }) of the constructor
  let insertIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    // Look for the line after the Elysia constructor closes
    if (lines[i].includes('new Elysia(') && lines[i].includes(')')) {
      // Single line constructor, insert after
      insertIndex = i + 1;
      break;
    }
    if (lines[i].includes('})') && i > 0 && lines.slice(0, i).some(l => l.includes('new Elysia('))) {
      // Multi-line constructor closing
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex === -1) {
    throw new Error('Could not find Elysia constructor in api-router.ts. The router structure may be unexpected.');
  }

  // Insert the auth handler mount
  const authHandlerLine = `  .mount(auth.handler)`;
  lines.splice(insertIndex, 0, authHandlerLine);

  return lines.join('\n');
}