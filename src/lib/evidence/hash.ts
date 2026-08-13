/**
 * Client-side evidence hashing. R13: a hash is computed for EVERY submission,
 * regardless of storage mode — `external_reference` (default) or `stored`. The
 * old "Hash Only" storage MODE no longer exists (removed in spec v6 §5d); a
 * hash is now a property every piece of evidence has, not a third mode.
 * On-chain commitment is explicitly deferred (v1.7 §14). See docs/MODEL.md.
 *
 * SHA-256 via Web Crypto (same primitive as src/lib/crypto/email.ts). Returns a
 * lowercase hex digest.
 */

export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
