import * as ts from 'typescript';

/**
 * Parse TypeScript code and return the AST
 */
export function parseTypeScript(code: string): ts.SourceFile {
  return ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );
}

/**
 * Check if code has a default export (handles both 'export default' and 'default export' syntax)
 */
export function hasDefaultExport(sourceFile: ts.SourceFile): boolean {
  const fullText = sourceFile.getFullText();
  
  // Check for 'export default' pattern first (more reliable than AST for this case)
  if (/\bexport\s+default\b/.test(fullText)) {
    return true;
  }
  
  // Check for 'default export' pattern using AST
  let found = false;

  function visit(node: ts.Node) {
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      found = true;
      return;
    }
    
    if (!found) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return found;
}

/**
 * Find the default export declaration (handles both syntaxes)
 */
export function findDefaultExportDeclaration(sourceFile: ts.SourceFile): ts.ExportAssignment | ts.VariableStatement | ts.FunctionDeclaration | ts.ClassDeclaration | null {
  const fullText = sourceFile.getFullText();
  
  // Check for 'default export' pattern first
  if (/\bdefault\s+export\b/.test(fullText)) {
    // Find the first variable statement with ExportKeyword modifier
    // Since 'default export const' creates a VariableStatement with ExportKeyword
    // and we know the full text contains 'default export', we can assume this is it
    let found: ts.VariableStatement | ts.FunctionDeclaration | ts.ClassDeclaration | null = null;

    function visit(node: ts.Node) {
      if (!found) {
        if (ts.isVariableStatement(node) || ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
          const modifiers = ts.getModifiers(node);
          if (modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
            found = node;
            return;
          }
        }
        ts.forEachChild(node, visit);
      }
    }

    visit(sourceFile);
    return found;
  }
  
  // Handle 'export default' syntax using AST
  let found: ts.ExportAssignment | null = null;

  function visit(node: ts.Node) {
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      found = node;
      return;
    }
    
    if (!found) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return found;
}

/**
 * Check if the default export is a function
 */
export function isDefaultExportFunction(sourceFile: ts.SourceFile): boolean {
  const fullText = sourceFile.getFullText();
  
  // Check for 'default export function' pattern first (handles async as well)
  if (/\bdefault\s+export\s+(async\s+)?function\b/.test(fullText)) {
    return true;
  }
  
  // Check for 'export default function' pattern (handles async as well)
  if (/\bexport\s+default\s+(async\s+)?function\b/.test(fullText)) {
    return true;
  }
  
  let isFunction = false;

  function visit(node: ts.Node) {
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      // Direct function export
      if (ts.isFunctionExpression(node.expression) ||
          ts.isArrowFunction(node.expression)) {
        isFunction = true;
      }
      // Named function reference
      else if (ts.isIdentifier(node.expression)) {
        const symbol = findSymbol(sourceFile, node.expression.text);
        if (symbol && (ts.isFunctionDeclaration(symbol) ||
                       isVariableWithFunctionValue(symbol))) {
          isFunction = true;
        }
      }
    }

    if (!isFunction) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return isFunction;
}

/**
 * Get the number of parameters in the default export function
 */
export function getDefaultExportParameterCount(sourceFile: ts.SourceFile): number {
  const func = findDefaultExportFunction(sourceFile);
  return func ? func.parameters.length : 0;
}

/**
 * Get the return type of the default export function (if available)
 */
export function getDefaultExportReturnType(sourceFile: ts.SourceFile): string | null {
  const func = findDefaultExportFunction(sourceFile);
  if (!func || !func.type) return null;

  return func.type.getText(sourceFile);
}

/**
 * Check if the default export function is async
 */
export function isDefaultExportAsync(sourceFile: ts.SourceFile): boolean {
  const func = findDefaultExportFunction(sourceFile);
  if (!func) return false;

  // Check if the function has async modifier
  const modifiers = ts.canHaveModifiers(func) ? ts.getModifiers(func) : undefined;
  return modifiers?.some(mod => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
}

/**
 * Get parameter details of the default export function
 */
export function getDefaultExportParameters(sourceFile: ts.SourceFile): Array<{
  name: string;
  type: string;
  optional: boolean;
}> {
  const func = findDefaultExportFunction(sourceFile);
  if (!func) return [];

  return func.parameters.map(param => ({
    name: param.name.getText(sourceFile),
    type: param.type ? param.type.getText(sourceFile) : 'any',
    optional: !!param.questionToken
  }));
}

/**
 * Check if the file has any imports
 */
export function hasImports(sourceFile: ts.SourceFile): boolean {
  let found = false;

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      found = true;
    }
    if (!found) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return found;
}

/**
 * Get all import statements
 */
export function getImports(sourceFile: ts.SourceFile): string[] {
  const imports: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      imports.push(node.getText(sourceFile));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return imports;
}

/**
 * Check if the default export has JSDoc comments
 */
export function hasJSDocOnDefaultExport(sourceFile: ts.SourceFile): boolean {
  const func = findDefaultExportFunction(sourceFile);
  if (!func) return false;

  const jsDoc = (func as any).jsDoc;
  return jsDoc && jsDoc.length > 0;
}

