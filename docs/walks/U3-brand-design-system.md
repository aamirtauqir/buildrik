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

### Still not covered

Per-token undo; the other three lint rules (no-black, banned
purple/violet/indigo, alias depth ≤3) — only the contrast rule produced output
on this fixture; the export formats (CSS with three dark strategies / JSON /
Tailwind, and the ⛔ Figma stub); JSON import and its Replace / keep-mine /
keep-theirs conflict strategies; and the inspector's token binding with the
Reach strip.

### What this walk did NOT assess

Visual and IA. Behaviour, state and data only.
