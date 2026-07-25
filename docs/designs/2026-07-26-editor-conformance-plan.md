# Editor ↔ Figma — the completion plan

> Written 2026-07-26 against measured state, not memory. Every number below was
> read out of the running editor or the Figma file during the session that
> produced this document.

---

## The headline: this is not a redesign

The ask was "redesign the whole editor and implement the Figma design." The
evidence says that job is mostly already done, and treating it as a rebuild
would spend weeks re-deriving what is already correct.

**Every Figma family has a shipped code counterpart.** Checked one by one:

| Figma family | Code |
|---|---|
| Insert · Layers · Pages · Media · Content · Brand | `editor/sidebar/tabs/{build,layers,pages,media,content}`, `design-system/ui/DesignSystemTab` |
| Review panel · Orphan comments | `tabs/review/ReviewTab`, `canvas/comments/CommentLayer` |
| Inspector (11 states) | `inspector/ProInspector` |
| AI (11 states) | `tabs/ai` |
| Versions · Compare · Rollback | `tabs/history`, `panels/version-history/CompareView`, `shell/PublishHistory` |
| CmdK · Issues · Notifications | `shell/modals/CommandPalette`, `shell/IssuesPanel`, `shell/NotificationBell` |
| Publish (S6.1) | `shell/PublishDropdown` |
| Site (12 destinations) · Portfolio · Client review · Auth | dashboard package, all routed |

And the shell geometry already matches the boards, measured live:
rail **60** = 60 · topbar **56** = 56 · drawer 320 · inspector 300 · canvas column 760 at 1440.

**What actually made it look like a mismatch** was a single bug: `runtimeEnv.ts`
aliased `import.meta` before reading `.env`, which defeats Vite's static
replacement, so every `VITE_*` var read as undefined. `VITE_FEATURE_PUBLISH=true`
was set and ignored, so the topbar rendered **Export** where the design says
**Publish**. Fixed in `5d2f78a2`.

So the real problem is **conformance drift**, surface by surface — not missing
surfaces. The plan below is built for that.

---

## What drift actually looks like

Six defects found this week, each by measuring ONE surface. None were visible
in review, none broke a test, and none would have been found by reading code:

| Found | Why nothing caught it |
|---|---|
| every `VITE_*` env var undefined in the browser | Vitest gives a real `import.meta.env`, so the broken form passes there and fails only in a bundle |
| `--buildrick-surface-2/-3` referenced 36× across 14 files, defined nowhere — every active/selected fill transparent | undefined CSS vars fail silently; no error, no test |
| canvas toolbar ran 276px under the inspector at 1440 | needs a real browser at a real width with a selection |
| `defaultStyles.THEME.primary` still the retired cobalt | the accent migration swept CSS, not TS constants |
| Badge palette diverged; `success` on its own tint = 2.65:1 | contrast is never checked unless someone computes it |
| Avatar initials `accent-text` on `accent` = 1.06:1, invisible | looked like a solid disc; nobody read it as broken text |

The pattern is consistent: **drift is invisible to code review and to the test
suite, and only shows up when you measure the running product against the
board.** That is what the plan automates.

---

## Phase 0 — build the conformance harness (do this first)

Everything else depends on it. Manual measurement found six real bugs in a week;
there are ~60 surface families. Hand-checking them all is not realistic, and
hand-checking them *again* after every change is definitely not.

**Deliverable:** `scripts/conformance/` — a runner that, per surface:

1. opens the editor at a fixed viewport (1440×900) and drives it to the state
   (rail tab, selection, panel open) via the same events the shell uses;
2. reads the live DOM: element geometry, computed fills, radii, font sizes,
   and computes contrast for every text-on-fill pair;
3. reads the matching Figma board through the plugin API;
4. emits a diff: `surface · property · figma · code · verdict`.

**Three rules it must encode, learned the hard way this week:**

- **Every `var(--token)` must resolve.** A dedicated check: collect every
  `var(--x)` reference in `src/`, assert each has a definition in `themes/`.
  This one check would have caught three of the six bugs above.
- **Contrast is computed, never eyeballed.** Any text-on-fill pair under 4.5:1
  (3:1 for ≥18px) fails the run.
