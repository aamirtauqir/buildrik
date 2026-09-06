# AI Placement Map

One AI interaction system for the Buildrick editor: what exists, where AI belongs,
where it must not go, and the single contract every AI affordance obeys.

Written 2026-09-06 as the deliverable of UX-audit lane G (findings:
`docs/design-jobs/findings/UX-G.jsonl`). Everything in Part 1 was read in the
tree at HEAD plus the founder's uncommitted CMS/media changes. Everything in
Parts 2–6 is a proposal; anything the product cannot do today is marked
**not built**.

---

## 1. Inventory — what is actually there

### 1.1 Real, wired, and reaching production

| Capability | Surface | Provider path | Flag | Ships? |
|---|---|---|---|---|
| **Element / page edit by description** | AI panel (`editor/sidebar/tabs/ai/AITab.tsx`) | `ai.streamPrompt` → `resolveModelForUser` → OpenAI or Ollama (`server/trpc/routers/ai.ts:277`) | none | **Yes, to every user** |
| **In-canvas element edit** | Selection toolbar → `AiPromptPopover.tsx` | same subscription, `intent: "style-command"` | none | **Yes** |
| **Multi-step agent run** | AI panel → DRAFT row → `useAgentRunner.ts` | `intent: "plan"` then one style-command per step | none | **Yes** |
| **Privileged action gate (publish)** | `useAiActionGate.ts` → `actions.propose` / `actions.confirm` | `server/services/ai-actions.service.ts` | none | **Yes** |
| **AI site generation (draft a whole site)** | Dashboard `/onboarding/ai/{goal,basics,brand,generating,preview}` | `templates.generate.create` → `ai-generate` worker → OpenAI | none | **Yes**, dies cleanly without `OPENAI_API_KEY` |
| **AI site generation, second wizard** | Dashboard `/dashboard/sites/new?method=ai` | same mutation, a poorer brief | none | **Yes** |
| **Alt text from the image (vision)** | Full library → `AssetDetailsPanel.tsx` → `media.generateAltText` | `server/services/alt-text.service.ts:69` | none | **Yes** |
| **Alt text from the file name (text only)** | Sidebar Media → `AssetDetailOverlay.tsx:270` | `ai.content` via `shared/utils/openai.ts` | none | **Yes** |
| **SEO title** | Pages → page settings → SEO → "Write with AI" | `ai.content` | none | **Yes** |
| **AI adoption telemetry** | `services/ai/adoptionTracker.ts` → `ai.logAdoption` | — | none | **Yes** |
| **AI credits / prompt meter** | Dashboard `/dashboard/settings/ai` | `account.aiCredits` | none | **Yes** |

The panel's edit contract is the good part of this system and the thing the rest
should be rebuilt around: **propose a diff, never write directly; the user reads
the rows; Apply lands as one undo step; Discard writes nothing.** It handles
not-configured, out-of-credit and provider-failure as three distinct authored
states, bounds the SSE reconnect loop, refunds quota when nothing is delivered,
and re-validates every command client-side before applying it.

### 1.2 Built, but switched off or dead-ended

| Thing | Status |
|---|---|
| **Generate a component with AI** (Brand → Components → "✨ Generate with AI") | Button ships to every user; the client behind it is built only when `isFeatureEnabled("dsAi")` (`useComposerInit.ts:132`), and `NEXT_PUBLIC_FEATURE_DS_AI` / `VITE_FEATURE_DS_AI` is set in **no** env file in the repo. Pressing Generate prints the developer string `no AIClient configured (stub the service in tests; wire a real provider in production)`. Even on success there is no Accept — `DesignSystemTab.tsx:887` deliberately omits `onAccept` because the schema has nowhere to go. |
| **Version-diff AI summary** | `useAISummary.ts:109` posts a bare JSON body to `/api/trpc/ai.summarize`; the router runs the superjson transformer (`server/trpc/trpc.ts:57`). The input almost certainly deserialises to `undefined` and fails Zod before the handler. Surfaces as "AI summary unavailable". |
| **AI milestone-name suggestion** | `useAutoMilestone.ts:180`, same defect, and its catch is silent — the banner simply never appears. Its test stubs `fetch`, so the suite is green over it. |
| **AI rail tab** | Registered in `tabsConfig.ts:87` with shortcut `I`, and asserted by a test — but `RAIL_FIGMA` (`:349`) omits it, so no rail button renders. The shortcut and the ⌘K nav command still open a *left-drawer* copy of the panel. |
| **Topbar "Ask AI"** | `StudioHeader.tsx:832` passes it only when `viewMode.fourToolRail`, which is false in the shipping rail mode. Legacy-only. |

### 1.3 Claimed but absent

