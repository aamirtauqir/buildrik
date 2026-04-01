# Buildrik / Aquibra Studio - PRD Audit and Clean Rewrite

## A. Product Understanding

### What this product is

Buildrik / Aquibra Studio is a professional visual website builder delivered as an embedded React editor. It lets teams design, structure, style, preview, publish, and optionally export multi-page websites without hand-coding layout or content.

### What problem it solves

The product solves the gap between powerful web design capability and low-confidence execution. Users need a tool that is faster than hand-coding, more structured than generic no-code tools, and reliable enough for real client or business sites. The core value is not "easy drag and drop"; it is "professional website production with visual speed and code-like control."

### Who the user is

Primary user:
- Professional web designers, freelancers, and design-savvy marketers building marketing sites, landing pages, and small business websites.

Secondary user:
- SaaS teams embedding the editor into their own product to let their users create or manage branded sites.

Tertiary user:
- Lightweight content operators who update pages, copy, images, and CMS-driven content after the initial site structure is created.

### Main user goals / jobs to be done

Core jobs to be done:
- Create or update a multi-page website visually without losing CSS-level control.
- Reuse components, tokens, and templates to ship faster and stay consistent.
- Manage page structure, content, media, and CMS bindings from one editor.
- Preview responsive output accurately before publishing.
- Publish or export with confidence and without fear of losing work.
- Collaborate safely with teammates when needed.

---

## B. PRD Audit Report

| Issue title | Category | Severity | Why it is a problem | Recommended fix |
|---|---|---|---|---|
| Mixed document purposes | Scope | Critical | The current file mixes audit findings, target-state PRD, stitch brief, and validation checklist into one artifact. There is no single source of truth. | Split concerns: keep one authoritative PRD, move audit notes and validation checklist to appendices or separate docs. |
| Contradictory navigation model | Flow | Critical | The document alternates between 8-tab and 10-tab navigation, and conflicts on whether Components and Publish are dedicated tabs or merged elsewhere. | Define one IA only. Recommended: 10 sidebar tabs in the rail, with top-bar buttons opening their related modules instead of creating duplicate flows. |
| Conflicting viewport and shell rules | UI | High | The PRD says minimum width is 1024px in some places and 1280px elsewhere. Panel defaults alternate between 280px and 320px. | Create one shell spec with a single minimum supported width and one default panel width system. |
| Save model undermines trust | Functional | Critical | The save state machine says auto-save succeeds but the document remains "dirty" until manual save. That makes save status ambiguous and breaks user trust. | Make auto-save the canonical persistence path. Manual save should trigger immediate persistence, not a separate truth state. |
| User strategy is not aligned | Product | High | The doc says the product is not for beginners, but also gives heavy emphasis to first-time onboarding and casual creators. This creates design conflict. | Clarify primary persona as professional creator, with optional onboarding for lighter users. |
| Onboarding is inconsistent | Flow | High | The PRD references both a 5-step and 7-step checklist, and the code already has a different step model. | Normalize onboarding to one step model and make it optional after the first action. |
| Duplicate entry points violate product clarity | Product | High | Some actions appear in multiple places without clear hierarchy, such as Publish, Components, Export, and AI. This violates the principle of "one action, one place." | Keep one canonical place per task and allow secondary shortcuts only as launchers into that canonical module. |
| Roles and permissions are missing | Product | Critical | Collaboration, publish, settings, billing, domains, CMS governance, and restore actions all need role rules, but the document does not define them. | Add Owner/Admin, Editor, and Viewer/Reviewer roles with module-level permissions. |
| Plan-gating logic conflicts with "no regression" | Logic | High | The PRD says no previously free capability can become gated, but also defines broad gating without clearly separating new paid features from existing ones. | Move plan gating into one billing section and explicitly mark only new premium capabilities as gated. |
| CMS is powerful but operationally incomplete | Functional | High | CMS binding is described, but collection governance, record management, destructive schema changes, and publish behavior for empty data are not fully defined. | Add collection CRUD, record CRUD, field compatibility, delete-impact handling, and empty dataset behavior. |
| Collaboration flows are incomplete | Flow | High | Presence and cursors are described, but invite flow, access level, reconnect, and concurrent edit conflict ownership are not operationalized. | Add explicit collaboration flow with invitation, role assignment, conflict messaging, and reconnect handling. |
| Breakpoint strategy is unrealistic | Scope | Medium | "Watch" is treated as a first-class responsive breakpoint for a website builder. That is likely a technical artifact, not a real product need. | Reframe the fourth breakpoint as optional "XS / Compact preview" or custom breakpoint, not a core JTBD. |
| Over-specification reduces maintainability | Scope | Medium | The PRD contains many pixel-level visual specs, animation timings, and implementation details that belong in design specs, not product requirements. | Keep the PRD outcome-focused. Move detailed visual tokens and motion values to design system specs. |
| Acceptance criteria are fragmented | Functional | Medium | Validation exists, but it is spread across anti-regression notes, stitch constraints, checklists, and metrics. | Replace with module-level acceptance criteria and one central release checklist. |
| Settings scope is overloaded | Product | Medium | Settings includes site config, domains, analytics, integrations, export, advanced code, and gating logic. That is too broad and weakens discoverability. | Split Settings into Project Settings, Site Settings, and Billing/Plan where needed. Export should live under Publish & Export, not Settings. |
| Plugin system is named but not productized | Scope | Low | The PRD treats PluginManager like a user-facing module, but there is no plugin UX or roadmap boundary. | Keep plugin extensibility as an engine capability and future-scope item, not a core surface in this PRD. |

