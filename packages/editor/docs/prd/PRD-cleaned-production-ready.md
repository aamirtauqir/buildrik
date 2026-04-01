# Aquibra Studio — Production-Ready PRD

## A. Product Overview

### What the Product Is
Aquibra Studio is a professional **visual web editor** for building and maintaining multi-page websites. It provides a canvas-based editing experience with structured controls for pages, styles, design tokens, media, CMS data, publishing, and version history.

### Problems Solved
- Enables professional creators to build websites without hand-coding
- Provides publish confidence with clear save, preview, and publish workflows
- Supports embedded SaaS workflows requiring speed, consistency, and multi-user collaboration
- Makes advanced functionality discoverable while remaining learnable for new users

### Primary Users
1. **Professional Designers / Freelancers** — Build client sites or personal projects
2. **SaaS Admins / Embedded Editor Operators** — Configure and maintain embedded editor instances
3. **Content Editors** — Maintain existing sites, update content, manage media

### Key Goals
1. One consistent editor architecture across navigation, canvas, and inspector
2. Clear save, history, preview, and publish behavior that builds user trust
3. Complete workflows for CMS, collaboration, AI, and export
4. Scalable for advanced users while remaining learnable for new users

---

## B. Scope

### In Scope
- Canvas-based visual editing with drag, resize, inline-edit
- Multi-page project management
- Design token system (colors, typography, spacing)
- Media library with upload, browse, search
- CMS collections, schemas, records, and field binding
- Publish/preview/export functionality
- Version history with restore capability
- Real-time collaboration (presence, cursors, locking)
- AI-assisted content generation (quick assistant, copilot, inspector suggestions)
- Role-based access control (Owner, Editor, Viewer)
- Project settings, SEO configuration, integrations

### Out of Scope
- Frontend code export (handled by separate export engine, not this PRD)
- Backend infrastructure (deployment, CDN, hosting)
- User authentication system (handled by auth service)
- Billing payment processing (handled by billing service)
- Email/SMS notifications (handled by notification service)
- Analytics computation and reporting (external tool integration only)

---

## C. User Roles and Permissions

### Role Definitions

| Role | Description | Typical Users |
|------|-------------|---------------|
| **Owner** | Full project control, billing, settings | Project creator, team lead |
| **Editor** | Content and layout editing within assigned scope | Content creators, designers |
| **Viewer** | Read-only access and preview | Stakeholders, clients |

### Permission Matrix

| Capability | Owner/Admin | Editor | Viewer |
|------------|:------------:|:------:|:------:|
| **Canvas & Styling** | ✓ | ✓ | ✗ |
| **Page Management** (CRUD) | ✓ | ✓ | ✗ |
| **Publish / Unpublish** | ✓ | By permission* | ✗ |
| **Manage Collaborators** | ✓ | ✗ | ✗ |
| **View/Edit Billing** | ✓ | ✗ | ✗ |
| **Restore Versions** | ✓ | By permission* | ✗ |
| **Edit Domains / Advanced Code** | ✓ | ✗ | ✗ |
| **Manage CMS Collections** | ✓ | By permission* | ✗ |
| **Manage Media** | ✓ | ✓ | ✗ |
| **Edit Design Tokens** | ✓ | ✓ | ✗ |
| **View Project** | ✓ | ✓ | ✓ |
| **Preview Published Site** | ✓ | ✓ | ✓ |

*Default is "No" — explicit permission grant required for optional capabilities.

### Permission Inheritance Rules
- Owner can grant Editor publish, restore, and CMS permissions
- Viewer can only be promoted to Editor by Owner
- Role changes take effect immediately; no pending state

---

## D. Core Entities / Data Objects

### Project
```typescript
interface Project {
  id: string;
  name: string;
  version: string;
  pages: Page[];
  styles: Style[];
  assets: Asset[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}
```

### Page
```typescript
interface Page {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
  root: Element;
  styles: Style[];
  settings: PageSettings;
}
```

### Element
```typescript
interface Element {
  id: string;
  type: string;
  children?: Element[];
  styles: StyleProperties;
  content?: string;
  bindings?: CMSBinding[];
}
```

