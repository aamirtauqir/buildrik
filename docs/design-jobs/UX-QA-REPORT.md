# UX-QA-REPORT — adversarial pass over the nine UX audit lanes

**Date:** 2026-09-06 · **Scope:** `docs/design-jobs/findings/UX-{A..I}.jsonl` — 295 rows, 9 files, 13 modules
**Method:** re-read the cited source myself (plus three independent read-only verification lanes whose every REFUTED/OVERSTATED verdict I then re-checked against the file personally). Working tree read with `git diff`, not assumed. Read-only: no file under `packages/`, `server/`, `lib/` or `prisma/` was touched.

**Headline:** 48 claims re-verified. **11 are wrong** — two flatly refuted, eight overstated, one understated. Every one of the eleven is filed at `"confidence": "high"`. Two of them are the audit contradicting itself: a lane asserted an absence that another lane in the same audit had already documented as present.

The single worst one, and the reason to read this section first: **UX-I-17 reasoned from a code comment instead of the render path, and every load-bearing clause in it is false.**

---

## Part 1 — What the audit got WRONG

### 1.1 REFUTED

---

#### **UX-I-17 — REFUTED.** "Review is the only module with no rail button; its tab config carries no `zone`, and the zone-driven rail render therefore omits it. The FIRST send has exactly one door."

Four separate claims, four failures. The lane quoted a code comment as its evidence and never read the renderer.

| Clause | Verdict | Code |
|---|---|---|
| "the zone-driven rail render omits it" | **false** | The shipping rail is **not** zone-driven. `LeftSidebar.tsx:623-624` renders `FigmaRail` → `getFigmaRailGroups()` (`tabsConfig.ts:363-369`) → `RAIL_FIGMA` (`tabsConfig.ts:349-351`), an **explicit six-id allow-list**: `["add","layers","pages","assets","content","design"]`. `zone` is read by `getTabsByZone` (`:279-281`), which only the `legacy` rail uses. |
| the mechanism generally | **disproved by one counter-example** | `content` also has **no `zone`** (`tabsConfig.ts:245-263`) and **is on the rail** (`RAIL_FIGMA` includes `"content"`). Absence of `zone` cannot be what omits Review. |
| "the only module with no rail button" | **false** | Seven tabs are absent from `RAIL_FIGMA`: `ai`, `templates`, `components`, `settings`, `publish`, `history`, `review`. `tabsConfig.ts:340-347` lists six of them by name in its own comment. **UX-F-01, in this same audit, states this correctly.** |
| "exactly one door … buried in an overflow menu" | **false** | Three doors exist before any round: the Site-menu item (`SiteMenu.tsx:203`), the **bare `R` key** (`review` carries `shortcut: "R"` at `tabsConfig.ts:242`, and `useSidebarKeyboard.ts:34-47` iterates *all* of `GROUPED_TABS_CONFIG`), and ⌘K (`CommandPalette.tsx:49-63` builds a command for every tab with a shortcut). |

The comment the lane quoted — `tabsConfig.ts:233`, *"No `zone` → the zone-driven rail render leaves it out"* — describes a rail that has not been the default since the Figma rail shipped. `editorViewMode.ts:71` returns `"figma"` for every non-dev build; `legacy` and `e3` are unreachable in production.

**What survives, and should be the rewritten row:** Review has no rail button *and no persistent header affordance until a round exists* — `StudioHeader.tsx:136-137` (`REVIEW_PILL.none = null`) and `ReviewBar.tsx:116` (returns `null` outside PENDING/CHANGES_REQUESTED) are both correct as cited. The discoverable door before the first send is one overflow-menu row, with keyboard-only fallbacks. That is a real Critical. The mechanism, the superlative and the door count are not.

---

#### **UX-C-25 — REFUTED.** "The command palette prints 'D' on 'Open Content panel'. Bare D is bound nowhere."

**Bare D is bound, and it opens the Content panel.** `useSidebarKeyboard.ts:34-47` loops over every entry in `GROUPED_TABS_CONFIG` and binds each `shortcut` as an unmodified key:

```
for (const tab of GROUPED_TABS_CONFIG) {
  if (!tab.shortcut) continue;
  ...
  if (tab.shortcut === key && !isShift) { e.preventDefault(); onTabChange(tab.id); return; }
}
```

`content` carries `shortcut: "D"` (`tabsConfig.ts:259`), and the hook is mounted at `LeftSidebar.tsx:486`. The badge is telling the truth.

The lane's evidence sentence names the shortcut set of `useEditorShortcuts` (C, ⌘,, ⌘H, ⇧A, ⌘S, ⌘P, ⌘Z, ⌘/, ⌘J, Escape) and concludes "no other handler claims a bare D" — but the editor has **two** global key handlers, and the second one is the one that binds the rail letters. **UX-F-01 and UX-F-31 in the same audit both describe that second handler by name** ("a bare letter key (T, Shift+A, I, U, H, R)"; "Twelve panels are bound to bare, unmodified letters (A I T M L P B S U H R D)"). UX-F-31 literally lists D.

---

### 1.2 OVERSTATED — the conclusion survives, the evidence does not

---

#### **UX-C-04 — OVERSTATED.** Evidence sentence is false.

The row ends: *"Searched the constants ('CMS_CONTENT_PUBLISHED'), the raw strings ('content:published', 'content:unpublished') and the optional-call form ('on?.(') — **no listener anywhere**."*

There is a listener, on both events, registered with the exact constant the lane says it searched:

```
editor/shell/hooks/useCmsSync.ts:96   cm.on(EVENTS.CMS_CONTENT_PUBLISHED, onEntryUpsert);
editor/shell/hooks/useCmsSync.ts:97   cm.on(EVENTS.CMS_CONTENT_UNPUBLISHED, onEntryUpsert);
```

