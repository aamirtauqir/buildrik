# Aquibra Studio — Compact PRD

---

## 1. Product Overview

Aquibra Studio is a professional **visual web editor** for building and maintaining multi-page websites. It provides a canvas-based editing experience with structured controls for pages, styles, design tokens, media, CMS data, publishing, and version history.

---

## 2. Problem Statement

Professional creators need to build websites without hand-coding, but existing tools are either too simple (no advanced features) or too complex (hard to learn). Users need:
- Publish confidence with clear save, preview, and publish workflows
- Speed and consistency for embedded SaaS workflows
- Multi-user collaboration without conflicts
- Advanced functionality that remains discoverable and learnable

---

## 3. Goals

1. One consistent editor architecture across navigation, canvas, and inspector
2. Clear save, history, preview, and publish behavior that builds user trust
3. Complete workflows for CMS, collaboration, AI, and export
4. Scalable for advanced users while remaining learnable for new users

---

## 4. Scope

### In Scope
- Canvas-based visual editing (drag, resize, inline-edit)
- Multi-page project management
- Design token system (colors, typography, spacing)
- Media library (upload, browse, search)
- CMS collections, schemas, records, field binding
- Publish/preview/export functionality
- Version history with restore capability
- Real-time collaboration (presence, cursors, locking)
- AI-assisted content generation
- Role-based access control (Owner, Editor, Viewer)
- Project settings, SEO, integrations

### Out of Scope
- Frontend code export (separate engine)
- Backend infrastructure (deployment, CDN, hosting)
- User authentication (auth service)
- Billing payment processing (billing service)
- Email/SMS notifications (notification service)
- Analytics computation (external tool integration)

---

## 5. Users / Roles

| Role | Description | Typical Users |
|------|-------------|---------------|
| **Owner** | Full project control, billing, settings | Project creator, team lead |
| **Editor** | Content and layout editing within scope | Content creators, designers |
| **Viewer** | Read-only access and preview | Stakeholders, clients |

---

## 6. Feature List

1. **Shell & Status** — Save status, undo/redo, device preview, collaboration presence
2. **Canvas** — Select, multi-select, drag, resize, inline-edit, context actions, guides, snap lines
3. **Inspector** — Layout/Appearance/Content tabs, breakpoint overrides, pseudo-states, CMS binding
4. **Pages** — Add, rename, duplicate, reorder, delete, slug, SEO, visibility
5. **Templates** — Browse, filter, preview, apply as full-page or section
6. **Components** — Create from selection, library, instances with overrides/reset/detach/variants
7. **Media** — Upload, browse, search, validate (type/size), progress states
8. **Design Tokens** — Colors, typography, spacing, draft/preview/apply workflow, export
9. **CMS** — Collections, schemas, records, import, bindable fields, type compatibility
10. **Publish** — Preview, draft/published state, URL, checklist, update/unpublish, export
11. **History** — Auto-save, manual save, named versions, compare, restore with safety snapshot
12. **Collaboration** — Invite, presence, cursors, role-based, graceful disconnect
13. **AI** — Quick assistant, copilot, inspector suggestions, preview-before-apply
14. **Settings** — Project config, SEO, integrations, advanced code, billing (Owner only)

---

## 7. Detailed Requirements

### 7.1 Canvas
- Breakpoints: Desktop (1440px), Tablet (768px), Mobile (375px)
- Selection: Click, Shift+click (multi), drag (box)
- Empty state: "Start from template" + "Add first element" CTAs
- Output matches preview and publish

### 7.2 Inspector
- States: Empty, Single, Multi, Bound, Component Instance
- Tabs: Layout, Appearance, Content
- Breakpoint overrides visible, editable, reversible
- Pseudo-states (hover, focus, active) editable
- Bindable properties show CMS binding icon

### 7.3 Pages
- Slug unique within project
- Cannot delete last page
- Home page cannot be hidden

### 7.4 Design Tokens
- Workflow: Draft → Preview → Apply → Cancel
- Token names unique within category
- Color values validated

### 7.5 CMS
- Field types: text, textarea, richtext, number, date, boolean, select, multiselect, image, file, reference, color, url, email
- Type compatibility enforced in binding
- Delete collection warns if bindings exist

### 7.6 Publish
- Checklist: Valid slugs, bound CMS fields have data, valid image sources
- Publish requires passing all checklist items

