# Publish panel — redesign spec

The audit's own summary of this module is the brief: *"the flow has been
carefully built at the level of individual screens and is broken at the level of
the seams between them"* (`UX-E-31`). Every screen here has a board and most of
them honour it. What has no owner is the question all of them answer differently.

So this spec does not redraw the panel. It removes the second answer.

**Two corrections to the audit before anything is drawn on them.** Both rows are
right about the mechanism and wrong about the place, and drawing on the wrong
place is how the last three false absences got written.

- `UX-E-01` and `UX-E-04` call this "Publish panel (rail · U)". **There is no
  rail button.** `publish` is in `GROUPED_TABS_CONFIG` (`tabsConfig.ts:203-216`)
  and absent from `RAIL_FIGMA` (`tabsConfig.ts:349-351`), whose own comment at
  `:340` reads *"publish → topbar Publish button"*. The three real doors are the
  topbar CTA, bare `U` (`useSidebarKeyboard.ts:36-47` binds every config
  shortcut, so `U` is live), and SiteMenu's "Publish panel" row
  (`SiteMenu.tsx:74`).
- The drawer is **280 wide**, not the 320 `SiteMenu.tsx:57` claims —
  `--bk-size-drawer: 280px` (`tokens.generated.css:129`), 700 when the header's
  expand is pressed (`LeftSidebar.tsx:586-587`).

---

## 1. What is actually wrong

Measured, not impression. Every claim carries its finding id and a line read.

| | |
|---|---|
| **On every fresh load of an already-published site, the panel says "Published to production." and disables its own Publish button.** `justPublished = uiState === "published" && snapshot.changeCount === 0` (`PublishTab.tsx:222`). With no job in this session `uiState` falls through to `hydratedUrl ? "published" : "idle"` (`usePublishJob.ts:299-311`), and `changeCount` counts the undo stack (`usePublishSnapshot.ts:156-166`) which `HistoryManager` empties on every `PROJECT_LOADED` (`:156-158`) — then `getHistoryStack()` skips index 0 (`:658`), so the one `recordCheckpoint("loaded")` does not show either. | `UX-E-01` |
| **The same flag hides the two sections that would have shown the truth.** SINCE LAST DEPLOY (`:549`) and LAST DEPLOY (`:602`) are both gated on `!justPublished`. So the panel states a conclusion and withholds its evidence. | `UX-E-01` |
| **Ten pixels away, the topbar says the opposite.** `hasUnpublishedChanges = isDirty \|\| savedAtMs > publishedAtMs \|\| serverHasUnpublishedChanges` (`StudioHeader.tsx:592-596`) → label "Publish changes" (`lifecycle.ts:117`). Two surfaces, on screen together, reading two sources. Site-level edits widen the gap: `setProjectSettings` marks dirty and records no history entry, so the SEO title template moves one and not the other. | `UX-E-02` |
| **The disabled button explains itself in two of its three cases.** A blocking check prints its detail (`:736-745`), an in-flight publish prints "in progress — please wait" (`:746-750`), and the case the panel *opens in* prints nothing. | `UX-E-27` |
| **A dropped status poll strands the user in "publishing" forever.** `tick`'s catch sets `error` and stops polling (`usePublishJob.ts:165-168`), but the last known status is still BUILDING so `uiState` stays `"publishing"` (`:299-306`). The failure block needs `"failed"` (`PublishTab.tsx:226`). Progress freezes, the elapsed timer keeps counting, and the CTA stays disabled. | `UX-E-03` |
| **There is no cancel — and cancellation is built end to end.** `usePublishJob` exposes `cancel` (`:228-236`), `PublishService.cancelPublish` calls the router (`:124-125`), the worker checks between steps. Four spellings searched; the only caller in the repo is `usePublishJob.test.ts:390`. Zero UI call sites. | `UX-E-09` |
| **`cancelled` is a state the machine can reach and no screen draws.** `PublishUiState` includes it (`usePublishJob.ts:33`, `:305`); `PublishTab` branches on publishing / published / failed only. | `UX-E-10` |
| **The build log always blames step one.** The worker's catch writes `steps: buildSteps(0, true)` (`route.ts:201`) — step 0 is `"Generating pages"` (`:23`). A deploy that died talking to Vercel reports "Generating pages ✕ failed" and "Deploying to CDN · not run". | `UX-E-07` |
| **The progress line can never name its step.** The worker writes the live step as `"active"` (`route.ts:45`); the panel looks for `"running"` (`PublishTab.tsx:239`). `runningStep` is always null, so the user reads "40%" and never "Deploying to CDN". `STEP_WORD` (`:850-855`) has no entry for `active` or `skipped` either. | `UX-E-08` |
| **The pre-publish checklist measures six things and the server refuses on a seventh.** `runPrePublishChecks` returns Vercel / Pages ready / SEO configured / Domain connected / Empty pages / Favicon (`publish.service.ts:50-105`). The approval gate lives in `startPublish` (`:284-299`) and throws APPROVAL_NONE / PENDING / CHANGES / STALE. So "All checks pass." (`PublishWizard.tsx:213`) can sit over a publish the server will refuse. | `UX-E-06` |
| **The wizard already knows the answer one step later.** Confirm's four facts include a live "Client approval" row (`PublishConfirmFacts.tsx:170-172`, `approvalLine:36-59`) — and its own warnings band says *"Client approval is a separate gate"* (`:66`). The fact is fetched, printed, and not allowed to block. | `UX-E-06` |
| **Generated CMS detail pages ship the template's identity.** `generateDynamicPages` appends `<title>` + description before `</head>` and keeps the template head whole (`cms.service.ts:212-215`). Browsers take the first title, so a hundred pages announce themselves as the template, and the template's og:title / og:description / twitter:* (`SEOInjector.ts:150-177`) ride along. A blank SEO field ships literal `<title></title>`. **Canonical is not leaked** — the editor emits none and `injectSeoTags` adds a correct per-path canonical and og:url (`publish-html.ts:87-97`). | `UX-E-05` |
| **The number the user approves is not the number that deploys.** Confirm counts the browser's export (`PublishConfirmFacts.tsx:120-140`); the server appends one page per published CMS entry afterwards (`publish.service.ts:329`). | `UX-E-23` |
| **Two doors, two different gates.** The topbar's confirm modal prints the first failing check as red text and disables the button, with no Connect and no Fix; the panel's wizard offers both. | `UX-E-12` |
| **"Fix ›" abandons the flow and lands short.** Three of five targets are the bare tab id `settings` (`PublishTab.tsx:78-82`), the switch-tab event carries no sub-screen, and the same click closes the wizard. No re-check exists. | `UX-E-11` |
| **"Compare v2 → v3" compares nothing.** It emits `{ tab: "history" }` (`PublishTab.tsx:486`) and History needs a sub-view to open Published. `AquibraStudio.tsx:513` makes the correct call two files away. | `UX-E-26` |
| **The panel has no door to the version list at all** — LAST DEPLOY answers "what is live" and offers no route to "and how do I go back". | `UX-E-29` |
| **"Preview — None", forever.** `preview: { label: "Preview", value: null }` is hardcoded (`usePublishSnapshot.ts:176-178`) and rendered unconditionally (`PublishTab.tsx:541`). A line in a 280px panel that states nothing. | `UX-E-28` |
| **Raw server strings reach the user.** `WORKER_DISPATCH_FAILED` is not translated by the router (`sites.ts:382` is a bare `throw e`), and `ALREADY_PUBLISHING` — which means *another deploy is running* — is returned as a CONFLICT error (`:339-343`) that the editor paints as a red failure with a "Try again" that cannot succeed. | `UX-E-25` |

