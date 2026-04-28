# Audit: packages/editor/src/ai/
**Date:** 2026-04-29
**Module:** ai/
**Files audited:** 10

---

## Performance (P)

### [P1] P1 — AIAssistantBar.tsx:49
**Description:** `setTimeout` scheduled in `useEffect` has no cleanup on unmount.
**Rule violated:** Memory leaks from event listeners / timers.
**Impact:** If the component unmounts before the 100ms delay expires, the callback fires on a detached ref, causing a stale focus attempt and a minor memory leak.
**Suggested fix:** Return `() => clearTimeout(timerId)` from the effect.

### [P1] P1 — AICopilot.tsx:219
**Description:** `setTimeout` scheduled in `useEffect` has no cleanup on unmount.
**Rule violated:** Memory leaks from event listeners / timers.
**Impact:** Same as above—stale focus attempt after unmount.
**Suggested fix:** Return `() => clearTimeout(timerId)` from the effect.

### [P1] P1 — AICopilot.tsx:399
**Description:** `DOMPurify.sanitize` is invoked inline during render for every message of type `html`.
**Rule violated:** Unnecessary re-renders / repeated heavy computation.
**Impact:** Sanitization is CPU-intensive and runs on every render even when `message.content` has not changed. For long chat histories this causes measurable frame drops.
**Suggested fix:** Wrap `sanitizeHtml(message.content)` in `useMemo` keyed by `message.content`.

### [P1] P1 — AccessibilityChecker.tsx:192
**Description:** `checkAccessibility` traverses the entire element tree synchronously on the main thread.
**Rule violated:** Large state updates / blocking main thread.
**Impact:** For complex pages the traversal blocks rendering, causing visible jank when the user clicks "Run Accessibility Check".
**Suggested fix:** Offload traversal to a Web Worker, or yield every N elements with `requestIdleCallback`.

### [P2] P2 — AIAssistant.tsx:216, AICopilot.tsx:467, AIAssistant.tsx:297
**Description:** Inline arrow functions and inline style objects passed as props.
**Rule violated:** Unnecessary re-renders from inline objects/arrays as props.
**Impact:** Props are recreated every render. While child components are not memoized today, future memoization will be broken by these inline references.
**Suggested fix:** Extract stable callback references with `useCallback` and move static style objects to module scope.

---

## Duplication (D)

### [P1] D1 — AccessibilityChecker.tsx:159 + LayoutAnalyzer.ts:309
**Description:** `calculateContrastRatio` and `getLuminance` are copy-pasted between `AccessibilityChecker` and `LayoutAnalyzer` with identical implementations and magic numbers.
**Rule violated:** Duplicate logic (semantic duplication).
**Impact:** Any bug fix or WCAG formula update must be applied in two places. Currently the two copies have already diverged in fallback handling (AccessibilityChecker passes a CSS variable, LayoutAnalyzer uses `#ffffff`).
**Suggested fix:** Centralize in `shared/utils/color.ts` and import from both locations.

### [P1] D2 — AccessibilityChecker.tsx:202 + LayoutSuggestions.tsx:82
**Description:** `severityColors` mapping (`error` / `warning` / `info` → bg, border, icon) is defined independently in both files.
**Rule violated:** Duplicate type definitions / repeated formatting.
**Impact:** The two maps use different border tokens (`#ef4444` vs `var(--buildrick-error)`), causing visual inconsistency across AI panels.
**Suggested fix:** Export a single `severityColors` map from `shared/constants/severity.ts`.

### [P1] D3 — AIAssistant.tsx:96 + AICopilot.tsx:241
**Description:** Both components implement the same AI generation flow: prompt state, loading flag, result state, error state, `generateContent` / `generateLayout` / `generateImagePrompt` dispatch, and try/catch error handling.
**Rule violated:** Duplicate prompt construction logic / repeated error handling pattern.
**Impact:** Adding a new generation type or changing error UX requires edits in two places. The two flows have already diverged (AIAssistant lacks `devError` logging; AICopilot lacks content-type/tone parameters).
**Suggested fix:** Extract a `useAIGeneration` hook that encapsulates state, API dispatch, and error handling.

### [P2] D4 — AccessibilityChecker.tsx:50 + LayoutAnalyzer.ts (multiple methods)
**Description:** Recursive element-tree traversal (`getChildren`, type check, style read, recurse) is repeated in `AccessibilityChecker` and in every analyzer method of `LayoutAnalyzer`.
**Rule violated:** Duplicate logic (semantic duplication).
**Impact:** Four separate traversal implementations in `LayoutAnalyzer` plus one in `AccessibilityChecker`. Any change to the element API surface requires five edits.
**Suggested fix:** Provide a single `traverseElements(composer, visitor)` utility in `engine/ai/`.

---

## Business Logic (BL)

### [P0] P0 — AICopilot.tsx:400
**Description:** `dangerouslySetInnerHTML` preview renders sanitized HTML that may contain `<a href="...">` links with no click interception.
**Rule violated:** Missing error handling / side effects in pure functions / data loss risk.
**Impact:** Clicking a generated link inside the chat preview navigates the browser away from the editor, risking loss of unsaved work. DOMPurify allows `target="_blank"` and `href` in its config.
**Suggested fix:** Add `onClick` interception on the preview container to prevent navigation, or open links in a new tab via controlled `window.open` with a confirmation dialog.

