#!/usr/bin/env bun

/**
 * Add Transactional Function Script
 *
 * Creates a transactional function (tx.) that has side effects WITH rollback support.
 * Transactional functions take a Portal and args, return TErrTriple<Data>.
 * The third element is an array of rollback functions for external actions.
 *
 * Usage: bun run add-tx <module> <name> [--force]
 *
 * Examples:
 *   bun run add-tx user create
 *   bun run add-tx order submit
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

function createTxTemplate(module: string, name: string): string {
  const pascalName = toPascalCase(name);
  const pascalModule = toPascalCase(module);

  return `/**
 * Transactional Function: tx.${name}
 * Module: ${module}
 *
 * This is a TRANSACTIONAL function - it has side effects WITH rollback support.
 * - First param: Portal (contains typed db access)
 * - Second param: Args (input arguments)
 * - Returns: Promise<TErrTriple<Data>>
 *   - [Data, null, rollbacks[]] on success
 *   - [null, TErrorEntry, rollbacks[]] on failure
 *
 * Use tx.* when:
 * - Creating/updating/deleting database records
 * - Calling external APIs that modify state
 * - Operations that need rollback on failure
 *
 * IMPORTANT: Database rollbacks should use transactions, not rollback functions.
 * Rollback functions are for EXTERNAL services only (GitHub, Stripe, etc).
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
  name: string;
  email: string;
};

/** Output data type on success */
type TData = {
  // TODO: Define your output data
  id: string;
  name: string;
  email: string;
};

// -----------------------------------------------------------------------------
// Function
// -----------------------------------------------------------------------------

/**
 * tx${pascalModule}${pascalName}
 *
 * TODO: Describe what this function does
 */
async function tx${pascalModule}${pascalName}(
  portal: TPortal,
  args: TArgs
): Promise<TErrTriple<TData>> {
  // Collect rollback functions for external actions
  const rollbacks: TExternalRollback[] = [];

  // TODO: Implement your transactional logic here

  // Example: Create external resource first (before DB)
  // const [externalResult, externalErr] = await createExternalResource(args);
  // if (externalErr) {
  //   return [null, externalErr, rollbacks];
  // }
  //
  // // Add rollback for external resource
  // rollbacks.push(async () => {
  //   try {
  //     await deleteExternalResource(externalResult.id);
  //     return [\`Rolled back external resource \${externalResult.id}\`, null, []];
  //   } catch (e) {
  //     return [null, { code: ErrCode.ROLLBACK_FAILED, statusCode: 500 }, []];
  //   }
  // });

  // Example: Database insert (use transactions for DB rollback)
  // const result = await portal.db.insert(schema.users).values({
  //   name: args.name,
  //   email: args.email,
  // }).returning();
  //
  // if (!result[0]) {
  //   // Rollbacks will be executed by caller in reverse order
  //   return [null, {
  //     code: ErrCode.TX_${module.toUpperCase()}_${name.toUpperCase().replace(/-/g, '_')}_FAILED,
  //     statusCode: 500,
  //     externalMessage: { en: "Failed to create resource" },
  //   }, rollbacks];
  // }

  // Example success:
  return [{
    id: "new-id",
    name: args.name,
    email: args.email,
  }, null, rollbacks];
}

export default tx${pascalModule}${pascalName};
`;
}

async function addTx(module: string, name: string, options: Options = {}) {
  if (!module || !name) {
    console.error('Module and name required. Usage: bun run add-tx <module> <name>');
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
  const fileName = `tx.${name}.ts`;
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
  const content = createTxTemplate(module, name);
  writeFileSync(filePath, content);

  console.log(`Created: src/function/${module}/${fileName}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Define your TPortal with database access`);
  console.log(`  2. Define your TArgs input type`);
  console.log(`  3. Define your TData output type`);
  console.log(`  4. Implement the transactional logic`);
  console.log(`  5. Add rollback functions for external actions`);
  console.log(`  6. Add error code to src/error/err.enum.ts if needed`);
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Usage: bun run add-tx <module> <name> [options]

Creates a transactional function (tx.*) with side effects AND rollback support.

Arguments:
  module        Module name (e.g., "user", "order")
  name          Function name (e.g., "create", "submit")

Options:
  --force       Force overwrite existing file
  --help, -h    Show this help

File created: src/function/<module>/tx.<name>.ts

Return type: TErrTriple<Data>
  - [Data, null, rollbacks[]] on success
  - [null, TErrorEntry, rollbacks[]] on failure

Examples:
  bun run add-tx user create
  bun run add-tx order submit --force
`);
    process.exit(0);
  }

  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const module = positionalArgs[0];
  const name = positionalArgs[1];

  addTx(module, name, {
    force: args.includes('--force'),
  }).catch(console.error);
}

export { addTx };
