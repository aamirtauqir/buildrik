# Audit: packages/editor/src/services/
**Date:** 2026-04-29
**Module:** services/
**Files audited:** 12

## Performance (P)

### [P1] P — GoogleFontsService.ts:198-212
**Description:** `getImportStatement` and `getLinkTag` rebuild the full Google Fonts URL string from scratch on every call without memoization.
**Rule violated:** Missing caching for repeated lookups / unmemoized return values.
**Impact:** Repeated DOM-read or export-loop calls recompute the same string, causing unnecessary allocations.
**Suggested fix:** Cache the last generated import/link string and invalidate when `loadedFonts` changes.

### [P1] P — FormSubmissionService.ts:201
**Description:** `validate` compiles `new RegExp(rules.pattern)` on every submission instead of caching compiled patterns.
**Rule violated:** Unnecessary object allocations in hot paths.
**Impact:** Form submissions with custom regex rules allocate and JIT-compile the same pattern repeatedly.
**Suggested fix:** Maintain a small `Map<string, RegExp>` of compiled patterns in the service instance.

### [P1] P — AIServiceClient.ts:97
**Description:** `RequestQueue.add` sorts the entire queue array on every insertion.
**Rule violated:** Synchronous blocking in service methods / unnecessary object allocations.
**Impact:** Under burst load, each enqueue is O(n log n); queue length is unbounded before processing starts.
**Suggested fix:** Use a priority-queue structure (binary heap) instead of resorting the whole array.

### [P1] P — AiTrpcClient.ts:99
**Description:** `RequestQueue.add` sorts the entire queue array on every insertion (copy-paste of AIServiceClient).
**Rule violated:** Synchronous blocking in service methods / unnecessary object allocations.
**Impact:** Same burst-load overhead as AIServiceClient.
**Suggested fix:** Extract shared queue and use a binary heap.

### [P2] P — AICache.ts:24
**Description:** `generateKey` calls `JSON.stringify(body)` synchronously without size limits or serialization guards.
**Rule violated:** Synchronous blocking in service methods.
**Impact:** Large request bodies block the event loop during cache key generation.
**Suggested fix:** Cap body size before stringification or hash a subset.

### [P2] P — CloudSyncService.ts:396-400
**Description:** `updateStatus` spreads the entire `SyncStatus` object and notifies all listeners on every field change.
**Rule violated:** Unnecessary object allocations in hot paths.
**Impact:** Rapid sync operations for many projects create GC pressure from repeated object spreads.
**Suggested fix:** Mutate the Map entry in-place when possible; only clone before returning to external callers.

## Duplication (D)

### [P0] D — AIServiceClient.ts:38-67 + AiTrpcClient.ts:40-69
**Description:** `RateLimiter` class is duplicated verbatim across `AIServiceClient.ts` and `AiTrpcClient.ts`.
**Rule violated:** Same error handling code in multiple service methods / duplicate types/interfaces.
**Impact:** Any bug fix or tuning to rate limiting must be applied in two places; the copies will drift.
**Suggested fix:** Extract `RateLimiter` to `services/ai/RateLimiter.ts` and import it in both clients.

### [P0] D — AIServiceClient.ts:81-130 + AiTrpcClient.ts:83-134
**Description:** `RequestQueue` class is duplicated verbatim across `AIServiceClient.ts` and `AiTrpcClient.ts`.
**Rule violated:** Same error handling code in multiple service methods / duplicate types/interfaces.
**Impact:** Queue behavior (concurrency, sorting, processing) diverges silently if one file is edited and the other is not.
**Suggested fix:** Extract `RequestQueue` to `services/ai/RequestQueue.ts` and share it.

