# BIC-01 — Individual block and native-tag Inspector handoff

Date: 2026-10-16. Source revision: `19f964d5e7efda2c276a4c185782bb963da605ec`.
Authority: FD-INS-03 in the existing [product brief](../../PRODUCT-DESIGN-BRIEF.md), refining FD-INS-02. This is one linked handoff. Mode: **AUDIT_AND_DESIGN**. **DESIGN READY for the bounded written handoff**, independently reviewed; no application implementation. Review scope and limits are recorded in section 7.

## 1. Finding and exact coverage boundary

The former 55-type family map was insufficient for the user's 60+ element question. The registry contains **69 blocks**, including native input variants and multi-part structures. There are **55 internal ElementTypes**, **50 declared block root types**, **54 static Add catalog entries**, and **122 M07 feature rows**. These are different counting units. A block is neither an HTML tag nor necessarily a reusable saved component.

This extension traces each of the 69 builders, generated native structure, relevant Inspector consumers and dependent behavior. In a fresh **standalone localhost:5050 demo**, all **69/69 registered blocks inserted**, each returned element was selected, and an Inspector mounted for each. Actual selected type matched the config for all 69. **Modal** created two sibling roots and returned its trigger. **Table** created a wrapper and returned its nested table. **Theme toggle** used its special Inspector. The tree contained **38 distinct native tags**; inline SVG strings are not additional stored tree nodes in that count.

Runtime evidence: [survey JSON](block-runtime-survey.json), [reproduction script](block-runtime-survey.js). Survey uses registry insertion, not 69 clicks in Add. It does **not** verify per-control writes, descendants' full UI, drag insertion, assets, visitor behavior, service permissions, persistence/reopen or output. Temporary fixture trees were removed; the initial empty page remained empty. No saved user project was opened or modified. Existing unit check `npx vitest run src/blocks/__tests__/blockRegistry.everyBlockInserts.test.ts`: **1 test passed**, covering insertion of every definition; this is not 69 passing end-to-end tests.

The shared native-tag allowlist has **120 entries (HTML + SVG)**. The [native support matrix](native-tag-coverage.md) maps every entry to an explicit editing/preservation route. An allowlisted tag is not a promise of a specialized visual authoring tool. This task specifies preservation and safe native editing, with complex authoring explicitly deferred where identified; no 100% browser-standards or whole-editor certification is implied.

## 2. Complete per-block records

Read these incorporated sections alongside the shared contracts below; they contain the individual source paths, controls, flows, states, compatibility and acceptance cases.

| Section | Count | Handoff |
|---|---:|---|
| Basic, Layout, Forms | 34 | [Foundations](block-coverage-foundations.md) / [JSON](block-coverage-foundations.json) |
| Media, Sections | 17 | [Media and sections](block-coverage-media-sections.md) / [JSON](block-coverage-media-sections.json) |
| Components, Ecommerce | 18 | [Components and commerce](block-coverage-components.md) / [JSON](block-coverage-components.json) |

Stable block IDs are `B69-<registry-id>`. Acceptance is per record, supplemented by `T-BIC-*` below. [Visual coverage browser](block-coverage-design.html) provides all 69 records, native trees, and a 300px composition specimen. The original [Inspector state specimen](inspector-design.html) remains authoritative only for its simulated shared layout interactions. Neither HTML file is a product implementation.

### Important discovered gaps

Severity means consequence if exercised; effort is relative implementation scope; confidence describes the stated evidence, not readiness.

