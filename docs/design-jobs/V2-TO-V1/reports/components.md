# V2 → V1 — `components` (V2 section 8 · Component Library)

**Source:** Figma page `2668:2`, section `2797:491` "8 · Component Library" (2 boards: the
census, and "Decided · Nav row (merged) — active is FILL").
**Targets:** page `1:2` "🧩 Components"; section `2040:8372` "28 · Library · shared chrome" on
page `1:3`.
**Outcome: BLOCKED-ON-QUOTA. Zero Figma writes were made. The census is UNMEASURED.**

---

## 0. The blocker, stated plainly

The Figma MCP seat quota was exhausted account-wide (fifteen agents on one Professional
seat). It is a seat cap, not a rate limit: backoff does not clear it and a read costs the
same as a write. The coordinator issued a hard stop at 05:15; the retry loop was killed
immediately and **no Figma call of any kind has been made since**, including
`verify-invariants.mjs`.

**Figma calls this job completed: 1 of 6 attempted. Everything else returned the quota
string, and a quota string is not a measurement.**

| call | result |
|---|---|
| `board-baseline.mjs` (pre-change baseline of page 1:3) | quota |
| read section `2040:8372` | **SUCCEEDED** — the only first-hand measurement in this report |
| `audit-components.mjs` (the census) | quota, 4 attempts across 6 minutes |
| `audit-components.mjs --shapes` (hand-drawn sweep) | never reached |
| `compare-nav-rows.mjs` (the merge gate) | never reached |
| `verify-invariants.mjs` (required verification) | **not run — hard stop** |

Because nothing was written, nothing is half-applied and there is nothing to roll back.

---

## 1. The census — UNMEASURED

I did not complete the walk. **I am not reporting a census.**

The previous census was wrong twice, in ways that both looked like findings (204 zero-use
where 49 were real; 12 name collisions where 0 were real). A third one, inferred from
documents I did not measure, would be worse than none. So the numbers that exist —
338 raw masters, 125 judged units, 49 zero-use — belong to
`scratchpad_audit/mod/component-census.txt`, a run made by the **previous session at
2026-09-06 23:02**. That file is also **partly known-wrong**: it was produced after the
zero-use fix but *before* the collision fix, and its own `NAME COLLISIONS (12)` block is
the second recorded error, printed. It is a lead list. It is not my measurement and I do
not adopt it.

### What I delivered instead: the method, proven offline

Two files, no quota required, runnable in one command each.

**`scripts/figma/audit-components.mjs`** — extended, not duplicated. Three changes:

1. **Collisions are now three passes, weakest evidence last, each labelled with its
   method.** Exact string equality was the *previous* fix and it is still not enough on
   this file: it cannot see `Icon / bell` against `icon/bell`. That is the same shape of
   error as the two before it — a compare that answers a narrower question than the one
   asked.
   - `EXACT` — same string. Definite.
   - `NORMALISED` — same after lowercasing and stripping non-alphanumerics. Definite;
     only the naming convention differs.
   - `LEAF` — same last path segment with a trailing size suffix stripped. **Candidate
     only**; two unrelated components can share a leaf.
2. **`--shapes`** finally answers the question the script's own header has promised since
   it was written and the code never did: where is a shape drawn by hand instead of
   instanced. Two rules make the count mean something — never descend into an `INSTANCE`
   (a component's internals are not a hand-drawn copy of it, and counting them turns every
   adopted component into evidence against itself), and match on *signature* (normalised
   name **plus exact size**), never on name alone, because a name-only match already
   pulled inspector structure into a list-row swap once in this arc. It reports the owning
   section per signature, which is what the "owed by module sections" list needs.
3. A bug I introduced and caught in the same session: the LEAF pass suppressed already-
   reported pairs using the *group keys* rather than the members' leaves, so the bell pair
   would have been printed twice — once as NORMALISED and again as LEAF, reading as two
   findings. Fixed; the self-test asserts it.

