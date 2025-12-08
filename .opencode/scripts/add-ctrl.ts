#!/usr/bin/env bun

/**
 * Add Controller Script
 *
 * Creates a controller (ctrl.) that orchestrates function calls.
 * Controllers take a Portal and Args, return TErrTuple<Data>.
 * They are the bridge between API routes and business logic functions.
 *
 * Usage: bun run add-ctrl <name> [--force]
 *
 * Examples:
 *   bun run add-ctrl listBoard
 *   bun run add-ctrl ctrlListBoard
 *   bun run add-ctrl get-user-profile
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

function toKebabCase(str: string): string {
  // Handle camelCase and PascalCase
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function parseCtrlName(input: string): { name: string; kebabName: string } {
  let name = input;

  // Remove 'ctrl' prefix if present (case insensitive)
  if (name.toLowerCase().startsWith('ctrl')) {
    name = name.slice(4);
    // Handle ctrlListBoard -> ListBoard or ctrl-list-board -> list-board
    if (name.startsWith('-')) {
      name = name.slice(1);
    }
  }

  // Convert to kebab-case for filename
  const kebabName = toKebabCase(name);

  // Convert to PascalCase for function name
  const pascalName = toPascalCase(kebabName);

  return { name: pascalName, kebabName };
}

function createCtrlTemplate(name: string): string {
  return `/**
 * Controller: ctrl${name}
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
type TPortal = {
  // TODO: Define your database/service access
  // db: typeof import("@/src/database/main/main.database").mainDb;
};

/** Input arguments (already validated by API layer) */
type TArgs = {
  // TODO: Define your input arguments
  id: string;
};

/** Output data type on success */
type TData = {
  // TODO: Define your output data
  id: string;
  name: string;
};

// -----------------------------------------------------------------------------
// Controller
// -----------------------------------------------------------------------------

/**
 * ctrl${name}
 *
 * TODO: Describe what this controller does
 */
async function ctrl${name}(
  portal: TPortal,
  args: TArgs
): Promise<TErrTuple<TData>> {
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

export default ctrl${name};
`;
}

async function addCtrl(input: string, options: Options = {}) {
  if (!input) {
    console.error('Controller name required. Usage: bun run add-ctrl <name>');
    console.error('Example: bun run add-ctrl listBoard');
    process.exit(1);
  }

  const { name, kebabName } = parseCtrlName(input);

  // Validate kebab name
  if (!/^[a-z][a-z0-9-]*$/.test(kebabName)) {
    console.error('Invalid controller name. Must result in valid kebab-case (lowercase letters, numbers, and hyphens).');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const controllerDir = join(projectRoot, 'src', 'controller');
  const fileName = `ctrl.${kebabName}.ts`;
  const filePath = join(controllerDir, fileName);

  // Check if file exists
  if (existsSync(filePath) && !options.force) {
    console.log(`File "${fileName}" already exists. Use --force to overwrite.`);
    return;
  }

  // Create controller directory if needed
  if (!existsSync(controllerDir)) {
    mkdirSync(controllerDir, { recursive: true });
    console.log(`Created directory: src/controller/`);
  }

  // Create the file
  const content = createCtrlTemplate(name);
  writeFileSync(filePath, content);

  console.log(`Created: src/controller/${fileName}`);
  console.log(`\nFunction name: ctrl${name}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Define your TPortal with database/service access`);
  console.log(`  2. Define your TArgs input type`);
  console.log(`  3. Define your TData output type`);
  console.log(`  4. Import and call your functions (fn.*, fx.*, tx.*)`);
  console.log(`  5. Create an API route that calls this controller`);
  console.log(`\nTo import in an API file:`);
  console.log(`  import ctrl${name} from '@/src/controller/ctrl.${kebabName}';`);
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Usage: bun run add-ctrl <name> [options]

Creates a controller (ctrl.*) that orchestrates function calls.

Arguments:
  name          Controller name (e.g., "listBoard", "ctrlListBoard", "get-user")

Options:
  --force       Force overwrite existing file
  --help, -h    Show this help

File created: src/controller/ctrl.<kebab-name>.ts

Notes:
- The 'ctrl' prefix is auto-detected and removed if present
- camelCase and PascalCase names are converted to kebab-case for filenames
- Examples:
    listBoard     -> ctrl.list-board.ts (function: ctrlListBoard)
    ctrlListBoard -> ctrl.list-board.ts (function: ctrlListBoard)
    get-user      -> ctrl.get-user.ts   (function: ctrlGetUser)

Examples:
  bun run add-ctrl listBoard
  bun run add-ctrl ctrlGetUserProfile
  bun run add-ctrl create-order --force
`);
    process.exit(0);
  }

  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const name = positionalArgs[0];

  addCtrl(name, {
    force: args.includes('--force'),
  }).catch(console.error);
}

export { addCtrl };