| ID | Finding / consequence | Severity | Effort | Confidence / status | Design destination |
|---|---|---|---|---|---|
| BIC-F01 | Generic Input body conceals subtype validation; native checkbox/radio child dispatch differs from wrapper | High | Medium | Source + runtime structure; edit failure not replayed | Content → native field subtype; foundations contracts |
| BIC-F02 | Stock Select uses option child nodes but option editor reads/writes content; duplicate/stale options risk | High | Medium | Source + runtime tree; edit failure not replayed | One option tree writer, preserve IDs/optgroups |
| BIC-F03 | Form field reordering/conversion can split label wrappers or replace identity | High | Large | Source; operation not replayed | Structure-aware field units and native target references |
| BIC-F04 | Modal trigger and sibling dialog lack an established relationship; Tabs button/panel pairs need identity | High | Large | Builder + inserted trees; visitor wiring not established | Content structure + Behaviour target; explicit repair, no inferred pairing by position |
| BIC-F05 | Slider child count and runtime slide recognition differ; countdown child ordering carries meaning | High | Medium | Source; visitor behavior not replayed | Proven semantic item units, preserve control nodes |
| BIC-F06 | SVG asset replacement changes tag and deletes inline children | High | Medium | Source; exact destructive path located | Explicit representation conversion + whole-subtree Undo |
| BIC-F07 | Contact/menu/footer/features descriptions imply absent default children | Moderate | Small | Source + inserted structures | Correct descriptions; explicit existing Add flows |
| BIC-F08 | Gallery/Table/List and native descendants need owner-specific structural editing | High | Large | Source + generic default Inspector/tree | Content structures and exact child return |
| BIC-F09 | Ecommerce markers/scripts do not establish complete configurable purchase workflow | High | Large | Source + inserted structures; commerce service not run | Preserve generic routes and existing data; specialized authoring deferred |
| BIC-F10 | File input does not establish built-in file delivery; public submission route/schema limits differ | High | Large if service added | Source; server not exercised | Supported native field with clear delivery limitation; no fabricated upload service |
| BIC-F11 | Media source replacement can leave MIME/fallback mismatch; map query silently truncates | Moderate | Medium | Source; not replayed | Atomic source model, field-specific validation |

These findings do not replace the six verified baseline Inspector defects in `runtime-review.md`. No existing defect is labelled fixed because its intended design is now specified.

## 3. Shared contracts for all 69

### BIC-C01 — Resolve the real editing target

Evaluate saved `ElementType`, **actual native tag**, native `input.type`, and **proven compound role/relationships**. A root-family lookup is only the first step. Do not infer a module solely from a CSS class a user may change. For new compound structures use persisted stable references as described in the relevant block record; for legacy structures a proof-based adapter can offer a read view. Ambiguous recognition shows **Custom structure** with ordinary Layers/native editing and explicit relationship repair; it must not silently rebuild children or rewrite their types.

Header shows selected object and, when a shortcut writes a child, **Editing: <child label> within <parent>**. Root and shortcut use the same writer and value. Page, selection, authored breakpoint/state, component scope, canvas pan/zoom, source layer, panel tab/scroll, query and retained drafts survive the round trip. `Back to <parent>` returns to exact parent ID and originating row. If it was deleted, return to nearest surviving ancestor and explain why; no substitution with similarly named object. Source identity always appears separately from computed value (II-01).

Structural attributes/content apply across breakpoints unless a specific model supports overrides. A Style placement does not make an attribute responsive: embed ratio currently applies across breakpoints. In shared component context, structure edits require definition permissions or an explicit supported instance operation. No implicit detach, definition edit, permission expansion or cross-project propagation.

### BIC-C02 — Structured children: one authoritative tree

Lists represent actual stable child IDs, not a second array of copies. Each row contains a readable item label, type/state, Select/Edit, and a labelled actions menu. Row selection and canvas/Layers selection stay synchronized. Add goes after current item, else last valid position; default text comes from existing preset or the exact block record. Duplicate remaps internal IDs and references within the duplicated unit; external references stay external, with unresolved references surfaced. Reorder by drag **and Move up/Move down**; invalid moves show a reason and do not mutate. Escape cancels drag and restores focus. DOM/native nesting and compound relationship rules apply in addition to ElementType nesting.

The unit is the semantic item: label+control wrapper, slide content without carousel controls, tab+panel pair, table row/cell, gallery image wrapper, quote+attribution. If multiple possible wrappers exist, require explicit target selection; do not guess by index. No structural batch across independent roots. Same-shape scalar property batch may be exposed only if every target's actual writer supports it; show mixed values and changed count, never mutate primary-only while claiming all.

