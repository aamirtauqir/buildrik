# Spec — Design System + Components: how it works & integrates (2026-06-17)

From a founder interview. Resolves the DS-vs-components confusion and defines the **functional spec** for how they work and integrate, Pro/agency-first. Grounded in the live engine (`engine/designSystem/`, `engine/components/`). Decisions marked **[LOCKED]** (founder-chosen) or **[REC]** (I recommend; vetoable).

---

## 0. The mental model (one picture)

Two clean jobs, meeting only at a token reference string:

- **Components = WHAT a thing is** — reusable blocks of *structure + content* (navbar, CTA, pricing card). [LOCKED: component = reusable structure block]
- **Design System = HOW things look** — the *values* (Brand tokens) + *recipes* (Styles/presets). Styling lives here, never inside the component.
- They touch only via `{{token.x}}` references inside an element's styles, resolved at render (`engine/designSystem/TokenBindingResolver.ts`).

> The editor's OWN UI components (vibcoder atoms: `editor/shared/vibcoder/`) are **internal chrome** — they build Buildrik's interface, never the user's site. They are NOT part of this spec. (Source of the "button exists 4 times" confusion — 2 are internal chrome, 2 are user-site.)

---

## 1. The user-facing model + naming [REC]

Rename to kill confusion (users never hear "tokens/presets/symbols"):

| Concept | User-facing name | Engine reality |
|---|---|---|
| Design tokens (color/type/spacing/14 kinds) | **Brand** | `DesignToken` (`{{token.x}}` refs) |
| Token-value set you can swap per client | **Theme** | a named map of token values (+ `darkValue`) |
| Style preset (recipe: Primary button) | **Style** | `StylePreset.bindings` (CSS prop → token) |
| Reusable structure block | **Component** | `ComponentDefinition.masterTree` + instances |
| The shared workspace collection of all of the above | **Library** | workspace-scoped store |
| Starter bundle (Theme + Components) to seed a new site | **Kit** | seed of Library + Theme |

So: **a Library = Brand + Styles + Components. A Theme paints the Library for one client. A Kit is a ready-made starting Library+Theme.**

---

## 2. Scope: shared across client sites [LOCKED]

