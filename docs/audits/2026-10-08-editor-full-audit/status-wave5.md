# Wave 5 status — L3 + L4, Medium and Low (62 items)

Branch `fix/editor-audit-wave5` from main `e8df3945b`. One commit per issue ID (a few
follow-ups are marked). Live checks ran on a throwaway site (`Wave5 QA throwaway`,
QA workspace) on a dev server from this worktree, port 3570, 1440×900. Screenshots
are in the session scratchpad `wave5/`.

Status key: **FIXED** · **PARTLY FIXED** (fixed part + what is left) · **ALREADY-FIXED**
(on main before this wave) · **DECISION** (owner/design call; options + recommended
default) · **WONTFIX-REASON** · **NOT-DONE**.

## L3 — Pages · CMS · Forms · Settings

| ID | Status | Commit | Evidence / note |
|---|---|---|---|
| L3-003 | FIXED | `ed2b9546e` | `canNestElement(divider|spacer|heading|paragraph|… , "button")` is false; text/label/icon/image/svg still nest. Unit test (rules.test.ts). Smart placement walks up to a sibling. |
| L3-004 | ALREADY-FIXED | `39081ed5f` (L1-007) | `HistoryManager` keeps the active page across undo/redo (`importProject resets the active page…` block). |
| L3-005 | FIXED | `3f1779cc5`, `23a53638d` | Service refuses `REDIRECT_SHADOWS_PAGE` (CONFLICT naming the page); SeoTab withholds the offer when the old address is another page's. Live: `redirects.create {fromPath:"/"}` → 409 "/ is the address of the page “Home”…"; `/home` (home answers on `/` only) → 200. |
| L3-006 | FIXED | `d2c520d74`, `57453e9eb` | Toasts gain `key`; both save paths key "Save failed"/"not saved" and the next landed save dismisses it. Unit tests (Toast.policy, useComposerInit.markSaved). Not provoked live (needs a forced 500 then a 200). |
| L3-007 | FIXED | `84f90d298` | Rename / delete / bulk delete / set-homepage toasts capture `history.captureUndo()` right after the action. Unit tests (usePages). |
| L3-008 | FIXED | `da89f694a` | errorFormatter replaces a raw Prisma error's text always, and any raw-Error INTERNAL text in production, with "Something went wrong on our side. Please try again."; deliberate TRPCErrors keep their words. P2002 already mapped (wave 2). Unit tests (error-formatter). |
| L3-009 | DECISION | — | Vocabulary. Options: (a) drop "Live" from row aria while the site has never been published, keep "Unpublished" for unsaved; (b) rename the unsaved chip "Unsaved" and use "Draft · not published yet" at site level (board 4418:93381 says "Unpublished"). **Default: (b)** — needs a board update. |
| L3-010 | DECISION | — | `/about.html` is deliberate (the deploy serves `.html`; no `cleanUrls`). Options: (a) turn on Vercel `cleanUrls` at publish and show `/about` everywhere; (b) keep `.html` and make the slug prefix show it too. Host: show the published/verified host when known, else "your-site.vercel.app". **Default: (a)**. |
| L3-011 | DECISION | — | Indexing in two tabs (both drawn on 6887:73809 / 6887:73882). **Default: keep it in SEO only, Advanced links to it.** |
| L3-012 | PARTLY FIXED | `c9adfc3a8` | New folder opens in rename. Live: after "New folder" the `Rename folder` field showed "New Folder". **Left (DECISION):** the ↗ icon and "Your place here is kept" are drawn on board 21 (DD-13); default: swap ↗ for a chevron, drop the note. |
| L3-013 | PARTLY FIXED | `b9de9b324` | `saveProjectData` refuses a save that ADDS pages past `pagesPerSite` (PRECONDITION_FAILED `PAGE_LIMIT:`; over-limit sites keep saving if they add none); editor toast names the limit, no Retry. Unit tests. **Left:** New-page modal does not pre-check the limit (needs the plan in the editor). Not live-tested (QA is BUSINESS). |
| L3-014 | DECISION | — | Same as L1-025 (wave 4). **Default: Start from Scratch opens `/edit/<id>`.** |
| L3-017 | DECISION | — | Canvas showing drafts is deliberate (`RepeaterRenderer` "the author is building the list"); raw `{{item.x}}` is kept on canvas on purpose. Options: (a) mark draft copies (dimmed + "Draft" chip); (b) hide drafts like publish; plus a designed empty state and insert defaults that match common keys. **Default: (a) + an empty-state board.** |
| L3-018 | DECISION | — | JSON Sources are an in-memory test helper. Options: persist them in project settings (like `siteVariables`) vs label "Sample · this session only" vs hide the door. **Default: hide the door until persisted.** |
| L3-019 | PARTLY FIXED | `46589587f` | `onCmsInvalid` now has a subscriber: a refused collection raises "<Name> wasn't saved to the server — <reason>. It stays on this device only." Unit tests. **Left:** that collection's entries still queue and block publish (correct, since they cannot land); a "local-only" marker on the collection is a design item. |
| L3-020 | DECISION | — | Record delete guard. Options: typed DELETE (G3-070) vs today's toast Undo; plus a Status column. **Default: keep Undo (decision #29 reserves typed DELETE for wide/irreversible), add the Status column per 7103:76270.** |
| L3-021 | NOT-DONE | — | Showing "theirs" in the conflict banner is a feature (field diff); needs a board. |
| L3-022 | DECISION | — | The precondition is optional on purpose: "Keep mine" sends without it. Options: require it for API-token callers only vs a `force` flag for Keep mine. **Default: explicit `force: true` for Keep mine, required precondition otherwise.** |
| L3-023 | NOT-DONE | — | Seven small CMS polish items against G3-067 / G3-072; a design pass, not taken here. |
| L3-026 | PARTLY FIXED | `35528b6f5` | A browser form post that fails gets a short HTML page with the same status; JSON callers keep JSON. Live: POST to an unknown form → 404 `text/html` "This form isn't accepting submissions." **Left:** owner notification on the monthly limit. |
| L3-027 | PARTLY FIXED | `d6855d74a` | A settings save creates the FormBlock `isActive:false`; publish activates it. Live: `forms.updateBlock` on a never-published form, then a public POST → 404. **Left (DECISION):** a deliberate test-submit path (from Preview, tagged as test). Default: add it in Preview. |
| L3-028 | PARTLY FIXED | `1e890dc9c` | `/thanks` accepted (resolved against the visitor's page at submit time); errors read without the raw key ("Enter an email address like you@company.com"). Live: `updateBlock {redirectUrl:"/thanks"}` → 200; bad email → 400 with that sentence (the tRPC message still carries the key prefix; the inspector shows the issue's own sentence — unit-tested, not walked in the inspector). **Left:** page picker (design). |
| L3-029 | DECISION | — | Default Form element styling/labels (FIGMA + CODE). **Default: the Contact Form component's styling with real `<label>`s; "+ Add field" offers a type.** Needs a board. |
| L3-030 | WONTFIX-REASON + DECISION | — | The doubled `forms.getBlock` is React StrictMode's dev-only double effect (one mount, Next dev); one request in production. Form naming is a DECISION (where the Name field lives); default: a Name row at the top of After submit. |
| L3-031 | PARTLY FIXED | `d32f6aced` | `site.redirect.created` / `.deleted` are now written (they were declared, never recorded). Unit tests. **Left (DECISION):** logging page/CMS/save edits — granularity. Default: one coalesced "Edited N pages" row per editor session per 30 min. |
| L3-032 | FIXED | `eb195659f` | Copy now names "its default vercel.app address" (editor Domains, remove dialog, dashboard tab). Live: Settings › Domains reads "No custom domain. The site uses its default vercel.app address until you connect one." |
| L3-033 | DECISION | — | The nameserver pair is Namecheap's real default, shown as fact. Default: label it "Namecheap's default — check yours at the registrar". Board copy. |
| L3-034 | FIXED | `7c8526979` | A workspace webhook failure older than the site is not flagged (deliveries carry no site id). Unit test. |
| L3-035 | DECISION | — | "Check your connection" is board copy (3953:26503, 13 screens). Default: "Couldn't load your X. Try again." + one silent auto-retry. |
| L3-036 | DECISION | — | Add a "Title template" field to Settings › SEO (wave 6 SEO arc / FG-009) vs drop it from the check. Default: add the field. |

