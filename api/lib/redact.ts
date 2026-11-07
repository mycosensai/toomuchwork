/** Remove a secret from a message before it can be returned or logged. */
export function redactSecret(message: string, secret: string | null | undefined): string {
  if (!secret) return message;
  return message.split(secret).join("[redacted]");
}

/** Vite-exposed Stripe key. Publishable pk_ keys only. */
export function publicPublishableKey(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed.startsWith("pk_")) return "";
  if (trimmed.startsWith("sk_") || trimmed.startsWith("rk_") || trimmed.toLowerCase().includes("secret")) return "";
  return trimmed;
}