---

## C. Feature Cleanup

### Valid core features

1. Editor shell and navigation
2. Canvas editing
3. Right-side inspector and contextual properties
4. Pages management
5. Templates
6. Components library
7. Media library
8. Design system and tokens
9. Publish, preview, and export
10. History, recovery, and restore
11. CMS and data binding

### Valid secondary features

1. Collaboration
2. AI assistance
3. Onboarding
4. Billing and plan gating
5. Advanced code injection
6. White-label embedding support

### Duplicate or overlapping features to merge

| Overlap | Cleanup decision |
|---|---|
| Publish button in top bar vs Publish tab | Keep Publish as a dedicated module. The top-bar button opens the Publish tab. |
| Components tab vs "My Components" in Add tab | Keep the Components tab as the canonical library. Keep "My Components" in Add as a quick insert section only. |
| Export in Settings vs Export modal | Keep Export inside the Publish & Export module only. Remove it from Settings. |
| AI button, AI suggestions, Copilot entry points | Keep three surfaces but define hierarchy: quick assist for element-level tasks, Copilot for page generation, inspector suggestions for contextual tweaks. |
| Command palette vs rail navigation | Command palette is a universal launcher, not a replacement for module ownership. |

### Core vs secondary hierarchy

Core for MVP-quality shipping:
- Shell
- Canvas
- Inspector
- Pages
- Templates
- Media
- Components
- Design tokens
- Publish / Preview
- History
- CMS

Secondary but important:
- Collaboration
- AI
- Onboarding
- Billing / plan gating

Future or engine-only:
- Plugin marketplace
- Comments / annotations
- Mobile editor

### Removed or corrected items

| Item | Correction |
|---|---|
| 8-tab architecture | Removed. Final IA uses 10 tabs because that matches current product direction and code structure better. |
| "Watch" as a core web breakpoint | Corrected to "XS / Compact preview" as an advanced fourth preview mode, not a mainstream destination device. |
| Export under Settings | Removed. Export is part of Publish & Export. |
| Auto-save that still leaves project dirty | Corrected. Successful auto-save clears pending changes if no newer edits exist. |
| Multiple mixed outputs in one PRD | Removed from the clean PRD. Audit and validation stay separate from final requirements. |

---

## D. UX / Flow Fixes

### Correct user journey

Primary journey:
1. Open or create a project
2. Choose a starting point: template or blank
3. Add or edit structure on the canvas
4. Style via the inspector
5. Manage pages, components, media, and tokens as needed
6. Preview responsive output
7. Publish or export
8. Recover, compare, or restore via history when needed

