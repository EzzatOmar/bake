import ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Add better-auth handler to the router in src/index.tsx or src/index.ts
 * 
 * @param indexPath - Path to src/index.tsx or src/index.ts
 * @param dbName - Name of the database (e.g., "meetup")
 * @returns Object with success status and optional message
 */
export function addAuthToRouter(indexPath: string, dbName: string): { success: boolean; message: string } {
  const content = readFileSync(indexPath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    indexPath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  // Check if auth.handler already exists in routes
  if (hasAuthHandler(sourceFile)) {
    return {
      success: false,
      message: 'Another better-auth handler already exists in the router. Running multiple better-auth instances is not good practice and needs developer support.'
    };
  }

  // Generate import statement
  const newImport = `import { auth } from "@/src/database/${dbName}/auth.${dbName}";`;
  
  // Generate route entry
  const newRoute = `      "/api/auth/*": auth.handler,`;

  // Insert new import at the top
  const updatedContent = insertAuthImport(content, newImport);
  
  // Insert new route in routes object
  const finalContent = insertAuthRoute(updatedContent, newRoute);

  // Write updated content
  writeFileSync(indexPath, finalContent);
  
  return {
    success: true,
    message: `Successfully added auth.handler to router for database "${dbName}"`
  };
}

/**
 * Check if auth.handler already exists in the routes
 */
function hasAuthHandler(sourceFile: ts.SourceFile): boolean {
  let found = false;

  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(sourceFile) === 'routes') {
      if (ts.isObjectLiteralExpression(node.initializer)) {
        node.initializer.properties.forEach(prop => {
          if (ts.isPropertyAssignment(prop)) {
            const value = prop.initializer?.getText(sourceFile);
            // Check if value contains "auth.handler"
            if (value && value.includes('auth.handler')) {
              found = true;
            }
          }
        });
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
 * Insert auth route in the routes object
 * Find "routes: {" and insert auth.handler as the first route
 */
function insertAuthRoute(content: string, newRoute: string): string {
  const lines = content.split('\n');
  let insertIndex = -1;

  // Find the routes object opening
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('routes:') && lines[i].includes('{')) {
      // Insert after "routes: {"
      insertIndex = i + 1;
      break;
    }
  }

  if (insertIndex === -1) {
    throw new Error('Could not find "routes: {" in the index file. The router structure may be unexpected.');
  }

  // Insert the auth route at the beginning of routes
  lines.splice(insertIndex, 0, newRoute);

  return lines.join('\n');
}
