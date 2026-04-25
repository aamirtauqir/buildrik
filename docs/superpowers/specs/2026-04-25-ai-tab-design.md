# AI Tab — Design Spec (v1)

**Date:** 2026-04-25
**Owner:** saqib (solo designer/dev)
**Status:** approved (brainstorm complete, awaiting implementation plan)
**Branch:** main (solo workflow — no feature branch)
**Source:** brainstorming session 2026-04-25, prototype `packages/editor/src/project/left-panel/tab-ai.html`

## Goal

Promote AI from a feature-flagged surface inside the Build tab to a first-class standalone sidebar tab. Port the approved `tab-ai.html` prototype, wire it to the existing Anthropic-backed engine modules, add Claude as a real model provider alongside the existing OpenAI client, and gate usage by the existing Subscription tiers.

Stop-here value: a designer can select an element on the canvas, open the AI tab, hit a quick action or type a prompt, watch the response stream in, hover the diff card to preview the edit on canvas, and accept it as a single history-tracked change.

## Out of Scope (v2 / later)

Items deferred during brainstorming, listed so the implementation plan does not pull them in:

- Multi-element selection support (per-element batch ops, grouped diffs)
- Context-aware quick actions (action grid changes per element type)
- Server-side persistent chat history (DB-backed `AIConversation` model)
- File / image attachment in composer (📎 button)
- @-mentions in composer (referencing elements/pages by name)
- Page-level (whole-page) quick actions grid (NS2)
- Edit-prompt-and-resend (RG2 prompt-edit branching)
- Retry-after-stop button (SB3)
- Bring-your-own-key flow (Q4)

## Locked Decisions (brainstorm output)

| # | Topic | Decision |
|---|-------|----------|
| 1 | Tab placement | Standalone sidebar tab (remove `aiEnabled` flag from BuildTab) |
| 2 | Source | Port `packages/editor/src/project/left-panel/tab-ai.html` (544 LOC) |
| 3 | Component split | Separate views per AI feature (chat / a11y / layout / color) |
| 4 | Information architecture | Chat primary + drill-in screens for tools (Option 3) |
| 5 | Scope chip | Hybrid: auto-follow canvas selection while idle, lock during prompt + stream + open diff |
| 6 | Multi-select | Single-element only in v1; multi-select disables AI tab with empty-state message |
| 7 | Model picker | Real picker — Claude `claude-opus-4-7`, `claude-sonnet-4-6` (default), `claude-haiku-4-5`; OpenAI `gpt-4o-mini` retained |
| 8 | Diff flow | Hover diff card → live preview on canvas; click Accept → commit + history snapshot; click Reject → no canvas change |
| 9 | Drill-in | Full-takeover screen with `← Back to chat` nav (matches Settings tab pattern) |
| 10 | Persistence | localStorage per session, cleared on logout and on `New chat` button |
| 11 | Quota | Tiered by Subscription: Free 10/day, Pro 200/day, Team unlimited |
| 12 | Quota meter | Smart-hide: visible only when ≥80% used or at limit |
| 13 | Quick actions | Ship prototype's 4 (Rewrite copy / Punch up CTA / Try variant / Improve a11y); registry-ready for v2 context-aware expansion |
| 14 | No-selection state | Hide quick action grid; chat-only with whole-page scope |
| 15 | Composer extras | Skip 📎 (attach) and @ (mention) in v1 |
| 16 | Streaming | Token-by-token with blinking cursor (ST1) + abort-controller stop button (SB1) replacing send during stream |
| 17 | Regenerate | Per-message `↻ Regenerate` link on assistant messages (RG1) |

## File Structure

### New files (editor)

```
packages/editor/src/editor/sidebar/tabs/ai/
├── AITab.tsx                           # entry component, owns thread + drill-in routing
├── AITab.css                           # .bd-ai-* class namespace, --bd-* tokens only
├── ScopeChip.tsx                       # scope display + lock indicator
├── QuickActionGrid.tsx                 # 4 buttons; hidden when scope is whole-page
├── ChatThread.tsx                      # scrollable message list, anchors diff cards
├── ChatMessage.tsx                     # user/assistant bubble, ST1 cursor, RG1 link
├── DiffCard.tsx                        # diff rows, Accept/Reject, hover-preview wiring
├── Composer.tsx                        # textarea, model picker, send/stop button
├── ModelPicker.tsx                     # claude/openai dropdown
├── QuotaIndicator.tsx                  # smart-hide meter
├── EmptyThread.tsx                     # first-open coach text
├── screens/
│   ├── AccessibilityScreen.tsx         # wraps existing ai/AccessibilityChecker.tsx
│   ├── LayoutScreen.tsx                # wraps existing ai/LayoutSuggestions.tsx
│   └── ColorScreen.tsx                 # wraps existing ai/ColorPalette.tsx
├── hooks/
│   ├── useAIThread.ts                  # thread state + localStorage hydration
│   ├── useAIScope.ts                   # hybrid auto/lock state machine
│   ├── useStreamPrompt.ts              # tRPC stream call + abort controller
│   ├── useDiffPreview.ts               # hover wiring → composer.elements.previewUpdate
│   └── useQuotaStatus.ts               # polls ai.getQuotaStatus
├── quickActions/
│   ├── registry.ts                     # QuickAction type + register/lookup
│   └── defaults.ts                     # 4 v1 actions
├── types.ts                            # ChatMessage, DiffEdit, AIScope, QuickAction
└── __tests__/                          # co-located Vitest specs
```

