# Figma build checklist — every item, traceable, tickable

> **The execution tracker.** `2026-07-20-figma-execution-plan.md` is the *schedule* — phases, gates, six weeks. This is the *inventory*: every component and every screen that has to exist, each pointing at the spec section that defines it, each with a status.
>
> **File:** `figma.com/design/g4GzQFqzNYz5sosz1QtZXC` — "Buildrick — Product"
>
> Status legend: `✅ done` · `🔨 in progress` · `⬜ not started` · `⛔ blocked` · `— n/a`
>
> **Update this file as items land.** A checklist that drifts from the file is worse than none — it reports coverage that does not exist.

---

## Why this exists as well as the plan

The plan answers *when*. This answers *what*, and it is the thing that stops something being missed. Three items on it were found only by enumerating the specs rather than working from memory:

- the **Review panel** — the rail's conditional 7th surface, easy to forget because it only exists while a review is live
- the **Notifications panel** — the third occupant of the 360w frame
- the **Compare** view — not a panel; it takes the canvas, so it does not appear in any panel list

---

## P0 · Foundations — ✅ COMPLETE

| Item | Status | Spec |
|---|---|---|
| File + 7 pages | ✅ | plan §5 |
| `Package` collection, modes `Editor` / `Dashboard` | ✅ | rules §2 Tier 0 |
| `color/accent` + hover · subtle · on · pressed, 2 modes | ✅ | DESIGN.md:11, :26 |
| Primitives — 15 colours | ✅ | DESIGN.md Color |
| Primitives — 9 spacing · 4 radius · 11 size | ✅ | DESIGN.md Spacing / Layout |
| Text styles — `ui/*` ×8 | ✅ ⚠ placeholder | Inter, pending Inter Tight |
| Text styles — `data/*` ×3 | ✅ final | Geist Mono, real |
| Text styles — `display/*` | — n/a | General Sans unavailable; marketing-only |
| **Accent guard verified** (`#2D6DFF` ↔ `#406ED6`) | ✅ proven | two instances, one component, modes only |

⚠ **Carried debt:** `ui/*` is Inter, not Inter Tight. Swap on the STYLE when the font lands — never per-layer. Inter is wider, so the swap only gains slack.

---

## P1 · Atoms

| Component | Variants | Status | Spec |
|---|---|---|---|
| **Row** | 5 sizes × 4 states = 20 | ✅ | rules §2 Tier 1 — **40 mentions**, the most reused element |
| **Button** | 4 kinds × 2 sizes × 5 states = 40 | ✅ | disabled ships its tooltip |
| **Input** | 5 states | ✅ | 36h |
| **Status dot** | 5 site states | ✅ | Portfolio §3 |
| **Icons** — 6 rail | real Lucide | ✅ | Insert · Layers · Pages · Media · Content · Brand |
| Icons — the rest | ~20 common | ⬜ | pull from Lucide as screens need them, never redraw |
| **Badge / pill** | neutral · success · warning · danger · pro | ✅ | 12% tint, coloured text does the work |
| **Checkbox** | 5 states incl. indeterminate | ✅ | bulk selection needs indeterminate |
| **Toggle** | 4 states | ✅ | off is border-strong, must read as OFF |
| **Radio** | 4 states | ✅ | one-of-many that cannot be unset |
| **Select** | 4 states | ✅ | chevron flips on `open` |
| Slider | rest · dragging · disabled | ⬜ | build with the inspector controls, P5 |
| **Tooltip** (standalone) | 1 | ✅ | names the ROLE required |
| **Avatar** | sm · md, initials | ✅ | initials are the normal case — client reviewers have no account |

---

## P2 · Molecules

