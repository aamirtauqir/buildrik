# Lane x4 report — CSV import / Preview saved record / Sheets & Airtable doors

Worktree: `/Users/shahg/Desktop/buildrik-x4`, branch `feat/x4`.
Rebased onto `fix/audit-2026-09-25` @ `389c495d6` (clean, no conflicts).
Commit range: `389c495d6..37d91f0bf` (includes Fix rounds 1 and 2 below).

## 1. Preview a saved record (missing-features.md L4, 7116:76427)

Status: **built 70e882d8d** (carried-over WIP from before this session, verified
and completed) **+ tests a36f36ff6** (added this session — the WIP shipped with
no test file).

`RecordSheet`'s menu gained "Preview saved record" → `RecordTemplatePreviewDialog`,
which reuses `exportPublishPages` (the same export Topbar Publish and the AI
publish gate call) so the bound template page renders exactly as publish would
emit it, then fills `{fieldSlug}` tokens with the record's values (HTML-escaped)
in a read-only iframe. Handles no-template, template-missing (page deleted since
binding), composer-not-ready, and render-failure states, each with a clear
message; "Choose a template page" jumps to Dynamic pages.

Tests added: `RecordTemplatePreviewDialog.test.tsx` (5, dialog states),
`recordTemplatePreview.test.ts` (4, substitution/escaping logic).

## 2. CSV import (missing-features.md L4/row 25 — CSV half; fixall-brief decision)

Status: **built 75b3aef9b**.

Server (Page → tRPC → Router → Service → Prisma, no layer skipped):
- `lib/csv.ts` — dependency-free RFC 4180 parser (quotes, CRLF/LF, BOM).
- `server/services/cms.service.ts` — `previewCsvImport` (parses + caps at
  300KB/500 rows, suggests a field↔column mapping) and `importCsvEntries`
  (creates one entry per row **through the existing `upsertEntry`** — the same
  write manual "Add record" makes — per-row errors, partial success on a bad
  row). `upsertEntry` now runs every string field value through DOMPurify
  (`sanitizeEntryData`) before writing — closes an audit-S-1-class gap
  (`cms_entries.data` was never sanitized server-side) for both manual saves
  and CSV import in one place.
- `packages/shared/schemas/cms.ts` — `previewCsvEntriesInput`/`importCsvEntriesInput`.
- `server/trpc/routers/cms.ts` — `entries.importCsvPreview`/`entries.importCsv`,
  both gated `requireWrite` (EDITOR+), same floor as every other CMS write.

Client: `CsvImportDialog.tsx` — upload → preview/map columns → import. The raw
CSV text is parsed server-side on **both** calls (not once client-side and
trusted), so caps/mapping are enforced against what the server decodes. On a
successful import it calls `hydrateCmsFromServer()` then refreshes the
collection's records. Wired into `CmsWorkspace`'s collection `⋯` menu and the
empty-collection state, next to the existing "Import JSON…".

No Prisma schema change (existing `CmsCollection`/`CmsEntry` are already opaque
JSON) → no migration, no CHANGELOG line needed. No new `process.env.X`.

## 3. Google Sheets / Airtable → "Coming soon" (not a dead button)

Status: **built 75b3aef9b**. Both `CmsWorkspace`'s collection menu and
`ConnectSourceDialog` (the DataManager source picker the same missing-features
row also names) now show explicit disabled rows labeled "Google Sheets" /
"Airtable" with a "Coming soon" tag, instead of being silently absent or a
button that does nothing.

## Tests

`npx vitest run --maxWorkers=2` on every touched file: `lib/__tests__/csv.test.ts`
(7), `server/services/__tests__/cms.service.test.ts` (29, incl. 8 new: sanitize
+ preview + import), `server/trpc/routers/__tests__/cms-csv-import.test.ts` (4,
new — router authz), `packages/editor/.../CsvImportDialog.test.tsx` (5, new),
`RecordTemplatePreviewDialog.test.tsx` (5, new), `recordTemplatePreview.test.ts`
(4, new), plus the full `src/editor/cms/__tests__/` dir (57/57) and
`ContentTab.test.tsx`/`ContentViews.variablesCopy.test.ts` (12/12, for the
`ConnectSourceDialog` edit) — all green.

