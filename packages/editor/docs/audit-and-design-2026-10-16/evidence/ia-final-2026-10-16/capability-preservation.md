# Full intake preservation and destination register

FD-IA-09. **1,238/1,238 intake rows mapped**, including historical removed items and repeated issue reports; this is traceability coverage, not exhaustive runtime verification. The original 122 M07 decisions retain their historical Inspector evidence. 121 dispositions remain unchanged; M07-100 has an explicit BD-20 ownership/design overlay. No feature is deleted by this ledger. Source provenance remains in [inventory-intake.json](inventory-intake.json).

The [JSON companion](capability-preservation.json) stores each row’s original status/evidence/description, disposition, owner, permission, home, preserved behavior, change, dependencies, compatibility, recovery and acceptance. The compact table below is its navigation index. Shared module contracts are normative; current source facts are in [module specifications](module-specifications.md). No external/Figma claim from the intake is adopted as new evidence.

Disposition counts: Move 398, Defer 138, Fix 123, Keep 456, Redesign 121, Merge 2.

**Interpretation:** Move keeps the underlying supported operation; Redesign keeps supported capability while correcting its specified flow; Fix is an engineering correction/verification task, not a claim of a reproduced bug; Defer on a retired/stub/engine-only row defers revival/new authoring, never deletes its saved data. The two inherited Inspector Merge decisions remain as previously reviewed. No Restore is asserted solely because inventory says Removed. A Merge would require demonstrated duplicate writers; none is guessed by label. Bug/gap rows map to the same owner contracts rather than introducing competing destinations. Rows remain distinct provenance records; semantically overlapping reports are not counted as additional features.

## Canonical destinations and dependency index

| Contract | Canonical home | Main dependencies |
|---|---|---|
| IAF-01 | Global shell / named task host | IAF-02,05,14–22; existing Inspector integration contracts; navigation preference aliases and command registry. |
| IAF-02 | Editor → canvas and local toolbar | Layer synchronization; engine nesting rules; responsive/pseudo style serialization; text editors; component overrides; preview/export renderers. |
| IAF-03 | Rail → Layers | IAF-02/05/11; nesting, lock, page/component scope and history validators. |
| IAF-04 | Rail → Add / quick insertion | BIC/FD-INS; nesting; component adoption; template page mode; IAF-12 quota and AI contracts. |
| IAF-05 | Bottom Pages → page management / Page settings | IAF-06 templates; CMS dynamic template filename/path; internal links; localization; shared component scopes; document save. |
| IAF-06 | Add → Templates workspace | Pages, Brand, template parser, history backup, publication eligibility and component/pasted HTML boundary. |
| IAF-07 | Rail → CMS → collection → Records / Fields / Dynamic pages / Settings | IAF-08 bindings/data; Pages template filename; assets references; export/publish; CMS service tombstones and conflict handling. |
| IAF-08 | Rail → CMS → Data; selected binding stays Inspector | Existing condition repair requires a separate versioned evaluator/serialization/output contract and matching canvas/preview/publish consumers. Revisit before offering reliable condition authoring; source durability additionally needs storage/provider/security design. Existing site variables keep document persistence. |
| IAF-09 | Rail → Assets; contextual picker returns to originating property | IAF-07CMS src fields; FD-INS media; Brand fonts; ingestion limits; usage scanner coverage; asset GC/grace server jobs. |
| IAF-10 | Rail → Brand → Tokens / Reusable styles / Tools | Inspector resolved values; font assets; shared history; export token closure; starter application; migration gates. |
| IAF-11 | Add → Saved components → Manage components | PKG-01; FI-05 server ACL; stable ID s; cache migration; site capacity; token/CSS/media/CMS/forms/commerce dependencies; IAF-20. |
| IAF-12 | AI named right-side task | IAF-01 draft registry; command permission/lock/target parent checks; tokens; components; publication consequence gate; engine undo provenance. |
| IAF-13 | Inspector Behaviour → After submit; Site settings → Form submissions | BIC form contracts, site integration/permissions, published endpoint, spam/rate/upload constraints, asset field handling. |
| IAF-14 | Topbar → Site settings → named screen | IAF-13 forms/16 publish; pagevs SEO inheritance; provider API; Role Service; workspace routes. Header/custom code effects require output validation, not UI alone. |
| IAF-15 | Topbar Preview / Site menu Export | IAF-08/13/16, saved configuration, token/font closure, preview renderer/export resolver, output sanitization. |
| IAF-16 | Topbar Publish / Issues named task | IAF-14 provider/settings,17 review,18 history,22 save/conflicts, server job idempotency; FI-05 authorization. |
| IAF-17 | Review named task → round / thread | IAF-19 pinned comments,16 publish gates,20 per action capabilities,22 revision/save. |
| IAF-18 | History / Activity named task → Compare / Time Travel child mode | IAF-22 recovery/conflicts; components/CMS external resources; authorization; renderer historical dependencies; AI-summary endpoint. |
| IAF-19 | Topbar Notifications / canvas comments / presence | IAF-17 review,18Activity,20 flags/ACL,22 conflict/recovery; additive exact event target payload if desired later. |
| IAF-20 | Per-action capability result at existing destinations | All modules; server policy/transport/commands; FI-05. No blanket frontend role boolean substitutes for ACL. |
| IAF-21 | Rail Help → Getting started / keyboard guide | IAF-04/05/10/15–17,20; confirmed outcome events, account identity and server progress. |
| IAF-22 | Bottom status → save/recovery details; conflict modal | Every writer, collaboration CAS, history checkpoints, provider jobs; FI-03/04 and IA-X integrity risks. |
| IAF-23 | Existing owner / preserved engine data; unsupported UI explicitly deferred | All intake rows; existing Inspector 69/120 contracts; serializer/output; package compatibility; server integration gates. |

Inspector rows retain their exact per-property homes in the prior FD-INS register. This index establishes one primary family owner; contextual access invokes that owner and does not create another value.

## Every intake row

BD-20 authority overlay: M05-B33 and M07-100 now point to Inspector Content conditions; older Behaviour/optional reservation is superseded. Expanded requirements are mapped separately in FD-IA-09 §3.1. Their detailed feature design is not certified by legacy-row coverage.

