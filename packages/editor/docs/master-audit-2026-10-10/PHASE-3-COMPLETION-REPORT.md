# Phase 3 — architecture gate

The information architecture gate is met for the assessed baseline. This is a design proposal with explicit validation obligations, not implementation approval or proof that the proposed interface works. Phase 4 must reconstruct the actual application before Phase 5 changes its design.

- [Information architecture audit](INFORMATION-ARCHITECTURE-AUDIT.md): module ownership, navigation hierarchy, alternative entry-point tradeoffs, permission/persistence boundaries and caller return.
- [81-feature ownership matrix](INFORMATION-ARCHITECTURE-MATRIX.csv): all inventory IDs exactly once; 18 populated fields per row; 33 KEEP, 45 IMPROVE and 3 RELOCATE. No justified deletion, broad rebuild or service merger.
- [Panel and context rules](PANEL-AND-CONTEXT-RULES.md): surface responsibilities, default/minimum/maximum profiles, docking/overlay/full-workspace distinctions, focus/Escape/scroll ownership and all 55 registered element types. Proposed dimensions are hypotheses for later fit validation.
- [Webflow/Framer comparison](WEBFLOW-FRAMER-GAP-ANALYSIS.md): 30 official sources, 16 Webflow and 14 Framer, retrieved 10 October 2026. Documentation-level evidence only; no competitor account testing or copied assets.
- [Machine-readable artifact checks](evidence/phase3-artifact-validation.json): exact inventory coverage, decisions and tracking cross-reference reconciliation.

The recommended rail retains Add / Layers / Pages / Media / CMS / Brand. Components stays clearly accessible within Add and through one direct management view; a separate icon remains an explicit prototype alternative. CMS records get workspace space without taking ownership of Pages. Right-side tasks replace the Inspector one at a time. Publish retains its topbar door. Full Media, Templates, Settings and Brand keep their task-specific workspace roles. Contextual token, binding and media choices preserve the original target and return path.

The shared principles are visible edit scope, truthful local/server/published state, one relevant action contract across menu/palette/shortcut, predictable nested dismissal and recoverable transactions. Preserve the tested component, CMS, Brand, page and History workflows. Canvas P0 findings, authorization/release risks and failed-sync recovery remain implementation dependencies; a polished layout cannot close them.

Root reviewed the three reports and checked the CSV against the inventory. The existing engine-rendered HTML canvas, shared write/history guards, Tailwind/Flowbite chrome, schemas and APIs remain constraints. No application/test source changed. Proposed widths, Components discoverability and complete interaction fit remain Phase 5/6 validation work. Existing native-gesture, provider, role and broad QA limitations remain visible in Phase 2; no additional pass is inferred here.

Next: create **01 — EXISTING APPLICATION / AS-IS** in the designated Buildrick Figma file, using current runtime measurements and native editable layers, compare representative screens, and record incomplete states. Existing Figma pages and the original baseline must remain intact.
