# The editor does not tell anyone what to do — 2026-08-27

Founder, verbatim: *"job base ni hai editer. screens per client ko samjh ni ati
ka kya karna hai."*

This is an addendum to `docs/plans/2026-08-25-editor-ui-redesign.md`, not a
replacement. That arc is autoplan-reviewed with a binding founder scope
decision — every editor surface gets a redesign, a verification and an
implementation, in twelve per-family loops. It is a **surface** plan: it makes
each screen right. It does not answer *"what am I supposed to do here?"*, which
is the founder's actual complaint, so this addendum carries that half.

---

## Part 1 — is the design complete against the codebase?

`scripts/conformance/boards.json`: **422 boards — 366 active, 30 design-ahead,
26 out-of-scope**, across 34 families.

"design-ahead" means the board exists and the code does not. Those 30 are not
scattered: they are **seven features**.

| Feature | Boards | What is drawn |
|---|---|---|
| History · Backups | 7 | tab, creating, restoring, restored, restore-confirm, restore-failed, empty |
| Preview tools | 7 | accessibility checker, interaction test, share link, performance audit (+running, issue detail, all-clear) |
| Scheduled publish | 5 | S6.5 and its scheduled / cancel-confirm / invalid-date states, deploy-progress pipeline |
| Commerce | 3 | setup, sample-added, bound |
| Multiplayer | 3 | Shell state 13 · Presence, S5.8 cursor-following, S5.7 comment-thread micro-states |
| Site health | 2 | S7.1 monitor, and its healthy state |
| Publish · Options | 1 | — |
| Share permissions | 1 | S5.9 modal |
| Publish changelog | 1 | S6.3 diff-summary |

So the answer to *"kuch miss to ni hai?"* is: **the design is ahead of the code
by seven features.** Nothing in the shipped editor is undrawn — the gap runs the
other way.

---

## Part 2 — what the editor actually tells a user, measured

Opened at 1440×900 on a real session, default state. Every imperative sentence
on screen:

1. *"Select something on the canvas to edit it."* — the inspector's empty state.

That is the whole list. (The probe also caught *"Click Me"*, which is a button
**on the customer's page**, not guidance.)

There is a seven-step job model, and it is good:

> **Get started — 0 of 7 complete**
> Name your project · Choose a starting point · Add an element · Edit text ·
> Style an element · Preview your site · Publish your site

The active step expands with a real explanation — *"Give your project a name —
it shows in the browser tab and as the SEO site title"* — and a primary action
(**Open settings →**). This is exactly the job framing the founder is asking
for. **It already exists.**

It is collapsed into a 32×32 pill at **(1354, 803)** — the bottom-right corner,
below the canvas, beside the zoom readout.

### Three defects that keep it from working

**J1 — progress is keyed to the browser, not the site.**
`STORAGE_KEYS.ONBOARDING_PROGRESS` is `"buildrick-onboarding-progress"`, a
single global localStorage key; `useOnboardingOrchestrator.ts` reads and writes
it with no site or project scope. Two consequences, both wrong:

- Finish the seven steps on one site, and **every new site** you create says
  *7 of 7 complete* — the checklist is silent exactly where a blank site needs
  it most.
- Open a finished site in another browser and it says *0 of 7* — you are told
  to start work you did months ago.

**J2 — two signals in one tick lose a step.** `completeStep` reads
`stepsRef.current`, and `stepsRef.current = steps` is assigned **during render**
(`useOnboardingOrchestrator.ts:131-132`). Two completions before React
re-renders both read the pre-render value, and the second `setSteps` overwrites
the first.

Measured live: inserting one Heading emits `element:inserted` **and**
`style:changed` (four times). Two steps qualify — `add-element` and
`change-style`. The counter went **0 / 7 → 1 / 7**. One step, silently, is gone.

**J3 — the guidance is where nobody looks.** One sentence in the inspector, and
seven jobs behind a corner pill, against a rail of six nouns (Insert, Layers,
Pages, Media, Content, Brand). Nothing on the screen answers *"what now?"*
except a prompt to click something first.

---

## What this addendum proposes

Not a new job model — the seven steps are already written and well-worded. The
work is to fix what makes them useless and then give them the room they earn.

1. **Scope onboarding progress to the site** (J1). Per-site key at minimum;
   server-side if the founder wants it to follow the user across devices.
2. **Make `completeStep` safe against same-tick completions** (J2) — functional
   `setSteps` updates, or a queue. Then verify the insert case credits **two**
   steps, live.
3. **Promote the job model out of the corner** (J3) — the design decision, and
   the one to take through autoplan and the founder rather than decide here.

Only 3 is a design question. 1 and 2 are defects with mechanisms and
measurements, and they block 3 from being worth doing: promoting a checklist
that under-counts and mis-scopes would put a wrong number in the middle of the
screen.