**`scripts/figma/audit-components.selftest.mjs`** — *the proof*. It slices the real
sandbox literal out of `audit-components.mjs` and executes it against a stub `figma`, so
the thing under test is the shipped code and not a paraphrase. The fixture is built to
trip every recorded error: two fully-used component sets whose variants carry all the
instances, two sets that each own a variant literally named `State=rest`, `Icon / bell`
vs `icon/bell`, `Icon / plus` vs `icon/plus-16`, and three hand-drawn `rail` frames plus a
fourth identical one living **inside an instance**.

```
$ node scripts/figma/audit-components.selftest.mjs
--- what the two recorded errors produce on this fixture ---
  naive zero-use (sets + state variants counted):   9  of 14 raw masters
  naive name collisions (variant strings as names): 2
--- what audit-components.mjs produces on the same fixture ---
PASS  raw masters counted  got=14 want=14
PASS  units judged (sets + standalone only)  got=7 want=7
PASS  truly zero-use excludes used sets AND their unplaced variants  got=4 want=4
PASS  zero-use names the orphan SET  got=true want=true
PASS  zero-use does not name that set's variants  got=true want=true
PASS  zero-use never names a used set  got=true want=true
PASS  exact collisions ignore variant property strings  got=0 want=0
PASS  normalised pass finds Icon / bell vs icon/bell  got=1 want=1
PASS  leaf pass finds Icon / plus vs icon/plus-16  got=1 want=1
PASS  leaf pass does not re-report the bell pair  got=true want=true
PASS  shapes pass counts the 3 hand-drawn rails  got=true want=true
PASS  shapes pass does not descend into the instance  got=true want=true

all assertions passed — the census avoids both recorded errors on a fixture that reproduces them
```

**A green test that has never been seen fail is a claim, not a check**, so the harness
takes a path argument and was run against a deliberately regressed copy — the roll-up
line reverted to `rows.slice()`, which is error #1 exactly as it was made:

```
$ node scripts/figma/audit-components.selftest.mjs scratchpad_audit/comp/audit-components.BROKEN.mjs
FAIL  units judged (sets + standalone only)  got=14 want=7
FAIL  truly zero-use excludes used sets AND their unplaced variants  got=11 want=4
FAIL  zero-use does not name that set's variants  got=false want=true
FAIL  exact collisions ignore variant property strings  got=2 want=0
4 ASSERTION(S) FAILED   exit=1
```

11 zero-use where 4 are real, 2 collisions where 0 are real — the same signature as
204-vs-49 and 12-vs-0, at fixture scale. **The mechanism that produced both recorded
errors is now reproducible and caught offline.** Editing the census and forgetting the
self-test fails here, not in Figma, and not two sessions later.

### To take the census, one command

```bash
node scripts/figma/audit-components.mjs                 # masters, roll-up, zero-use, 3 collision passes
node scripts/figma/audit-components.mjs --shapes --min=8  # hand-drawn copies, per owning section
```

---

## 2. Status table