`npx tsc --noEmit -p packages/editor` and `-p packages/dashboard`: 0 errors.
Editor gates: `check-styling-ratchet.mjs`, `check-design-debt-ratchet.mjs`,
`check-ds-ssot.mjs`, `check-anchors.mjs`, `check-copy.mjs` — all PASS.

## NOT verified

- **Live browser verification was NOT done** (port 3035 not attempted —
  machine load was not checked before time ran out on this pass). Everything
  above is unit/component-test + typecheck + gate verified only. In
  particular the live round-trip (upload a real .csv against a running
  dashboard + editor, confirm records land and are visible without a manual
  page reload) needs a browser pass.
- `pnpm test:db` (DB-tier) was not run — no DB-tier test was written; the new
  service functions are covered by mocked-Prisma unit tests only, following
  the existing `cms.service.test.ts` convention.
- `pnpm run verify:ds` (full) was not run — the individual gate scripts it
  wraps were run directly instead, per the resource rule (no full-suite runs).

## Cross-lane edits

None outside owned files. `packages/editor/src/editor/sidebar/tabs/content/DataRowDialogs.tsx`
is CMS/content-domain (same area as the rest of this lane's scope), not another
lane's file per the worktree's git status at session start.

## Commits

- `70e882d8d` — wip(x4): state at stop (carried-over WIP, committed as-is per
  Step 0 instruction)
- `75b3aef9b` — feat(cms): CSV import + Sheets/Airtable Coming soon
- `a36f36ff6` — test(cms): cover RecordTemplatePreviewDialog + renderRecordTemplatePreview
- `d33483b91` — fix(cms): dangerous-scheme URL sink (Fix round 1, IMPORTANT)
- `72c3994a3` — fix(cms): drop tRPC casts + CSV column/cell caps (Fix round 1, MINOR)

## Fix round 1 (controller review round 1)

**IMPORTANT — dangerous-scheme URL at template substitution, fixed at the
sink.** `d33483b91`. A CMS field value like `javascript:alert(1)` (CSV import
or manual save) was stored as plain text — no markup for `sanitizeEntryData`
to strip — and substituted verbatim into a URL-bearing attribute (e.g.
`<a href="{fieldSlug}">`) by `substituteOutsideScriptStyle`, which only
entity-escaped. Published HTML could carry `<a href="javascript:alert(1)">`.

Fixed at the substitution sink, not the input: `substituteOutsideScriptStyle`
now locates every `href`/`src`/`srcset`/`action`/`formaction`/`poster`/
`xlink:href` attribute value in each script/style-free segment (regardless of
whether a `{field}` token is present — a static template URL can't match a
dangerous scheme, so checking it too costs nothing), resolves it, and runs
the whole resolved value through the dangerous-scheme check before writing
it back; a `javascript:`/`vbscript:`/non-image `data:` value becomes `""`.

Reused rather than copied: `lib/sanitize-blocks.ts` now exports
`isDangerousUrl` (its existing scheme regexes plus a `[\x00-\x20]` strip
before testing, so `java\tscript:` can't dodge the check — this also
hardens the pre-existing block-attribute path, which didn't strip control
chars before) — `cms.service.ts` imports it instead of keeping its own copy,
per the controller's note that a shared `isDangerousUrl` is landing from
another lane and will be unified at merge.

Corrected the report: `sanitizeEntryData`'s own doc comment previously
implied it was the XSS defense for entry data; it strips markup only. The
scheme defense lives at the substitution sink, documented in both places now.

Tests: `cms.service.test.ts` — javascript:, a control-character-hidden
scheme, vbscript:, a non-image `data:` URL, a legitimate `https` value and a
safe `data:image` URL surviving untouched, and an end-to-end CSV-import →
`generateDynamicPages` case (CSV-imported `javascript:` value never reaches
the published href). `sanitize-blocks.test.ts` — `isDangerousUrl` unit tests.

**MINOR — redundant casts + CSV column/cell caps.** `72c3994a3`. Dropped
`as Preview`/`as ImportResult` in `CsvImportDialog.tsx` (tRPC already infers
the return type). Added `CSV_IMPORT_MAX_COLUMNS` (100) and
`CSV_IMPORT_MAX_CELL_LENGTH` (5000 chars) to `packages/shared/schemas/cms.ts`,
enforced in `parseAndCapCsv` alongside the existing byte/row caps, each with
a test.

**Deferred (noted, not built):** UTF-16 length vs. bytes for the size cap;
a future CMS→CSV export must reuse `csvCell` (doesn't exist yet — no export
feature was built this round).

Verification for this round: `npx vitest run` on every touched file
(`lib/__tests__/csv.test.ts`, `lib/__tests__/sanitize-blocks.test.ts`,
`server/services/__tests__/cms.service.test.ts`,
`server/trpc/routers/__tests__/cms-csv-import.test.ts`,
`CsvImportDialog.test.tsx` — 63 tests, all green, `--maxWorkers=2`);
`npx tsc --noEmit -p packages/editor` and `-p packages/dashboard`, once each,
0 errors. Not re-run this round: the editor style/DS/anchor/copy gates
(unchanged by this round's files) or a live browser check (still blocked on
machine load, unchecked this round).

## Fix round 2 (controller re-review of round 1)

**IMPORTANT — round 1's regex URL-attribute detector was itself bypassable;
replaced with a real parser.** `a1b43565a`. Controller verified live: an
unquoted `<a href=javascript:alert(1)>` never matched round 1's `URL_ATTR_RE`
at all (it only matched quoted attribute values); `srcset="safe.jpg 1x,
javascript:alert(1) 2x"` passed because `isDangerousUrl` was checked against
the whole attribute value, never split into candidates; `style="background:
url({field})"` had no coverage at all. Binding ruling: stop detecting HTML
context with regex.

`substituteOutsideScriptStyle` (cms.service.ts) reverted to plain
entity-escaped substitution — round 1's `URL_ATTR_RE`/`subSegment` removed
entirely. `generateDynamicPages` now runs the whole substituted page through
a new `sanitizeGeneratedPageHtml` (`lib/sanitize-blocks.ts`) as a final pass:
real DOMPurify/jsdom parsing via `uponSanitizeElement`/`uponSanitizeAttribute`
hooks that force-allow every tag/attribute NAME (the template's own markup
is already trusted from the S-1 write boundary; this pass exists only to
catch a dangerous URL a SUBSTITUTION introduced) except `on*` handlers, left
to DOMPurify's default stripping — and run `isDangerousUrl` against every
href/src/action/formaction/poster/xlink:href value, each `srcset` candidate
individually (not the whole attribute string), and any `url(...)` inside a
`style` value.

Two problems surfaced building this, both fixed:
- DOMPurify refuses to allow-list `<script>` via the dynamic hook no matter
  what the hook sets (`ADD_TAGS` config works, the hook alone doesn't —
  verified empirically). Beyond that, running real script/style CONTENT
  through the parser at all turned out to be independently risky: a JS/CSS
  string containing `<b>`-shaped text can make the parser mis-scope and drop
  the whole element (verified: `var s = "<b>x</b>";` inside a `<script>` made
  it vanish). Since script/style content is never CMS-influenced (already
  excluded from substitution upstream of this pass), `sanitizeGeneratedPageHtml`
  swaps every script/style span for a `<style>/*BD_DYNPAGE_SPAN_n*/</style>`
  placeholder before sanitizing and restores the original span verbatim after
  — `<style>` specifically because it's valid in both `<head>` and `<body>`
  (a bare text placeholder in `<head>` gets foster-parented into `<body>` by
  the HTML parser, silently relocating a head script — verified this too).
- DOMPurify's `WHOLE_DOCUMENT` mode drops a leading `<!DOCTYPE html>` —
  extracted before sanitizing, reattached after.

Also per the same instruction: `parseAndCapCsv`'s per-cell length cap now
checks HEADER cells too, not only data rows (it previously only checked
`dataRows`).

Tests: `sanitize-blocks.test.ts` gained a `sanitizeGeneratedPageHtml` describe
block — all four reported bypass shapes, DOCTYPE preservation, script/style
content surviving byte-for-byte with tag-shaped text inside, a hook-immune
tag/attribute pair (`<use xlink:href>`), on* still stripped.
`cms.service.test.ts` gained the same four bypass shapes through the full
`generateDynamicPages` pipeline, plus a "clean template" test asserting every
real-world element/attribute shape (nav links, srcset, form formaction, SVG
icon, target/rel, a safe style url(), an HTML entity) survives untouched, and
the header-cell cap case. **No literal "stock/seeded template" fixture set
exists in this repo for CMS dynamic pages** (checked
`packages/editor/src/templates/`, which holds only `SaveTemplate.tsx`) — the
"clean template" fixture was built representative of what `ExportEngine.ts`
actually emits (verified against its own attribute-serialization code:
DOCTYPE + `<html lang>`, every attribute quoted, `<style>` for embedded CSS),
not pulled from a real seed file. Flagging this so the controller can point
me at the real fixture set if one exists elsewhere.

**IMPORTANT — the editor-side preview had the same gap, unfixed.**
`37d91f0bf`. `recordTemplatePreview.ts`'s `{field}` substitution duplicated
the server one with no scheme check at all. Fixed: the substituted HTML now
goes through the editor's canonical `sanitizeHTML` (browser DOMPurify) before
being returned into the preview dialog's `srcDoc`; `sandbox=""` on that
iframe is unchanged (was already there).

**Duplication decision (asked for explicitly):** kept duplicated, not moved
to `packages/shared`. The two sinks can't share code directly — the server
one depends on `isomorphic-dompurify`/jsdom (must never reach the client
bundle, per `lib/sanitize-blocks.ts`'s own header), the client one depends on
the browser's `DOMParser`/`window` (doesn't exist server-side), and
`packages/shared/` is transport-safe contracts only (root CLAUDE.md) — either
DOMPurify variant would violate that. The one piece that IS pure string logic
(the `{field}` → escaped-value substitution loop) is a few lines duplicated
in three places already (`applyPattern`/`substituteOutsideScriptStyle` in
cms.service.ts, `recordTemplatePreview.ts`, and `parseRecordsJson`'s
field-matching is a close cousin) — a real DRY opportunity, but out of scope
for this security fix; flagged as a follow-up rather than bundled here.

Verification for this round: `npx vitest run` on every touched file
(`lib/__tests__/sanitize-blocks.test.ts`, `server/services/__tests__/cms.service.test.ts`,
plus the full `packages/editor/.../cms/__tests__/` dir — 130 tests total,
all green, `--maxWorkers=2`); `npx tsc --noEmit -p packages/editor` and
`-p packages/dashboard`, once each, 0 errors.

## Rebase (SSOT with lane L2's shared URL guard)

`git rebase fix/audit-2026-09-25` (now at `0431517b8`, bringing in L2's
`isDangerousUrl`/`srcsetUrls`/`isSafeCssDeclaration`/`URL_ATTRIBUTES` in
`packages/shared/schemas/element-markup.ts` and L2's rewrite of
`lib/sanitize-blocks.ts` into an allowlist sanitizer built on them). Conflicts
in `lib/sanitize-blocks.ts` (3 rounds, across the round-1/round-2 commits) and
its test file, plus a one-line import conflict in `server/services/cms.service.ts`
— all resolved by dropping my own duplicate `isDangerousUrl` and importing
the shared one; `sanitizeGeneratedPageHtml` now uses shared `isDangerousUrl`,
`srcsetUrls` (per-srcset-candidate descriptor stripping), and `URL_ATTRIBUTES`
instead of local copies. Checked L2's existing hooks before keeping any of my
own: `unsafeAttributeReason` (blocks tree) already does per-candidate srcset
checking via `srcsetUrls` but drops the WHOLE attribute on any dangerous
candidate, where the CMS sink needs to keep safe candidates (round 2's own
test asserts this) — so `sanitizeSrcsetValue` stays, rebuilt on the shared
helper. `purify()` has no attribute hooks and isn't `WHOLE_DOCUMENT`, so there
was nothing to fold `sanitizeGeneratedPageHtml` into — it stays a separate
exported function. Considered routing the `style` attribute check through
`isSafeCssDeclaration` instead of the local `styleHasDangerousUrl`; declined
because it takes a structured (property, value) pair and reconstructing a raw
`style="…"` string declaration-by-declaration risked reformatting a value
that was never unsafe (documented inline in the code).

Since `git rebase` conflict resolution lands inside the replayed commits
themselves, there was no separate diff left after a clean rebase — the
`refactor:` commit (`63783a75e`) is an empty marker for the audit trail,
documenting what changed in which rebased commit.

Commit range: `0431517b8..63783a75e` (this lane's commits:
`807698546..63783a75e`, 8 commits, replayed onto the new base).

Verification after rebase: `npx vitest run --maxWorkers=2` on every touched
file (106 tests: csv parser, sanitize-blocks, cms.service, cms-csv-import
router; 58 tests: full `packages/editor/.../cms/__tests__/`; 110 tests:
`packages/shared/schemas/__tests__/element-markup.test.ts`, confirming the
shared helper itself is unaffected) — all green. `npx tsc --noEmit -p
packages/editor` and `-p packages/dashboard`, once each, 0 errors.

## Fix round 3 (controller review, 2026-09-26)

Commit range: `63783a75e..e079ccb1a` (6 commits, branch `feat/x4`).

1. **IMPORTANT — generated pages lost og:* meta / whatsapp: / DOM-named ids** — fixed `7dbe17f1d`.
   Root cause confirmed in DOMPurify 3.4.8 source: the hook set `allowedAttributes`, but
   `_isValidAttribute` still ran after it. The hook is now the whole attribute check:
   `on*` left to DOMPurify, shared `FORBIDDEN_ATTRIBUTES` (srcdoc) removed (new here),
   dangerous URL attribute / style with dangerous `url()` removed (`keepAttr = false`),
   srcset rewritten on the node when a candidate is dropped, everything else
   `forceKeepAttr = true`. Trap worth knowing: `forceKeepAttr` `continue`s BEFORE
   DOMPurify writes `data.attrValue` back, so a blanked value with forceKeep would keep
   the ORIGINAL dangerous value — hence remove-or-rewrite-on-node, never blank. Behaviour
   change: a dangerous `href` is now removed (`<a>Go</a>`), not blanked (`href=""`);
   three cms.service tests updated. Byte-for-byte: DOMPurify re-serialization changes
   `crossorigin` → `crossorigin=""` and `&display` → `&amp;display` (the exporter emits
   both), so a page where `DOMPurify.removed` is empty and no srcset was rewritten is
   returned as the input string. Fixture `EXPORTED_PAGE` in `sanitize-blocks.test.ts`:
   minified ExportEngine shell, SEOInjector head (og:*, twitter:*, canonical, robots,
   JSON-LD), inlined stylesheet, Google Fonts links, locale-redirect script, whatsapp:/
   mailto:/tel: links, `id="title"`/`id="location"`/`name="submit"`/`name="action"`,
   srcset with data: image, SVG `<use xlink:href>`, x2's wired form (`_return`, honeypot,
   `data-success-message`, form page script) and a slider runtime script — hand-built
   from those emitters (x2 is not in this branch), not captured from a live publish.
   The cms.service "clean template" test is now a full byte-equality check too.
