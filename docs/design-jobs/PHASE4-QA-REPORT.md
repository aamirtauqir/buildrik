# PHASE4-QA-REPORT — adversarial pass over the five Phase 4 specs

**Date:** 2026-09-07
**Scope:** `SPEC-INSERT-PANEL.md`, `SPEC-NAVIGATION.md`, `SPEC-INSPECTOR.md`, `SPEC-PUBLISH-PANEL.md`, `SPEC-PAGES-PANEL.md`, read against `UX-QA-REPORT.md`, `findings/UX-{A..I}.jsonl` and `findings/FIG-COORD.jsonl`.
**Method:** every load-bearing citation opened at source in the working tree. Read-only — no file under `packages/`, `server/`, `lib/` or `prisma/` was touched.

**Headline, and the one thing to take from question 1: no spec rests on a refuted finding.** All eleven QA refutations and all six later coordinator corrections propagated. Nine of them appear in a spec and every one carries its correction inline. That question comes back clean, and §7 says so with the receipts.

The failures are elsewhere, and there are three that matter:

1. **`SPEC-INSERT-PANEL` draws a feature that does not exist and labels it "the built-but-unrendered feature."** Recents are not built. Only a storage-key name exists.
2. **`SPEC-PUBLISH-PANEL` rests on "cancellation is built end to end."** It is not built across the step that matters, and the spec's acceptance criterion asserts a thing the product will sometimes contradict.
3. **Every dependency table is incomplete, and three of them state a count that is wrong by 2×–5×.** `SPEC-NAVIGATION` says four of its twelve criteria need code and lists five under that heading; the true number is at least ten. `SPEC-PUBLISH-PANEL` says two of its fourteen fixes are server-side; seven are.

---

## Part 1 — Specs resting on claims that do not survive reading the code

### 1.1 `SPEC-INSERT-PANEL` §1 / §3 — "Favourites and recents are fully built and rendered nowhere" is half false, and the panel drawing rests on the false half. **Critical.**

The row is the only one in that table without a finding id — it is attributed to `lane A` — and the table's own header says *"Every claim carries its finding id."*

**Favourites: true.** `useBuildTab.ts:104-105,131-133` holds `favs`, and the hook returns `favs`, `toggleFav`, `favOpen`, `setFavOpen`, `clearFavs`, `restoreFavs`, `favsInformed`, `markFavsInformed` (`:276-301`). `BuildTab.tsx` destructures none of them. Fully built, rendered nowhere — exactly as filed.

**Recents: false.** A case-insensitive grep for `recent` across `src/editor/sidebar/tabs/build/` — including its tests — returns **zero hits**. The only artifact is a name:

```
shared/constants/storageKeys.ts:58   /** Recently used element IDs in the Build tab (max 8) */
shared/constants/storageKeys.ts:59   BUILD_RECENT: "buildrick-build-recent",
```

`BUILD_RECENT` has no consumer anywhere in `src/` (grepped; only `BUILD_FAVORITES` appears, at `useBuildTab.ts:105,132` and `storageMigration.ts:43`). There is no recents list, no push-on-insert, no read.

Why it matters: §3's panel puts **RECENT at the top, above SECTIONS**, annotated *"the built-but-unrendered feature"*, with three chips. That is a new feature — a recents ring buffer, a write on every insert from four different insert paths, and a render — presented as calling code that already exists. The spec's §5 "What this does NOT do" then says *"No new component library… Sections/Elements/Components are the file's own existing masters"*, which reinforces the impression that RECENT costs nothing.

**The fix:** either delete the RECENT band from §3, or move it into the dependency section as new work. The favourites half is real and is the cheaper win the spec should be claiming.

### 1.2 `SPEC-PUBLISH-PANEL` §1 / §6 — "cancellation is built end to end … the worker checks between steps" overstates the worker, and acceptance #5 asserts something the product can contradict. **Critical.**

The chain the spec describes is real: `usePublishJob.ts:231` → `PublishService.ts:124-125` → `sites.ts:402-417` → `publish.service.ts:412-431` → the worker's `checkCancelled` (`packages/dashboard/app/api/workers/publish/[jobId]/route.ts:247-253`), called at `:365, 370, 374, 387` and `:408`. "Zero UI call sites" is correct.

Two things the spec does not say:

