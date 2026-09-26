# Lane Lfinal report

Worktree: `/Users/shahg/Desktop/buildrik-af-Lfinal`, branch `fix/audit-Lfinal`,
base `bda180a95`. Round 1 commit range: `bda180a95..fc14266f5` (7 commits).

```
161232dcd fix(editor): use --bk-error instead of undefined --bk-danger token
b42cfd3ff fix(reviews): S-7 — reviews.submit wraps submitReview in translateReviewError
ded940beb fix(forms): route updateBlock's notifyEmail diff check through a service function
77ae10099 chore(comments): drop process-history narration from arc-added comments
1e7e6965f fix(sanitize): cover <object data> URLs and cap stripMarkup's iteration loop
62cd73f6e fix(editor): type CommandPalette's "ai" nav target without an as cast
fc14266f5 fix(editor): cap version rename input at 200 chars, test readOnly no-op
```

## ROUND 2 (fix round 1 on the review verdict CHANGES_REQUIRED)

Commit range: `fc14266f5..484ff64c2` (4 commits, includes the merge commit):

```
6f119af0d Merge branch 'fix/audit-2026-09-25' into fix/audit-Lfinal
ba997d8af fix(sanitize): C1 CRITICAL — stripMarkup's fixed-pass cap fails open
484ff64c2 chore(comments): M3 — re-sweep narration after the Lrt/Ldata merge
```

### STEP 0 — merge fix/audit-2026-09-25 (Lrt + Ldata)

`git merge fix/audit-2026-09-25` (HEAD `0cb9e5c1f`) produced exactly the 3
expected conflicts, resolved as instructed:

- `server/services/form-submission.service.ts`: took Ldata's version,
  deleted `getStoredNotifyEmail` — Ldata's `getFormBlockSettings` now reads
  `prisma.formBlock.findUnique({ where: { siteId_blockId: { siteId,
  blockId } } })` (composite key; `id` is a surrogate post-Ldata).
