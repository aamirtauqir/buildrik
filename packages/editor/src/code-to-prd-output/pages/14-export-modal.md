# Export Modal

> **Module:** Export
> **Source:** `src/editor/export/`
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Export Modal generates production-ready code from the visual design. It supports multiple output formats (HTML, React, Vue, Next.js), provides a live preview in a device frame, shows a **Code Quality Score**, uses **component-structured file organization**, and bundles assets into downloadable ZIP files. Export quality must pass a senior React developer's review.

## Layout

```
+---------------------------------------------+
| Export                              [×]      |
+---------------------------------------------+
| Format                                       |
| [HTML ✓] [React] [Vue] [Next.js]           |
+---------------------------------------------+
| Options                                      |
| ☑ Include assets    ☑ Minify output         |
| ☑ Include sitemap   ☐ TypeScript            |
| CSS mode: [Inline ▾]                        |
+---------------------------------------------+
| Code Quality Score                           |
| ████████████░░ 85/100                       |
| ✓ Component structure  ✓ Accessibility      |
| ✓ CSS custom props     ⚠ 2 inline styles   |
+---------------------------------------------+
| Preview                   | Code             |
| +---[Device Frame]---+    | components/      |
| | [Live preview of   |    |   Hero.tsx       |
| |  exported page]    |    |   Navbar.tsx     |
| |                    |    | styles/          |
| +--------------------+    |   tokens.css     |
|                           | pages/           |
|                           |   index.tsx      |
+---------------------------------------------+
| [📋 Copy Code] [📥 Download ZIP]            |
+---------------------------------------------+
```

## Fields

### Format Selection
| Format | Output | Notes |
|--------|--------|-------|
| HTML | `.html` + `.css` + assets | Standard static HTML with inline or external CSS |
| React | `.jsx` / `.tsx` + CSS | React components with Emotion or CSS modules |
| Vue | `.vue` SFC | Single-file components |
| Next.js | `.tsx` + layout | Next.js page structure with layout components |

### Options
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Include assets | Checkbox | true | Bundle images/fonts/media in export |
| Minify output | Checkbox | true | Minify HTML/CSS/JS for production |
| Include sitemap | Checkbox | true | Generate sitemap.xml |
| TypeScript | Checkbox | false | Generate .tsx instead of .jsx (React/Next.js) |
| CSS mode | Select | Inline | Inline styles, External CSS, CSS Modules, Emotion |

### Code Quality Score
| Element | Type | Behavior |
|---------|------|----------|
| Score bar | Progress (0-100) | Overall code quality rating |
| Checklist items | Status icons | ✓ Component structure, ✓ Accessibility attributes, ✓ CSS custom properties used, ✓ Semantic HTML, ⚠ Warnings for inline styles/div soup/missing alt text |

**Score factors:**
| Factor | Weight | Checks |
|--------|--------|--------|
| Component structure | 25% | Elements grouped into logical components (not flat div soup) |
| CSS custom properties | 20% | Design tokens exported as `var(--aqb-*)` not hardcoded values |
| Semantic HTML | 20% | Proper use of `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` |
| Accessibility | 20% | Alt text, ARIA labels, heading hierarchy, color contrast |
| Code cleanliness | 15% | No unnecessary nesting, proper indentation, passes ESLint/Prettier |

### Preview Panel
| Element | Type | Behavior |
|---------|------|----------|
| Device frame | Select | Desktop, Tablet, Mobile frame around preview |
| Live preview | iframe | Renders the exported HTML in real-time |
| Refresh button | Icon | Re-renders preview with current options |

### Code Panel
| Element | Type | Behavior |
|---------|------|----------|
| Code display | Syntax-highlighted | Shows generated code for selected format |
| **File tree** | Tree view | Shows realistic project structure: `components/Hero.tsx`, `components/Navbar.tsx`, `styles/tokens.css`, `pages/index.tsx` — not `page1.html`, `page2.html` |
| File tabs | Tab list | Click file in tree to view its code |

## Interactions

### Select Format
- **Trigger:** Click format option
- **Behavior:** Code panel regenerates for selected format → preview updates → code quality score recalculates

### Toggle Options
- **Trigger:** Change any checkbox or select
- **Behavior:** Code regenerates with new options → preview refreshes → quality score updates

### Review Code Quality
- **Trigger:** Automatic on every code generation
- **Behavior:** Quality score calculates and displays. Warnings link to the specific file/line causing the issue. Designers can address warnings before handoff.

### Copy Code
- **Trigger:** Click "Copy Code" button
- **Behavior:** Currently visible file's code copied to clipboard → toast "Code copied"

### Download ZIP
- **Trigger:** Click "Download ZIP" button
- **Behavior:** ExportEngine generates full project bundle → JSZip creates archive → browser downloads ZIP file
- **ZIP structure (React example):**
```
my-project/
├── components/
│   ├── Hero.tsx
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── Card.tsx
├── pages/
│   ├── index.tsx
│   ├── about.tsx
│   └── contact.tsx
├── styles/
│   ├── tokens.css        (design tokens as CSS variables)
│   └── global.css
├── assets/
│   ├── images/
│   └── fonts/
├── sitemap.xml
└── package.json
```

### Preview in Device
- **Trigger:** Select device in preview panel
- **Behavior:** Preview iframe resizes to device dimensions

## Export Pipeline (Internal)

The ExportEngine processes the export in this order:
1. **Element tree → component identification** — group elements into logical components
2. **Component code generation** — generate per-component files (not flat page dumps)
3. **CSS custom property mapping** — design tokens as `var(--aqb-*)`, not hardcoded hex values
4. **Asset bundling** — collect all referenced images, fonts, media
5. **SEO injection** — meta tags, structured data, canonical URLs
6. **Analytics injection** — GA, Meta Pixel tracking scripts
7. **Form integration** — Formspree submission endpoints
8. **Payment integration** — Stripe scripts (if e-commerce)
9. **CMS data resolution** — Static content from CMS bindings
10. **Sitemap generation** — XML sitemap from page routes
11. **Code quality check** — lint, format, score
12. **Minification** — HTML/CSS/JS compression
13. **ZIP bundling** — Package all files in project structure

## Business Rules

1. Export generates standalone, deployable code — no runtime dependencies on the editor
2. CMS data is exported as static content (not dynamic) unless CMS mode is "template"
3. **Design tokens are ALWAYS exported as CSS custom properties** — never as hardcoded values
4. Multi-page projects export multiple files with shared CSS and component library
5. Asset paths are relative within the ZIP structure
6. Custom CSS/JS from Settings → Advanced is included in export
7. Export respects current project settings (analytics IDs, integrations, etc.)
8. **Generated code must pass ESLint + Prettier** — the output is run through formatting before display/download
9. **Component-structured file organization** — elements grouped into `components/`, `pages/`, `styles/` directories, not flat HTML dumps
10. **Code Quality Score is always visible** — builds developer confidence and catches issues before handoff

## Screen Relationships
- **From:** Header export button, Settings tab (export preferences)
- **Data coupling:** Uses ExportEngine + all project data from Composer; settings from ProjectSettings; design tokens from GlobalStyleManager
