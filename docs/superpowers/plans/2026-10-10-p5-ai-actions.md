# P5 · AI Actions — Toolbar Entry, Text Quick Actions, Alt Text from Issues Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** This plan delivers three AI actions.
- **One AI entry on the selection toolbar (L5-015).** It is labelled, uses a vector icon, is scoped to the selection, and reuses the existing AI flow.
- **Text quick actions (L5-016).** Rewrite, Shorten, Change tone and Fix grammar run on eligible text. Each shows a proposal before anything is applied. Bold, italic and links are kept. The change is undone in one step, and a late response never overwrites newer edits.
- **"Generate alt text" from missing-alt Issues (L5-026).** It is quota-gated and gives an editable suggestion. Each image is one undo step, and it respects decorative empty alt. It ships only after the L4-007 opt-in toggle has landed.

**Architecture:**
- **Formatting-preserving rewrite.** Rich text is reduced to *tokenised plain text*: each inline element becomes `⟦n⟧…⟦/n⟧`. The model rewrites that text, and the server checks that the token structure came back intact. The editor then rebuilds HTML from the **original** tags and attributes, so `href`s are never model-written.
- **Applying edits.** All edits go through `applyAiEdit` (`sidebar/tabs/ai/applySetStyle.ts:669`), which is one Composer transaction and therefore one undo. A new command, `set-rich-text`, does the reconstruction.
- **Server calls.**
  - `streamPrompt` and the new `ai.textAction` both take `siteId` and require EDITOR on that site.
  - `media.suggestAltText` returns a suggestion **without writing** the asset, so the placement owns its alt.
- **Quotas.** All three go through the existing per-user quota (`quota.service.ts`).

**Tech Stack:** TypeScript 5 strict, tRPC 11, Zod, OpenAI via lazy `getOpenAI()` (`server/services/openai.client.ts:23`), Vitest + RTL, React 18 chrome (chrome-ui, `tw:`, lucide icons). **No Prisma migration in this plan.** The L4-007 workspace toggle, which this plan depends on, carries its own migration in the priority-1 lane.

**Spec:**
- `docs/audits/2026-10-08-editor-full-audit/OWNER-ANSWERS-2026-10-10.md`: L5-015†, L5-016†, L5-026, L4-007, and the implementation order (P5).
- Detail: `phase2-live/L5.md` §L5-015, §L5-016, §L5-026; `status-wave6.md:156-162` (L5-015/016 memo); `phase2-live/L4.md` §L4-007.

## Global Constraints

- The † on L5-015 and L5-016 means the referenced memo was missing. **Task 0 writes acceptance criteria into this plan before anything is built** (owner instruction for † items).
- **L5-026 starts only after L4-007 is merged.** L4-007 provides the workspace "Automatic alt text" toggle (OFF by default) and the `useAltTextAutoTrigger` gate. Before L4-007, an on-demand action next to an always-on auto trigger would double-charge.
- Every AI write is shown as a proposal first and applied in exactly one transaction, so one ⌘Z undoes it. A proposal is applied only if the target's text equals the text it was generated from.
- Server-side permission checks: EDITOR on the site, through `checkSiteRole`. Server-side quota: `reserveQuota` / `releaseQuota` with a refund on provider failure. The UI never decides either one.
- Links are preserved: the model never sees or writes `href`, `target` or `rel`. Only the text inside tokens changes.
- Copy uses "AI suggestion", "Apply", "Discard" and "Try again". No promise of correctness is made.
- Chrome uses `@/editor/chrome-ui` with lucide icons, never emoji (DQ-026 precedent). There are no raw native controls (Gate 24) and no `../../`.
- The FIGMA loop applies to every UI task. No board exists for the toolbar AI entry, the quick-actions menu, the proposal card or the Issues "Generate alt text" row (Task 0 brief).
- Live steps never publish from the QA workspace.

## Review Focus

