# Audit 01: AI features in the editor, traced end to end

Date: 2026-10-08. Read-only audit of HEAD `44f5db956`. Paths are relative to the repo root `/Users/shahg/Desktop/pencil/buildrik` unless they start with `src/`, which means `packages/editor/src/`.

## Verdict

The founder's view that AI is "largely broken" is only partly right. The transport is sound. Every procedure the editor calls exists on the router, and every client payload matches its server Zod schema field for field. superjson is used on both sides, and the session cookie travels because the client is same-origin. All 31 editor AI test files and 8 server AI test files pass. The failures are elsewhere:

1. **Context.** An element-scoped prompt sends the server only the element **id**. The model never sees the element's type, text or styles. That covers the AI column's three suggestion buttons and every one-element run.
2. **Undo and integrity.** "Undo all" counts steps, not history entries, so it can undo the user's own earlier work. Partly applied steps are invisible to it. AI writes skip the element lock gate.
3. **Stop does not stop.** In Generate-a-block, pressing Stop still inserts the block. In the agent, Stop leaves the server request running.
4. **Dead or flag-gated surfaces.** The DS "Generate with AI" is off in every environment, and when switched on its result has nowhere to go. History AI summary breaks on large diffs. Two router procedures have no callers.

Tests are green because they mock the transport and the composer (see `../engine/AGENTS.md`: "Mocked begin/endTransaction tests stay green while live undo breaks"). **Nothing here was walked in a running editor.** Every live claim below is a code trace, so treat it as UNVERIFIED-LIVE until someone walks it.

---

## 0. Transport and infrastructure (checked once, applies to every feature)

| Item | Finding | Evidence |
|---|---|---|
| Clients | Two tRPC clients, both pointing at relative `/api/trpc` with superjson. `aiTrpcClient` uses `httpBatchLink` only, for mutations. `getAiSubscriptionClient` uses `splitLink` (subscriptions go over `httpSubscriptionLink`/SSE, everything else over `httpBatchLink`). | `src/services/ai/AiTrpcClient.ts:163-172`, `src/services/ai/subscriptionClient.ts:17-36` |
| Auth | Same-origin `fetch`, so the session cookie is sent. `/api/trpc` exports GET and POST, which SSE needs. The Origin pin applies only to POST. The standalone port-5050 demo is cross-origin, and neither client sets `credentials:'include'`, so **AI is dead in the demo**. That is expected and not a production issue. | `packages/dashboard/app/api/trpc/[trpc]/route.ts:41-48,83` |
| Server router | `ai.content`, `page`, `layout`, `summarize`, `milestoneSuggest`, `quota`, `streamPrompt` (subscription), `componentSchema`, `logAdoption`. All are `protectedProcedure`. | `server/trpc/routers/ai.ts:173-457` |
| Provider | `resolveModelForUser` forces `"ollama"` whenever `OLLAMA_BASE_URL` is set (it is set in `.env.local`). That covers `streamPrompt` and `componentSchema` only. `content`, `summarize` and `milestoneSuggest` always call `getOpenAI()` with `gpt-4o-mini`, and alt-text uses OpenAI vision. **Dev therefore needs both Ollama and `OPENAI_API_KEY`.** `.env.local` has both. Whether production has `OPENAI_API_KEY` is UNVERIFIED: I cannot read the cPanel env, but `scripts/check-prod-env.mjs:254` requires it. | `server/services/quota.service.ts:161-176`, `server/services/ai.service.ts:10,183,358,438` |
| Provider-configured guard | Only `streamPrompt` calls `assertProviderConfigured` before reserving quota (`ai.ts:319-327`). `content`, `summarize`, `milestoneSuggest` and `componentSchema` do not, so a missing key surfaces as a generic INTERNAL error. | `ai.ts:177,255,280,418` |
| SSE retry semantics | In `@trpc/client` 11.16, `httpSubscriptionLink` treats `INTERNAL_SERVER_ERROR`, `BAD_GATEWAY`, `SERVICE_UNAVAILABLE` and `GATEWAY_TIMEOUT` as retryable (`node_modules/@trpc/server/dist/codes-DagpWZLc.mjs:130-135`) and **reconnects, re-running the procedure**. `runPromptOnce` only rejects on the second failed connect (`AI_RECONNECT_BUDGET = 2`). Result: **every provider failure costs two provider calls** (each reserve is refunded). | `src/editor/sidebar/tabs/ai/hooks/runPromptOnce.ts:36,142-149` |
| Feature flags | Only `dsAi` gates AI. `NEXT_PUBLIC_FEATURE_DS_AI` is in neither `.env.local` nor `.env.production.local`, so it is **false in both dev and production**. The AI tab, Generate block, SEO, History summary, milestone and alt-text are not flag-gated. | `src/shared/utils/runtimeEnv.ts:88-89`, grep of the env files |
| Quota | Per user per UTC day: FREE 10, PRO 200, BUSINESS unlimited (`lib/constants/plan-limits.ts:35,56,77`). Each `runPromptOnce` costs 1 unit, so an 8-step planned run costs 9, nearly a FREE user's whole day. Auto-milestone calls spend the same quota in the background. Alt-text spends **no** quota. | `server/services/quota.service.ts:76-115` |