**The user-visible conclusion is still right** — that handler is `syncEntryUpsert`, a server mirror (`useCmsSync.ts:87`); it does not touch the canvas. The two things that *would* refresh a bound element genuinely do not listen: `CMSBindingManager.ts:75-77` subscribes to `content:created`/`updated`/`deleted` only, and `useCMSPreview.ts:123-124` to `updated`/`created` only. So the canvas does not change when the Published switch flips.

But "no listener anywhere" is exactly the sentence the brief warns about, and it is false. Rewrite the evidence to "no listener that re-resolves a binding".

---

#### **UX-B-05 — OVERSTATED.** One of the two hazards it names is impossible, and its own lane proves it.

B-05: *"Dragging a page to the top changes what the site serves at its root; deleting the first page does the same."*

The drag half cannot happen. `PageList.tsx:313-314` is the only reorder call site and it always passes a target id:

```
onReorderDrop={(draggedId) => composer?.elements.reorderPage(draggedId, page.id)}
```

`PageManager.reorderPage` (`:337-356`) computes, at `:342`, `insertIndex = afterId === null ? 0 : ids.indexOf(afterId) + 1`. Index 0 is reachable **only** with `afterId === null`, which no caller passes. **UX-B-07, in the same file, says exactly this** — "No drag can put a page in first position … The engine supports prepending; no part of the UI ever asks for it." B-07 is right; B-05's first clause contradicts it.

The delete half stands: `resolveHomePageId` (`ExportEngine.ts:145-146`) falls back to `pages[0]`, and `PageManager.ts:243` is the only writer of `isHome`.

---

#### **UX-E-01 (screen label) and UX-E-04 — OVERSTATED.** Publish has no rail button.

- UX-E-01's `screen` is `"Publish panel (rail · U)"`.
- UX-E-04: *"The rail still shows Publish (shortcut U)"*, evidenced as `tabsConfig.ts:202-216 (rail entry, no flag gate)`.

`publish` is in `GROUPED_TABS_CONFIG` but **not** in `RAIL_FIGMA` (`tabsConfig.ts:349-351`), so it draws no rail button in the shipping rail. The file says so itself at `:345`: *"publish → topbar Publish button"*. A `GROUPED_TABS_CONFIG` entry is a panel definition, not a rail entry — the two were conflated.

Both rows' substance is unaffected (E-01's `justPublished` trap and E-04's two-contradictory-blockers are both **CONFIRMED** below). Fix the labels; the U shortcut is real, the rail button is not.

---

#### **UX-I-30 — OVERSTATED.** Same error, other module. *"The rail's Settings is a full-page surface with 13 sections."*

`settings` is likewise absent from `RAIL_FIGMA`; `tabsConfig.ts:344` says *"settings → topbar ⋯ site menu"*. The duplicate-surface finding is CONFIRMED; the phrase "the rail's Settings" is not. **UX-F-12 and UX-F-13 in the same audit say the opposite** — "reachable only by pressing bare 'S', by the ⌘K row…" and "it is entered from tabs that have no rail button."

---

#### **UX-E-13 — OVERSTATED.** "no toast, no inline error" is only half true.

The ZIP path is exactly as described — `ExportModal.tsx:134-136` — `catch { devError("ExportModal", "Failed to generate ZIP", error) }` at `:135` and nothing else.

The React path is not. `ExportModal.tsx:155-160`:

```
} catch (error) {
  devError("ExportModal", "React export failed", error);
  setResult({ success: false, error: error instanceof Error ? error.message : "Export failed" });
}
```

…which renders `<ErrorState error={result.error} />` at `:244` (component at `:385`). That is a visible inline error. "No toast" is correct for both (the file imports no toast API).

The orphan half is **fully CONFIRMED** and is the sharper finding: `onExportHTML` appears in `StudioHeader.tsx` at exactly three places — `:113` (prop type), `:201` (destructure), `:819` (a comment describing what it used to do) — and is **never invoked**. `AquibraStudio.tsx:520` passes `handleExportHTML` into a prop nothing calls.

---

#### **UX-B-01 — OVERSTATED.** There is no visible Draft badge.

*"Every page the user creates wears a 'Draft' badge."* The mechanism is exact and CONFIRMED (`usePages.ts:120` defaults to `"draft"`; `ExportEngine.ts:120-122` `isPageLive` returns `true` for `undefined`; `usePublishSnapshot.ts:172` counts by it). But nothing renders the badge:

- `getStatusLabel` has one consumer, `PageRow.tsx:139`, and its output is spliced only into `ariaLabel` (`:143`).
- The chip CSS `.bd-pg-chip.draft` exists at `PagesTab.css:297`, and **no `.tsx` file references `bd-pg-chip`** — `PageRow.test.tsx:70` asserts it is null.

So the "Draft" claim is an accessible-name-only artifact. Arguably worse than filed: sighted users get *no* publish signal at all, and screen-reader users get a wrong one. Rewrite rather than downgrade.

---

#### **UX-F-07 — OVERSTATED.** "the panel it opens goes nowhere."

The row wiring is exactly as claimed — `IssuesPanel.tsx:238-243`, the row's only handler is `onSelectElement`, and `AquibraStudio.tsx:625` binds that to `() => setIssuesOpen(false)`. But the panel is not inert:

- `IssuesPanel.tsx:252-261` renders a working **`Fix ›`** button (label at `:260`) beside every fixable row (`AquibraStudio.tsx:630-634` → `composer.designSystem.applyAutoFix`).
- `IssuesPanel.tsx:200-202` renders a working **Open Brand** in the fix-failed band (`AquibraStudio.tsx:635-638`).

Restate as: *"the issue row is not a navigation target — clicking an issue's text dismisses the panel instead of taking you to the element."*

---

