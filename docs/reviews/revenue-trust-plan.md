# Revenue + Trust Unblock — Plan (codex-reviewed 2026-06-23)

CEO mode: HOLD SCOPE. Direction holds (make Buildrik sellable + trustworthy
before adding breadth). Sizing CORRECTED after `/codex review` broke the first
draft in 7 places. Status legend: ✅ done · ⏳ blocked · 🔨 buildable now.

## Shipped (this pass)
- ✅ **Price single source of truth** — `billing/page.tsx` + `plan-comparison.tsx`
  hardcoded 19/49 vs `PLAN_LIMITS` 29/79; both now derive from PLAN_LIMITS.
  (commit f51c50e6) Must precede any Stripe wiring.
- ✅ **DNS-verify cron** (was BROKEN) — matched dead host `sites.buildrik.app`;
  now matches each record's own `value` per type (CNAME/A/AAAA/TXT) + absolute
  Vercel hosts. +5-test regression. (commit f51c50e6)

## Re-sliced items (corrected sizing)

### Billing — ONE atomic slice (do NOT ship partial) ⏳ needs Stripe test keys
The webhook + handlers exist but **only UPDATE existing subscriptions** —
`handleSubscriptionUpdated`/`handleInvoicePaid` no-op if no subscription row
(`stripe-webhook.service.ts:56,105`). So the slice is bigger than "add Checkout":
1. **Install the Stripe SDK** (`stripe`) — drop the hand-rolled HMAC verifier
   (`webhooks/stripe/route.ts:16`); use `stripe.webhooks.constructEvent`.
2. **`upgradePlan` → Checkout Session** (hosted). Server maps plan→**priceId**
   (single source = PLAN_LIMITS); never trust client amount.
3. **Handle `checkout.session.completed`** → create-or-fetch Stripe customer
   (store `stripeCustomerId` — column may need adding), CREATE the Subscription
   row, set plan. (The current handlers can't bootstrap.)
4. **Dual plan write, atomic** — every plan change writes BOTH
   `subscription.plan` AND `workspace.plan` in one txn. Feature gates read
   `workspace.plan` (`share-link.service.ts:23`, `site-settings.service.ts:145`);
   billing reads `subscription.plan` (`billing.service.ts:52`). Drift = paid-but-
   gated or free-paid-features.
5. **Kill/reroute local billing mutations** — `switchInterval` (raw DB write,
   `billing.ts:45`), `cancel`/`reactivate` (local flags only,
   `billing.service.ts:216,239`) must route through Stripe or be deleted, else
   instant drift once Checkout lands.
6. **Payment method = Customer Portal CTA** — `billingPortal.sessions.create`
   → redirect. Drop the disabled Elements form + the unwritten `payment_methods`
   local-sync pretense (`payment-method-card.tsx`, nothing writes that table).

### Component override-on-sync ⏳ real arc, NOT a quick fix
The first-draft fix was WRONG: `syncInstance` re-clones the master + reattaches
metadata; `applyOverride` only edits the stored patch list, not the new tree
(`ComponentInstances.ts:233,118`). And live overrides use `#/...` paths while the
utils assume `/elements/...` — schemes don't match. **Also** only style+attr
setters record overrides (trait setters don't) and only style overrides resolve
at render (`ElementStyles.ts:41,134,157,178`). Real fix: (1) decide override
semantics for content/attr/trait, (2) unify the path scheme, (3) re-apply
overrides onto the freshly-cloned tree during sync, (4) regression test.

### Published-password + Share-link enforcement ⏳ blocked on Vercel-plan decision
Same hosting fork. Both currently fake (share redirects to the world-readable
`publishedUrl`; published-password 402/403-swallowed on Hobby).
- **Vercel Pro path** (~1d): stop swallowing 402/403, surface honestly; use
  Vercel deployment protection + Protection-Bypass tokens for share links.
- **Hobby path** (~1wk, NOT `/p/[siteId]` one-pager): a real serving proxy that
  streams the deployed HTML behind a cookie check — new serving architecture
  (HTML/assets/cookies/custom-domain/SEO). Codex: "massively under-scoped" as a
  small route.

## Build order (corrected)
```
DONE  : price SSOT, dns-verify
NOW   : (none left that are pure-code + safe — override needs semantics first)
KEYS  : billing slice (steps 1-6 as ONE unit)        ← needs Stripe test keys
ARC   : component override (semantics → unify paths → sync replay → test)
DECIDE: Vercel Pro vs Hobby → password + share enforcement
```

## Blocking decisions
- **D-1 Stripe:** account + test secret key + 3 price IDs (Pro/Business mo+yr).
- **D-2 Vercel plan:** Pro (~1d password/share) vs Hobby (~1wk proxy-serve).

## NOT in scope
stock media, collab, AI site-gen polish, localization, multi-workspace, server
version-history persistence, redirects-deploy, bulk-publish, avatar upload,
analytics avgSession/bandwidth.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEARED | reframed extend→revenue+trust; HOLD SCOPE; 6-item scope |
| Codex Review | `/codex review` | 2nd opinion | 1 | issues_found | 7 P1 + 4 P2; 2 fixed (price, dns), rest re-sliced |
| Eng Review | `/plan-eng-review` | Architecture & tests | 0 | — | recommended before the billing slice + override arc |
| Design Review | `/plan-design-review` | UI/UX | 0 | — | n/a |
| DX Review | `/plan-devex-review` | DevEx | 0 | — | n/a |

**CODEX:** broke the first draft on sizing — webhook can't bootstrap, dual plan truth, local-mutation drift, dns multi-bug, override path-scheme mismatch, 3-way price drift. 2 fixed this pass (price SSOT, dns). GATE: FAIL (P1s remain in unbuilt items).
**VERDICT:** CEO CLEARED on direction; price + dns shipped; billing is ONE atomic slice (not "add Checkout"); override is a real arc (not a quick fix). Eng review recommended before the billing slice.

**UNRESOLVED DECISIONS:**
- D-1 — Stripe account / test keys + price IDs (blocks the billing slice)
- D-2 — Vercel Pro vs Hobby (blocks published-password + share-link)
