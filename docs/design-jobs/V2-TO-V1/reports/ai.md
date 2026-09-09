# V2 → V1 — AI experience (`ai`)

**Target:** page `1:3`, section `1776:8380` "12 · AI" · **Source:** page `2668:2`
(`2797:362`, `2797:342`, `2797:2`) + `docs/design-jobs/V2-TO-V1/slices/ai.json`
(23 UX findings + 1 module-summary row).

## Status of this run: PLAN-ONLY. Nothing was written to Figma.

The Figma MCP **seat quota** was exhausted account-wide while this module was
working. It is a seat cap on the Professional plan, not a rate limit: backoff
does not clear it and a read costs the same as a write. Fifteen agents shared
one seat. The coordinator confirmed it at parent level and ordered a hard stop.

**Exactly one `use_figma` call succeeded** — a listing of section `1776:8380`.
Every subsequent call, across ~15 retries over ~25 minutes and three separate
retry loops, returned the quota string. **No board was created, no text was
changed, no node was moved, and no clone was made.** There are no `.done`
markers and every output file holds the quota string; that was checked before
the jobs were killed.

`node scripts/figma/verify-invariants.mjs` was **NOT run** — under the stop
order it would return the quota string, and a quota string is not a measurement.
It is step 10 of the run order in `plans/ai-00-manifest.json`.

### What I actually read from the file, versus what I inferred

This distinction is the load-bearing part of this report.

**READ** (one successful call, 2026-09-07) — section `1776:8380` "12 · AI · 25",
`@0,63897`, `2480x5200`, 25 children, each with id / type / x,y / w×h /
reaction-count / name. That is 14 boards and 11 captions, listed in full in
`plans/ai-00-manifest.json → sectionAtRead`. Everything I say about board ids,
sizes, positions, reaction counts and free grid slots comes from there and is
trustworthy.

**INFERRED, NOT READ** — every *child* node id inside a board: `170:16`,
`170:22`, `170:27`, `170:28`, `171:132`, `171:133`, `171:134`, `171:135`,
`171:164`, `171:165`, `171:166`, and the prompt-frame pair `170:7`/`170:8`.
These come from `findings/FIG-K.jsonl`, `findings/W-K.jsonl` and
`docs/design-jobs/applied/plan-text*.json`, dated 2026-09-06. Every plan row
that uses one carries `idSource: "inferred"` **and** an `expect` guard, so a
stale id refuses instead of overwriting the wrong node.

**UNRESOLVED** — rows written against a selector (section id + board name + text
prefix, or a frame-name regex) because no id exists for them at all: everything
on the two boards that have not been cloned yet, and the `/prompt/i` frame on
`170:2`. Each is resolvable by the applier inside the same call that writes it.

### The deliverable that does exist

Six plan files and one new script, all locally verified:

| file | what it applies | verified |
|---|---|---|
| `plans/ai-00-manifest.json` | run order (11 calls), the section read, free slots, safety rules | JSON parses |
| `plans/ai-01-decision-boards.json` | the three decision boards A / B / C | JSON parses |
| `plans/ai-02-state-boards.json` | `AI · scoped-multi` + `AI · error-provider`, clone + copy | JSON parses |
| `plans/ai-03-text-not-configured.json` | 3 `apply-text-fixes` rows, all with `expect` | bare array, 3 rows |
| `plans/ai-03b-caption-not-configured.json` | caption `172:43`, **dry-run-first** (its `expect` is a placeholder by design) | bare array, 1 row |
| `plans/ai-04-blocked-state-actions.json` | additive second action on both blocked states + the quota meter | JSON parses |
| `plans/ai-05-owed-by-other-modules.json` | 19 cross-module rows | JSON parses |
| `scripts/figma/build-ai-v2-boards.mjs` | steps A–F | `node --check` passes; all six payloads dry-run under the 19 000-char cap (7 741 / 11 761 / 10 935 / 4 568 / 4 425 / 4 470) |

**The central design decision**, which the brief asked for explicitly: the V2
navigation census names two AI homes — the right inspector (⌘J) and the left
drawer (bare `I`) — running two independent threads. Board **A** draws that
decision instead of leaving both undifferentiated: **the inspector column is the
home**, one thread lifted out of component state, one shortcut (⌘J), one ⌘K row.
The bare-`I` mount, the ⌘K "Open AI panel" destination and the legacy topbar
entry are marked RETIRED, and all nine doors are tabulated with where each lands
today and what happens to it. `FIG-K-12`'s proposed "AI · left-panel variant"
board is **deliberately not built** — drawing it would preserve the thing the
decision removes. That is the founder call `FIG-K-12` left open, made.

