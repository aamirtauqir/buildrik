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

## The six DECISIONS — walked to the end 2026-08-29

Four were **false findings**, killed by reading the code that owns them:

- **D1 Insert list** — the panel already groups (ELEMENTS / BLOCKS / …,
  board 137:2 taxonomy, `catalog/groups.ts`). It read as a flat 53-row list
  in the screenshot only because ELEMENTS is the one group open by default.
- **D3 Pages checkboxes** — the row checkbox is CSS-gated on
  `.bd-pg-panel.bulk-mode`; the walk caught the panel in bulk mode.
- **D4 "Listings"** — board 141:207's own name for the SEO listings table
  (PAGE · TITLE · DESC · SCORE). Board authority, not jargon drift.
- **D6 breakpoint feedback** — the footer has always said "Tablet · 100%".
  It was invisible because the **cookie banner covered the footer** — the
  same F1 bug, wearing a second hat. Confirmed live after F1 shipped.

Two were real and are **fixed**:

- **D5 Brand footer** — a clean panel rendered Discard + Save both disabled.
  Board 154:78 draws only the dirty state; clean is now the status line
  alone. Live: "Brand is up to date", no buttons.
- **D2 Layers labels** — twelve rows reading "Heading" named nothing. Text-ish
  layers now show their own first 32 characters (`Element.getContent`, tags
  stripped); containers keep type labels; a rename still wins. Live: rows
  read "Lorem ipsum dolor sit amet, cons…", "HEADING", "Click Me".

## Founder DECISIONS (original log — see the section above for outcomes)

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

**SHIPPED same day** (the founder's goal ran the arc immediately), in the
auditors' own order:

1. **Primitives on tokens** — PanelHeader / SectionHeader / EmptyState /
   Modal rewritten on `var(--bk-*)` (every swap value-identical, checked
   against tokens.generated.css) + a five-role type ramp exported from
   chrome-ui (`TYPE_PANEL_TITLE/SECTION_CAPTION/BODY/LABEL/HINT_CLASS`).
2. **Button wrapper** — third member of the closed wrapper set (manifest +
   gate copy amended in the same commit). `variant` maps
   primary/secondary/ghost/link/danger; BK_BUTTON_THEME adds ONLY the two
   missing vocabulary keys, so ~850 existing call sites pass through
   byte-identical. A bare `<Button>` was already the brand accent — the
   flowbite primary scale IS Flowbite blue.
3. **Blues unified** — 109 `tw:*-blue-700/800` sites codemodded to the accent
   tokens; live probe: "Browse stock" now computes rgb(26,86,219) — the same
   cobalt as Publish. `failure`→`red`; the three purple buttons dropped to
   primary. Avatar identity tones stay allowlisted (Gate 18 parity).
4. **EmptyState contract** — `align="start"` covers the boards' left-anchored
   language; ComponentsTab's bare markup and ColorTokenList's action-less
   line migrated (the latter finally has "+ Add a color").
5. **One copy voice** — sentence case across the ⌘K palette, the command
   registry (25 labels) and the canvas context menus (acronyms kept);
   Create/Rename component unified; Colour→Color; the "My Awesome …"
   placeholders retired; "Template applied!" calmed.

**And a floor under the rest**: `gate:design-debt-ratchet` (wired into
verify:ds, negative-tested with a planted violation) locks offbrand-blue at
ZERO and ratchets the remaining populations strictly downward.

**Second pass, 2026-08-29** — the tail drained rather than waiting:
`tw:text-gray-{900,600,500,300}` → the ink tokens across 460 sites (every
pair value-identical, ratchet **470 → 10**); the nineteen half-pixel sizes
(10.5/11.5/12.5px) snapped onto the 11/12/13 scale (**86 → 67**); the two
modals that were genuinely flush (CommentLayer's orphan dialog,
TokenReplaceModal) got their `ModalBody` gutter — the other eleven from the
inventory carry their own padding, checked rather than assumed. **Third pass, same day** — the judgment-call tail was walked too, one shape
at a time:

- **Ghost-link 44 → 19.** Five shared forms now live in
  `chrome-ui/linkButton.ts` (row · tight · small · on-dark · inline) and 15
  call sites across 12 files reference one. The migration is a rename, not a
  restyle — constant + each site's own extras reproduces its exact shipped
  class string, so no utility competes with itself (the twMerge trap). The 19
  counted now are those five DEFINITIONS plus 14 single-use shapes (an h-9 nav
  row, a w-fit chip, an 11px modal link). New links use `variant="link"`.
- **Off-scale 67 → 42, and the rest is named.** Six near-scale chrome headings
  (15px h2/h3, a 17px ModalTitle) snapped to `--bk-text-16`. Three paths are
  excluded with the reason written into the gate, the way `avatarTone` is:
  CatalogCard draws a component MINIATURE (7/8px is the thumbnail's scale),
  and BrandPreview / TypographySection render the user's typefaces as
  specimens where the size IS the sample.
- **Gray-text 470 → 10, also named.** What remains is `gray-400` on decoration
  chevrons and a drag handle: the ink scale has no 400 step, and snapping them
  to 300 or 500 would be a visible change made to satisfy a counter. They wait
  for Figma to publish that step.

Nothing under the ratchet is now un-explained: every surviving occurrence is
either a single definition, a documented non-chrome surface, or a value the
token scale does not yet carry.
