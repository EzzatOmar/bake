import * as ts from 'typescript';

/**
 * Maps controller import names to their file paths
 * Example: { "ctrlGetUserMagicCards": "ctrl.get-user-magic-cards" }
 */
interface ControllerImportMap {
  [importName: string]: string;
}

/**
 * Maps HTTP methods to controller file names
 * Example: { "GET": ["ctrl.get-user-magic-cards"], "POST": ["ctrl.create-deck"] }
 */
export interface MethodControllerMap {
  [httpMethod: string]: string[];
}

/**
 * Extract controller imports from an API file
 * Returns a map of import names to controller filenames
 */
function extractControllerImports(sourceFile: ts.SourceFile): ControllerImportMap {
  const controllerMap: ControllerImportMap = {};

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        
        // Check if this imports a controller (contains 'ctrl.')
        if (importPath.includes('ctrl.')) {
          const importClause = node.importClause;
          
          // Handle default import: import ctrlGetUserMagicCards from '...'
          if (importClause && importClause.name) {
            const importName = importClause.name.text;
            const filename = importPath.split('/').pop() || importPath;
            controllerMap[importName] = filename;
          }
          
          // Handle named imports: import { ctrlGetUserMagicCards } from '...'
          if (importClause?.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
            importClause.namedBindings.elements.forEach(element => {
              const importName = element.name.text;
              const filename = importPath.split('/').pop() || importPath;
              controllerMap[importName] = filename;
            });
          }
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return controllerMap;
}

/**
 * Find which controllers are used in each HTTP method handler
 * Recursively searches function bodies for controller function calls
 */
function findControllersInFunction(
  node: ts.Node,
  controllerMap: ControllerImportMap,
  sourceFile: ts.SourceFile
): Set<string> {
  const controllers = new Set<string>();

  function visit(n: ts.Node) {
    // Look for function calls like: ctrlGetUserMagicCards(...)
    if (ts.isCallExpression(n)) {
      const expression = n.expression;
      
      // Direct call: ctrlGetUserMagicCards(...)
      if (ts.isIdentifier(expression)) {
        const functionName = expression.text;
        if (controllerMap[functionName]) {
          controllers.add(controllerMap[functionName]);
        }
      }
      
      // Property access: await ctrlGetUserMagicCards(...)
      if (ts.isPropertyAccessExpression(expression)) {
        const name = expression.name.text;
        if (controllerMap[name]) {
          controllers.add(controllerMap[name]);
        }
      }
    }
    
    // Also check for identifiers used in await expressions
    if (ts.isAwaitExpression(n)) {
      visit(n.expression);
    }
    
    ts.forEachChild(n, visit);
  }

  visit(node);
  return controllers;
}

/**
 * Analyze an API file and extract which controllers are used by each HTTP method
 * 
 * @param code - The TypeScript code of the API file
 * @returns A map of HTTP methods to controller filenames
 * 
 * @example
 * const code = `
 *   import ctrlGetUserMagicCards from './ctrl.get-user-magic-cards';
 *   import ctrlCreateDeck from './ctrl.create-deck';
 *   
 *   const apiUserCards = {
 *     GET: async (req) => {
 *       const [result, error] = await ctrlGetUserMagicCards(...);
 *       return Response.json(result);
 *     },
 *     POST: async (req) => {
 *       const [result, error] = await ctrlCreateDeck(...);
 *       return Response.json(result);
 *     }
 *   };
 * `;
 * 
 * const result = extractMethodControllerMap(code);
 * // Returns: { "GET": ["ctrl.get-user-magic-cards"], "POST": ["ctrl.create-deck"] }
 */
export function extractMethodControllerMap(code: string): MethodControllerMap {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );

  const controllerMap = extractControllerImports(sourceFile);
  const methodControllerMap: MethodControllerMap = {};

  // Find the API handler object (the one with HTTP methods)
  function visit(node: ts.Node) {
    // Look for object literals that contain HTTP method keys
    if (ts.isObjectLiteralExpression(node)) {
      node.properties.forEach(prop => {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          const methodName = prop.name.text;
          
          // Check if this is an HTTP method
          const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
          if (httpMethods.includes(methodName)) {
            // Find controllers used in this method's handler
            const controllers = findControllersInFunction(
              prop.initializer,
              controllerMap,
              sourceFile
            );
            
            if (controllers.size > 0) {
              methodControllerMap[methodName] = Array.from(controllers);
            }
          }
        }
      });
    }
    
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return methodControllerMap;
}
