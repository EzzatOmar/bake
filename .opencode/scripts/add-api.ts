#!/usr/bin/env bun

/**
 * Add API Route Script
 *
 * Creates an Elysia API router (api.) that handles HTTP endpoints.
 * API files export an Elysia instance with a prefix. Multiple endpoints
 * can be defined in a single file, each calling different controllers.
 *
 * Usage: bun run add-api <endpoint> [--force]
 *
 * Examples:
 *   bun run add-api /api/boards
 *   bun run add-api /api/boards/:id
 *   bun run add-api /api/users/profile
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

function parseEndpoint(endpoint: string): { prefix: string; name: string } {
  // Remove leading slash if present
  let path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // Remove trailing slash if present
  path = path.endsWith('/') ? path.slice(0, -1) : path;

  // Split by /
  const parts = path.split('/');

  // Remove 'api' prefix if present
  if (parts[0] === 'api') {
    parts.shift();
  }

  // Filter out path parameters (e.g., :id)
  const staticParts = parts.filter(p => !p.startsWith(':'));

  // The name is the last static part
  const name = staticParts[staticParts.length - 1] || 'index';

  // The prefix is the full path up to and including the name
  const prefix = '/api/' + staticParts.join('/');

  return { prefix, name };
}

function createApiTemplate(prefix: string, name: string): string {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);

  return `/**
 * API Router: api.${name}
 * Prefix: ${prefix}
 *
 * This Elysia router handles HTTP endpoints for ${name}.
 * - Export default: new Elysia({ prefix: '${prefix}' })
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
// import ctrlGet${pascalName} from '@/src/controller/ctrl.get-${name}';

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

export default new Elysia({ prefix: '${prefix}' })
  // Handle validation errors gracefully
  .onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 422;
      // Extract the first validation error message
      const validationError = error as unknown as { 
        message: string;
        all?: Array<{ message: string }>;
        validator?: { Errors?: (value: unknown) => Generator<{ message: string }> };
      };
      
      let message = 'Validation failed';
      
      // Try to get a meaningful error message
      if (typeof validationError.message === 'string') {
        message = validationError.message;
      }
      
      return { type: 'VALIDATION_ERROR', message };
    }
  })
  /**
   * GET ${prefix}/:id
   *
   * TODO: Describe what this endpoint does
   */
  .get('/:id', async ({ params, set }) => {
    // TODO: Create portal with database access
    // const portal = { db: mainDb };

    // TODO: Call controller
    // const [data, err] = await ctrlGet${pascalName}(portal, { id: params.id });
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
      tags: ['${name}'],
    },
  })

  /**
   * POST ${prefix}
   *
   * TODO: Describe what this endpoint does
   */
  .post('/', async ({ body, set }) => {
    // TODO: Create portal with database access
    // const portal = { db: mainDb };

    // TODO: Call controller
    // const [data, err] = await ctrlCreate${pascalName}(portal, body);
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
      tags: ['${name}'],
    },
  });
`;
}

async function addApi(endpoint: string, options: Options = {}) {
  if (!endpoint) {
    console.error('Endpoint required. Usage: bun run add-api <endpoint>');
    console.error('Example: bun run add-api /api/boards');
    process.exit(1);
  }

  const { prefix, name } = parseEndpoint(endpoint);

  // Validate name
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    console.error('Invalid endpoint name. The last path segment must use lowercase letters, numbers, and hyphens.');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const apiDir = join(projectRoot, 'src', 'api');
  const fileName = `api.${name}.ts`;
  const filePath = join(apiDir, fileName);

  // Check if file exists
  if (existsSync(filePath) && !options.force) {
    console.log(`File "${fileName}" already exists. Use --force to overwrite.`);
    return;
  }

  // Create api directory if needed
  if (!existsSync(apiDir)) {
    mkdirSync(apiDir, { recursive: true });
    console.log(`Created directory: src/api/`);
  }

  // Create the file
  const content = createApiTemplate(prefix, name);
  writeFileSync(filePath, content);

  console.log(`Created: src/api/${fileName}`);
  console.log(`\nAPI prefix: ${prefix}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Import your controllers`);
  console.log(`  2. Create the portal with database access`);
  console.log(`  3. Define request body/params validation schemas`);
  console.log(`  4. Wire up endpoints to controllers`);
  console.log(`  5. Register this router in src/api-router.ts`);
  console.log(`\nTo register in api-router.ts:`);
  console.log(`  import api${toPascalCase(name)} from './api/api.${name}';`);
  console.log(`  app.use(api${toPascalCase(name)});`);
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
Usage: bun run add-api <endpoint> [options]

Creates an Elysia API router (api.*) for HTTP endpoints.

Arguments:
  endpoint      API endpoint path (e.g., "/api/boards", "/api/users/:id")

Options:
  --force       Force overwrite existing file
  --help, -h    Show this help

File created: src/api/api.<name>.ts

Notes:
- One API file can have multiple endpoints (GET, POST, etc.)
- Each endpoint should call a controller
- Remember to register the router in src/api-router.ts

Examples:
  bun run add-api /api/boards
  bun run add-api /api/boards/:id
  bun run add-api /api/users/profile --force
`);
    process.exit(0);
  }

  const positionalArgs = args.filter(a => !a.startsWith('--'));
  const endpoint = positionalArgs[0];

  addApi(endpoint, {
    force: args.includes('--force'),
  }).catch(console.error);
}

export { addApi };
