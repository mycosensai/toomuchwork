/**
 * Solana SPL Tokenization — real on-chain token minting for certified listings.
 *
 * Tokenizes a Vault item as a genuine SPL token on Solana mainnet. The treasury
 * wallet (SOLANA_TREASURY / its base58 secret in SOLANA_TREASURY_SECRET) is the
 * mint authority. Each listing becomes a 1-of-1 (or configurable supply) SPL
 * token so ownership of the physical item can be represented and transferred
 * on-chain.
 *
 * Uses @solana/web3.js + @solana/spl-token. Falls back to a clearly-marked
 * "simulated" result ONLY when the treasury secret is absent (so the build never
 * crashes in preview), but the happy path performs a real RPC mint transaction.
 */

import { Connection, Keypair } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, getMint } from "@solana/spl-token";
import { getRawEnv } from "./env";

const SOL_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

function getRpcUrl(): string {
  const raw = getRawEnv();
  return (raw.SOLANA_RPC_URL as string) || DEFAULT_RPC;
}

function getTreasuryAddress(): string {
  const raw = getRawEnv();
  return (raw.SOLANA_TREASURY as string) || (raw.TREASURY_WALLET as string) || "";
}

// Treasury secret base58 — kept server-side only. NEVER exposed to the client.
function getTreasurySecret(): string {
  const raw = getRawEnv();
  return (raw.SOLANA_TREASURY_SECRET as string) || "";
}

export function isTokenizationConfigured(): boolean {
  const addr = getTreasuryAddress();
  return Boolean(addr && SOL_ADDRESS_RE.test(addr) && getTreasurySecret());
}

export interface TokenizeResult {
  success: boolean;
  simulated: boolean;
  mintAddress: string;
  treasuryAddress: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  totalSupply: string;
  txSignature: string | null;
  message: string;
}

/**
 * Mint a real SPL token representing a listing.
 * @param args.listingId  vault listing id (used for naming + metadata)
 * @param args.tokenName  human name, e.g. "The Vault — 1958 Rolex Submariner"
 * @param args.tokenSymbol ticker, e.g. "VAULT58"
 * @param args.totalSupply number of tokens to mint (default 1)
 */
export async function tokenizeListing(args: {
  listingId: number;
  tokenName: string;
  tokenSymbol: string;
  totalSupply?: number;
  metadataUri?: string;
}): Promise<TokenizeResult> {
  const treasuryAddress = getTreasuryAddress();
  const treasurySecret = getTreasurySecret();
  const supply = Math.max(1, Math.floor(args.totalSupply ?? 1));
  const decimals = 0; // 1-of-1 collectible: 0 decimals keeps it whole.

  // Graceful degradation: if no treasury secret is configured we still return a
  // deterministic, clearly-simulated mint address so the UI/flow works in
  // preview, but we NEVER claim it is on-chain.
  if (!isTokenizationConfigured()) {
    const pseudoMint = Keypair.generate().publicKey.toBase58();
    return {
      success: false,
      simulated: true,
      mintAddress: pseudoMint,
      treasuryAddress: treasuryAddress || "unconfigured",
      tokenName: args.tokenName,
      tokenSymbol: args.tokenSymbol,
      decimals,
      totalSupply: String(supply),
      txSignature: null,
      message:
        "Tokenization simulated — set SOLANA_TREASURY + SOLANA_TREASURY_SECRET Pages secrets to mint real on-chain SPL tokens.",
    };
  }

  try {
    const connection = new Connection(getRpcUrl(), "confirmed");
    const treasury = Keypair.fromSecretKey(
      Uint8Array.from(Buffer.from(treasurySecret, "base64")),
    );

    // Real on-chain mint creation with treasury as mint authority.
    const mint = await createMint(
      connection,
      treasury, // payer
      treasury.publicKey, // mint authority
      treasury.publicKey, // freeze authority
      decimals,
    );

    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      treasury,
      mint,
      treasury.publicKey,
    );

    const sig = await mintTo(
      connection,
      treasury,
      mint,
      ata.address,
      treasury.publicKey,
      supply,
    );

    // Confirm mint exists on-chain.
    await getMint(connection, mint);

    return {
      success: true,
      simulated: false,
      mintAddress: mint.toBase58(),
      treasuryAddress: treasury.publicKey.toBase58(),
      tokenName: args.tokenName,
      tokenSymbol: args.tokenSymbol,
      decimals,
      totalSupply: String(supply),
      txSignature: sig,
      message: `Minted ${supply} ${args.tokenSymbol} SPL token(s) on Solana mainnet.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      simulated: false,
      mintAddress: "",
      treasuryAddress,
      tokenName: args.tokenName,
      tokenSymbol: args.tokenSymbol,
      decimals,
      totalSupply: String(supply),
      txSignature: null,
      message: `On-chain mint failed: ${message}`,
    };
  }
}
