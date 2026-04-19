---
title: Export Modal — Code Export
description: Design specification for the code export modal with format selection, quality scoring, and file tree preview
feature: export-modal
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../settings-tab/README.md
  - ../inspector/README.md
dependencies:
  - Settings Tab (export preferences as defaults)
  - Inspector (component structure affects export quality)
status: approved
---

# Export Modal — Code Export

## Overview

The Export Modal generates production-ready code from the visual design in multiple formats: HTML, React, Vue, and Next.js. It features a Code Quality Score (0-100) that grades the output across 5 factors, a component-structured file tree, a live preview in a device frame, and one-click copy or ZIP download. All output is formatted with ESLint + Prettier.

**Primary User Goal:** Get clean, production-grade code from visual designs without manual cleanup.
**Success Criteria:** Exported code passes ESLint with zero errors; Quality Score >= 80 for well-structured designs.
**Key Pain Points Addressed:** No more spaghetti HTML from visual builders; code is component-structured and accessible.

---

## Layout Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Export Code                                    [✕ Close] │
├────────────────┬─────────────────────────────────────────┤
│ Format         │                                         │
│ ○ HTML         │  Code Quality Score                     │
│ ● React        │  ┌────────────────────────┐             │
│ ○ Vue          │  │  ████████████░░  82/100 │             │
│ ○ Next.js      │  └────────────────────────┘             │
│                │                                         │
│ File Tree      │  Component Structure  25% ████████░ 88  │
│ ┌────────────┐ │  CSS Properties       20% ███████░░ 76  │
│ │ 📁 src/    │ │  Semantic HTML        20% ████████░ 84  │
│ │  📁 comp/  │ │  Accessibility        20% ███████░░ 78  │
│ │   Hero.tsx │ │  Code Cleanliness     15% █████████ 90  │
│ │   Nav.tsx  │ │                                         │
│ │   CTA.tsx  │ │─────────────────────────────────────────│
│ │  App.tsx   │ │                                         │
│ │  index.tsx │ │  // Hero.tsx                            │
│ └────────────┘ │  import React from 'react';             │
│                │  import { HeroContainer } from './..';  │
│ Preview        │                                         │
│ ┌────────────┐ │  export const Hero = () => (            │
│ │ [🖥][📱]   │ │    <section aria-label="Hero">         │
│ │            │ │      <h1>Welcome</h1>                   │
│ │  Live      │ │      <p>Build visually.</p>             │
│ │  Preview   │ │    </section>                           │
│ │            │ │  );                                     │
│ └────────────┘ │                                         │
├────────────────┴─────────────────────────────────────────┤
│                    [Copy Code]  [Download ZIP]            │
└──────────────────────────────────────────────────────────┘
```

---

## Screen States

### State 1: Format Selection

- **Format radio buttons:** Left column, 4 options. Active: `--buildrick-accent` radio fill + label.
- **File tree updates** when format changes (e.g., React shows `.tsx`, Vue shows `.vue`).
- **Code preview updates** to show format-appropriate syntax.

### State 2: Code Quality Score

- **Overall score:** Large number (82/100), progress bar `--buildrick-success`/`--buildrick-warning`/`--buildrick-error` based on value.
- **5 factors with individual scores:**

| Factor | Weight | Measures |
|--------|--------|----------|
| Component Structure | 25% | Named components vs monolithic blocks |
| CSS Properties | 20% | Design tokens used vs hardcoded values |
| Semantic HTML | 20% | Proper tags (section, nav, article vs div soup) |
| Accessibility | 20% | ARIA labels, alt text, heading hierarchy |
| Code Cleanliness | 15% | No dead code, consistent formatting, DRY |

- **Each factor:** Mini progress bar + score. Green >= 80, Yellow 50-79, Red < 50.
- **Hover factor:** Tooltip with specific improvement suggestions.

### State 3: File Tree

- **Tree view:** Standard folder/file tree, `--aqb-body-sm`, `--aqb-code` font for filenames.
- **Click file:** Code preview pane shows that file's contents.
- **Active file:** `--buildrick-accent-tint` bg highlight.
- **Structure:** Mirrors component hierarchy from canvas (one component = one file).

### State 4: Live Preview

- **Device frame:** Toggle between desktop (1280px) and mobile (375px) in a mini preview.
- **Renders actual exported code** in a sandboxed iframe.
- **Purpose:** Visual verification that export matches the design.

### State 5: Generating (Loading)

- **Overlay:** "Generating export..." with spinner.
- **Progress:** File-by-file generation shown in tree (checkmarks appear as files complete).
- **Duration:** Typically 2-5 seconds for a full page.

### State 6: Export Error

- **Banner:** `--aqb-error-subtle` bg with error description and [Retry] button.
- **Common:** Circular component references, unsupported features.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Select format | Regenerates code + file tree + score | 200ms fade transition |
| Click file in tree | Shows that file's code in preview pane | Instant highlight + code swap |
| Click "Copy Code" | Copies active file (or all files concatenated) to clipboard | Checkmark flash, 1.5s |
| Click "Download ZIP" | Downloads all files as a ZIP archive | Browser download dialog |
| Hover quality factor | Shows improvement tooltip | Tooltip fade-in, 150ms |
| Toggle device preview | Switches iframe width | 200ms width transition |
| Click Close (X) | Dismisses modal | Fade-out, 150ms |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Modal open → initial render | < 300ms (show UI, generate in background) |
| Code generation (full page) | < 5s |
| Format switch (re-generate) | < 3s |
| Quality score calculation | < 1s |
| Copy to clipboard | < 100ms |
| ZIP generation | < 2s |

---

## Accessibility

- **Modal:** Focus trapped, Escape to close, auto-focus on format selection
- **Format radios:** Standard `role="radiogroup"`, arrow keys to switch
- **File tree:** `role="tree"`, `role="treeitem"`, keyboard navigable (arrow keys)
- **Code preview:** Uses `<pre><code>` with syntax highlighting, scrollable with keyboard
- **Quality factors:** `aria-label="[Factor name]: [score] out of 100"` on each bar
- **Copy/Download buttons:** `aria-label` includes action context

---

## Implementation Notes

- Code generation pipeline: DOM tree → AST → format-specific transpiler → ESLint → Prettier
- ESLint + Prettier run client-side (bundled configs) to ensure consistent output
- Quality score computed by analyzing the generated AST (not the source DOM)
- Component splitting heuristic: sections and repeated patterns become separate component files
- Export preferences from Settings Tab pre-select the format and options
- ZIP uses JSZip library for client-side archive creation

---

## Related Documentation
- [Settings Tab](../settings-tab/README.md) — Export preferences set defaults
- [Inspector](../inspector/README.md) — Component structure affects quality score
- [Canvas](../canvas/README.md) — Source of exported content
- [Style Guide](../../design-system/style-guide.md) — Modal and code display specs
