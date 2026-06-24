import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from '@/providers/trpc'
import App from './App.tsx'
import { Auth0Provider } from '@auth0/auth0-react'

function Root() {
  return (
    <Auth0Provider
      domain="dev-oj8mie8fyi4cvuop.us.auth0.com"
      clientId="gBfxk2O1yoK8EWwq0XhahiKvn90DxJC6"
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
      <BrowserRouter>
        <TRPCProvider>
          <App />
        </TRPCProvider>
      </BrowserRouter>
    </Auth0Provider>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="color:white;background:#080808;padding:40px;text-align:center;font-family:sans-serif"><h1>The Vault DFW</h1><p>Loading...</p></div>'
} else {
  createRoot(rootEl).render(<Root />)
}