/**
 * Buildrick's public contact surface.
 *
 * These were hardcoded per screen against `buildrik.com` — a misspelling of the
 * brand that resolves to an IP we do not own and carries no MX record, so every
 * "Contact support" mail bounced and the published-site badge pointed at a
 * stranger's parked domain. The live properties are on `buildrick.io`.
 */

/** Requires a `support@buildrick.io` mailbox on the cPanel account to receive mail. */
export const SUPPORT_EMAIL = "support@buildrick.io";

/** The marketing site. Linked from the badge on every published client site. */
export const MARKETING_URL = "https://buildrick.io";
