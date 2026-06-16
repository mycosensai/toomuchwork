import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useSignIn } from '@clerk/clerk-react'
import { Diamond, Loader2, Sparkles } from 'lucide-react'

export default function AuthSuccess() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()
  const [countdown, setCountdown] = useState(3)

  // Try to use Clerk if available
  const clerkAvailable = (() => {
    try {
      useSignIn()
      return true
    } catch {
      return false
    }
  })()

  useEffect(() => {
    // Page shows for 3 seconds then redirects to home
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/')
    }
  }, [countdown, navigate])

  // If not authenticated after 5 seconds, redirect to login
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAuthenticated && !isLoading) {
        navigate('/login')
      }
    }, 5000)
    return () => clearTimeout(timeout)
  }, [isAuthenticated, isLoading, navigate])

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(201,168,76,0.08)_0%,transparent_70%)]" />

      {/* Sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#C9A84C] rounded-full animate-ping"
            style={{
              left: `${15 + i * 15}%`,
              top: `${10 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-lg w-full animate-fadeInUp">
        {/* Diamond icon */}
        <div className="w-16 h-16 border-2 border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Sparkles className="w-8 h-8 text-[#C9A84C] -rotate-45" />
        </div>

        {/* Gold line accent */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-[#C9A84C]" />
          <Diamond className="w-2 h-2 text-[#C9A84C] rotate-45" />
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-[#C9A84C]" />
        </div>

        {/* Main message */}
        <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-[#F5EED8] tracking-[4px] mb-3 leading-tight">
          Successfully Cracked<br />
          <span className="bg-gradient-to-b from-[#FFD97A] via-[#C9A84C] to-[#8A6E2F] bg-clip-text text-transparent">
            The Vault!
          </span>
        </h1>

        <p className="font-cormorant italic text-xl text-[#C8BC98] mb-8">
          Have fun treasure hunting!
        </p>

        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded mb-8">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[10px] tracking-[2px] uppercase text-emerald-400 font-cinzel">
            {isAuthenticated ? 'Authenticated' : 'Completing sign-in...'}
          </span>
        </div>

        {/* Loading spinner + countdown */}
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-4 h-4 text-[#C9A84C] animate-spin" />
          <span className="text-xs text-[#8A6E2F]">
            Redirecting to your vault in {countdown}s...
          </span>
        </div>

        {/* Quick links */}
        <div className="mt-8 pt-6 border-t border-[#C9A84C]/15">
          <div className="flex justify-center gap-6">
            <Link
              to="/"
              className="text-xs tracking-[2px] uppercase text-[#C9A84C] hover:text-[#FFD97A] transition-colors font-cinzel"
            >
              Home
            </Link>
            <Link
              to="/browse"
              className="text-xs tracking-[2px] uppercase text-[#C9A84C] hover:text-[#FFD97A] transition-colors font-cinzel"
            >
              Browse
            </Link>
            <Link
              to="/sell"
              className="text-xs tracking-[2px] uppercase text-[#C9A84C] hover:text-[#FFD97A] transition-colors font-cinzel"
            >
              Sell
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}