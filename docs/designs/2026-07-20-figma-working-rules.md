# Figma working rules — build the system, then the screens

> **Read before opening Figma.** Every other document says *what* to draw. This says *how to work* so that 56 screens do not become 56 hand-built one-offs.
>
> The rules below are specific to this product. Generic Figma advice is skipped — what is here exists because this particular spec set will break in this particular way if it is ignored.

---

## 1. Why components first, in numbers

Counted across the eleven spec documents:

| Element | Times it appears |
|---|---|
| **32h row** | **40** |
| 44h header / action row | 23 |
| 56h topbar / card / comment row | 20 |
| 28h group header | 13 |
| **320w drawer** | **12** |
| 360w right panel | 6 |
| 240w nav | 3 |

**A 32h row appears forty times.** Draw screens first and you draw it forty times — then someone changes row height to 34 and forty rows need finding. The `320w` drawer is one frame that serves **seven** surfaces (six rail panels plus the conditional Review panel). The `360w` panel serves **three** (Versions, Issues, Notifications).

**Roughly 56 screens are built from roughly 30 components.** That ratio is the whole argument. Build the 30 first.

**The order is not a preference.** Anything drawn before the component it should have used gets rebuilt, and the rebuild is invisible until someone changes the component.

---

## 2. Build order

### Tier 0 — Variables, before a single frame

**Colour, with modes — this is the one that will bite.**

This product has **two accents, and which one applies depends on the package, not the screen**:

| Package | Surfaces | Accent |
|---|---|---|
| **editor** | shell · rail · drawer · inspector · canvas · footer · **Site** | cobalt `#2D6DFF` |
| **dashboard** | **Portfolio** · **the client review page** | `#406ED6` |

⚠ **Do not make two variables called `accent-editor` and `accent-dashboard`.** Someone will pick the wrong one, and the mistake is invisible — a blue that looks right on a blue-adjacent screen. This already happened once in the written spec: the client review page was documented as cobalt for a day.

**Do this instead:** one collection, `Package`, with two modes — `Editor` and `Dashboard`. One variable, `color/accent`. Set the mode on the page or on the top-level frame, and every nested component resolves correctly with no per-layer choice. A designer working on Portfolio physically cannot paint it cobalt.

Then the rest, straight from `DESIGN.md`:

```
color/    accent (2 modes) · ink (slate-700 #334155, never pure black)
          ink-soft · surface · surface-subtle · border
          success · warning · danger   (red = error/danger/destructive ONLY)
spacing/  2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64          (4px base)
radius/   sm 4 · md 8 · lg 12 · full 9999
size/     row-dense 28 · row 32 · header 44 · topbar 56 · row-tall 64
```

**Purple, violet, indigo are banned.** Not "avoid" — banned, product-wide, as an AI-slop guard.

### Tier 0.5 — Text styles

```
display/  General Sans     600–700, marketing only
ui/       Inter Tight      11 · 12 · 13 · 14 · 16 · 20 · 24 · 32 · 48
data/     Geist Mono       tabular-nums — every dimension, timestamp, slug,
                           file size, count
```

Editor chrome lives at **12–14**. Named styles you will use constantly: `ui/13-400` row label · `ui/13-500` page name · `ui/14-600` panel title · `data/11-500` mono.

**No system fallbacks anywhere.** No `system-ui`, no `-apple-system`, no Arial, Helvetica, Roboto, Segoe.

### Tier 1 — Atoms

| Component | Variants that matter |
|---|---|
| **Row** | size `28 · 32 · 44 · 56 · 64` · state `rest / hover / selected / disabled` · slots for icon, label, meta, trailing |
| **Button** | `primary / secondary / ghost / destructive` × `sm / md` × `rest / hover / focus / disabled / loading` |
| **Input** | 36h · `rest / focus / error / disabled` · optional prefix and suffix |
| **Select · Checkbox · Toggle · Slider** | same five states each |
| **Icon** | 16 · 24 · 32 frames. **Use the real Lucide set** — the product ships 368 Lucide icons. Drawing your own means engineering cannot match them. |
| **Status dot** | `live · review · changes · draft · failed` |
| **Badge / pill** | `neutral · success · warning · danger · pro` |
| **Tooltip** | one component. Every disabled control needs one. |

⚠ **`disabled` is not one state, it is a state plus a reason.** This product's rule is *disabled, never hidden* — and every disabled control carries a tooltip naming why (`Admins can rename shared components`). Build the tooltip into the disabled variant so it cannot be forgotten.

### Tier 2 — Molecules

| Component | Serves |
|---|---|
| **Panel header 44h** — title · pin · close | all 7 drawer surfaces |
| **Section header 28h** — label + count | every panel, every list |
| **Drawer frame 320w** — header + optional search 36h + body | **7 surfaces** |
| **Right panel frame 360w** — header 48h + optional filter 36h + body + optional footer 44h | **3 surfaces** |
| **Nav item 32h** — 3px accent left bar when active | Site nav · Portfolio nav |
| **Card** — media `136×104` · portfolio site `232×180` | two sizes, one component |
| **Empty state** — icon + line + optional action | 11 surfaces have written copy |
| **Progress row 44h** | upload · export · publish · push |
| **Comment row 64h** — author marker for internal vs client | Review panel · canvas threads |

### Tier 3 — Organisms and frames

- **Editor shell 1440×900** — the master. Every editor screen is an instance with different cargo.
- **Site / Portfolio shell** — 56h header + 240w nav + content. **Same anatomy, different content max**: Site 720 (a form), Portfolio 1000 (a grid). Same component, one variant.
- **Modal frame** — 3 widths only: `440` question · `560` flow · `580` form. A fourth width is a new decision every time.
- **Client review page** — its own frame, dashboard mode, no editor chrome at all.

