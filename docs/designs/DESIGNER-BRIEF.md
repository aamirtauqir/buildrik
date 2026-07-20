# Buildrick Editor — Designer Brief

> **Read this first, once, end to end.** It is the only document you need open to start. Everything else is depth you fetch when a section tells you to.
>
> **Three obligations while you work — §12 has them in full:**
> **Follow** these documents; they are decisions, not suggestions. Disagree out loud, never quietly.
> **Verify** anything you build on. An audit found **42 wrong claims** in these files, and a canvas width that was 320px off. Check the arithmetic before you trust it.
> **Ask** the moment something is unclear. *"I don't understand this"* is a complete reason to stop. Layout you may invent; **behaviour you may not**.
>
> Written 2026-07-19. If something here contradicts another document, this one is wrong — say so and we fix it.

---

## 1. What you are designing

**Buildrick is a visual website builder.** Desktop only. It competes with Webflow and Framer.

**Who uses it:** an **agency designer**. They build websites *for clients*. They juggle 4–20 client sites at once. Their week looks like: build a page → make it match the client's brand → send it to the client → get feedback → fix it → send again → publish.

**What makes us different (the wedge):** the **client sign-off loop**. Today agencies duct-tape this together with email, Figma comments and Loom videos. Nobody owns it. We do.

That means one thing for you: **when you design the sign-off screens, that is the product's most important work.** Everything else is table stakes we have to match. Sign-off is where we win or don't.

⚠ **And the wedge is the least-built part of the product.** An independent review on 2026-07-19 traced the code: what exists today is an *internal* review loop — designer submits, workspace **admin** approves, emails go to admins. The client-facing half does not exist. `Comment.authorId` is required and points at a `User`; `ReviewRequest` carries no token; every review procedure demands a signed-in member.

Everything else you will draw — Site, Portfolio, integrations, export — has more working code behind it than the thing the company wins on. **Draw steps 1–6 knowing that step 6 is the one that decides whether any of the rest matters.**

**Two people use what you draw:**
- **Ali**, the agency designer — lives in the editor all day, is a power user, wants speed and precision.
- **Sara**, Ali's client — a restaurant owner, not technical, opens one link, looks, comments, approves. **She sees exactly one screen. It has to be obvious with zero instruction.**

---

## 2. Start here — the order of work

⚠ **Before step 1, read `2026-07-20-figma-working-rules.md`.** A `32h` row appears **forty times** in these documents and the `320w` drawer serves **seven** surfaces. Build the components first — the build order below assumes you have. Drawing screens first means drawing that row forty times.

**Do not start at screen 1 and go to screen 56.** Most screens are children of a few frames. Settle the frames, then the children fall out fast. Steps 10 and 11 are deliberately last: both reuse a frame settled earlier, so drawing them first would mean drawing a frame twice.

