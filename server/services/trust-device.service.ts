import { createHmac, timingSafeEqual } from "crypto";

export const TRUST_DEVICE_COOKIE = "buildrik_trust_device";
const TRUST_DEVICE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

function hmac(payload: string): string {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET!)
    .update(payload)
    .digest("hex");
}

/** Returns a signed cookie value for a trusted device. */
export function signTrustDevice(userId: string): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload = `${userId}.${iat}`;
  return `${payload}.${hmac(payload)}`;
}

/**
 * Returns true if the cookie is valid for this user and was issued after
 * their last password change (so changing password auto-revokes trusted devices).
 */
export function verifyTrustDevice(
  userId: string,
  cookieValue: string | null | undefined,
  passwordChangedAt: Date | null | undefined
): boolean {
  if (!cookieValue) return false;

  const parts = cookieValue.split(".");
  if (parts.length !== 3) return false;

  const [cookieUserId, iatStr, sig] = parts;
  if (cookieUserId !== userId) return false;

  const iat = parseInt(iatStr, 10);
  if (isNaN(iat)) return false;

  // Check expiry
  if (iat + TRUST_DEVICE_MAX_AGE < Math.floor(Date.now() / 1000)) return false;

  // Verify HMAC (constant-time comparison)
  const expected = hmac(`${cookieUserId}.${iatStr}`);
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return false;
  } catch {
    return false;
  }

  // Auto-revoke: cookie must have been issued after the last password change
  if (passwordChangedAt) {
    const changedAtSec = Math.floor(passwordChangedAt.getTime() / 1000);
    if (iat < changedAtSec) return false;
  }

  return true;
}

/** Parses the trust device cookie value out of a raw Cookie header string. */
export function parseTrustDeviceCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(TRUST_DEVICE_COOKIE + "="));
  return match ? decodeURIComponent(match.slice(TRUST_DEVICE_COOKIE.length + 1)) : null;
}
