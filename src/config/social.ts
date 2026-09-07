/**
 * Centralized Social Media Configuration — toomuchwork staging
 * Mirrors thevaultprod/src/config/social.ts — keep in sync
 */
export const SOCIAL_LINKS = {
  x: { label: "X (Twitter)", handle: "@thevaultdfw", url: "https://x.com/thevaultdfw", enabled: true },
  instagram: { label: "Instagram", handle: "@thevaultdfw", url: "https://instagram.com/thevaultdfw", enabled: true },
  email: { label: "Email", handle: "ratchetkrewelabs@gmail.com", url: "mailto:ratchetkrewelabs@gmail.com", enabled: true },
  facebook: { label: "Facebook", handle: "", url: "https://facebook.com/thevaultdfw", enabled: false },
  tiktok: { label: "TikTok", handle: "", url: "https://tiktok.com/@thevaultdfw", enabled: false },
  youtube: { label: "YouTube", handle: "", url: "https://youtube.com/@thevaultdfw", enabled: false },
  linkedin: { label: "LinkedIn", handle: "", url: "https://linkedin.com/company/thevaultdfw", enabled: false },
  pinterest: { label: "Pinterest", handle: "", url: "https://pinterest.com/thevaultdfw", enabled: false },
} as const;
export const CONTACT = { email: "ratchetkrewelabs@gmail.com", supportEmail: "ratchetkrewelabs@gmail.com", domain: "https://thevaultdfw.win", displayDomain: "thevaultdfw.win" } as const;
export const ACTIVE_SOCIALS = Object.entries(SOCIAL_LINKS).filter(([, v]) => v.enabled).map(([k, v]) => ({ key: k, ...v }));
export const SAME_AS = ACTIVE_SOCIALS.map((s) => s.url);
export function buildShareUrls(listing: { id: number; title: string }) {
  const url = `${CONTACT.domain}/listing/${listing.id}`;
  const text = `${listing.title} — on The Vault DFW`;
  return {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
    email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
    copyUrl: url,
  };
}
