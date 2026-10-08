# 08 — AI extension map (Buildrik editor)

Read-only analysis, 2026-10-08, against the working tree at `44f5db956`.
Scope: where AI should go next, not a bug hunt. Bugs appear only where they
change what the AI primitive has to guarantee.

Prior founder decisions honoured:
- **AI lives in the right column.** The canvas ✦ popover runs on the same engine. There is no left AI panel (IA audit v2, FA-1, 2026-09-25).
- **One conversation model, plan then run** (decision #23, `AITab.tsx:125`).
- **Privileged actions use propose → confirm-token → execute** over existing mutations, with no second execution platform (`docs/plans/2026-06-06-001`, codex verdict).
- **SEO: "AI rewriting of copy" is a non-goal.** The existing Suggest-title button stays and is not extended (`docs/plans/2026-10-04-seo-yoast-plan.md:21`).
- **SEO analysis never blocks publish** (same plan, §9 Q8).
- **Flagged features are planned, not dead.** This covers DS-AI, publish and collab.

---

## 1. TL;DR

1. **The "AI ops" primitive already exists.** It works but has gaps. Today it runs as:
   - **Server:** `generateEditCommands` / `generatePageEditCommands` validate a JSON command list.
   - **Client:** `applyAiEdit` (`packages/editor/src/editor/sidebar/tabs/ai/applySetStyle.ts:625`) re-validates and runs 13 handlers inside one `beginTransaction("ai-edit")`, then calls `flushPending()`, giving one undo step.
   - **Callers:** the agent runner, Generate-block and (through the runner) every AI door.

   So the right move is **to harden and generalise this one primitive, not to invent a new one.**
2. **The single biggest quality defect is that element-scope AI is blind.** For an element scope the server receives only the id:
   - `scopeSchema` element branch: `server/trpc/routers/ai.ts:146`
   - prompt builder: `buildEditCommandPrompt(elementId, prompt)`, `server/services/ai.service.ts:906`

   The model is not told the element's type, its current text, styles or attributes. So the board-35 suggestions the panel ships ("Make it more concise", "Try a warmer tone", "Suggest a headline", `AITab.tsx:60`) **cannot work as advertised**: the model rewrites text it has never seen. Element scope also passes no token or asset lists, so set-token and library `src` are rejected there (`ai.service.ts:1118`). **Fix this before adding any new AI surface.**
3. **Five hardening items for the primitive**, all small:
   - (a) Move the command schemas to `packages/shared/schemas/` as one shared source. Today the client Zod schema and the server's hand-written allow-lists duplicate each other (`applySetStyle.ts:18-102` vs `ai.service.ts:553-680`).
   - (b) Route element writes through the engine lock gate (`canWrite`/`writableElements`, `engine/commands/commandOperations.ts:184-211`). `applyAiEdit` calls `el.setStyle` directly and so edits locked elements.
   - (c) Make a batch atomic. `rollbackTransaction` now really restores a snapshot (`Composer.ts:1134`), but `applyAiEdit`'s comment still says rollback is unsafe and commits partial batches.
   - (d) Emit an `AI_OPS_APPLIED` event so Issues, Layers and the Inspector react.
   - (e) Pass `siteId` and authorise it on `streamPrompt`. This has been open since 2026-06-03 and becomes mandatory once page or CMS content is sent.
4. **DO NOW (highest benefit for the work, mostly reuse):**
   - element context for element scope
   - primitive hardening
   - one-click content quick actions (rewrite / shorten / tone) from the context menu and selection toolbar
   - AI fix for "missing alt" in Issues, reusing the existing vision alt-text service
   - deterministic placement for Generate block
5. **NEXT:**
   - styled `insert-tree` op (real sections instead of bare unstyled elements)
   - responsive "fix for mobile"
   - restyle to brand tokens
   - accessibility text pass
   - "apply this review comment"
   - stock-photo suggestion
   - brand palette generation (after Brand Part 1 settles)
   - CMS sample records (with compensation, not undo)
6. **DON'T:**
   - per-property AI inside Inspector controls
   - AI for broken-link fixing, error fixing or save conflicts (all deterministic)
   - generative image creation
   - spam or PII classification of form submissions
   - extending SEO copy AI (owner non-goal)
   - background AI that silently spends quota

---

## 2. What exists today (the map)

### Server

| Piece | Where | Notes |
|---|---|---|
| Router | `server/trpc/routers/ai.ts` | `content`, `page`, `layout`, `summarize`, `milestoneSuggest`, `quota`, `streamPrompt` (subscription; intents `text`, `style-command`, `plan`), `componentSchema`, `logAdoption`. |
| Edit-command generation | `server/services/ai.service.ts:683` (`EditCommand` union), `:906` element prompt, `:954` `isValidEditCommand`, `:1144` element, `:1203`/`:1254` page, `:1386` plan | 13 command ids plus `propose-action`. A per-command prompt registry (`COMMAND_PROMPT_SPECS`, `agentCallable`). Page scope gets `{id,type,text≤50}`, tokens and assets. The plan has at most 8 steps. |
| Guards | `ai.service.ts:553` style allow-list, `:578` unsafe value regex, `:590-616` token value guard by type, `:651` `isSafeSrcValue`, `:640` UNSAFE_HREF | Duplicated client-side (§3). |
| Privileged actions | `server/services/ai-actions.service.ts:46` (`PRIVILEGED_ACTIONS`, only `site.publish`), `server/trpc/routers/actions.ts`, `action-confirmation.service.ts` | Propose → token → execute through the domain path. |
| Quota | `reserveAiUnit` (`ai.ts:45`), `quota.service.ts` | Per user per UTC day. Model choice belongs to the server (`resolveModelForUser`). |
| Alt text (vision) | `server/services/alt-text.service.ts:70` (`generateAltText`), `applyAltTextToAsset`; `media.generateAltText` (`server/trpc/routers/media.ts:311`) | Never overwrites user-typed alt (checked before and after the call). **No `reserveQuota`**, so it is uncounted AI spend. |
| Onboarding site generation | `ai-generation.service.ts` (job, monthly limit and hourly throttle) | Dashboard only. |
| Unused endpoints | `ai.page`, `ai.layout` | No editor or dashboard consumer outside stale `.claude/worktrees` copies. The live callers of `ai.content` are SeoTab and the legacy facade. |

### Editor

| Piece | Where | Notes |
|---|---|---|
| Applier | `editor/sidebar/tabs/ai/applySetStyle.ts:597` `COMMAND_HANDLERS`, `:625` `applyAiEdit` | Sync and async handlers. One outer transaction plus `flushPending`. Returns `proposals`. |
| Transport | `hooks/runPromptOnce.ts:110` | Promise wrapper over the `streamPrompt` subscription, with a reconnect budget of 2 and error kinds (`not-configured`, `quota`, `other`). |
| Scope | `hooks/useAIScope.ts` | element / multi / similar / page / site. The scope band locks during a run. |
| Context gatherers | `hooks/aiScopeContext.ts` (`gatherTokens`, `gatherMediaAssets`); `useAgentRunner.ts:136` `gatherElements` | Element refs carry only `{id,type,text}`: no styles, no attributes, no tree shape. |
| Agent loop | `hooks/useAgentRunner.ts` | plan → review (editable steps) → per-step generate → approve or skip → `applyAiEdit`. Stops on failure. Emits `ai:agent-run` for the Inspector takeover. |
| Privileged gate | `hooks/useAiActionGate.ts` | Routes `propose-action` to the confirm path. |
| AI column UI | `AITab.tsx`, `AgentPlan.tsx`, `ScopeChip.tsx`, `EmptyThread.tsx`, `Composer.tsx` | Board-35 suggestions at `AITab.tsx:60`. |
| Doors (all just open the AI column) | `InspectorHeader.tsx:108`, `PagePanel.tsx:236`, `UnifiedSelectionToolbar.tsx` ("✦ Edit with AI"), `shared/elementActions.ts:192` `improve-with-ai` → `canvas/menus/contextMenuRegistry.ts:45`, `CommandPalette.tsx:129`, ⌃J | **None of them carries an intent.** Every door lands on an empty prompt. |
| Generate block | `sidebar/tabs/build/components/GenerateBlockScreen.tsx:57-70` | Page-scope `add-section`, applied as one undo. Placement is described to the model in prose ("after element X") instead of being bound in code. |
| SEO title | `sidebar/tabs/pages/page-settings/SeoTab.tsx:125` | `ai.content` prompted with the page name and description only. Not extended (owner). |
| Alt text | `services/AltTextService.ts`, `shell/hooks/useAltTextAutoTrigger.ts` (runs automatically on upload), `media/components/AssetDetailOverlay.tsx:310` | Asset-level only. An image element gets the asset's alt at insert time (`ElementManager.insertMediaAt`), not when it arrives later. |
| DS-AI | `engine/designSystem/services/AIAssistService.ts`, `ComponentSchemaAIClient.ts`, wired at `shell/hooks/useComposerInit.ts:187`, CTA at `design-system/ui/BrandWorkspace.tsx:485` | Behind `NEXT_PUBLIC_FEATURE_DS_AI`. |
| Version history summary | `panels/version-history/useAISummary.ts` → `ai.summarize` | |
| Milestone suggestion | `shared/hooks/useAutoMilestone.ts` → `ai.milestoneSuggest` | Runs in the background and spends quota on every attempt (S-8 notes this). |
| Preview channel (unused) | `engine/elements/PreviewLayer.ts`, `ElementManager.previewUpdate` (`:167`), event `ELEMENT_PREVIEW_CHANGED` | **No caller and no canvas renderer.** Live hover preview of an AI diff would need canvas work. |

### Engine APIs the AI can drive

- **Elements:**
  - `composer.elements.getElement` / `createElement` / `addElement` / `removeElement` / `duplicateElement` / `moveElement`
  - `updatePage`, `createPage` (`ElementManager.ts:67`)
  - `insertHTMLToElement(parentId, html, index)` (`HTMLParser.ts:150`). This path sanitizes once (DOMPurify) and refines element types, so it is **the safe way to insert a generated subtree.**
  - `findByMediaSrc` (`ElementManager.ts:581`)
- **Styles:** `el.setStyle` (inline, desktop), `composer.styles.setRule` / `setBreakpointStyle` (pseudo-states and breakpoints).
- **Tokens:** `composer.designSystem.setDesignToken` (`Composer.ts:340`, which validates the id and value type and is transactional), `setTokens`, `applyAutoFix` (deterministic lint fix, one undo).
- **Components:** `composer.components.instantiateComponent` (async), `createComponent`; `placeCatalogComponent`.
- **CMS:** `composer.cms.collections.createContentItem` / `updateContentItem` (`CollectionManager.ts:300/339`). These are async and synced to the server through the outbox, so **they are outside composer undo.** Bindings use `bindToField` / `bindCollectionList`.
- **Media:** `composer.media.updateAsset`, `getAssets`.
- **Transactions:** `beginTransaction` (`Composer.ts:1093`), `endTransaction`, `rollbackTransaction` (`:1134`, which restores the deep-cloned snapshot), `history.flushPending`.
- **Lock gate:** `writeElement`, `writableElements`, `canWrite` (`engine/commands/commandOperations.ts:184-230`).

---

## 3. The one shared primitive: "AI Ops v2"

A shallow rename is not the goal. The goal is to take the existing command bus to production grade and make every AI surface use it.

```
 Door (context menu / toolbar / Inspector ✦ / Issues Fix / panel CTA)
   │   intent = { task: "rewrite"|"shorten"|"fix-alt"|"mobile-fix"|..., scope, params }
   ▼
 buildAiContext(composer, scope, task)          ← NEW, editor (one file)
   │   element snapshot: type, tag, text, attrs (allow-listed), inline styles,
   │   breakpoint overrides, child outline (≤ N), layer name; page outline;
   │   tokens (gatherTokens); assets (gatherMediaAssets); siteId
   ▼
 ai.streamPrompt  (intent "ops", + task, + siteId)   ← EXTEND existing proc
   │   server: checkSiteRole(siteId) → reserve quota → task prompt (registry)
   │           → provider → parse → aiOpSchema.safeParse per op (SHARED schema)
   │           → scope guard (ids ∈ context) → trust policy (url/token/asset)
   ▼
 { kind: "ops", ops[], rows[] }            canvas edit, undoable
 { kind: "field", field, value }           prefill a form field the user commits
 { kind: "proposal", actionId, args }      privileged, confirm-token path
   ▼
 applyAiOps(composer, ops, { label })      ← HARDENED applyAiEdit
   1. parse all ops with the shared schema; drop invalid (count them)
   2. preflight: every target exists AND canWrite() (lock gate) — refuse batch
      or drop locked (LOCKED_ELEMENTS_SKIPPED toast, existing)
   3. beginTransaction(label)
   4. run handlers (await async ones)
   5. on throw → rollbackTransaction() (real snapshot restore now) ; else end
   6. history.flushPending()
   7. emit AI_OPS_APPLIED { label, applied, skipped, affectedIds }
```

### What it reuses (nothing is rebuilt)

| Need | Reuse |
|---|---|
| Op handlers | `COMMAND_HANDLERS` (`applySetStyle.ts:597`), unchanged bodies |
| Transaction, one undo | `beginTransaction` / `endTransaction` / `flushPending`, as `applyAiEdit` does today |
| Atomic failure | `Composer.rollbackTransaction` (`Composer.ts:1134`). It restores the snapshot now, so the "never rollback" note in `applySetStyle.ts:620` is stale. |
| Lock refusal and toast | `writableElements` / `canWrite` (`commandOperations.ts:184-202`) |
| Subtree insertion with sanitizing | `insertHTMLToElement` (DOMPurify single source, `refineElementTypes`) |
| Diff rows | `editCommandToRow` (`ai.service.ts:754`) and AgentPlan's rows |
| Quota, model, provider errors | `reserveQuota` / `resolveModelForUser` / `assertProviderConfigured` and the error kinds in `runPromptOnce.ts:20` |
| Privileged path | `ai-actions.service.ts` registry plus `useAiActionGate` |
| Task prompts | `COMMAND_PROMPT_SPECS` and `agentCallable` (extend with a per-task prompt template) |

### What is new (small)

1. **`packages/shared/schemas/ai-ops.ts`:** one Zod union holding every op's args plus `ALLOWED_STYLE_PROPERTIES`, `UNSAFE_CSS_VALUE`, `isSafeSrcValue`, `UNSAFE_HREF` and the plain-text refine. The server validates with it in place of the hand-written `isValidEditCommand` (`ai.service.ts:954`, about 160 lines). The client uses the same schemas in `COMMAND_HANDLERS`. CLAUDE.md requires this: anything that crosses the transport boundary belongs in shared. The P1b roadmap intended exactly this (`docs/plans/2026-06-03-002`).
2. **`buildAiContext`** (editor, one file next to `aiScopeContext.ts`, which it absorbs). Bounded: text ≤ 500 characters per element, at most 40 style keys, an attribute allow-list of `href`, `alt`, `title`, `aria-*`, `role`, `type`, `name`, `placeholder`, and child outlines of at most 30 nodes.
3. **Server:** add `task` and `siteId` to `streamPromptInputSchema`, plus a `taskPrompt(task, context)` registry in `ai.service.ts`. The element-scope prompt includes the context block, wrapped in the same "data, not instructions" fencing that `<request>` uses.
4. **`AI_OPS_APPLIED` event** in `shared/constants/events.ts`. The Issues feed (`useIssuesFeed.rescan`) and adoption telemetry subscribe to it.
5. **Doors carry intent:** an `openAI({ task, prompt?, autorun? })` payload on `ui:switch-tab`, so a context-menu "Shorten" runs immediately in the AI column on that element (same engine, per FA-1).

**Effort: M** (about 3–4 days including tests). **Verdict: DO NOW.** Every row below depends on it.

### Safety contract

- **Validated three times:** server parse, client parse, engine authority. `setDesignToken` re-checks the id and type; `insertHTMLToElement` sanitizes.
- **No markup in text ops.** Subtrees enter only through the sanitize boundary.
- **One undo per accepted batch.** A failure inside the batch rolls back fully. Today it stays half-applied but recorded.
- **Locked elements are never written.**
- **Field results are prefilled only.** The user's own commit writes them (SEO, CMS, alt). AI never saves a server field directly, and the "never overwrite user-typed alt" rule is kept.
- **Privileged results only propose.**

### States every surface needs

idle → thinking → (preview rows / prefilled field) → applied (Undo) | rejected | no-change ("Nothing to change") | failed (other / not-configured / quota). The AITab boards already define every one of these states (`AITab.tsx:16-41`). The work is reusing them, not redesigning them.

---

## 4. Extension map

Legend: Effort S ≤ 1 day, M 2–4 days, L ≥ 1 week. "Reuse" cites existing code.

### 4.1 Selected element: context menu and selection toolbar — **DO NOW**

| | |
|---|---|
| Candidates | "Rewrite", "Shorten", "Make it warmer/more formal", "Suggest headline" (text elements); "Improve" (sections: spacing and hierarchy pass). |
| Benefit | The most common AI job in a site builder is one-click copy polish on the element under the cursor. Today every door opens an empty prompt, and the model cannot see the text. |
| Reuse | `improve-with-ai` action (`shared/elementActions.ts:192`) → turn it into a submenu; `UnifiedSelectionToolbar.tsx` ✦; `ELEMENT_SUGGESTIONS` (`AITab.tsx:60`); `set-text` op; `useAgentRunner.start(prompt, {id})` one-step run. |
| Integration | `elementActions.ts` adds `ai-rewrite`, `ai-shorten` and `ai-tone` rows, visible only for text-bearing types. Each emits `ui:switch-tab {tab:"ai", task, autorun:true}`. AITab reads the intent and calls `run(prompt, elementScope)`. Server: `streamPrompt` `intent:"ops"`, `task:"rewrite"`. |
| Context | The element snapshot (type, current text, parent section's heading for tone), plus a one-line site brand voice if one exists. |
| Apply | `set-text` (plain, ≤ 2000) → `applyAiOps`. Diff row "from → to" (`editCommandToRow` currently emits `from: ""` for set-text and should carry the old text). |
| States | Thinking in the column, a diff row with Apply / Skip, one undo. Locked element: the existing locked toast. |
| Effort | S on top of the primitive. |
| Verdict | **DO NOW.** Highest-frequency win, almost all reuse. |

### 4.2 Content editing in bulk (page or "all headings like this") — **DO NOW (already wired, needs context)**

- Already possible through scope `similar` / `page` plus the agent plan.
- The gap is that page refs carry text truncated to 50 characters in the prompt (`ai.service.ts:1211`) and no style information, so "make every heading shorter" is half-blind. Raise the text cap for text tasks and include heading level.
- **Effort:** S. **Verdict: DO NOW**, as part of `buildAiContext`.

### 4.3 Issues auto-fix — missing alt → **DO NOW**; broken link → **DON'T (AI)**

| | |
|---|---|
| Benefit | Issues already lists `missing-alt` (`packages/shared/content/contentIssues.ts`, scanner `shell/hooks/useContentIssueScanner.ts`), and Publish shows the same count (`publish.service.ts:143`). Fix today only opens the Inspector field (`useStudioState.ts:108-111`). A real "Fix" or "Fix all N" for alt text is an accessibility and SEO win with near-zero risk. |
| Reuse | `alt-text.service.ts` (vision, never overwrites); `media.generateAltText`; `ElementManager.findByMediaSrc` (`:581`) and `composer.media` to map element src to an asset; IssuesPanel's fixing / fix-failed bands (`IssuesPanel.tsx:156-291`), which already promise "ONE undo step". |
| Integration | `IssuesPanel.isFixable` (`:74`) extends to `contentKind === "missing-alt"`. The `onFix` handler resolves the asset id from the src, calls `generateAltTextRemote` (which persists to the asset as today), then applies `set-attribute {alt}` to every element with that src through `applyAiOps` (one undo). For an image with no library asset (an external URL), add `media.generateAltTextForUrl`, validated by the same SSRF / URL policy. |
| Context | The image URL only. |
| Safety | Asset-level "never overwrite typed alt" is kept. The element-level write applies only where `alt` is empty. |
| Fix also | Add `reserveQuota` to `media.generateAltText` (today uncounted). For "Fix all", reserve one unit per image or cap the batch at N. |
| Effort | S–M. |
| Verdict | **DO NOW.** **Broken links: DON'T use AI.** The fix is a destination choice the user must make (an existing page picker). An LLM guessing URLs is worse than the Link section. |

### 4.4 Add / Insert: Generate block — placement **DO NOW**, styled tree **NEXT**

| | |
|---|---|
| Problem | `GenerateBlockScreen.tsx:64` asks the model in prose to place the section "after element X". `add-section` then places relative to whatever id the model picked (`resolvePlacement`, `applySetStyle.ts:193`). `add-section` children are bare `createElement(type,{content})`, with no styles, no nesting deeper than one level and no images, so "a three-column feature grid with icons" produces unstyled stacked text. |
| DO NOW (S) | Bind placement in code: the client injects `elementId = target.afterId` into the `add-section` op after the server returns, rather than trusting the model. |
| NEXT (M–L) | A new op, `insert-tree`. Args are a bounded JSON element tree: at most 60 nodes, depth ≤ 5; types from `ELEMENT_RULES`; plain text; styles through the shared style allow-list; colours and spacing as `var(--token)` references to the context's tokens; images only from context assets. The client serialises the tree to HTML and inserts it via `insertHTMLToElement(parentId, html, index)`, giving one sanitize boundary and type refinement. The server reuses `lib/sanitize-blocks.ts` / `element-markup.ts` as the allow-list. The anti-slop rules (`ai.service.ts:66`) move into this prompt. |
| Benefit | Turns "Generate block" from a demo into a usable feature, and unlocks 4.10 layout generation, 4.11 pages and 4.14 forms. |
| Verdict | Placement **DO NOW**; `insert-tree` **NEXT**, and the first item after the primitive. |

### 4.5 Inspector — **DON'T** add per-property AI

- The Inspector header ✦ (`InspectorHeader.tsx:108`) is the door, and it already opens the AI column scoped to the element.
- Sparkles next to individual controls (font size, padding) would duplicate the column, clutter a dense desktop panel and contradict FA-1.
- The only Inspector-adjacent addition worth doing is the **image body's "Generate alt" button**. It reuses `AssetDetailOverlay`'s generate flow for the selected image element: S, **NEXT**.

### 4.6 Responsive variants: "Fix for mobile/tablet" — **NEXT**

| | |
|---|---|
| Benefit | A top builder pain is that desktop layouts break on mobile. One action, "Make this section work on mobile", proposing stack direction, font-size steps and padding at the mobile breakpoint saves many manual edits. |
| Reuse | `set-style-variant` with `breakpoint` (`applySetStyle.ts:376-409`) → `composer.styles.setBreakpointStyle`; `getBreakpointQuery`. |
| Integration | A context-menu row on section and container types, plus a canvas footer action when the device frame is mobile. Task `mobile-fix`. |
| Context | The section subtree outline with desktop inline styles plus existing breakpoint overrides. **Measured** widths at the mobile frame (overflowing children), read from the DOM the way the canvas does. Without measurements the model guesses. |
| Apply | `set-style-variant` ops only (never touches desktop), one undo. |
| Effort | M (the measurement context is the work). |
| Verdict | **NEXT.** |

### 4.7 Styling / restyle to brand — **NEXT**

- **Benefit:** "Make this section match my brand" / "use my brand colours". It rewrites hard-coded colours and font sizes to token references, which also clears DS-lint drift.
- **Reuse:**
  - `set-style` already accepts `var(--…)`, since `UNSAFE_VALUE` does not block it
  - `gatherTokens`
  - the DS linter (`engine/designSystem/linter/DSLinter.ts`) to list off-token values deterministically first
- **Design:** deterministic first, AI second. The linter finds candidates. AI only picks the nearest semantic token where colour distance is ambiguous (for example "is this grey the border or the muted text token?").
- **Effort:** M. **Verdict: NEXT.** Pure "make it modern" restyles stay in the free-form column (already possible) and get no new UI.

### 4.8 Brand — **NEXT**, after Brand Part 1 is deployed

- **Benefit:** a palette, type scale and radius set generated from a description or an uploaded logo. Today the user must hand-enter tokens.
- **Reuse:**
  - `set-token` → `designSystem.setDesignToken` (validated, transactional)
  - `setTokens` batch
  - BrandWorkspace "Generate with AI" CTA pattern (`BrandWorkspace.tsx:485`), gated by `dsAi`
- **Caveat:** Brand Part 1a (v6 tokens) merged on 10-07, and its production deploy is still pending. Do not build on the token schema until it is live, and respect `BRAND_TOKENS_V2` gating.
- **Apply:** one `setTokens` call (one undo), shown as a before/after swatch preview (no canvas preview is needed).
- **Logo colour extraction** is deterministic (image quantisation). AI only names roles.
- **Effort:** M. **Verdict: NEXT.**

### 4.9 Accessibility text pass — **NEXT**

- **Benefit:**
  - aria-labels for icon-only buttons and links
  - replacing "click here" / "read more" link text
  - flagging skipped heading levels
- **Reuse:** the `set-attribute` op (`aria-label`, `title`, `alt` are already allowed); `set-text`; the content-issue detector module for new deterministic detectors (`contentIssues.ts`).
- **Design:** **detectors are deterministic** (new `ContentIssueKind`s: `icon-button-unlabelled`, `vague-link-text`, `heading-skip`). AI only writes the replacement text, from the Issues Fix button, exactly like 4.3. Heading-level fixes are deterministic, not AI.
- **Effort:** M. **Verdict: NEXT.** Depends on 4.3's fix plumbing.

### 4.10 Layout generation (page or section from a prompt) — **NEXT** (through 4.4)

- The agent loop already plans multi-step page builds (`useAgentRunner`). Output quality is capped by `add-section`. Once `insert-tree` exists, the planner's steps use it.
- No new surface. **Verdict: NEXT, behind 4.4.**

### 4.11 Pages: "New page from prompt" — **NEXT** (after 4.4)

- **Reuse:** `elements.createPage` (`ElementManager.ts:67`) plus `insert-tree` into its root, and `set-page-setting` (title, description, slug; slug collision check at `applySetStyle.ts:531`).
- **Integration:** Pages panel "+ New page" menu gets an "AI page…" item. Creating a page plus its content must be **one transaction**, so undo removes the page; verify that `createPage` participates in history.
- **Effort:** M. **Verdict: NEXT.**

### 4.12 CMS — sample records **NEXT**, AI field fill **LATER**, schema-from-description **LATER**

| | |
|---|---|
| Benefit | A new collection is empty, so templates and bindings cannot be previewed. "Generate 5 sample records" fills it with realistic, schema-valid content. |
| Reuse | `CollectionManager.createContentItem` (`:300`) and `validateContent` (`:482`). The schema comes from `getCollection(id).fields`. The CMS outbox and sync handle persistence. |
| Apply (different from canvas ops) | CMS writes are async, synced to the server and **outside composer undo**. So the result kind is `field`/`records`: show the records in a preview table, run "Create 5 records" as explicit confirmation, and make "Undo" a **compensating delete** of the created ids (tombstone pattern, per memory `cms-tombstone-pattern`). Mark the records as samples (a flag or name prefix) so the pre-publish CMS checks can warn when samples are still published. |
| Context | Field schema (names, types, options, references) only. Never existing record content unless asked. |
| Server | New task `cms-sample-records`. Output validated by a Zod schema **built from the field definitions** (shared `cms.ts` types). The `cms.service` write path is unchanged. |
| Effort | M. |
| Verdict | **NEXT.** In-record "fill this field" (RecordSheet) is **LATER**: low frequency. |

### 4.13 Components — **LATER**

- DS-AI component-schema generation exists and is flag-gated (`AIAssistService`). Keep it there.
- `insert-component` and `save-as-component` ops already exist for the agent.
- AI-suggested component names: **DON'T** (trivial, and the user types better names).
- "Find repeated patterns → suggest making a component" is interesting but deterministic (tree hashing), not AI. **LATER**, as a non-AI feature.

### 4.14 Forms — generate form **LATER**; submissions **DON'T**

- **Generating a form from a description** (a contact form with budget dropdown and consent checkbox) rides `insert-tree` with form element types. **LATER**: low frequency next to content and responsive work.
- **AI spam or lead classification of submissions: DON'T.** Submissions are PII. Sending them to an LLM needs a privacy and DPA decision, and `form-submission.service.ts` should keep deterministic spam controls.

### 4.15 SEO — **DON'T** extend (owner decision)

- The owner set "AI rewriting of copy" as a non-goal and said the Suggest-title button "is not extended" (`seo-yoast-plan.md:21`). Respect that.
- **If the owner reopens it**, the cheapest high-value change is to feed the page's H1 and first paragraph into the existing `SeoTab.tsx:125` prompt (today it only sees the page name), and add the same thing for meta description. Both are S, use the `field` result kind and are prefill-only.
- Yoast-style analysis (keyphrase, readability) must stay deterministic.

### 4.16 Media — alt text **DO NOW** (4.3); stock suggestion **NEXT**; image generation **DON'T**

- **Alt text:** extend to element level and Issues (4.3), plus quota.
- **"Find a photo for this section" (NEXT, S–M):** AI writes a search query from the section's text, and the existing Pexels/Unsplash stock search (`PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY`) shows results. The user picks one, and it imports to the library and applies through `set-attribute src` (assets allow-list). AI never picks the image itself.
- **Generative image creation or editing: DON'T (now).** No image model is wired, it carries real per-call cost and storage, brand-safety and licensing questions, and stock search covers most of the need.

### 4.17 Review — "Apply this comment" **NEXT**; thread summary **LATER**

- **Benefit:** client reviewers leave pinned comments ("make this bigger", "change to 'Book a table'"). One click turns a comment into a scoped AI run on the anchored element, with the diff for approval. The comment can then be resolved.
- **Reuse:** the comment anchor (`targetSelector`, re-anchor flow `packages/shared/schemas/comments.ts:26`) maps to an element id; then `useAgentRunner.start(comment.body, {id})`. Treat the comment body as untrusted data (it comes from an external reviewer): it already flows into `<request>` fencing, and `applyAiOps` only allows editor ops, never `propose-action`, for review-originated runs.
- **Effort:** M. **Verdict: NEXT.**
- Summarising long threads: **LATER**.

### 4.18 Publish: pre-publish AI content check — **LATER**, advisory only

- **Benefit:** catches leftover placeholder or lorem text, "Your Company" sample copy, obvious typos and empty CTAs before going live.
- **Design:** placeholder and lorem detection is **deterministic** (regex in `contentIssues.ts`, shared by Issues and `runPrePublishChecks`), so do that first as a non-AI item. AI typo or grammar review is optional: a "Proofread site" button in the Publish panel producing `set-text` suggestions per element. It **never** gates publish (consistent with the SEO decision) and spends quota only on click.
- **Verdict:** deterministic placeholder check **NEXT** (non-AI); AI proofread **LATER**.

### 4.19 Error fixing (save conflict, publish failure, apply failure) — **DON'T**

- Save conflicts, lock refusals and CMS CONFLICT/GONE are state problems with deterministic resolutions (memory `cms-conflict-semantics`). An LLM adds risk and no benefit.
- One possible **LATER**: "Explain this deploy error" on a Vercel build log in the Publish panel. Text only, nothing applied.

### 4.20 Project-level: "Analyze page & suggest" — **LATER**

- **Benefit:** a critique of the current page: hierarchy, CTA clarity, contrast, mobile risk. Each suggestion becomes a one-click scoped run.
- **Risk:** generic "AI slop" advice and quota burn. It needs the full context builder plus the measurement context from 4.6 to say anything concrete.
- **Design when built:** results are a list of **suggestions, each carrying a pre-filled task + scope**, not ops. Clicking one starts a normal run. It never auto-applies.
- **Effort:** M–L. **Verdict: LATER**, after 4.6 and 4.7 prove the context is good enough.

### 4.21 Version history and milestones — keep summary; **DON'T** keep background milestone AI as is

- `useAISummary` is user-triggered and fine.
- `useAutoMilestone` calls `ai.milestoneSuggest` in the background and "spends AI quota regardless of outcome". Background AI spending user quota invisibly is the wrong default. Make it click-to-suggest or deterministic naming (owner decision; not new AI work).

---

## 5. Priority and sequencing

| # | Item | Effort | Verdict | Depends on |
|---|---|---|---|---|
| 1 | AI Ops v2 hardening: shared schema, lock gate, atomic rollback, `AI_OPS_APPLIED`, `siteId` authz | M | DO NOW | — |
| 2 | Element context for element scope (`buildAiContext`) | S | DO NOW | 1 (or standalone) |
| 3 | Element quick actions (Rewrite / Shorten / Tone) via context menu, selection toolbar and intent-carrying doors | S | DO NOW | 2 |
| 4 | Issues "Fix" for missing alt (+ Fix all), element-level alt, quota on alt-text | S–M | DO NOW | 1 |
| 5 | Generate-block deterministic placement | S | DO NOW | — |
| 6 | `insert-tree` op (styled, token-referenced, sanitized subtree) | M–L | NEXT | 1 |
| 7 | Responsive "Fix for mobile" | M | NEXT | 1, 2 |
| 8 | Restyle to brand tokens (linter-led) | M | NEXT | 1 |
| 9 | Accessibility text pass (new deterministic detectors + AI text) | M | NEXT | 4 |
| 10 | Review "Apply this comment" | M | NEXT | 1, 2 |
| 11 | Stock photo suggestion | S–M | NEXT | — |
| 12 | Brand palette and type generation | M | NEXT (after Brand Part 1 deploy) | 1 |
| 13 | CMS sample records (preview, confirm, compensating delete) | M | NEXT | — |
| 14 | New page from prompt | M | NEXT | 6 |
| 15 | Deterministic placeholder/lorem check in Issues and Publish (non-AI) | S | NEXT | — |
| 16 | Analyze page & suggest; AI proofread; forms-from-prompt; CMS field fill; comment summary; deploy-error explain | M–L | LATER | 2, 6, 7 |
| — | Per-property Inspector AI; AI broken-link fix; AI error or conflict fixing; image generation; submission classification; SEO copy extension; background milestone AI | — | DON'T | — |

---

## 6. Cleanup the primitive work should include (found while mapping)

These are not new features. They are dead or duplicated code on the path the primitive touches. Per CLAUDE.md "no dead code", fold them into item 1.

- `ai.page` / `ai.layout` procedures and `generatePage` / `generateLayout` have no consumer in `packages/editor/src` or the dashboard. Either delete them or make them the server half of `insert-tree`.
- The `EVENTS.AI_*` block (`shared/constants/events.ts:482-487`, `:703-713`) is legacy. Verify which have emitters before reusing any name for `AI_OPS_APPLIED`.
- `PreviewLayer` / `previewUpdate` is a write-only channel with no renderer. Either build live diff preview on it (canvas work, L) or delete it. Diff rows are sufficient for v1.
- The stale comment at `applySetStyle.ts:618-622` ("never rollbackTransaction") is now false, because `Composer.ts:1134` restores the snapshot.
- `editCommandToRow` emits `from: ""` for `set-text`. Diff rows should show the old value once context is sent.

---

## 7. Not verified

- **No live-app runs.** Every finding here comes from reading code. In particular:
  - Element-scope "blindness" is read from the schema and prompt builder (`ai.ts:146`, `ai.service.ts:906`). It was not observed with a real model reply.
  - That `createPage` participates in history was not checked.
  - Who emits the legacy `AI_*` events was not checked.
- The `.claude/worktrees/*` copies were ignored. Their `ai.page` / `ai.layout` callers are not on main.
- Dashboard-side AI (onboarding generation, `app/dashboard/settings/ai`) was only skimmed. Recommendations are scoped to the editor plus its server procedures.
- I did not open the Figma boards for the AI column. State names come from the code comments that cite them.