### [P1] D — AIServiceClient.ts:14-33 + AiTrpcClient.ts:14-34
**Description:** `AIRequestOptions`, `AIResponse`, and rate-limit constants (`DEFAULT_TIMEOUT`, `MAX_RETRIES`, `RETRY_DELAY`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX`) are duplicated across both clients.
**Rule violated:** Duplicate types/interfaces / repeated API client setup patterns.
**Impact:** Constants diverge (e.g., one client retries 2x, the other could accidentally be changed to 3x).
**Suggested fix:** Move interfaces and constants to `services/ai/types.ts`.

### [P1] D — AIServiceClient.ts:163-273 + AiTrpcClient.ts:220-299
**Description:** Retry loop logic, cache read/write pattern, and rate-limit gate pattern are semantically duplicated between `apiRequest` and `execute`.
**Rule violated:** Same error handling code in multiple service methods.
**Impact:** Divergent retry behavior (e.g., `AIServiceClient` respects `AbortSignal` and timeout; `AiTrpcClient` ignores both).
**Suggested fix:** Extract a shared `executeWithRetry` wrapper that both clients consume.

### [P1] D — GoogleFontsService.ts:198-233
**Description:** `getImportStatement` and `getLinkTag` contain identical family-to-URL mapping logic (variants map, space replacement, weight fallback).
**Rule violated:** Duplicate logic across service methods.
**Impact:** URL generation rules diverge if only one method is updated (e.g., adding italic support).
**Suggested fix:** Extract a private `buildFontUrl()` helper used by both methods.

### [P1] D — CloudSyncService.ts:420-509
**Description:** Provider switch/case blocks for Supabase, Firebase, and Custom are duplicated across `fetchRemote`, `uploadToCloud`, `deleteFromCloud`, and `fetchProjectList`.
**Rule violated:** Same error handling code in multiple service methods / duplicate validation logic across services.
**Impact:** Header construction, URL shape, and error handling are copy-pasted; a provider-specific fix must be applied four times.
**Suggested fix:** Introduce a `CloudProviderAdapter` interface with one implementation per provider.

### [P2] D — EmailService.ts:311-331
**Description:** `sendSendGrid`, `sendMailgun`, and `sendResend` are one-line pass-through wrappers around `sendViaBackendProxy`.
**Rule violated:** No pass-through wrappers (per project CLAUDE.md architecture rules).
**Impact:** Three functions add zero logic; they bloat the class and confuse the call graph.
**Suggested fix:** Delete the three wrappers and route directly to `sendViaBackendProxy` using the provider name.

### [P2] D — CloudSyncService.ts:30-32
**Description:** `validateProjectId` checks `projectId.includes("..")` even though the following regex `^[a-zA-Z0-9_-]+$` already rejects dots entirely.
**Rule violated:** Duplicate validation logic across services.
**Impact:** Redundant path-traversal check is dead code.
**Suggested fix:** Remove the `includes("..")` check; the regex is sufficient.

## Business Logic (BL)

### [P0] BL — AiTrpcClient.ts:10
**Description:** Import `import type { AppRouter } from "../../../server/trpc/router"` attempts to resolve `server/` from inside `packages/editor/src/`, which does not exist at that relative path.
**Rule violated:** Missing input validation at service boundaries / direct cross-layer imports.
**Impact:** Broken compilation / module resolution failure; also violates the `services/ -> shared/ (ONLY)` import direction rule.
**Suggested fix:** Either move the tRPC router type to `packages/shared/` or expose it through a path alias that resolves correctly.

### [P0] BL — subscriptionClient.ts:8
**Description:** Import `import type { AppRouter } from "../../../../../server/trpc/router"` resolves to `packages/server/trpc/router`, which also does not exist.
**Rule violated:** Missing input validation at service boundaries / direct cross-layer imports.
**Impact:** Broken compilation / module resolution failure; violates import direction rules.
**Suggested fix:** Same as AiTrpcClient — relocate the type to `packages/shared/` or fix the alias.

### [P1] BL — FormSubmissionService.ts:201
**Description:** `new RegExp(rules.pattern)` is called without try/catch; an invalid regex pattern crashes `validate` and propagates out of `submit`.
**Rule violated:** Missing input validation at service boundaries / uncaught promise rejections.
**Impact:** A form builder entering a malformed regex causes the submission service to throw instead of returning a validation error.
**Suggested fix:** Wrap `new RegExp` in try/catch and return a validation error for invalid patterns.

### [P1] BL — FormSubmissionService.ts:163
**Description:** Required-field check `(!value || value === "")` treats `0` and `false` as missing.
**Rule violated:** Missing input validation at service boundaries.
**Impact:** A required numeric field with value `0` or a required checkbox with value `false` fails validation incorrectly.
**Suggested fix:** Use `value === undefined || value === null || value === ""` instead of `!value`.

### [P1] BL — FormSubmissionService.ts:179
**Description:** Number validation `value && isNaN(Number(value))` skips empty string, which `Number("")` coerces to `0` and passes as valid.
**Rule violated:** Missing input validation at service boundaries.
**Impact:** Empty string is accepted as a valid number when it should be rejected.
**Suggested fix:** Remove the `value &&` guard so empty string is explicitly tested.

### [P1] BL — BuildrikSyncProvider.ts:115-145
**Description:** `initBuildrikSync` attaches a `project:changed` listener but does not return an unsubscribe function or guard against double-init.
**Rule violated:** Side effects in getter-like functions / memory leaks.
**Impact:** Re-initializing sync (e.g., switching sites) leaks listeners and creates ghost auto-save timers.
**Suggested fix:** Return a cleanup function and/or use a WeakMap/composer key to prevent duplicate attachment.

### [P1] BL — BuildrikSyncProvider.ts:50
**Description:** `loadProject` passes `siteId` directly to the tRPC client without boundary validation.
**Rule violated:** Missing input validation at service boundaries.
**Impact:** Empty or malformed `siteId` travels to the network layer before failing.
**Suggested fix:** Validate `siteId` with the same `VALID_PROJECT_ID_PATTERN` used in `CloudSyncService`, or at minimum assert non-empty string.

### [P1] BL — CloudSyncService.ts:257-281
**Description:** `sync()` auto-pulls when `status.hasRemoteChanges` is true, but no internal method ever sets `hasRemoteChanges` to `true`.
**Rule violated:** Missing input validation at service boundaries / dead code.
**Impact:** The auto-pull branch in `sync()` is unreachable; callers must manually call `pull()` instead.
**Suggested fix:** Set `hasRemoteChanges` during conflict detection in `push()`, or remove the branch and document manual pull.

### [P1] BL — CloudSyncService.ts:286-307
**Description:** `resolveConflict` with resolution `"merge"` falls through to `forcePush(conflict.localVersion)`, identical to `"keep-local"`.
**Rule violated:** Missing input validation at service boundaries.
**Impact:** API advertises a merge strategy that silently behaves like "keep local", surprising callers.
**Suggested fix:** Remove `"merge"` from the public type until implemented, or throw "not implemented".

### [P1] BL — AIServiceClient.ts:187-201
**Description:** Rate-limit check (`canMakeRequest`) and recording (`recordRequest`) are separated by an `await` boundary (outside vs. inside the queue executor), making the limit racy.
**Rule violated:** Race conditions in stateful services.
**Impact:** Concurrent requests can exceed the configured 30 req/min window because both pass the gate before either records.
**Suggested fix:** Move `canMakeRequest` check inside the queue executor, immediately before `recordRequest`.

### [P1] BL — AiTrpcClient.ts:220-299
**Description:** `execute` accepts `options.timeout` and `options.signal` but ignores both; tRPC calls have no timeout and cannot be cancelled.
**Rule violated:** Missing input validation at service boundaries / side effects in getter-like functions.
**Impact:** Long-running or orphaned tRPC mutations cannot be aborted; the timeout parameter is a broken contract.
**Suggested fix:** Wire `signal` into the tRPC call (if supported) or wrap the mutation in an `AbortSignal.race` with a manual timeout.

### [P1] BL — GoogleFontsService.ts:148-173
**Description:** `loadFont` builds a Google Fonts URL by concatenating `family` without URL-encoding.
**Rule violated:** Missing input validation at service boundaries.
**Impact:** Font families with reserved URI characters produce malformed URLs.
**Suggested fix:** Use `encodeURIComponent(family)` when building the URL.

### [P1] BL — GoogleFontsService.ts:198-233
**Description:** `getImportStatement` and `getLinkTag` reconstruct loaded weights by looking up the font in `POPULAR_FONTS`; custom-loaded variants are lost because `loadedFonts` only stores the family name.
**Rule violated:** Missing input validation at service boundaries.
**Impact:** Export output uses default weight `"400"` for fonts loaded with non-standard variant sets.
**Suggested fix:** Store the loaded variant set alongside the family name (e.g., `Map<string, string[]>`).

### [P1] BL — FormSubmissionService.ts:228-238
**Description:** `callWebhook` uses `fetch` without a timeout or AbortSignal.
**Rule violated:** Uncaught promise rejections / side effects in getter-like functions.
**Impact:** A slow or unresponsive webhook endpoint hangs the submission until the browser gives up.
**Suggested fix:** Pass an `AbortSignal` with a reasonable timeout to the `fetch` call.

### [P2] BL — EmailService.ts:280-289
**Description:** `getSentEmails` and `clearSentEmails` are test-only seams exposed on the production service class.
**Rule violated:** Hidden side effects / low cohesion.
**Impact:** Production code depends on test affordances, and mock state can leak between operations.
**Suggested fix:** Move mock tracking behind a test-only subclass or jest spy, not the public API.

### [P2] BL — EmailService.ts:187-226
**Description:** `send` returns `{ success: false, error: ... }` for config errors, but `sendViaBackendProxy` throws. Mixed error-handling patterns.
**Rule violated:** Same error handling code in multiple service methods (inconsistent application).
**Impact:** Callers must handle both thrown exceptions and error-result objects for the same operation.
**Suggested fix:** Unify on one pattern (throw domain errors for all failure modes, or wrap everything in a result type).

### [P2] BL — AICache.ts:46-49
**Description:** Cache eviction deletes the first-inserted key (FIFO), not the least-recently used entry.
**Rule violated:** Missing caching for repeated lookups.
**Impact:** A frequently accessed old key can be evicted before an infrequently accessed recent key, lowering hit rate.
**Suggested fix:** Track access order and evict true LRU, or switch to an LRU Map implementation.

### [P2] BL — AICache.ts:27-39
**Description:** `get` returns the cached object reference directly; caller mutations poison the cache.
**Rule violated:** Hidden side effects.
**Impact:** Modifying a returned cached object corrupts the stored entry for future callers.
**Suggested fix:** Return `structuredClone(entry.data)` or a deep-freeze proxy for immutable cache semantics.

### [P2] BL — FormSubmissionService.ts:148-150
**Description:** `getSubmissions` returns the internal array reference from the Map when submissions exist.
**Rule violated:** Side effects in getter-like functions.
**Impact:** Callers can mutate the returned array, corrupting the service's internal state.
**Suggested fix:** Return `[...existing]` instead of the raw array reference.

### [P2] BL — GoogleFontsService.ts:155-159
**Description:** `loadFont` accepts arbitrary strings in `options.variants` and injects them into the CSS URL without validation.
**Rule violated:** Missing input validation at service boundaries.
**Impact:** Invalid variant strings (e.g., `"italic"`) produce malformed Google Fonts URLs.
**Suggested fix:** Validate or sanitize variant strings against the font's known variants list.
