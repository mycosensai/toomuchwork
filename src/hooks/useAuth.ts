import { trpc } from "@/providers/trpc"
import { useCallback, useMemo } from "react"
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react"

type UnifiedUser = {
  id: number
  name: string | null
  email: string | null
  avatar: string | null
  role: "user" | "admin"
  createdAt: Date
}

export function useAuth() {
  const utils = trpc.useUtils()

  // Clerk hooks - wrapped in try/catch via the global check
  let clerkSignedIn = false
  let clerkUserId: string | null = null
  let clerkUser: any = null
  let isClerkLoaded = false

  try {
    const clerk = useClerkAuth()
    clerkSignedIn = clerk.isSignedIn ?? false
    clerkUserId = clerk.userId ?? null
    const user = useUser()
    clerkUser = user.user ?? null
    isClerkLoaded = true
  } catch {
    // Clerk not configured - fall through to local auth
  }

  // Query OAuth user (existing custom auth)
  const {
    data: oauthUser,
    isLoading: oauthLoading,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !clerkSignedIn,
  })

  // Query local auth user
  const {
    data: localUser,
    isLoading: localLoading,
  } = trpc.localAuth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !clerkSignedIn,
  })

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.invalidate()
    },
  })

  // Build unified user from Clerk or existing auth
  const user: UnifiedUser | null = useMemo(() => {
    // Clerk takes priority
    if (clerkSignedIn && clerkUser) {
      return {
        id: Number(clerkUser.id.replace("user_", "")) || 0,
        name: clerkUser.fullName || clerkUser.username || clerkUser.firstName || "Collector",
        email: clerkUser.primaryEmailAddress?.emailAddress || null,
        avatar: clerkUser.imageUrl || null,
        role: "user",
        createdAt: new Date(clerkUser.createdAt || Date.now()),
      }
    }

    if (oauthUser) {
      return {
        id: oauthUser.id,
        name: oauthUser.name,
        email: oauthUser.email,
        avatar: oauthUser.avatar,
        role: oauthUser.role as "user" | "admin",
        createdAt: oauthUser.createdAt,
      }
    }
    if (localUser) {
      return {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        avatar: localUser.avatar,
        role: localUser.role as "user" | "admin",
        createdAt: localUser.createdAt,
      }
    }
    return null
  }, [clerkSignedIn, clerkUser, oauthUser, localUser])

  const isLoading = oauthLoading || localLoading || !isClerkLoaded
  const isAuthenticated = clerkSignedIn || !!user
  const isAdmin = user?.role === "admin"

  const logout = useCallback(() => {
    localStorage.removeItem("local_auth_token")

    // Sign out from Clerk if signed in — redirect to Clerk sign-out
    logoutMutation.mutate()

    if (clerkSignedIn) {
      const origin = window.location.origin
      window.location.href = `https://${origin}/?clerk_sign_out=true`
      return
    }

    window.location.reload()
  }, [logoutMutation, clerkSignedIn])

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      isAdmin,
      logout,
    }),
    [user, isAuthenticated, isLoading, isAdmin, logout],
  )
}