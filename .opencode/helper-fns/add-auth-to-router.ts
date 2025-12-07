import ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

/**
 * Add better-auth handler to the Elysia router
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

    // Check if auth.handler already exists in api-router
    if (hasAuthHandlerInElysia(apiRouterSourceFile)) {
      return {
        success: false,
        message: 'Another better-auth handler already exists in the router. Running multiple better-auth instances is not good practice and needs developer support.'
      };
    }

    // Generate import statement
    const newImport = `import { auth } from "@/src/database/${dbName}/auth.${dbName}";`;
    
    // Insert new import at the top
    const updatedContent = insertAuthImport(apiRouterContent, newImport);
    
    // Insert auth handler directly in Elysia chain
    const finalContent = insertAuthHandlerInElysia(updatedContent, dbName);

    // Write updated content
    writeFileSync(apiRouterPath, finalContent);
    
    return {
      success: true,
      message: `Successfully added auth.handler to Elysia router for database "${dbName}"`
    };
  } catch (error) {
    return {
      success: false,
      message: `Could not update api-router.ts: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check if auth.handler already exists in the Elysia router
 */
function hasAuthHandlerInElysia(sourceFile: ts.SourceFile): boolean {
  let found = false;

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression.getText(sourceFile);
      if (expression.includes('auth.handler')) {
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
 * Insert auth handler in the Elysia chain
 * Find the .use() chain and insert auth.handler before the catch-all route
 */
function insertAuthHandlerInElysia(content: string, _dbName: string): string {
  const lines = content.split('\n');
  
  // Find the line with the catch-all route (.all("*", ...))
  let catchAllIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('.all("*"') || lines[i].includes('.all("*"')) {
      catchAllIndex = i;
      break;
    }
  }

  if (catchAllIndex === -1) {
    throw new Error('Could not find catch-all route in api-router.ts. The router structure may be unexpected.');
  }

  // Insert the auth handler before the catch-all route
  const authHandlerLine = `  .use(auth.handler)`;
  lines.splice(catchAllIndex, 0, authHandlerLine);

  return lines.join('\n');
}