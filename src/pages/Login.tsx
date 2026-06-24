import { useState, lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { Diamond, Loader2, ArrowLeft } from 'lucide-react'

// Check if Clerk is configured at module level
const clerkPubKey =
  typeof import.meta !== 'undefined'
    ? (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY
    : undefined

// Lazy-load Clerk form only when Clerk is available
const ClerkLoginForm = clerkPubKey
  ? lazy(() => import('./ClerkLoginForm'))
  : null

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // ─── Clerk not configured fallback ───
  if (!ClerkLoginForm) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="w-12 h-12 border border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-4">
              <Diamond className="w-5 h-5 text-[#C9A84C] -rotate-45" />
            </div>
            <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F5EED8] tracking-[6px]">
              THE VAULT
            </h1>
            <p className="text-[9px] tracking-[4px] uppercase text-[#8A6E2F] mt-2">
              Authentication
            </p>
          </div>

          <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 relative text-center">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />

            <p className="text-[#C8BC98] text-sm mb-4">
              Sign in with Clerk is not yet configured.
            </p>
            <p className="text-[#8A6E2F] text-xs">
              Set <code className="text-[#C9A84C]">VITE_CLERK_PUBLISHABLE_KEY</code> in your Cloudflare Pages environment variables.
            </p>
          </div>

          <div className="text-center mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-[#8A6E2F] hover:text-[#C9A84C] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Clerk is configured — render the Clerk-powered form ───
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 border border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-4">
            <Diamond className="w-5 h-5 text-[#C9A84C] -rotate-45" />
          </div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F5EED8] tracking-[6px]">
            THE VAULT
          </h1>
          <p className="text-[9px] tracking-[4px] uppercase text-[#8A6E2F] mt-2">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 relative flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
            </div>
          }
        >
          <ClerkLoginForm mode={mode} onToggleMode={() => { setMode(m => m === 'login' ? 'register' : 'login') }} />
        </Suspense>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] tracking-[3px] uppercase text-[#8A6E2F] hover:text-[#C9A84C] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
