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

## The answer, ranked

Five journeys were driven end to end in the running product. **Every one of them
completes.** The screens are not the problem, and neither is the Figma. What is
missing is a class the per-screen process cannot see: **the product tells the user
things that are not true, and loses their work while doing it.**

Four of the five worst findings are the same defect wearing different clothes —
**an interface that reports an outcome the system did not achieve.**

| # | gap | journey | class |
|---|---|---|---|
| 1 | Save fails while **online**, toast says "Offline — not saved"; reload discards the edit while the topbar reads "Saved · just now" | Recovery | **DISHONEST → DATA LOSS** |
| 2 | Client types their reasoning, clicks **Request changes**, round closes, note is **never sent** (zero rows) and there is no way back. Approve has a confirm; this path has none | Review | **SILENT DATA LOSS** |
| 3 | Site is `status=DRAFT`, `publishedUrl=null`; the same panel shows both "Not published yet" and a green **LIVE · v1** | Publish | **DISHONEST** |
| 4 | **Undo enables itself** after a bind and does nothing — binding never enters the history stack | CMS | **DEAD DOOR** |
| 5 | Activation progress lives only in `localStorage`; another device or a cleared cache says the user has done nothing | Activation | **SILENT** |

Then the discoverability tier: **Review has no door at all** until a round exists
(rail icon absent, topbar pill null — ⌘K only), and the palette advertises **R**
for it while the only `r` handler in the codebase opens the rulers overlay.
**Unpublish** exists with real teardown and is reachable only from the dashboard.
**Compare between versions** has no diff implementation anywhere in the codebase.
The two publish doors disagree — the prominent one silently drops all three
warnings the other shows.

**What this says about the process, which is what was asked.** A per-screen
conformance pass cannot find any of these. Every one of them is a *relationship*:
between two controls (notes and Request-changes), between a label and the
database (`isLive`), between an affordance and a capability (Undo), between two
copies of one rule (offline detection, where the sibling of the fixed line still
carries the bug the fixed line's own comment describes), or between one device and
the next. Screens were being verified; the seams between them were not.

**The strongest counter-evidence to the pessimism:** the mechanics underneath are
sound. The load-failure guard genuinely prevents the documented site-deleting
incident. Delete-and-undo fully restores. Session expiry is honest and
distinguishes itself from offline. Review rounds transition correctly in the
database and revoke old tokens. Binding drives real data live. This is not a
product that needs rebuilding — it is one whose truth-telling and its seams were
never on anyone's checklist.

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

### 3b. Content / CMS — the journey works; undo lies about it

collection → fields → records → bind → real data on canvas → unbind.

Steps 1–8 **WORK**, and better than expected: collections *and* their fields can be
created from inside the editor (a 2-step wizard, not dashboard-only), the field
type picker is complete, published/draft state is a real `aria-label` rather than
a colour alone, the unsaved-edit guard raises a genuine Discard confirm, binding
updates the canvas to real data live, and unbind is discoverable in the banner.

**WORST — DEAD DOOR: the Undo control claims a capability it does not have.**
Binding an element does not enter the history stack — `BaseBindingManager` emits
`BINDING_CREATED` and never touches history or `markDirty` (verified in the
engine, not inferred from the UI). But the topbar Undo **enables itself** right
after a bind, and pressing it — keyboard and mouse, verified twice — leaves the
canvas text and the "Bound" chip completely unchanged, with **zero console
errors**. A user who mis-binds and reflexively hits ⌘Z gets no error and no
revert. The only escape is the manual Unbind, if they find it.

**SILENT — a draft record renders as though it were published.** Bind to a DRAFT
record and the canvas shows its data with no signal anywhere — chip, banner and
tooltip all say only "Bound to Dishes.name". The user cannot tell that what they
are looking at is unpublished.

Minor: for an existing but empty collection the binding popover offers
"No fields defined — **+ Create Collection**", which is the wrong label for a
collection that already exists. A CLOSED DOOR with misleading copy, not a dead end.

*Not measured:* image-field binding (no `<img>` on the loaded route), publish-time
validation of draft-bound content (would need a real deploy), collection-level
delete.

### 3c. Review / client sign-off — the client's verdict can be silently destroyed

comment → resolve → round → send to client → client approves or requests changes
→ round closes → next round.

Steps 1–6 **WORK**, verified against the database rather than the screen: replies
create real `Comment` rows, Resolve moves OPEN→RESOLVED, "Re-send for review"
fired `reviews.submit` (confirmed by the literal outgoing request URL, not a
route-pattern guess — a batched tRPC pattern that matches nothing looks identical
to a product that does nothing), created round 9 and **revoked round 8's token**
server-side. The old token then correctly shows "There's a newer version". Round
history lists rounds 1–8 with per-round outcome and date, so a user can always
tell which round they are looking at. The agency reviews queue correctly blocks
self-approval while showing live Approve / Request-changes on someone else's
submission — confirmed as both states side by side.

**WORST — SILENT DATA LOSS on the client's most likely click.** On the client
review page the "Your notes" textarea and the "Request changes" button are two
independent controls: typing a note does nothing until "Add note" is clicked
separately. Typing a note and then clicking **Request changes** — exactly what a
client does after saying their piece — closes the round instantly to a terminal
"You asked for changes" screen. A database query immediately after found **zero
rows containing that text**. It was never sent anywhere, and the terminal state
offers no way back.

**And the asymmetry is the tell:** *Approve* has an explicit "Approve `{site}`?"
confirm modal. *Request changes* — the path that carries the client's reasoning —
has no guard at all. This is the one thing a client-sign-off product should
protect hardest.

**NO DOOR for a never-reviewed site.** On a site with zero rounds the rail has no
Review icon (6 icons, confirmed identical on the fixture and on a virgin site) and
the topbar pill is null. The **only** door is ⌘K → "Open Review panel". Once a
round exists the topbar pill becomes a real door — so the feature is undiscoverable
precisely when a user would be starting their first review.

**A printed chord that is wrong, not merely dead.** The palette prints **R** beside
"Open Review panel"; pressing `r` does not open Review. There *is* an `r` handler
— `CanvasFooterToolbar.tsx:271`, `key === "r" && !e.shiftKey` → the **rulers**
overlay. So the advertised chord does something else entirely.

*Not measured:* canvas click-to-pin (the target resolved off-viewport at y=-411 in
headless — a harness coordinate problem, explicitly not a product finding);
Approve's own terminal path this session (Request-changes was driven instead;
APPROVED rows exist historically in the same dataset).

