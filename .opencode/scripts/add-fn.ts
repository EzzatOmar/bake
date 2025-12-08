#!/usr/bin/env bun

/**
 * Add Pure Function Script
 *
 * Creates a pure function (fn.) that has NO side effects.
 * Pure functions take only arguments and return TErrTuple<Data>.
 *
 * Usage: bun run add-fn <module> <name> [--force]
 *
 * Examples:
 *   bun run add-fn user validate-email
 *   bun run add-fn order calculate-total
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

function createFnTemplate(module: string, name: string): string {
  const pascalName = toPascalCase(name);
  const pascalModule = toPascalCase(module);

  return `/**
 * Pure Function: fn.${name}
 * Module: ${module}
 *
 * This is a PURE function - it has NO side effects.
 * - Takes input arguments only (no portal/db access)
 * - Returns TErrTuple<Data> synchronously
 * - Same input always produces same output
 *
 * Use fn.* when:
 * - Validating data
 * - Transforming data
 * - Calculating values
 * - Parsing input
 */

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Input arguments for this function */
type TArgs = {
  // TODO: Define your input arguments
  input: string;
};

/** Output data type on success */
type TData = {
  // TODO: Define your output data
  result: string;
};

// -----------------------------------------------------------------------------
// Function
// -----------------------------------------------------------------------------

/**
 * fn${pascalModule}${pascalName}
 *
 * TODO: Describe what this function does
 */
function fn${pascalModule}${pascalName}(args: TArgs): TErrTuple<TData> {
  // TODO: Implement your pure logic here

  // Example validation error:
  // if (!args.input) {
  //   return [null, {
  //     code: ErrCode.FN_${module.toUpperCase()}_${name.toUpperCase().replace(/-/g, '_')}_INVALID_INPUT,
  //     statusCode: 400,
  //     externalMessage: { en: "Invalid input provided" },
  //   }];
  // }

  // Example success:
  return [{ result: args.input }, null];
}

export default fn${pascalModule}${pascalName};
`;
}

async function addFn(module: string, name: string, options: Options = {}) {
  if (!module || !name) {
    console.error('Module and name required. Usage: bun run add-fn <module> <name>');
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
  const fileName = `fn.${name}.ts`;
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
  const content = createFnTemplate(module, name);
  writeFileSync(filePath, content);

  console.log(`Created: src/function/${module}/${fileName}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Define your TArgs input type`);
  console.log(`  2. Define your TData output type`);
  console.log(`  3. Implement the pure logic`);
  console.log(`  4. Add error code to src/error/err.enum.ts if needed`);
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Usage: bun run add-fn <module> <name> [options]

Creates a pure function (fn.*) with NO side effects.

Arguments:
  module        Module name (e.g., "user", "order")
  name          Function name (e.g., "validate-email", "calculate-total")

Options:
  --force       Force overwrite existing file
  --help, -h    Show this help

File created: src/function/<module>/fn.<name>.ts

Examples:
  bun run add-fn user validate-email
  bun run add-fn order calculate-total --force
`);
    process.exit(0);
  }

  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const module = positionalArgs[0];
  const name = positionalArgs[1];

  addFn(module, name, {
    force: args.includes('--force'),
  }).catch(console.error);
}

export { addFn };
