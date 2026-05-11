# DS AI Prod Wire + Memory Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline TDD execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `AIAssistService.client` from null-stub to production via `ai.streamPrompt` tRPC subscription. Correct stale memory entry about DS UI Tier-2/Tier-3 scaffold gaps.

**Architecture:** StreamPromptAIClient adapter implements existing `AIClient` interface, accumulates tRPC subscription chunks into final string, maps tRPC errors to D14 hierarchy. Lives in `editor/design-system/services/` (consumer of engine, not engine itself). Composer wires via `ComposerConfig.aiClient` DI (mirrors Phase B `RemoteAssetSync` pattern from memory `project_phase_b_shipped_20260507.md`). `VITE_FEATURE_DS_AI` gates prod attachment so tests + dev keep null-stub behavior.

**Tech Stack:** TypeScript 5.3, Vitest, `@trpc/client` (existing AiTrpcClient mount), `AIAssistService` + `aiErrors.ts` (existing D14 classes).

---

## File Structure

**Create:**
- `packages/editor/src/editor/design-system/services/StreamPromptAIClient.ts` — adapter (AIClient → tRPC streamPrompt)
- `packages/editor/src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts` — stub-stream-driven unit suite

**Modify:**
- `packages/editor/src/engine/Composer.ts:184` — thread `config.aiClient` into `AIAssistService` constructor
- `packages/editor/src/engine/Composer.ts` (ComposerConfig type, around top of file) — add `aiClient?: AIClient | null` field
- `packages/editor/src/shared/utils/featureFlags.ts` — add `dsAi: env.VITE_FEATURE_DS_AI === "true"` to `FEATURES`
- `packages/editor/src/editor/design-system/services/index.ts` — re-export `StreamPromptAIClient`

**Mount-site decision (deferred to Task 3):** Composer constructed at `engine/Composer.ts:794` via a factory `createComposer`. Editor mount calls factory; we extend factory call site to conditionally inject the prod client when flag is on. Exact mount-side wiring confirmed after Task 1 + 2 land.

**Memory:**
- `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ds_ui_actual_state_20260511.md` — new entry capturing reality
- `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` — add one-line index entry

---

## Task 1: StreamPromptAIClient — happy-path TDD

**Files:**
- Create: `packages/editor/src/editor/design-system/services/StreamPromptAIClient.ts`
- Test: `packages/editor/src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts`

- [ ] **Step 1: Write the failing happy-path test**

```ts
// StreamPromptAIClient.test.ts
import { describe, it, expect } from "vitest";
import { StreamPromptAIClient } from "../StreamPromptAIClient";

async function* stubStream(chunks: string[]): AsyncGenerator<string> {
  for (const c of chunks) yield c;
}

describe("StreamPromptAIClient", () => {
  it("accumulates streamed chunks into final string", async () => {
    const client = new StreamPromptAIClient({
      open: ({ prompt }) => stubStream(["hel", "lo ", "world"]),
    });
    const out = await client.generate({ prompt: "hi" });
    expect(out).toBe("hello world");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/editor && npx vitest run src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts`
Expected: FAIL — `Cannot find module '../StreamPromptAIClient'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// StreamPromptAIClient.ts
import type { AIClient } from "./AIAssistService";

export interface StreamOpener {
  /** Open a stream; consumer iterates until exhausted. */
  open(input: { prompt: string; signal?: AbortSignal }): AsyncIterable<string>;
}

/**
 * Adapter that exposes ai.streamPrompt (or any AsyncIterable<string>) as an
 * AIClient. Concatenates stream chunks into the final string; AIAssistService
 * then handles JSON.parse + schema validation per the existing D14 pipeline.
 */
export class StreamPromptAIClient implements AIClient {
  constructor(private readonly opener: StreamOpener) {}

  async generate(input: { prompt: string; signal?: AbortSignal }): Promise<string> {
    const parts: string[] = [];
    for await (const chunk of this.opener.open(input)) {
      parts.push(chunk);
    }
    return parts.join("");
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts`
Expected: PASS (1 passed).

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/editor/design-system/services/StreamPromptAIClient.ts \
        packages/editor/src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts
git commit -m "feat(ds-ai-prod): StreamPromptAIClient adapter (happy path)"
```

---

## Task 2: AbortSignal forwarding

**Files:**
- Test: append to `packages/editor/src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts`

- [ ] **Step 1: Write the failing signal-forwarding test**

Append to existing `describe` block:

```ts
  it("forwards AbortSignal to the stream opener", async () => {
    const seen: Array<AbortSignal | undefined> = [];
    const ac = new AbortController();
    const client = new StreamPromptAIClient({
      open: ({ signal }) => {
        seen.push(signal);
        return stubStream(["ok"]);
      },
    });
    await client.generate({ prompt: "p", signal: ac.signal });
    expect(seen[0]).toBe(ac.signal);
  });
