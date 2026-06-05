---
title: "AI editor → 100% — complete agent-native parity plan"
type: feat
status: planned
date: 2026-06-05
origin: docs/plans/2026-06-04-002-feat-whole-editor-ai-agent-native-parity.md
review: autoplan (lean — full plan + codex challenge)
---

# AI Editor → 100% — Complete Plan

Goal: everything the editor UI can do, the AI can do too, and AI is a first-class
way to build. Today ~60% (11 commands + agent loop + seams + hosted-model guard;
common editing strong, specialized surfaces + theme + adoption missing).

## What's already done (don't rebuild)
11 commands (set-style ~70 props + set-style-variant, set-text, add/delete/
duplicate/move-element, add-section, set-attribute incl image src, insert-component,
set-page-setting incl slug) · async command seam · config-command seam · page-scope
multi-element · agent loop + opt-in auto-apply · hosted-model key guard · quota +
error-surfacing + data-loss guard. All tested + key flows live-verified.

## The remaining surface (what AI still can't do)
```
Subsystem (UI today)            AI?   Workstream
──────────────────────────────  ────  ───────────
theme / design tokens            ✗    W4  set-token (+ token-sync feature)
media: use library asset         ~    W5  set-image recall (asset list → prompt)
media: upload a file             ✗    W5  OUT v1 (File handling; user uploads, AI references)
publish / deploy                 ✗    W6  publish via agent step (explicit confirm)
forms config                     ✗    W7  set-form-field / configure-form
animations / triggers            ✗    W8  add-animation
CMS / data-binding               ✗    W9  bind-field
e-commerce                       ✗    W10 add-commerce-element
localization                     ✗    W11 set-locale / translate-page
component authoring (save)        ✗    W12 save-as-component
site settings / SEO / redirects  ✗    W13 set-site-setting
AI as primary surface            ✗    W14 discoverability + adoption instrumentation
```

## Phases (sequenced)

### W4 — Theme / design tokens (set-token) — HIGHEST VALUE
Blocked today: the React `TokenRegistryContext` owns CSS-var application and only
re-applies on `colorMode:changed`; an engine token write persists but doesn't
visually update, and undo would revert the stored value but not the live var.
**Build the token-sync FEATURE first:**
1. Composer emits `TOKENS_CHANGED` when `projectSettings.designTokens` mutates
   (in `setProjectSettings`, or a dedicated path).
2. `TokenRegistryContext` effect listens → re-hydrates colorState/spacingState/
   typeState from `composer.getProjectSettings().designTokens` → the existing
   CSS-var apply effect re-runs (depends on those token states). Undo fires the
   same event → vars revert. This closes the propagation + undo-visual hole.
3. `set-token` command: engine `setDesignToken(tokenId, value)` (model on
   `composer.designSystem.applyAutoFix`: find by id → update → setProjectSettings
   → emit). v1 kinds = color / spacing / type (the persisted ones; reject others
   rather than silently not persisting). Validate value per kind (color: no url/
   expression). Feed the token registry (ids + kinds) into the prompt for recall.
RISK: design-system state layer (14 kinds + dark-mode resolver). Careful; full
test + live-verify (set token → canvas changes → undo reverts var).

### W4 architecture finding (investigated 2026-06-05 — code, not speculation)
- **Today's ownership:** React per-kind hooks (`useTokenBase`, one per the 14 kinds:
  color/spacing/type/radius/shadow/motion/border/opacity/zindex/breakpoint/grid/
  sizing/icon/imagery) own the LIVE token state, apply the CSS vars (e.g.
  `useSpacingTokens.applyPreset` → `document.documentElement.style.setProperty`),
  AND keep their OWN undo/redo stacks (`useTokenBase` setUndoStack/setRedoStack).
  Engine `projectSettings.designTokens` is a save-time MIRROR (written via
  `composer.setProjectSettings` + `persistAll` to localStorage on apply).
- **Why AI can't just write:** AI applies engine-side (in applyAiEdit, no React).
  It can't call the React hooks, and an engine-only write neither updates the
  live CSS var nor the React state nor coordinates with the hooks' separate undo.
