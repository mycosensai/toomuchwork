import { useState } from 'react'
import { Link } from 'react-router'
import {
  Diamond, Loader2, UserPlus, ArrowLeft, Eye, EyeOff, Mail, KeyRound
} from 'lucide-react'
import { useSignIn, useSignUp } from '@clerk/clerk-react'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

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

  // ─── OTP state ───
  const [otpMode, setOtpMode] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  // Clerk hooks — called unconditionally at top level (ClerkProvider wraps app)
  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn()
  const { signUp, isLoaded: signUpLoaded } = useSignUp()
  const clerkReady = signInLoaded && signUpLoaded

  const clearError = () => { setError('') }

  // ─── Clerk OAuth (Google, Apple, GitHub) ───
  const handleClerkOAuth = async (provider: 'google' | 'apple' | 'github') => {
    setError('')
    setPendingProvider(provider)
    try {
      if (!signIn || !signInLoaded) {
        setError('Sign-in service not ready. Please try again.')
        setPendingProvider(null)
        return
      }
      await signIn.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: window.location.origin + '/sso-callback',
        redirectUrlComplete: window.location.origin + '/auth-success',
      })
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message || err?.message || 'OAuth sign-in failed'
      setError(msg)
      setPendingProvider(null)
    }
  }

  // ─── Clerk OTP (email code) — send code ───
  const handleOtpSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!otpEmail.trim()) {
      setError('Please enter your email address.')
      return
    }
    setPendingProvider('otp')
    try {
      if (!signIn || !signInLoaded) {
        setError('Sign-in service not ready.')
        setPendingProvider(null)
        return
      }
      const { supportedFirstFactors } = await signIn.create({
        identifier: otpEmail.trim().toLowerCase(),
      })
      // Find email_code strategy
      const emailCodeFactor = supportedFirstFactors?.find(
        (f: any) => f.strategy === 'email_code'
      )
      if (emailCodeFactor) {
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailCodeFactor.emailAddressId,
        })
        setOtpSent(true)
        setError('')
      } else {
        setError('OTP sign-in not available for this email. Use social sign-in or password.')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Failed to send OTP code.')
    } finally {
      setPendingProvider(null)
    }
  }

  // ─── Clerk OTP — verify code ───
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!otpCode.trim()) {
      setError('Please enter the verification code.')
      return
    }
    setPendingProvider('otp')
    try {
      if (!signIn || !signInLoaded) {
        setError('Sign-in service not ready.')
        setPendingProvider(null)
        return
      }
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: otpCode.trim(),
      })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        window.location.href = '/auth-success'
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Invalid code. Please try again.')
    } finally {
      setPendingProvider(null)
    }
  }

  // ─── Clerk Email/Password ───
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
      if (clerkReady && signIn) {
        // Clerk email/password login
        const result = await signIn.create({
          identifier: email.toLowerCase(),
          password,
        })
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId })
          window.location.href = '/auth-success'
          return
        }
        // Additional steps may be required (MFA, etc.)
        setError('Sign-in requires additional verification.')
      } else {
        // Fallback: custom backend login (when Clerk unavailable)
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || 'Login failed')
          return
        }
        if (data.token) {
          localStorage.setItem('local_auth_token', data.token)
        }
        window.location.href = '/auth-success'
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Login failed. Check your credentials.')
    } finally {
      setPendingProvider(null)
    }
  }

  // ─── Clerk Email/Password Register ───
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
      if (clerkReady && signUp) {
        // Clerk registration
        const result = await signUp.create({
          emailAddress: email.toLowerCase(),
          password,
          username: name || undefined,
        })
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        // Clerk email verification sent — user needs to check inbox
        window.location.href = '/auth-success'
      } else {
        // Fallback: custom backend register
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
          credentials: 'include',
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || 'Registration failed')
          return
        }
        if (data.token) {
          localStorage.setItem('local_auth_token', data.token)
        }
        window.location.href = '/auth-success'
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || 'Registration failed. Please try again.')
    } finally {
      setPendingProvider(null)
    }
  }

  // Show OTP verification screen
  if (otpMode && otpSent) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="w-12 h-12 border border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-4">
              <Diamond className="w-5 h-5 text-[#C9A84C] -rotate-45" />
            </div>
            <h1 className="font-cinzel text-xl font-bold text-[#F5EED8] tracking-[6px]">THE VAULT</h1>
            <p className="text-[9px] tracking-[4px] uppercase text-[#8A6E2F] mt-2">Verify Code</p>
          </div>
          <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />
            <p className="text-xs text-[#C8BC98] mb-6 text-center">
              A verification code was sent to <span className="text-[#C9A84C]">{otpEmail}</span>
            </p>
            <form onSubmit={handleOtpVerify} className="space-y-5">
              <div>
                <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-2">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value); clearError() }}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-lg py-3 px-4 text-center tracking-[8px] outline-none focus:border-[#C9A84C] transition-colors"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>
              )}
              <button type="submit" disabled={pendingProvider === 'otp'}
                className="w-full py-3.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold disabled:opacity-50">
                {pendingProvider === 'otp' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Sign In'}
              </button>
            </form>
            <button onClick={() => { setOtpMode(false); setOtpSent(false); setOtpCode('') }}
              className="mt-4 w-full text-xs text-[#C8BC98] hover:text-[#C9A84C] transition-colors">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show OTP email input screen
  if (otpMode && !otpSent) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="w-12 h-12 border border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-4">
              <Diamond className="w-5 h-5 text-[#C9A84C] -rotate-45" />
            </div>
            <h1 className="font-cinzel text-xl font-bold text-[#F5EED8] tracking-[6px]">THE VAULT</h1>
            <p className="text-[9px] tracking-[4px] uppercase text-[#8A6E2F] mt-2">One-Time Passcode</p>
          </div>
          <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 relative">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />
            <form onSubmit={handleOtpSend} className="space-y-5">
              <div>
                <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-2">Email Address</label>
                <input
                  type="email"
                  value={otpEmail}
                  onChange={(e) => { setOtpEmail(e.target.value); clearError() }}
                  placeholder="collector@vault.com"
                  className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3 px-4 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
                />
              </div>
              {error && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-400 text-xs text-center">{error}</div>
              )}
              <button type="submit" disabled={pendingProvider === 'otp'}
                className="w-full py-3.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold disabled:opacity-50">
                {pendingProvider === 'otp' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Code'}
              </button>
            </form>
            <button onClick={() => { setOtpMode(false); setOtpEmail('') }}
              className="mt-4 w-full text-xs text-[#C8BC98] hover:text-[#C9A84C] transition-colors">
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
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

          {/* ─── Social OAuth Providers ─── */}
          <div className="space-y-3 mb-6">
            <ProviderButton
              label="Continue with Google"
              icon={<GoogleIcon className="w-4 h-4" />}
              onClick={() => handleClerkOAuth('google')}
              pending={pendingProvider === 'google'}
            />
            <ProviderButton
              label="Continue with Apple"
              icon={<AppleIcon className="w-4 h-4" />}
              onClick={() => handleClerkOAuth('apple')}
              pending={pendingProvider === 'apple'}
            />
            <ProviderButton
              label="Continue with GitHub"
              icon={<GitHubIcon className="w-4 h-4" />}
              onClick={() => handleClerkOAuth('github')}
              pending={pendingProvider === 'github'}
            />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#C9A84C]/15" />
            <span className="text-[10px] text-[#8A6E2F] tracking-[2px] uppercase">or</span>
            <div className="flex-1 h-px bg-[#C9A84C]/15" />
          </div>

          {/* ─── OTP Button ─── */}
          <button
            onClick={() => { setOtpMode(true); setError('') }}
            className="w-full flex items-center justify-center gap-3 py-3.5 border border-[#C9A84C]/30 text-[#C9A84C] text-xs tracking-[2px] uppercase font-cinzel font-semibold hover:bg-[#C9A84C]/8 transition-all mb-6"
          >
            <Mail className="w-4 h-4" />
            Sign in with One-Time Passcode
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#C9A84C]/15" />
            <span className="text-[10px] text-[#8A6E2F] tracking-[2px] uppercase">or use password</span>
            <div className="flex-1 h-px bg-[#C9A84C]/15" />
          </div>

          {/* Email/Password Form */}
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
                  type="password"
                  name="password"
                  placeholder="Min 8 characters"
                  className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3 px-4 pr-12 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
                />
                <button type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6E2F] hover:text-[#C9A84C] transition-colors">
                  <EyeOff className="w-4 h-4" />
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
              disabled={pendingProvider === 'email' || !clerkReady}
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