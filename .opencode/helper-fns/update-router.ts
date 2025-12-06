import * as ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Add a new page route to src/index.tsx using TypeScript AST
 * 
 * @param indexPath - Path to src/index.tsx
 * @param pageName - Name of the page (e.g., "demo", "about")
 * @returns true if successful, false if route already exists
 */
export function addPageToRouter(indexPath: string, pageName: string): boolean {
  const content = readFileSync(indexPath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    indexPath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  // Check if route already exists
  if (hasRoute(sourceFile, pageName)) {
    return false;
  }

  // Generate import name (e.g., "demo" -> "demo", "user-profile" -> "userprofile")
  const importName = pageName.replace(/[^a-zA-Z0-9]/g, '');
  
  // Generate route path (e.g., "index" -> "/", "demo" -> "/demo")
  const routePath = pageName === 'index' ? '/' : `/${pageName}`;

  // Generate new import statement
  const newImport = `import ${importName} from './pages/${pageName}.html';`;
  
  // Generate new route entry
  const newRoute = `      "${routePath}": ${importName},`;
  
  // Generate new console.log entry (skip for index page)
  const newConsoleLog = pageName === 'index' 
    ? null 
    : `  console.log(\`${pageName}: http://localhost:\${server.port}${routePath}\`);`;

  // Insert new import after existing imports
  const updatedContent = insertImport(content, newImport);
  
  // Insert new route in routes object
  const contentWithRoute = insertRoute(updatedContent, newRoute);
  
  // Insert new console.log if needed
  const finalContent = newConsoleLog 
    ? insertConsoleLog(contentWithRoute, newConsoleLog)
    : contentWithRoute;

  // Write updated content
  writeFileSync(indexPath, finalContent);
  return true;
}

/**
 * Check if a route already exists in the router
 */
function hasRoute(sourceFile: ts.SourceFile, pageName: string): boolean {
  const routePath = pageName === 'index' ? '/' : `/${pageName}`;
  let found = false;

  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(sourceFile) === 'routes') {
      if (ts.isObjectLiteralExpression(node.initializer)) {
        node.initializer.properties.forEach(prop => {
          if (ts.isPropertyAssignment(prop)) {
            const path = prop.name?.getText(sourceFile);
            if (path) {
              const cleanPath = path.replace(/['"]/g, '');
              if (cleanPath === routePath) {
                found = true;
              }
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
 * Insert import statement after the last import
 */
function insertImport(content: string, newImport: string): string {
  const lines = content.split('\n');
  let lastImportIndex = -1;

  // Find the last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && lines[i].includes("from './pages/")) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex === -1) {
    // No imports found, add at the beginning
    lines.unshift(newImport);
  } else {
    // Insert after the last import
    lines.splice(lastImportIndex + 1, 0, newImport);
  }

  return lines.join('\n');
}

/**
 * Insert route in the routes object, right before any wildcard routes and comments
 */
function insertRoute(content: string, newRoute: string): string {
  const lines = content.split('\n');
  let insertIndex = -1;

  // Find the first wildcard route or comment line in the routes object
  let inRoutesObject = false;
  for (let i = 0; i < lines.length; i++) {
    // Detect if we're inside the routes object
    if (lines[i].includes('routes:') && lines[i].includes('{')) {
      inRoutesObject = true;
      continue;
    }

    if (inRoutesObject) {
      const trimmed = lines[i].trim();
      
      // Check if this is a wildcard route or a comment before wildcard routes
      if (trimmed.startsWith('//') || 
          trimmed.includes('"/api/*":') || 
          trimmed.includes('"/*":')) {
        insertIndex = i;
        break;
      }

      // If we hit the closing brace of routes object without finding wildcards, stop
      if (trimmed === '},') {
        insertIndex = i;
        break;
      }
    }
  }

  if (insertIndex === -1) {
    // Fallback: find "routes: {" and insert after it
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('routes:') && lines[i].includes('{')) {
        lines.splice(i + 1, 0, newRoute);
        return lines.join('\n');
      }
    }
  } else {
    // Insert at the determined position
    lines.splice(insertIndex, 0, newRoute);
  }

  return lines.join('\n');
}

/**
 * Insert console.log statement after the last console.log in the server setup
 */
function insertConsoleLog(content: string, newConsoleLog: string): string {
  const lines = content.split('\n');
  let lastConsoleLogIndex = -1;

  // Find the last console.log in the server setup
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('console.log')) {
      lastConsoleLogIndex = i;
    }
  }

  if (lastConsoleLogIndex === -1) {
    // Fallback: find the closing of Bun.serve and insert before the catch block
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('} catch (error)')) {
        // Insert an empty line and the console.log before the catch
        lines.splice(i, 0, newConsoleLog);
        lines.splice(i, 0, '');
        return lines.join('\n');
      }
    }
  } else {
    // Insert after the last console.log
    lines.splice(lastConsoleLogIndex + 1, 0, newConsoleLog);
  }

  return lines.join('\n');
}

/**
 * Get all existing routes from the router
 */
export function getExistingRoutes(indexPath: string): string[] {
  const content = readFileSync(indexPath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    indexPath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const routes: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(sourceFile) === 'routes') {
      if (ts.isObjectLiteralExpression(node.initializer)) {
        node.initializer.properties.forEach(prop => {
          if (ts.isPropertyAssignment(prop)) {
            const path = prop.name?.getText(sourceFile);
            if (path) {
              const cleanPath = path.replace(/['"]/g, '');
              // Only include actual page routes, not wildcards
              if (!cleanPath.includes('*')) {
                routes.push(cleanPath);
              }
            }
          }
        });
      }
    }
    
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return routes;
}
