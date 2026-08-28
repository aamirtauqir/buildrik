# Designer-lens review — the new design walked as a working designer

2026-08-28, /design-review. 16 live states captured at 1440×900 on the fixture
site, judged by product-designer heuristics (scan-don't-read, mindless clicks,
no gauge without a quantity, honest affordances). Outside voices: codex source
audit + an independent consistency subagent — both ran the full chrome tree.
Screenshots: `~/.gstack/projects/aamirtauqir-buildrik/designs/design-audit-20260828/`.

## Fixed this pass — each live re-verified

| # | Finding | Fix | Proof |
|---|---------|-----|-------|
| F1 | Cookie banner squatted on the editor's status footer (setup chip, save state, zoom all hidden) for anyone who hadn't answered consent | `CookieConsent` returns null on `/edit/*` (hook-order safe; dashboard still asks) | banner gone, "Desktop · 100%" footer visible |
| F2 | Every image in the Media drawer rendered "Aa" — an image with no pre-cut thumb fell into the FONT branch, `fontFamily: filename` | img falls back to `src`; "Aa" reserved for `type==="fnt"`; unknown → file glyph | both fixture jpgs render `<img>`, zero "Aa" |
| F3 | Color row: value `333333` beside a COBALT swatch — bare hex failed validation, swatch went transparent, flowbite Button's default blue showed through | bare 3/6-digit hex normalized; CSS keywords paint as themselves; trigger `background-color` pinned transparent | fill `rgb(26,26,26)` = value `1a1a1a`; button bg transparent |
| F4 | Tokens (Beginner): 12 of 14 rows read "0 ›" — a drawer that opened on a wall of nothing | empty foundation kinds fold behind "More token kinds · N ›"; Pro keeps all 14 | 7 rows incl. disclosure; detail route still opens folded kinds |
| F6 | Shortcuts sheet: "On Mac use ⌘ instead of Ctrl" under badges that already showed ⌘; Redo listed ⌘Y only while ⇧⌘Z works | footer deleted (useless on both platforms since displayKey); Redo reads ⇧⌘Z, Y works unlisted | footer gone; chord "⌘+⇧+Z" |
| F7 | Review panel drew a "0 of 0" progress bar over an empty thread | bar renders only when a comment exists; sent line stays in every state | no "0 of 0"; "Sent 3d ago" present |
| F8/8b | PublishConfirm, SessionExpired and StaleApproval modals rendered body content flush to the modal edges — no `ModalBody`, no gutter | wrapped in `ModalBody` | (component-level; ModalBody carries px-5) |
| F9 | "+ Add page From template" read as one run-on phrase at 4px gap | gap 12 | measured 12px |
| F11 | "Size 16 / 24" — nothing said the 24 was line height when both read in px | hover titles on the pair halves; board 807:8342 visual untouched | — |

## False findings caught before filing

- Site-menu ⌃H / ⌃, vs ⌘/ "inconsistency" — deliberate and documented: macOS
  itself takes ⌘H (window-hide) and ⌘, (browser prefs); the printed chord is
  the one that works.
- ReviewBar's greyed "Next ›" — already carries
  `title="No open comments to step through"` (wireframes §5.8).
- Brand "Starters" row unreachable — both misses were probe bugs (rail
  re-click toggles the drawer; leaf-click heuristic), not the product.

## Founder DECISIONS (logged, not acted)

- **D1 Insert list**: 53 elements in one flat group. Grouped categories
  (Typography / Layout / Media / Forms) would scan faster; current list is
  board-conformant. Search (⌘F) exists.
- **D2 Layers labels**: type names only (Container, Grid, Heading ×12). A
  content snippet ("Heading — 'Wood-fired pizza…'") would make the tree
  scannable; engine has the text. Feature, not a fix.
- **D3 Pages checkboxes**: always-visible bulk-select on every row; hover- or
  mode-reveal is calmer. Board authority.
- **D4 "Listings" toggle** in Pages header — jargon; plain "Collections"?
- **D5 Brand footer**: Discard + disabled Save render when nothing is dirty.
- **D6 Breakpoint feedback**: switching D→T at fit-zoom changes nothing
  visibly on placeholder content — worth a frame-width label ("768px") near
  the W·D·T·M chips. Not measured as a bug; the frame may resize under
  auto-fit.

## The systemic layer — two independent audits, one verdict

Codex (source, high effort) and a consistency subagent (independent) converged
on five structural findings across the chrome, all file:line'd in their
reports (kept in the session log; top items below):

1. **Three parallel styling systems.** ~2,300 `var(--bk-*)` refs in CSS beside
   866 `tw:*-[Npx]` arbitrary values and 274 inline `fontSize:` objects in
   TSX. The chrome-ui primitives themselves (PanelHeader, SectionHeader,
   EmptyState, Modal) are written in raw Tailwind values, not tokens — the
   reference implementation teaches every panel author to bypass the system.
2. **20 distinct font sizes** where the scale defines 7 — including 9/10.5/
   11.5/12.5px eyeball exports; `text-xs` and `text-[12px]` are the same size
   spelled two ways. The section caption is hand-rolled ~25 times in 6 sizes.
3. **No Button hierarchy.** `Button` is a bare flowbite re-export: 524 default-
   blue instances, a 6-class ghost-link incantation copy-pasted 48 times,
   `red`/`failure` both in use. (A real wrapper touches the chrome-ui-surface
   gate's closed wrapper set — founder-visible structural change.)
4. **Accent split**: `tw:text-blue-700` (65) is `#1D4ED8`, `--bk-accent` is
   `#1A56DB` — two different blues both shipping as "the" accent; adjacent
   panels' identical "Clear search" links differ. 468 `text-gray-*` vs 226
   `--bk-ink*`.
5. **Five empty-state languages** and a capitalization/verb anarchy ("Create
   component" / "Create Component" / "New Page" / "Add page" / "Create blank
   page"; `Colour` beside `Colors`). Plus 13 more modals without `ModalBody`
   (inventoried; two proven-broken ones fixed above).

These are a dedicated design-debt arc (codemods + one gate amendment), not
inline fixes — proposed order: primitives-on-tokens → Button wrapper →
blue/gray codemod → EmptyState contract → copy rule + `gate:copy`. Founder
call to schedule.