## L4 — Media · Brand · Issues

| ID | Status | Commit | Evidence / note |
|---|---|---|---|
| L4-004 | FIXED | `8c138303b` | Click-insert goes through `locateComment` (select + scroll into view). Unit test. Not walked live (an upload fires a paid alt-text call). |
| L4-005 | FIXED | `504a9131c` | `serverPage.total/loaded` move on upload, delete, trash and restore. Unit tests. |
| L4-006 | FIXED | `a90d76674` | `onUploadProgress` from `@vercel/blob/client` is threaded through; the bar moves 75→99, 100 on the row. Unit test. Not walked live. |
| L4-007 | DECISION | — | Auto alt-text on every upload. Options: on demand only; automatic behind a workspace setting; automatic with a per-plan cap. **Default: automatic behind a workspace toggle (on), deduped by asset.** (L4-002's duplicate uploads are already gone.) |
| L4-008 | FIXED | `dc9973f4d` | "Unsupported file type" rows offer Dismiss, not Retry. Unit test. |
| L4-009 | PARTLY FIXED | `e061e2e67` | Upload refusals (band records them) and a failed stock search (modal shows it) toast for 8 s. Other error toasts keep the persistent policy (decision #24). |
| L4-010 | PARTLY FIXED (ALREADY) + DECISION | `dd4665918` | `Promise.allSettled` — one provider's results show when the other fails (on main). **Left (DECISION):** gate the three stock doors on provider availability (needs a server capability read). Default: hide doors when neither provider is configured. |
| L4-011 | DECISION | — | Two asset menus; the tile menu matches board 4418:58798 ("Replace across pages…"). Default: one action list, "Replace across site…", disabled at 0 uses (the detail menu already disables). |
| L4-012 | DECISION | — | Columns control in List view is part of Clone 3695:44747 (pick columns → back to grid; test pins it). Select-mode footer wrap: needs a board width check. |
| L4-013 | DECISION | — | "Delete permanently" is Clone 3708:20650 copy. Default: "Delete" + "You can undo for a few seconds." |
| L4-014 | FIXED | `2328e14c2` | An asset's alt change updates placements whose alt is the old one or empty (one undo step; hand-written alt and locked elements untouched). Unit tests. |
| L4-015 | FIXED | `a3020c9f4` | `/^ResizeObserver loop/` is not a runtime fault. Unit tests. |
| L4-016 | ALREADY-FIXED | `c2fbccfd6` | The engine gate uses the server plan quota when known (`effectiveQuotaBytes`). |
| L4-017 | FIXED | `d6c7173d3` | Under 1 MiB the size reads in KB (`formatQuotaSize(1180)` → "1 KB"). |
| L4-023 | ALREADY-FIXED | `105ac434e` | Brand › Colour mode has Dark mode Off/Auto (`DarkModeCard`, `setDarkMode`); dark lint is muted while Off. |
| L4-024 | DECISION | — | Templates insert literal colours (`resolveTemplateTokens`, unchanged). Owner decision AD1/AD2: resolve to `var()` vs re-author templates on tokens. Default: re-author the template data on tokens. |
| L4-025 | FIXED | `d7ebd6b25` | The Fill picker lists non-primitive, non-retired colour tokens; bound values still resolve against all. Unit test. (The Delete-and-replace list puts semantic first by design.) |
| L4-026 | FIXED | `f61bf0b96` | A Review row whose tokens are back as the write found them (⌘Z) leaves the list; redo brings it back. The old "undo makes it stale" test was rewritten. |
| L4-027 | FIXED | `c83f88fbf` | Focus trap honours `data-autofocus`; Rename opens on New ID. Live: `document.activeElement.id` = `brand-token-rename-input` (was the Close button). The duplicate display name is no longer listed (retired tokens are filtered). |
| L4-028 | DECISION | — | Starters "Stripe Blue", "Linear Dark", "Notion Warm", "Apple Minimal", "Vercel Mono"; two indigo/violet primaries. Default: neutral names (e.g. "Ocean", "Slate"), keep palettes (they are customer-site palettes, not editor chrome) unless the owner extends the DESIGN.md ban to starters. |
| L4-029 | DECISION | — | The "No brand set" banner is board 4418:49685's first-run state (shows until the first token save); the preview switch position matches 7316:80949. Default: reword to "Using default tokens." |
| L4-030 | NOT-DONE | — | Not reproduced in this wave: the reader already falls back to the `background` shorthand (`5de463dee`); the audit case needs the Portfolio template's button (both longhand and shorthand present). Needs a live repro on a template site. |
| L4-031 | FIXED | `6ea0d9acb` | `renderProjectPages` sets the scratch composer's `brandTokensV2` from the caller (editor passes its own) or the rows (`getShareDraftRows` now sends `isBrandTokensV2Enabled`). Unit tests (render + share rows + TimeTravel). |
| L4-032 | FIXED | `be89f97a3` | One Tab stop per token table, arrow/Home/End inside. Live: 58 rows, 1 with `tabIndex 0`; ArrowDown moved color-action → color-surface; Tab left the table. |
| L4-035 | FIXED | `798428e06` | Server-check rows open their fix pane (shared `openPublishCheckFix`). Live: clicking "No favicon set…" opened Settings › General, Brand not opened. |
| L4-036 | FIXED | `5988eff9b` | Errors sort first (stable within severity). Unit test. |
| L4-037 | PARTLY FIXED (ALREADY) + DECISION | `da223041b` | Locate now uses `locateComment` (page switch + scroll into view). **Left (DECISION):** a "‹ Issues" back row on the Inspector when entered from Issues. Default: add it. |
| L4-038 | DECISION | — | Owner decision on the topbar issue chip is still open. Default: a count badge on the Site-menu "Issues" row. |
| L4-039 | PARTLY FIXED | `8710d38db` | Locations read "Home › Image" (was "Home › IMG"). **Left (DECISION):** DS-linter messages name token ids and cite DESIGN.md to customers — copy pass against 4418:147641. |
| L4-040 | NOT-DONE | — | Element-level contrast and structure checks (headings, labels, button names, title/lang) are new detectors — a feature arc. |
| L4-041 | ALREADY-FIXED | `eb0d2ba24` | Server-check rows refetch on save, publish settle, focus and panel open. |
| L4-042 | FIXED | `d49cb250b`, `a3dcfbd86` | Zero state "No issues."; the scanner skips hidden pages (`isPageLive`), as the server does. Unit tests; conformance copy.json updated. |

## Counts

FIXED 22 · PARTLY FIXED 9 · ALREADY-FIXED 4 · ALREADY-FIXED in part + DECISION 2 (L4-010,
L4-037) · DECISION 20 · WONTFIX-REASON 1 (L3-030, with a decision half) · NOT-DONE 4 = 62.

## Not verified

- Live walks were not run for: L3-006 (forced save failure), L3-008, L3-013 (BUSINESS
  plan), L3-019, L3-031, L3-034, L4-004/005/006/014 (an upload fires a paid alt-text call),
  L4-009, L4-025, L4-026, L4-031, L4-036, L4-042 — these rest on unit tests.
- No publish, no domains, no migrations.
