# UI flow walk — findings

2026-08-28. The 92 active flow boards walked per
`docs/plans/2026-08-28-ui-flow-walk.md`, live at 1440×900 on the fixture site,
measured — never eyeballed. Codex's plan review (15 points) shaped the method:
calibration before counting, fixture hygiene, and a separate verdict class for
static-only checks.

**Verdict classes:** MATCH (live agrees with the board) · DRIFT (measured
difference, logged) · CODE-AHEAD (live richer than the board) · STATIC
(no live door; source compared, never claimed as a walk) · DECISION (board and
code disagree on something only the founder can settle).

**Board-authority closure** (the rows where the census says the BOARD is the
contract): 815:4518 shortcuts search — fixed · 814:7027 undo-toast reverse
action — fixed · 807:8069 breakpoint bar — walked, MATCH · 307:2193/2203/2213
review gates — walked, verbs match · **813:4870 session-expired
unsaved-warning — OPEN, the one board-authority row live does not satisfy**
(see S1). Everything else in the 92 carries code/walked/founder authority and
is cited to its arc below. NOT verified live this arc: the S2 generation
states (AI dead in dev), the 294:* error states (static cites only), and the
canvas interaction states re-cited from 08-21/08-22.

## Fixed during the walk

| Fix | Board | Evidence |
|---|---|---|
| Shortcuts overlay search — board draws "Search shortcuts…", live had 61 rows and no filter | 815:4518 | live: query "undo" filters 61 → 2 lines; filter matches the DISPLAYED chord (⌘ on Mac), not just the stored one; empty groups drop their headings |
| Undo/redo toast reverse-action link was gated on destructive labels; board puts it on every variant | 814:7027 | live: ⌘D→⌘Z shows "↩ Undo · Duplicate · Redo", ⌘⇧Z the mirror; empty stack keeps the grey no-action "Nothing to undo" (`8c558483`) |

## S7 · Settings (14 boards)

- **Nav content: MATCH.** All 15 destinations in all 4 groups (SITE /
  DISTRIBUTION / PLUMBING / WORKSPACE), exactly as board 638:2378 lists them.
- **Structure: DECISION.** Boards draw master-detail — a 140px nav that
  persists beside a 1240px pane on every screen. Live is a full-width drill-in:
  the root list replaces itself with the screen and a "Back to Settings" row.
  The drill-in is the founder's own recorded preference for the drawer; these
  boards are the full-page surface. One of the two artefacts must move.
- **General: MATCH** — pane fields identical (Site Identity / Social Links /
  Legal, same field list).
- **Branding: DECISION** — board draws a BRANDING FIELD MAP (brand colour,
  font, favicon, social image); live is a pointer card into the Brand panel.
  SSOT argues for the pointer (Brand owns tokens); the board argues for
  convenience. 
- **SEO: MATCH-minor** — board "Meta title", live "Title template" (live's word
  is the truer one; it is a template).
- **Analytics / Headers: CODE-AHEAD** — live has more cards than the boards
  (Meta Pixel, Clarity, Cookie Consent; HSTS, Referrer-Policy,
  Permissions-Policy).
- **Redirects: MATCH** — the 404 suggester the board draws is live.
- **Integrations: note** — live wears a Pro gate chip the board does not draw
  (plan state, not drift).
- **Forms / Webhooks / Domains / Export / Localization / Custom code: MATCH**
  at the level an empty fixture can show (empty states render their own copy).

## S1 flows (25 boards)

- **Onboarding checklist steps: DECISION — the big one.** Board 296:1972's
  seven steps are agency-framed: *Set your brand · Add your first page ·
  Insert a section · Connect first client · Send for review · Preview ·
  Publish*. Live ships tool-framed steps (*Name your project · Add an element ·
  Edit text …*). The board's list IS the job-based framing the founder asked
  for — and three of its steps (brand, client, review) now have real outcome
  signals to wire. Recommend adopting the board list; needs three new
  completion wires, so it is not an inline fix.
- **Onboarding pill: boards superseded.** 296:2064/2069 draw the floating
  bottom-right pill ("✓ Setup 4/7"); the founder-approved fix this arc moved
  the chip into the footer band ("● 2/7 done"). The boards need redrawing, not
  the code.
- **New page: DRIFT.** Boards 295:1972/1989/1994 + 807:7252 draw a 3-way modal
  (Start blank / From template / AI draft). Live: "+ Add page" creates a blank
  page instantly; template lives behind a "More add options" overflow; AI
  draft does not exist on this path. Confirmed by walking — the click created
  Page 5, which was deleted and the fixture re-verified at 4 pages.
- **Loading skeleton: MATCH** — captured accidentally when a probe fired
  early: drawer skeleton rows, inspector skeleton, "Loading…" footer.
- **Save indicator (813:4836): MATCH.** All five board states ship in
  chrome-ui `SaveStatus` ("Autosave has five truths"): Saving… · Saved just
  now · Saved Xm ago (minute tick) · Unsaved changes · Save failed — retry.
  "● Saved · just now" observed live in this walk's topbar screenshots.