1. **The user keeps typing in the element, or undoes, while the request is in flight.** Expected: the proposal opens marked "This text changed since you asked", with Apply disabled and "Run again" offered. Nothing is written. Pinned in Task 4.
2. **The model drops, duplicates, reorders or invents a formatting token, or returns HTML.** Expected: the server rejects the output as `FORMAT_LOST` and refunds quota. The UI says "Couldn't keep your formatting — try again" and never applies stripped text. Pinned in Tasks 2 and 3.
3. **Selection changes to another element, the page switches, or the menu is triggered twice quickly.** Expected: the earlier request is aborted (`AbortSignal`) and its late response is discarded. At most one proposal is visible. Pinned in Task 4.
4. **An image marked decorative (`alt=""` or `data.decorative`) shares an asset with an image that gets a generated alt.** Expected: the decorative placement keeps `alt=""`. Today `followAssetAlt` (`engine/media/MediaCommandLayer.ts:280`) overwrites it because its `!alt` test treats `""` as empty. Pinned in Task 8.
5. **Quota exhausted, provider not configured, or a VIEWER role.** Expected: the toolbar entry and the actions show the existing quota or "AI isn't available" copy, disabled with a reason. No request is sent. Pinned in Tasks 1, 5 and 9.

---

## Reality check (code is truth; `origin/main` @ `503bc62cd`)

1. **The toolbar has no AI button.** `canvas/controls/UnifiedSelectionToolbar.tsx` (215 lines) has Duplicate, Delete and More, written by hand in JSX with lucide `Copy`, `Trash2` and `MoreHorizontal`. The header comment (`:14`) routes AI to "the inspector header's ✦ AI". The pill is sized for three buttons (`INSIDE_MIN_W`/`INSIDE_MIN_H`, `:51-52`), and its caption is `:208`.
2. **The existing AI door is "Improve with AI"** (`shared/elementActions.ts:192-200`) in the context menu. It emits `ui:switch-tab {tab:"ai", prompt: IMPROVE_ELEMENT_PROMPT}` (`AquibraStudio.tsx:759`), which **prefills but does not send** (`AITab.tsx:299`). The L5-014 intent plumbing is fixed (`de2051c7c`).
3. **`set-text` refuses markup.** The client refine `!/[<>]/` is at `applySetStyle.ts:145-154`, and the server refuses the same with `UNSAFE_TEXT` (`ai.service.ts:849,1082`). An AI rewrite through the current path would strip `<strong>` and `<a>`. Rich text is stored as HTML in `data.content`. Inline edit commits `sanitizeHTML(innerHTML)` (`canvas/hooks/useCanvasInlineEdit.ts:164-166`), with bold as `strong` and links via `createLink`.
4. **There is no proposal UI for text.** `useAiActionGate.ts` covers `propose-action` consequence dialogs only. `ServerEdit.rows` (from→to) exists (`runPromptOnce.ts:95-100`) but nothing renders a text diff card.
5. **`streamPrompt` has no site check.** `scopeSchema` (`server/trpc/routers/ai.ts:162`) carries no `siteId`. Quota is per user per day (`quota.service.ts:75`, limit `PLAN_LIMITS[plan].aiPromptsPerDay`). A missing provider gives `PRECONDITION_FAILED`.
6. **There is no version counter on elements.** The usable stale guards are: compare `getContent()` at request time against apply time, the `AbortSignal` on requests, and `history.captureUndo()`, which refuses when superseded (`HistoryManager.ts:583`).
7. **Alt text works per asset, and auto runs always.**
   - `applyAltTextToAsset` (`alt-text.service.ts:145`) writes `MediaAsset.altText`. `media.generateAltText` (`routers/media.ts:324`) is rate-limited to 30/min.
   - `useAltTextAutoTrigger` (`shell/hooks/useAltTextAutoTrigger.ts`, mounted `StudioPanels.tsx:275`) generates on **every** image upload with no setting. That is L4-007, NOT DONE, with no Workspace field.
   - Asset alt follows into elements through `followAssetAlt`, whose `!alt` test overwrites decorative `alt=""`.