| Component | Serves | Status | Spec |
|---|---|---|---|
| **Panel header 44h** | all 7 drawer surfaces | ✅ | pin before close |
| **Section header 28h** + count | every panel | ✅ | mono count, no jitter |
| **Drawer frame 320w** | **7 surfaces** | ✅ | 3 body layouts, **Gate A proven** |
| **Right panel frame 360w** | **3 surfaces** | ✅ | header 48 · filter 36 · body · footer 44 |
| **Nav item 32h** | Site nav · Portfolio nav | ✅ | rest · hover · active |
| **Card** — media 136×104 | Media grid, Insert blocks | ✅ | |
| **Card** — site 232×180 | Portfolio grid | ✅ | last-edited, not last-published |
| **Empty state** | 11 surfaces have written copy | ✅ | real copy baked in |
| **Progress row 44h** | upload · export · publish · push | ✅ | mono count |
| **Comment row 64h** | Review panel · canvas threads | ✅ | client marked `· client ·` |
| **Modal frame** ×3 widths | 440 · 560 · 580 | ✅ | destructive named, not 'Confirm' |

### ╞═ GATE A — ✅ **PASS**, measured not eyeballed
Media (folder row · type pills · 2-col grid · quota · upload) and Brand (DS-mode · 9 section rows · dirty save bar) both poured into the real 320 frame with `clipsContent = false` so overflow could not hide. **Zero nodes exceed 320.** Media's pill row measures 290 — 30px slack.

⚠ **The first PASS was false and nearly accepted.** Four type pills were frozen at width 10 by a `resize()`-after-`AUTO` bug, so they were not fitting, they were *hiding*. An overflow test only means something when every control is at its real width.

---

## P3 · Shells

| Item | Status | Spec |
|---|---|---|
| Editor shell 1440 · transient | ✅ | shell §1–2 |
| Editor shell 1440 · pinned | ✅ | canvas 760 |
| Editor shell 1280 · transient | ✅ | canvas 920 |
| Editor shell · no page tabs | ✅ | band 812 |
| **Gate B — arithmetic** | ✅ **verified** | auto-layout produced 1080/760/920/812 unprompted |
| Shell states as variants (12) | ⬜ | shell §4 |
| Site / Portfolio shell | ✅ | 720 form vs 1000 grid; accent resolves by mode — verified |
| Client review page frame | ✅ | dashboard mode, agency name leads |

---

## P4 · The wedge — J5

| Screen | Status | Spec |
|---|---|---|
| S5.1 Send for review — compose · sent | ✅ | email REQUIRED — a link sent to nobody can never be signed |
| S5.2 Review bar — pending · changes · approved | ✅ | 1160 full-bleed, 44h |
| S5.3 Comments — canvas pins + Review panel | ✅ | detached group, round history, client marked |
| S5.4 Approval gate error-state | ✅ | names who, when, and BOTH ways out |
| **S5.5 CLIENT REVIEW PAGE** | ✅ **7 states** | A0 identity · A viewing · B commenting · C request-changes · D approved · E stale · F expired |
| S5.6 Post-approval guard | ✅ | stale, NOT revoked |

### ╞═ GATE C — put S5.5 in front of a real agency
Not a lab. One agency, one link, one honest reaction: *would you send this to a paying client, and would they know what to do without you explaining it?* **Founder-only. Do not delegate.**

---

## P5 · Editor screens

| Surface | Status | Spec |
|---|---|---|
| Insert panel — 5 groups, no switcher | ✅ | |
| Pages panel — grouped + folders | ✅ | |
| Layers panel — 28h at depth 5 | ✅ | stress-tested: long name at depth 5 fits |
| **Media panel** + 5 drill-ins | ✅ | Gate A cargo, 320 proven |
| Content panel — two roots | ✅ | Collections + Data |
| **Brand panel** — 9 sections | ✅ | dirty save bar, not autosave |
| **Review panel** (conditional 7th) | ✅ | detached group · round history · compare |
| Inspector — CONTAINER profile, section order | ✅ | 6 remaining profiles reuse the same anatomy |
| Inspector — control anatomy at 268 | ✅ | **label 88 + gap 8 + control 172**, zero overflow |
| Inspector — 10 column states | ⬜ | inspector §5 |

---

## P6 · Floating panels + modals

