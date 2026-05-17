# Token-Design Decisions — Foundation Spec

**Date:** 2026-05-16
**Subject:** DS token layer decisions that gate everything above (presets, components, AI generation, migration, collab).
**Status:** 7 decisions LOCKED (user confirmed 2026-05-16) + 2 implementation decisions from eng-review (A3 + C1 + C2 locked 2026-05-16). 8 already-shipped context items.

**Eng-review verdict 2026-05-16:** TOKEN SPEC ALIGNED WITH ENGINE — ready for Phase A. Engine carries significant pre-existing infra (`aliasOf?` field, `darkValue?` field, AliasResolver at depth-1 with planned upgrade path, DSLinter `missing-dark` rule, CURRENT_SCHEMA_VERSION + migration runner, TokenUsageTracker with per-element breakdown). Real new code = B1 rename + B4 delete picker + B2 depth-1→3 upgrade + B5 semantic enforcement. B3, B6, B7 essentially shipped.
**Why this doc exists:** the prototype + gap-report v2 specify presets, components, AI, lint, collab, persistence — but assume the token layer is already designed. It is not. Tier 2 user-built components bind to tokens; if token-design choices crack, Tier 2 collapses. Locking these decisions BEFORE Phase A engineering = cheap. After 10K users have Tier 2 components = expensive.

**References (SSOT):**
- `DESIGN.md` (repo root) — visual tokens, cobalt accent, font stack, motion policy
- `packages/editor/CLAUDE.md` — vibcoder primitives, `--bd-*` aliases, chip vocab
- `docs/superpowers/specs/2026-05-16-ds-prototype-gap-report.md` (v2) — 22 gap categories, locked product decisions
- Prototype: `~/.gstack/projects/aamirtauqir-buildrik/designs/ds-components-prototype-20260507/index.html` (S00, S02, S07, S15)

---

## Section A — Already-locked context

These decisions are visible in the prototype + supporting code. Document them so reader sees what is settled vs what needs decisions in Section B.

### A1. 14 token kinds (S02 line 313)

```
color · 12 · typography · 8 · spacing · 6 · radius · 5 · shadow · 4 · motion · 3
+ 8 more: border, opacity, z, breakpoint, grid, sizing, icon, imagery
```

**Locked:** 14 kinds is the surface. More than most DS products (typically 4-5). Trade-off accepted: broader precision in exchange for steeper learning curve. Mode toggle (Beginner ↔ Pro) mitigates by hiding kinds behind friendly names.

### A2. Hierarchical dot-path IDs

```
color.brand.primary
color.brand.primaryHover
font.size.xl
space.4
```

**Locked:** strict 3-segment path. Reads as `{kind}.{group}.{variant}` or `{kind}.{group}.{variant}.{state}`. Discoverable via autocomplete, organized via groups. Implication: rename = breaking unless mitigated (Decision B1 below).

### A3. CSS-variable runtime (`--ds-color-brand-primary`)

**Locked:** tokens compile to CSS custom properties. Token edit = write new value = browser cascades = all bound elements update in single paint. <100ms fan-out (S01 line 275 promise).

Implication: no token-level conditionals (CSS var is dumb value). Conditional logic moves up to presets / components.

### A4. Usage-count tracking (S02 line 250)

```
used 23×
```

**Locked:** every token tracks every binding from every consumer (elements + presets + Tier 1 instances + Tier 2 instances). Enables blast-radius confirms on delete. Cost: storage + sync overhead at write time.

### A5. Alias graph (S02 line 325)

```
action.default → brand.primary
```

**Locked:** tokens can reference other tokens. Pro-mode-only visible. Powers semantic-vs-primitive separation (Decision B5 below).

### A6. Light + dark value pair per color token (S02 line 384)

```
Light value: #2D6DFF
Dark value: + add (currently falls back)
```

**Locked:** every color token CAN have dark variant. Missing dark = fallback path needed (Decision B3 below).

### A7. Per-token lint contracts (S02 line 347)

```
contrast 2.8:1 vs surface (need ≥4.5)
```

**Locked:** tokens self-validate. Color tokens check WCAG; spacing checks delta-closeness; alias cycles blocked. Lint surface = S09 (3 places: token row + Inspector chip + Design tab banner).

### A8. 4 export formats (S05)

```
Tokens Studio JSON · Tailwind config · Figma Variables JSON · CSS bundle
```

