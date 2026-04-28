# Audit: packages/editor/src/blocks/
**Date:** 2026-04-29
**Module:** blocks/
**Files audited:** 75

## Performance (P)

### [P1] P — index.ts:1-98
**Description:** Barrel re-exports every React block component (PricingTable, ContactForm, ImageGallery, Slider, etc.) as eager static imports; no lazy loading or dynamic splitting for heavy block types.
**Rule violated:** Large block config objects not tree-shaken, missing lazy loading for heavy block types.
**Impact:** Any consumer importing a single block config or registry utility bundles all React component implementations, inflating initial chunk size by ~tens of KB.
**Suggested fix:** Convert heavy component exports to `React.lazy()` wrappers or move them to a separate `blocks/preview/` barrel consumed only by the preview runtime.

### [P1] P — blockRegistry.ts:96
**Description:** `blockDefinitions` is a single monolithic array exported at module scope containing all 70+ block configs inline.
**Rule violated:** Large block config objects not tree-shaken.
**Impact:** Bundlers cannot tree-shake unused block configs because they are referenced by the shared array; importing `getBlockById` pulls in every block object.
**Suggested fix:** Build the array at runtime from a record/object map so individual configs can be dead-code-eliminated when unused, or split registry by category.

### [P2] P — ProgressBar.tsx:28
**Description:** Renders `<style>{css}</style>` containing a Google Fonts `@import` on every component mount.
**Rule violated:** DOM thrashing during block insertion, unmemoized block renderers.
**Impact:** Triggers a network request + style recalculation on every mount; causes FOIT/FOUT and unnecessary reflows.
**Suggested fix:** Move `@import` to global CSS or Emotion `Global`; memoize the static CSS string outside the component.

### [P2] P — Slider.tsx:66-74
**Description:** Autoplay `useEffect` lists `activeIndex` in its dependency array, causing `clearInterval` + `setInterval` churn on every slide change.
**Rule violated:** Re-renders triggered by inline prop objects, DOM thrashing during block insertion.
**Impact:** Timer drift; manual navigation resets the autoplay clock; unnecessary effect teardown/setup on every transition.
**Suggested fix:** Use a ref-based interval callback or `useRef` for `activeIndex` so the effect only restarts when `autoplay` or `autoplayInterval` change.

### [P2] P — Components/*, Media/*, Sections/* (multiple files)
**Description:** React preview components (ContactForm, PricingTable, ImageGallery, Testimonials, Features, HeroSection, CountdownTimer, etc.) create fresh inline `style` objects on every render.
**Rule violated:** Re-renders triggered by inline prop objects in block definitions.
**Impact:** Stable child subtrees re-render because React sees new object references for styles, even when data is unchanged.
**Suggested fix:** Extract static style objects to module-level constants; memoize dynamic objects with `useMemo`.

### [P2] P — ImageGallery.tsx:82
**Description:** Gallery maps over all images and renders `<img>` elements immediately without `loading="lazy"`.
**Rule violated:** Missing lazy loading for heavy block types.
**Impact:** All gallery images fetch on mount even if below the fold; wastes bandwidth and blocks main thread decoding.
**Suggested fix:** Add `loading="lazy"` to gallery `<img>` tags and consider virtualization for large galleries.

## Duplication (D)

### [P2] D — Basic/Button.tsx, Basic/Divider.tsx, Basic/Heading.tsx, Basic/Link.tsx, Basic/List.tsx, Basic/Paragraph.tsx, Basic/Spacer.tsx, Basic/Text.tsx
**Description:** Eight files share an identical boilerplate pattern: interface extending `BlockData` + `elementType: ElementType`, followed by an exported config object whose only variances are `id`, `label`, `elementType`, and `content`.
**Rule violated:** Duplicate block definition structures (same shape, different names).
**Impact:** Adding a new basic block requires copy-pasting an entire file; changes to the shared shape must be edited in 8+ locations.
**Suggested fix:** Export a `createBasicBlock(config)` factory from `builders.ts` and replace the 8 files with one-liner calls.