---

## 1. Feature inventory and traces

### F1. AI panel: page, multi, similar and site planned run (the agent)

- **Triggers:** `AITab` submit at `src/editor/sidebar/tabs/ai/AITab.tsx:157`, which calls `run`, then `agent.start(text, undefined, pool)` at `:152`. Also the EmptyThread "try" prompts (`:378`). Ways in: the inspector ✦ chip, ⌘J, the ⌘K "AI" command, and the canvas "Improve with AI" (`src/editor/shared/elementActions.ts:192-200` → `AquibraStudio.tsx:738` emits `ui:switch-tab {tab:'ai'}` → `StudioPanels.tsx:671-685` sets `setAiInInspector(true)`).
- **Plan call:** `useAgentRunner.start` (`hooks/useAgentRunner.ts:277-283`) → `runPromptOnce({intent:'plan', scope:{kind:'page', elements, tokens, assets}})` → `ai.streamPrompt` → `generatePlan` (`server/services/ai.service.ts:1386`). It yields `{type:'plan', plan:{steps}}` and then `{type:'done'}` (`ai.ts:339-355`).
- **Context sent:** up to 200 `{id, type, text≤200}` from the active page (or the pool), up to 120 AI-editable tokens, and up to 100 http(s) media assets. The planner prompt uses only `elements` (`buildPlanPrompt`, `ai.service.ts:1353`); tokens and assets are ignored at plan time.
- **Schema match:** the client `RunScope` (`runPromptOnce.ts:75-82`) matches the server `scopeSchema` (`ai.ts:145-156`) exactly. `intent` is `"plan"|"style-command"`, a subset of the server enum. **OK.**
- **Steps:** after review, `runPlan` → `generateStep(i)` → `runPromptOnce({intent:'style-command', scope})` (`useAgentRunner.ts:192-207`). Page steps re-gather the live elements (good); element steps send only `{kind:'element', id}`.
- **Response parsing:** the server yields `{type:'edit', edit:{target, summary, rows, applyOps:{preview:{}, commit:{commands}}}}` (`ai.ts:382-392`). The client `ServerEdit` (`runPromptOnce.ts:84-89`) matches. **OK.**
- **Apply:** `approve` → `applyAiEdit` (`applySetStyle.ts:625-668`). It runs `composer.beginTransaction("ai-edit")`, re-validates each command with Zod, applies it, calls `endTransaction()` in `finally`, then `history.flushPending()`. **Edits land in Composer state as one undo step per step.** The "ai-edit" label reaches HistoryManager (`HistoryManager.ts:164-168, 192-193`).
- **States:** planning, review (editable steps), running, awaiting (Apply/Skip), done. Stop is supported. Errors are split into not-configured, quota and other (`AITab.tsx:298-353`). Retry re-runs the last prompt. Undo all is present. A regenerate per step does **not** exist (removed by design, "Decision #23").
- **Findings:** P1-1, P1-2, P1-3, P1-4, P1-5, P2-1, P2-2, P2-3, P2-4.

### F2. AI panel: element-scoped one-step run and the Board 35 suggestions

- **Triggers:** `AITab.tsx:152` (`agent.start(text, {id})`). Board 35 suggestion buttons at `AITab.tsx:60,363-366` ("Make it more concise", "Try a warmer tone", "Suggest a headline").
- **Context sent:** `{kind:'element', id}` and **nothing else** (`useAgentRunner.ts:275,200`). The server builds its prompt from the id alone: `generateEditCommands({prompt, elementId})` → `buildEditCommandPrompt(elementId, userPrompt)` (`ai.service.ts:1144-1155, 906-926`).
- **Schema match:** OK. **Apply and undo:** same as F1.
- **Findings:** **P1-6** (the model never sees the element), P1-1 to P1-5.

### F3. Generate a block (Add › Generate, plus "Create" in the AI empty state, the canvas and ⌘K)

