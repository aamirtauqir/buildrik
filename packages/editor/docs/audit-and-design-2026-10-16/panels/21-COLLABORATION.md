# Panel 21 — Collaboration (multiplayer editing): functionality specification (FD-PNL-21)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by Phase A: ⛔ MP-3, MP-4, MP-5 · Phase B: ⛔ MP-1, MP-2, MP-6, MP-8 · not VERIFIED.** Independent design-qa-critic review: pass 1 PROPOSAL (4 blocking) + 12 notes — fixed 2026-10-17; pass 2: 1 blocking fixed 2026-10-17. Runtime NOT RUN; geometry NOT MEASURED. Written from a source read (file:line below). *(DS)* = designer-selected; owner standing instruction 2026-10-17 accepts designer recommendations — owner decisions **OD-CL-n** are decided as recommended (SC-22, §14). Panel 00 (SC-1…SC-22) wins on conflicts.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): V7 (People popover 360), S2 (Get latest → Reload latest consequence confirm); FINAL §4 item 6 (CS-08, CS-10); gap rows D3-15, D3-21.
Governing IA: **IAF-19** (notifications, comments and collaboration — `evidence/ia-final-2026-10-16/module-specifications.md:1015`; "presence ≠ save/lock", T-IAF19-5/-6), **IAF-22** (saving, conflicts, recovery — `:1185`; FI-04 / P1-D19 collaboration-safe recovery), Panel 01 §5.6 (presence cluster), Panel 11 (bottom status, SC-4), Panel 07 (CMS record conflict), Panel 10 §5 (Site settings concurrent-edit guard C-2), Panel 09 (Brand), SC-14 (document Lock), SC-18/SC-20 (plans), 00-STRATEGY §3 (secondary user: small-agency teammates; §8 lists multiplayer as "Later").
Flag: `NEXT_PUBLIC_FEATURE_COLLAB` — **planned, not dead** (owner 2026-09-21). Designed in full; shipped only behind the flag.

---

## 1. Purpose and boundary
Collaboration answers: **"Who else is here, what are they touching, and is my work safe while they are?"**

Job: J1 Build (with teammates; also J3 maintain) — 00-STRATEGY §3 *(R-1018)*
- In: presence (who, where), connection state, remote cursors and selections, "editing now" indicators and the text-typing notice, Follow, the merge model as the user experiences it (conflicts, remote deletes), undo in a shared session, save status while shared, reconnect/resync, revoked access, limits, privacy.
- Out (linked): inviting members and roles — **dashboard Team page** (D7 deferred); comments and review rounds (IAF-17, Review task); notifications (bell, IAF-19); other-tab notice (`useOtherTabNotice.ts`, same-browser only — kept separate per IAF-19 D); document Lock / Unlock (SC-14 — a document property, not presence); Site settings' own Save guard (Panel 10 §5 — this panel only supplies its presence banner).
- Not in scope: voice/video, chat, branching, per-element permissions — §10.

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
Editor paths under `packages/editor/src/`; server paths from repo root. `sse route` = `packages/dashboard/app/api/sse/collab/[siteId]/route.ts`; `ops route` = `packages/dashboard/app/api/collab/[siteId]/ops/route.ts`.