### [P2] D — Forms/Checkbox.tsx, Forms/ColorInput.tsx, Forms/DateInput.tsx, Forms/EmailInput.tsx, Forms/FileInput.tsx, Forms/NumberInput.tsx, Forms/PasswordInput.tsx, Forms/RangeInput.tsx, Forms/TimeInput.tsx
**Description:** Nine form input blocks are semantically identical: interface extending `BlockData` + `elementType: ElementType`, then a config export differing only in `id`, `label`, `content`, and icon path.
**Rule violated:** Duplicate block definition structures, repeated validation logic across block types.
**Impact:** Same maintenance burden as Basic blocks; 9 files where 1 factory would suffice.
**Suggested fix:** Introduce `createInputBlock({ id, label, type, icon, content })` factory and collapse to single file or loop-generated exports.

### [P2] D — builders.ts:142,151
**Description:** `FLEX_ITEM_STYLES` and `GRID_ITEM_STYLES` are literal objects that differ only by `background` (`#e0e0e0` vs `#f0f0f0`).
**Rule violated:** Copy-paste rendering logic between similar blocks.
**Impact:** Two constants to maintain for a single style variation; semantic intent is the same (placeholder item styles).
**Suggested fix:** Extract a `PLACEHOLDER_ITEM_STYLES(baseBg)` factory or merge into one parameterized object.

### [P2] D — VideoEmbed.tsx:23-67 and MapEmbed.tsx:23-47
**Description:** Both blocks compute an external embed URL, wrap an `<iframe>` in a container with aspect-ratio padding, and render inline styles for positioning.
**Rule violated:** Copy-paste rendering logic between similar blocks.
**Impact:** Any fix to iframe sandboxing, responsive scaling, or error handling must be applied in two places.
**Suggested fix:** Extract a shared `EmbedFrame` component that accepts `src`, `aspectRatio`, and `title` props.

### [P2] D — Slider.tsx:66-265 and ImageGallery.tsx:40-230
**Description:** Both implement carousel/lightbox navigation with prev/next buttons, dot indicators, active index state, and keyboard-style arrow handlers.
**Rule violated:** Copy-paste rendering logic between similar blocks, duplicate event handling.
**Impact:** Two independent implementations of the same interaction pattern; fixes for a11y or focus management must be duplicated.
**Suggested fix:** Extract a shared `useCarousel` hook or base `Carousel` primitive that both blocks compose.

## Business Logic (BL)

### [P0] BL — VideoEmbed.tsx:23-39
**Description:** `getEmbedUrl` interpolates the `url` prop directly into an `<iframe src>` without validating the URL scheme or domain.
**Rule violated:** Missing validation on block data (especially user-generated content).
**Impact:** A malicious `url` value (e.g., `javascript:alert(document.domain)`) can execute in the iframe context, creating an XSS/phishing vector.
**Suggested fix:** Whitelist allowed URL patterns (YouTube, Vimeo) and reject anything that does not match; use `URL` constructor to validate scheme is `https:`.

### [P1] BL — blockRegistry.ts:249
**Description:** `insertBlock` wraps the entire insertion flow in `try { ... } catch { return undefined; }`, swallowing all exceptions silently.
**Rule violated:** Missing error handling.
**Impact:** Engine failures, invalid parent references, or nesting violations produce no logs, no user feedback, and no telemetry; debugging block insertion failures is impossible.
**Suggested fix:** Log the error via Sentry or console at minimum; return a discriminated union `{ ok: true, id: string } | { ok: false, error: string }` so callers can surface feedback.

### [P1] BL — ContactForm.tsx:94-114
**Description:** Email validation uses a naive regex `/\S+@\S+\.\S+/` that accepts invalid addresses (e.g., `a@b.c`) and misses standard validation rules.
**Rule violated:** Missing validation on block data.
**Impact:** Invalid emails pass client-side validation and are submitted to the backend; poor UX and potential data quality issues.
**Suggested fix:** Replace with a stricter regex or Zod schema; delegate final validation to the server.

### [P1] BL — ContactForm.tsx:122-130
**Description:** `handleSubmit` catches submission errors with an empty `catch { }` block and gives the user no failure feedback.
**Rule violated:** Missing error handling.
**Impact:** Network errors or server failures appear to the user as a silent hang or successful submission because the success state is never reached and no error state is shown.
**Suggested fix:** Surface submission errors in UI (e.g., `setErrors({ form: "Submission failed" })`) and log to telemetry.

