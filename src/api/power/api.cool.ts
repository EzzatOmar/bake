/**
 * API Router: api.cool
 * Module: power
 * Prefix: /api/power/cool
 *
 * This Elysia router handles HTTP endpoints for cool.
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
// import ctrlPowerCool from '@/src/controller/power/ctrl.cool';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

// TODO: Define response types for documentation
// type TCoolResponse = {
//   id: string;
//   name: string;
// };

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

export default new Elysia({ prefix: '/api/power/cool' })
  /**
   * GET /api/power/cool/:id
   *
   * TODO: Describe what this endpoint does
   */
  .get('/:id', async ({ params, set }) => {
    // TODO: Create portal with database access
    // const portal = { db: mainDb };

    // TODO: Call controller
    // const [data, err] = await ctrlPowerCool(portal, { id: params.id });
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
      summary: 'Get cool by ID',
      tags: ['power'],
    },
  })

  /**
   * POST /api/power/cool
   *
   * TODO: Describe what this endpoint does
   */
  .post('/', async ({ body, set }) => {
    // TODO: Create portal with database access
    // const portal = { db: mainDb };

    // TODO: Call controller
    // const [data, err] = await ctrlPowerCreateCool(portal, body);
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
      summary: 'Create cool',
      tags: ['power'],
    },
  });