- **There is no cancel check across the Vercel deploy.** `checkCancelled` is called at `:374`, then `runVercelDeploy` runs at `:375`, and the next check is at `:387` — nothing at `:392`, nothing inside the deploy. A cancel pressed while Vercel is deploying is not observed until the deploy resolves, and **the deploy lands.**
- **`DEPLOYING` is not cancellable at all.** `publish.service.ts:414` permits only `QUEUED` and `BUILDING`; anything else returns `NOT_CANCELLABLE`. Latent today because the worker only ever writes `"BUILDING"` (`route.ts:110`), but it is the hole that opens the moment the status vocabulary is fixed — which is fix #7 in this spec's own table.

Acceptance #5 reads: *"Press Cancel during a run. The job reaches CANCELLED and the panel draws a cancelled state that says nothing was deployed."* On the branch above, that copy is a lie the panel tells. And `publish.service.ts:425-428` forces `site.status = "DRAFT"` on cancel, which mislabels a site still serving a previous deploy.

**The fix:** the §1 row should read "cancellation is built for the build phase only"; fix table row 5 needs a second location — the worker's missing checks around `runVercelDeploy`, and `publish.service.ts:414`'s status allow-list; and acceptance #5's copy needs to survive a cancel that arrives too late.

### 1.3 `SPEC-INSERT-PANEL` §2/§3 rewrites a founder-final taxonomy and changes a boarded default, with no board amendment. **Major.**

`blocks/groups.ts:1-19` opens:

> *"Insert board taxonomy — founder-final 2026-08-07: ELEMENTS · BLOCKS · COMPONENTS · MINE."*

and `BuildTab.tsx:48` records the default:

> *"Board 137:2 taxonomy: ELEMENTS open (▾), the rest closed (▸)."*

§2 renames BLOCKS to **Section**, folds MINE into **Component**, and §3 makes **SECTIONS open by default, not ELEMENTS**. Both are visual changes to boarded states, and under the precedence rule in `packages/editor/CLAUDE.md` — *behaviour → the code contract, everything visual → the board* — they require the board to move first.

`SPEC-PAGES-PANEL` handles the identical situation correctly and says so out loud: *"This is a visual addition and the board does not have it… this needs 140:2 redrawn before it is built."* `SPEC-INSERT-PANEL` says nothing, and its §5 "What this does NOT do" implies the opposite. Two specs, one rule, two behaviours.

(§2's three-kind table and §3's four-group drawing also disagree with each other about whether MINE is a kind or a group.)

---

## Part 2 — The specs contradict each other

### 2.1 The expanded drawer is 560 in one spec and 700 in two others. **Critical — it is the number three panels are drawn at.**

- `SPEC-NAVIGATION` §5.2: `--bk-size-drawer-wide` = **560**, and consequence 2 is titled **"700 leaves the drawer."**
- `SPEC-PAGES-PANEL` §preamble: *"The panel is 280 wide … **700 when expanded**."*
- `SPEC-PUBLISH-PANEL` §3: *"The expanded **700** state adds width to the change list and nothing else."*

Code agrees with Pages and Publish today (`LeftSidebar.tsx:586-587`). Navigation is proposing to change it and the other two are drawn against the current value.

Worse, the same consequence adds a behaviour the others deny: *"the drawer additionally **collapses the inspector** while wide."* `SPEC-PUBLISH-PANEL` says the expanded state changes "nothing else"; `SPEC-INSPECTOR` §6 says *"No new panel width. 300, `--bk-size-inspector`"* and never contemplates being collapsed. Three specs, one layout, three answers.

### 2.2 AI's home: `SPEC-INSPECTOR` attributes to `SPEC-NAVIGATION` a decision `SPEC-NAVIGATION` does not make. **Major.**

`SPEC-NAVIGATION` §2.5:

> *"The boards put AI in the inspector column with a '‹ Inspector' way back (`StudioPanels.tsx:291-300`)… delete the `ai` case from the left `TabRouter`."*

`SPEC-INSPECTOR` §6:

> *"That is `SPEC-NAVIGATION.md` §2.5's decision — one AI home, **docked beside the inspector rather than over it** — and this spec inherits it rather than re-deciding it."*