Rename edits the actual text/name owner; blank display name removes custom naming and reveals type label, as FD-INS-02. Deletion distinguishes **Remove item** from **Delete shared resource**. Simple item removal gives Undo; populated structural/shared/referenced removal shows impact and explicit confirmation, with Cancel preserving exact state. A rejected dependency check writes nothing. Atomic transaction covers nodes, order, links and active/default references. Failure rolls back the whole transaction. Undo restores original IDs, references, values, absent attributes and index. Redo repeats the same accepted operation against valid current revision; collaboration conflicts must not overwrite other users' later edits.

After removal focus next surviving row, else previous, else Add. One element's repeated keystrokes/scrub are one meaningful Undo under IC/II, while separate Add/Reorder/Delete actions are separate units. Panel navigation never enters content history or marks a document dirty.

### BIC-C03 — Repeated control/state contract

Each record lists unique values/defaults/validation. IC-01–13, II-01–10 and INS-D11–12 supply shared behavior: valid scalar commits at existing live-edit boundaries, invalid drafts remain keyed to target+property+layer, Escape discards unapplied drafts; cancelling the current valid live interaction restores its captured pre-interaction values using II-02, without undoing earlier completed edits. Structural reconfiguration/representation conversion uses explicit Apply/Cancel. Mixed is neither empty nor zero. Native **attribute removal**, empty authored string, false-valued data attr and browser default are distinct. No automatic default write on opening/focusing a field. Unsupported saved values appear Custom/Legacy and remain unchanged until a valid explicit edit.

Native HTML booleans use presence/removal; module `data-*` flags use their actual parser encoding. For example empty `data-embed-autoplay` means on, so Off removes it. Reset removes only the chosen active override/attribute; Set default is a distinct explicit edit. Per-target differing inherited values or source references remain intact. Effects/Style common controls apply only when meaningful; selecting source/option/table metadata/SVG path must not advertise arbitrary container-drop or padding capabilities.

Empty list, no search results, unavailable dependency and failed load have distinct messages/actions. Loading retains the previous valid value with pending state; success requires confirmed mutation/storage operation. Save/Preview/Publish use existing IC/II preflight and statuses; a mounted Inspector does not prove save. Imported invalid values are labelled with correction options, not scrubbed simply to open the panel. A recoverable network error keeps local draft and Retry. Offline writes only use established queue behavior; otherwise report local/pending and do not imply server success. Conflicts offer review/reload preserving draft; they never silently overwrite.

Check permission, current revision, target existence, actual child locks, ancestor locks and component scope at command execution as well as UI. A parent shortcut cannot bypass a locked descendant. Server must enforce project/shared-resource authorization. Inspector denied-role behavior remains FD-INS-02. Structural confirmation cannot authorize an otherwise forbidden write. List search/filter, local preview-open state and selected-row memory are editor session state, not saved website content.

### BIC-C04 — Geometry, visual hierarchy and dedicated-space decision

**REGROUP + EXTEND** existing Content subviews, not 69 permanent tabs or 69 workspaces. Keep **300px fixed default/min/max** Inspector with existing four tabs, 12px padding, 32px minimum controls and one scrollable body. Compound rows are proposed **48px minimum**, height expands for long names/error; no truncation of critical scope. Label and field stack when a row cannot fit. List header and context remain visible; item details replace that body's list with Back, instead of nesting another independently scrolling panel. Secondary manager links follow exact destination/return, not overlay stacks.

At 1440px, existing specimen's left rail+panel budget340 + Inspector300 leaves **800px canvas region**, before its own margins. At ≤1366, Inspector overlays300px with12px right margin; it obscures space but must not change authored website viewport/breakpoint. Collapse/reopen remains available, and selected hidden content can be located through Layers. At 1024px the canvas region after340 is684px, of which312 may be obscured. Existing 56px top and32px bottom shell leaves height H−88; documentation review strip adds32 only to specimen, not product. Body fills remaining height and scrolls; short-height and200%text patterns follow measured FD-INS-02. New rows/dense compound content are proposed geometry until measured in the coverage specimen/application.