| Item | Status | Spec |
|---|---|---|
| ⌘K palette 640w | ✅ | disabled commands show the reason, never hidden |
| Versions panel | ✅ | approved anchor pinned with green rail |
| **Compare** — 3 modes | ✅ | takes the canvas · tinted regions + amber strip for deletions |
| Issues panel | ✅ | 3 severities, Fix › where auto-fixable |
| AI panel | ✅ | proposes a diff, never writes; Apply is one undo step |
| **Notifications panel** | ✅ | unread bar + tint, grouped by day |
| Modal instances ×13 | ✅ | ⚠ **this row was false when first ticked** — only 6 of 13 existed. The kit (3 widths + 4 states) had been mistaken for the instances. recovery · template apply · optimise images · collection setup · record editor · paste HTML added 2026-07-20 |

---

## P7 · Site — 14 destinations

`General · SEO · Analytics · Custom code · Domains · Redirects · Headers · Localization · Forms · Integrations · Publish history · Export · Members↗ · Billing↗`

| Item | Status | Spec |
|---|---|---|
| Site shell + nav + badges | ✅ | built in P3 |
| 12 in-app destinations | ✅ | all 12 on the one 720 column and one field pattern |
| Domains guided connect | ✅ | 3 steps · real CNAME from domain.service.ts |
| **Integrations** — two groups | ✅ | ⚠ **rebuilt 2026-07-20.** First version implemented OAuth-vs-pasted-key — the exact model site-fullpage §6.0 says an outside review corrected away. Now: baked-in-at-publish vs connected-for-all-sites, per §6.2 |
| Publish history + rollback | ✅ | rollback appends (v12 ↩ from v9) · failed offers Retry not Rollback |
| "Saved but not live" banner ×3 | ✅ | uses `color/warning-tint`, not frame opacity |

---

## P8 · Portfolio — 6 destinations

| Item | Status | Spec |
|---|---|---|
| Sites grid — 232×180, 4-up | ✅ | 232×4 + 24×3 = 1000 exactly, verified on canvas |
| **Brand push** — 5-step modal 560w | ✅ | step rail + per-site preview; the override-collision case is the one that matters |
| Handover | ✅ | what transfers vs what stays with the agency |
| Shared templates · components · brand kits | ✅ | same 232 card · DESIGNER limit shown as disabled-with-reason |

---

### Open founder call — one contrast failure I did not fix

`color/accent-on` on `color/accent` (white on cobalt `#2D6DFF`) is **4.43:1**, just
under the 4.5:1 body-text bar. That is the label on every primary button.

I did not fix it because the fix is to darken cobalt, and cobalt is the brand —
locked in DESIGN.md, not mine to move. Three ways out:

1. **Darken the accent** to ~`#2A66F0`. Clears 4.5:1. Nobody will see the change; it is a brand edit all the same.
2. **Leave it.** 4.43 vs 4.5 is a 1.5% miss and no automated audit outside this file will flag it.
3. ~~**Raise button labels to 14px semibold**~~ — **this option was wrong.** WCAG large
   text is 18.66px bold or 24px regular; 14px semibold is not large text and still
   owes 4.5:1. Reaching the large-text bar would need ~19px bold button labels,
   which is absurd in a compact editor. Ignore this option.

**Recommended: option 1, at the minimum value.** `#2D6DFF` → `#2D6CFC` clears the
bar at exactly 4.50 and is a change of 3/255 on blue and 1/255 on green — not
perceptible side by side. It is one token in one package mode: the Dashboard accent
`#406ED6` already passes at 4.75. Requires a DESIGN.md amendment, which is why it
is not applied.

Everything else in the palette now passes.

---

### What the stress pass found

Worth recording because all three were invisible until real content went in, and
all three were in surfaces that looked finished:

1. **`textTruncation` alone still wraps.** A 56-char site name became two lines in
   a 56h topbar; the deep layer row did the same and broke the 28h row rhythm.
   Figma needs `maxLines = 1` as well — set it on every row label that can receive
   a user-typed name.
2. **The tab strip clipped mid-tab** at 40 pages, with nothing saying more existed.
   Now shows 8 + a `+15 ›` affordance.
