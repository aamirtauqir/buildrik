# Mission

## What I want to be able to do

Hand my UI-UX designer the Buildrick editor design docs and have them **design every screen from the docs alone** — without asking me what a panel is, how wide it is, what happens when it's empty, or which of two contradictory sentences to believe.

## Why this matters right now

The editor redesign is written down across six documents (IA, placement map, 56 screen specs, feature improvements, works/broken state, J5 wireframes). Four independent audits on 2026-07-18 found the same thing:

> "You cannot start designing tomorrow. This is an excellent **product decision record** and a poor **design brief**."

Concretely, at the time of the audit:
- 912 lines carrying **exactly one dimension** ("4px base spacing")
- **6 of 47 screens** designable — only the J5 wedge, because only it had real wireframes
- ~50 internal contradictions; two designers reading the same sentence would draw different products
- The chrome arithmetic had never been done — the shell didn't fit its own viewport

So the gap is not knowledge of the product. The product is understood better than most. The gap is **knowing what a designer actually needs on the page, and how to tell when a spec has it.**

## What success looks like

1. A designer reads the docs and starts drawing on day one, with zero clarifying questions about structure.
2. I can look at any section of a spec I wrote and say "this is buildable" or "this is a decision record pretending to be a spec" — and know exactly which line proves it.
3. Every new screen spec I write passes a checklist before it ships, so audits stop finding the same class of gap.
4. I stop shipping arithmetic that doesn't add up.

## Constraints and context

- **Role:** founder, not a trained designer. I make product calls; I hire out execution.
- **Product:** Buildrick — a visual website builder for agency designers. Desktop-only editor. Wedge = client sign-off.
- **The docs are real and live.** Every lesson should use my own doc as the worked example, not invented examples.
- **Language:** explain in Roman Urdu + English mix. Concrete worked examples over abstract theory — a story with real screens beats a bulleted principle every time.

## Not the mission

- Becoming a visual designer myself (colour, type, icon craft).
- Learning Figma tooling.
- Design systems theory for its own sake.

The mission is **specification**: making the handoff artifact complete.
