# U3 · Brand / design-system — walk record

Walked 2026-08-24 · localhost:3000, 1440×900, real session.
**No defect found.** Recorded as a pass, with what was and was not exercised.

## Legs

| # | leg | result |
|---|---|---|
| 1 | Brand panel IA | **PASS** — `Brand & shared theme`, a plain-language subtitle, `Open Shared theme ↗` (the link-out §12 #7 describes), a **Beginner / Pro** mode toggle, then drill-in rows: `Tokens (4) ›`, `Presets (18) ›`, `Starters`. Drill-in stack, which is the founder's stated preference. |
| 2 | tokens are live on `documentElement` | **PASS** — **17** inline `--buildrick-design-*` custom properties on `<html>`, and `--bk-accent: #1a56db` matches DESIGN.md's single accent. |
| 3 | starters | **PASS** — six offered (Buildrik Default, Stripe Blue, Notion Warm, Apple Minimal, Linear Dark, Vercel Mono), behind a drill-in that warns *"Applying a starter overwrites your tokens."* Applying Stripe Blue moved `--buildrick-design-color-primary` **#1A56DB → #635BFF**, and the element count was unchanged (9 → 9). "Restyles tokens, keeps elements" is true. |
| 4 | **the chrome/site token boundary holds** | **PASS** — not a PRD line; worth measuring because it is the kind of leak that ships quietly. Applying **Linear Dark** set the *site* primary to `#5E6AD2` (an indigo) while `--bk-accent` stayed `#1a56db` and the Publish button still painted `rgb(26, 86, 219)`. DESIGN.md's purple/violet/indigo ban is a CHROME rule, and a customer choosing an indigo brand does not violate it — the two namespaces are genuinely separate. |

## Not covered

Per-token undo; the four lint rules (no-black, banned purple/violet/indigo,
alias depth ≤3, contrast auto-fix to AA 4.5); the export formats (CSS with three
dark strategies / JSON / Tailwind, and the ⛔ Figma stub); JSON import and its
Replace / keep-mine / keep-theirs conflict strategies; and the inspector's token
binding with the Reach strip (This item / All like this / Whole site).

That last one carries a blast-radius confirm and is the highest-risk piece left
in this flow.

---

## Addendum, 2026-08-25 — Pro mode, and the linter naming its own palette

Lane of `docs/plans/2026-08-25-editor-flow-walk-arc.md`. The 08-24 record is 24
lines and closes **"No defect found. Recorded as a pass."** That was a pass on
*behaviour*; two of its "Not covered" items are now walked and one of them
produces a measured, named defect.

### Beginner hides most of the design system

| row | Beginner | Pro |
|---|---|---|
| Tokens | 4 | **55** |
| Classes | — | **3** |
| Components | — | **27** |
| Colour mode | — | present |
| Presets · Starters | 18 · 6 | 18 · 6 |

Consistent with the panel's own line — *"Basic mode hides what you cannot edit
yet. Switch to Pro to unlock."* — but worth the numbers: Beginner shows **4 of
55** tokens. Not a defect; a scale worth knowing before designing this panel.

### The linter works, and it fails the product's own palette

`Brand → Lint`, walked live:

```
Accent fails WCAG AA against the page background
  Fails WCAG AA on the page background · color-accent
Success fails WCAG AA against the page background
  Fails WCAG AA on the page background · color-success
Auto-fix isn't available yet — the linter reports what is wrong, not
what to replace it with. Edit the token in Tokens.
```

**This settles a condition three plans have carried as a sentence.** "The
palette fails its own WCAG lint" is no longer an assertion — the product's own
linter says it, on load, naming `color-accent` and `color-success` and the
surface they fail against. Anyone fixing it now knows which two tokens.

**PRD correction.** This record's uncovered-list described the fourth lint rule
as *"contrast auto-fix to AA 4.5"*. There is **no auto-fix**. The panel says so
plainly and says why: *"the linter reports what is wrong, not what to replace it
with"*. Honest copy, and a smaller feature than the PRD describes.

The footer here is the same one the redesign arc rates `R11` — "All changes
saved" beside a live `Discard` and `Apply Changes`. Visual, so out of this
instrument; noted for that lane.

### Lint's other rules and the export/import formats — WALKED 2026-08-25

#### The Lint screen

Two rows, both contrast, both naming their token:

> Accent fails WCAG AA against the page background · `color-accent`
> Success fails WCAG AA against the page background · `color-success`

and, under them, the disclosure this arc keeps finding on the good surfaces:

> Auto-fix isn't available yet — the linter reports what is wrong, not what to
> replace it with. Edit the token in Tokens.

There is **one** lint pipeline, not two. `LintSection` takes
`LintIssue[]` from `engine/designSystem/linter`, and `useDSLint.ts:44` adds the
contrast rule on top — *"Contrast is computed here, not in DSLinter — it needs
the resolved…"*. Eight rules ship: `contrast`, `banned-hue`, `pure-black`,
`empty-value`, `missing-dark`, `unresolved-binding`, `alias-depth-exceeded`,
`semantic-needs-alias` (`LintSection.tsx:37-47`).

**The other seven did not fire because this fixture does not violate them** —
`missing-dark`, for one, only fires "in a project that has any darkValue at
all", and this project has none (`0 dark variants`). Confirming a silent rule
needs a planted violation, and that is where this lane stopped — see the wedge
below.

#### Export — all four formats reached

| Format | State |
|---|---|
| CSS · Custom properties | renders, Copy + Download |
| JSON · Design tokens format | renders — `JSON.stringify(tokens)`, so a round-trip carries `kind` |
| Tailwind · theme.extend config | renders — but **colors only** (`exportUtils.ts:121-123` filters `t.type === "color"`). Typography, spacing, radius, shadow and the rest are dropped, and the label says "theme.extend config" without saying so |
| Figma Variables JSON | ⛔ *"Coming soon — export JSON and use the Figma Variables importer"* — a stub that names its own workaround |

Header stat: `14 kinds · 55 tokens · 4 alias edges · 0 dark variants`.

**The three dark strategies emit identically here, and that is correct.**
`CSSBundler.ts:71-86` branches three ways — `off` emits no dark block, `media`
emits `@media (prefers-color-scheme: dark) { :root { … } }`, `data-attr` emits
`:root[data-theme="dark"] { … }` — but all of it sits under
`if (darkColorLines.length > 0)`. With `0 dark variants` there is nothing to
emit, so switching the select changes nothing. Measured live (no
`prefers-color-scheme`, no `[data-theme` in any of the three) and matched to the
branch. **What is NOT verified is that `media` and `data-attr` differ on a
project that has dark values** — that needs a token with a `darkValue`, which
`Colour mode` can set (`Light / Dark` toggle, `NO DARK VALUE 17`, a `Set` per
token).

⚠ **The exported CSS carries two prefixes.** Colors and typography emit
`--buildrick-design-*`; motion, border, opacity, z-index, breakpoint, grid,
sizing, icon and imagery emit `--bd-*`. `toVar` writes each token's stored
`cssVar` verbatim (`exportUtils.ts:95`), so this is seed-data drift in the
site-builder token set surfacing in a customer's stylesheet. It is not a Gate 15
violation — that gate covers *chrome* tokens, and this is the site-builder DS,
a deliberately separate domain — but one exported file should not carry two
namespaces.

#### Import — parse, preflight and the three conflict strategies

Drop zone, "or click to browse", and an "or paste JSON" expander with an
explicit **`Parse`** button. Parsing a 3-token payload where one id already
exists gives:

    Detected     Design tokens JSON
    Valid tokens 3
    Errors       0
    Conflicts    1 ID collisions
    Resolve conflicts — 1 tokens already exist with the same ID.
      [Replace]  [Merge · keep mine]  [Merge · keep theirs]
    Apply 3 valid only

The Resolve box appears only when conflicts > 0, as designed.

⚠ **Two of the three strategies are the same branch.** `handleApply` filters on
`strategy === "keep-mine"` and sends `parsed.tokens` otherwise
(`ImportCard.tsx:189-192`), which the file's own header states —
*"merge-keep-theirs → all incoming tokens (same as replace for v1)"*. Three
buttons, two outcomes, and nothing on screen says so.

⚠ **"Valid" at parse time and "routable" at apply time are different checks.**
`parseImportJSON` calls a token valid when six fields are strings
(`importUtils.ts:33`) — `kind` is not among them. `inferKind`
(`useImportTokens.ts:42-49`) then maps only `colors`, `typography` and
`spacing`, with `default: null`, against **14** registries. A `kind`-less token
in any of the other eleven categories is counted in "Valid tokens N", counted in
"Apply N valid only", and then silently dropped — the result toast reports
`Imported · 1 modified · 0 added · 2 skipped`, a number with no names, though
`ImportStats.skipped` carries the ids. Measured exactly that way with a payload
using `category: "color"` instead of `"colors"`. With `kind: "color"` present the
same payload imports cleanly: `Imported · 0 modified · 2 added`, token count
55 → 57.

The product's own JSON export emits whole token objects, so an export→import
round trip carries `kind` and never hits this. It bites hand-written and
third-party JSON — which is precisely what a "paste JSON" box invites.

#### ⛔ After an import Apply, the Brand panel wedges on Import / export

Clean control group, same button, same click, same session:

    before Apply:  ‹ Import / export  →  back at root: TRUE
    after  Apply:  ‹ Import / export  →  back at root: FALSE

The back control is still rendered and still clickable; it does nothing.
Closing the panel with `✕` and reopening Brand returns to **the same screen** —
the panel remembers the drilled-in destination, so the wedge survives a close.
Reproduced four times across separate runs.

This is what stopped the planted-violation test: the only route to `banned-hue`
and `pure-black` is to import a violating token, and importing is what wedges the
panel away from Lint. So the rules are read in code and **not** observed firing,
and the reason is a defect rather than an omission.

#### Harness note

Every "back" click in the first four attempts landed on the topbar's
**`‹ Exit`** (x=16, y=14), not the panel's `‹ Lint` (x=72, y=156) — an
`x < 420` filter catches both, and Exit leaves the editor. That read as "back
navigation is broken" long before the real wedge was found. Constrain panel
controls to `y > 100`.

### Still not covered

Per-token undo; the other three lint rules (no-black, banned
purple/violet/indigo, alias depth ≤3) — only the contrast rule produced output
on this fixture; the export formats (CSS with three dark strategies / JSON /
Tailwind, and the ⛔ Figma stub); JSON import and its Replace / keep-mine /
keep-theirs conflict strategies; and the inspector's token binding with the
Reach strip.

### What this walk did NOT assess

Visual and IA. Behaviour, state and data only.
