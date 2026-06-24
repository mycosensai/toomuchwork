import { useState } from 'react'
import { useSignIn, useSignUp, useClerk, useAuth } from '@clerk/clerk-react'
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react'

interface Props {
  mode: 'login' | 'register'
  onToggleMode: () => void
}

export default function ClerkLoginForm({ mode, onToggleMode }: Props) {
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const { isLoaded: clerkReady, signIn, setActive: setSignInActive } = useSignIn()
  const { isLoaded: signUpReady, signUp, setActive: setSignUpActive } = useSignUp()
  const { isSignedIn } = useAuth()

  // Already signed in
  if (clerkReady && isSignedIn) {
    window.location.href = '/'
    return null
  }

  if (!clerkReady || !signUpReady) {
    return (
      <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 relative flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      const result = await signIn.create({
        identifier: email.toLowerCase(),
        password,
      })

      if (result.status === 'complete') {
        await setSignInActive({ session: result.createdSessionId })
        window.location.href = '/'
      } else {
        setError('Additional verification required.')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || err?.message || 'Login failed')
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      const result = await signUp.create({
        emailAddress: email.toLowerCase(),
        password,
        firstName: name,
      })

      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId })
        window.location.href = '/'
      } else {
        setError('Please check your email for a verification link.')
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || err?.message || 'Registration failed')
    }
  }

  const formAction = mode === 'login' ? handleLogin : handleRegister

  return (
    <div className="bg-[#161616] border border-[#C9A84C]/25 p-8 relative">
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]" />

      <form onSubmit={formAction} className="space-y-5">
        {mode === 'register' && (
          <div>
            <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3 px-4 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
            />
          </div>
        )}

        <div>
          <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@vault.com"
            className="w-full bg-[#1E1E1E] border border-[#C9A84C]/20 text-[#F5EED8] text-sm py-3 px-4 outline-none focus:border-[#C9A84C] transition-colors placeholder:text-[#8A6E2F]"
          />
        </div>

        <div>
          <label className="block text-[9px] tracking-[4px] uppercase text-[#C9A84C] mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Min 8 characters' : 'Your password'}
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
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] transition-all disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onToggleMode}
          className="text-xs text-[#C8BC98] hover:text-[#C9A84C] transition-colors tracking-[1px]"
        >
          {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  )
}
