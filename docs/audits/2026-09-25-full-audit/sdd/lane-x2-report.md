# Lane x2 report — Form after-submit/honeypot/notify email; Slider playback+controls

Worktree: `/Users/shahg/Desktop/buildrik-x2`, branch `feat/x2`, rebased onto `fix/audit-2026-09-25` @ `389c495d6`.
Commit: `69a140577` (single commit — the two items share registry/profile files that don't split cleanly).

## Form — AFTER SUBMIT + PROTECTION (missing-features.md L2, 4428:141878)

Status: **built 69a140577**.

- Confirmed on main first: honeypot rejection (`submitForm` returning `{id:"honeypot"}` without a DB write) and rate limiting (`checkRateLimit` + `clientIp`) were already built — reused as-is, not rebuilt.
- New: `packages/shared/schemas/element-markup.ts` — `isDangerousUrl`/`safeRedirectUrlSchema` (didn't exist anywhere in the repo despite the brief citing it; built it since the redirect field needs it).
- Schema: `FormBlock.successAction` (MESSAGE|REDIRECT, default MESSAGE), `redirectUrl`, `spamProtection` (default true). Migration `prisma/migrations/20261001120000_form_block_after_submit/migration.sql`.
- Server: `forms.getBlock` / `forms.updateBlock` (router + service), authz via existing `guardSite`/`guardSiteRole`; `updateFormBlock` checks an existing row's `siteId` before writing (the id is globally unique, not scoped to siteId — closes a cross-site overwrite hole the upsert-by-id alone would have had).
- `submitForm` now returns `successAction`/`redirectUrl`/`successMessage`; the public route (`app/api/public/forms/[siteId]/[formBlockId]/route.ts`) redirects to `redirectUrl` when configured (re-checked against `isDangerousUrl` at send time — defense in depth) or shows the custom message.
- Notification email now prefers `FormBlock.notifyEmail`, falling back to the workspace owner (previously always the owner, ignoring any configured address — a real bug, fixed as part of this item). Still fire-and-forget (`.catch(() => {})`) — a send failure never loses the submission, which is already committed before the email attempt.
- `lib/publish-forms.ts`: `wireForms` now injects a hidden `_honeypot` field (gated by the block's `spamProtection`, default on) and a same-page success-message script (reads `?submitted=1&form=<id>`, swaps the form for its `data-success-message`) — only on pages that actually have a wired form.
- Inspector: new `FormAfterSubmitSection.tsx` ("After submit" section) — Action select, message/redirect field, notify email, spam-protection toggle. Registered as `form-settings` in the Element-tab registry, added to the `form` element profile after `form-fields`.

## Slider — PLAYBACK + CONTROLS (missing-features.md L2, 4428:142450)

Status: **built 69a140577**.

- `packages/editor/src/engine/export/sliderRuntime.ts` — the single source of truth for carousel behaviour (autoplay/interval, arrows, dots, `prefers-reduced-motion` via `matchMedia` in JS — a11y.css's `@media` rule is untouched, per lane-common). Idempotent (`data-bk-slider-init` guard), skips sliders with <2 slides.
- Canvas: `useSliderRuntime.ts` runs that same function directly against the canvas DOM (`dangerouslySetInnerHTML` never executes injected `<script>` tags, so canvas can't share a script string with the published page — documented in both files' headers).
- Published: `lib/publish-sliders.ts` — the identical logic serialized as a plain-JS string, injected once per page that has a `.buildrick-slider`, idempotent.
- Inspector: new `SliderPlaybackSection.tsx` ("Playback" section) — Autoplay toggle (reveals Interval 1–60s when on), Arrows toggle, Dots toggle; writes `data-autoplay`/`data-interval`/`data-arrows`/`data-dots` on the slider element. Registered as `slider-settings`, added to the `slider` profile after `slides`.
- Known gap, not fixed: the injected arrow/dot `<button>`s are plain DOM nodes inside the canvas's selectable subtree — a click on them may also fire the canvas's own element-selection handler. Small follow-up if it turns out to matter in practice.

## Tests

- `packages/shared/schemas/__tests__/element-markup.test.ts` (new)
- `__tests__/form-submission-service.test.ts` (extended: redirect/message passthrough, notify-email preference, `getFormBlockSettings`, `updateFormBlock` incl. cross-site refusal)
- `lib/__tests__/publish-forms.test.ts` (extended: honeypot on/off, success-message attribute, script injection)
- `lib/__tests__/publish-sliders.test.ts` (new)
- `packages/editor/src/engine/export/__tests__/sliderRuntime.test.ts` (new — jsdom, incl. fake-timer autoplay and reduced-motion)
- `packages/editor/src/editor/inspector/sections/__tests__/FormAfterSubmitSection.test.tsx` (new)
- `packages/editor/src/editor/inspector/sections/__tests__/SliderPlaybackSection.test.tsx` (new)

Commands run (touched files/dirs only, `--maxWorkers=2`):
- `npx vitest run` on all the files above from both `packages/editor` and repo root — 68 tests total, all passing.
- `npx tsc --noEmit -p packages/editor` — clean.
- `npx tsc --noEmit -p packages/dashboard` — clean.
- `node scripts/check-styling-ratchet.mjs`, `check-design-debt-ratchet.mjs`, `check-ds-ssot.mjs`, `conformance/check-anchors.mjs`, `conformance/check-copy.mjs` — all PASS, no new drift.

## What was NOT verified

- **No live/browser verification.** No dashboard dev server was running in this worktree and the lane brief said to skip live verify if load doesn't allow it — did not start one given the "resource rule" (machine load caution) in `lane-common.md`. Everything above is unit/router/service-level only.
- The published-page carousel script and the same-page form "show message" script have not been exercised in an actual browser (only via jsdom for the slider runtime, and string-assertions for the form script/honeypot markup).
- Did not re-verify the pre-existing honeypot/rate-limit behavior beyond reading the code and its existing passing tests (correctly scoped as "already built," per lane-common's "confirm current behaviour on main" step).

## Cross-lane edits

None outside the Form/Slider file set. Did not touch `AquibraStudio.tsx`, `PanelHeader.tsx`, or the Modal scrim.

## Concerns for the coordinator

- `packages/shared/schemas/element-markup.ts` (`isDangerousUrl`) was cited in the dispatch as if already existing; it did not. Built fresh, scoped to this task (scheme allow-list: http/https/mailto/tel + relative/#).
- ~~The two carousel-runtime copies ... are intentionally duplicated source~~ — superseded by Fix round 1 (I5): `lib/publish-sliders.ts` now imports the real function from `@buildrik/editor` instead of hand-copying it. See below.

## Fix round 1 (controller review)

Commit range: `69a140577..228ab8086` (5 commits, grouped by finding area — see `## Server-side rules` note below on why not 15 micro-commits).

- **❌ email failures swallowed** — fixed. `form-submission.service.ts`'s notify `.catch(() => {})` now logs via `console.error`, matching the codebase's existing best-effort-notify pattern (`activity-log.service.ts`, `review.service.ts`, `team.service.ts`). Test: mocks a rejected send, asserts the submission itself still succeeds and the failure is logged, not silent.
- **I1 (redirect never saves)** — fixed, both ends. Root cause was exactly as diagnosed: the inspector sent only the changed field, and `successAction: "REDIRECT"` alone fails `updateFormBlockSchema`'s refine (needs `redirectUrl` in the same payload) — the UI updated optimistically regardless, so it looked saved. Fix: `save()` in `FormAfterSubmitSection.tsx` now bundles `successAction` + `redirectUrl` together whenever either is touched (using the freshest known value of the other), and skips the network call entirely for the one genuinely incomplete state (REDIRECT just picked, no URL typed yet) instead of firing a call that will be rejected. Also added defense-in-depth in `submitForm` (falls back to MESSAGE if a REDIRECT row somehow has no usable absolute URL) and a schema-level regression test (`packages/shared/schemas/__tests__/forms.test.ts`) that parses the real payload shapes.
- **I2 (relative redirect → 500)** — fixed. New `isAbsoluteHttpUrl`/`absoluteRedirectUrlSchema` in `element-markup.ts` (the old `isDangerousUrl`/`safeRedirectUrlSchema` correctly allow relative/`#` for an `href`, wrong for a redirect target). `FormBlock.redirectUrl` now validated against the new schema at write time; the public route re-checks `isAbsoluteHttpUrl` before calling `NextResponse.redirect`, falling through to the message behaviour otherwise.
- **I3 ("show message" only works on home page)** — fixed. Every wired form now carries a hidden `_return` field, filled with `location.href` by the same page script that handles the success-message swap. The server validates it against the site's own resolved origin (`resolveSiteOrigin` — canonicalUrl / verified domain / Vercel project, the exact same resolution the publish worker uses) before trusting it, and the route prefers it over `Referer` (which is origin-only cross-origin under the default `strict-origin-when-cross-origin` policy — confirmed that was the actual mechanism). A malformed `Referer` now falls through cleanly instead of throwing.
- **I4 (notifyEmail role + owner copy)** — fixed. `forms.updateBlock` requires ADMIN when the payload touches `notifyEmail` (same precedent cited: `account.ts` integrations.add), every other field stays EDITOR-writable — proven by a test that edits spam-protection right after a notify-email FORBIDDEN. The client reverts the optimistic edit and shows "Only workspace Admins can change the notification email." (needed a remount token since the field is an intentionally-uncontrolled input). Notification now always copies the workspace owner in addition to `notifyEmail`, deduped when they're the same address.
- **I5 (canvas slider + published-script duplication)** — fixed. `initSliderRuntime` takes an options object now (`autoplay` override, `getInitialIndex`/`onIndexChange` keyed by the slider's own element id); the canvas hook forces autoplay off (arrows/dots still work) and persists the shown slide index in a ref across re-renders (the canvas replaces the whole subtree on every content change via `dangerouslySetInnerHTML`, which previously snapped every slider back to slide 1). Cleanup now actually removes the injected arrows/dots/dots-wrap and the init marker. The misleading "can't share source across the workspace boundary" premise was wrong — confirmed `packages/dashboard/package.json` already has `@buildrik/editor: workspace:*` and `next.config.mjs` already transpiles it — so `lib/publish-sliders.ts` now imports `initSliderRuntime`/`SLIDER_RUNTIME_CSS` directly and serializes via `Function.prototype.toString()`, eliminating the hand-copied duplicate. Two small plumbing fixes were needed for this to actually resolve: a `@buildrik/editor/*` path-alias entry in `packages/dashboard/tsconfig.json` (the package's `./src/*` export wasn't resolving under `bundler` moduleResolution without an explicit path) and the same alias in root `vitest.config.ts` (root-level tests have no node_modules symlink for it, only `packages/dashboard/node_modules` does — same situation `@buildrik/shared` already needed an alias for). Added a jsdom "parity" test that extracts the actual injected `<script>` body and runs it via `new Function(...)` against a real DOM, proving the serialize step didn't lose behaviour, not just that the two references are `===`.
- **Minors fixed:** M1 (stopPropagation on every injected arrow/dot control), M2 (CSS.escape the `?form=` query value before it reaches a selector string, with a manual fallback), M5 (interval input is now a local draft, clamps/commits on blur only — clamping every keystroke fought retyping), M6 (accessible names via `aria-labelledby` on every ToggleSwitch that had none — flowbite's own `label` prop renders nothing when omitted), M7 (new `FormError` domain class mirroring `CmsError`, replacing string-sentinel `Error("FORM_NOT_FOUND")`; `updateFormBlock`'s Prisma create/update payloads properly typed — the old `...data` spread into a Create input silently widened `id`/`blockId`/`name` to Prisma's Update-operations union, which is what produced the original TS errors when I typed it), M8 (deduped `publish-forms.ts`'s local `escapeAttr` against the identical one in `publish-html.ts`; `route.ts`'s `escapeHtml` (text-content, 5-char set incl. apostrophe) was left separate from `cms.service.ts`'s private unexported one (attribute-adjacent, 4-char set, different escaping domain) — judged not a true duplicate worth an awkward cross-service export, flagging here rather than silently skipping).
- **Deferred, as instructed (note only):** M3 (honeypot field naming), M4 (republish hint), M9 (site CSP blocking inline scripts — both the slider runtime and the form success-message script are inline `<script>`s; if a site sets a strict CSP this whole line of fixes could be silently inert on that one site), M10 (pre-publish id squatting).

Tests this round: 5 test files touched, all passing — `__tests__/form-submission-service.test.ts` (+9 tests: returnUrl validation, redirect fallback, email-failure logging, owner-copy × 3 variants), `packages/shared/schemas/__tests__/forms.test.ts` (new, 6 tests), `packages/shared/schemas/__tests__/element-markup.test.ts` (+`isAbsoluteHttpUrl`/`absoluteRedirectUrlSchema` cases), `lib/__tests__/publish-forms.test.ts` (+3), `lib/__tests__/publish-sliders.test.ts` (+1 parity test), `FormAfterSubmitSection.test.tsx` (+5), `SliderPlaybackSection.test.tsx` (+3), `sliderRuntime.test.ts` (+5). 90 tests total in the touched files, all green. `tsc --noEmit -p packages/editor` and `-p packages/dashboard` both clean. Editor DS gates (styling-ratchet, design-debt-ratchet, ds-ssot) re-run green; did not re-run the slow `check-anchors`/`check-copy` scripts this round (confirmed green after the first pass, and round 1 touched no shipped copy lines or testids).

Still not live-verified — same constraint as the first pass (no dashboard dev server running, machine-load rule).

## Rebase — SSOT with lane L2's shared URL guard

Rebased `feat/x2` onto `fix/audit-2026-09-25` @ `0431517b8` (L2 landed `packages/shared/schemas/element-markup.ts` as the shared allowlist-sanitizer module — `ALLOWED_ELEMENT_TAGS`, `isSafeCssDeclaration`, `isSafeCssSelector`, etc., plus its own `isDangerousUrl`, consumed by `lib/sanitize-blocks.ts`). New range: `0431517b8..b354dd792` (6 commits — same 5 round-1 groups plus the original build commit, all replayed).

Conflicts were in the 2 commits that touch `packages/shared/schemas/element-markup.ts` / its test file / `forms.ts` (my original build commit and the round-1 `absoluteRedirectUrlSchema` commit) — resolved during the rebase itself, at the commits where they belong, rather than as a follow-up patch:

- Deleted my own `isDangerousUrl`/`safeRedirectUrlSchema` re-implementation entirely (both duplicated the scheme-allowlist logic L2's version already owns in the same file). Kept L2's version as the one `isDangerousUrl` in the codebase.
- Kept my `isAbsoluteHttpUrl`/`absoluteRedirectUrlSchema` — a genuinely different, additive rule (redirect targets need an absolute URL; `isDangerousUrl` correctly allows relative/`#`/`mailto:`/`tel:` for an `href`, which is the right call for its own callers) — and pointed its refine at L2's `isDangerousUrl` instead of my deleted copy.
- **Semantics did differ, and I kept the stricter behaviour by composing, as instructed**: L2's `isDangerousUrl("file:///etc/passwd")` is `false` (it only flags `javascript:`/`vbscript:`/non-image `data:`, not `file:`) — my deleted copy flagged `file:` as dangerous. `absoluteRedirectUrlSchema` still refuses `file:` URLs regardless, because `isAbsoluteHttpUrl` allowlists only `http:`/`https:` protocols — the strictness lives in the "absolute http(s) only" rule, not in `isDangerousUrl`, so nothing was lost. Added a regression test pinning exactly this (`"stays stricter than the shared isDangerousUrl alone"`).
- Every consumer (`lib/sanitize-blocks.ts` unchanged, `server/services/form-submission.service.ts`, `packages/dashboard/app/api/public/forms/.../route.ts`, `packages/shared/schemas/forms.ts`) now imports from the one `@buildrik/shared/schemas/element-markup` module path — confirmed by grep, no second definition anywhere.
- `packages/shared/schemas/__tests__/element-markup.test.ts` now carries both suites (L2's CSS-declaration/selector/media-query/element-id/style-escape tests plus mine) in one file, since that's the one shared test file for the one shared module now.

No separate `refactor: x2 — use the shared isDangerousUrl` commit exists: the unification happened as part of resolving the rebase conflicts in the two commits that already touched this file, so those commits (`0af70c821` and the ones before it) directly contain the deduped version rather than adding it and then removing my copy in a follow-up patch. Working tree is clean after the rebase — there was no leftover diff to commit separately. If a discoverable marker commit is still wanted over rewriting history again, say so and I'll add one.

Verification after rebase: `npx vitest run` on all 5 touched shared/server/lib test files together — 167 tests passed (up from 58, since `element-markup.test.ts` now also carries L2's own CSS/selector suite in the same file); editor's 4 touched test files — 32 tests passed; `lib/__tests__/sanitize-blocks.test.ts` (L2's own, unrelated to my changes but depends on the same shared module) — 44 passed, confirming no regression. `npx tsc --noEmit -p packages/editor` and `-p packages/dashboard` both clean.

## Fix round 2

Commit range: `b354dd792..2465c36ee` (5 commits, one per finding).

- **Finding 1 (notifyEmail blur-save + ADMIN gate on no-op writes)** — fixed. `FormAfterSubmitSection.tsx`'s `save()` now skips the network call entirely when the patch equals the current settings (`valuesEqual`, normalizing `""`/`null`/`undefined` as the same "unset" value) — a blur that changed nothing sends nothing. `forms.updateBlock` router now fetches the stored `notifyEmail` and only requires ADMIN when the incoming value actually differs from it (same normalization), not merely when the field is present in the payload — an EDITOR saving spam-protection (which bundles no notifyEmail change) or blurring the field untouched no longer hits FORBIDDEN. Test: EDITOR blur without change → no call (client) / no ADMIN guard call (router); EDITOR changing it → FORBIDDEN; ADMIN change → saved; brand-new row still requires ADMIN.
- **Finding 2 (stale sliderRuntime test header)** — fixed, docs only. Header now says the published copy is imported + `toString()`-serialized, not hand-copied (matches round-1 I5).
- **Finding 3 (Referer open-redirect fallback)** — fixed. `submitForm` now takes an optional `refererHeader` and validates it against the exact same site-origin check as `returnUrl` (`safeUrlOnOrigins`, renamed from `safeReturnUrl` since it now serves both), returning `refererUrl`. New `resolveSiteOrigins` (`lib/publish-urls.ts`) widens the check beyond the single "preferred" origin `resolveSiteOrigin` picks — verified custom domain AND the `*.vercel.app` project URL, apex+`www` — so `_return`/Referer keep validating when a site is reachable from more than one origin (no schema change). The route no longer reads `req.headers.get("referer")` directly; it uses `result.refererUrl`, and falls back to `result.siteOrigin` (the site's own resolved origin root) when neither `returnUrl` nor `refererUrl` validates, instead of silently trusting an attacker-controlled Referer. Test: attacker Referer → route asserts the 303 `Location` never contains the attacker host and instead lands on the site's own origin.
- **Finding 4 (CHANGELOG corrections)** — fixed, docs only. Redirect-URL entry now says "absolute http(s) URL" (not just `isDangerousUrl`-checked); notify-email entry now says the configured address AND the owner are always both copied (not "falls back to").
- **Finding 5 (owner-copy dedup case sensitivity)** — fixed. The notify-email recipient dedup now lowercases both sides before comparing, so `notifyEmail: "Same@Example.com"` and an owner email `"same@example.com"` collapse to one send instead of two.

Tests this round: `packages/editor/src/editor/inspector/sections/__tests__/FormAfterSubmitSection.test.tsx` (+1), `server/trpc/routers/__tests__/forms.test.ts` (new, 5 tests), `__tests__/form-submission-service.test.ts` (+4: case-insensitive dedup, Referer validation ×2, siteOrigin fallback), `lib/__tests__/publish-urls.test.ts` (+4, `resolveSiteOrigins`), `packages/dashboard/app/api/public/forms/[siteId]/[formBlockId]/route.test.ts` (new, 4 tests — this route had no test file before). 71 tests total across the touched files, all green (`--maxWorkers=2`).

Commands run: `npx vitest run` on each touched file individually while red/green, then all 5 together (71 passed); `npx tsc --noEmit -p packages/editor` clean; `npx tsc --noEmit -p packages/dashboard` clean; `node scripts/check-styling-ratchet.mjs` / `check-design-debt-ratchet.mjs` / `check-ds-ssot.mjs` (editor DS gates — `FormAfterSubmitSection.tsx` is chrome-ui-adjacent) all PASS, no new drift. `verify:ds`'s full chain was not run (no `verify:ds` script at repo root; the editor-local one chains ~11 steps including the slow anchor/copy/board conformance scripts — ran the same targeted subset round 1 used instead, per the resource rule).

## What was NOT verified (round 2)

- No live/browser verification — same constraint as round 1 (no dashboard dev server running, resource rule). The Referer/redirect fix (finding 3) is proven by a router-level test asserting the `Location` header, not by an actual browser form POST.
- Did not re-run `check-anchors.mjs`/`check-copy.mjs`/`check-boards.mjs`/`check-hex-drift.mjs` this round — no shipped copy, testids, or board-visual changes in this round's diff (all changes are logic/validation/docs).

Fix round 2
