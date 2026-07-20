# Figma execution plan — from empty file to 56 screens

> ## ⛔ CLOSED 2026-07-20 — do not execute this
>
> This planned six weeks of work to build the Figma file from empty. **That file
> is built** — 309/309, verified by querying the live file rather than reading a
> checklist. Following this plan now means redoing finished work.
>
> **The live plan is `2026-07-20-ship-plan.md`** (Part I of the book).
>
> Kept because the gates were the useful part and two of them earned their place:
> **Gate A** caught a first PASS that was false (collapsed pills hiding rather
> than fitting), and **Gate B**'s arithmetic check is what surfaced that all five
> shells were empty geometry with no content in them. **Gate C has still not been
> run** and is the only gate outstanding — it moved to the ship plan.


> **The schedule, not the spec.** `DESIGNER-BRIEF.md` says what to draw; `2026-07-20-figma-working-rules.md` says how to work. This says **in what order, with what checkpoints, and where it can go wrong.**
>
> Written 2026-07-20. Assumes **one full-time designer**. Day counts are planning estimates for sequencing, not commitments — the useful thing about them is their *ratio*, not their absolute value.

---

## The shape of it

```
  P0  Foundations      1d    variables · text · icons
  P1  Atoms            3d    Row · Button · Input · …
  P2  Molecules        3d    Drawer 320 · Panel 360 · Card · …
      ╞═ GATE A ═══════════  does 320w survive Media and Brand?
  P3  Shells           2d    editor 1440+1280 · Site/Portfolio · modal ×3
      ╞═ GATE B ═══════════  does the arithmetic hold at 1280?
  P4  The wedge        3d    J5 ×6 — the reason the product exists
      ╞═ GATE C ═══════════  put S5.5 in front of a real agency
  P5  Editor screens   8d    shell states · 7 panels · inspector
  P6  Floating + modal 3d    ⌘K · Versions+Compare · Issues · AI · 8 modals
  P7  Site             3d    14 destinations
  P8  Portfolio        2d    6 destinations
  P9  Loose ends       2d    Review panel · Notifications · Integrations
                     ─────
                      30d    ≈ 6 weeks, one designer
```

**Phases 0–3 are the system. Phases 4–9 are assembly.** If P0–P3 are rushed, P4–P9 take longer than the time saved — that is the whole reason the order is this way.

---

## P0 · Foundations — 1 day

**Nothing else starts until this exists.**

| Deliverable | Detail |
|---|---|
| Variable collection `Package` | two modes: `Editor` · `Dashboard` |
| `color/accent` | **one variable, two modes** — both `#406ED6` since 2026-07-20. The modes survive as the guard against a second blue reappearing, not because the values differ. |
| Remaining colour, spacing, radius, size variables | `figma-working-rules.md` §2 Tier 0 |
| Text styles | General Sans · Inter Tight · Geist Mono, the 9-step scale |
| Icon library | **real Lucide**, not redrawn |
| File pages | Foundations · Components · Editor · Site · Portfolio · Client review · Archive |

**Done when:** a test frame set to `Dashboard` mode renders `#406ED6` with no layer-level colour choice anywhere.

⚠ **The single highest-leverage hour of the project.** Get the accent modes wrong and every dashboard surface ships the wrong blue, invisibly.

---

## P1 · Atoms — 3 days

Row · Button · Input · Select · Checkbox · Toggle · Slider · Icon frames · Status dot · Badge · Tooltip.

**Row is the one that matters.** It appears **40 times** across the specs. Sizes `28 · 32 · 44 · 56 · 64`, states `rest / hover / selected / disabled`, slots for icon · label · meta · trailing.

**Done when:** every atom has all five control states, and `disabled` carries its tooltip *inside the variant* so it cannot be forgotten.

---

## P2 · Molecules — 3 days

Panel header 44h · Section header 28h · **Drawer frame 320w** · **Right panel frame 360w** · Nav item 32h · Card (two sizes) · Empty state · Progress row 44h · Comment row 64h.

**Done when:** the drawer frame is one component that seven surfaces will instance, and the 360w panel is one that three will.

### ╞═ GATE A — the 320 test

**Before P3. This is the gate the brief warns about twice.**

Take the drawer molecule and pour the **two heaviest cargoes** into it: **Media** (grid, folders, 5 drill-ins) and **Brand** (9 sections, token detail, typography upload).

| Result | What happens |
|---|---|
| Both fit at 320w | proceed — the frame is proven |
| Either does not fit | **stop.** The drawer molecule changes, and so does every screen that would have used it. Cheap now, expensive after P5. |

**Do not draw these as finished panels yet** — this is a fit test, not the deliverable. Rough cargo, real dimensions.

---

## P3 · Shells — 2 days