- **Trigger:** `GenerateBlockScreen.tsx:126` `run()`, mounted from `BuildTab.tsx:222`, opened via `requestGenerateBlock` (`insertGroupRequest.ts:55`).
- **Call:** `generateBlock` (`GenerateBlockScreen.tsx:55-70`) → `runPromptOnce({intent:'style-command', scope:{kind:'page', elements: composer.elements.getAllElements().slice(0,200), tokens, assets}})` with the prompt `"Add ONE new section after element <afterId> (use add-section): …"`.
- **Apply:** `applyAiEdit` **inside `generateBlock`**, before control returns to the component (`:68`). That gives one transaction and one undo. Undo uses `composer.history.undo()` (`:162-165`). The Done toast uses `captureUndo()`.
- **Quota:** `useAiQuota` counter. States: idle, thinking (Stop), inserted, error (three kinds).
- **Findings:** **P1-7** (Stop still inserts), **P1-8** (whole-site element list, wrong page, truncated target), P2-5.

### F4. SEO "Write with AI" (Page settings › SEO title)

- **Trigger:** `src/editor/sidebar/tabs/pages/page-settings/SeoTab.tsx:124-139` (`suggestTitle`), button at `:252-267`, visible only when the title is under 10 characters.
- **Call:** `generateContent(prompt,"headline","professional")` (`src/shared/utils/openai.ts:79-100`) → `aiTrpcClient.generateContent({prompt: buildEnhancedPrompt(...), type:'content', options:{tone}})` → `ai.content` (`ai.ts:174-198`) → `generateContent` (`ai.service.ts:178-197`, OpenAI `gpt-4o-mini`).
- **Context:** page name and current meta description only, with no page content.
- **Schema match:** `{prompt, type:'content', options:{tone}}` matches `contentInputSchema` (`ai.ts:56-65`). **OK.** The response `{content, tokensUsed}` is parsed as `response.data.content`. **OK.**
- **Apply:** `s.setSeoTitle(clean)`, the settings-form state path (the same as typing). It is not an engine history transaction. UNVERIFIED whether the page-settings autosave records an undo step.
- **States:** busy flag only. **Errors are swallowed silently** (`catch {}` at `:134`).
- **Findings:** P2-6, P2-7.

### F5. History › version compare › "AI summary"

- **Trigger:** `CompareView` → `AIControls` (`panels/version-history/AIPanel.tsx:61-94`) → `useAISummary.handleGetAiSummary` (`useAISummary.ts:60-136`).
- **Call:** `aiTrpcClient.summarize({versionName, changes: compareData})` → `ai.summarize` (`ai.ts:252-275`) → `summarizeChanges` (OpenAI direct).
- **Context:** `CompareResult` from `VersionTimelineManager.compareVersions(latest, selected)` (`engine/VersionTimelineManager.ts:697-785`). Its `changes[]` array is **unbounded**.
- **Schema match:** field names and shapes match (`summary` carries extra keys `pagesAdded`/`pagesDeleted`, which non-strict Zod strips). **Bounds do not match:** the server caps `changes` at `.max(200)` and `before`/`after` at `.max(2000)` (`ai.ts:92-101`), and the client never truncates. The server only reads the first 5 changes anyway (`ai.service.ts:363-370`).
- **Persist:** `updateAiSummary` → `composer.versions.updateVersion(id,{aiSummary})`. Not undoable (correct for metadata).
- **Findings:** **P1-9** (diffs over 200 changes always fail), P2-8.

### F6. Auto-milestone name suggestion (History tab banner)

