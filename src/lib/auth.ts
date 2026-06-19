/**
 * Shared-password gate. No per-user identity — one family password.
 * The session cookie holds an HMAC token derived from AUTH_SECRET, so it
 * can't be forged without the secret. Works in both edge middleware and node.
 */
export const SESSION_COOKIE = "conq_session";

const enc = new TextEncoder();

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Hash a password with the AUTH_SECRET as salt (sha256 hex). */
export async function hashPassword(secret: string, password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`${secret}:${password}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Deterministic session token for the current AUTH_SECRET. */
export async function sessionToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("conqueror-session-v1"));
  return base64url(sig);
}

/** Constant-time-ish comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
