#!/usr/bin/env bun

/**
 * Add Effectful Function Script
 *
 * Creates an effectful function (fx.) that has side effects but NO rollback.
 * Effectful functions take a Portal (for db access) and args, return TErrTuple<Data>.
 *
 * Usage: bun run add-fx <module> <name> [--force]
 *
 * Examples:
 *   bun run add-fx user get-by-id
 *   bun run add-fx order list-by-user
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

function createFxTemplate(module: string, name: string): string {
  const pascalName = toPascalCase(name);
  const pascalModule = toPascalCase(module);

  return `/**
 * Effectful Function: fx.${name}
 * Module: ${module}
 *
 * This is an EFFECTFUL function - it has side effects but NO rollback needed.
 * - First param: Portal (contains typed db access)
 * - Second param: Args (input arguments)
 * - Returns: Promise<TErrTuple<Data>>
 *
 * Use fx.* when:
 * - Reading from database
 * - Calling external APIs (read-only)
 * - Operations that don't need rollback
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Portal provides typed access to databases */
type TPortal = {
  // TODO: Define your database access
  // db: typeof import("@/src/database/main/main.database").mainDb;
};

/** Input arguments for this function */
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
// Function
// -----------------------------------------------------------------------------

/**
 * fx${pascalModule}${pascalName}
 *
 * TODO: Describe what this function does
 */
async function fx${pascalModule}${pascalName}(
  portal: TPortal,
  args: TArgs
): Promise<TErrTuple<TData>> {
  // TODO: Implement your effectful logic here

  // Example database query:
  // const result = await portal.db.query.users.findFirst({
  //   where: eq(schema.users.id, args.id),
  // });
  //
  // if (!result) {
  //   return [null, {
  //     code: ErrCode.FX_${module.toUpperCase()}_${name.toUpperCase().replace(/-/g, '_')}_NOT_FOUND,
  //     statusCode: 404,
  //     externalMessage: { en: "Resource not found" },
  //   }];
  // }

  // Example success:
  return [{ id: args.id, name: "Example" }, null];
}

export default fx${pascalModule}${pascalName};
`;
}

async function addFx(module: string, name: string, options: Options = {}) {
  if (!module || !name) {
    console.error('Module and name required. Usage: bun run add-fx <module> <name>');
    process.exit(1);
  }

  // Validate module name
  if (!/^[a-z][a-z0-9-]*$/.test(module)) {
    console.error('Invalid module name. Use lowercase letters, numbers, and hyphens. Must start with a letter.');
    process.exit(1);
  }

  // Validate function name
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('Invalid function name. Use lowercase letters, numbers, and hyphens. Must start with a letter.');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const functionDir = join(projectRoot, 'src', 'function', module);
  const fileName = `fx.${name}.ts`;
  const filePath = join(functionDir, fileName);

  // Check if file exists
  if (existsSync(filePath) && !options.force) {
    console.log(`File "${fileName}" already exists in ${module}. Use --force to overwrite.`);
    return;
  }

  // Create module directory if needed
  if (!existsSync(functionDir)) {
    mkdirSync(functionDir, { recursive: true });
    console.log(`Created module directory: src/function/${module}/`);
  }

  // Create the file
  const content = createFxTemplate(module, name);
  writeFileSync(filePath, content);

  console.log(`Created: src/function/${module}/${fileName}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Define your TPortal with database access`);
  console.log(`  2. Define your TArgs input type`);
  console.log(`  3. Define your TData output type`);
  console.log(`  4. Implement the effectful logic`);
  console.log(`  5. Add error code to src/error/err.enum.ts if needed`);
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Usage: bun run add-fx <module> <name> [options]

Creates an effectful function (fx.*) with side effects but NO rollback.

Arguments:
  module        Module name (e.g., "user", "order")
  name          Function name (e.g., "get-by-id", "list-by-user")

Options:
  --force       Force overwrite existing file
  --help, -h    Show this help

File created: src/function/<module>/fx.<name>.ts

Examples:
  bun run add-fx user get-by-id
  bun run add-fx order list-by-user --force
`);
    process.exit(0);
  }

  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const module = positionalArgs[0];
  const name = positionalArgs[1];

  addFx(module, name, {
    force: args.includes('--force'),
  }).catch(console.error);
}

export { addFx };