Table editing remains Content → Table structure with rows/columns and exact cell selection; canvas remains its two-dimensional view. This design does not introduce spreadsheet data manipulation. Complex dataset editing belongs to CMS, but a static table must not be migrated to CMS merely to edit cells. Rich SVG path manipulation, full animation timeline, commerce catalog authoring and remote file-delivery infrastructure are explicit deferrals, not disguised Inspector fields. Existing editable attributes, native tree and supported services remain reachable.

### BIC-C05 — Compatibility, native markup and output

Keep existing native tag, ID, stable references, source attrs, content, classes, base/breakpoint/state styles, component relationships, CMS bindings and unknown safe values. Ordinary navigation/regrouping needs no data migration. Source/tag/relationship changes are behavior or additive-data work; engine, renderer, serialization, parser, sanitizer, server and published runtime must agree. New references must use approved stored schema/identifier conventions and pass server read/write compatibility; cannot be frontend-only hidden state. No bulk destructive migration authorized. Existing projects use lossless adapter/read path; explicit repair has preview, atomic commit and Undo.

Native tags lacking dedicated UI get a named semantic readout, existing safe content/attribute editing and valid structure navigation, not generic container assumptions. Restrict unsupported specialized actions while keeping existing valid edits; display why. Never widen sanitizer or allow executable markup to make a visual prototype appear supported. The full120-tag matrix gives route classifications and limits. It is support coverage, not120 individually verified workflows.

Current editor/native selection must not execute visitor navigation, form submission, checkout or modal actions. Explicit Preview tests visitor behavior; leaving restores editor selection and temporary states. Preview, export and published output must consume the same saved configuration; role/ID repair must not only work in the Inspector. No publication/deployment is part of this task.


### BIC-C06 — Native form transitions and transport (cross-record refinement)

These rules refine B69-form/input/textarea/select/radio and contact-form, including generic IC examples. Source: `PropertyField.tsx:137–171`, `attributeWriter.ts:111–120,161`, `FormFieldsSection.tsx:68–81`, root `lib/publish-forms.ts:128`, dashboard public forms route and shared forms schema cited in foundations.

- **Select options:** native option nodes own text content, optional label attribute and optional value. Absent value means browser-derived option text; authored empty value stays empty. Display “Uses option text” versus “Empty string” versus explicit value; never auto-copy displayed label into value; preserve optional label attribute separately from submitted fallback text. Duplicate labels/values remain legal and are identified by stable ID, with a submission ambiguity note where relevant. Single-select cannot author several selected defaults: changing Multiple off requires the user to choose a surviving default from currently selected options, or explicit Browser default (remove all selected attrs). Cancel changes nothing. Selecting a default updates all affected selected attrs in one transaction; any locked affected option blocks the operation. No rewrite via root HTML string that leaves option children behind.
- **Radio groups:** group membership is actual resolved form owner + nonempty name within the same tree context, not nearest visual wrapper. Explicit form attr participates in owner resolution. Setting Checked by default on one member clears it on other members atomically, with visible affected group/count; a locked/forbidden member blocks the whole command. Renaming/moving a checked radio into a group with another checked member opens a keep-default choice; no silent conflict resolution. Empty/absent name does not invent a shared group. Required and default state are native semantics; visitor state is transient.
- **Textarea default:** rendered native text content is the authoritative default. Existing legacy value attr is a compatibility mirror, not an alternate owner. If attr and content disagree, display actual content plus “Legacy default differs”, show both, and offer Use rendered text / Use legacy value with explicit confirmation. Opening does not rewrite either. An intentional Default edit synchronizes content and any compatibility mirror through one writer/Undo; clearing sets content empty and removes legacy value attr. User-authored children/inline markup must be handled through the lossless type-conversion guard, not dropped by an input/textarea conversion.
- **Form delivery:** distinguish Managed (action absent), Native current document (authored action=""), and Custom endpoint (nonempty action). The first is only service-ready after existing settings/authorization resolve. A blank text field is not sufficient to switch modes. “Use managed delivery” removes action intentionally after impact review; “Use current document” explicitly writes empty action. Custom endpoint accepts existing safe URL policy and exposes existing method/encoding values. Cancel/Undo restores exact attribute presence. Managed publish wiring currently skips any authored action; do not silently normalize an empty action into absence.
- **Submission limits:** built-in public route accepts URL-encoded/JSON string fields, with repeated URL-encoded keys joined by comma-space; File control presence does not establish multipart/file-byte delivery. Show that limit before a form containing files is presented as configured. Existing valid custom native transport remains available; no new backend/storage/purchase capability is added by this specification.