- **Two candidate architectures:**
  - **(A) Invert to engine SSOT (proper, big):** `composer.setDesignToken(id,
    value)` becomes the ONE write path — updates projectSettings, applies the CSS
    var (var-application moves to an engine-owned layer), emits TOKENS_CHANGED;
    React hooks become read-only mirrors that subscribe + derive; the PANEL also
    writes via this method. One writer, undo lives in the composer transaction
    (undo reverts projectSettings → emits → vars revert). Blast radius: all 14
    hooks + panel write paths + dark-mode resolver. Migrate kind-by-kind / flagged.
  - **(B) Bridge AI → the panel's writer (smaller v1):** AI engine-write emits an
    event; a TokenRegistry bridge effect routes it into the SAME kind-hook
    `updateToken(id, value)` the panel uses (so React state + CSS var update
    identically — not a parallel patch). UNDO is the catch: the hook's undo stack
    is separate from applyAiEdit's transaction → set-token undo would need
    coordination (or accept the token undo lives in the panel's stack, not the
    global undo — a UX inconsistency). Scope to color/spacing/type.
- **Recommendation:** (A) is the stable answer codex asked for, but it's a focused
  DS-state refactor — do it in a fresh session with the design system's own arc in
  view, NOT at a long session's tail. (B) ships set-token sooner but leaves the
  undo-coordination wart. Decide (A vs B) at the start of the W4 build session.

### W4 DECISION + SHIPPED 2026-06-05 (commit cce564b1) — Path C (neither A nor B)
The A-vs-B framing was built on a wrong premise. Grounding in the actual code
showed the propagation+undo path the plan called "the RISK / hard part" was
ALREADY SHIPPED by Arc D6.c (2026-05-16): `composer.designSystem.applyAutoFix`
writes a token to `projectSettings.designTokens` inside a labeled transaction →
`project:changed` → `TokensSection` (`useResetAllKinds`) re-hydrates all 14 kind
registries (re-applies CSS vars for every kind via `resetFromSaved`/
`hydrateFromExternal`) AND Cmd+Z roundtrips. Integration-tested
(`autofix-history.integration.test.tsx`).
- **Path C** = make `set-token` a sibling of `applyAutoFix`: a single engine write
  method `setDesignToken(id, value)`, command dispatches to it, propagation+undo
  are inherited. This IS (A)'s correctness model (one engine write path, undo in
  the composer transaction) WITHOUT (A)'s 14-hook-inversion blast radius and
  WITHOUT (B)'s separate-undo-stack wart. Directly answers codex #6 — not a new
  event-choreography patch, but reuse of the shipped+tested path.
- Transaction nesting is depth-counted, so `setDesignToken`'s own transaction
  coalesces safely into applyAiEdit's outer `ai-edit` transaction (one undo step).