- `server/trpc/routers/forms.ts`: took Ldata's version verbatim, including
  its import list (which drops `FormError` too — Ldata's `updateBlock` no
  longer has a try/catch around `updateFormBlock`, so `FormError` was
  unused; matched Ldata's actual file exactly rather than guessing). Kept
  my comment cleanup — verified `(fix, finding 1)` in the surviving comment,
  not `fix round 2, finding 1` (later fully cleaned by M3, see below).
- `server/trpc/routers/__tests__/forms.test.ts`: took Ldata's version
  (which mocks `prismaMock = {}`, an empty object, as its own proof nothing
  touches Prisma) and ported my "never through ctx.prisma" test as a new
  case asserting `svc.getFormBlockSettings` was called with `("s1","f1")`
  and `(prismaMock as any).formBlock` is `undefined`.

`npx prisma generate --schema prisma/schema.prisma`: succeeded (Prisma
Client v5.22.0 regenerated).

Confirmed `FormAfterSubmitSection.tsx` still uses `--bk-error`, not
`--bk-danger` (line 241) — the merge auto-resolved this file cleanly, no
conflict.

### C1 CRITICAL — stripMarkup's cap fails open

**Reproduced the fail-open exactly as directed:** built
`<img src=x onerror=alert(1)>`, applied `.replace(/</g,'<<i>')` 10 times,
ran it through the OLD capped `stripMarkup` (isolated in a throwaway script
using the real `isomorphic-dompurify`) — confirmed it decodes back to the
literal, live `<img src=x onerror=alert(1)>` after exactly 10 passes and
the capped loop returns it untouched (`/<img/i` test: `true`).

**Fix:** removed `STRIP_MARKUP_MAX_ITERATIONS` and the `for` cap, restored
`for (;;)` (unbounded while-changed). Added the fail-closed backstop:
`return text.replace(/[<>]/g, "")` after the loop converges — any leftover
angle bracket in a truly-converged fixed point is stripped outright, since
a fixed point that still contains one cannot be told apart from unparsed
markup.

**Known, accepted side effect:** this means a literal `<` or `>` typed into
CMS text content no longer round-trips byte-for-byte (only `&` does
losslessly now). The existing pinning test ("x4: stores text as typed")
asserted byte-for-byte round-tripping of `Tom & Jerry <3` / `Say "hi" > bye`
— updated its expectations to the post-backstop values (`Tom & Jerry 3` /
`Say "hi"  bye`, angle brackets removed) rather than leaving it red, since
this is the new INTENDED behavior per the fix, not a regression. Flagging
this explicitly since it's a real fidelity trade-off the controller should
be aware of, not something I'd normally silently accept.

**Test:** replaced the old mocked-DOMPurify "bounded passes" test (which
only proved the cap's own existence) with a real-DOMPurify test using the
exact nested payload from the instructions, asserting `stored` does not
match `/<img/i`. Confirmed red against the CAPPED code (same throwaway
script above, run inline in the test file's own vitest environment before
applying the fix — red for the right reason: `/<img/i` matched). Green
after the fix. Removed the now-dead `isomorphic-dompurify` Proxy mock
scaffolding from `cms.service.test.ts` (nothing else used it).

### M1 — data:text/html case

Added `strips a data: URL in <object data="..."> that is not an image (a
whole navigable HTML document)` next to the `javascript:` case in
`lib/__tests__/sanitize-blocks.test.ts:563` — asserts
`data:text/html,<script>alert(1)</script>` does not survive. `isDangerousUrl`
already treats any non-`data:image/` URL as dangerous, so this passed
without a code change; confirms the M1 case, doesn't just duplicate the
`javascript:` one.

### M2 — VERSION_NAME_MAX SSOT

Exported `VERSION_NAME_MAX = 200` from
`packages/shared/schemas/site-version.ts`, used it in both
`createSiteVersionSchema` and `renameSiteVersionSchema` (previously both
hand-wrote `.max(200)`), and imported it in `VersionList.tsx` in place of
the hardcoded `maxLength={200}` from round 1.

### M3 — narration re-sweep across the whole branch vs main

Ran `git diff --name-only main...HEAD` (1818 `.ts`/`.tsx`/`.css` files) and
grepped for the round's expanded pattern list: `fix round`, `(fix)`,
`Fix (L`, `controller`, `finding \d`, `CRITICAL N\d`, `MINOR \d`, `review
round`. This is a MUCH broader net than round 1's item 4 (which only
targeted `round N` shapes and left ID-style references like `CRITICAL N1`,
`(fix)`, `(controller ruling)` alone) — this round strips those too.

Classified every match:
- **Pre-existing (left alone, verified against `main` via
  `git show main:<file> | grep`):** 1 line, `useDiscoveryState.ts:29`
  ("codex finding 3").
- **Domain usage (left alone):** the client-review feature's own "round"
  concept (`RoundHistoryModal`, `reviews.currentRound`, "Round 2 of 3" UI
  copy, `ReviewTab.tsx`, `PublishConfirmFacts.tsx`, `probe.tsx`,
  `activity-log.service.ts`, `publish.service.approval.test.ts` — all
  describe an actual product feature, not a review pass), `controller` as
  an `AbortController`/`ReadableStream` parameter name (`stock.service.ts`,
  SSE routes, `useDiscoveryState.ts`), and one legitimate "left to the
  controller's runtime check" note in `d11-list-sites-traffic.db.test.ts`
  describing what that DB test does NOT cover (kept — this is the same
  category as a "not verified" disclosure, not process narration).
- **Real narration (cleaned):** ~35 files — new instances Lrt/Ldata added
  in files round 1 never touched (`__tests__/auth-config.test.ts`,
  `__tests__/db/*.db.test.ts` ×4, `__tests__/ai-router.test.ts`,
  `__tests__/plan-gating.test.ts`, `__tests__/publish-service.test.ts`,
  `__tests__/save-project-styles-sanitize.test.ts`,
  `__tests__/site-detail-service.test.ts`, `form-submission-service.test.ts`,
  9 dashboard label-test docstrings), plus round-1-cleaned files that needed
  a second, stricter pass under this round's wider pattern list
  (`server/auth.config.ts` ×5 more spots, `useStudioState.ts`,
  `useClipboardToasts.ts`/`.test.tsx`, `CommandPalette.test.tsx` ×2,
  `useStudioState.test.ts` ×2, `element-markup.test.ts`,
  `cms.service.test.ts`, `auth.service.ts` ×2, `reviews.test.ts`).
- **One real bug found and fixed while re-reading round 1's own output:**
  `client-review.service.ts` had a garbled leftover from round 1's
  automated regex pass — `"...workspace (controller review\nthe original
  check only covered..."` (a dangling open-paren with no matching close,
  from a regex that ate "round 1:" but not "controller review"). Rewrote as
  one clean sentence with an em-dash instead of the broken parenthetical.

No code changes in this item — comment/test-title text only, confirmed by
`git diff --stat` showing only the files above and no non-comment lines in
any diff hunk (spot-checked with `git diff` per file before committing).

### Gate evidence (round 2)

- `npx tsc --noEmit -p packages/dashboard`: **0 errors**.
- `npx tsc --noEmit -p packages/editor`: **0 errors**.
- `npx vitest run --maxWorkers=2` via xargs, split editor/non-editor, over
  every file touched across BOTH rounds (`git diff --name-only
  fc14266f5..HEAD` ∪ working-tree diff, test files only), **excluding**
  `*.db.test.ts` (controller runs those) — 63 files:
  - non-editor (36 files): **530/530 pass**.
  - editor (27 files): **429/429 pass, 1 pre-existing todo** (not a skip
    from this round's changes).
- `pnpm run verify:ds` (`packages/editor`), foreground, 600s timeout:
  **exit 0**, no FAIL/✗ lines.
- `bash packages/dashboard/scripts/ds-grep-gates.sh`: **7/7 PASS**.
- `git status --short`: clean (0 lines) — everything committed.

### What was NOT verified (round 2)

- `test:db` was explicitly NOT run per instructions (controller runs it) —
  this includes the 8 `.db.test.ts` files touched by this round's diff
  (`auth-config-account-first`, `cms-bindings-persist`,
  `d11-list-sites-query-count`, `duplicate-site-forms`,
  `form-block-dedupe-migration`, `form-block-site-scope`,
  `s5-signup-reclaim`, `s9-site-scope-lists`), several of which had
  comment-only edits from M3 and one (`s9-site-scope-lists`) is directly
  relevant to the Ldata merge this round pulled in.
- No live-app verification of the merged Ldata/Lrt behavior (FormBlock
  site-scoped identity, CMS bindings persistence) — that's the integration
  lane's own surface, not something this lane re-verified beyond making
  its own conflict resolution consistent with Ldata's code.
- The M3 sweep's pattern list is still heuristic, not exhaustive — it
  targeted the 7 literal patterns given, not every conceivable phrasing of
  self-referential process narration.

## Item 1 — BLOCKING: verify:ds / ds-grep-gates

**Fix:** `packages/editor/src/editor/inspector/sections/FormAfterSubmitSection.tsx:240`
referenced `--bk-danger`, which has no fallback in `tokens.generated.css`.
Checked sibling error-tone text across the inspector/settings surfaces
(`SettingsTab.tsx`, `AdvancedScreen.tsx`, `shared.tsx`, `FormsScreen.tsx`,
`RedirectDialog.tsx`, `AddDomainDialog.tsx`) — all use `--bk-error`. Swapped
`--bk-danger` → `--bk-error`. Commit `161232dcd`.

**Gate-by-gate, full chain (`pnpm run verify:ds`, foreground, exit 0):**
`check-hooks` PASS, `seam-scan` WARN-mode informational (unrelated
pre-existing UP counts: `listeners-without-emitter` 9/baseline 4,
`discarded-props` 20/baseline 12 — not touched by this lane, WARN-mode only,
does not fail the chain), `verify-design-baselines` PASS,
`ds-grep-gates.sh` (editor) PASS, `check-ds-ssot` PASS, `check-token-resolution`
PASS (168 tokens resolve, 10 pre-existing fallback-only warns unrelated to
`--bk-danger`), `check-anchors` PASS (1126/1126), `check-boards` PASS,
`check-hex-drift` PASS (0 new drift), `check-copy` PASS, `check-tsc-baseline`
PASS (editor 0, dashboard 0), `gate:tokens-generated` PASS (WARN on 3
pre-existing raw-hex CSS files, unrelated), `gate:vibcoder-ratchet` PASS,
`gate:editor-ui-gone` PASS, `gate:chrome-ui-surface` PASS,
`gate:styling-ratchet` PASS, `gate:buildrick` PASS, `gate:design-debt-ratchet`
PASS, `gate:narrow-control-padding` PASS.

No gate was red for a reason outside this branch's changes — the only real
failure found (`check-token-resolution` on `--bk-danger`) was fixed, not
loosened. Ran twice (once at the start of the lane, once again just now in
the foreground per the controller's request) — both exit 0.

`bash packages/dashboard/scripts/ds-grep-gates.sh`: 7/7 PASS (D1–D7), run
twice, same result both times.

**Tests:** none needed (pure token-name swap, no behavior change; covered by
`verify:ds`'s own token-resolution gate).

## Item 2 — S-7: reviews.submit 500 instead of 400

**Bug:** `server/trpc/routers/reviews.ts`'s `submit` mutation called
`submitReview()` unwrapped. `submitReview` throws `ReviewError("BAD_REQUEST",
...)` on a self-invite (clientEmail matching the caller's own email or a
workspace member's), but nothing translated it, so it surfaced as
`INTERNAL_SERVER_ERROR` — every other mutation in this router already routes
through `translateReviewError`.

**Fix:** wrapped the `submitReview(...)` call in `try { ... } catch (e) {
translateReviewError(e); }`, matching `resolve`'s existing pattern. Commit
`b42cfd3ff`.

**Test:** `server/trpc/routers/__tests__/reviews.test.ts` — new case "submit
translates a ReviewError from submitReview (self-invite, S-7) into
BAD_REQUEST, not a 500". Confirmed red first (asserted `BAD_REQUEST`, got
`INTERNAL_SERVER_ERROR`), then green after the fix.

**Run:** `npx vitest run server/trpc/routers/__tests__/reviews.test.ts
--maxWorkers=2` → 22/22 pass (re-run in this session's final sweep as part of
the 29-file server/dashboard batch, 401/401 pass).

**Not verified:** the `runtime_check` (actually submitting a review with a
self/member email through the running app and observing the 400 in the
browser network tab) — this is a router-level unit test only; no browser
session was used in this lane.

## Item 3 — Layering: forms.ts touching Prisma directly

**Bug:** `server/trpc/routers/forms.ts`'s `updateBlock` mutation called
`ctx.prisma.formBlock.findUnique({ where: { id } })` directly to decide the
`notifyEmail` ADMIN gate — a router touching Prisma, against the
Page → Router → Service → Prisma chain. The lookup was also NOT scoped by
`siteId` (id-only), a smaller pre-existing bug this fix also closes.

**Fix:** added `getStoredNotifyEmail(siteId, blockId)` to
`server/services/form-submission.service.ts` (scoped by both id and siteId),
and pointed the router at it instead of `ctx.prisma`. Commit `ded940beb`.

**Test:** `server/trpc/routers/__tests__/forms.test.ts` — rewrote the 5
existing cases to mock `svc.getStoredNotifyEmail` instead of
`prismaMock.formBlock.findUnique` (which the router no longer calls), and
added a new case: "reads the stored notifyEmail through the service, never
through ctx.prisma directly", asserting `prismaMock.formBlock.findUnique` is
never called and the service is called with `("s1", "f1")`.

**Run:** `npx vitest run server/trpc/routers/__tests__/forms.test.ts
--maxWorkers=2` → 6/6 pass. Also ran
`__tests__/form-submission-service.test.ts` (25/25 pass) to confirm no
regression in the service's other consumers.

## Item 4 — Comment hygiene: process-history narration

**Method:** grepped `packages/editor/src`, `server`, `lib`,
`packages/dashboard`, `packages/shared` for `round N` / `fix round` /
`review round` / `controller review` patterns (both narrow and broad passes —
the first grep undercounted; a second pass with `\bround[- ]?[0-9]` caught
more, e.g. `Round 2 fixed...`, `round-1 fix`, `D-10 fix-round-1`). For every
match, checked whether the line/phrase existed in the arc's base commit
(`b130ea04b`, the commit before the first `audit lane` merge) via
`git show <base>:<file> | grep -F <text>` — 14 lines across 9 files predate
this arc and were left untouched (`chrome-reset.css`/`.test.ts`,
`SelectRow.test.tsx`, `InputWithUnit.test.tsx`, `selectTheme.ts`,
`tw-setup.test.tsx`, `client-review.round.test.ts`,
`signoff-parity.test.tsx` ×3, `flowbiteStore.prefix.test.tsx` ×2).

Distinguished SDLC narration (removed) from the client-review feature's own
"round" domain concept — `reviews.currentRound`, `RoundHistoryModal`,
"Round 2 of 3" UI copy, `roundNumberOf`, test assertions on rendered "Round
3" text — which is a real product concept, not narration, and was left
alone (e.g. `ReviewTab.tsx`, `RoundHistoryModal.tsx`, `client-review.service.ts`,
`review.service.ts`'s bug-history prose using "round 1"/"round 2" as concrete
domain instances, `signoff-parity.test.tsx`).

91 files changed — mechanical regex-based first pass (three iterations; the
first two had bugs: one nuked every trailing comma file-wide via an
unscoped cleanup regex, caught before commit and reverted with `git
checkout`; the second ate unrelated `()` on lines with a coincidental match
elsewhere). Every resulting diff line was read by hand; ~10 required manual
correction (multi-line parenthetical splits, `describe()`/`it()` string
titles that needed rewording rather than pure deletion to stay
grammatical, e.g. "the four live bypass shapes of round 1's regex detector"
→ "...of the earlier regex detector").

**Commit:** `77ae10099`.

**Verification:** ran every touched `.test.ts(x)` file (66 files, split
editor/non-editor for the resource rule) — 399 + 639 pass, 0 fail. `tsc
--noEmit` on both `packages/editor` and `packages/dashboard` — 0 errors
each (comment-only + test-title changes, so no type-level risk expected, but
ran anyway since test titles are code).

**Not verified:** an LLM read of every one of the ~140 touched lines is not
the same as a second human reviewer; the controller should spot-check a
sample, especially `server/auth.config.ts` (5 edits in dense security
comments) and `lib/sanitize-blocks.ts`/`server/services/cms.service.ts`
(both also touched in item 5 — read together).

## Item 5 — sanitize-blocks.ts: `<object data>` + stripMarkup iteration cap

**Bug 1:** `sanitizeGeneratedPageHtml`'s `attributeHook` force-keeps every
attribute not explicitly dropped. It checked `URL_ATTRIBUTES` (href, src,
srcset, action, formaction, poster, xlink:href) for a dangerous scheme, but
NOT `data` — `<object data="javascript:alert(1)">` survived force-keep
untouched.

**Fix:** added a pass-local `GENERATED_PAGE_URL_ATTRIBUTES = new
Set([...URL_ATTRIBUTES, "data"])` in `lib/sanitize-blocks.ts`, used only in
this function (did NOT widen the shared `URL_ATTRIBUTES` SSOT in
`packages/shared/schemas/element-markup.ts`, since the blocks-tree sanitizer
that also consumes it has a different, narrower allowlist and widening it
there was out of scope / a different decision).

**Test:** `lib/__tests__/sanitize-blocks.test.ts` — new case "strips a
dangerous URL in `<object data=\"...\">`". Confirmed red first
(`<object data="javascript:alert(1)">` passed through unchanged), green
after the fix.

**Bug 2:** `cms.service.ts`'s `stripMarkup` looped `for (;;)` until
DOMPurify's output stopped changing, with no bound — defense-in-depth gap
against a pathological input that never converges.

**Fix:** capped at `STRIP_MARKUP_MAX_ITERATIONS = 10`, returns the
last-computed text if the cap is hit rather than looping forever.

**Test:** `server/services/__tests__/cms.service.test.ts` — new case
"stripMarkup stops after a bounded number of passes...". Mocked
`isomorphic-dompurify`'s `sanitize` via a `Proxy` (preserving every other
method real callers use, e.g. `.addHook` used by `sanitizeGeneratedPageHtml`
in the same file's other tests) with an override that returns different
text every call, forcing non-convergence. Confirmed red first: without the
cap, running the old `for (;;)` against this mock hung the test runner
(had to be killed via `timeout 15`, which is the expected symptom of an
infinite loop, not a normal test failure) — this is stronger evidence than
a clean red assertion failure, since it demonstrates the actual production
risk. Green after the cap (asserts `call <= 10`).

**Commit:** `1e7e6965f`. Also folded in a trivial item-4-shaped fix to the
SAME test file discovered while adding this test: `describe("CSV import
(fix-all round, 2026-09-25)", ...)` → `describe("CSV import", ...)` (and
its non-test counterpart in `cms.service.ts`'s own `// ── CSV import ──`
header comment) — narration this arc added, missed by item 4's grep because
it didn't match `round N`.

**Run:** `npx vitest run lib/__tests__/sanitize-blocks.test.ts
server/services/__tests__/cms.service.test.ts --maxWorkers=2` → 106/106
pass. `tsc -p packages/dashboard` → 0 errors (this code is server-side,
under the dashboard tsconfig).

**Not verified:** did not widen this to every other place `URL_ATTRIBUTES`
or a similar attribute-allowlist is consumed (e.g. the blocks-tree
sanitizer's own `unsafeAttributeReason` in
`packages/shared/schemas/element-markup.ts`) — the brief scoped this
specifically to `sanitizeGeneratedPageHtml`, and the blocks-tree sanitizer's
own tag/attribute allowlist likely already refuses `<object>` outright
(different threat model, not audited here).

## Item 6 — CommandPalette `"ai" as GroupedTabId` cast

**Fix:** widened `NAV_TAB_TARGET`'s value type from
`Partial<Record<string, GroupedTabId>>` to `Partial<Record<string,
GroupedTabId | "ai">>`, removing the `as GroupedTabId` cast. At the one call
site, handled `"ai"` explicitly: since `"ai"` is deliberately not a member
of `VIEWER_TABS` (per the existing doc comment — it shares the same gate
semantics without being a real rail tab), a VIEWER now skips the row via an
explicit `if (target === "ai") { if (viewerChrome) continue; }` branch
instead of routing through `isTabAllowedForViewer`, which is typed to take a
real `GroupedTabId` only.

**Commit:** `62cd73f6e`.

**Test:** no new test needed — `CommandPalette.test.tsx` already has
explicit coverage for this exact behavior ("a viewer does not see
.../Open AI assistant/...", "a non-viewer sees every nav door") that the
refactor had to keep passing.

**Run:** `npx vitest run
src/editor/shell/modals/__tests__/CommandPalette.test.tsx --maxWorkers=2` →
58/58 pass. `tsc -p packages/editor` → 0 errors (confirms the cast removal
type-checks).

## Item 7 — VersionList.tsx: rename maxLength + readOnly no-op test

**Fix:** added `maxLength={200}` to the rename `TextInput` in
`packages/editor/src/editor/panels/version-history/VersionList.tsx`,
matching the schema cap in `packages/shared/schemas/site-version.ts`
(`name: z.string().min(1).max(200)`).

**Test:** `startRename` already no-ops when `readOnly` (a controller-merged
fix from an earlier lane) but had no test. Added 3 cases to
`packages/editor/src/editor/panels/__tests__/VersionHistoryPanel.test.tsx`:
double-clicking a version title as VIEWER does not open the rename input;
the Rename menu item is `aria-disabled` with the viewer tooltip; and a
non-viewer's double-click DOES open the rename input (control, so the test
can't pass by the input never existing at all).

**Commit:** `fc14266f5`.

**Run:** `npx vitest run
src/editor/panels/__tests__/VersionHistoryPanel.test.tsx --maxWorkers=2` →
19/19 pass. `tsc -p packages/editor` → 0 errors.

**Not verified:** did not add a dedicated assertion that the rendered
`<input>` actually has `maxlength="200"` in the DOM (relying on the type
prop being passed through by the `TextInput` wrapper, which is a thin
`forwardRef` per `packages/editor/CLAUDE.md`'s chrome-ui contract) — the
existing suite's render already exercises this input without a maxLength
assertion, and adding one felt like scope creep on a test file whose stated
purpose (per its own docstring) is regression-pinning specific behaviors,
not exhaustive prop coverage.

## Final gate sweep (this session, foreground, per controller request)

- `pnpm run verify:ds` (`packages/editor`), 600s timeout, foreground: **exit
  0**, no FAIL/✗ lines in the log.
- `bash packages/dashboard/scripts/ds-grep-gates.sh`: **7/7 PASS**.
- `npx tsc --noEmit -p packages/dashboard`: **0 errors**.
- `npx tsc --noEmit -p packages/editor`: **0 errors**.
- `git diff --name-only bda180a95..HEAD | grep test` (67 files) run through
  vitest via xargs, split by package for the resource rule:
  - non-editor (29 files): **401/401 pass**.
  - editor (38 files): **658/658 pass**.
- No gate was red for a reason outside this lane's own changes, so the
  integration worktree (`/Users/shahg/Desktop/buildrik-audit-fix`) did not
  need to be consulted as a control.

## What was NOT verified (repeated from above, consolidated)

- No live-app / browser verification of any item (S-7's 400 response, the
  `<object data>` sanitizer, the AI nav row hiding, the version rename
  input) — everything here is unit/router-level test evidence only, per
  the ledger's `runtime_check` column, which the controller runs in Phase 2.
- Comment-hygiene sweep (item 4) covers the 5 listed pattern shapes plus a
  broadened manual pass, but is not provably exhaustive of every
  process-history phrase this arc ever wrote in prose (only "round"/"fix
  round"/"controller review"-shaped ones were targeted, matching the
  brief's examples).
- Item 5's `data` attribute fix was scoped to `sanitizeGeneratedPageHtml`
  only, not the blocks-tree sanitizer's separate allowlist.