**Acceptance:** T-BIC-13 absent versus empty option value and optgroups survive text/label edit/Undo, including an option whose label attribute differs from fallback text; T-BIC-14 Multiple→single chooses one/default explicitly; T-BIC-15 radio group conflict and locked sibling are atomic; T-BIC-16 textarea conflicting mirrors open unchanged, explicit repair and Undo exact; T-BIC-17 absent/empty/custom action roundtrip and server-publish distinction; T-BIC-18 file/repeated-key transport limitations visible without a false delivery success. All are redesign acceptance **NOT RUN**.

### BIC-C07 — Native field eligibility and submission names

This matrix governs the common field contract in every foundations record. Resolve the actual native tag/subtype first; visibility is not decided from internal `ElementType=input` alone. A dash means no functional authoring control for that subtype. Preserve existing safe unsupported attributes in the native/custom read path, with “No effect for this field type”; do not silently remove them or suggest that they work. Native booleans use presence/removal. A disabled native field is different from an editor permission restriction and normally contributes no submitted value.

| Control | Eligible native controls in the supported authoring set | Explicit exclusions / behavior |
|---|---|---|
| Required | input text/search/tel/url/email/password/date/time/datetime-local/number/file/checkbox/radio; textarea; select | No range/color/hidden/buttons. Radio group native semantics apply; checkbox does not invent a group minimum |
| Disabled | input subtypes, textarea, select, native buttons | Supported native property; editor permission is a separate guard |
| Read-only | input text/search/tel/url/email/password/date/time/datetime-local/number; textarea | No checkbox/radio/file/range/color/hidden/select/buttons |
| Placeholder | input text/search/tel/url/email/password/number; textarea | No date/time/datetime-local/file/range/color/choices/select/hidden; never a label substitute |
| Pattern | input text/search/tel/url/email/password | No number/date/time/range/color/file/select/textarea; preserve valid raw pattern and show syntax errors |
| Minimum / maximum length | input text/search/tel/url/email/password; textarea | Nonnegative integers or absent; maximum ≥ minimum; not numeric min/max |
| Minimum / maximum / step | input date/time/datetime-local/number/range | Units and tuple validation follow subtype record; time may wrap overnight |
| Multiple | input email/file; select | Email multiple→single and select multiple→single require their explicit conflict resolution |
| Checked by default | native checkbox/radio | Radio group atomicity is BIC-C06; never generic input.value |
| Accepted files | input file | Syntax/picker hint only; not a delivery service or security guarantee |

Autocomplete is subtype-dependent: no functional autocomplete control for checkbox/radio/file or button states; hidden follows its separate token rules, not on/off. Other stored native attributes keep their existing safe advanced route; unsupported/custom values are preserved, not coerced. Existing month/week inputs retain native Required/Read-only/min/max/step semantics through the native route without claiming they are current Type-picker choices. The matrix is the proposed authoring contract, not evidence that every row currently exists in the Inspector.

