# Audit: `packages/editor/src/shared/`

**Date:** 2026-04-29  
**Scope:** ~221 files across `shared/constants`, `shared/extensions`, `shared/forms`, `shared/hooks`, `shared/schemas`, `shared/types`, `shared/ui`, `shared/utils` (dragDrop, helpers, html, nesting, parsers, root).  
**Tracks:** Performance (P), Duplication (D), Business Logic / Architecture (BL).  
**Severity:** P0 (crash / security / data-loss risk), P1 (bug risk / overhead), P2 (tech debt / cleanup).

---

## Track P — Performance

### P-1: `getToken` triggers synchronous layout on every call
- **Severity:** P1
- **File:** `packages/editor/src/shared/utils/tokens.ts` (line 9)
- **Issue:** `getComputedStyle(document.documentElement).getPropertyValue(...)` is called on every invocation with no cache. If consumed inside render loops, color parsing, or token resolution, it forces a full style recalc / reflow.
- **Remediation:** Cache token reads in a module-level `Map`; invalidate only when theme CSS variables change (e.g., on theme-switch event).

### P-2: `getStyle` repeats `getComputedStyle` for single properties
- **Severity:** P1
- **File:** `packages/editor/src/shared/utils/html/domManipulation.ts` (line 139)
- **Issue:** `export function getStyle(el, prop)` calls `getComputedStyle(el)` fresh each time. Callers requesting multiple properties pay the reflow cost N times.
- **Remediation:** Accept a `props: string[]` array and batch reads from a single `getComputedStyle(el)` invocation, or return a cached read object.

### P-3: `isHorizontalLayout` reads computed styles inside drag move handler
- **Severity:** P1
- **File:** `packages/editor/src/shared/utils/dragDrop/positioning.ts` (line 235)
- **Issue:** `getComputedStyle(element)` is invoked to detect flex/grid direction **during** a drag operation (mousemove/touchmove hot path). This forces synchronous layout on every pointer move event.
- **Remediation:** Pre-compute layout direction once on drag start and store in drag session state; avoid reading computed styles in the move loop.

### P-4: `getScrollableParent` walks DOM with `getComputedStyle` per ancestor
- **Severity:** P1
- **File:** `packages/editor/src/shared/utils/dragDrop/domHelpers.ts` (line 146)
- **Issue:** Inside a `while (parent)` loop, each ancestor triggers `getComputedStyle(parent)`. In deep DOM trees this multiplies reflow cost during drag scroll calculations.
- **Remediation:** Cache overflow values in a WeakMap keyed by element, or batch-read the overflow properties once per drag frame.

### P-5: `useSaveIndicator` re-registers event listeners on every status change
- **Severity:** P1
- **File:** `packages/editor/src/shared/hooks/useSaveIndicator.ts` (line 88)
- **Issue:** The `useEffect` dependency array includes `status`. Because `handleOnline` / `handleOffline` close over `status`, every transition (`saved` -> `saving` -> `saved`) causes Composer + window event listeners to detach and re-attach.
- **Remediation:** Remove `status` from effect deps; use functional `setStatus` updates inside handlers, or store `status` in a ref that handlers read.

### P-6: `useAutoMilestone` callback recreation churn
- **Severity:** P1
- **File:** `packages/editor/src/shared/hooks/useAutoMilestone.ts` (lines 154–196)
- **Issue:** `requestSuggestion` is wrapped in `useCallback` with `lastSuggestionTime` in its dependency array. Because the callback sets `lastSuggestionTime` state, after every suggestion the callback reference changes, which in turn causes the Composer event subscription effect (lines 198–254) to re-run and re-subscribe.
- **Remediation:** Move the cooldown check into the effect body (using a ref for the last timestamp) rather than inside the callback, or use a ref for `lastSuggestionTime`.

---

## Track D — Duplication

### D-1: `clampColor` defined identically in four color parser files
- **Severity:** P1
- **Files:**
  - `packages/editor/src/shared/utils/parsers/colorConversionBasic.ts` (line 15)
  - `packages/editor/src/shared/utils/parsers/colorParser.ts` (line 199)
  - `packages/editor/src/shared/utils/parsers/colorConversionLab.ts` (line 15)
  - `packages/editor/src/shared/utils/parsers/colorBlindness.ts` (line 64)
- **Issue:** Same signature and body `(value: number, max: number = 255): number` replicated four times. `helpers/number.ts` already exports a generic `clamp`. Divergent copies risk drift.
- **Remediation:** Delete the four local copies; import `clamp` from `helpers/number` (or add a color-specific re-export in one canonical location such as `colorTypes.ts`).