2. **IMPORTANT — preview rendered without CSS** — fixed `ccc18f730`. The export's head
   (inlined stylesheet, SEO) is kept verbatim; only the body is substituted and run
   through `sanitizeHTML`. `{field}` tokens in the head are no longer substituted
   (invisible in the preview). `sandbox=""` unchanged.
3. **IMPORTANT — entry text entity-encoded on every save** — fixed `e079ccb1a`.
   `stripMarkup` pre-escapes `&`, parses with `RETURN_DOM_FRAGMENT`, stores
   `textContent` (tags gone, text exactly as typed, `AT&amp;T` typed literally stays
   literal), repeated to a fixed point because `<<img …>img …>` re-forms a tag after
   one pass (test added).
   **Repair note (not a migration):** only rows written by this lane's `sanitizeEntryData`
   (`c2a42a69e` onward — this lane is unmerged, so production has none; local/dev DBs
   only) can carry encoded text. Detect:
   `SELECT id, data FROM cms_entries WHERE data::text ~ '&(amp|lt|gt|quot|#39);';`
   A hit is not proof — a user may have typed an entity literally — so review, don't
   bulk-decode. Rows saved more than once can be double-encoded (`&amp;amp;`); re-saving
   an affected row after this fix does NOT repair it (the stored text is now kept as-is),
   so fix by hand or drop the dev rows.