| # | Do this | Why | Source |
|---|---|---|---|
| 1 | **The shell at 1440×900** | Every other editor screen lives inside it. Draw every region at real size. | `2026-07-18-editor-shell-wireframes.md` |
| 2 | **The drawer frame** — 320w, header 44h, three body layouts | Six rail panels are the same frame with different contents. | same file §3 |
| 3 | **The two heaviest panels first: Media and Brand** | ⚠ If their contents do not fit 320w, the frame changes — and everything drawn on it gets redone. **Do these before treating the frame as final.** | `2026-07-18-drawer-cargo-sheets.md` |
| 4 | **The other four panels** — Insert · Layers · Pages · Content | Same frame, lighter cargo. | same file |
| 5 | **The inspector** | Highest-traffic surface in the product. Section order per element type is already decided; you draw the controls. | `2026-07-18-inspector-spec.md` |
| 6 | **The wedge — J5 sign-off, 6 screens** | The differentiator. Wireframes already exist at full fidelity; you take them to hi-fi. | `2026-07-18-j5-signoff-wireframes.md` |
| 7 | **Floating panels** — ⌘K · Versions + Compare · Issues · AI | Compare is the wedge's core screen. | `2026-07-18-floating-panels-spec.md` |
| 8 | **Site** — the full-page area outside the editor | 14 destinations, one shell, one field pattern. | `2026-07-18-site-fullpage-wireframes.md` |
| 9 | **Portfolio** — everything above one site | Same shell as Site, different content contract. Holds brand push, the only destructive cross-site flow. | `2026-07-19-portfolio-wireframes.md` |
| 10 | **Review panel** — the rail's conditional 7th item | The wedge's work surface: what you still owe the client. Draw it after step 6 while the sign-off flow is fresh. | `2026-07-18-drawer-cargo-sheets.md` §6.5 |
| 11 | **Notifications panel** | Third occupant of the same right-side frame as Versions and Issues — instance it, do not redraw. | `2026-07-18-floating-panels-spec.md` §6 |
| 12 | **The modal kit** — one frame, three widths, ~8 instances | Do the frame before any instance. Eight modals drawn independently is eight different modals. | `2026-07-18-floating-panels-spec.md` §7 |
| 13 | **Integrations** — two groups, not connection shapes | Split by **when a thing takes effect**, not how you authenticate it: *baked in at publish* (Formspree, Stripe) vs *connected once, used everywhere* (Slack, Mailchimp, ConvertKit, Zapier). Stripe has **no OAuth flow** — drawing one invents a system that does not exist. Vercel is the only real OAuth and lives under Publishing. | `2026-07-18-site-fullpage-wireframes.md` §6.0-6.2 |

**Everything above has a drawn layout to work from. Start any of it today.** Seven places where source docs contradicted each other were found and settled on 2026-07-19 — see §6a for what changed, in case you are reading an older copy of anything.

---

## 3. How ready each screen is — three tiers

There are **56 screen specs** in `docs/prd/editor/14-screen-specs.md` (49 `S*` screens + 7 `C*` chrome surfaces). They are not all ready in the same way, and the difference matters:

**Tier 1 — layout drawn.** A wireframe doc gives dimensions, regions and states. You are refining, not inventing. Everything in §2 is here.

**Tier 2 — behaviour specified, layout not drawn.** Ch.14 gives the purpose, entry→exit, features, states, roles and data — but nobody has drawn where things sit. **You can and should draw these**; you are supplying layout on top of a settled brief. Expect to raise questions; that is the job, not a failure.

| Tier 2 | Where its brief lives |
|---|---|
| **AI** — brief entry · generating · result · unavailable · chat | Ch.14 S2.1–S2.5 |
| **Brand sub-screens** — presets · starters · lint · import/export | Ch.14 S4.2–S4.5 |
| **Chrome modals** — project settings · conflict · recovery · shortcuts | Ch.14 C4–C7 |

⚠ The **modal kit is specced** — `2026-07-18-floating-panels-spec.md` §7. One frame, three widths (440 question · 560 flow · 580 form), one set of rules. Instance it; do not draw a fourth width.

**Tier 3 — genuinely blocked. Do not start.**

**Empty as of 2026-07-19.** Every surface in the product now has a spec.

*Two things sat here earlier today. **Portfolio** got a full spec once brand push was placed there. The **Review panel** — the rail's conditional seventh item, and the wedge's actual work surface — is specced in `2026-07-18-drawer-cargo-sheets.md` §6.5. The **Notifications panel** was found missing while writing the contracts and is specced in `2026-07-18-floating-panels-spec.md` §6.*

**The five system contracts are now written** — `2026-07-19-system-contracts.md`. They decide how screens *behave*: the review state machine, the permissions matrix, Compare's diff contract, notifications, and publish rollback. **Read them before steps 7, 8 or 9** — those three were blocked on exactly this.

**All three founder decisions inside them are now made** (2026-07-19), and each changes what you draw:

| Decided | What it means for your screens |
|---|---|
| A **DESIGNER may publish** | the topbar CTA is **enabled** for a designer once approved — not disabled with an "Admins can publish" tooltip |
| A **DESIGNER may create shared library assets, but not edit or delete them** | in Portfolio's three collection screens, each card's `⋯` shows **Open** enabled, **Rename** and **Delete** disabled with a reason. `+ New` stays enabled. |
| **20 published versions kept per site; approved ones never pruned** | Publish history carries the footnote *"Last 20 publishes. Approved ones are always kept."* |

⚠ The publish decision is a **behaviour change**: `server/trpc/routers/sites.ts:272` is admin-only today. Draw the new rule; engineering has been told.

✅ **Compare — resolved 2026-07-19, from the code.** This was the last open item and the last thing blocking any step.

The engine already stores snapshots: `NamedVersion.snapshot` is a full `ProjectData` JSON (`VersionTimelineManager.ts:564`), the server already persists it (`SiteVersion.payload`, wired end to end), and both sides already prune. **Draw all three Compare modes** — side-by-side, overlay and list. Both panes use the same renderer as the canvas; only the input differs.

*An earlier version of this brief warned that side-by-side and overlay might be cut. That warning assumed a snapshot meant stored rendered HTML. It does not, and the fallback is withdrawn.*

**An earlier version of this brief told you not to start Tier 2 at all.** That was wrong — it confused "no drawn layout" with "no spec", and would have idled you on fifteen screens that have briefs waiting.

---

## 4. The architecture in one page

Nine regions. Every surface answers exactly one question.

| Question the surface answers | Region |
|---|---|
| What do I add or navigate to on this page? | **Left rail** — six tools |
| What is inside the tool I picked? | **Drawer** — 320w |
| What is the state of this document or review? | **Topbar** |
| What am I building? | **Canvas** |
| How am I looking at the canvas? | **Canvas toolbar** (floating pill) |
| What is this thing I selected? | **Right inspector** |
| Is anything wrong / am I synced? | **Footer** |
| How does this site behave once live? | **Site** (full page) |
| What does my client see? | **Client** (separate app) |
| What is true across all my clients? | **Portfolio** (separate app) |

**Review is not a region.** While a review is live, a seventh icon appears at the bottom of the rail below a divider, and disappears when the review closes. It answers "what do I still owe the client?"

**The rail, in order:** Insert · Layers · Pages · Media · Content · Brand.
Insert and Layers sit together because that is the pair you ping-pong between — drop a thing, go find the thing. Media follows because it feeds Insert. Pages, Content and Brand are phase tools — heavy in week 1 or week 5, quiet otherwise — so they trail.

*Settled 2026-07-19. Eight documents previously printed `Insert · Pages · Layers`; all have been corrected. If you find a ninth, it is stale.*

**Full detail:** `PART-1-information-architecture.md`.

---

## 5. The numbers you need daily

| Thing | Size |
|---|---|
| Design viewport | **1440 × 900** · minimum supported **1280 × 720** |
| Topbar | 56h |
| Page tabs (only when >1 page) | 36h |
| Rail | 60w · icon 24 in a 44 hit-target · 8 gap |
| Drawer | **320w** all six panels · header 44h |
| Inspector | 300w · header 48h · context bar 32h |
| Footer | 32h |
| Canvas toolbar | floating pill 44h, bottom-centred, 24 from the bottom |
| Rows | **28h** dense trees (Layers) · **32h** everything else |
| Media grid cell | **136 × 104**, 2 columns, 16 gutter, 16 padding — `16+136+16+136+16 = 320` |
| Grid | 4px base |

**The drawer has two modes, and they give different canvas widths.** Getting this wrong is the easiest way to draw the whole shell at the wrong size:

| Drawer mode | Behaviour | Canvas at 1440 |
|---|---|---|
| **Transient** (the default) | overlays the canvas, auto-closes on the first canvas interaction | **1080** — `viewport − 360` |
| **Pinned** (⇥ in the drawer header) | pushes; canvas shrinks and stays shrunk | **760** — `viewport − 360 − 320` |

