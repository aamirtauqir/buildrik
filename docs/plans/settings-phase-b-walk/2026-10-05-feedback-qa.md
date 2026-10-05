# Settings feedback batch — independent live QA (2026-10-05)

Batch under test: `main` @ `d1de945c2` (branch `fix/settings-feedback-2026-10-04`): Languages Remove always confirms · Redirects delete confirms + Undo toast · Access purpose / focused field / "A password is set" with Change / Remove · sidebar Search Mode · Back to canvas is an anchor.

Setup: worktree `qa-settings-fb`, branch `qa/settings-feedback-2026-10-05`. Dashboard dev server on port 3390 (APP/AUTH/NEXTAUTH URL overridden), unified editor at `/edit/<site>?settings=<screen>`, Playwright 1.61.1 headless, **1440×732 and 1440×900**. `sites.publish` / publish worker routes aborted at the network for the whole run. QA workspace (`qa@buildrik.local`, OWNER, BUSINESS). Site `cmugooxrj004hnvjymh83lf6g` (owner's feedback site). Writes that needed a translation, a second locale or a save on every screen ran on a throwaway duplicate (`cmutfbglo…`, "E2E Blank Full d013128c (Copy) (Copy)"), soft-deleted through `sites.delete` at the end. Screenshots are in the session scratchpad (`…/scratchpad/shots/`), not the repo.

**Verdict after fixes: CLEAN for the five items** (every defect found in them is fixed and re-walked at both sizes). Minor focus / URL items recorded below are outside the batch's own changes or not small.

## Defects

| # | Item | Defect (found live) | Status |
|---|---|---|---|
| 1 | Redirects | After Undo the "Redirect … deleted" toast stayed up (focus on its button pauses the timer for good), and a second Undo posted the restored rule again: 409 in the console and the "Redirect changes were not saved" banner over a rule that was back. | **Fixed** `a0d32a09d` (+ mock typing `28896a316`). Undo runs once and removes its toast. Live: Undo buttons after Undo = 0, console clean. Test: `RedirectsScreen.test.tsx` "Undo runs once and dismisses its toast". |
| 2 | Access | Change → a New password of only spaces (`"    "`) turned Save on; Save would store it. (The first-password path already refused blank.) | **Fixed** `cd507e109`. Registered as a field error, Save stays disabled. Live: `change whitespace … save disabled`. Test: `AccessScreen.test.tsx` "a New password of only spaces is refused before Save". |
| 3 | Search Mode | A query with no spaces ran "No settings match …" out of the 256 sidebar across the pane (`t1-longquery-900.png`). | **Fixed** `4c0556f55` (`tw:break-words`). Live: line right edge 239 < 256, scrollWidth = clientWidth (`t9-A-longquery-732.png`). |
| 4 | Search Mode | ↑/↓ never scrolled the list: "a" lists 65 results; ↑ from the first wrapped to #64 at y=3256 in a 732 viewport. | **Fixed** `e7ec3789d` (`scrollIntoView({block:"nearest"})` on the active option). Live: #64 at 684–732, #19 after 20×↓ at 684–732 (900: 852–900). |
| 5 | Search Mode | A screen result (no field) — Enter or click, other screen or the one already open — left focus on `<body>`. | **Fixed** `7aabd4bcd`: lands on that screen's nav row. Live: `BUTTON[set-nav-redirects]`, same-screen `BUTTON[set-nav-access]`, via guard Discard `BUTTON[set-nav-domains]`. |
| 6 | Search Mode | Dirty → field result → Unsaved guard → **Keep editing** left the field pending: the next plain visit to that screen (SEO) scrolled to `robots.txt` and stole focus. Keep editing also left focus on `<body>`. | **Fixed** `7aabd4bcd`: Keep editing drops the abandoned result and focuses the current nav row. Live: Keep editing → `set-nav-general`; later plain nav to SEO → `set-nav-seo`. Guard **Discard** still lands on the field (`TEXTAREA#seo-robots`). |
| 7 | Access | Remove (and Change → Cancel's sibling Remove) unmounts the focused button; focus falls to `<body>`. | Recorded. Keyboard-only; one Tab gets back into the card. |
| 8 | Languages | Remove dialog → Cancel returns focus to `<body>`, not the row's Remove. | Recorded (dialog focus-restore; same class as 7). |
| 9 | Back to canvas | Closing in place (plain click / guard Discard) leaves `?settings=<screen>` in the URL, so a reload reopens Settings. The anchor's own href is correctly `/edit/<site>`. | Recorded — `useDeepLink` behaviour, predates this batch. |
| 10 | Editor | `[Recovery] Runtime fault: ResizeObserver loop completed with undelivered notifications` logged twice on editor load (once on the throwaway, once on the owner site at 900) — never during a Settings action. | Recorded — editor-wide, not Settings. |
| 11 | Dev only | The agentation toolbar sits over the footer's Save at bottom-right and intercepts clicks; the Next dev "N" badge overlaps the role foot. | Not a product defect; hidden in the harness. |

## Walk — what passed (both sizes unless noted)

**Search Mode.** Entry opens a sidebar of only the field (focused) + ✕: Back, title, Overview, groups, workspace doors and role foot all gone. Live results: `pass` 2, `redirect` 5, `dns` 2, `ACCESS` 3 (case-insensitive), `robots.txt` 1, spaces-only → hint, `zzzzqqq` / 200×`x` / `<img src=x>` → "No settings match" (rendered as text). ↑/↓ wrap both ways, Enter opens. Field results land focus on the control (`#access-share-links`, `#seo-robots` — opens the collapsed Indexing card). Esc and ✕ both: clear the query, restore the same current row, nav scroll **168 → 168** at 732 (0 → 0 at 900, nav not scrollable), focus on the Search entry. Escape in Search Mode never closes Settings — from the field, from the ✕, with focus on `<body>`, and while dirty (no guard). Dirty + result on another screen → Unsaved guard; dirty + field on the same screen → no guard, edit kept. Back to canvas is not reachable while Search Mode is up (by design: the header steps away); ✕/Esc first.

**Back to canvas.** `<a href="/edit/<site>">`. Plain click while dirty → guard; Keep editing keeps the edit; Discard closes Settings in place. ⌘-click → new tab at `/edit/<site>` (canvas, no Settings), the first tab keeps Settings and the dirty edit, no guard. Middle-click → new tab at `/edit/<site>`, Settings stays.

**Access.** Purpose line on every state. Toggle on → Password field focused, Save disabled until a non-blank password; toggle off again → clean. Set → "A password is set" + Change / Remove, survives reload. Change → New password focused; Cancel → no write, focus back on Change; whitespace now refused (#2); Change + save → stays set. Remove → "will be off after the next publish", reload without Save restores it; Remove then toggle on → not dirty; Remove + Save → off after reload. Network: no response body carried either typed password or a non-null `publishedPassword` (only `hasPublishedPassword` / `passwordSet` booleans); not in the DOM. One `settings.update` per Save.

**Redirects.** Row Delete → confirm (`Delete redirect /from → /to?`, Cancel focused); Cancel and Escape keep the row and Settings; confirm → row gone + toast with Undo; Undo restores. Edit dialog → Delete redirect → confirm stacks on the dialog: Escape closes only the confirm (focus back on "Delete redirect"), a second Escape only the dialog, Settings stays. The confirm names the stored rule even after the From field was edited. Scrim click does not dismiss the destructive confirm. Double-click on confirm deletes once, no banner.

**Languages.** Owner site: Remove Spanish (0 of 4) → "Remove Spanish? · Visitors won't be able to switch to Spanish."; Cancel and Escape keep it. Throwaway with one `es` translation (`pages.setTranslation`): "1 of 4 page has Spanish translations. They are kept and come back if you add Spanish again." → Remove → gone → re-add Spanish → 1 of 4 again (kept). French added (0 of 4) → short line → Escape keeps it → Remove removes it.

**Regression sweep.** Overview, General, SEO, Domains, Analytics, Form submissions, Custom code, Security headers, Danger zone, Languages, Redirects, Access, Members / Billing / Integrations & webhooks doors: each opens with its title, no alert, console clean (owner site, 732). Save on the throwaway at 900 — General (Author), SEO (robots.txt), Analytics (GA id), Custom code (head), Security headers: edit → "Unsaved changes" → Save → "All changes saved", no banner; restored and saved back.

## Data reverted

Owner site row diffed against a pre-run DB snapshot: identical apart from `updatedAt` (no password, `enabledLocales` `[en, es]`, 0 redirects, name/SEO untouched). Throwaway duplicate soft-deleted (`deletedAt` set; tombstone remains, as every site delete leaves).

## Gates (after `git merge main` @ `eaa257629` → `758523f30`)

The merge touched one Settings file, `components/AddDomainDialog.tsx`, and none of the files fixed here, so the fixes were not re-walked live after it (they were walked on the pre-merge branch at both sizes).

- `npx tsc --noEmit` (editor): **0 errors**.
- Full editor suite: never "alone". Other agents' suites and Playwright held the load average at 110–250, and a single run hit its 50-minute timeout twice. It ran as two batches covering **1246 of 1251 files**: batch 1 has 603 files and 8,901 tests, 9 failed (stopped by the timeout, so there is no summary line). Batch 2 has the remaining 643 files and 3,180 tests, 7 failed. Each of the 11 failing files was then rerun alone. 10 are load flakes and pass: cms.service 60/60, LibraryManager.clone 84/84, LibraryManager 7/7, ssot-scan 26/26, boundary-rules 8/8, ExportEngine.tokenClosure 5/5, BrandWorkspace.draft 2/2, BrandWorkspace.spacingPresets 2/2, CopyButton 1/1, dashboard context-menu-keyboard 2/2. **`src/editor/shell/__tests__/SiteMenu.kbd.test.tsx` still fails alone (1 of 2, a multiple-elements error)**. It comes from main: this branch's diff against main touches only Settings files.
- Settings test files on their own: SettingsTab 64/64, AccessScreen 12/12, RedirectsScreen 40/40.
- `pnpm run verify:ds`: **exit 0**, every gate PASS.

## Not verified

- A full-suite run truly alone, and 5 of 1251 test files (lost at the batch-1 timeout).
- A live re-walk after the merge with main.

- Pro-locked Access (owner workspace is BUSINESS; no plan flip this run) and the read-only role views of these screens.
- Screen readers (only DOM focus and ARIA attributes were read).
- Danger zone actions (opened, not clicked).
- Board-vs-live visual conformance: the batch's own boards are "to update" per the owner overrides; this was a behaviour walk.
- Real browsers other than headless Chromium; Ctrl/Shift-click variants of Back to canvas (only ⌘ and middle).