3. **The assembled screen did not exist at all** until this pass. The four shells
   were empty geometry — Rail, Canvas and Inspector each had zero children — so
   the arithmetic was proven but the parts had never been put together. Building
   `S1 · Editor — ASSEMBLED` surfaced two more: the rail's active state was missing
   its 3px cobalt bar (DESIGN.md:272), and **page tabs spanned the full window in
   all four shells** when the spec scopes them to the canvas column so they do not
   read as global nav (§5 A5). Both fixed in every shell.

---

## P4b · Shell states — the requirement the checklist itself was missing

`editor-shell-wireframes.md` §4 enumerates **12 shell states**. Nothing in this
checklist ever asked for them, so "80/81" was counted against a list that did not
include them. Five were incidentally covered by other screens; seven were absent.

| # | State | Status | Where |
|---|---|---|---|
| 1 | First run | ✅ | rail icons only, no drawer, coach mark, empty-canvas CTA |
| 2 | Returning (default) | ✅ | `S1 · Editor — ASSEMBLED` |
| 3 | Element selected | ✅ | same frame — hero selected, inspector populated |
| 4 | Multi-select | ✅ | inspector becomes align/distribute; per-element props hidden |
| 5 | Drawer closed | ✅ | the transient shells |
| 6 | Comment mode | ✅ | `S5.3` — rail and inspector stay live |
| 7 | Preview | ✅ | all chrome but the topbar hides; Done pill |
| 8 | Review active | ✅ | `S5.2` review bar in J5 |
| 9 | AI agent run | ✅ | AI takes the inspector column, back arrow, selection preserved |
| 10 | Offline | ✅ | amber save pill, CTA disabled with reason |
| 11 | Saving / conflict | ✅ | pill cycling + conflict modal over a live scrim |
| 12 | Loading | ✅ | canvas skeleton, rail present but disabled, no drawer |

**Cloning a mid-session shell carries its state with it.** First run initially
showed "In review · 3 open" and a selected element on a site that does not exist
yet. Every state frame needs its topbar, inspector and footer checked for
coherence, not just the one region the state is about.

---

## P0b · Foundations page — was empty

53 variables and 11 text styles existed as file assets with **nothing on the
Foundations page**. Tokens you cannot see are tokens a designer re-picks by eye.
Now holds live specimens: colour grouped by role (surfaces · the 3-level ink ramp
· borders · semantic fill/text/tint), the accent shown in both package modes side
by side, all 11 type styles set in themselves, and the spacing / radius / size
scales.

---

---

## P10 · Found by an outside review of the whole doc set — 2026-07-20

A codex pass read every spec against a programmatic dump of the live Figma file.
It found things this checklist could not, because **the checklist was checking
itself**. Three of its findings were my own false claims.

| Finding | Severity | Resolution |
|---|---|---|
| **Integrations built on the wrong architecture** | BLOCKER | The screen implemented *OAuth vs pasted key* — the exact model `site-fullpage` §6.0 records an outside review correcting away. Stripe has no OAuth flow; drawing one invents a system that does not exist. Vercel, the only real OAuth, lives under Publishing. **Rebuilt** on §6.2: two groups split by *when a thing takes effect*. Four stale "three shapes" lines drained from three files. |
| **7 inspector profiles required, 1 existed** | BLOCKER | `inspector-spec` §2 gives an exact section order per profile. TEXT · FLEX · GRID · MEDIA · BUTTON · INPUT **built**, two open by default, 88+8+172 control anatomy. |
| **13 modal instances claimed, 6 existed** | BLOCKER | The three-width kit had been counted as the instances. Six **built**. |
| **12 shell states, none tracked by this checklist** | GAP | The checklist never asked for them, so 80/81 was measured against a list missing a whole requirement. All 12 now present. |
| **Media / Brand drill-ins were entry rows pointing nowhere** | GAP | 5 Media + 4 Brand destinations **built**. |
| **Orphan comments** (contracts §6.4) | GAP | anchored · detached · resolved-while-detached **built**, with the detached group pinned above the healthy pins. |
| **AI tier-2 states** | GAP | entry · generating · result · unavailable · chat **built**. |
| **Chrome modals** project settings · shortcuts | GAP | **Built**. |
| **PART-1 carried 4 answered questions as still open** | CONFLICT | Integrations · snapshot-vs-live · which package owns Site · templates library — all decided elsewhere, all marked RESOLVED with pointers. A question left standing after it is answered makes a designer plan for a fork that no longer exists. |
| Foundations page empty | MINOR | No spec demanded visible specimens, so codex would not call it a violation. Built anyway — tokens you cannot see are tokens a designer re-picks by eye. |