- The panel keeps writing through its hooks (no inversion). Full (A) — making the
  panel ALSO write via the composer + the 14 hooks read-only — remains a future
  DS-arc refactor if tokens start mutating from many surfaces (codex #6's caveat),
  but is not needed for the AI write path.
- Trust boundary: per-type value guard + unsafe guard + capability-scoped ids
  (tokenId ∈ sent registry). Recall: page scope ships the token registry.
- v1 kinds via TokenType: color/length/font-size/font-family/number/string;
  shadow/select rejected (composite/enumerated — can't validate from a free string).

### W14 adoption instrumentation SHIPPED 2026-06-06 (commit 544a9c2b)
Task-level (codex #7), not vanity. 3 signals via a dedicated `AiAdoptionEvent`
model (separate from ActivityLog so it can't pollute user activity feeds):
- `edit.applied` (inline + chat surfaces), `agent.run` (planned/applied/skipped/
  failed + duration = acceptance), `edit.reverted` (undo attributed by the
  `ai-edit` history label = survival/regret). Revert-rate = reverted/applied.
- Capability scope: server verifies actor ∈ site workspace; never-throws.
- Privacy: structural metrics only (command type names, scope, counts, durations)
  — never prompt text / token values / content.
- Client tracker fire-and-forget; suppressed when no siteId.
**NEXT GATE per the revised recommendation: STOP and MEASURE** which jobs users
actually attempt (query `ai_adoption_events`) BEFORE building W5–W13 heavy
surfaces. Do not big-bang the 10 surfaces blind.

### W5 — Media recall (set-image v2) — SHIPPED 2026-06-06 (commit c4b335f0)
set-image works (src). Add recall: editor gathers the media asset list (ids +
urls + names, like P3's element list) → prompt, so the model picks REAL library
assets, not guessed URLs. Validate the chosen id/url ∈ the sent list.
OUT v1: AI uploading a File (binary handling) — user uploads via media tab.
DONE: `composer.media.getAssets()` (http assets only) → page scope `assets` →
prompt "Media library" section + set-attribute src rule. Validation: src ∈ sent
asset urls when a library is sent (guessed urls rejected); else isSafeSrcValue
scheme floor. Mirrors the W4 token-recall plumbing. Tests green; NOT live-E2E'd
(needs a project with an http image asset; recall mechanism identical to W4 +
the client→tRPC wire already E2E-verified in W14).

### W6 — Publish via agent (explicit confirm)
A `publish` agent step (NOT a canvas command) that triggers the existing
`PublishService` flow. ALWAYS requires explicit per-publish confirmation (async
remote job, no undo) — never folded into auto-apply. Surfaces the existing
publish progress/failure UX.

### W7 — Forms (set-form-field / configure-form)
Config command (no element or form-element scope): set a form's action/method,
add/label fields, success message. Routes to the FormBlock / FormsScreen store.
Validate field names + action URL (scheme allowlist).

### W8 — Animations / triggers (add-animation)
Canvas-ish command: add a fade/slide/scale animation (+ trigger: onLoad/onScroll/
onHover) to an element via the `editor/animation` engine. Allow-list animation
types + bounded durations.

### W9 — CMS / data-binding (bind-field)
Bind an element attribute/text to a CMS collection field via `engine/cms` +
`engine/data`. Validate the collection + field exist (feed the schema into prompt).
Highest complexity — depends on the CMS data model.

### W10 — E-commerce (add-commerce-element)
Insert product/cart/price elements via `editor/ecommerce`. Validate against the
store's product schema.

### W11 — Localization (set-locale / translate-page)
Set the page locale / request a translation pass via the LocalizationScreen +
localization engine (decision `LOC: A,A` — subdirectory URLs + JSON column).

### W12 — Component authoring (save-as-component) — SHIPPED 2026-06-06 (commit 37041445)
`save-as-component`: turn the selected element subtree into a reusable component
via `composer.components.createComponent`. Node-cap the subtree. Async.
DONE: element-scoped async command (defineAsyncCommand), reuses countNodes +
MAX_COMPONENT_NODES(200) cap (editor-side, server has no tree), name plain≤60.
14th command. Tests green. (Codex's full "props/slots/variants/versioning" product
area deferred — this is the thin slice: save a subtree as a flat component.)

### W13 — Site settings / SEO / redirects (set-site-setting)
Config command: site-wide meta, social links, redirects, head/body code (head/body
code = HIGH RISK — script injection; gate or exclude). Reuse the SiteSettings/
Redirects stores + their validation.

### W14 — AI as primary surface + adoption (the de-risking gate)
- Discoverability: surface AI/agent prominently (not a sub-toggle) — a top-level
  entry / command palette integration.
- **Adoption instrumentation** (the repo's own thin-slice gate + CEO/codex flag):
  log which commands users actually invoke + accept. **Recommended to land EARLY**
  (alongside W4) so the W7–W13 surface build is driven by real usage, not spec
  -ulation. Per-element AI competes with the inspector — measure before exhaustive
  expansion.

## Cross-cutting
- Command classes ride the existing seams: canvas (applyAiEdit, sync/async),
  config (validator carve-out, no elementId). New stores → new handlers, same
  registry pattern. Each command = union + validate + prompt-rule (agentCallable)
  + apply + tests + live-verify + codex-style guards.
- Registry pressure: ~20+ commands. Consider per-domain registry files if the
  single registry hurts.
- Cost: hosted-model key guard done; agent runs are per-call quota-metered + capped.
- Security recurring theme: every command that takes a URL/script/id needs an
  allowlist or registry-membership check (codex caught this 4×). head/body code +
  data: URIs + arbitrary schemes are the danger.

## Recommended approach
Incremental per workstream on the proven seams. **Reorder for de-risking:** W14
adoption instrumentation + W4 (theme, the marquee) FIRST; then let real usage
prioritize W5–W13. Do NOT big-bang all 10 surfaces blind.

## NOT in scope
- AI uploading binary files (W5) — references existing assets only.
- head/body custom code via AI (W13) — script-injection surface; gate or exclude.
- Native provider tool-use — rejected (P4); the plan loop scales.

## Tests + verify
Per command: server accept/reject (allowlist, registry-membership, value guards) +
editor schema + apply + applyAiEdit dispatch + unsafe-input skip; live-verify each
on free Ollama (incl. undo where it mutates state). Token-sync (W4) needs explicit
undo-visual live-verify.

## CODEX CHALLENGE (2026-06-05) — strategic correction (converges with CEO review + repo thin-slice plan)

Codex's verdict on this plan, kept verbatim-in-substance because it changes the shape:

1. **"100% parity" is the wrong target.** Users don't care that AI hits every UI
   surface — they care that it completes high-value jobs faster, with fewer
   reverts, and enough trust to publish. This optimizes coverage, not outcomes.
2. **Sequencing is wrong.** W14 instrumentation is the GATE, not an add-on. After
   W4 (tokens), STOP and measure. Building W7–W13 before knowing which jobs users
   try = shipping expensive dead surface area.
3. **The real missing work: a shared platform for privileged, async,
   non-undoable, schema-heavy AI actions** — permissions, confirmations, audit
   log, retries, failure states, locks, quotas, compensation. The "single-undo
   edit-command" model stops fitting at W6 (publish/forms/CMS/commerce/locale/
   site-settings). This platform is the work, not 10 parallel commands.
4. **Central trust-boundary policy** (not per-command ad-hoc validators):
   - **Prompt injection** explodes — asset/CMS/product/locale/redirect/component/
     metadata names are attacker-controlled strings fed back into prompts.
   - **One canonical URL policy** (scheme/host/path + normalization, per-surface)
     across form actions, social links, canonicals, redirects, image/commerce
     URLs, locale paths — not scattered validators.
   - **Capability-scoped IDs**, not raw ids reused everywhere (stale/alias/hidden).
   - **Retrieval/search, not prompt-stuffing** — large media/CMS/catalog/token/
     component inventories blow up context, latency, cost.
   - **Cost/abuse**: these surfaces force premium models; simple per-call quota is
     inadequate; translation/CMS/component/commerce are expensive + spammable.
5. **Each "command" is a product area**, not a command: Forms (spam/PII/compliance/
   delivery/CSRF), CMS (repeaters/queries/relations/states/draft-publish), commerce
   (variants/pricing/tax/inventory/cart/discounts), localization (routing/hreflang/
   SEO-dup/glossary), component authoring (props/slots/variants/versioning).
6. **W4 token fix is a patch** (React-hydration event-choreography) — if tokens
   mutate from multiple surfaces it becomes another stale-state/undo-bug source.
   Needs a stable token architecture, not just an event.
7. **Instrumentation must be task-level** (time-to-publish, revert rate, follow-up
   manual edits, survival of AI changes), NOT "which commands invoked" (vanity).
8. **"AI as primary surface" = a TRUST problem, not discoverability** (clearer
   previews, narrower approvals, understandable failures). Top-nav placement of a
   noisy/overreaching AI just increases exposure to failure.

### Revised recommendation (codex + CEO + repo all agree)
1. **W4 tokens** — but architected properly (stable token-set path, not just an event).
2. **Task-level adoption instrumentation.**
3. **STOP and MEASURE** which jobs users actually attempt.
4. Build the **shared privileged-action platform** + **central trust-boundary
   policy** BEFORE W6–W13.
5. THEN prioritized heavy surfaces (CMS/commerce/locale/forms/component-authoring)
   by real usage — each sized as a product area, not a command.

Do NOT big-bang 10 parallel command workstreams blind. That multiplies security +
cost without proving value.

## Estimated size
~10 workstreams, ~12–15 new commands + the token-sync feature + publish/adoption.
Multi-session. Each workstream independently shippable + testable on the seams.