### 7.7 History
- Auto-save: 30-second interval
- Max versions: 100 (oldest pruned)
- Named versions: Never auto-pruned
- Restore creates safety snapshot first

### 7.8 Collaboration
- Element locking: Visual indicator when user editing
- Conflict: Last-write-wins with notification
- Disconnect: Shows reconnecting, doesn't throw user out

### 7.9 AI
- All output uses preview-before-apply
- Failures don't block core editing

---

## 8. User Flows

### New Project
1. Create/open project
2. Choose template or blank
3. Add content via Add panel
4. Select element → Inspector edits
5. Preview
6. Publish

### CMS Setup
1. Create collection → Define fields
2. Add records to collection
3. Select element → Click binding icon
4. Select collection → Select field
5. Preview → Publish

### Component Creation
1. Select elements on canvas
2. Right-click → "Create Component"
3. Enter component name
4. Original selection becomes instance

### Collaboration
1. Owner invites collaborator (email + role)
2. Collaborator joins → Presence appears
3. See cursors, selections
4. Edits sync in real-time

### Version Restore
1. Open History panel
2. View version list → Click to see details
3. Click "Compare" for diff
4. Click "Restore" → Safety snapshot created
5. Project restores with success feedback

---

## 9. Screen List + States

### Screens
1. **Top Bar** — Logo, project name, save status, undo/redo, preview, device, collaborators, user menu
2. **Left Rail** — Add, Pages, Media, Components, CMS, Tokens, Publish, Settings
3. **Left Panel** — Content varies by rail selection
4. **Canvas** — Main editing area with overlays
5. **Right Inspector** — Context-sensitive properties

### States (Global)
| State | Behavior |
|-------|----------|
| Project Loading | Spinner "Loading project..." |
| Save Pending | Status "Saving..." |
| Saved | Status "Saved" with timestamp |
| Save Failed | Status "Save failed" with retry |
| Offline | Banner "You're offline..." |
| Reconnecting | Banner "Reconnecting..." with spinner |
| Permission Denied | Modal "You don't have permission..." |
| Plan Gated | Modal "This feature requires..." |

### States (Per Module)
Each module must support: Empty, Loading, Error, Success, Confirmation (for destructive)

---

## 10. Business Rules

- Only one left module panel open at a time
- Top-bar buttons may open modules, but modules are canonical home
- Command palette is universal launcher, not second IA
- Successful auto-save clears pending unless newer edits exist
- Delete, unpublish, restore require confirmation
- Publish validation uses real data, not placeholders
- CMS binding options must be type-compatible
- Role permissions enforced consistently (UI + backend)

---

## 11. Validation Rules

| Field | Rule |
|-------|------|
| Page Name | Required, max 100 chars |
| Page Slug | Required, unique within project, lowercase alphanumeric with hyphens |
| Project Name | Required, max 50 chars |
| Media Filename | Required, max 255 chars, allowed: a-z, A-Z, 0-9, -, _ |
| Token Name | Required, unique within category, max 30 chars, lowercase with hyphens |
| CMS Collection Name | Required, max 50 chars |
| Email (collaborator) | Valid email format |

---

## 12. Roles & Permissions

| Capability | Owner | Editor | Viewer |
|------------|:-----:|:------:|:------:|
| Canvas & Styling | ✓ | ✓ | ✗ |
| Page Management | ✓ | ✓ | ✗ |
| Publish / Unpublish | ✓ | By permission* | ✗ |
| Manage Collaborators | ✓ | ✗ | ✗ |
| View/Edit Billing | ✓ | ✗ | ✗ |
| Restore Versions | ✓ | By permission* | ✗ |
| Edit Domains / Advanced Code | ✓ | ✗ | ✗ |
| Manage CMS Collections | ✓ | By permission* | ✗ |
| Manage Media | ✓ | ✓ | ✗ |
| Edit Design Tokens | ✓ | ✓ | ✗ |
| View Project | ✓ | ✓ | ✓ |
| Preview Published Site | ✓ | ✓ | ✓ |

*Default: No — explicit permission required

---

## 13. Data Model Requirements

