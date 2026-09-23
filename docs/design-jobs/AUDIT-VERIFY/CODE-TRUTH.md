# CODE-TRUTH — 10 audit claims checked against the shipping code

Date: 2026-09-07
Repo root: `/Users/shahg/Desktop/pencil/buildrik`
All paths below are relative to that root. Line numbers are from the **working
tree** at the time of writing (one uncommitted diff is noted where it matters).

Method: read-only. No Figma MCP calls, no `scripts/figma/*`, no
`scripts/baseline/*`, app not run. Every citation was opened and the quoted
line read.

Founder precedence rule applied throughout
(`packages/editor/CLAUDE.md` §"FIGMA UI REBUILD — THE LOOP"):
**behaviour → the CODE contract; everything VISUAL → the BOARD.** Several of
these audit findings are phrased as design defects but are really assertions
about what the product can do. Those are settled here, by the code.

---

## Verdict table

| Claim | Code truth | file:line evidence | Verdict |
|---|---|---|---|
| **F11** — Forms error screen has no retry | Correct. The submissions loader writes its message into `subsError` and the screen renders it as a bare `role="alert"` box with **no action of any kind**. `loadSubs` is already a stable `useCallback`, so a retry is one `onClick={() => void loadSubs()}` away. The 238-line test file never mentions retry either. The repo has the retry pattern in four other places — this screen just doesn't use it. | `packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:127` `setSubsError(e instanceof Error ? e.message : "Failed to load submissions.");` · `:306-308` the render — `<div role="alert" className={ERROR_BOX}>{subsError}</div>`, no sibling button · `:107` `const loadSubs = React.useCallback(async () => {` · pattern exists at `packages/editor/src/editor/sidebar/tabs/content/ContentTab.tsx:205` "Try again", `.../publish/PublishTab.tsx:364` and `:460`, `packages/editor/src/editor/sidebar/SidebarFallbacks.tsx:20-40` "Try Again", `.../ai/AITab.tsx:327` | **SUPPORTS-FIX** |
| **F12** — Dynamic-page config lacks a template-change path | Correct, and worse than stated. `DynamicPagesView` renders exactly **one** editable control (a URL-pattern text input) and the save call writes exactly one field. The template is *read* only, and its absence is surfaced as a warning with no affordance to fix it. `pageTemplatePath` can be set **once, at collection creation, as free-text file path** — and that modal takes no existing collection, so it can never be reopened to edit one. The engine would accept the update; only the UI is missing. **Sub-claims:** resolved-example-URL = does not exist in the editor (placeholders are parsed only to validate field names; substitution lives server-side and is never called from the editor). Published-record-count = **already exists**. | `packages/editor/src/editor/sidebar/tabs/content/ContentViews.tsx:643-649` the only control — `<TextInput value={pattern} placeholder="/menu/{slug}" … aria-label="URL pattern" />` · `:635` `const hasTemplate = Boolean(collection.pageTemplatePath);` (read-only) · `:682-685` `No template page is bound, so publishing emits none of these yet.` · `packages/editor/src/editor/sidebar/tabs/content/ContentTab.tsx:310-313` save is `{ pageSlugPattern: pattern \|\| undefined }` only · set-once path: `packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:440` `<TextInput type="text" placeholder="Template page path — blog/_template/index.html" …>` · engine would allow it: `packages/editor/src/engine/cms/CollectionManager.ts:132-135` `updateCollection(id, updates: Partial<Omit<CMSCollection, "id" \| "createdAt">>)` · model: `packages/editor/src/shared/types/cms.ts:71-76` (`pageSlugPattern`, `pageTemplatePath` — a **string path**, not a page id) · example-URL absent, only key validation: `ContentViews.tsx:633-634`, substitution lives at `server/services/cms.service.ts:121-128` with no editor consumer · **count already built**: `ContentViews.tsx:623` `const publishedCount = records.filter((r) => r.status === "published").length;` and `:667` `` `Generates ${publishedCount} page…` `` | **SUPPORTS-FIX** (template change + example URL) / **CONTRADICTS-FIX** (record count already shipped) |
| **F15** — Canvas footer persists in full-page Settings | Correct, and it is structural, not incidental. `LayoutShell` *has* a Footer slot inside the grid — and **nothing uses it**. `AquibraStudio` instead renders its own `<footer className="layout-shell__footer">` as an unconditional flex sibling of the whole grid, so it sits outside every `--fullpage` rule. The fullpage CSS hides drawer/canvas/inspector; it never touches the footer, because the footer isn't in that grid. Settings is a fullpage route rendered into `LayoutShell.FullPage`, so it renders *beside* a footer still narrating the hidden canvas — including the stale selection label, its pixel dims, and `Desktop · 100%`. | `packages/editor/src/editor/shell/AquibraStudio.tsx:468` root is a flex column — `` className={`tw:flex tw:flex-col tw:gap-0 bd-studio ${className}`} `` · `:710-729` the footer, with **no** `fullPageMode` guard · unused slot: `packages/editor/src/editor/rail/LayoutShell.tsx:169` + `:332` `LayoutShell.Footer = Footer;` (zero consumers repo-wide) · `packages/editor/src/editor/rail/LayoutShell.css:286-294` `.layout-shell--fullpage { grid-template-rows: 1fr; grid-template-areas: "rail fullpage fullpage fullpage"; }` — no footer area · `:311-320` fullpage hides only `__drawer, __canvas, __inspector` · route: `packages/editor/src/editor/shell/StudioPanels.tsx:420` `fullPageMode={…}`, `:519-537` `<LayoutShell.FullPage>` · `packages/editor/src/editor/sidebar/FullPageRouter.tsx:85-97` `case "settings":` · footer content: `packages/editor/src/editor/shell/StudioFooter.tsx:171-178` (`{cap(type)} · {name}`), `:217-224` dims, `:236` `{deviceLabel} · {Math.round(zoom)}%` | **SUPPORTS-FIX** |
| **F16** — Competing zoom/device representations | Correct on device — and the code has **three**, not two. One React state feeds all of them. Correct fix target confirmed. **But the audit's description of the bottom bar is stale:** `CanvasFooterToolbar` renders W/D/T/M and **no zoom percentage at all** — its own header comment still advertises `[-] 100% [+]`, but that group was moved out; the only zoom readout/control in the product is the footer's `Desktop · 100%` flyout. So zoom has exactly one representation; device has three. | device #1: `packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:318-332` `<BreakpointSwitcher value={device} onChange={onDeviceChange} includeWide …/>` mounted from `packages/editor/src/editor/canvas/Canvas.tsx:814` + `:831-832` · glyphs are literally W/D/T/M: `packages/editor/src/editor/chrome-ui/BreakpointSwitcher.tsx:38-44` `{ id: "desktop", glyph: "D", … }` … `WIDE_BREAKPOINT = { id: "wide", glyph: "W", … }` · device #2: `packages/editor/src/editor/inspector/ProInspector.tsx:428-432` `<BreakpointPill current={currentBreakpoint} onChange={onBreakpointChange} …/>` (the `This ▾ · Desktop ▾ · Base ▾` row, `:417-419`) · device #3 + the only zoom: `packages/editor/src/editor/shell/StudioFooter.tsx:236` `{deviceLabel} · {Math.round(zoom)}%`, flyout at `:238-282` · **owner**: `packages/editor/src/editor/shell/hooks/useStudioState.ts:221-222` `const [device, setDevice] = React.useState<DeviceType>("desktop"); const [zoom, setZoom] = React.useState(100);` mirrored into the engine at `packages/editor/src/engine/Composer.ts:1027-1036` (`get device()` — "Reads from viewport (SSOT)") and `:1043-1049` · **no `%` in the canvas bar**: `CanvasFooterToolbar.tsx` renders none (only comments at `:5-12`, `:239` mention 100%) | **SUPPORTS-FIX** (device) / **CONTRADICTS-FIX** (the "+ 100%" half of the bottom bar does not exist in code) |
| **F18** — Components library "FROM BRAND · NOT IMPLEMENTED" group with linked Button/primary + Price row | The code renders **one** group, `YOUR COMPONENTS`, whose rows are `name · "N instances" · ›`. There is no second group, no "FROM BRAND" heading, no "NOT IMPLEMENTED" text, no `linked` status, and neither "Button/primary" nor "Price row" appears anywhere in the repo. The chevron is real. The code contains a comment **explicitly declining** to ship the FROM BRAND section because nothing can populate it. There is no brand→component linking feature in the engine at all — `src/engine/components/` has zero occurrences of "brand". The only link concept is instance→master (`isDetached`). | `packages/editor/src/editor/sidebar/tabs/ComponentsTab.tsx:247-249` the one heading — `YOUR COMPONENTS` · `:266-272` the row — `{component.name}`, `` {n} instance{n === 1 ? "" : "s"} ``, `›` · `:231-235` the declining comment — *"The FROM BRAND section ships when a brand-linked source exists; today's registry has none, so it would always be empty chrome."* · no status field on the model: `packages/editor/src/shared/types/components.ts:19-50` (`ComponentDefinition` has no `status`/`linked`/`source`) · the only link concept: `:121-122` `/** Is this instance detached (no longer linked to master)? */ isDetached: boolean;` and `packages/editor/src/engine/components/ComponentManager.ts:452` `async detachInstance(elementId: string)` · closest brand intent is a recorded-only flag: `components.ts:46-49` `prefillFromDs?: boolean;` · brand panel's own components view is read-only by design: `packages/editor/src/editor/design-system/ui/sections/ComponentsSection.tsx:241-244` · `ComponentsPanelV2` deleted 2026-08-16 (commit `7e68ee57a`); only a stale `dist/` bundle remains | **FEATURE-ABSENT** |
| **F19** — Inspector Text has separate INTERACTIONS + ANIMATION; a newer MOTION specimen exists | Half right. The two sections ARE separate and adjacent in the text profile, titled exactly `Interactions` and `Animation`. **But no MOTION section exists anywhere** — `SectionId` has 17 ids and `"motion"` is not one of them; "motion" survives only as a CSS property namespace (`motion.transition`, `motion.animation`), a brand-token kind, and an a11y hook. There is a genuine duplication the audit missed: "Animation" also appears as a *field label inside* Interactions. | profile order: `packages/editor/src/editor/inspector/config/elementProfiles.ts:70-85` `TEXT_PROFILE` → `… "link", "interactions", "animation", "visibility", …` · `packages/editor/src/editor/inspector/sections/interactions/index.tsx:95` `title="Interactions"` · `packages/editor/src/editor/inspector/sections/AnimationSection.tsx:98` `title="Animation"` · separate registry entries: `packages/editor/src/editor/inspector/sections/registry/effects.tsx:22` and `:79` · no motion id: `packages/editor/src/editor/inspector/sections/registry/_shared.tsx:55-75` · "motion" as property keys only: `packages/editor/src/editor/inspector/config/propertiesRegistry.ts:732-743` · the real duplicate: `packages/editor/src/editor/inspector/sections/interactions/InteractionEditor.tsx:113` field `label="Animation"` | **SUPPORTS-FIX** (the two sections are real and adjacent) / **FEATURE-ABSENT** (there is no MOTION specimen in code) |
| **M12** — AI success modal shows raw JSON, only Retry + Discard, no Apply | Correct, and deliberate. The success body is a literal `JSON.stringify(schema, null, 2)` in a mono block. The footer is `Discard` + `Retry`, with `Accept` rendered **only if** an `onAccept` prop is passed — and the single production mount omits it, with an in-source explanation that there is nowhere for the schema to go: it is a preset *binding* schema, not an element tree, so `ComponentManager.createComponent` is the wrong target. So Apply is not missing UI; the destination is unbuilt. A test pins the absence. | `packages/editor/src/editor/design-system/ui/AIPromptModal.tsx:176-189` `{JSON.stringify(state.schema, null, 2)}` · `:211-225` footer — `Discard`, `Retry`, then `{onAccept && (<Button …>Accept</Button>)}` · the only mount, no `onAccept`: `packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx:896-907` — *"No onAccept: there is nowhere for the schema to go yet… the real home is the style preset registries, and mapping into them is a feature, not a wiring."* · prop doc: `AIPromptModal.tsx:40-44` · pinned: `packages/editor/src/editor/design-system/ui/__tests__/AIPromptModal.test.tsx:187` `it("renders no Accept when there is nowhere for the schema to go", …)` and `:199-201` · entry is flag-gated: `DesignSystemTab.tsx:846` `isFeatureEnabled("dsAi")` | **SUPPORTS-FIX** (the fix is a feature, not a button) |
| **M13** — AI not-configured error offers Retry | Correct **for this modal**, and the Retry is a dead action: it calls the identical `handleGenerate` that just failed, and configuration is a server env var the editor cannot set. There is no configure link in the modal. **But the editor already solves this correctly one panel over** — the AI chat tab distinguishes the not-configured state, prints a real explanation, offers "Open workspace settings", and renders **no** Retry. The fix already exists in-repo; the modal just doesn't use it. | `packages/editor/src/editor/design-system/ui/AIPromptModal.tsx:73-77` `if (!service) { setState({ kind: "error", message: "AI service not configured" }); return; }` · `:227-236` error footer = `Cancel` + `Retry` where Retry is `onClick={handleGenerate}` — the same function, `:73` · configuration is server-side: `server/services/ai.service.ts:487-490` `"AI is not configured: no OpenAI API key on the server."` · **the correct pattern already shipped**: `packages/editor/src/editor/sidebar/tabs/ai/AITab.tsx:266-281` — `AI drafting isn't configured yet.` + `Open workspace settings`, no Retry; kind mapping at `packages/editor/src/editor/sidebar/tabs/ai/hooks/useStreamPrompt.ts:137-138` (`PRECONDITION_FAILED → "not-configured"`); Retry only on `errorKind === "other"` (`AITab.tsx:327`) | **SUPPORTS-FIX** (for AIPromptModal) / **CONTRADICTS-FIX** (AITab already does it) |
| **M17** — Save-as-template dialog has no visible "Template name" label | Contradicted. The field is built with `label="Template Name"`, which renders a real, visible `<label htmlFor>` element — not a placeholder, not an `aria-label`, not `sr-only`. It is 12px in `--bk-ink-soft`, which is low-contrast and easy to miss in a screenshot, but it is present in the DOM. | `packages/editor/src/templates/SaveTemplate.tsx:56-62` `<InputField label="Template Name" value={name} … placeholder="My Template" autoFocus />` · label is a real element: `packages/editor/src/shared/forms/InputField.tsx:61-65` → `packages/editor/src/editor/chrome-ui/FormField.tsx:46` `<Label htmlFor={id} className={BK_LABEL_CLASS}>` · style, no sr-only: `packages/editor/src/editor/chrome-ui/labelTheme.ts:42` `"tw:text-xs tw:text-[var(--bk-ink-soft)] …"` · modal mounted at `packages/editor/src/editor/shell/StudioModals.tsx:158-162`, title `SaveTemplate.tsx:48` `<ModalTitle>Save page as template</ModalTitle>` | **CONTRADICTS-FIX** |
| **F26** — V2 rail proposal uses truncated labels (Inse, Laye, Page…) | The shipping code's rail labels are **full words**, pinned by a test: `Insert · Layers · Pages · Media · Content · Brand`. Hard truncations like "Inse" have no code basis and the code cannot produce them — the clip is `text-overflow: ellipsis`, which would render `Conte…`, never `Conte`. The repo has already reverted a truncated rail label once, on record. **Real residual risk:** `.ls-btn__label` caps at `max-width: 42px`, and "Content" at 11px is right at that boundary — so the *ellipsis* form of this defect is live even though the V2 form is not. | `packages/editor/src/editor/rail/tabsConfig.ts:350` `ids: ["add", "layers", "pages", "assets", "content", "design"]` · labels: `:78` `label: "Insert"`, `:131` `"Layers"`, `:143` `"Pages"`, `:118` `"Media"`, `:253` `"Content"`, `:178` `"Brand"` · pinned: `packages/editor/src/editor/rail/__tests__/tabsConfig.figma.test.ts:30` `expect(labels).toEqual(["Insert", "Layers", "Pages", "Media", "Content", "Brand"]);` · rendered verbatim: `packages/editor/src/editor/sidebar/LeftSidebar.tsx:173` `{showLabels && <span className="ls-btn__label">{tab.label}</span>}` · the clip: `packages/editor/src/editor/sidebar/LeftSidebar.css:134-143` `max-width: 42px; overflow: hidden; text-overflow: ellipsis;` (`--bk-text-11: 11px`, `tokens.generated.css:164`) · prior reversal on record: `tabsConfig.ts:166-168` — *"Previously labeled 'Comps' (truncated) with Diamond icon (opaque); now full name + Box icon."* | **CONTRADICTS-FIX** (labels are full words) — with a live sub-defect (42px ellipsis clip) |

---

## Claims where the design is drawing something the code cannot do

**F18 — the Components board draws a feature that does not exist.**
"FROM BRAND", "NOT IMPLEMENTED", "Button/primary", "Price row", and a "linked"
status are not in the code, not in the data model, and not in the engine.
`src/engine/components/` contains zero occurrences of "brand"; the only
link relationship the engine models is instance→master
(`shared/types/components.ts:121-122`, `engine/components/ComponentManager.ts:452`).
The code already made this call in writing and declined to draw the section
(`ComponentsTab.tsx:231-235`): *"it would always be empty chrome."* Conforming
the panel to that board would ship a group nothing can populate, and a status
chip whose value has no source. **The board is ahead of the product here; the
code is the honest surface.**

**F12 — the dynamic-pages design asks for a binding the UI has no writer for.**
`pageTemplatePath` is a **string file path** on the collection, matched against
the published page set at deploy time (`server/services/cms.service.ts:240`) —
not a page reference. Nothing in the panel can set it. The panel's own warning
("No template page is bound") is therefore a dead end by construction. A
template *picker* is not a visual fix: it needs a writer
(`CollectionManager.updateCollection` would take it, `CollectionManager.ts:132-135`)
and a source of valid template pages. The resolved-example-URL the audit asks for
is likewise unbuilt on the client — substitution exists only in
`server/services/cms.service.ts:121-128` and the editor never calls it.

**M12 — the AI success board asks for an Apply the schema has no destination for.**
The generated artifact is a preset *binding* schema
(`{componentTypeId, variants, bindings}`), not an element tree, so there is no
`composer.elements.add` target for it. The code removed the Accept button
precisely because it was a lie — it "took the click and dropped the schema"
(`DesignSystemTab.tsx:900-906`). Drawing Apply on the board does not create the
mapping into the preset registries. **This is a feature request wearing a
button's clothes.**

**F19 — the "newer MOTION specimen" does not correspond to anything in code.**
There is no `motion` section id, no Motion component, no Motion registry entry.
The inspector's motion vocabulary is a CSS property namespace
(`propertiesRegistry.ts:732-743`), not a UI surface. The *underlying* complaint
is still valid — Interactions and Animation are adjacent sections, and
"Animation" is additionally a field label nested inside Interactions
(`InteractionEditor.tsx:113`) — but the proposed reference doesn't exist.

---

## Claims where the code already does what the audit asks for

**M17 — the Template name label is already there.**
`SaveTemplate.tsx:57` `label="Template Name"` renders a real `<label htmlFor>`
via `FormField.tsx:46`. Nothing is `sr-only`. If the audit was screenshot-based,
what it likely saw is the *contrast*: 12px `--bk-ink-soft` (#4B5563). That is a
legitimate legibility note, but "no visible label" is not the code truth, and
adding a second label would duplicate the existing one.

**F26 — the rail already uses full labels.**
`Insert · Layers · Pages · Media · Content · Brand`, asserted by
`tabsConfig.figma.test.ts:30`. The repo already made this exact fix once
(`tabsConfig.ts:166-168`, "Comps" → "Components"). The V2 proposal's `Inse` /
`Laye` cannot be produced by this CSS — the clip is an ellipsis, not a cut.
**What is worth acting on** is the 42px cap in `LeftSidebar.css:139`: "Content"
at 11px sits on that boundary, so the ellipsis form of the defect is plausibly
live at ship. Measure it before changing it.

**F12 (partial) — published-record count already exists.**
`ContentViews.tsx:623` computes it, `:667` prints
`Generates N pages from published records.`, `:661-665` covers the
none-published zero state, and `CMSRecordsModal.tsx:101` computes it a second
time for its banner. Asking for it as a new feature would be a duplicate.
One real defect *inside* the existing implementation: the count is not
template-aware, so a collection with no bound template still reports a positive
page count next to the "no template is bound" warning — two contradictory
sentences in the same panel.

**M13 (partial) — the correct not-configured treatment already ships in AITab.**
`AITab.tsx:266-281` names the state, explains it, links to
`/dashboard/settings`, and offers no Retry. `useStreamPrompt.ts:137-138` already
maps the server's `PRECONDITION_FAILED` to a distinct `not-configured` kind. The
fix for `AIPromptModal` is to adopt this existing pattern, not to invent one.

**F16 (partial) — viewport state has one owner, and zoom has one representation.**
`useStudioState.ts:221-222` is the single React source, mirrored into the engine
viewport (`Composer.ts:1027-1036`, which comments "Reads from viewport (SSOT)").
The canvas bar has **no** zoom percentage — that group was already consolidated
into the footer flyout (`StudioFooter.tsx:238-282`, board 817:4723). So the
zoom half of F16 was fixed before the audit was written; only the **device**
control is triplicated (canvas W/D/T/M · inspector `Desktop ▾` pill · footer
`Desktop · 100%` text).

---

## Two findings the audit did not make, surfaced by this pass

1. **The `LayoutShell.Footer` slot is dead code.** It is defined
   (`LayoutShell.tsx:169`), registered (`:258`, `:332`), and used by nobody.
   `AquibraStudio.tsx:710` renders its own `<footer>` outside the grid instead —
   which is the direct mechanical cause of F15. Fixing F15 by moving the footer
   into the slot would also drain the dead export.
2. **`ComponentRow.tsx` is dead code.** It is exported from
   `packages/editor/src/editor/sidebar/tabs/component-library/index.ts:9` and
   has tests, but `ComponentsTab.tsx:250-275` inlines its own row markup and
   never imports it. Anyone auditing "what the Components row looks like" from
   that file is reading a component that never renders.

---

## What was NOT verified

- Nothing was checked in a running app. Every statement here is a statement
  about source, which per `CLAUDE.md` §"Work against a stated goal" is **not**
  acceptance for anything visual. In particular the F26 sub-finding (does
  "Content" actually ellipsize at 42px?) needs a `getComputedStyle` /
  `scrollWidth > clientWidth` read at 1440×900, not this reasoning.
- No Figma board was opened. Where a claim is about what the *board* draws, only
  the code side is settled here.
- The 38 other claims in the 48-claim audit were not examined.
