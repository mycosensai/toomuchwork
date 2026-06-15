import { useEffect } from 'react'
import { useSignIn } from '@clerk/clerk-react'
import { navigate } from 'react-router'
import { Loader2, CheckCircle } from 'lucide-react'

export default function SSOCallback() {
  const { signIn, isLoaded: signInLoaded } = useSignIn()

  useEffect(() => {
    if (!signInLoaded || !signIn) return

    const handleCallback = async () => {
      try {
        // Clerk automatically processes the OAuth callback when the component mounts
        // Check if sign-in is already complete
        if (signIn.status === 'complete') {
          navigate('/')
          return
        }

        // Try to complete the sign-in with the current URL parameters
        const result = await signIn.create()
        
        if (result.status === 'complete') {
          navigate('/')
        }
      } catch {
        // If there's an error, Clerk will redirect to sign-in page automatically
        navigate('/login')
      }
    }

    handleCallback()
  }, [signInLoaded, signIn])

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="w-12 h-12 border border-[#C9A84C] rotate-45 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin -rotate-45" />
        </div>

        <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-[#F5EED8] tracking-[6px] mb-4">
          THE VAULT
        </h1>

        <p className="text-[9px] tracking-[4px] uppercase text-[#8A6E2F] mb-4">
          Completing sign-in...
        </p>

        <div className="text-xs text-[#8A6E2F]">
          <a href="/" className="hover:text-[#C9A84C] transition-colors">
            Return to homepage
          </a>
        </div>
      </div>
    </div>
  )
}