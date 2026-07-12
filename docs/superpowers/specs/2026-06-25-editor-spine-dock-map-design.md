# Editor — Spine + Dock Map (design spec)

**Date:** 2026-06-25
**Status:** DRAFT — awaiting user review
**Author:** brainstorm (Saqib + Claude)
**Method:** Constitution **#15 "Lock the spine; dock additions to the edge"** (lesson `docs/learning/product-design/lessons/0016-lock-the-spine-dock-the-rest.html`)

**Grounding sources (real code, not guesses):**
- `docs/reviews/editor-backend-map-codex-20260623.md` — the editor's backend surface (20 backend-backed · 14 client-only · 5 absent), file:line-grounded.
- `docs/reviews/ia-home-map-20260623.md` — 17 backend clusters → 6 user jobs; per-feature verdict (keep/fix/merge/hide/cut).
- `docs/reviews/editor-left-bar-decision-worksheet.md` — per-capability rail/topbar/inspector/hide/dash home decisions.
- `docs/learning/product-design/reference/buildrik-design-principles.html` — the 15-principle constitution.

---

## 1. Problem

The editor must absorb a steady stream of new features (CMS, reviews, comments, animations, SEO, …) **without the core layout drifting**. Today's live rail is an 11-tab zoned config (`tabsConfig.ts` `GROUPED_TABS_CONFIG`) that already feels like a grab-bag. Without a binding rule, every new feature demands a new top-level slot and the editor reverts to clutter.

**Goal:** define a fixed **spine** (the positions a user memorises) and a **dock map** (where every existing and future feature lives) so that adding a feature never reorders the spine. This is constitution #15 applied to the whole editor.

## 2. The model — combination: 4 modes × flat slots

A two-level rail, chosen over the two single-model alternatives:

- **4 modes** = the stable macro-spine (group-by-intent, #10). Kills icon-sprawl.
- **Flat single-purpose slots inside each mode** = one obvious thing per slot (one skeleton, #12). Kills the grab-bag risk that plain modes carry.
- A new feature **docks inside the right mode** as a slot, or inside a slot's panel, or in the inspector / topbar overflow — it **never adds a new top-level mode**.

```
TOPBAR   Exit ‹agency›client›site›page›   📱device   ↶↷   👁Preview  [ Publish ]  Review▾  ⋯
─────────────────────────────────────────────────────────────────────────────────────────
 MODES        MODE-PANEL (flat slots, one job each)       CANVAS            INSPECTOR (on select)
 🔨 Build  →   ➕Insert · 🗂Pages · ⌗Layers · 🖼Media     (calm center #6)   type·spacing·layout
              (🧩Components, 🗃CMS — progressive)                            size·bg·effects·position
 🎨 Design →   🎨Brand (tokens+styles+components = 1)                        responsive·interactions
 ✨ AI     →   Assistant (chat / edit / plan)                               link · per-page SEO
 ⚙️ Settings→  SEO defaults · Redirects · Forms · Headers · Publish-history
─────────────────────────────────────────────────────────────────────────────────────────
 FOOTER   save status  ·  breadcrumb home
```

> **Supersedes** the L15/L16 rail calls that sent AI→topbar and dissolved Settings. The founder chose the combination on 2026-06-25: AI and Settings return as modes; Layers is a Build slot (not the footer). All other constitution principles are unchanged.

## 3. The spine (fixed — never reorders)

| Spine element | Contents |
|---|---|
| **Rail modes** | 🔨 Build · 🎨 Design · ✨ AI · ⚙️ Settings (order fixed) |
| **Topbar zones** | Navigate (Exit ‹ breadcrumb) │ View (device · ↶↷ · Preview) │ Ship (Publish · Review · ⋯) |
| **Inspector frame** | right panel, appears on element select; section order fixed |
| **Footer** | save status · breadcrumb home |

**Dock zones (where new features may land, without touching the spine):** a mode-panel slot · an inspector section · the ⋯ overflow · a progressive slot (appears on first use).

## 4. Dock map — every editor feature → its home

Status legend (from the codex backend map): **WORKING** · **fix** (wired but broken/lossy) · **merge** (dedup to one home) · **hide** (#3, not ready) · **cut** (product judgment).

### 🔨 Build mode
| Feature | Slot | Status | Principle / note |
|---|---|---|---|
| ➕ Insert (elements + sections + insert-section templates) | 1 | WORKING | #15 — slot #1 forever; a new element type docks *inside* Insert, never a new icon |
| 🗂 Pages (CRUD / reorder / set-home) | 2 | WORKING | core navigation |
| ⌗ Layers (structure tree) | 3 | WORKING (UI state local-only) | navigate the page |
| 🖼 Media (library · upload · versions · image editor · icons/fonts) | 4 | WORKING; metadata edits (name/alt) + folder rename **local-only → fix**; stock → hide | #14 merge — editor is home, dashboard read-only |
| 🧩 Components | progressive (after 1st created) | **fix** — masters in IndexedDB only (data-loss); per-instance overrides revert on master-sync | #9 progressive disclosure |
| 🗃 CMS (collections · records · binding · dynamic pages) | progressive (when a collection exists) | **fix** — server sync lossy (failures dropped; server→local additive-only) | #9 |

### 🎨 Design mode
| Feature | Slot | Status | Principle / note |
|---|---|---|---|
| 🎨 Brand = design tokens + text/color styles + component-system | 1 | **merge 3→1**; tokens WORKING | #14 — the three DS surfaces (ds1·ds2·ds3) collapse to one Brand home |
| Custom CSS / code injection | tucked (Pro-gated) | WORKING | #9 advanced |
| Shared DS push (agency → client sites) | inside Brand | WORKING | the agency wedge |

### 🪟 Inspector (right, on element select) — spine frame
| Feature | Status | Note |
|---|---|---|
| type · spacing · layout · size · bg · effects · position · responsive | WORKING | #15 — section order fixed |
| 3-reach styling model | WORKING | recent redesign |
| interactions (13 triggers) + animations | interactions WORKING; **GSAP fix** (native ScrollTrigger removed → IntersectionObserver) | |
| link / href | WORKING | element property |
| per-page SEO | WORKING | per-page meta lives with the page, not in Settings |

### ✨ AI mode (cross-cutting capability)
| Feature | Home | Status |
|---|---|---|
| Assistant (chat · edit-commands · plan stream) | AI mode | WORKING (`ai.content` / `ai.layout` / `ai.streamPrompt`) |
| propose → confirm action | AI mode (privileged) | WORKING — ADMIN-gated, single-use token |
| alt-text · version-summary · milestone-suggest · SEO write-title | **inside the feature** (Media / History / SEO), surfaced by the assistant | WORKING (SEO write-title = **fix**: needs key guard) |

> AI is not a cluster of screens — the mode is the assistant's home; the inline helpers live inside the feature they serve.

### ⚙️ Settings mode (this site's config)
| Feature | Status | Note |
|---|---|---|
| SEO defaults (site-level) | **merge** | per-page SEO → Inspector; site defaults here (#14 one SEO home) |
| Redirects | **fix** | DB-correct but never injected into the deployed output → dead live |
| Forms (submissions inbox + block config) | viewer WORKING; **block-config has no server write path → fix** | submissions was a guessed ghost — it isn't |
| Security headers | WORKING | |
| Publish history | WORKING (`publishStatus`) | |
| Localization | **hide** | engine is locale-unaware (#3) |

### 🔝 Topbar — global actions
| Feature | Zone | Status |
|---|---|---|
| Exit ‹ breadcrumb (agency › client › site › page) | Navigate | WORKING (#4) |
| Device switch · Undo/Redo · Preview (+ preview-as-client) | View | Preview WORKING; **undo/redo RAM-only → fix (server-backed later)** |
| **Publish** (hero) | Ship | WORKING — #5 the product's purpose |
| Review request / Share | Ship (Review ▾) | review submit WORKING; **share-link decorative → fix**; **comments client overlay missing → fix** |
| ⌘K · Version history · Invite · Help · Account | ⋯ overflow | mixed — #7 earns-its-way / #9 tuck |

### 🦶 Footer
Save status (WORKING — #2 one status, one truth) · breadcrumb home.

## 5. Not in the editor — Dashboard (scope test: across-site / business)
| Feature | Home | Status |
|---|---|---|
| Domains (connect · verify · primary) | Dashboard site-settings | **fix** — dns-verify cron matches a dead host (`sites.buildrik.app` vs `cname.vercel-dns.com`) |
| Analytics (visitors / sources / devices / time-series) | Dashboard site-detail | **fix** — avgSession hardcoded 0; hourly silently degrades to daily |
| Site settings (general / social / code) | Dashboard site-detail | **merge 3→1** (editor tab · dashboard · settings hub → one) |

## 6. Hide (#3 — design the slot, gate the feature)
Stock photos/videos (STUB → `[]`) · Real-time collaboration presence (6 P1 convergence bugs, flag off) · Localization (engine locale-unaware) · AI-create-site *(dashboard — no real branch)* · Billing upgrade/paywall *(dashboard — throws PAYMENTS_NOT_CONFIGURED)*.

## 7. Cut
Export HTML — anti-retention (takes the user out of the product). Pure-client, WORKING — cut by product judgment, not capability.

## 8. Backend honesty overlay (the "half-wired" fix worklist)
Five **HIGH data-loss** client-only features sit in the spine but have no server copy: local-only project · undo/redo · CMS bindings · runtime form-submit · components masters. Rule: a half-wired feature may dock in the spine **only if it shows honest state** (#13 design every state — saving/error/offline) — otherwise hide until server-backed (#3). These are the Step-3 "fix" worklist, ordered by user pain.

## 9. Counts
- **Spine:** 4 modes + 3 topbar zones + inspector frame + footer.
- **Backend-backed, docked:** ~20 (across Build / Design / Inspector / AI / Settings / Topbar).
- **AI inline helpers:** 4 (live inside their feature).
- **Progressive slots:** 2 (Components, CMS).
- **Dashboard (not editor):** 3. · **Hide:** 5. · **Cut:** 1.

## 10. The spine test (the rule this spec installs)
Before any new editor feature lands, run:
1. Does it move anything the user already knows the position of? If yes — stop.
2. Which existing home does it dock into (a mode slot · inspector section · ⋯ overflow)? No fit → maybe the feature is wrong.
3. Common or rare? Common → visible in the panel. Rare → one click deep (#9).
4. New top-level slot **only** if it is a genuinely new *user job* — otherwise #8 "subtract before you add."

## 11. Open decisions (resolve before / during build)
- **Components & CMS progressive triggers:** Components appears after the first component is created; CMS appears when the first collection exists. Confirm the exact trigger + where the empty/teaser state lives.
- **Mode switching vs persistent panel:** does selecting an element auto-reveal the Inspector regardless of active mode (recommended), or only in Design mode? (Recommended: Inspector is always available on select; modes drive the *left* panel only.)
- **Live state-audit caveat:** verdicts are grounded in the 2026-06-23 code audit, not a fresh live browse. `merge`/`fix` rows touching state-completeness want a live state-audit before build (recovery Phase 4).

## 12. Non-goals
- No visual/brand redesign (DESIGN.md locks the brand; cobalt #2D6DFF).
- No backend rewrites in this spec — the `fix` rows are flagged, not designed here.
- No dashboard IA beyond noting which features leave the editor (its own spec).

## 13. Next step
On approval → `writing-plans` to produce the implementation plan: convert this map into the real rail (`tabsConfig.ts` → 4 modes × flat slots), wire the merges (Brand 3→1, Media one home, Settings), apply the progressive slots, and gate the hides. Build via the 5-rung verification ladder; do not re-wire logic (re-lay-out only, lesson 8).