8. **The Issues missing-alt row has no action.** `IssuesPanel.tsx` shows `Fix ›` only for `tokenId && autoFixHint` (`:74`). The `Issue.contentKind` doc comment promises "an inline alt-text field for missing-alt", which does not exist (`useStudioState.ts:81-113`). The missing-alt finding skips `data.decorative` and `alt=""`, and flags a missing attribute or the placeholder `"Image"` (`contentIssues.ts:104-132`). **Nothing in the editor can set `data.decorative`.**
9. **There are no feature flags on the AI panel or alt text.** `dsAi` gates Brand AI only (`featureFlags.ts:15`).
10. **Boards.**
    - Selection toolbar: `5936:44788` (Canvas · selected · Hero, with the Duplicate · Delete · More caption) and `4428:43928` (⋯ menu).
    - AI flow: `4418:104454` draft … `4418:105548` undo all. Quota reached: `4418:106671`. Provider unavailable: `4418:106919`.
    - Alt generate: `6623:149646` generating, `6623:149894` success, `6623:150370` retry, `4418:65639` failed.
    - Issues: `4418:147641`.
    - **No board** draws a toolbar AI button, quick actions, a text proposal card, or Issues → Generate alt text.

## File Structure

| File | Responsibility | New / Modify |
|---|---|---|
| `packages/shared/ai/inlineTokens.ts` | tokenise / validate / rebuild inline markup (pure, DOM-free; operates on a parsed tree passed in) | Create |
| `packages/shared/schemas/ai-actions.ts` | `textActionInput`, `suggestAltTextInput`, action enum | Create |
| `server/services/ai-text-actions.service.ts` | prompt per action, call provider, validate tokens | Create |
| `server/trpc/routers/ai.ts` | `textAction` mutation; `streamPrompt` + `siteId` and EDITOR check | Modify |
| `server/services/alt-text.service.ts`, `server/trpc/routers/media.ts` | `suggestAltText` (no write, dedupe, quota) | Modify |
| `packages/editor/src/editor/ai-actions/{richText.ts,useTextAction.ts,AiProposalCard.tsx,QuickActionsMenu.tsx}` | editor side of quick actions | Create |
| `packages/editor/src/editor/sidebar/tabs/ai/applySetStyle.ts` | `set-rich-text` command | Modify |
| `packages/editor/src/editor/canvas/controls/UnifiedSelectionToolbar.tsx` | ✦ AI entry | Modify |
| `packages/editor/src/editor/shell/IssuesPanel.tsx`, `packages/editor/src/editor/shell/issues/AltTextIssueRow.tsx` | Generate alt text row | Modify / Create |
| `packages/editor/src/engine/media/MediaCommandLayer.ts:280` | decorative alt respected | Modify |

---

### Task 0: Acceptance criteria for the † items and the board brief (blocking)

**Files:**
- Modify: this plan (append an "Acceptance criteria" section under Task 0)
- Create: `docs/design-jobs/AI-ACTIONS/BRIEF.md`

- [ ] **Step 1:** Append the acceptance criteria for L5-015 and L5-016 to this plan. They are restated from the owner text plus `status-wave6.md:156-162`:
  1. The toolbar shows a fourth control, "AI" (lucide `Sparkles`, label visible on hover and focus as "AI actions", `aria-label="AI actions"`), for any selected element.
  2. For eligible text, the menu shows Rewrite, Shorten, Change tone (Friendly · Professional · Confident · Casual), Fix grammar, a separator, then "Open AI assistant…". Otherwise only "Open AI assistant…" shows.
  3. "Open AI assistant…" opens the existing AI panel scoped to the selection **and sends** the prompt the user types; it does not auto-send a canned prompt.
  4. A quick action shows a proposal card (before / after) with Apply / Discard / Try again. Apply changes the text in one undo step and keeps bold, italic and links (same `href`).
  5. Eligible text is heading, paragraph, text, button, link and list item, with plain or inline-formatted content. It excludes `contentFormat:"html"` blocks, CMS-bound elements (`data-cms-bound`), empty text and locked elements.
  6. A late or stale response never writes.