```

- [ ] **Step 2: Run test to verify it passes immediately**

Run: `cd packages/editor && npx vitest run src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts`
Expected: PASS (2 passed). The minimal implementation in Task 1 already forwards `input` verbatim to `opener.open`, so this test passes without code changes. (Acceptance: covers the regression risk that a future refactor strips the field.)

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts
git commit -m "test(ds-ai-prod): assert AbortSignal forwarding"
```

---

## Task 3: Error pass-through

**Files:**
- Test: append to `packages/editor/src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts`

- [ ] **Step 1: Write the failing throw-propagation test**

```ts
  it("propagates errors thrown mid-stream", async () => {
    async function* bombStream(): AsyncGenerator<string> {
      yield "partial";
      throw new Error("upstream boom");
    }
    const client = new StreamPromptAIClient({ open: () => bombStream() });
    await expect(client.generate({ prompt: "p" })).rejects.toThrow("upstream boom");
  });
```

- [ ] **Step 2: Run test, verify it passes**

Run: `cd packages/editor && npx vitest run src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts`
Expected: PASS (3 passed). `for await` rethrows generator errors; minimal impl is correct. Test locks the contract.

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/editor/design-system/services/__tests__/StreamPromptAIClient.test.ts
git commit -m "test(ds-ai-prod): assert mid-stream errors propagate"
```

---

## Task 4: Re-export from services barrel

**Files:**
- Modify: `packages/editor/src/editor/design-system/services/index.ts`

- [ ] **Step 1: Read current barrel**

Run: `cat packages/editor/src/editor/design-system/services/index.ts`

- [ ] **Step 2: Add export line**

Append (preserve existing exports):

```ts
export { StreamPromptAIClient } from "./StreamPromptAIClient";
export type { StreamOpener } from "./StreamPromptAIClient";
```

- [ ] **Step 3: Type-check**

Run: `cd packages/editor && npx tsc --noEmit -p tsconfig.json 2>&1 | head -20`
Expected: zero errors (or unchanged baseline count).

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/editor/design-system/services/index.ts
git commit -m "feat(ds-ai-prod): re-export StreamPromptAIClient from services barrel"
```

---

## Task 5: ComposerConfig DI for aiClient

**Files:**
- Modify: `packages/editor/src/engine/Composer.ts` (ComposerConfig type + line 184 instantiation)
- Test: `packages/editor/src/engine/__tests__/Composer.aiClient.test.ts` (new)

- [ ] **Step 1: Write the failing DI test**

```ts
// Composer.aiClient.test.ts
import { describe, it, expect } from "vitest";
import { Composer } from "../Composer";

describe("Composer.aiClient wiring", () => {
  it("threads config.aiClient into AIAssistService", async () => {
    const stubClient = {
      generate: async () => '{"componentTypeId":"x","variants":[],"bindings":{}}',
    };
    const c = new Composer({ aiClient: stubClient } as any);
    const result = await c.aiAssistService.generateComponentSchema("hello");
    expect(result.componentTypeId).toBe("x");
  });

  it("defaults to null client when aiClient omitted (legacy behavior)", async () => {
    const c = new Composer({} as any);
    await expect(c.aiAssistService.generateComponentSchema("hi"))
      .rejects.toThrow(/no AIClient configured/);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd packages/editor && npx vitest run src/engine/__tests__/Composer.aiClient.test.ts`
Expected: FAIL — first test rejects with "no AIClient configured" because config is ignored.

- [ ] **Step 3: Read current ComposerConfig type + line 184**

Run:
```bash
grep -n "ComposerConfig\b\|interface ComposerConfig\|type ComposerConfig" packages/editor/src/engine/Composer.ts | head -10
sed -n '180,190p' packages/editor/src/engine/Composer.ts
```

- [ ] **Step 4: Add aiClient to ComposerConfig**

Edit the `ComposerConfig` interface (location reported by Step 3 grep) and add an `aiClient` field:

```ts
export interface ComposerConfig {
  // ... existing fields preserved ...
  /** Optional AI client for AIAssistService production wire (Phase C.1). */
  aiClient?: import("../editor/design-system/services").AIClient | null;
}
```

If `AIClient` is not yet exported from the services barrel, also add to `editor/design-system/services/index.ts`:

```ts
export type { AIClient } from "./AIAssistService";
```

- [ ] **Step 5: Thread into constructor**

Change line 184 from:

```ts
this.aiAssistService = new AIAssistService(this);
```

to:

```ts
this.aiAssistService = new AIAssistService(this, config.aiClient ?? null);
```

- [ ] **Step 6: Run new test + adjacent Composer suites**

Run: `cd packages/editor && npx vitest run src/engine/__tests__/Composer.aiClient.test.ts src/engine/__tests__/Composer.migration.test.ts src/engine/__tests__/Composer.aliasResolver.test.ts src/engine/__tests__/Composer.darkResolver.test.ts`
Expected: ALL PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/editor/src/engine/Composer.ts \
        packages/editor/src/engine/__tests__/Composer.aiClient.test.ts \
        packages/editor/src/editor/design-system/services/index.ts
