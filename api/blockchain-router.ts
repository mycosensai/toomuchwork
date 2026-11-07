import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { listings, chainCerts, chainTokenMints } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { logAudit, getClientIP } from "./security";
import { notifyTelegram } from "./lib/telegram";
import { TRPCError } from "@trpc/server";

import { tokenizeListing, isTokenizationConfigured } from "./lib/solana-token";
import {
  tokenizeMultiChain,
  getSupportedChains,
  isChainConfigured,
  CHAINS,
  type ChainKey,
} from "./lib/multichain-token";
import { getRawEnv } from "./lib/env";
import { isProvisionedAdmin } from "./lib/admin-access";
import {
  Keypair,
} from "@solana/web3.js";

// ─── Helpers ────────────────────────────────────────────────

function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

function isValidEthAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

function _resolveTreasury(chainKey: string): string {
  if (chainKey === "solana") {
    return (getRawEnv().SOLANA_TREASURY as string) || (getRawEnv().TREASURY_WALLET as string) || "";
  }
  return "";
}

// ─── Router ──────────────────────────────────────────────────

export const blockchainRouter = createRouter({
  // ── certify (cert of authenticity, all chains) ──
  certify: authedQuery
    .input(
      z.object({
        listingId: z.number(),
        itemName: z.string().min(1).max(500),
        itemDescription: z.string().max(5000).optional(),
        walletAddress: z.string().min(1),
        chainKey: z.enum(["solana", "ethereum", "base", "arbitrum", "polygon", "optimism", "bsc", "avalanche"]).default("ethereum"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { listingId, walletAddress, chainKey } = input;

      // Validate wallet address for the chain
      if (chainKey === "solana" && !isValidSolanaAddress(walletAddress)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid Solana wallet address" });
      }
      if (chainKey !== "solana" && !isValidEthAddress(walletAddress)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid EVM wallet address (expected 0x...)" });
      }

      // Check existing cert for this chain
      const [existing] = await db.select().from(chainCerts)
        .where(eq(chainCerts.listingId, listingId)).limit(1);
      if (existing) return { success: false, error: "Item already certified", cert: existing };

      const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.sellerId !== ctx.user?.id && !isProvisionedAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can attest this listing" });
      }

      const ts = Date.now();
      const certHashData = new TextEncoder().encode(`${listingId}:${input.itemName}:${ts}:thevaultdfw:offchain`);
      const certHashBuf = await crypto.subtle.digest("SHA-256", certHashData);
      const certHash = "0x" + Array.from(new Uint8Array(certHashBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

      const result = await db.insert(chainCerts).values({
        listingId,
        userId: ctx.user?.id || null,
        certificateHash: certHash,
        contractAddress: null,
        tokenId: null,
        blockHash: null,
        blockNumber: null,
        network: "offchain",
        chainKey,
        itemName: input.itemName,
        itemDescription: input.itemDescription || null,
        metadataUri: `https://thevaultdfw.win/certificate/${listingId}`,
        status: "offchain_attestation",
        certificationFee: "0",
      });

      const certId = Number(result.meta.last_row_id);

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "blockchain.certify",
        userId: ctx.user?.id,
        action: `item_certified_${chainKey}`,
        details: `listing:${listingId} cert:${certId} chain:${chainKey} hash:${certHash.slice(0, 10)}`,
      });

      return {
        success: true,
        cert: {
          id: certId,
          certificateHash: certHash,
          contractAddress: null,
          tokenId: null,
          blockHash: null,
          blockNumber: null,
          network: "offchain",
          chainKey,
          status: "offchain_attestation",
          itemName: input.itemName,
          metadataUri: `https://thevaultdfw.win/certificate/${listingId}`,
        },
        message: "Off-chain attestation recorded. This is not an on-chain mint or a blockchain certificate.",
        verification: {
          publicKey: null,
          canVerify: false,
          instructions: "This record is an off-chain attestation. It is not a confirmed chain transaction.",
        },
      };
    }),

  // ── tokenize (on-chain mint, all chains) ──
  tokenize: authedQuery
    .input(
      z.object({
        listingId: z.number(),
        tokenName: z.string().min(1).max(64),
        tokenSymbol: z.string().min(1).max(10).regex(/^[A-Za-z0-9]+$/),
        totalSupply: z.number().int().min(1).max(1_000_000).default(1),
        metadataUri: z.string().url().optional(),
        chainKey: z.enum(["solana", "ethereum", "base", "arbitrum", "polygon", "optimism", "bsc", "avalanche"]).default("ethereum"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { listingId, chainKey } = input;

      // Must be certified
      const [cert] = await db.select().from(chainCerts)
        .where(eq(chainCerts.listingId, listingId)).limit(1);
      if (!cert) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Listing must be certified before tokenization." });
      }

      const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.sellerId !== ctx.user?.id && !isProvisionedAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can tokenize this listing" });
      }

      // Check already tokenized
      const [existing] = await db.select().from(chainTokenMints)
        .where(eq(chainTokenMints.listingId, listingId)).limit(1);
      if (existing) {
        return { success: false, alreadyTokenized: true, mint: existing };
      }

      // Solana uses the legacy solana-token.ts path
      let result;
      if (chainKey === "solana") {
        const solResult = await tokenizeListing({
          listingId,
          tokenName: input.tokenName,
          tokenSymbol: input.tokenSymbol,
          totalSupply: input.totalSupply,
          metadataUri: input.metadataUri,
        });
        result = {
          ...solResult,
          chain: "solana",
          chainName: "Solana",
          explorerUrl: `https://solscan.io/token/${solResult.mintAddress}`,
        };
      } else {
        result = await tokenizeMultiChain(chainKey, {
          listingId,
          tokenName: input.tokenName,
          tokenSymbol: input.tokenSymbol,
          totalSupply: input.totalSupply,
          metadataUri: input.metadataUri,
        });
      }

      if (!result.success || result.simulated) {
        return {
          success: false,
          simulated: Boolean(result.simulated),
          message: result.message || "Tokenization did not produce a confirmed chain transaction",
        };
      }

      const inserted = await db.insert(chainTokenMints).values({
        listingId,
        certId: cert.id,
        mintAddress: result.mintAddress,
        treasuryAddress: result.treasuryAddress,
        tokenName: result.tokenName,
        tokenSymbol: result.tokenSymbol,
        decimals: result.decimals,
        totalSupply: result.totalSupply,
        metadataUri: input.metadataUri || null,
        txSignature: result.txSignature,
        chainKey,
        status: result.simulated ? "simulated" : "minted",
      });

      const mintId = Number(inserted.meta.last_row_id);

      await db.update(listings).set({ tokenContractAddress: result.mintAddress }).where(eq(listings.id, listingId));

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "blockchain.tokenize",
        userId: ctx.user?.id,
        action: result.simulated ? `item_tokenized_simulated_${chainKey}` : `item_tokenized_${chainKey}`,
        details: `listing:${listingId} mint:${result.mintAddress.slice(0, 8)}... chain:${chainKey} onchain:${!result.simulated}`,
      });

      await notifyTelegram(result.simulated ? "🧪 TOKEN SIMULATED" : "🪙 TOKEN MINTED", {
        "Listing": listing.title,
        "Symbol": `${result.tokenSymbol} (${result.tokenName})`,
        "Chain": result.chainName || chainKey,
        "Mint": `${result.mintAddress.slice(0, 10)}...${result.mintAddress.slice(-6)}`,
        "Status": result.simulated ? "simulated" : "on-chain",
      });

      return {
        success: result.success,
        simulated: result.simulated,
        mint: {
          id: mintId,
          mintAddress: result.mintAddress,
          tokenName: result.tokenName,
          tokenSymbol: result.tokenSymbol,
          totalSupply: result.totalSupply,
          txSignature: result.txSignature,
          status: result.simulated ? "simulated" : "minted",
          chainKey: result.chain,
          explorerUrl: result.explorerUrl,
        },
        message: result.message,
        explorerUrl: result.explorerUrl,
      };
    }),

  // ── verify certificate ──
  verify: publicQuery
    .input(z.object({ certificateHash: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [c] = await db.select().from(chainCerts).where(eq(chainCerts.certificateHash, input.certificateHash)).limit(1);
      if (!c) return { valid: false, message: "Certificate not found in Vault records" };
      const chainConfig = CHAINS[c.chainKey] || CHAINS.ethereum;
      return {
        valid: c.status === "minted",
        cert: {
          id: c.id,
          contractAddress: c.contractAddress,
          tokenId: c.tokenId,
          blockHash: c.blockHash,
          blockNumber: c.blockNumber,
          itemName: c.itemName,
          status: c.status,
          chainKey: c.chainKey,
        },
        message: c.status === "minted"
          ? `On-chain certificate recorded for ${chainConfig.name}`
          : "This record is an off-chain attestation, not a confirmed chain certificate",
        network: c.chainKey === "solana" ? "solana" : `${c.chainKey}_mainnet`,
        verificationSteps: [
          "1. Certificate hash is SHA-256 derived from listing data",
          `2. Contract address is a real keypair on ${chainConfig.name}`,
          `3. Full on-chain verification available via ${chainConfig.explorerUrl}`,
        ],
      };
    }),

  // ── get cert by listing ──
  getByListing: publicQuery
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [c] = await db.select().from(chainCerts).where(eq(chainCerts.listingId, input.listingId)).limit(1);
      if (!c) return null;
      const chainConfig = CHAINS[c.chainKey] || CHAINS.ethereum;
      return {
        ...c,
        network: c.chainKey === "solana" ? "solana" : `${c.chainKey}_mainnet`,
        verificationUrl: `https://thevaultdfw.win/certificate/${c.listingId}`,
        explorerUrl: `${chainConfig.explorerUrl}/address/${c.contractAddress}`,
      };
    }),

  // ── list mints ──
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(chainCerts).orderBy(desc(chainCerts.createdAt)).limit(50);
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [cert] = await db.select().from(chainCerts).where(eq(chainCerts.id, input.id)).limit(1);
      return cert ?? null;
    }),

  listTokens: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(chainTokenMints).orderBy(desc(chainTokenMints.createdAt)).limit(50);
  }),

  // ── status ──
  tokenizationStatus: publicQuery.query(() => {
    const treasury = getRawEnv().SOLANA_TREASURY || getRawEnv().TREASURY_WALLET || "";
    const configured = isTokenizationConfigured();
    const chains = getSupportedChains();
    return {
      configured,
      treasuryConfigured: configured,
      treasuryAddress: treasury || null,
      chains,
      supportedChains: Object.keys(CHAINS),
      explorerUrl: treasury ? `https://solscan.io/account/${treasury}` : null,
    };
  }),
});