- [ ] **Step 2:** Write the designer brief, using `5936:44788` as the base. It asks for:
  - the four-button pill (inside and outside variants);
  - the open AI menu for text and for non-text selections;
  - the proposal card (loading, ready, stale, format-lost and quota states);
  - the Issues missing-alt row with "Generate alt text" → generating → editable suggestion → Accept / Mark decorative, with the quota-out state.

  Reference `4418:106671` (quota), `6623:149646`/`149894`/`150370` (alt states) and `4418:147641` (Issues).
- [ ] **Step 3:** Commit: `git commit -m "docs(ai-actions): acceptance criteria for L5-015/016 + board brief"`

### Task 1: Site-scoped AI on the server (`streamPrompt` + `textAction` skeleton)

**Files:**
- Modify: `server/trpc/routers/ai.ts:162,334`, `packages/editor/src/editor/sidebar/tabs/ai/hooks/runPromptOnce.ts:103-112` (pass `siteId`)
- Create: `packages/shared/schemas/ai-actions.ts`
- Test: `__tests__/ai-router-site-scope.test.ts`

**Interfaces:**
- Produces:
  - `scopeSchema` gains `siteId: z.string()`.
  - `textActionInput = z.object({ siteId: z.string(), elementId: z.string(), action: z.enum(["rewrite", "shorten", "tone", "grammar"]), tone: z.enum(["friendly", "professional", "confident", "casual"]).optional(), tokenText: z.string().min(1).max(4000), locale: z.string().max(16).optional() }).refine((v) => v.action !== "tone" || v.tone, "tone required")`.
  - `ai.textAction` → `{ tokenText: string }`. `TRPCError` codes: FORBIDDEN, TOO_MANY_REQUESTS, PRECONDITION_FAILED, BAD_REQUEST (`FORMAT_LOST`).

- [ ] **Step 1: Write the failing tests.**
  - `streamPrompt` without `siteId` gives BAD_REQUEST.
  - A VIEWER on the site gives FORBIDDEN, and `reserveQuota` is **not** called.
  - An EDITOR passes to the provider (mocked).
  - `textAction` gets the same role checks.
  - Every editor caller of `runPromptOnce` now passes `siteId`. A grep test asserts that `scope:` objects in `useAgentRunner.ts` and `GenerateBlockScreen.tsx` include it.
- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run __tests__/ai-router-site-scope.test.ts __tests__/ai-router.test.ts`
- [ ] **Step 3: Implement.** Call `checkSiteRole(ctx.userId, siteId, "EDITOR")` before `reserveQuota`. Map `PermissionError` with the router's existing translator. The editor's `siteId` comes from the composer project id that `ReviewService` already uses.
- [ ] **Step 4: Run them and confirm they pass,** plus `pnpm vitest run __tests__/ai.service.test.ts` and `cd packages/editor && npx vitest run src/editor/sidebar/tabs/ai`.
- [ ] **Step 5: Commit.** `git commit -m "fix(ai): site-scoped permission check before quota on streamPrompt; textAction contract"`

### Task 2: Inline-token round trip (shared, pure)

**Files:**
- Create: `packages/shared/ai/inlineTokens.ts`, `packages/shared/ai/__tests__/inlineTokens.test.ts`

**Interfaces:**
- Produces:

```ts
export interface InlineNode { tag?: "strong" | "b" | "em" | "i" | "u" | "a" | "span" | "br" | "code"; attrs?: Record<string, string>; children?: InlineNode[]; text?: string }
export function toTokenText(nodes: InlineNode[]): { tokenText: string; map: Map<number, Omit<InlineNode, "children" | "text">> };
export function validateTokenText(original: string, rewritten: string): { ok: true } | { ok: false; reason: "missing" | "extra" | "nesting" | "markup" };
export function fromTokenText(rewritten: string, map: Map<number, Omit<InlineNode, "children" | "text">>): InlineNode[];
export const TOKEN_OPEN = (n: number) => `⟦${n}⟧`; export const TOKEN_CLOSE = (n: number) => `⟦/${n}⟧`;
```

  `<br>` becomes a self-closing `⟦n/⟧`. Any `<` or `>` in the rewritten text gives `markup`.

- [ ] **Step 1: Write the failing tests.**
  - `Hello <strong>bold</strong> and <a href="/x">link</a>` → `Hello ⟦1⟧bold⟦/1⟧ and ⟦2⟧link⟦/2⟧`, and the round trip rebuilds the same tree with `href:"/x"` taken from the map.
  - A rewrite that keeps tokens 1 and 2 in any order at top level is ok.
  - Dropping `⟦2⟧…⟦/2⟧` gives `missing`.
  - Adding `⟦3⟧` gives `extra`.
  - `⟦1⟧a⟦2⟧b⟦/1⟧c⟦/2⟧` gives `nesting`.
  - Text containing `<b>` gives `markup`.
  - Nested `<strong><em>x</em></strong>` round-trips.
  - The model cannot change `href`: `fromTokenText` ignores anything that isn't text inside tokens.
- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run packages/shared/ai/__tests__/inlineTokens.test.ts`
- [ ] **Step 3: Implement it** with a small stack parser for the tokens. The token-text format is the contract, and there is no DOM in shared.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(ai): inline-token round trip that preserves formatting and links"`

