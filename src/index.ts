import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import apiRouter from './api/router';
import index from './pages/index.html';

const app = new Elysia()
  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'Visual Backend API',
        version: '1.0.0',
        description: 'API documentation for Visual Backend',
      },
    },
  }))
  .use(apiRouter)
  .get('/', index)
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
