# Aquibra Studio — Revised PRD v2

---

## 1. Product Overview

Aquibra Studio is a professional **drag-and-drop visual web editor** for building and maintaining multi-page websites. It provides a canvas-based editing experience with structured controls for elements, blocks, components, templates, design tokens, media, CMS data, publishing, and version history.

The product supports real-time collaboration, AI-assisted content generation, and provides both hosting and export options.

---

## 2. Problem Statement

Professional creators need to build websites without hand-coding, but existing tools are either too simple (no advanced features) or too complex (hard to learn). Users need:
- Visual drag-and-drop editing that feels intuitive
- Publish confidence with clear save, preview, and publish workflows
- Built-in hosting with custom domain support
- Export options for developers (React/Next.js) or static HTML
- Multi-user collaboration without conflicts
- AI assistance for faster content creation
- Advanced functionality that remains discoverable and learnable

---

## 3. Goals

1. One consistent editor architecture across navigation, canvas, and inspector
2. Clear save, history, preview, and publish behavior that builds user trust
3. Complete workflows for CMS, collaboration, AI, and export
4. Support both beginners (templates, blocks) and advanced users (custom CSS, components)
5. Provide both hosting and export options
6. Scalable for advanced users while remaining learnable for new users

---

## 4. Scope

### In Scope (Phase 1)

**Core Builder:**
- Canvas-based visual editing (drag, resize, inline-edit)
- Multi-page project management
- Element system (text, image, button, div, link, video)
- Block/Section library (hero, pricing, footer, navbar, etc.)
- Component system (user-created reusable patterns)
- Template library (full page layouts)
- Layout system (flexbox, grid, columns)
- Responsive breakpoints (Desktop, Tablet, Mobile)
- Drag-and-drop with snap guides

**Styling:**
- Design token system (colors, typography, spacing)
- Per-element styling (layout, appearance, content)
- Custom CSS support
- Pseudo-states (hover, focus, active)

**Content:**
- Media library (upload, browse, search, folders)
- CMS collections with custom fields
- Data binding (element properties to CMS fields)
- Form builder and submissions

**Output:**
- Built-in hosting with custom domain support
- SSL certificate management
- Publish/preview workflow
- Export: Static HTML/CSS and React/Next.js components

**System:**
- Auto-save with version history
- Undo/redo (100 action limit)
- Real-time collaboration
- Role-based access control
- AI assistance (quick assistant, copilot, inspector suggestions)
- Onboarding experience

### Out of Scope
- Backend infrastructure (deployment handled by hosting service)
- User authentication (handled by auth service)
- Billing payment processing (handled by billing service)
- Email/SMS notifications (handled by notification service)
- Analytics computation (external tool integration only)

---

## 5. Users / Roles

| Role | Description | Typical Users |
|------|-------------|---------------|
| **Owner** | Full project control, billing, collaborators, settings | Project creator, team lead |
| **Editor** | Content and layout editing within scope | Content creators, designers |
| **Viewer** | Read-only access and preview | Stakeholders, clients |

---

## 6. Feature List

### Core Builder Features
1. **Canvas** — Drag-and-drop editing surface
2. **Inspector** — Property panels (Layout, Appearance, Content)
3. **Elements** — Basic building blocks (text, image, button, div, link, video)
4. **Blocks/Sections** — Pre-built content patterns
5. **Components** — User-created reusable patterns
6. **Templates** — Full page layouts
7. **Layout System** — Flexbox, grid, columns
8. **Responsive Breakpoints** — Desktop, Tablet, Mobile

### Styling Features
9. **Design Tokens** — Colors, typography, spacing
10. **Pseudo-states** — Hover, focus, active editing
11. **Custom CSS** — Advanced styling support

### Content Features
12. **Media Library** — Upload, browse, search, folders
13. **CMS** — Collections, fields, records, binding
14. **Form Builder** — Forms, inputs, submissions

### Output Features
15. **Hosting** — Built-in hosting with custom domains
16. **SSL** — Automatic certificate management
17. **Preview** — Published-equivalent view
18. **Publish** — Deploy workflow with checklist
19. **Export** — Static HTML and React/Next.js

