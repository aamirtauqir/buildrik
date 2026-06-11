---
title: "Privileged AI Action Platform — design"
type: feat
status: design-reviewed
date: 2026-06-06
origin: docs/plans/2026-06-05-001-feat-ai-editor-100pct-plan.md (codex challenge #3/#4)
review: codex-challenged 2026-06-06 — verdict folded in (cut the generic platform;
  ship propose-action + confirm-token + trust-policy over existing mutations;
  fix publish-path bugs first). Sections 2/4/6/7/8 revised.
---

# Privileged AI Action Platform — Design

Step 1 of the platform arc. **Design only — no production code until codex
challenges this doc.** Grounded in the actual codebase (file:line throughout),
not speculation.

## 1. The problem (codex #3)

Today every AI action is one shape: a **canvas edit-command**.

```
AI → validated command(s) → client applies via composer → ONE undo step
```

`applyAiEdit` (`packages/editor/src/editor/sidebar/tabs/ai/applySetStyle.ts:620`)
wraps a command batch in `composer.beginTransaction("ai-edit")` → each
`COMMAND_HANDLERS` entry mutates the in-memory canvas → one `endTransaction` →
one undo. This fits W4 set-token, W5 set-image, W12 save-as-component: instant,
reversible, local, client-applied.

It **stops fitting** at the heavy surfaces (W6–W13):

| Surface | Why the edit-command model breaks |
|---|---|
| W6 publish | remote async job, **no undo** (can't un-deploy), real cost |
| W7 forms | real submissions, PII, spam, email delivery — not reversible |
| W9 CMS | schema-heavy, queries, relations, draft/publish states |
| W10 commerce | variants/pricing/tax/inventory/cart |
| W11 locale | translation cost, routing, hreflang, SEO-dup |
| W13 site-settings | lives in the dashboard `Site` table, not the composer |

These are **privileged, async, non-undoable, schema-heavy** actions. Building 10
separate commands, each re-inventing confirm / audit / retry / quota / locks =
mess + the exact security holes codex caught 4×. The platform is the work, not 10
parallel commands.

## 2. The core insight — REVISED after codex challenge (2026-06-06)

Original draft proposed a "second execution platform" with its own action
registry/runtime/job model. **Codex killed that as over-engineering** and it was
right: the server seams ALREADY exist as ordinary mutations —
publish (`sites.ts:270`), site settings (`site-detail.ts:41`), redirects
(`:87`), domains (`:196`), share links (`:277`). Building a parallel execution
layer duplicates them.

**The actual gap is narrow:** `aiRouter` only knows `text | style-command | plan`
(`ai.ts:125,257`). The AI has no way to PROPOSE a server action and route it
through a trusted confirm gate into the mutations humans already use.

So this is NOT a platform. It is **three thin pieces**:

```
1. one new AI intent:   propose-action   (ai.ts:257) — AI proposes, never executes
2. one server confirm:  a signed confirmation TOKEN (actorId+siteId+actionId+
                         argsHash+expiry); the execute step rejects mismatches
3. one policy module:   central trust-boundary (URL/id/injection/retrieval)
+ thin wrappers around EXISTING domain mutations, starting with sites.publish.
```

The execution path is **AI-agnostic** (codex decision #3): AI proposes → confirm
token → the SAME `sites.publish` / `site-detail.*` mutation a human button calls.
No second execution layer, no generic action registry, no generic job table.

Distinguishing rule (which path an AI capability uses):

> Client-applicable + reversible by one composer undo → Seam A (existing command
> seam, W4/W5/W12). Server-executed / non-undoable / async / writes outside the
> composer → propose-action → confirm-token → existing domain mutation.

## 3. What already exists to compose (reuse map)

The platform is mostly **coordination of existing infra**, not new infra:

| Need | Reuse | file:line |
|---|---|---|
| async job + status | `PublishBuildJob` model + worker + `usePublishJob` polling | `prisma/schema.prisma:848`, `app/api/workers/publish/[jobId]/route.ts:33`, `editor/shell/hooks/usePublishJob.ts:43` |
| permission / role | `checkSiteRole(db, userId, siteId, minRole)` + ROLE_RANK (VIEWER<EDITOR<ADMIN<OWNER) + per-site override | `server/services/permission.service.ts:4,47` |
| audit log | `recordForSite({siteId, actorId, action, metadata})` (never-throws) | `server/services/activity-log.service.ts:55` |
| quota / cost | `reserveQuota` / `releaseQuota` / `recordUsage` (atomic) | `server/services/quota.service.ts:58,106,147` |
| confirm gate | diff Apply/Discard + agent approve/skip + auto-apply toggle | `AITab.tsx:114`, `useAgentRunner.ts:71`, `ChatMessage.tsx` |
| adoption telemetry | `recordAiAdoption` (revert/acceptance signals) | `server/services/ai-adoption.service.ts` |

What's **missing** (what this work actually adds — kept deliberately small after
the codex challenge):

1. **A `propose-action` AI intent** — a new tRPC path where the AI proposes
   `{actionId, args}` (validated, trust-policy-checked) but does NOT execute.
2. **A server confirmation token** — signs `actorId+siteId+actionId+argsHash+
   expiry`; the `actions.confirm` mutation rejects mismatches, then calls the
   EXISTING domain mutation.
3. **A confirmation-with-consequences UI** — distinct from the canvas diff (must
   say "this publishes / cannot be undone").
4. **A central trust-boundary policy module** (codex #4) — one place, not
   scattered validators.

NOT added (codex cut): a generic action registry/runtime, a generic `ActionJob`
model, a second execution layer. Execution reuses existing domain mutations.

## 4. The propose → confirm-token → execute flow (REVISED)

No `PrivilegedAction` mega-contract (codex: underspecified + wrong). Instead a
small action DESCRIPTOR (for the proposal + confirm gate) and a hard rule that
execution reuses the existing domain mutation.

```ts
// Descriptor — just enough to PROPOSE + render a consequence-aware confirm gate.
interface ActionProposal<Args> {
  actionId: string;                 // "site.publish" | "site.redirect.create" | ...
  schema: ZodSchema<Args>;          // server-side validation (trust boundary)
  describe(args): { title: string; consequence: string; undoable: boolean };
  // NO minRole/metered/compensate here. Authorization, plan/feature gating, and
  // domain invariants stay in the EXISTING domain service that already enforces
  // them (e.g. site-settings.service plan gate :108, locale lock :153).
}
```

Flow:
1. **propose** (`ai.ts` new intent) — AI emits `{actionId, args}`. Server
   validates `schema` + runs the **trust-policy** on every URL/id/name. Does NOT
   execute. Returns a **server-signed confirmation token** binding
   `actorId + siteId + actionId + sha256(args) + expiry` (codex decision #2).
2. **confirm gate** (editor UI) — shows `describe().consequence`, e.g. "This
   deploys the live site — Cmd+Z won't undo it." Explicit per-action; NEVER
   folded into agent auto-apply (that toggle is Seam-A-only).
3. **execute** (`actions.confirm` mutation) — re-validates the token (reject on
   any mismatch / expiry), then **calls the existing domain mutation/service**
   (`sites.publish`, `siteDetail.settings.update`, …) which already does
   `checkSiteRole` + plan gating + invariants. Audit via the domain path.

Quota/metering: only where a real cost exists (none today beyond AI prompts/day —
codex: `metered` was fiction). Add per-action cost ONLY when a surface introduces
one (translation, etc.).
Compensation: a **whitelist of explicit inverse actions** with proven semantics
(publish→unpublish as a user-facing inverse, NOT full rollback). Default = no
compensation, warning + audit (codex decision #4).

## 5. Trust-boundary policy (codex #4) — one module

`server/services/ai-trust-policy.ts` (new), the single home for:
- **Canonical URL policy** — scheme/host/path normalization, per-surface allow
  (form action, social link, canonical, redirect, image/commerce url, locale
  path). Replaces the scattered `isSafeSrcValue` / `UNSAFE_HREF` / per-command
  regexes. Existing validators migrate to call it.
- **Capability-scoped ids** — an id the AI may touch must be a member of a list
  WE sent it this turn (the pattern W4 tokens / W5 assets already use:
  `allowedTokens` / `allowedAssetUrls`). Generalize it.
- **Prompt-injection defense** — asset/CMS/product/locale/redirect/component
  names are attacker-controlled strings that get fed BACK into prompts. Treat all
  inventory text as data, fence it, never let it become instructions.
- **Retrieval, not prompt-stuffing** — large media/CMS/catalog/token inventories
  must be searched/paged, not dumped (W4/W5 already cap at 120/100; formalize).

## 6. PREREQUISITE — publish path — MOSTLY DONE (status 2026-06-06)

Codex's biggest-risk call: do NOT wrap publish until its real bugs are fixed.
Status after verifying against live code:
- ✅ **`publishStatus` authz** — FIXED `ca8c280d` (asserts active site membership).
- ✅ **`prePublishChecks` authz** — FIXED `ca8c280d`.
- ✅ **raw HTML leak via status** — FIXED `ca8c280d` (`getPublishStatus` no longer
  selects the `log` column).
- ✅ **`startPublish` read-then-create race** — ALREADY FIXED in the prior
  publish-path arc (migration `20260607000001`, partial unique index
  `publish_build_jobs_active_unique` + P2002 path). Codex's line ref was stale.
- ✅ **worker fire-and-forget durability** — ALREADY mitigated (stale-QUEUED guard
  + stranded-row cleanup, same prior arc).
- ⏳ **HTML still stored at rest in the job `log` column** — deferred (bigger:
  relocate the payload out of the job row; the leak is closed, storage remains).
- ⏳ **audit is best-effort** (`recordForSite` swallows failures) — deferred; decide
  whether privileged actions need a hard audit guarantee.

Prerequisite is effectively cleared for the propose-action core (phase 3).

## 6b. Proof surface: `site.publish` via propose/confirm (AFTER 6)

Once publish is solid, wrap it as the FIRST `actionId`:
- AI emits `{actionId: "site.publish"}` → server proposes → confirm token.
- Confirm gate: "This deploys the live site — Cmd+Z won't undo it."
- `actions.confirm` validates the token → calls the EXISTING `sites.publish`
  mutation (which now has proper authz). No new execution path, no new job model.

If propose/confirm wraps publish cleanly, it wraps redirects/forms/locale the same
way — each is a thin `ActionProposal` + the existing mutation.

## 7. Phasing (REVISED — smaller, codex "what to cut")

1. **(done) design + codex challenge.**
2. **Publish-path fix-arc** (section 6) — authz on publishStatus + prePublishChecks,
   startPublish race, worker durability, HTML out of the job row. Ships standalone.
3. **propose-action core** — one new `ai.ts` intent + `actions.confirm` mutation +
   the server confirmation-token util + the central trust-policy module. Wraps the
   (now-fixed) `sites.publish` as the first + only `actionId`.
4. **Confirm-with-consequences UI** — distinct from the canvas diff gate.
5. **One real new surface**, chosen by adoption data (STOP+MEASURE gate) — a thin
   `ActionProposal` over an existing mutation (redirects is the lightest candidate).
6. Remaining surfaces, each a thin proposal over its existing mutation.

NOT a 10-surface program. Each surface lands when usage justifies it.

## 8. Decisions — RESOLVED by codex challenge (2026-06-06)

1. **Jobs:** keep **per-surface tables**, share the API shape (propose/confirm/
   poll), NOT storage. No generic `ActionJob` (it becomes a junk drawer —
   PublishBuildJob/AIGenerationJob already diverge).
2. **Confirmation:** **server-issued token** binding `actorId+siteId+actionId+
   argsHash+expiry`; the execute mutation rejects any mismatch. Client-only is too
   weak.
3. **AI-agnostic:** **yes.** AI proposes; execution goes through the same domain
   mutations/services humans use.
4. **Compensation:** **whitelist explicit inverses only** with proven semantics
   (publish→unpublish ok, not full rollback). Default = no compensation, warning +
   audit.
5. **W13 site-settings:** **not a platform surface.** If AI touches it, wrap the
   existing `siteDetail.settings.update` mutation with propose/confirm. Custom-code
   fields stay excluded (script injection).

### Residual gaps codex flagged (track, don't lose)
- **Audit is best-effort** (`recordForSite` swallows failures). For privileged
  actions that needs a stronger guarantee (or accept it + document the limit).
- **Async at 6 surfaces = 2s-polling load.** Before the 2nd async surface,
  reconsider the polling model (shared poll / push) — don't copy usePublishJob 6×.

## NOT in scope (this doc)
- Building any of it. This is the shape; codex challenges, then we build phase 2.
- head/body custom code via AI (script injection — gated/excluded everywhere).
- Native provider tool-use (rejected P4; the plan loop scales).
