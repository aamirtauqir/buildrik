# Buildrik — CEO Review of the Shipped Dashboard (2026-06-19)

**Method:** strategy review (`/plan-ceo-review`) on the shipped product, grounded against
the 2026-06-17 product-UX audit + 2026-06-18 design audit, after E0–E7 + E2-T5a/b landed.
**Verdict: ~6/10.** The agency wedge skeleton is now built. The keystone is half-built
(a footgun), and the courage-cuts the prior audit called for never happened.

## What changed since 06-17 (the win)
The audit named 5 features = 80% of agency value: shared-DS push · Clients · duplicate-as-
template · core build loop · white-label handoff. Two days ago most sat in 2 screens, funded
last. Now shipped: Clients (E2), white-label (E2-T5a), shared-theme push (E2-T5b), client-
review handoff (E4). **No generic tool (Webflow/Framer) does cross-client theme-push +
white-label review handoff.** That is the moat. The wedge is real.

## Three blockers to 10-star

### 1. The wedge keystone is a footgun, not a moat — DECISION: FIX NEXT
E2-T5b ships capture → push → lock → partial-fail. It is missing the audit's **finding A**
(the single most important thing to design): the shared-DS change *contract*. Today an admin
clicks "Push to all sites" and N live client sites mutate with **no preview, no count confirm,
no override-resolution prompt**. The lock toggle is the only guard and must be pre-set. This is
the exact footgun the audit warned about — fastest way to damage a paying client's live site.

### 2. The courage-cuts were never made (deferred)
- **Export HTML still shipped** (Topbar + 5 shell files) — the exit ramp off your hosted
  platform. Anti-retention. The audit's strongest strategic cut.
- **Ecommerce stub still present** (`editor/ecommerce/`) — implies an unfunded roadmap.
- Interactions / Locales still live (freeze candidates).

### 3. One concept, many names (deferred)
"Shared theme" / "shared design system" / "Asset library" / "Media" / "Styles/presets" —
same nouns, different screens (06-18 design audit). Learn one noun once. Cheap, compounding.

## Decision (this review)
**Fund "Harden the wedge" next.** Keystone + biggest live-site risk in one move.
Deferred, in order: courage-cuts → one-noun-once pass → AI-as-house-DS redesign.
Decision id `c09b7146`.

## Build-ready spec — shared-theme change contract
Make `theme.push` safe-by-default. Target slice (MVP → 10-star):

1. **Preview / blast-radius** (new `theme.previewPush` query): returns the resolved target
   list with per-site state (`would-push` vs `skipped-locked`) + counts. No mutation.
2. **Confirm dialog before push**: "This changes N live client sites" + the list (following
   vs custom-theme/locked). Push button bakes the count: "Push to N sites".
3. **Override-resolution in the dialog**: locked sites shown as "kept (custom theme)" with an
   inline per-site "overwrite this one?" — resolution at push time, not only via pre-set lock.
4. **Push history** (new `ThemePushRun` record: workspaceId, at, results[]): "last push: 11
   pushed, 2 kept". Surfaces the answer to "which clients did I just change?".
5. **Per-site undo** (follow-up): store pre-push `projectStyles` snapshot per site → restore.
   Heavier; ship 1–4 first.

Effort: human ~2–3 days / CC ~60–90 min for items 1–4.

## Not in scope (this decision)
Courage-cuts, naming pass, AI redesign — logged, deferred, not cut from the roadmap.