| ID | Area | Today |
|---|---|---|
| CO-01 | Flag | `FEATURE_COLLAB = (VITE_FEATURE_COLLAB ?? NEXT_PUBLIC_FEATURE_COLLAB) === "true"` (`shared/utils/runtimeEnv.ts:98-99`). Server kill switch `isCollabEnabled()` reads the same var (`server/services/collab.service.ts:28-30`); both routes 404 when off (`ops route:20`, `sse route:32`). `runtimeEnv.ts:95-97` "DEMO-ONLY (last-write-wins…)" is **inaccurate** (root CLAUDE.md corrected) — see CO-11 |
| CO-02 | Entry | Manual: site menu ⋯ › Collaborate › "Start collaboration" (`shell/SiteMenu.tsx:219-231`; disabled "Planned" row when flag off) and ⌘K "Start collaboration session" (`shell/modals/CommandPalette.tsx:307-317`). No automatic join; no Leave control |
| CO-03 | Session | `startSession(siteId, name)` → `SSETransport` + `joinRoom(siteId)` (`engine/collaboration/CollaborationManager.ts:194-197`); room = site |
| CO-04 | Identity | Random `user-<time>-<rand>` id per join (`CollaborationManager.ts:807-809`); name `currentUser?.name ?? "Editor"` where `currentUser` is the not-yet-joined collab user (`shell/StudioHeader.tsx:622`); ⌘K passes `"Editor"` (`CommandPalette.tsx:315`). Server stores `authorId` (`ops route:66`) and sends it (`sse route:116`); the client ignores it |
| CO-05 | Transport | Outbound `POST` per event (`SSETransport.ts:86-99`, failures dropped `:95-98`); inbound EventSource `?since=lastSeq` (`:42`), own echo skipped by `clientId` (`:60`). Server: DB op log `CollabOperation` (`prisma/schema.prisma:1557-1572`); `hello` carries the head seq (`sse route:76`) — "fresh client — gets head via hello" (`collab.service.ts:92`) — but the client's `hello` listener ignores its data (`SSETransport.ts:46-54`), so `lastSeq` stays 0. Poll every **1.5 s** (`sse route:14`), role re-check every 15 s → `revoked` (`:18,99-109`), 30-min cap (`:21`), `resync` when ops pruned (`:80-84`). Retention 24 h (`collab.service.ts:14`) **and** a 7-day cron (`app/api/cron/ephemeral-purge/route.ts:20`) |
| CO-06 | Validation / limits | Envelope Zod schema, 11 event types incl. unused `ping`/`pong`, 1 MB per op, prototype-key guard (`packages/shared/schemas/collab.ts:18-71`); 1500 ops/min per user per site (`ops route:10-11,58-64`); batch 200 (`collab.service.ts:10`) |
| CO-07 | Permission | Both routes require **EDITOR** (`ops route:28`, `sse route:40`) — viewers neither appear nor see others. `revoked` does not say whether the user was demoted or removed (`sse route:105`) |
| CO-08 | Presence UI | Topbar `Presence` (Figma 692:472): ≤2 avatars + "+N", pill "N editing" / "Reconnecting…" / "Offline"; renders nothing only when solo **and** live — solo Reconnecting/Offline still shows the pill (`chrome-ui/Presence.tsx:42-46,67-69`; `StudioHeader.tsx:803-826`, max 2). No click. Dev builds show unlabeled mock "You" + "Ana" (`collaboration/PresenceIndicators.tsx:34-57`) |
| CO-09 | Roster | Joiner broadcasts `join` (`CollaborationManager.ts:171-177`); peers do not answer; frames from users not in the room are dropped (`:644-660`). Because the first poll replays the **whole retained log** (CO-05), a joiner "learns" everyone who joined in the last 24 h–7 d — **alive or dead** — while anyone whose `join` was pruned stays invisible. No heartbeat (`ping`/`pong` unused), no leave on tab close |
| CO-10 | Initial sync | Joiner sends `sync_request`; "host" answers with the whole project (`:726-738`). Every joiner sets `host = self` (`:163-169`), and `handleSyncResponse` imports any `sync_response` it receives (`:744-761`) — including old ones replayed from the log |
| CO-11 | Merge | Edits recorded as JSON patches and broadcast when connected (`engine/HistoryManager.ts:243-251,300-330`). Remote ops reach every client **in server seq order**, but the author's own op is applied optimistically and **never re-placed at its seq**: remote ops are transformed against pending own ops with **"remote wins"** on the same path (`engine/collaboration/OTEngine.ts:256-315`), so two concurrent writes end opposite on the two clients — not last-write-wins. Divergence event (`:121-150`) has no subscriber. Acks never arrive (own echo filtered) → pending ops cleared only by a 30 s timeout (`OTEngine.ts:25,57-90`) |
| CO-12 | Scope of sync | Snapshot = element tree + design tokens/presets/dark mode only (`HistoryManager.ts:378-396`): **Brand tokens sync; Site settings and page metadata do not**. CMS records are server rows with their own CAS (`server/services/cms.service.ts:173-192`) |
| CO-13 | Save while shared | Whole-project save, tRPC, CAS on `expectedLastEditedAt` (`services/BuildrikSyncProvider.ts:54-57,854,864`); refusal → `ConflictModal` "This site changed somewhere else" — Reload latest / Save backup / Overwrite, no Overwrite on brand-format conflict (`shell/modals/ConflictModal.tsx:7-12,70`). **No save is announced to other sessions** |
| CO-14 | Undo | Own stack only; remote ops applied unrecorded (`HistoryManager.ts:333-350`); undo restores a snapshot rebuilt from the own stack (`:516-569`), not broadcast |
| CO-15 | Cursors | Mouse position relative to the canvas rect, throttled 50 ms (`canvas/hooks/useCursorSync.ts:70,104-106`); overlay arrow + name label (`canvas/overlays/RemoteCursorsOverlay.tsx`, mounted `CanvasOverlayGroup.tsx:354`); `zoom` ignored (`void zoom`); no page/breakpoint; raw-hex colours incl. indigo (`CollaborationManager.ts:38-47`) |
| CO-16 | Selection / editing / soft locks | Selection broadcast (`engine/Composer.ts:417-440`); `notifyEditing`, `acquireLock` (5 s expiry), `getEditorsForElement` exist (`CollaborationManager.ts:290-475`) — **no caller, no UI** |
| CO-17 | Other tab | BroadcastChannel toast "This site is open in another tab" (`shell/hooks/useOtherTabNotice.ts:18-44`) |
| CO-18 | Plan | No collab plan gate; seats `teamMembers` Free 1 · Pro 5 · Business 25 (`lib/constants/plan-limits.ts:31,52,73`) — on Free there is nobody to collaborate with |

