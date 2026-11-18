# Phase 5 design direction

Gate 4 closed with the bounded conclusion in PHASE-4-COMPLETION-REPORT.md. The new page is `8312:2`, **02 — IMPROVED APPLICATION / TO-BE**, in the existing Buildrick file. AS-IS and original pages remain intact.

The selected direction is Phase 3's content-budget docking model: retain the familiar six destinations and default 60px rail, 280px drawer and 300px Inspector, then collapse secondary panels when the remaining canvas cannot accommodate its task. Alternatives—retaining the old blanket overlay breakpoint or making every module a floating/resizable window—remain rejected for the reasons in PANEL-AND-CONTEXT-RULES.md. These are design decisions, not implementation approval or measured user-study outcomes.

Canonical light-theme identity and Flowbite blue `#1A56DB` are preserved from src/editor/AGENTS.md. The initial exploratory `#1D4ED8` suggestion was discarded before native screen construction. Dense 12–14px controls, consistent 30–32px fields/rows, restrained borders and semantic state colors support the existing Tailwind/Flowbite/chrome-ui stack. No new UI framework is proposed.

Inspector uses proposed **Style / Content / Effects**. Style owns layout, dimensions, spacing, typography, fill and border. Content owns actual element-specific settings, links, forms, CMS and advanced accessibility/attributes/classes. Effects groups visual effects/transform separately from Interactions. This relocates current Behaviour controls and preserves capabilities; it does not pretend the current app already uses these tabs. Type, breadcrumb, breakpoint, pseudo-state and value origin remain visible. Component master/instance scope is distinct from ordinary local values.

Dedicated CMS, Media, Brand, Settings and Templates surfaces retain their service ownership, caller return, scope and save models. Proposed recovery states explicitly distinguish empty/error, local/server/published, draft/saved, unknown/checked, and read/write permissions. Core engine/backend findings remain engineering dependencies; drawing corrected feedback does not close them.

Native working controls are shared during Phase 5; formal token/variant library and connected prototype are Phase 6 deliverables. Example website content and proposed error/proposal states are design fixtures, not new claims about live user data or successful backend operations. Phase 7 planning and Phase 8 implementation remain deferred.