**Draw the default shell with a transient drawer — canvas 1080.** Pinned is a separate state, not the base frame. Pin auto-releases below 1380.

**The arithmetic must add up. Always check:**
```
vertical    56 + 36 + BAND + 32 = 900          → BAND = 776   (page tabs showing; 812 without)
horizontal  60 + CANVAS + 300 = 1440           → CANVAS = 1080  (drawer transient — default)
            60 + 320 + CANVAS + 300 = 1440     → CANVAS = 760   (drawer pinned)
```
This is not pedantry — three separate drafts of the spec shipped numbers that did not add up, including one that lost the footer entirely, and an earlier version of *this brief* printed only the pinned width as if it were the default.

---

## 6. Craft rules — non-negotiable

**From `DESIGN.md`** (that file is the source of truth for *values* — colour, type, spacing, motion):

- **Two accents, one per surface — do not mix them.** Buildrick's product accent is **`#406ED6`** (adopted 2026-07-18 from the founder's UI kit). **Editor chrome is the one surface still on cobalt `#2D6DFF`**, because it carries its own `--buildrick-*` token system and has not been migrated yet.

  **Which accent follows the package, not the screen's distance from the canvas.** Site looks like it is "outside the editor" but ships inside the editor app, so it stays cobalt.

  | You are drawing | Ships in | Accent |
  |---|---|---|
  | Editor chrome — rail, drawer, topbar, inspector, canvas, footer | editor | **cobalt `#2D6DFF`** |
  | **Site** — settings, domains, publish, export | editor | **cobalt `#2D6DFF`** |
  | **Portfolio** — sites, shared assets, brand push | dashboard | **`#406ED6`** |
  | **Client review page** | dashboard | **`Client.brandColor`, else `#406ED6`** |

  Purple, violet and indigo are banned everywhere. Red means error, danger or destructive only — never a CTA.
- **No pure black.** Use slate-700 `#334155`.
- **Type:** General Sans (display) · Inter Tight or Geist (UI) · Geist Mono (data). No Arial, Helvetica or Roboto fallbacks.
- **4px spacing base. Compact density** — this is a professional tool, not a marketing page. Do not inflate padding.
- **Minimal motion.** 120–200ms, no spring physics, no scroll choreography.
- **Light theme.** Desktop only.

**The scales, so you do not have to invent them:**

| | |
|---|---|
| **Type scale (px)** | 11 · 12 · 13 · 14 · 16 · 20 · 24 · 32 · 48. Editor chrome lives at **12–14**. Panel titles 14/600 · row labels 13/400 · breadcrumb page 13/500 · mono data 11/500. |
| **Spacing scale** | 2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (4px base) |
| **Radius** | `sm 4` inputs and row corners · `md 8` buttons, panels, cards · `lg 12` modals · `full` pills and avatars |
| **Motion** | hover **120ms** · panel open **200ms** · modal enter **200ms**. Easing: enter `ease-out` · exit `ease-in` · move `ease-in-out`. Respect `prefers-reduced-motion`. |
| **Numerals** | Geist Mono with `tabular-nums` for every dimension, timestamp, slug, file size and count |

⚠ **`DESIGN.md` is the source for values, never for layout.** Its editor-layout sections describe the previous product — an 11-tab sidebar, a 3-zone rail, an old shortcut map — and a banner in that file marks most of them. One line escaped that banner and said the inspector was 320 wide (it is 300); it was corrected on 2026-07-19. **If `DESIGN.md` and the shell wireframes disagree about a dimension, the wireframes win.**

**Anti-slop — these fail review:**
- Generic SaaS card grids
- Cards that do not earn their existence
- Decorative shadows and gradients
- Any section that does two jobs

---

## 6a. Settled conflicts — where two docs used to disagree

Three reviews on 2026-07-19 found the source docs giving two different answers in **seven** places. **All seven are now fixed at source.** Recorded here so you know what changed if you read an older copy of anything:

| Conflict | Resolved | Fixed in |
|---|---|---|
| **Comment mode** | The rail and inspector **stay fully live**. Reading "hero too dark" and being unable to fix it without leaving the mode breaks the exact loop the product exists for. Pins stay visible while you edit. | shell wireframes, state 6 |
| **Client review page accent** | **`Client.brandColor`, else `#406ED6`** — with a 4.5:1 contrast floor (fails → brand colour on the header only, `#406ED6` on the primary button). *Not* the editor's cobalt: that page ships in the dashboard, which runs the product accent. | shell wireframes, A8 |
| **Media grid cell** | **136 × 104** — `16+136+16+136+16 = 320` exactly. The shell doc said 140 × 96, which totals 328 and overflows the panel by 8px. An earlier version of this brief copied the wrong one. | shell wireframes §3 |
| **Inspector width** | **300**, not 320. `DESIGN.md`'s Layout section escaped its own supersede banner and still carried the old 320. | `DESIGN.md` |
| **Brand push home** | **Portfolio**, not Site › AGENCY and not Brand. It writes into several sites' documents and no single site's history can author that record. | Portfolio spec, Site spec, Ch.14 `S4.7` |
| **Which accent where** | **By package, not by distance from the canvas.** Site ships in the editor, so it is cobalt; Portfolio and the client page ship in the dashboard, so they are `#406ED6`. An earlier version of this brief said "anything outside the editor" and made Site ambiguous. | §6 table |
| **Rail order** | **Insert · Layers · Pages · Media · Content · Brand** — the adjacency argument won: Insert and Layers are the pair you ping-pong between. Eight documents printing `Insert · Pages · Layers` were copies of one older line, not eight independent judgements. | `DESIGN.md`, Ch.14, `PART-1`, redesign-complete ×4, ia-redesign, teach lesson |

All seven are settled. If you hit an eighth disagreement, that is a bug in our documents — tell us rather than picking one.

---

## 7. Every screen needs these — the checklist

A screen is not done until all ten are answered. If you cannot answer one, that is a question for us, not a thing to invent.

| # | | Fail | Pass |
|---|---|---|---|
| 1 | **Size** | "a panel" | 320w · header 44h · rows 32h |
| 2 | **Position** | "next to the canvas" | bottom-centred, 24 from the bottom |
| 3 | **Hierarchy** | a list of features | what the eye hits first, second, third |
| 4 | **States** | the word "empty" | the actual empty screen, with its real copy |
| 5 | **Behaviour** | "click opens it" | clicking it again closes it |
| 6 | **Real content** | "Page name" | "Bella Cucina — Menu" |
| 7 | **Content stress** | — | 40 pages · 200 layers · a very long site name |
| 8 | **Entry → exit** | — | where you came from, where you go |
| 9 | **Permissions** | — | what a DESIGNER cannot do here |
| 10 | **Copy** | button labels | empty-state and error lines, written |

**States every screen needs:** empty · loading · error · full / overflowing · disabled or gated.
Empty-state copy for the six panels is already written — `2026-07-18-editor-shell-wireframes.md` §5.7. Use those words exactly.

**Control states:** rest · hover · focus (2px cobalt ring, keyboard only) · disabled (**with a tooltip saying why** — a disabled control with no reason is a bug) · loading.

**Keyboard traversal is specced** — `2026-07-18-floating-panels-spec.md` §8. `Tab` moves within a region, `F6` moves between them, `Esc` steps out one level, and the focused region carries a 2px accent outline. Draw that outline; without it an `F6` user is lost on the first press.

---

## 8. Traps — things that have already gone wrong here

