# Type & colour — the one approved system

Measured 2026-09-05 across Figma `g4GzQFqzNYz5sosz1QtZXC` pages `1:3` Editor,
`1:2` Components, `1:4` Site, `1:5` Portfolio, `988:2` Dashboard v2 —
**20,509 TEXT nodes, 54,058 walked nodes**. Every row below is justified by a
usage count and mapped to a token in
`packages/editor/src/themes/tokens.generated.css`.

Findings: `docs/design-jobs/findings/M.jsonl` (`D-M-01` … `D-M-29`).

---

## The headline

| Question | Answer |
|---|---|
| Are text styles used? | **11 styles exist and are correct. 40.6% of text binds one.** |
| Are colour styles used? | **0 paint styles exist — by design. 93 colour VARIABLES do the work, and 85.4% of fills bind one.** |
| Is there a type system? | **No.** 147 distinct type combinations, 25 font sizes, 29 line-heights, 7 weights, against a ramp of 11. |
| Is there a colour system? | **Yes, with two holes** — 18.1% of bindings skip the semantic roles for `flowbite/*` primitives, and the accent chain is shifted one rung at the Button master. |

Bound-text-style ratio, per page:

| page | TEXT nodes | bound to a style | ratio |
|---|---:|---:|---:|
| `1:5` Portfolio | 1,131 | 1,017 | **89.9%** |
| `1:4` Site | 1,520 | 1,043 | **68.6%** |
| `1:3` Editor | 14,269 | 6,176 | **43.3%** |
| `1:2` Components | 568 | 99 | **17.4%** |
| `988:2` Dashboard v2 | 3,021 | 0 | **0.0%** |
| **all five** | **20,509** | **8,335** | **40.6%** |

On `1:3`, excluding the annotation sections (`862:6859`, `862:6860`,
`957:4474`, `1776:8388`, `1776:8389`) the *product* boards fall to
**3,155 / 9,345 = 33.8%** — while the annotation captions themselves run
61.3%. The notes are more systematic than the screens they annotate.

**The one piece of good news, and it decides the plan:** of the 8,335 nodes
that DO bind a style, **0 override it**. The ramp is not being fought — it is
being ignored. Adoption, not redesign.

---

## 1 · The approved type scale — 16 styles

The real backbone is small. 16 family+weight+size buckets already cover
**92.9%** of all text; the tail is 54 buckets, 42 of them used 20 times or
fewer, 26 used exactly once.

Below: **11 existing styles kept unchanged**, **5 added** because usage demands
them, **1 merged away**. Together they absorb **20,481 of 20,509 nodes (99.9%)**.

| # | style | font | size / line-height | nodes it absorbs | code tokens |
|---|---|---|---|---:|---|
| 1 | `ui/11 · caption` | Inter Regular | 11 / 16 | **4,409** | `--bk-text-11` `--bk-leading-16` `--bk-weight-regular` |
| 2 | `ui/11 · caption medium` **NEW** | Inter Medium | 11 / 16 | **1,787** | `--bk-text-11` `--bk-leading-16` `--bk-weight-medium` |
| 3 | `ui/11 · section header` **NEW** | Inter Semi Bold | 11 / 16, `+8%`, UPPERCASE | **501** | `--bk-text-11` `--bk-leading-16` `--bk-weight-semibold` `--bk-tracking-wide` |
| 4 | `ui/12 · small` | Inter Regular | 12 / 18 | **3,800** | `--bk-text-12` `--bk-leading-18` |
| 5 | `ui/12 · small medium` **NEW** | Inter Medium | 12 / 18 | **290** | `--bk-text-12` `--bk-leading-18` `--bk-weight-medium` |
| 6 | `ui/12 · small strong` **NEW** | Inter Semi Bold | 12 / 18 | **427** | `--bk-text-12` `--bk-leading-18` `--bk-weight-semibold` |
| 7 | `ui/13 · row label` | Inter Regular | 13 / 20 | **3,945** | `--bk-text-13` `--bk-leading-20` |
| 8 | `ui/13 · row label medium` | Inter Medium | 13 / 20 | **1,190** | `--bk-text-13` `--bk-leading-20` `--bk-weight-medium` |
| 9 | `ui/14 · body` **NEW** | Inter Regular | 14 / 20 | **322** | `--bk-text-14` `--bk-leading-20` |
| 10 | `ui/14 · panel title` | Inter Medium | 14 / 21 | **1,326** | `--bk-text-14` `--bk-leading-21` `--bk-weight-medium` |
| 11 | `ui/14 · panel title strong` **NEW** | Inter Semi Bold | 14 / 20 | **634** | `--bk-text-14` `--bk-leading-20` `--bk-weight-semibold` |
| 12 | `ui/16 · heading` | Inter Semi Bold | 16 / 24, `−1%` | **427** | `--bk-text-16` `--bk-leading-24` `--bk-tracking-tight` |
| 13 | `ui/20 · heading lg` | Inter Semi Bold | 20 / 30, `−1.2%` | **198** | `--bk-text-20` `--bk-leading-30` · **tracking has no token** |
| 14 | `ui/24 · title` | Inter Semi Bold | 24 / 32, `−1.5%` | **213** | `--bk-text-24` `--bk-leading-32` · **tracking has no token** |
| 15 | `data/11 · mono small` | Geist Mono Medium | 11 / 16 | **416** | `--bk-font-mono` `--bk-text-11` `--bk-leading-16` |
| 16 | `data/12 · mono` | Geist Mono Regular | 12 / 16 | **580** | `--bk-font-mono` `--bk-text-12` `--bk-leading-16` |
| — | ~~`data/13 · mono`~~ **MERGE → `data/12`** | Geist Mono Regular | 13 / 20 | 16 (0.08%) | — |

