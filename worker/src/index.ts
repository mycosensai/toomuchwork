import { logRequest } from './logging.ts';
import { handleAuth } from './auth.ts';
import { handleListings } from './listings.ts';
import { handleLeads } from './leads.ts';
import { handleAgent } from './agent.ts';
import { handleCheckout } from './checkout.ts';
import { handleTokenize } from './tokenize.ts';

export interface Env {
  VAULT_KV: KVNamespace;
  thevault_db: D1Database;
  CORS_ORIGIN?: string;
  JWT_SECRET?: string;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.CORS_ORIGIN
    ? (globalThis as any).process.env.CORS_ORIGIN
    : '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'authorization,content-type,x-request-id',
  'Access-Control-Max-Age': '86400',
};

const jsonHeaders = {
  'Content-Type': 'application/json',
  ...corsHeaders,
};

async function handleOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: { ...jsonHeaders },
  });
}

function errorResponse(code: string, message: string, details?: Record<string, unknown>, status = 500): Response {
  const body = JSON.stringify({ code, message, details });
  return new Response(body, {
    status,
    headers: { ...jsonHeaders },
  });
}

async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const start = Date.now();

  try {
    let response: Response;

    if (url.pathname.startsWith('/api/auth')) {
      response = await handleAuth(request, env);
    } else if (url.pathname.startsWith('/api/listings')) {
      response = await handleListings(request, env);
    } else if (url.pathname.startsWith('/api/leads')) {
      response = await handleLeads(request, env);
    } else if (url.pathname.startsWith('/api/agent')) {
      response = await handleAgent(request, env);
    } else if (url.pathname.startsWith('/api/checkout')) {
      response = await handleCheckout(request, env);
    } else if (url.pathname.startsWith('/api/tokenize')) {
      response = await handleTokenize(request, env);
    } else {
      response = new Response('Not Found', { status: 404, headers: jsonHeaders });
    }

    const duration = Date.now() - start;
    ctx.waitUntil(
      logRequest({
        url: url.href,
        method,
        status: response.status,
        durationMs: duration,
      })
    );

    return response;
  } catch (error) {
    const duration = Date.now() - start;

    ctx.waitUntil(
      logRequest({
        url: url.href,
        method,
        status: 500,
        durationMs: duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    );

    const details: Record<string, unknown> = {};
    if (error instanceof Error) {
      details.stack = error.stack;
    }

    console.error('Unhandled route error', { url: url.href, method, error, details });
    return errorResponse('internal_error', 'An unexpected error occurred', details, 500);
  }
}

export default {
  fetch: route,
};
