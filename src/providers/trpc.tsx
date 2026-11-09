import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";

export const trpc = createTRPCReact<AppRouter>();

function getStoredAuthToken() {
  try {
    // Use localStorage so the token persists across tabs and page reloads
    const token = localStorage.getItem("local_auth_token");
    if (token) {
      return token;
    }
  } catch (err) {
    console.error("Unable to access auth storage", err);
  }

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        const token = getStoredAuthToken();

        let sessionId: string | null = null;

        try {
          sessionId = localStorage.getItem("vault_session_id");
        } catch (err) {
          console.error("Unable to access session storage", err);
        }

        const headers: Record<string, string> = {
          "x-client-version": "vault-v3",
        };

        if (token) {
          headers["x-local-auth-token"] = token;
        }

        if (sessionId) {
          headers["x-session-id"] = sessionId;
        }

        return headers;
      },
      async fetch(input, init) {
        try {
          const response = await globalThis.fetch(input, {
            ...(init ?? {}),
            credentials: "include",
            headers: {
              ...(init?.headers ?? {}),
              Accept: "application/json",
            },
          });

          if (response.status === 401) {
            try {
              localStorage.removeItem("local_auth_token");
            } catch (err) {
              console.error("Unable to clear expired auth token", err);
            }
          }

          // The server rotates the local-auth token on activity and returns
          // the new one in the x-local-auth-token response header. Persist it
          // so the next request uses the refreshed lastActivity — otherwise
          // every request re-verifies the stale token and the session is
          // hard-logged-out after 30 idle-looking minutes.
          const rotated = response.headers.get("x-local-auth-token");
          if (rotated) {
            try {
              localStorage.setItem("local_auth_token", rotated);
            } catch (err) {
              console.error("Unable to persist rotated auth token", err);
            }
          }

          return response;
        } catch (err) {
          console.error("TRPC network request failed", err);
          throw err;
        }
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}