#### **UX-D-09 and UX-B-32 — evidence sentences slightly false, conclusions solid.**

- D-09: *"repo grep for 'FormSettingsSection' returns only that file, that barrel line, and nothing that renders it."* It returns four files — a **test renders it six times** (`shared/forms/__tests__/FormSettingsSection.test.tsx`), and `FormsScreen.emptyCopy.test.ts:13` carries a comment already saying *"FormSettingsSection) has no consumer, so a user cannot reach it either."* No production mount: **CONFIRMED**. Bonus defect nobody filed: the section writes `element.setData("formConfig", …)` (`FormSettingsSection.tsx:45,54`) while the exporter reads `formSettings` (`ExportEngine.ts:892`) — mounting it would still not deliver a form.
- B-32: *"the page list has no consumer that produces links at all."* `LinkSection.tsx:85` reads `getAllPages()` and `:191` writes `#page:<id>` — that *is* a link producer, one element at a time. Restate as "no surface maps the page list to a link *set*." The absence itself survives a 12-spelling sweep (`nav`, `navigation`, `navbar`, `menu`, `siteNav`, `navItems`, `navLinks`, `buildNav`, `generateNav`, `autoNav`, `menuItems`, `pageLinks`) plus an audit of all 13 non-test `getAllPages()` call sites. Also: `blocks/Navigation/index.ts:5` is `// No exports yet — placeholder directory`, and `propertiesRegistry.ts:1037` declares `"navbar.menuItems": { type: "menuEditor" }` with **no renderer anywhere** — a stronger version of the same finding.

---

### 1.3 UNDERSTATED

#### **UX-D-14 — the "sixteen presets appear in both lists" figure is wrong; it is eighteen.**

Counted programmatically from `sections/interactions/types.ts:95-147` and `editor/animation/AnimationEditor.tsx:21-53`, the exact-label intersection is **18**: Bounce, Fade In, Fade In Down, Fade In Left, Fade In Right, Fade In Up, Fade Out, Flash, Pulse, Rotate In, Rubber Band, Shake, Slide In Down, Slide In Up, Swing, Wobble, Zoom In, Zoom Out. Plus three near-misses a user reads as the same thing: Heartbeat/Heart Beat, Flip X/Flip In X, Flip Y/Flip In Y.

The rest of D-14 is exact — 14 triggers, 39 presets, 25 presets, and the two sections are adjacent in **all seven** profiles (`elementProfiles.ts:59/60, 79/80, 99/100, 120/121, 141/142, 161/162, 184/185`).

---

## Part 2 — What held up

37 claims re-verified against source and **CONFIRMED**, several with the mechanism traced further than the lane took it.

