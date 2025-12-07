#!/usr/bin/env bun

/**
 * Add Controller Script
 *
 * Creates a controller (ctrl.) that orchestrates function calls.
 * Controllers take a Portal and Args, return TErrTuple<Data>.
 * They are the bridge between API routes and business logic functions.
 *
 * Usage: bun run add-ctrl <module> <name> [--force]
 *
 * Examples:
 *   bun run add-ctrl user get-profile
 *   bun run add-ctrl order create
 */

import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

interface Options {
  force?: boolean;
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function createCtrlTemplate(module: string, name: string): string {
  const pascalName = toPascalCase(name);
  const pascalModule = toPascalCase(module);

  return `/**
 * Controller: ctrl.${name}
 * Module: ${module}
 *
 * Controllers orchestrate business logic by calling functions (fn.*, fx.*, tx.*).
 * - First param: Portal (typed database/service access)
 * - Second param: Args (validated input from API)
 * - Returns: Promise<TErrTuple<Data>>
 *
 * Controller responsibilities:
 * - Receive validated input from API layer
 * - Call appropriate functions in sequence
 * - Handle rollbacks if transactional functions fail
 * - Return data or error to API layer
 *
 * Controllers should NOT:
 * - Contain direct business logic (use functions instead)
 * - Access request/response objects (that's the API layer)
 * - Return HTTP-specific data (status codes are in TErrorEntry)
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Portal provides typed access to databases and services */
type T${pascalModule}${pascalName}Portal = {
  // TODO: Define your database/service access
  // db: typeof import("@/src/database/main/main.database").mainDb;
};

/** Input arguments (already validated by API layer) */
type T${pascalModule}${pascalName}Args = {
  // TODO: Define your input arguments
  id: string;
};

/** Output data type on success */
type T${pascalModule}${pascalName}Data = {
  // TODO: Define your output data
  id: string;
  name: string;
};

// -----------------------------------------------------------------------------
// Controller
// -----------------------------------------------------------------------------

/**
 * ctrl${pascalModule}${pascalName}
 *
 * TODO: Describe what this controller does
 */
async function ctrl${pascalModule}${pascalName}(
  portal: T${pascalModule}${pascalName}Portal,
  args: T${pascalModule}${pascalName}Args
): Promise<TErrTuple<T${pascalModule}${pascalName}Data>> {
  // TODO: Implement your controller logic here

  // Example: Call an effectful function
  // const [userData, userErr] = await fxUserGetById(portal, { id: args.id });
  // if (userErr) {
  //   return [null, userErr];
  // }

  // Example: Call a transactional function with rollback handling
  // const [result, err, rollbacks] = await txUserUpdate(portal, args);
  // if (err) {
  //   // Execute rollbacks in reverse order
  //   for (let i = rollbacks.length - 1; i >= 0; i--) {
  //     await rollbacks[i]();
  //   }
  //   return [null, err];
  // }

  // Example success:
  return [{
    id: args.id,
    name: "Example",
  }, null];
}

export default ctrl${pascalModule}${pascalName};
`;
}

async function addCtrl(module: string, name: string, options: Options = {}) {
  if (!module || !name) {
    console.error('Module and name required. Usage: bun run add-ctrl <module> <name>');
    process.exit(1);
  }

  // Validate module name
  if (!/^[a-z][a-z0-9-]*$/.test(module)) {
    console.error('Invalid module name. Use lowercase letters, numbers, and hyphens. Must start with a letter.');
    process.exit(1);
  }

  // Validate function name
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('Invalid controller name. Use lowercase letters, numbers, and hyphens. Must start with a letter.');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const controllerDir = join(projectRoot, 'src', 'controller', module);
  const fileName = `ctrl.${name}.ts`;
  const filePath = join(controllerDir, fileName);

  // Check if file exists
  if (existsSync(filePath) && !options.force) {
    console.log(`File "${fileName}" already exists in ${module}. Use --force to overwrite.`);
    return;
  }

  // Create module directory if needed
  if (!existsSync(controllerDir)) {
    mkdirSync(controllerDir, { recursive: true });
    console.log(`Created module directory: src/controller/${module}/`);
  }

  // Create the file
  const content = createCtrlTemplate(module, name);
  writeFileSync(filePath, content);

  console.log(`Created: src/controller/${module}/${fileName}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Define your TPortal with database/service access`);
  console.log(`  2. Define your TArgs input type`);
  console.log(`  3. Define your TData output type`);
  console.log(`  4. Import and call your functions (fn.*, fx.*, tx.*)`);
  console.log(`  5. Create an API route that calls this controller`);
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Usage: bun run add-ctrl <module> <name> [options]

Creates a controller (ctrl.*) that orchestrates function calls.

Arguments:
  module        Module name (e.g., "user", "order")
  name          Controller name (e.g., "get-profile", "create")

Options:
  --force       Force overwrite existing file
  --help, -h    Show this help

File created: src/controller/<module>/ctrl.<name>.ts

Examples:
  bun run add-ctrl user get-profile
  bun run add-ctrl order create --force
`);
    process.exit(0);
  }

  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const module = positionalArgs[0];
  const name = positionalArgs[1];

  addCtrl(module, name, {
    force: args.includes('--force'),
  }).catch(console.error);
}

export { addCtrl };