Navigation says *in* the column. The code it cites says *replacing* it — `StudioPanels.tsx:494-501` renders `AITab` **instead of** `ProInspector` inside `LayoutShell.Inspector`. Inspector says *beside*. "Beside" is a different fix, it is the one that would actually close `UX-D-01` ("selecting an element afterwards does not restore it"), and it needs horizontal room that neither spec allocates — the column is 300px and Navigation's §5.2 table gives it no sibling. A spec that says it is inheriting a decision has quietly replaced it.

### 2.3 Unpublish: two incompatible fixes for one seam, and the panel spec never mentions it. **Major.**

`SPEC-NAVIGATION` §6: *"'Unpublish site…' must confirm **in the menu's own flow**. It cannot ship the user to another panel and hope that panel is listening."*

`PublishTab.tsx:179-183` records the opposite decision, with its reason:

> *"This panel hosts the ONE confirm; the site menu opens the panel and asks it (UI_UNPUBLISH_REQUEST) **rather than hosting a second dialog with drifting words**."*

`SPEC-PUBLISH-PANEL` keeps that design — §3 draws "Unpublish site…" in LAST DEPLOY, which is where `PublishTab.tsx:615-624` already renders it — and **does not mention `UX-F-30` anywhere**: not in its §1 table, not in acceptance, not in its fix table. So a Critical race living inside the Publish panel's own listener is assigned by the Navigation spec and unacknowledged by the panel's spec, and the two proposed fixes cannot both be built.

One fact neither spec noticed, and it belongs to Publish: the panel's Unpublish row sits **inside** the `!justPublished` gate at `PublishTab.tsx:602`. On every fresh load of a published site — the exact bug `UX-E-01` describes — the panel's only Unpublish control is hidden along with the two sections §1 already names.

### 2.4 Two specs propose overlay widths that `SPEC-NAVIGATION`'s own rule forbids. **Major.**

`SPEC-NAVIGATION` §5.2: *"A new number is a new class, argued in the spec — never a literal at a call site,"* with modal classes at **440 / 520 / 700**.

- `SPEC-PUBLISH-PANEL` §3 draws the checklist at **560** — which in Navigation's table is `--bk-size-drawer-wide`, a drawer class, not a modal one.
- `SPEC-PAGES-PANEL` §3 draws the delete confirm at **420** — no class at all.

Neither spec argues a new class. Both would land as fresh literals at fresh call sites, which is the failure mode §5.1 exists to end.

### 2.5 `SPEC-PUBLISH-PANEL`'s door inventory goes stale under `SPEC-NAVIGATION`'s restructure. **Minor, but it is a preamble correction and will be quoted.**

Publish's preamble names three doors: *"the topbar CTA, bare `U`, and SiteMenu's 'Publish panel' row."* Navigation §4 moves every in-editor destination out of the ⋯ menu into the More index, and §2.2's More index prints `▲ Publish U` as a row. After Navigation, the third door is the More index, not SiteMenu. (Separately: the SiteMenu citation is wrong — see §6.)

### 2.6 The topbar's settled state: "Up to date" vs "enabled whenever the answer is unknown." **Minor — one decision, currently two.**

`SPEC-NAVIGATION` §4: the CTA *"says 'Up to date' in the settled state and stays put."*
`SPEC-PUBLISH-PANEL` §2.1 corollary: *"the CTA is enabled whenever the answer is unknown. Republishing identical content is harmless."*

Both surfaces are now supposed to read one derivation (`deriveLifecycleState`), which makes the resting state a single decision. Two specs make it twice, differently, and only Publish's version has an acceptance criterion (#1, #3).

---

## Part 3 — Missing dependencies: the tables are incomplete, and three state a wrong count

This is the question the specs are supposed to answer with a closing table. All five tables are short. Three of them are short *and* announce a number.

### 3.1 `SPEC-NAVIGATION` — "Four of the twelve" is at least ten, and the table under that sentence has five rows. **Critical.**