**The thesis:** the topbar already runs a complete, correct answer machine —
`deriveLifecycleState` (`lifecycle.ts:160-250`) resolves the review round, the
permission blockers, offline, and whether anything is waiting to ship, in one
ordered table. The panel does not read it. It re-derives the same question from
the in-session undo stack and gets a worse answer, and every other seam in this
module is downstream of that decision.

This is not a panel that needs better sections. It is a **second implementation
of the topbar's question, with the richest presentation given to the state that
is wrong most often.**

---

## 2. The structural fix, before any pixels

**One question, one machine, one gate.**

### 2.1 One answer to "is anything waiting to ship?"

`deriveLifecycleState` already produces it, and both surfaces read the same
result. The panel's *change list* may stay session-scoped — it is genuinely
useful — but it is then **labelled as what it is** and it never decides whether
publishing is offered.

| Question | Answered by | Read by |
|---|---|---|
| Is anything waiting to ship? | the durable clock the topbar already uses (`StudioHeader.tsx:592-596`) | topbar CTA **and** panel CTA |
| What changed, specifically? | the undo stack (`usePublishSnapshot.ts:156-166`) | the panel's list, labelled "in this session" |
| May this publish proceed? | the server (checks + approval gate) | the wizard's step 1 |

Corollary: **the CTA is enabled whenever the answer is unknown.** Republishing
identical content is harmless; refusing a publish of real work is not.

### 2.2 Seven states, and every one of them drawn

The panel draws four today. The machine can reach seven. Nothing may be
reachable and undrawn:

| State | Reachable via | Drawn today |
|---|---|---|
| `idle` / ready | fresh load, no live URL | yes |
| `blocked` | a `fail` check, or the approval gate | partly — reason under the CTA only |
| `publishing` | a job in flight | yes |
| `lost contact` | a poll throw (`usePublishJob.ts:165-168`) | **no** — renders as `publishing`, forever |
| `published` | job COMPLETED | yes |
| `failed` | job FAILED, or a pre-job throw | yes |
| `cancelled` | job CANCELLED (`usePublishJob.ts:305`) | **no** |

### 2.3 One gate, not two of different quality

Both doors route into the same two-step wizard. This is a smaller change than it
sounds: the topbar's confirm modal and the wizard's step 2 **already share
`PublishConfirmFacts`** (`PublishWizard.tsx:246-252`, `PublishConfirmModal`), so
the fast path is half-merged already. What the topbar path is missing is step 1
— the checklist, the per-row Fix, and the Connect Vercel primary.

And the checklist gains its seventh row: **client approval**, which is already
fetched one screen later and already knows all four refusal states.

---

## 3. The panel

Drawn at the real 280 (`--bk-size-drawer`). The expanded 700 state adds width to
the change list and nothing else.

```
┌─ Publish ──────────────────────── 280 ─┐
│ Publish                       ⤢   ✕    │
├────────────────────────────────────────┤
│  ● Live · v3 · 2 Jul                   │  one status sentence, from the
│  acme-site.vercel.app              ↗   │  SAME derivation as the topbar
├────────────────────────────────────────┤
│  WAITING TO SHIP                       │
│  6 pages · 12 generated from Blog      │  the DEPLOY manifest (UX-E-23)
│                                        │
│  Changes in this session          4    │  ← labelled; never gates the CTA
│  Hero copy                Sam · 2h     │
│  Pricing table            Sam · 2h     │
│  Site SEO title           Sam · 1d     │
│  … 1 more                              │
├────────────────────────────────────────┤
│  BEFORE YOU SHIP        1 blocking ›   │  one line into the wizard's step 1
│  ✕ Waiting on Priya's approval         │  the blocking row, named here
├────────────────────────────────────────┤
│  LAST DEPLOY                           │
│  v3 · live · 2 Jul       All versions ›│  ← the missing door (UX-E-29)
│  Unpublish site…                       │
├────────────────────────────────────────┤
│ [ Publish to production ]              │
│ Blocked — Priya hasn't approved yet.   │  every disabled state names its
└────────────────────────────────────────┘  reason (UX-E-27)
```

**ENVIRONMENT is gone as a section.** Its Production row is the live URL, which
now leads the panel; its Preview row is hardcoded null and always will be
(`UX-E-28`). Two rows became one sentence.

**"Waiting to ship" leads with the manifest, not the change count.** *6 pages ·
12 generated from Blog* is what the deploy carries. The change list sits under
it, subordinate and labelled — because it is the honest scope of what the undo
stack can know.

### The running state

```
├────────────────────────────────────────┤
│  PUBLISHING TO PRODUCTION              │
│  Deploying to CDN · step 3 of 5        │  requires the worker/panel
│  started 14s ago                       │  vocabulary fix (§6)
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  60%          │
│                             Cancel     │  ← the control that exists
└────────────────────────────────────────┘     and has no call site
```

### Lost contact — the state with no picture today

```
├────────────────────────────────────────┤
│  ⚠ Lost contact with the deploy        │
│  It may still be running. Last seen    │
│  at "Deploying to CDN", 40s ago.       │
│  [ Check status ]   Start over         │
└────────────────────────────────────────┘
```

Not a failure — the deploy may well have landed. Two moves: re-poll, or abandon
this job so a fresh publish is possible. Today neither exists, and the server's
stale-job sweep only runs inside `startPublish` (`publish.service.ts:198-232`),
which this panel will not let the user reach.

### The checklist, with its seventh row

```
┌─ Publish · before you ship ─────────────────── 560 ─┐
│  ✓  Vercel connected                                │
│  ✓  Pages ready              6 pages                │
│  ⚠  SEO configured           No title template  Fix›│
│  ⚠  Domain connected         No custom domain   Fix›│
│  ⚠  Empty pages              1 page has none    Fix›│
│  ✓  Favicon                                         │
│  ✕  Client approval          Waiting on Priya   Open│  ← NEW, from the gate
├─────────────────────────────────────────────────────┤
│  ✕ Blocked — Priya hasn't approved yet.             │
│                       Cancel   Continue to Confirm →│
└─────────────────────────────────────────────────────┘
```