### Core Entities
- **Project** — id, name, version, pages, styles, assets, settings, createdAt, updatedAt
- **Page** — id, name, slug, isHome, root (Element), styles, settings
- **Element** — id, type, children, styles, content, bindings
- **Design Token** — id, name, value, category (colors/typography/spacing/effects)
- **CMS Collection** — id, name, slug, fields, createdAt, updatedAt
- **CMS Field** — id, name, slug, type, validation, options
- **CMS Content Item** — id, collectionId, data, status (draft/published/archived)
- **Media Asset** — id, filename, url, type, size, dimensions, uploadedAt
- **Component** — id, name, root, instances, variants
- **Version** — id, timestamp, type (auto/manual/named), snapshot, description
- **Collaborator** — userId, name, email, role, avatar, joinedAt

### Relationships
- Project → Pages: One-to-many (ordered)
- Project → Assets, CMS Collections, Components: One-to-many
- Page → Elements: One-to-many (tree)
- Component → Instances: One-to-many
- Collection → Content Items: One-to-many
- Element → CMS Binding: Optional

---

## 14. API Requirements

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
| Save (auto/manual) | POST /projects/{id}/save |
| Publish | POST /projects/{id}/publish |
| Create page | POST /projects/{id}/pages |
| Update element | PATCH /elements/{id} |
| Upload media | POST /projects/{id}/assets |
| Create collection | POST /projects/{id}/collections |

### Error Handling
| Error | Handling |
|-------|----------|
| 400 | Inline validation error |
| 401 | Redirect to login |
| 403 | Permission denied modal |
| 404 | "Item not found" with nav |
| 500 | "Something went wrong" with retry |
| Network | Offline indicator, queue for retry |

### Sync Expectations
- Auto-save: Every 30 seconds (configurable)
- Manual save: Immediate
- Offline changes queued and synced on reconnect

---

## 15. Edge Cases

| Scenario | Handling |
|----------|----------|
| Offline while editing | Store locally, sync on reconnect |
| Save failure | Show status, allow retry, don't block |
| Publish failure | Show error, keep draft state |
| CMS collection deleted | Warn, unbind elements, show placeholder |
| Collaborator access revoked | Complete operation, show modal |
| AI service unavailable | Show message, don't block editing |
| Template application interrupted | Show error, retain canvas |
| Missing assets on restore | Show placeholder, log warning |
| Duplicate slug | Show validation error, suggest alternative |
| Version restore | Creates safety snapshot first |
| Restore with missing assets | Complete regardless, show placeholders |

---

## 16. Acceptance Criteria

### Core Functionality
- [ ] Create project from template or blank
- [ ] Add, edit, delete, reorder pages
- [ ] Select, move, resize, style elements on canvas
- [ ] Inspector shows relevant properties for selection
- [ ] Save (auto and manual) with clear status
- [ ] Preview published-equivalent output
- [ ] Publish with passing checklist
- [ ] Unpublish with confirmation
- [ ] Export generates valid files

### CMS
- [ ] Create collections with custom fields
- [ ] Add/edit/delete records
- [ ] Bind CMS fields to element properties
- [ ] Type compatibility enforced

### Collaboration
- [ ] Owner can invite with roles
- [ ] Presence and cursors visible
- [ ] Reconnecting state on disconnect

### History
- [ ] Auto-save creates versions
- [ ] View and restore versions
- [ ] Restore creates safety snapshot

### Permissions
- [ ] Viewer cannot edit
- [ ] Editor cannot access billing
- [ ] Owner has full access

---

## 17. Assumptions

1. Editor architecture (rail + canvas + inspector) confirmed
2. Role definitions and permissions confirmed
3. CMS field types supported: text, textarea, richtext, number, date, boolean, select, multiselect, image, file, reference, color, url, email
4. Breakpoints: Desktop (1440px), Tablet (768px), Mobile (375px)
5. Auto-save interval: 30 seconds
6. Version history limit: 100 auto-saves
7. Existing engine capabilities intact

---

## 18. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Which export formats ship as GA vs beta? | Feature scope |
| 2 | Should Editor have publish by default? | Security |
| 3 | How much CMS volume included per plan? | Business logic |
| 4 | Which AI capabilities are launch-ready? | Feature scope |
| 5 | Fourth breakpoint shown by default? | UI complexity |
| 6 | Undo history: 50 or 100 steps? | Storage/performance |
| 7 | Auto-save interval configurable? | UX preference |

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-24  
**Status:** Production-Ready PRD