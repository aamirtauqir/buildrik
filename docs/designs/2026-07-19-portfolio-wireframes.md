# Portfolio — Wireframes (everything above one site)

> The fourth surface. The shell doc specs the editor, `2026-07-18-site-fullpage-wireframes.md` specs Site, `2026-07-18-j5-signoff-wireframes.md` specs the client page. This specs **Portfolio** — the region that exists because the primary user runs **4–20 client sites at once** and every other region is scoped to exactly one.
>
> **Why this file exists:** Portfolio was added to the architecture in `PART-1` §2 and then had zero spec, which made it the one region a designer was told not to draw. Brand push was placed here on 2026-07-19 (it had been sitting in three different homes), and that decision made the gap blocking rather than theoretical.
>
> Craft values come from `DESIGN.md`. Ships in the **dashboard** package, so it runs the product accent **`#406ED6`**, not the editor's cobalt.

---

## 1. Shape — the agency's home, not a site's parent

Portfolio is where a designer lands *before* choosing a site, and where they go when a question spans clients. It reuses **Site's shell** — 56h header, 240w nav, content column — because they are siblings, not because it is convenient: a designer moving between them should not relearn a layout.

```
◄──────────────────────────────── 1440 ────────────────────────────────►
┌──────────────────────────────────────────────────────────────────────┐  ▲
│ ⬢ Buildrick          Portfolio                    ⌕        ◐  AT     │  │ 56
├──────────────────┬───────────────────────────────────────────────────┤  ▼
│                  │                                                   │  ▲
│  Sites        12 │   Sites                            [ + New site ] │  │
│                  │                                                   │  │
│ SHARED           │   ┌───────────┐ ┌───────────┐ ┌───────────┐       │  │
│  Templates     8 │   │  ▓▓▓▓▓▓▓  │ │  ▓▓▓▓▓▓▓  │ │  ▓▓▓▓▓▓▓  │       │  │
│  Components   27 │   │           │ │           │ │           │       │  │
│  Brand kits    4 │   │ Bella Cuc │ │ Trattoria │ │ Osteria   │       │  │
│                  │   │ ● Live    │ │ ◷ Review  │ │ ○ Draft   │       │  844
│ AGENCY           │   │ 2h ago    │ │ 1d ago    │ │ 3d ago    │       │  │
│  Brand push    ★ │   └───────────┘ └───────────┘ └───────────┘       │  │
│  Handover      2 │                                                   │  │
│                  │   ┌───────────┐ ┌───────────┐ ┌───────────┐       │  │
│ ─────────────    │   │  ▓▓▓▓▓▓▓  │ │  ▓▓▓▓▓▓▓  │ │  ▓▓▓▓▓▓▓  │       │  │
│  Members      ↗  │   └───────────┘ └───────────┘ └───────────┘       │  │
│  Billing      ↗  │                                                   │  │
│      240         │              content — fills, max 1000            │  ▼
└──────────────────┴───────────────────────────────────────────────────┘
```

| Region | Size | Notes |
|---|---|---|
| Header | **56h** | matches the editor topbar and Site header so the three never jump. No `‹ Back` — this is a root, not a takeover. `⌕` opens cross-site search; `◐` is the theme toggle; `AT` is the account menu. |
| Nav | **240w** | identical anatomy to Site's nav: group label 11px caps `--ink-soft` 32h, item rows **32h**, active = 3px accent left bar + accent tint. |
| Content | **fills, max 1000** | wider than Site's 720 because this region shows *collections*, not forms. Site is one column of fields; Portfolio is a grid of things. |
| Body height | **844** (900 − 56) | nav and content scroll independently |

⚠ The ASCII above draws **3 cards per row because that is what fits in a monospace sketch**. The real grid is **4 up** — see §3 for the arithmetic. Draw 4.

**Why max 1000 and not Site's 720.** Site's content is a settings form, and a form column past ~720 hurts readability. Portfolio's content is a card grid, where extra width buys another column instead of longer lines. Same shell, different content contract — say so, or the next person "harmonises" them and the grid drops to two columns on a 1440 screen.

---

## 2. The six destinations