| id | verdict | decisive line I read |
|---|---|---|
| UX-A-01 | CONFIRMED | `useDropExecution.ts:302-303` — `else { (handleBlockDrop as any)(e, ctx, payloads); dropSucceeded = true; }`. `dropOperations.tsx:375` — `handleBlockDrop(e, ctx)` takes no payloads and re-reads `getData("block")` at `:376`. It is the only branch after `await handleComponentDrop` (`:293`), and only `handleCatalogDrop` (`:542-550`) accepts payloads. Insert drags set only `"block"` + `"text/plain"` (`useElementsState.ts:165-175`), so they always land in that terminal branch. |
| UX-A-02 | CONFIRMED | `useElementsState.ts:158` fires the success toast, `:160` calls `onBlockClick?.(block)` after it. |
| UX-A-05 | CONFIRMED | `GroupSection.tsx:248-256` — `{b.preview ? <img …/> : <div class="…bg-[var(--bk-bg-subtle)]"/>}` (the blank 80×136 fallback is `:255`); `grep -rn preview src/blocks/` → **zero hits**. `preview?: string` is at `shared/types/block.ts:27` (cited `:25`). |
| UX-B-03 | CONFIRMED | `usePageSettings.ts:271` writes `visibility` **unconditionally** — all 14 occurrences of `visibility` in the file checked, nothing gates it. `PageManager.ts:155-158` merges it in. |
| UX-B-04 | CONFIRMED | `PagesTab.tsx:329`, `LinkSection.tsx:191`, `ExportEngine.ts:801-802`. Sharper than filed: `pageHrefs` is built at `:788` from the **live-filtered** set, so a link to a *hidden* page silently becomes a link to Home too. |
| UX-B-10 | CONFIRMED (upgrade confidence) | `PageSettingsDrawer.tsx:40-45` — dep array `[s.isDirty, s]`, and `usePageSettings` returns a fresh literal at `:363`, so the 500ms timer restarts on every render. The lane filed this `medium`; the loop is mechanical. |
| UX-B-13 | CONFIRMED | `pageUtils.ts:16-20`, `usePages.ts:176-198`, `PageManager.ts:61-93` (no check), `PagesTab.tsx:99-105` (rename only). Extra: `ExportEngine.ts:784-791` already dedupes colliding slugs to `page-3-2.html` — a URL the user never chose and never sees. |
| UX-B-32 (core) | CONFIRMED | see §1.2 |
| UX-C-01 | CONFIRMED | `packages/shared/schemas/sites.ts:185-214` — `projectData` is a plain `z.object`, **no `.passthrough()`** (the file uses `.passthrough()` three times elsewhere, at `:91`, `:115`, `:132` — so its absence here is a choice, not an oversight). `BuildrikSyncProvider.ts:293-338` rebuilds `ProjectData` field-by-field with no `cmsBindings`. `useComposerInit.ts:526` picks `saveProject(siteId, snapshot)` when a siteId exists. The founder's working-tree fix (`Composer.ts:569-572` import, `:619-633` export, `project.ts:51-65` type) is real and reaches only the localStorage editor. |
| UX-C-02 | CONFIRMED | `CollectionManager.deleteCollection` (`:154`) has no UI caller — engine + tests only. Note the whole chain below it exists: `cmsSync.ts:197` → `cms.collections.delete` → `server/trpc/routers/cms.ts:69` → `server/services/cms.service.ts:62`. A finished delete pipeline with no button on top. |
| UX-C-03 | CONFIRMED | `DataManager.ts:488,490` set/remove `data-condition-hidden`; repo-wide grep across `.ts/.tsx/.css/.mjs` finds it nowhere else but the test (`DataManager.test.ts:383-395`) and build artifacts. No stylesheet, no export reader. |
| UX-C-05 | CONFIRMED | `CMSBindingManager.ts:120-123` — `queryContent({ collectionId, filter: {} })`, no status. |
| UX-C-06 | CONFIRMED | `bindCollection` (`CMSBindingManager.ts:208`, `DataManager.ts:394`) has no UI caller; `collectionPicker` appears at exactly two lines (`propertiesRegistry.ts:47`, `:875`) and no component renders that type. |
| UX-C-08 | CONFIRMED | `useContentPanel.ts:164-166` — `createContentItem` then `updateContentItem({status})`; `CollectionManager.ts:301-307` runs validation **only** on the publish transition and throws, leaving the draft. |
| UX-D-02 | CONFIRMED | `useLayerSelection.ts:68-75` selects with no lock branch; `Canvas.tsx:613` pick mode likewise. The toast string `"This element is locked"` appears only in `useSelectionBehavior.ts` (3×). Nothing functional in `editor/inspector/` mentions lock. |
| UX-D-04 | CONFIRMED | Every citation exact. Accumulation proven further at `Composer.ts:553-559` — every page's tree enters the single registry at load. |
| UX-D-07 | CONFIRMED | `propertiesRegistry` survives only in two **comments** (`registry/index.tsx:124`, `registry/_shared.tsx:177`), both past-tense descriptions of a prior design. No import anywhere. |
| UX-D-08 | CONFIRMED | `elementProfiles.ts:246-254` maps list/table/nav/navbar/slider/accordion → `CONTAINER_PROFILE`; `tabs` is absent entirely. `elementProperties/config.ts` top-level keys contain none of them, so `getPropertiesForType` returns `default` = id/title/tabindex. All 17 `defineSection` keys enumerated: none is component-level. |
| UX-D-09 | CONFIRMED (evidence corrected §1.2) | `registry/element.tsx:14-75` registers only link / element-properties / css-classes / all-css. |
| UX-D-22 | CONFIRMED | `registry/element.tsx:74` `shouldRender: (ctx) => ctx.devMode === true` → `ProInspector.tsx:95` `USE_DEV_MODE` → `featureFlags.ts:17-25,35` reads `localStorage["buildrick:dev-mode"] === "1"` **at module load**. Nothing in the UI calls `setItem` for it. |
| UX-E-01 | CONFIRMED | `PublishTab.tsx:222`, `:462`, `:549`, `:602`, `:698` all exact. `HistoryManager.ts:658-660` — `getHistoryStack()` *skips index 0*, so after the load handler wipes and pushes one `recordCheckpoint("loaded")` the display stack is `[]` → `changeCount === 0` → `justPublished` true on arrival. |
| UX-E-17 / UX-F-09 | CONFIRMED, both challenge checks in the claim's favour | `sandbox=""` is **literally in the JSX** at `PreviewOverlay.tsx:106`. Other iframes in the repo *do* grant tokens (`TemplatePreviewModal.tsx:206`, `PreviewFrame.tsx:147` `allow-same-origin`; `ExportUtils.ts:110` `allow-same-origin allow-forms allow-pointer-lock`) — only Preview and `ApprovedCompareView.tsx:92` use `""`. `combined` really is one page: `Composer.ts:656` → `ElementManager.ts:273` → `HTMLParser.toHTML:39-49`, which reads `getActivePageId()` and returns `""` if absent. No loop over pages. `PreviewOverlayProps` is `{ html, onDone }` — no page switcher can exist. |
| UX-F-01 | CONFIRMED, counts exact | `RAIL_FIGMA` = 6; `GROUPED_TABS_CONFIG` = 13 (`grep -c '^    id: "'`); `TabRouter.tsx:125-244` = 12 `case` arms. The file's own header at `tabsConfig.ts:4` says "11 sidebar panel definitions" — stale by two; the lane correctly ignored it. |
| UX-F-30 | CONFIRMED | `StudioHeader.tsx:810-811` — `onOpenPublish?.()` then `composer?.emit(EVENTS.UI_UNPUBLISH_REQUEST)` in one synchronous arrow body, no `setTimeout`/`queueMicrotask`/`rAF`. `onOpenPublish` is a React state setter (`useStudioState.ts:316-326`), applied after the handler returns. Sole listener is `PublishTab.tsx:190`, and `PublishTab` is `React.lazy` (`TabRouter.tsx:42`). **`engine/EventEmitter.ts` has no replay/sticky/queue field** (grepped `replay|buffer|sticky|lastEvent|queue` — zero hits), so a late subscriber gets nothing. |
| UX-G-01 | CONFIRMED | The `settings/ai` page does **not** refute it: `packages/dashboard/app/dashboard/settings/ai/page.tsx:1-22` is `AICreditsPage` — usage meters only, no key input. 16 settings pages; grep of four spellings (`API key`, `apiKey`, `API_KEY`, `OPENAI`/`OLLAMA`) across `app/dashboard/settings` + `components/settings` hits only `integrations-tab.tsx:20` (Mailchimp). |
| UX-G-02 | CONFIRMED | Two mounts, no shared store: grepped `createContext`, `zustand`, `useStore`, `localStorage` across all 11 files of `editor/sidebar/tabs/ai/` — zero hits. Message list is per-mount `React.useState` at `AITab.tsx:50`. Nothing sets `aiInInspector = false` when the drawer routes to `ai`, so both can be live at once. |
| UX-G-07 | CONFIRMED after a full env sweep | `FEATURE_DS_AI` is set in **no** env file. Explicitly grepped `.env`, `.env.example`, `.env.local`, `.env.local.example`, `.env.production.local` at root and in `packages/dashboard`. The only `FEATURE_*` keys assigned anywhere are `VITE_/NEXT_PUBLIC_FEATURE_PUBLISH` (`.env.local:43,79`, `.env.production.local:14`) and `VITE_FEATURE_ACCOUNT`/`_INVITE` (`.env.example:31-32`). Also: `DesignSystemTab.tsx:837` **always** passes `onOpenAIAssist`, so the CTA's own `disabled={!onOpenAIAssist}` can never fire. |
| UX-G-09 | CONFIRMED — all three escape hatches checked | (a) POST with a bare body, no `?batch=1`, not the `input=` query form. (b) `@trpc/server/dist/resolveResponse-*.mjs:86-97` — the non-batch arm is `transformer.input.deserialize(await req.json())`, i.e. the raw body goes straight to the transformer. `superjson@2.2.6/dist/index.js:45-50` destructures `{json, meta}`; with no `json` key it returns `undefined`. (c) `packages/dashboard/app/api/trpc/[trpc]/route.ts:57-62` is the only route file and does no body rewrite. `server/trpc/trpc.ts:57` `transformer: superjson`. Zod input schemas (`routers/ai.ts:67-86`, `:89-105`) are non-optional objects → BAD_REQUEST before either resolver runs. |
| UX-H-02 | CONFIRMED | `services/stock/StockService.ts:80-83` and `:94-97` — `catch { …return []; }` on both search methods. `setSearchFailed(true)` has exactly one call site (`useDiscoveryState.ts:121`) and it is reachable only from a non-abort throw the service prevents. The failure UI is real and dead: `StockSourceModal.tsx:351-366`. |
| UX-H-03 | CONFIRMED | `MediaTab.tsx:381-393` renders `StockBrowserOverlay` with no `searchFailed` prop, and the component contains no `searchFailed`/`failed` reference at all. |
| UX-H-05 | CONFIRMED | `MediaTab.tsx:73` `useState(false)`; the only setter call in the file is `setStockModalOpen(false)` at `:234`. Nothing sets it true. (`LibraryManager.tsx:326,388` — the fullpage manager — has its own copy that *is* opened.) |
| UX-H-14 | CONFIRMED, and extended | `useLayerActions.ts:81-91` reads localStorage and pushes it one-way into the engine; grep of `isLocked` across `editor/panels/layers/` finds only the derived `lockedIds.has(...)`. The half the lane asserted but did not evidence checks out: `ElementSerialization.ts:46-50` `toJSON()` spreads `data.locked` into the persisted project, so the lock really does travel and the panel really will draw an open padlock on a fresh browser. |
| UX-I-01 | CONFIRMED | `ActivityView.tsx:360-393` — every branch reaches `restoreEntry`; **zero `toast` hits in the file**. `HistoryManager.restoreEntry` truncates at `:721` / `:724`. "No way back" is precise: the checkpoint pushed at `:727-732` returns you to the *restore target*, not to the pre-click present. |
| UX-I-03 | CONFIRMED on all three challenge checks | Listener is on `document` (`TimeTravelScrubber.tsx:284`). Zero guards — the file's only `HTMLInputElement` mention is a slider type annotation at `:253`. Default index really is the middle (`:74` `Math.floor(historyStack.length / 2)`). The search input really is on screen (`HistoryTab.tsx:240` opens the `saves` block; the scrubber renders additively at `:383-391`). Sibling handler `ActivityView.tsx:268-272` *does* guard — two keydown handlers in one panel, one safe and one not. |
| UX-I-05 | CONFIRMED | `HISTORY_CAPACITY_WARNING` appears at exactly one line repo-wide: the declaration at `shared/constants/events.ts:133`. Zero emitters, zero listeners. |
| UX-I-33 | CONFIRMED | `RedirectsScreen.tsx:163` fires the mutation directly; grep for `confirm|toast` in the whole file → zero hits. `DomainsScreen.tsx:154` does confirm. |
| UX-I-34 | CONFIRMED | `FormsScreen.tsx:155` likewise. Worth quoting in the fix brief: `:158-165` is careful pagination bookkeeping — someone thought hard about where the cursor lands and not at all about whether the row should go. |
| UX-I-40 | CONFIRMED | `SettingsTab.tsx:580-595` returns early for server-backed screens under a comment naming the exact hazard; `:596-623` is the composer lane. Only `Redirects`/`Headers`/`Localization` call `registerSaveHandler`. `HistoryManager.captureSnapshot():377-379` is `deepClone(exportProject())`, so composer-lane settings really do ride along in every version. |