**Locked:** portable to ecosystem. Tailwind round-trip is lossy (23 tokens drop, dark variants disabled — S05 line 545 warns). Tokens Studio JSON is lossless.

---

## Section B — Open decisions (recommend + lock)

### B1. Token-ID rename strategy

**Question:** what happens to existing bindings when user (or migration) renames a token ID?

**Why critical:** Tier 2 user-built components store binding strings (e.g., `slots.price.binding = "font.size.xl"`). If `font.size.xl` becomes `font.size.large`, Tier 2 references break silently.

**Options:**

| Option | Description | Cost | Risk |
|---|---|---|---|
| (1) Auto-alias bridge | Rename creates hidden alias: old ID resolves to new for N versions. Lint warns on old usage. Migration tool sweeps remaining old-name bindings after deprecation window. | small (alias entry per rename) | low (transparent to user) |
| (2) Atomic rebind | Rename = simultaneously update all in-project bindings. External exports / Tier 2 components built elsewhere break. | medium (must scan all consumers) | high (external code breaks) |
| (3) Blocked when consumed | Rename disabled if `usageCount > 0`. User must clear bindings first. | none (just a gate) | medium (rename becomes impossible in practice — every token has consumers) |

**Recommendation: Option 1 — auto-alias bridge.**

**Rationale:** rename is a common refactor. Blocking it (Option 3) chokes hygiene work. Atomic rebind (Option 2) protects in-project but breaks external Tier 2 + exports. Auto-alias bridge is transparent, lets migration runner clean up over 2-3 catalog versions, and supports the "Tier 2 owned by user, Tier 1 owned by Buildrik" boundary from the gap report.

**Locked default:**
- Rename writes a new token at the new ID + creates alias `oldID → newID`.
- Alias persists for **2 catalog versions** (e.g., v3 + v4 still resolve; removed at v5).
- Each catalog upgrade migration sweeps and replaces old-ID usage in DS-owned bindings; Tier 2 user bindings get a lint warning ("old token name — update?") but continue to resolve.
- Telemetry event: `ds.token.rename` with `{oldId, newId, consumerCount}`.

**Impact matrix:**

