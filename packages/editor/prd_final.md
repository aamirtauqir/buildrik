# Buildrik / Aquibra Studio - Final Clean PRD

## 1. Product Overview

Buildrik / Aquibra Studio is a professional visual web editor for building and maintaining multi-page websites. It combines canvas-based editing with structured controls for pages, styles, tokens, media, CMS data, publishing, and version history. The product is designed for professional creators and embedded SaaS workflows that need speed, consistency, and publish confidence without direct hand-coding.

## 2. Objectives

- Make advanced functionality easier to discover without reducing capability
- Create one consistent editor architecture across navigation, canvas, and inspector
- Improve trust with clear save, history, preview, and publish behavior
- Make CMS, collaboration, AI, and export usable through complete workflows
- Keep the product scalable for advanced users while remaining learnable for new ones

## 3. User Types and Roles

### Personas

- Professional designer / freelancer
- SaaS admin or embedded editor operator
- Content editor maintaining an existing site

### Roles

| Role | Primary permissions |
|---|---|
| Owner/Admin | Full project, publish, billing, settings, collaboration, restore |
| Editor | Content and layout editing, media, components, tokens, CMS within assigned scope |
| Viewer/Reviewer | Read-only project access and preview |

## 4. Information Architecture

### Editor shell

- Top bar
- Left rail
- Left module panel
- Canvas
- Right inspector

### Rail modules

1. Add
2. Templates
3. Layers
4. Pages
5. Components
6. Media
7. Design
8. Settings
9. Publish
10. History

### Navigation rules

- Only one left module panel is open at a time
- Top-bar buttons may open modules, but modules remain the canonical home
- Command palette is a universal launcher, not a second IA

## 5. Core Product Requirements

### 5.1 Shell and status

- Save status is always visible
- Undo and redo are always available when relevant
- Device preview switching is visible and fast
- Collaboration presence appears only when active
- Offline, reconnecting, and failed-save states are explicit

### 5.2 Canvas

- Users can select, multi-select, drag, resize, inline-edit text, and access context actions
- Canvas supports guides, spacing indicators, snap lines, and optional advanced overlays
- Empty canvas state offers `Start from template` and `Add first element`
- Canvas output should closely match preview and published output

### 5.3 Inspector

- Inspector supports empty, single-select, multi-select, bound, and component-instance states
- Tabs: Layout, Style, Effects
- Fields use clear CSS-like language where appropriate
- Breakpoint overrides and pseudo-state edits are visible, editable, and reversible
- Bindable properties expose CMS actions inline

### 5.4 Pages

- Users can add, rename, duplicate, reorder, and delete pages
- Page settings include slug, SEO, social preview, and advanced metadata
- Page metadata feeds publish validation

### 5.5 Templates

- Users can browse, filter, preview, and apply templates
- Templates can be applied as full-page replacements or inserted as sections
- Applying a template shows progress and handles errors safely

### 5.6 Components

- Users can create reusable components from selections
- Components have a dedicated library
- Instances support overrides, reset, detach, and variants
- Add panel may show recent components for quick insertion

### 5.7 Media

- Users can upload, browse, search, and reuse assets
- Validation covers file type and file size
- Media workflows include loading, progress, failure, retry, and success states

### 5.8 Design System

- Users can manage color, typography, and spacing tokens
- Token changes are drafted before global apply
- Users can review impact before applying
- Token export is available from the design system area

### 5.9 CMS and Data Binding

- Users can create collections and schemas
- Users can create, import, edit, and delete records
- Bindable fields surface a binding control in the inspector
- Only compatible collection fields appear for each property
- Canvas can preview bound records before publish
- The system warns before schema changes that would break existing bindings

### 5.10 Publish, Preview, and Export

- Preview opens a published-equivalent view without editor UI
- Publish module shows draft/published state, URL, checklist, and last publish timestamp
- Checklist items use real project data
- Update and unpublish flows are supported
- Export formats live in the same module, with format-specific options where supported

### 5.11 History and Recovery

- Auto-save is the default persistence mechanism
- Manual save triggers immediate persistence
- Named versions, auto-saves, compare, and restore are available
- Restoring creates a safety snapshot first
- Crash or reload recovery is clearly communicated

