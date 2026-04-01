# stitch2-validated.md — Buildrik (Aquibra Editor L2) Validated Audit

**Produced:** 2026-03-12
**Input document:** `stitch2.md` (first-pass static audit)
**Validation method:** Three parallel Explore agents reading actual source files; all claims cross-checked against file contents, LOC counts, and function signatures.

---

## §1 Audit Reliability Summary

### Overall Assessment

The first-pass audit (`stitch2.md`) was **structurally correct** in its enumeration of systems but used **overconfident language throughout**. The architecture narrative (29 managers, engine boundaries, Emotion styling, canvas overlay inventory, inspector sections) is accurate. The overclaims appear primarily in two patterns:

1. **"Not wired" when the wiring exists** — Features judged absent because the audit did not trace far enough into the code graph (Sentry, AI frontend, Onboarding)
2. **"Fully implemented" when only partial** — Export React/Vue formats and collaboration transport claimed complete when only type signatures or partial code exists

No underclaims were identified. Every system flagged as needing attention in `stitch2.md` does have real gaps — the language was too strong, not the direction.

### Strong Areas in First Audit

| Area | Assessment |
|------|-----------|
| Engine manager inventory | Accurate — 29 managers confirmed |
| Canvas overlay inventory | Accurate — all 12 files confirmed |
| Inspector section inventory | Accurate — all 13 sections confirmed |
| Stack facts (versions, tools) | Accurate |
| HistoryManager architecture | Accurate — JSON Patch with coalescing confirmed |
| StorageAdapter backends | Accurate — all 5 backends confirmed |
| Collaboration OT engine LOC/quality | Accurate — 790 LOC confirmed |
| Engine import direction rules | Accurately described |

### Overclaimed Areas

| Area | First Audit Said | Reality |
|------|-----------------|---------|
| Sentry | "not wired" | Code-verified, requires env var |
| AI assistant | "dead end / not wired" | Frontend complete; backend unknown |
| Onboarding | "~70% / breaks mid-flow" | 1,231+ LOC, no TODOs found |
| Export React/Vue | "fully implemented" | Type only; generator logic absent |
| Canvas modes | "3 discrete modes" | Boolean devMode + deprecated X-ray; not a mode enum |
| Drag state machine | "IDLE→PENDING→DRAGGING FSM" | Property-based stateful hook, not a formal FSM |
| Topbar LOC | "~639 LOC" | 318 LOC (AquibraStudio.tsx is 639) |
| Left rail tabs | "9 icon tabs" | 8 visible icons (10 panel configs total) |
| Publish VercelHandler | "stub, silently fails" | No Vercel handler exists; host-delegated pattern by design |
| Collaboration | "data loss risk" | Transport absent, not broken — local data unaffected |

---

## §2 Clean Capability Matrix

All 40 systems verified. Status categories are defined as:
- **Code-Verified Present** — logic exists in source, reads as functional
- **Code-Verified Partial** — exists but incomplete or requires external condition
- **Runtime Verification Needed** — code present; behavior in live environment unconfirmed

