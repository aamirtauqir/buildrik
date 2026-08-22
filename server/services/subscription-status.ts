/**
 * Is a stored subscription status still a live commitment?
 *
 * `Subscription.status` is a free string column, and
 * `handleSubscriptionUpdated` writes whatever Stripe sends:
 * `STRIPE_STATUS_MAP` names only active / past_due / canceled, and anything
 * else falls through to `status.toUpperCase()`. So the column can legitimately
 * hold INCOMPLETE (a first payment awaiting 3DS), UNPAID (dunning exhausted),
 * TRIALING or PAUSED.
 *
 * Asking "is it one of ACTIVE or PAST_DUE" therefore answered NO for real,
 * live subscriptions. Asking "is it finished" fails safe instead: a status
 * nobody anticipated counts as live, which is the direction that protects the
 * customer rather than the code.
 */
export const TERMINATED_SUBSCRIPTION_STATUSES = ["CANCELLED", "CANCELED", "ENDED", "EXPIRED"] as const;

export function isSubscriptionLive(status: string | null | undefined): boolean {
  if (!status) return false;
  return !TERMINATED_SUBSCRIPTION_STATUSES.includes(
    status.trim().toUpperCase() as (typeof TERMINATED_SUBSCRIPTION_STATUSES)[number]
  );
}