| Claim | Reality |
|---|---|
| Dashboard AI settings: "More AI tools — coming soon: **Content Generation, Design Suggestions, Page Creation, SEO Optimization**" (`ai-credits-tab.tsx:27`) | Three of the four ship in the editor today, on the same page that meters the prompts they spend. |
| "No API key is set for **this workspace**" (`AITab.tsx:263`) + "Open workspace settings" | No settings screen in the product accepts an AI key. It is a server env var. The button opens a 16-card index where nothing can act on the message. |
| `ai.page`, `ai.layout` procedures | Reachable only through `generateLayout` in `shared/utils/openai.ts:117`, which is not exported and has zero callers. **Not built** as a user surface. |
| Image generation (`ImageRequest`, `ImageStyle` types) | No `ai.image` procedure exists. Type vocabulary only. **Not built.** |
| `AIPromptLibrary`'s 16 content types × 12 tones × 8 layout styles | The two live callers hardcode `("headline", "professional")`. No tone or type control is exposed anywhere. |
| Model choice | Deliberately removed (`AITab.tsx:40`) — the server owns it. Correct, and should stay removed. |
| `ai.getQuotaStatus` | Zero editor callers. The editor learns the quota only at refusal. |

### 1.4 Count of AI entry points, by glyph

Fourteen doors, five marks, three verbs. This is the core problem.

| Glyph | Where |
|---|---|
| lucide `Sparkles` | canvas selection toolbar ("Edit with AI"), full-library alt text, the un-rendered rail tab |
| `✨` emoji | Brand → Components, sidebar Media alt text, ⌘K no-results offer, legacy topbar |
| `✦` character | inspector header chip, inspector empty state, multi-select toolbar, AI panel DRAFT row |
| play-triangle SVG | Pages → SEO → "Write with AI" |
| clock SVG | History → "Get AI Summary", milestone suggestion banner (no AI mark at all) |

---

## 2. The placement rule

One test decides whether a surface gets an AI affordance. All four clauses must
hold.

> **A surface earns an AI affordance when (1) the task is repetitive typing or a
> first draft, not a decision; (2) the result can be shown as a reversible diff
> before it lands; (3) the surface can name the exact scope AI will touch; and
> (4) doing it by hand on that surface is measurably slower than reading and
> approving AI's answer.**

Clause 2 is the one that disqualifies most bad placements: if the change cannot
be previewed and undone as one unit, AI does not go there. Clause 3 disqualifies
the rest: if the user cannot be told *what* is about to change, they cannot
consent to it.

### Applied — where AI SHOULD appear

| Surface | Affordance | Why it passes | Status |
|---|---|---|---|
| **Canvas — selected element** | Inline: prompt popover on the selection toolbar | Repetitive restyling; diff is exact; scope is one element | ships |
| **Canvas — page scope** | Panel: conversation + agent run | First-draft work; per-step diff; scope named in the band | ships |
| **Inspector — a chosen property** | Inline, per section: "Ask AI for this" on Typography, Colour, Spacing | The diff is a single property; scope is unambiguous | **not built** |
| **Content / CMS — records and fields** | Primary: "Draft with AI" on a record; bulk: "Fill this column for 12 records" | The single most repetitive typing in the product; each field is its own diff row | **not built** — highest-value gap |
| **Content / CMS — collection schema** | Secondary: "Suggest fields" when creating a collection | First draft of a structure the user then edits; nothing is written until accepted | **not built** |
| **Insert / Layouts** | Primary: "Describe a section" in the Insert panel | `add-section` and `insert-component` commands already exist server-side; the insert is one undo step | **not built** — the commands ship, the door does not |
| **Media — alt text** | Inline: Generate / Regenerate with provenance | Repetitive, legally load-bearing, per-asset scope | ships (twice, badly — unify on the vision path) |
| **Pages — SEO title & description** | Inline: Generate | One field, one diff | ships (title only, silent on failure) |
| **Brand — component generation** | Primary: modal | Passes the rule, but only once Accept has a destination | built, dead-ended |
| **Dashboard — site draft** | Primary: the onboarding brief | The canonical first-draft job | ships |

### Where AI must NOT appear, and why