### [P1] BL — CountdownTimer.tsx:44-71
**Description:** `targetDate` is passed directly to `new Date()` inside an interval without validation.
**Rule violated:** Missing validation on block data.
**Impact:** Invalid or non-date strings produce `NaN` time differences, causing the timer to display `NaN` units or behave erratically.
**Suggested fix:** Validate `targetDate` with `isNaN(new Date(targetDate).getTime())` before starting the interval; show a fallback UI for invalid input.

### [P1] BL — ProductGrid.tsx:8
**Description:** Directly imports `Composer` from `../../engine/Composer` instead of using the type-safe barrel in `../types`.
**Rule violated:** Direct engine imports from block rendering code.
**Impact:** Breaks the `blocks/ → shared/` import boundary, coupling block definitions to engine internals and complicating future engine refactors.
**Suggested fix:** Import `Composer` from `../types` (which re-exports from engine) so the dependency is centralized.

### [P1] BL — blockRegistry.ts:6
**Description:** Directly imports `Composer` from `../engine` instead of using the `../types` re-export.
**Rule violated:** Direct engine imports from block rendering code.
**Impact:** Couples the registry to engine internals and bypasses the canonical type barrel; future engine refactors require updating the registry separately.
**Suggested fix:** Import `Composer` from `../types`.

### [P1] BL — Icon.tsx:9-10
**Description:** Directly imports `Composer` from `../../engine` and `ElementType` from `../../shared/types`.
**Rule violated:** Direct engine imports from block rendering code.
**Impact:** Same boundary violation as ProductGrid; couples the block to engine internals.
**Suggested fix:** Import `Composer` and `ElementType` from `../types`.

### [P1] BL — MapEmbed.tsx:23-28
**Description:** `lat` and `lng` props are interpolated into a Google Maps embed URL without numeric validation.
**Rule violated:** Missing validation on block data.
**Impact:** Non-finite or out-of-range values produce a broken embed URL; `NaN` or injected strings can leak into the generated URL.
**Suggested fix:** Validate `typeof lat === 'number' && isFinite(lat)` before interpolating; reject or clamp out-of-range coordinates.

### [P2] BL — blockRegistry.ts:176-178
**Description:** `getBlockDefinitions()` is a pass-through wrapper that returns `blockDefinitions` without adding logic, transformation, or constraints.
**Rule violated:** Side effects in block registry getters (hidden indirection).
**Impact:** Adds an unnecessary function call and violates the project's "no pass-through wrappers" rule.
**Suggested fix:** Delete `getBlockDefinitions()` and export `blockDefinitions` directly; update consumers to reference the array.

### [P2] BL — blockRegistry.ts:206-250
**Description:** `insertBlock` does not validate that the `block` parameter is non-null and has the expected shape before accessing `block.build`, `block.content`, or `block.elementType`.
**Rule violated:** Missing validation on block data.
**Impact:** Passing `undefined` (e.g., `getBlockById("missing")`) causes a runtime throw that is caught by the outer try/catch and silently returns `undefined`, masking the real cause.
**Suggested fix:** Add an early guard `if (!block || !block.elementType) return undefined;` with an explicit error log.

### [P2] BL — Modal.tsx:21, Tabs.tsx:56
**Description:** Uses hardcoded violet accent color `#8b5cf6` which is banned per DESIGN.md; only cobalt `#2D6DFF` is the canonical accent.
**Rule violated:** Missing validation / design system SSOT.
**Impact:** Visual inconsistency with the rest of the editor; blocks will not match the unified theme once the legacy indigo/violet migration completes.
**Suggested fix:** Replace with `var(--buildrick-design-color-primary)` or the cobalt token.

### [P2] BL — CTA.tsx:18
**Description:** Uses a purple/violet gradient (`#667eea` to `#764ba2`) that violates the single-accent cobalt rule in DESIGN.md.
**Rule violated:** Missing validation / design system SSOT.
**Impact:** Block renders with a deprecated accent palette that does not match the editor's canonical light theme.
**Suggested fix:** Update gradient to use cobalt-family tokens or remove the gradient in favor of the primary accent.
