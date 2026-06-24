import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import { TRPCProvider } from '@/providers/trpc'
import App from './App.tsx'

const clerkPubKey: string | undefined =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function createSessionId() {
  if (globalThis.crypto?.randomUUID) {
    return `sess_${globalThis.crypto.randomUUID()}`
  }

  const bytes = new Uint8Array(16)
  globalThis.crypto?.getRandomValues?.(bytes)

  const entropy = Array.from(
    bytes,
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('')

  return `sess_${entropy}`
}

if (!localStorage.getItem('vault_session_id')) {
  localStorage.setItem('vault_session_id', createSessionId())
}

function Root() {
  // If Clerk key is missing, render without ClerkProvider (graceful degradation)
  if (!clerkPubKey) {
    console.warn('[Vault] Clerk publishable key missing — OAuth disabled')
    return (
      <BrowserRouter>
        <TRPCProvider>
          <App />
        </TRPCProvider>
      </BrowserRouter>
    )
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      signInUrl="/login"
      signUpUrl="/login"
      afterSignInUrl="/auth-success"
      afterSignUpUrl="/auth-success"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      proxyUrl="clerk.thevaultdfw.win"
      appearance={{
        variables: {
          colorPrimary: '#C9A84C',
          colorBackground: '#080808',
          colorText: '#F5EED8',
          colorTextSecondary: '#C8BC98',
          colorInputBackground: '#1E1E1E',
          colorInputText: '#F5EED8',
          colorInputBorder: '#C9A84C33',
          borderRadius: '0px',
          fontFamily: 'Cinzel, serif',
        },
      }}
    >
      <BrowserRouter>
        <TRPCProvider>
          <App />
        </TRPCProvider>
      </BrowserRouter>
    </ClerkProvider>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="color:white;background:#080808;padding:40px;text-align:center;font-family:sans-serif"><h1>The Vault DFW</h1><p>Loading...</p></div>'
} else {
  createRoot(rootEl).render(<Root />)
}