## 3. Problems this design solves (00-STRATEGY: agency teammates, job 1 "build" and job 3 "maintain"; IAF-19/22)
1. **Work can be silently overwritten or diverge** — a joiner replays and re-applies the whole retained log, old projects included (CO-05/CO-10); merge is not convergent (CO-11); undo can revert peers (CO-14). The UI never says so.
2. **Shared editing collides with the save model** — peers stale each other's CAS baseline, and nobody is told that someone saved (CO-13).
3. **People are unidentifiable** — everyone is "Editor" (CO-04).
4. **Presence lies** — dead people appear, live people whose join was pruned do not, tab-closers never leave, cursors land wrong (CO-09, CO-15).
5. **No awareness of touch points** — no remote selection, "editing now", or follow (CO-16).
6. **A ritual to start** that teammates must each remember (CO-02).
7. **Viewers are invisible and blind** (CO-07); Panel 10's banner needs a presence location that does not exist.

## 4. Target layout
Two phases *(DS; OD-CL-1)*: **Phase A "Presence"** — who is here, where, what they select/edit, Follow; edits still reach others only through **save + reload** (no live op merge; the op channel is not used for edits). **Phase B "Live editing"** — edits appear for others within ~2 s. Each phase ships only when its ⛔ rows (§11) are done.

### 4.1 Topbar presence cluster (Panel 01 §5.6 — Keep + NEW popover)
Position (TB-07) and ≤2 avatars + "+N" unchanged. Pill *(Change)*: Phase A "**N here**" (count includes you, as today); Phase B "**Live**"; "Reconnecting…", "Offline" unchanged. Solo: no cluster while connected; Reconnecting/Offline pill still shows alone (Keep, CO-08). Click opens **People** (NEW, **360** wide *(R-1018, V7 popover widths 240/280/360; was 320)*, anchored, bounded height, body scroll):
```
┌ People on this site ──────────────────────── ✕ ┐
│ ● Live · changes reach others in about 2 s       │  (Phase A: "Edits reach others when saved")
│ ─────────────────────────────────────────────── │
│ (SA) Saqib (you) · 2 tabs  Editing · Home        │
│ (AN) Ana  Editor     Editing · Menu · Tablet     │ Follow  ›
│ (JO) Jo   Viewer     Viewing · Home              │ Follow  ›
│ (MK) Mo   Admin      In CMS · Blog › "Spring…"   │ Go there ›
│ (RZ) Riz  Editor     Idle 6 min · Site settings  │
│ ─────────────────────────────────────────────── │
│ [ ] Hide my cursor           Manage members ↗    │
└──────────────────────────────────────────────────┘
```
- Row = avatar (initials fallback) · **account name** · role chip · **location** (area · page or record · breakpoint, SC-11 area names) · action. Idle after 5 min without input *(DS)*.
- **Location redaction** (N6): a location in an area the viewing person can't open shows the **area name only** ("In CMS") — no record title, no screen name.
- Actions: **Follow** (person in Editor), **Go there ›** (other areas, SC-1 direct navigation) — **hidden** when the viewing person can't open that area (viewer: CMS, Brand, Components, Site settings — SC-6). No action implies permission or lock (IAF-19 D).
- **Same account in several tabs/devices** (N9): one row, "(you) · 2 tabs", location of the most recently active tab; my other tab's cursor is not drawn, its selection shows as "You · other tab". The other-tab toast (CO-17) stays.
- States: loading "Finding people…"; failed "Couldn't load people — Retry" (Retry reconnects presence, never saves — IAF-19 H); a person who times out disappears and the list announces "Ana left".
- **Hide my cursor** (NEW, privacy, per user, local preference). **Manage members ↗** → dashboard Team page (ADMIN+ only). Dev mock users labelled **"Demo"** (IAF-19 H).
- ≤1280: cluster folds into "People & notifications" (Panel 01 §8 compact); pill state goes into its accessible name and a dot; **Reconnecting/Offline never hidden**.

### 4.2 Canvas (Panel 05 delta)
```
            ┌───────────────── (AN) Ana · editing ┐  ← name tag, always shown, initials badge
            │  Fresh pasta, every day              │  2px outline in Ana's tone (not the blue ring)
            └──────────────────────────────────────┘
                     ↖ (AN) Ana                         ← remote cursor: arrow + initials + name
```
- **Remote selection** (NEW): 2px outline + name tag in the person's tone; "· editing" while they type or change a field on it. Only for people on the **same page and breakpoint**. My blue selection ring wins where they overlap.
- **Remote cursor** (Fix): page coordinates (MP-11); same page + breakpoint; hidden for Hide my cursor; fades after 10 s still *(DS)*; max 10 drawn, beyond that "Cursors hidden · 12 people here" in People.
- **Identity** (N8): one source — the avatar tone (`toneFor(id)`, `Presence.tsx:36-40`) drives avatar, cursor, outline, tag. There are **5 tones, so colours repeat** beyond 5 people; the **name tag and initials badge are always on**, so identity never depends on colour. Tag text meets 4.5:1 on its tone. (Fix CO-15 raw-hex list incl. banned indigo.)
- Layers: 6px tone dot on rows others have selected; tooltip "Selected by Ana".