**The lesson worth keeping:** every false claim here was a *category error* — a kit
counted as its instances, entry rows counted as destinations, a widths-and-states
matrix counted as named modals. Ticking a row because the machinery exists is how
a checklist reaches 80/81 while a designer still cannot open the screen.

---

---

## P11 · The 91 enumerated states — the gap I dismissed

The codex pass reported most state sets as `0/N`. I put that down to having
handed it a summary-level inventory rather than the file, and moved on.

**I never checked.** A direct query for `<Set> · <state>` naming returned
**0 of 91**. Some states existed as shapes — Compare's mode strip, five of the
AI panel's eleven — but none was findable by name, and a state a designer cannot
search for is a state that was not handed over. Codex was right; my dismissal was
the error.

| Set | States | Spec |
|---|---|---|
| Versions | 7 | floating §2 |
| Compare | 8 | floating §3 |
| Command palette | 6 | floating §4 |
| Issues | 5 | floating §5 |
| AI | 11 | floating §6 |
| Notifications | 5 | floating §6a |
| Integrations | 5 | site §6.2 |
| Shape-1 detail | 6 | site §6.3 |
| Webhooks · Zapier | 5 | site §6.4 |
| Export | 7 | site §7 |
| Portfolio Sites | 7 | portfolio §3 |
| Brand push | 10 | portfolio §4 |
| Handover | 4 | portfolio §5 |
| Shared library | 5 | portfolio §6 |
| **Total** | **91** | all named `<Set> · <state>`, verified 91/91 |

**The states that earn their place.** Most are cheap; a handful are the design:

- `BrandPush · blast-radius` — three sites carry their own accent, and the push
  would replace it. Everything else in that flow is confirmation theatre next to
  knowing this.
- `BrandPush · partial-failure` — 5 of 7 wrote. Reporting that as success is how a
  client site silently keeps the old brand.
- `AI · step-gate` — the run pauses before anything destructive and waits rather
  than guessing. This is the line between an assistant and something that edits a
  client's site unattended.
- `AI · not-configured` — not hypothetical. A dev fallback that quietly succeeded
  is why AI was dead in production for months while it worked locally.
- `Shape1detail · saved-not-yet-published` — an injector only exists in the built
  output. Without this line a user edits an endpoint, tests nothing, and assumes
  the live site changed.
- `SharedLibrary · in-use-blocked-delete` — blocked, not warned. Seven sites lose
  the section otherwise.
- `CmdK · disabled-command` — shown with its reason. Hide it and the shortcut
  someone memorised silently vanishes.

---

## P9 · Cross-cutting — do not skip

| Item | Status | Why |
|---|---|---|
| Every empty state, real copy | ✅ | all 11, copy verbatim from shell §5.7 |
| Content stress pass | ✅ | **found 3 real breakages** — see below |
| Keyboard traversal annotation | ✅ | F6 badges 1-7 on the assembled screen + legend; focus outline shown on the inspector |
| Permissions pass — what DESIGNER cannot do | ✅ | 6 denials + the one allowed (Publish), each with its reason |
| 1280 check on every screen | ✅ | all 5 shells tile exactly; canvas is the only FILL region. 1280-overlay-drawer shell was missing and is now built |
| Contrast check | ✅ | **40 of 52 pairs failed.** Ink ramp rebuilt (4.63 / 7.0 / 16.3), `-text` siblings added for the 4 semantics, `border-input` split at 3:1. Text now 50/50. ⚠ one open founder call below |

---

## Running count

