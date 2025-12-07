import { Elysia } from 'elysia';
import ctrlHealth from '@/src/controller/health/ctrl.health';

export default new Elysia({ prefix: '/api/health' })
  .get('/', async ({ set }) => {
    const [result, error] = await ctrlHealth({}, {});

    if (error) {
      set.status = error.statusCode;
      return Response.json({
        code: error.code,
        message: error.externalMessage?.en ?? 'An error occurred',
      }, { status: error.statusCode });
    }

    return result;
  }, {
    detail: {
      tags: ['System'],
      summary: 'Health check endpoint',
      description: 'Returns the current health status of the API',
    },
  });