### Engine additions

```
packages/editor/src/engine/elements/
├── ElementManager.ts                   # ADD: previewUpdate(id, props), clearPreview(id)
└── PreviewLayer.ts                     # NEW: tentative-state map, queryable by Canvas

packages/editor/src/editor/canvas/
└── Canvas.tsx                          # MODIFY: render preview layer when active for an id
```

### Rail / routing

```
packages/editor/src/editor/rail/tabsConfig.ts
  - ADD entry: { id: 'ai', label: 'AI', icon: <SparkleIcon />, mode: 'authoring' }
  - panelWidth resolves through chrome SSOT (320 per DESIGN.md, pending convergence call)

packages/editor/src/editor/sidebar/TabRouter.tsx
  - ADD case 'ai': return <AITab composer={composer} {...commonTabProps} />
  - REMOVE aiEnabled prop (no longer feature-flagged inside Build)

packages/editor/src/editor/sidebar/tabs/build/BuildTab.tsx
  - REMOVE aiEnabled prop and any AI-related rendering (clean break, no compat shim)
```

### Backend additions

```
server/services/ai.service.ts           # REWRITE: provider abstraction
server/services/anthropic.client.ts     # NEW: Anthropic SDK + streaming helper
server/services/quota.service.ts        # NEW: tier→limit, usage counter, gate
server/trpc/routers/ai.ts               # MODIFY: add `model` param to all 5 endpoints
                                         # ADD: streamPrompt subscription, getQuotaStatus query
prisma/schema.prisma                    # ADD: AIUsage model (userId, dayBucket, count, model)
prisma/migrations/<timestamp>_ai_usage/
```

## UI Surface

### Default chat view

```
┌──────────────────────────────────────┐
│ Scope: ●Hero                [🔒]      │  ScopeChip — lock visible during stream
├──────────────────────────────────────┤
│ Quick actions                         │  hidden when scope = whole page
│ [Rewrite copy] [Punch up CTA]        │
│ [Try variant] [Improve a11y →]       │  → indicates drill-in
├──────────────────────────────────────┤
│ ┌─Thread───────────────────────────┐ │
│ │ EmptyThread (when 0 messages):   │ │
│ │   "Try a quick action or type    │ │
│ │    a prompt to start"            │ │
│ │                                  │ │
│ │ You: Make hero more confident    │ │
│ │                                  │ │
│ │ Assistant: Tightening headline▍ │ │  ST1 cursor while streaming
│ │   ↻ Regenerate                  │ │  RG1 link below complete msgs
│ │                                  │ │
│ │ ┌─DiffCard──────────────────┐    │ │
│ │ │ EDIT  Hero.headline        │    │ │
│ │ │ − Build sites quickly      │    │ │
│ │ │ + Ship sites at thought-   │    │ │
│ │ │   speed                    │    │ │
│ │ │ [Reject]    [Accept]       │    │ │
│ │ └────────────────────────────┘    │ │
│ │   (hover → canvas preview)         │ │
│ └────────────────────────────────────┘ │
├──────────────────────────────────────┤
│ Composer:                             │
│  [textarea............]               │
│  [model: sonnet-4-6 ▼]        [↑/■]  │  send flips to stop during stream
│                                       │
│  "164 of 200 today" (≥80% only)       │  QuotaIndicator
└──────────────────────────────────────┘
```

### Drill-in screen (full takeover)

```
┌──────────────────────────────────────┐
│ [← Back to chat]   Improve a11y       │
├──────────────────────────────────────┤
│                                       │
│   <AccessibilityChecker />            │
│   (existing component, full panel)    │
│                                       │
└──────────────────────────────────────┘
```

