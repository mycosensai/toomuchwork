/**
 * RouteMeta — per-route <title> + meta description for the SPA.
 * The static index.html carries only the homepage title; every other route
 * needs its own document title + description for search engines (Google
 * renders client JS, so setting these on navigation is effective).
 * Titles: primary keyword first, ≤60 chars, "| The Vault DFW" suffix.
 */
import { useEffect } from 'react'
import { useLocation } from 'react-router'

interface Meta {
  title: string
  description: string
}

const META: Record<string, Meta> = {
  '/': {
    title: 'The Vault DFW | Rare & Luxury Collectibles Marketplace',
    description: 'Buy, sell, appraise, and verify rare collectibles — luxury watches, fine jewelry, rare coins, fine art, and memorabilia. AI expert verification on every listing.',
  },
  '/browse': {
    title: 'Browse Rare & Luxury Collectibles for Sale | The Vault DFW',
    description: 'Shop verified luxury watches, fine jewelry, rare coins, fine art, antiques, sports memorabilia, and precious stones — each listed with AI expert verification.',
  },
  '/appraisal': {
    title: 'AI Appraisal for Collectibles — $29 | The Vault DFW',
    description: 'Get an expert AI appraisal of your luxury collectible: value range, condition and authenticity readout, market analysis. $29 one-time, instant unlock.',
  },
  '/proverify': {
    title: 'ProVerify — Multi-Expert AI Authentication | The Vault DFW',
    description: 'Multi-expert AI verification of luxury collectibles. Authenticity, value, and condition scored 0-100 with consensus verdict. From $49.99.',
  },
  '/sell': {
    title: 'Sell Your Collectibles — List in Minutes | The Vault DFW',
    description: 'List watches, jewelry, coins, art, and memorabilia for sale. $20 one-time listing fee. AI buyer search finds interested collectors worldwide.',
  },
  '/token-gallery': {
    title: 'Token Gallery — Blockchain-Certified Collectibles | The Vault DFW',
    description: 'Browse blockchain-certified collectibles with verifiable provenance. SPL token certificates for listed luxury items.',
  },
  '/concierge': {
    title: 'AI Concierge — Find Your Next Collectible | The Vault DFW',
    description: 'Tell our AI concierge what you collect and get matched with rare luxury items from The Vault DFW marketplace.',
  },
  '/forum': {
    title: 'Collector Forum | The Vault DFW',
    description: 'Join collectors discussing watches, coins, art, antiques, and luxury collectibles in The Vault DFW forum.',
  },
  '/about': {
    title: 'About The Vault DFW | Rare Collectibles Marketplace',
    description: 'The Vault DFW is a premium marketplace for rare and luxury collectibles — AI-verified, blockchain-certified, and built for serious collectors.',
  },
  '/faq': {
    title: 'FAQ — Buying & Selling on The Vault DFW',
    description: 'Answers about buying, selling, shipping, returns, authentication, payments, and fees on The Vault DFW.',
  },
  '/support': {
    title: 'Support — Contact The Vault DFW',
    description: 'Get help with your The Vault DFW account, orders, listings, shipping, and payments. Contact ratchetkrewelabs@gmail.com.',
  },
  '/contact': {
    title: 'Contact The Vault DFW',
    description: 'Reach The Vault DFW — appraisal, consignment, partnerships, and press inquiries.',
  },
  '/terms': { title: 'Terms of Service | The Vault DFW', description: 'Terms of service for using The Vault DFW marketplace.' },
  '/privacy': { title: 'Privacy Policy | The Vault DFW', description: 'How The Vault DFW collects, uses, and protects your data.' },
  '/returns': { title: 'Returns Policy | The Vault DFW', description: '14-day returns on items not as described. The Vault DFW returns policy.' },
  '/shipping': { title: 'Shipping Policy | The Vault DFW', description: 'Insured shipping with signature confirmation. The Vault DFW shipping policy.' },
  '/auctions': { title: 'Live Auctions | The Vault DFW', description: 'Bid on rare collectibles in timed auctions with anti-sniping protection. Join the auction now.' },
  '/membership': { title: 'Vault Pro & Ranks | The Vault DFW', description: 'Unlock Vault Pro membership and climb badge tiers. Collector, Curator, Appraiser, Dealer — earn rewards as you trade.' },
  '/notifications': { title: 'Notifications | The Vault DFW', description: 'Your notification center. Offers, alerts, bids, and payouts — all in one inbox.' },
  '/alerts': { title: 'Price Alerts | The Vault DFW', description: 'Set price-drop and price-rise alerts. Get notified when your watched items move.' },
  '/searches': { title: 'Saved Searches | The Vault DFW', description: 'Save searches and get digest results. Never miss a rare find again.' },
  '/curated': { title: 'Curated Collections | The Vault DFW', description: 'Vault Picks — handpicked collections from top collectors and editors.' },
  '/blog': { title: 'The Vault Journal | The Vault DFW', description: 'Expert insights, market analysis, and collector stories from the editorial team.' },
  '/showcases': { title: 'Collector Showcases | The Vault DFW', description: 'Browse and create collector showcase pages. Display your rare collection.' },
  '/badges': { title: 'Ranks & Badges | The Vault DFW', description: 'Track your rank progress, unlock badges, and climb the seller leaderboard.' },
  '/ai': { title: 'AI Assistant | The Vault DFW', description: 'Ask the AI about the marketplace, pricing, and strategy. AI-powered recommendations.' },
  '/forgot-password': { title: 'Forgot Password | The Vault DFW', description: 'Reset your password.' },
  '/settings/devices': { title: 'Sessions | The Vault DFW', description: 'Manage your active sessions and logged-in devices.' },
  '/settings/security': { title: 'Security | The Vault DFW', description: 'Two-factor authentication, backup codes, and security settings.' },
  '/settings/notifications': { title: 'Notifications | The Vault DFW', description: 'Manage notification preferences.' },
  '/admin/audit': { title: 'Audit Log | The Vault DFW', description: 'Admin audit log.' },
}

const DEFAULT_META: Meta = {
  title: 'The Vault DFW | Rare & Luxury Collectibles Marketplace',
  description: 'Buy, sell, appraise, and verify rare collectibles — luxury watches, fine jewelry, rare coins, fine art, and memorabilia.',
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Match exact or longest prefix (e.g. /proverify/:id, /listing/:id)
    const meta = META[pathname] || Object.entries(META)
      .filter(([p]) => p !== '/' && pathname.startsWith(p + '/'))
      .sort(([a], [b]) => b.length - a.length)[0]?.[1] || DEFAULT_META

    document.title = meta.title
    setMeta('description', meta.description)
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', meta.title)
    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', meta.description)
  }, [pathname])

  return null
}