### Main flow 1: Create first site

1. User enters editor and sees project loader
2. If project is new, user chooses `Start from template` or `Start blank`
3. Template path opens template browser and preview before apply
4. Blank path opens empty canvas with guided CTA and Add tab focus
5. User adds content, edits text, changes styles
6. User previews the site
7. User opens Publish, resolves checklist issues, and publishes

Required states:
- Loading: project shell skeleton, template grid skeleton
- Empty: blank canvas CTA, no templates, no media
- Error: project load failed, template apply failed, publish failed
- Success: template applied, project saved, site published
- Confirmation: publish, unpublish, discard unsaved modal edits

### Main flow 2: Daily editing

1. User opens an existing project
2. Last saved state loads and save status is visible immediately
3. User selects an element, edits styles, duplicates, reorders, or changes layout
4. Auto-save persists changes in the background
5. User previews and optionally updates the published site

Required states:
- Loading existing project
- Save pending
- Save success
- Save failed with retry
- Offline with queued local changes

### Main flow 3: CMS setup and binding

1. User inserts a CMS List or CMS-enabled element
2. If no collection exists, the collection setup flow opens
3. User defines fields and creates or selects a collection
4. User adds or imports records
5. User binds element properties through inspector chain controls
6. User previews records in canvas preview mode
7. User publishes and the site resolves live data correctly

Edge cases:
- No collections exist
- Collection exists but has no records
- Incompatible field type for selected property
- Bound field deleted from schema
- Collection deletion impacts bound pages

### Main flow 4: Collaboration

1. Owner/Admin invites collaborator
2. Collaborator enters project based on assigned role
3. Presence appears in top bar; cursors appear on canvas
4. Concurrent edits surface non-blocking awareness
5. Conflicts use last-write-wins at low-risk property level, but destructive actions require confirmation
6. Disconnect switches user into offline or reconnecting state without forcing editor exit

Edge cases:
- Invite accepted after link expiry
- User loses permission mid-session
- Two users modify the same property simultaneously
- User reconnects after offline changes

### Main flow 5: Restore version

1. User opens History
2. User selects a named version or auto-save
3. User reviews metadata and, where available, a diff summary
4. User confirms restore
5. Current draft is snapshotted automatically before restore
6. Restore completes and user gets clear success feedback

Edge cases:
- Restore fails due to corrupt snapshot
- Version references missing assets
- User lacks restore permission

### Role-based behavior

| Role | Can edit | Can publish | Can manage settings | Can manage collaborators | Can restore versions |
|---|---|---|---|---|---|
| Owner/Admin | Yes | Yes | Yes | Yes | Yes |
| Editor | Yes | Optional by permission | No | No | Yes, if allowed |
| Viewer/Reviewer | No, read-only | No | No | No | No |

### Required state coverage

Every major module must define:
- Empty state
- Loading state
- Error state
- Success feedback
- Destructive confirmation

Modules that must explicitly support all five:
- Project loading
- Templates
- Media
- CMS
- Publish / Export
- History restore
- Collaboration reconnect
- AI generation

---

## E. Rewritten PRD

### Product overview

Buildrik / Aquibra Studio is a professional visual web editor for designing, structuring, styling, previewing, publishing, and exporting multi-page websites. The editor is intended for professional creators and embedded-product teams who need a visually driven workflow without sacrificing control, consistency, or publish confidence.

### Objectives

Primary objectives:
- Make the editor discoverable and fast without removing depth
- Preserve advanced functionality already present in the engine
- Create one clear information architecture for all editor tasks
- Improve publish confidence through strong save, preview, and history behavior
- Make CMS, collaboration, AI, and token systems usable, not just technically present

Non-goals:
- Mobile editing
- Public plugin marketplace
- Real-time comments or annotations in this release
- Reimagining the product into a beginner-first no-code toy

### User types / roles

Primary personas:
- Professional designer / freelancer
- SaaS product operator or embedded-tool admin
- Content editor maintaining an existing site

