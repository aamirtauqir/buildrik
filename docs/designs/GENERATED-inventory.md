# GENERATED — code inventory

> **Do not edit, and do not hand-write any of these numbers in another document.** Regenerate with `node .render/inventory.mjs`.
>
> Written because a 2026-07-18 audit found **42 hand-written claims wrong** across the design docs — every one had exactly one authoritative source file. Design docs should link here rather than restate.
>
> A count of **0 is reported as a broken pattern, never as an answer** — a plausible-looking wrong number is the failure this file exists to prevent.
>
> Generated 2026-07-19 15:26.

| What | Count | Source of truth |
|---|---|---|
| Element types | **50** | `shared/types/element.ts` |
| Blocks — in the registry | **63** | `blocks/blockRegistry.ts` |
| Blocks — categories in the registry | **7** — Basic · Media · Layout · Form · Section · Component · Ecommerce | `blocks/blockRegistry.ts` |
| Blocks — in the shipped Insert panel | **53** | `editor/sidebar/tabs/build/catalog/catalog.ts` |
| Blocks — categories in the shipped panel | **6** — basic · layout · forms · media · navigation · interactive | `editor/sidebar/tabs/build/catalog/catalog.ts` |
| ⌘K commands registered | **39** | `engine/commands/defaultCommands.ts` |
| Icons | **368** | `shared/constants/icons.ts` |
| Icon categories | **17** | `shared/constants/icons.ts` |
| DS token kinds | **14** — color · type · spacing · radius · shadow · motion · border · opacity · zindex · breakpoint · grid · sizing · icon · imagery | `engine/designSystem/types.ts` |
| DS default tokens | **94** | `editor/design-system/constants.ts` |
| Style presets | **18** | `editor/design-system/constants.ts` |
| Starter themes | **6** | `editor/design-system/starters/index.ts` |
| Inspector sections | **18** | `editor/inspector/sections/registry/_shared.tsx` |
| Inspector element profiles | **7** — CONTAINER · TEXT · FLEX · GRID · MEDIA · BUTTON · INPUT | `editor/inspector/config/elementProfiles.ts` |
| Interaction triggers | **14** — hover · click · active · focus · blur · page-load · page-scroll · page-leave · scroll-into-view · while-scrolling · scroll-out · mouse-over · mouse-move · mouse-out | `editor/inspector/sections/interactions/types.ts` |
| Interaction animation presets | **39** | `editor/inspector/sections/interactions/types.ts` |
| Animation editor presets | **25** | `editor/animation/AnimationEditor.tsx` |
| Animation easings | **7** | `editor/animation/AnimationEditor.tsx` |
| Component catalog | **27** | `editor/components-catalog/catalog.ts` |
| Rail tabs configured | **11** — add · ai · templates · assets · layers · pages · components · design · settings · publish · history | `editor/rail/tabsConfig.ts` |
| Settings screens (in-tab) | **10** — general · branding · seo · analytics · localization · custom-code · redirects · headers · forms · integrations | `editor/sidebar/tabs/settings/SettingsTab.tsx` |
| Settings deep-links (leave the editor) | **3** — domains · members · billing | `editor/sidebar/tabs/settings/SettingsTab.tsx` |
| Engine Manager classes (total) | **25** | `engine/**` |
| Engine Managers wired into Composer | **18** | `engine/Composer.ts` |

**Feature flags:** publish · dsAi · collab — check each default before calling a gated feature "working".

## Why a number here can differ from a number in a design doc

Usually both are true and mean different things:

- **Registry vs shipped surface** — the block registry and the Insert panel's catalog are different files with different contents. A doc quoting the registry describes a target; the panel is what a user sees.
- **Registered vs reachable** — commands live in `defaultCommands.ts`, but a palette that builds its own list never exposes them.
- **Implemented vs gated** — code behind a flag defaulting to false is code no user has.
- **Total vs wired** — a class can exist in `engine/` and never be instantiated by `Composer`.

When this file and a design doc disagree, this file is right about the code; the doc may still be right about the target. State which you mean.