/**
 * Get all named exports from the file
 */
export function getNamedExports(sourceFile: ts.SourceFile): string[] {
  const exports: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isExportDeclaration(node) && node.exportClause &&
        ts.isNamedExports(node.exportClause)) {
      node.exportClause.elements.forEach(element => {
        exports.push(element.name.text);
      });
    } else if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
      const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
      if (modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
        if (ts.isFunctionDeclaration(node) && node.name) {
          exports.push(node.name.text);
        } else if (ts.isVariableStatement(node)) {
          node.declarationList.declarations.forEach(decl => {
            if (ts.isIdentifier(decl.name)) {
              exports.push(decl.name.text);
            }
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return exports;
}

// Helper functions

function findDefaultExportFunction(sourceFile: ts.SourceFile): ts.FunctionLikeDeclarationBase | null {
  const fullText = sourceFile.getFullText();
  
  // Check for 'default export function' pattern first (handles async as well)
  if (/\bdefault\s+export\s+(async\s+)?function\b/.test(fullText)) {
    // Find the function declaration with ExportKeyword modifier
    let found: ts.FunctionDeclaration | null = null;

    function visit(node: ts.Node) {
      if (!found && ts.isFunctionDeclaration(node)) {
        const modifiers = ts.getModifiers(node);
        if (modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
          found = node;
          return;
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return found;
  }
  
  // Check for 'export default function' pattern (handles async as well)
  if (/\bexport\s+default\s+(async\s+)?function\b/.test(fullText)) {
    // Find the function declaration with ExportKeyword modifier
    let found: ts.FunctionDeclaration | null = null;

    function visit(node: ts.Node) {
      if (!found && ts.isFunctionDeclaration(node)) {
        const modifiers = ts.getModifiers(node);
        if (modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)) {
          found = node;
          return;
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return found;
  }
  
  let func: ts.FunctionLikeDeclarationBase | null = null;

  function visit(node: ts.Node) {
    if (ts.isExportAssignment(node) && !node.isExportEquals) {
      if (ts.isFunctionExpression(node.expression) ||
          ts.isArrowFunction(node.expression)) {
        func = node.expression;
      } else if (ts.isIdentifier(node.expression)) {
        const symbol = findSymbol(sourceFile, node.expression.text);
        if (symbol) {
          if (ts.isFunctionDeclaration(symbol)) {
            func = symbol;
          } else if (ts.isVariableDeclaration(symbol) && symbol.initializer) {
            if (ts.isFunctionExpression(symbol.initializer) ||
                ts.isArrowFunction(symbol.initializer)) {
              func = symbol.initializer;
            }
          }
        }
      }
    }

    if (!func) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);
  return func;
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

function isVariableWithFunctionValue(node: ts.Node): boolean {
  if (ts.isVariableDeclaration(node) && node.initializer) {
    return ts.isFunctionExpression(node.initializer) ||
           ts.isArrowFunction(node.initializer);
  }
  return false;
}

/**
 * Get imported function names from src/function/ directory
 * Returns array of imported function identifiers (e.g., ['fxGetUserMagicCards', 'fnProcessData'])
 */
export function getImportedFunctionNames(sourceFile: ts.SourceFile): string[] {
  const functionNames: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        // Check if import is from src/function/ directory (normalize for Windows paths)
        const normalizedPath = importPath.replace(/\\/g, '/');
        if (normalizedPath.includes('/function/')) {
          // Get the imported names
          if (node.importClause) {
            // Default import: import fxName from '...'
            if (node.importClause.name) {
              functionNames.push(node.importClause.name.text);
            }
            
            // Named imports: import { fnName, fxName } from '...'
            if (node.importClause.namedBindings) {
              if (ts.isNamedImports(node.importClause.namedBindings)) {
                node.importClause.namedBindings.elements.forEach(element => {
                  // Skip type-only imports
                  if (!element.isTypeOnly) {
                    functionNames.push(element.name.text);
                  }
                });
              }
              // Namespace import: import * as funcs from '...'
              else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                functionNames.push(node.importClause.namedBindings.name.text);
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functionNames;
}

/**
 * Find type alias by name (e.g., TPortal, TArgs)
 */
export function findTypeAlias(sourceFile: ts.SourceFile, typeName: string): ts.TypeAliasDeclaration | undefined {
  let found: ts.TypeAliasDeclaration | undefined;

  function visit(node: ts.Node) {
    if (!found && ts.isTypeAliasDeclaration(node)) {
      if (node.name.text === typeName) {
        found = node;
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
 * Get property names from a type literal
 * For example, for TPortal = { db: ..., fxName: ... }, returns ['db', 'fxName']
 */
export function getTypeLiteralPropertyNames(typeNode: ts.TypeNode): string[] {
  const properties: string[] = [];

  if (ts.isTypeLiteralNode(typeNode)) {
    typeNode.members.forEach(member => {
      if (ts.isPropertySignature(member) && member.name) {
        if (ts.isIdentifier(member.name)) {
          properties.push(member.name.text);
        }
      }
    });
  }

  return properties;
}