### 3d. Failure / recovery — the guard held; the label lies in front of real loss

| # | failure | reachable | honest | escapable | work preserved |
|---|---|---|---|---|---|
| 1 | Load fails | ✓ | ✓ | ✓ | ✓ |
| 2 | **Save fails while online** | ✓ | **✗** | ✓ | **LOST on reload** |
| 3 | Session expires mid-edit | ✓ | ✓ | ✓ | ✓ |
| 4 | Network drops and returns | ✓ | ✓ | ✓ | ✓ (no auto-resave) |
| 5 | Delete + undo | ✓ | ✓ | ✓ | ✓ full restore |
| 6 | Close tab with unsaved work | ✓ | ✓ | ✓ | ✓ |

**The good news is load-bearing and was verified live, not assumed:** the
documented "one failed load plus one edit deletes the site's pages" incident is
**guarded**. An aborted load raises a `role="alert"` banner — *"Couldn't load…
You're seeing local changes for now"* — plus a second toast, *"Not saved — this
site never loaded · Autosave is held back"*, and the `_loadedSites` guard in
`BuildrikSyncProvider` genuinely blocks autosave for the duration. Retry recovers
all 66 elements. Undo after a delete fully restores, through two independent doors.

**WORST — a false label standing directly in front of reproducible data loss.**
With the browser demonstrably **online** (`navigator.onLine === true`, measured at
the moment) and `sites.saveProject` failing, the autosave toast says **"Offline —
not saved"**. Reload, and the edit is gone while the topbar reads **"Saved · just
now"** — no second warning.

The cause is a duplicated rule where only one copy was fixed, and the code says so
itself. `useSaveCallback.ts:150-155` carries a comment describing *this exact bug*
— *"They were conflated, so a server that refused while the browser was online…
produced the toast 'Offline — not saved'… Only navigator can answer 'offline'"* —
and its manual-save path is correct. The **autosave** path,
`useComposerInit.ts:508-510`, still reads:

```
const offline = (!navigator.onLine) || /network|fetch|offline|failed to fetch|connection/i.test(message);
```

Two paths, one rule, one of them patched. The manual retry names the same failure
correctly — *"Couldn't reach the server — not saved"* — so the product contradicts
itself about one event depending on which path reported it.

**Why this ranks above the other honesty bugs:** it primes the user to dismiss the
true warning. Someone told they are offline checks their wifi, sees it is fine,
and learns the message is noise — immediately before the reload that discards
their edit under a topbar claiming everything is saved.

**No auto-recovery after reconnect.** Coming back online fires a "Back online"
banner, but the topbar stays "Save failed — retry" and the unsent edit was still
unsent six seconds later. The user must click.

**Correction to Part 2, from this walk:** the Settings screens
(Domains / Redirects / Forms / Headers / Localization / Webhooks) **do** have
`loading` and `catch → setLoadError` branches in all six. So those states are
**NOT DESIGNED**, not NOT BUILT — the code renders something and no board says
what. The distinction is exactly the one this audit set out to make, and it lands
on the side of "improvised", not "missing".

**UNEQUAL DOOR, source-confirmed:** `DetachInstanceButton`
(`ProInspector.tsx:440`, `useComponentsState.ts:432`) fires `detachInstance` on a
single click with no confirm **and swallows failures silently** (`catch {}`, no
toast), while the component-library delete for the same class of action routes
through `ConfirmDialog` (`useComponentsState.ts:264-288`).

*Not verified:* the deleted-site and page-level auth variants of `LoadErrorBanner`
(would need a crafted NOT_FOUND envelope or a real deletion — deliberately
avoided); whether the false-offline bug also fires on a transient blip rather than
a permanent abort.

### 3e. Publish / go-live — walked, with one severe defect

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