### 4.3 "Editing now" and the typing notice (advisory — IAF-19 D kept)
- Wording is **"editing"**, never "locked" ("Lock" = SC-14).
- Selecting an element someone is editing: Inspector header line "**Ana is editing this.** If you both change the same setting, the later change wins."
- **Inline text** *(DS; OD-CL-5)*: double-click on a text element Ana is typing in (Enter on a selection is keyboard resize — C4 / Panel 05 *(R-1018)*) opens a small **advisory prompt** (not a confirm — SC-15 advisory-prompt exception *(R-1018)*) "**Ana is typing here.** Editing at the same time can lose text." **[Wait] [Edit anyway]** (default focus Wait; Esc = Wait). The notice lapses 5 s after her last keystroke (existing `LOCK_TIMEOUT`, `CollaborationManager.ts:71`). Nothing is refused, so presence still never blocks (IAF-19 D, T-IAF19-5).
- Move, style, delete: advisory line only.

### 4.4 Follow mode (NEW)
- Start: People › Follow, or click a canvas name tag. My view takes their **page, breakpoint and selection** (and after MP-9 scroll + zoom).
- Frame: 2px border round the canvas viewport in their tone + top bar "**Following Ana** · Stop". My Inspector shows the followed selection read-only until I click the canvas.
- Stops on: Stop, **Esc**, own edit, own scroll/zoom, own page switch, Ana leaving ("Ana left — stopped following"), or Ana leaving the Editor ("Ana went to CMS — stopped following · Go there", Go there hidden per §4.1 rules) (N9).
- Esc: new step in the Panel 05 canvas ladder **after exit comment mode, before select parent / clear selection at page root (SC-2)** (SC-10 amendment, §15).

## 5. Flows
### 5.1 Joining and leaving (Change CO-02/CO-09)
- Flag on and role ≥ EDITOR (VIEWER after MP-7): opening the editor **joins presence automatically** *(DS; OD-CL-2)*. The ⋯ menu row "Start collaboration" becomes **"People on this site…"**; ⌘K the same. Flag off: disabled "Start collaboration — Planned" row stays (Panel 01 §6 and §9).
- Join returns the **current roster** from the presence channel (MP-4) — only people connected now. The op log is never used for presence (Fix CO-09). Leave on tab close; missed heartbeats remove a person after 30 s *(DS)*.

### 5.2 Edits reaching others
| | Phase A (Presence) | Phase B (Live editing) |
|---|---|---|
| My edit | saved as today (autosave, CAS) | sent as an op; others see it within ~2 s |
| A peer saved | **with MP-12:** non-blocking banner "**Ana saved changes** · Get latest" — shown in the **Panel 22 banner slot, entry (8a) Teammate change** (never a separate notice) *(R-1018, D3-21 / CS-08)* — Get latest makes a backup of my unsaved edits first, then Reload latest with Panel 22's **consequence confirm** (SC-15 class b, S2) *(R-1018)* (IAF-22 G). **Until MP-12:** no banner; my next save meets the existing ConflictModal | not shown |
| Same setting changed by two | later save → ConflictModal (Keep) | **server order wins** for everyone (MP-1); if my value from the last 10 s was replaced: Panel 22 banner **(8a) Teammate change** "**Ana changed Padding after you · Undo**" (Undo = my own undo stack, §5.3) *(DS; R-1018: banner, not toast — Panel 22 §5.10 toasts report only my own actions)* |
| Peer deletes what I'm editing | arrives at Get latest / conflict | selection clears; Panel 22 banner **(8a) Teammate change** "**Ana deleted Hero** — your change to Padding (24 px) wasn't applied" *(R-1018: was a toast)* (N7: the lost property and value are named; nothing else of mine is lost) |
| Peer deletes the page I'm on | — | page switches to Home; Panel 22 banner **(8a) Teammate change** "Ana deleted the page Menu" *(R-1018: was a toast)*. "Recently deleted ›" as its action only after that SC-9 row ships — **until then the sentence only** (the deleter has their own Undo toast, SC-15 fallback) (N10) |
| Peer applies a Brand starter/import | — | banner "Ana applied the starter 'Bold' to Brand" + "Review changes ›" (Panel 09) — Panel 22 slot, entry (8a) *(R-1018, D3-21)* |
- Joiner state always **from the server** (saved revision + ops after it; first stream position seeded from `hello`, MP-2/MP-5) — never from another browser and never by replaying old log entries (Fix CO-05/CO-10).

### 5.3 Undo in a shared session
- **Undo and redo affect only my own changes**: undo is sent as the inverse op; peers' later changes stay.
- If a peer has since changed the same thing, that step is **skipped**: "Can't undo — Ana changed this after you", and undo moves to my next step *(DS; MP-8)*. Remote changes never enter my history.
- Phase B stays off until MP-8 (CO-14 would revert peers).