### Tier 4 — Screens

Only now. Each screen is instances plus content.

---

## 3. The traps — what will actually go wrong

### 3.1 Absolute positioning instead of auto-layout

The drawer is **transient by default and pinned by choice**, and the canvas width changes between them: `1080` transient, `760` pinned at 1440. If the shell is absolutely positioned, that is two hand-built frames that drift.

**Auto-layout the shell horizontally**: rail `60` fixed → drawer `320` fixed → canvas **fill** → inspector `300` fixed. Then the drawer's presence resizes the canvas for free, and 1280 works without redrawing.

Same vertically: topbar `56` → page tabs `36` → band **fill** → footer `32`.

### 3.2 Conditional regions drawn as separate frames

Three regions come and go:

| Region | When |
|---|---|
| Page tabs 36h | only when the site has >1 page |
| Recovery banner 40h | only after a crash recovery |
| Review rail item | only while a review is live |

Drawn as frames, every combination is a new frame — and there are four vertical arithmetic cases (`812 / 776 / 772 / 736`). **Boolean properties on the shell component**, and the auto-layout does the arithmetic.

### 3.3 States as frames instead of variants

The shell has **twelve** states. The Review panel has ten. Compare has three modes.

As separate frames: 12 frames to update whenever the topbar changes. As variants on one component: one edit. **Anything with more than three states is a variant set.**

### 3.4 Detaching

The single most expensive habit. Someone detaches an instance to tweak one padding, and that instance stops receiving every future fix.

**Rule: never detach.** If you need something the component cannot do, add a variant or a property to the component. If that feels wrong, the component is wrong — say so.

### 3.5 The two accents

Covered in Tier 0, repeated because it is the one that ships wrong: **Portfolio and the client review page are not cobalt.** Modes make this impossible to get wrong; two separate variables make it likely.

### 3.6 Drawing only 1440

Minimum supported is **1280 × 720**. At 1280 the canvas is `920` transient, and **pin auto-releases below 1380** — a real behaviour with a toast, not a hypothetical.

**Draw the shell at both widths before treating it as done.** Discovering 1280 in build means rebuilding.

### 3.7 Lorem ipsum

Placeholder text hides every layout failure. Use real content, and stress it:

| Surface | Stress with |
|---|---|
| Pages panel | 40 pages, nested 3 deep |
| Layers panel | 200 layers at depth 5 — a 28h row at depth 5 leaves 120px for the name |
| Site name in topbar | something long enough to truncate |
| Media | 200 assets, and one with no thumbnail |
| Review panel | 12 comments across 4 pages, 2 detached |

### 3.8 Icons drawn by hand

368 Lucide icons ship in the product. Hand-drawn icons cannot be matched by engineering and will be silently swapped, so what ships is not what was designed.

### 3.9 Naming that does not survive handoff

`Frame 4212` costs an engineer ten minutes every time. Name for the thing, not the shape.

```
✅  Drawer / Header
    Row / 32 / Selected
    Panel / Versions / Approved-anchor
    Shell / Comment-mode

❌  Frame 4212 · Group 7 · Rectangle 3 · panel copy 2
```

### 3.10 Designing what the server cannot do

`2026-07-20-backend-readiness.md` (Part III) marks every surface. Most are backed by working routers. **The wedge is not** — its screens need a schema migration first. Draw them anyway; the contracts settle every behaviour question. But if you find yourself inventing a *behaviour* rather than a layout, stop and ask — that is the difference between drawing a screen and drawing a promise.

---

## 4. The rules, short enough to remember

1. **Variables and text styles before the first frame.** Colour uses **modes**, not two accent variables.
2. **Build tiers in order** — atoms, molecules, organisms, then screens. Nothing drawn before the component it should use.
3. **Never detach.** Missing capability means a missing variant; say so.
4. **Auto-layout everything structural.** Absolute positioning only for genuinely floating things (the canvas toolbar pill, comment pins).
5. **More than three states → a variant set**, never separate frames.
6. **Conditional regions are boolean properties**, not extra frames.
7. **Real Lucide icons**, never hand-drawn.
8. **Real content, stressed.** No lorem ipsum reaches review.
9. **Draw 1440 and 1280.** Both, before calling a frame done.
10. **Name for the thing.** `Row / 32 / Selected`, not `Frame 4212`.
11. **Disabled always carries its reason.** Built into the variant.
12. **One accent decision, made by the page mode** — never by picking a colour.
13. **When a spec and a component disagree, ask.** Do not quietly design around it; that is how a documented decision gets lost.
14. **Verify before you build on it.** These documents have been wrong — 42 claims in one audit, a canvas width off by 320px, a media cell that overflowed its own panel by 8px. If a number anchors a component, check it adds up first. A wrong number inside a component propagates to every instance.
15. **"I don't understand this" is enough reason to stop and ask.** You do not need to diagnose it first. **Layout you may invent. Behaviour you may not** — who may act, what happens next, what it looks like while loading. If you cannot find the behaviour written down, it is a question, not a gap to fill.

---

## 5. File structure

```
Buildrick — Product
├── 📕 Foundations      variables · text styles · icon library
├── 🧩 Components       atoms → molecules → organisms
├── 🖥️  Editor           mode: Editor      shell + panels + inspector + floating
├── 🗔 Site              mode: Editor      14 destinations
├── 🏢 Portfolio         mode: Dashboard   6 destinations
├── 👤 Client review     mode: Dashboard   the wedge — 1 page, 10 states
└── 🗃️  Archive           superseded work, never deleted mid-project
```

**One file, pages by surface, mode set at the page level.** Splitting editor and dashboard into two files means two component libraries and a drift problem within a month.

**Set the mode on the page, once.** That is what makes §3.5 impossible to get wrong.