### D-2: `stripHtml` (helpers) and `stripAllTags` (html) are semantically identical
- **Severity:** P1
- **Files:**
  - `packages/editor/src/shared/utils/helpers/string.ts` (line 147)
  - `packages/editor/src/shared/utils/html/sanitization.ts` (line 223)
- **Issue:** Two independent HTML-stripping utilities. `stripHtml` uses a naive regex; `stripAllTags` uses `DOMParser` (more robust). Consumers have no signal which to pick.
- **Remediation:** Delete `stripHtml`; replace its single internal usage with `stripAllTags`. If external consumers rely on `stripHtml`, re-export `stripAllTags` under that name.

### D-3: `parseHTML` name collision with divergent return types
- **Severity:** P1
- **Files:**
  - `packages/editor/src/shared/utils/html/parsing.ts` (line 36) — returns `ParsedNode[]`
  - `packages/editor/src/shared/utils/parsers/htmlParser.ts` (line 20) — returns `DocumentFragment`
- **Issue:** Same export name, different contracts. The root barrel re-aliases one as `parseHTMLToNodes` but still exports the parser version raw as `parseHTML`, inviting caller confusion.
- **Remediation:** Rename the parser version to `parseHTMLFragment` and update `engine/elements/manager/HTMLParser.ts` (the sole consumer). Keep `html/parsing.ts` version as `parseHTML` since it is used by `html/diffing.ts`.

### D-4: `sanitizeHTML` implemented twice with different rulesets
- **Severity:** P1
- **Files:**
  - `packages/editor/src/shared/utils/html/sanitization.ts` (line 125)
  - `packages/editor/src/shared/utils/parsers/htmlParser.ts` (line 75)
- **Issue:** Two XSS sanitizers coexist. The `html/sanitization.ts` version is richer (configurable allowed tags/attrs, DOMParser-based, uses `sanitizationConfig.ts`). The parser version is a simpler TreeWalker with hardcoded dangerous-tag lists. Having two security-critical paths means fixes must be applied in two places.
- **Remediation:** Delete `parsers/htmlParser.ts::sanitizeHTML`. Re-export `sanitizeHTML` from `html/sanitization.ts` in the parsers barrel if downstream code needs it.

### D-5: `parseStyleString` (html) duplicates `parseInlineStyles` (parsers)
- **Severity:** P2
- **Files:**
  - `packages/editor/src/shared/utils/html/parsing.ts` (line 201)
  - `packages/editor/src/shared/utils/parsers/cssParser.ts` (line 213)
- **Issue:** Both parse `key: value;` style strings into objects. `parseInlineStyles` delegates to `splitCSSProperties` which handles nested parentheses/quotes; `parseStyleString` does not. Semantic duplication with different robustness.
- **Remediation:** Consolidate into `cssParser.ts` (the more robust implementation). Re-export from `html/parsing.ts` as `parseStyleString` if legacy callers need the alias.

### D-6: Competing barrel files `shared/ui/index.ts` and `index.tsx`
- **Severity:** P2
- **Files:**
  - `packages/editor/src/shared/ui/index.ts`
  - `packages/editor/src/shared/ui/index.tsx`
- **Issue:** Two barrels serve the same directory. `index.tsx` exports a superset (DesignSystem, Accessibility, Animations providers, plus `UIPluginProvider`, `PLUGIN_INFO`, `SETUP_GUIDE`) that `index.ts` does not. TypeScript resolution ambiguity means consumers may inadvertently pull in the heavier `.tsx` barrel.
- **Remediation:** Delete `index.tsx` once confirming that `index.ts` covers all actively consumed exports. Move any still-needed unique exports (e.g., `DesignSystemProvider`) into `index.ts`.

---

## Track BL — Business Logic / Architecture

### BL-1: `parseCSS` mutates live `document.head` as a hidden side effect
- **Severity:** P0
- **File:** `packages/editor/src/shared/utils/parsers/cssParser.ts` (lines 46–65)
- **Issue:** To access browser CSSOM, `parseCSS` creates a `<style>` element, appends it to `document.head`, reads `style.sheet`, then removes it. If any exception is thrown between `appendChild` and `removeChild`, the style element leaks into the live document. The function name (`parseCSS`) implies a pure computation with no DOM mutation.
- **Remediation:** Use `new CSSStyleSheet()` + `replaceSync(cleanCSS)` (modern API, supported in all evergreen browsers) to avoid touching the live DOM. Wrap in a try/finally as a fallback guard.

### BL-2: `openai.ts` violates `shared/` leaf-dependency rule
- **Severity:** P0
- **File:** `packages/editor/src/shared/utils/openai.ts` (lines 9–27)
- **Issue:** Imports `aiCache`, `AIError`, `aiTrpcClient` from `../../services/ai/`. Per CLAUDE.md import rules, `shared/` must not import from other `src/` folders (exception: `shared/extensions/` → vibcoder). This creates a reverse edge (`shared/` -> `services/ai/`) that breaks the layer cake and can cause circular dependency chains.
- **Remediation:** Move `openai.ts` into `services/ai/` (it is a service façade, not a shared utility) or invert the dependency: define a minimal AI client interface in `shared/` and inject the implementation from the host layer.