System roles:
- Owner/Admin
- Editor
- Viewer/Reviewer

### Core modules / features

#### 1. Shell and navigation

Requirements:
- Persistent top bar, left rail, left module panel, central canvas, right inspector
- Rail contains 10 modules: Add, Templates, Layers, Pages, Components, Media, Design, Settings, Publish, History
- Top-bar buttons act as launchers into canonical modules, not parallel systems
- Command palette provides universal access to navigation and actions
- Panel behavior is consistent across modules: open, close, pin, resize, keyboard access

#### 2. Canvas editing

Requirements:
- Supports select, multi-select, drag, resize, duplicate, inline text edit, context menu, and overlap selection
- Shows relevant overlays such as guides, spacing indicators, snap lines, and optional x-ray / rulers
- Empty canvas state helps user choose template or add first element
- Canvas output must match preview and published output closely

#### 3. Inspector

Requirements:
- Contextual inspector with clear empty, single-select, multi-select, and component-instance states
- Three tabs: Layout, Style, Effects
- Property controls use real CSS language where reasonable
- Pseudo-state editing and breakpoint overrides are visible and understandable
- Bindable fields expose CMS binding actions

#### 4. Pages

Requirements:
- Create, rename, reorder, duplicate, delete pages
- Edit page SEO, social metadata, slug, and advanced page settings
- Protect destructive actions with confirmation
- Reflect page-level metadata in Publish validation

#### 5. Templates

Requirements:
- Browse, filter, preview, and apply templates
- Distinguish between page templates and section templates
- Support apply-as-replace and apply-as-section paths
- Show progress and error handling while applying

#### 6. Components

Requirements:
- Dedicated component library for reusable elements
- Create component from current selection
- Browse, insert, rename, duplicate, detach, and inspect component usage
- Support variants and instance overrides
- Add tab may surface recent or favorite components for quick reuse

#### 7. Media

Requirements:
- Upload, browse, search, filter, and select images, videos, icons, and fonts where supported
- Support stock search and local asset library
- Provide image editing and metadata such as alt text where applicable
- Show upload progress, file validation, and retry states

#### 8. Design system and tokens

Requirements:
- Manage color, typography, and spacing tokens
- Show draft changes before apply
- Review token impact before global apply
- Export tokens in supported formats
- Surface token usage and affected elements

#### 9. CMS and data binding

Requirements:
- Create collections and define schema
- Add, edit, delete, and import records
- Bind compatible fields to compatible properties
- Show bound-state badges and unbind action
- Provide record preview navigation on the canvas
- Define behavior for empty collections and schema-breaking changes

#### 10. Publish, preview, and export

Requirements:
- Preview opens published-equivalent rendering without editor chrome
- Publish module shows draft/published state, last published timestamp, URL, and checklist
- Checklist items are wired to real project and page metadata
- Update and unpublish flows exist with feedback and confirmation
- Export supports available formats in one place
- Export and publish each have loading, success, failure, and retry states

#### 11. History and recovery

Requirements:
- Auto-save timeline plus named versions
- Compare, restore, and activity views
- Automatic snapshot before destructive restore
- Recovery messaging after crash or reload

#### 12. Collaboration

Requirements:
- Presence in top bar
- Live cursors and selection awareness on canvas
- Invite flow, reconnect flow, and conflict messaging
- Role-aware access control

#### 13. AI

Requirements:
- Quick assistant for selected-element improvements
- Copilot for full-section or full-page generation
- Inspector-level suggestions where context is obvious
- Preview-before-apply behavior for all AI-generated changes
- Service unavailability must not block non-AI editor usage

#### 14. Settings and billing

Requirements:
- Settings focus on project/site configuration
- Billing and plan gating handled as a separate conceptual area even if surfaced nearby
- Export does not live here
- Advanced code injection remains permission-aware and protected by warnings

### User flows

Required fully documented flows:
- New project setup
- Edit and save
- CMS creation and binding
- Template apply
- Publish and update
- Restore version
- Collaborate in real time
- AI-assisted content or layout generation