- **Trigger:** `src/shared/hooks/useAutoMilestone.ts:210-267` on `HISTORY_RECORDED`, gated by cooldown, significance and visibility. Rendered in `HistoryTab.tsx:346`.
- **Call:** `aiTrpcClient.suggestMilestone({recentChanges, pageStructure}, {retries:0})` → `ai.milestoneSuggest`.
- **Schema match:** `{id,label,timestamp,type}` with `HistoryDisplayEntry.label: string` (`engine/historyTypes.ts:84-99`). Matches. **OK.**
- **States:** a failure goes to `console.warn` (by design for a background suggestion).
- **Findings:** P2-9 (spends the user's daily quota silently in the background).

### F7. DS / Brand "✦ Generate with AI" (component schema)

- **Trigger:** `src/editor/design-system/ui/BrandWorkspace.tsx:485-503` → `AIPromptModal` (`:921-931`) → `composer.aiAssistService.generateComponentSchema`.
- **Wiring:** `useComposerInit.ts:187-193` builds a `ComponentSchemaAIClient` **only if `isFeatureEnabled("dsAi")`**. The client calls `ai.componentSchema.mutate({prompt})` and gets back `{raw}`, which matches the router (`ai.ts:411-446`).
- **Findings:** **P0-1.**

### F8. Image alt text (auto on upload, plus "Regenerate")

- **Triggers:** `useAltTextAutoTrigger` (mounted in `StudioPanels.tsx:278`). `regenerateAltText` from `MediaTab.tsx:190` and `AssetDetailsPanel.tsx:192`.
- **Call:** `media.generateAltText({assetId, force?})` via `createBuildrikApiClient(DASHBOARD_URL)` with `credentials:'include'` (`src/services/api-client.ts:23-30`) → `applyAltTextToAsset` (`server/services/alt-text.service.ts:125-187`) → OpenAI vision.
- **Schema match:** `{assetId, force?}` matches `generateAltTextSchema` (`packages/shared/schemas/media.ts:122-126`). Result `{altText, skipped, model}` matches. **OK.** It writes through `media.updateAsset` (asset metadata, not canvas; not undoable by design).
- **Findings:** P2-10.

### F9. Privileged AI action: "publish" proposed by the agent

- **Trigger:** `applyAiEdit` collects `propose-action` commands (`applySetStyle.ts:647-651`) → `useAgentRunner.approve` → `onProposal` → `useAiActionGate.propose` (`hooks/useAiActionGate.ts:36-56`) → `actions.propose` → ConfirmDialog → `actions.confirm` with exported pages (`:63-81`) → `startPublish`.
- **Schema match:** `{siteId, actionId, args:{}}` and `{token, payload:{pages}}` match `server/trpc/routers/actions.ts:37-77`. **OK.**
- **Findings:** P1-1 (a proposal-only step is counted "applied"), P2-11.

### F10. Adoption telemetry

- `trackAgentRun` is called (`useAgentRunner.ts:122`). `attachAdoptionRevertListener` is attached (`useComposerInit.ts:551`). **`trackAiEditApplied` is never called** (grep: only its definition, `src/services/ai/adoptionTracker.ts:42`), so the `edit.applied` signal is dead. See P2-12.

---

## 2. Findings by severity

### P0: feature dead or broken

**P0-1. The DS "Generate with AI" is unreachable everywhere, and with the flag on it is a dead end.**
- **Evidence:** `FEATURE_DS_AI = (VITE_FEATURE_DS_AI ?? NEXT_PUBLIC_FEATURE_DS_AI) === "true"` (`src/shared/utils/runtimeEnv.ts:88-89`). Neither variable appears in `.env.local` or `.env.production.local`, so `aiClient` is `null` (`useComposerInit.ts:187`) and the button renders `aria-disabled` with the tooltip "AI generation isn't switched on…" (`BrandWorkspace.tsx:485-503`). With the flag on, `AIPromptModal` gets **no `onAccept`** (`BrandWorkspace.tsx:924-930`, where the comment admits "there is nowhere for the schema to go yet"). The user spends a quota unit and gets a JSON schema they cannot apply.
- **Root cause:** the feature was never finished. The `{componentTypeId, variants, bindings}` schema has no consumer in the style-preset registries.
- **Expected:** either the generated schema applies to a style preset, or the button is not offered.
- **Minimal fix:** product decision. Either implement an `onAccept` that maps the schema into the preset registry (a new function next to `AIPromptModal`), or remove the CTA and the `componentSchema` procedure. Do not set the flag before then.

### P1: partly broken, data loss, or no undo

**P1-1. "Undo all" undoes the user's own earlier edits whenever an "applied" step made no history entry.**
- **Evidence:** `approve` marks the step `"applied"` unconditionally after `applyAiEdit` returns (`useAgentRunner.ts:315-318`) and ignores the returned `applied` count. `onUndoAll` calls `composer.history.undo()` once per `"applied"` step (`AITab.tsx:420-428`). HistoryManager records nothing for an empty patch (`HistoryManager.ts:203`, `if (isPatchEmpty(patch)) return;`). Steps that produce no entry while being counted "applied":
  - a step whose only command is `propose-action` (a publish request);
  - `set-token` that is a no-op or refused (`Composer.ts:340-348` returns `null`, and `defineCommand` still returns true);
  - commands that all fail client re-validation (`applied === 0`);
  - `save-as-component`. UNVERIFIED whether `createComponent` changes the snapshot.
- **Also:** any manual edit the user makes while a step is `awaiting` is undone in place of an AI step.
- **Expected:** Undo all reverts exactly the run's own entries.
- **Fix:** in `applyAiEdit`, return whether a history entry was recorded (compare `history.getStats().undoCount` before and after `flushPending`, or listen for `HISTORY_RECORDED` with label `"ai-edit"`). Store that per step, for example as `RunStep.recorded`, and have `onUndoAll` undo only those. Better: capture an undo handle per step with `history.captureUndo()`, as GenerateBlock already does (`GenerateBlockScreen.tsx:141`), and call those handles.

**P1-2. A step that fails partway leaves partial edits that Undo all never reverts, and the run keeps going.**
- **Evidence:** in `applyAiEdit` a throwing handler (`applyDeleteElement` on the page root, an element removed by an earlier step, `insert-component` with an unknown id) aborts the loop. `endTransaction()` in `finally` still commits whatever ran (`applySetStyle.ts:642-661`). `approve` catches, marks the step `"failed"`, then **`advance(i + 1)`** (`useAgentRunner.ts:319-322`). That contradicts the "a failed step STOPS the run" rule in `generateStep` (`:217-230`). Undo all counts only `"applied"`, so the partial batch stays on the page.
- **Fix:** in `approve`'s catch, mirror `generateStep`'s stop path (set `cancelledRef`, `setError`, `setPhase("done")`) and mark the step undoable when anything was recorded. Alternatively, make `applyAiEdit` skip a failing command with try/catch per command and report a count, never throwing mid-batch.

**P1-3. AI edits bypass the element lock gate.**
- **Evidence:** `applySetStyle`, `applySetText`, `applySetAttribute` and `applyDeleteElement` call `el.setStyle`, `setContent`, `setAttribute` and `composer.elements.removeElement` directly (`applySetStyle.ts:128-134, 154-160, 272-276, 358-364`). None of these check `isLocked()` (`Element.ts:145-149, 170-172, 207-209`; `ElementCRUD.ts` removeElement only guards the page root). `src/editor/AGENTS.md` requires writes to go through `writeElement`/`writableElements`/`canWrite` (`engine/commands/commandOperations.ts:184-226`).
- **Expected:** the AI cannot change or delete a locked element, and the user gets the standard "locked" toast.
- **Fix:** in `COMMAND_HANDLERS`, wrap each element-targeting handler's `run` in `canWrite(composer, args.elementId)` before `apply` (and return `false` when refused). Note that `writableElements` emits `LOCKED_ELEMENTS_SKIPPED`.

**P1-4. Stop in the agent does not cancel the in-flight request.**
- **Evidence:** `stop()` and `reset()` set `cancelledRef` and update state only (`useAgentRunner.ts:332-356`). `runPromptOnce` exposes no abort, and its subscription is unsubscribed only on `done` or error (`runPromptOnce.ts:110-152`). The server keeps generating and keeps the reserved quota unit. A planning call stopped before it returns still charges.
- **Expected:** Stop aborts the subscription so the server sees `signal.aborted`.
- **Fix:** have `runPromptOnce` accept an `AbortSignal` (or return `{promise, cancel}`) and call `sub.unsubscribe()` on abort. Have `useAgentRunner` keep the current cancel in a ref and call it from `stop` and `reset`.

**P1-5. The agent's element-scoped plan steps lose page context.**
- **Evidence:** a plan step `{scope:{kind:'element', id}}` is sent as-is (`useAgentRunner.ts:192-200`), so the model gets no tokens and no media list. `set-token` is then always rejected (no `allowedTokens`, `ai.service.ts:1002-1007`), and `set-attribute src` cannot use library assets. The model also does not see the element (P1-6).
- **Fix:** see P1-6. Send element context, and send tokens and assets for element steps too (extend the `scopeSchema` element arm).

**P1-6. Element-scoped prompts send only the id, so the model edits blind.**
- **Evidence:** `start` builds `[{scope:{kind:'element', id: target.id}, instruction: prompt}]` (`useAgentRunner.ts:275`). The server element arm is `z.object({kind:'element', id})` (`ai.ts:146`). `buildEditCommandPrompt(elementId, userPrompt)` puts nothing about the element into the prompt (`ai.service.ts:906-926`). Board 35's suggestions "Make it more concise" and "Try a warmer tone" (`AITab.tsx:60`) ask the model to rewrite text **it has never been shown**, so it can only invent a replacement through `set-text`. Style requests ("make it bigger") are relative to styles it cannot see.
- **Expected:** the model receives the element's type, current text, a short style summary and ideally its immediate children.
- **Fix:**
  - Extend the element arm of `scopeSchema` in `server/trpc/routers/ai.ts:146` with optional `type`, `text` (max 2000), `styles` (a record, capped) and `tokens`/`assets`.
  - Pass them in `useAgentRunner.start`/`generateStep` from `composer.elements.getElement(id)`.
  - Render them in `buildEditCommandPrompt` (`ai.service.ts:906`), and thread `allowedTokens`/`allowedAssetUrls` through `generateEditCommands` (`:1144`).
  - Optional: fill the diff rows' `from` client-side (P2-3).

**P1-7. Generate-a-block: Stop still inserts the block.**
- **Evidence:** `generateBlock` calls `applyAiEdit` **inside** the generate function (`GenerateBlockScreen.tsx:68`). The cancel check `if (id !== runId.current) return;` runs only after `generate` resolves (`:131-132`). `stop()` only bumps `runId` and resets the phase (`:157-160`). So after Stop the block still lands on the canvas. The user is back at idle with no "inserted" band and no Undo button (only ⌘Z works), and a re-run inserts a second block.
- **Fix:** have `generateBlock` return the `ServerEdit` without applying it. Move `await applyAiEdit(...)` into `run()` after the `id !== runId.current` check. Also unsubscribe on Stop (see P1-4).

**P1-8. Generate-a-block sends the whole site's elements (first 200), so the target can be missing or the block can land on another page.**
- **Evidence:** `composer.elements.getAllElements().slice(0,200)` (`GenerateBlockScreen.tsx:56-60`). `getAllElements` spans all loaded pages (stated at `useAgentRunner.ts:132-134`). On a site with more than 200 elements, `afterId` may be cut. The server then rejects `add-section` whose `elementId` is not in `allowedIds` (`ai.service.ts:1012`), returns "No applicable change", and the UI shows the "other" error card whose copy says "Your request timed out" (`:91`). The model can also anchor on an element from another page. The insert then happens there, `rootChildIds()` finds nothing new on the active page, and the screen still says "Block inserted".
- **Fix:** build `elements` with `activePageElements(composer)` (`hooks/useAIScope.ts:95`), always include `target.afterId`, and include the root. Show a distinct "nothing to insert" state when `edit.rows.length === 0`.

**P1-9. History AI summary fails on any comparison with more than 200 changes, or any text over 2000 characters.**
- **Evidence:** `compareVersions` returns every changed property plus one row per added or removed element, with no cap (`VersionTimelineManager.ts:697-785`). The server input caps `changes` at `.max(200)` and `before`/`after` at `.max(2000)` (`ai.ts:92-101`). A Zod BAD_REQUEST comes back as the message "AI summary unavailable" (`useAISummary.ts:112-116`), and the 60-second cooldown has already been armed (`:95`). The server uses only the first 5 changes (`ai.service.ts:363-370`).
- **Fix:** in `useAISummary.handleGetAiSummary`, send `{...compareData, changes: compareData.changes.slice(0,50).map(c => ({...c, before: c.before.slice(0,2000), after: c.after.slice(0,2000)}))}`. Alternatively, truncate inside `AiTrpcClient.summarize`. Summary counts stay intact.

### P2: missing states, polish, dead code

- **P2-1. Every SSE provider failure runs the server procedure twice.** This is the `INTERNAL_SERVER_ERROR` reconnect described in §0 (`runPromptOnce.ts:36,142-149`), and it doubles provider load on outages. **Fix:** have the router throw a non-retryable code for provider failures (for example `BAD_GATEWAY` is still retryable, so use `PRECONDITION_FAILED` or a custom `UNPROCESSABLE_CONTENT`) at `ai.ts:350,380,407`. Or set `AI_RECONNECT_BUDGET = 1`.
- **P2-2. A page-scope `style-command` with an empty `elements` array falls through to the text stream.** The `style-command` branch requires `elements.length > 0` (`ai.ts:359-363`). Otherwise it runs `streamContent` with the raw instruction. The client discards `text` and records `"nochange"` (`useAgentRunner.ts:209-213`), so the step is silently skipped. This is rare, since `activePageElements` always includes the root, but it is reachable with an empty `{ids:[]}` pool. **Fix:** have the router reject `intent:'style-command'` without targets (BAD_REQUEST). The client never sends `intent:'text'`, so that branch is dead too (see P2-13).
- **P2-3. Diff rows always show an empty "from".** `editCommandToRow` sets `from: ""` for every command (`ai.service.ts:754-818`), so the review card never shows before and after. **Fix:** fill `from` client-side in `useAgentRunner.generateStep` by reading the current style, text or attribute for each command before setting `awaiting`.
- **P2-4. Site-scope runs are capped at 200 elements across all pages** (`useAgentRunner.ts:158`). Large sites are silently truncated.
- **P2-5. Generate-a-block mislabels "no change" as a timeout, and Undo uses a plain `history.undo()`.** The "other" body says "Your request timed out" for every non-quota, non-config failure, including "no applicable change" (`GenerateBlockScreen.tsx:91,133-135`). Undo uses `composer.history.undo()` (`:162-165`), not the captured `undoInsert`.
- **P2-6. SEO "Write with AI" swallows errors and caches results.**
  - Errors are silent (`SeoTab.tsx:134`).
  - `AiTrpcClient` caches by input for 5 minutes (`AICache.ts:16-18`), so pressing the button again returns the same title. There is no regenerate.
  - A 429 from OpenAI comes back as "OpenAI rate limit exceeded", which `isTooManyRequests` matches on "rate limit". The client then waits `retryAfter: 60000` per retry, twice (`AiTrpcClient.ts:342-365`), leaving the button busy for about 2 minutes.
  - Quota exhaustion (HTTP 429) is also retried (`isRetryable`, `:48`), which is pointless.
  - **Fix:** pass `{skipCache:true, retries:0}` from `SeoTab.suggestTitle`, add an error toast, and treat 429 as non-retryable in `isRetryable`.
- **P2-7. `ai.content`, `summarize` and `milestoneSuggest` skip `assertProviderConfigured`** (`ai.ts:177,255,280`). A missing key shows as a generic failure, and `summarize` with default `retries=2` hits the provider three times.
- **P2-8. History summary has no data for the newest version, and a premature click costs a minute.** Compare data is computed only when `latest.id !== versionId` (`VersionHistoryPanel.tsx:270-275`). For the newest version `compareResults` stays empty, and the click gives "Compare data not loaded yet". A click before compare resolves gives the same error *and* the 60-second cooldown (`useAISummary.ts:95-109`). **Fix:** check `compareData` before arming the cooldown, and hide or disable the button when there is nothing to compare.
- **P2-9. Auto-milestone spends the user's daily AI quota in the background.** Every successful call reserves a unit (`ai.ts:277-281`). On FREE (10 a day) this competes with explicit AI use.
- **P2-10. Alt text spends no AI quota and can leak raw provider errors.** `media.generateAltText` reserves nothing (`server/trpc/routers/media.ts:311-327`), and auto-trigger fires on every image upload. Provider errors other than ASSET_NOT_FOUND and NOT_IMAGE are rethrown unmasked by `rethrowPermission(e)`. UNVERIFIED whether that helper masks them.
- **P2-11. Errors from an AI-proposed publish are shown as raw codes.** `startPublish` throws `APPROVAL_NONE`, `APPROVAL_PENDING`, `SAVE_CONFLICT:<iso>` and similar as plain Errors (`server/services/publish.service.ts:383-470`). `actions.confirm` maps only `ALREADY_PUBLISHING` (`actions.ts:84-91`), so the toast says "Action failed: APPROVAL_NONE". The agent path is also not gated by `NEXT_PUBLIC_FEATURE_PUBLISH` (policy question).
- **P2-12. `trackAiEditApplied` is never called** (`src/services/ai/adoptionTracker.ts:42`), so the adoption metric `edit.applied` never fires. **Fix:** call it from `useAgentRunner.approve` and from `generateBlock` after `applyAiEdit`.
- **P2-13. Dead code:**
  - Router procedures with no caller: **`ai.page` and `ai.layout`** (`ai.ts:200-250`). The onboarding worker calls `generatePage` directly (`packages/dashboard/app/api/workers/ai-generate/[jobId]/route.ts`).
  - The **`streamPrompt` "text" intent** branch (`ai.ts:397-408`) is unreachable from any client except by the P2-2 fallthrough.
  - `src/shared/utils/openai.ts`: `FALLBACK_IMAGE_BASE` (`:48`, unused, picsum), and `PROMPT_TEMPLATES`, `getRateLimitStatus`, `clearQueue`, `clearCache`, `isAIError`, `getErrorMessage`, which are exported only through the `shared/utils/index.ts:305-310` barrel with no consumer.
- **P2-14. A mid-run quota hit stops the run.** An 8-step plan needs 9 units. A FREE user at 2 or more used today hits TOO_MANY_REQUESTS mid-run. The run stops with the quota state (correct), but no pre-flight check compares the remaining quota with the plan length at the review stage.

---

## 3. Client and server contract matrix

| Client call (file:line) | Procedure | Input matches Zod? | Output parsed correctly? |
|---|---|---|---|
| `runPromptOnce.ts:117` | `ai.streamPrompt` (sub) | Yes (`RunScope` ≡ `scopeSchema`; intent ⊂ enum) | Yes (`text`/`edit`/`plan`/`done`) |
| `useAiQuota.ts:19` | `ai.quota` | n/a | Yes (`aiQuotaSchema`, Date through superjson) |
| `useComposerInit.ts:191` | `ai.componentSchema` | Yes `{prompt}` | Yes `{raw}` (flag off, see P0-1) |
| `adoptionTracker.ts:25` | `ai.logAdoption` | UNVERIFIED in detail (`ai-adoption` schema, fire-and-forget) | ignored |
| `openai.ts:91` → `AiTrpcClient.ts:197` | `ai.content` | Yes | Yes `.content` |
| `useAISummary.ts:112` | `ai.summarize` | Shape yes; **bounds no** (P1-9) | Yes `.summary` |
| `useAutoMilestone.ts:259` | `ai.milestoneSuggest` | Yes | Yes |
| `AltTextService.ts:48` | `media.generateAltText` | Yes | Yes |
| `useAiActionGate.ts:44,69` | `actions.propose` / `actions.confirm` | Yes | Yes (`res.id` is UNVERIFIED against `startPublish`'s return) |
| — | `ai.page`, `ai.layout` | **No caller** | — |

No client calls a procedure that does not exist on the router.

## 4. Undo and history summary

| Path | Engine write? | Transaction? | Undo works? |
|---|---|---|---|
| Agent / element step (`applyAiEdit`) | Yes | Yes, `"ai-edit"` + `flushPending` | Per step: yes. **Undo all: no** (P1-1, P1-2) |
| Generate block | Yes | Yes | Yes (but Stop inserts anyway, P1-7) |
| `set-style-variant` | Yes (`composer.styles`) | Inside the outer txn | UNVERIFIED that StyleEngine rules are in the history snapshot |
| `set-token` | Yes (`designSystem.setTokens`, nested txn) | Yes | Yes, when the value changes |
| `save-as-component` | Component registry (IndexedDB) | Inside txn | UNVERIFIED (likely not undoable) |
| SEO title | Form state → page settings | No engine txn | UNVERIFIED |
| Version summary / alt text | Metadata | n/a | n/a (by design) |

## 5. Tests run

- Editor (`packages/editor`): `npx vitest run src/editor/sidebar/tabs/ai src/services/ai src/services/__tests__/AltTextService.test.ts src/engine/__tests__/Composer.aiClient.test.ts src/shared/hooks/__tests__/useAutoMilestone.test.ts src/engine/export/__tests__/ExportEngine.aiRoundTrip.test.ts src/editor/sidebar/__tests__/useSidebarKeyboard.ai.test.ts src/engine/designSystem/services/__tests__/AIAssistService.test.ts src/engine/designSystem/services/__tests__/ComponentSchemaAIClient.test.ts src/editor/panels/version-history/__tests__/useAISummary.test.tsx src/editor/shell/hooks/__tests__/useAltTextAutoTrigger.test.ts src/editor/design-system/ui/__tests__/AIPromptModal.test.tsx src/editor/sidebar/tabs/history/components/__tests__/MilestoneSuggestionBanner.test.tsx src/editor/sidebar/tabs/build/components/__tests__/GenerateBlockScreen.test.tsx src/editor/sidebar/tabs/pages/page-settings/__tests__/SeoTab.test.tsx` → **31 files passed, 323 tests passed, 1 todo.**
- Server (repo root): `npx vitest run __tests__/ai-router.test.ts __tests__/ai.service.test.ts __tests__/alt-text.service.test.ts __tests__/quota.service.test.ts server/trpc/routers/__tests__/ai-summary-transport.test.ts server/services/__tests__/ai.styleCommands.test.ts server/services/__tests__/ai-actions.service.test.ts server/services/__tests__/quota.service.atomic.test.ts` → **8 files passed, 137 tests passed.**
- No test covers: Undo all against a real HistoryManager when a step recorded nothing; Stop in GenerateBlock with a resolving `generate`; summarize with more than 200 changes; the element-scope prompt content; the lock gate on AI writes.

## 6. Not verified

- Live behaviour in a running editor: no browser walk was done. All "user sees X" statements are traced from code.
- Whether production has `OPENAI_API_KEY` (cPanel env not readable here) and whether `OLLAMA_BASE_URL` is unset there.
- Whether SSE passes through the cPanel/LiteSpeed proxy without buffering. The single-shot `edit`/`plan` yields would only be delayed, not broken.
- Whether `save-as-component`, `set-style-variant` and SEO-title writes produce undoable history entries.
- What `actions.confirm`'s `startPublish` returns (`res.id` in `useAiActionGate.ts:72-76`).
