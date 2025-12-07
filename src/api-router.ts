import apiFoo from "@/src/api/api.foo";
import { Elysia } from 'elysia';
import { auth } from "./database/foo/auth.foo";
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
  .mount(auth.handler)
  // .use(apiHealth) // example add sub router
  .use(apiFoo)
  .all("*", Response.json({ message: "Not Found" }, { status: 404 }))