### Task 3: Server text actions with token validation and refund

**Files:**
- Create: `server/services/ai-text-actions.service.ts`, `__tests__/ai-text-actions.service.test.ts`
- Modify: `server/trpc/routers/ai.ts` (wire `textAction`)

**Interfaces:**
- Consumes: `validateTokenText` (Task 2), `getProvider` / `assertProviderConfigured` (`ai.service.ts:481,492`), `reserveQuota` / `releaseQuota`.
- Produces: `runTextAction(userId, input): Promise<{ tokenText: string }>`. It throws `AiTextActionError("FORMAT_LOST" | "EMPTY" | "PROVIDER_FAILED")`.

- [ ] **Step 1: Write the failing tests.** Use a mocked provider.
  - Each action's system prompt contains its instruction:
    - rewrite: "Rewrite for clarity; keep meaning; similar length";
    - shorten: "≤70% of the original length";
    - tone: "in a <tone> tone";
    - grammar: "Fix spelling and grammar only; change nothing else".
  - Every prompt includes the token rule "Keep every ⟦n⟧…⟦/n⟧ marker exactly once, same nesting; never output HTML".
  - Provider output that fails validation is retried once with "Your previous answer broke the markers". If it fails again: `FORMAT_LOST`, and `releaseQuota` is called.
  - An empty output gives `EMPTY` plus a refund.
  - A provider throw gives `PROVIDER_FAILED` plus a refund.
  - Grammar on already-correct text returns unchanged text, which is valid; the UI handles "No changes suggested".
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it.** One quota unit is charged per successful action. The retry is not charged twice.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(ai): text quick actions service — validated tokens, one retry, refunds"`

### Task 4: Editor — `set-rich-text`, `useTextAction` with stale guard, `AiProposalCard`

**Files:**
- Create: `packages/editor/src/editor/ai-actions/richText.ts` (DOM ↔ `InlineNode[]` using `DOMParser`, editor-only), `useTextAction.ts`, `AiProposalCard.tsx` + tests under `ai-actions/__tests__/`
- Modify: `packages/editor/src/editor/sidebar/tabs/ai/applySetStyle.ts` (`set-rich-text` handler: `{ kind: "set-rich-text", elementId, nodes: InlineNode[] }` → serialise to HTML → `sanitizeHTML` → `el.setContent`)

**Interfaces:**
- Produces:
  - `isEligibleText(el): boolean` (the Task 0 criterion 5).
  - `useTextAction(composer): { state: "idle" | "loading" | "ready" | "stale" | "error"; proposal?: { before: string; after: string; nodes: InlineNode[] }; error?: string; run(elementId, action, tone?): void; apply(): Promise<boolean>; discard(): void }`.
  - `<AiProposalCard state proposal onApply onDiscard onRetry />`, with the before/after text shown plain and formatting indicated by its tokens rendered as styled spans.