### 5.4 Save status (SC-4, Panel 11)
- Priority unchanged: **Conflict › Save failed › Offline › Saving › Unsaved › Saved**.
- Phase B: "Saving…" while any own op is unacknowledged (MP-6); "Saved" only after the server ordered it; a refused op (403/413/429/invalid) → **Save failed — Retry** with reason in Details ("Too many changes at once — retrying", "This change is too large to share").
- "Live" is the channel, never "saved" (IAF-19 T-5).

### 5.5 CMS, Site settings, Brand
- **CMS** (Panel 07): record CAS stays authoritative. People shows "In CMS · Blog › {record}" (redacted per §4.1); a record open elsewhere shows the avatar on its row and the form banner "**Mo is editing this record** — the later save gets 'Changed elsewhere — Review'" (existing Panel 07 conflict copy).
- **Site settings** (Panel 10 §5, C-2) — two layers *(resolves B4)*:
  1. **Read-compare-write on Save — always**, flag-independent, owned by Panel 10 (not by presence). This is the mandatory interim guard.
  2. **Banner** "{name} is also editing Site settings — the last save wins" — **only when presence is available** (flag on + MP-4). With the flag off or presence down, layer 1 alone applies.
- **Brand**: tokens sync with the document (CO-12); People shows "In Brand"; Brand header "Ana is in Brand" while two people are there.