| Group | Screen | Status today | Notes |
|---|---|---|---|
| — | **Sites** | ❌ absent | the landing surface. Card grid, status per site. |
| **SHARED** | Templates | 🟡 site-scoped only | today "My Templates" lives inside one site and cannot express reuse across clients — the agency's actual asset |
| | Components | 🟡 site-scoped only | same problem, same fix |
| | Brand kits | ❌ absent | one client's brand, reusable across that client's sites |
| **AGENCY** | **Brand push** ★ | 🟡 **backend complete, UI absent** | §4 — the only destructive cross-site flow. `theme.ts` carries `targets` · `previewPush` · `push` · `rollback` — **every step of the five-step flow has a procedure behind it.** *(This row said `❌ absent` until 2026-07-20; that badly understated what exists.)* |
| | Handover | ❌ absent | §5 — a weekly agency event with no surface until now |
| **WORKSPACE** | Members ↗ · Billing ↗ | ✅ | leave for the dashboard, same as Site |

**Nav badges** carry the same meanings as Site's (`★` agency feature, `↗` leaves the app, a bare number is a count) — one badge language across both surfaces.

---

## 3. Sites — the landing grid

The first screen an agency opens in the morning. It answers one question: **what needs me today?**

- **Card 232 × 180** — thumb 232 × 116 (site's home page render) · name row 32h · status row 32h. Grid `repeat(auto-fill, minmax(232, 1fr))`, 24 gutter: `232×4 + 24×3 = 1000` exactly, so a full-width column shows **4 up** and reflows to 3 (`232×3 + 24×2 = 744`) without a breakpoint.

  *(Corrected 2026-07-19: this said 240 × 180, which gives `240×4 + 24×3 = 1032` and overflows the 1000 column by 32px. Caught by an outside review of this very file, which exists partly to insist the arithmetic is checked.)*
- **Status dot + label**, one per card, from the site's real state: `● Live` · `◷ In review` · `⌾ Changes requested` · `○ Draft` · `⚠ Publish failed`.
- **Relative time** — last edited, not last published; the designer is asking about their own work.
- **Sort** — `Needs me` (default) · Recently edited · Name · Status. `Needs me` puts changes-requested first, then in-review, then failed publishes: the surfaces that have someone waiting on the other end.
- **Filter row 36h** — status pills with counts, plus a client filter once >12 sites.
- **Card hover** raises 2px and reveals `Open ›` plus a `⋯` (Duplicate · Archive · Settings). Clicking the card body opens the **editor**, not settings — the common case wins the whole target.

**States:** grid · filtered · sorted · empty (first run — "No sites yet. Create your first client site.") · one-site (grid still, no filter row — a filter over one item is noise) · loading (6 skeleton cards) · thumb-missing (name-only card, no broken-image frame).

---

## 4. Brand push — the second wedge, and the only destructive flow

Changes tokens across **other clients' live sites**. It gets the most careful treatment in the product.

*Moved here 2026-07-19 from Site › AGENCY. The reason is the data model, not the layout: a push writes into several sites' documents, and no single site's version history can author that record — the site did not make the change. The flow and its 24-hour undo therefore belong to the region that owns cross-site state, and each affected site's version list links back to this record rather than inventing an author. Launching a four-site destructive operation from one site's settings was also a mis-click surface.*

**One thing changed in the move.** Step 1's source is now a picker, not a fixed value. Launching from Site meant the source was always the site you happened to be in; from Portfolio you choose it. That removes the "navigate to Trattoria first so I can push *its* brand" detour.

```
Step 1 — pick sites            Step 2 — diff              Step 3 — blast radius
┌────────────────────────┐    ┌──────────────────────┐   ┌──────────────────────┐
│ Push brand from        │    │ 3 tokens change      │   │ This will change:    │
│ ┌────────────────────┐ │    │                      │   │                      │
│ │ Bella Cucina     ▾ │ │    │ color/primary        │   │  4 sites             │
│ └────────────────────┘ │    │  ● #C2410C → ● #B91C │   │  27 pages            │
│ To:                    │    │ radius/md            │   │  312 elements        │
│ ☑ Trattoria Nord       │    │  6px → 8px           │   │                      │
│ ☑ Osteria Sud          │    │ font/body            │   │  2 sites are LIVE    │
│ ☑ Pizzeria Est         │    │  Inter → Inter Tight │   │                      │
│ ☐ Caffe Ovest (live)   │    │                      │   │ Type PUSH to confirm │
│                        │    │ ( Back ) [ Continue ]│   │ ┌──────────────────┐ │
│ [ Preview changes ]    │    └──────────────────────┘   │ │                  │ │
└────────────────────────┘                               │ └──────────────────┘ │
                                                         │ ( Cancel ) [ Push ]  │
Step 4 — pushing               Step 5 — done             └──────────────────────┘
┌────────────────────────┐    ┌──────────────────────┐
│ Pushing to 4 sites…    │    │ ✓ Pushed to 4 sites  │
│ ▓▓▓▓▓▓▓▓░░  3 of 4     │    │                      │
│ ✓ Trattoria Nord       │    │ Live sites are not   │
│ ✓ Osteria Sud          │    │ republished — push   │
│ ◷ Pizzeria Est         │    │ each when ready.     │
│ ( Stop )               │    │ ( Undo this push )   │
└────────────────────────┘    └──────────────────────┘
```

**Frame:** modal **560w**, centred, over a scrim. Not a nav destination with a content column — the five steps are a transaction, and a transaction that can be navigated away from mid-flight is a bug. Step content min-height 320 so the frame does not resize between steps.

Non-negotiables:
- **Typed confirmation** (`PUSH`), not a checkbox. This is the only surface in the product that can damage a client site the designer isn't looking at.
- **Blast radius is counted before confirm** — sites · pages · elements, with live sites called out separately.
- **Push never republishes.** It updates the draft; each site is published on its own schedule. Say so on the success screen.
- **Undo for 24h** — a reverse push restoring the previous token values. After that, versions are the recovery path.
- Per-site failure does not abort the run; failures are listed and retryable individually.
- **Source cannot also be a target.** The source site is excluded from the "To:" list, not shown-and-disabled — there is nothing to explain.

**States:** `pick · empty-selection · diff · no-changes · blast-radius · confirming · pushing · partial-failure · done · undone`.

---

## 5. Handover — what state is this site in

A weekly agency event with no surface until now: *is this client's site ready to hand back, and what is outstanding?*

- **Per-site row 64h** — name · status · three counts: open comments · unresolved review items · publish state. Rows for sites needing nothing collapse into a `6 sites are clear` summary row at the bottom, so the list shows work, not inventory.
- **Row expands** to the outstanding items with a jump-to-editor link per item.
- **Nav badge** counts sites needing attention, not total sites.

**States:** list · expanded-row · all-clear · empty (no sites).

**What counts as outstanding is settled** — `2026-07-19-system-contracts.md` §6.3: open comments · changes-requested · stale approval · failed publish · approved-but-never-published. Everything else rolls into the `N sites are clear` row.

---

## 6. Shared templates · components · brand kits

Three collections, one layout — a card grid with the same card geometry as §3 so nothing is relearned.

| Collection | Card shows | Actions |
|---|---|---|
| **Templates** | preview thumb · name · "used in N sites" | Insert into… · **Rename** · **Delete** |
| **Components** | preview thumb · name · variant count · "used in N sites" | Open · **Rename** · **Delete** |
| **Brand kits** | 5 token swatches + type sample · name · "applied to N sites" | Apply to… · Duplicate · **Delete** |

**Bold actions are ADMIN-only** (contracts §2, decided 2026-07-19). For a DESIGNER they render **disabled with the reason** — `Admins can rename shared components` — never hidden. `+ New` stays enabled for everyone: creating is additive, deleting has a 27-site blast radius.

**Applying a brand kit overwrites**, behind a diff preview — contracts §6.2, the same pattern as Brand’s import.

- **"Used in N sites" is the whole point of promoting these out of a site.** It is the number a site-scoped library structurally cannot show, and it is what makes deleting safe to reason about.
- **Delete is blocked while in use** — the dialog lists the consuming sites and offers to open them. A shared asset deleted from under four live sites is the same class of damage as an unguarded brand push.

**States (each):** grid · empty · in-use-blocked-delete · renaming · loading.

---

## 7. Still open

1. ~~Review state machine~~ — **written**, `2026-07-19-system-contracts.md` §1. §5's counts derive from it via §6.3.
2. ~~Permissions~~ — **settled**, contracts §2. Brand push is OWNER/ADMIN only; a DESIGNER sees it disabled with the reason.
3. ~~Brand-kit vs site tokens~~ — **settled**, contracts §6.2: overwrite behind a diff preview. Merge was rejected — it needs a per-token conflict rule the user must learn, and a half-and-half brand is not a brand.
4. ~~Cross-site search scope~~ — **decided**: sites **and** pages. Not content or media. An agency looks for *"the Trattoria menu page"*, not for a paragraph; searching content across 20 sites returns noise nobody asked for. Results group by site, 44h rows, `site › page`.
5. ~~Archive~~ — **decided**: archiving is a **filter in the Sites view**, not a separate destination. The status filter row gains an `Archived` pill; archived sites are hidden by default and restore from the same `⋯`. A separate archive page would be a nav item most agencies open twice a year.