- The **stale guard** is three checks:
  1. `run()` stores `{ elementId, sourceHtml: el.getContent(), requestId }` and aborts any in-flight request.
  2. A response is ignored if its `requestId` is not the latest.
  3. Before showing, and again inside `apply()`, if `el.getContent() !== sourceHtml` or the element is gone or the selection moved, the state becomes `"stale"` and Apply is disabled.

- [ ] **Step 1: Write the failing tests.**
  - The happy path applies once, `composer.history` gains exactly one entry, and ⌘Z (`history.undo()`) restores the original HTML byte-for-byte.
  - Links keep `href` and bold stays bold after apply.
  - Editing the element during loading gives `stale`, and `apply()` returns false with the content unchanged.
  - Calling `run()` twice discards the first response.
  - A `FORMAT_LOST` error shows "Couldn't keep your formatting — try again".
  - Quota gives the existing quota copy from `useAiQuota`.
  - Ineligible elements: `isEligibleText` is false for `contentFormat:"html"`, CMS-bound, locked and empty elements.
  - A `set-rich-text` with a `<script>` in a text node is escaped, never parsed. Assert that `sanitizeHTML` output has no `<script>`.
- [ ] **Step 2: Run them and confirm they fail.** `cd packages/editor && npx vitest run src/editor/ai-actions src/editor/sidebar/tabs/ai`
- [ ] **Step 3: Implement it.** `apply()` calls `applyAiEdit(composer, { applyOps: { commit: [{ kind: "set-rich-text", elementId, nodes }] } }, "AI: Rewrite")`.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(ai): set-rich-text + proposal-before-apply with stale guard (L5-016)"`

### Task 5: Toolbar AI entry and quick-actions menu (L5-015, L5-016)

**Figma:** Task 0 brief boards. Base: `5936:44788` (selected Hero), `4428:43928` (⋯ menu anatomy).

**Files:**
- Create: `packages/editor/src/editor/ai-actions/QuickActionsMenu.tsx` + test
- Modify: `packages/editor/src/editor/canvas/controls/UnifiedSelectionToolbar.tsx:14,24,30-40,51-52,180-208`, `packages/editor/src/editor/shell/AquibraStudio.tsx` (pass `onOpenAI`), `packages/editor/src/editor/shell/StudioPanels.tsx:667-705` (`ui:switch-tab` with `{ tab: "ai", scope: "element" }` and no canned prompt)
- Test: `canvas/controls/__tests__/UnifiedSelectionToolbar.test.tsx` (extend)

- [ ] **Step 1: Write the failing tests.**
  - The toolbar has four buttons with test ids `selection-toolbar-{duplicate,delete,ai,more}`. AI has `aria-label="AI actions"` and an `aria-haspopup="menu"`.
  - The menu for a paragraph lists Rewrite / Shorten / Change tone ▸ / Fix grammar / Open AI assistant…. For an image it lists only Open AI assistant….
  - Choosing Shorten calls `useTextAction.run(id, "shorten")` and anchors `AiProposalCard` to the toolbar.
  - "Open AI assistant…" emits `ui:switch-tab {tab:"ai"}` with the selection scope and no prefilled text.
  - VIEWER or provider unavailable: the AI button is disabled, and its tooltip reads "AI isn't available" (existing copy).
  - The quota-out tooltip uses the `4418:106671` copy.
  - The pill's outside-placement threshold accounts for four buttons: update `INSIDE_MIN_W` and assert it with a 160px-wide element.
  - The caption string at `:208` includes "✦ AI".
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it** with chrome-ui `IconButton` and `Menu*`, and lucide `Sparkles`. Update the header comment `:14`.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** against the brief boards, at 1440×900 with Hero selected.
- [ ] **Step 6: Live done-condition** (local dev, with `OPENAI_API_KEY`):
  1. Select a paragraph containing `<strong>` and a link, then AI → Shorten. A proposal appears.
  2. Apply. Measure `el.innerHTML` before and after: the link `href` is identical and `strong` is present.
  3. Press ⌘Z once and the original HTML returns.
  4. Run Shorten again and type into the paragraph during loading. The card shows "This text changed since you asked" and Apply is disabled.
  5. Select an image. The AI menu shows only "Open AI assistant…".