**One thing the audit got right that it deserves credit for:** UX-G-02 and UX-G-16 both claim the ⌘K "Open AI panel" command opens the left drawer. `CommandPalette.tsx:298-300` carries a comment asserting the opposite — *"UI_PANEL_OPEN is allow-listed to real LEFT tabs and 'ai' is not one — this offer has been a no-op since it shipped."* That comment is stale: `VALID_LEFT_TABS` (`useEditorEventListeners.ts:145`) is derived from the full `GROUPED_TABS_CONFIG`, which includes `ai`. The G lane read the code and ignored the comment. The I lane, one file away, did the reverse and produced UX-I-17.

---

## Part 3 — Contradictions between lanes

### C1 — Which panels have rail buttons? *(three lanes disagree; adjudicated above)*

| Row | Says | Verdict |
|---|---|---|
| **UX-F-01** | rail = 6 (add, layers, pages, assets, content, design); Templates/Components/AI/Publish/History/Review are off-rail | **correct** |
| **UX-E-01**, **UX-E-04** | Publish is a rail entry | wrong |
| **UX-I-30** | "the rail's Settings" | wrong |
| **UX-I-17** | Review is the *only* module with no rail button | wrong |
| **UX-F-12**, **UX-F-13**, **UX-G-15** | Settings / AI are off-rail | correct, and they contradict E and I |