**Name validation:** Name is a submitted key, not visible label or DOM ID. Empty/absent and intentional repeated names are preserved. `PropertyField.tsx:59–67,116` currently has a local warning set (`name`, `id`, `submit`, `action`, `method`); this is not an existing shared validator. Propose one canonical name validator shared by editor validation and output checks, aligned with the actual sanitizer: reject a new key if the current sanitizer removes or rewrites it in a valid native-field serialization, including the known clobbering cases. Do not weaken sanitization to accept it. Commit is blocked with **“This field name is removed by output sanitization. Choose another name.”** Keep the invalid draft and previous saved key. Legacy keys stay visible with the same issue and repair action; opening the Inspector or changing an unrelated style does not erase them. Case/whitespace normalization used for detection must not silently alter an accepted authored key. Server/output enforcement and round-trip tests are engineering dependencies, not implemented guarantees.

**Acceptance:** T-BIC-19 checks each eligibility row against native tag/subtype, including range/color without Required, file/select without Read-only, and hidden fields through Layers; unsupported saved attrs survive unrelated edits. T-BIC-20 checks rejection versus retained draft for clobbering keys, legacy preservation, intentional duplicate names and sanitizer/output parity. Both are specified, **NOT RUN against the redesigned application**.

## 4. Cross-block feature decisions

The table is the concise decision record; individual B69 records fill controls/values, persistence, compatibility and acceptance.

| Decision | User problem and evidence | Owner/home and chosen panel action | Entry, return and recovery | Alternatives rejected / dependencies |
|---|---|---|---|---|
| BIC-D01 Native-aware Inspector | Same internal type can be file/date/range or structural tag | Actual element/child; REGROUP existing Content by semantic subtype | Canvas/Layers/parent row → exact subtype → Back; IC/II drafts/history | One generic Input fails validation; new tab per subtype adds clutter. Native resolver, permissions, output |
| BIC-D02 Compound structure | Root-only map misses linked parts | Actual tree/relationship; EXTEND Content → items, scoped item detail | Root → item → child → Back; atomic structure Undo | Root property copies conflict; global manager wrong scope. IDs/nesting/command transactions |
| BIC-D03 Linkage repair | Modal/Tabs have incomplete identity | Authored references on trigger/tab and owning structure; REDESIGN relevant Content/Behaviour | Missing target notice → choose compatible existing part → impact → Apply/Cancel | Guessing by nearby class/index unsafe; automatic rebuild destroys work. Additive schema + runtime + server |
| BIC-D04 Media representation | SVG replace removes drawing; source mismatches | Native media tree/source; REDESIGN conversion and source detail | Source picker → explicit consequence → commit/return; whole-subtree Undo | Wider media panel does not solve hidden data loss. Assets/CMS/sanitizer |
| BIC-D06 Button navigation semantics | A button href does not establish navigation | Selected node; explicit lossless Convert to link under B69-button, REGROUP Behaviour action | Preview tag/type consequences → Apply/Cancel → same ID; one exact Undo; block effective submit/reset, disabled or unsupported referenced action | Unevidenced click runtime and silent conversion rejected. Native renderer, tag-selector styling, component and action reference compatibility |
| BIC-D05 Honest capability limits | Preset descriptions, file transport and commerce exceed proven behavior | Existing blocks remain usable; FIX labels, DEFER unimplemented service authoring | Exact supported edit/setup routes, preserved existing data | Fake toggles/green statuses hide missing backend; deletion violates preservation. Service/output acceptance |

Permissions for each are existing project edit + actual target/ancestor/component/resource authorization, never ownership alone. Shared services retain explicit confirmation only for their own consequential operation. New structure references are additive engineering dependencies, not visual-only changes. All decisions preserve prior authorized shell/IA: CMS, Assets, Brand in left rail; Site settings topbar; bottom Pages/status; workspace Components through approved Add/Saved components entry.

## 5. Acceptance and implementation sequence

