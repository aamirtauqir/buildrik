# Product flow gaps — 2026-09-03

**The question, founder's:** we are churning out screens; the flows are not built
the way this editor should have them. What are the gaps — measured, not assumed?

**The finding that reframes everything else:** the Figma prototype is *finished*.
All six pages measure **100% reachable, 0 orphans, 0 dead ends, 0 dangling
destinations** (2229 edges). So the flows exist **as design**. Every gap below is
the distance between "the board exists and is wired" and "a user can finish the
job in the running product."

That distance is this repo's single commonest defect, and it has a name here
already: **a finished, tested surface with no way in.**

---

## Part 1 — Doors (structural, mechanically verified)

### 1a. Surfaces nothing mounts

A scan of 466 exported components for any reference outside their own file
(tests excluded, `demo/` included, `index.tsx` counted as a real mounting site,
identifier references counted rather than JSX alone).

**The number moved 88 → 42 → 63 → 10 across four passes, and the first three were
wrong.** Recording that, because the wrong versions were each plausible:

| pass | count | what was wrong with it |
|---|---|---|
| 1 | 88 | counted `MODAL_*_CLASS` and `ROW_*_CLASS` — CSS constants, not components |
| 2 | 42 | excluded every `index.tsx` as a barrel. `LayersNoResults` came back an orphan; it is mounted at `panels/layers/index.tsx:418`. An index can be a real door. |
| 3 | 63 | matched only JSX `<Name`. Missed registry mounting and anything mounted from outside `src/` — it flagged **`AquibraStudio`**, the root shell. |
| 4 | **10** | any identifier reference, anywhere, `demo/` included |

Ten survive. Five are dead icon exports (`VersionsIcon`, `ActivityIcon`,
`ClearIcon`, `SaveIcon`, `PublishingIcon`) — housekeeping, not product. The five
that matter:

| surface | board | status |
|---|---|---|
| `InsertLoadingSkeleton` | 775:4053 | built, boarded, unit-tested, **never mounted** |
| `InsertLoadError` | 781:4154 | built, boarded, unit-tested, **never mounted** |
| `PagesLoadingSkeleton` | — | built, **never mounted** |
| `ExportDropdown` | — | never mounted (`ExportModal` was already a confirmed no-door case) |
| `DragTooltip` | — | never mounted |

**`BuildTab` has no loading or error branch at all** — its only failure response
is a toast, `BuildTab.tsx:86` *"Couldn't add component. Try again."* So the Insert
panel cannot enter the two states that were designed, built and tested for it.

**`PagesTab` is the sharper case**: it *does* wire `loadError` (`:232`, `:259`)
but never a loading state. The gap is per-state, not per-panel — which is why a
panel-level audit would have called Pages covered.

### 1b. Doors confirmed missing by direct observation

Found today, third-party confirmed, reproduced on three separate loads:

- ~~**Site menu → "Site settings" and "Getting started" do nothing.**~~
  **RETRACTED the same day. Both work.** This was ranked first in the first draft
  of this document and it was wrong.

  Three independent checks agree: **Site settings** opens the Project settings
  modal (`[role=dialog]` present; General / Canvas / SEO / PROJECT NAME / AUTHOR),
  and **Getting started** mounts a 320×443 `role="region"` checklist plus an
  onboarding-steps list and a rail note — body text grows by 341 characters on
  click, with **zero console errors**. The code chains are complete in both
  directions.

  **Why the original walk said "dead", and this is the most transferable lesson
  in this document:** the check scraped the *studio subtree* and looked for a
  dialog. A modal is `position: fixed` in a **portal**, so it is not in that
  subtree at all — it can be fully open and score as nothing-happened. And the
  onboarding checklist is a `role="region"`, not a dialog, so a dialog-only check
  misses it even when it looks in the right place.

  **Rule for any DEAD DOOR or MISSING DOOR claim: diff the whole document, not a
  subtree, and count by geometry rather than by role.** List every visible node
  over ~150×40 with a role or label, take a set difference across the click. A
  role-based check was wrong twice before this rule was written down.
- **The 1280 drawer-overlay mode is fully built with no trigger.**
  `LayoutShell.tsx:248,287` plus its CSS; `drawerPinned` has exactly one caller
  (`StudioPanels.tsx:411`) which never passes it, and the pin its board's title
  depends on was deliberately removed.
