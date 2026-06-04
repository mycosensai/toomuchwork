// Routing + shared types for the Vault DFW worker.
export const json = (data: unknown, statusInit = 200) =>
  new Response(JSON.stringify(data), {
    status: statusInit,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
  });

export const badRequest = (message: string) => json({ error: message }, 400);
export const unauthorized = (message = 'Unauthorized') => json({ error: message }, 401);
export const serverError = (message: string) => json({ error: message }, 500);

export type Env = {
  VAULT_KV: KVNamespace;
  thevault_db: D1Database;
};