### Design Token
```typescript
interface DesignToken {
  id: string;
  name: string;
  value: string;
  category: "colors" | "typography" | "spacing" | "effects";
}
```

### CMS Collection
```typescript
interface CMSCollection {
  id: string;
  name: string;
  slug: string;
  fields: CMSField[];
  createdAt: string;
  updatedAt: string;
}
```

### CMS Field
```typescript
interface CMSField {
  id: string;
  name: string;
  slug: string;
  type: "text" | "textarea" | "richtext" | "number" | "date" | "boolean" | "select" | "image" | "reference" | ...;
  validation?: { required?: boolean; min?: number; max?: number; pattern?: string; };
  options?: string[];
}
```

### CMS Content Item
```typescript
interface CMSContentItem {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
}
```

### Media Asset
```typescript
interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  type: "image" | "video" | "font" | "file";
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
}
```

### Component
```typescript
interface Component {
  id: string;
  name: string;
  root: Element;
  instances: ComponentInstance[];
  variants?: ComponentVariant[];
}
```

### Version
```typescript
interface Version {
  id: string;
  timestamp: string;
  type: "auto" | "manual" | "named";
  snapshot: ProjectData;
  description?: string;
}
```

### Collaborator
```typescript
interface Collaborator {
  userId: string;
  name: string;
  email: string;
  role: "owner" | "editor" | "viewer";
  avatar?: string;
  joinedAt: string;
}
```

### Relationships
- **Project → Pages**: One-to-many (ordered)
- **Project → Assets**: One-to-many
- **Project → CMS Collections**: One-to-many
- **Project → Components**: One-to-many
- **Page → Elements**: One-to-many (tree structure)
- **Component → Instances**: One-to-many
- **Collection → Content Items**: One-to-many
- **Element → CMS Binding**: Optional

---

## E. Feature Breakdown

### E.1 Shell and Status Bar

**Purpose**: Provide persistent access to core actions and system status.

**User Value**: Users always know save state, can undo/redo, switch devices, see collaborators.

**Logic**:
- Save status: Shows "Saved", "Saving...", "Unsaved changes", or "Save failed"
- Undo/Redo: Enabled when history available; disabled at history boundaries
- Device preview: Dropdown with Desktop (1440px), Tablet (768px), Mobile (375px)
- Collaboration presence: Shows avatars of active collaborators

**Rules**:
- Save status visible in all states
- Undo/Redo: Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z
- Device switch maintains element selection
- Offline state shows reconnecting indicator

---

### E.2 Canvas

**Purpose**: Primary editing surface for visual web page construction.

**User Value**: Drag-and-drop content creation, visual feedback, WYSIWYG editing.

**Logic**:
- Selection: Click to select, Shift+click for multi-select, drag for box select
- Drag: Move selected elements; shows snap guides
- Resize: Drag handles
- Inline-edit: Double-click text elements
- Context menu: Right-click for element-specific actions

**Rules**:
- Breakpoints: Desktop (default), Tablet (768px), Mobile (375px)
- Breakpoint indicator shows current viewport size
- Changes at one breakpoint do not automatically apply to others
- Empty state shows "Start from template" and "Add first element" CTAs

**Actions**: Select, multi-select, drag, resize, inline-edit, context menu, toggle layers (F), zoom

---

### E.3 Inspector (Right Panel)

**Purpose**: Edit selected element properties — layout, appearance, content.

**User Value**: Fine-grained control over every element attribute.

**Logic**:
- **Empty State**: "Select an element to edit its properties"
- **Single Selection**: Shows all editable properties
- **Multi Selection**: Shows common properties only; "Mixed values" where different
- **Bound State**: Shows CMS binding indicator
- **Component Instance**: Shows overrides, reset option, variant selector

**Tabs**:
1. **Layout**: Display, position, size, flexbox/grid, overflow
2. **Appearance**: Background, border, shadow, opacity, transitions
3. **Content**: Text, image src, links, bindings