Unabsorbed after this: **28 nodes** — Inter Bold 11 (14), Bold 13 (10),
Bold 7 (2), Bold 10 (1), Italic 12.5 (1). All are one-offs to re-set by hand.

### Why the five new styles

Each exists because a large population of text has **no style to bind to**
today, which is a direct cause of the 59.4% unbound rate — a designer who
opens the style picker and finds nothing that matches sets it by hand.

- `ui/11 · caption medium` — **1,787 nodes**. The single largest gap. The ramp
  has 11 Regular and 13 Medium but no 11 Medium, and 11/500 is the panel and
  drawer header treatment DESIGN.md itself names.
- `ui/14 · panel title strong` — **634 nodes**. `ui/14` is Medium; 634 nodes
  want Semi Bold at 14.
- `ui/11 · section header` — **501 nodes**. Uppercase 11/600 with the `+8%`
  tracking that 575 nodes already use and no style declares.
- `ui/12 · small strong` — **427 nodes**.
- `ui/14 · body` — **322 nodes** at Inter Regular 14, which the ramp cannot express.

### Rules that come with the scale

1. **Every TEXT node binds a style.** Not "matches the values" — binds. A
   matching unbound node is how 147 combinations were reached without anyone
   noticing.
2. **No size below 11px.** 905 nodes are currently below it (556 at 10px, 104
   at 9px, 13 at 8px, 2 at 7px), 887 of them on `1:3`. Promote to `ui/11`.
3. **No weight above 600.** DESIGN.md:148 already says this; **575 nodes**
   violate it (Bold 518, Extra Bold 57), and only 13 of those sit under a
   canvas/preview ancestor — 562 are chrome. 396 are on `988:2` alone.
4. **No AUTO line-height.** **4,591 nodes (22.4%)** use it and no
   `--bk-leading-*` token can express it — Inter's AUTO at 11px is ~13.3px
   against `ui/11`'s 16px. Binding a style fixes this for free.
5. **Two families only** — Inter and Geist Mono. Already true in Figma
   (19,497 / 1,012, nothing else). **Not true in code:** three source files
   name banned system stacks (`D-M-12`).

### The three sources that disagree

`DESIGN.md:148` describes a ramp the Figma styles and the tokens do not have:

| | DESIGN.md:148 says | Figma style is | token has |
|---|---|---|---|
| `ui/11 · caption` | 11/16, **500** | Regular (**400**) | `weight-regular` |
| `ui/12 · small` | 12/**16** | 12/**18** | `leading-18` |
| `ui/14 · panel title` | 14/**20**, **600** | Medium (**500**) 14/**21** | `leading-21` `weight-medium` |
| `ui/20 · heading lg` | 20/**28** | 20/**30** | `leading-30` |

Figma and the tokens agree with each other. **Correct DESIGN.md:148.**
(Also: frame `67:168` is named "Type — 11 styles" and its own child TEXT reads
"Type — 33 styles".)

---

## 2 · The approved colour set

Colour is a real system and should be defended as one: **0 paint styles, 0
gradients, 93 colour variables, 85.4% of fills and 90.4% of strokes bound.**
Do not introduce paint styles — variables are the single mechanism.

### 2a · The accent chain — one blue, three rungs

| role | value | token | today |
|---|---|---|---|
| rest | `#1A56DB` (blue/700) | `--bk-accent` | ✅ 1,276 binds — **but the Button master binds `flowbite/blue/600` `#1C64F2`** |
| hover | `#1E429F` (blue/800) | `--bk-accent-hover` | ❌ bound **once** in the entire file |
| pressed | `#233876` (blue/900) | `--bk-accent-pressed` | ❌ bound **zero** times |
| on-accent | `#FFFFFF` | `--bk-accent-on` | ✅ 232 |
| subtle | `#E1EFFE` (blue/100) | `--bk-accent-subtle` | ✅ 118 |
| tint | `#EBF5FF` (blue/50) | `--bk-accent-tint` | ✅ 137 |
| text | `#1A56DB` | `--bk-accent-text` | ✅ 652 |

**The root cause, and it is one node.** Component set `9:102` `Button` defines
`Kind=primary, State=rest` → `flowbite/blue/600` and `State=hover` →
`flowbite/blue/700`. Every instance inherits it: **282 fill binds + 11 stroke
binds to `flowbite/blue/600`** across the five pages, plus 7 raw `#1C64F2`
fills (4 of them Settings buttons: `1702:7259`, `1702:7596`, `1703:7605`,
`1703:8069`). The code has no role whose value is `#1C64F2` — it exists only
as the `--bk-blue-600` palette rung — so **all 293 are unbuildable as drawn.**

Fix `9:102`'s two variant fills and re-publish; the instances follow.

### 2b · Bind roles, never primitives

**6,740 bindings (18.1%) reach past `color/*` straight to `flowbite/*`.**
A re-brand touching `color/accent` or `color/border` would miss one in five.

| primitive | binds | should be |
|---|---:|---|
| `flowbite/gray/500` | **4,065** (2,970 strokes + 1,095 fills) | **`color/icon` — a role that does not exist yet** |
| `flowbite/gray/100` | 650 | `color/bg-subtle` / `color/border` |
| `flowbite/gray/700` | 379 | `color/ink-soft` |
| `flowbite/blue/600` | 293 | `color/accent` (see 2a) |
| `flowbite/gray/50` | 260 | `color/bg-app` |
| `flowbite/blue/700` | 34 | `color/accent` (right value, wrong layer) |

**Add `color/icon` (= `#6B7280`) and `--bk-icon`.** 4,065 icon strokes have no
semantic role to bind to, which is why they bind a primitive — the same
mechanism as the type gaps above.

### 2c · The role set — keep, add a token, or retire

**Roles that work** (bind counts across all 5 pages): `ink-soft` 5,565 ·
`ink-muted` 5,210 · `ink` 4,794 · `bg-panel` 2,499 · `bg-subtle` 2,206 ·
`bg-card` 2,120 · `border` 1,842 · `accent` 1,276 · `border-input` 656 ·
`accent-text` 652 · `success` 500 · `ink-placeholder` 377 · `bg-app` 327 ·
`ink-inverse` 268 · `warning` 253.

**19 Figma roles have no `--bk-*` token** — a board using them cannot be built:
`bg-hover` `bg-active` `bg-selected` `bg-overlay` `bg-backdrop` `border-focus`
`border-hover` `focus-ring` `ink-placeholder` `ink-inverse` `ink-link`
`success-hover` `warning-hover` `error-hover` `bg-disabled` `destructive`
`chart/teal` `chart/amber` `chart/pink`.
Priority: `ink-placeholder` (377 binds) and `ink-inverse` (268) are in daily
use with no token at all. **Re-export `scripts/tokens/figma-tokens.json` and
regenerate.**

**26 of 93 colour variables have zero binds** — and they are the interaction
states: `accent-pressed`, `bg-hover`, `bg-backdrop`, `bg-disabled`,
`border-hover`, `focus-ring`, `success-hover`, `warning-hover`, `error-hover`,
`destructive` (a duplicate of `error`), the 3 `chart/*`, and 13 unused
`flowbite/*` rungs. Either draw those states or retire the roles.

### 2d · Values to drain

**4,882 raw (unbound) fills** remain, concentrated in `21 · Settings/S7`
(1,105), `05 · Media` (423), `07 · Brand` (300), `03 · Layers` (200).
`1:3` alone carries **144 distinct raw hexes** (75 excluding annotation and
prototype-hotspot layers). Priority order:

1. **Near-misses** — invisible in review, wrong in code:
   `#1A57DB` ×3 (`807:8367`, `807:8586`, `807:8636`) vs accent `#1A56DB`;
   `#9DA3AF` (`1205:4828`) vs gray-400 `#9CA3AF`; `#111928` ×3 vs ink `#111827`.
2. **A parallel blue family with no ramp membership** — `#4270D9` ×4,
   `#4063F2` ×2, `#3366D9`, `#3359B2`, `#738CF2`, `#D9E5FF` ×2, `#E8EDFF` ×2,
   `#F2F7FF`, `#6699F2`, `#80B2FF`, `#4D8CE5`.
3. **A violet-tinted neutral ramp** running alongside the Flowbite greys —
   `#6B6B70` (66), `#111113` (31), `#80808C` (28), `#121726` (28),
   `#0A0A0B` (17), plus `#D9D9E0` `#EFEFF0` `#D1D1D9` `#CCCCD1` `#9A9AA0`.
4. **Off-ramp semantics** — warning tint `#FFF7EB` ×4 (token `#FDFDEA`),
   greens `#269966` ×6, `#0D9E59`, `#80CC80`, `#33994D`.

**Not findings, recorded so they are not re-filed:**
purple appears only on PRO badges and Avatar identity tones (12 binds,
`12:14`/`12:15`, `691:431`/`691:446`) — the DESIGN.md allowlist exactly;
the Tailwind hexes on `05 · Media` are `swatch` content nodes (`1716:8431` et
al.); the 291 `#0000FF` nodes on `1:3` are all named `hotspot/*` prototype
markers.

### 2e · Elevation and focus

10 effect styles exist; Foundations `481:3981` documents **3**; the token file
defines **4** and its header comment still says "mirrors the 3 Figma effect
styles". Usage: `raised` 253 · `subtle` 127 · `dash/card` 88 · `modal` 28 ·
`focus-ring` 21 · `popover` 16 · `dash/modal` 4 · `focus-ring-error` 1 ·
**`drag` 0 · `overlay` 0** — the two the sheet documents beyond `raised` are
the two nobody uses. 235 nodes carry raw effects in 35 recipes across five
different shadow inks.

The three styles that DO map to tokens **do not match them** — Figma draws
two layers with negative spread, the tokens are one layer with none.

**Focus has four different answers:**

| source | value |
|---|---|
| Foundations `481:3991` | "2px accent border/outline, **no halo**" |
| effect style `elevation/focus-ring` | 3px spread halo, `#1A56DB@0.25` |
| variable `color/focus-ring` | `#1A56DB@0.25` |
| token `--bk-shadow-focus` | `0 0 0 2px rgba(26,86,219,0.30)` |

Pick one and make all four say it.

---

## 3 · The order of work

1. **`9:102` Button** — rebind primary rest/hover to `color/accent` /
   `color/accent-hover`; bind the 24 variants that carry raw hexes. One node,
   293 downstream fixes.
2. **Add the 5 new text styles and `color/icon`.** Nothing else can be bound
   until the targets exist.
3. **`1:2` Components masters** — 1,613 of `988:2`'s 3,021 TEXT nodes
   (53.4%) are instance children of masters on `1:2`, so binding ~30 masters
   there clears more than half of the Dashboard page without opening a board.
   (Every `B` brandmark resolves to `979:661` inside `979:658`
   `Dashboard / Top nav`; that one node is all 57 Inter Extra Bold 15 uses.)
4. **`988:2` Dashboard v2's remaining 1,408 local nodes.**
5. **The 7 sections at 0% on `1:3`** — Publish (221), Canvas (156), Preview
   (153), REVIEW·Insert (70), Ecommerce (58), Client sign-off (46),
   Reference-UX (28) — then Layers (17/561) and Settings/S7 (242/1,864).
6. **Re-export and regenerate the tokens** so the 19 orphan roles get tokens.
7. **Correct `DESIGN.md:148`** and add a rule frame beside `67:168` / `67:5`.

Use `17 · Compare` (`1776:8382`) as the worked example: 114/114 bound,
6 combinations, 1 raw fill. It is already right.