### BL-3: `ColorSwatch.tsx` imports from `editor/` outside `shared/extensions/`
- **Severity:** P1
- **File:** `packages/editor/src/shared/ui/ColorSwatch.tsx` (lines 21–25)
- **Issue:** Imports `Tooltip`, `TooltipTrigger`, `TooltipPortal`, `TooltipContent` from `@/editor/shared/vibcoder`. The only permitted `shared/` → `editor/` edge is `shared/extensions/` composing vibcoder primitives.
- **Remediation:** Move `ColorSwatch.tsx` (and `ColorSwatchGroup`) to `shared/extensions/` or create a thin vibcoder wrapper in `extensions/` and consume it from `shared/ui/ColorSwatch`.

### BL-4: `useFormHandler` is a pure pass-through wrapper hook
- **Severity:** P1
- **File:** `packages/editor/src/shared/hooks/useFormHandler.ts` (lines 29–109)
- **Issue:** Every exported method (`registerForm`, `unregisterForm`, `getFormConfig`, `getFormState`, `submitForm`, `setFieldValue`, `resetForm`) is a direct delegate to `composer?.forms?.method()` with no added validation, transformation, or React-specific logic. The `useEffect` listener (`handleFormEvent`) is an empty no-op. This is a textbook “pass-through wrapper” per CLAUDE.md anti-pattern #1.
- **Remediation:** Delete the hook. Consumers that need form state should subscribe to Composer events directly or access `composer.forms` via a lightweight context provider that only supplies the `Composer` instance.

### BL-5: `useVersionHistory` is a pure pass-through wrapper hook
- **Severity:** P1
- **File:** `packages/editor/src/shared/hooks/useVersionHistory.ts` (lines 34–121)
- **Issue:** All action methods (`createVersion`, `restoreVersion`, `deleteVersion`, `compareVersions`, `updateAiSummary`) directly call `composer.versionHistory.method()`. `getVersion` is just `versions.find(...)`. No logic, validation, or transformation is added.
- **Remediation:** Delete the hook. Expose `composer.versionHistory` directly to consumers, or provide a single `useComposer()` context hook instead of N thin wrappers.

### BL-6: `useAutoMilestone` bypasses typed tRPC client with raw `fetch`
- **Severity:** P1
- **File:** `packages/editor/src/shared/hooks/useAutoMilestone.ts` (line 174)
- **Issue:** Hardcodes `fetch("/api/trpc/ai.milestoneSuggest")` with manual JSON body assembly (`{ recentChanges, pageStructure: { pageCount, elementCount: 0 } }`). This skips the project's tRPC client (`@lib/trpc/client`), losing Zod runtime validation, typed responses, request deduplication, and standard error translation.
- **Remediation:** Replace with the typed tRPC mutation (e.g., `trpc.ai.milestoneSuggest.useMutation()`). If the endpoint does not exist yet, add it to the router instead of relying on raw HTTP.

### BL-7: `AnyFunction` type uses explicit `any`
- **Severity:** P1
- **File:** `packages/editor/src/shared/utils/helpers/types.ts` (line 15)
- **Issue:** `export type AnyFunction = (...args: any[]) => any;` weakens TypeScript strictness. It is consumed by `DebouncedFunction` and `ThrottledFunction` interfaces, allowing typed parameters to degrade to `any` at call sites.
- **Remediation:** Replace with a generic constrained type: `<TArgs extends unknown[], TReturn>(...args: TArgs) => TReturn`, or use `(...args: unknown[]) => unknown` if truly unknown.

### BL-8: `UIPluginProvider`, `PLUGIN_INFO`, and `SETUP_GUIDE` are dead exports
- **Severity:** P2
- **File:** `packages/editor/src/shared/ui/index.tsx` (lines 145–251)
- **Issue:** No consumer in the codebase imports `UIPluginProvider`, `PLUGIN_INFO`, or `SETUP_GUIDE`. The objects are large (~100 lines of metadata + setup examples) and bloat the barrel bundle.
- **Remediation:** Delete `shared/ui/index.tsx` entirely. Ensure `shared/ui/index.ts` contains all exports that are actually imported.

### BL-9: `useElementFlash` leaks `setTimeout` on unmount
- **Severity:** P2
- **File:** `packages/editor/src/shared/hooks/useElementFlash.ts` (lines 36–38)
- **Issue:** A `setTimeout` is queued inside `requestAnimationFrame` to remove the flash class after `FLASH_DURATION` (500 ms). If the component unmounts between rAF firing and the timeout expiry, the timer is never cleared.
- **Remediation:** Track timeout IDs in a `useRef` array; clear all pending timeouts in the effect cleanup function.