- **Icon picker** sits behind `media-type-chip-ico`, which renders **disabled** on
  an empty library (`title="No svg files in this library yet"`), so
  `IconBrowserOverlay` never mounts. This is a **CLOSED DOOR**, not a missing one
  — the distinction matters and is defined below.

### 1c. Prior confirmed no-doors — the precedent

Seven surfaces shipped **with passing tests** and no way in: Publish panel
(641:2652), History › Published tab, `ExportModal`, Share preview link,
Site health · Activity log, `UpgradeModal` (1175:4804), Toast-on-mount. The
Publish panel's cause is the one to remember: `publishNow = onVercelPublish ??
onOpenPublish ?? handleExport`, where the first is a `useCallback` and therefore
never undefined — so both fallbacks were dead code.

Two tRPC procedures were the same defect from the API side: `media.moveAsset`
(the dashboard could create, rename and delete folders but never move an asset
into one) and `sites.unarchive` (Archive in the row menu, Archive in the bulk
bar, an "Archived · N" filter to go and look, and nothing that brought a site
back — schema and handler branch already written).

### 1d. Unequal doors

- **`DetachInstanceButton`** (`ProInspector.tsx:438`) detaches on a **single click
  with no confirm**, while the component-library door for the same destructive
  action requires one.

---

## Part 2 — States that were never designed (~48)

Not "not built" — **not specified**. Whatever renders is improvised.

- **Settings family: one board per screen, zero loading / empty / error /
  save-error variants** — ~24 states across Domains, Redirects, Forms, Headers,
  Localization, Webhooks, Analytics/SEO.
- Publish-history load / error / empty.
- Content sub-view empties. CMS records modal × 4 states. Media drill-in empties.
- Inspector error boundary; page-settings error boundary.
- **Nine surfaces with no board family at all**: `BlockPickerModal`, canvas
  `AiPromptPopover`, `StructurePopover`, Brand `AIPromptModal`,
  `StockSourceModal`, page-settings error boundary.

---

## The vocabulary this audit uses

Four passes of my own false positives produced these; they are the difference
between a finding and a guess.

- **NO DOOR** — nothing renders an entry point.
- **CLOSED DOOR** — the control renders but is `disabled`/`aria-disabled`. Say
  what would open it. *A disabled control is not a missing door* — four
  "contrast failures" today were disabled buttons WCAG does not govern.
- **DEAD DOOR** — renders, enabled, clicked, nothing happens, no console error.
  The most valuable of the three.
- **NOT BUILT** vs **NOT DESIGNED** — code has no branch, versus code has a
  branch no board ever specified.
- A **number without its box is not evidence.** Four wrong-box readings in one
  day: a 0×0 `[role=dialog]` wrapper, a transparent row wrapper instead of the
  field, a bare `<input>` instead of the input+unit pair, and a sidebar node
  that silently included the 60px rail.

---

## Part 3 — Journeys (five walks in the running app)

*Activation, Content/CMS, Publish/go-live, Review sign-off and Failure/Recovery
are driven end-to-end against the server-backed fixture. Each step is WORKS /
BROKEN / NOT MEASURED, and "not measured" is never counted as a pass.*

### 3a. Activation — the journey works; the proof of it does not persist

dashboard → site → editor → first edit → autosave → preview → leave and return.

| # | step | verdict |
|---|---|---|
| 1 | Discover "create a site" | **WORKS** — CLOSED DOOR on this account: "Site limit reached (3/3)", correctly messaged |
| 2 | Pick an existing site | **WORKS** — site cards, real "Edit" link to `/edit/<id>` |
| 3 | Open editor | **WORKS** — full chrome, canvas renders real content |
| 4 | First meaningful edit | **WORKS** — click selects, double-click edits inline, commits on blur |
| 5 | Autosave | **WORKS**, but **SILENT** — the header flips to "Saved · just now" ambiently; no confirmation of the save itself, though toasts do fire for other events |
| 6 | Preview | **WORKS** — in-app Desktop/Tablet/Mobile overlay with a clear "Done" way back |
| 7 | Leave and come back | **WORKS** — verified by closing the browser entirely and reopening a fresh session |
| 8 | "Get started" checklist | **WORKS** — two doors, 7 steps whose CTAs fire the real action and tick live |

**WORST — the activation signal itself does not survive step 7.** The checklist's
completion state lives **only in `localStorage` under
`buildrick-onboarding-progress`, and is never synced server-side.** Proven, not
inferred: completing "Preview your site" in one browser context wrote
`"completed":true` and moved the pill 3/7 → 4/7; reopening **the same site as the
same logged-in user in a fresh browser context** read `"completed":false` and the
pill was back at 3/7.

That is the founder's own step 7 — leave and come back — applied to the one
artifact built to prove activation happened. A user who activates on a laptop and
returns on another device, in another browser, or after clearing their cache is
told by the product that they have done nothing.

*Not disambiguated:* whether the "Connect first client" / "Send for review" steps
are server-derived or also client-local — the evidence was mixed and it is
recorded as unresolved rather than assumed either way. Also not measured: a true
blank-account onboarding, since the fixture is pre-populated, so "Insert a
section" reads incomplete despite content existing.

### 3b. Publish / go-live — walked, with one severe defect

Environment established first, because two known traps could have made the whole
walk meaningless: **both** `VITE_FEATURE_PUBLISH` and `NEXT_PUBLIC_FEATURE_PUBLISH`
are set, so Publish reaches real users here and not only the `:5050` demo; and
`PUBLISH_ALLOW_SIMULATION` is unset, so nothing in this walk is the fake-deploy
path. The workspace has a live Vercel integration, so no final "Publish now" or
"Roll back" confirm was ever clicked — a real deploy was out of bounds.

| # | step | verdict |
|---|---|---|
| 1 | Pre-publish checks | **WORKS** — 6 checks, working "Fix ›" links, correctly non-blocking |
| 2 | Publish entry | **WORKS, inconsistent** — see SILENT below |
| 3 | Progress / feedback | **NOT MEASURED** — needs a real deploy; source shows determinate bar, named step, elapsed timer, per-step failure log |
| 4 | Live URL | **WORKS** — links out when published, honest "Not published yet" when not |
| 5 | History door | **WORKS** — and three prior no-door bugs are confirmed **fixed** |
| 6 | Compare two publishes | **CLOSED DOOR** |
| 7 | Rollback | **WORKS** as a flow; correctly disabled at one version |
| 8 | Unpublish | **MISSING DOOR from the editor** |

**WORST — DISHONEST: the product tells the user their site is live when it is
not.** On a site whose DB truth is `status=DRAFT`, `publishedUrl=null`, the *same
panel on the same load* says all of:

- `ENVIRONMENT → Production: "Not published yet"` — correct
- `LAST DEPLOY: "v1 · live"` — false
- Publish History: green **`LIVE · v1 · published 1w ago`** banner, `Version 1 [Live]` — false
- Topbar Publish tooltip: `"Not live yet."` — correct

Root cause, verified in source rather than taken on report:
`usePublishSnapshot.ts:184` reads `latest ? { …, isLive: true } : null` — the mere
existence of a COMPLETED job means "live", with no reference to `site.status` or
`publishedUrl`. `PublishHistory.tsx:268` is `const isLive = i === 0`: the newest
row is live purely by position. **The louder signal — green dot, the word LIVE —
is the wrong one.** A user cannot tell whether their site is up.

Same root class: the "Since last deploy" change list reads the **in-memory**
`composer.history` undo stack, not server truth, so a fresh load of a dirty site
reports "0 changes / Nothing has changed" while `hasUnpublishedChanges`
(server-computed, and used correctly by the topbar) says the opposite.

**SILENT** — there are two publish doors and they disagree. The sidebar CTA opens
a 2-step wizard showing all warnings; the prominent topbar button opens
`PublishConfirmModal`, which silently drops all three (SEO, domain, favicon). A
user who only ever uses the obvious button never learns they exist.

**CLOSED DOOR** — "Compare v{n-1}→v{n}" only fires `ui:switch-tab: history`.
No version-content diff exists anywhere in the codebase. A user can see *when*
two versions shipped and never *what changed*.

**MISSING DOOR** — `unpublishSite()` is fully implemented, with real Vercel
teardown, and is exposed only in the dashboard site header. To take a site down
you must leave the editor.

*Harness honesty:* both sites named as having completed publishes are
**soft-deleted** (`deletedAt` 2026-07-18) and throw `NOT_FOUND` on load — DB drift
since the brief, not a product bug. A substitute with one real COMPLETED publish
was used instead, and the substitution is recorded rather than the result being
quietly reported as if the original had been walked.
