# Lane Lgw: live re-walk (Phase 2)

Date 2026-09-26. App `http://192.168.100.5:3100`, checkout `buildrik-af-verify` HEAD `bfc3e2329`. All Lgw SHAs are ancestors of HEAD: `8a98b2808`, `e3366423d`, `8f0690ae4`, `ef3c355f6`, `d95fea572`, `56c6c7e16`, `6deaba244`, `97f67626d` and `61167ff0f`. DB `buildrik_verify`. Headless Chromium at 1440×900, one browser at a time.

Scripts are in `scripts/audit/verify/lgw-live/`:
- `walk.mjs` is a copy of the gap walker. It writes its results to `lgw-live/results/` and names its screenshots `lgw-gap-*`.
- The targeted probes are `keys`, `insp`, `insp2`, `bind`, `dash`, `misc`, `l1`, `l1h`, `l2`, `l2ctl`, `l3`, `l3ctl`, `l4` and `tok`.

Screenshots are in `verify/shots/LGW-*.png` and `verify/shots/lgw-gap-*.png`.

## Results

| ID | verdict | evidence | notes |
|---|---|---|---|
| GW-1 letter after Esc | PASS | `keys.mjs`: OWNER, EDITOR and scoped each gave u→Esc→u = Publish, u→Esc→h = History and h→Esc→h = History. VIEWER on `?view=readonly`: h→Esc→h = History. The walker's `key-H-after-esc` was `ok` for all 4 roles. VIEWER's blocked "a" put "View only —" in the page text once. Shots: `LGW-GW1-owner.png`, `LGW-GW1-viewer-A.png` | VIEWER A/U stay withheld with the View-only notice, the same as the original walk (ok by the walk's rule) |
| GW-2 column panels with the inspector hidden | PASS | `insp.mjs` (OWNER), with the inspector hidden (column 0 px): History measured 300 px, Issues opened its column at 300 px (text "‹ Inspector · Issues · Open issues: 12"), AI measured 300 px, and H measured 300 px. After closing each one the column went back to 0 px, so the inspector stayed hidden. The walker's `insp-hidden-history` was `ok` for OWNER, EDITOR and scoped. Shots: `LGW-GW2-1/2/3.png` | |
| GW-3 Hide inspector no-return | PASS | Hiding shows the "Inspector hidden" toast with a **Show** button. Show brought the column back (0 → 300 px, 5 sections). `buildrik-inspector-shown` is never written (null). After a reload the column was 300 px with 5 sections (`insp2.mjs`). The walker was `ok` for all 3 roles. Shots: `LGW-GW3-1/2/3.png` | |
| GW-4 Bind to CMS field… | PASS | `bind.mjs` (OWNER, EDITOR, scoped): the action lands on Inspector › Content. The section is in view (top 229 px), the Source radios are visible, focus is inside the section, and the CMS workspace is not opened. Choosing "From CMS" shows the picker: Collection (Posts) and Field ("Choose a field…", Title). Shots: `LGW-GW4-*-default.png`, `LGW-GW4-*-picker.png` | The walker reports `wrong-destination` only because its old text regex (`/Bind\|bind\|field/`) does not match the new destination. The Content section is correct. The reveal tint was not caught: it is transient and my class-name probe missed it |
| GW-5 Layers Copy link on http | PASS | The walker was `ok` for all 3 roles: toast "Link copied — opens the editor with this element selected", 0 pageerrors. Failure path (`misc.mjs`, `execCommand` forced to return false): toast "Couldn't copy the link" with the URL in the toast, 0 pageerrors. Shot: `LGW-GW5-fail.png` | `isSecureContext=false`, no `navigator.clipboard` |
| GW-6 History › Published `<div>` in `<p>` | PASS | The walker was `ok` for OWNER, EDITOR and scoped. The v1–v5 rows render, and there are 0 console errors and 0 pageerrors on that door | |
| GW-7 VIEWER topbar search | PASS | VIEWER header: "Search pages, layers, assets" appears 0 times and there is no ⌘K field. What remains is the Layers context search "Search layers… ⌘F". It works: 7 rows before, 0 after a no-match filter, and no palette opens. Preview is present and Publish is shown **disabled**. Shots: `LGW-GW7-viewer*.png` | The walker's `tb-search` = `absent` is the fix itself (its testid now belongs to the context search) |
| GW-8 Invite teammate for non-admins | PASS | Home quick action (`dash.mjs`): for EDITOR, scoped and VIEWER it is a disabled `<button>` titled "Only workspace admins can invite teammates.", and clicking it keeps you on `/dashboard`. For ADMIN and OWNER it is an `<a href=/dashboard/settings/team>`, and a click reaches `/dashboard/settings/team`. The editor site menu row "Invite teammates" is absent for EDITOR and present for ADMIN. Shots: `LGW-GW8-*.png` | |
| GW-9 Transfer Site for non-owners | PASS | Sites ⋯ on Verify Site One: EDITOR, scoped, VIEWER and ADMIN see no "Transfer Site" row. OWNER (the creator) sees it. Shots: `LGW-GW9-*.png` | Every verify-WS site was created by OWNER, so "OWNER on a site another member created" was not exercised |
| GW-10 /edit without access | PASS | scoped → `/edit/<S2>` returns HTTP **200** and the page reads "You don't have access to this site / This site may have been deleted, or you don't have access to it. Ask a workspace admin to add you." Its "Back to sites" link goes to `/dashboard/projects`, and the click landed there. 0 canvas elements. Shot: `LGW-GW10-scoped.png` | The title is not an h1 or h2 element (no heading role) |
| L-1 canvas links never navigate | PASS | `l1.mjs`, OWNER, S2 Home link `link-28` (`href=/services`). A plain click, a middle click and Enter on the focused link were each tested in 5 states: desktop, mobile, device frame on, frame off, and frame on again. All 15 kept `/edit/<S2>`: 0 main-frame navigations, 0 document or `/services` requests, 0 popups, 0 saves. A window listener saw the link click with `defaultPrevented=true` (`l1b.mjs`). Shots: `LGW-L1-desktop.png`, `LGW-L1-frame-on*.png` | Inline caret, via `l1h.mjs`: with the link in inline edit (Inspector "Edit text on canvas"; `contentEditable`, active = `link-28`), a click on character 6 left a collapsed caret at offset 6 inside the link text. So the caret does land. See "Found on the way" for the edit ending on that click |
| L-2 demote mid-session, read-only switch | PASS | `l2.mjs`: EDITOR opens S1, the DB role is set to VIEWER, then an edit and Ctrl+S. **5 of 5** runs landed on `/edit/<S1>?view=readonly` with **0** `dialog` events and no "Leave site?". `saveProject` returned 403 each time. The role was restored to EDITOR (DB confirmed). Harness control (`l2ctl.mjs`): a dirty EDITOR navigating away raised a `beforeunload` dialog, so the listener works. Shot: `LGW-L2-readonly.png` | |
| L-3 page switch sends no save | PASS | `l3.mjs`: OWNER S2, 4 page-tab switches (Services/Home ×2), then 10.5 s wait: **0** `saveProject` requests, 0 tabs marked unsaved, and the save pill stays `save-status-saved`. Control (`l3ctl.mjs`): a real edit fired 1 `saveProject` within 10 s. Shot: `LGW-L3.png` | |
| L-4 Layers Delete key | PASS | `l4.mjs` (OWNER S1, saves aborted): Delete on the focused unlocked row `section-15` removed it (14 → 9 canvas elements, target gone), and ⌘Z restored it. On the locked row the count stayed 14 → 14 and the toast "Locked · Unlock" appeared. Delete and Backspace in the rename input left 14 → 14. Delete and Backspace in the Layers search ("Search layers…", with a row selected) left 14 → 14. The lock was undone afterwards. Shots: `LGW-L4-1/2/3.png` | Not checked: the 2-row multi-select confirm |
| L-5 /share has no hidden-page bindings | PASS | Temporary DB state on S1: `contact` page `settings.visibility="hidden"`, plus 2 bindings. `heading-21` (on contact) had the marker slug `lgwhiddenslug`; `heading-1` (on home) was the control, with slug `title`. `GET /share/<S1 token>` returned 200 (34 KB). In the payload, `lgwhiddenslug` 0, `heading-21` 0, "Contact" 0. `projectCmsBindings` contains only `heading-1` (control present), so the absence is not the harness. **Restored:** settings back to JSON `null` and bindings back to `{"field":{},"collection":{}}`; page `md5`/`updatedAt` are the same as the baseline | |
| 7 dashboard copy (API token) | PASS | `tok.mjs`, OWNER, `/dashboard/settings/api-tokens` on http (`isSecureContext=false`, no `navigator.clipboard`). Copy works: the label went to "Copied" and the `copy` event carried exactly the token. Copy fails (`execCommand` forced false): the label stays "Copy", a `role=alert` says "copy it by hand", and the token is still shown. 0 pageerrors. Both test tokens (`lgw-verify-works`, `lgw-verify-fails`) were revoked through `apiTokens.revoke` (200; DB `revokedAt` set). Shots: `LGW-7-works.png`, `LGW-7-fails.png` | The rows stay, marked revoked (revoke does not delete) |
| 8 Bind with AI open or inspector hidden | PASS | `bind.mjs` OWNER: **AI open** (⌘J, `ai-panel` present) → Bind: AI closed, the column is 300 px, the Content section is in view with Source visible and focus inside. **Inspector hidden** (column 0) → Bind: the column is 300 px and the same holds. **History open**: same result. Shots: `LGW-8-ai.png`, `LGW-8-hidden.png` | From CMS → Collection/Field picker verified in the default state |

**Counts: 17 PASS · 0 FAIL · 0 BLOCKED · 0 HARNESS?**

## Found on the way

- **A click inside the element being inline-edited ends the edit.** This is not specific to L-1.
  - For both the S2 h1 (`heading-25`, no link) and the link, a mouse click on the text in edit mode was followed by `blur` / `focusout`, and `contentEditable` went false (`l1g.mjs`, `l1h.mjs`).
  - The caret offset was set first, and then editing ended.
  - This may be the harness (Playwright `mouse.click` after `dblclick`). It is worth one manual check in a real browser.
- **The selection toolbar covers a small selected element.** Once `link-28` (97×20) is selected, the selection toolbar sits over most of the link text: only 2 of 19 sample points on the link's midline stay exposed.
  - That is why a plain double-click on the link reached the toolbar and not the text.
  - Shot: `LGW-L1-caret-link.png`.
- **Console noise, the same as the original walk:**
  - React's "style property … shorthand/longhand" warning appears on every hide-inspector door.
  - `[Recovery] Runtime fault: ResizeObserver loop` appears for VIEWER.
- **S2 Home holds extra content from earlier lanes.** It has "Second seeded site…" repeated and an extra "Heading". This was present before this run (the `md5` is the same as the pre-run baseline), so it was left alone.

## Not verified and why

- **GW-9, OWNER on a site another member created.** No such site exists in the verify WS (every site has `createdBy` = OWNER). I did not create one.
- **GW-4 / 8, the reveal tint.** It is transient and was not captured; scroll and focus were measured instead. The held focus request lapsing (500 ms, or on a selection change) was not exercised.
- **L-1, a canvas form submit.** Not exercised; only link click, middle-click and Enter were.
- **L-4, the multi-select (2 rows) confirm dialog.** Not exercised.
- **GW-5 / 7, real clipboard contents.** Checked through the `copy` event payload, not by reading the OS clipboard, which headless Chromium cannot do.
- **Roles.** ADMIN was used only as a GW-8 control, and DESIGNER / outsider were not walked. Nothing was walked below 1440 px.

## State restored

- editor@ membership role is EDITOR (DB confirmed after the L-2 loop).
- S1 and S2 `pages` (`md5(blocks)`, `updatedAt`) and `sites` (`updatedAt`, `lastEditedAt`) are the same as the pre-run snapshot. S1 `projectCmsBindings` is back to `{"field":{},"collection":{}}`, and contact `settings` is back to JSON `null`.
- Editor checks that edited (L-2, L-3 control, L-4) either had their saves refused (403) or aborted at the network layer.
- The 2 test API tokens are revoked. The auth storageState files were not rewritten.