### BL-10: `generateContentVariations` fires unbounded parallel AI requests
- **Severity:** P1
- **File:** `packages/editor/src/shared/utils/openai.ts` (lines 118–130)
- **Issue:** `Array.from({ length: count }, () => generateContent(...))` with `count` defaulting to 3 fires all requests simultaneously via `Promise.all`. No concurrency limit or abort signal. High `count` values (or rapid UI re-triggers) can overwhelm the backend and client network pool.
- **Remediation:** Add a concurrency cap (e.g., `p-limit` or a simple semaphore) and accept an `AbortSignal` so callers can cancel in-flight variations.

---

## Summary Table

| ID  | Track | Severity | File(s) | Title |
|-----|-------|----------|---------|-------|
| P-1 | P     | P1       | `shared/utils/tokens.ts` | `getToken` uncached `getComputedStyle` |
| P-2 | P     | P1       | `shared/utils/html/domManipulation.ts` | `getStyle` repeats computed style read |
| P-3 | P     | P1       | `shared/utils/dragDrop/positioning.ts` | `isHorizontalLayout` in drag hot path |
| P-4 | P     | P1       | `shared/utils/dragDrop/domHelpers.ts` | `getScrollableParent` loops with reflow |
| P-5 | P     | P1       | `shared/hooks/useSaveIndicator.ts` | Effect churn on `status` dependency |
| P-6 | P     | P1       | `shared/hooks/useAutoMilestone.ts` | Callback recreation due to state dep |
| D-1 | D     | P1       | `parsers/colorConversionBasic.ts`, `colorParser.ts`, `colorConversionLab.ts`, `colorBlindness.ts` | `clampColor` quadruple definition |
| D-2 | D     | P1       | `helpers/string.ts`, `html/sanitization.ts` | `stripHtml` vs `stripAllTags` duplication |
| D-3 | D     | P1       | `html/parsing.ts`, `parsers/htmlParser.ts` | `parseHTML` name collision |
| D-4 | D     | P1       | `html/sanitization.ts`, `parsers/htmlParser.ts` | Dual `sanitizeHTML` implementations |
| D-5 | D     | P2       | `html/parsing.ts`, `parsers/cssParser.ts` | `parseStyleString` vs `parseInlineStyles` |
| D-6 | D     | P2       | `shared/ui/index.ts`, `shared/ui/index.tsx` | Competing barrel files |
| BL-1| BL    | P0       | `shared/utils/parsers/cssParser.ts` | `parseCSS` mutates `document.head` |
| BL-2| BL    | P0       | `shared/utils/openai.ts` | Imports from `services/ai/` (layer violation) |
| BL-3| BL    | P1       | `shared/ui/ColorSwatch.tsx` | Cross-boundary vibcoder import |
| BL-4| BL    | P1       | `shared/hooks/useFormHandler.ts` | Pass-through wrapper hook |
| BL-5| BL    | P1       | `shared/hooks/useVersionHistory.ts` | Pass-through wrapper hook |
| BL-6| BL    | P1       | `shared/hooks/useAutoMilestone.ts` | Raw `fetch` bypasses tRPC |
| BL-7| BL    | P1       | `shared/utils/helpers/types.ts` | `AnyFunction` uses `any` |
| BL-8| BL    | P2       | `shared/ui/index.tsx` | Dead exports (`UIPluginProvider`, metadata) |
| BL-9| BL    | P2       | `shared/hooks/useElementFlash.ts` | Missing timer cleanup |
| BL-10| BL   | P1       | `shared/utils/openai.ts` | Unbounded parallel AI requests |

---

## Self-Review Notes

- **False-positive check:** `useHistoryState` (line 30) was considered for pass-through classification but retained because it adds React state subscription wiring (`useState` + `useEffect`) that is non-trivial, even though `undo`/`redo`/`clear` are thin. It is borderline but not a pure wrapper.
- **Coverage completeness:** Every sub-directory under `shared/` was visited. `shared/extensions/` files (e.g., `CopyButton.tsx`) were read; they are legitimate compositions per Phase 5 keep stamps and do not flag. `shared/forms/` components were scanned; no severe duplication found beyond normal field-type repetition.
- **Severity calibration:** BL-1 and BL-2 are P0 because they are architectural violations / side-effect risks that can cause production bugs or dependency cycles. D-4 is P1 (not P0) because while it is a security concern, the parser copy of `sanitizeHTML` is currently unused by engine HTML parsing (engine uses `html/sanitization.ts` via `shared/utils/index.ts`).