Drill-in state lives in `AITab.tsx`. Back nav restores chat thread (preserved in memory + localStorage). Wrapper screens receive the current scope as a prop; the wrapped components (`AccessibilityChecker`, `LayoutSuggestions`, `ColorPalette`) keep their existing internal selection logic — no rewiring of their state, only pass-through of scope context.

## Data Flow

```
1. User selects element on canvas
   → composer.selection.set(elementId)
   → composer emits 'selection:changed'

2. useAIScope subscribes to selection event (idle mode)
   → reads selected element name
   → sets scope chip display

3. User clicks quick action OR types prompt and hits send
   → useAIScope transitions idle → locked
   → ScopeChip renders 🔒 indicator
   → useStreamPrompt fires tRPC subscription ai.streamPrompt({
       prompt, scope, model
     })

4. Server quota.service.checkQuota(userId)
   → reads Subscription tier
   → reads AIUsage row for today's dayBucket
   → if at limit → throw TRPCError 'TOO_MANY_REQUESTS' with resetsAt
   → if ok → continue

5. Server ai.service routes by model prefix
   → 'claude-*' → AnthropicProvider.stream()
   → 'gpt-*' → OpenAIProvider.stream()
   → token chunks emit over SSE
   → server appends final structured edit ({ target, rows, applyOps })

6. useStreamPrompt receives chunks
   → ChatMessage appends text, ST1 cursor visible
   → on terminal chunk (edit), DiffCard renders below message

7. Server quota.service.recordUsage(userId, model)

8. User HOVERS DiffCard
   → useDiffPreview.onHover()
   → composer.elements.previewUpdate(target, applyOps.preview)
   → Canvas reads PreviewLayer, renders tentative props

9. User mouse-LEAVES DiffCard
   → useDiffPreview.onLeave()
   → composer.elements.clearPreview(target)
   → Canvas reverts to committed state

10. User clicks Accept
    → composer.elements.update(target, applyOps.commit)
    → composer.history.snapshot('AI: ' + edit.summary)
    → DiffCard switches to ✓ Applied state
    → useAIScope unlocks (locked → idle)

11. User clicks Reject
    → no canvas mutation
    → DiffCard switches to ✗ Rejected state
    → useAIScope unlocks

12. User clicks ↻ Regenerate on assistant message
    → re-fires streamPrompt with same prompt + scope
    → replaces message in thread
```

### Persistence (P3)

- Hook `useAIThread` writes to `localStorage['buildrik:ai:thread:<userId>']` on every mutation.
- Hydration: on `AITab` mount, read key, parse, hydrate thread state.
- Clear triggers:
  - `New chat` button → reset thread + clear key
  - Auth logout event → clear all `buildrik:ai:*` keys
- Size cap: 5MB localStorage limit; if thread exceeds 1MB, drop oldest 50% of messages on next write (silent prune).

### Scope state machine

```
       canvas:selection-changed
             │
   ┌─idle─────────┐
   │ scope tracks  │── user submits prompt ──▶ ┌─locked─────────┐
   │ selection     │                            │ scope frozen   │
   │ live          │ ◀── diff Accept/Reject ──── │ 🔒 indicator   │
   └───────────────┘     OR stream aborted       └────────────────┘
```

## Backend Contract

### tRPC `routers/ai.ts`

```typescript
// Existing endpoints, modified to accept model param:
ai.generateContent({ prompt, type, options, model })       // mutation
ai.generatePage({ pageType, description, style, model })   // mutation
ai.generateLayout({ prompt, sectionType, model })          // mutation
ai.summarizeChanges({ versionName, changes, model })       // mutation
ai.suggestMilestone({ ..., model })                        // mutation

// New endpoints:
ai.streamPrompt({ prompt, scope, model })                  // subscription (SSE)
ai.getQuotaStatus()                                        // query → { used, limit, resetsAt }
```

`model` is a Zod enum:
```typescript
const modelSchema = z.enum([
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'gpt-4o-mini',
]);
```

### Provider abstraction (`server/services/ai.service.ts`)

```typescript
interface AIProvider {
  stream(prompt: string, model: string, signal: AbortSignal): AsyncIterable<TokenChunk>;
  generate(prompt: string, model: string): Promise<string>;
}

class AnthropicProvider implements AIProvider { /* uses @anthropic-ai/sdk */ }
class OpenAIProvider implements AIProvider { /* uses existing openai client */ }

function getProvider(model: string): AIProvider {
  return model.startsWith('claude') ? anthropicProvider : openAIProvider;
}
```