Decided by `tabsConfig.ts:349-351` + `LeftSidebar.tsx:491,623-624` + `editorViewMode.ts:71`. **F-01 is the row of record. E-01, E-04, I-17 and I-30 need their screen labels and mechanism sentences rewritten.**

### C2 — Can a page be dragged into first position? *(intra-lane, UX-B)*

UX-B-05 says yes and calls it a hazard; UX-B-07 says no and calls the impossibility a hazard. **B-07 wins** (`PageList.tsx:314` never passes `null`; `PageManager.ts:342` needs `null` for index 0). B-05's drag clause must go.

### C3 — Is bare D bound? *(UX-C vs UX-F)*

UX-C-25 "bound nowhere" vs UX-F-31 "twelve panels bound to bare letters (A I T M L P B S U H R **D**)". **F-31 wins** (`useSidebarKeyboard.ts:34-47`, mounted at `LeftSidebar.tsx:486`). C-25 should be deleted, not rewritten — the badge it complains about is accurate.

### C4 — "Media drawer · Browse stock" names two different components

UX-H-02/03/04 describe a reachable stock surface; UX-H-05 describes an unreachable one. **Not a contradiction — two components in one file**, but three rows share a `screen` string that makes them read as one:

- `StockBrowserOverlay` (`MediaTab.tsx:381`, opened by `onOpenStock` at `:372`) — reachable. Subject of H-02/H-03/H-04.
- `StockSourceModal` (`MediaTab.tsx:232`) — mounted, never opened. Subject of H-05.

Rename H-05's screen to "Media drawer · StockSourceModal (unreachable)" or the fix lane will conflate them.

### C5 — Severity disagreement on identical defects

| Defect | Lane 1 | Lane 2 |
|---|---|---|
| AI opens in two columns with two histories | UX-G-02 **Critical** | UX-F-10 **Major** |
| Two site-settings surfaces | UX-I-30 **Critical** | UX-F-12 **Major** |
| Lock is not enforced outside the canvas | UX-D-02 **Critical** | UX-H-15 **Major** |

Three same-defect severity splits. Whoever triages needs one number per defect, not one per lane.

### C6 — UX-E-04 vs UX-F-20 on how the topbar states a publish blocker

E-04 says the topbar "says 'Publishing isn't switched on for this workspace yet'"; F-20 says the blocked state "announces itself only on hover … there is no visual difference from a publishable site." Both may be true (string exists, delivered via tooltip) but they read as contradictory to a fix lane. **Not adjudicated — flagged as needing one row, not two.**

---

## Part 4 — Duplicates to collapse

Twelve pairs, one defect each. Survivor named; the other should be closed as a duplicate, not deleted (its extra sentence usually belongs in the survivor).

| Defect | Rows | **Survivor** | Why |
|---|---|---|---|
| Preview is one page in a `sandbox=""` iframe | UX-E-17, UX-F-09 | **UX-E-17** | superset — also names the sanitizer's `<script>`/`<form>` strip |
| AI panel has two homes and two histories | UX-G-02, UX-F-10 | **UX-G-02** | adds the per-mount `useState` and the "both open at once" case |
| Two site-settings surfaces | UX-I-30, UX-F-12 | **UX-I-30** | enumerates the overlapping fields and the two save models (strip "the rail's") |
| Visibility helper says two opposite things one line apart | UX-B-24, UX-E-21 | **UX-B-24** | Pages owns the screen |
| Lock not enforced in Layers → Inspector edits a locked element | UX-D-02, UX-H-15 | **UX-D-02** | names the third door (canvas pick mode) and the missing inspector affordances |
| Layers `M`/`T` breakpoint badges can never appear | UX-H-16, UX-D-19 | **UX-H-16** | the cause is in the tree-node builder, which Layers owns |
| Page management exists twice (tab bar vs panel) | UX-B-15, UX-F-17 | **UX-B-15** | enumerates the divergent behaviours (tab bar hides Delete, panel disables it) |
| SEO split across Settings / page SEO / page Social | UX-E-20, UX-I-41 | **UX-E-20** | names all three surfaces; I-41 names two |
| AI generate buttons swallow every failure | UX-G-05, UX-H-09 | **UX-G-05** | H-09 is the media half of the same row |
| Opening AI replaces the inspector | UX-D-01, UX-G-12 | **UX-D-01** | adds "selecting an element afterwards does not restore it" |
| Dynamic pages are invisible outside Content | UX-C-19, UX-B-25 | **UX-C-19** | broader (Pages *and* publish); keep B-25's stale-claim correction as a note on it |
| Restore truncates history with no confirm | UX-I-01, UX-I-02 | keep **both** | two different controls, one fix — link them so the fix lands once |

**Not duplicates but one root cause — file as 1 + 3:** UX-E-01, UX-E-02, UX-E-27 and UX-I-16 all trace to *"change count is read from an in-session undo stack that `HistoryManager` resets on `PROJECT_LOADED`"*. **UX-E-01 is the root**; the other three are consequences and will be "fixed" by fixing it. Filing them as four independent Criticals/Majors overstates the work by 4×.

**Net:** 295 rows contain roughly **283 distinct defects**.

---

## Part 5 — Coverage: module × dimension