1. **Correctness foundation:** semantic target resolver, mutation/read symmetry, actual-child/ancestor guards, tree-backed options and stable identity; repair Select/choice/Switch and source reset defects. Preserve prior INS/II behavior.
2. **Structured editing:** common child rows and return context; lists/forms/galleries/sections, then table/slider/countdown; use shared atomic commands and valid native nesting.
3. **Compound runtime integration:** Tabs/Modal/Accordion identity and accessible visitor behavior, with explicit legacy repair and all writers sharing one model. Do not ship authoring before runtime parity.
4. **Media and service boundaries:** lossless SVG conversion, source MIME/fallback, embeds validation, truthful File delivery and commerce status. Preserve existing CMS/catalog references and deferred authoring routes.
5. **Acceptance:** per-block tests + integration cases below; regression against older saved projects, real permissions and output. Dedicated CMS/Brand/Assets redesign work remains separate FIC scope.

| Test | Required outcome | Current status |
|---|---|---|
| T-BIC-01 Registry preservation | Every current block ID has a unique B69 record, explicit disposition and current/proposed boundary | Documentation check; final result below |
| T-BIC-02 Baseline insertion | All69 insert/select/default Inspector; distinguish Table nested return/Modal siblings | Runtime observed; not full workflow |
| T-BIC-03 Native fidelity | All120 allowlisted native tags map; 38 observed tree tags accounted for, inline content separately counted | Source matrix; not120 browser tests |
| T-BIC-04 Four-step parent round trip | Parent→item→edit→Back preserves exact IDs, tab/scroll/zoom/drafts; missing parent safe fallback | Redesign NOT RUN |
| T-BIC-05 Form subtypes | Date/time/number/range/color/file validation and clear/default distinctions; select option tree has no duplicate/stale values | Redesign NOT RUN |
| T-BIC-06 Compound atomicity | Add/duplicate/reorder/delete repairs all paired refs; Undo/Redo exact; stale/restricted command writes none | Redesign NOT RUN |
| T-BIC-07 Native structure | td/tr/option/source/path not generic droppable containers; imported custom structure preserved with safe route | Redesign NOT RUN |
| T-BIC-08 Permission | Parent shortcut cannot bypass child lock; viewer/component/server denies; no partial batch | Redesign NOT RUN |
| T-BIC-09 Media | SVG cancellation/Undo exact; parent/source MIME consistency; source lists/track references survive | Redesign NOT RUN |
| T-BIC-10 Visitor parity | Tabs keyboard/panels, Modal focus/open/close, carousel units, form submission semantics align preview/export/publish | Redesign NOT RUN |
| T-BIC-11 Save/reopen | Old projects retain IDs/content/classes/attrs/styles; new linkage roundtrips; failure/offline/conflict does not claim Saved | Redesign NOT RUN |
| T-BIC-12 Scale/accessibility | 1000-child hierarchy,200-row table,500 gallery assets; search/keyboard/focus/virtualization does not lose draft/selection; 1024/1280/1440, short height,200% text | Application NOT RUN; representative specimen check below |

Performance targets are acceptance fixtures, not measured benchmarks or promised budgets. Reuse existing list virtualization where appropriate; stable-key selection/drafts must survive recycling. Do not virtualize a focused native input out from under the user. Server/shared-resource scenarios need actual authorized integration fixtures during implementation; this task did not establish a new role model.

## 6. External references and remaining verification

