const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Captcha is only ever required when a site key is configured. */
export function captchaEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

/**
 * Verify a Cloudflare Turnstile token server-side. Returns true on a valid solve.
 *
 * - Site key absent  → captcha disabled, no-op (returns true).
 * - Site key present, secret absent → FAIL LOUD in production (a misconfig that
 *   would otherwise silently disable brute-force protection); skip in dev.
 * - Verify error/timeout → fail CLOSED (returns false).
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!captchaEnabled()) return true;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET_KEY is missing — captcha is misconfigured and would silently no-op."
      );
    }
    return true;
  }
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(5000) });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
