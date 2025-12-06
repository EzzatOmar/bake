import { describe, expect, test } from 'bun:test';
import { extractMethodControllerMap } from './api-ctrl-lookup';

describe('extractMethodControllerMap', () => {
  test('should extract controller from single GET method', () => {
    const code = `
      import ctrlGetUserMagicCards from '../../controller/magic-cards/ctrl.get-user-magic-cards';
      import type { BunRequest, Serve, Server } from 'bun';

      const apiUserCards = {
        GET: async (req, _server) => {
          const [result, error] = await ctrlGetUserMagicCards({ session }, { userId });
          return Response.json(result);
        }
      };

      export default apiUserCards;
    `;

    const result = extractMethodControllerMap(code);
    
    expect(result).toEqual({
      GET: ['ctrl.get-user-magic-cards']
    });
  });

  test('should extract different controllers for different methods', () => {
    const code = `
      import ctrlGetUserMagicCards from '../../controller/magic-cards/ctrl.get-user-magic-cards';
      import ctrlCreateDeck from '../../controller/magic-cards/ctrl.create-deck';
      import type { BunRequest, Serve, Server } from 'bun';

      const apiDecks = {
        GET: async (req, _server) => {
          const [result, error] = await ctrlGetUserMagicCards({ session }, { userId });
          return Response.json(result);
        },
        POST: async (req, _server) => {
          const [result, error] = await ctrlCreateDeck({ session }, { name });
          return Response.json(result);
        }
      };

      export default apiDecks;
    `;

    const result = extractMethodControllerMap(code);
    
    expect(result).toEqual({
      GET: ['ctrl.get-user-magic-cards'],
      POST: ['ctrl.create-deck']
    });
  });

  test('should handle multiple controllers in one method', () => {
    const code = `
      import ctrlGetUserMagicCards from '../../controller/magic-cards/ctrl.get-user-magic-cards';
      import ctrlCreateDeck from '../../controller/magic-cards/ctrl.create-deck';
      import type { BunRequest, Serve, Server } from 'bun';

      const apiDecks = {
        POST: async (req, _server) => {
          const [cards, error1] = await ctrlGetUserMagicCards({ session }, { userId });
          const [deck, error2] = await ctrlCreateDeck({ session }, { name });
          return Response.json({ cards, deck });
        }
      };

      export default apiDecks;
    `;

    const result = extractMethodControllerMap(code);
    
    expect(result).toEqual({
      POST: expect.arrayContaining(['ctrl.get-user-magic-cards', 'ctrl.create-deck'])
    });
    expect(result.POST).toHaveLength(2);
  });

  test('should handle all HTTP methods', () => {
    const code = `
      import ctrlGet from './ctrl.get';
      import ctrlPost from './ctrl.post';
      import ctrlPut from './ctrl.put';
      import ctrlDelete from './ctrl.delete';

      const api = {
        GET: async (req) => await ctrlGet(),
        POST: async (req) => await ctrlPost(),
        PUT: async (req) => await ctrlPut(),
        DELETE: async (req) => await ctrlDelete()
      };
    `;

    const result = extractMethodControllerMap(code);
    
    expect(result).toEqual({
      GET: ['ctrl.get'],
      POST: ['ctrl.post'],
      PUT: ['ctrl.put'],
      DELETE: ['ctrl.delete']
    });
  });

  test('should return empty object when no controllers are used', () => {
    const code = `
      import type { BunRequest, Serve, Server } from 'bun';

      const api = {
        GET: async (req) => {
          return Response.json({ message: 'Hello' });
        }
      };

      export default api;
    `;

    const result = extractMethodControllerMap(code);
    
    expect(result).toEqual({});
  });

  test('should ignore non-controller imports', () => {
    const code = `
      import ctrlGetUserMagicCards from '../../controller/magic-cards/ctrl.get-user-magic-cards';
      import fxGetUserMagicCards from '../../function/magic-cards/fx.get-user-magic-cards';
      import { toErrorResponse } from '../../error/err.response';
      import type { BunRequest, Serve, Server } from 'bun';

      const api = {
        GET: async (req) => {
          const [result, error] = await ctrlGetUserMagicCards({ session, fxGetUserMagicCards }, { userId });
          if (error) return toErrorResponse({ req, error });
          return Response.json(result);
        }
      };
    `;

    const result = extractMethodControllerMap(code);
    
    expect(result).toEqual({
      GET: ['ctrl.get-user-magic-cards']
    });
  });

  test('should handle real-world API file structure', () => {
    const code = `
      import ctrlGetUserMagicCards from '../../controller/magic-cards/ctrl.get-user-magic-cards';
      import fxGetUserMagicCards from '../../function/magic-cards/fx.get-user-magic-cards';
      import { toErrorResponse } from '../../error/err.response';
      import type { BunRequest, Serve, Server } from 'bun';
      import { z } from 'zod';

      const pathSchema = z.object({
        userId: z.string().transform((val) => Number(val))
      });

      const apiUserCards: Partial<Record<Serve.HTTPMethod, Serve.Handler<BunRequest<'/api/users/:userId/cards'>, Server<undefined>, Response>>> = {
        GET: async (req, _server) => {
          try {
            const pathParams = req.params;
            const pathResult = pathSchema.safeParse(pathParams);
            
            if (!pathResult.success) {
              return Response.json({
                type: 'VALIDATION_ERROR',
                message: 'Invalid path parameters',
                errors: pathResult.error.issues
              }, { status: 400 });
            }
            
            const { userId } = pathResult.data;
            const session = { userId, username: 'current_user', email: 'user@example.com' };
            
            const [result, error] = await ctrlGetUserMagicCards(
              { session, fxGetUserMagicCards },
              { userId }
            );
            
            if (error) {
              return toErrorResponse({ req, error });
            }
            
            return Response.json(result, { status: 200 });
            
          } catch (unexpectedError) {
            console.error('Unexpected error in apiUserCards GET:', unexpectedError);
            return Response.json({
              type: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred'
            }, { status: 500 });
          }
        }
      };

      export default apiUserCards;
    `;

    const result = extractMethodControllerMap(code);
    
    expect(result).toEqual({
      GET: ['ctrl.get-user-magic-cards']
    });
  });
});
