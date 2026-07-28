/**
 * Client-side evidence hashing for the "Hash Only" storage mode (handover v1.6,
 * R10 / 260707 §7): for NDA/confidential work the raw file NEVER leaves the
 * browser — only this hash is kept and (in the real build) sent to the
 * verification layer as proof of integrity.
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
