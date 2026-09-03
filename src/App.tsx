import { Routes, Route } from 'react-router'
import { Suspense, lazy } from 'react'
import { Diamond } from 'lucide-react'
import Layout from './components/Layout'
import MobileAppPrompt from './components/MobileAppPrompt'

const Home = lazy(() => import('./pages/Home'))
const Storefront = lazy(() => import('./pages/Storefront'))
const ListingDetail = lazy(() => import('./pages/ListingDetail'))
const Appraisal = lazy(() => import('./pages/Appraisal'))
const AppraisalEmail = lazy(() => import('./pages/AppraisalEmail'))
const Sell = lazy(() => import('./pages/Sell'))
const Checkout = lazy(() => import('./pages/Checkout'))
const CryptoCheckout = lazy(() => import('./pages/CryptoCheckout'))
const WalletPay = lazy(() => import('./pages/WalletPay'))
const Certificate = lazy(() => import('./pages/Certificate'))
const TokenGallery = lazy(() => import('./pages/TokenGallery'))
const Support = lazy(() => import('./pages/Support'))
const ProVerify = lazy(() => import('./pages/ProVerify'))
const ProVerifyResult = lazy(() => import('./pages/ProVerifyResult'))
const Leads = lazy(() => import('./pages/Leads'))
const Login = lazy(() => import('./pages/Login'))
const SSOCallback = lazy(() => import('./pages/SSOCallback'))
const AuthSuccess = lazy(() => import('./pages/AuthSuccess'))
const Admin = lazy(() => import('./pages/Admin'))
const About = lazy(() => import('./pages/About'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Returns = lazy(() => import('./pages/Returns'))
const Shipping = lazy(() => import('./pages/Shipping'))
const Contact = lazy(() => import('./pages/Contact'))
const Orders = lazy(() => import('./pages/Orders'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const SocialLeads = lazy(() => import('./pages/SocialLeads'))
const SaleManager = lazy(() => import('./pages/SaleManager'))
const Agents = lazy(() => import('./pages/Agents'))
const AgentProject = lazy(() => import('./pages/AgentProject'))
const AgentCommand = lazy(() => import('./pages/AgentCommand'))
const MarketingDashboard = lazy(() => import('./pages/MarketingDashboard'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Forum = lazy(() => import('./pages/Forum'))
const ForumPost = lazy(() => import('./pages/ForumPost'))
const Messages = lazy(() => import('./pages/Messages'))
const Concierge = lazy(() => import('./pages/Concierge'))

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-10 h-10 mx-auto mb-5">
          <div className="absolute inset-0 border border-[#C9A84C] rotate-45 animate-[spin_2.2s_linear_infinite]" />
          <Diamond className="absolute inset-0 m-auto w-3 h-3 text-[#C9A84C] -rotate-45 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 justify-center mb-3">
          <span className="w-1 h-1 bg-[#C9A84C]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 bg-[#C9A84C]/60 rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
          <span className="w-1 h-1 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
        </div>
        <p className="text-[10px] tracking-[5px] uppercase text-[#C9A84C]/70 font-cinzel">The Vault</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <MobileAppPrompt />

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Storefront />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/appraisal" element={<Appraisal />} />
            <Route path="/appraisal-email" element={<AppraisalEmail />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/checkout/:id" element={<Checkout />} />
            <Route path="/crypto-checkout/:id" element={<CryptoCheckout />} />
            <Route path="/wallet-pay/:id" element={<WalletPay />} />
            <Route path="/certificate/:id" element={<Certificate />} />
            <Route path="/token-gallery" element={<TokenGallery />} />
            <Route path="/support" element={<Support />} />
            <Route path="/proverify" element={<ProVerify />} />
            <Route path="/proverify/:id" element={<ProVerifyResult />} />
            <Route path="/leads/:id" element={<Leads />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/social-leads/:listingId" element={<SocialLeads />} />
            <Route path="/sale" element={<SaleManager />} />
            <Route path="/sale/:id" element={<SaleManager />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:projectId" element={<AgentProject />} />
            <Route path="/admin/agents" element={<AgentCommand />} />
            <Route path="/admin/marketing" element={<MarketingDashboard />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/:id" element={<ForumPost />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/concierge" element={<Concierge />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sso-callback" element={<SSOCallback />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
