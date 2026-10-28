/**
 * TriageSync 2.0: Ed25519 QR Payload Signer and Verifier
 * Architecture Section 3: Offline-verifiable compact cryptographic signatures
 */

import nacl from 'tweetnacl';
import { CriticalMedPassPayload } from '@/lib/types/database';
import { CriticalPayloadSchema } from '@/lib/validations/schemas';

// Default public key for demo/offline verification if env variable is not set
export const DEFAULT_PUBLIC_KEY_HEX =
  process.env.NEXT_PUBLIC_MEDPASS_SIGNING_PUBLIC_KEY ||
  '0560d67faae74b01da044cd20488cf0e8dccecabd2e01e629645e7210786fcb1';

export const DEFAULT_PRIVATE_KEY_HEX =
  process.env.MEDPASS_SIGNING_PRIVATE_KEY ||
  'e1ab388b8a1720b0981d7f732bac098f9fd747e62925a7db8c42289cd828a5390560d67faae74b01da044cd20488cf0e8dccecabd2e01e629645e7210786fcb1';

/**
 * Convert Hex string to Uint8Array safely without `any`
 */
export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.trim().replace(/^0x/, '');
  if (cleanHex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const array = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    array[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return array;
}

/**
 * Convert Uint8Array to Hex string safely
 */
export function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Base64Url encoder/decoder for URL hash fragment storage
 */
export function toBase64Url(str: string): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window
      .btoa(unescape(encodeURIComponent(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  return Buffer.from(str, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function fromBase64Url(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(escape(window.atob(b64)));
  }
  return Buffer.from(b64, 'base64').toString('utf-8');
}

/**
 * Sign a compact critical payload using Ed25519
 * Returns: { payloadJson, signatureHex, hashFragment }
 */
export function signCriticalPayload(
  payload: CriticalMedPassPayload,
  privateKeyHex: string = DEFAULT_PRIVATE_KEY_HEX
): {
  payloadJson: string;
  signatureHex: string;
  hashFragment: string;
} {
  const validated = CriticalPayloadSchema.parse(payload);
  const payloadJson = JSON.stringify(validated);
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(payloadJson);

  const secretKeyBytes = hexToUint8Array(privateKeyHex);
  const signatureBytes = nacl.sign.detached(messageBytes, secretKeyBytes);
  const signatureHex = uint8ArrayToHex(signatureBytes);

  const payloadB64 = toBase64Url(payloadJson);
  const signatureB64 = toBase64Url(signatureHex);
  const hashFragment = `${payloadB64}.${signatureB64}`;

  return {
    payloadJson,
    signatureHex,
    hashFragment,
  };
}

/**
 * Verify a critical payload and signature using the bundled Ed25519 public key.
 * Works completely offline!
 */
export function verifyCriticalPayload(
  payloadJson: string,
  signatureHex: string,
  publicKeyHex: string = DEFAULT_PUBLIC_KEY_HEX
): {
  isValid: boolean;
  payload: CriticalMedPassPayload | null;
  error?: string;
} {
  try {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(payloadJson);
    const signatureBytes = hexToUint8Array(signatureHex);
    const publicKeyBytes = hexToUint8Array(publicKeyHex);

    const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!verified) {
      return { isValid: false, payload: null, error: 'Signature verification failed' };
    }

    const parsedJson = JSON.parse(payloadJson);
    const parsedPayload = CriticalPayloadSchema.parse(parsedJson);

    return {
      isValid: true,
      payload: parsedPayload,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown verification error';
    return {
      isValid: false,
      payload: null,
      error: message,
    };
  }
}

/**
 * Parse and verify the URL hash fragment directly
 * Format: #<base64url(payload)>.<base64url(signatureHex)>
 */
export function parseAndVerifyHashFragment(
  hashFragment: string,
  publicKeyHex: string = DEFAULT_PUBLIC_KEY_HEX
): {
  isValid: boolean;
  payload: CriticalMedPassPayload | null;
  error?: string;
} {
  try {
    const cleanHash = hashFragment.startsWith('#') ? hashFragment.substring(1) : hashFragment;
    const parts = cleanHash.split('.');
    if (parts.length !== 2) {
      return { isValid: false, payload: null, error: 'Malformed payload hash format' };
    }

    const payloadJson = fromBase64Url(parts[0]);
    const signatureHex = fromBase64Url(parts[1]);

    return verifyCriticalPayload(payloadJson, signatureHex, publicKeyHex);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse hash fragment';
    return { isValid: false, payload: null, error: message };
  }
}