**Rules**:
- Properties use CSS-like naming
- Breakpoint overrides shown inline with indicator
- Pseudo-states (hover, focus, active) editable and reversible
- Bindable properties show CMS binding icon

---

### E.4 Pages Management

**Purpose**: Create, organize, configure, and delete pages.

**Actions**: Create, rename, duplicate, reorder (drag), delete, set as home, edit settings

**Page Settings Fields**:
- Name (required, max 100 chars)
- Slug (required, unique, auto-generated)
- SEO: meta title, description, OG image, no-index
- Visibility: "live", "hidden", "password"
- Custom head code

**Rules**:
- Slug must be unique within project
- Cannot delete last remaining page
- Home page cannot be hidden

---

### E.5 Templates

**Purpose**: Pre-built page and section templates for rapid creation.

**Actions**: Browse, search, preview, apply as full page or section

**Rules**:
- Application shows progress indicator
- Errors handled gracefully
- Includes placeholder content for replacement

---

### E.6 Components

**Purpose**: Create and manage reusable element patterns.

**Actions**:
- Create from selection
- Browse library
- Insert instance
- Edit component (propagates)
- Override instance properties
- Reset to defaults
- Detach (becomes independent)
- Create/switch variants

**Rules**:
- Root element of selection becomes component root
- Component name required, unique within project
- Maximum nesting depth: 3 levels

---

### E.7 Media Library

**Purpose**: Upload, organize, browse, and manage media assets.

**Actions**: Upload, browse, search, filter, organize in folders, delete, edit, copy URL

**Validation**:
- File types: jpg, png, gif, webp, svg, mp4, webm, pdf
- Max file size: 10MB (configurable per plan)
- Duplicate detection: Warn if same name exists

**States**: Loading, success, error, empty

---

### E.8 Design Tokens

**Purpose**: Manage global design system — colors, typography, spacing.

**Actions**: Add/edit/delete tokens, preview changes, apply globally, export

**Token Workflow**:
1. **Draft**: Changes stored locally, not applied
2. **Preview**: Show impact preview
3. **Apply**: Changes written to project
4. **Cancel**: Discard draft

**Rules**:
- Token names unique within category
- Color values validated as valid hex/rgb/hsl
- Applying overwrites existing token values

---

### E.9 CMS and Data Binding

**Purpose**: Structured content management with canvas binding.

**Collections**: Create collection, define fields (types: text, textarea, richtext, number, date, boolean, select, multiselect, image, file, reference, color, url, email)

**Records**: Add/edit/delete, import CSV, publish/unpublish, archive

**Binding**:
- Select element → Click binding icon → Select collection → Select field
- Type compatibility enforced (image field only for image properties)

**Rules**:
- Collection slug unique within project
- Required fields enforced on save
- Deleting collection with bindings warns user

---

### E.10 Publish, Preview, and Export

**Purpose**: Deploy site and generate output artifacts.

**Preview**: Opens in new tab, published-equivalent view

**Publish**:
- Shows draft/published state
- Displays published URL
- Checklist: Real validation items

**Checklist Items**:
1. All pages have valid slugs
2. All bound CMS fields have data
3. All images have valid sources
4. No broken links (optional)
5. SEO fields complete (optional)

**Actions**: Publish, Update, Unpublish, Preview, Export (HTML, ZIP)

**Rules**:
- Publish requires passing all checklist items
- Unpublish requires confirmation

---

### E.11 History and Recovery

**Purpose**: Version tracking and restore capability.

**Actions**: View versions, compare (diff), restore, create named version, manual save

**Rules**:
- Auto-save: Every 30 seconds when changes exist
- Manual save: Creates version immediately
- Restore: Creates safety snapshot before restoring
- Crash/reload recovery: On reload, detect unsaved changes

**Limits**:
- Max versions: 100 (oldest pruned)
- Named versions never auto-pruned
- Snapshots deleted after 7 days

---

### E.12 Collaboration

**Purpose**: Real-time multi-user editing.

**Actions**: Invite, remove, see presence, see cursors, see selection

**States**: Disconnected, Connecting, Connected, Reconnecting