Provider selection is purely model-prefix-based — no per-endpoint branching, no feature flags.

### Quota service (`server/services/quota.service.ts`)

```typescript
const TIER_LIMITS: Record<string, number> = {
  free: 10,
  pro: 200,
  team: Infinity,
};

async function checkQuota(userId: string): Promise<{ ok: boolean; used: number; limit: number; resetsAt: Date }>
async function recordUsage(userId: string, model: string): Promise<void>
```

Resets at midnight in user's locale. `dayBucket` is `YYYY-MM-DD` in user TZ. New bucket = fresh count.

### Prisma model

```prisma
model AIUsage {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  dayBucket String   // "2026-04-25" in user TZ
  count     Int      @default(0)
  model     String   // last model used (for analytics)
  updatedAt DateTime @updatedAt

  @@unique([userId, dayBucket])
  @@index([userId])
}
```

## Error State Catalog

| Error | Trigger | UX |
|-------|---------|----|
| Not logged in | `protectedProcedure` rejects | banner: "Sign in to use AI" + login link |
| Quota exhausted | quota.service returns `ok: false` | blocking banner: "Daily limit reached. Upgrade or wait Xh." + upgrade link to billing |
| Network failure | fetch fails, abort with non-user-cause | inline assistant message: "Connection lost. Retry?" + retry button |
| Anthropic 429 | provider returns rate-limit | banner: "Service busy. Try again in 30s." with countdown |
| Content policy violation | provider returns content_policy block | inline message: "Can't help with that prompt. Try rephrasing." |
| Stream aborted by user | abort controller fired via stop button | partial response retained + "(stopped)" tag below text. If abort hits before any structural-edit chunk arrives, no DiffCard renders for that turn |
| Element gone post-prompt | scope target deleted before Accept | DiffCard greys out: "Target removed. Diff invalid." Accept disabled |
| Preview render failure | `composer.elements.previewUpdate` throws | swallow exception, log to Sentry, no canvas overlay; Accept still works without preview |
| Model unavailable | provider throws `model_not_found` | banner: "Model temporarily unavailable. Switching to default." auto-falls to sonnet-4-6 |
| localStorage full / disabled | hydration write throws | thread runs in-memory only, no persistence; toast: "History won't save this session" |

## Empty States

- **First-open thread (no messages):** Centered text "Try a quick action or type a prompt to start." 4 quick action buttons remain visible above when scope is single-element.
- **Whole-page scope, no messages:** "Type a prompt — Claude has access to the whole page." Quick action grid hidden (NS4).
- **Multi-element selection:** Empty state replaces UI: "AI works one element at a time. Select a single element on the canvas." Composer disabled.

## Testing

| Test | Type | Target file |
|------|------|-------------|
| `useAIScope` transitions idle → locked → idle on prompt cycle | unit (Vitest) | `hooks/useAIScope.ts` |
| `useStreamPrompt` abort cancels Anthropic stream cleanly | unit | `hooks/useStreamPrompt.ts` |
| `useDiffPreview` hover triggers `previewUpdate`, leave triggers `clearPreview` | unit | `hooks/useDiffPreview.ts` |
| `useAIThread` localStorage round-trip with hydration | unit | `hooks/useAIThread.ts` |
| `useAIThread` 1MB cap silently prunes oldest 50% | unit | `hooks/useAIThread.ts` |
| Quota service blocks request at limit, returns resetsAt | integration | `server/services/quota.service.ts` |
| Provider switches Anthropic vs OpenAI by model prefix | integration | `server/services/ai.service.ts` |
| `AITab` renders with no selection (NS4: chat-only, no quick actions) | RTL | `AITab.tsx` |
| `AITab` quick action click → mock stream → DiffCard appears | RTL with mocked tRPC | `AITab.tsx` |
| Drill-in to A11y screen → back nav restores thread state | RTL | `screens/AccessibilityScreen.tsx` |
| `DiffCard` Accept → element updates + history snapshot fires | integration | `DiffCard.tsx` + Composer mock |
| `DiffCard` Reject → no canvas mutation, message stays | integration | `DiffCard.tsx` |
| `composer.elements.previewUpdate` round-trip with `clearPreview` | unit | `engine/elements/PreviewLayer.ts` |
| `Canvas` renders preview-layer props when present | RTL | `editor/canvas/Canvas.tsx` |
| All new files registered in `.ds-green-panels.json` allowlist | gate | DS gate script |
| ESLint `no-magic-layout-literals` passes (zero new violations) | lint | repo-wide |
| ESLint `no-legacy-components-import` passes | lint | repo-wide |
| Typecheck passes (`tsc --noEmit`) | static | repo-wide |

