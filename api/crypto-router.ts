import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { cryptoPayments, listings } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP, assertSensitiveLimit } from "./security";
import { getRawEnv } from "./lib/env";
import { getFreshSolUsd } from "./lib/sol-price";
import { solTransferMatches, splTransferMatches, treasuryTokenAccount } from "./lib/spl-transfer";
import {
  LAMPORTS_PER_SOL
} from "@solana/web3.js";

// ─── Constants ───
const _LAMPORTS_PER_SOL_BN = BigInt(LAMPORTS_PER_SOL);
const SOLANA_MAINNET_RPC = "https://api.mainnet-beta.solana.com";
const SOL_SIGNATURE_RE = /^[1-9A-HJ-NP-Za-km-z]{43,88}$/;
const SOL_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// USDC mint address on Solana mainnet
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Supported currencies with their configurations
type SupportedCurrency = "SOL" | "USDC";

interface CurrencyConfig {
  symbol: string;
  name: string;
  decimals: number;
  isToken: boolean;
  mintAddress?: string;
}

const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  SOL: { symbol: "SOL", name: "Solana", decimals: 9, isToken: false },
  USDC: { symbol: "USDC", name: "USD Coin", decimals: 6, isToken: true, mintAddress: USDC_MINT },
};

// ─── RPC Types ───
type RpcResponse<T> = {
  jsonrpc: "2.0";
  result?: T;
  error?: { code: number; message: string };
};

type ParsedInstruction = {
  program?: string;
  parsed?: { type?: string; info?: Record<string, unknown> };
};

type ParsedSolanaTransaction = {
  slot?: number;
  blockTime?: number | null;
  meta?: { err?: unknown; fee?: number; preTokenBalances?: unknown[]; postTokenBalances?: unknown[]; innerInstructions?: Array<{ instructions?: ParsedInstruction[] }> } | null;
  transaction?: {
    message?: {
      accountKeys?: Array<{ pubkey?: string; signer?: boolean; writable?: boolean }>;
      instructions?: ParsedInstruction[];
    };
  };
};

// ─── Treasury Wallet Management ───
function getRuntimeValue(name: string): string {
  const rawEnv = getRawEnv();
  const mapping: Record<string, string> = {
    SOLANA_TREASURY: (rawEnv.SOLANA_TREASURY as string) || "",
    TREASURY_WALLET: (rawEnv.TREASURY_WALLET as string) || "",
    SOLANA_RPC_URL: (rawEnv.SOLANA_RPC_URL as string) || "",
    SOL_USD_RATE: (rawEnv.SOL_USD_RATE as string) || "",
    USDC_USD_RATE: (rawEnv.USDC_USD_RATE as string) || "1.00",
  };
  return mapping[name] || "";
}

function getTreasuryAddress(): string {
  return getRuntimeValue("SOLANA_TREASURY") || getRuntimeValue("TREASURY_WALLET");
}

function getRpcUrl(): string {
  return getRuntimeValue("SOLANA_RPC_URL") || SOLANA_MAINNET_RPC;
}

function getTokenRate(currency: SupportedCurrency): number {
  switch (currency) {
    case "SOL": {
      const configured = Number(getRuntimeValue("SOL_USD_RATE"));
      return Number.isFinite(configured) && configured > 0 ? configured : 0;
    }
    case "USDC": {
      const configured = Number(getRuntimeValue("USDC_USD_RATE"));
      return Number.isFinite(configured) && configured > 0 ? configured : 1.0;
    }
    default:
      return 0;
  }
}

function assertCryptoConfigured(currency: SupportedCurrency) {
  const treasury = getTreasuryAddress();
  const rate = getTokenRate(currency);

  if (!treasury || !SOL_ADDRESS_RE.test(treasury)) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Crypto payments require SOLANA_TREASURY to be configured with a valid Solana address.",
    });
  }

  if (currency === "USDC" && !rate) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "USDC rate is not configured.",
    });
  }
}

// ─── RPC Helpers ───
async function callSolanaRpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(getRpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params }),
  });

  if (!response.ok) {
    throw new Error(`Solana RPC HTTP ${response.status}`);
  }

  const payload = (await response.json()) as RpcResponse<T>;
  if (payload.error) {
    throw new Error(`Solana RPC error ${payload.error.code}: ${payload.error.message}`);
  }

  return payload.result as T;
}

