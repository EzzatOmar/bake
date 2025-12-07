import { Elysia } from 'elysia';
// Import API routes

/**
 * API Router
 *
 * Composes all API route plugins into a single router.
 * Each API file exports an Elysia instance with its own prefix.
 *
 * Type safety is preserved through the .use() chain.
 */
export default new Elysia({ 
  name: 'api-router',
  prefix: '/api/'
})
  // .use(apiHealth) // example add sub router
  .all("*", Response.json({ message: "Not Found" }, { status: 404 }))
