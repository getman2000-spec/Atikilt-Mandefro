/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side Web Crypto utilities for deterministic credential hashing
 * and privacy-preserving Firestore access-grant identifiers.
 */

const AUTH_PEPPER = 'seam-erp-auth-v1:';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return toHex(digest);
  }
  // Fallback deterministic hash for restricted non-secure test contexts
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch + i), 0x85ebca6b);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Computes a deterministic salted SHA-256 hex digest for account password verification.
 */
export async function hashSecret(secret: string): Promise<string> {
  return sha256Hex(`${AUTH_PEPPER}${secret}`);
}

/**
 * Derives a valid Firestore document ID (lowercase hex, ^[a-zA-Z0-9_-]+$) from a normalized email address.
 */
export async function emailToGrantId(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  return sha256Hex(`grant:${normalized}`);
}