### Screen / state requirements

Each module must define:
- Entry state
- Empty state
- Loading state
- Error state
- Success feedback
- Confirmation state for destructive action

Global states:
- Project loading
- Save pending
- Offline / reconnecting
- Permission denied
- Plan-gated
- Fatal recovery state

### Functional requirements

- Auto-save runs in the background and clears pending changes after success
- Manual save triggers immediate persistence and visible feedback
- Publish validation reads actual page and site data
- Role permissions are enforced server-side and reflected client-side
- CMS binding only shows compatible field types
- All destructive actions provide explicit confirmation unless safely undoable
- Command palette and keyboard shortcuts remain available from all major surfaces

### Validation rules

- URLs, slugs, and metadata fields must validate inline
- Media upload must validate file size and type
- CMS schema changes that break bindings must warn before save
- Export must validate supported format, selected pages, and asset availability
- AI actions must validate prompt presence and current scope

### Permissions / access rules

- Owner/Admin: full control
- Editor: edit content and structure, limited settings, publish only if granted
- Viewer/Reviewer: read-only access and preview only
- Billing and plan changes are Owner/Admin only
- Domain, integration, and custom code settings are Owner/Admin only

### Notifications / feedback behavior

- Save status is always visible
- Publish and export show inline progress plus toast confirmation
- Errors are actionable and never silently swallowed
- Success feedback is brief and non-blocking
- Long-running tasks show progress and can surface retry if recoverable

### Edge cases

- Offline during edit or publish
- Reload during unsaved work
- Template apply fails mid-way
- Media asset missing after restore
- CMS field removed while bound
- Permission revoked during active session
- AI unavailable
- Collaboration conflict on the same element or property

### Dependencies

- Existing Composer engine managers
- Storage and sync layers
- Export engine
- CMS binding managers
- AI service availability
- Collaboration transport
- Token and theming system

### Assumptions

- The current engine supports the documented advanced features, but the product UI needs normalization
- The fourth responsive profile exists technically; it is treated as advanced compact preview, not a core promise for mainstream users
- Publish and export continue to use existing backend / storage infrastructure

### Open questions

1. Which export formats are fully supported at launch versus beta-labeled?
2. Should Editors be allowed to publish by default, or only via explicit workspace permission?
3. Is the fourth breakpoint marketed at all, or kept as an advanced preview option?
4. Which AI capabilities are truly production-ready versus staged rollout?
5. Is CMS available on all plans, or is some record volume / collection count tiered?

### Acceptance criteria

- A new user can create a project, add content, preview, and publish without leaving the editor
- A professional user can find any primary feature within 3 clicks or one shortcut
- Save state is always understandable: pending, saved, offline, or failed
- Publish checklist is data-backed and not hardcoded
- CMS binding works end-to-end from collection setup to published output
- Role permissions prevent unauthorized publish, settings, and billing actions
- Collaboration failures degrade gracefully without data loss
- The final PRD contains no contradictory IA, dimension, or role definitions

---

## F. Product Design Improvements

1. Treat the editor as a professional production tool, not a feature showcase. Reduce chrome noise and make the canvas and inspector the main stage.
2. Define one canonical home per action. Secondary entry points should launch the canonical module, not create parallel behavior.
3. Make the inspector truly contextual. Showing fewer but more relevant controls is better than dumping all sections at once.
4. Turn onboarding into a lightweight task coach, not a mandatory ceremony. Professional users should be able to dismiss it quickly without losing power.
5. Rename the fourth breakpoint away from "Watch" unless the business truly targets watch-class websites. "XS / Compact preview" is clearer and more realistic.
6. Split product requirements from visual specs. PRD should define behavior, ownership, permissions, and outcomes; design system docs should define exact spacing, tokens, and motion.
7. Centralize status communication. Save, sync, publish, export, AI, and collaboration all need a shared feedback model so the product feels coherent.
8. Move billing and plan gates into one framework. Users should understand what is locked, why, and what happens next without product contradictions.

---

## G. Final Clean Version

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
