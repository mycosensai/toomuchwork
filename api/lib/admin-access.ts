/**
 * Admin privilege is a server-side allowlist on users.email.
 *
 * Production accounts:
 *   id 1 dakotavanalstyne318@gmail.com
 *   id 2 ratchetkrewelabs@gmail.com
 * Both have an empty clerk_email. Privilege never reads clerk_email.
 *
 * Sign-up cannot grant admin. An allowlisted email is an admin only when
 * the row was explicitly provisioned (role = admin) or the mailbox was
 * verified through the email-token flow (email_verified = 1).
 */

export const CANONICAL_ADMIN_EMAILS = [
  "ratchetkrewelabs@gmail.com",
  "dakotavanalstyne318@gmail.com",
] as const;

export type AdminSubject = {
  email?: string | null;
  role?: string | null;
  email_verified?: number | boolean | null;
  clerk_email?: string | null;
  clerkEmail?: string | null;
};

export function normalizeAccountEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export function isCanonicalAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeAccountEmail(email);
  return (CANONICAL_ADMIN_EMAILS as readonly string[]).includes(normalized);
}

export function isEmailVerifiedFlag(user: AdminSubject | null | undefined): boolean {
  const value = user?.email_verified;
  return value === 1 || value === true;
}

/**
 * True only for the two owner mailboxes on users.email.
 * clerk_email is ignored even when it is empty or populated.
 * Unverified sign-ups stay false because registration persists role=user
 * and email_verified=0.
 */
export function isProvisionedAdmin(user: AdminSubject | null | undefined): boolean {
  if (!user) return false;
  if (!isCanonicalAdminEmail(user.email)) return false;
  if (isEmailVerifiedFlag(user)) return true;
  return user.role === "admin";
}

export function publicRole(user: AdminSubject | null | undefined): "admin" | "user" {
  return isProvisionedAdmin(user) ? "admin" : "user";
}
