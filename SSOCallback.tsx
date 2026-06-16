import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Loader2 } from 'lucide-react'

export default function SSOCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Clerk automatically processes the OAuth callback when coming back from
    // the OAuth provider. We just wait a moment for the cookie/session to settle,
    // then redirect to the success/auth-success page which will verify auth state.

    let cancelled = false

    const delay = setTimeout(() => {
      if (!cancelled) {
        // Check if Clerk managed to sign us in by looking for storage indicators
        const clerkPresent = !!document.cookie.includes('__session') || 
                             !!localStorage.getItem('clerk-db') ||
                             !!sessionStorage.getItem('local_auth_token') ||
                             !!localStorage.getItem('vault_auth_present')
        
        // Always redirect to auth-success page - it will verify auth state there
        navigate('/auth-success')
      }
    }, 1500)

    return () => {
      cancelled = true
      clearTimeout(delay)
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full animate-fadeIn">
        <div className="w-14 h-14 border-2 border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-6">
          <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin -rotate-45" />
        </div>

        <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F5EED8] tracking-[6px] mb-4">
          THE VAULT
        </h1>

        <p className="text-[9px] tracking-[4px] uppercase text-[#8A6E2F] mb-4">
          Completing sign-in...
        </p>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
          <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
        </div>

        <div className="text-xs text-[#8A6E2F]">
          <a href="/auth-success" className="hover:text-[#C9A84C] transition-colors">
            Continue to Vault →
          </a>
        </div>
      </div>
    </div>
  )
}