### 5.12 Collaboration

- Owners/Admins can invite collaborators
- Presence and cursors are visible when collaboration is active
- Access is role-based
- Disconnects show reconnect or offline states without throwing users out of the editor

### 5.13 AI

- Quick assistant improves selected elements
- Copilot supports section or page generation
- Inspector suggestions surface contextual AI opportunities
- All AI output uses preview-before-apply
- AI failures do not block core editing

### 5.14 Settings and Billing

- Settings cover project/site configuration, integrations, and advanced code controls
- Billing and plan limits are handled consistently and permission-aware
- Export is not owned by Settings

## 6. Primary User Flows

### New project

1. Create or open project
2. Choose template or blank
3. Add content to canvas
4. Style via inspector
5. Preview
6. Publish

### Existing project edit

1. Open project
2. Continue from last saved state
3. Edit structure or content
4. Auto-save persists changes
5. Preview or update publish

### CMS setup

1. Add CMS-enabled element
2. Create or select collection
3. Add or import records
4. Bind fields in inspector
5. Preview record output
6. Publish

### Collaboration

1. Invite collaborator
2. Collaborator joins with assigned role
3. Presence and cursors appear
4. Users edit safely with conflict feedback

### Restore version

1. Open History
2. Review version metadata or diff
3. Confirm restore
4. Safety snapshot is created
5. Project restores with success feedback

## 7. Screen and State Requirements

Every major module must support:
- Empty
- Loading
- Error
- Success
- Confirmation for destructive actions

Global states:
- Project loading
- Save pending
- Saved
- Save failed
- Offline / reconnecting
- Permission denied
- Plan-gated
- Recovery available

## 8. Functional Rules

- Successful auto-save clears pending-change state unless newer edits exist
- Manual save provides explicit immediate feedback
- Delete, unpublish, restore, and schema-breaking changes require confirmation
- Publish validation must read real data, not placeholders
- CMS binding options must be type-compatible
- Role permissions must be enforced consistently across UI and backend

## 9. Validation Rules

- Slugs must be unique within a project
- Metadata fields must validate inline
- Uploads must validate size and type before processing
- Export requires a valid format and at least one selected page where applicable
- AI generation requires a valid prompt and supported context

## 10. Permissions and Access

| Capability | Owner/Admin | Editor | Viewer/Reviewer |
|---|---|---|---|
| Edit canvas and styles | Yes | Yes | No |
| Manage pages | Yes | Yes | No |
| Publish / unpublish | Yes | Optional by permission | No |
| Manage collaborators | Yes | No | No |
| Manage billing and plan | Yes | No | No |
| Restore versions | Yes | Optional by permission | No |
| Edit domains / advanced code | Yes | No | No |

## 11. Notifications and Feedback

- Save state is persistent in the shell
- Publish and export show progress and final outcome
- Recoverable failures offer retry
- Success messages are brief and non-blocking
- Long-running tasks expose visible progress

## 12. Edge Cases

- Offline while editing
- Save failure during active editing
- Publish failure after checklist passes
- Restore with missing assets
- CMS collection deleted while bound
- Collaborator loses access mid-session
- AI service unavailable
- Template application interrupted

## 13. Dependencies

- Composer engine managers
- Storage and sync services
- Export engine
- CMS binding services
- Collaboration transport
- AI services
- Theme and token system

## 14. Assumptions

- Existing engine capabilities remain intact and only require better product surfaces
- The fourth responsive slot remains technically available but is treated as advanced compact preview
- Export and publish infrastructure remain available in the current stack

## 15. Open Questions

1. Which export formats ship as GA versus beta?
2. Should Editor role include publish by default?
3. How much CMS volume is included by plan?
4. Which AI capabilities are production-ready for launch?
5. Is the fourth breakpoint shown by default or hidden under advanced preview controls?

## 16. Acceptance Criteria

- A user can build, preview, and publish a site in one coherent workflow
- The editor has one consistent IA with no conflicting tab definitions
- Save, restore, and publish behavior are always understandable
- CMS workflows operate end-to-end
- Role permissions are explicit and enforceable
- Collaboration and AI degrade gracefully when unavailable
- The PRD can be handed to design and engineering without contradictory behavior definitions
