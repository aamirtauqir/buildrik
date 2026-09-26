# Gap walk: owner decisions (big items, not built)

These come from [93-gap-walk.md](93-gap-walk.md). Each item needs a product call, or is too big for the fix lane (more than a lane-day, or a new server contract). The sizes are estimates. Nothing here has been built.

## OD-GW-1 · The dashboard offers VIEWERs write doors that the server then refuses (L)

**What the walk saw.** As VIEWER, 30 dashboard doors open their write UI: New site, Create a site, New folder, Rename, Duplicate, Archive, Delete, Transfer, Edit, site tabs Domains/SEO/Redirects/Sharing/Settings, Publish, More › Share draft / Apply template, and the Settings cards Workspace, Team, Plans, Usage, Billing, Domains, Integrations, API tokens, AI and Danger. The user only finds out on submit, through a 403.

The server holds everywhere I checked. Rename, archive, folder, redirect and workspace-update all returned 403 when called as VIEWER, and delete and transfer are OWNER-gated in code. So this is not a leak. It is a UX dead end: the dashboard shows the same doors to every role, while the editor withholds them and says "View only — … need an Editor role". This overlaps audit A03-8 ("VIEWERs are shown Edit everywhere").

**Options.**
- **(a)** Hide write doors per role.
- **(b)** Disable them with the reason, matching the editor's notice.
- **(c)** Leave as is.

**Recommendation: (b).** Build it from one capability map the server already knows. Add a `can` field to `sites.list` / `sites.get` / the workspace context, and a single `useCan(action)` hook, so the dashboard and the editor cannot drift. That makes it about L: a small new read contract, plus touching roughly 15 components.

**The two worst cases are already small fixes for the fix lane:** "Invite teammate" and "Transfer Site" for non-admins (93 #8, #9).

## OD-GW-2 · Where does "Bind to CMS field…" land? (M)

Today the canvas menu row opens the CMS workspace on its collection list. That view covers the canvas and the element being bound (93 #4). Binding actually happens in Inspector › Settings › Collection.

**Recommendation.** Point the row at the inspector's binding section for the selected element. It is size M with no server change, which is why it is also in the fix lane's list. It is logged here too because it depends on the owner picking the canonical binding home (inspector, not CMS).

## OD-GW-3 · Should view mode have a command palette? (S–M)

View mode refuses ⌘K by design (`StudioHeader.tsx:343`). Two things follow from that:
- `CommandPalette` already computes viewer-safe rows (Layers, Assets, History, Activity) that no one can reach.
- The topbar still draws a search field that does nothing.

**Options.**
- **(a)** Hide the field. This is S and is listed in the fix lane (93 #7).
- **(b)** Let the palette open in view mode with the viewer rows. This is S–M and reverses a recorded decision.

**Recommendation: (a)** now, and **(b)** only if viewers are expected to navigate large sites.

## OD-GW-4 · Confirm before Duplicate or Archive on the dashboard? (S)

In the dashboard, Sites ⋯ Duplicate and Archive fire their request immediately. The editor's Duplicate site has a confirm (board 4418:127239, commit 2733aeaca). One product now has two behaviours for the same action.

**Recommendation.**
- Add the same confirm for Duplicate, because it counts against the plan's site limit.
- Keep Archive instant with an Undo toast, because Restore exists.

## OD-GW-5 · Board states with no code screen (backlog; design-ahead, not doors)

These come from `boards.json` rows marked `unreachable`, re-read for this walk. None of them is a door failure, because each door leads to a working surface. They are drawn states the product cannot reach.

| board | state | why unreachable | size if built |
|---|---|---|---|
| 784:4480 | Publish · not-connected | `canPublish` is always true | M |
| 164:42 / 164:57 | Issues · fixing / fix-failed | nothing produces an auto-fix | L |
| 778:4173 / 781:4433 | Components · loading / load-error | the states can never be entered | S |
| 807:8663 | Preview · mobile device frame | PreviewOverlay has no device frame | M |
| 169:92 | Compare · resend-confirm | Compare has no resend action | S |
| 295:1972 / 807:7252 | New page 3-way modal + template picker | Add page creates directly; Templates is the picker | M |
| 927:4474 | Exit · "Leaves the editor" interstitial | site-menu ↗ rows open the dashboard directly | S |

**Recommendation.** Decide per row whether the board is still wanted. If a board is not wanted, retire it in `boards.json` so the conformance harness stops counting it.

## OD-GW-6 · Walk coverage the fixtures did not allow (decision on fixtures, S)

Two areas could only be walked partly:
- **Review-layer doors** were walked as OWNER only, on S3.
- **Agency tabs** were not walked, because doing so means switching the session to Agency WS.

**Recommendation.** Extend `seed-verify.mjs` with the following, then re-run `walk.mjs` for those doors:
- an EDITOR and a VIEWER member in Agency WS;
- a published site, so the Unpublish, View live site and Copy live URL doors render.
