# The per-screen walkthrough — live editor vs the boards, measured

2026-08-28. The founder's closing requirement: *"figma us ka her screen sae
walkthrough karoo or active or new dono ka doffrence bhee check karna"*. This is
that walkthrough — every reachable editor surface opened in the running app at
1440×900 on the fixture site, measured with `getBoundingClientRect`, and set
beside what the boards draw. Nothing here is read off a screenshot.

Boards draw panels inside a 1440×956 shell frame; the live viewport is 900, so
panel HEIGHTS differ by the viewport and carry no signal. Widths, x-positions
and row heights are the conformance-bearing numbers.

## The shell frame

| Region | Live | Expectation | Verdict |
|---|---|---|---|
| Topbar | 0,0 1440×**56** | wireframes §2: 56h | ✓ |
| Footer | y868 1440×**32** | §2: 32h | ✓ |
| Rail | **60**w, y104 | §2: 60w | ✓ |
| Inspector | x1140 **300**×732 | `--bk-size-inspector` 300 | ✓ |
| Drawer (all panels) | x60 **320**w | §2: 320w | ✓ |

## The six rail panels + review

| Panel | Live rect | Dominant row | Board row | Verdict |
|---|---|---|---|---|
| Insert | 60,104 320×732 | **32** | 137:2 rows 32 | ✓ |
| Layers | 60,104 320×732 | **40** | 1082:4527 draws **28** | ~ see note |
| Pages | 60,104 320×732 | **32** | 32 | ✓ |
| Media | 60,104 320×732 | **32** | 32 | ✓ |
| Content | 60,104 320×732 | **32** | 32 | ✓ |
| Brand | 60,104 320×732 | **52** | NEW board 1333:7162 rows 52 | ✓ |
| Review | 60,104 320×732 | opens via pill, "Review · 0 of 0" | 13 boards, walked 2026-08-18 | ✓ |

**Layers note** — not forced either way. The board draws tree rows at 28, which
is `--bk-size-row-dense` and matches the "Compact rows" toggle the display
settings ship; live default density is comfortable at 40. Both densities are in
the DS and both are reachable; which one is the DEFAULT is a taste call,
recorded for the founder rather than changed.

## Floats and overlays

| Surface | Live | Expectation | Verdict |
|---|---|---|---|
| Notifications | x1068,y56 **360**×540 | floating-panels-spec §6: 360w | ✓ |
| Site menu | 200×687, **17 items** | SiteMenu walked in prior arcs | ✓ |
| ⌘K palette | 440,180 **560**×450 | 481:2 capture | ✓ |
| Onboarding chip | footer band, y876 | own fix this arc | ✓ |
| Canvas toolbar | x380–1140 y796 | full canvas width (measured this arc) | ✓ |
| Canvas breadcrumb | renders whole, ≥4.83:1 | R7 fix | ✓ |

## Inspector

Selected heading → header "Heading selected", 300×732 at x1140. Colour row
shows the full hex (R6 fix). Empty state is one line + one action (R14,
refuted-as-drawn). ✓

## The lifecycle CTA — every row now walked live

The seventh row (`opened-not-acted`) could not be staged before; this arc's own
client-page walk produced it naturally — the fixture's reviewer opened the link
and did not act.

| Review state | CTA (live) | Verdict |
|---|---|---|
| approval off | Publish · "Not live yet." | ✓ |
| none (revoked) | **Send for review** | ✓ |
| pending | Publish disabled · "Waiting on your client's approval" | ✓ |
| **opened-not-acted** | **Publish disabled · "Waiting on your client's approval"** | ✓ **(new)** |
| changes-requested | **Open feedback** | ✓ |
| approved | Publish · "Approved — ready to go live." | ✓ |
| approved-edited-since | Publish · "Edited since approval…" | ✓ |

Workspace policy and the round were restored after each staging and re-read to
confirm (`editsRequireApproval: false`, round PENDING).

## Client sign-off page (1280×720, no account)

A0 identify ✓ · A viewing ✓ (Approve/Request-changes clear of the cookie banner
after this arc's fix — y607 vs banner y672) · dead-link copy ✓ (4 variants in
source, tested). Eight NEW boards drawn this arc (`1339:*`); B commenting and
E post-approval-edited remain unwalked and undrawn.

## ACTIVE vs NEW — the standing difference count

- 76 ACTIVE screens (inventory SSOT) ↔ 70 have NEW counterparts; the six
  exceptions are disposed in `2026-08-27-figma-coverage-active-vs-new.md`
  (three real gaps → two now have boards, plugins/invite remain; two are a
  settled rail decision; one maps to Brand).
- 363 active NEW boards: **359 settled** (code-backed / walked / board-authoritative),
  **4 open** — all four are unbuilt FEATURES, not conformance:
  cross-page move + element deep-link, template section catalog, review round
  linkage, migration UI. Founder decisions.
- 41 design-ahead: boards drawing states the product cannot produce (each one's
  reason is in its census row).

## Harness notes for whoever walks next

Two of this walkthrough's own first readings were false: Insert measured `null`
because the drawer opens by default and the probe's click CLOSED it, and the
review pill did not read "In review" any more because the fixture's reviewer had
opened the link — the pill said "Opened · no reply". The screen was fine both
times. Believe the second read, not the first.
