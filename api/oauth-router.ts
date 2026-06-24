import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import {
  buildAuthUrl,
  isProviderConfigured,
  type OAuthProvider,
} from "./oauth-providers";

export const oauthRouter = createRouter({
  getAuthUrl: publicQuery
    .input(
      z.object({
        provider: z.enum(["google", "github"]),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await buildAuthUrl(input.provider as OAuthProvider);
      return {
        url: result.url,
        error: result.error || null,
        configured: isProviderConfigured(input.provider as OAuthProvider),
      };
    }),

  getProviders: publicQuery.query(() => {
    return [
      {
        id: "google" as const,
        name: "Google",
        configured: isProviderConfigured("google"),
      },
      {
        id: "github" as const,
        name: "GitHub",
        configured: isProviderConfigured("github"),
      },
    ];
  }),
});
