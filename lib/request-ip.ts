/**
 * The caller's IP from request headers — the same three-line expression
 * (`x-forwarded-for`'s first entry, falling back to `x-real-ip`) was copied
 * into seven places (rate-limit keys, session records, device alerts) with
 * small drifts in the final fallback. One SSOT (S-11).
 *
 * Body stays LEFTMOST-entry for now — behind cPanel/LiteSpeed the app sits
 * behind a proxy whose exact XFF behaviour (append vs. replace, whether it
 * sets its own trusted header) is not yet confirmed; see
 * `docs/cpanel-deploy.md` "Reverse-proxy IP header" for the switch-over plan.
 * Only this function's body changes when that is confirmed.
 */
type HeaderReader = { get(name: string): string | null } | null | undefined;

// `null` means "no fallback" (returns possibly undefined) — distinct from
// omitting the argument, which defaults to "unknown" (always returns a
// string). A plain `undefined` default parameter can't express that
// distinction (it also fires on an explicit `undefined` argument), so the
// two shapes are separate overloads: every caller that passes a string
// fallback (or none) gets a `string` back and needs no `?? "unknown"` /
// non-null `!` at the call site; only an explicit `null` opts into
// `string | undefined` (used once, for `Session.ip`, which is nullable).
export function clientIp(headers: HeaderReader, fallback?: string): string;
export function clientIp(headers: HeaderReader, fallback: null): string | undefined;
export function clientIp(
  headers: HeaderReader,
  fallback: string | null = "unknown",
): string | undefined {
  const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers?.get("x-real-ip") || (fallback === null ? undefined : fallback);
}