### [P1] P1 — AIAssistant.tsx:96 + AIAssistantBar.tsx:55 + AICopilot.tsx:241
**Description:** Async generation handlers do not guard against concurrent invocations with a ref or semaphore; they rely solely on `loading` / `isLoading` state.
**Rule violated:** Race conditions between concurrent AI requests.
**Impact:** Rapid clicks or keypresses can launch multiple parallel requests before React batches the state update. The first completion may overwrite a later one, or multiple results may be applied simultaneously.
**Suggested fix:** Use a `useRef` flag (`isGeneratingRef`) checked atomically at the top of the handler, or disable the trigger element synchronously.

### [P1] P1 — AccessibilityChecker.tsx:97
**Description:** `calculateContrastRatio` is called with `styles.backgroundColor || "var(--bd-bg-card)"`; the fallback is a CSS variable, not a hex color.
**Rule violated:** Input validation bypasses / side effects in pure functions.
**Impact:** `getLuminance` parses the string with `parseInt(hex.slice(0,2), 16)`, yielding `NaN` for CSS variables. The contrast ratio becomes `NaN`, the comparison `NaN < 4.5` is `false`, and the contrast check is silently skipped for every element without an explicit background color.
**Suggested fix:** Resolve CSS variables to computed hex values before passing to `calculateContrastRatio`, or return `"#ffffff"` as the fallback.

### [P1] P1 — AccessibilityChecker.tsx:58
**Description:** Decorative images with `alt=""` trigger both an "error" (missing alt text) and an "info" (empty alt text) for the same element.
**Rule violated:** Missing error handling / state inconsistency.
**Impact:** `!attrs.alt` is `true` for `alt=""`, so the first check fires an error. The second check then fires an info. WCAG recommends `alt=""` for decorative images, so the error is a false positive.
**Suggested fix:** Change the first check to `attrs.alt == null` (strict null/undefined) so `alt=""` is treated as intentional.

### [P1] P1 — AIAssistant.tsx:55
**Description:** `apiKey?: string` prop is destructured as `_apiKey` and never used.
**Rule violated:** Misleading public API / hidden side effects.
**Impact:** Consumers of `AIAssistant` may pass an API key expecting it to override the tRPC client configuration, but it is silently ignored. This is a contract breach.
**Suggested fix:** Remove the unused prop, or wire it through to the `openai.ts` client.

### [P1] P1 — AICopilot.tsx:196
**Description:** `composer?: Composer | null` prop is destructured as `_composer` and never used.
**Rule violated:** Misleading public API.
**Impact:** Same pattern as above—callers assume the composer is wired into the Copilot, but it is not.
**Suggested fix:** Remove the unused prop or implement composer-aware context.

### [P1] P1 — AIAssistant.tsx:123
**Description:** `handleInsert` derives the content `type` from the current `activeTab`, not from the tab that was active when generation occurred.
**Rule violated:** Race conditions / state inconsistency.
**Impact:** If the user switches tabs after generation but before clicking Insert, the wrong type is passed to `onGenerate` (e.g., content generated as text is inserted as layout HTML).
**Suggested fix:** Store the generation type alongside the `result` state so the insert handler reads from that snapshot.

### [P1] P1 — AIAssistant.tsx:104 + AICopilot.tsx:260
**Description:** `if/else if` dispatch chains for generation types have no default case.
**Rule violated:** Missing error handling / state inconsistency.
**Impact:** Adding a new tab or quick-action type without updating the dispatch chain causes `result` to remain `""`, producing an empty response with no user-facing error.
**Suggested fix:** Add a final `else` branch that throws or displays "Unsupported generation type".

### [P1] P1 — AICopilot.tsx:304 vs 467
**Description:** Pressing Enter in the textarea calls `handleSend()` (defaults to `"layout"`), while the Send button calls `handleSend(undefined, detectInputType(input))`.
**Rule violated:** State inconsistency / race conditions.
**Impact:** The same prompt produces different generation types depending on which trigger the user activates. This is a UX bug.
**Suggested fix:** Unify both paths to use `detectInputType(input)`.

### [P1] P1 — AICopilot.tsx:300
**Description:** `navigator.clipboard.writeText` is called without try/catch.
**Rule violated:** Missing error handling for network failures or API errors.
**Impact:** In insecure contexts or when clipboard permissions are denied, the promise rejects and the error is unhandled, potentially surfacing in the console or bubbling to an error boundary.
**Suggested fix:** Wrap in `try/catch` and show a toast on failure.

### [P1] P1 — openai.ts:150
**Description:** `generateImagePrompt` accepts `description` and options parameters but ignores them, returning a hardcoded `picsum.photos` placeholder URL.
**Rule violated:** Side effects in pure functions / misleading naming.
**Impact:** Callers believe they are generating an image from the description; the prompt is silently discarded and a random placeholder is returned.
**Suggested fix:** Implement actual image generation or rename the function to `getPlaceholderImageUrl` and remove the unused parameters.

### [P1] P1 — packages/editor/src/services/ai/AiTrpcClient.ts:246
**Description:** Rate-limit check happens before the request is added to the internal queue.
**Rule violated:** Missing rate limiting / race conditions.
**Impact:** A burst of simultaneous requests all pass the pre-queue rate-limit check, enter the queue, and are later recorded, exceeding the intended limit.
**Suggested fix:** Move `canMakeRequest()` and `recordRequest()` inside the queued execution block so they are evaluated serially.

### [P2] P2 — AIAssistant.tsx:66
**Description:** `handleAnalyzeLayout` has a `try/finally` but no `catch`; errors from `LayoutAnalyzer` propagate uncaught.
**Rule violated:** Missing error handling.
**Impact:** A corrupt composer state crashes the component instead of showing a user-friendly error.
**Suggested fix:** Add a `catch` block that sets an error message and logs via `devError`.