- **Templates drawer (807:4299): MATCH, walked live.** Site menu → Templates
  opens the drawer: search, All / Site Pages / Sections / My Templates chips,
  10 cards with thumbnails and Free/Pro labels, pagination, expand-to-full-page
  glyph. The previous "door didn't open" reading was the probe, not the
  product — `clickMenuRow` (rig trap 7) opens it every time.
- **Template preview (813:4489 / S1.1e): MATCH per census authority.** Card
  click opens the preview modal — rendered visual, "3 sections · Free", the
  honest consequence line ("Applying replaces the content of Home. Your
  version history keeps the previous state."), Cancel / Apply template. Board
  draws it full-page; census settled this row as `code:state-exists` (modal
  form). Apply was NOT clicked; fixture untouched.
- **Read-only view (813:4676): code wins, verified live.** `?view=readonly`
  strips rail, drawer, inspector and Publish; topbar reduces to "‹ Back to
  editing" + title + lifecycle pill + comments/notifications. That is the
  founder call of 2026-08-23 recorded in `editorViewMode.ts`, and the census
  row already says `code:state-exists`. The board still draws full chrome plus
  a "You have view-only access…" role banner — a superseded concept
  (redraw candidate, not a code issue).
- **Session-expired with unsaved changes (813:4870): DRIFT — the one open
  board-authority row.** The census marks the BOARD as authority, and live
  does not match it: a mid-session 401 on save produces only a toast
  ("Session expired / Sign in again to save your changes. Keep this tab
  open."). The board draws a blocking surface: lock icon, "You have unsaved
  changes. Sign in to recover your work.", an itemized "3 unsaved changes at
  risk" list, and "Changes are cached locally. Sign in within 24h to recover."
  Two of those copy claims are behaviour claims the code does not make — the
  sibling crash-recovery board (297:2027) was already ruled `code:copy-wins`
  for exactly this kind of promise. DECISION: build the warning surface with
  copy that matches the real recovery mechanism, or re-authority this row to
  match its sibling. Not an inline fix.
- **First-run coach mark: DECISION.** 297:1972 (coach-dismissed) is live by
  vacancy — no coach mark exists anywhere in the code (`Got it`, "Everything
  you build lives behind these six" — zero hits), so the *dismissed* state is
  simply the default screen. The S1.1b/c routes the coach's buttons open are
  live and walked. Whether the coach itself ships is a product call.
- **Session/network/crash states (294:*, 297:2027/2139): prior-arc cites**
  (`code:cites-board` in the census; crash-recovery walked 2026-08-25).

## S3 canvas (17 boards)

- **Shortcuts overlay: was DRIFT, now fixed** (see above).
- **Page settings: CODE-AHEAD.** Board 302:1978 draws slug/meta fields; live
  has the same tabs (SEO / Social / Advanced) plus a Google-search preview and
  a scored "Needs work · 30" readiness meter the board never drew.
- **Breakpoint bar / breadcrumb / context menu:** walked this arc (walkthrough
  doc + Copy link walk) — MATCH.
- **Undo/redo toast catalog (814:7027): MATCH after one fix.** All six variants
  ship in `useHistoryFeedback` (five since the 08-25 arc, the grey
  "Nothing to undo" in `fd39fb00`); the one delta was the reverse-action link
  appearing only on destructive labels — fixed and live-verified this walk.
  A walker's warning: a first grep for this hook missed it (searched "toast"
  near HISTORY_* in the wrong shapes) and nearly filed the whole catalog as
  absent. Grep both the event name AND the hook-file convention before calling
  a feature missing.
- **Canvas interaction states (301:1979/2186/2393, 807:7301, 815:4608,
  807:8663): prior-arc cites.** Dragging, pick-mode, inline-edit, drop
  indicators, smart guides and the mobile device frame were all live-walked in
  the 08-21/08-22 arcs (snap-to-grid, drag-slot arithmetic, inline-edit via
  keystrokes); census carries `code:state-exists` on each. Not re-walked.

## S5 review (23 boards)

Walked this session, not inherited: all seven lifecycle CTA rows live
(including `opened-not-acted`, which the client-page walk produced naturally),
review bar copy, panel states, gates, and the client page's ten states. The
S5.4 gate boards (307:2193/2203/2213) match the shipped `deriveLifecycleState`
verbs exactly.

## S2 AI (11 boards) — DECISION

Board 299:1973 draws a structured brief form ("Tell us about your site",
Industry input, "Pages you need"). Live is a chat composer ("Ask AI to change
something…") plus an agent plan ("Describe what to build…"). Two different
interaction models — the boards predate the agent pivot. Either the boards are
redrawn to the chat model or the brief form is the intended one; that is a
product call. STATIC only: AI generation is dead in dev (the OLLAMA trap), so
generating/result states cannot be walked here.

## S6 (1 board)

Domains screen head lives ("Custom domain"); DNS table STATIC on an empty
fixture.

## Harness notes (for the next walker)

- Settings row-click probes returned three identical panes early on — clicks
  had not landed; per-click verification caught it.
- The pill probe found no "In review" because the fixture's reviewer had
  OPENED the round — the pill truthfully read "Opened · no reply".
- `#bk-overlay-root` does not hold every modal (page-settings portals
  elsewhere); dialog reads must not assume one root.
- Login-heavy walks trip the magic-link rate limit even with per-run resets;
  clear `rate_limit_buckets` when the callback times out.