Rows below the rule are keyword-derived (marked `*`) and are indicative only; rows above it are counted from the `kind` field and are hard.

| Dimension | Insert | Pages | CMS | Inspector | Publish | Shell | AI | Media | Layers | Brand | History | Review | Settings |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| purpose / primary tasks | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | **0** | **0** | **0** |
| entry/exit | **0** | 1 | 1 | **0** | 1 | 1 | 1 | **0** | **0** | **0** | 1 | 1 | **0** |
| missing screens | 1 | 1 | 2 | 2 | **0** | 1 | 1 | **0** | **0** | 2 | **0** | **0** | **0** |
| missing states | 2 | 6 | 2 | 2 | 5 | 2 | 2 | 2 | **0** | 2 | 2 | 1 | **0** |
| broken flows | 5 | 6 | 8 | 3 | 5 | 4 | 2 | 2 | 3 | 1 | 1 | 2 | **0** |
| dead ends | 2 | 1 | 2 | 2 | 3 | 3 | 4 | 1 | **0** | **0** | **0** | 2 | 1 |
| duplicate features | 3 | 2 | 2 | 1 | 1 | 7 | 5 | 1 | **0** | **0** | **0** | 2 | 3 |
| confusing navigation | 3 | 2 | 1 | 5 | 2 | 8 | 2 | 1 | 3 | **0** | 2 | 1 | 3 |
| missing feedback | 9 | 6 | 4 | 5 | 11 | 1 | 1 | 1 | 2 | **0** | 3 | 1 | 1 |
| disabled / permission states | 2 | **0** | 1 | 2 | 1 | 1 | 1 | 2 | **0** | **0** | **0** | 1 | **0** |
| destructive / confirmation | **0** | 1 | 1 | 1 | **0** | **0** | 1 | **0** | 1 | 2 | 3 | **0** | 3 |
| panel/drawer/modal sizing | **0** | **0** | **0** | 1 | **0** | 4 | **0** | **0** | 1 | **0** | 1 | 1 | **0** |
| cross-module connections | **0** | 3 | 1 | 1 | **0** | 1 | **0** | **0** | 1 | **0** | 1 | **0** | 1 |
| — | | | | | | | | | | | | | |
| empty state* | 1 | 1 | 2 | **0** | 2 | 1 | **0** | 2 | 1 | **0** | 1 | **0** | 1 |
| loading state* | **0** | **0** | **0** | **0** | 4 | **0** | 3 | 2 | **0** | **0** | **0** | **0** | **0** |
| error state* | **0** | **0** | **0** | **0** | 2 | **0** | 3 | 2 | **0** | 1 | 1 | **0** | **0** |
| permission / role* | 2 | **0** | 1 | **0** | **0** | 1 | **0** | **0** | 2 | **0** | **0** | 2 | 1 |
| keyboard* | 5 | 4 | 4 | 2 | 4 | 12 | 6 | **0** | 4 | 1 | 4 | **0** | 1 |
| context menu* | 5 | 2 | **0** | **0** | **0** | 2 | **0** | 4 | 3 | **0** | **0** | **0** | **0** |

### The empty cells that matter

**1. Three modules have no purpose, no primary-task statement and no entry/exit map.** The brief requires a `module-summary` row per module. UX-H did this correctly — three modules, three summaries (H-33 media, H-34 layers, H-35 brand). **UX-I wrote one combined summary (I-42) for history + review + settings.** Those three modules — one of which owns 13 screens — have no stated purpose, no task list, and no handoff map. This is the largest single gap in the audit.

**2. Loading and error states are almost entirely unexamined.** 10 of 13 modules have no loading-state row; 8 of 13 have no error-state row. The worst case is **Settings**, which has zero of both: Redirects, Headers, Localization, Domains, Forms and Webhooks are all server-backed screens (proved by UX-I-40 itself), so each has a fetch that can be pending and a fetch that can fail, and no row asks what either looks like. **CMS** is second: the Content panel reads IndexedDB asynchronously and no row covers the pending or failed read.