The heading reads *"Four of the twelve depend on changes no drawing can make"* and is immediately followed by a five-row table (#3, #4, #8, #9, #10). Six further acceptance criteria have code dependencies with no row anywhere:

| Acceptance | Depends on | In the table? |
|---|---|---|
| **#2** "the rail reports its selected item with the drawer shut" | `LeftSidebar.tsx:137` `isVisibleActive = isSelectedTab && drawerOpen`, bound to `aria-selected` at `:153`. Splitting selected from open is a code change. | **no** |
| **#5** "one palette answers ⌘K and ⌘⇧P; one shortcuts screen answers `?` and ⌘/" | merging `useCanvasCommandPalette` into the shell palette; merging two help surfaces that three files document as deliberately separate; and rebinding "Fit to view" (`CommandPalette.tsx:132-136` prints `Ctrl+0`; `CanvasFooterToolbar.tsx:251-253` binds `0` to 100% and `241` binds `1` to fit) | **no** |
| **#6** "'Site settings' reaches Domains" | re-pointing the ⋯ row and `Ctrl+,` off `ProjectSettingsModal` onto the full-page surface, and folding three tabs in | **no** |
| **#7** "AI opens in one column" | deleting the `ai` case from `TabRouter`, re-routing `I`, and the §2.2 exclusion of AI from the More index | **no** |
| **#11** "every width in the shell resolves to a class token" | the token rename, three new tokens, and edits at all ten literal sites in §5.1 | **no** |
| **#12** "at 1439px the editor says it is desktop-only" | building the state `LayoutShell.css:354-359` promises — an empty `@media` block whose only content is a comment | **no** |

Ten of twelve, not four. The one-line-per-fix table is the handoff artifact; as written it tells an implementer that eight of the twelve are drawings.

### 3.2 `SPEC-INSERT-PANEL` — no dependency table at all. **Critical.**

It closes with one sentence naming `useDropExecution.ts:302-303` (verified exact: `(handleBlockDrop as any)(e, ctx, payloads);` / `dropSucceeded = true;`) and says acceptance #6 depends on it. Four of the other five acceptance criteria also depend on code, none named:

| Acceptance | Depends on |
|---|---|
| **#1** every entry appears once | the catalog is 53 element rows whose `blockId`s are all registry blocks (`catalog.ts:4` — *"Every entry has a blockId that exists in blockRegistry"*), and BLOCKS + COMPONENTS is that same registry split at `blockRegistry.ts:100-208`. De-duplicating is a registry and taxonomy change. |
| **#2** everything drawn as draggable can be dragged | `GroupSection.tsx:189` puts `draggable` on ELEMENTS rows only; the BLOCKS card (`:236-259`), the COMPONENTS row (`:206-212`) and the MINE row (`:216-222`) have none, and no `onDragStart`. |
| **#4** search returns MINE | `utils/search.ts:17-19` types the hit union as `ELEMENTS \| BLOCKS \| COMPONENTS`. MINE is not a case. |
| **#5** open state survives leaving the tab | `BuildTab.tsx:49-51` is `React.useState(new Set(["elements"]))` — component-local, and the tab unmounts. |

The spec's arithmetic, for the record, is exactly right and worth keeping: 53 elements + 50 blocks + 14 components = **117 offerings**; `blockDefinitions` is **64** entries and `componentBlockDefinitions` is **14**, so `blockRows` is **50**; `hero`, `features` and `cta`/`footer`/`navbar` — the three the onboarding step names (`onboardingSteps.ts:61`) — split, with navbar/footer/cta present as element rows (`catalog.ts:395,403,411`) and **hero and features absent**. Every number in §1 checks out. It is the dependencies that are missing, not the diagnosis.

### 3.3 `SPEC-PUBLISH-PANEL` — "Two of these — 8 and 12 — are server-side" is wrong; seven of fourteen are. **Major, and it is the closing sentence.**

| Fix | File | Package |
|---|---|---|
| 6 | `app/api/workers/publish/[jobId]/route.ts:201` | **packages/dashboard** |
| 7 | `route.ts:45` (`"active"`) + `PublishTab.tsx:239` | **dashboard** + editor |
| 8 | `server/services/publish.service.ts:50-105` | **server** |
| 11 | `publish.service.ts:329` | **server** |
| 12 | `server/services/cms.service.ts:212-215` | **server** |
| — | `server/trpc/routers/sites.ts:339-343,382` | **server** |
| — | `route.ts:406-440` (deploy mode) | **dashboard** |

The sentence that follows — *"A design review that signs off this panel without them signs off a screen that will still certify a publish the server refuses"* — is the right warning pointed at the wrong subset. Five more fixes carry the same risk and the same review boundary.

One thing that *does* hold, checked because acceptance #12 depends on it: `cms.service.ts:213` is the only server-side `<title>` writer in the publish path. `lib/publish-html.ts` writes none. Fix 12's single location is sufficient.

### 3.4 `SPEC-PAGES-PANEL` — four §4 proposals with no table row. **Major.**

The table has thirteen rows plus one. Absent from all of them:

- **"One page-actions menu, used by both surfaces"** (§4, `UX-B-15`). This is the largest single refactor the spec proposes — `PageContextMenu` becomes the implementation and `PageTabBar` composes it, so that `PageTabBar.tsx:207-210`'s missing external guard and `:406`'s hidden-vs-disabled Delete stop drifting. No row.
- **"One toast per user action"** (§4, `UX-B-11`/`UX-B-12`). `PagesTab.tsx:188-192` raises one toast per delete, each with its own Undo; `:151-154` bulk-duplicates silently. No row.
- **"A slug change offers the redirect, pre-filled, writing through the Redirects screen."** §5 says *"this spec adds a caller, not a surface"* — a caller is code, wiring page settings to `RedirectsScreen.tsx:62-64` and reading `slugHistory`, which nothing reads today. No row. (The spec's own closing note about `SlugChange` drifting from its schema is adjacent to this and does not cover it.)
- **The settings modal's labelled exit** (§4, `UX-B-14`). No row.

### 3.5 `SPEC-INSPECTOR` — five §3/§5 proposals with no table row. **Major.**

This is the best-cited of the five specs (see §7) and its table is still short:

- **"Every collapsed section carries a pill"** (§3, `UX-D-26`). The spec's own §1 proves why this is not free: `sectionApplies` reads `entry.styleKeys` (`registry/index.tsx:106`) and six sections declare `styleKeys: []` (`element.tsx:17,34,52,65`; `effects.tsx:24,81` — exactly the six named). A per-section has-content signal is sixteen component changes plus a registry contract change, and acceptance's implied footer-count replacement rides on it. No row.
- **"Custom CSS ships to everyone"** (§5, `UX-D-22`) — removing the `ctx.devMode === true` gate at `registry/element.tsx:74` and resolving the second Border implementation. No row.
- **"Visibility declares its real keys"** (§5, `UX-D-18`) — `registry/effects.tsx:130` declares `["display","visibility","opacity","pointer-events"]` while `VisibilitySection.tsx:37,42` writes `--hide-${breakpointId}`. No row.
- **"Duplicate class input responds"** (§5, `UX-D-24`) — `CSSClassesSection.tsx:77-82` returns before the field clear at `:92`. No row.
- **Acceptance #3 and #4** (the registry decision; folding `AnimationEditor` into one motion section) are code outcomes with no rows, though the table's other nine items are numbered to acceptance items.

---

## Part 4 — Acceptance criteria that cannot be checked as written

Six are genuinely unexecutable. The rest of each spec's list is observable, which is worth saying.

**`SPEC-NAVIGATION` #3 — "Press each of the thirteen bare letters."** There are **twelve**. `useSidebarKeyboard.ts:34-47` has a special arm for `"⇧A"` requiring `isShift`, and `tabsConfig.ts:163` gives Components `shortcut: "⇧A"`. The spec's own More index prints `Components ⇧A`, so it knows. A tester following #3 literally cannot complete it. It also collides with §2.5, which deletes the `ai` case from `TabRouter` — after which `I` puts no drawer panel on screen, which is what #3 asks the tester to confirm.

**`SPEC-NAVIGATION` #12 — "At 1439px the editor says it is desktop-only."** §5.2 consequence 4 keeps the threshold at **below 1024** (`LayoutShell.css:354`, `@media (max-width: 1024px)`). At 1439px the rule does not fire. The criterion fails on a correct implementation.

**`SPEC-NAVIGATION` #5 — "One palette answers ⌘K and ⌘⇧P."** §2.5 says *"retire ⌘⇧P."* A retired chord answers nothing. Pick one.

**`SPEC-NAVIGATION` #11 — "Every width in the shell resolves to a class token… the ten sites in §5.1 return zero."** Not satisfiable from §5.2's table: **140** (settings sub-nav), **380** (`BlockPickerModal.tsx:199`), **400** (`StructurePopover.tsx:63`) and **1100** (`PreviewOverlay.tsx:56`, and it is `max-w-[`, which the criterion's own grep spelling misses) have no class. Two more, **196** (`StudioFooter.tsx:243`) and **236**, are assigned to a 240 popover class — a silent visual change to the zoom flyout and the comment popover that no board amendment covers.

**`SPEC-INSPECTOR` #2 — "A form can be pointed at a destination by someone who does not know what an action URL is."** The second half ("a test submission arrives") is observable and good. The first half is a usability judgement requiring a user, not a check. Split it.

**`SPEC-INSPECTOR` #12 — "Ten tablet overrides do not push the first style control below the fold. Measured, not eyeballed — the panel is 300px wide and at 2× an 8px error is invisible."** The criterion is vertical; the justification is the panel's width. "Below the fold" is also undefined — presumably the 900px of the preamble's 1440×900, but it is not said. The mechanism behind it is real and verified (`BreakpointOverrides.tsx:85-127` emits a row *plus* an unconditional tinted banner per override, mounted at `ProInspector.tsx:501-505`, above the scroll container that opens at `:539`); the criterion just needs restating as "the first style control is above y=900."

**`SPEC-PUBLISH-PANEL` #5** — see §1.2. The state is reachable; the copy is not always true.

**`SPEC-PUBLISH-PANEL` #6 and `SPEC-INSERT-PANEL` #6** both say "force the failure" without naming a way to force it. Both are right to insist on it — this repo's own rule is that a null result is your harness — but a criterion that requires fault injection should name the injection point, or it will be signed off by reading the handler, which is exactly what it is trying to prevent.

---

## Part 5 — Internal arithmetic and self-contradictions

All six are in `SPEC-NAVIGATION`. It is the longest spec and the one most often quoted by the others, which is why they are worth fixing.

| # | Says | Is |
|---|---|---|
| 1 | §5.2: *"**Six classes.**"* | The table under it has **eight** rows (and ten tokens, counting `modal-{sm,md,lg}`). |
| 2 | §3: *"**Seven rows**, three headings"* under the More index | The drawing has **six** rows: Templates, Components, Publish, History, Review, Settings. AI is the seventh off-rail destination and §3 explicitly excludes it. |
| 3 | §5.1: *"the drawer has exactly **two** widths, 280 or 700"* | Three. The same section's own table lists **560** for the media detail drawer, and `LeftSidebar.tsx:577-579` names both: *"flow-specific widths (560 detail, 700 gallery)."* |
| 4 | §8: *"**Four** of the twelve"* | Five rows in the table beneath it; at least ten in reality (§3.1). |
| 5 | §7: the three new tokens *"each one replaces **at least two** literals already in the tree"* | `menu` replaces one (160), `modal-sm` one (440), `modal-md` one (520), `modal-lg` one (700). Only `drawer-wide` replaces two. |
| 6 | §2.2 + §4 move every in-editor destination into the More index — Settings among them | §2.5 keeps a "Site settings" row in the ⋯ menu and acceptance **#6** requires it: *"From the ⋯ menu, in one click."* §4 says what is left in ⋯ is *"leave the editor"* and *"act on this site."* Settings is neither. |

One more, not arithmetic but worth flagging: §6 proposes *"Move the overlay chords off keys the browser owns."* `CanvasFooterToolbar.tsx:220-223` records that as a decision already taken, with its reasoning — *"Taken anyway, because a chord printed on a control and not honoured is the worse of the two failures — and only the PLAIN chord is taken, so ⌘⇧R (hard reload) and F5 both still reload."* The spec reverses a documented decision without engaging the argument in the file. It may still be the right call; it should say why.

---

## Part 6 — Citation drift

Every load-bearing citation in all five specs was opened. **Nothing was found FALSE.** These drifted:

| Spec | Cited | Actual |
|---|---|---|
| PUBLISH §1 | `PublishTab.tsx:746-750` — *"in progress — please wait"* | `:741-745`. `:746-750` is closing JSX and a privacy comment. The blocking-check block cited as `:736-745` is `:736-740`. |
| PUBLISH preamble | `SiteMenu.tsx:74` — the "Publish panel" row | `:74` is the prop declaration `onOpenPublish?: () => void`. The MenuItem is **`:204`**. |
| PUBLISH preamble | `tabsConfig.ts:340` — *"publish → topbar Publish button"* | **`:341`**. `:340` is the `settings` line. |
| PUBLISH §1 | `StudioHeader.tsx:592-596` rendered as `isDirty \|\| savedAtMs > publishedAtMs \|\| serverHasUnpublishedChanges` | Right lines, wrong formula: `serverHasUnpublishedChanges` is a **fallback when a stamp is missing**, not a third OR term. |
| PUBLISH §1 | `usePublishSnapshot.ts:176-178` (`preview` hardcoded null) | `:179`. `changeCount` cited as `:156-166` is really `:181`; `:156-166` is the memo it derives from. |
| PUBLISH §1 | `usePublishJob.test.ts:390` "the only caller" of `cancel` | `:390` is inside the *no-ops without a job* test. The calls that reach `cancelPublish` are `:405` and `:421`. **The load-bearing claim — zero UI call sites — is true.** |
| PUBLISH §2/§4/§5 | `lifecycle.ts:160-250`; `publish.service.ts:198-232`; `PublishConfirmFacts.tsx:170-172`; `PublishTab.tsx:648-662`, `:788-806`; `useExportHandlers.ts:174-215` | `141-251`; the stale-job sweep is `215-233`; `168-171`; `654-663`; the Fix button is `793-807` (emit at `:801`); `175-217`. All off by a few lines, none changing the claim. |
| INSPECTOR §1, §7 | `ProInspector.tsx:192` — `searchQuery: ""` | **`:193`** (cited twice). |
| INSPECTOR §4 | `FormSettingsSection.tsx:115-131`, `:52-56`, `:45,54` | `:115-126`; `action: "submit"` is at **`:59`**; the second `setData("formConfig")` is at **`:64`**, not `:54`. |
| PAGES §1 | `usePageSettings.ts:107` — SEO title prefilled | **`:106`**. |
| PAGES §1 | `Navbar.tsx:17` — the four `href="#"` links | **`:18`**. |
| PAGES §1 | `statusLabel.ts:13-21` | `:13-19`. |
| PAGES §6 | `PageManager.ts:135` writes `{slug, changedAt}` | `:136`. |
| PAGES §5 | `HistoryManager.ts:129` — "one editor-wide stack" | `:129` is a listener registration, not the stack. |
| NAVIGATION §1 | `LayoutShell.css:353-358`; `ls-btn--last` at `LeftSidebar.css:189`; `StudioHeader.tsx:809-812` | `354-359`; `:191`; the two calls are `:810-811`. |
| PAGES §1 | *"all 13 non-test `getAllPages()` call sites"* (inherited from the QA pass) | 19 non-test occurrences across 14 files outside `engine/elements` and `Composer`. The absence the claim supports still stands; the count does not. |

Two claims the specs make about themselves that turned out **exactly right**, and are worth keeping because they were the ones most likely to be wrong:

- `SPEC-INSPECTOR`'s registry counts: **185 property definitions across 31 families**, both counted from the parsed export; `"menuEditor"` appears at exactly two lines repo-wide (`propertiesRegistry.ts:68` and `:1037`); zero production consumers of `PROPERTIES`; **16** sections in `CONTAINER_PROFILE.order`; **14 triggers / 39 presets / 25 presets**; the six `styleKeys: []` sections named individually.
- `SPEC-INSPECTOR` §4's correction of the QA pass on `FormSettingsSection`: `ExportEngine.ts:892` **is** the return type of `collectFormElements`, `:899` **is** the real read of `formConfig`, and `:909` (`if (formConfig.webhookUrl)`) **is** the only emit gate. The spec's sharper defect — two of the three Actions export nothing — holds at source.

---

## Part 7 — What held

**Question 1 comes back clean.** Nine of the corrected rows appear in a spec, and every one carries its correction:

| Corrected row | Where it is cited | Correction carried? |
|---|---|---|
| `UX-I-17` (REFUTED — Review's rail/zone/doors) | NAVIGATION §1 | yes — a dedicated paragraph, plus the `content`-has-no-`zone` counter-example |
| `UX-E-01`, `UX-E-04` (Publish is not a rail entry) | PUBLISH preamble | yes |
| the drawer is 280, not the 320 `SiteMenu.tsx:57` claims | PUBLISH preamble, PAGES preamble | yes, both |
| `UX-B-01` (no visible Draft badge) | PAGES preamble | yes, and sharpened |
| `UX-B-05` (the drag clause is impossible) | PAGES preamble | yes, with `UX-B-07` named as the row of record |
| `UX-B-32` ("no link producer" is false) | PAGES preamble | yes |
| `UX-D-14` (18 shared presets, not 16) | INSPECTOR §1 | yes, all 18 enumerated |
| `UX-F-07` (the issues panel is not inert) | NAVIGATION §1 | yes, as its own table row |
| `UX-D-09` (the QA pass's own `formSettings` error) | INSPECTOR §4 | yes, and the QA pass is corrected back |

`UX-C-25`, `UX-C-04`, `UX-I-30` and `UX-E-13` are not cited by any of the five specs. `SPEC-PUBLISH-PANEL` §5 explicitly rules `UX-E-13` out of scope. All 124 `UX-*` ids cited across the five specs exist in `findings/UX-{A..I}.jsonl`.

**`SPEC-INSPECTOR` is the soundest of the five.** Of 25 citation groups checked at source, 21 are exact and 4 drift by a few lines; nothing is false; every count it asserts was independently recounted and matched. Its weakness is only §3.5's short table.

**`SPEC-PAGES-PANEL` is second.** 24 of 26 citation groups clean, and it is the only spec that names its own board dependency out loud.

---

## Part 8 — One thing this pass could not settle

**`FIG-CO-20` and `SPEC-PAGES-PANEL` disagree about whether the Figma boards draw a Draft badge.**

- `FIG-CO-20`: *"Recorded because **the Figma boards draw a Draft badge**, and a board that shows Draft over a page the product publishes teaches the wrong model."*
- `SPEC-PAGES-PANEL` §3: *"**Board 140:2 draws rows with no chips**, and two tests pin that… this needs 140:2 redrawn before it is built."*

They may be about different boards, or one of them is wrong. It matters, because the spec's whole §3 proposal — one muted word in the existing right-hand slot — is justified by 140:2 having no publication signal, and the board-amendment request depends on it. **I could not check: this session has no Figma tools** (see §9).

---

## Part 9 — What I did NOT check

Stated plainly, because six of eighteen is six.

1. **No Figma board was opened.** This session has no Figma MCP tools. Every board claim in every spec is unverified by me: 140:2, 141:207, 137:2, 138:2, 52:6, 199:2, 170:2, 66:225, 641:2652, 784:4326/4403/4250, 833:4518, 949:4474, 1069:4790/4970, 817:4649/4723, 681:26, 16:6. That includes the §8 conflict above and every "the board does / does not draw X" sentence.
2. **The running app was never launched.** I checked whether each acceptance criterion is *observable*; I did not check whether any of them currently *passes*. Every "Critical" above is a document defect, not a live one.
3. **The 37 CONFIRMED rows in `UX-QA-REPORT.md` were not re-verified.** I took them as given and checked only the rows a spec depends on.
4. **The 295 `UX-*` rows were not re-audited.** I verified that every id a spec cites exists, and I opened the source for the claims the specs make from them — not the rows themselves.
5. **No dashboard-side gate was run** (`gate:figma`, `verify:ds`, the conformance harness). `FIG-CO-11`'s finding that `boards.json` reports `verified: "match"` over `recipe: null` is unexamined here and would change what any of these specs can claim about coverage.
6. **Only these five specs were read.** If other Phase 4 lanes produced specs, they are outside this pass.
7. **A working-tree hazard I could not resolve.** Several cited files are uncommitted in the founder's tree (`Composer.ts`, `ElementManager.ts`, `shared/types/project.ts`, `useDropExecution.ts`, `MediaCommandLayer.ts`). `shared/types/project.ts` in particular carries a 17-line `cmsBindings` insert at `:51`, so **every `project.ts` line number in `SPEC-PAGES-PANEL` is 17 ahead of HEAD** — `:233-248` in the working tree is `:216-231` in HEAD. If those changes are discarded, rebased or landed separately, that spec's citations move. Same shape for `useDropExecution.ts:302-303`, which `SPEC-INSERT-PANEL` hangs its single named dependency on. Specs pinned to an uncommitted tree should say which tree.