| Surface | Why not |
|---|---|
| **Publish** | A publish is a decision with an external, irreversible consequence. AI may *propose* it — the existing `propose → confirm token → domain path` gate is exactly right — but there must never be a "Publish with AI" button. Fails clause 2: a deploy is not a reversible diff. |
| **Version history — summarising a diff** | Fails clause 4. The diff is already rendered, structured and readable; an AI paraphrase of a list the user can read adds a wait, a cost, and a chance of being wrong about their own work. Retire it rather than repair it. |
| **Milestone / version naming** | Fails clause 1 — naming a checkpoint is a memory aid the user writes in three words. Spending a model call and a banner on it is AI applied to a non-problem. Retire it. |
| **Settings, Domains, Redirects, Headers, Webhooks, Analytics** | Fails clause 2 and 4. These are configuration with correctness requirements and external side effects; a wrong DNS record or redirect is not undone by ⌘Z. |
| **Forms — submission data** | Customer data. AI must not read, summarise or rewrite it inside the editor. |
| **Deleting things** | `delete-element` stays in the vocabulary because a user can ask for it explicitly and see it in the diff, but there must be **no AI affordance whose purpose is deletion** — no "clean this up with AI", no "remove unused". Destructive-by-default AI is the one shape this product should refuse. |
| **Layers tree** | Fails clause 3. A structural rename or re-parent across a tree cannot be scoped in a sentence the user can check before it runs. |
| **Client review / sign-off** | The value of a client's approval is that a human gave it. No AI in that path, ever. |
| **Anywhere with no diff** | Restated as a rule because it is the one people break: if a surface cannot render "from → to" and take it back, it does not get AI, no matter how repetitive the task is. |

---

## 3. One button hierarchy

Three tiers. A surface uses exactly one. The tier is decided by *how much the AI
is allowed to change*, not by how important the feature feels.

### Tier 1 — Primary (filled accent button)

**Meaning: "AI will produce something new that does not exist yet."**

