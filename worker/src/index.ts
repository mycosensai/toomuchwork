import { handleAuth } from './auth.ts';

export interface Env {
  VAULT_KV: KVNamespace;
  thevault_db: D1Database;
  CORS_ORIGIN?: string;
  JWT_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': env.CORS_ORIGIN ?? '*',
          'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
          'access-control-allow-headers': 'authorization,content-type,x-request-id',
          'access-control-max-age': '86400',
        },
      });
    }

    if (url.pathname.startsWith('/api/auth')) {
      return handleAuth(request, env);
    }

    return new Response(JSON.stringify({ ok: false as const, error: { code: 'not_found', message: 'Not Found' } }), {
      status: 404,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': env.CORS_ORIGIN ?? '*',
      },
    });
  },
};