- [ ] **Step 7: Commit.** `git commit -m "feat(canvas): AI entry on selection toolbar with quick text actions (L5-015, L5-016)"`

### Task 6: Context-menu parity

**Files:**
- Modify: `packages/editor/src/editor/shared/elementActions.ts:192-200`, `canvas/menus/contextMenuRegistry.ts:45`
- Test: `shared/__tests__/elementActions.test.ts`

- [ ] **Step 1: Write the failing tests.** The context menu's "Improve with AI" is replaced by an "AI" submenu that renders the **same** `QuickActionsMenu` items (one item list, no duplication). `IMPROVE_ELEMENT_PROMPT` is removed if it has no remaining callers; grep in the test.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it.** `QuickActionsMenu` exports `quickActionItems(el)` and both surfaces map it.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "refactor(ai): one quick-actions list for toolbar and context menu"`

### Task 7: GATE — confirm L4-007 has landed

- [ ] **Step 1:** Verify in code that a workspace "Automatic alt text" setting exists, defaults OFF, and that `useAltTextAutoTrigger` returns early when it is off (grep the hook and the Workspace model or settings). Check that `docs/audits/2026-10-08-editor-full-audit/status-*.md` marks L4-007 LIVE-VERIFIED.
- [ ] **Step 2:** If it is not landed, **stop here**. Report "L5-026 blocked on L4-007" and ship Tasks 0–6 alone.

### Task 8: Decorative alt is never overwritten

**Files:**
- Modify: `packages/editor/src/engine/media/MediaCommandLayer.ts:280` (`followAssetAlt`)
- Test: `packages/editor/src/engine/media/__tests__/followAssetAlt.test.ts`

- [ ] **Step 1: Write the failing test.** Two image elements share an asset: one with `alt=""` (decorative) and one with no alt attribute. An asset alt update to "A red door" sets the second and leaves the first `""`. An element with `data.decorative === true` and any alt is untouched.
- [ ] **Step 2: Run it and confirm it fails.** `cd packages/editor && npx vitest run src/engine/media`
- [ ] **Step 3: Implement it.** Change the filter from `!alt || alt === previousAlt` to `(alt === undefined || alt === null || alt === previousAlt) && el.data?.decorative !== true`, where `alt` is the attribute value, `undefined` when the attribute is absent.
- [ ] **Step 4: Run it and confirm it passes,** plus `src/engine/media` and `src/engine/__tests__` (the Composer integration).
- [ ] **Step 5: Commit.** `git commit -m "fix(media): asset alt never overwrites a decorative empty alt"`

### Task 9: `media.suggestAltText` — suggestion without write, deduped, quota-gated

**Files:**
- Modify: `server/services/alt-text.service.ts`, `server/trpc/routers/media.ts:63,324`, `packages/shared/schemas/ai-actions.ts`
- Test: `__tests__/alt-text-suggest.test.ts`

**Interfaces:**
- Produces: `suggestAltTextInput = z.object({ siteId: z.string(), assetId: z.string().optional(), imageUrl: z.string().url().optional() }).refine((v) => v.assetId || v.imageUrl)`, and `suggestAltText(userId, input): Promise<{ text: string; charged: boolean }>`.
- Dedupe: if the asset has `generatedMetadata.altText` from a previous generation, return it with `charged:false`. Otherwise generate, store it in `generatedMetadata` only (never in `MediaAsset.altText`), and return `charged:true`.
- `imageUrl` must be `https:`. Assets must belong to the site's workspace.

- [ ] **Step 1: Write the failing tests.**
  - A second call for the same asset is not charged and makes no provider call.
  - `MediaAsset.altText` is never written.
  - VIEWER gives FORBIDDEN.
  - Quota exhausted gives TOO_MANY_REQUESTS with nothing written.
  - A provider failure refunds.
  - An asset from another workspace gives NOT_FOUND.
  - `http:` URL gives BAD_REQUEST.
  - It shares the 30/min rate bucket with `generateAltText`.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it.** Reuse `generateAltText(options)` (`:90`) and the error map (`:63`).
