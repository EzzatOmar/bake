#!/usr/bin/env bun

/**
 * Add API Route Script
 *
 * Creates an Elysia API router (api.) that handles HTTP endpoints.
 * API files export an Elysia instance with a prefix. Multiple endpoints
 * can be defined in a single file, each calling different controllers.
 *
 * Usage: bun run add-api <module> <name> [--force]
 *
 * Examples:
 *   bun run add-api user profile
 *   bun run add-api order checkout
 */

import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

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

function createApiTemplate(module: string, name: string): string {
  const camelName = toCamelCase(name);
  const camelModule = toCamelCase(module);
  const pascalModule = toPascalCase(module);
  const pascalName = toPascalCase(name);

  return `/**
 * API Router: api.${name}
 * Module: ${module}
 * Prefix: /api/${module}/${name}
 *
 * This Elysia router handles HTTP endpoints for ${name}.
 * - Export default: new Elysia({ prefix: '/api/...' })
 * - Each endpoint calls a controller
 * - Validation is done with Elysia's built-in validation
 *
 * API layer responsibilities:
 * - Parse and validate request body/params/query
 * - Call the appropriate controller
 * - Transform controller response to HTTP response
 * - Handle authentication/authorization (via plugins)
 *
 * API layer should NOT:
 * - Contain business logic (use controllers/functions)
 * - Access database directly (use controllers)
 */

import { Elysia, t } from 'elysia';
// TODO: Import your controllers
// import ctrl${pascalModule}${pascalName} from '@/src/controller/${module}/ctrl.${name}';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

// TODO: Define response types for documentation
// type T${pascalName}Response = {
//   id: string;
//   name: string;
// };

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

export default new Elysia({ prefix: '/api/${module}/${name}' })
  /**
   * GET /api/${module}/${name}/:id
   *
   * TODO: Describe what this endpoint does
   */
  .get('/:id', async ({ params, set }) => {
    // TODO: Create portal with database access
    // const portal = { db: mainDb };

    // TODO: Call controller
    // const [data, err] = await ctrl${pascalModule}${pascalName}(portal, { id: params.id });
    // if (err) {
    //   set.status = err.statusCode;
    //   return { error: err.externalMessage?.en || 'An error occurred' };
    // }
    // return data;

    // Placeholder response
    return { id: params.id, message: 'TODO: Implement endpoint' };
  }, {
    params: t.Object({
      id: t.String(),
    }),
    detail: {
      summary: 'Get ${name} by ID',
      tags: ['${module}'],
    },
  })

  /**
   * POST /api/${module}/${name}
   *
   * TODO: Describe what this endpoint does
   */
  .post('/', async ({ body, set }) => {
    // TODO: Create portal with database access
    // const portal = { db: mainDb };

    // TODO: Call controller
    // const [data, err] = await ctrl${pascalModule}Create${pascalName}(portal, body);
    // if (err) {
    //   set.status = err.statusCode;
    //   return { error: err.externalMessage?.en || 'An error occurred' };
    // }
    // set.status = 201;
    // return data;

    // Placeholder response
    return { message: 'TODO: Implement endpoint', received: body };
  }, {
    body: t.Object({
      // TODO: Define request body schema
      name: t.String(),
    }),
    detail: {
      summary: 'Create ${name}',
      tags: ['${module}'],
    },
  });
`;
}

async function addApi(module: string, name: string, options: Options = {}) {
  if (!module || !name) {
    console.error('Module and name required. Usage: bun run add-api <module> <name>');
    process.exit(1);
  }

  // Validate module name
  if (!/^[a-z][a-z0-9-]*$/.test(module)) {
    console.error('Invalid module name. Use lowercase letters, numbers, and hyphens. Must start with a letter.');
    process.exit(1);
  }

  // Validate api name
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('Invalid API name. Use lowercase letters, numbers, and hyphens. Must start with a letter.');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const apiDir = join(projectRoot, 'src', 'api', module);
  const fileName = `api.${name}.ts`;
  const filePath = join(apiDir, fileName);

  // Check if file exists
  if (existsSync(filePath) && !options.force) {
    console.log(`File "${fileName}" already exists in ${module}. Use --force to overwrite.`);
    return;
  }

  // Create module directory if needed
  if (!existsSync(apiDir)) {
    mkdirSync(apiDir, { recursive: true });
    console.log(`Created module directory: src/api/${module}/`);
  }

  // Create the file
  const content = createApiTemplate(module, name);
  writeFileSync(filePath, content);

  console.log(`Created: src/api/${module}/${fileName}`);
  console.log(`\nAPI prefix: /api/${module}/${name}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Import your controllers`);
  console.log(`  2. Create the portal with database access`);
  console.log(`  3. Define request body/params validation schemas`);
  console.log(`  4. Wire up endpoints to controllers`);
  console.log(`  5. Register this router in src/api-router.ts`);
  console.log(`\nTo register in api-router.ts:`);
  console.log(`  import api${toPascalCase(module)}${toPascalCase(name)} from './api/${module}/api.${name}';`);
  console.log(`  app.use(api${toPascalCase(module)}${toPascalCase(name)});`);
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Usage: bun run add-api <module> <name> [options]

Creates an Elysia API router (api.*) for HTTP endpoints.

Arguments:
  module        Module name (e.g., "user", "order")
  name          API name (e.g., "profile", "checkout")

Options:
  --force       Force overwrite existing file
  --help, -h    Show this help

File created: src/api/<module>/api.<name>.ts

Notes:
- One API file can have multiple endpoints (GET, POST, etc.)
- Each endpoint should call a controller
- Remember to register the router in src/api-router.ts

Examples:
  bun run add-api user profile
  bun run add-api order checkout --force
`);
    process.exit(0);
  }

  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const module = positionalArgs[0];
  const name = positionalArgs[1];

  addApi(module, name, {
    force: args.includes('--force'),
  }).catch(console.error);
}

export { addApi };
