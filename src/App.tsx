import { Routes, Route } from 'react-router'
import { Suspense, lazy } from 'react'
import { Diamond, Gavel, Sparkles, Bell, AlertTriangle, Search, LayoutGrid, Newspaper, Image, Trophy, Brain } from 'lucide-react'
import Layout from './components/Layout'
import MobileAppPrompt from './components/MobileAppPrompt'
import RouteMeta from './lib/route-meta'

const Home = lazy(() => import('./pages/Home'))
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
const Cart = lazy(() => import('./pages/Cart'))
const Profile = lazy(() => import('./pages/Profile'))
const SellerProfile = lazy(() => import('./pages/SellerProfile'))
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
const OfferManagement = lazy(() => import("./pages/OfferManagement"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const SettingsDevices = lazy(() => import("./pages/SettingsDevices"))
const SettingsSecurity = lazy(() => import("./pages/SettingsSecurity"))
const SettingsNotifications = lazy(() => import("./pages/SettingsNotifications"))
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"))
const Auctions = lazy(() => import('./pages/Auctions'))
const Membership = lazy(() => import('./pages/Membership'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Alerts = lazy(() => import('./pages/Alerts'))
const SavedSearches = lazy(() => import('./pages/SavedSearches'))
const Curated = lazy(() => import('./pages/Curated'))
const Blog = lazy(() => import('./pages/Blog'))
const Showcases = lazy(() => import('./pages/Showcases'))
const Badges = lazy(() => import('./pages/Badges'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))

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
      <RouteMeta />
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
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/seller/:handle" element={<SellerProfile />} />
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
            <Route path="/offers" element={<OfferManagement />} />
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/searches" element={<SavedSearches />} />
            <Route path="/curated" element={<Curated />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/showcases" element={<Showcases />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/settings/devices" element={<SettingsDevices />} />
            <Route path="/settings/security" element={<SettingsSecurity />} />
            <Route path="/settings/notifications" element={<SettingsNotifications />} />
            <Route path="/admin/audit" element={<AdminAuditLog />} />
            <Route path="/sso-callback" element={<SSOCallback />} />
            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
