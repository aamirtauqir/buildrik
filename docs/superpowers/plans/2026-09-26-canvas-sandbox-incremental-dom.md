# Follow-up plan: S-1b (sandboxed canvas / nonce CSP) + D-7 full (incremental DOM)

Ledger IDs: S-1b (part of S-1), D-7 (this lane, L6, landed the decision-free
partial fix — see below). PD-2 gates both.

## Goal

Close the remaining XSS containment gap in the canvas render path (same-
origin `innerHTML` of user/CMS-sourced content) and replace the
whole-DOM-replace render model with incremental patching or a keyed
renderer, so a single style edit does not re-render the entire canvas
subtree.

**Done condition:** (S-1b) a stored-XSS payload that survives the S-1a
allowlist (if any exists) cannot execute in the canvas context, verified by
a Playwright test that plants a payload server-side and confirms no script
executes when the page renders in the editor. (D-7 full) a DevTools
Performance panel recording of a color-slider drag on a large page shows
scripting cost proportional to the changed subtree, not the whole page,
and a jsdom test asserts the DOM node identity of unrelated elements is
preserved across an edit (not just innerHTML content equality).

## What already landed (this lane, D-7 partial — decision-free, no PD needed)

- `useCanvasContent.ts`: dropped the no-op `DOMParser` round-trip —
  `resolvedContent` (already innerHTML markup) is returned directly instead
  of being re-parsed and re-serialized on every render.
- `useCMSPreview.ts`: short-circuits to `setResolvedContent(content)` when
  the composer has neither element bindings (`BaseBindingManager.hasAny()`,
  added this lane) nor collection-list bindings
  (`getAllCollectionBindings().length === 0`), skipping the DOMParser +
  RepeaterRenderer pass entirely.
- Both changes are commits in `fix/audit-L6` (D-7 partial); see the lane
  report for exact SHAs.
- **Not changed:** `Canvas.tsx:486-501,776` still does
  `dangerouslySetInnerHTML={canvasInnerHtml}`, replacing the whole canvas
  DOM subtree on every `content`/`resolvedContent` change. That is the
  part this plan covers.

## Why the rest is deferred

- **S-1b needs PD-2.** The canvas currently renders same-origin via
  `dangerouslySetInnerHTML`. A sandboxed iframe or a nonce-based CSP
  without `unsafe-inline` are the two long-term containment options, and
  either one changes the render path underneath: iframe changes the mount
  model (selection overlays, drag targets and inline-edit all currently
  assume same-document DOM), and both interact with the canvas keyboard
  model (A-6/PD-3) and overlay geometry (A04-5, A04-7), which were
  themselves deferred pending this decision.
- **D-7 full (incremental DOM) is XL and needs the S-1b answer first.** An
  iframe-sandboxed canvas and a same-document canvas have different
  incremental-patching strategies (postMessage-driven vs. direct DOM diff),
  so building the patcher before PD-2 risks building it twice.
- S-1a (the tag/attribute allowlist) is NOT blocked and should already be
  landing in a separate lane (S-1a is P0, not part of this deferred set).

## Decisions needed (PD-2)

1. **Sandboxed iframe vs. nonce CSP.**
   - Iframe: strongest containment (separate browsing context, separate
     CSP, no access to parent `window`/`document` without explicit
     postMessage bridge). Cost: every canvas interaction (selection,
     drag-resize handles, inline text edit, keyboard shortcuts scoped to
     canvas) needs a cross-frame bridge; overlay elements (selection box,
     drop indicators) currently painted as siblings in the same document
     need to either live inside the iframe or be geometrically synced
     across the frame boundary on every scroll/resize.
   - Nonce CSP without `unsafe-inline`: keeps the same-document mount
     model (overlays, selection, drag all keep working unchanged), but
     containment is weaker — a script tag that isn't nonce-stamped won't
     execute, but the rendered content still shares the parent's DOM,
     cookies, and global `window` (a payload could still read/exfiltrate
     via non-script vectors like CSS `url()` background probes, though
     the primary XSS vector — script execution — is closed).
2. **If iframe: same-origin or cross-origin sandbox domain?** Same-origin
   iframe is simpler to bridge but shares cookies/session unless
   explicitly isolated; a cross-origin sandbox domain (e.g.
   `canvas-sandbox.buildrick.io`) is stronger but is real infrastructure
   (a second deploy target, CORS/postMessage-origin allowlisting) — this
   is a founder-level infra decision, not just an engineering one.
3. **D-7's incremental strategy**, once S-1b is answered: hand-rolled
   keyed diff (element id → DOM node map, patch only changed nodes) vs. a
   small vdom-diffing library. The engine already has stable
   `data-buildrick-id`s on every element, which is what a keyed diff needs
   — this is a strong argument for hand-rolled over pulling in a new
   rendering dependency, but should be confirmed against bundle-size goals
   (D-12 in this same audit-fix arc already tightened the first-load
   chunk).

## Proposed tasks (once PD-2 lands)

1. Build the chosen containment model (iframe bridge or nonce CSP plumbing)
   in isolation, behind a flag, verified against the existing overlay/
   selection/drag test suite before touching the render path itself.
2. Re-audit A18-1 (the finding this whole scope traces to) and the canvas
   keyboard findings (A04-1, A06-12, A13-3) against the new mount model —
   these were explicitly deferred pending this decision and need a fresh
   pass, not an assumption that they still hold.
3. Build the keyed/incremental DOM patcher for `Canvas.tsx`, replacing the
   `dangerouslySetInnerHTML={canvasInnerHtml}` whole-replace with an
   id-keyed diff against the previous render's node map.
4. Frame-budget test at the PD-43 size (the performance budget PD, also
   still open) — a scripting-cost assertion in the DevTools Performance
   panel is the acceptance bar per the ledger's `runtime_check`, not a
   synthetic benchmark alone.
5. Re-run D-9's (this lane) hover/layer-tree rAF coalescing sanity check
   against the new canvas render path — the two interact (hover changes
   drive layer-tree expansion, which is downstream of canvas selection).

## Risks

- The highest-risk part of D-7 full is exactly what the ledger's risk note
  says: selection overlays, drag targets and inline edit all currently
  assume a fresh DOM after every content change. An incremental patcher
  that misses a case will show a selection box pointing at a stale/removed
  node — this needs an explicit test matrix (select → edit unrelated
  element → confirm selection box still tracks the right node), not just
  "does the visible content look right."
- If PD-2 picks the iframe path, the canvas keyboard model rework (A-6) and
  D-7's incremental patcher become sequentially dependent on the bridge
  being solid first — do not parallelize those two workstreams against an
  unstable bridge.