---

## 4. Interaction detail, where the audit found a specific failure

- **Fix › keeps the flow alive.** Today the click closes the wizard and emits a
  bare tab id, so three of five rows land on Settings' 14-row default
  (`UX-E-11`). The wizard stays mounted behind the target surface, the deep link
  carries the sub-screen (`openLeftPanelToTab` already takes one —
  `AquibraStudio.tsx:513`), and returning re-runs `loadChecks`, which the panel
  already has as a callable (`PublishTab.tsx:271`). The row the user went to fix
  re-evaluates in front of them.
- **A refusal keeps the wizard open.** `onClose(); onPublish();`
  (`PublishWizard.tsx:267-271`) means the approval refusal arrives after the
  screen it belongs to is gone, and lands as a 6-second toast
  (`useExportHandlers.ts:165-170`). Publish now holds the wizard until the
  server answers, and a refusal is rendered *in* it.
- **Nothing may claim a percentage with no noun.** While the step name is
  unknown the line reads "Starting" or "Working" — never a number alone. A
  percentage is not progress a user can act on.
- **"Already publishing" is not a failure.** It gets the in-flight state and a
  pointer at the run that is happening, not a red block and a "Try again" that
  will hit the same conflict (`UX-E-25`).
- **A simulated publish says so.** When the deploy mode comes back simulated,
  the success beat reads "Simulated publish — nothing was deployed" and the View
  live action is suppressed, because the URL is on `.dev-simulated.invalid` and
  can never resolve (`UX-E-24`).
- **The just-published beat is reserved for a publish that finished in this
  session** — i.e. `jobId != null && status === COMPLETED`, never a hydrated URL
  from a previous day.

---

## 5. What this does NOT do

- **No new checklist service.** `runPrePublishChecks` keeps its shape and its
  six rows; approval becomes a seventh row of the same `{label, status, detail}`
  type, from data `PublishConfirmFacts` already fetches.
- **No second confirm surface.** `PublishConfirmFacts` is already shared by both
  doors and stays the only implementation of the four facts.
- **No version list in this panel.** It was deliberately removed (founder call,
  recorded at `PublishTab.tsx:648-662`) and lives at History › Published. This
  spec adds a *link*, not the list.
- **No export changes.** The export modal's own findings (`UX-E-13`…`UX-E-16`)
  are a different surface with a different door and are out of scope here.
- **No preview changes.** `UX-E-17`/`UX-E-18` are the Preview overlay's, and
  fixing them is a sanitizer and sandbox decision, not a panel layout.
- **No new progress vocabulary.** The five step names already exist
  (`route.ts:22-28`); this spec asks the panel and the worker to use the same
  word for a step's status, not for new steps.
- **No new toasts.** `useExportHandlers` stays the one owner of publish outcome
  toasts (`:174-215`); the panel states, it does not announce twice.

---

## 6. Acceptance

Not "clearer". Each is observable, and several must be observed in the running
app rather than read off the handler.

1. Open a previously-published site with saved, unpublished work. The panel's
   primary action is **enabled**, and the panel and the topbar say the **same
   thing** about whether anything is waiting.
2. The panel never claims "Published to production" for a deploy that did not
   happen in this session.
3. Every disabled state of the primary prints its reason directly under it,
   including "nothing to send".
4. Kill the network mid-publish. Within one poll interval the panel leaves
   "publishing", says it lost contact, and offers a way out. Verified by forcing
   the failure, not by reading `tick`.
5. Press Cancel during a run. The job reaches CANCELLED and the panel draws a
   cancelled state that says nothing was deployed.
6. Force a failure at the Vercel step. The log marks **that** step failed, and
   the steps before it are not marked pending.
7. During a run the progress line names a step, or says "Starting" — never a
   bare percentage.
8. In an approval-required workspace with no approved review, the checklist
   shows a **blocking** approval row before the button is pressed, and pressing
   Publish now keeps the wizard open on the refusal.
9. Press "Fix ›" on SEO configured: the SEO sub-screen opens, and returning
   shows that row re-checked without restarting the flow.
10. "Compare v2 → v3" opens History › Published with those two versions
    selected. "All versions" from LAST DEPLOY opens the same list.
11. On a site with a page-generating collection, the confirm states the deploy
    manifest ("6 pages + 12 from Blog"), and the number the user approves is the
    number of files uploaded.
12. Open one generated detail page's source: exactly one `<title>`, and it names
    the entry, not the template.

### The code fixes this design cannot honestly paper over