Per the brief: `IMPLEMENTED` requires a read-back, and there are none, because there are
no writes.

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| `V2-8-A` Component census, re-run defensibly | count sets not variants; find real collisions; find hand-drawn copies | page `1:2`, section `2040:8372` | Method written, extended in place (no duplicate script), and **proved offline** against a fixture reproducing both recorded errors; proved to fail on a regressed copy | none — the walk was never run | **BLOCKED-ON-QUOTA** (method delivered; census UNMEASURED) |
| `V2-8-B` Merged Nav row — apply the founder's decision to the master | one base row, Size × State, compact 140×30 as baseline | master `2041:19572` in `2040:8372`; `16:26` on `1:2` | Applyable script written (`apply-merged-nav-row.mjs`) + full plan JSON. **Not run, not even dry-run.** | none | **BLOCKED-ON-QUOTA** |
| `V2-8-C` Active state = FILL, not the bar | accent tint + accent label + **weight 600**; retire the 3px bar | same | Drawn default adopted in the plan, on the strength of a code contract I read first-hand: `settings.css:93-97` `.bd-set-snav-row.on { background: var(--bk-accent-tint); color: var(--bk-accent); font-weight: 600 }` — and `:89-92` gives hover `--bk-bg-subtle` / `--bk-ink`, a state the compact master has no variant for at all | `settings.css:75-97` read from source | **BLOCKED-ON-QUOTA** (decision resolved on evidence; write pending) |
| `V2-8-C-open` Bar vs fill remains the founder's call | do not silently pick one | same | Marked open in the plan and in the component description the script writes. **Not closed.** 1,626 instances hang off it either way | n/a | **OPEN — carried forward, not resolved** |
| `V2-8-D` Board draws `#EBF1FE` for the active fill | — | `2797:491` (V2, read-only) | Corrected to `#EBF5FF` in the plan. `#EBF1FE` is not a token; `--bk-accent-tint` is `#EBF5FF` (`tokens.generated.css:85`), the shipping rule uses it, and V1's existing master was already built with it. The board wins between two designs; it does not get to invent a colour outside the generated set | `tokens.generated.css:85`; `settings.css:94` | **NOT-APPLICABLE to V1** (V2-side near-miss, recorded not propagated) |
| `V2-8-E` `Nav item` `16:26` is the other half of the merge | — | page `1:2` master; instances on Site / Portfolio / Dashboard | Description-only supersession planned. **Its instances are deliberately not migrated** — every one sits on a page brief hard rule 1 forbids writing to | none | **NOT-APPLICABLE to this arc's write scope** — filed as owed, §3 |
| `V2-8-F` Three nav rows, third is the Dashboard's `975:615` | — | Dashboard pages | Stays separate. `DECISIONS-OPEN` §1 established the dashboard legitimately runs its own nav with its own type system, and its active state is a third treatment again (2px underline, `top-nav.tsx:60`) | `DECISIONS-OPEN.md` §1 | **NOT-APPLICABLE** (reasoned, not skipped) |
| `V2-8-G` "the List row here is NOT the Layers tree row" | keep the correction | `2040:8372` | Kept, and carried into `components-duplicates.json` so the next audit does not re-file it as a duplicate | **first-hand, quoted in full in §4** | **ALREADY-CORRECT** |
| `V2-8-H` Duplicate masters | consolidate the unambiguous, file the rest | page `1:2` | 5 findings written up with node ids in `components-duplicates.json`, every count labelled as inherited from the prior run and unverified by me. **Nothing consolidated** | none | **BLOCKED-ON-QUOTA** |
| `V2-8-I` Library sets stack every variant at one point | make the library show its variants | `2040:8372` | Measured first-hand (§4). Nav row layout is in the merge plan because adding variants forces it; Rail and List row are owed | **first-hand, §4** | **BLOCKED-ON-QUOTA** |

---

## 3. Instance updates owed by module sections

**This list is UNMEASURED and is the deliverable most damaged by the stop.** The sweep
that produces it — `audit-components.mjs --shapes --min=8`, which reports the owning
section per repeated hand-drawn signature — never ran. **I cannot name instance node ids
per section, and I will not invent them.**

What is owed is enumerable *in kind*, and one item is knowable without a sweep:

| component | what is owed | owning section(s) | how to enumerate it |
|---|---|---|---|
| `Nav row` (`2041:19572`, ex `Settings nav row`) | **Nothing.** This is the point. Every instance points at `2041:19568` or `2041:19571`, both node ids survive the variant rename, so all ~600 inherit the corrected active state from one master edit and **zero board edits land inside sections 01–27**. What is owed is a *check*, not an edit | all Settings boards on page `1:3` | `node scripts/figma/instance-map.mjs 2041:19572 --page=1:3 --ids=6` — written for this job, never run. Take the BEFORE count too; an after-count alone proves nothing |
| `Nav item` (`16:26`) | ~1,026 instances re-pointed at the merged `Nav row` default variants | **out of this arc entirely** — Site, Portfolio, Dashboard pages | `node scripts/figma/instance-map.mjs 16:26 --page=all` |
| `Rail` (`2034:8519`) | unknown — whether any board still draws a rail by hand after `swap-rails.mjs` | unknown | `--shapes` sweep, signature `rail 60x812` |
| `List row · indented` (`2142:11082`), `List row` (`232:6`), `Row` (`8:47`) | unknown — three row masters, and whether boards draw a fourth by hand | unknown | `--shapes` sweep, signatures `row 280x28` / `row 280x*` |
| `Drawer frame` `19:46`, `Right panel frame` `19:47`, `Modal frame` `19:79` | unknown — all zero-use, and all three name shapes on the founder's standardise list. If boards draw them by hand this is where it shows | unknown | `--shapes` sweep |
| icon duplicates (`DUP-01`) | nothing until the pair is verified | — | `instance-map.mjs` per surviving master before touching anything with 114 instances |

