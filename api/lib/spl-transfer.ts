import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

export type ParsedInstruction = {
  program?: string;
  parsed?: {
    type?: string;
    info?: Record<string, unknown>;
  };
};

export function treasuryTokenAccount(mint: string, treasuryWallet: string): string {
  return getAssociatedTokenAddressSync(
    new PublicKey(mint),
    new PublicKey(treasuryWallet),
    true,
  ).toBase58();
}

function amountOf(info: Record<string, unknown>): number {
  const tokenAmount = info.tokenAmount as { amount?: string | number } | undefined;
  const raw = tokenAmount?.amount ?? info.amount ?? 0;
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : 0;
}

function authorityOf(info: Record<string, unknown>): string {
  return String(info.authority || info.multisigAuthority || "");
}

/**
 * Accept canonical SPL `transfer` (token accounts, no mint field) and
 * `transferChecked` (mint + tokenAmount). Destination must be the treasury
 * token account. Authority must be the buyer wallet.
 */
export function splTransferMatches(
  instruction: ParsedInstruction,
  expected: { buyer: string; treasuryTokenAccount: string; mint: string; rawAmount: number },
): boolean {
  if (instruction.program !== "spl-token") return false;
  const type = instruction.parsed?.type;
  const info = instruction.parsed?.info ?? {};
  if (authorityOf(info) !== expected.buyer) return false;
  if (String(info.destination || "") !== expected.treasuryTokenAccount) return false;
  if (amountOf(info) < expected.rawAmount) return false;
  if (type === "transferChecked") {
    return String(info.mint || "") === expected.mint;
  }
  if (type === "transfer") {
    return true;
  }
  return false;
}

export function solTransferMatches(
  instruction: ParsedInstruction,
  expected: { buyer: string; treasuryWallet: string; lamports: number },
): boolean {
  if (instruction.program !== "system") return false;
  if (instruction.parsed?.type !== "transfer") return false;
  const info = instruction.parsed.info ?? {};
  const lamports = Number(info.lamports ?? 0);
  return (
    String(info.source || "") === expected.buyer &&
    String(info.destination || "") === expected.treasuryWallet &&
    Number.isFinite(lamports) &&
    lamports >= expected.lamports
  );
}