1. **Do not treat the shell frame as final before Media and Brand are drawn.** They are the heaviest panels. If they do not fit, the frame moves and your work moves with it.
2. **Do not follow `DESIGN.md` for layout.** It describes the previous editor. Values only.
3. **Do not trust a count in any design doc.** Counts live in `GENERATED-inventory.md`, generated from the code. Everything else may be stale.
4. **A spec describing a target is not a description of what exists.** Much of what is written is what we *will* build. If you need to know what runs today, read `2026-07-18-editor-complete-state.md`.
5. **Do not invent to fill a gap.** Ask. Several documented "features" turned out not to exist, and several that were called stubs turned out to work.
6. **The client review page is not the editor.** Different package, different accent (`Client.brandColor`, else the product accent `#406ED6` — **not** cobalt; see §6), different user, zero training. Do not carry editor chrome into it.
7. **Do not trust this brief's numbers over the source doc's.** Every number here is copied from somewhere else, and copies rot. A 2026-07-19 review caught four wrong ones in the first version. When a dimension matters, open the wireframe doc.

---

## 9. Definition of done, per screen

- All ten checklist rows in §7 answered
- Every state drawn, not listed
- Real content, stressed
- Arithmetic adds up at 1440 and at 1280
- Contrast checked — 4.5:1 body, 3:1 large text and UI
- Components used, not redrawn — if a pattern exists, instance it
- Anything you had to invent is written down as a question

---

## 10. Ask before you draw — the open questions

These are genuinely undecided. If your screen touches one, ask first.

1. ~~Permissions~~ — **settled**, contracts §2. Full matrix across OWNER / ADMIN / DESIGNER / CLIENT, with the drawing rule: disabled with a reason, never hidden — except on the client page, which renders no editing affordance at all.
2. ~~Compare's render source~~ — **answered from the code 2026-07-19**, contracts §3.3. Snapshots already exist as `ProjectData` JSON and are already persisted and pruned. All three modes are buildable; nothing is conditional.
3. ~~Comment timing~~ — **settled 2026-07-19**, contracts §1.6: the client sees a **snapshot frozen at send**, not the live draft. Commenting on a moving target makes orphan pins routine, and an approval must name a specific thing. The designer's review bar counts changes since sent.
4. ~~Review history~~ — **settled**: yes. The Review panel carries `‹ Round 2 of 3 ›`, older rounds read-only (`drawer-cargo-sheets.md` §6.5). Without it a client who repeats feedback looks unreasonable when they are not.
5. ~~Template library~~ — **settled**: Portfolio › Templates (`2026-07-19-portfolio-wireframes.md` §6), with `used in N sites` — the number a site-scoped library structurally cannot show.
6. **Cut-or-build calls** — two were decided on 2026-07-19, both **BUILD**, both specced:
   - **Integrations** → `2026-07-18-site-fullpage-wireframes.md` §6.0-6.2. Six rows in **two groups** — *baked in at publish* (Formspree, Stripe: an injector is configured, not connected) and *connected once, used everywhere* (Slack, Mailchimp, ConvertKit, Zapier: workspace-level, so the per-site control is a checkbox, never a disconnect). Netlify Forms was replaced by **Slack** — Netlify Forms only works on Netlify hosting and we publish to Vercel, so it could never have shipped.
   - **Vue + Next.js export** → same file, §7.5 › Export. Six formats in two intent groups.

   Still undecided, none blocking a step: PageWizard · whole-site AI · AllCSS · Figma export · catalog drop · collaboration · plugin manager.

---

## 11. Where everything lives

All paths are from the repository root.

