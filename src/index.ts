import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import apiRouter from './api-router';
import { staticPlugin } from '@elysiajs/static'
import { htmlRoutes } from './lib/html-routes';

// Auto-discover HTML files and create clean URL routes
const routes = await htmlRoutes({ dir: './src/page' });

/**
 * Main application
 *
 * Put Frontend are automatically served from ./src/page
 * Clean URLs are auto-generated (e.g., board.html -> /board)
 */
const app = new Elysia({
  serve: {
    development: {
      hmr: false, // disables until: https://github.com/oven-sh/bun/issues/18258
      console: true,
    },
    routes,
  }
})
  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'Backed Kanban API',
        version: '1.0.0',
        description: 'API documentation for Backed Kanban',
      },
    },
  }))
  .use(await staticPlugin({ prefix: '/', assets: './src/page', indexHTML: true }))
  .use(apiRouter)
  .onError(({ error, set }) => {
    console.error('Unhandled error:', error);
    set.status = 500;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    };
  })
  .listen(process.env.PORT || 3000);

console.log(`Server running on http://localhost:${app.server?.port}`);
console.log(`API docs: http://localhost:${app.server?.port}/docs`);

// Export app type for Eden client
export type App = typeof app;