## Architecture Notes

### Why a new `PreviewLayer` in engine

`composer.elements.update()` is a real mutation that writes to the element store and triggers history. D3 (live preview on hover) requires showing tentative props *without* committing. Adding a parallel `PreviewLayer` map is cleaner than overloading `update()` with a transactional flag — the preview state is queryable by the Canvas renderer alongside the committed state, with no history side effects and no risk of accidentally persisting a hover.

### Why provider abstraction in `ai.service.ts` instead of per-endpoint branching

Five endpoints already exist. Per-endpoint branching would mean five `if (model.startsWith('claude'))` blocks, each duplicating the OpenAI/Anthropic split. A single `getProvider(model)` factory keeps the branching in one place; endpoints stay agnostic of provider.

### Why localStorage and not sessionStorage

P3 requires "cleared on logout, not on tab close." sessionStorage clears on tab close, which would lose threads when the user reloads or closes Buildrik. localStorage survives reload and is explicitly wiped on logout via auth event subscription.

### Why `dayBucket` in user TZ rather than UTC

A user in IST hitting their daily limit at 11pm should not have it reset 1.5 hours later when UTC midnight rolls. dayBucket follows user TZ so the rolling-day feel matches what they experience.

### Why the `aiEnabled` flag is removed entirely

Promoting AI to a standalone tab means the feature flag's only purpose disappears. Leaving it would create two code paths (AI-as-tab and AI-in-build), which is exactly the dual-API smell that bit TemplatesTab. Clean break.

## Effort Estimate

Solo work, direct-to-main, one commit per logical chunk.

| Area | Effort | Notes |
|------|--------|-------|
| `PreviewLayer` engine + Canvas wiring | 2 days | new infra, careful around render performance |
| Anthropic provider + provider abstraction | 2 days | SDK install, streaming, error mapping |
| Quota service + Prisma migration | 1 day | model + service + tier mapping |
| tRPC `ai.ts` modifications + new endpoints | 1 day | model param + streamPrompt subscription + getQuotaStatus |
| `AITab` shell + ScopeChip + Composer + ModelPicker | 3 days | port from prototype |
| `ChatThread` + `ChatMessage` + `DiffCard` with hover-preview | 3 days | streaming UI, abort, RG1 |
| Drill-in screens (3 wrappers around existing components) | 1 day | thin wrappers, back nav |
| `useAIThread` localStorage + cap | 1 day | hydration, prune, edge cases |
| `useAIScope` state machine + lock indicator | 1 day | event subscription |
| Quota indicator + error states | 1 day | smart-hide, error variants |
| Tests (unit + integration + RTL) | 3 days | per testing matrix |
| DS conformance: green-panel allowlist + token sweep | 1 day | gate compliance |

**Total:** ~20 working days (~4 weeks solo).

This is meaningfully larger than the brainstorm's initial "small AI tab port" framing. The growth came from accepted decisions M3 (real Claude provider), D3 (live preview), and Q3 (full quota tier wiring) — each substantively expanded scope. Effort estimate reflects what was decided, not what was originally framed.

## Source References

- Brainstorm session transcript: 2026-04-25, current chat
- Prototype: `packages/editor/src/project/left-panel/tab-ai.html` (544 LOC)
- Existing components: `packages/editor/src/ai/` (`AICopilot.tsx` 680 LOC, `AIAssistant.tsx` 309, `AIAssistantBar.tsx` 268, `LayoutSuggestions.tsx` 243, `ColorPalette.tsx` 276, `AccessibilityChecker.tsx` 310, `GeneratedResult.tsx` 75, `quickPrompts.ts` 47)
- Existing engine: `packages/editor/src/engine/ai/` (`PageGenerator.ts` 441, `ContentWriter.ts` 367, `LayoutAnalyzer.ts` 352, `CodeGenerator.ts` 517)
- Existing server: `server/services/ai.service.ts`, `server/trpc/routers/ai.ts`
- DESIGN.md (chrome dimensions, color, typography)
- `packages/editor/CLAUDE.md` (architecture rules, import direction)
- `packages/editor/scripts/.ds-green-panels.json` (strict-zero allowlist — all new files must enroll)
- Memory: `project_editor_chrome_ds.md`, `project_editor_ds_intake_20260423.md`, `feedback_solo_workflow.md`

## Implementation Plan

A separate implementation plan will be written via the `superpowers:writing-plans` skill once this spec is approved. The plan will sequence the 20-day estimate into per-commit chunks suitable for solo direct-to-main execution and Codex week-boundary review.
