# Editor deep surface audit — evidence-based, zero assumptions — 2026-08-08

Founder order: "audit more in detail, do not assume." Four parallel deep
readers, each opening render code and reporting every conditional branch,
exact copy, and `file:line`. Sections land here as each reader returns.
Cross-check vs `boards.json` follows at the end.

---

## PART 1 — Panels sub-states (reader 1, 46 calls)

### 1. ReviewTab (`sidebar/tabs/review/ReviewTab.tsx`)

Top-level LoadState screens: loading (":279", Spinner, "Loading review…") ·
error (":288", "Couldn't load the review" / "The dashboard didn't answer.
Your feedback is safe — this is just the panel." / Retry) · no-round
(":303", "No review yet" + Send-for-review pointer) · compareOpen (":317")
· ready.

compareOpen sub-states: loading ("Loading approved snapshot…") · error
(+Retry) · ready — **and the current side loads independently ("Rendering
current…") = a real 4th visual**.

Header: revoked badge **overrides** status badge; "{n} open" badge only
when >0; **Compare button gated on APPROVED && onExportCurrentPages** —
board-invisible gate; Re-send disabled+aria-busy while resending (no label
change); ⋯ → single danger item "Revoke link".

Meta: "Sent to {email}" OR "Not yet sent to a client" · "Round {n} of {m}".

**notice line — 5 variants, never auto-cleared** (":217-236"): resolve
failure · "Review link revoked." · token-changed ("This round changed (a
re-send happened) — reloading.") · already-revoked · revoke failure.

List: empty (interpolates reviewerName) · **Detached group** warning-tinted,
meta "element deleted · {rel}" · page groups (null pageId → literal
"General") · resolved rows at opacity .6 · Resolve⇄Reopen flip · author
"You" vs client name · relTime buckets.

Composer: placeholder "Reply to the client…", max 2000; replyError styled
as MUTED META not error ("Couldn't send that reply. Try again."); hint
"Replies are internal notes on the thread."; Send never says "Sending…".

Revoke ConfirmDialog: "Revoke the review link?" / "The client's link stops
working immediately. Their comments stay. Send a new link any time with
Re-send." / "Revoke link" / "Keep it live".

### 2. SendForReview (`shell/SendForReview.tsx`)

5 states, exact labels (":38-44"): idle "Send for review" · sending
"Sending…" · sent "Sent for review ✓" (disabled) · **again "Send again"**
· error "Retry send". `sent→again` fires only when reviewStatus.at moves,
with a **1500ms minimum-display timer**; without a moving `at` the button
wedges on ✓. Permission gate: disabledReason → Tooltip-wrapped,
aria-disabled, focusable no-op (keyboard-reachable reason). Popover form:
Client email ("Leave blank to keep this internal.", max 320) · "What
changed?" (placeholder "e.g. hero copy, 2 images", max 500) · Note
(optional, max 500) · error role=alert "Couldn't send — try again."
Snapshot render failure is swallowed — send still succeeds.

### 3. History

**MilestoneSuggestionBanner** (Saves view only): 4 trigger labels ("New
page added" / "Element deleted" / "Significant changes" / "Editing session
progress"); loading = Save shows "..."; edit mode: TextInput max 50,
Enter/Escape/**onBlur saves**, actions collapse to single Save; reasoning
hidden while editing.

**TimeTravelScrubber** (Ctrl+Shift+T): empty copy · "Previewing: {HH:MM} —
{label}" · start/current/end times ("—" when absent) · "Restore this
point" + "Exit time-travel" · **canvas preview layer injected next to
#editor-canvas at opacity 0.4** (img of nearest snapshot OR "Time-traveling:
{label}" / "Select a point to preview") · isDragging dim backdrop ·
reducedMotion variant · keys ←/→/Enter.

**SnapshotPreview**: 160px thumb after **300ms hover dwell**, only when
visualSnapshot exists.

**CompareView**: Visual|Semantic pill — Visual **disabled with title="No
visual snapshot available…"** when neither side has one (auto-flip to
semantic); AI text renders above diff; thumbs "Current" + version name,
either independently absent; count badges in BOTH modes ({n} style/text/
layout/content/other); "{n} pages added, {n} removed"; semantic ops + − ~
**capped at 20** with "+{n} more changes".

**AIPanel**: loading "Generating..." · **cooldown "Get AI Summary ({n}s)"
disabled countdown** · ready (pie icon) · error paragraph below (button
stays enabled).

**VersionList**: empty copy is **count-sensitive** ("No saved versions
yet" + hint vs "No matching versions" / "Try a different search term.") ·
**blank frame while listHeight===0** · date-group headers Today/Yesterday/
date · row: name · HH:MM · rel · "{n} el" badge (**dead — always passed
0**) · "Auto" badge · actions Compare / Restore ("..." while restoring) /
× · **inline delete-confirm swaps trio to Delete + ×** (no modal).

### 4. Templates

**ReplaceModal**: subtitle "{Page} page has {n} elements that will be
replaced."; body names template; checkbox 1 'Backup current page as
"{Page} (backup)"' — **default FALSE = destructive-by-default (flag)**;
checkbox 2 "Reset global styles to template defaults"; Cancel / "Replace
content".

**ProModal**: '"{name}" is a Pro template' · "Unlock 80+ premium
templates…" · 5 ✓ rows (80+ templates · custom domain · stock · AI
alt-text · priority support) · "Maybe later" / "Upgrade to Pro" (→
/dashboard/settings/billing).

**CreatePage trio**: confirm ("Create page?" + "Using: {template}") ·
success ("Page created!" + "Close" / "Go to page") · error ("Couldn't
create page" + "Your existing pages were not affected." + Try again).

**TemplateUsageDrawer**: tabs **Preview | Used in | Versions** (not just a
list!): preview thumb or "No preview thumbnail" + "Open full preview →";
used-in rows w/ v{n} chip; versions strip + **stale rows get warning tint
+ "update available"**; empty copies per tab.

**ApplyProgressOverlay**: 4 steps ("Importing template HTML → Resolving
brand tokens → Rendering on canvas → Saving applied state"), glyphs ✓/→/○;
Cancel + 15s timeout exist in component but **unwired by TemplatesTab**.

**TemplatePreviewModal**: full-screen dark, D/T/M viewport toggle
(1100/700/375), iframe scaled 0.2, 3-way CTA: "🔒 Upgrade to Use" /
"Replace Canvas with This" / "Apply to Canvas".

### 5. Content (ContentViews.tsx 748 lines + ContentTab router)

Router-level (before all views): hydration error block ("Couldn't load
your collections." / "This is a connection problem, not a change to your
data." / Try again) · pending = 4 SkeletonBlocks aria-busy.

RootView: fully-empty requires collections AND sources AND variables AND
conditions all 0; §5.7 collections line + "Create a collection" (**button
hidden entirely when onCreateCollection absent — host gate**); populated:
Collections + counts ("—" fallback), Data rows Sources/Variables/
Conditions.

CollectionView: "{n} records" + "+ Add"; RecordRow published dot; name
fallback "Record {last4}"; empty "No records yet — add the first one.";
**"Dynamic pages" row dead in app (onOpenDynamicPages never passed)**.

RecordView: boolean → toggle row; textarea/richtext → Textarea; number →
type=number; fixed "Published" toggle; "Delete record" only when editing
existing && onDelete; **unsaved savebar shows for dirty OR brand-new
record** ("Unsaved changes" + Discard + Save→"Saving…").

FieldsView: rows name/type + "required" + ✕; add form: 9 field types
(text, textarea, richtext, number, boolean, image, date, slug,
reference); delete confirm '"{name}" and its values on every record will
be removed.'

SourcesView: empty "No data sources yet."; add form mono JSON textarea;
errors "Not valid JSON — check the syntax and try again." / "Editor not
ready."; footer "A source feeds a collection. Edits sync one way — from
the source in."

VariablesView: mono "{{site.<key>}}" rows, value "—" fallback; inline
edit Enter/Escape; dup-key error wins over format error ("A variable with
this key already exists." / "Keys are letters/digits/dashes, starting
with a letter.").

ConditionsView: rows label + conditionSummary + Select + ✕; empty only
when 0 && !picking; picking → "+ New condition" AND footer hint both
disappear, inline form appears ("Show the picked element when…", path,
**9 operators**, value hidden for exists/empty ops); pick handshake =
inspector:pick-start/-result/-cancel — canvas-wide state.

### 6. Pages

**SearchListingsTable**: PAGE | TITLE | DESC | SCORE; DESC binary
"Set"/"Missing"(red); score red <50; score formula 100 − 40(no desc) −
15(no custom title) − 25(dup title) − 20(noIndex); **no empty state —
zero pages = header over blank**.

PagesTab: load error takes priority over both views; delete confirm
'Delete "{name}"?' + undo note; home/only-page delete bypasses dialog
(toast only); rename conflict "A page with this name already exists".

**PageCommandPalette**: **NO group headings** — flat listbox; fuzzy
subsequence on name only; empty 'No pages match "{query}"'; footer legend
↑↓/↵/esc.

**BulkToolbar**: dark pill; "{n} selected" · Move to… (menu: "No folders
yet" empty state, folders, separator, "Remove from folder") · Duplicate ·
Delete · ✕.

**SeoTab** (biggest miss surface): Google preview (italic placeholder "No
description — add one below to improve ranking") · **noIndex ON hides the
score entirely** and shows warning banner + "Turn indexing on →" · score
28px mono green≥80/amber, verdict "Looks good"/"Needs work", 2×2 check
grid (+30/+40/+30/Required) · <80 banner "Reach 80+ before publishing —
add a meta description (+30 pts)" · title counter {n}/60 with " · Too
short"/" · Ideal"/" · Too long" · **"Write with AI" pill only when title
<10 chars** (aiBusy state; AI failure silent) · desc counter colours ·
slug prefix chip + **live-page slug-change warning banner** (redirect
advice) only when slug≠saved && status live && no error.

**SocialTab**: OG card 1200:630 (mono "1200 × 630" placeholder), fallback
chains, 3 fields with counters, no validation.

**AdvancedTab**: Live|Hidden|Password radiogroup (3 helper strings);
**password card only when password mode** (Show/Hide + Copy, Copy
disabled empty); Allow indexing + Follow links toggles; custom <head>
Textarea + headCodeError + "Sanitized before save."

**UnsavedWarningModal**: "You have unsaved changes in {SEO|Social|
Advanced} tab." — buttons **Discard (autofocused!) · Cancel · Save &
Switch**.

**PageSettingsDrawer**: score chip on SEO tab only when <80 && indexing;
autosave 500ms + ⌘S; save failure row "Couldn't save your changes." +
Retry; handleDiscardAndClose dead.

### 7. AI tab

ScopeChip chat-only; locked = 🔒 span ONLY (aria "Scope locked during
prompt") — dot/text unchanged. Multi-select injects assistant message "AI
editing supports one element at a time in v1 — select a single element."
**EmptyThread copy references quick actions that don't exist** ("Try a
quick action or type a prompt to start.") — copy bug. ChatMessage:
"You"/"Assistant", streaming, error role=alert, "(stopped)", edit block
pending → Discard+Apply, else "✓ Applied"/"Discarded"; "↻ Regenerate"
only on assistant msgs w/o edit. DiffRows: empty → summary; rows field ·
from? · to. AgentPlan: idle (auto-apply checkbox + flipping sentence
tail) · planning ("Planning the steps…", checkbox gone) · running ("Step
{i} of {n}" + Stop) · step labels (· / … / review / ✓ applied / skipped /
no change / failed) · awaiting+edit → DiffRows + Skip/Apply · error ·
done "Run complete — {n} applied, {n} skipped". **Privileged confirm
title/message come FROM THE SERVER** (Figma can't have the copy);
"Publish"→"Publishing…"; 7 gate toasts incl. "Open this editor from a
site URL with ?siteId=…". Composer: "Ask AI…", ↑⇄■ swap.

### 8. Settings — 14 screens (table)

Shell: root⇄section transition states; savebar "{n} unsaved" + Discard/
Save; guard dialog "Discard changes?".

1 General: identity (name/favicon/7-language select), social ×3, legal
links. 2 Branding: **navigation map, not a form** — 5 rows, only 3 have
"Open →"; "Open Palette →" disabled when handler absent. 3 SEO: Twitter
handle + default OG + per-page pointer note. 4 Publish history: gate copy
"Publish the site once to start a version history." 5 Export: static +
"Open exporter". 6 Domains: demo-project gate ("The demo project can't
have a custom domain.") · loading · loadError ("Is the dashboard
running?") · empty ("…free buildrick.app address…") · **4 status lines**
(ssl-provisioning ◷ / verified ✓ (+primary) / failed ⚠ 48h note /
pending) · "Check now/again/Checking…" · **admin gate w/ tooltip
reason**. 7 Analytics: GA/Pixel/Clarity/GTM/Cookie-consent; **4 regex
validation errors** (e.g. "…should start with G- followed by 10
characters, like G-ABCD123456.") · per-provider success line ✓. 8
Localization: default select, enabled list + Default badge, add select;
guards "Cannot remove the default locale…" / "At least one locale must
remain enabled."; Phase-D note. 9 Custom code: 3 mono textareas; head+CSS
validation "✗ {err}" lists; **body scripts have NO validation display**.
10 Redirects: add form + active list; per-rule validation strings. 11
Headers: CSP/HSTS/X-Frame/Referrer/Permissions; "Wrong values can break
the site…" 12 Forms: form select, Inbox|Unread|Spam|Archived tabs,
Export CSV/"Exporting…", unread blue-border rows, expand→dl + Mark spam/
Archive/Delete, pagination; no-forms copy "Drop a Form block onto a
page…"; expand auto-marks-read. 13 Integrations: Analytics + 6 "soon"
catalog cards + Advanced stacked; dirty OR'd. 14 Webhooks: **admin-gate
full-screen** ("Only an admin can manage webhooks — the signing secret is
part of the configuration…"); connect/edit/regenerate/disconnect w/
inline confirms; secret Reveal/Copy; **3 delivery-line variants**
(never-fired / ⚠ {n} failed in 24h / ✓ Delivering — last {ago}).

LockedScreen: 3 variants (coming-soon 🔜+waitlist / pro / enterprise),
PRO purple badge, "Upgrade Now" → billing.

Gates: plan-gate key drift confirmed (`advanced` vs `custom-code`);
projectId-absent flips 6 screens into gate states; workspace links
reduced to Members+Billing.

### 9. Component library

**ComponentDetailScreen**: preview/"No Preview"; Type/Tags ("No tags")/
Description rows; Insert/Duplicate/Delete; **Instance Actions double-gated
(isInstanceSelected && isPro; isPro defaults BEGINNER w/o provider)** —
only "Detach instance"; variants → pill pickers per property; delete
confirm **2 message variants** (instances>0 → "…will detach all
instances. Continue?"); success toast + nav back. **File renders
unstyled divs — the live detail screen matches NO board (visual drift).**

Rename modal: "Rename Component", 1 input, no validation. Variant-picker
modal: "Select Variant — {name}", current = accent + "(current)".
**DetachConfirmModal: 4-bullet anatomy** (✓ snapshot bindings, ✓
free-form, ⚠ no master edits, ↩ undo restores) + meta strip "Master: {n}
instances"; Detach NOT styled destructive. CreateComponentModal: Name +
Group select (**single option "Your symbols"**) + conditional bindings
card (default TRUE, count-sensitive hint) — sidebar + passes no
selectionContext (no checkbox), canvas right-click does. ComponentsTab
extra states: storage gate copy, PanelErrorState, compact empty, full
empty (◇ + **dead "Learn more" link**), selection banner "Selected: {n}
layers" + Create, skeleton ×4, sr-only live region, "FROM BRAND" section
deliberately unshipped.

---

## PART 2 — Canvas (reader 2, 69 calls) — essentials

- **Overlay mount order + gates** fully mapped (CanvasOverlayGroup: 13 children with exact conditions).
- **ElementContextMenu is NOT flat**: 4 submenu groups — Edit (5), Insert (6),
  Layout (9), Quick Style (8) — plus up to 7 standalone items (Save as
  component, Reveal in Layers, Select Parent, Group, Ungroup, Lock/Unlock),
  exactly 1 separator, 150ms hover-open submenus, viewport flip. Quick Style
  writes literal `#ccc`/`#f5f5f5` (off-token!). "Select from stack" is
  captured but **no action consumes it — feature doesn't exist**.
- **RichTextEditor inline bar = 18 controls** (heading+size selects, B/I/U/S,
  lists ×2, aligns ×4 — Justify shares Center's icon —, indents ×2, text-color
  + highlight popovers, link popover w/ Remove/Apply, clear). **BUG: mounted
  unanchored inside a pointerEvents:none root; guards look for
  `.bd-inline-toolbar` which the component never applies; activeStyles never
  passed so no button ever shows active.**
- **Canvas ⌘⇧P CommandPalette** (distinct from shell ⌘K): 25 commands,
  Recent chips, "(Select an element first)" disabled hint, footer legend.
- **DropFeedbackOverlay: 9 exact invalid-reason strings** ("Cannot have
  children" … "Cannot place here"), destination labels (Insert inside/
  before/after {name}), Level-{n} depth badge, breadcrumb.
- **Hover overlay has 3 levels** — minimal / Alt=hierarchy / Alt+Shift=
  box-model (margin orange, padding green, InfoBadge 2-row, "Double-click to
  edit" hint) + Ctrl=Clone badge ⊕.
- SelectionBox: CMS badge, locked badge, rotation knob (Shift=15° snap),
  resize handles (edge handles only when >50px), size indicator while
  resizing. **BUG: multi-select renders the AlignmentToolbar TWICE**
  (SelectionBoxOverlay:536 + CanvasOverlayGroup:304).
- AlignmentToolbar: 8 actions w/ Ctrl+Shift shortcuts, distribute needs 3+.
- Footer toolbar: 6 toggles exact labels (Snap Guides/Spacing/Grid/Rulers/
  Badges/X-Ray + ✓), zoom presets 10–300, Fit to screen, device-frame
  toggle (mobile notch/home, tablet plain).
- Rulers click→guide; guides drag/dblclick-remove — **BUG: locked guides
  can still be deleted by double-click**. Smart guides = hardcoded #FF00FF.
- **The two `?` overlays CONTRADICT each other**: cheat sheet (37 rows,
  ⌘-glyphs, Redo ⌘⇧Z, palette ⌘⇧P) vs shortcuts panel (Redo **Ctrl+Y**,
  palette **Ctrl+K — wrong**, Preview Ctrl+P). Different groups, different
  keys, both titled "Keyboard Shortcuts".
- CommentLayer: draft modal ("Leave a comment…", Post→"Posting…",
  ⌘Enter), reattach banner copy, orphan modal (title branches 1 vs n,
  warning cards, "Open Review panel"), 5 exact toasts. Site-id gated.
- CanvasEmptyCTA exact copy ("Start building" + two buttons).
- **Dead canvas UI confirmed**: ZoomControls, ZoomControl, QuickAddBar,
  SmartSuggestions, UndoRedoControls, DeviceSelector, InspectorToggle
  (its "press I" shortcut literally cannot fire — component unmounted, yet
  its localStorage flag still forces box-model hover), CanvasSpot ×2,
  ~10 orphan Emotion styles. Zero permission/flag gates in canvas.

## PART 3 — Shell (reader 3, 53 calls) — essentials

- **11 StudioModals mapped with full field/state tables** (SaveTemplate,
  Export, Shortcuts, MediaLibraryPanel, ImageEditor, IconPicker,
  e-commerce CollectionSetup, CreateComponent, SaveAsComponent,
  ProjectSettings, CMSCollectionSetup wizard + CMSRecords).
- **ExportModal reality**: format radiogroup HTML/ZIP/React (+Vue/Next.js
  "Soon" badges), tabs Preview|Code|Options, device preview, code sub-tabs
  HTML/CSS + line counts + Copy, options (CSS embedded/external/inline,
  minify, reset, meta, viewport, CMS None/Embed/Template + handlebars/
  liquid), stats row, "Export as ZIP/HTML/REACT" + "Exporting…". **ZIP
  failures show the user NOTHING (devError only).**
- **MediaLibraryPanel reality**: tabs Library|Upload|**From URL (stub:
  "coming soon")**|Optimize, grid/list toggle, 10MB max, multi-select
  footer "Use Selected", nested VideoPreview + delete confirm.
- **CMSCollectionSetupModal = 2-step wizard** (Name & Type → Fields) +
  dynamic-pages toggle (slug pattern/template path/SEO title/desc) +
  success banner auto-close 1200ms.
- **ProjectSettingsModal tabs = General | Canvas | SEO** (grid size,
  snap-to-grid!) — not favicon/social.
- CMSRecordsModal: **no failure UX at all** (mutations have no catch).
- PublishConfirmModal: 4 fact rows, approval line 5 variants ✓ board-close.
- ConflictModal 2-state (confirmOverwrite inline escalation) ✓ boards.
- Exit guard verified (risky = no save button ✓ my board) + 2 error-line
  variants + 3s save-timeout → auto-escalates dirty→risky.
- Shell ⌘K: disabled rows don't close; **empty states = the CmdK·ai-offer
  board's content confirmed** ("That isn't a command — send it to AI?").
- IssueChip 3 shapes; review pill 6 states + amber-demotion ✓ boards.
- NotificationPanel: non-jumpable row w/ "The target is gone…" line ✓ board.
- PublishHistory: 4 post-action notice variants, ADMIN rollback gate.
- **UpgradeModal**: purple badge, 4 ticks, window-event trigger from 403
  interceptor — **still has NO board (G14 was never drawn — my miss)**.
- **60+ unique toasts inventoried** with exact copy/tone/duration incl. 3
  sticky sync-failure toasts. Only undo/redo toasts have a board (S3.9).
- **Code bugs**: `setSyncStatus` never called (syncing state unreachable);
  IssuesPanel row navigation is a no-op; SaveTemplate has no busy label.

## PART 4 — Media + Inspector (reader 4, 43 calls) — essentials

- SlimLauncher: 6 exact grid states w/ testids; **view/sort controls
  permanently disabled** (T12); counts vanish in error state; right-click
  is the ONLY entry to selection mode; footer Upload disabled at quota.
- UploadZone: 50MB cap, rejection flashes, 6-state visual ladder
  ("Storage full" / "Almost full ({n}%)" / drag / idle).
- **LibraryView (fullpage) toolbar reality**: "{n} files · Last added {rel}"
  + uppercase format strip + sort Date added/Name/File size/Type + ↑↓ +
  grid 2/3/4 + select-mode ☑ — **NOT drawer pills** (my board drew pills).
  **Copy conflict in code: empty-state says "max 10 MB" but UploadZone
  allows 50MB.**
- StockBrowserOverlay (drawer): 10 colour filters; StockSourceModal
  (fullpage): **12 incl. Purple + Magenta**; quota strip prop-gated; save
  vs insert semantics differ by type.
- ReplaceAcrossDialog: **3 phases** (preview w/ page-picker checkboxes ·
  committing · result) + partial-failure state ("{r} replaced, {f}
  failed." + details + Retry failed) — my modal board is phase-1 only.
- ConfirmDeleteModal: in-use warning + **>20 bulk requires typing DELETE**.
- AssetDetailOverlay: meta-error variant, ✨ Generate→"Generating…", 5
  destination rows w/ gates; versions inline-restore ✓ boards.
- AssetCell: provenance badges STOCK/AI (browser-only, "ai" has no
  writer), locked overlay, APPLIED chip.
- Inspector: TokenPickerPopover (Tokens/Custom tabs, 4-col swatches, 2
  empty states, keyboard grid nav); BindingPopover (3-level drill-down +
  3 empty states + reset-on-close); ⋯ menu = Duplicate/Copy styles/Paste
  styles(disabled-gated)/Delete; BatchStylePanel (5 controls + "Mixed"
  overwrite hints, 2+ only); MultiSelectToolbar (align ×6 + distribute ×2,
  3+ rule, tooltip degradation).
- **InspectorEmptyState has a SECOND state**: "Template applied!" banner
  (30-minute localStorage window) + "Set Brand Colors" CTA — no board.
- ScopeDropdown "All like this" inline confirm ("Apply to {n}");
  BreakpointPill override dot (never on desktop); StateDropdown override
  dots; DetachInstanceButton triple gate (pro mode + instance + composer).
- Section machinery: 2-sections-open default, per-type persistence,
  expandAll/collapseAll exposed but **no UI control mounted**; "More
  settings" auto-expands on search-match/value; density=fewer → 3 sections
  + "Simplified view" footer ✓ boards.
- Gates: `USE_DEV_MODE` localStorage → All CSS section; schema-border
  flag; DS pro/beginner modes.

---

## FINAL VERDICT — what the boards still get wrong or miss

### A. My recent boards that are WRONG vs code (fix first)
| Board | Defect |
|---|---|
| Media · modal · picker | Code = 4 tabs (Library/Upload/From-URL-stub/Optimize), 10MB note, Use Selected footer — board is a generic grid |
| Content · collection-setup | Code = 2-STEP WIZARD + dynamic-pages toggle + success banner — board is single-step |
| Project settings (modal) | Code tabs = General/**Canvas**/**SEO** (grid size, snap) — board invented Favicon/Social tabs |
| Export · HTML (modal) | Code = format radiogroup + 3 tabs + options + stats — board is a single pane |
| Media · modal · replace-across | Code = 3 phases + page-picker + partial-failure — board is phase-1 only |
| Media · fullpage · library toolbar | Code LibraryView = count+Last-added+format-strip+sort+grid-2/3/4 — board drew drawer-style pills |

### B. Genuine board GAPS confirmed by evidence
1. **UpgradeModal** (G14 — never actually drawn)
2. **Canvas ⌘⇧P command palette** (25 commands, distinct from shell ⌘K)
3. **RichTextEditor inline toolbar** (18 controls — S3.1 shows editing, not the bar)
4. **Hover-overlay 3 levels** + clone badge + box-model view
5. **InspectorEmptyState "Template applied!"** second state
6. **TokenPickerPopover** (tabs, swatch grid, empty states)
7. **Toast catalog** reference board (60+ toasts, 5 tones, sticky class)
8. **ConfirmDeleteModal bulk type-DELETE** state
9. **CanvasBreadcrumb** bottom bar (Alt+↑/↓ hints)
10. Element context menu **submenus** (S3.3 board is flat; code is 4 groups + standalone)

### C. Code bugs the audit found (→ TODOS, not boards)
1. RichTextEditor toolbar unanchored + pointerEvents dead + activeStyles never passed
2. AlignmentToolbar rendered TWICE on multi-select
3. Locked guides deletable by double-click
4. The two `?` overlays contradict (Redo/palette/Preview keys); panel's Ctrl+K claim is wrong
5. ExportModal ZIP failure shows nothing; CMSRecordsModal has no failure UX; AiPromptPopover apply-failure silently closes; BlockPickerModal failures silent
6. `setSyncStatus` dead → "syncing" state unreachable
7. IssuesPanel row navigation no-op (known D26, confirmed)
8. Media empty-state "10 MB" vs UploadZone 50MB copy conflict
9. Stock colour filters 10 vs 12 inconsistent (fullpage includes Purple/Magenta — DESIGN.md ban question)
10. SlimLauncher view/sort controls permanently disabled (T12 debt)
11. InspectorToggle "press I" affordance unmountable yet its flag still changes hover behavior
12. Quick Style context actions write off-token literals (#ccc, #f5f5f5)