**Conflict Resolution**:
- Element locking: Visual indicator when user editing
- Lock is visual only (not blocking)
- Simultaneous edits: Last-write-wins with notification

**Rules**:
- Real-time updates (eventual consistency)
- Disconnect shows "Reconnecting" without throwing user out
- Cursor/selection updates throttled (max 10/second)

---

### E.13 AI Features

**Purpose**: Assist content creation and improvement.

**Surfaces**:
1. **Quick Assistant**: Selected element → "Improve" → AI suggestions → Preview → Apply
2. **Copilot**: Describe section/page → AI generates → Insert to canvas
3. **Inspector Suggestions**: Contextual AI in inspector

**Rules**:
- All AI output uses preview-before-apply
- AI failures do not block core editing

---

### E.14 Settings

**Purpose**: Project configuration, integrations, advanced controls.

**Areas**:
1. **Project**: Name, description, favicon, language
2. **SEO**: Site-level SEO defaults
3. **Integrations**: Analytics, email, stripe, custom code
4. **Advanced**: Custom scripts, global CSS
5. **Billing** (Owner only): Plan, payment, usage

**Rules**:
- Advanced code requires confirmation before save
- Billing only visible to Owner

---

## F. User Flows

### F.1 New Project
1. User clicks "New Project"
2. Chooses template or blank
3. Adds content via Add panel
4. Selects element → Inspector edits
5. Clicks Preview
6. Clicks Publish → Enters checklist → Publishes

### F.2 Existing Project Edit
1. Opens project
2. Loads last saved state
3. Edits structure, content, styles
4. Auto-save triggers every 30 seconds
5. Previews to verify
6. Updates publish

### F.3 CMS Setup
1. Creates collection → Defines fields
2. Adds records to collection
3. Selects element in canvas → Inspector
4. Clicks binding icon → Selects collection/field
5. Element displays bound data
6. Previews → Publishes

### F.4 Component Creation
1. Selects elements on canvas
2. Right-clicks → "Create Component"
3. Enters component name
4. Original selection converted to instance

### F.5 Collaboration
1. Owner invites collaborator
2. Collaborator joins → Presence appears
3. See cursors, selections
4. Edits sync in real-time
5. Disconnects show reconnecting state

### F.6 Version Restore
1. Opens History panel
2. Views version list
3. Clicks version to see details
4. Clicks "Compare" for diff
5. Clicks "Restore"
6. Safety snapshot created → Restores

---

## G. Screens / Modules / Functional Areas

- **Top Bar**: Logo, project name, save status, undo/redo, preview, device, collaborators, user menu
- **Left Rail**: Add, Pages, Media, Components, CMS, Tokens, Publish, Settings
- **Left Panel**: Module content varies by rail selection
- **Canvas**: Main editing area with overlays
- **Right Inspector**: Context-sensitive properties

---

## H. States and Feedback

### Global States
| State | UI Behavior |
|-------|-------------|
| Project Loading | Spinner "Loading project..." |
| Save Pending | Status "Saving..." |
| Saved | Status "Saved" with timestamp |
| Save Failed | Status "Save failed" with retry |
| Offline | Banner "You're offline..." |
| Reconnecting | Banner "Reconnecting..." with spinner |
| Permission Denied | Modal "You don't have permission..." |
| Plan Gated | Modal "This feature requires..." |

### Module States
Each module supports: Empty, Loading, Error, Success, Confirmation (for destructive)

---

## I. Validation and Business Rules

### Field Validations
| Field | Rule |
|-------|------|
| Page Name | Required, max 100 chars |
| Page Slug | Required, unique, lowercase alphanumeric with hyphens |
| Project Name | Required, max 50 chars |
| Token Name | Required, unique, max 30 chars, lowercase with hyphens |
| Email | Valid email format |

### Action Restrictions
| Action | Restriction |
|--------|-------------|
| Publish | Must pass all checklist items |
| Delete Page | Cannot delete last page |
| Delete Collection | Warns if bindings exist |
| Restore Version | Creates safety snapshot first |
| Unpublish | Requires confirmation |