- The **Library is workspace-level** (one per agency workspace), reusable across every client site. Build a navbar / a button Style / a brand token **once** → available on all client sites. [LOCKED: shared across all client sites]
- Each **client site** = (a) a subscription to the workspace Library + (b) its own **Theme** (the client's actual colours/fonts/spacing values) + (c) its own per-site **instance overrides**.
- Components are part of the shared Library too. [LOCKED: workspace-shared component library]

---

## 3. The agency superpower — rebrand by theme-swap [LOCKED]

Same structures, different brand per client:
- Components store structure with styling as `{{token.x}}` references (NOT hard-coded colours).
- Styles (presets) bind CSS props → tokens.
- A **Theme** supplies the token *values* for one client.
- **Swap the Theme on a site → every component + style re-resolves → the whole site is instantly in that client's brand.** Structure never changes. This is white-label reuse: one component library, N client brands. [LOCKED: this is the core workflow]

Concrete: `navbar` component uses `background:{{token.surface}}`, `cta` button Style binds `background-color → {{token.accent}}`. Client A Theme: accent=#2D6DFF. Client B Theme: accent=#E0563F. Same components, drop on each site, pick the Theme → done.

---

## 4. Propagation — per-site controlled [REC]

When a shared Library item (a token, a Style, a component master) changes:
- Each subscribed site gets an **"update available"** signal (per item).
- The agency **reviews + pushes** per site (pull model). Nothing changes on a live client site without an explicit push.
- Rationale: a single token edit must NOT silently alter 20 live client sites. Mirrors the engine's existing explicit sync (`ComponentInstance.syncedVersion < master.version` → offer sync; `syncAllInstances()` is a deliberate call, not automatic). [REC — vetoable; alternative is auto-live, riskier]
- **Exception toggle:** a site may opt a token into "auto-follow brand" for pure colour refreshes; structural component changes are always review-then-push.

---

## 5. How each piece works (mechanics, grounded)

### 5.1 Brand (tokens)
- A token: `{ id, value, darkValue?, kind (14 kinds), aliasOf? }` (`engine/designSystem/types.ts`).
- An element references it in styles as the whole-value string `"{{token.accent}}"` — resolved at render by `TokenBindingResolver` (whole-value only; no partial). Change the token value → everything bound updates.
- A **Theme** = a named override map of token values applied to a site. Default Theme = the Library's base values.

### 5.2 Styles (presets)
- A Style = `{ category (11: button/card/…), variant, bindings: { cssProp → tokenId } }`.
- Applied to an element via a **class** (`element.classes = ["btn-primary"]` → CSS rule binds props to token vars). A Style is a *recipe/template*, not stored on the element.
- Edit a Style → every element using that class updates (one of the reach rungs).

### 5.3 Components
- A Component = `ComponentDefinition.masterTree` (an `ElementData` tree: structure + content + styles that may contain `{{token.x}}`), `version`.
- An **instance** = clone of masterTree (new ids) + `overrides` (RFC-6902 JSON Patch, positional paths) + `syncedVersion` + `isDetached` (`engine/components/ComponentInstances.ts`).
- Edit master → bump `version` → subscribed sites/instances offered an update → on push, master re-clones and **overrides re-apply** (positional, so they survive new ids). Per-instance edits (overrides) are preserved.
- `detachInstance()` = unlink an instance to edit freely.

### 5.4 Kit (starter)
- A Kit = a seed bundle: a default **Theme** (tokens) + a set of **Components** + **Styles**. [LOCKED: theme + component library together]
- New site → pick a Kit → Library + Theme seeded → user customises. (Extends the existing starter-gallery to include components, not just tokens.)

---

## 6. The ONE way to change how something looks [REC — element-first 5-rung]

Default path, narrowest-wins (the locked styling model):
1. **Just this element** (default) — edit in inspector → local override only. ~90% of edits.
2. **Apply to all** (the class/Style) — explicit opt-in: "change all 31 buttons."
3. **This component** — edit the master → push to instances.
4. **The brand/Theme** — change a token → everything bound (preview + per-site push).

User always starts at #1; climbing is an explicit, counted opt-in with a propagation guard (never silent). Presets surface to the user simply as **"Styles"** (apply a Style, or save current as a Style). [REC: confirm element-first default]

---

## 7. Where it lives — editor vs dashboard (boundary §3)

- **Managing the shared Library** (create/edit Brand, Styles, Components; manage Themes; push updates to sites) = a **workspace-level area** (dashboard/operate side — it's an asset across sites). Also openable in-editor for in-context edits.
- **Using the Library** (drop a component, apply a Style, edit an element) = **editor/make side**.
- **Per-client Theme assignment + rebrand** = on the site (site-detail / editor), pick the Theme.
- vibcoder/chrome stays internal — never shown as user "components."

---

## 8. Key user flows

1. **New client site:** pick a Kit → Library + base Theme seeded → set the client's Theme values (their colours/fonts) → site is in their brand.
2. **Build a page:** drag a Component from the Library → it's an instance → edit content; styling already brand-correct via tokens.
3. **Restyle one button:** select → change fill → "just this one" (default). Want all? → "apply to all" (the Style).
4. **Update the brand:** edit a token in a Theme → preview → push to the sites that use it (per-site controlled).
5. **Onboard a new client fast:** clone an existing client's site (or pick the Kit) → swap the Theme → same structure, new brand. The reuse win.
6. **Make a reusable block:** select elements → "Save as Component" → now in the shared Library for all sites.

---

## 9. Open / vetoable decisions (need your nod)
- **§4 propagation default** = per-site controlled (push/pull). Veto → auto-live?
- **§1 naming** = Brand / Theme / Style / Component / Library / Kit. Veto → keep "design system / tokens / presets"?
- **§6 look-change default** = element-first. Veto → start with "apply a Style"?
- **Component themability:** v1 = components are structure-only, all look comes from Theme tokens (no per-client structural variants). [REC: keep simple for v1] Veto → need structural variants per client?

## 10. Out of scope (this spec)
- vibcoder/editor-chrome redesign (internal UI — separate arc).
- The rebuild itself (this is the functional contract; build spec follows once §9 is confirmed).
