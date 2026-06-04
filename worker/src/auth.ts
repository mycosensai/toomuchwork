import { json, badRequest, unauthorized, serverError } from './types.ts';

const OAUTH_ERROR = 'oauth_not_configured';

export async function handleAuth(request: Request, env: Env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const provider = body?.provider;
    if (!provider) return badRequest('provider is required');
    if (!env.GOOGLE_OAUTH || !env.APPLE_OAUTH) {
      return json({ status: 'offline_fallback', error: OAUTH_ERROR, message: 'OAuth is not configured yet.' });
    }
    // TODO: real OAuth redirect + token verification
    return json({ status: 'offline_fallback', provider, id: 'local', session: 'stub' });
  }

  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    return json({ status: 'logged_out' });
  }

  return new Response('Not Found', { status: 404 });
}