| Intake / acceptance | Capability | Decision | Canonical contract / home |
|---|---|---|---|
| M01-1.1 / P-M01-1.1 | Shell grid | Move | IAF-01 · Global shell / named task host |
| M01-1.2 / P-M01-1.2 | Status footer (selection readout, size, Device·zoom button) | Move | IAF-02 · Editor → canvas and local toolbar |
| M01-1.3 / P-M01-1.3 | Zoom flyout (fit/selection/100%/presets) | Move | IAF-02 · Editor → canvas and local toolbar |
| M01-1.4 / P-M01-1.4 | Dev-only alternate rails (`?rail=e3`, `?rail=legacy`), drawer sub-tab chips, Structure popover | Defer | IAF-01 · Global shell / named task host |
| M01-1.5 / P-M01-1.5 | Right column as a multi-mode host | Move | IAF-01 · Global shell / named task host |
| M01-1.6 / P-M01-1.6 | Hide / show inspector | Move | IAF-01 · Global shell / named task host |
| M01-1.7 / P-M01-1.7 | CMS workspace takeover | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M01-1.8 / P-M01-1.8 | Full-screen takeovers | Fix | IAF-01 · Global shell / named task host |
| M01-1.9 / P-M01-1.9 | View mode (`?view=readonly`) | Keep | IAF-20 · Per-action capability result at existing destinations |
| M01-1.10 / P-M01-1.10 | Viewer chrome (workspace VIEWER) | Keep | IAF-20 · Per-action capability result at existing destinations |
| M01-1.11 / P-M01-1.11 | Skip to Canvas link + landmarks | Move | IAF-01 · Global shell / named task host |
| M01-1.12 / P-M01-1.12 | Boot skeleton | Move | IAF-01 · Global shell / named task host |
| M01-1.13 / P-M01-1.13 | Shell crash screen | Move | IAF-01 · Global shell / named task host |
| M01-1.14 / P-M01-1.14 | Panel loading / crash fallback (drawer) | Move | IAF-01 · Global shell / named task host |
| M01-1.15 / P-M01-1.15 | Column panel loading / crash fallback | Move | IAF-01 · Global shell / named task host |
| M01-1.16 / P-M01-1.16 | "Project loaded" toast on open | Defer | IAF-01 · Global shell / named task host |
| M01-1.17 / P-M01-1.17 | Load toasts | Move | IAF-01 · Global shell / named task host |
| M01-2.1 / P-M01-2.1 | Exit button | Move | IAF-01 · Global shell / named task host |
| M01-2.2 / P-M01-2.2 | Site › page breadcrumb | Move | IAF-01 · Global shell / named task host |
| M01-2.3 / P-M01-2.3 | Save status pill | Move | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-2.4 / P-M01-2.4 | Save pill click | Move | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-2.5 / P-M01-2.5 | Timestamp drop on narrow bars | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-2.6 / P-M01-2.6 | Live chip (green dot + domain) | Defer | IAF-16 · Topbar Publish / Issues named task |
| M01-2.7 / P-M01-2.7 | Review chip | Keep | IAF-17 · Review named task → round / thread |
| M01-2.8 / P-M01-2.8 | Review-closed toasts | Keep | IAF-17 · Review named task → round / thread |
| M01-2.9 / P-M01-2.9 | Comments toggle | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-2.10 / P-M01-2.10 | Issues chip | Defer | IAF-16 · Topbar Publish / Issues named task |
| M01-2.11 / P-M01-2.11 | Presence avatars + connection pill | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-2.12 / P-M01-2.12 | Notifications bell | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-2.13 / P-M01-2.13 | Preview button | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M01-2.14 / P-M01-2.14 | Primary CTA — verb by state | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-2.15 / P-M01-2.15 | CTA blocked reasons | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-2.16 / P-M01-2.16 | CTA routing | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-2.17 / P-M01-2.17 | Screen-reader announcements | Move | IAF-01 · Global shell / named task host |
| M01-2.18 / P-M01-2.18 | Viewer top bar | Keep | IAF-20 · Per-action capability result at existing destinations |
| M01-3.1 / P-M01-3.1 | Menu shell | Move | IAF-01 · Global shell / named task host |
| M01-3.2 / P-M01-3.2 | Site settings ⌃, | Move | IAF-14 · Topbar → Site settings → named screen |
| M01-3.3 / P-M01-3.3 | Export site… | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M01-3.4 / P-M01-3.4 | Duplicate site | Move | IAF-14 · Topbar → Site settings → named screen |
| M01-3.5 / P-M01-3.5 | Issues | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M01-3.6 / P-M01-3.6 | Activity log | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M01-3.7 / P-M01-3.7 | Command palette ⌘K | Move | IAF-01 · Global shell / named task host |
| M01-3.8 / P-M01-3.8 | Enter / Exit view mode | Keep | IAF-20 · Per-action capability result at existing destinations |
| M01-3.9 / P-M01-3.9 | Keyboard shortcuts ⌘/ | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-3.10 / P-M01-3.10 | Share preview link | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M01-3.11 / P-M01-3.11 | Copy live URL | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-3.12 / P-M01-3.12 | Getting started | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-3.13 / P-M01-3.13 | Start collaboration | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-3.14 / P-M01-3.14 | Unpublish site… | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-3.15 / P-M01-3.15 | View live site ↗ | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-3.16 / P-M01-3.16 | Site health ↗ | Move | IAF-14 · Topbar → Site settings → named screen |
| M01-3.17 / P-M01-3.17 | Invite teammates ↗ / Account settings ↗ | Move | IAF-14 · Topbar → Site settings → named screen |
| M01-3.18 / P-M01-3.18 | View-mode menu | Keep | IAF-20 · Per-action capability result at existing destinations |
| M01-3.19 / P-M01-3.19 | Removed rows: Version history, Review, Publish panel, Publish history, Templates, Components, Brand, Plugins, Ask AI | Defer | IAF-01 · Global shell / named task host |
| M01-4.1 / P-M01-4.1 | Six rail items | Move | IAF-01 · Global shell / named task host |
| M01-4.2 / P-M01-4.2 | Logo mark + divider at rail top | Defer | IAF-01 · Global shell / named task host |
| M01-4.3 / P-M01-4.3 | Rail Help button | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-4.4 / P-M01-4.4 | Active / hover / focus states | Move | IAF-01 · Global shell / named task host |
| M01-4.5 / P-M01-4.5 | Click semantics | Move | IAF-01 · Global shell / named task host |
| M01-4.6 / P-M01-4.6 | Rail keyboard | Move | IAF-01 · Global shell / named task host |
| M01-4.7 / P-M01-4.7 | Rail "unsaved" dot | Defer | IAF-01 · Global shell / named task host |
| M01-4.8 / P-M01-4.8 | Off-rail panels | Move | IAF-01 · Global shell / named task host |
| M01-4.9 / P-M01-4.9 | Drawer container | Move | IAF-01 · Global shell / named task host |
| M01-4.10 / P-M01-4.10 | Remembered tab | Move | IAF-01 · Global shell / named task host |
| M01-4.11 / P-M01-4.11 | Unsaved-switch guard | Move | IAF-01 · Global shell / named task host |
| M01-4.12 / P-M01-4.12 | Cross-panel hand-offs | Move | IAF-01 · Global shell / named task host |
| M01-4.13 / P-M01-4.13 | Create component guard | Move | IAF-11 · Add → Saved components → Manage components |
| M01-4.14 / P-M01-4.14 | Full-screen close return | Move | IAF-01 · Global shell / named task host |
| M01-5.1 / P-M01-5.1 | Page tabs | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M01-5.2 / P-M01-5.2 | "+" button | Redesign | IAF-05 · Bottom Pages → page management / Page settings |
| M01-5.3 / P-M01-5.3 | Tab context menu / F2 rename / duplicate / set home / delete | Defer | IAF-05 · Bottom Pages → page management / Page settings |
| M01-6.1 / P-M01-6.1 | Notification dropdown | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-6.2 / P-M01-6.2 | States | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-6.3 / P-M01-6.3 | Rows | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-6.4 / P-M01-6.4 | Mark all read | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-6.5 / P-M01-6.5 | Footer link | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-6.6 / P-M01-6.6 | "What this points to was deleted" note | Defer | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-7.1 / P-M01-7.1 | Issues panel host | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-7.2 / P-M01-7.2 | Issue sources | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M01-7.3 / P-M01-7.3 | Scan state | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-7.4 / P-M01-7.4 | Empty / scope / filter | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-7.5 / P-M01-7.5 | Row click → locate | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M01-7.6 / P-M01-7.6 | Fix › auto-fix | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-7.7 / P-M01-7.7 | Fix failed band | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-7.8 / P-M01-7.8 | Ignored (n) | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-7.9 / P-M01-7.9 | Issue copy | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M01-8.1 / P-M01-8.1 | Preview overlay | Redesign | IAF-15 · Topbar Preview / Site menu Export |
| M01-8.2 / P-M01-8.2 | Preview keeps device | Fix | IAF-15 · Topbar Preview / Site menu Export |
| M01-8.3 / P-M01-8.3 | Preview fidelity | Redesign | IAF-15 · Topbar Preview / Site menu Export |
| M01-8.4 / P-M01-8.4 | Preview page switching | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M01-8.5 / P-M01-8.5 | Share preview dialog | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M01-8.6 / P-M01-8.6 | Compare overlay | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M01-8.7 / P-M01-8.7 | Time travel | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M01-9.1 / P-M01-9.1 | Review bar under the top bar | Defer | IAF-17 · Review named task → round / thread |
| M01-9.2 / P-M01-9.2 | Send for review popover | Keep | IAF-17 · Review named task → round / thread |
| M01-9.3 / P-M01-9.3 | Review-sent outcome dialog | Keep | IAF-17 · Review named task → round / thread |
| M01-9.4 / P-M01-9.4 | "Publish with N open errors?" | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-9.5 / P-M01-9.5 | Publish confirm (facts) | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-9.6 / P-M01-9.6 | Approval gate dialogs | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-9.7 / P-M01-9.7 | Stale-approval dialog | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-9.8 / P-M01-9.8 | Publish outcome toasts | Keep | IAF-16 · Topbar Publish / Issues named task |
| M01-9.9 / P-M01-9.9 | Publish history (History panel) | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M01-9.10 / P-M01-9.10 | Rollback picker modal | Defer | IAF-16 · Topbar Publish / Issues named task |
| M01-10.1 / P-M01-10.1 | Exit guard dialogs | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.2 / P-M01-10.2 | Browser leave prompt | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.3 / P-M01-10.3 | Save-failed banner | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.4 / P-M01-10.4 | Recovered-work banner | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.5 / P-M01-10.5 | "Some work never reached the server" toast | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.6 / P-M01-10.6 | Load-error banner | Fix | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.7 / P-M01-10.7 | Session-expired dialog | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.8 / P-M01-10.8 | Conflict dialog | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.9 / P-M01-10.9 | "Open in another tab" notice | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-10.10 / P-M01-10.10 | Save toasts | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.11 / P-M01-10.11 | Page-limit save refusal | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.12 / P-M01-10.12 | Sync-failure toasts | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-10.13 / P-M01-10.13 | Engine error toasts | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M01-11.1 / P-M01-11.1 | Create component | Redesign | IAF-11 · Editor Create component → workspace library or This page |
| M01-11.2 / P-M01-11.2 | Create collection (CMS) | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M01-11.3 / P-M01-11.3 | Records manager modal | Defer | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M01-11.4 / P-M01-11.4 | Set up Products collection | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M01-11.5 / P-M01-11.5 | Save page as template | Keep | IAF-06 · Add → Templates workspace |
| M01-11.6 / P-M01-11.6 | New page modal | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M01-11.7 / P-M01-11.7 | Site fonts modal | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M01-11.8 / P-M01-11.8 | Upgrade Your Plan | Keep | IAF-20 · Per-action capability result at existing destinations |
| M01-11.9 / P-M01-11.9 | Permissions dialog | Keep | IAF-20 · Per-action capability result at existing destinations |
| M01-11.10 / P-M01-11.10 | Delete site (owner) | Move | IAF-14 · Topbar → Site settings → named screen |
| M01-11.11 / P-M01-11.11 | Export modal | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M01-12.1 / P-M01-12.1 | Rail coach mark | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-12.2 / P-M01-12.2 | Getting-started chip | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-12.3 / P-M01-12.3 | Checklist panel | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-12.4 / P-M01-12.4 | Seven steps | Fix | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-12.5 / P-M01-12.5 | Progress scope | Fix | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-12.6 / P-M01-12.6 | Step-complete prompt | Redesign | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-12.7 / P-M01-12.7 | Hidden in view mode | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-12.8 / P-M01-12.8 | Board coverage | Redesign | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-13.1 / P-M01-13.1 | One palette | Move | IAF-01 · Global shell / named task host |
| M01-13.2 / P-M01-13.2 | Opening bands | Redesign | IAF-01 · Global shell / named task host |
| M01-13.3 / P-M01-13.3 | Search-only results | Move | IAF-01 · Global shell / named task host |
| M01-13.4 / P-M01-13.4 | Disabled rows with reason | Move | IAF-01 · Global shell / named task host |
| M01-13.5 / P-M01-13.5 | No results | Move | IAF-01 · Global shell / named task host |
| M01-13.6 / P-M01-13.6 | "Scope: everything" chip | Defer | IAF-01 · Global shell / named task host |
| M01-13.7 / P-M01-13.7 | Clear history | Redesign | IAF-18 · History → Session → Clear session history |
| M01-13.8 / P-M01-13.8 | Start collaboration session | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M01-13.9 / P-M01-13.9 | Legend footer | Redesign | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-14.1 / P-M01-14.1 | Keyboard shortcuts sheet (one sheet) | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-14.2 / P-M01-14.2 | Keyboard legend card | Fix | IAF-21 · Rail Help → Getting started / keyboard guide |
| M01-14.3 / P-M01-14.3 | Rail / panel letters | Move | IAF-01 · Global shell / named task host |
| M01-14.4 / P-M01-14.4 | Global chords | Move | IAF-01 · Global shell / named task host |
| M01-14.5 / P-M01-14.5 | F6 / ⇧F6 region cycling | Move | IAF-01 · Global shell / named task host |
| M01-14.6 / P-M01-14.6 | Escape to the innermost surface | Move | IAF-01 · Global shell / named task host |
| M01-14.7 / P-M01-14.7 | Deep links | Move | IAF-01 · Global shell / named task host |
| M01-15.1 / P-M01-15.1 | Toast stacking rule | Redesign | IAF-01 · Global shell / named task host |
| M01-15.2 / P-M01-15.2 | Undo / redo feedback | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M01-15.3 / P-M01-15.3 | Editing / insert / clipboard toasts | Keep | IAF-02 · Editor → canvas and local toolbar |
| M01-15.4 / P-M01-15.4 | "Connect to tokens" offer | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M01-15.5 / P-M01-15.5 | Auto alt-text on upload | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M02-1.1 / P-M02-1.1 | Page card on grey canvas | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.2 / P-M02-1.2 | Auto fit-to-width on load 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.3 / P-M02-1.3 | Click grey surround to deselect 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.4 / P-M02-1.4 | Page links/forms can't navigate the editor 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.5 / P-M02-1.5 | Live widget runtimes on canvas 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.6 / P-M02-1.6 | CMS-bound content preview + Collection list repeat 🆕 | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-1.7 / P-M02-1.7 | Element animations + global custom CSS live on canvas | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.8 / P-M02-1.8 | Locked element styling | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.9 / P-M02-1.9 | Hidden (Layers eye) element | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.10 / P-M02-1.10 | Hidden-per-breakpoint | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.11 / P-M02-1.11 | Empty container / columns placeholder | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-1.12 / P-M02-1.12 | Empty column label | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.13 / P-M02-1.13 | Src-less image placeholder | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.14 / P-M02-1.14 | Drop/insert flash + settle animation | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.15 / P-M02-1.15 | Layers-row hover highlights canvas element | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.16 / P-M02-1.16 | Read-only / view mode | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.17 / P-M02-1.17 | "Pick an element" mode (inspector crosshair) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-1.18 / P-M02-1.18 | Screen-reader live region | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-2.1 / P-M02-2.1 | Breakpoint switch (Desktop / Tablet 768 / Mobile 375) | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-2.2 / P-M02-2.2 | Wide (1920) breakpoint | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-2.3 / P-M02-2.3 | Watch device | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-2.4 / P-M02-2.4 | Real-width Tablet/Mobile + re-fit on switch 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-2.5 / P-M02-2.5 | Width label under page 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-2.6 / P-M02-2.6 | Custom width… 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-2.7 / P-M02-2.7 | Device frame (phone/tablet bezel) | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-2.8 / P-M02-2.8 | "Desktop" means three widths | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-3.1 / P-M02-3.1 | Zoom menu "100% ▾" on the bar 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-3.2 / P-M02-3.2 | View › Zoom submenu | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-3.3 / P-M02-3.3 | Zoom keys ⌘0 / ⌘1 / ⌘2 / ⌘= / ⌘- | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-3.4 / P-M02-3.4 | Zoom to fit / zoom to selection | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-3.5 / P-M02-3.5 | Zoom-aware overlays | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-4.1 / P-M02-4.1 | Empty-page CTA (rebuilt) 🆕 | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-4.2 / P-M02-4.2 | Template cards in empty CTA | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-4.3 / P-M02-4.3 | Add a block / Describe your site doors 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-4.4 / P-M02-4.4 | Start blank | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-4.5 / P-M02-4.5 | Loading skeleton | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-4.6 / P-M02-4.6 | Project unavailable | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-5.1 / P-M02-5.1 | Default hover | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-5.2 / P-M02-5.2 | Alt-hover "hierarchy" | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-5.3 / P-M02-5.3 | Alt+Shift hover "box model" | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-5.4 / P-M02-5.4 | Clone badge (⌘/Ctrl held) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-5.5 / P-M02-5.5 | "Inspector mode" (force box-model, I key) | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-5.6 / P-M02-5.6 | Hover drag grip | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.1 / P-M02-6.1 | Selection box | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.2 / P-M02-6.2 | Selection tag 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.3 / P-M02-6.3 | Resize handles | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.4 / P-M02-6.4 | Resize at zoom ≠ 100% | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-6.5 / P-M02-6.5 | Esc cancels resize | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-6.6 / P-M02-6.6 | NaN risk in resize math | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-6.7 / P-M02-6.7 | Resize modifiers & constraints | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.8 / P-M02-6.8 | Multi-select resize | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-6.9 / P-M02-6.9 | Rotation handle | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.10 / P-M02-6.10 | Size label while resizing | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.11 / P-M02-6.11 | CMS-bound badge | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.12 / P-M02-6.12 | Locked badge | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.13 / P-M02-6.13 | Selection toolbar (rebuilt) 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.14 / P-M02-6.14 | Toolbar caption | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-6.15 / P-M02-6.15 | Select parent / ancestor dropdown / + Add child / Copy / Wrap / Move up-down / ✦ Edit with AI on toolbar | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-6.16 / P-M02-6.16 | "Add Child Element" picker modal | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-6.17 / P-M02-6.17 | "Edit with AI" popover (248px diff card) | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-6.18 / P-M02-6.18 | Bottom breadcrumb bar | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-6.19 / P-M02-6.19 | Footer selection readout 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.20 / P-M02-6.20 | Click / Shift-click / ⌘-click cycle / double-click child / triple-click innermost | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-6.21 / P-M02-6.21 | Spacing "spots" (click-to-edit margin/padding) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-7.1 / P-M02-7.1 | Multi-select box | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-7.2 / P-M02-7.2 | Canvas multi-select align/distribute toolbar | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-7.3 / P-M02-7.3 | Toolbar hidden in multi-select | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-7.4 / P-M02-7.4 | Multi-delete confirm 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-7.5 / P-M02-7.5 | Marquee (rubber-band) select | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-7.6 / P-M02-7.6 | Marquee drawing at zoom ≠ 100% | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-8.1 / P-M02-8.1 | Double-click to edit text | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-8.2 / P-M02-8.2 | Inspector "Edit text on canvas" 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-8.3 / P-M02-8.3 | Floating rich-text toolbar | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-8.4 / P-M02-8.4 | Commit / cancel | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-8.5 / P-M02-8.5 | "Type here..." placeholder | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.1 / P-M02-9.1 | View ▾ menu 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.2 / P-M02-9.2 | Overlay chords | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.3 / P-M02-9.3 | Snap / smart guides | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.4 / P-M02-9.4 | Grid overlay + Grid size 🆕 | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-9.5 / P-M02-9.5 | Snap-to-grid follows Grid 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.6 / P-M02-9.6 | Rulers + guides | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.7 / P-M02-9.7 | Guides saved with the site 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.8 / P-M02-9.8 | Badges | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.9 / P-M02-9.9 | X-Ray | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-9.10 / P-M02-9.10 | Component view / Outlines / Dev mode | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-9.11 / P-M02-9.11 | Overlay state remembered | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-10.1 / P-M02-10.1 | Docked footer bar 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-10.2 / P-M02-10.2 | Undo / Redo buttons | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-10.3 / P-M02-10.3 | Inspector toggle on bar | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-10.4 / P-M02-10.4 | Help (?) button on bar | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-10.5 / P-M02-10.5 | Toasts anchored to canvas | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.1 / P-M02-11.1 | Open by right-click / Shift+F10 / toolbar ⋯ 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.2 / P-M02-11.2 | Menu structure (rebuilt) 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.3 / P-M02-11.3 | Keyboard in menu | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.4 / P-M02-11.4 | Menu viewport clamping | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-11.5 / P-M02-11.5 | Disabled-row reasons | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M02-11.6 / P-M02-11.6 | Duplicate / Delete rows | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.7 / P-M02-11.7 | Structure › Copy / Cut / Paste | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.8 / P-M02-11.8 | Structure › Wrap in container / Unwrap element | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.9 / P-M02-11.9 | Structure › Replace with block… | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.10 / P-M02-11.10 | Structure › Save as component… | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.11 / P-M02-11.11 | Arrange › Bring to front / forward / Send backward / to back | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.12 / P-M02-11.12 | Style › Copy style / Paste style | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.13 / P-M02-11.13 | Lock / Unlock | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.14 / P-M02-11.14 | Group (⌘G) / Ungroup (⌘⇧G) | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-11.15 / P-M02-11.15 | Bind to CMS field… | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.16 / P-M02-11.16 | Add interaction | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.17 / P-M02-11.17 | Improve with AI | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.18 / P-M02-11.18 | Insert before / after / inside (First/Last), Wrap in section | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-11.19 / P-M02-11.19 | Layout "make it…" rows (flex row/column, grid 2 cols, center, space between) | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-11.20 / P-M02-11.20 | Quick Style presets (padding/margin/border/background/shadow) + Reset all styles | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-11.21 / P-M02-11.21 | Reveal in layers / Select parent rows | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-11.22 / P-M02-11.22 | Menu closes on deselect / delete / scroll / resize | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-11.23 / P-M02-11.23 | Windows shortcut hints | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.1 / P-M02-12.1 | Drop target highlight | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.2 / P-M02-12.2 | Between-elements cue 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.3 / P-M02-12.3 | Inside cue | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.4 / P-M02-12.4 | Add-drawer drag "Drop into" cue 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.5 / P-M02-12.5 | Invalid-drop badge + messages | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.6 / P-M02-12.6 | Drop sources: Add element/block, saved component, catalog component, template, media asset, OS image file | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.7 / P-M02-12.7 | Insert toast "X added" + Undo 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.8 / P-M02-12.8 | Media drop toast text | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-12.9 / P-M02-12.9 | Media drop inserts an image (not src on section) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.10 / P-M02-12.10 | OS image drop | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.11 / P-M02-12.11 | Drop while inline editing | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.12 / P-M02-12.12 | Auto-scroll near edges | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-12.13 / P-M02-12.13 | Nesting rules | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.1 / P-M02-13.1 | Drag-move an element | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.2 / P-M02-13.2 | ⌘/Ctrl-drag clone | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-13.3 / P-M02-13.3 | Multi-element drag | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.4 / P-M02-13.4 | Duplicate / paste keep styles | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-13.5 / P-M02-13.5 | Touch (tablet) long-press drag | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-13.6 / P-M02-13.6 | Section reorder grips | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.7 / P-M02-13.7 | Arrow-key selection nav | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.8 / P-M02-13.8 | Keyboard nudge (⇧/⌘ + arrows) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.9 / P-M02-13.9 | ⌥↑/⌥↓, ⌥Home/⌥End reorder | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.10 / P-M02-13.10 | ⌘Z / ⌘⇧Z / ⌘Y and canvas chords behind full-page tools | Fix | IAF-02 · Editor → canvas and local toolbar |
| M02-13.11 / P-M02-13.11 | Clipboard & edit chords | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.12 / P-M02-13.12 | App chords | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.13 / P-M02-13.13 | Canvas command palette (⌘⇧P, 520px, EDIT/VIEW/INSERT/TOOLS) | Defer | IAF-02 · Editor → canvas and local toolbar |
| M02-13.14 / P-M02-13.14 | Keyboard shortcuts sheet | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-13.15 / P-M02-13.15 | Keyboard legend card (rail Help) 🆕 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-14.1 / P-M02-14.1 | Comment mode toggle | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-14.2 / P-M02-14.2 | Pins | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-14.3 / P-M02-14.3 | New-comment popover | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-14.4 / P-M02-14.4 | Re-pin detached comment | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-14.5 / P-M02-14.5 | Orphan comments modal | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-14.6 / P-M02-14.6 | Replies / threads / @mentions | Defer | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-15.1 / P-M02-15.1 | Start collaboration (Site menu / ⌘K) | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-15.2 / P-M02-15.2 | Presence avatars + connection pill | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-15.3 / P-M02-15.3 | Remote cursors on canvas | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-15.4 / P-M02-15.4 | Remote selections / "editing this" / soft-locks / latency | Defer | IAF-19 · Topbar Notifications / canvas comments / presence |
| M02-16.1 / P-M02-16.1 | Interaction runtime (hover/click/focus/scroll/load/pressed triggers, presets) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M02-16.2 / P-M02-16.2 | "Reverse on leave/blur/release" | Defer | IAF-02 · Editor → canvas and local toolbar |
| M03-1 / P-M03-1 | Pages panel | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-2 / P-M03-2 | Header "⋯" panel menu 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-3 / P-M03-3 | "⌘K" keycap in the header | Defer | IAF-05 · Bottom Pages → page management / Page settings |
| M03-4 / P-M03-4 | Panel-local Go-to-page palette | Defer | IAF-05 · Bottom Pages → page management / Page settings |
| M03-5 / P-M03-5 | ⌘K "New page" / "Go to {page} (home)" 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-6 / P-M03-6 | Search pages field | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-7 / P-M03-7 | "/" focuses search | Defer | IAF-05 · Bottom Pages → page management / Page settings |
| M03-8 / P-M03-8 | No-results state | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-9 / P-M03-9 | Loading skeleton | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-10 / P-M03-10 | Empty state | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-11 / P-M03-11 | Load error | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-12 / P-M03-12 | One-page note | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-13 / P-M03-13 | Footer legend 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-14 / P-M03-14 | "+N from collections ›" 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-15 / P-M03-15 | Footer add actions | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-16 / P-M03-16 | Select / open a page | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-17 / P-M03-17 | Home glyph | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-18 / P-M03-18 | External-link page glyph/status | Defer | IAF-05 · Bottom Pages → page management / Page settings |
| M03-19 / P-M03-19 | Status chip 🆕 | Redesign | IAF-05 · Bottom Pages → page management / Page settings |
| M03-20 / P-M03-20 | "● Unpublished" marker 🆕 | Redesign | IAF-05 · Bottom Pages → page management / Page settings |
| M03-21 / P-M03-21 | Inline rename | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-22 / P-M03-22 | Rename → URL decision 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-23 / P-M03-23 | Drag to reorder | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-24 / P-M03-24 | Bulk selection | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-25 / P-M03-25 | Page context menu | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-26 / P-M03-26 | Menu chords ⌘D / ⌫ | Fix | IAF-05 · Bottom Pages → page management / Page settings |
| M03-27 / P-M03-27 | Duplicate | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-28 / P-M03-28 | Set as homepage | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-29 / P-M03-29 | Copy link | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-30 / P-M03-30 | Delete one page | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-31 / P-M03-31 | Replace layout with template… 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-32 / P-M03-32 | Server-backed folders 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-33 / P-M03-33 | Folder row | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-34 / P-M03-34 | New folder | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-35 / P-M03-35 | Move a page into a folder | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-36 / P-M03-36 | Reorder pages inside a folder | Redesign | IAF-05 · Bottom Pages → page management / Page settings |
| M03-37 / P-M03-37 | Bulk toolbar | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-38 / P-M03-38 | Move pages dialog 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-39 / P-M03-39 | Bulk delete | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-40 / P-M03-40 | Bulk duplicate | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-41 / P-M03-41 | New page modal 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-42 / P-M03-42 | Plan page limit | Redesign | IAF-05 · Bottom Pages → page management / Page settings |
| M03-43 / P-M03-43 | Listings view | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-44 / P-M03-44 | SEO score consistency | Fix | IAF-05 · Bottom Pages → page management / Page settings |
| M03-45 / P-M03-45 | "Open full listings ›" | Redesign | IAF-05 · Bottom Pages → page management / Page settings |
| M03-46 / P-M03-46 | Structure view | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-47 / P-M03-47 | Dialog shell | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-48 / P-M03-48 | Save model | Redesign | IAF-05 · Bottom Pages → page management / Page settings |
| M03-49 / P-M03-49 | Discard guard | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-50 / P-M03-50 | SEO score pill on the tab | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-51 / P-M03-51 | Google preview | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-52 / P-M03-52 | Score card and checklist | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-53 / P-M03-53 | Meta title override 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-54 / P-M03-54 | Meta description | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-55 / P-M03-55 | URL slug | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-56 / P-M03-56 | Search indexing in the SEO tab 🆕 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-57 / P-M03-57 | Social tab | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-58 / P-M03-58 | Visibility Live / Hidden | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-59 / P-M03-59 | Password-protected pages | Defer | IAF-05 · Bottom Pages → page management / Page settings |
| M03-60 / P-M03-60 | Indexing and Follow links toggles | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-61 / P-M03-61 | Custom `<head>` code | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-62 / P-M03-62 | Settings error boundary | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M03-63 / P-M03-63 | Full-canvas Templates view 🆕 | Keep | IAF-06 · Add → Templates workspace |
| M03-64 / P-M03-64 | Compact 280px drawer gallery and "Browse all templates" | Defer | IAF-06 · Add → Templates workspace |
| M03-65 / P-M03-65 | Search, filter pills, tag chips, pagination | Defer | IAF-06 · Add → Templates workspace |
| M03-66 / P-M03-66 | Workspace sidebar 🆕 | Keep | IAF-06 · Add → Templates workspace |
| M03-67 / P-M03-67 | Catalogue grid 🆕 | Keep | IAF-06 · Add → Templates workspace |
| M03-68 / P-M03-68 | Catalogue content | Keep | IAF-06 · Add → Templates workspace |
| M03-69 / P-M03-69 | In-place preview 🆕 | Keep | IAF-06 · Add → Templates workspace |
| M03-70 / P-M03-70 | Detail panel, "Where this template is used" dialog (Preview / Used in / Versions) | Defer | IAF-06 · Add → Templates workspace |
| M03-71 / P-M03-71 | Replace mode 🆕 | Keep | IAF-06 · Add → Templates workspace |
| M03-72 / P-M03-72 | Replace confirm | Keep | IAF-06 · Add → Templates workspace |
| M03-73 / P-M03-73 | "Reset global styles to template defaults" option | Defer | IAF-06 · Add → Templates workspace |
| M03-74 / P-M03-74 | Backup-failed dialog 🆕 | Keep | IAF-06 · Add → Templates workspace |
| M03-75 / P-M03-75 | New page from template | Keep | IAF-06 · Add → Templates workspace |
| M03-76 / P-M03-76 | Apply progress card | Keep | IAF-06 · Add → Templates workspace |
| M03-77 / P-M03-77 | Admin-only apply | Keep | IAF-06 · Add → Templates workspace |
| M03-78 / P-M03-78 | Pro templates | Keep | IAF-06 · Add → Templates workspace |
| M03-79 / P-M03-79 | Brand tokens after apply | Redesign | IAF-06 · Add → Templates workspace |
| M03-80 / P-M03-80 | Canvas empty-state template cards | Fix | IAF-06 · Add → Templates workspace |
| M03-81 / P-M03-81 | Save page as template | Redesign | IAF-06 · Add → Templates workspace |
| M03-82 / P-M03-82 | Legacy My Templates list, old preview modal, engine template manager | Defer | IAF-06 · Add → Templates workspace |
| M03-83 / P-M03-83 | Layers panel | Keep | IAF-03 · Rail → Layers |
| M03-84 / P-M03-84 | Header "⋯" menu 🆕 | Keep | IAF-03 · Rail → Layers |
| M03-85 / P-M03-85 | Search layers | Keep | IAF-03 · Rail → Layers |
| M03-86 / P-M03-86 | Breadcrumb band and purpose line | Defer | IAF-03 · Rail → Layers |
| M03-87 / P-M03-87 | Panel states | Keep | IAF-03 · Rail → Layers |
| M03-88 / P-M03-88 | Display settings | Keep | IAF-03 · Rail → Layers |
| M03-89 / P-M03-89 | Layer row | Keep | IAF-03 · Rail → Layers |
| M03-90 / P-M03-90 | Names and locks saved with the project 🆕 | Keep | IAF-03 · Rail → Layers |
| M03-91 / P-M03-91 | Dim in editor | Keep | IAF-03 · Rail → Layers |
| M03-92 / P-M03-92 | Drag to reorder or nest | Keep | IAF-03 · Rail → Layers |
| M03-93 / P-M03-93 | Multi-select and Select mode 🆕 | Keep | IAF-03 · Rail → Layers |
| M03-94 / P-M03-94 | Multi-select banner (Group / Dim / Delete / Done) | Defer | IAF-03 · Rail → Layers |
| M03-95 / P-M03-95 | Row keyboard | Keep | IAF-03 · Rail → Layers |
| M03-96 / P-M03-96 | Layer context menu | Keep | IAF-03 · Rail → Layers |
| M03-97 / P-M03-97 | Move to page dialog 🆕 | Keep | IAF-03 · Rail → Layers |
| M03-98 / P-M03-98 | Delete a multi-selection | Keep | IAF-03 · Rail → Layers |
| M03-99 / P-M03-99 | Lock/Unlock and Select children in the menu | Redesign | IAF-03 · Rail → Layers |
| M03-100 / P-M03-100 | Viewer read-only Layers | Keep | IAF-03 · Rail → Layers |
| M03-101 / P-M03-101 | Hover sync with the canvas | Keep | IAF-03 · Rail → Layers |
| M03-102 / P-M03-102 | History panel location 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-103 / P-M03-103 | Tabs: Session / Saves / Published 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-104 / P-M03-104 | History "⋯" menu | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-105 / P-M03-105 | Remembers the last view per site | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-106 / P-M03-106 | Viewer read-only History | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-107 / P-M03-107 | "‹ Activity" back row 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-108 / P-M03-108 | Saves list | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-109 / P-M03-109 | Version row ⋯ menu | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-110 / P-M03-110 | Saved-version details modal 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-111 / P-M03-111 | Saves filter 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-112 / P-M03-112 | Restore a version | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-113 / P-M03-113 | Delete a version | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-114 / P-M03-114 | Save a version 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-115 / P-M03-115 | Inline compare with the live draft | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-116 / P-M03-116 | Get AI Summary | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-117 / P-M03-117 | Milestone suggestion banner (AI) | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-118 / P-M03-118 | Approval band | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-119 / P-M03-119 | Retention and prune notes | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-120 / P-M03-120 | Saves states | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-121 / P-M03-121 | "Unavailable" hint names Ctrl+Z | Fix | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-122 / P-M03-122 | Session (undo trail) | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-123 / P-M03-123 | Restore to a step | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-124 / P-M03-124 | Session keyboard | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-125 / P-M03-125 | Session footer and states | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-126 / P-M03-126 | Time-Travel 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-127 / P-M03-127 | Time-Travel restore safety | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-128 / P-M03-128 | Time-Travel "no preview" point | Redesign | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-129 / P-M03-129 | Published tab | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-130 / P-M03-130 | Shared Compare view 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-131 / P-M03-131 | Activity panel 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-132 / P-M03-132 | Filters and rows | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-133 / P-M03-133 | Activity states | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M03-134 / P-M03-134 | Panel frame and header | Move | IAF-01 · Global shell / named task host |
| M03-135 / P-M03-135 | Panel search field | Move | IAF-01 · Global shell / named task host |
| M03-136 / P-M03-136 | Shared panel states | Move | IAF-01 · Global shell / named task host |
| M03-137 / P-M03-137 | Drill-in header | Move | IAF-01 · Global shell / named task host |
| M03-138 / P-M03-138 | Old sidebar SearchBar (28px, ⌘F hint) | Defer | IAF-01 · Global shell / named task host |
| M04-A1 / P-M04-A1 | Panel frame + header | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A2 / P-M04-A2 | Expand drawer to 700px | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A3 / P-M04-A3 | ⋯ › Paste HTML… dialog | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A4 / P-M04-A4 | Pinned "⌥ Paste HTML…" row (direct clipboard insert, 2 error toasts) | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A5 / P-M04-A5 | Search field | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A6 / P-M04-A6 | Search results | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A7 / P-M04-A7 | No-results state | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A8 / P-M04-A8 | Selection-aware purpose line ("Click a row to add it…") | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A9 / P-M04-A9 | Group headers | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A10 / P-M04-A10 | ★ FAVOURITES group | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A11 / P-M04-A11 | RECENT group | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A12 / P-M04-A12 | ELEMENTS (54 rows, flat) | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A13 / P-M04-A13 | Collection list element | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A14 / P-M04-A14 | Theme toggle element | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A15 / P-M04-A15 | Upload element | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A16 / P-M04-A16 | Element description bubble | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A17 / P-M04-A17 | Drag element to canvas + drag note | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A18 / P-M04-A18 | Disabled "Soon" row + reason tooltip | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A19 / P-M04-A19 | BLOCKS: 8 section cards | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A20 / P-M04-A20 | Block thumbnails | Redesign | IAF-04 · Rail → Add / quick insertion |
| M04-A21 / P-M04-A21 | Block hover pill + preview card | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A22 / P-M04-A22 | Drag block cards | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A23 / P-M04-A23 | Token-bound blocks | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A24 / P-M04-A24 | Blocks no longer in Add | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A25 / P-M04-A25 | "✦ Generate a block with AI…" row | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A26 / P-M04-A26 | BUILT-IN COMPONENTS (14 rows) | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A27 / P-M04-A27 | SAVED COMPONENTS | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A28 / P-M04-A28 | FROM LIBRARY sub-list | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A29 / P-M04-A29 | "Manage components ›" | Move | IAF-04 · Add → Saved components → Manage components |
| M04-A30 / P-M04-A30 | SAVED count vs Components panel | Fix | IAF-04 · Rail → Add / quick insertion |
| M04-A31 / P-M04-A31 | "Page templates ›" link | Move | IAF-04 · Add → Templates workspace |
| M04-A32 / P-M04-A32 | First-use tip card | Redesign | IAF-04 · Rail → Add / quick insertion |
| M04-A33 / P-M04-A33 | Tips strip (‹ › ✕, "bring back from Help") | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A34 / P-M04-A34 | "Quick Picks removed" one-time callout | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A35 / P-M04-A35 | Loading skeleton / "Couldn't load the element library" states | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-A36 / P-M04-A36 | Click-insert placement | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A37 / P-M04-A37 | Insert toasts | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A38 / P-M04-A38 | Replace with block… | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A39 / P-M04-A39 | Media insert → Assets | Redesign | IAF-04 · Rail → Add / quick insertion |
| M04-A40 / P-M04-A40 | Doors into Add | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A41 / P-M04-A41 | Keyboard | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-A42 / P-M04-A42 | Block default-content copy debt | Redesign | IAF-04 · Rail → Add / quick insertion |
| M04-A43 / P-M04-A43 | Live embeds + runtimes | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-B1 / P-M04-B1 | Generate screen | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-B2 / P-M04-B2 | Thinking + Stop | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-B3 / P-M04-B3 | Inserted state | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-B4 / P-M04-B4 | Failure cards | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-B5 / P-M04-B5 | Doors | Keep | IAF-04 · Rail → Add / quick insertion |
| M04-C1 / P-M04-C1 | "Add Child Element" modal | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-D1 / P-M04-D1 | Entry points | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D2 / P-M04-D2 | Back row "‹ Add" | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D3 / P-M04-D3 | List view | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D4 / P-M04-D4 | Detach-all notice | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D5 / P-M04-D5 | Empty / unavailable / error states | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D6 / P-M04-D6 | Footer "+ Create component" | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D7 / P-M04-D7 | Create component modal | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D8 / P-M04-D8 | Old Create fields | Defer | IAF-11 · Add → Saved components → Manage components |
| M04-D9 / P-M04-D9 | No-selection pre-check | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D10 / P-M04-D10 | Page-scoped masters | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D11 / P-M04-D11 | Detail header + inline rename | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D12 / P-M04-D12 | Insert from saved components | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D13 / P-M04-D13 | Update from selection… | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D14 / P-M04-D14 | Instance edits survive a master update (10-14 P0 check) | Redesign | IAF-11 · Add → Saved components → Manage components |
| M04-D15 / P-M04-D15 | Detach all | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D16 / P-M04-D16 | Duplicate master | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D17 / P-M04-D17 | Delete master | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D18 / P-M04-D18 | Master preview | Fix | IAF-11 · Add → Saved components → Manage components |
| M04-D19 / P-M04-D19 | STRUCTURE list | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D20 / P-M04-D20 | USED ON list | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D21 / P-M04-D21 | No in-place master editing | Fix | IAF-11 · Add → Saved components → Manage component → Choose source on canvas |
| M04-D22 / P-M04-D22 | Inspector component row | Keep | FD-INS-02/03 · Inspector → selected instance → Component row / override indicators / applicable sections |
| M04-D23 / P-M04-D23 | Per-field override dots | Keep | FD-INS-02/03 · Inspector → selected instance → Component row / override indicators / applicable sections |
| M04-D24 / P-M04-D24 | Instance root hides Layout/Text | Redesign | FD-INS-02/03 · Inspector → permitted instance fields and shared multi-target eligibility |
| M04-D25 / P-M04-D25 | Layers instance badge | Keep | IAF-03 · Layers → instance badge / boundary |
| M04-D26 / P-M04-D26 | Variant authoring | Defer | IAF-11 · Add → Saved components → Manage components |
| M04-D27 / P-M04-D27 | Rename modal, Select Variant modal, legacy ⋯ row menu, favourites | Defer | IAF-11 · Current component manager and Inspector variant selection |
| M04-D28 / P-M04-D28 | Export/import components to JSON file (engine-only) | Redesign | IAF-11 · Editor → Add → Saved components → Manage → Import / Export package |
| M04-D29 / P-M04-D29 | Server mirror + workspace library | Move | IAF-11 · Add → Saved components → Manage components |
| M04-D30 / P-M04-D30 | 100-component cap | Redesign | IAF-11 · Add → Saved components → Manage components |
| M04-E1 / P-M04-E1 | 27-component DS catalogue (Button…Feature grid) | Redesign | IAF-04 · Rail → Add / quick insertion |
| M04-E2 / P-M04-E2 | Brand › "Components" read-only summary (variants, "in use", saved count, read-only callout) | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-E3 / P-M04-E3 | Brand › Component styles | Defer | IAF-10 · Brand → catalogue/limited AI-styles route; Browse sections in Add |
| M04-E4 / P-M04-E4 | Draggable DS card grid (Atoms/Molecules/Organisms) — was built but never mounted | Defer | IAF-04 · Rail → Add / quick insertion |
| M04-F1 / P-M04-F1 | Placement | Move | IAF-12 · AI named right-side task |
| M04-F2 / P-M04-F2 | Doors | Move | IAF-12 · AI named right-side task |
| M04-F3 / P-M04-F3 | Removed doors | Defer | IAF-12 · AI named right-side task |
| M04-F4 / P-M04-F4 | Scope band + picker | Move | IAF-12 · AI named right-side task |
| M04-F5 / P-M04-F5 | Multi-element and site-wide runs | Move | IAF-12 · AI named right-side task |
| M04-F6 / P-M04-F6 | Element column (board 35) | Move | IAF-12 · AI named right-side task |
| M04-F7 / P-M04-F7 | Page idle state | Move | IAF-12 · AI named right-side task |
| M04-F8 / P-M04-F8 | Prompt composer | Move | IAF-12 · AI named right-side task |
| M04-F9 / P-M04-F9 | Pre-run scope note | Move | IAF-12 · AI named right-side task |
| M04-F10 / P-M04-F10 | Chat thread | Defer | IAF-12 · AI named right-side task |
| M04-F11 / P-M04-F11 | Draft mode row + "Auto-apply steps" checkbox | Defer | IAF-12 · AI named right-side task |
| M04-F12 / P-M04-F12 | Plan review | Move | IAF-12 · AI named right-side task |
| M04-F13 / P-M04-F13 | Run band + step list + Stop | Move | IAF-12 · AI named right-side task |
| M04-F14 / P-M04-F14 | Step approval card | Move | IAF-12 · AI named right-side task |
| M04-F15 / P-M04-F15 | End states | Move | IAF-12 · AI named right-side task |
| M04-F16 / P-M04-F16 | Undo all | Move | IAF-12 · AI named right-side task |
| M04-F17 / P-M04-F17 | Apply side effects | Move | IAF-12 · AI named right-side task |
| M04-F18 / P-M04-F18 | Full-panel states | Move | IAF-12 · AI named right-side task |
| M04-F19 / P-M04-F19 | Command set | Move | IAF-12 · AI named right-side task |
| M04-F20 / P-M04-F20 | Privileged action (publish) confirm | Move | IAF-12 · AI named right-side task |
| M04-F21 / P-M04-F21 | One-click content actions on an element (rewrite, shorten, tone, grammar) | Redesign | IAF-12 · AI named right-side task |
| M04-F22 / P-M04-F22 | AI helpers elsewhere (pointers) | Keep | IAF-12 · Existing page SEO / asset alt / History summary / Brand helper entry points |
| M04-F23 / P-M04-F23 | Unified Editor / Build AI workspace (spec 2026-10-13) | Defer | IAF-12 · AI named right-side task |
| M04-G1 / P-M04-G1 | Engine element types | Keep | IAF-04 · Rail → Add / quick insertion |
| M05-A1 / P-M05-A1 | Drawer header with live count | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A2 / P-M05-A2 | Library search in the panel | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A3 / P-M05-A3 | Search-scope line (server-side search) | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A4 / P-M05-A4 | "Manage assets ›" door | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A5 / P-M05-A5 | Filter ▾ popover (type + folder) 🆕 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A6 / P-M05-A6 | Asset grid + Load more | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A7 / P-M05-A7 | Click-insert / replace selected | Redesign | IAF-09 · Assets → Insert and return / Place on canvas → temporary Editor Asset picker; OS drop on Editor |
| M05-A8 / P-M05-A8 | Drag asset onto canvas | Redesign | IAF-09 · Assets → Insert and return / Place on canvas → temporary Editor Asset picker; OS drop on Editor |
| M05-A9 / P-M05-A9 | OS file drop on canvas | Redesign | IAF-09 · Assets → Insert and return / Place on canvas → temporary Editor Asset picker; OS drop on Editor |
| M05-A10 / P-M05-A10 | Hover-to-select check 🆕 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A11 / P-M05-A11 | Bulk bar (select mode) | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A12 / P-M05-A12 | Upload split button 🆕 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A13 / P-M05-A13 | Drop strip, progress and failed-upload rows | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A14 / P-M05-A14 | Quota band (≥80% / full) | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A15 / P-M05-A15 | Replacement upload (oversize → smaller file) | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A16 / P-M05-A16 | Empty, error, loading and no-match states | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A17 / P-M05-A17 | Pick mode (drawer is the picker) 🆕 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A18 / P-M05-A18 | Viewer read-only gating 🆕 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A19 / P-M05-A19 | Insert of a device-only asset | Fix | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A20 / P-M05-A20 | "APPLIED" badge and lock overlay on cards | Defer | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A21 / P-M05-A21 | Hub: preview, dims, alt text + Generate | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A22 / P-M05-A22 | Hub rows | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A23 / P-M05-A23 | Hub action list 🆕 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A24 / P-M05-A24 | Versions view + inline restore | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A25 / P-M05-A25 | Used-in view + Go | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A26 / P-M05-A26 | Optimise drill-in panel | Defer | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A27 / P-M05-A27 | Replace across site (drawer) | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A28 / P-M05-A28 | Icon browser drill-in | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A29 / P-M05-A29 | "Select Icon" modal (inspector) | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A30 / P-M05-A30 | Drawer stock browser overlay | Defer | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A31 / P-M05-A31 | Stock assets modal (one surface) | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A32 / P-M05-A32 | Stock: one provider missing | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A33 / P-M05-A33 | Stock save keeps alt and credit | Fix | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A34 / P-M05-A34 | Site fonts modal | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A35 / P-M05-A35 | Top bar | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A36 / P-M05-A36 | Folder rail | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A37 / P-M05-A37 | Folder delete with confirm 🆕 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A38 / P-M05-A38 | "Trash" row | Defer | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A39 / P-M05-A39 | Grid toolbar | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A40 / P-M05-A40 | List / grid views, drag ghost, file drop zone | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A41 / P-M05-A41 | Details rail | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A42 / P-M05-A42 | Library Regenerate alt on local-only asset | Fix | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A43 / P-M05-A43 | Asset context menu | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A44 / P-M05-A44 | Library modals | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A45 / P-M05-A45 | Confirm-delete + 8s Undo | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A46 / P-M05-A46 | Status bar | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A47 / P-M05-A47 | Image editor modal (Crop · Adjust · Resize · Optimise) | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A48 / P-M05-A48 | Saved state, discard and save-failed dialogs | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A49 / P-M05-A49 | Output | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A50 / P-M05-A50 | Accepted kinds + limits | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A51 / P-M05-A51 | Upload → Blob → `createAsset` registration | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A52 / P-M05-A52 | Upload progress | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A53 / P-M05-A53 | Auto alt text on upload | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A54 / P-M05-A54 | Unconfigured alt provider | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A55 / P-M05-A55 | Server quota trusts declared bytes | Fix | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A56 / P-M05-A56 | **Image loss after failed asset registration (10-14 P0)** | Fix | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-A57 / P-M05-A57 | Library scope = user, not site | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M05-B1 / P-M05-B1 | Rail entry | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B2 / P-M05-B2 | Drawer root | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B3 / P-M05-B3 | Loading / error | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B4 / P-M05-B4 | Drawer empty state | Fix | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B5 / P-M05-B5 | CMS workspace takeover 🆕 | Fix | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B6 / P-M05-B6 | Back to canvas 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B7 / P-M05-B7 | ⌘K "Manage CMS records" | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B8 / P-M05-B8 | Collection header, tabs, ⋯ 🆕 | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B9 / P-M05-B9 | Google Sheets / Airtable | Defer | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B10 / P-M05-B10 | Create Collection modal | Fix | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B11 / P-M05-B11 | Two-step wizard (baseline B9: content type, description, template/SEO) | Defer | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B12 / P-M05-B12 | Collection Settings 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B13 / P-M05-B13 | Products preset | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B14 / P-M05-B14 | Records table 🆕 | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B15 / P-M05-B15 | Records search 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B16 / P-M05-B16 | Empty collection states | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B17 / P-M05-B17 | Record sheet 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B18 / P-M05-B18 | Record footer | Fix | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B19 / P-M05-B19 | Record previews 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B20 / P-M05-B20 | Delete record | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B21 / P-M05-B21 | Conflict / gone banners 🆕 | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B22 / P-M05-B22 | In-drawer collection / record / fields / dynamic-pages views (baseline B2–B5) | Defer | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B23 / P-M05-B23 | Fields table 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B24 / P-M05-B24 | + Add field 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B25 / P-M05-B25 | Field inspector 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B26 / P-M05-B26 | Delete field 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B27 / P-M05-B27 | Field-type coverage | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B28 / P-M05-B28 | Dynamic pages pane 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B29 / P-M05-B29 | Server render + pre-publish checks 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B30 / P-M05-B30 | Pages-panel dynamic count | Fix | IAF-05 · Pages → dynamic-page count → exact CMS Dynamic pages settings |
| M05-B31 / P-M05-B31 | Sources | Fix | IAF-08 · Rail → CMS → Data; selected binding stays Inspector |
| M05-B32 / P-M05-B32 | Variables | Redesign | IAF-08 · Rail → CMS → Data; selected binding stays Inspector |
| M05-B33 / P-M05-B33 | Conditions | Fix | IAF-08; BD-20 · CMS Conditions index / legacy entry → exact Inspector Content → Conditions |
| M05-B34 / P-M05-B34 | Inspector › CMS binding section 🆕 | Keep | FD-INS-02/03 · Inspector → Content → CMS binding / collection list |
| M05-B35 / P-M05-B35 | Binding popover + header link button (baseline B11) | Keep | FD-INS-02/03 · Inspector → Content → CMS binding / collection list |
| M05-B36 / P-M05-B36 | Bound chip | Keep | FD-INS-02/03 · Inspector → Content → CMS binding / collection list |
| M05-B37 / P-M05-B37 | Canvas follows publish / unpublish / delete | Move | IAF-08 · Rail → CMS → Data; selected binding stays Inspector |
| M05-B38 / P-M05-B38 | Collection list (repeater) | Keep | FD-INS-02/03 · Inspector → Content → CMS binding / collection list |
| M05-B39 / P-M05-B39 | **Rich text through export (10-14 P0)** | Move | IAF-08 · Rail → CMS → Data; selected binding stays Inspector |
| M05-B40 / P-M05-B40 | Handlebars / Liquid template export mode | Defer | IAF-08 · Rail → CMS → Data; selected binding stays Inspector |
| M05-B41 / P-M05-B41 | Server is authority 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B42 / P-M05-B42 | Persistent outbox + retry 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B43 / P-M05-B43 | Conflict handling 🆕 | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B44 / P-M05-B44 | Gone / invalid 🆕 | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B45 / P-M05-B45 | Soft-delete tombstones 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B46 / P-M05-B46 | Publish gate + server snapshot 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B47 / P-M05-B47 | Import CSV 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B48 / P-M05-B48 | Import JSON | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-B49 / P-M05-B49 | Records table modal (baseline B10) | Defer | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M05-C1 / P-M05-C1 | Form block | Keep | IAF-04 · Add → form/contact/field insertion → Inspector Content |
| M05-C2 / P-M05-C2 | Contact Form component | Keep | IAF-04 · Add → form/contact/field insertion → Inspector Content |
| M05-C3 / P-M05-C3 | Contact section 🆕 | Fix | IAF-04 · Add → Contact block → Inspector Content; Add contact form separately |
| M05-C4 / P-M05-C4 | Field elements | Keep | IAF-04 · Add → form/contact/field insertion → Inspector Content |
| M05-C5 / P-M05-C5 | Password field on public forms | Fix | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C6 / P-M05-C6 | Upload field | Defer | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C7 / P-M05-C7 | Fields section 🆕 | Keep | FD-INS-02/03 · Inspector → Content → Fields / selected field controls |
| M05-C8 / P-M05-C8 | Per-field inspector 🆕 | Keep | FD-INS-02/03 · Inspector → Content → Fields / selected field controls |
| M05-C9 / P-M05-C9 | After submit 🆕 | Keep | IAF-13 · Inspector → Behaviour → After submit |
| M05-C10 / P-M05-C10 | Old settings (ACTION Store/Webhook/Email, WEBHOOK URL, ERROR MESSAGE, EMAIL FIELD NAME, FORM ID) | Defer | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C11 / P-M05-C11 | Send to (notification email) 🆕 | Keep | IAF-13 · Inspector → Behaviour → After submit |
| M05-C12 / P-M05-C12 | Spam protection toggle | Keep | IAF-13 · Inspector → Behaviour → After submit |
| M05-C13 / P-M05-C13 | **Publish wiring (10-14 P0 "submissions broken")** 🆕 | Keep | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C14 / P-M05-C14 | Public endpoint | Keep | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C15 / P-M05-C15 | Visitor outcome 🆕 | Keep | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C16 / P-M05-C16 | Spam / abuse limits | Redesign | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C17 / P-M05-C17 | Notifications 🆕 | Keep | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C18 / P-M05-C18 | Unified inbox | Keep | IAF-13 · Site settings → Form submissions |
| M05-C19 / P-M05-C19 | Inbox / Unread / Spam / Archived filters, per-form select, Not spam / Unarchive | Redesign | IAF-13 · Site settings → Form submissions → Spam / Archived views |
| M05-C20 / P-M05-C20 | "Configure in Inspector ›" 🆕 | Fix | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M05-C21 / P-M05-C21 | "Sent from <url>" | Fix | IAF-13 · Site settings → Form submissions → submission detail |
| M05-C22 / P-M05-C22 | Retention 🆕 | Keep | IAF-13 · Site settings → Form submissions |
| M05-C23 / P-M05-C23 | Engine `FormHandler` (baseline C4 validation messages, actions, email defaults) | Redesign | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M06-S1 / P-M06-S1 | Full-pane Settings (sidebar 256 + pane) | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S2 / P-M06-S2 | Phase B nav IA 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S3 / P-M06-S3 | Old nav rows "Fonts & colours" / "Export" doors | Defer | IAF-14 · Topbar → Site settings → named screen |
| M06-S4 / P-M06-S4 | Scope line per screen 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S5 / P-M06-S5 | Role-based read-only screens 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S6 / P-M06-S6 | Role foot + Permissions dialog 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S7 / P-M06-S7 | Search Mode (replaces Search modal) 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S8 / P-M06-S8 | Footer save bar (conditional) 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S9 / P-M06-S9 | "Saved · applies on next publish" toast 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S10 / P-M06-S10 | Unsaved settings guard | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S11 / P-M06-S11 | Escape leaves Settings | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S12 / P-M06-S12 | Per-screen save-error banner | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S13 / P-M06-S13 | Load / error cards blame "your connection" | Fix | IAF-14 · Topbar → Site settings → named screen |
| M06-S14 / P-M06-S14 | Remembered screen per site + deep links | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S15 / P-M06-S15 | Plan gate — LockedScreen | Keep | IAF-14 · Topbar → Site settings → named screen |
| M06-S16 / P-M06-S16 | Full-page Settings keeps covered editor chrome focusable | Fix | IAF-14 · Topbar → Site settings → named screen |
| M06-S17 / P-M06-S17 | Inconsistent exits across full-page tools | Fix | IAF-14 · Topbar → Site settings → named screen |
| M06-S18 / P-M06-S18 | Overview group cards | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S19 / P-M06-S19 | Needs attention card | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S20 / P-M06-S20 | Site-state strips 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S21 / P-M06-S21 | General · Site identity | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S22 / P-M06-S22 | General · premature validation | Fix | IAF-14 · Topbar → Site settings → named screen |
| M06-S23 / P-M06-S23 | General · Advanced › Site URL slug 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S24 / P-M06-S24 | General · Language select, Social links, Grid size, Snap to grid | Defer | IAF-14 · Topbar → Site settings → named screen |
| M06-S25 / P-M06-S25 | Languages · Default locale (footer save) | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S26 / P-M06-S26 | Languages · Locales table (immediate) | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S27 / P-M06-S27 | Languages · Auto-redirect by browser | Defer | IAF-14 · Topbar → Site settings → named screen |
| M06-S28 / P-M06-S28 | SEO · Defaults card | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S29 / P-M06-S29 | SEO · Social profiles (6 networks) 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S30 / P-M06-S30 | SEO · Indexing card 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S31 / P-M06-S31 | Per-page overrides strip | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S32 / P-M06-S32 | Yoast-level SEO (structured data, sitemap UI, page overview, search/social previews, title template) | Defer | IAF-14 · Topbar → Site settings → named screen |
| M06-S33 / P-M06-S33 | Domains list | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S34 / P-M06-S34 | Add a domain dialog | Redesign | IAF-14 · Topbar → Site settings → named screen |
| M06-S35 / P-M06-S35 | Set as primary 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S36 / P-M06-S36 | Manage DNS view | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S37 / P-M06-S37 | Redirects rules table | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S38 / P-M06-S38 | Redirects CSV import / export 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S39 / P-M06-S39 | 404 suggester | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S40 / P-M06-S40 | Slug-change repair draft | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S41 / P-M06-S41 | Access · Password protection 🆕 | Redesign | IAF-14 · Topbar → Site settings → named screen |
| M06-S42 / P-M06-S42 | Access · Share links door 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S43 / P-M06-S43 | Analytics providers | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S44 / P-M06-S44 | Analytics Verify + Connection verified dialog | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S45 / P-M06-S45 | Analytics consent toggle | Defer | IAF-14 · Topbar → Site settings → named screen |
| M06-S46 / P-M06-S46 | Form submissions inbox (was "unbuilt") 🆕 | Keep | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M06-S47 / P-M06-S47 | Forms lifecycle edge | Fix | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M06-S48 / P-M06-S48 | Custom code | Keep | IAF-14 · Topbar → Site settings → named screen |
| M06-S49 / P-M06-S49 | Security headers | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S50 / P-M06-S50 | Danger zone · Archive / Unarchive 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S51 / P-M06-S51 | Danger zone · Transfer site 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S52 / P-M06-S52 | Danger zone · Delete site 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S53 / P-M06-S53 | Workspace doors 🆕 | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-S54 / P-M06-S54 | Integrations screen (Formspree, Netlify, Stripe, Mailchimp, ConvertKit, Zapier "coming soon") | Defer | IAF-14 · Topbar → Site settings → named screen |
| M06-S55 / P-M06-S55 | Webhooks screen (endpoint, signing secret, deliveries) | Defer | IAF-14 · Topbar → Site settings → named screen |
| M06-S56 / P-M06-S56 | Settings-server authz | Move | IAF-14 · Topbar → Site settings → named screen |
| M06-P1 / P-M06-P1 | Pre-publish checks inside the panel 🆕 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P2 / P-M06-P2 | New check rows 🆕 | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M06-P3 / P-M06-P3 | "SEO configured" check | Fix | IAF-16 · Topbar Publish / Issues named task |
| M06-P4 / P-M06-P4 | Client approval row 🆕 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P5 / P-M06-P5 | Release to / Environment | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M06-P6 / P-M06-P6 | Changes in this session | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P7 / P-M06-P7 | Last deploy | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P8 / P-M06-P8 | Panel ⋯ menu 🆕 | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M06-P9 / P-M06-P9 | Unpublish confirm 🆕 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P10 / P-M06-P10 | Single CTA + gate reason 🆕 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P11 / P-M06-P11 | Progress block | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P12 / P-M06-P12 | Cancel running publish 🆕 | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M06-P13 / P-M06-P13 | Failure block 🆕 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P14 / P-M06-P14 | Publish log modal | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P15 / P-M06-P15 | Reconnect Vercel modal 🆕 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P16 / P-M06-P16 | Just published | Redesign | IAF-16 · Topbar Publish / Issues named task |
| M06-P17 / P-M06-P17 | Simulated publish notice 🆕 | Defer | IAF-16 · Topbar Publish / Issues named task |
| M06-P18 / P-M06-P18 | Flag off / deploy unreachable | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-P19 / P-M06-P19 | Legal line | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-W1 / P-M06-W1 | Two-step wizard (Review → Confirm) | Defer | IAF-16 · Topbar Publish / Issues named task |
| M06-W2 / P-M06-W2 | "Publish to production?" confirm | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-W3 / P-M06-W3 | Checks-failed blocks confirm 🆕 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-W4 / P-M06-W4 | Open-errors gate 🆕 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-W5 / P-M06-W5 | Approval gate dialogs | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-W6 / P-M06-W6 | Stale approval | Keep | IAF-16 · Topbar Publish / Issues named task |
| M06-W7 / P-M06-W7 | Options step / scheduled publish | Defer | IAF-16 · Topbar Publish / Issues named task |
| M06-W8 / P-M06-W8 | Topbar publish opens confirm over the panel | Fix | IAF-16 · Topbar Publish / Issues named task |
| M06-H1 / P-M06-H1 | Published versions list | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M06-H2 / P-M06-H2 | Republish (rollback) 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M06-H3 / P-M06-H3 | Version details overlay 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M06-H4 / P-M06-H4 | One Compare host 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M06-R1 / P-M06-R1 | Availability | Keep | IAF-17 · Review named task → round / thread |
| M06-R2 / P-M06-R2 | Panel frame + status line 🆕 | Keep | IAF-17 · Review named task → round / thread |
| M06-R3 / P-M06-R3 | Team comments before any round 🆕 | Keep | IAF-17 · Review named task → round / thread |
| M06-R4 / P-M06-R4 | Thread groups | Keep | IAF-17 · Review named task → round / thread |
| M06-R5 / P-M06-R5 | Locate › and Copy link 🆕 | Keep | IAF-17 · Review named task → round / thread |
| M06-R6 / P-M06-R6 | Next › walk 🆕 | Keep | IAF-17 · Review named task → round / thread |
| M06-R7 / P-M06-R7 | Reattach modal 🆕 | Keep | IAF-17 · Review named task → round / thread |
| M06-R8 / P-M06-R8 | Note composer | Redesign | IAF-17 · Review named task → round / thread |
| M06-R9 / P-M06-R9 | Review ⋯ menu 🆕 | Keep | IAF-17 · Review named task → round / thread |
| M06-R10 / P-M06-R10 | Round history modal 🆕 | Keep | IAF-17 · Review named task → round / thread |
| M06-R11 / P-M06-R11 | Revoke / withdraw confirm | Fix | IAF-17 · Review named task → round / thread |
| M06-R12 / P-M06-R12 | Send for review popover | Keep | IAF-17 · Review named task → round / thread |
| M06-R13 / P-M06-R13 | Compare with approved | Keep | IAF-17 · Review named task → round / thread |
| M06-R14 / P-M06-R14 | Client `/review/<token>` page | Redesign | IAF-17 · Review named task → round / thread |
| M06-R15 / P-M06-R15 | Resolve as workspace ADMIN | Fix | IAF-17 · Review named task → round / thread |
| M06-R16 / P-M06-R16 | Hand a comment to AI | Defer | IAF-17 · Review named task → round / thread |
| M06-X1 / P-M06-X1 | Export modal + entry points | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M06-X2 / P-M06-X2 | Formats | Defer | IAF-15 · Topbar Preview / Site menu Export |
| M06-X3 / P-M06-X3 | Preview / Code / Options tabs | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M06-X4 / P-M06-X4 | Preparing / Ready / Failed panels 🆕 | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M06-X5 / P-M06-X5 | ZIP contents 🆕 | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M06-X6 / P-M06-X6 | React export | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M06-X7 / P-M06-X7 | Exported page fidelity | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M06-C1 / P-M06-C1 | Set Up Products Collection modal | Redesign | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-C2 / P-M06-C2 | Cart + Stripe checkout on published site | Defer | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-N1 / P-M06-N1 | Standalone "Animation" inspector section | Defer | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-N2 / P-M06-N2 | Animation row in Interactions 🆕 | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-N3 / P-M06-N3 | Animation editor | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-N4 / P-M06-N4 | Interactions flat list + drill-in 🆕 | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-N5 / P-M06-N5 | Trigger picker | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-N6 / P-M06-N6 | Interaction editor | Redesign | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-N7 / P-M06-N7 | Published interaction runtime | Redesign | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-N8 / P-M06-N8 | Transform & motion section 🆕 | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-G1 / P-M06-G1 | Email marketing (Mailchimp, SendGrid…) simulation | Defer | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M06-G2 / P-M06-G2 | In-browser form/email service | Defer | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M06-Y1 / P-M06-Y1 | Local autosave (non-dashboard sites) | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y2 / P-M06-Y2 | Dashboard autosave | Redesign | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y3 / P-M06-Y3 | Auto-retry failed save 🆕 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y4 / P-M06-Y4 | Autosave held during conflict | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y5 / P-M06-Y5 | Secrets kept out of browser storage | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y6 / P-M06-Y6 | Escape-cancelled resize | Fix | IAF-02 · Editor → canvas and local toolbar |
| M06-Y7 / P-M06-Y7 | Keyboard resize stores `NaNpx` | Fix | IAF-02 · Editor → canvas and local toolbar |
| M06-Y8 / P-M06-Y8 | Save refused (never loaded / site gone) | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y9 / P-M06-Y9 | Save conflict dialog | Redesign | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y10 / P-M06-Y10 | Serialized saves 🆕 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y11 / P-M06-Y11 | Settings mirror refused | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y12 / P-M06-Y12 | CMS bindings too large 🆕 | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M06-Y13 / P-M06-Y13 | Save pill | Fix | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y14 / P-M06-Y14 | Save-failed card 🆕 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y15 / P-M06-Y15 | Publish blocked after failed save 🆕 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y16 / P-M06-Y16 | Open in another tab notice 🆕 | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M06-Y17 / P-M06-Y17 | Unsaved-work copy per site | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y18 / P-M06-Y18 | "Restore my edits" toast | Fix | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y19 / P-M06-Y19 | Retry / ⌘S re-applies kept copy | Fix | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y20 / P-M06-Y20 | View-mode variant 🆕 | Keep | IAF-20 · Per-action capability result at existing destinations |
| M06-Y21 / P-M06-Y21 | Recovery banner (crash marker) | Redesign | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y22 / P-M06-Y22 | Toast closes once used 🆕 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y23 / P-M06-Y23 | Shared mirror retry queue | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y24 / P-M06-Y24 | Exit guard on pending mirrors | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y25 / P-M06-Y25 | Persisted CMS outbox 🆕 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M06-Y26 / P-M06-Y26 | CMS hydration error copy | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M06-Y27 / P-M06-Y27 | Saved-templates hydration states | Defer | IAF-06 · Add → Templates workspace |
| M06-Y28 / P-M06-Y28 | Project save queue across reload | Redesign | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y29 / P-M06-Y29 | Crash marker + recheck on return | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y30 / P-M06-Y30 | Load-error banner 🆕 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y31 / P-M06-Y31 | Local version history (50, prune auto first) | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M06-Y32 / P-M06-Y32 | Storage-full recovery | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y33 / P-M06-Y33 | Versions export/import JSON | Defer | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M06-Y34 / P-M06-Y34 | Server versions + rename 🆕 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M06-Y35 / P-M06-Y35 | Migration progress modal | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y36 / P-M06-Y36 | "Project update failed" toast | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y37 / P-M06-Y37 | Brand read-only after failed migration 🆕 | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M06-Y38 / P-M06-Y38 | Notifications bell | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M06-Y39 / P-M06-Y39 | Role gates disabled with reason | Keep | IAF-20 · Per-action capability result at existing destinations |
| M06-Y40 / P-M06-Y40 | Media upload local fallback + retry | Redesign | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M06-Y41 / P-M06-Y41 | AI alt text auto | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M06-Y42 / P-M06-Y42 | Asset versions | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M06-Y43 / P-M06-Y43 | Unsaved tab-switch dialog 🆕 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M06-Y44 / P-M06-Y44 | Site-scope authz on save/sync endpoints | Keep | IAF-20 · Per-action capability result at existing destinations |
| M06-Y45 / P-M06-Y45 | Site-scope authz holes elsewhere | Fix | IAF-20 · Per-action capability result at existing destinations |
| M06-F1 / P-M06-F1 | FEATURE_PUBLISH | Keep | IAF-20 · Per-action capability result at existing destinations |
| M06-F2 / P-M06-F2 | FEATURE_DS_AI | Keep | IAF-20 · Per-action capability result at existing destinations |
| M06-F3 / P-M06-F3 | FEATURE_COLLAB | Keep | IAF-20 · Per-action capability result at existing destinations |
| M06-F4 / P-M06-F4 | Dev build (IS_DEV_BUILD) | Defer | IAF-20 · Per-action capability result at existing destinations |
| M06-F5 / P-M06-F5 | Legacy static flags (AI_ASSISTANT … VERSION_HISTORY) | Defer | IAF-20 · Per-action capability result at existing destinations |
| M07-1 / P-M07-1 | Tab strip Style · Behaviour · Effects | Redesign | FD-INS-02/03 · Inspector → persistent header → tab strip |
| M07-2 / P-M07-2 | Flat single scrolling section list (09-16 model) | Keep | FD-INS-02/03 · Inspector → current tab → section list |
| M07-3 / P-M07-3 | Page panel (nothing selected, or the page root selected) | Keep | FD-INS-02/03 · Page appearance panel → Background / Max width / Font / Text colour / Spacing |
| M07-4 / P-M07-4 | Empty-state prompt "Select something on the canvas… / ✦ Ask AI ›" | Keep | FD-INS-02/03 · Page appearance panel → page-owned controls |
| M07-5 / P-M07-5 | Page panel header actions | Fix | FD-INS-02/03 · Page appearance header → Page actions / Ask AI / Hide; SEO → Pages → current Page settings → SEO |
| M07-6 / P-M07-6 | Loading skeleton (site still arriving) | Keep | FD-INS-02/03 · Inspector body → Loading project |
| M07-7 / P-M07-7 | "Template applied!" banner | Keep | FD-INS-02/03 · Page appearance → transient Template applied notice |
| M07-8 / P-M07-8 | Error boundary | Fix | FD-INS-02/03 · Inspector body → Unable to display inspector |
| M07-9 / P-M07-9 | AI-run takeover | Redesign | FD-INS-02/03 · Inspector host → current AI task; return → original Inspector context |
| M07-10 / P-M07-10 | Whole-site takeover ("Whole site" scope) | Keep | FD-INS-02/03 · Site tasks → their existing dedicated workspaces; Inspector → selected object/Page appearance |
| M07-11 / P-M07-11 | Theme-toggle block inspector | Keep | FD-INS-02/03 · Theme toggle special panel → site scope → Open Brand → Colour mode |
| M07-12 / P-M07-12 | Read-only status line | Fix | FD-INS-02/03 · Persistent target header → restriction status; fields/actions → same gate |
| M07-13 / P-M07-13 | Section display modes | Keep | FD-INS-02/03 · Each tab → section headers and active summaries |
| M07-14 / P-M07-14 | Per-section error band | Fix | FD-INS-02/03 · Affected section → inline error region |
| M07-15 / P-M07-15 | Scroll memory per element | Redesign | FD-INS-02/03 · Inspector UI state → per-object, per-tab scroll restore |
| M07-16 / P-M07-16 | Selection announcement (screen reader) | Keep | FD-INS-02/03 · Inspector target header → assistive announcement |
| M07-17 / P-M07-17 | Footer "N of M sections apply" | Keep | FD-INS-02/03 · Each applicable section → active summary; no applicability-count footer |
| M07-18 / P-M07-18 | Simplified density `?density=fewer` + "Show all controls" | Defer | FD-INS-02/03 · Current tabs → section disclosure / More settings / property search |
| M07-19 / P-M07-19 | "More settings" disclosure | Fix | FD-INS-02/03 · Applicable section → More settings disclosure |
| M07-20 / P-M07-20 | ⌘K "Jump to property" | Fix | FD-INS-02/03 · Command palette → Jump to property → mapped tab/section/field |
| M07-21 / P-M07-21 | Hide inspector | Keep | FD-INS-02/03 · Persistent header → Hide inspector; existing show command/shortcut |
| M07-22 / P-M07-22 | Breadcrumb path | Keep | FD-INS-02/03 · Persistent header → Element path breadcrumbs |
| M07-23 / P-M07-23 | Type icon + editable element name | Fix | FD-INS-02/03 · Persistent header → type icon / Element name |
| M07-24 / P-M07-24 | ✦ AI chip | Keep | FD-INS-02/03 · Persistent header → Ask AI about selected element |
| M07-25 / P-M07-25 | Pick element on canvas (crosshair) | Keep | FD-INS-02/03 · Canvas → selection tools; Inspector → breadcrumbs |
| M07-26 / P-M07-26 | Select parent button | Keep | FD-INS-02/03 · Persistent header → breadcrumb ancestor navigation |
| M07-27 / P-M07-27 | Header chain-link "Bind to collection field" popover + "Bound" chip | Keep | FD-INS-02/03 · Content → CMS binding; header → Bound status link |
| M07-28 / P-M07-28 | Status marks row | Redesign | FD-INS-02/03 · Persistent target header → status marks |
| M07-29 / P-M07-29 | ⋯ Element actions menu | Fix | FD-INS-02/03 · Persistent header → Element actions menu |
| M07-30 / P-M07-30 | "Apply style to all … on this page" confirm | Fix | FD-INS-02/03 · Header → Element actions → Apply style to matching elements on this page |
| M07-31 / P-M07-31 | Inspector delete confirmation modal ("Delete Text?") | Keep | FD-INS-02/03 · Header/keyboard → shared Delete command and existing impact handling |
| M07-32 / P-M07-32 | Context row placement | Move | FD-INS-02/03 · Persistent header → target scope; Style/Effects → compact layer context directly under tabs |
| M07-33 / P-M07-33 | Scope pill This / All like this / Whole site + reach banner | Keep | FD-INS-02/03 · Element actions → scoped Apply style dialog; global modules retain own homes |
| M07-34 / P-M07-34 | State chip "State: Base ▾" | Keep | FD-INS-02/03 · Style/Effects context → State selector |
| M07-35 / P-M07-35 | State override line | Merge | FD-INS-02/03 · Style/Effects context → source summary / state override action |
| M07-36 / P-M07-36 | Breakpoint picker inside the inspector | Keep | FD-INS-02/03 · Canvas toolbar → Breakpoint selector; Inspector → read-only breakpoint mirror |
| M07-37 / P-M07-37 | Breakpoint revert line | Fix | FD-INS-02/03 · Style/Effects context → Remove [breakpoint] overrides |
| M07-38 / P-M07-38 | Field override dot as a control | Redesign | FD-INS-02/03 · Every style/effect field → Source details control |
| M07-39 / P-M07-39 | Override information shown several times | Merge | FD-INS-02/03 · Header context + section summary + field Source details |
| M07-40 / P-M07-40 | State banner "Editing :hover — not Base" | Keep | FD-INS-02/03 · Style/Effects context → State selector/readout |
| M07-41 / P-M07-41 | "Detach instance" pill in the context row (Pro only) | Keep | FD-INS-02/03 · Persistent component identity → Component actions → Detach instance |
| M07-42 / P-M07-42 | Effective (inherited/computed) values in fields | Fix | FD-INS-02/03 · Every field → effective value + source readout |
| M07-43 / P-M07-43 | Multi header | Redesign | FD-INS-02/03 · Persistent target header → N selected / eligible and locked counts |
| M07-44 / P-M07-44 | Align / Distribute / Group bar | Fix | FD-INS-02/03 · Persistent multi-selection actions → Align / Distribute / Group |
| M07-45 / P-M07-45 | Same panel, intersection of sections, "Mixed" fields | Fix | FD-INS-02/03 · Every tab → intersection by individual control |
| M07-46 / P-M07-46 | 5-row batch style panel (Background / Text color / Radius / Padding / Font size) | Keep | FD-INS-02/03 · Style → normal grouped fields with multi-selection contract |
| M07-47 / P-M07-47 | Capability table drives presence | Redesign | FD-INS-02/03 · Inspector registry → per-field capability / source metadata |
| M07-48a / P-M07-48a | Text types: heading, text, paragraph, link, label | Move | FD-INS-02/03 · Content → Text; Style → Typography; Behaviour → Link where supported |
| M07-48b / P-M07-48b | Button | Move | FD-INS-02/03 · Content → Button; Style → Text inside; Behaviour → Link if supported |
| M07-48c / P-M07-48c | Form fields: input, textarea, select, upload; checkbox, radio, switch | Move | FD-INS-02/03 · Content → Field / Choice; Content → Attributes → field advanced |
| M07-48d / P-M07-48d | Media: image, video, audio, svg, icon, lottie, video-embed, map-embed | Move | FD-INS-02/03 · Content → Media; Style → Media presentation; Behaviour → Playback |
| M07-48e / P-M07-48e | Spacer, divider | Keep | FD-INS-02/03 · Style → Size / Spacing / Fill / Border; Content → Attributes |
| M07-48f / P-M07-48f | Widgets: countdown, progress, accordion | Move | FD-INS-02/03 · Content → Countdown data / Progress data / Accordion items; Behaviour → completion/opening |
| M07-48g / P-M07-48g | Layout primitives: flex, stack, grid, columns | Redesign | FD-INS-02/03 · Style → Children layout / Placement / Size; Content → Columns structure |
| M07-48h / P-M07-48h | Containers: container, section, card, cta (+ Link); hero, features, header, footer, nav, navbar, pricing, social, testimonials, tabs, list, table, gallery, custom, product-* | Keep | FD-INS-02/03 · Style → Children layout / Placement / Text inside / Size / Spacing / Fill / Border; Content → child-edit entry / Attributes |
| M07-48i / P-M07-48i | Structural child (list-item) | Keep | FD-INS-02/03 · Style → applicable structural-child presentation; Content → Attributes / Edit child content |
| M07-48j / P-M07-48j | form / slider / collection-list | Move | FD-INS-02/03 · Content → Fields / Slides / Collection; Behaviour → After submit / Playback |
| M07-48k / P-M07-48k | Component instance root | Redesign | FD-INS-02/03 · Persistent header → Component instance; tabs → permitted instance fields |
| M07-49 / P-M07-49 | Component row (instances) | Move | FD-INS-02/03 · Persistent header → Component identity and actions |
| M07-50 / P-M07-50 | Type block frame | Redesign | FD-INS-02/03 · Content / Style / Behaviour → named type-specific groups |
| M07-51 / P-M07-51 | Heading block | Move | FD-INS-02/03 · Content → Text; Style → Typography → Font-size token |
| M07-52 / P-M07-52 | Text / Paragraph / Link / Label block | Move | FD-INS-02/03 · Content → Text → Edit text on canvas; Style → Typography → Font-size token |
| M07-53 / P-M07-53 | Button block | Move | FD-INS-02/03 · Content → Button → Edit text / Type / Disabled |
| M07-54 / P-M07-54 | Input / Textarea / Select / Upload block | Redesign | FD-INS-02/03 · Content → Field → General / Options / Validation; Attributes → Advanced field attributes |
| M07-55 / P-M07-55 | Checkbox / Radio / Switch block | Redesign | FD-INS-02/03 · Content → Choice → Label / Name / Submission value / Checked by default / Required |
| M07-56 / P-M07-56 | Image block | Move | FD-INS-02/03 · Content → Image → Source / Alt text / Loading; Style → Media presentation → Fit |
| M07-57 / P-M07-57 | Video block | Move | FD-INS-02/03 · Content → Video → Source / Poster; Behaviour → Playback; Content → Attributes → Preload |
| M07-58 / P-M07-58 | Audio block | Move | FD-INS-02/03 · Content → Audio → Source; Behaviour → Playback |
| M07-59 / P-M07-59 | SVG block | Fix | FD-INS-02/03 · Content → SVG → Source / Replace source |
| M07-60 / P-M07-60 | Icon block | Fix | FD-INS-02/03 · Content → Icon → Change icon; Style → Icon appearance → Size / Stroke width |
| M07-61 / P-M07-61 | Video embed block | Move | FD-INS-02/03 · Content → Video embed → Video URL; Style → Media presentation → Ratio; Behaviour → Playback |
| M07-62 / P-M07-62 | Map embed / Lottie blocks | Move | FD-INS-02/03 · Content → Map → Location; Content → Lottie → Animation URL |
| M07-63 / P-M07-63 | Countdown block | Fix | FD-INS-02/03 · Content → Countdown → Ends at / Message; Behaviour → Countdown completion → When done |
| M07-64 / P-M07-64 | Progress block | Fix | FD-INS-02/03 · Content → Progress → Value / Maximum / Show label |
| M07-65 / P-M07-65 | Accordion block | Move | FD-INS-02/03 · Content → Accordion → Items / Edit item content; Behaviour → Accordion → Initial open states / Allow several open |
| M07-66 / P-M07-66 | Flex / Stack block | Move | FD-INS-02/03 · Style → Children layout → Flex |
| M07-67 / P-M07-67 | Grid block; Columns block | Redesign | FD-INS-02/03 · Style → Children layout → Grid; Content → Columns → Structure; Style → Columns → Gap |
| M07-68 / P-M07-68 | Product type block | Defer | FD-INS-02/03 · Existing product-* containers → generic Style/Content children; optional future Product authoring |
| M07-69 / P-M07-69 | Layout › Display + flex controls | Redesign | FD-INS-02/03 · Style → Children layout → Display / Flex |
| M07-70 / P-M07-70 | Layout › grid controls | Fix | FD-INS-02/03 · Style → Children layout → Grid |
| M07-71 / P-M07-71 | Layout › Position | Redesign | FD-INS-02/03 · Style → Placement → Position / Insets / Z-index |
| M07-72 / P-M07-72 | Layout › More: Overflow, Visibility & Float | Move | FD-INS-02/03 · Style → Placement → More → Overflow / Box sizing / Visibility / Float / Clear |
| M07-73 / P-M07-73 | Standalone Flexbox / Grid / Corner radius sections | Keep | FD-INS-02/03 · Style → Children layout / Border → Corner radius |
| M07-74 / P-M07-74 | Typography (open, text types) | Keep | FD-INS-02/03 · Style → Typography → Font / Colour / Size / Line height / Weight / Align / More |
| M07-75 / P-M07-75 | Text inside (closed with summary) | Keep | FD-INS-02/03 · Style → Text inside → Typography controls |
| M07-76 / P-M07-76 | Font picker panel | Keep | FD-INS-02/03 · Style → Typography → Font family picker → Manage fonts |
| M07-77 / P-M07-77 | Size › Width / Height | Fix | FD-INS-02/03 · Style → Size → Width / Height |
| M07-78 / P-M07-78 | Size › spacing-token chain (Fixed) | Fix | FD-INS-02/03 · Style → Size → Width/Height → spacing token link |
| M07-79 / P-M07-79 | Size › More: Min / Max width / height | Keep | FD-INS-02/03 · Style → Size → More → Min/Max width/height |
| M07-80 / P-M07-80 | Size › flex/grid item controls | Keep | FD-INS-02/03 · Style → Size → Item in parent |
| M07-81 / P-M07-81 | Size disabled-reason on inline elements | Fix | FD-INS-02/03 · Style → Size → disabled dimension explanation |
| M07-82 / P-M07-82 | Spacing box | Fix | FD-INS-02/03 · Style → Spacing → Padding / Margin box |
| M07-83 / P-M07-83 | Spacing face pair rows (vertical/horizontal) and Gap rows | Keep | FD-INS-02/03 · Style → Spacing box; Style → Children layout → Gap |
| M07-84 / P-M07-84 | Fill › Colour | Keep | FD-INS-02/03 · Style → Fill → Colour |
| M07-85 / P-M07-85 | Fill › Gradient | Fix | FD-INS-02/03 · Style → Fill → Gradient |
| M07-86 / P-M07-86 | Fill › Image | Keep | FD-INS-02/03 · Style → Fill → Image → Choose image / Image presentation / More |
| M07-87 / P-M07-87 | Border | Fix | FD-INS-02/03 · Style → Border → Radius / Border / More → Outline |
| M07-88 / P-M07-88 | Colour row | Fix | FD-INS-02/03 · Style/Effects colour fields → Colour input / Source details |
| M07-89 / P-M07-89 | Colour popover (board 33) | Fix | FD-INS-02/03 · Colour field → picker → Local colour / Shared token actions |
| M07-90 / P-M07-90 | Number + unit field | Fix | FD-INS-02/03 · Numeric style field → Number + Unit + Source details |
| M07-91 / P-M07-91 | Live writes | Fix | FD-INS-02/03 · Shared style writer → field transaction lifecycle |
| M07-92 / P-M07-92 | Read-only + lock gate | Fix | FD-INS-02/03 · All inspector mutation paths → shared eligibility gate |
| M07-93 / P-M07-93 | Opacity | Keep | FD-INS-02/03 · Effects → Opacity |
| M07-94 / P-M07-94 | Shadow | Fix | FD-INS-02/03 · Effects → Shadow → Outer / Inner / Custom CSS |
| M07-95 / P-M07-95 | Filters | Fix | FD-INS-02/03 · Effects → Filters → Blur / Brightness / Contrast / Grayscale / Custom value |
| M07-96 / P-M07-96 | Transform & motion | Fix | FD-INS-02/03 · Effects → Transform / Transition |
| M07-97 / P-M07-97 | Advanced (Effects) | Keep | FD-INS-02/03 · Effects → Advanced → Cursor / Blend / Text shadow / Will change |
| M07-98 / P-M07-98 | Link | Fix | FD-INS-02/03 · Behaviour → Link → Destination / Open in / Rel / Title where existing |
| M07-99 / P-M07-99 | CMS binding | Move | FD-INS-02/03 · Content → CMS binding → Collection / Field / Preview / Disconnect |
| M07-100 / P-M07-100 | CMS-conditional visibility ("Visibility condition") | Redesign | BD-20; IAF-08; FD-INS-02/03 · Inspector → Content → Conditions; CMS index links exact target |
| M07-101 / P-M07-101 | Visibility | Fix | FD-INS-02/03 · Behaviour → Visibility → Desktop / Tablet / Mobile |
| M07-102 / P-M07-102 | Interactions | Keep | FD-INS-02/03 · Behaviour → Interactions → Add / interaction row / editor |
| M07-103 / P-M07-103 | Element CSS animation (inside Interactions) | Keep | FD-INS-02/03 · Behaviour → Interactions → Element CSS animation row → editor |
| M07-104 / P-M07-104 | CSS classes | Move | FD-INS-02/03 · Style → Classes → Attached classes / Add / Remove |
| M07-105 / P-M07-105 | Attributes (closed with summary) | Move | FD-INS-02/03 · Content → Attributes → Identity/accessibility; field/media advanced stay Content; form transport → Behaviour → Submission → Advanced |
| M07-106 / P-M07-106 | Custom data-* / aria-* attributes | Redesign | FD-INS-02/03 · Content → Attributes → Custom attributes list |
| M07-107 / P-M07-107 | Form › Fields | Move | FD-INS-02/03 · Content → Form → Fields → exact field editor |
| M07-108 / P-M07-108 | Form › After submit | Keep | FD-INS-02/03 · Behaviour → Form → After submit / Delivery |
| M07-109 / P-M07-109 | Slider › Slides | Move | FD-INS-02/03 · Content → Slider → Slides |
| M07-110 / P-M07-110 | Slider › Playback | Fix | FD-INS-02/03 · Behaviour → Slider → Playback / Controls |
| M07-111 / P-M07-111 | Collection list › Collection | Move | FD-INS-02/03 · Content → Collection list → Data source / Display limit |
| M07-112 / P-M07-112 | All CSS (dev-mode raw inline style editor) | Defer | FD-INS-02/03 · Current structured Style/Effects/custom-value controls; optional future developer Raw CSS surface |
| M08-1 / P-M08-1 | Rail "Brand" (palette icon, key **B**) | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-2 / P-M08-2 | Other ways in | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-3 / P-M08-3 | Nav column | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-4 / P-M08-4 | Leave Brand | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-5 / P-M08-5 | Page header | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-6 / P-M08-6 | Autosave + one undo stack | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-7 / P-M08-7 | Review changes (popover) | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-8 / P-M08-8 | Read-only banner | Keep | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-9 / P-M08-9 | First-run "No brand set." card | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-10 / P-M08-10 | Live preview column | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-11 / P-M08-11 | Light / Dark preview switch | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-12 / P-M08-12 | Beginner / Pro mode toggle | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-13 / P-M08-13 | Drawer-era frame (Draft chip, mode row, back row, status-pill band, Save/Discard footer, Review N staged changes modal, "N changes discarded · Undo", cross-window/undo toasts) | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-14 / P-M08-14 | Focus isolation of the full page | Fix | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-15 / P-M08-15 | Colours table | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-16 / P-M08-16 | Table keyboard | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-17 / P-M08-17 | "Used by N" highlight | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-18 / P-M08-18 | "+ Add token" | Fix | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-19 / P-M08-19 | Token card (right column) | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-20 / P-M08-20 | Token card ⓘ "About drafts" hint | Fix | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-21 / P-M08-21 | Colour picker | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-22 / P-M08-22 | ⋯ Rename token… | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-23 / P-M08-23 | ⋯ Delete token… (safe delete) | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-24 / P-M08-24 | ⋯ Reset to default (seed tokens) | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-25 / P-M08-25 | ⋯ Duplicate token | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-26 / P-M08-26 | Colours action row | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-27 / P-M08-27 | Colour scale generator | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-28 / P-M08-28 | Drawer-era colour list (search, All/Issues pills, WCAG banner + Fix all, group headings Semantic/Brand/Surface/States/Primitives, Pro-only primitives, dark-missing chip) | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-29 / P-M08-29 | "Add color token" modal and "Replace token" modal | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-30 / P-M08-30 | Dark mode card (Off / Auto) | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-31 / P-M08-31 | Per-token dark values list | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-32 / P-M08-32 | Theme-toggle block | Keep | IAF-04 · Add → Theme toggle; selected control in Inspector; Brand Dark mode setup link |
| M08-33 / P-M08-33 | Fonts & type styles | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-34 / P-M08-34 | Font popover | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-35 / P-M08-35 | "+ Add a font" | Move | IAF-09 · Brand font entry → Assets → Site fonts → exact Brand return |
| M08-36 / P-M08-36 | Styles page | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-37 / P-M08-37 | Drawer type-scale editor (preview toggle, B/I toggles, ⚠ extreme size, per-row undo/redo) | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-38 / P-M08-38 | Spacing page | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-39 / P-M08-39 | Other 11 kinds (Radius, Shadow, Motion, Border, Opacity, Z-index, Breakpoint, Grid, Sizing, Icon, Imagery) | Redesign | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-40 / P-M08-40 | Drawer generic token rows (inline input, Restore, `[lint]` tag) | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-41 / P-M08-41 | Component styles | Move | IAF-04 · Brand → Browse sections → Add catalogue |
| M08-42 / P-M08-42 | "✦ Generate with AI" (Styles / Component styles) | Keep | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-43 / P-M08-43 | Classes | Redesign | FD-INS-02/03 · Brand Classes → choose named target → Inspector class application |
| M08-44 / P-M08-44 | Presets | Redesign | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-45 / P-M08-45 | Brand checks list | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-46 / P-M08-46 | Rules | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-47 / P-M08-47 | "Run checks" | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-48 / P-M08-48 | Ignore (suppress) | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-49 / P-M08-49 | Connect to tokens | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-50 / P-M08-50 | Templates bind literal colours | Fix | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-51 / P-M08-51 | Starters | Fix | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-52 / P-M08-52 | Brand from logo or website | Keep | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-53 / P-M08-53 | Restore points | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-54 / P-M08-54 | Theme push results / Recapture (dashboard) | Defer | IAF-10 · Existing dashboard theme push → editor result; optional Recapture deferred |
| M08-55 / P-M08-55 | Starter grid / thumbnails / "Starter applied" pill / first-run starter gallery | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-56 / P-M08-56 | Import / export panel | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-57 / P-M08-57 | Figma Variables export row | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-58 / P-M08-58 | Import | Redesign | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-59 / P-M08-59 | Legacy Export dropdown | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-60 / P-M08-60 | Project migration modal | Keep | IAF-10 · Shell migration overlay → Brand read-only/repair state |
| M08-61 / P-M08-61 | Server token boundary (v6 validation, stale-tab refusal, held sites) | Keep | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-62 / P-M08-62 | Lint aggregate banner (unmounted) | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M08-63 / P-M08-63 | Canvas token application | Keep | IAF-10 · Canvas / preview / export token consumer |
| M08-64 / P-M08-64 | Background brand checks feed Issues | Keep | IAF-16 · Issues / Publish checks → exact Brand or Inspector value owner |
| M08-65 / P-M08-65 | Onboarding "Set your brand" | Keep | IAF-21 · Help → Getting started → exact Brand task |
| M09-A1.1 / P-M09-A1.1 | Element type registry | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-A1.2 / P-M09-A1.2 | Element types are refined on load and paste | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-A1.3 / P-M09-A1.3 | Types that cannot have children | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-A1.4 / P-M09-A1.4 | Restricted parents | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-A1.5 / P-M09-A1.5 | Strict HTML5 forbidden pairs | Redesign | IAF-04 · Rail → Add / quick insertion |
| M09-A1.6 / P-M09-A1.6 | Drop depth limit | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-A1.7 / P-M09-A1.7 | Tree-audit messages: 30-level max, warning above 15, warning above 500 children | Defer | IAF-04 · Rail → Add / quick insertion |
| M09-A1.8 / P-M09-A1.8 | Lock gate on element writes | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A1.9 / P-M09-A1.9 | Multi-delete confirmation | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A1.10 / P-M09-A1.10 | Page root | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A2.1 / P-M09-A2.1 | Undo depth | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A2.2 / P-M09-A2.2 | Coalesce window | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A2.3 / P-M09-A2.3 | Checkpoint | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A2.4 / P-M09-A2.4 | Undo, redo and version restore are autosaved | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A2.5 / P-M09-A2.5 | Unrecorded change | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A2.6 / P-M09-A2.6 | Spurious undo step on a fresh load (Date compare) | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A2.7 / P-M09-A2.7 | Brand panel's own ⇧⌘Z and ⌘Z obeying read-only/full-page | Fix | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-A2.8 / P-M09-A2.8 | Version history cap | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A2.9 / P-M09-A2.9 | Time-Travel scrubber | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A3.1 / P-M09-A3.1 | ⌘S — Save | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-A3.2 / P-M09-A3.2 | ⌘Z — Undo | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A3.3 / P-M09-A3.3 | ⌘⇧Z / ⌘Y — Redo | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A3.4 / P-M09-A3.4 | ⌘P — Toggle in-editor Preview | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M09-A3.5 / P-M09-A3.5 | ⌘K — Command palette | Move | IAF-01 · Global shell / named task host |
| M09-A3.6 / P-M09-A3.6 | ⌘⇧P — Same palette (alias of ⌘K) | Move | IAF-01 · Global shell / named task host |
| M09-A3.7 / P-M09-A3.7 | ? and ⌘/ — Single keyboard-shortcuts sheet (? closes it again) | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M09-A3.8 / P-M09-A3.8 | ⌘J — Open AI (inspector column) | Move | IAF-12 · AI named right-side task |
| M09-A3.9 / P-M09-A3.9 | I — Open AI (inspector column) | Move | IAF-12 · AI named right-side task |
| M09-A3.10 / P-M09-A3.10 | ⌘, — Site settings | Move | IAF-14 · Topbar → Site settings → named screen |
| M09-A3.11 / P-M09-A3.11 | ⌘H — Left panel → History | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-A3.12 / P-M09-A3.12 | C — Comment mode | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M09-A3.13 / P-M09-A3.13 | F6 / ⇧F6 — Cycle shell regions (works inside fields too) | Move | IAF-01 · Global shell / named task host |
| M09-A3.14 / P-M09-A3.14 | Esc — Close the sheet, or deselect (registry `escape`). Per-surface closes: Layers, Brand, Preview, Settings, Templates, Comments, Pages select-mode | Move | IAF-01 · Global shell / named task host |
| M09-A3.15 / P-M09-A3.15 | A · T · M · L · P · B · S · U · H · R · D — Open Add · Templates · Assets · Layers · Pages · Brand · Settings · Publish · History · Review · CMS | Move | IAF-01 · Global shell / named task host |
| M09-A3.16 / P-M09-A3.16 | ⇧A — Components | Move | IAF-11 · Add → Saved components → Manage components |
| M09-A3.17 / P-M09-A3.17 | Delete / Backspace — Delete selection (asks first if more than one) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.18 / P-M09-A3.18 | ⌘C / ⌘X / ⌘V — Copy / Cut / Paste | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.19 / P-M09-A3.19 | ⌘⇧V — Paste HTML… | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-A3.20 / P-M09-A3.20 | ⌘D — Duplicate | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.21 / P-M09-A3.21 | ⌘G / ⌘⇧G — Group / Ungroup | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.22 / P-M09-A3.22 | ⌘⌥C / ⌘⌥V — Copy style / Paste style | Keep | FD-INS-02/03 · Inspector → selected property / state / value source |
| M09-A3.23 / P-M09-A3.23 | ⌘] ⌘[ ⌘⇧] ⌘⇧[ — Bring forward, Send backward, Bring to front, Send to back | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.24 / P-M09-A3.24 | ⌘A — Select all (root excluded) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.25 / P-M09-A3.25 | ⌘⇧E — Open exporter | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M09-A3.26 / P-M09-A3.26 | ⌘\ — Toggle inspector | Move | IAF-01 · Global shell / named task host |
| M09-A3.27 / P-M09-A3.27 | ⌘⇧A — Open AI assistant | Move | IAF-12 · AI named right-side task |
| M09-A3.28 / P-M09-A3.28 | ⌘⇧C toggle component view | Defer | IAF-11 · Add → Saved components → Manage components |
| M09-A3.29 / P-M09-A3.29 | Tab / ⇧Tab — Next / previous element | Fix | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.30 / P-M09-A3.30 | ↑ ↓ ← → / Home End — Sibling, parent, child, first, last | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.31 / P-M09-A3.31 | ⇧+arrow / ⌘+arrow — Move 10 px / 1 px | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.32 / P-M09-A3.32 | ⌥↑ ⌥↓ / ⌥Home ⌥End — Reorder / move to first or last | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.33 / P-M09-A3.33 | ⇧F10 / right-click — Context menu | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.34 / P-M09-A3.34 | ⌘0 · ⌘1 · ⌘2 · ⌘= / ⌘+ · ⌘- — 100% · fit · zoom to selection · zoom in · zoom out | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.35 / P-M09-A3.35 | ⌘; · ⌘⇧; · ⌘' · ⌘B · ⌘R · ⌘⇧X — Guides · spacing · grid · badges · rulers · X-ray | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.36 / P-M09-A3.36 | / or ⌘F — Focus the Add panel search | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-A3.37 / P-M09-A3.37 | ⌘↵ — Post comment; run Generate block | Move | IAF-01 · Global shell / named task host |
| M09-A3.38 / P-M09-A3.38 | ⌘K inside the media library — Focus library search | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M09-A3.39 / P-M09-A3.39 | Enter / Esc in inline text edit — Commit / cancel (Enter inserts a newline in textarea) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.40 / P-M09-A3.40 | Device chords — None (⌘1–4 belong to zoom) | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A3.41 / P-M09-A3.41 | Global guard rules — Every chrome chord stands down while a modal is open. Letter keys ignore inputs and editable text. F6 works everywhere | Move | IAF-01 · Global shell / named task host |
| M09-A4.1 / P-M09-A4.1 | Breakpoints | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A4.2 / P-M09-A4.2 | Legacy 991/575 thresholds | Defer | IAF-02 · Editor → canvas and local toolbar |
| M09-A4.3 / P-M09-A4.3 | Device frames | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A4.4 / P-M09-A4.4 | Breakpoint switcher | Fix | IAF-02 · Editor → canvas and local toolbar |
| M09-A4.5 / P-M09-A4.5 | Three "Desktop" widths | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M09-A4.6 / P-M09-A4.6 | Toolbar device presets with emoji | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M09-A4.7 / P-M09-A4.7 | Preview starts on Desktop whatever the canvas device | Fix | IAF-02 · Editor → canvas and local toolbar |
| M09-A5.1 / P-M09-A5.1 | Zoom | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A5.2 / P-M09-A5.2 | Drag | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A5.3 / P-M09-A5.3 | Marquee min | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A5.4 / P-M09-A5.4 | Element size | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A5.5 / P-M09-A5.5 | Canvas max | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-A5.6 / P-M09-A5.6 | Components per project | Move | IAF-11 · Add → Saved components → Manage components |
| M09-A5.7 / P-M09-A5.7 | Slug history | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M09-A5.8 / P-M09-A5.8 | Recents | Redesign | IAF-04 · Rail → Add / quick insertion |
| M09-A5.9 / P-M09-A5.9 | Media uploads | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M09-A5.10 / P-M09-A5.10 | Storage quota | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M09-A5.11 / P-M09-A5.11 | Plan limits | Keep | IAF-20 · Per-action capability result at existing destinations |
| M09-A5.12 / P-M09-A5.12 | AI client rate limit | Move | IAF-12 · AI named right-side task |
| M09-A5.13 / P-M09-A5.13 | AI prompt payload | Move | IAF-12 · AI named right-side task |
| M09-A5.14 / P-M09-A5.14 | API | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-A6.1 / P-M09-A6.1 | Single sanitizer | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-A6.2 / P-M09-A6.2 | URL schemes | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-A6.3 / P-M09-A6.3 | Session `blob:` URLs are dropped from persisted trees | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-A6.4 / P-M09-A6.4 | Head code allowlist | Keep | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-A6.5 / P-M09-A6.5 | Plain-text content never purified as HTML server-side | Fix | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-A6.6 / P-M09-A6.6 | Form wiring keeps attributes | Fix | IAF-13 · Inspector Behaviour → After submit; Site settings → Form submissions |
| M09-A7.1 / P-M09-A7.1 | Autosave debounce | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-A7.2 / P-M09-A7.2 | Automatic retry after a failed save | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-A7.3 / P-M09-A7.3 | Failure toasts | Redesign | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-A7.4 / P-M09-A7.4 | Conflict state | Redesign | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-A7.5 / P-M09-A7.5 | Reload recovery | Defer | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-A7.6 / P-M09-A7.6 | "Not saving" pill; the exit prompt firing on clean loads | Fix | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-A8.1 / P-M09-A8.1 | Brand Light/Dark switch | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-A8.2 / P-M09-A8.2 | Settings plan locks | Keep | IAF-20 · Per-action capability result at existing destinations |
| M09-A8.3 / P-M09-A8.3 | Upgrade modal triggers | Keep | IAF-06 · Add → Templates workspace |
| M09-B1 / P-M09-B1 | Publish flow | Keep | IAF-16 · Topbar Publish / Issues named task |
| M09-B2 / P-M09-B2 | Real-time collaboration | Keep | IAF-19 · Topbar Notifications / canvas comments / presence |
| M09-B3 / P-M09-B3 | DS AI client | Keep | IAF-12 · AI named right-side task |
| M09-B4 / P-M09-B4 | Brand "AI component styles" CTA | Defer | IAF-10 · Brand → catalogue/limited AI-styles route; Browse sections in Add |
| M09-B5 / P-M09-B5 | Brand "From logo or URL" (colours page and Starters) | Keep | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-B6 / P-M09-B6 | Export as Vue / Next.js | Defer | IAF-15 · Topbar Preview / Site menu Export |
| M09-B7 / P-M09-B7 | CMS import from Google Sheets / Airtable | Defer | IAF-08 · Rail → CMS → Data; selected binding stays Inspector |
| M09-B8 / P-M09-B8 | CMS source dialog: Sheets / Airtable connect | Defer | IAF-08 · Rail → CMS → Data; selected binding stays Inspector |
| M09-B9 / P-M09-B9 | Add-panel disabled rows | Defer | IAF-04 · Rail → Add / quick insertion |
| M09-B10 / P-M09-B10 | Integration row "COMING SOON" status | Defer | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-B11 / P-M09-B11 | Upload (file input) element | Defer | IAF-13 · Add Upload field → Inspector native form controls → published form wiring |
| M09-B12 / P-M09-B12 | Comment mode C and the R / Review panel | Keep | IAF-17 · Review named task → round / thread |
| M09-B13 / P-M09-B13 | Custom code screen | Keep | IAF-14 · Topbar → Site settings → named screen |
| M09-B14 / P-M09-B14 | Access → Password protection | Keep | IAF-14 · Topbar → Site settings → named screen |
| M09-B15 / P-M09-B15 | Premium templates | Keep | IAF-06 · Add → Templates workspace |
| M09-B16 / P-M09-B16 | Settings header "Upgrade" | Keep | IAF-20 · Per-action capability result at existing destinations |
| M09-B17 / P-M09-B17 | Viewer role disabled doors | Redesign | IAF-20 · Per-action capability result at existing destinations |
| M09-B18 / P-M09-B18 | Read-only view `?view=readonly` | Keep | IAF-20 · Per-action capability result at existing destinations |
| M09-B19 / P-M09-B19 | Presence mock users | Defer | IAF-19 · Topbar Notifications / canvas comments / presence |
| M09-B20 / P-M09-B20 | Agentation overlay | Defer | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-B21 / P-M09-B21 | Exit-reason instrumentation | Defer | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-B22 / P-M09-B22 | Dev console warnings | Defer | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-B23 / P-M09-B23 | Preset binding row | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-B24 / P-M09-B24 | Brand Figma export row | Defer | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-B25 / P-M09-B25 | Media "Trash" row | Defer | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M09-B26 / P-M09-B26 | Brand unmounted pieces (LintBanner, ExportDropdown, BindingEditorRow, StarterGalleryModal) | Defer | IAF-10 · Brand → current supported equivalent tool routes |
| M09-B27 / P-M09-B27 | Plugins | Defer | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-B28 / P-M09-B28 | Snap-to-grid command | Defer | IAF-02 · Editor → canvas and local toolbar |
| M09-B29 / P-M09-B29 | Watch device | Defer | IAF-02 · Editor → canvas and local toolbar |
| M09-B30 / P-M09-B30 | Wide device | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M09-B31 / P-M09-B31 | Hover level ("minimal / hierarchy / boxmodel") | Redesign | IAF-02 · Editor → canvas and local toolbar |
| M09-B32 / P-M09-B32 | Forms submissions inbox | Keep | IAF-13 · Site settings → Form submissions |
| M09-B33 / P-M09-B33 | Site SEO / Page SEO arc | Defer | IAF-05 · Bottom Pages → page management / Page settings |
| M09-B34 / P-M09-B34 | Review v2 redesign | Defer | IAF-17 · Review named task → round / thread |
| M09-B35 / P-M09-B35 | Activity panel | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-B36 / P-M09-B36 | CMS / Content panel | Redesign | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M09-B37 / P-M09-B37 | Purple in built-in templates | Fix | IAF-06 · Add → Templates workspace |
| M09-B38 / P-M09-B38 | Onboarding progress key is global | Fix | IAF-21 · Rail Help → Getting started / keyboard guide |
| M09-C1.1 / P-M09-C1.1 | L1-002 | Keep | IAF-15 · Topbar Preview / Site menu Export |
| M09-C1.2 / P-M09-C1.2 | L2-001 | Keep | IAF-06 · Add → Templates workspace |
| M09-C1.3 / P-M09-C1.3 | L3-002 | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-C1.4 / P-M09-C1.4 | L4-001 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M09-C2.1 / P-M09-C2.1 | L1-001 | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-C2.2 / P-M09-C2.2 | L1-003 / L2-007 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-C2.3 / P-M09-C2.3 | L1-004 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-C2.4 / P-M09-C2.4 | L1-007 | Move | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-C2.5 / P-M09-C2.5 | L2-002 / L3-001 | Move | IAF-05 · Bottom Pages → page management / Page settings |
| M09-C2.6 / P-M09-C2.6 | L2-003 | Keep | IAF-03 · Rail → Layers |
| M09-C2.7 / P-M09-C2.7 | L2-004 | Keep | IAF-03 · Rail → Layers |
| M09-C2.8 / P-M09-C2.8 | L2-005 | Move | IAF-11 · Add → Saved components → Manage components |
| M09-C2.9 / P-M09-C2.9 | L2-006 | Move | IAF-11 · Add → Saved components → Manage components |
| M09-C2.10 / P-M09-C2.10 | L2-008 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-C2.11 / P-M09-C2.11 | L2-009 | Keep | IAF-06 · Add → Templates workspace |
| M09-C2.12 / P-M09-C2.12 | L2-010 | Move | IAF-11 · Add → Saved components → Manage components |
| M09-C2.13 / P-M09-C2.13 | L3-015 | Move | IAF-07 · Rail → CMS → collection → Records / Fields / Dynamic pages / Settings |
| M09-C2.14 / P-M09-C2.14 | L3-016 | Move | IAF-08 · Rail → CMS → Data; selected binding stays Inspector |
| M09-C2.15 / P-M09-C2.15 | L3-024 | Fix | IAF-13 · Inspector → Content → form field names; published serialization |
| M09-C2.16 / P-M09-C2.16 | L3-025 | Defer | IAF-13 · Add Upload field → Inspector native form controls → published form wiring |
| M09-C2.17 / P-M09-C2.17 | L4-002 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M09-C2.18 / P-M09-C2.18 | L4-003 | Move | IAF-09 · Rail → Assets; contextual picker returns to originating property |
| M09-C2.19 / P-M09-C2.19 | L4-018 | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-C2.20 / P-M09-C2.20 | L4-019 | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-C2.21 / P-M09-C2.21 | L4-020 | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-C2.22 / P-M09-C2.22 | L4-021 | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-C2.23 / P-M09-C2.23 | L4-022 | Move | IAF-10 · Rail → Brand → Tokens / Reusable styles / Tools |
| M09-C2.24 / P-M09-C2.24 | L4-033 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M09-C2.25 / P-M09-C2.25 | L4-034 | Keep | IAF-16 · Topbar Publish / Issues named task |
| M09-C2.26 / P-M09-C2.26 | L5-001 | Redesign | IAF-12 · AI named right-side task |
| M09-C2.27 / P-M09-C2.27 | L5-002 | Move | IAF-12 · AI named right-side task |
| M09-C2.28 / P-M09-C2.28 | L5-003 | Move | IAF-12 · AI named right-side task |
| M09-C2.29 / P-M09-C2.29 | L5-004 | Move | IAF-12 · AI named right-side task |
| M09-C2.30 / P-M09-C2.30 | L5-007 | Keep | IAF-04 · Rail → Add / quick insertion |
| M09-C2.31 / P-M09-C2.31 | L5-030 | Keep | IAF-17 · Review named task → round / thread |
| M09-C2.32 / P-M09-C2.32 | L5-070 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-C2.33 / P-M09-C2.33 | L5-074 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-C2.34 / P-M09-C2.34 | L5-075 | Keep | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-C2.35 / P-M09-C2.35 | FG-001 | Fix | IAF-17 · Review named task → round / thread |
| M09-C2.36 / P-M09-C2.36 | FG-002 | Fix | IAF-17 · Review named task → round / thread |
| M09-C2.37 / P-M09-C2.37 | FG-007 | Fix | IAF-05 · Bottom Pages → page management / Page settings |
| M09-C2.38 / P-M09-C2.38 | FG-009 | Fix | IAF-14 · Topbar → Site settings → named screen |
| M09-C3.1 / P-M09-C3.1 | UX-01 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-C3.2 / P-M09-C3.2 | UX-04 | Keep | IAF-21 · Rail Help → Getting started / keyboard guide |
| M09-C3.3 / P-M09-C3.3 | UX-06 | Fix | IAF-02 · Editor → canvas and local toolbar |
| M09-C3.4 / P-M09-C3.4 | UX-09 | Fix | FD-INS-02/03 · Inspector → responsive Typography; Preview output verification |
| M09-C3.5 / P-M09-C3.5 | UX-10 | Redesign | FD-INS-02/03 · Inspector → selected property / state / value source |
| M09-C3.6 / P-M09-C3.6 | UX-12 | Fix | IAF-02 · Editor → canvas and local toolbar |
| M09-C3.7 / P-M09-C3.7 | UX-22 | Fix | IAF-01 · Global shell / named task host |
| M09-C4.1 / P-M09-C4.1 | IA-01 | Keep | IAF-02 · Editor → canvas and local toolbar |
| M09-C4.2 / P-M09-C4.2 | IA-07 | Fix | IAF-01 · Global shell / named task host |
| M09-C4.3 / P-M09-C4.3 | IA-08 | Fix | IAF-15 · Topbar Preview / Site menu Export |
| M09-C4.4 / P-M09-C4.4 | IA-10 | Redesign | FD-INS-02/03 · Inspector → selected property / state / value source |
| M09-C4.5 / P-M09-C4.5 | IA-14 | Fix | IAF-23 · Existing owner / preserved engine data; unsupported UI explicitly deferred |
| M09-C5.1 / P-M09-C5.1 | Duplicate/paste/page-duplicate lose breakpoint and :state styles | Fix | IAF-02 · Editor → canvas and local toolbar |
| M09-C5.2 / P-M09-C5.2 | ⌘Z ignores read-only and full-page gates | Fix | IAF-18 · History / Activity named task → Compare / Time Travel child mode |
| M09-C5.3 / P-M09-C5.3 | A save claims edits made while it was in flight | Fix | IAF-22 · Bottom status → save/recovery details; conflict modal |
| M09-C5.4 / P-M09-C5.4 | Content rule differs across canvas, Preview and export | Fix | IAF-15 · Topbar Preview / Site menu Export |
| M09-C5.5 / P-M09-C5.5 | A live deploy recorded as failed | Fix | IAF-16 · Topbar Publish / Issues named task |
| M09-C5.6 / P-M09-C5.6 | Server authz by target site (reviews, library, theme) | Fix | IAF-20 · Per-action capability result at existing destinations |
| M09-C5.7 / P-M09-C5.7 | No load-time damage scan or repair | Defer | IAF-16 · Topbar Publish / Issues named task |