### 5.6 Offline, reconnect, resync, access change (IAF-22)
| Event | Pill | Canvas / status |
|---|---|---|
| Stream drops | Reconnecting… (polite) | remote cursors/selections fade; my edits continue |
| Offline > 10 s | Offline (**silent** — the one polite offline announcement is Panel 22's banner 6; no assertive duplicate) *(R-1018, D3-15 / CS-10)* | "Offline — will save when back online" (A, CS-12 vocabulary *(R-1018)*) / "Offline — N changes waiting" (B, MP-6) |
| Reconnect | Live | resumes from the last seen seq; no duplicate apply (MP-5) |
| Ops pruned (`resync`) | Reconnecting… | "**Getting the latest version…**" — unsent changes kept as a backup first, then reload latest; never a silent replace |
| **Demoted to Viewer** | — | Panel 22 §5.5 / §5.7 surfaces and copy → view mode (SC-6); unsent changes → Download backup |
| **Removed from site** | — | Panel 22 §5.5 / §5.7 surfaces and copy, with Download backup (N5; needs the reason in `revoked`, MP-5) |
| Signed out | — | SC-18 re-sign-in; presence resumes |

## 6. States, permissions, plans
| State / role | Behaviour |
|---|---|
| Flag off | nothing collab shows (Keep `StudioHeader.tsx:292-296`); menu "Planned" |
| VIEWER | after MP-7: "Viewing · {page}", sees People + cursors, can Follow; no Go there to areas it can't open; sends no ops. Before MP-7: not shown, sees nothing (today) *(OD-CL-3)* |
| EDITOR | all of §4–5; no Manage members link |
| ADMIN / OWNER | + Manage members ↗ |
| **Plan** (N4) | Collaboration has **no plan gate**; seats are the limit (Free 1 · Pro 5 · Business 25; trial = Pro, SC-20). After the trial on Free, members beyond 1 seat and everyone on a locked site are view-only (SC-20); their role is unchanged and restored on upgrade; invites need Pro. They appear as 'Viewing' after MP-7 and send no ops; before MP-7 they see no cluster. The ops route refuses plan-locked members (part of P-TRIAL / Panel 23 TR-12). The editor shows SC-20 copy 'Over the Free limit — Upgrade to edit' / 'Ask the workspace owner to upgrade'. |

**Limits** (technical, not plan — SC-20): ≤10 cursors drawn; room cap 25 editors *(DS)* — the 26th joins with presence off: "Too many people here for live presence — your edits still save"; op 1 MB, 1500 ops/min (CO-06); cursor send ≥100 ms, only on move *(DS)*.

**Privacy**: signed-in members with site access only; names/avatars from the account (MP-3); cursor and location ephemeral, **not stored** (MP-4) *(OD-CL-6)*; location redaction (§4.1); Hide my cursor; nothing from a field is shared before it is applied.

## 7. Content
| Where | Copy |
|---|---|
| Pill | "N here" (A) · "Live" (B) · "Reconnecting…" · "Offline" |
| People line | "Edits reach others when saved" (A) · "Live · changes reach others in about 2 s" (B) |
| People states | "Finding people…" · "Couldn't load people — Retry" · "Ana left" |
| Location | "Editing · {page} · {breakpoint}" · "Viewing · {page}" · "In {area}" · "Idle {n} min" · "(you) · {n} tabs" |
| Inspector | "Ana is editing this. If you both change the same setting, the later change wins." |
| Text | "Ana is typing here. Editing at the same time can lose text." [Wait] [Edit anyway] |
| Follow | "Following Ana · Stop" · "Ana left — stopped following" · "Ana went to {area} — stopped following · Go there" |
| Peer saved (A, MP-12) | "Ana saved changes · Get latest" |
| Overwritten (B) — banner 8a *(R-1018)* | "Ana changed Padding after you · Undo" |
| Remote delete — banner 8a *(R-1018)* | "Ana deleted Hero — your change to Padding (24 px) wasn't applied" · "Ana deleted the page Menu" |
| Undo skip | "Can't undo — Ana changed this after you" |
| Access | per Panel 22 §5.5 / §5.7 (demoted / removed) |
| Cap | "Too many people here for live presence — your edits still save" |
Names: account display name; duplicates → name + surname initial *(DS)*.

## 8. Geometry and accessibility (NOT MEASURED)
- People 360 *(R-1018, V7)* × max(viewport − 24), rows 40, body scroll; Esc closes (SC-2 step 2), focus returns to the cluster button (`aria-haspopup="dialog"`, name "People on this site, 3 here, Live").
- Passive presence never steals focus (IAF-19 F). Pill `role=status`, polite, for presence states only; **Offline is not announced by the pill** — Panel 22 owns one polite offline announcement, and the pill is silent while Panel 22 banner 6 shows *(R-1018, D3-15; Change from `Presence.tsx:116-117` assertive)*. Join/leave announcements batched, ≤1 per 10 s.
- Remote outlines/cursors `aria-hidden`; People is the screen-reader path. Identity never colour-only (name + initials).
- Typing confirm: small dialog, focus Wait, Esc = Wait. Follow bar has a Stop button; `prefers-reduced-motion`: cursors jump.
- No new shortcuts (SC-12); Esc stops Follow (§4.4).

## 9. Preservation map
| Today | Target | Disposition |
|---|---|---|
| CO-01 flag + server kill switch | same var gates UI and routes | Keep |
| CO-02 "Start collaboration" (menu, ⌘K) | automatic join; row → "People on this site…" | Change (OD-CL-2) |
| CO-02 flag-off "Planned" row | unchanged | Keep |
| CO-05 SSE + POST, role re-check, lifetime cap | kept; client seeds from `hello`, handles `resync`/`revoked`, dedupes | Keep + Fix |
| CO-06 validation, size, rate limits | unchanged | Keep |
| CO-07 EDITOR-only ops | unchanged; viewer presence-only channel added | Keep + NEW (MP-7) |
| CO-08 cluster, pill, max 2, solo-offline pill | + People popover; pill copy per phase; mocks labelled Demo | Keep + Change |
| CO-09/CO-10 log-derived roster, peer-to-peer sync | presence channel roster; server-sourced join state | Change (Fix) |
| CO-11 op broadcast + "remote wins" | server-ordered merge (Phase B) | Change (MP-1) |
| CO-13 CAS save + ConflictModal | Keep; "Get latest" banner after MP-12 | Keep + NEW |
| CO-14 own-stack undo | own changes only, as ops, with skip | Keep + Fix |
| CO-15 remote cursors | page-space, scoped, tone colours, Hide my cursor | Keep + Fix |
| CO-16 editing/lock engine (unused) | "editing now" + typing notice UI | NEW use of existing |
| CO-17 other-tab toast | unchanged | Keep |
No capability removed.

## 10. Planned (reserved, not designed)
Per-element/per-page edit permissions · mention-to-follow · chat/voice · branches · presence on `/review/<token>` · per-element "who changed this" (needs Panel 12 actor ids).

## 11. Engineering dependencies (add to SC-9)
| ID | Phase | Dependency | Fallback until shipped |
|---|---|---|---|
| ⛔ MP-3 | A | Authenticated identity on every presence/op frame (server stamps user id, display name, avatar, role; client ignores self-declared ids/names) | **None — Phase A does not ship**; cluster hidden even with the flag on |
| ⛔ MP-4 | A | Ephemeral presence channel, not stored in `collab_operations`: roster on join, heartbeat 10 s / timeout 30 s, leave on `pagehide`; payload area + page + breakpoint + record + selection + editing + typing | **None — Phase A does not ship.** No heartbeat exists (`ping`/`pong` defined, unused) and the op log cannot give a correct roster (CO-09) |
| ⛔ MP-5 | A | Transport correctness: seed `lastSeq` from `hello` (defect 15); handle `resync` and `revoked` (with reason demoted/removed); reconnect from the last seen seq; dedupe by seq | **None — Phase A does not ship** (today any connect replays and applies the retained log) |
| ⛔ MP-1 | B | Convergent merge: server seq is the total order; every client, incl. the author, places its own ops at their seq (rebase), or a CRDT | Phase B off (Phase A only, if its rows are done) |
| ⛔ MP-2 | B | One server document under live editing: join state = saved revision + ops after it; a save model in which peers don't stale each other's CAS baseline | Phase B off; CAS + ConflictModal as today |
| ⛔ MP-6 | B | Durable op outbox + acks (own echo = ack) | Phase B off |
| ⛔ MP-8 | B | Collab-aware undo: inverse op transformed against later remote ops; skip when not applicable | Phase B off |
| MP-7 | A | Viewer presence-only stream (no ops) | viewers neither shown nor see others |
| MP-9 | A | Viewport (scroll/zoom) broadcast for Follow | Follow = page + breakpoint + selection |
| MP-10 | A | Server room cap 25 + cursor coalescing ≥100 ms | client cap only |
| MP-11 | A | Cursor in page coordinates + page id + breakpoint | remote cursors hidden; selections only |
| MP-12 | A | Save notification on the presence channel (saver id + new `lastEditedAt` revision) after a successful site save | no "Ana saved changes" banner; next save meets ConflictModal (today) |
| — | — | Site settings banner (Panel 10 §5 layer 2) | = MP-4; layer 1 read-compare-write is independent and always on |

## 12. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-CO-01 | Flag off: no cluster, routes 404, menu "Planned" |
| T-CO-02 | Two editors open the site: each sees the other within 5 s with **account names**, whoever opened first |
| T-CO-03 | A third person joins, and a person joins a site with 24 h of logged ops: no canvas or undo stack changes anywhere; nobody who left appears (Fix CO-05/CO-10, defect 15) |
| T-CO-04 | Close a tab: the person disappears within 30 s; People announces "Ana left" |
| T-CO-05 | People rows show area/page/breakpoint; viewer sees "In CMS" with no record title and no Go there; Follow takes page + breakpoint + selection; Esc / own edit stops; Ana opening CMS stops follow with "Ana went to CMS" |
| T-CO-06 | Different zoom and widths: a remote cursor sits on the same element; cursors from another page/breakpoint not drawn; 6 people → tones repeat, names distinguish |
| T-CO-07 | Ana types in a heading: my double-click shows the advisory prompt *(R-1018)*; Wait keeps me out, Edit anyway enters text edit |
| T-CO-08 | Phase A with MP-12: Ana saves → "Ana saved changes · Get latest"; Get latest backs up my unsaved edits, then loads hers. **Without MP-12:** no banner; my next save shows ConflictModal |
| T-CO-09 | Phase B: both set Padding on Hero at once → both screens show the same final value within 3 s |
| T-CO-10 | Phase B: undo reverts only mine; same property changed by Ana → "Can't undo — Ana changed this after you" |
| T-CO-11 | Phase B: 10 min of two-person editing produces **no** ConflictModal |
| T-CO-12 | Stream down 31 min (ops pruned) → "Getting the latest version…" with backup; no duplicate elements |
| T-CO-13 | Demoted → view mode, removed → no access + Download backup, both with Panel 22 §5.5 / §5.7 surfaces and copy; further ops refused (T-IAF19-6) |
| T-CO-14 | Viewer after MP-7 appears "Viewing", sends no ops; before MP-7 sees no cluster |
| T-CO-15 | Flag off: two sessions save Site settings › SEO → read-compare-write shows "Changed elsewhere — Review". Flag on + MP-4: the banner also shows the other name |
| T-CO-16 | "Live" pill with a failed save → "Save failed — Retry" |
| T-CO-17 | Hide my cursor → others see my selection, not my pointer |
| T-CO-18 | Same account in two tabs → one People row "(you) · 2 tabs" |
| T-CO-19 | Screen reader: names, roles, locations; ≤1 join/leave announcement per 10 s; going offline is announced **once, politely, by Panel 22** — the pill adds no announcement *(R-1018, D3-15)* |
| T-CO-21 *(R-1018, D3-21)* | "Ana saved changes · Get latest" appears in the Panel 22 banner slot (8a), not as its own notice; Get latest backs up, then asks the Reload latest consequence confirm |
| T-CO-20 | Dev mock users carry "Demo"; solo Offline still shows the pill |

## 13. Code defects found during this inventory (engineering, not design; source read, NOT RUN)
1. **Any join can replace peers' canvases**: every joiner sets itself host (`CollaborationManager.ts:163-169`), every peer answers `sync_request` with its whole project (`:726-738`), and `handleSyncResponse` imports any response unasked (`:744-761`). FI-04 class.
2. Roster from the log: peers don't answer `join`; frames from users not in the room dropped (`:644-660`); no heartbeat or leave on tab close → ghost avatars; live people whose `join` was pruned invisible.
3. Identity: random ids (`:807-809`); name `currentUser?.name ?? "Editor"` (`StudioHeader.tsx:622`), ⌘K `"Editor"` (`CommandPalette.tsx:315`); server `authorId` ignored → everyone "Editor", spoofable.
4. Acks unreachable: own echo filtered (`SSETransport.ts:60`) so the ack branch (`OTEngine.ts:199-226`) never runs; pending ops live 30 s; quality stats meaningless.
5. Non-convergent merge: own optimistic ops never re-placed at their seq; "remote wins" transform (`OTEngine.ts:256-315`) ends concurrent writes opposite per client; `divergence:detected` unconsumed. `runtimeEnv.ts:95-97` and root CLAUDE.md call this "last-write-wins" — wrong.
6. `resync` / `revoked` not listened for (`SSETransport.ts:46-75` vs `sse route:81,105`); EventSource reconnects with the connect-time `since` (`:42`) → after the 30-min cap (`sse route:21`) or a drop, ops replayed and re-applied; resync loops; `revoked` has no demoted/removed reason.
7. Undo restores a snapshot rebuilt from the own stack (`HistoryManager.ts:516-569`), lacking unrecorded remote ops (`:333-350`) → likely reverts peers locally; not broadcast.
8. Whole-project CAS (`BuildrikSyncProvider.ts:854,864`) unaware of collab → peers raise SAVE_CONFLICT on each other; no save notification exists.
9. Cursors: viewport pixels relative to canvas rect (`useCursorSync.ts:104-106`), zoom ignored, no page/breakpoint; 50 ms ⇒ up to 20 POST + DB rows/s/user (`ops route:9`).
10. Emitted, unconsumed: `selection:update`, `editing:*`, `lock:*`, `sync:error`, `divergence:detected`; `notifyEditing`/`acquireLock` have no caller.
11. Colour: raw hex incl. indigo `#818cf8` (`CollaborationManager.ts:38-47`, DESIGN ban); white label on `#facc15` fails contrast; cursor colour ≠ avatar tone (`Presence.tsx:34-40`).
12. Op send failures dropped silently (`SSETransport.ts:95-98`).
13. Two retention values: 24 h (`collab.service.ts:14`) vs 7 d cron (`ephemeral-purge/route.ts:20`); cron comment "collab is demo-only" (`:12`).
14. `useStudioState` `syncStatus` set once to "connected", never updated (`shell/hooks/useStudioState.ts:269`).
15. **`hello` head seq ignored (data-loss class)**: server sends the head (`sse route:76`) and expects a fresh client to start there (`collab.service.ts:92`); the client's `hello` listener drops the payload (`SSETransport.ts:46-54`) and keeps `lastSeq = 0`, so the first polls replay the **whole retained log** (200 per batch, `collab.service.ts:10`): ghost `join`s for people long gone, old `operation`s re-applied on top of a freshly loaded save, and old `sync_response`s imported as whole projects (defect 1). Fix = MP-5.

## 14. Owner decisions
| OD | Decision | Decided (SC-22) |
|---|---|---|
| OD-CL-1 | Ship Phase A (presence, editing indicators, Follow) before live editing | **Decided — yes**; Phase B only after MP-1/2/6/8 pass T-CO-09…12 |
| OD-CL-2 | Auto-join presence for EDITOR+ (drop "Start collaboration") | **Decided — yes**, with Hide my cursor |
| OD-CL-3 | Viewers visible as "Viewing", can see/follow others | **Decided — yes** after MP-7 |
| OD-CL-4 | No collab plan gate; seats are the gate. After the trial on Free, members beyond 1 seat and everyone on a locked site are view-only (SC-20); their role is unchanged and restored on upgrade; invites need Pro. They appear as 'Viewing' after MP-7 and send no ops; before MP-7 they see no cluster. The ops route refuses plan-locked members (part of P-TRIAL / Panel 23 TR-12). The editor shows SC-20 copy 'Over the Free limit — Upgrade to edit' / 'Ask the workspace owner to upgrade'. | **Decided** — no plan gate; post-trial per SC-20 |
| OD-CL-5 | Text: advisory confirm "Ana is typing here — Wait / Edit anyway" (keeps IAF-19 D) vs a hard 5 s block (would need an IAF-19 D / T-IAF19-5 amendment) | **Decided — advisory confirm** |
| OD-CL-6 | Presence/cursor data ephemeral, never stored; op log retention unified at 24 h | **Decided — yes** |

## 15. Cross-doc amendments
Applied to SC-9/SC-10: SC-9 rows = §11; SC-10 rows: Esc stops Follow (Panel 05 ladder); Panel 10 §5 two-layer guard; "Start collaboration" → automatic join + "People on this site…" (Panel 01 §6). `runtimeEnv.ts:95-97` "DEMO-ONLY (last-write-wins…)" is inaccurate (root CLAUDE.md corrected) (defect 5).

## 16. Review and not verified
Independent design-qa-critic pass 1: PROPOSAL, 4 blocking (B1 `hello` replay, B2 ⛔ scoping, B3 save signal, B4 Site settings guard) + 12 notes (N1–N12) — all fixed 2026-10-17; pass 2: 1 blocking (post-trial plan state) fixed 2026-10-17. *(R-1018)* **Resolved (reconciliation 2026-10-18):** the Phase B peer-action messages ("Ana deleted the page Menu", "Ana deleted Hero — your change… wasn't applied", "Ana changed Padding after you · Undo") are Panel 22 banner (8a) "Teammate change", not toasts — per Panel 22 §5.10 (toasts = outcome of the user's own action only; events from elsewhere or later → bell).
Not verified: any multi-user runtime, real latency, convergence, the §13 defects (source-read only), geometry, screen-reader output, Figma (no board for People/Follow; 692:472 covers the cluster only).