Items 1–3 depend on **the change-count source** (`PublishTab.tsx:222` /
`usePublishSnapshot.ts:156-166`). Until "is anything waiting" stops being read
from a stack `HistoryManager` wipes at `:156-158`, no arrangement of sections on
this panel can be truthful, and this spec should not be drawn as though it can.

The others, each naming the line:

| # | Fix | Where |
|---|---|---|
| 1 | Derive publishable-ness from the durable clock, not `getHistoryStack()` | `PublishTab.tsx:222`, `usePublishSnapshot.ts:156-166` |
| 4 | A poll throw must produce its own state, not leave `uiState` at `"publishing"` | `usePublishJob.ts:165-168`, `:299-306` |
| 5 | Give `cancel` a call site, and `cancelled` a branch | `usePublishJob.ts:228-236`, `PublishTab.tsx:150-226` |
| 6 | Record the index of the running step in the catch | `route.ts:201` (`buildSteps(0, true)`) |
| 7 | One vocabulary for step status across worker, transport type and panel | `route.ts:45` (`active`) vs `PublishTab.tsx:239` (`running`); `STEP_WORD:850-855` has no `active`/`skipped` |
| 8 | Add the approval gate to `runPrePublishChecks`; hold the wizard open on refusal | `publish.service.ts:50-105`, `PublishWizard.tsx:267-271` |
| 9 | Carry a sub-screen id on the switch-tab event | `PublishTab.tsx:788-806`, `StudioPanels.tsx:289-303` |
| 10 | Same event fix; pass `published` | `PublishTab.tsx:486` |
| 11 | Return the server-side manifest count before the confirm renders | `publish.service.ts:329`, `PublishConfirmFacts.tsx:120-140` |
| 12 | Replace the template's head identity on a generated page, do not append to it | `cms.service.ts:212-215` |
| — | Translate `WORKER_DISPATCH_FAILED`; make `ALREADY_PUBLISHING` a non-failure | `sites.ts:339-343`, `:382` |
| — | Carry the deploy mode to the client so a simulation can say so | `route.ts:406-440`, `useExportHandlers.ts:175-185` |

Two of these — 8 and 12 — are server-side and land in
`packages/dashboard` / `server/`, not in the editor. A design review that signs
off this panel without them signs off a screen that will still certify a publish
the server refuses, and detail pages that all wear the same name.


---

## Correction — cancellation is NOT built end to end (added 2026-09-07)

A Phase 4 QA pass challenged this spec's claim that "cancellation is built end
to end… the worker checks between steps". Verified, and the claim is wrong:

- `publish.service.ts:412-415` — `cancelPublish` throws `NOT_CANCELLABLE`
  unless the job is `QUEUED` or `BUILDING`. **`DEPLOYING` cannot be cancelled.**
- There is **no cancellation check in the worker at all** — no `checkCancelled`
  anywhere in the publish route. So a cancel accepted during `BUILDING` marks
  the database row and the worker keeps running; the deploy can still land.

What this changes on the board, and it is not cosmetic:

- The publishing state's Cancel is scoped: *"cancellable until deploy starts"*.
- The cancelled state no longer says **"Nothing was deployed"** — a sentence the
  product cannot honour. It says *"Cancellation requested. If the deploy had
  already started it may still finish. We will tell you which."*
- Acceptance #5 as written ("says nothing was deployed") was **unsatisfiable**
  and is replaced by: the cancelled state must not assert an outcome the server
  has not confirmed.

Making a real cancel honest needs two code changes, both server-side: a
cancellation check between worker steps, and `DEPLOYING` either made cancellable
or explicitly surfaced as past the point of no return.


---

## Cross-spec reconciliation — the expanded drawer is 560, not 700 (2026-09-07)

A Phase 4 QA pass filed this spec as contradicting `SPEC-NAVIGATION`, which puts
the wide drawer at 560 where this one says 700. Reading both, the finding is
**partly overstated**: this spec DESCRIBES 700 as the value that ships today,
while Navigation PROPOSES 560 to replace it. A description and a proposal are not
a contradiction.

What is real is the risk to a reader: nothing here says the 700 is on its way
out, so someone building from this spec alone would build the wrong width.

**The proposal wins, and its arithmetic is why.** At 1440, a 700 drawer plus the
60 rail and the 300 inspector leaves 380px of canvas, against a 1024 desktop
frame floor (`canvasStyles.ts:57`) — the editor would be showing a site preview
narrower than the narrowest device it claims to support. 560 leaves 520.

So: every expanded-drawer state in this spec inherits
`--bk-size-drawer-wide: 560` from `SPEC-NAVIGATION`'s surface-class table. The
700 references here are historical and should be read as "the value being
replaced".
