# Builder product audit — 10 October 2026

The builder has substantial useful functionality. Its main maturity gap is consistency between **scope, navigation, effective state, and rendered output**. Adding more features or restyling controls alone will not resolve that gap.

This audit extends the [25 runtime findings and screenshots](../ui-ux-audit-2026-10-10/REPORT.md). It adds 16 source/tooling findings (some explain earlier runtime symptoms), feature disposition, an interaction contract, and an ordered improvement programme. It does **not** certify every feature or production workflow: authenticated publishing, billing, remote persistence, review delivery, and multi-user sessions have not been exercised end to end. Local API failures are not counted as production defects. No valuable feature is proposed for wholesale deletion.

## Read the deliverables

- [Feature ownership and surface matrix](FEATURE-MAP.md): where existing capabilities belong, their relevance, behavior, and coverage.
- [Source findings](FINDINGS.md): defects and design risks, source evidence, impact, and acceptance criteria.
- [Interaction and responsive workspace specification](INTERACTION-SPEC.md): menus, surfaces, panel dimensions, navigation, state, accessibility.
- [Implementation and verification plan](IMPLEMENTATION.md): dependency order, bounded changes, measurable acceptance checks.
- [Earlier visual report](../ui-ux-audit-2026-10-10/index.html): browsable screenshots and findings.

## Implemented correction

Context-menu submenus now work by keyboard and click, position on activation, and close one level per Escape. The scoped change passed 28 focused tests, TypeScript, and a Chromium interaction check. Other audit recommendations remain proposed work, not completed fixes.

## Priority

1. Editing must predict output: reconcile responsive typography and effective inspector values.
2. Every offered action must be applicable, reachable, and explain failure or unavailability.
3. Workspace changes must preserve context and isolate covered controls from keyboard navigation.
4. Navigation should reflect user tasks and scope: build, content, assets, design system, site administration, publish/review.
5. Apply visual consistency after these interaction contracts are explicit.

## What already deserves preservation

The code has a shared element-action registry, canonical element capabilities, command and history infrastructure, reusable chrome primitives, lazy panel routers, CMS records/fields/import tools, component masters, brand tokens, asset versions, review/compare/history, save-conflict handling, and publish-job recovery. These are useful foundations. Several apparent duplications are valid contextual doors (for example, binding an element versus managing a collection); consolidate their behavior and destinations rather than removing the doors.

## Benchmark interpretation

Webflow documents a style inspector organized around the selected element, layout, spacing, size, typography, and other styling; its Navigator exposes the document hierarchy. These are useful comparisons for inspector order and layer naming, not evidence that our exact grouping should be copied. [Webflow Style panel](https://help.webflow.com/hc/en-us/articles/33961362040723-Style-panel-overview), [Navigator](https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator).

Framer documents preview starting from the chosen breakpoint, viewport resizing, and testing interactions. It separately notes that custom code requires a published site. Its scaling guidance connects reusable components, responsive styles, CMS, and staging. This supports preserving context, making runtime limits explicit, and treating reusable systems as first-class workflows. [Preview](https://www.framer.com/help/articles/how-to-preview-your-site/), [Scaling](https://www.framer.com/help/articles/setting-up-your-framer-site-for-scale/), [Components](https://www.framer.com/help/articles/using-components/).

These are public-documentation benchmarks, not a hands-on comparative usability study. Proposed dimensions and menu order below are product recommendations, not claims about competitor implementation.

## Figma's role

Use Figma to validate the revised shell, surface families, selected-element states, and responsive variants before a broad visual rollout. A Figma board already exists in this project's instructions; a new file is not a prerequisite. Model complete task flows, errors, empty states, permission states, and narrow screens—not just attractive default screenshots. Fix verified behavioral defects in code alongside this work. Figma cannot establish serializer parity, persistence correctness, or keyboard behavior.
