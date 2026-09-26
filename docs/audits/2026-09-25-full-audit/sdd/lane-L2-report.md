# Lane L2 report — S-1a, S-12

Worktree `/Users/shahg/Desktop/buildrik-af-L2`, branch `fix/audit-L2`, base `e143ffbaf`.
Commits: `91aab5d5d` (S-1a), `733ae9403` (S-12). Range `e143ffbaf..733ae9403`.

## S-1a — fixed `91aab5d5d`

**What changed**
- New SSOT `packages/shared/schemas/element-markup.ts`: `ALLOWED_ELEMENT_TAGS` (the editor's old `DEFAULT_ALLOWED_TAGS` + `audio` + every `TYPE_TO_TAG_MAP` tag + a few inert HTML tags: `dialog, hgroup, menu, search, track`), compared case-insensitively, shape `/^[a-zA-Z][a-zA-Z0-9-]*$/`; `isAllowedElementTag` / `toAllowedElementTag` (→ `"div"`); `isValidAttributeName`; `FORBIDDEN_ATTRIBUTES = {srcdoc}`; `URL_ATTRIBUTES` (href, src, srcset, action, formaction, poster, xlink:href); `srcsetUrls`. The editor's `DEFAULT_ALLOWED_TAGS` literal (no consumers, only barrel re-exports) is deleted, not duplicated.
- Server `lib/sanitize-blocks.ts`: tag rule; attribute-name rule; srcdoc dropped; srcset checked per candidate. New `sanitizeComponentPayload` (masterTree + `variants[].attributeOverrides`), `sanitizeVersionPayload` (`snapshot.pages[].root`), `sanitizeTemplateHtml` (DOMPurify). Optional `onChange(reason, detail)` reporter, used by the dry run.
- Wired: `site-component.service` upsert, `site-version.service` create, `user-template.service` upsert (create and update branches).
- Editor: `Element.getTagName` falls back to the type's tag for an off-list tag; `sanitizeElementTreeContent` (importProject boundary) rewrites `tagName`; `elementDataToHTML` applies the rule; `isSafeAttrValue` refuses malformed names, srcdoc, upper-case `ON*`, and scheme-checks every shared URL attribute (src/poster/srcset allow blob:).
- Side fix found by the dry run: the server's DOMPurify on rich-text `content` stripped `target=` from links (editor keeps it via `ADD_ATTR: ["target"]`). Server now uses the same config. Was 3 real removals in local footers.

**Dry run** — `npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/audit/sanitize-dry-run.mjs` (read-only `findMany`, refuses non-localhost):
```
Local DB localhost — rows scanned: { pages: 149, templates: 4, site_components: 7, site_versions: 247, user_templates: 1 }
Would change (source reason: count):
  pages content-reserialised-only: 52
  templates content-reserialised-only: 5
Rows that would change: { pages: 14, templates: 4 }
```
So **0 tag rewrites and 0 attribute drops** under the new rules. The only changes are DOMPurify re-serialising rich text (quote style and similar), with no removals; this already happens on every save. Stored tags seen (psql tally): div, h1–h3, p, span, a, button, section, input, img, td/th/tr/tbody/thead/table, li/ul, label, nav, br, hr, form, select, option, textarea, strong, footer, **video, audio, source, svg, circle**. All are allowed. **No `iframe` is stored**, so iframe was not added (per the ledger: add it only if embeds store it; Video/Map embed blocks are divs). No srcset/formaction/xlink:href/poster values are stored (the `review-url-attr` bucket is empty).
Dry-run limitation: the editor's `isSafeAttrValue` can't be imported under tsx (ESM editor → CJS shared), so its stricter scheme allowlist is covered only by listing values of the four newly checked URL attributes, and there are none.

**Tests** (added or changed)
- `lib/__tests__/sanitize-blocks.test.ts` +14 cases: srcdoc (both cases) dropped, `script`→div keeping content, `img src=x onerror…`→div, attr-name injection, srcset/formaction/xlink:href, safe srcset incl. data:image, audio/video/svg/linearGradient/`DIV` kept, missing tagName untouched, target kept, reasons reported, component/version/template helpers. 9 of these fail on the pre-fix file (verified).
- `server/services/__tests__/{site-component,site-version,user-template}.service.test.ts`: sanitized payload on create AND update. The user-template fixture `"<p>"` became `"<p>Hi</p>"` (DOMPurify closes the tag).
- `packages/editor/src/shared/utils/html/__tests__/sanitization.test.ts` +7 cases (4 fail on the pre-fix file), incl. a drift guard: every `TYPE_TO_TAG_MAP` tag is on the shared allowlist.
- `packages/editor/src/engine/__tests__/Composer.importSanitize.test.ts` (new): PoC 2 — `importProject` then `toHTML()` has no srcdoc/onerror/iframe; an off-list tag renders the type's tag; **round-trip over all 10 `SITE_TEMPLATES`** (each >20 nodes): the tree is unchanged by `sanitizeElementTreeContent`, and a reload renders identical HTML.

## S-12 — fixed `733ae9403`

- `isCollabEnabled()` in `server/services/collab.service.ts` (`process.env.NEXT_PUBLIC_FEATURE_COLLAB === "true"`). Both routes return 404 before auth when it is off. Root CLAUDE.md env row updated.
- `packages/shared/schemas/collab.ts`: `collabOpBodySchema`. It checks the event-type enum (from `CollaborationEvent`), clientId/userId ≤128, finite timestamp, and a superRefine that rejects any `__proto__`/`constructor`/`prototype` key at any depth, or a `path`/`from` string pointing through one. `MAX_COLLAB_OP_BYTES = 1_000_000` (largest local project snapshot is ~181 KB).
- Ops route: Content-Length and actual byte checks (413), Zod (400), `checkRateLimit("collab:user:site", 1500, 60s)` (429; cursor sync is 20/s max), stores the parsed op.
- SSE route: `checkSiteRole` re-run every 10 polls (15 s). A `PermissionError` sends `event: revoked` and closes; a transient error does not. 30-min lifetime, `: keep-alive` every 15 s, `cancel()`, `X-Accel-Buffering: no`, and a failed enqueue stops the poll.
- `JsonPatch.ts`: `parseJsonPointer` throws on a prototype segment; `deepCloneValue` skips those keys.
- `check-baked-flags.mjs`: `FORBIDDEN = { NEXT_PUBLIC_FEATURE_COLLAB: "true" }`.

**Tests**
- `__tests__/collab-routes.test.ts` (new, 12): 404 for unset/"false"/"1" on both routes with auth never called; valid op → 201 with the parsed op; 403; **pollution PoC (`/__proto__/p` patch path) → 400**; `__proto__` key nested and bare → 400; unknown type or missing clientId → 400; 2 MB op → 413; 429; **SSE: member removed after connect → `event: revoked` and stream ends**; transient re-check error → no revoke, keep-alive seen.
- `packages/editor/src/engine/utils/__tests__/JsonPatch.prototypeGuard.test.ts` (new, 5; 4 fail on the pre-fix file).
- `__tests__/check-baked-flags.test.ts` (new, 3): pass with Collab unset, fail with it baked true, still fail when Publish is not baked.

## Lane gate
- Root: `npx vitest run lib server __tests__/collab-routes.test.ts __tests__/check-baked-flags.test.ts __tests__/save-project-empty-snapshot.test.ts packages/shared`: 132 files, 1142 passed. The only 2 failures were editor `LibraryManager.p2c/p3t` tests that the `lib` filter also matched: 15 s timeouts under machine load. Both pass when rerun alone (27/27). Not touched by this lane.
- Editor: `src/shared/utils/html src/engine/elements src/engine/__tests__ src/engine/export`: 89 files, 986 passed. `src/engine/utils src/engine/__tests__ src/engine/collaboration` (after the JsonPatch change): 30 files, 244 passed. Full editor suite `npx vitest run` in `packages/editor`, run under heavy machine load (several lanes' suites at once): 1097 files, 10874 passed, 7 failed. The 7 were `ds-grep-gates` Gate 7, DeleteButton, LibraryManager.clone ×2, SiteMenu.kbd, BrandWorkspace.pages and AddAnimation, all UI or gate fixtures this lane did not touch. Rerun on their own they all pass: 108/109 on the first rerun, and the last one (LibraryManager.clone) timed out at 15 s once, then passed 84/84 alone. They were load timeouts, not regressions.
- `npx tsc --noEmit -p packages/editor`: 0 errors. `npx tsc --noEmit -p packages/dashboard` (includes server/, lib/, app routes): 0 errors.
- `verify:ds` not run: no editor chrome or dashboard UI touched.

## NOT verified (controller Phase 2)
- **S-1 runtime_check:** no browser run. Still to do: write a srcdoc-iframe plus malformed-tagName tree through `sites.saveProject` or directly into `site_components.payload`, open `/edit/:id` on :3000, confirm no alert, and check `document.querySelector('[srcdoc]') === null`. The chain is proven only to the canvas HTML string, which is the same tier as the audit PoC.
- **S-12 runtime_check:** no live Next run. Still to do: the devtools fetch with the flag unset → 404 (ops and SSE); with the flag true → the pollution body gets 400, a 2 MB body gets 413, and after demoting to VIEWER in the DB, an open stream closes within ~15–30 s. The baked-flags gate was exercised on synthetic bundles only; no `.next` build exists in this worktree.
- **Prod value of `NEXT_PUBLIC_FEATURE_COLLAB` is NOT VERIFIED.** It is unset in the worktree `.env.local` and there is no `.env.production.local` here. If cPanel or the build has it true, S-12 turns the routes off only when it is also false at build time; `gate:baked-flags` will now refuse such a build.
- The SSE lifetime cap means more EventSource reconnects. Each one reuses the original `?since=` (pre-existing A16-5 replay issue, not fixed here).
- `op.userId` is not bound to the session user: the engine sends a generated per-session id, so binding needs a client change (not in the ledger's decision-free fix).

## Cross-lane edits
- `server/services/collab.service.ts` (+`isCollabEnabled`): named in the S-12 ledger locations but not in the brief's file list.
- Root `CLAUDE.md` (COLLAB env row): required by the env-var rule.
- `packages/shared/schemas/collab.ts` (new).
- `server/services/__tests__/*` for the three services.
- Note for x1b: `site-version.service.ts` now sanitizes on create; keep `sanitizeVersionPayload` when porting.

## Out-of-scope bugs noticed
- The export writers (`ExportEngine.ts:186-197,403-407,1124`, `ReactExporter.ts:192`) read `tagName` raw. They are covered in practice because the tree they read has passed `importProject` → `sanitizeElementTreeContent`, but they don't apply the rule themselves.
- `validateHtml.ts` has its own `FORBIDDEN_TAGS` list (html/body/head/iframe) separate from the shared allowlist.

## Fix round 1 (controller review)

Commits: `81fc2ab84`, `beec167e6`, `cb59036bb` (range `733ae9403..cb59036bb`).

### IMPORTANT 1 — component masters bypass the load sanitizer: fixed `81fc2ab84`
- `ComponentManager.ts`: `sanitizeElementTreeContent(masterTree)` in `loadComponentsFromStorage` (every stored master) and `adoptLibraryComponent` (workspace library), the same ingest boundary `importProject` has. The other `components.set` sites (create, duplicate, restoreDeleted) take trees that already passed through this session's sanitized element tree.
- Test `packages/editor/src/engine/components/__tests__/ComponentManager.sanitize.test.ts` (new, 2): place a library-adopted master and a storage-loaded master whose child has `content: '<img src=x onerror="alert(1)">Hi'` plus an iframe with srcdoc. The page's `toHTML()` keeps "Hi" and has no onerror, srcdoc or iframe. Both tests were red before the fix (the handler was present in the HTML).

### MINOR 2 — one shared URL-scheme check: fixed `beec167e6`
- `element-markup.ts`: `isDangerousUrl`. It strips `[\x00-\x20]`, lower-cases, and refuses javascript:, vbscript: and any non-image data:. The server's URL rule uses it, and it runs first in the editor's `isSafeUrl`, so it covers every URL attribute on both sides. The data: policy is now image/* only on both sides; the dry run still finds 0 stored URL attributes that change.
- The same bug existed in the editor's srcset handling: splitting on the first whitespace cut `java\tscript:` down to `java`. `srcsetUrls` now cuts only a trailing w/x/h descriptor.
- Tests: `packages/shared/schemas/__tests__/element-markup.test.ts` (new, 20: tab, newline, CR, \x01, \x00-space, mixed case, data:text/html, `da\tta:`, xhtml; the allowed set incl. blob:/data:image/relative/empty; srcset parsing). `lib/__tests__/sanitize-blocks.test.ts` +14 href variants. `sanitization.test.ts` +4, covering every URL attribute plus srcset. Server and editor were red on the tab/newline variants before the fix.

### MINOR 3 — rel=noopener on target links: fixed `cb59036bb`
- `element-markup.ts`: `withSafeTargets(clean, parse)` merges `rel="noopener noreferrer"` into every `[target]` element. The server's `purify` (rich-text content and user-template html) and the editor's `sanitizeHTML` both finish through it, using the caller's DOMPurify with `RETURN_DOM_FRAGMENT`. Markup without a target is returned untouched. The template round-trip caught why this matters: re-serialising every string turned text `&` into `&amp;` (DOMPurify's no-`<` fast path was lost).
- Tests: server +2 (content, including merging an existing `rel="nofollow"` and leaving target-less links alone; template html); editor `sanitizeHTML` +1. All red first.
- Not done: element-attribute `target` on link elements (`attributes.target`, emitted by `buildAttributeString` / ExportEngine) does not get rel added. That is pre-existing behaviour outside the DOMPurify path; tell me if it should be included.

### Verification (all `--maxWorkers=2`)
- `npx vitest run --maxWorkers=2 lib/__tests__/sanitize-blocks.test.ts packages/shared/schemas/__tests__/element-markup.test.ts server/services/__tests__ __tests__/save-project-empty-snapshot.test.ts` → 66 files, 619 passed.
- `packages/editor`: `npx vitest run --maxWorkers=2 src/shared src/engine` → 251 files, 3515 passed, 18 todo, including the 10-template round-trip and the component tests.
- `npx tsc --noEmit -p packages/editor` → 0 errors. `npx tsc --noEmit -p packages/dashboard` → 0 errors.
- Dry run after the round: unchanged. 0 tag/attr changes; 52 + 5 rich-text strings re-serialised with no removals. Rich text that has a target (e.g. the 3 local footers) now gains rel. That falls in the same bucket, and nothing is removed.
- Still not verified: browser runtime checks (as above).

## Fix round 2 (controller review)

Commits: `978ab272a`, `1d3879cdf` (range `cb59036bb..1d3879cdf`).

### IMPORTANT — malformed master broke the library: fixed `978ab272a`
- `ComponentManager.ts`: `hasUsableMaster` means the tree is an object (not null, not an array) and `children` is absent or an array. `loadComponentsFromStorage` console.warns a bad row, skips it and keeps loading, so `COMPONENT_LIST_UPDATED` still fires. `adoptLibraryComponent` warns and throws `LIBRARY_MASTER_MALFORMED` before saving; BuildTab's existing try/catch shows its "Couldn't add component" toast.
- `sanitizeElementTreeContent` is now defensive at every depth: non-object `attributes` are deleted, non-string attribute values dropped, non-array `children` and non-object child entries skipped.
- Tests (in `ComponentManager.sanitize.test.ts`, +2): a null tree, an array tree and string `children` load alongside a nested-bad row and a good row. Only the nested-bad and good rows load, the list event fires once, there are 3 warns and no throw. Adopting a null master rejects and nothing is registered. The first test was red before the fix (TypeError, no list event, unhandled rejection).

### SECURITY — instance overrides never sanitized: fixed `1d3879cdf`
- Editor: `applyOverrideToNode` (`ComponentInstance.ts`) is the one place overrides are applied, and sync goes through it. Content goes through `sanitizeHTML`. An attribute is applied only if the value is a string and `isSafeAttrValue` passes (shared name rule, srcdoc, on*, `isDangerousUrl`). A refused override is not applied, not kept, and counted in `dropped`, so it shows in the sync's "overrides dropped" count. Detach/reset don't apply overrides (verified in `ComponentInstances.ts`). No tagName override type exists. Style overrides are unchanged because `buildAttributeString` already drops a dangerous style block at render.
- Server: `sanitizeBlocks`' node walk now visits `data.componentInstance.overrides`. Content values are purified; unsafe or non-string attribute overrides are removed (reason `override`). This covers pages, templates, version snapshots and component masters.
- Tests:
  - `ComponentInstance.overrides.test.ts` (new): the unit contract, including applied/dropped/kept counts.
  - `ComponentManager.sanitize.test.ts` +1: a stored hostile override set is rehydrated and then synced after a master version bump. The HTML keeps the safe content and `title`, and has no onerror, onmouseover, srcdoc or `script:`.
  - `sanitize-blocks.test.ts` +2: the write-side strip, reason count, and a malformed overrides shape.
  - All red first (the sync test's first run failed only because sync is a no-op without a version bump; with `syncedVersion: 0` it was red for the right reason).
- Dry run after both fixes: unchanged, with 0 `override` changes.

### Verification (`--maxWorkers=2`)
- Root: `npx vitest run --maxWorkers=2 lib/__tests__/sanitize-blocks.test.ts server/services/__tests__ __tests__/save-project-empty-snapshot.test.ts packages/shared/schemas/__tests__/element-markup.test.ts` → 66 files, 621 passed.
- Editor: `npx vitest run --maxWorkers=2 src/shared src/engine` → 252 files, 3519 passed, 18 todo.
- tsc: editor 0 errors, dashboard 0 errors.
- Deferred per controller (noted, not done): data:image/svg+xml accepted on href/xlink:href; `withSafeTargets` in a non-DOM environment; `isDangerousUrl` over-rejects URLs with inner spaces (safe direction).

## Fix round 3 (controller review)

Commits: `233388f21`, `c263a42e0`, `08446c8f3` (range `1d3879cdf..08446c8f3`).

### IMPORTANT 1 — style breakout on published sites: fixed `233388f21`
- `element-markup.ts`: `isSafeCssDeclaration(property, value)` checks:
  - the property shape (kebab, camel, vendor or `--custom`), and refuses a `behavior` or `-moz-binding` property;
  - the value has no `<`, `{` or `}`. A balanced `{{token.x}}` template placeholder is allowed; the stock templates use it (see below);
  - no expression(, -moz-binding, behavior:, javascript: or vbscript:;
  - every `url(...)` passes `isDangerousUrl`.
- Applied in:
  - (a) every stylesheet writer: `ExportHelpers.stylesToCSS` (publish base CSS + single-file), `ReactExporter.stylesToCSS`, and `StyleEngine.generateStyleRule` (breakpoint/responsive rules);
  - (b) the server write in `sanitizeBlocks` over `styles` and `breakpointStyles.{desktop,tablet,mobile}` (reason `style`);
  - (c) the editor load sanitizer. There are no state/pseudo maps on ElementData.
- Tests:
  - `ExportEngine.styleBreakout.test.ts` (new, real Composer). `stylesToCSS` output, `exportAllPages` HTML (base and tablet breakout values gone; padding and gradient kept) and `exportHTML`. Publish was red first; single-file was already safe (styles are inline and escaped).
  - `element-markup.test.ts` +30: breakout and dangerous variants refused; colors, var(), url(https), data:image, gradients, font stacks, `content: "\201C"`, grid areas and `{{token}}` allowed.
  - Server +1 (styles + both breakpoint maps, reason count) and editor load +1, both red first.
- The template round-trip caught `{{token.color.primary}}` (4 stock template values) before the commit; placeholders are now allowed.
- **Dry run: 0 style values change.** Stored: 10,148 page style values (638 using url/gradient/var()), 99,476 in version snapshots, and 18 + 116 breakpoint values.
- Residual (noted, not done): StyleEngine global-rule `selector` and `mediaQuery` strings (project-level `styles`) are still written raw into the published stylesheet. Only declarations are guarded.

### IMPORTANT 2 — malformed overrides / destructive sync: fixed `c263a42e0`
- `usableOverrides` keeps only objects with a string `path`. It runs in `rehydrateInstances` (ingest), `applyOverridesToTree` and `getOverridesForElement`.
- Server: malformed entries are removed and a non-list `overrides` is reset to `[]`.
- `syncInstance` now clones, applies overrides and pastes the new tree at the old index BEFORE removing the old instance, so any throw leaves the old instance on the canvas. This also covers the minor: a master whose nested `children` isn't an array passes the root-only load check, fails the clone, and the instance survives.
- The `applyOverridesToTree` doc comment is fixed (sync is the only caller; detach and reset apply no overrides).
- Tests (`ComponentManager.sanitize.test.ts` +3, server +1), all red first:
  - junk entries: no throw in `getOverridesForElement`; sync applies the one good op;
  - non-array overrides: sync works;
  - a nested-bad master makes sync return false with the old element and the HTML unchanged. It was red because the old instance was deleted.

### Minor — toast copy: fixed `08446c8f3` (cross-lane edit: `BuildTab.tsx`)
- `LIBRARY_MASTER_MALFORMED` now shows "This library component is damaged and can't be added." instead of "Try again". Test added in `BuildTab.library.test.tsx`.

### Verification (`--maxWorkers=2`)
- Editor: `npx vitest run --maxWorkers=2 src/shared src/engine src/editor/sidebar/tabs/build` → 261 files, 3593 passed, 18 todo.
- Root: `npx vitest run --maxWorkers=2 lib/__tests__/sanitize-blocks.test.ts server/services/__tests__ packages/shared/schemas/__tests__ __tests__/save-project-empty-snapshot.test.ts __tests__/collab-routes.test.ts` → 71 files, 704 passed.
- tsc (once): editor 0 errors, dashboard 0 errors.
- Dry run: unchanged. 0 tag, attribute, override or style changes; 52 + 5 rich-text strings only re-serialised.

## Fix round 4 (controller review): raw selector, media query and element id in CSS

Commits: `b26a2afe9`, `e3e31abcf`, `990c4579d`, `313f6a220` (range `08446c8f3..313f6a220`).

### Shared guards (`packages/shared/schemas/element-markup.ts`)
- `isSafeCssSelector` accepts only the shapes the product writes: a type or `*` selector, `.class`, `#id`, `[attr]`, `[attr=word]`, `[attr="word"]` (`[data-buildrick-id="<id>"]` is the quoted form), allowlisted pseudo-classes and pseudo-elements, and `:nth-*(An+B|odd|even)`. These can be joined by descendant, `>`, `+`, `~` or commas, up to 1000 characters. Braces, `;`, `@`, `\`, `<`, and quotes outside that attribute form are all refused.
- `isSafeMediaQuery` accepts `\((min|max)-(width|height):\s*\d+px\)`, which may be ANDed.
- `isSafeStyleRuleTarget(selector, mediaQuery)` treats an absent, null or empty media query as a base rule.
- `isSafeElementId` requires `^[A-Za-z0-9_-]+$`.
- `escapeStyleText` rewrites `</style` in any case as `<\/style`.

### (a)+(b) Server write, `b26a2afe9`
- `sanitizeProjectStyles` (in `lib/sanitize-blocks.ts`):
  - It removes a rule whose selector or media query fails the check (new reason `style-rule`).
  - The rules it keeps have their `properties` checked with the declaration rule.
  - Legacy token rows that have no selector are left alone; the editor already skips them on load.
- `sanitizeProjectStyles` runs in `saveProjectData` (which also serves `saveProjectFromEditor`) and in `sanitizeVersionPayload` on `snapshot.styles`.
- `sanitizeNode` gives an unsafe `id` a new `el-<uuid>` and keeps the node (new reason `id`). This applies to pages, templates, component masters and snapshots.
- The dry-run script now also scans `sites.projectStyles` and counts the selectors, media queries and ids it looked at.

### (a)+(b) Editor load, `e3e31abcf`
- `StyleEngine.importStyles` also requires `isSafeStyleRuleTarget`. Every load goes through `importProject`: dashboard, localStorage, history, version restore and collab.
- `sanitizeElementTreeContent` gives an unsafe id a new `generateId("el")` and keeps the node.
- References: no rule or binding had to be updated. A selector that names an unsafe id cannot pass the selector check anyway.

### (c) Writers, the final check, `990c4579d`
- `StyleEngine.writableRules()` is the only rule source for `generateCSS`, `generateResponsiveCSS` and the device-preview block.
- ExportEngine `extractStyles` and `buildPublishBaseCss` skip an element whose id is unsafe.
- `escapeStyleText` now wraps all of these:
  - the embedded CSS and Global CSS in `wrapInDocument`;
  - Global CSS on published pages;
  - `Composer.exportHTML`;
  - `Viewport.setContent`;
  - **`inlinePublishStylesheet` (`editor/shell/exportPublishPages.ts`, cross-lane edit).**
- **Finding:** the publish payload does not ship `styles.css`. It folds the stylesheet into a `<style>` on every visitor page, so a hostile rule in multi-page publish meant script execution, not just CSS injection. The fold now also inserts through a function, so a `$'` in the CSS is not treated as a replacement pattern.

### (d) `313f6a220`
- The single-file `elementToHTML` now writes `class="${escapeHTML(className)}"`.

### Tests (each was red before its fix)
- `packages/shared/schemas/__tests__/element-markup.test.ts`, +56:
  - selectors refused and allowed, including all 5 stored local shapes;
  - media queries;
  - rule target, including `""`;
  - element id;
  - `escapeStyleText`.
- `lib/__tests__/sanitize-blocks.test.ts`, +4:
  - a hostile selector or media query is dropped;
  - a hostile declaration in a kept rule is stripped;
  - token rows are kept;
  - non-list input is tolerated;
  - `snapshot.styles`;
  - the id is regenerated and the node kept.
- `__tests__/save-project-styles-sanitize.test.ts` (new): `saveProjectData` stores only the safe rule.
- `src/engine/__tests__/Composer.importStyleRules.test.ts` (new, 4): the load drops the hostile rule and media query, and keeps the breakpoint and `:hover` rules. There is no script in `exportHTML` or in the embedded `generateHTML`. The hostile id is rewritten, and no export carries it.
- `src/engine/export/__tests__/ExportEngine.cssInjection.test.ts` (new, 7). These use a DOMParser count of the scripts a browser would run:
  - rules set after load reach no writer;
  - an unsafe id reaches neither the single-file nor the publish base CSS;
  - `</STYLE>` in Global CSS stays inside the style element (single-file and every published page);
  - `Viewport.setContent`;
  - the class attribute.
- `src/editor/shell/__tests__/exportPublishPages.test.ts`, +1: the folded sheet containing `</Style><script>` and `$'` produces 0 scripts, and the CSS is intact.

### Commands (`--maxWorkers=2`)
- Editor: `npx vitest run --maxWorkers=2 src/shared src/engine src/editor/shell/__tests__/exportPublishPages.test.ts src/editor/export` → 264 files, 3612 passed, 18 todo. This includes the 10-template round-trip, whose ids are all unchanged. Rerun after (d): `src/engine/export` → 42 files, 436 passed.
- Root: `npx vitest run --maxWorkers=2 lib/__tests__/sanitize-blocks.test.ts server/services/__tests__ packages/shared/schemas/__tests__ __tests__/save-project-empty-snapshot.test.ts __tests__/save-project-styles-sanitize.test.ts __tests__/collab-routes.test.ts` → 72 files, 769 passed.
- tsc (run once): editor 0 errors, dashboard 0 errors.

### Dry run (`npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/audit/sanitize-dry-run.mjs`)
- Rows scanned: 149 pages, 4 templates, 7 site_components, 247 site_versions, 66 sites, 1 user_template.
- Values scanned: 82 style-rule selectors and 77 media queries (projectStyles plus snapshot styles), and 35,080 element ids (pages plus snapshots).
- **0 `style-rule` and 0 `id` changes.**
- The stored selector shapes are `[data-buildrick-id="el-…"]` with and without `:hover`. The only media queries stored are `(max-width: 1023px|767px)`.
- Otherwise unchanged: 52 + 5 rich-text strings are re-serialised, and nothing else changes.

### NOT verified / notes
- No browser run. Still to do in Phase 2: store a hostile `projectStyles` rule through `sites.saveProject`, then:
  - confirm the write is refused;
  - write it into the DB directly, open `/edit/:id`, and confirm the rule is dropped;
  - check Download All and publish.
- Theme push and rollback (`theme.service.ts`) copy `projectStyles` from site to site without re-sanitizing. The source rows are sanitized when they are written, and the editor load catches legacy rows. The server copy was left as is.
- The selector grammar refuses escaped class names (`.md\:flex`) and pseudo-classes outside the allowlist (`:not()`, `:is()`). The product writes none of these today, and the local DB stores none.
- `ExportUtils.ts:90` (quick preview) rebuilds `<style>` from parsed `textContent`, which cannot contain a closing `</style`, so it was left untouched. `Canvas.tsx` renders Global CSS as a React text child, which is not an HTML parse.

### Cross-lane edits
- `packages/editor/src/editor/shell/exportPublishPages.ts` and its test.
- `server/services/sites.service.ts`: one line.
