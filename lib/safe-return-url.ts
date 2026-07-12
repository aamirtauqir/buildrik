/**
 * Only allow a same-origin relative path as a post-auth redirect target.
 * Blocks open-redirect vectors: absolute URLs, protocol-relative `//evil.com`,
 * and backslash tricks `/\evil.com` (some browsers normalize `\` to `/`).
 * Shared by every place that consumes a `returnUrl` (login, 2FA, backup) so the
 * allow-list can never drift between paths.
 */
export function safeReturnUrl(url: string | null | undefined): string | null {
  return url &&
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.startsWith("/\\")
    ? url
    : null;
}