| Phase | Done | Total |
|---|---|---|
| P0 Foundations | 9 | 9 |
| P1 Atoms | 12 | 14 |
| P2 Molecules | 11 | 11 |
| P3 Shells | 7 | 8 |
| P4 Wedge | 6 | 6 |
| P5 Editor screens | 9 | 10 |
| P6 Floating + modals | 7 | 7 |
| P7 Site | 6 | 6 |
| P8 Portfolio | 4 | 4 |
| P9 Cross-cutting | 6 | 6 |
| P4b Shell states | 12 | 12 |
| P0b Foundations specimens | 1 | 1 |
| P11 Enumerated states | 91 | 91 |
| **Total** | **184** | **185** |

---

## Rules that apply to every row above

1. **Screenshot after every component** — then **read the node before believing the screenshot**. Four bugs today returned `success` and were only visible in pixels: a tooltip attached to the wrong variant, six icons rendered as solid squares, a fix that mutated nothing (`count: 0`) while looking identical, and a badge tint whose opacity was silently dropped (`setBoundVariableForPaint` returns a NEW paint — set opacity on what comes back, never on what goes in).
   ⚠ **`combineAsVariants` normalises variant fills and DROPS an opacity spread onto a variable-bound paint.** Bind and tint AFTER combining, never before. Badges survived only by accident — their tint happened to be applied in a later call.
   ⚠ And once, the screenshot lied the other way: badge tints looked grey and were correct. Reading `fills[0]` back settled it in one call after two were wasted chasing it. **Read the node first, then judge the pixels.**
2. **Never detach.** Missing capability = missing variant. Say so.
3. **Bind to variables**, never a raw hex or a typed number.
3a. **Pin every variable collection's mode at PAGE level, once.** A variable resolves only if some ancestor pins a mode for its collection — otherwise Figma renders the FALLBACK colour while `boundVariables` still reads as correct. This is what made Compare's change regions grey and cost three wrong theories; reading `explicitVariableModes` up the chain settled it. Both collections are now pinned on all seven pages, and the page structure already encodes which package each one is.
3a-ii. **Never tint a frame with `node.opacity` when it has children — it dims the label too.** The handover warning and the saved-but-not-live banner both rendered as empty coloured bars. Fix is a pre-mixed tint token (`color/warning-tint`, `color/error-tint`, `color/success-tint` in Primitives; `color/accent-tint` in Package, one value per package mode) so the fill is opaque and the text stays full strength. `node.opacity` remains correct for childless shapes (Compare's change regions) and for disabled controls, where dimming the label IS the intent.
3a-iii. **`maxLines` is a silent no-op.** `t.maxLines = 1` throws nothing, reports nothing, and leaves the property `null` — a read-back is the only way to catch it. What actually truncates to one line is a **pinned height**: `layoutSizingVertical = "FIXED"` plus `resize(w, fontSize * 1.5)`. 89 labels across the file were relying on `textTruncation` alone and would have wrapped on the first long client name.
3b. **`{...boundPaint, opacity}` does NOT survive assignment on a fresh node** — a probe showed it silently resetting to `opacity: 1`. Use `node.opacity` for childless nodes, or a pre-computed tint variable where children must stay opaque.
3c. **`figma.createAutoLayout()` returns a FRAME, and frames default to a WHITE fill.** 176 wrappers carried one — invisible on white panels, glaring the moment a row beneath was tinted. Clear fills on every layout wrapper.
3d. **Read the spec's own dimensions before inventing any.** The inspector was built by eye, overflowed 268, and the "discovery" turned out to be laziness — `inspector-spec` §4 had already solved it exactly (label 88 · gap 8 · control 172; segmented is FIVE at 34 because "labels never fit at 5-up"). Measuring caught it; reading would have prevented it.
3b. **`resize()` resets sizing modes to FIXED.** Set `AUTO`/`HUG`/`FILL` *after* any resize, never before — this froze three separate controls at width 10 today, and one of them made a gate pass for the wrong reason.
4. **More than three states → a variant set**, not separate frames.
5. **Real content, stressed.** No lorem ipsum.
6. **Layout may be invented. Behaviour may not.** If a doc does not state who may act or what happens next, that is a question.
