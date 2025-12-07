import { Elysia } from 'elysia';

// Import API route plugins
import apiHealth from './health/api.health';

/**
 * API Router
 *
 * Composes all API route plugins into a single router.
 * Each API file exports an Elysia instance with its own prefix.
 *
 * Type safety is preserved through the .use() chain.
 */
export default new Elysia({ name: 'api-router' })
  .use(apiHealth);
