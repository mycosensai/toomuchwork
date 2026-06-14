import { useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/react-router";
import type { SignInResource, SignUpResource } from "@clerk/types";

export type UnifiedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  role: "user" | "admin";
  createdAt?: Date;
};

type AuthResult =
  | { ok: true }
  | { ok: false; error: { code?: string; message?: string } };

export function useAuth() {
  const clerk = useClerkAuth();

  const login = useCallback(
    async (provider: "google" | "x" | "github"): Promise<AuthResult> => {
      try {
        await clerk.signIn.authenticateWithRedirect({
          strategy: `oauth_${provider}`,
          redirectUrl: "/sso-callback",
        });
        return { ok: true };
      } catch (error: any) {
        return {
          ok: false,
          error: {
            code: error?.code,
            message: error?.message ?? "Unable to start login",
          },
        };
      }
    },
    [clerk]
  );

  const register = useCallback(
    async (provider?: "google" | "x" | "github"): Promise<AuthResult> => {
      if (provider) {
        return login(provider);
      }

      try {
        await clerk.signUp.authenticateWithRedirect({
          redirectUrl: "/sso-callback",
        });
        return { ok: true };
      } catch (error: any) {
        return {
          ok: false,
          error: {
            code: error?.code,
            message: error?.message ?? "Unable to start registration",
          },
        };
      }
    },
    [clerk, login]
  );

  const user: UnifiedUser | null = clerk.isSignedIn
    ? {
        id: clerk.userId ?? "unknown",
        name: clerk.user?.fullName ?? clerk.user?.primaryEmailAddress?.emailAddress ?? null,
        email: clerk.user?.primaryEmailAddress?.emailAddress ?? null,
        avatar: clerk.user?.imageUrl ?? null,
        role: "user",
        createdAt: clerk.user?.createdAt ? new Date(clerk.user.createdAt) : new Date(),
      }
    : null;

  return {
    user,
    isAuthenticated: clerk.isSignedIn,
    isLoading: !clerk.isLoaded,
    isAdmin: false,
    logout: clerk.signOut,
    login,
    register,
  };
}
