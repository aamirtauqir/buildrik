---
name: buildrik-design
description: Use this skill to generate well-branded interfaces and assets for Buildrik, a drag-and-drop website builder (Webflow-style), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key files:
- `README.md` — product context, voice, visual foundations, iconography
- `colors_and_type.css` — all color + type CSS variables (import this first)
- `reference/` — verbatim design tokens from the codebase (color, typography, spacing, radius, shadow, motion, z-index, layout)
- `assets/icons/` — local SVG icons (navbar, blocks, layers)
- `ui_kits/editor/` — React component recreations of the editor chrome

Core palette (copy these fast):
- Accent cobalt: `#2D6DFF` (hover `#4B8DFF`, pressed `#1E58D9`)
- Surfaces: `#FFFFFF` card / `#F8FAFC` panel / `#F1F5F9` subtle
- Text: `#334155` primary / `#64748B` secondary / `#94A3B8` muted
- Borders: `#E2E8F0` default / `#CBD5E1` medium / `#94A3B8` strong
- Status: `#DC2626` error / `#16A34A` success / `#D97706` warning
- Fonts: Inter Tight (ui + display), Geist Mono (numeric/code)
- Radii: sm 4 / md 8 / lg 12 / full 9999 (buttons = 8, pill CTAs = 9999)

Voice: direct, short, imperative, sentence-case. No emoji in chrome. Numerals not words.