### System Features
20. **Auto-save** — Every 30 seconds
21. **Version History** — Restore capability
22. **Undo/Redo** — 100 action limit
23. **Collaboration** — Real-time presence, cursors, locking
24. **AI Assistant** — Quick improve, copilot generation
25. **Onboarding** — Welcome flow, empty states, tooltips

---

## 7. Detailed Requirements

### 7.1 Canvas (Core)

**Purpose**: Primary editing surface for visual web page construction.

**Functionality**:
- Selection: Click (single), Shift+click (multi), drag (box select)
- Drag: Move elements with snap guides
- Resize: Drag handles with aspect ratio lock option
- Inline-edit: Double-click text elements
- Context menu: Right-click for element actions
- Zoom: 25% to 400%
- Pan: Scroll or drag with hand tool

**Breakpoints**:
- Desktop (1440px) — default
- Tablet (768px)
- Mobile (375px)

**Empty State**:
- "Start from template" CTA
- "Add first element" CTA

---

### 7.2 Inspector (Core)

**Purpose**: Edit selected element properties.

**Tabs**:
1. **Layout** — Display, position, size, flexbox/grid, overflow
2. **Appearance** — Background, border, shadow, opacity, transitions
3. **Content** — Text, image src, links, CMS bindings

**Selection States**:
- Empty: "Select an element to edit"
- Single: All properties editable
- Multi: Common properties only, "Mixed" indicator
- Bound: CMS binding indicator
- Component Instance: Overrides, reset, variant selector

**Rules**:
- CSS-like property naming
- Breakpoint overrides shown inline
- Pseudo-states editable and reversible

---

### 7.3 Elements, Blocks, Components, Templates

**Elements** (Basic building blocks):
- Text, Image, Button, Div, Link, Video, Audio, Iframe, SVG, Icon

**Blocks/Sections** (Pre-built patterns):
- Hero sections, Features, Pricing, Footer, Navbar, Testimonials, Contact forms, Blog cards, Team sections, CTA sections

**Components** (User-created):
- Create from selection
- Browse library
- Insert instances
- Edit (propagates to all instances)
- Override per-instance
- Reset to defaults
- Detach (becomes independent)

**Templates** (Full pages):
- Browse by category
- Preview before apply
- Apply as full page or insert as section

---

### 7.4 Layout System

**Flexbox Controls**:
- Direction (row/column)
- Justify content
- Align items
- Wrap
- Gap

**Grid Controls**:
- Columns, rows
- Gap
- Template areas

**Column Layout**:
- Predefined column patterns (1-col, 2-col, 3-col, 4-col)
- Custom column widths

---

### 7.5 Design Tokens

**Categories**:
- Colors (primary, secondary, accent, custom)
- Typography (font family, size, weight, line-height)
- Spacing (scale values)

**Workflow**:
1. Draft — changes stored locally
2. Preview — see impact on elements
3. Apply — write to project
4. Cancel — discard changes

**Rules**:
- Unique names within category
- Color validation (hex/rgb/hsl)
- Apply overwrites existing

---

### 7.6 Media Library

**Actions**:
- Upload (drag-drop, file picker)
- Browse (grid/list view)
- Search by filename
- Filter by type
- Organize in folders
- Edit (crop, resize, rotate)
- Delete with confirmation

**Validation**:
- Types: jpg, png, gif, webp, svg, mp4, webm, pdf
- Max size: 10MB (plan configurable)
- Duplicate warning

---

### 7.7 CMS

**Collections**:
- Create with name/slug
- Define fields (13 types)
- Set display field

**Field Types**:
text, textarea, richtext, number, date, datetime, boolean, select, multiselect, image, file, reference, color, url, email

**Records**:
- CRUD operations
- CSV import
- Publish/unpublish/archive

**Binding**:
- Select element → Click binding icon → Select collection → Select field
- Type compatibility enforced (image field only for image properties)
- Preview bound data in canvas

---

### 7.8 Forms

