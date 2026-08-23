# U1 · First-run builder → first publish — walk record

Walked 2026-08-24 · localhost:3000, 1440×900, real session.

## Legs

| # | leg | result |
|---|---|---|
| 1 | empty-canvas CTA | **PASS** (seen in the F-A1 walk) — *"Start with a template, or drop your first section"* with **Browse templates** / **Start blank** |
| 2 | onboarding checklist pill | **PASS** — bottom-right, reads `0 / 7 done` |
| 3 | **the checklist tracks real work** | **PASS** — inserting one element moved it `0 / 7 done` → **`1 / 7 done`**. It responds to what the user actually did, not to a tour being clicked through. |
| 4 | Preview ⌘P | **PASS** — opens an in-shell overlay (`data-testid="preview-overlay"`, `role="region"`) containing an iframe and a **Done** control; pressing ⌘P again closes it. |
| 5 | `WelcomeModal` + `SpotlightOverlay` orphans | **STALE CLAIM** — the PRD marks them ⛔ "orphans, never mounted". They have **0 references and no files**; they were deleted, not orphaned. |

## Two readings I got wrong here, and the reason is now a pattern

1. **"⌘P does nothing."** My probe measured whether the topbar and rail were
   still visible. The preview overlay does not hide them, so a working preview
   looked identical to a broken one. Probing for `[data-testid="preview-overlay"]`
   settled it in one call.
2. **"Nothing renders PreviewOverlay."** My grep found the render at
   `AquibraStudio.tsx:689` and I cut it off with `| head -4`.

That second one is the **fourth** time in two days that truncated output
produced a confident wrong conclusion (the others: `grep | head -10` hiding two
call sites, and two separate DOM dumps hiding the same "+ Save a version"
button). Every instance produced the same *kind* of error — a "this is missing"
finding about something that is present.

## Not covered

The achievement modal (4 s per completion), collapse-on-element-select, the
dashboard's "Edit site" entry into `/edit/:id`, and the final publish — which is
F-A3's untaken leg and SHIP-gate item 3.