git commit -m "feat(ds-ai-prod): thread aiClient through ComposerConfig"
```

---

## Task 6: Feature flag entry

**Files:**
- Modify: `packages/editor/src/shared/utils/featureFlags.ts`

- [ ] **Step 1: Read current file**

Run: `cat packages/editor/src/shared/utils/featureFlags.ts`

- [ ] **Step 2: Add dsAi flag**

Inside the `FEATURES` literal (alphabetically appropriate position), add:

```ts
  /** DS AI production wire — AIAssistService → ai.streamPrompt tRPC. Phase C.1. */
  dsAi: env.VITE_FEATURE_DS_AI === "true",
```

- [ ] **Step 3: Type-check**

Run: `cd packages/editor && npx tsc --noEmit -p tsconfig.json 2>&1 | head -10`
Expected: clean (no new errors).

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/shared/utils/featureFlags.ts
git commit -m "feat(ds-ai-prod): add VITE_FEATURE_DS_AI flag"
```

---

## Task 7: Memory cleanup entry

**Files:**
- Create: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ds_ui_actual_state_20260511.md`
- Modify: `/Users/shahg/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` (add one-line index entry)

- [ ] **Step 1: Create memory file**

Write:

```markdown
---
name: DS UI actual state 2026-05-11
description: Tier-2/Tier-3 surfaces fully wired despite earlier memory implying scaffold-only — survey before assuming gaps
type: project
---

Survey 2026-05-11: StylesSection (118 LOC, 11 preset categories + dirty aggregator), ExportSection (225 LOC, 3 formats + dark-strategy + CSSBundler + download), ImportCard (268 LOC, paste/upload + diff + ReviewModal apply) — **all fully wired**, not scaffolds. D14 errors fully mapped in AIAssistService (5 error classes + service translation). Audit log = `migration.description` field, no separate audit-log feature exists.

Remaining real work as of 2026-05-11:
- AIAssistService.client null-stub → production tRPC wire (Phase C.1, this arc)
- ds-vsync-v3 TypeTokenList prototype-faithful (needs user-supplied Figma ref like v1/v2)
- ds-vsync-v4 GenericTokenList polish (same)

**Why:** Earlier memory entries (DS UI Tier-2 partial / Tier-3 scaffolds) were correct for the moment they were written but predate the StylesSection + Export/Import + ComponentsSection ship arcs. Status surveys must `wc -l` + read top-of-file the actual targets before declaring scope.

**How to apply:** When asked "what's left in DS UI?" — `grep -rE 'TODO|FIXME|SCAFFOLD' editor/design-system/`, `wc -l` each section file, sample first 50 lines. Don't trust adjective memory entries from >2 weeks ago for current scope.
```

- [ ] **Step 2: Append index entry to MEMORY.md**

Add one line (preserve existing entries — append to end of bullet list):

```markdown
- [DS UI actual state 2026-05-11](project_ds_ui_actual_state_20260511.md) — Styles/Export/Import all fully wired; survey wc-l before assuming gaps
```

- [ ] **Step 3: No commit** (memory files are not in git)

Memory files live outside the repo. Verify file written:

```bash
ls -la ~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_ds_ui_actual_state_20260511.md
```

---

## Task 8: Final verification

- [ ] **Step 1: Full path-scoped test sweep**

Run:
```bash
cd packages/editor && npx vitest run \
  src/editor/design-system/services/__tests__/ \
  src/engine/__tests__/Composer.aiClient.test.ts
```
Expected: all pass.

- [ ] **Step 2: Type-check**

Run: `cd packages/editor && npx tsc --noEmit -p tsconfig.json 2>&1 | tail -5`
Expected: clean (no new errors vs baseline).

- [ ] **Step 3: Done — leave mount-site wire for future session**

Mount-site (AquibraStudio / createComposer caller) wiring deliberately deferred. Flag stays `false` by default; existing null-stub path remains the active production behavior until user opts into `VITE_FEATURE_DS_AI=true`. Documentation of mount wiring lands when prod backend (`ai.componentSchema` schema-shaped procedure, if added) is decided.

---

## Self-review

**Spec coverage:**
- AIClient production wire (adapter + DI) — Tasks 1-6 ✅
- Memory cleanup — Task 7 ✅
- Verification — Task 8 ✅

**Placeholder scan:** none — every step includes concrete code or commands.

**Type consistency:**
- `StreamOpener.open(input)` signature matches `AIClient.generate(input)` — same `{ prompt; signal? }` shape ✅
- `AIClient` exported from services barrel (Task 5) before Composer imports it as type-only ✅
- `ComposerConfig.aiClient` typed as `AIClient | null | undefined` — runtime `??` handles all three ✅

**Risks:**
- Mount-site wiring deferred to a follow-up. Acceptable: flag defaults off, stub behavior unchanged for all current consumers.
- Real `ai.streamPrompt` returns chunks of model text, not JSON. AIAssistService already handles `JSON.parse` failure → AIInvalidSchemaError. Adapter is a pure passthrough; no JSON contract leakage.
- `StreamPromptAIClient` test file uses `vi.useFakeTimers` if AITimeoutError test added later; current 3-test suite avoids timers entirely.