**Form Builder**:
- Add form element
- Add fields (text, email, select, checkbox, radio, textarea, file)
- Set required/validation
- Configure submit action (email, webhook, CMS)

**Submissions**:
- View in CMS collection
- Export CSV

---

### 7.9 Publish & Hosting

**Hosting**:
- Built-in hosting included
- Custom domain support
- Automatic SSL (Let's Encrypt or similar)
- CDN distribution

**Publish Workflow**:
1. Click Publish
2. Validation checklist runs
3. If pass → deploy
4. If fail → show errors

**Checklist**:
- Valid slugs on all pages
- All CMS bound fields have data
- All images have valid sources
- Required fields complete

**Actions**:
- Publish (first time)
- Update (re-publish)
- Unpublish (take offline)
- Preview (new tab, no editor UI)

---

### 7.10 Export

**Formats**:
1. **Static HTML/CSS** — Complete static site
2. **React Components** — JSX files
3. **Next.js** — Full Next.js project structure

**Options**:
- Include/exclude CMS data
- Minify CSS/JS
- Image handling (inline, external folder)

---

### 7.11 Version History

**Auto-save**:
- Every 30 seconds when changes exist
- Stored locally + synced

**Manual Save**:
- Creates version immediately

**Restore**:
- Select version → View details
- Compare (diff view)
- Restore (creates safety snapshot first)

**Limits**:
- Max versions: 100 (oldest pruned)
- Named versions: Never pruned
- Safety snapshots: Delete after 7 days

---

### 7.12 Undo/Redo

**Limit**: 100 actions

**Behavior**:
- Cmd/Ctrl+Z = Undo
- Cmd/Ctrl+Shift+Z = Redo
- Disabled at boundaries

---

### 7.13 Collaboration

**Features**:
- Invite collaborators (email + role)
- Remove collaborators
- See presence (who's online)
- See cursors (real-time position)
- See selections (what others selected)

**States**:
- Disconnected
- Connecting
- Connected
- Reconnecting

**Conflict Handling**:
- Visual lock indicator when user editing element
- Lock is NOT blocking (visual only)
- Last-write-wins with notification

---

### 7.14 AI Features

**Surfaces**:

1. **Quick Assistant**
   - Select element → Click "Improve"
   - AI suggests improvements
   - Preview → Apply or dismiss

2. **Copilot**
   - Open sidebar panel
   - Describe what you want ("pricing section with 3 tiers")
   - AI generates section
   - Insert to canvas
   - Edit as needed

3. **Inspector Suggestions**
   - Contextual tips in inspector
   - "Try a larger font size" etc.
   - Click to apply

**Implementation**:
- External API (OpenAI GPT-4 or similar)
- Preview-before-apply for all outputs
- Graceful degradation if AI unavailable

---

### 7.15 Onboarding

**Welcome Flow**:
- "Welcome to Aquibra Studio"
- Option 1: "Start from template"
- Option 2: "Start with blank canvas"

**Empty States**:
- Clear CTAs for each empty state
- "Add your first page"
- "Upload your first image"
- "Create your first collection"

**Tooltips**:
- First-time tooltips for key actions
- Dismissable
- Can be re-enabled in settings

---

### 7.16 Settings

**Project Settings**:
- Name, description
- Favicon
- Language

**SEO Defaults**:
- Site name
- Default OG image
- Twitter handle

**Integrations**:
- Google Analytics (ID)
- Google Search Console (verification)
- Custom scripts (head/body)

**Custom CSS**:
- Global CSS editor
- Confirmation required before save

---

## 8. User Flows

### New User Flow
1. Land on dashboard → Click "New Project"
2. Welcome modal: Choose template OR blank
3. If template: Browse → Select → Applied
4. If blank: Empty canvas with "Add element" CTA
5. Add elements/blocks via left panel
6. Select element → Edit in inspector
7. Preview to check
8. Publish

### Returning User Flow
1. Open project
2. Resume from last state (auto-saved)
3. Make edits
4. Auto-save triggers
5. Preview changes
6. Publish update

### CMS Flow
1. Create collection → Add fields
2. Add records
3. Select element in canvas
4. Inspector → Click binding icon
5. Select collection → Select field
6. Canvas shows bound data
7. Preview → Publish

### Component Creation Flow
1. Select elements on canvas
2. Right-click → "Create Component"
3. Enter name
4. Components panel shows new component
5. Original becomes instance
6. Insert more instances anywhere

### Collaboration Flow
1. Owner invites (email + role)
2. Collaborator joins
3. See avatars in top bar
4. See cursors on canvas
5. See selections highlighted
6. Edit simultaneously

### Export Flow
1. Settings → Export
2. Select format (HTML/React/Next.js)
3. Configure options
4. Click Export
5. Download ZIP

---

## 9. Screen List + States

### Screens

| Screen | Description |
|--------|-------------|
| **Top Bar** | Logo, project name, save status, undo/redo, preview, device, collaborators, menu |
| **Left Rail** | Add, Pages, Media, Components, CMS, Tokens, Publish, Settings |
| **Left Panel** | Module content (varies by rail selection) |
| **Canvas** | Main editing area with overlays |
| **Right Inspector** | Property editor (context-sensitive) |

### Global States

| State | Behavior |
|-------|----------|
| Loading | Spinner "Loading..." |
| Save Pending | "Saving..." status |
| Saved | "Saved" with timestamp |
| Save Failed | Error with retry button |
| Offline | Banner, queue changes |
| Reconnecting | Banner with spinner |
| Permission Denied | Modal with message |
| Plan Gated | Modal "Upgrade required" |

### Module States

Each module must support: Empty, Loading, Error, Success, Confirmation (destructive)

---

## 10. Business Rules

- Only one left panel open at a time
- Auto-save clears pending when new edits arrive
- Delete/Restore/Unpublish require confirmation
- Publish requires passing all checklist items
- CMS binding shows only type-compatible fields
- Role permissions enforced on UI and backend

---

## 11. Validation Rules

| Field | Rule |
|-------|------|
| Page Name | Required, max 100 chars |
| Page Slug | Required, unique within project, lowercase alphanumeric + hyphens |
| Project Name | Required, max 50 chars |
| Element Name | Optional, max 50 chars |
| Token Name | Required, unique within category, max 30 chars |
| Collection Slug | Required, unique within project |
| Media Filename | Required, max 255 chars, alphanumeric + -_ |
| Email | Valid email format |
| Custom CSS | Warn before save |

---

## 12. Roles & Permissions

| Capability | Owner | Editor | Viewer |
|------------|:-----:|:------:|:------:|
| Canvas & Styling | ✓ | ✓ | ✗ |
| Page Management | ✓ | ✓ | ✗ |
| Publish / Unpublish | ✓ | * | ✗ |
| Manage Collaborators | ✓ | ✗ | ✗ |
| View Billing | ✓ | ✗ | ✗ |
| Restore Versions | ✓ | * | ✗ |
| Edit Custom Code | ✓ | ✗ | ✗ |
| Manage CMS | ✓ | * | ✗ |
| Manage Media | ✓ | ✓ | ✗ |
| Edit Tokens | ✓ | ✓ | ✗ |
| Export | ✓ | ✓ | ✗ |
| View Project | ✓ | ✓ | ✓ |
| Preview | ✓ | ✓ | ✓ |

* = By explicit permission only

---

## 13. Data Model

### Core Entities
- **Project** — id, name, version, pages, styles, assets, settings
- **Page** — id, name, slug, isHome, root, styles, settings
- **Element** — id, type, children, styles, content, bindings
- **Block/Template** — Pre-defined content patterns
- **Component** — User-created reusable patterns
- **DesignToken** — id, name, value, category
- **CMSCollection** — id, name, slug, fields
- **CMSField** — id, name, slug, type, validation, options
- **CMSContentItem** — id, collectionId, data, status
- **MediaAsset** — id, filename, url, type, size, dimensions
- **Version** — id, timestamp, type, snapshot, description
- **Collaborator** — userId, name, email, role

### Relationships
- Project → Pages (1:m)
- Project → Assets, Collections, Components (1:m)
- Page → Elements (1:m tree)
- Component → Instances (1:m)
- Collection → Items (1:m)
- Element ↔ CMS Binding (optional)

---

## 14. API Requirements

### Fetching
| Operation | API |
|-----------|-----|
| Get project | GET /projects/{id} |
| List pages | GET /projects/{id}/pages |
| List assets | GET /projects/{id}/assets |
| List collections | GET /projects/{id}/collections |
| List versions | GET /projects/{id}/versions |

### Mutations
| Operation | API |
|-----------|-----|
| Save | POST /projects/{id}/save |
| Publish | POST /projects/{id}/publish |
| Export | POST /projects/{id}/export |
| Create page | POST /projects/{id}/pages |
| Update element | PATCH /elements/{id} |
| Upload asset | POST /projects/{id}/assets |

### Error Handling
| Code | Handling |
|------|----------|
| 400 | Inline validation error |
| 401 | Redirect login |
| 403 | Permission modal |
| 404 | Not found |
| 500 | Retry option |

---

## 15. Edge Cases

| Scenario | Handling |
|----------|----------|
| Offline | Queue locally, sync on reconnect |
| Save fails | Show status, allow retry |
| Publish fails | Show errors, keep draft |
| Collection deleted | Warn, unbind elements |
| Collaborator removed | Complete action, show modal |
| AI unavailable | Show message, don't block |
| Template fail | Show error, retain canvas |
| Duplicate slug | Validation error |
| Version restore | Safety snapshot first |

---

## 16. Acceptance Criteria

### Core Builder
- [ ] Create project from template or blank
- [ ] Add, edit, delete, reorder pages
- [ ] Drag-drop elements on canvas
- [ ] Select, move, resize elements
- [ ] Inspector shows relevant properties
- [ ] Breakpoint switching works
- [ ] Undo/redo functional (100 step limit)

### Content
- [ ] Upload and manage media
- [ ] Create CMS collections with fields
- [ ] Add/edit/delete CMS records
- [ ] Bind CMS to elements
- [ ] Create and use components

### Styling
- [ ] Design tokens (colors, typography, spacing)
- [ ] Custom CSS editor
- [ ] Pseudo-state editing
- [ ] Token workflow (draft/preview/apply)

### Output
- [ ] Preview shows published-equivalent
- [ ] Publish with checklist validation
- [ ] Unpublish with confirmation
- [ ] Export HTML works
- [ ] Export React/Next.js works

### Collaboration
- [ ] Invite collaborators
- [ ] See presence and cursors
- [ ] Role permissions enforced
- [ ] Reconnecting state works

### AI
- [ ] Quick assistant works
- [ ] Copilot generates content
- [ ] Inspector suggestions appear
- [ ] Preview-before-apply works

### System
- [ ] Auto-save works
- [ ] Version history shows
- [ ] Restore creates snapshot
- [ ] Onboarding flow works

---

## 17. Assumptions

1. Editor architecture confirmed (rail + canvas + inspector)
2. Role definitions confirmed
3. CMS field types confirmed (13 types)
4. Breakpoints confirmed (Desktop, Tablet, Mobile)
5. Auto-save interval: 30 seconds
6. Undo limit: 100 actions
7. Version history: 100 max auto-saves
8. AI uses external API (OpenAI or similar)
9. Hosting built-in with custom domain support
10. Export supports HTML and React/Next.js

---

## 18. Open Questions (Answered)

| # | Question | Answer |
|---|----------|--------|
| 1 | Export formats? | Both HTML and React/Next.js |
| 2 | Block/Component model? | Elements (basic) → Blocks (pre-built) → Components (user-created) |
| 3 | Undo limit? | 100 actions |
| 4 | Onboarding? | Yes, Phase 1 |
| 5 | AI implementation? | External API, suggestions + generation |

---

**Document Version:** 2.0  
**Last Updated:** 2026-03-24  
**Status:** Revised PRD (Based on product review)