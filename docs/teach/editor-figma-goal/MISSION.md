# Mission

**Learn how to instruct an AI coding agent to implement a Figma design into the
Buildrik editor — cleanly, as one autonomous goal, with tests that verify the
result against both the design and the Figma file — the way a real developer
would.**

## Why this matters to me

I (founder, solo) want my editor to match my Figma foundations
(`g4GzQFqzNYz5sosz1QtZXC`, node 32-2). I do not write this kind of code myself.
I direct an agent. So the skill I actually need is not CSS — it is **writing a
good goal for the agent**: scoped, phased, verifiable, with the old design
removed and the codebase left clean. I also need to know how to make it
self-verifying (tests vs Figma) and how to tell the agent about vibcoder (my
component library), which I do not understand.

## Success looks like

- I can hand my agent one goal and it implements the Figma language across the
  whole editor chrome, removes old/drifted styling, and stays clean.
- The agent writes tests that fail if the design drifts from Figma.
- I understand each part of the goal well enough to adapt it next time.

## Constraints

- Cost-anxious. Prefer worked examples over long drills.
- Roman-Urdu conversation, English in code/artifacts.
- The Figma is FOUNDATIONS ONLY (tokens) — it has no new screen layouts.