- **Measure at the width the board specifies, with the inspector open.** The
  toolbar bug only exists at 1440 with a selection; at demo width it looks fine.

*Effort: human ~1 week · CC ~1 day.* It pays for itself on the first surface.

---

## Phase 1 — close the six known-open items

These are already identified and need no discovery.

| # | Item | Detail |
|---|---|---|
| 1.1 | Badge contrast in code | `themes/components/atoms/badge.css` still pairs `--buildrick-success` with its own 10% tint (2.65:1). Figma is already fixed; move code to the `-text` steps |
| 1.2 | Issues producers | `IssuesPanel` now auto-fixes, but only DS-lint feeds it. The `Issues · all` board shows broken links and missing alt text; `AltTextService` exists and is unwired |
| 1.3 | `agency_layer` off by default | `isFeatureEnabled` returns `row?.enabled ?? false`. The whole client-review wedge is dark unless a `WorkspaceFeature` row exists. **Founder decision, not an engineering task** |
| 1.4 | Site-level integrations router | `site-detail.ts` has `redirects`/`domains`/`sharing`; the root `integrations` router is Vercel-OAuth only. Site §6.2 draws marketing integrations that have no backend |
| 1.5 | ConvertKit absent from the provider enum | schema change |
| 1.6 | GA "Test" states | `Integrations · GA · testing/test-passed/test-failed` are drawn with no verifiable server-side test path. Either build a real probe or cut the states — do not ship a fake green light |

*Effort: 1.1/1.2 human ~3 days · CC ~2h. 1.4/1.5 human ~1 week · CC ~half a day. 1.3 and 1.6 are decisions.*

---

## Phase 2 — conformance sweep, in priority order

Run the Phase 0 harness per family, fix what it reports. Ordered by how much
user pain a defect there causes, not by board count.

| Wave | Families | Why this order |
|---|---|---|
| **A · the daily loop** | Shell states (12) · Inspector (11) · Insert · Layers · Pages · canvas toolbar | every session touches these; drift here is felt constantly |
| **B · the wedge** | Review panel (12) · S5.1–S5.6 · Client review S5.5 (16) | this is the product's differentiator and the least-exercised code |
| **C · content + brand** | Media (15) · Brand (14) · Content (10) | biggest board counts; heavy token usage, so highest drift risk |
| **D · ship path** | Publish (S6.1) · Rollback · Versions · Compare · Domains · Export | low frequency, high stakes — a defect here loses work |
| **E · the rest** | AI (11) · CmdK · Issues · Notifications · Portfolio · Site settings | |

Each wave: run harness → fix drift → add the failing case as a test → re-run.
**A wave is not done until its harness run is clean twice in a row.**

*Effort per wave: human ~1 week · CC ~half a day, once the harness exists.*

---

## Phase 3 — keep it from drifting again

Fixing drift once is worth little if it returns. Three cheap guards:

1. **Token-resolution gate in CI** (from Phase 0) — blocks the entire class of
   bug that produced three of this week's six.
2. **Conformance run on the A wave in CI** — the daily-loop surfaces get
   measured on every PR.
3. **The book rebuilds in the same commit as the change.** It is a static
   artifact (`node .render/build-book.mjs`); it has already gone stale twice.
   A CI step that rebuilds and fails on an uncommitted diff ends that.

---

## What this plan deliberately does NOT do

- **No rewrite.** Every surface exists and is wired. A rebuild would re-derive
  working code and re-introduce bugs that are already fixed.
- **No new Figma boards for their own sake.** The file is at 395 boards with
  0 unreachable and 0 dead ends. Boards get added only where code is ahead
  (the B9 rule), not to pad coverage.
- **No cross-page prototype wiring.** Figma cannot link across pages; the
  hand-offs live in captions. If a clickable end-to-end demo is wanted, that is
  a separate small job: one flow page holding instances of the ~8 spine screens.

---

## The one thing to decide before starting

**`agency_layer` is off.** The client-review wedge — the product's actual
differentiator, fully built and schema-backed — is invisible to every workspace
without a `WorkspaceFeature` row. Phase 2 wave B spends a week polishing a flow
nobody can reach until that flag flips.

Flip it for a real agency first, then let wave B follow the feedback.
