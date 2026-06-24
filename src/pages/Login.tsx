import { useState } from 'react'
import { Link } from 'react-router'
import {
  Diamond, Loader2, ArrowLeft, Eye, EyeOff, KeyRound
} from 'lucide-react'

function ProviderButton({
  label,
  icon,
  onClick,
  disabled,
  pending,
  variant = 'outline',
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  pending?: boolean
  variant?: 'gold' | 'outline'
}) {
  const base =
    'w-full flex items-center justify-center gap-3 py-3.5 text-xs tracking-[2px] uppercase font-cinzel font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed'
  const styles =
    variant === 'gold'
      ? 'bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] hover:shadow-[0_0_40px_rgba(201,168,76,0.4)]'
      : 'border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/8'

  return (
    <button onClick={onClick} disabled={disabled || pending} className={`${base} ${styles}`}>
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  )
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [pendingProvider, setPendingProvider] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const clearError = () => { setError('') }

  // ─── Email/Password Login via custom backend ───
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setPendingProvider('email')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Login failed')
        setPendingProvider(null)
        return
      }
      if (data.token) {
        // Store in localStorage so it persists across tabs and page reloads
        localStorage.setItem('local_auth_token', data.token)
      }
      window.location.href = '/auth-success'
    } catch (err: any) {
      setError(err?.message || 'Login failed. Check your credentials.')
      setPendingProvider(null)
    }
  }

  // ─── Email/Password Register via custom backend ───
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const form = e.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement)?.value?.trim() || ''
    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value?.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement)?.value

    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }

    setPendingProvider('email')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email.toLowerCase(), password }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Registration failed')
        setPendingProvider(null)
        return
      }
      if (data.token) {
        // Store in localStorage so it persists across tabs and page reloads
        localStorage.setItem('local_auth_token', data.token)
      }
      window.location.href = '/auth-success'
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
      setPendingProvider(null)
    }
  }

  // ─── Main Login/Register screen ───
  const formAction = mode === 'login' ? handleSubmit : handleRegister

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

        {/* Form Card */}
        <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 relative">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />

        {/* ─── Email/Password Form ─── */}
          <form onSubmit={formAction} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3 px-4 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
                />
              </div>
            )}

            <div>
              <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-2">Email</label>
              <input
                type="email"
                name="email"
                placeholder="collector@vault.com"
                className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3 px-4 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
              />
            </div>

            <div>
              <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min 8 characters"
                  className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3 px-4 pr-12 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6E2F] hover:text-[#C9A84C] transition-colors"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={pendingProvider === 'email'}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] transition-all disabled:opacity-50"
            >
              {pendingProvider === 'email' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-xs text-[#C8BC98] hover:text-[#C9A84C] transition-colors tracking-[1px]"
            >
              {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign In'}
            </button>
          </div>
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