The one number in this table I did not measure is ~600. It is the prior run's figure and
is the reason `instance-map.mjs` takes a BEFORE reading.

---

## 4. The only first-hand Figma measurement this job made

Section `2040:8372`, read 2026-09-07 05:04, verbatim:

```
SECTION 2040:8372 '28 · Library · shared chrome · 3 — Rail, Settings nav row and the
indented List row. NOTE: the List row here is NOT the Layers tree row; Layers instances
243:6 on page 🧩 Components, 57 times, and this set zero times.' 1200x1322 children=3
  COMPONENT_SET 2034:8519 'Rail' 60x812 @100,220 kids=7
      - COMPONENT 2034:8392 'Active=None'    60x812
      - COMPONENT 2034:8413 'Active=Insert'  60x812
      - COMPONENT 2034:8434 'Active=Layers'  60x812
      - COMPONENT 2034:8455 'Active=Pages'   60x812
      - COMPONENT 2034:8476 'Active=Media'   60x812
      - COMPONENT 2034:8497 'Active=Content' 60x812
      - COMPONENT 2034:8518 'Active=Brand'   60x812
  COMPONENT_SET 2041:19572 'Settings nav row' 140x30 @100,1152 kids=2
      - COMPONENT 2041:19568 'Active=Off' 140x30
      - COMPONENT 2041:19571 'Active=On'  140x30
  COMPONENT_SET 2142:11082 'List row · indented (label only) — Depth 0-5 × Sta' 280x28 @360,1152 kids=12
      - COMPONENT 2142:11048 'Depth=0, State=rest' 280x28   ... 12 variants, all 280x28
```

Two things fall straight out of it, neither of which needed another call:

1. **The section's own name carries the correction the brief said to keep, and it is
   intact.** Nothing in this job's plan alters it beyond swapping "Settings nav row" for
   "Nav row" in the list of three.
2. **Every set stacks every variant at one point.** A set whose union bounds equal one
   variant's bounds has them all on top of each other — Rail is seven 60×812 variants in a
   60×812 box, List row is twelve 280×28 variants in a 280×28 box. The library page
   therefore displays one variant per component and the states these sets exist to
   document cannot be seen. That is a real defect in the library, found in the one read I
   got, and it is why the merge plan lays the Nav row's six variants out rather than
   stacking four more.

---

## 5. Side finding — a lint blind spot, tested and reverted

While making the census script safe I hit `lint-sandbox-scripts.mjs`, which enforces the
one rule that matters for these scripts (no backtick in plain text inside the sandbox
literal). It scans **the first literal named `code`, and only that one** — so a literal
returned from a helper, or held under any other name, is never scanned at all. Proved with
a planted violation: the generalised version catches it, the shipped one reports clean.

I generalised it, ran it across `scripts/figma/`, and it reported **19 violations in
`build-ai-v2-boards.mjs`, all false** — that file builds its rows with nested templates
that close as `` `).join("") `` rather than newline-backtick-semicolon, so the generalised
matcher never finds the end and swallows the rest of the file. That is the trap the lint's
own header warns about: a check that cannot tell a violation from a valid use is noise.

**Reverted.** The only change left in that file is a comment recording what was tried, why
it failed, and what a real fix would need (parse the literal boundaries, don't match a
marker). `audit-components.mjs` was restructured instead so its `--shapes` branch lives
*inside* the single linted literal — the shapes pass would otherwise have shipped
unlinted. `git diff scripts/figma/lint-sandbox-scripts.mjs` is 9 added comment lines and
no behaviour change; the lint runs clean.

This also matters because `build-ai-v2-boards.mjs` belongs to another live agent. Breaking
shared tooling for twelve concurrent sessions to fix a blind spot outside my assignment
was not a trade worth making.

**Note for whoever runs the lint next: it currently reports 12 violations in
`scripts/figma/apply-queue.mjs` and they are false, for the same reason.** That file
appeared mid-session from another agent and closes its literal as
`` return out.join("\n");`; `` — content and close marker on one line — which the
marker-based boundary detection cannot see, so it swallows the rest of the file. **This is
not caused by my change**: `git show HEAD:scripts/figma/lint-sandbox-scripts.mjs` produces
the identical 12 rows. My three new/modified scripts lint clean.