**3. Sizing is 8/13 empty.** The brief names "panel/drawer/modal sizing" explicitly. Shell took 4 rows and the rest of the audit took 4 between them. Unexamined despite obvious pressure: **Insert** (53 rows + 50 cards in a 280px column with a 700px expand), **CMS** (a record form and a records table in a 320px column — UX-C-23 notices the width but files it as `missing-state`), **Media** (the drawer is 320px, named in H-01's own screen string), **Settings** (13 sections in a full-page surface), **AI** (a chat thread and diff rows in a 280px drawer *and* a 300px inspector column — UX-G-02 establishes both mounts exist and neither is measured).

**4. Permission and role states are 7/13 empty — including Publish.** UX-C-15 establishes that the editor has a role service, uses it to gate **Publish** and Review, and that its stated rule is "denied controls are shown disabled with the reason attached." The Publish lane then filed **zero** permission rows. UX-I-22 covers Review's role handling. Nobody covered Publish's, or Pages', or the Inspector's.

**5. Destructive/confirmation is 5/13 empty, and two of the gaps are load-bearing.** **Media** has no destructive row at all, though the drawer has a bulk delete (`MediaTab.tsx` `onBulkDelete`) and UX-H-10 notes the asset drill-in has no delete. **Publish** has none, though unpublish is destructive — UX-F-30 covers the unpublish confirm but files it as `broken-flow`, so a triage sorting by `kind` will not see it.

**6. Cross-module is 6/13 empty — including AI and Publish, the two most cross-cutting.** The AI lane's own summary (G-24) says AI "is not a module; it is a layer that touches Canvas, Inspector, Brand, Media, Pages/SEO, History, Content and the dashboard's onboarding" — and then filed zero `cross-module` rows. Publish is the terminal act of every module and filed zero.

**7. Brand is under-audited as a whole.** It is one of the six rail destinations and received 8 rows, all in a shared lane, all clustered on Import/export, Starters, token rename and the preview strip. It has zero rows for confusing navigation, missing feedback, dead ends, duplicate features, disabled states, sizing or cross-module — despite being the surface UX-F-07's "Open Brand" and UX-D-04's "Whole site" scope both hand off to.

### Modules with no lane at all

Not in the grid because no lane owned them. Each is a real destination in `GROUPED_TABS_CONFIG` or a real editor folder:

- **Templates** (`tabsConfig.ts:99`, shortcut T, a drawer panel) — touched only tangentially by UX-A-07 and UX-F-29.
- **Components / component-library** (`tabsConfig.ts:152`, shortcut ⇧A) — UX-A-25 names the panel to explain a naming collision; nobody audits it.
- **Onboarding** (`editor/onboarding/`) — UX-A-07 audits one checklist item.
- **E-commerce** (`editor/ecommerce/`) — UX-C-21 audits one dialog.
- **In-editor collaboration** (comment mode, bare C; `editor/collaboration/`) — UX-I covers *client* review; live collaboration is uncovered.

---

## Part 6 — Audit hygiene

**Confidence is miscalibrated.** 285 of 295 rows are `"high"`, 10 are `"medium"`, 0 are `"low"`. Of the ~48 rows I re-verified, 11 were wrong — **and all 11 were filed `high`**. Meanwhile the single Critical the audit itself doubted (UX-B-10, `medium`) is mechanically airtight. High confidence is currently uninformative.

**Citation drift is systematic, not random.** Three independent verification passes found the same pattern. A representative sample:

| Row | Cited | Actual | Δ |
|---|---|---|---|
| UX-I-01 | `HistoryManager.ts:757-775` | **`:707-745`** | ~50 |
| UX-G-07 | `AIPromptModal.tsx:146-156` (error render) | **`:162-172`** — `146-156` is the textarea | wrong block |
| UX-D-08 | `elementProfiles.ts:231-241` | **`:246-254`** — cited lines are `input`/`select` + `container`/`card` | wrong range |
| UX-I-40 | Redirects `:160`, Headers `:94`, Localization `:128`, Domains `:135`, Webhooks `:121` | `:163`, `:99`, `:133`, `:141`, `:121` | uniform +5-6 |
| UX-A-05 | `shared/types/block.ts:25` | **`:27`** | 2 |
| UX-E-17 / UX-F-09 | `Composer.ts:685-717` | correct **only against the working tree** — ~21 lines earlier at HEAD | tree-dependent |

The uniform +5-6 offset across all five UX-I-40 screen citations suggests that batch was captured against an older revision. Anyone consuming these rows should re-locate by symbol name, not by line number. And one row's citations are only valid with the founder's uncommitted diff applied — worth stating on the row.

**Two rows use a `kind` outside the brief's enum:** UX-G-21 and UX-G-22 are `"missing-feature"`. Any tooling that filters by `kind` will silently drop them.

**Two rows carry a mis-cited proof.** UX-I-40 cites `VersionHistoryPanel.tsx:365-367` for "settings are captured in versions" — those lines are the restore-confirm's subtitle copy. The line that actually proves it is `HistoryManager.ts:377-379` (`captureSnapshot` = `deepClone(exportProject())`).

**Findings the audit surfaced but did not file** (found while verifying, worth adding):

1. `propertiesRegistry.ts:1037` declares `"navbar.menuItems": { type: "menuEditor" }`. The string `"menuEditor"` exists at exactly two lines — that entry and the type union at `:68`. **No renderer.** A nav-items editor is specced in config and built nowhere. This is a stronger UX-B-32.
2. `FormSettingsSection.tsx:45,54` writes `element.setData("formConfig", …)`; `ExportEngine.ts:892` reads `formSettings`. Mounting the orphan section (UX-D-09) would still not make a form deliver anything.
3. `ExportEngine.ts:784-791` already dedupes colliding page slugs to `page-3-2.html` — so UX-B-13's duplicate pages ship at a URL the user never chose and never sees in the editor.
4. `ExportEngine.ts:788` builds `pageHrefs` from the **live-filtered** page set, so UX-B-04's silent home-page link rewrite fires for *hidden* and *password* pages too, not only deleted ones.
5. `CommandPalette.tsx:298-300` contains a stale comment asserting the ⌘K AI command is a no-op. It is not (see Part 2). The comment should be deleted before it produces another UX-I-17.

---

## What I did NOT verify

Stated plainly, because "48 of 295" is 48.

- **247 rows were not re-verified.** I read every row and used all 295 for the contradiction, duplicate and coverage analysis, but only re-read source for the 48 named above (all 59 Criticals were read; 48 were traced to source; the highest-risk absence claims were prioritised).
- **Nothing was verified in the running app.** Every verdict here is a code reading. Per the repo's own rule, code has passed three separate suites while a feature was broken. Claims about what a user *sees* — UX-B-10's toast loop, UX-A-01's empty drop, UX-I-03's Enter key — are mechanically sound but have not been observed at 1440×900.
- **UX-E-04 vs UX-F-20 (C6) is flagged, not adjudicated.** I did not read the topbar's blocked-state render.
- **Brand (UX-H-26..H-32), the Insert Minors, and the UX-D Minors** were read but not source-verified.
- **The other ~2,860 rows** in `docs/design-jobs/findings/` (the MOD, FIG, SHELL, W, QA and VERDICTS lanes) are out of scope. Several UX rows claim to re-verify or correct rows in those lanes (UX-B-13 vs MOD-B-03, UX-B-25, UX-C-06 vs MOD-A-01/A-02, UX-G-09 vs FIG-K-26 and D-F-38, UX-H-23). I checked none of those cross-references against the older files.