- **Editor shell** — auto-layout, at **1440 and 1280**, with boolean properties for page tabs · recovery banner · Review rail item.
- **Site / Portfolio shell** — 56h header + 240w nav + content, one variant for the content max (720 form / 1000 grid).
- **Modal frame** — three widths, `440 · 560 · 580`.

### ╞═ GATE B — the arithmetic

Check with a calculator, not by eye:

```
1440 transient   60 + 1080 + 300           = 1440 ✓
1440 pinned      60 + 320 + 760 + 300      = 1440 ✓
1280 transient   60 + 920 + 300            = 1280 ✓
1280 pinned      auto-released below 1380
vertical         56 + 36 + 776 + 32        = 900  ✓
```

**Every one of these has been wrong in a document at some point.** That is why it is a gate.

---

## P4 · The wedge — 3 days

**J5, six screens.** `2026-07-18-j5-signoff-wireframes.md` — wireframes exist at full fidelity; take them to hi-fi.

**Start with `S5.5`, the client review page.** It has **zero dependency on the editor shell** — different package, dashboard mode, no rail, no drawer, no inspector. It is the one screen Sara ever sees, and the product's `#1 priority`.

### ╞═ GATE C — the only gate that is not about design

**Put `S5.5` in front of a real agency and a real client before P5.**

Not a usability lab — one agency, one link, one honest reaction. The question is not "is it pretty", it is:

> Would you send this to a paying client, and would they know what to do without you explaining it?

**This is the highest-value hour in the whole plan**, because it is the only one that tests the thing the company wins on. Everything after P4 is table stakes; this is not.

---

## P5 · Editor screens — 8 days

| | Days |
|---|---|
| Shell states — 12, as **variants** not frames | 1 |
| Media panel + 5 drill-ins | 2 |
| Brand panel + 9 sections | 2 |
| Insert · Layers · Pages · Content | 1.5 |
| Inspector — 7 profiles, 12 control anatomies | 1.5 |

Media and Brand were already fit-tested at Gate A; here they become real.

---

## P6 · Floating panels + modal kit — 3 days

⌘K (640w) · Versions + **Compare** (three modes) · Issues · AI panel · then the **8 modal instances** on the P3 frame.

**Compare is the wedge's core screen** and it is the most expensive thing in this phase. All three modes are buildable — snapshots already exist server-side (`backend-readiness.md` §1).

---

## P7 · Site — 3 days

14 destinations, but **one shell and one field pattern** — after the first three, the rest go quickly. Includes the Integrations hub and its two connection shapes.

---

## P8 · Portfolio — 2 days

6 destinations. Sites grid · shared templates/components/brand kits · **brand push** (5-step modal, backend already complete) · handover.

---

## P9 · Loose ends — 2 days

Review panel (drawer instance) · Notifications (360w panel instance) · Integrations detail screens. **All three are instances of frames built in P2** — that is why they are last and why they are fast.

---

## What can run in parallel

Almost nothing — one designer, mostly serial. Two exceptions:

1. **`S5.5` can be drawn any time after P0.** No shell dependency. If you want the Gate C signal earlier, pull it forward to right after Foundations.
2. **Engineering does not wait.** The review-loop migration (`system-contracts.md` §1.2) should start at P0, not at P4. It is the longest lead time in the project and the only thing the wedge is blocked on.

---

## Review checkpoints

Five, and each is short:

| After | What is reviewed | Who |
|---|---|---|
| **P0** | accent modes, token names | founder + engineering |
| **Gate A** | does 320 hold | founder |
| **Gate B** | arithmetic at both widths | anyone with a calculator |
| **P4 / Gate C** | the client page, with a real agency | **founder — do not delegate this one** |
| **P6** | Compare, all three modes | founder + engineering |

Everything else can be reviewed in a batch at the end of its phase.

---

## Where this plan can go wrong

| Risk | Signal | What to do |
|---|---|---|
| **P0–P2 rushed** to "get to screens" | components made *while* drawing screens | stop; the redraw cost is larger than the time saved |
| **Gate A skipped** | Media drawn as a finished panel before the fit test | stop; if 320 fails afterwards, P5 is redone |
| **Gate C skipped** | "we'll test after launch" | this is the one that decides the company |
| **Detaching starts** | one instance "just for this screen" | it stops receiving fixes; add a variant instead |
| **Behaviour invented** | a screen answers *who may* or *what happens next* with no doc behind it | ask — layout may be invented, behaviour may not |
| **Wedge slips to last** | P4 keeps moving right | it is the least-built and most important part; protect its slot |

---

## The honest summary

**Six weeks, one designer, and two of the thirty days matter more than the other twenty-eight:** the day building accent modes and token structure, and the day putting the client review page in front of a real agency.

Everything else is careful assembly of things already decided.
