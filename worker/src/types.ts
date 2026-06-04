// ============================================================================
// types.ts — Shared types, error envelope, and CORS helpers
// ============================================================================
/// <reference types="@cloudflare/workers-types" />

// ---------------------------------------------------------------------------
// Generic API envelope
// ---------------------------------------------------------------------------
export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiErr {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiOk<T> | ApiErr;

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}

export function err(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ApiErr {
  return { ok: false, error: { code, message, details } };
}

// ---------------------------------------------------------------------------
// CORS helper
// ---------------------------------------------------------------------------
export const CORS_HEADERS: Record<string, string> = (() => {
  const origin = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.CORS_ORIGIN ?? '*';
  const acao = origin === '*' ? '*' : origin;
  return {
    'access-control-allow-origin': acao,
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-request-id',
    'access-control-max-age': '86400',
  };
})();

export const JSON_HEADERS: Record<string, string> = {
  'content-type': 'application/json',
  ...CORS_HEADERS,
};

// ---------------------------------------------------------------------------
// Cloudflare binding types
// ---------------------------------------------------------------------------
export interface Env {
  VAULT_KV: KVNamespace;
  thevault_db: D1Database;
  CORS_ORIGIN?: string;
  JWT_SECRET?: string;
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------
export type UserRole = 'user' | 'admin' | 'ops';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  provider: 'google' | 'apple' | 'local';
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export type ListingCondition = 'mint' | 'near-mint' | 'good' | 'fair';

export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  priceCents: number;
  category: string;
  condition: ListingCondition;
  images: string[];
  status: 'draft' | 'active' | 'sold' | 'archived';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ListingCreate {
  title: string;
  description: string;
  priceCents: number;
  category: string;
  condition: ListingCondition;
  images?: string[];
  metadata?: Record<string, unknown>;
}

export interface ListingUpdate {
  title?: string;
  description?: string;
  priceCents?: number;
  category?: string;
  condition?: ListingCondition;
  images?: string[];
  status?: Listing['status'];
  metadata?: Record<string, unknown>;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';

export interface Lead {
  id: string;
  listingId: string;
  buyerId?: string;
  buyerEmail?: string;
  buyerName?: string;
  message?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LeadCreate {
  listingId: string;
  buyerEmail?: string;
  buyerName?: string;
  message?: string;
}

export interface LeadUpdate {
  status?: LeadStatus;
}

export type TokenStatus = 'pending' | 'minted' | 'transferred' | 'burned';

export interface PhysicalItem {
  serialNumber?: string;
  condition: string;
  authenticityDocs: string[];
  provenanceNotes?: string;
  photos: string[];
}

export interface MintRecord {
  id: string;
  listingId: string;
  ownerId: string;
  chainId: number;
  contractAddress: string;
  tokenId: string;
  status: TokenStatus;
  onchainUri?: string;
  offchainUri?: string;
  physicalItem: PhysicalItem;
  createdAt: string;
  updatedAt: string;
}

export type AgentType = 'outreach' | 'appraisal' | 'support' | 'ops' | 'auth';

export interface AgentJob {
  id: string;
  agent: AgentType;
  action: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
  finishedAt?: string;
}

export interface AgentExecInput {
  agent: AgentType;
  action: string;
  payload: Record<string, unknown>;
}

export type CheckoutSessionStatus = 'open' | 'complete' | 'expired' | 'canceled';

export interface CheckoutSession {
  id: string;
  listingId: string;
  buyerId?: string;
  amountCents: number;
  currency: string;
  status: CheckoutSessionStatus;
  paymentIntentId?: string;
  clientSecret?: string;
  url?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

export interface CheckoutSessionCreate {
  listingId: string;
  amountCents: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
}