---

## J. API / Backend Expectations

### Data Fetching
| Operation | API |
|-----------|-----|
| Load project | GET /projects/{id} |
| List pages | GET /projects/{id}/pages |
| List media | GET /projects/{id}/assets |
| List CMS | GET /projects/{id}/collections |
| List versions | GET /projects/{id}/versions |

### Mutations
| Operation | API |
|-----------|-----|
| Save | POST /projects/{id}/save |
| Publish | POST /projects/{id}/publish |
| Create page | POST /projects/{id}/pages |
| Update element | PATCH /elements/{id} |
| Upload media | POST /projects/{id}/assets |

### Error Handling
| Error | Handling |
|-------|-----------|
| 400 | Inline validation error |
| 401 | Redirect to login |
| 403 | Permission denied modal |
| 404 | "Item not found" with nav |
| 500 | "Something went wrong" with retry |
| Network | Offline indicator, queue for retry |

---

## K. Database / Persistence

### Data to Save
| Entity | When Saved |
|--------|------------|
| Project | On any change |
| Page | On any page change |
| Element | On any element change |
| Token | On apply |
| CMS | On create/update/delete |
| Media | On upload |
| Version | On auto-save or manual |

### Save Triggers
- Auto-save: 30-second interval
- Manual save: User-triggered
- Publish: Full snapshot
- Restore: Safety snapshot first

### Retention
- Auto-save: Latest 100
- Named versions: Forever
- Safety snapshots: 7 days

---

## L. Edge Cases and Failure Handling

| Scenario | Handling |
|----------|----------|
| Offline while editing | Store locally, sync on reconnect |
| Save failure | Show status, allow retry, don't block |
| Publish failure | Show error, keep draft |
| CMS collection deleted | Warn, unbind elements |
| Collaborator access revoked | Complete operation, then show modal |
| AI unavailable | Show message, don't block editing |
| Template interrupted | Show error, retain canvas |
| Missing assets on restore | Show placeholder, log warning |
| Duplicate slug | Show validation error |

---

## M. Non-Functional Requirements

- **Performance**: Load <3s, interaction <100ms, save <500ms
- **Responsiveness**: Zoom 25%-400%, breakpoint switch instant
- **Usability**: Keyboard shortcuts, clear feedback, consistent patterns
- **Accessibility**: WCAG 2.1 AA, keyboard nav, screen reader support
- **Reliability**: Auto-save, crash recovery, graceful degradation

---

## N. Open Questions

### Confirmed
- Editor architecture (rail + canvas + inspector)
- Role definitions and permissions
- CMS field types
- Breakpoints: Desktop, Tablet, Mobile

### Requiring Decision

| # | Question | Impact |
|---|----------|--------|
| 1 | Export formats GA vs beta? | Feature scope |
| 2 | Editor publish default? | Security |
| 3 | CMS volume limits per plan? | Business |
| 4 | AI capabilities launch-ready? | Feature scope |
| 5 | Fourth breakpoint shown? | UI complexity |
| 6 | Undo history steps? | Storage |
| 7 | Auto-save interval? | UX |

---

## O. Acceptance Criteria

- [ ] User can create project from template or blank
- [ ] User can add, edit, delete, reorder pages
- [ ] User can select, move, resize, style elements on canvas
- [ ] Inspector shows relevant properties for selection
- [ ] User can save (auto and manual) with clear status
- [ ] User can preview published-equivalent output
- [ ] User can publish with passing checklist
- [ ] User can unpublish with confirmation
- [ ] Export generates valid output files
- [ ] User can create collections with custom fields
- [ ] User can add/edit/delete records
- [ ] User can bind CMS fields to element properties
- [ ] Type compatibility enforced in binding UI
- [ ] Owner can invite collaborators with roles
- [ ] Collaborators see presence and cursors
- [ ] Disconnects show reconnecting state
- [ ] Auto-save creates versions
- [ ] User can view and restore versions
- [ ] Restore creates safety snapshot
- [ ] Viewer cannot edit
- [ ] Editor cannot access billing
- [ ] Owner has full access