Reviewed **2026-10-16**: native input state/periodic time-range constraints were checked against the [WHATWG input specification](https://html.spec.whatwg.org/multipage/input.html); option label/text/value distinctions against [WHATWG option](https://html.spec.whatwg.org/multipage/form-elements.html#the-option-element); table structure against [WHATWG tables](https://html.spec.whatwg.org/multipage/tables.html). Proposed keyboard/relationship requirements align with [WAI-ARIA Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) and [WAI-ARIA Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). These are output design references, not evidence that Buildrick conforms. Product-specific scope limits such as a six-digit native colour field are Buildrick design decisions, not claims that modern HTML supports no other colour representation.

No user research was conducted. Usability improvement is a design hypothesis supported by source inspection and heuristic workflow walkthroughs. Browser/screen-reader matrix, exact external provider availability, backend authorization, project import/export/save parity, commerce/file delivery and actual large-project performance remain unverified. Their absence does not invalidate the explicit design route or authorize presenting a broken feature as working.

## 7. Closure and validation

**BIC-01 DESIGN CLOSED / FD-INS-03 DESIGN READY — 2026-10-16.** Independent read-only review covered all 69 individual records, 120 native routes, shared C01–07, feature decisions D01–06, the main brief, source samples, runtime records, final HTML, navigation/geometry JSON and both screenshots. No unresolved design-blocking contradiction remained. This closes the written block-coverage handoff; it does not certify finished interactive product layouts or functioning redesigned controls.

**Gate verdict:** G1 evidence, G2 ownership, G3 architecture, G5 written continuity, G7 mapped preservation and G9 handoff PASS. G4 PASS for specified geometry and the measured documentation viewer; actual control density remains NOT RUN. G6 PASS for specified interaction/accessibility and recorded viewer navigation; product interaction/accessibility remains NOT RUN. G8 implementation NOT RUN. The reviewer performed no tests or browser actions and inspected the recorded evidence. FIC-02–09 and whole-editor IA remain open.

The records contain **229 per-block acceptance cases** (92 foundations + 51 media/sections + 86 components/commerce), plus 20 cross-block cases and native-route criteria. These are specified acceptance requirements, not passing application tests. The following checks establish document consistency and a usable review artifact.

| Check | Recorded result | Boundary |
|---|---|---|
| `python3 check-block-coverage.py` | PASS: 69 unique records match registry; 120 native routes match allowlist; 69 survey and HTML records | Documentation consistency, not working-feature proof |
| Existing `blockRegistry.everyBlockInserts.test.ts` | 1 file / 1 test passed, iterating all 69 definitions | Existing insertion test only; no new application tests or fixes |
| Local registry insertion/selection survey | 69 inserted, selected and Inspector mounted; returned types matched; 38 distinct native tree tags observed | Controlled standalone fixture; no saved user project or production data. Not Add-menu clicks, control editing, persistence or output |
| [Coverage-viewer navigation](block-design-navigation.json) | 355 assertions passed: 69 records, 276 tab renders, search/no-results/clear, selected catalog focus, keyboard tab movement, native target and Back | DOM-driven documentation navigation; no claim of screen-reader or application workflow validation. Reproduction harness: `check-block-design-navigation.js` |
| Visual inspection | [1440px](block-design-1440.png) and [1280px with enlarged panel text](block-design-1280-200text.png) inspected | Read-only outline/viewer; not 69 interactive product screens |

[Measured geometry](block-design-geometry.json), Table record / Content tab:

| Viewport | Panel text | Right width | Scrollable-body available height | Horizontal document/panel overflow |
|---|---|---|---|---|
| 1440 × 900 | Normal | 300px | 644px | None |
| 1280 × 720 | Normal | 300px | 464px | None |
| 1024 × 768 | Normal | 300px | 512px | None |
| 1440 × 600 | Normal | 300px | 370px; content scrolls | None |
| 1280 × 720 | 200% panel text | 300px | 234px; content scrolls; tabs use two rows | None |

Footer remains within viewport in all five measurements. This documentation viewer has a catalog, reading area and explanatory Inspector outline; its center is not the website canvas. It cannot validate application canvas budgets, actual input density, full browser zoom or control geometry for every compound block. FD-INS-02 retains the separate interactive Inspector state specimen and its bounded evidence. New control layouts must satisfy BIC-C04 during implementation, with real content/errors and native child controls.

**Still NOT RUN:** redesigned per-control mutation, complete keyboard/screen-reader testing, role/server enforcement, older-project save/reopen, collaboration conflicts, asset/service failures, preview/export/publish parity and representative large-project performance. All T-BIC-01–20, per-B69 cases and native-route acceptance are implementation requirements, not passed checks. Existing source/runtime findings and six original defects remain open for engineering correction. No application code, schema, saved user work, production data or deployment was changed.

Final artifact checks: all six handoff documents have valid local links; the coverage viewer script passes `node --check`; no application-source diff exists in `src`, `demo` or `package.json`. Documentation consistency was rechecked after the final source/wording corrections.
