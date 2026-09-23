# Settings · Clone S5 — backend delta (for the founder's "go")

Phase: **S5 odd ones** — the four frames outside the Settings pane's screens: `3397:14146` Permissions
(976×788) · `3397:38740` S3.7 page-settings SEO · `3397:32906` S7.2 Branding pointer (720×560) ·
`3397:32144` Export (REFERENCE, superseded by the Export modal — record only). All four shots are
cached (0 calls). **No migration, no new server surface** — every fact the frames draw is already in
the product; the phase is client work + records. Nothing is built until this doc is approved (Q3c).

## 1. What the frames need vs what the code has

| frame | the frame draws | code today | delta |
|---|---|---|---|
| `3397:14146` **Permissions** — `Permissions — signed in as a VIEWER` · `Viewer access lets you inspect the work. Editing, publishing, uploading and applying templates require editor access. Each unavailable action explains the role it needs.` · eight rows, each an action button (disabled tint where refused, primary where allowed) + a black chip naming the rank (`Editors can edit` · `Allowed — read-only` green · `Editors can publish` · `Editors can send` · `Editors can upload` · `Only an admin can invite` · `Only the workspace owner can delete a site` · `Viewers cannot apply templates`) + a one-line reason | `useEditorRole()` (VIEWER · EDITOR · DESIGNER · ADMIN · OWNER from `RoleService.fetchMyRole`), `roleAtLeast`, the P6 refusals already in the topbar (`publishBlocker`), the Members row; V1's own two "Reference Permissions" frames (59:2, 396:3777) are out-of-scope records | **client**: a `Permissions` dialog (976 wide, the Clone's rows) reached from the Settings sidebar's foot — `Signed in as a <ROLE>` · `Permissions` link (drawn for every role; the matrix's chips and tints follow the role: an EDITOR sees `Allowed` on edit / publish / send / upload and the admin / owner rows refused). The rank table is one static map (`action → minimum role → chip copy → reason`) in `settings/permissions.ts`, mirrored from `server/trpc/trpc.ts` / `checkWorkspaceRole` usages — the server enforces, the dialog explains (the hook's own rule). No server change: the role is already fetched. |
| `3397:38740` **page-settings SEO** — the S3.7 drawer `Page settings — About` · `SEO · Social · Advanced` · `URL slug` · `Meta title · page override` · `Meta description` · `Search indexing` (`Indexed · shown in search`) · `Done` · the URL-change line `URL changed to /about-us. Add a redirect from /about to keep existing links working.` · `Add redirect` · `These overrides affect About only.` | the Pages drawer (`PageSettingsDrawer` + `SeoTab`) with the S3 offer strip (`URL changed from /<old> to /<new>. Add a redirect so old links keep working?` · `Add redirect` · `Not now`) | **client**: reconcile the copy — the Clone's line is the LATER frame (`URL changed to /about-us. Add a redirect from /about to keep existing links working.` + `Add redirect` link + `These overrides affect <Page> only.` foot) → the S3 strip takes it (`Not now` stays as the dismiss — the frame draws none, a strip with no dismiss sticks); `Search indexing` as a select `Indexed · shown in search / Hidden · noindex` where the tab draws a toggle today (confirm in the walk); the frame's `Done` closes the drawer (exists as ✕). The rest of the drawer (score block, checks grid, Social, Advanced) is the Pages family's, outside this section. |
| `3397:32906` **Branding pointer** — `‹ Settings · Branding` · card `Brand lives in the Brand panel` · `Fonts, colors, logo and design tokens are edited in one place so nothing drifts.` · `Open Brand panel` · `SSOT: one canonical home for brand data (Brand drawer tab). Settings row is a pointer, never a second editor. Supersedes the full field-map drawing.` | S1 made the `Fonts & colours` row a DOOR (`onOpenDesignTab`) — no screen at all | **client, small**: the row stays a door (the frame's own note says pointer, never an editor); the frame's card is what the Search result and the Overview's `Fonts & colours` `Open ›` land on when the Brand panel cannot open (no `onOpenDesignTab`, i.e. the standalone :5050 shell) — otherwise the door. Recorded as `match` for the door + the card only as the fallback. Nothing on the server. |
| `3397:32144` **Export** (REFERENCE · superseded) | the Export modal via `ui:open-exporter` (S1) | **record only** — already `superseded:board:clone-3397:32144` in S1's rows; this phase closes the row with the modal's live shot. |

## 2. Migrations
None.

## 3. New / changed server surface
None. (`RoleService.fetchMyRole` already answers the role; `siteDetail.settingsOverview` already
names the seat count.)

## 4. Seed + fixtures
No seed change. The walk needs a **VIEWER** and an **EDITOR** session on the scratch site: the seed
already puts a second member on the workspace (`2 of 1 seats used` on FREE — S1); the walk signs in
as that member (its credentials are the seed's — B adds a `--print-members` flag that prints the
emails only, never passwords; the passwords are the seed's known fixtures) and flips its role with
one Prisma update, reverted after.

## 5. Open questions (decide with the "go")
1. **Where the Permissions dialog opens from.** The frame has no door. Proposed: the Settings
   sidebar's foot (`Signed in as a VIEWER · Permissions`) for every role — or only when the role is
   below EDITOR (the frame is drawn for a VIEWER)? Recommended: every role — an admin wants to see
   what a viewer sees before inviting one.
2. **`Search indexing` control** — the Clone draws a select with sentence values (`Indexed · shown in
   search`); the drawer has a toggle. Conform to the select (Clone wins visual), or keep the toggle
   (one control fewer to explain)? Recommended: the select.
3. **The Branding fallback card** — build it (only visible in the standalone shell) or record the
   door as the whole implementation? Recommended: build; it is one card and the Search result needs
   a landing when there is no panel.