Verified in code while deciding: `useEditorShortcuts.ts:168-172` binds ⌘J to
`composer.emit("ui:switch-tab",{tab:"ai"})` and comments *"AI is one surface
now"* — the comment is already the decision; the product does not obey it,
because `tabsConfig.ts:87-97` still registers `ai` with shortcut `I` and
`TabRouter.tsx:141-142` still mounts it in the drawer.

---

## One row per finding

Read-back evidence is quoted **only** where it exists. It exists in exactly one
form: the section listing. Nothing else can carry evidence, because nothing else
was written.

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-G-01** *Critical* | Say what is true; give the state a real exit; never point at a settings page that cannot change the thing | `171:136` (AI · not-configured), children `171:164` / `171:165` / `171:166` | 3 `apply-text-fixes` rows written to `ai-03`: title → "AI isn't available on this workspace.", body names `OPENAI_API_KEY` / `OLLAMA_BASE_URL` as a *server* setting and says "Nothing was changed", link → "Contact your workspace owner". The second action is added by `ai-04`. | Board `171:136` confirmed present `@100,1666 280x812 rx1`, name "AI · not-configured". The three child ids are **inferred** from `FIG-K-20`, guarded by `expect`. | **BLOCKED-ON-QUOTA** |
| **UX-G-02** *Critical* | One home for the AI panel; route every entry point through the same event; lift the thread out of component state | new board A; touches Shell / palette / Inspector boards owned elsewhere | Decision board **A** authored in full: decision band, nine-door table, footnote, and an explicit "deliberately not drawn" line for the left-drawer variant | none — not written | **BLOCKED-ON-QUOTA** |
| **UX-G-07** *Critical* | Gate the button on the same flag as its client; no raw exception message on an AI surface | `2476:12029` (Brand generate modal) in my section; the CTA itself lives on a Brand board | Board **B** carries the rule and the flag footnote; the Brand CTA change is filed as owed | Board `2476:12029` read: `@500,4174 700x470 rx0`, name **"[not-implemented] Brand · generate component with AI — the schema has nowhere to go"** — so the AI section already marks it honestly | **BLOCKED-ON-QUOTA** (board B) / the existing `[not-implemented]` mark is **ALREADY-CORRECT** on the read |
| **UX-G-09** *Critical* | Route both through the typed client and give each a real failure state — the placement map says retire them instead | **no board draws either feature** | Board **C** puts the version-diff summary and milestone naming under MUST NEVER HAVE ONE, with the `ai.summarize` correction stated on the board; filed as owed to History | A grep of the whole findings corpus for "Get AI Summary" returns only `UX-G.jsonl`, and "milestone" returns only `1776:8380 / 171:105` — there is no board to un-draw | **BLOCKED-ON-QUOTA** (board C) / **NOT-APPLICABLE** as a board edit |
| **UX-G-03** *Major* | Disable the composer with the reason stated up front; do not refuse after the prompt | new "AI · scoped-multi", cloned from `170:17` | `ai-02`: clone command + three copy rows (band → "Scope: 3 selected", note → the refusal stated before the prompt, composer placeholder → "Select one element to use AI here", drawn disabled at `#D1D5DB`) | Source `170:17` confirmed `@500,3150 280x812 rx1` "AI · scoped". Free slot for the clone computed from the same read | **BLOCKED-ON-QUOTA** |
| **UX-G-04** *Major* | A quiet remaining count beside the send control, amber near zero | `170:2` (AI · idle) | `ai-04` step D: "7 left today", 11px `#6B7280`, right-aligned, resolved against the `/prompt/i` frame at write time; rule also stated on board B | `170:2` confirmed `@100,220 280x812 rx2` "AI · idle". The prompt-frame id is **unresolved** by design — the step resolves it by name | **BLOCKED-ON-QUOTA** |
| **UX-G-05** *Major* | One shared failure treatment for every inline AI affordance: keep the field's value, reason inline, Retry | Pages SEO (`302:1978`) and Media `146:2` — **other modules** | Board **B** defines the Inline tier and the four typed failures; two owed rows filed | none | **BLOCKED-ON-QUOTA** (board B) / **owed** for the two surfaces |
| **UX-G-06** *Major* | One alt-text generator — the vision one — reached from both surfaces, one contract | Media `146:2` and the full-library details panel — **other module** | Board **C** row "Media · alt text — ships twice, unify on the vision path"; board B rule "Provenance survives the apply"; two owed rows filed | none | **BLOCKED-ON-QUOTA** / **owed** |
| **UX-G-08** *Major* | Do not ship a generator whose output has no destination | `2476:12029` | Board **C** row "built, dead-ended: no Accept destination" | The board's own name already reads "…the schema has nowhere to go" — read directly | **ALREADY-CORRECT** on the board's name (read-back above); the *decision* half is **BLOCKED-ON-QUOTA** |
| **UX-G-10** *Major* | One mark, one verb set, one promise across all fourteen doors | board **B**; 14 doors on Inspector / Canvas / Brand / Media / Pages / History / palette boards | Board **B** authored: Sparkles as the single mark, ✨ / ✦ / play-triangle / clock retired, three tiers with one verb each and an explicit "never" column | none | **BLOCKED-ON-QUOTA** / per-surface relabels **owed** |
| **UX-G-11** *Major* | Popover and panel share one state machine: Stop, three failure states, retry, a scope line | `2476:12001` (AI · in-canvas popover — 4 states) — **in my section** — plus the new `AI · error-provider` | `ai-02` specifies `AI · error-provider` in full (clone from `171:105`, three copy rows, second action, `--bk-error-tint #FDE8E8` replacing `--bk-warning-tint #FDFDEA`). The popover board's own edit is **not specified at node level** | `2476:12001` read: `@100,1226 1380x320` **rx0** — it has no inbound edge at all, which is a second defect the read exposes | **BLOCKED-ON-QUOTA**; the popover board edit is additionally **unresolved-id** — the largest piece of my own work quota stopped |
| **UX-G-12** *Major* | AI must not evict the surface that judges it; going back must not destroy the conversation | `170:2` / `170:17` back rows; Inspector `32:2` | Board **B** rule "AI never evicts the surface that judges it"; board A's thread rule; owed row for `32:2` | none | **BLOCKED-ON-QUOTA** |
| **UX-G-13** *Major* | Undo on the applied message, chat path as well as agent path | **no board draws the applied chat state** (`W-K-01`'s "AI · proposal" was never built) | Board **B** rule "Undo is a button, not folk knowledge"; `ai-02 → notInThisPlan` records that the Undo belongs *on* the unbuilt proposal board, so the two should be built together | none | **BLOCKED-ON-QUOTA**; the host board does not exist |
| **UX-G-14** *Major* | Auto-apply states the stakes; "Undo this run" on a finished run; say that privileged actions stay gated | the auto-apply checkbox is drawn on **no board** (`W-K-15`) | Board **B** rule with the exact sentence; owed row against `160:512` | none | **BLOCKED-ON-QUOTA**; the control is still undrawn anywhere |
| **UX-G-17** *Major* | Make the AI-credits page the honest index of what AI does | dashboard — **not on page 1:3** | Recorded as footer item 3 on board **C** so the decision is written down; owed row filed | Page `1:3` is the editor; the 27-section ground-truth table has no dashboard family | **NOT-APPLICABLE** as a V1 board edit / **BLOCKED-ON-QUOTA** for the board-C record |
| **UX-G-18** *Major* | One AI brief form, reached from both places | dashboard — **not on page 1:3** | Board **C** row + footer item 3; owed row filed | same as above | **NOT-APPLICABLE** / **BLOCKED-ON-QUOTA** for the record |
| **UX-G-20** *Major* | "What AI can change" disclosure, a site-level AI off switch, and the ai-edit label carried into visible history | none exists; Settings `1776:8387` and History `1776:8374` | Board **C** footer item 1; board **B** rule "AI edits are findable an hour later"; two owed rows, one carrying an explicit *do not* (the disclosure is a page **about** AI, not a surface where AI acts) | none | **BLOCKED-ON-QUOTA** / **owed** |
| **UX-G-21** *Major* | Move AI to where the repetition is: CMS records and fields first, then describe-a-section in Insert | Content `1776:8376`, Insert `1776:8379` — **other modules** | Board **C** EARNS table names both as "not built", CMS marked "highest-value gap"; two owed rows | none | **BLOCKED-ON-QUOTA** (placement decision) / **owed** (the doors) |
| **UX-G-22** *Major* | Persist the brief; give the editor's AI read access; put "Regenerate this page" in Pages | Pages `1776:8377` — **other module** | Board **C** footer item 2; owed row | none | **BLOCKED-ON-QUOTA** / **owed** |
| **UX-G-23** *Major* | Keep the thread and the prompt behind the state; add the manual route; do not strand the session in a new tab | `171:105` and `171:136` | `ai-04` step D adds "Continue by hand in the inspector" to **both** states, plus the rule line about keeping the thread. The full redraw (thread visible behind the card) is **stated, not drawn** — it is a re-layout of a 280×812 board whose child ids were never read | Both boards confirmed present: `171:105 @2100,3150 280x812 rx1`, `171:136 @100,1666 280x812 rx1` | **BLOCKED-ON-QUOTA**; and partial by design — see the note |
| **UX-G-15** *Minor* | Decide where AI lives and make every index agree | board **A**; the shortcut-sheet board in Shell `1776:8385` | Board A retires the bare-`I` row and its footnote explains *why* the sheet keeps teaching it (the Panels group is built from every tab with a shortcut); owed row for the sheet | none | **BLOCKED-ON-QUOTA** / **owed** |
| **UX-G-16** *Minor* | One palette row for AI, always present, routing to the one home | board **A**; Command palette `1779:3` | Board A rows 6 and 7 make the call; owed row for the palette boards, including a warning not to transcribe the now-stale source comment onto a board | none | **BLOCKED-ON-QUOTA** / **owed** |
| **UX-G-19** *Minor* | Suggestions carry their own scope, or are hidden when the scope cannot serve them | `170:2` (the three TRY prompts) | Board **B** rule "Suggestions carry their own scope"; `ai-04` records that annotating the three TRY rows individually needs ids never read | `170:2` confirmed present; its TRY-prompt child ids are **unresolved** | **BLOCKED-ON-QUOTA** |
| **UX-G-24** *module summary* | "Adopt one AI interaction system **before** redrawing any of these screens" | the whole section | The three decision boards **are** that adoption, and they are why the screen-level rows above are small: each one now hangs off a written decision instead of restating it | none | **BLOCKED-ON-QUOTA** |

---

## What I did NOT cover — plainly

1. **Nothing reached Figma.** One read succeeded; every write failed on quota.
   Fourteen boards in my section exist exactly as they did before I started.
2. **I read 25 nodes, not 25 boards' worth of content.** I have every board's
   id, name, size, position and reaction count. I have **no** child node, no
   text string, and no frame structure for any board in this section. All
   in-board copy I quote comes from local finding files dated 2026-09-06.
3. **`verify-invariants.mjs` was not run.** So I cannot state that the section
   is loose/oob/overlap/secoverlap/dangling-clean, before or after. The three
   decision boards would grow section `1776:8380` from 5 200 to about 6 620 tall,
   and this page stacks sections vertically with a 900 px gutter — so the applier
   **must** run it, and run `order-sections.mjs` if a SECTION OVERLAP appears.
   That is steps 10 and 11 of the manifest, and it is a real risk I am handing on.
4. **I never opened the V2 source boards in Figma.** `2797:362`, `2797:342` and
   `2797:2` were read from their generator, `scripts/figma/build-proposal-page.mjs`
   (the `D.ai` table at :92-99 and the section builders at :263-300), which is the
   committed source those boards were built from. That is a faithful substitute
   for the AI Interaction Map's content, but it is not the rendered board, and I
   did not check the boards against their generator.
5. **`2476:12001` (the in-canvas popover) is untouched**, and it is the biggest
   gap. UX-G-11's fix belongs on that board, it is in *my* section, and I have no
   node ids for it. The read did surface one new fact worth acting on: it has
   **rx0** — zero reactions, so nothing in the file reaches it.
6. **No inbound edges were specified at node level.** `add-hotspots.mjs` needs
   the id of the label a hotspot sits over, and every such label (the multi-select
   `✦ AI` chip on `159:123`, the canvas toolbar button, the outcome hotspots on
   `170:29` / `170:41`) lives on a board I never read. `wire-edges.mjs` would make
   whole boards clickable and the brief forbids it, so I specified nothing rather
   than specifying something wrong.
7. **Captions were left alone**, except `172:43`, which is filed as a
   dry-run-first plan precisely because I do not know its current text and a
   caption is the node another module's agent is most likely to have rewritten
   since 2026-09-06.
8. **Two known-missing boards in my section are named but not planned**, because
   they are `FIG-K` / `W-K` rows and not among my 23: `AI · run-stalled`
   (FIG-K-04, Critical, the run that never ends) and `AI · proposal` (W-K-01, the
   chat job's diff card). I recorded both in `ai-02 → notInThisPlan` so their
   absence is not mistaken for coverage — and UX-G-13's Undo button belongs on
   the second of them.
9. **The founder's open 560-vs-700 drawer conflict** did not arise: the AI panel
   is an inspector-column surface at 280 (and `FIG-K-22` proposes 300 to match
   the column), not a drawer surface. No 560/700 decision was made here.

## AI changes owed by other modules

Full detail, with the code evidence for each, is in
`plans/ai-05-owed-by-other-modules.json` (19 rows). Named summary:

| board | section | module | change owed |
|---|---|---|---|
| `159:123` Inspector · multi-select | `1776:8381` | **Inspector** | Relabel `✦ AI` → Sparkles + "Ask AI"; hotspot it to the new `AI · scoped-multi` board (UX-G-03, UX-G-10) |
| `32:2` Inspector · profile · CONTAINER | `1776:8381` | **Inspector** | Header chip → Sparkles + "Ask AI"; and AI must stop evicting this panel — the diff card carries the live current values (UX-G-10, UX-G-12) |
| Inspector · no-selection (caption `161:13`) | `1776:8381` | **Inspector** | `✦ Ask AI ›` → Sparkles + "Ask AI"; selecting an element restores the inspector (UX-G-10, = UX-D-01) |
| `160:512` Inspector · ai-agent-run | `1776:8381` | **Inspector** | Draw the auto-apply toggle *at all*, with the stakes sentence; "Undo this run" on a finished run (UX-G-14) |
| canvas selection toolbar | `1779:5` | **Canvas** | "Edit with AI" → "Ask AI"; wire it to `2476:12001`, which has zero inbound edges (UX-G-10, UX-G-11) |
| `302:1978` S3.7 page-settings · SEO | `1776:8377` | **Pages** | "Write with AI" → Inline tier Generate/Regenerate + the shared inline failure row with Retry; add SEO description (UX-G-05, UX-G-10) |
| Pages panel | `1776:8377` | **Pages** | "Regenerate this page" — today it exists only on a wizard screen the user cannot return to (UX-G-22) |
| `146:2` Media · asset-detail | `1776:8372` | **Media** | Retire the filename-guessing alt-text generator (UX-G-06) |
| Media full-library details panel | `1776:8372` | **Media** | Keep this one; relabel to Generate/Regenerate. It is the reference implementation for provenance and the skip case (UX-G-06, UX-G-10) |
| Brand → Components board | `1776:8373` | **Brand** | Gate the "✨ Generate with AI" CTA on the same flag as its client, or hide it (UX-G-07) |
| ⌘K shell palette boards | `1779:3` | **Command palette** | One always-present "Ask AI" row to the one home; delete the Navigation "Open AI panel" destination (UX-G-16) |
| keyboard-shortcuts sheet | `1776:8385` | **Shell** | Drop "I — Open AI panel" from the Panels group; teach ⌘J beside the chip (UX-G-15) |
| History · version compare | `1776:8374` / `1776:8382` | **History** | **Retire** "Get AI Summary" and the AI milestone suggestion. No board draws either, so this is cheap. **And fix `DESIGN-AUDIT-SUMMARY.md:99`**, which still carries D-F-38's refuted claim that `ai.summarize` has no editor caller — it has one at `useAISummary.ts:109`, refuted at `VERDICTS.jsonl:199` (UX-G-09) |
| History version / activity lists | `1776:8374` | **History** | Carry the existing `ai-edit` transaction label into the visible history (UX-G-20) |
| Content / CMS panel boards | `1776:8376` | **Content** | Add "Draft with AI" on a record and "Fill this column for N records"; "Suggest fields" on collection create. The highest-value AI gap in the product (UX-G-21) |
| Insert panel boards | `1776:8379` | **Insert** | Add "Describe a section" — `add-section` / `insert-component` already ship server-side with no door (UX-G-21) |
| Settings screens | `1776:8387` | **Settings** | A "What AI can change" disclosure and an owner-level site AI off switch. **Not** an AI affordance in Settings — board C puts Settings under MUST NEVER HAVE ONE (UX-G-20) |
| dashboard AI-credits page | — | **Dashboard** (no family on page `1:3`) | Stop advertising three shipping features as "coming soon" on the page that meters them (UX-G-17) |
| dashboard AI site wizards | — | **Dashboard** | One brief form for both site-creation doors (UX-G-18) |

**One correction other modules must carry, not re-derive:** `ai.summarize` has an
editor caller (`useAISummary.ts:109`). Retire the version-diff summary because it
fails the placement rule, never because it is doorless.
