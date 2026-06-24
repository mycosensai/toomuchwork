import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import { TRPCProvider } from '@/providers/trpc'
import App from './App.tsx'

function Root() {
  return (
    <BrowserRouter>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </BrowserRouter>
  )
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML = '<div style="color:white;background:#080808;padding:40px;text-align:center;font-family:sans-serif"><h1>The Vault DFW</h1><p>Loading...</p></div>'
} else {
  createRoot(rootEl).render(<Root />)
}