- [ ] **Step 4: Run them and confirm they pass,** plus `__tests__/alt-text.service.test.ts`.
- [ ] **Step 5: Commit.** `git commit -m "feat(media): suggestAltText — no asset write, deduped, quota-gated (L5-026)"`

### Task 10: Issues missing-alt row: Generate → edit → Accept / Mark decorative

**Figma:** brief boards. Generation states: `6623:149646` generating, `6623:149894` success, `6623:150370` retry, `4418:65639` failed. Row anatomy: `4418:147641`.

**Files:**
- Create: `packages/editor/src/editor/shell/issues/AltTextIssueRow.tsx` + test
- Modify: `packages/editor/src/editor/shell/IssuesPanel.tsx:333-378` (render it for `contentKind === "missing-alt"`), `packages/editor/src/services/AltTextService.ts` (`suggestAltTextRemote`)

**Interfaces:**
- Consumes: `suggestAltText` (Task 9), `applyAiEdit` with `set-attribute alt` (already allowed, `applySetStyle.ts:~321-340`), `useAiQuota`.

- [ ] **Step 1: Write the failing tests.**
  - The row shows "Generate alt text" with a credit hint ("Uses 1 AI credit", or "Already generated · free" when the asset has a cached suggestion).
  - Click → generating state → a chrome-ui `TextInput` prefilled with the suggestion and fully editable, plus Accept / Discard.
  - Accept writes `alt` to **this element only**, in one transaction. One `history.undo()` restores the missing alt, and the row reappears after the rescan.
  - "Mark as decorative" sets `alt=""` and `data.decorative=true` in one transaction, and the row disappears.
  - Quota-out disables Generate with the quota copy.
  - The element was deleted meanwhile: Accept is disabled with "This image is no longer on the page".
  - Generating for 3 rows gives 3 independent undo steps.
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run src/editor/shell`
- [ ] **Step 3: Implement it.** The `Issue` doc comment at `useStudioState.ts` now describes the real behaviour.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Figma loop** against the brief boards plus the alt-state boards.
- [ ] **Step 6: Live done-condition** (local dev; automatic alt text OFF per L4-007):
  1. Upload an image. The network log shows **no** `generateAltText` call.
  2. Issues › "Missing alt" → Generate. One `suggestAltText` POST, one credit (read `ai.quota` before and after).
  3. Edit the text and Accept. `img.alt` equals the edited text. ⌘Z clears it. Generate again: no new credit is used (dedupe).
  4. Mark another image decorative. `alt=""` persists after reload, and no Issues row returns.
- [ ] **Step 7: Commit.** `git commit -m "feat(issues): Generate alt text from missing-alt rows, editable, one undo per image (L5-026)"`

### Task 11: Phase report

- [ ] **Step 1:** Write `docs/audits/2026-10-08-editor-full-audit/status-p5-ai-actions.md` marking L5-015, L5-016 and L5-026 as LIVE-VERIFIED (with the measurements) or NOT VERIFIED. List the languages tested for grammar (English only, unless others were tried).
- [ ] **Step 2:** Commit: `git commit -m "docs(audits): P5 AI actions live verification"`

---

## Owner questions (recommended defaults in bold)

| # | Question | Recommendation |
|---|---|---|
| Q1 | Which tones should Change tone offer? | **Friendly, Professional, Confident, Casual.** |
| Q2 | Should "Open AI assistant…" auto-send anything? | **No.** It opens scoped and waits for the user's words. Quick actions cover the one-click cases. |
| Q3 | Should a generated alt also be saved on the asset for future placements? | **No.** The suggestion is cached for free reuse, but each placement's alt is its own (owner: per-placement overrides). |
| Q4 | Should quick actions work on CMS-bound text? | **No.** Edit the record instead. The menu explains "This text comes from the CMS". |

## Migrations

None in this plan. L4-007's workspace toggle migration belongs to the priority-1 lane, and Task 7 gates on it.
