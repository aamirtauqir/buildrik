# Editor design audit — does every screen earn its place?

Goal (founder, 2026-09-04): deep audit of the Figma file for workflow, user
flow, UI and UX. Each screen is first tested against the **user's mental
model** — is this screen needed, and why — before any craft critique. Missing
jobs are in scope and must be added. Frames get rearranged. Findings go through
a codex review. Multiple agents; nothing counted done until verified.

Contract for every agent: `BRIEF-DESIGN-AUDIT.md`. Findings land in
`findings/<letter>.jsonl`.

## Ground truth — 27 sections, read live 2026-09-04

| Module | node | frames | wave |
|---|---|---|---|
| Media | 1776:8372 | 40 | A |
| Insert | 1776:8379 | 15 | A |
| Brand | 1776:8373 | 34 | B |
| Inspector | 1776:8381 | 10 | B |
| Canvas | 1779:5 | 3 | B |
| Ecommerce | 1779:6 | 2 | B |
| Settings/S7 | 1776:8387 | 45 | C |
| Shell | 1776:8385 | 17 | C |
| Review | 1776:8383 | 23 | D |
| Client sign-off | 1776:8384 | 10 | D |
| Compare | 1776:8382 | 8 | D |
| Notifications | 1779:2 | 6 | D |
| History | 1776:8374 | 21 | E |
| Publish | 1776:8378 | 14 | E |
| Preview | 1779:4 | 6 | E |
| Command palette | 1779:3 | 7 | E |
| Content | 1776:8376 | 18 | F |
| Pages | 1776:8377 | 13 | F |
| Layers | 1776:8375 | 18 | F |
| AI | 1776:8380 | 11 | F |
| Journeys · S-flows | 1776:8388 | 74 | G |
| Notes | 1776:8389 | 40 | meta |
| 📄 Reference | 862:6859 / 862:6860 | 47 | meta |
| 🗃️ Archive | 957:4474 | 20 | meta |
| 🔍 REVIEW ×2 | 1084:4527 / 1090:4527 | 17 | meta |

341 product screens + 74 journey screens + 124 meta.

## Coverage log

Each agent appends its own section. A module with no coverage line has not been
audited, regardless of how many findings mention it.