---

## 6. What I did NOT cover

Stated plainly, because six of eighteen boards walked is six.

- **The census itself.** Not taken. 1 of 6 Figma calls completed. Every number in
  `component-census.txt` is the previous session's, and its collision block is the known-
  wrong output.
- **The V2 source board `2797:491` was never read from Figma.** Its content in this report
  is reconstructed from `scripts/figma/build-proposal-page.mjs:365-430`, the builder that
  drew it, and from `2026-09-06-proposal-page.json`. The brief says the BOARD is the truth
  and I did not read the board. If the board has been edited since it was built, this
  report is describing the builder, not the board.
- **`compare-nav-rows.mjs` — the merge gate.** The founder's decision carries an exception:
  a row whose interaction model genuinely differs is not merged. Honouring it requires
  measuring both masters. **I did not measure them.** The merge plan is written assuming
  both are a label row with a selected state, and that assumption is unverified. The plan
  says so and refuses `--apply` on an unread dry run.
- **`verify-invariants.mjs` — required by my brief.** Not run. Hard stop. Since no write
  was made, no invariant this job could have broken has changed; that is an argument, not
  evidence, and the run is still owed before anything here is applied.
- **The hand-drawn-copy sweep**, and therefore the whole per-section "owed" list with node
  ids (§3).
- **Boards on page 1:3 drawing a copy of something that has a master** — the third item of
  my assignment. Entirely unmeasured.
- **The zero-use verdicts.** ~12 named masters plus the ~30-strong `Icon / *` family still
  have no verdict. `DECISIONS-OPEN` §10 and §13 record two prior sessions being
  conservative-wrong about exactly this, both times from inferring a limit instead of
  censusing what the boards hold. I have inferred nothing and concluded nothing.
- **Rail and List row variant layout** in section `2040:8372`. Identified, costed, not done.
- **`DECISIONS-OPEN.md` §5 was not edited.** It records the merge as decided; adding "and
  applied" while the apply is blocked would put a false line in the file twelve other
  agents are reading. The dated line to add is written out in the plan JSON, ready.

## 7. Files this job produced

| file | state |
|---|---|
| `scripts/figma/audit-components.mjs` | **modified** — 3 collision passes, `--shapes` mode, leaf-suppression bug fixed. Never run against Figma |
| `scripts/figma/audit-components.selftest.mjs` | **new** — offline proof of the method; green on the real script, red on a regressed copy |
| `scripts/figma/apply-merged-nav-row.mjs` | **new** — applyable, never run, dry-run gate documented |
| `scripts/figma/instance-map.mjs` | **new** — per-section instance map for a master; matches on set id AND every variant id, caps id lists and says so. Never run |
| `scripts/figma/lint-sandbox-scripts.mjs` | **modified, comment only** — behaviour unchanged, generalisation tested and reverted with the reason recorded |
| `docs/design-jobs/V2-TO-V1/plans/components-nav-row-merge.json` | **new** |
| `docs/design-jobs/V2-TO-V1/plans/components-duplicates.json` | **new** |
| `docs/design-jobs/V2-TO-V1/reports/components.md` | this file |
| `scratchpad_audit/comp/audit-components.BROKEN.mjs` | scratch — the regressed copy the self-test is proved against |

No file under `docs/design-jobs/` other than these three was edited. No commit, no stage,
no stash.