- Used for: draft a site, draft a section, draft a record, generate a component.
- Always opens a **brief** first (what do you want, in the user's words) and then
  a **review** (what came back) — never a one-click generate.
- One primary AI action per screen. If a screen wants two, it wants a panel.
- Copy: `Draft …` / `Generate …`. Never "Ask AI" — a primary action is not a
  question.
- Today: the onboarding path card, the Brand component modal. **Not built** for
  Insert or CMS records.

### Tier 2 — Secondary (bordered / ghost button carrying the AI mark)

**Meaning: "AI will change what is already here, and you will see the diff."**

- Used for: the AI panel entry, the canvas "Edit with AI", inspector-section help.
- Opens a conversation or a scoped prompt; the result is always a diff card with
  Discard / Apply.
- Copy: `Ask AI`. One phrase, everywhere, for this tier only.
- Today: three chips (`✦ AI`, `✦ Ask AI ›`, `✦ AI`) and one icon button
  ("Edit with AI") that all belong here and none of which look alike.

### Tier 3 — Inline (text-weight control inside the field's own row)

**Meaning: "AI will fill this one field. Nothing else can change."**

- Used for: alt text, SEO title, SEO description, a CMS text field.
- Sits under or beside the input it fills, never in a header.
- Fills the field as an editable draft the user can immediately overwrite; the
  field is never committed until the user's normal commit (blur / Enter).
- Carries provenance once filled: a small "AI" tag that clears the moment the
  user edits the value.
- Copy: `Generate` when empty, `Regenerate` when it has already produced one.
  Never "Write with AI", never "✨ Generate", never a bare sparkle.
- Today: four of these exist with four different labels and two of them fail in
  total silence.

### The mark

**One glyph across all three tiers: the lucide `Sparkles` icon**, at the tier's
own size. It is already the rail's registered icon, already the canvas toolbar's
icon, and already the full-library alt-text icon — it is the plurality. Retire
`✨`, `✦`, the play triangle and the clock from every AI context. An emoji is
not a design-system icon and does not respond to state, size or theme.

### The words

| Tier | Verb | Never |
|---|---|---|
| Primary | `Draft` / `Generate <noun>` | "Ask AI", "AI Magic", "Let AI…" |
| Secondary | `Ask AI` | "Edit with AI", "AI assistant", "Chat" |
| Inline | `Generate` / `Regenerate` | "Write with AI", "✨ Generate", "Suggest" |

---

## 4. Generating state, and the apply contract

### 4.1 One generating state per tier

| Tier | While generating | Stop | Where the wait is shown |
|---|---|---|---|
| Primary | Named progress steps + a cancel | **Required** | In the modal / wizard, in place |
| Secondary | "Thinking…" band + a Stop control | **Required** | Where the answer will appear |
| Inline | Label → `Generating…`, control disabled, field stays readable and keeps its current value | Optional; required if it can exceed ~3s | On the control itself |

Non-negotiable at every tier: **the user's existing content stays on screen and
stays valid throughout.** An inline generate never blanks the field it is about
to fill. A secondary run never replaces the conversation. Today the AI panel's
blocked states replace the entire thread, discarding the prompt the user just
typed — that is the pattern to remove.

The Stop control is not optional decoration. `useStreamPrompt` already exports
`stop()`, and the panel uses it; the canvas popover does not, which is why its
"Thinking…" has no exit.

### 4.2 The apply / cancel / retry / revert contract

Every AI result, at every tier, moves through the same five states.

```
        ┌──────────┐   user types a brief
        │  IDLE    │──────────────────────────┐
        └──────────┘                          ▼
             ▲                        ┌──────────────┐
             │  Discard / Escape      │  GENERATING  │──── Stop ──┐
             │                        └──────────────┘            │
             │                               │ result             │
             │                               ▼                    │
             │                        ┌──────────────┐            │
             └────────────────────────│   PROPOSED   │            │
                                      │  (the diff)  │            │
                                      └──────────────┘            │
                                       │           │              │
                                   Apply       Regenerate         │
                                       ▼           └──────────────┘
                                ┌──────────────┐
                                │   APPLIED    │──── Undo ──▶ IDLE
                                └──────────────┘   (stays offered
                                                    until the next edit)
              any state ──── failure ──▶ ┌──────────┐
                                         │  FAILED  │── Try again ─▶ GENERATING
                                         └──────────┘   (with the same brief)
```

**Rules that follow from it:**

1. **Nothing lands without PROPOSED.** No AI writes to the canvas, a field, or a
   record without first showing what it will change. Inline tier satisfies this
   by writing an *uncommitted draft* into the field the user can see and edit —
   the field's own commit is the Apply.
2. **Apply is one undo step, per apply.** True today for a chat edit and for each
   approved agent step. It must be stated per Apply, never per run — the idle
   screen's current promise sits above the control that starts a multi-step run,
   and is false of it.
3. **Undo is a button, not folk knowledge.** The applied result keeps a visible
   Undo until the next edit displaces it. Today only the agent path has one; the
   chat path — the common one — expects the user to know ⌘Z.
4. **Cancel writes nothing, and says so.** Discard/Stop must leave the canvas
   provably untouched, and the copy says "Nothing was changed" (the panel's
   quota state already gets this right; copy it everywhere).
5. **Retry re-uses the brief.** Never return the user to an empty prompt after a
   failure. The panel's `lastPromptRef` pattern is the reference implementation;
   the canvas popover and both inline buttons have no retry at all.
6. **Failures are typed, not raw.** Exactly four user-facing failure shapes, and
   no exception message ever reaches the screen:
   - *not available* — "AI isn't available on this workspace." Exit: a route that
     can actually change that, or nothing. Never a settings page that cannot.
   - *out of credit* — the server's own limit + reset sentence, plus "Nothing was
     changed", plus See plans **and** "continue by hand".
   - *didn't respond* — "This is usually the model provider, not your site."
     Exit: Try again with the same brief.
   - *nothing to apply* — the model answered with something this editor cannot
     map. Say that; never report success over an unchanged page. (`applyAiEdit`
     already returns the applied count and the panel already reads it — this one
     is solved and should be the template.)
7. **Provenance survives the apply.** Anything AI wrote is marked as such until
   the user edits it, and the edit clears the mark. Alt text has this on one of
   its two surfaces; nothing else does.
8. **AI edits are findable later.** The transaction is already labelled
   `ai-edit`. Carry that label into the visible history so a user can find and
   reverse an AI change an hour later, not only in the next ten seconds.
9. **Quota is visible before the wall.** A quiet remaining-count beside the send
   control, amber near zero. `ai.getQuotaStatus` exists and has no callers.
10. **Privileged actions always stop for an explicit dialog**, including inside an
    auto-applied agent run. This holds today and must be stated on the auto-apply
    toggle, which currently describes the mechanic and not the stakes.

---

## 5. What to change first

In dependency order, cheapest-first within each tier.

1. **Fix the lie.** The not-configured state must stop instructing users to do
   something impossible (UX-G-01). One copy change and one destination change.
2. **One home for the panel.** Route every door through the inspector column,
   delete the left-drawer case, lift the thread out of component state
   (UX-G-02). Until this lands, every other panel fix has to be made twice.
3. **Take down what does not work.** Hide the Brand AI CTA behind the same flag
   as its client, or ship the Accept destination (UX-G-07/08). Retire the
   version-summary and milestone-name features rather than repairing their
   transport (UX-G-09, and see §2 — they fail the placement rule anyway).
4. **One failure treatment for the inline tier** (UX-G-05), and **one alt-text
   generator**, the vision one (UX-G-06).
5. **One mark, one verb set** across all fourteen doors (UX-G-10), and the
   missing controls the contract requires: Stop and retry on the canvas popover
   (UX-G-11), Undo on an applied chat edit (UX-G-13), the quota meter (UX-G-04).
6. **Then extend.** CMS records and fields first, Insert's describe-a-section
   second — both built on commands the server already has (UX-G-21).

Nothing in steps 1–5 is a new capability. It is the same AI the product already
ships, told the same way every time.