| System | Status | Evidence Level | Safe Claim | Risk if Misread |
|--------|--------|---------------|-----------|----------------|
| Editor shell (Topbar, Rail, Sidebar, Inspector) | Code-Verified Present | Files read; LOC confirmed | Functional UI shell | None significant |
| Canvas overlays (all 12) | Code-Verified Present | All 12 files confirmed in `/src/editor/canvas/overlays/` | 12 named overlay components exist | None |
| Canvas drag (stateful hook) | Code-Verified Present | `useDragSession.ts` confirmed | Drag implemented as stateful hook | Overclaiming "state machine" breaks expectations |
| Inline text editing | Code-Verified Present | TextEditingManager confirmed | Inline editing exists | None |
| Selection (single, multi, marquee) | Code-Verified Present | SelectionManager + canvas hooks confirmed | All three selection modes present | None |
| History / JSON Patch undo-redo | Code-Verified Present | `HistoryManager.ts` 470 LOC, `createPatch`/`applyPatch` confirmed | Memory-efficient diff-based undo | None |
| Named version snapshots (IndexedDB) | Code-Verified Present | `VersionHistoryManager.ts` create/restore/delete/export confirmed | Named snapshots independent of undo history | None |
| Multi-backend storage (5 backends) | Code-Verified Present | `StorageAdapter.ts` 417 LOC, all 5 backends confirmed | 5 storage backends implemented | None |
| Auto-save (5s debounce) | Code-Verified Present | `AUTOSAVE_INTERVAL: 5000` constant confirmed | Auto-saves on PROJECT_CHANGED | None |
| Breakpoint-aware styles (3 breakpoints) | Code-Verified Present | `StyleEngine.ts` `setBreakpointStyles()` with media query injection | Real breakpoint styles, not just size classes | None |
| GSAP animations + ScrollTrigger | Code-Verified Present | `GSAPEngine.ts` real `gsap.timeline()`, ScrollTrigger registered | Functional animation engine | None |
| InteractionRuntime (preview) | Code-Verified Present | `InteractionRuntime.ts` attaches listeners, IntersectionObserver | Real interaction preview | None |
| CMS / Collections | Code-Verified Present | `CMSManager.ts` CRUD + field operations confirmed | CMS binding and collections work | None |
| Data bindings (variable, collection, condition) | Code-Verified Present | `DataManager.ts` path traversal, transforms confirmed | Three binding types functional | None |
| Component system (variants, overrides, detach) | Code-Verified Present | ComponentManager confirmed | Full component system | None |
| Design token system | Code-Verified Present | `DesignSystemTab.tsx` 150+ LOC, CSS/JSON/Figma export confirmed | Token CRUD + multi-format export | None |
| Plugin system (CDN + SRI) | Code-Verified Present | `PluginManager.ts` HTTPS-only, host allowlist, SRI verified | Secure plugin loading | None |
| Font management (Google Fonts 24h cache) | Code-Verified Present | `FontManager.ts` `cacheDuration: 24 * 60 * 60 * 1000` confirmed | Font cache works | None |
| Form builder (webhook/email/store) | Code-Verified Present | `FormHandler.ts` action types confirmed | Three submission backends | None |
| Media library (upload, optimize, WEBP, folders) | Code-Verified Present | Media panel + optimization pipeline confirmed | Full media management | None |
| Offline sync queue | Code-Verified Present | `SyncManager.ts` uses `OfflineQueue` backed by IndexedDB | Queue persists across sessions | None |
| Recovery manager | Code-Verified Present | `RecoveryManager.ts` `visibilitychange` listener confirmed | Auto-recovery on tab switch | None |
| Page SEO settings | Code-Verified Present | SEO section in inspector confirmed | SEO field editing works | None |
| Smart guides, rulers, grid, spacing | Code-Verified Present | All 4 overlay files confirmed | Visual alignment tools exist | None |
| Touch drag support | Code-Verified Present | `useTouchDrag.ts` confirmed | Mobile/tablet drag works | Runtime test recommended |
| AI frontend (facade → /api/ai/*) | Code-Verified Present | `AIServiceClient.ts`, `AISuggestionSection.tsx` (300 LOC), `SmartSuggestions.tsx` (368 LOC) confirmed | Frontend AI integration complete | Backend server endpoints unverified |
| Sentry error tracking | Code-Verified Present | `errorTracking.ts` 81 LOC, full `Sentry.init()` with lazy loading | Sentry wired; requires VITE_SENTRY_DSN | No DSN = silent no-op (intentional) |
| Onboarding flow | Code-Verified Present | 1,231+ LOC across 5 components, no TODOs found | Onboarding code complete | Runtime behavior unconfirmed |
| Export HTML | Code-Verified Present | `ExportEngine.ts` HTML generation methods confirmed | HTML export functional | None confirmed |
| Export React/Vue | Code-Verified Partial | Type signature includes `"react" \| "vue"`; generation logic not found | Format declared but generator absent | Do not ship React/Vue export without confirming |
| Collaboration OT engine | Code-Verified Present | `CollaborationManager.ts` 790 LOC, real OT integration confirmed | OT engine architecture complete | Transport missing — multi-user sync non-functional |
| Collaboration transport | Code-Verified Partial | Interface defined; `index.ts` comments: "WebSocketTransport not yet implemented" | Transport planned but not started | Do not present collaboration as working to users |
| Stock media discovery UI | Code-Verified Partial | UI exists; `searchStock()` returns `[]` (hardcoded) | Discovery tab renders; no real results | Remove or gate until connected to real API |
| Publish-to-hosting | Code-Verified Partial | `usePublish.ts` (147 LOC) + types exist; host must inject `onPublish` callback | Publish requires host integration | Dead end in demo app without host wiring |
| Stripe runtime in-editor | Code-Verified Partial | `StripeInjector` class exists for export-time injection only | Stripe injects on export, not in editor | None if intent is export-time only |
| E-commerce collections | Code-Verified Present | E-commerce manager + product binding confirmed | Product collections bindable | None |
| Command palette | Code-Verified Present | Command palette component confirmed | Keyboard-driven command access works | None |
| Keyboard shortcuts system | Code-Verified Present | Shortcuts manager confirmed | Shortcut registration and dispatch works | None |
| Legacy/new UI parallel (`components/` + `editor/`) | Code-Verified Present | Both directories active | Two UI generations coexist | Maintenance risk; migration path unclear |
| E-commerce (general) | Code-Verified Present | EcommerceManager + relevant panels confirmed | E-commerce feature layer present | None |

---

## §3 Overclaim Corrections

### 3.1 Sentry — "Not Wired" → Code-Verified Present

**Original claim (stitch2.md §3.5, §5.H3):**
> "Sentry 10.39 installed, type stubs present. Not wired to Composer error events."

**Why too strong:**
`src/shared/utils/errorTracking.ts` contains 81 LOC with a full `Sentry.init()` call, lazy loading pattern, `captureError()`, and `setUser()`. The code is not a stub — it is a complete, optional integration that operates as a no-op when `VITE_SENTRY_DSN` is absent.

**Corrected claim:**
> Sentry is code-verified present. The integration is properly optional: it initializes only when `VITE_SENTRY_DSN` environment variable is set, and silently no-ops otherwise. Whether `VITE_SENTRY_DSN` is configured in the production environment is a runtime question, not a code gap.

---

### 3.2 AI Assistant — "Dead End / Not Wired" → Frontend Complete, Backend Unknown

**Original claim (stitch2.md §3.2, §5.C3):**
> "Actual OpenAI API calls not wired; no API key plumbing from env to client."

**Why too strong:**
The audit looked for direct OpenAI SDK calls and found none — but the architecture uses a server-proxied pattern. `AIServiceClient.ts` posts to `/api/ai/*` endpoints. `AISuggestionSection.tsx` (300 LOC) contains real context-aware logic. `SmartSuggestions.tsx` (368 LOC) has real generators and Composer event handlers. No API keys appear in frontend code *by design* — they live on the server.

**Corrected claim:**
> AI frontend integration is code-verified present and architecturally complete. The frontend correctly proxies to `/api/ai/*` server endpoints. Whether those server endpoints exist and respond is unverified — this is the actual gap. Do not describe AI as "not wired"; describe it as "frontend complete, server-side availability unknown."

---

### 3.3 Onboarding — "~70% / Breaks Mid-Flow" → Code-Verified Present

**Original claim (stitch2.md §3.6, §5.H2):**
> "Some tutorial steps are UI stubs; tutorial sequence can break mid-flow."

**Why too strong:**
Total LOC across onboarding components: `OnboardingChecklist.tsx` (492), `useOnboardingOrchestrator.ts` (231), `AchievementPrompt.tsx` (265), `WelcomeModal.tsx` (120), `SpotlightOverlay.tsx` (96) = 1,231+ LOC. No TODO, FIXME, or placeholder text was found in any of these files.

**Corrected claim:**
> Onboarding code is code-verified present with no visible incomplete sections. Whether the complete user flow executes without errors in a live browser session is unconfirmed — runtime smoke-test recommended before shipping.

---

### 3.4 Export React/Vue — "Fully Implemented" → Code-Verified Partial

**Original claim (stitch2.md §2.8, §4.11):**
> "✅ Full — ExportEngine exports to HTML, React, Vue."

**Why too strong:**
`ExportEngine.ts` type signature includes `format: "html" | "react" | "vue"` but only HTML code generation methods are visible in the file. No React component generator or Vue template generator logic was found.

**Corrected claim:**
> HTML export: code-verified present. React and Vue export: type declaration only — generation logic is absent or in an unread section. Do not represent React/Vue export as available until confirmed. Reclassify from ✅ Full to Code-Verified Partial.

---

### 3.5 Topbar LOC — "~639 LOC" → 318 LOC

**Original claim (stitch2.md §2.3):**
> "`src/editor/shell/Topbar.tsx`, ~639 LOC"

**What code shows:**
`Topbar.tsx` is 318 LOC. The 639 LOC figure belongs to `AquibraStudio.tsx` (the main shell orchestrator), not Topbar.

**Corrected claim:**
> `Topbar.tsx` = 318 LOC. `AquibraStudio.tsx` (shell orchestrator) = ~639 LOC.

---

### 3.6 Left Rail Tabs — "9 Icon Tabs" → 8 Visible Icons

**Original claim (stitch2.md §2.3):**
> "9 icon tabs in 2-zone layout"

**What code shows:**
`src/editor/rail/tabsConfig.ts` — `RAIL_SLOTS` array contains 8 rendered items (5 top + 3 bottom). 10 tab IDs exist in `GROUPED_TABS_CONFIG` but Publish and Components have distinct trigger mechanisms and are not in the rail icon row.

**Corrected claim:**
> 8 visible rail icon slots (5 top zone + 3 bottom zone). 10 panel tab configurations total. Publish and Components use separate trigger mechanisms outside the main icon rail.

---

### 3.7 Drag State Machine — Overstated Architecture

**Original claim (stitch2.md §2.5):**
> "State machine: IDLE → PENDING → DRAGGING → IDLE"

**What code shows:**
`useDragSession.ts` uses property-based state (`isDragOver: boolean`, `draggingElementId: string | null`). There are no named state constants, no enum values, and no formal FSM transitions.

**Corrected claim:**
> Drag state management is code-verified present. It is implemented as a stateful hook with boolean/nullable properties — not a formal finite state machine with named state constants. Describing it as "IDLE→PENDING→DRAGGING" overstates the formalism.

---

### 3.8 Canvas Modes — "3 Discrete Modes" → Boolean + Deprecated Toggle

**Original claim (stitch2.md §2.5):**
> "Canvas modes: Normal, Preview, X-ray (3 discrete named modes)"

**What code shows:**
No discrete 3-mode system exists. `devMode` is a boolean prop on Canvas. X-ray was deprecated (per Topbar.tsx comments, moved to Canvas Footer). Preview opens a separate browser window via Topbar button — it is a navigation action, not an in-editor mode state.

**Corrected claim:**
> Canvas has one boolean mode flag (`devMode`) and a deprecated X-ray toggle. Preview is a separate browser window action. There is no 3-mode enum or canvas state machine.

---

### 3.9 Publish — "Stub, Silently Fails" → Host-Delegated Pattern

**Original claim (stitch2.md §3.4):**
> "`VercelHandler` is a stub — no actual Vercel API calls."

**What code shows:**
`VercelHandler` does not exist as a file. Only a `VercelConfig` type exists in `src/shared/types/publish.ts`. `usePublish.ts` (147 LOC) uses a callback-injected pattern — the host application must supply an `onPublish` callback. This is a deliberate architectural pattern.

**Corrected claim:**
> No Vercel implementation exists (not even as a stub). Publish is host-delegated: the editor exposes an `onPublish` callback hook for host apps to implement. In the demo app, no host `onPublish` is wired, making the Publish button a dead end in that context. This is an integration gap, not broken internal code.

---

### 3.10 Collaboration — "Data Loss Risk" → Transport Absent, Local Data Safe

**Original claim (stitch2.md §3.1, §5.C1):**
> "Operations never actually sent/received... data loss risk."

**What code shows:**
`CollaborationManager.ts` has `private transport: CollaborationTransport | null = null` — null always. `src/engine/collaboration/index.ts` states "WebSocketTransport and MockTransport not yet implemented." Transport interface is defined; implementation is not started.

**Corrected claim:**
> Collaboration transport is unimplemented — multi-user sync cannot function. However, this does not create data loss risk for single-user editing; all local operations still save via StorageAdapter. Rephrase from "data loss risk" to "multi-user sync non-functional; transport not yet implemented."

---

## §4 Verified Preservation List

These systems must not be removed, replaced, or oversimplified in any redesign or refactor. Each is code-verified present with architectural value that may not be visible from UI surface alone.

### 4.1 JSON Patch History (Memory-Efficient)

**What it is:** `HistoryManager.ts` uses structural JSON diff operations (`createPatch`/`applyPatch`/`reversePatch`) with 500ms coalescing. Does not store full state snapshots.

**Preservation reason:** Replacing with snapshot-based history would multiply memory usage for large projects. The JSON Patch approach is the correct architecture for a visual editor handling 100s of elements.

---

### 4.2 Named Version Snapshots (Separate from Undo)

**What it is:** `VersionHistoryManager.ts` stores named checkpoints in IndexedDB, completely independent of the undo stack.

**Preservation reason:** Two distinct concepts: undo history (operation-level, session-scoped) and named snapshots (milestone-level, persistent). Merging them would eliminate named restore points or pollute the undo stack.

---

### 4.3 Five-Backend Storage

**What it is:** `StorageAdapter.ts` (417 LOC) — LocalStorage, SessionStorage, IndexedDB, Remote API, Custom backends.

**Preservation reason:** Enterprise and white-label deployments will require custom backends. Reducing to a single backend in refactor would break extensibility.

---

### 4.4 Collaboration OT Engine (790 LOC)

**What it is:** `CollaborationManager.ts` implements a real Operational Transformation engine with conflict resolution, user presence, and element locks.

**Preservation reason:** The transport gap is small relative to this foundation (a transport can be added in 1-2 files). Discarding the OT engine to "restart simpler" would lose the hardest part of multi-user editing.

---

### 4.5 Plugin System with SRI Integrity

**What it is:** `PluginManager.ts` — CDN-loaded plugins with HTTPS-only, host allowlist, and Subresource Integrity validation.

**Preservation reason:** No plugin management UI is visible, which may make this invisible to reviewers. The security architecture (SRI checks) is non-trivial and must not be simplified away if third-party plugins are a product direction.

---

### 4.6 Offline Sync Queue

**What it is:** `SyncManager.ts` with `OfflineQueue` backed by IndexedDB — operations queue when offline and flush on reconnect.

**Preservation reason:** Invisible to users when working correctly; catastrophic when removed. Any refactor of the sync layer must preserve this queue.

---

### 4.7 AI Frontend Facade

**What it is:** `AIServiceClient.ts` + `AISuggestionSection.tsx` (300 LOC) + `SmartSuggestions.tsx` (368 LOC) — complete frontend AI integration proxying to `/api/ai/*`.

**Preservation reason:** Complete and correct architecture. Preserving it costs nothing; rebuilding it requires significant effort. The only gap is server endpoint availability.

---

### 4.8 Design Token Export Pipeline

**What it is:** `DesignSystemTab.tsx` — CSS variables, JSON, and Figma token format export from the design token system.

**Preservation reason:** Multi-format export (including Figma) is a differentiating feature. Not visible as a UI flow milestone but represents significant design-ops value.

---

### 4.9 GSAP + InteractionRuntime Pipeline

**What it is:** `GSAPEngine.ts` + `InteractionRuntime.ts` — real GSAP timeline/tween execution with ScrollTrigger; IntersectionObserver for scroll-triggered effects.

**Preservation reason:** The interaction system is built on top of this pipeline. Any animation refactor that removes GSAP would need to replace the entire interaction preview system.

---

### 4.10 Component System: Variants + Overrides + Detach

**What it is:** ComponentManager — component instances with variant switching, property overrides, and detach-from-source capability.

**Preservation reason:** This is the foundational mechanism for a scalable design system in the editor. Detach-to-edit is a critical UX affordance that requires careful state management.

---

### 4.11 Export Injectors (SEO, Analytics, Stripe, Formspree)

**What it is:** Separate injectable export classes that append integrations to exported HTML.

**Preservation reason:** Each injector is independently optional and composable. This pattern is correct for export-time feature injection. Do not merge into a monolithic export function.

---

### 4.12 Breakpoint-Aware Style Engine

**What it is:** `StyleEngine.ts` `setBreakpointStyles()` — real media query injection per element, per breakpoint.

**Preservation reason:** Responsive design is not cosmetic here — it is element-level per-breakpoint style storage. Any inspector refactor must preserve this style resolution pipeline.

---

## §5 Runtime Verification Needed

These items are code-verified present but require live environment testing before making definitive claims about their functionality.

### 5.1 Sentry DSN Configuration

**Question:** Is `VITE_SENTRY_DSN` configured in the production/staging environment?

**Why it matters:** Without this variable, Sentry silently no-ops. Error tracking may be completely absent in production despite the code being correct.

**Test:** Check `.env.production` or deployment environment variables. Confirm events appear in the Sentry dashboard.

---

### 5.2 AI Server Endpoints

**Question:** Do `/api/ai/*` server endpoints exist and return responses?

**Why it matters:** The entire AI feature (Cmd+J, suggestions, SmartSuggestions panel) routes through this proxy. If the server doesn't respond, all AI features are non-functional regardless of frontend completeness.

**Test:** `curl -X POST /api/ai/suggest` with a valid payload. Confirm non-404 response.

---

### 5.3 Onboarding Flow Completion

**Question:** Does the onboarding checklist flow complete without UI errors in a real browser session?

**Why it matters:** Static code analysis found no incomplete sections, but orchestration bugs (incorrect step transitions, event misfires) only surface at runtime.

**Test:** Fresh browser session, complete all checklist items, confirm achievement prompt triggers and flow closes cleanly.

---

### 5.4 HTML Export Rendering

**Question:** Does exported HTML render correctly for complex nested elements with data bindings?

**Why it matters:** Export correctness for edge cases (nested components, dynamic bindings, breakpoint styles) cannot be verified statically.

**Test:** Export a project with nested components, data-bound text, and breakpoint-specific styles. Verify rendered output in browser without editor.

---

### 5.5 Export React/Vue Generator Completeness

**Question:** Are React/Vue code generators present in unread code sections of `ExportEngine.ts`, or genuinely absent?

**Why it matters:** This determines whether React/Vue export is a near-complete feature or a type placeholder.

**Test:** Read the complete `ExportEngine.ts` file and search for `"react"` and `"vue"` in generation logic (not just type signatures). If generators are absent, gate the format options in UI.

---

### 5.6 Collaboration UI Gating

**Question:** Does any UI surface present real-time collaboration features as working?

**Why it matters:** Transport is confirmed absent. If a "Collaborate" or "Share" button implies live multi-user editing, it is misleading.

**Test:** Audit all Topbar and rail controls for collaboration indicators. Gate or remove any that imply live multiplayer until transport is implemented.

---

### 5.7 Offline Sync Queue Flush

**Question:** Does the `OfflineQueue` flush correctly on reconnect without data loss or duplication?

**Why it matters:** Offline queue bugs typically only surface under specific timing conditions (network restore during active editing).

**Test:** Edit offline, restore network, confirm all operations reach the remote backend in correct order.

---

### 5.8 History Diff Display Accuracy

**Question:** Does the `DiffRow` component display accurate change descriptions for multi-element patch operations?

**Why it matters:** JSON Patch diffs can be complex to render; display bugs would make the history panel misleading.

**Test:** Perform multi-element edits, open history panel, confirm diff rows describe operations correctly.

---

### 5.9 Publish Host Integration

**Question:** Is an `onPublish` callback wired in the demo app or production host?

**Why it matters:** Without host wiring, the Publish button is a dead end. Users clicking it get no feedback.

**Test:** Check `demo/main.tsx` and any production host shell for `onPublish` prop. If absent, disable the Publish button or display a "coming soon" message.

---

### 5.10 IndexedDB Quota in Production

**Question:** Do IndexedDB operations (VersionHistory, OfflineQueue, FontCache) encounter quota errors on large projects?

**Why it matters:** IndexedDB quota limits vary by browser and storage mode. Large projects with frequent autosaves could hit limits silently.

**Test:** Load a large project (~500 elements), enable autosave, perform 50+ operations, check for IndexedDB quota errors in browser console.

---

## §6 Stitch Input Version

> **Note:** This section provides a conservative, factual summary for use as input to Stitch, design planning, or external documentation. Claims are scoped to what code-reading can confirm. All unknowns are stated explicitly.

---

**Buildrik / Aquibra Editor L2 — Verified Capability Summary**

Buildrik is a visual web editor built on React 18, TypeScript 5.3, Vite 7.2, and Emotion CSS-in-JS. The central orchestrator is `Composer.ts` (699 LOC) which instantiates 29 managers for all editor subsystems.

**Editor Shell**
- Main shell: `AquibraStudio.tsx` (~639 LOC)
- Topbar: `Topbar.tsx` (318 LOC) — undo/redo, breakpoint switcher, preview, publish
- Left rail: 8 visible icon slots (5 top, 3 bottom); 10 total panel configurations
- Left sidebar: 11 panel tab components (Build, Media, Layers, Pages, Templates, Components, DesignSystem, Settings, Publish, History, Elements)
- Inspector (right panel): 13 property sections

**Canvas**
- 130 canvas files total
- 12 named overlay components (selection, hover, drop feedback, smart guides, rulers, grid, spacing labels, multi-select badge, parent highlight, remote cursors)
- Drag implemented as a stateful hook (property-based, not a formal FSM)
- One boolean mode flag (`devMode`); X-ray toggle deprecated; Preview opens separate browser window
- Touch drag support (`useTouchDrag`) present

**History & Storage**
- Undo/redo: JSON Patch operations with 500ms coalescing (`HistoryManager.ts`, 470 LOC)
- Named snapshots: Independent IndexedDB storage (`VersionHistoryManager.ts`)
- Storage: 5 backends (LocalStorage, SessionStorage, IndexedDB, Remote API, Custom)
- Auto-save: 5,000ms debounce on project change events

**Styling & Responsive**
- Breakpoint-aware styles: per-element per-breakpoint storage with real media query injection
- Design tokens: full CRUD + CSS/JSON/Figma format export

**Animations & Interactions**
- GSAP engine: real `gsap.timeline()`, ScrollTrigger registered
- Interaction runtime: IntersectionObserver, scroll/click event listeners, GSAP execution

**Data & CMS**
- CMS bindings: CRUD, field operations
- Data bindings: variable, collection, condition — with path traversal and transforms
- Component system: variants, property overrides, detach-from-source

**Forms & Media**
- Forms: webhook, email, and store submission backends
- Media: upload, optimize, WEBP conversion, folder organization
- Stock media discovery: UI present; search returns empty array (no real API connected)

**Sync & Recovery**
- Offline queue: IndexedDB-backed operation queue, flushes on reconnect
- Recovery: `visibilitychange` listener for tab-switch recovery

**Integrations**
- Fonts: Google Fonts with 24-hour cache
- Plugins: CDN-loaded with HTTPS-only, host allowlist, SRI integrity validation
- Sentry: Code-verified; requires `VITE_SENTRY_DSN` environment variable
- E-commerce: Collections, product bindings, `StripeInjector` for export-time injection
- Export: HTML (confirmed); React/Vue (type declared, generator logic unconfirmed)
- Export injectors: SEO, Analytics, Stripe, Formspree — all as separate injectable classes

**AI Features**
- Frontend: Complete — `AIServiceClient.ts` proxies to `/api/ai/*`; suggestion components are 300 LOC + 368 LOC
- Backend: `/api/ai/*` server endpoints — availability unverified

**Collaboration**
- OT engine: 790 LOC, real Operational Transformation with user presence and element locks
- Transport: Not implemented — multi-user sync non-functional; local editing unaffected

**Onboarding**
- 1,231+ LOC across 5 components; no incomplete sections found in static analysis
- Runtime completion requires smoke-test

**Publish**
- Pattern: host-delegated callback (`onPublish`)
- No Vercel or hosting implementation exists — host app must supply callback
- Demo app does not wire `onPublish` — Publish button is a dead end in demo context

**Infrastructure Notes**
- Two UI generations coexist: `src/components/` (371 files, legacy, do not add new code) and `src/editor/` (current, add new code here)
- Engine import rules enforced: `engine/ → shared/` only; `editor/ → engine/, shared/, features/`
- Testing: Vitest + React Testing Library

---

## §7 Final Recommendation

The following 7 items must be resolved before redesign begins. They are ordered by their impact on design decisions — resolving early ones prevents rework.

### Priority 1: Confirm AI Server Endpoints

**Action:** `curl -X POST /api/ai/suggest` with a test payload.

**Why first:** If `/api/ai/*` endpoints are absent, the Cmd+J AI panel is non-functional and must be gated in the redesign. If endpoints exist, the AI features are fully usable. This is a binary gate that changes a significant UX surface area.

---

### Priority 2: Confirm Publish Host Integration

**Action:** Check `demo/main.tsx` and any production host shell for `onPublish` prop.

**Why second:** If `onPublish` is not wired, the Publish button in the demo is a dead end and users see no response on click. Either wire it or add a "coming soon" / disabled state in the redesign. Do not ship a Topbar action that silently does nothing.

---

### Priority 3: Confirm Export React/Vue Completeness

**Action:** Read the full `ExportEngine.ts` and search for React/Vue generator logic (not type signatures).

**Why third:** If generators are absent, the export format selector must show only HTML in the redesign. Including React/Vue options against non-functional exports misleads users and causes support issues.

---

### Priority 4: Confirm Sentry DSN is Configured

**Action:** Check deployment environment for `VITE_SENTRY_DSN`.

**Why fourth:** If absent, all production errors are invisible. This is not a redesign-blocker but is a launch-quality requirement. Simple to fix (add env var) once confirmed missing.

---

### Priority 5: Map Active `components/` Files

**Action:** `grep -r "from.*components/"` in `editor/` and `demo/` to identify which legacy files still render.

**Why fifth:** The `components/` directory (371 files, legacy) may still power active UI. Understanding which files are live vs. dead determines how much migration work exists and whether a redesign can safely ignore `components/` code.

---

### Priority 6: Gate Collaboration UI

**Action:** Audit Topbar and rail controls for any collaboration indicators. Remove or disable any that imply live multiplayer.

**Why sixth:** Transport is confirmed absent. Any "Collaborate" or "Share" UI implying real-time sync is incorrect. Gate before users try it. Note: the OT engine (790 LOC) is valuable and should be preserved — only UI that misrepresents it should be gated.

---

### Priority 7: Smoke-Test Onboarding in Browser

**Action:** Fresh browser session, complete full onboarding checklist, confirm flow closes cleanly.

**Why seventh:** Code is complete (1,231+ LOC, no TODOs) but orchestration bugs only surface at runtime. Given that onboarding is the first user experience, runtime confirmation is essential before redesign treats it as a stable baseline.

---

*End of stitch2-validated.md*