| You need | Open |
|---|---|
| This brief | `docs/designs/DESIGNER-BRIEF.md` |
| **How things behave** — roles, review states, diff, notifications, rollback | `docs/designs/2026-07-19-system-contracts.md` |
| **The plan** — phases, gates, schedule | `docs/designs/2026-07-20-figma-execution-plan.md` |
| **How to work in Figma** — components first, the traps, the rules | `docs/designs/2026-07-20-figma-working-rules.md` |
| **What the server can already do** — per surface, with evidence | `docs/designs/2026-07-20-backend-readiness.md` |
| Where things go | `docs/designs/PART-1-information-architecture.md` |
| Sizes, states, the frame | `docs/designs/2026-07-18-editor-shell-wireframes.md` |
| What is inside each panel | `docs/designs/2026-07-18-drawer-cargo-sheets.md` |
| The inspector | `docs/designs/2026-07-18-inspector-spec.md` |
| ⌘K · Versions+Compare · Issues · AI | `docs/designs/2026-07-18-floating-panels-spec.md` |
| Site (settings, domains, publish) | `docs/designs/2026-07-18-site-fullpage-wireframes.md` |
| The wedge — sign-off screens | `docs/designs/2026-07-18-j5-signoff-wireframes.md` |
| Portfolio — sites, shared assets, brand push | `docs/designs/2026-07-19-portfolio-wireframes.md` |
| Per-screen briefs, all 56 | `docs/prd/editor/14-screen-specs.md` |
| Real counts | `docs/designs/GENERATED-inventory.md` |
| What works vs what is broken | `docs/designs/2026-07-18-editor-complete-state.md` |
| **All of your docs, one scrolling book** | `docs/designs/BUILDRICK-EDITOR-DESIGN-BOOK.html` — this brief plus the eight specs, nothing else |
| Craft values (not layout) | `DESIGN.md` |

---

## 12. How we work together

Three obligations, and the third is the one people skip.

### Follow the documents

**These are not suggestions with a design brief attached.** Sizes, states, section order, permissions and behaviour are decided — most of them after an argument, several after being wrong once. When you draw something different from what a document says, the document is not "guidance you improved on"; it is a decision you have silently reversed, and nobody will notice until build.

If a decision looks wrong, **say it looks wrong.** That is welcome and it has already changed this product several times — the rail order, brand push's home, and the whole three-tier readiness model all came from someone pushing back. What is not welcome is quietly designing around it.

### Verify — the documents have been wrong

This is the unusual instruction, and it is earned:

| | |
|---|---|
| An audit on 2026-07-18 | found **42 hand-written claims wrong** in these documents |
| Seven review passes since | found **7 places where two documents contradicted each other** |
| One canvas width | was **320px wrong** — the pinned drawer's number written down as the default |
| One media cell | was `140 × 96`, which totals **328 in a 320 panel** |
| The same fix | landed on one line and missed its sibling **eleven separate times** |

So: **when a number matters, check it adds up before you build on it.**

```
horizontal   60 + 320 + canvas + 300 = 1440
vertical     56 + 36 + band + 32     = 900
drawer       16 + 136 + 16 + 136 + 16 = 320
portfolio    232×4 + 24×3            = 1000
```

Two things follow from this:

- **If two documents disagree, that is a bug in our documents — report it, do not pick one.** Picking one is how a wrong number survives. Seven of these have been found and settled (§6a); an eighth is likely.
- **The brief is a copy, and copies rot.** Where a dimension matters, open the wireframe doc it came from. Part VI for the shell, Part VII for panels.

### Ask when it is not clear

**"I don't understand this" is a complete and sufficient reason to stop and ask.** You do not need to have narrowed it down, and you do not need to be sure it is our fault. Every question in §10 exists because someone invented an answer instead of asking.

Ask — do not decide — when any of these is true:

- A document says what a thing *is* but not how big, where, or what happens when it is empty.
- Two documents give different answers.
- You need a **behaviour** that is written nowhere — who may do this, what happens next, what this looks like while loading. Layout you may invent; behaviour you may not. That is the line.
- The spec is drawable but feels wrong, and you cannot say why yet. Say that. "This feels off and I can't articulate it" has surfaced real problems here.
- You had to invent something to keep moving. Write it down as a question even if you already drew past it.

**A question costs an hour. An invention costs a week, and it costs it later, when it is expensive.**

### And

**Start with the wedge if you want the highest-value work.** The six sign-off screens are the reason this product exists. They are fully specified, and §1 explains why they are also the least-built part of it.