function _readLamports(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// ─── Payment Verification ───
function instructionList(tx: ParsedSolanaTransaction): ParsedInstruction[] {
  const outer = tx.transaction?.message?.instructions || [];
  const inner = (tx.meta?.innerInstructions || []).flatMap((group) => group.instructions || []);
  return [...outer, ...inner];
}

async function verifySolanaPayment(input: {
  txHash: string;
  buyerAddress: string;
  expectedDestination: string;
  expectedAmount: number;
  currency: SupportedCurrency;
}): Promise<{ valid: boolean; confirmations: number; reason: string }> {
  const config = CURRENCY_CONFIGS[input.currency];

  if (!SOL_SIGNATURE_RE.test(input.txHash)) {
    return { valid: false, confirmations: 0, reason: "Invalid Solana transaction signature format" };
  }

  if (!SOL_ADDRESS_RE.test(input.expectedDestination)) {
    return { valid: false, confirmations: 0, reason: "Invalid destination wallet configuration" };
  }

  const tx = await callSolanaRpc<ParsedSolanaTransaction | null>("getTransaction", [
    input.txHash,
    { encoding: "jsonParsed", commitment: "finalized", maxSupportedTransactionVersion: 0 },
  ]);

  if (!tx) {
    return { valid: false, confirmations: 0, reason: "Transaction not found or not finalized on Solana" };
  }

  if (tx.meta?.err) {
    return { valid: false, confirmations: 0, reason: "Transaction failed on-chain" };
  }

  let transferFound = false;

  const instructions = instructionList(tx);
  if (config.isToken) {
    const rawAmount = Math.floor(input.expectedAmount * Math.pow(10, config.decimals));
    const tokenAccount = treasuryTokenAccount(config.mintAddress!, input.expectedDestination);
    transferFound = instructions.some((instruction) => splTransferMatches(instruction, {
      buyer: input.buyerAddress,
      treasuryTokenAccount: tokenAccount,
      mint: config.mintAddress!,
      rawAmount,
    }));
  } else {
    const expectedLamports = Math.ceil(input.expectedAmount * LAMPORTS_PER_SOL);
    transferFound = instructions.some((instruction) => solTransferMatches(instruction, {
      buyer: input.buyerAddress,
      treasuryWallet: input.expectedDestination,
      lamports: expectedLamports,
    }));
  }

  if (!transferFound) {
    return {
      valid: false,
      confirmations: 0,
      reason: `No finalized ${config.symbol} transfer to the treasury wallet was found for the required amount. Verify the transaction on Solscan.`,
    };
  }

  return {
    valid: true,
    confirmations: 1,
    reason: `Finalized ${config.symbol} payment verified by Solana RPC`,
  };
}

// ─── Router ───
export const cryptoRouter = createRouter({
  createPayment: authedQuery
    .input(
      z.object({
        listingId: z.number(),
        buyerAddress: z.string().regex(SOL_ADDRESS_RE, "Invalid Solana wallet address"),
        currency: z.enum(["SOL", "USDC"]).default("SOL"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertSensitiveLimit(ctx.req, "checkout");
      assertCryptoConfigured(input.currency);

      const db = getDb();
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);

      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.status === "sold") throw new TRPCError({ code: "BAD_REQUEST", message: "Item already sold" });

      const config = CURRENCY_CONFIGS[input.currency];
      const amountUsd = Number(listing.price);
      const quoteExpiresAt = Date.now() + 15 * 60 * 1000;
      let tokenRate = getTokenRate(input.currency);
      if (input.currency === "SOL") {
        const quote = await getFreshSolUsd();
        tokenRate = quote.usd;
      }
      const amountToken = amountUsd / tokenRate;
      const treasury = getTreasuryAddress();

      const decimals = config.decimals;
      const formattedAmount = amountToken.toFixed(decimals);

      const result = await db.insert(cryptoPayments).values({
        listingId: input.listingId,
        buyerAddress: input.buyerAddress,
        sellerAddress: treasury,
        amount: formattedAmount,
        amountUsd: amountUsd.toFixed(2),
        currency: config.symbol,
        network: `solana_mainnet_${config.symbol.toLowerCase()}`,
        status: "pending",
        confirmations: 0,
        metadata: JSON.stringify({
          listingTitle: listing.title,
          tokenRate,
          treasury,
          currencyConfig: config,
          initiatedBy: ctx.user?.id,
          quoteExpiresAt,
        }),
      });

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "crypto.createPayment",
        userId: ctx.user?.id,
        action: `crypto_payment_created_${config.symbol.toLowerCase()}`,
        details: `listing:${listing.id} treasury:${treasury.slice(0, 8)}...`,
      });

      return {
        success: true,
        paymentId: Number(result.meta.last_row_id),
        treasuryAddress: treasury,
        amount: formattedAmount,
        amountUsd: amountUsd.toFixed(2),
        currency: config.symbol,
        decimals,
        network: "solana_mainnet",
        tokenRate,
        instructions: config.isToken
          ? `Send exactly ${formattedAmount} ${config.symbol} (SPL Token) to the treasury wallet. Token mint: ${config.mintAddress}`
          : `Send exactly ${formattedAmount} ${config.symbol} to the treasury wallet.`,
        explorerUrl: `https://solscan.io/account/${treasury}`,
      };
    }),

  submitTx: authedQuery
    .input(
      z.object({
        paymentId: z.number(),
        txHash: z.string().regex(SOL_SIGNATURE_RE, "Invalid Solana transaction signature"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [payment] = await db
        .select()
        .from(cryptoPayments)
        .where(eq(cryptoPayments.id, input.paymentId))
        .limit(1);

      if (!payment) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
      if (payment.status === "confirmed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already confirmed" });
      }
      if (payment.txHash && payment.txHash !== input.txHash) {
        throw new TRPCError({ code: "CONFLICT", message: "A different transaction is already attached" });
      }
      const meta = payment.metadata ? JSON.parse(payment.metadata) as { initiatedBy?: number; quoteExpiresAt?: number } : {};
      if (!ctx.user || meta.initiatedBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This payment was started by a different account" });
      }
      if (!meta.quoteExpiresAt || Date.now() > meta.quoteExpiresAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "The price quote expired. Start checkout again." });
      }
      const [used] = await db.select().from(cryptoPayments).where(eq(cryptoPayments.txHash, input.txHash)).limit(1);
      if (used && used.id !== payment.id) {
        throw new TRPCError({ code: "CONFLICT", message: "That transaction is already attributed" });
      }

      const destination = payment.sellerAddress || getTreasuryAddress();
      const amount = Number(payment.amount);
      const currency = (payment.currency as SupportedCurrency) || "SOL";

      assertCryptoConfigured(currency);

      const verification = await verifySolanaPayment({
        txHash: input.txHash,
        buyerAddress: payment.buyerAddress,
        expectedDestination: destination,
        expectedAmount: amount,
        currency,
      });

      if (!verification.valid) {
        await db
          .update(cryptoPayments)
          .set({ txHash: input.txHash, status: "verification_failed", confirmations: 0 })
          .where(eq(cryptoPayments.id, input.paymentId));

        throw new TRPCError({ code: "BAD_REQUEST", message: verification.reason });
      }

      await db
        .update(cryptoPayments)
        .set({
          txHash: input.txHash,
          status: "confirmed",
          confirmations: verification.confirmations,
          metadata: JSON.stringify({
            ...(payment.metadata ? JSON.parse(payment.metadata) : {}),
            verification,
            verifiedAt: Date.now(),
          }),
        })
        .where(eq(cryptoPayments.id, input.paymentId));

      // Mark listing as sold
      await db.update(listings).set({ status: "sold" }).where(eq(listings.id, payment.listingId));

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "crypto.submitTx",
        userId: ctx.user?.id,
        action: `crypto_payment_verified_${currency.toLowerCase()}`,
        details: `payment:${input.paymentId} tx:${input.txHash.slice(0, 16)}...`,
      });

      return {
        success: true,
        status: "confirmed",
        currency,
        message: `Finalized ${currency} payment verified on Solana. Listing marked as sold.`,
        explorerUrl: `https://solscan.io/tx/${input.txHash}`,
        verification,
      };
    }),

  getStatus: publicQuery
    .input(z.object({ paymentId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [p] = await db
        .select()
        .from(cryptoPayments)
        .where(eq(cryptoPayments.id, input.paymentId))
        .limit(1);
      return p || null;
    }),

  getRates: publicQuery.query(async () => {
    const usdcRate = getTokenRate("USDC");
    const treasury = getTreasuryAddress();
    const hasTreasury = Boolean(treasury && SOL_ADDRESS_RE.test(treasury));
    let solQuote: { usd: number; fetchedAt: number; source: string } | null = null;
    let solError: string | null = null;
    try {
      solQuote = await getFreshSolUsd();
    } catch (error) {
      solError = error instanceof Error ? error.message : "SOL quote unavailable";
    }

    return {
      enabled: hasTreasury && Boolean(solQuote),
      treasuryConfigured: hasTreasury,
      treasuryAddress: hasTreasury ? treasury : null,
      solAvailable: Boolean(solQuote),
      usdcAvailable: usdcRate > 0,
      quoteAgeMs: solQuote ? Date.now() - solQuote.fetchedAt : null,
      quoteSource: solQuote?.source ?? null,
      solError,
      rates: {
        SOL: solQuote?.usd ?? null,
        USDC: usdcRate,
      },
      supportedCurrencies: ["SOL", "USDC"] as SupportedCurrency[],
      timestamp: Date.now(),
      explorerUrl: hasTreasury ? `https://solscan.io/account/${treasury}` : null,
    };
  }),

  listByUser: publicQuery
    .input(
      z.object({ address: z.string().optional() }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      if (!input?.address) return [];
      return db
        .select()
        .from(cryptoPayments)
        .where(eq(cryptoPayments.buyerAddress, input.address))
        .orderBy(desc(cryptoPayments.createdAt))
        .limit(50);
    }),

  getTreasuryInfo: publicQuery.query(() => {
    const treasury = getTreasuryAddress();
    const hasTreasury = Boolean(treasury && SOL_ADDRESS_RE.test(treasury));

    return {
      configured: hasTreasury,
      address: hasTreasury ? treasury : null,
      network: "solana_mainnet",
      supportedCurrencies: Object.entries(CURRENCY_CONFIGS).map(([_key, config]) => ({
        symbol: config.symbol,
        name: config.name,
        decimals: config.decimals,
        isToken: config.isToken,
        mintAddress: config.mintAddress || null,
      })),
      explorerUrl: hasTreasury ? `https://solscan.io/account/${treasury}` : null,
    };
  }),
});