| Layer | Effect |
|---|---|
| Tier 1 catalog | Buildrik renames during catalog evolution. Alias bridge invisible. |
| Tier 2 components | User-built components keep working. Lint surfaces stale references. |
| AI generation (S08) | AI uses current catalog IDs only. Old IDs never generated. |
| Migration (S13) | Per-version step sweeps DS-owned bindings; surfaces user-binding count for manual review. |
| Export (S05) | Exports use canonical (new) ID; aliases NOT exported (would pollute consumer's tokens). |
| Collab (S21) | Rename = single write event; fan-out via WebSocket per S21 contract. |

**Verification:** integration test — create token `color.foo`, bind it from a Tier 2 component, rename to `color.bar`, assert component still resolves to bar's value and lint chip says "stale name — auto-resolved via alias."

---

### B2. Max alias depth

**Question:** can an alias point to another alias? If so, how deep can the chain go?

**Why critical:** semantic tokens often layer (`button.bg → action.default → brand.primary`). Unbounded depth = potential cycles + perf cost on resolve.

**Options:**

| Option | Description | Cost | Risk |
|---|---|---|---|
| (1) Depth 1 only | Alias must point to a primitive (non-alias) token. | none | constrains DS architecture (can't layer semantics) |
| (2) Depth 3 (recommended) | Up to 3 hops allowed. Covers semantic-of-semantic case (`button.bg → action.default → brand.primary`). | tiny resolve cost | low |
| (3) Unlimited | Any depth, cycle detection only. | larger resolve cost (memoize) | medium (cycle bugs more likely) |

**Recommendation: Option 2 — depth 3.**

**Rationale:** common DS architectures need 2-3 layers (primitive → semantic → component-scoped). Depth 3 covers all realistic cases without the cycle/perf risk of unlimited. Cycle detection still required (already shipped per S09 gap-report — "1 alias cycle blocked save earlier").

**Locked default:**
- Alias chain max length = **3** (e.g., `A → B → C → D` rejected at save with error: "alias chain too deep").
- Cycle detection runs on every alias write (already in S09).
- Resolve = memoize per-render-cycle (compute once per CSS regeneration, reuse).

**Impact matrix:**

| Layer | Effect |
|---|---|
| Tier 1 catalog | Buildrik catalogs typically depth 1-2. Headroom for evolution. |
| Tier 2 components | Users rarely build deep aliases. Limit invisible in practice. |
| AI generation | AI prompted to use primitives or 1-level aliases only. Schema validator rejects deeper. |
| Lint | New rule: `alias-depth-exceeded` (P1). Auto-suggest flattening. |

**Verification:** unit test — `A → B → C → D` save should fail with specific error code `ALIAS_DEPTH_EXCEEDED`.

---

### B3. Missing-dark fallback

**Question:** color token has no dark value set (S15 amber chip). When user toggles dark mode, what color renders?

**Why critical:** half-finished palette in dark mode = brand inconsistency = trust hit.

**Options:**

| Option | Description | Cost | Risk |
|---|---|---|---|
| (1) Light value | Render the light value as-is in dark mode. Loud amber chip warns. | none | UX is honest — user sees the gap |
| (2) Computed dark | Auto-darken the light value via algorithm (e.g., HSL lightness flip). | medium (algorithm + edge cases) | medium (might produce ugly auto-dark colors) |
| (3) Black sentinel | Render a fallback sentinel color (e.g., `#FF00FF` magenta) signaling "needs dark value." | none | breaks pages catastrophically |

**Recommendation: Option 1 — light value + loud chip.**

**Rationale:** the prototype already shows this pattern (S15 line 1260). Computed dark (Option 2) feels magical but produces inconsistent results across hue groups (greens, blues, reds darken differently). Sentinel (Option 3) catastrophic in production. Honest fallback + visible warning = user makes conscious decision to fix.

**Locked default:**
- Missing dark value → render light value.
- Chip on token row: `chip-amber ⚠ no dark · falls back`.
- Aggregate count in S15 dark toggle header: `3 tokens missing dark variant`.
- Lint registry entry (P2): unresolved by default; user can dismiss per-token.
- Telemetry event: `ds.token.dark.missing` fired on first dark-mode entry per session (sampled 1x).

**Impact matrix:**

| Layer | Effect |
|---|---|
| Tier 1 catalog | Buildrik MUST ship dark values for all default tokens. Catalog ship contract. |
| Tier 2 components | If user adds custom color token and skips dark, falls back. Their problem to fix. |
| AI generation | AI generates token-binding schema, not raw colors. Tier 1 token's dark inherited. |
| Migration | dark-value column added to color tokens in v8 migration (per S13 sequence). |

**Verification:** visual test — create color token with only light value, toggle dark, screenshot. Compare to light mode screenshot — should be identical (no auto-darkening). Amber chip present.

---

### B4. Delete-with-consumers behavior

**Question:** user clicks Delete on a token that has 23 elements + 4 presets + 12 instances bound to it. What happens?

**Why critical:** wrong behavior = silent data loss OR impossible cleanup. Token deletion is the highest-blast-radius DS action.

**Options:**

| Option | Description | Cost | Risk |
|---|---|---|---|
| (1) Cascade-clear | Delete token + clear all bindings. Bound elements fall back to browser default. | low | very high — silent style loss across project |
| (2) Replace-with only | Delete blocked until user picks a replacement token. All consumers rebind atomically. | medium (replacement picker UI) | low |
| (3) Allow both with explicit user choice | Modal asks "replace-with or cascade-clear" — user chooses. | high | medium |

**Recommendation: Option 2 — replace-with only.**

**Rationale:** S02 v1 annotation already implies this ("Pro mode shows replace-with / cascade-clear options when 23 elements bind") but explicit lock as **replace-with only** removes the foot-gun. Cascade-clear sounds appealing for refactoring but in practice = user accidentally deletes hero color token, all heroes go invisible, panic ensues. Replace-with forces deliberate choice.

**Locked default:**
- Delete with consumers > 0 → modal: "23 elements + 4 presets + 12 instances use this token. Replace with → [picker]."
- Picker shows compatible tokens (same kind). Same-color tokens preferred via similarity score.
- Atomic rebind on confirm: all consumers point to new token. Old token deleted. Undoable via Cmd+Z.
- Delete with consumers = 0 → confirm only (no picker), single click.
- Beginner mode: delete always blocked. Toast: "Switch to Pro mode to manage tokens."
- Telemetry: `ds.token.delete` with `{tokenId, consumerCount, replacedWith}`.

**Impact matrix:**

| Layer | Effect |
|---|---|
| Tier 1 catalog | Buildrik tokens deletable only at catalog version bump (migration handles). |
| Tier 2 components | User deletes token → user's Tier 2 components rebind automatically. |
| AI generation | AI uses current token list at prompt time. Deleted IDs never re-suggested. |
| Migration | Old token IDs survive as aliases (per B1) → migration cleanup separate. |
| Collab | Atomic rebind = single write event; fan-out per S21. |

**Verification:** integration test — create token with 5 consumers, attempt delete, assert modal blocks and shows picker. Pick replacement, assert all 5 consumers rebind in single transaction.

---

### B5. Primitive vs semantic token split

**Question:** prototype mixes `color.brand.primary` (primitive) and `action.default` (semantic alias). Are these the same kind or two distinct kinds?

**Why critical:** Beginner mode (S10) shows friendly names only. If primitives + semantics are mixed in one list, Beginner sees `Primary blue` AND `Action color` AND `Button background` — too many overlapping concepts.

**Options:**

| Option | Description | Cost | Risk |
|---|---|---|---|
| (1) Implicit (current) | All tokens flat. Aliases marked with `→` chip. User mentally separates. | none | high — Beginner overwhelmed; semantic intent unclear |
| (2) Explicit kinds | `color.brand.*` = primitive kind. `action.*`, `surface.*`, `text.*` = semantic kinds with required `aliasOf:` field. | medium (schema change + UI tier) | low |
| (3) Two-tab UI | Same flat tokens but UI tab: "Primitives" vs "Semantics". | small | small (just UI) |

**Recommendation: Option 2 — explicit kinds with `aliasOf:` schema field.**

**Rationale:** semantic tokens have a different USE PURPOSE than primitives. `color.brand.primary` is "the color we bought from the brand designer." `action.default` is "what color buttons use for default state." Same hex today, but semantics evolve independently (button might switch to a darker shade tomorrow). Treating them as distinct kinds:
- Beginner mode shows only semantics (`Action color`, `Card background`). Primitives hidden as "raw inputs."
- Pro mode shows both.
- AI generation binds to semantics by default (more stable across catalog upgrades).
- Refactoring becomes cleaner: change `action.default` from `brand.primary` to `brand.secondary` = one edit, all buttons restyle.

**Locked default:**
- Two token-kind families: **Primitives** (`color.*`, `font.*`, `space.*`, `radius.*`, `shadow.*`, `motion.*`, `border.*`, etc.) and **Semantics** (`action.*`, `surface.*`, `text.*`, `feedback.*`).
- Semantic token MUST have `aliasOf:` pointing to a primitive OR another semantic (subject to depth 3 limit per B2).
- Primitive token MUST NOT have `aliasOf:`.
- Beginner mode: list semantics only, with friendly names.
- Pro mode: list both, with kind label + `→` chip on aliases.
- AI generation: prompt instructs to bind to semantics where available, fall back to primitives only for cases without semantic equivalent.

**Impact matrix:**

| Layer | Effect |
|---|---|
| Tier 1 catalog | Buildrik catalog bindings updated to semantics where possible (refactor task). |
| Tier 2 components | User builds new components — AI/manual binds to semantics by default. Old Tier 2 (raw primitive bindings) keeps working. |
| Mode toggle (S10) | Beginner = semantics tab. Pro = both tabs. Big change from current single list. |
| Migration | v14 migration adds `aliasOf:` field, classifies existing aliases as semantic. |

**Verification:** schema validation — semantic token without `aliasOf:` → save rejected with error `SEMANTIC_REQUIRES_ALIAS`. Primitive with `aliasOf:` → rejected with `PRIMITIVE_FORBIDS_ALIAS`.

---

### B6. Custom token kinds

**Question:** can user add a new token kind (e.g., "elevation" for a design needing more granular than `shadow`)?

**Why critical:** locked vocabulary = users frustrated when DS needs custom concept. Open vocabulary = lint rules / export formats / AI prompts all need to handle unknown kinds.

**Options:**

| Option | Description | Cost | Risk |
|---|---|---|---|
| (1) Buildrik-only (locked) | 14 kinds fixed. User cannot add. | none | medium — niche use cases unsupported |
| (2) User-defined kinds (open) | User declares new kind via UI. Buildrik adds default lint stub. | high (every consumer must handle unknown kinds) | high (lint/export drift) |
| (3) Custom sub-namespace under existing kind | User adds `color.custom.X` within `color` kind. Type rules inherit. | small | low |

**Recommendation: Option 1 — Buildrik-only.**

**Rationale:** kinds are a strong contract. Lint rules per-kind, export formats per-kind, AI prompts per-kind. Opening this = every layer reasons about unknown kinds = exponential complexity. Option 3 (custom sub-namespace) already supported implicitly (user can name tokens `color.custom.foo` today — just lives in `color` kind).

If user genuinely needs a kind that doesn't exist: file a feature request, Buildrik evaluates, adds in next catalog version. Slow but safe.

**Locked default:**
- Token kinds = fixed Buildrik IP. 14 kinds shipped, more added via catalog version bump.
- User CAN name tokens within existing kinds freely (no namespace restriction within a kind).
- Feature request flow: in-app `?` shortcut → "Suggest a kind" form → Buildrik triage.

**Impact matrix:**

| Layer | Effect |
|---|---|
| Lint | Per-kind rules locked. No unknown-kind branch. |
| Export | All 4 formats know all 14 kinds. No translation gaps. |
| AI generation | AI's allowed kinds list = enum. Hallucination on kind = Zod reject. |
| Tier 2 components | User binds to existing-kind tokens only. |
| Migration | Schema fixed at kind level. Catalog version bump can add kinds (additive only). |

**Verification:** schema validation — token with `kind: "elevation"` (not in enum) → rejected with `UNKNOWN_KIND`.

---

### B7. Token versioning model

**Question:** when token shape changes (e.g., adding `aliasOf:` field per B5), do individual tokens get versions, or is versioning project-wide only?

**Why critical:** mixed versioning models = migration nightmare. Per-token version = high storage cost + complex resolve. Project-wide = simpler but coarser.

**Options:**

| Option | Description | Cost | Risk |
|---|---|---|---|
| (1) Per-token version | Each token carries `{schemaVersion: N}`. Resolve picks correct interpreter. | high (storage + resolver complexity) | medium (drift across project) |
| (2) Project-wide schema | All tokens in a project share a single `dsSchemaVersion`. Migration runner (S13) bumps entire project. | low | low |

**Recommendation: Option 2 — project-wide schema only.**

**Rationale:** S13 migration runner already implements this model — `dsSchemaVersion` per project, sequential migrations v6 → v13. Per-token versioning adds complexity for zero practical gain — no realistic scenario where some tokens in same project need different schemas.

**Locked default:**
- Project carries single `dsSchemaVersion` field.
- Migration runner (S13) bumps version atomically (snapshot + ordered migrations + rollback per existing spec).
- Tokens within a project share schema. No per-token version field.
- Tier 2 components also share project's `dsSchemaVersion`.

**Impact matrix:**

| Layer | Effect |
|---|---|
| Tier 1 catalog | Catalog ships at a specific dsSchemaVersion. Project must be at >= that version to install. |
| Tier 2 components | Inherit project schema. Migration applies to user-bindings same as DS-bindings. |
| Migration (S13) | Already implemented per project — no change. |
| Export (S05) | Exported file carries `dsSchemaVersion`. Import to project at older version → block with "Upgrade project schema first." |
| Collab (S21) | All collaborators on a project at same dsSchemaVersion (one user runs migration → all see new schema). |

**Verification:** integration test — create project at v6, attempt to install catalog requiring v10 → block with "Run migration first." Run migration → install succeeds.

---

## Section C — Cross-decision dependencies

| Decision | Depends on / informed by |
|---|---|
| B1 (rename) | requires B2 (depth) — alias bridge counts toward depth limit |
| B5 (primitive/semantic) | requires B2 (depth) — semantic-of-semantic uses depth |
| B5 (primitive/semantic) | informs B6 (custom kinds) — semantic kinds are Buildrik-defined |
| B4 (delete) | requires B5 (split) — replacing primitives differs from replacing semantics |
| B7 (versioning) | gates B5 rollout — v14 migration adds `aliasOf:` field |

**Order of implementation:** B7 first (already shipped) → B6 (already shipped via lock) → B2 (depth limit) → B5 (split) → B1 (rename via alias) → B4 (delete with replace) → B3 (dark fallback already shipped, formalize lint rule).

---

## Section D — Out-of-scope

| Concern | Status | Revisit when |
|---|---|---|
| Per-token version metadata | DECLINED (Decision B7) | reconsider if mixed-schema use case appears |
| User-defined token kinds | DECLINED (Decision B6) | quarterly re-evaluation based on feature-request volume |
| Computed dark mode (auto-darken) | DECLINED (Decision B3) | possibly v2 if user research shows manual dark setup is too tedious |
| Token-level conditional logic | OUT (CSS var limitation, A3) | not applicable — conditionals belong at preset/component layer |
| Cross-project token sharing | OUT (project-isolated tokens) | marketplace phase per gap report Tier 2 marketplace plan |
| Token A/B testing | OUT | analytics product, not DS product |

---

## Section E — Validation

Once these decisions ship, validate with:

1. **Synthetic Tier 2 component test:** create user component binding to token, rename token, assert binding still resolves (B1).
2. **Alias chain depth fuzz:** generate random alias chains, assert depth > 3 rejected (B2).
3. **Dark mode visual test:** create color token without dark value, screenshot light + dark — should be identical pixels (B3).
4. **Delete with consumers integration test:** as B4 verification above.
5. **Schema strict validation suite:** every primitive without `aliasOf:` passes, every semantic with `aliasOf:` passes, mismatches rejected (B5).
6. **Unknown kind rejection:** AI generates token with invented kind, Zod rejects (B6).
7. **Migration end-to-end:** project at v6 → run S13 migration → assert dsSchemaVersion = current, all tokens still resolve, lint count unchanged (B7).

---

## Section F — Decisions summary table

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| A1 | Token kinds count | 14 (locked) | shipped |
| A2 | ID format | hierarchical dot-path (locked) | shipped |
| A3 | Runtime | CSS custom properties (locked) | shipped |
| A4 | Usage tracking | per-token consumer count (locked) | shipped |
| A5 | Alias support | yes, with cycle detection (locked) | shipped |
| A6 | Dark variant | light + dark pair per color (locked) | shipped |
| A7 | Per-token lint | contracts per kind (locked) | shipped |
| A8 | Export formats | 4 formats (locked) | shipped |
| B1 | Rename strategy | auto-alias bridge, 2-version window | **LOCKED 2026-05-16** |
| B2 | Alias depth | max 3 | **LOCKED 2026-05-16** |
| B3 | Missing dark | light fallback + loud chip | **LOCKED 2026-05-16** |
| B4 | Delete behavior | replace-with only (Pro mode) | **LOCKED 2026-05-16** |
| B5 | Primitive/semantic split | explicit kinds w/ `aliasOf:` field | **LOCKED 2026-05-16** |
| B6 | Custom kinds | Buildrik-only (locked vocabulary) | **LOCKED 2026-05-16** |
| B7 | Versioning model | project-wide only (already shipped pattern) | **LOCKED 2026-05-16** |

---

## Bottom line

8 token-design decisions already shipped (Section A). 7 LOCKED 2026-05-16 (Section B, user-confirmed). Foundation set. Phase A component implementation can build on top.

**Effort to lock:** ~5 min user review + 7 confirmations (DONE).
**Effort saved vs retrofit later:** weeks of migration + user trust hit + Tier 2 component breakage avoided.

## Decisions in plain language (for non-technical reader)

- **Rename a token** → old name keeps working invisibly for 2 catalog versions. Nothing breaks.
- **Stack aliases** → up to 3 hops (e.g., button color → action color → brand color → actual hex). Deeper = rejected.
- **Forget to set dark value** → shows light value with loud warning chip. Honest UX, no auto-darkening surprises.
- **Delete a token that's in use** → forced to pick a replacement, all bindings rebind atomically. No silent breakage.
- **Two flavors of tokens** → Primitives (raw values) + Semantics (purpose-driven nicknames). Beginner sees semantics only. Pro sees both.
- **Invent a new token kind** → can't. 14 shipped, file feature request for more. Keeps lint/export/AI/catalog promises intact.
- **Schema versions** → one per project, not per token. Migration runner upgrades whole project at once.

## Eng-review findings + amendments (2026-05-16)

### Amendments to Section A (already-shipped)

| Spec item | Actual engine state | Action |
|---|---|---|
| A1 token kinds | `kind?: TokenKind` enum exists in DesignToken type. **A4 audit complete 2026-05-16:** all 14 shipped kinds = primitives (`color, type, spacing, radius, shadow, motion, border, opacity, zindex, breakpoint, grid, sizing, icon, imagery`). Zero semantic kinds shipped. B5 uses Option A — add separate `semanticKind?: 'action'\|'surface'\|'text'\|'feedback'` dimension. | **A4 DONE.** |
| A5 alias support | `aliasOf?` field shipped. AliasResolver at depth-1 only with intentional "future phase" comment. | **Confirmed shipped (depth-1). Upgrade per B2 below.** |
| A6 dark variant | `darkValue?` field shipped with B3-matching fallback (mode==="dark" && darkValue → use; missing → fall back to value + emit `tokens:dark-missing`). | **B3 fully shipped — no new code needed.** |
| A7 lint contracts | DSLinter has `missing-dark` + other rules shipped. | **Confirmed shipped.** Add `alias-depth-exceeded` rule for B2 upgrade. |
| A4 usage tracking | `TokenUsageTracker` shipped with `UsageRef[]` per token (per-element breakdown via `{elementId, styleProp}`). | **Confirmed shipped — feeds B4 picker directly.** |

### Amendments to Section B (locked decisions — implementation detail)

**B1 rename — alias bridge data model (C2 locked 2026-05-16 = A):**
- Bridge entries live as **soft-deleted DesignToken with new `replacedBy: string` field** (NOT separate collection, NOT overloading `aliasOf:`).
- Single registry collection. Migration sweep filters `WHERE replacedBy IS NOT NULL` after 2-version window.
- Resolver path: lookup token → if `replacedBy` present, resolve target → return target's value. O(1) with Map index.
- New schema version (next migration v2+) adds `replacedBy?` field.

**B2 alias depth — Phase scope (A3 locked 2026-05-16 = A):**
- Bundle depth-1 → depth-3 upgrade INTO token-design Phase A (not deferred to Phase B).
- AliasResolver upgrade: allow chain length up to 3 (currently rejects at 2). Cycle detection unchanged.
- New lint rule: `alias-depth-exceeded` P1 in DSLinter.
- Unblocks B5 semantic-of-semantic chains from day 1.

**B4 delete — picker UI placement (C1 locked 2026-05-16 = A):**
- Inline modal from Tokens tab. Click Delete on token row → modal opens with "X consumers — pick replacement" + token picker filtered by same kind.
- Reuses `.modal` + `.modal-foot` primitives from prototype (G07 trigger contract).
- Consumer list pulled from `TokenUsageTracker.getUsageBreakdown(tokenId)` (already shipped).
- Atomic rebind via single transaction → undoable via Cmd+Z (per G04 undo contract).

**B5 semantic enforcement — version corrected:**
- Spec previously said "v14 migration" — was hypothetical. **Real CURRENT_SCHEMA_VERSION = 1**. Next migration = v2.
- `aliasOf?` field already in type — Phase A.2 work populates it for existing primitives that should become semantic.
- TokenKind enum audit (per A4 finding) required before classification.
- Beginner mode filter: TokenRegistry adds `getTokensForMode(mode: 'beginner' | 'pro')` returning semantics-only OR all.

### Test requirements (new from eng-review)

- **T1** Unit test: `alias-depth-exceeded` rule in `DSLinter __tests__/`. Generate chain length 4, assert lint reports P1.
- **T2** Integration test: token with 5 consumers → click Delete → modal shows picker → pick replacement → assert all 5 consumers rebind in single transaction → assert Cmd+Z reverts atomically.
- **T3** Unit test: AliasResolver depth-3 happy path (`A → B → C → primitive`) + depth-4 rejection.
- **T4** Integration test: rename `color.foo` → `color.bar` → assert `replacedBy` field set on old token → assert Tier 2 component binding `color.foo` still resolves via bridge → after 2 migrations, assert sweep removes `replacedBy` tokens.

### Performance notes

- **P1** B1 bridge: add Map index `replacedBy → tokenId` for O(1) resolve. Built at registry load + maintained on rename/delete. Avoids O(N) scan per CSS regen.
- **P2** B2 depth-3 resolver: 3 hashmap lookups + memoize per render. Within existing `aliasResolveChain` budget at `AliasResolver.ts:102`. No action needed.

## Implementation order (revised after eng-review)

Foundation (already shipped — confirm only):
1. **B7** project-wide schema (CURRENT_SCHEMA_VERSION mechanism) ✓
2. **B6** kind enum lock (TokenKind exists, just lock it) ✓
3. **B3** dark fallback (darkValue field + DSLinter missing-dark rule) ✓

Phase A new code (in dependency order):
4. **B2 upgrade** AliasResolver depth-1 → depth-3 + add `alias-depth-exceeded` lint rule (small, unblocks B5)
5. **A4 audit** read TokenKind enum, classify each as primitive or semantic
6. **B5** semantic enforcement: add `aliasOf:` required check for semantic kinds + Beginner mode token filter + v2 schema migration
7. **B1** rename: add `replacedBy?` field + rename UI in Tokens tab + alias bridge resolver + Map index + 2-version sweep migration
8. **B4** delete: implement `deleteToken` (currently noop) + replacement picker modal + atomic rebind transaction

## NOT in scope (deferred from eng-review)

- Per-token telemetry on rename frequency (could inform future bridge cleanup tuning).
- Cross-project token bridge (marketplace path — not relevant until marketplace ships).
- AI-assisted token grouping (suggesting semantic groupings) — manual classification for Phase A.

## What already exists

| Area | Files | State |
|---|---|---|
| Token type + fields | `packages/editor/src/editor/design-system/types.ts:88-118` | `aliasOf?` + `darkValue?` + `friendlyName?` + `kind?` shipped |
| Token registry | `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx` | 471 LOC. Most CRUD shipped. `deleteToken: noop` is the gap. |
| Alias resolver | `packages/editor/src/engine/aliasResolver/AliasResolver.ts` | 127 LOC at depth-1. Upgrade target for B2. |
| Linter | `packages/editor/src/editor/design-system/linter/DSLinter.ts` | Multiple rules including `missing-dark`, `empty-value`, `banned-hue`, `pure-black`, `unresolved-binding`. |
| Migration runner | `packages/editor/src/editor/design-system/migrations/projectMigrations/runner.ts` | Snapshot + sequential migrations + rollback shipped per S13. |
| Usage tracker | `packages/editor/src/engine/designSystem/TokenUsageTracker.ts` | 104 LOC. Per-element breakdown via UsageRef. Powers B4 picker. |

## Failure modes (top-3)

1. **B1 rename mid-collab:** User A renames token while User B is editing same token's value. Last-write-wins per S21 collab spec, but rename + edit = two different operations. Test: assert WS fan-out broadcasts rename event separately from value-change event. User B's UI shows "moved to color.bar" toast.
2. **B4 delete during migration:** User triggers delete while another user runs migration (S13 blocks editing per G08). Expected: delete button disabled during migration lock. Test: assert button has `disabled` attribute when `dsMigrationInProgress` marker set.
3. **B2 depth upgrade migration:** existing tokens in v1 were validated against depth-1. After v2 migration, depth checker = depth-3. No new violations possible (just relaxed limit), but token shape didn't change. Test: snapshot all tokens before migration, assert post-migration validation passes for every token.

## Next steps

1. Commit this doc + gap-report v2 to main (solo workflow per `feedback_solo_workflow`).
2. Run `/plan-eng-review` to validate decisions against engine implementation (DONE — see eng-review amendments above).
3. Phase A engineering per revised order: B2 upgrade → A4 audit → B5 enforcement → B1 rename → B4 delete.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | not run (technical spec) |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | CLEAR | consulted on prototype + Tier 1/2 walkthrough earlier in session — risks aligned with eng-review findings |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR | 10 findings (4 arch, 2 code-q, 2 tests, 2 perf), 3 genuine decisions locked (A3+C1+C2), 7 obvious fixes batched into spec amendments |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | gap-report v2 lives at `docs/superpowers/specs/2026-05-16-ds-prototype-gap-report.md` — 22 gaps closed |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | n/a |

- **CODEX:** consulted on prototype flow + risks; flagged collab safety + migration safety + AI quality + beginner-hides-too-much — all addressed in current spec.
- **CROSS-MODEL:** Codex prototype risks + eng-review engine findings converge on same areas (collab, migration, AI binding, beginner UX) — independent validation.
- **UNRESOLVED:** 0 (B1-B7 + A3 + C1 + C2 all locked 2026-05-16)
- **VERDICT:** TOKEN SPEC LOCKED + ENG-REVIEW CLEARED — ready for Phase A token implementation. Per revised implementation order: B2 depth-3 upgrade first → A4 TokenKind audit → B5 semantic enforcement → B1 rename + bridge → B4 delete picker.