4. **IMPORTANT (SSOT) — duplicate weaker url() scan** — fixed `f3e86a4bd`.
   `cssValueHasDangerousUrl` extracted into `packages/shared/schemas/element-markup.ts`;
   `isSafeCssDeclaration` calls it; `STYLE_URL_RE`/`styleHasDangerousUrl` deleted.
   Tests: `url("javascript:a')")`, tab-split scheme, `URL(vbscript:)`, data:text/html
   caught; `data:image/png;base64` survives.
- **Minor — srcset comma split** — fixed `458b5b549` in the shared helper: new
  `srcsetCandidates` (browser rule: URL is a non-whitespace run, commas included; a comma
  ending the URL or after the descriptor starts the next candidate); `srcsetUrls` built
  on it (its editor consumer `sanitization.ts` re-run green). Within a candidate the
  conservative descriptor strip is unchanged, so `java\tscript:` is still one URL.
  `sanitizeSrcsetValue` deleted — the hook filters candidates inline and rewrites only
  when one is dropped (no reformatting of a clean srcset).
- **Minor — placeholder forgery** — pinned `9e1cab7e7`: comment at `SPAN_PLACEHOLDER_RE`
  + test; verified the test FAILS with `SAFE_FOR_XML: false`.

Verification: `npx vitest run --maxWorkers=2` — root: sanitize-blocks, csv, cms.service,
cms-csv-import router, shared element-markup (5 files, 234 tests); editor:
`src/editor/cms/__tests__/` + `src/shared/utils/html` (20 files, 207 tests) — all green.
`npx tsc --noEmit -p packages/editor` and `-p packages/dashboard`, once each: 0 errors.

NOT verified: no browser run — the preview dialog with a real project (stylesheet
actually applied in the sandboxed iframe) and a real CMS dynamic-page publish (og:*
visible in the deployed HTML) are Phase 2 controller checks. The fixture is hand-built
from the emitters, not a captured publish. `generateDynamicPages` still runs before or
after x2's `wireForms` depending on worker order — not checked here since x2 isn't in
this branch; the fixture covers both scripts being present at sanitize time.
Cross-lane edits: `packages/shared/schemas/element-markup.ts` (L2's file — added
`cssValueHasDangerousUrl`, `srcsetCandidates`; `srcsetUrls` behaviour changed only for
commas inside a URL).
