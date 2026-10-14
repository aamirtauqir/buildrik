# Editor audit — owner answers (2026-10-10)

The owner's answers to the 75 calls in `OWNER-DECISIONS.md`. Recorded as given
(2026-10-10). Items marked † referred to a memo that wasn't attached; their
detailed scope stays provisional and the lane implementing them writes the
acceptance criteria into its plan before building.

## 1. Design consistency
| ID | Answer |
|---|---|
| DQ-015 | Inter 11/500 for "Margin"/"Padding" labels; Geist Mono for numeric values. Update the Figma board and typography guidance together, then align code. |
| DQ-026 | Replace the 💡 emoji with the icon system's lightbulb icon; keep "Tip 1/4". Update the board first. |

## 2. Figma gaps and feature decisions
| ID | Answer |
|---|---|
| FG-001† | Review v2 is the design to implement. Resolve FG-002 first, then build the redesign and its states as one piece of work. |
| FG-002† | Review v2 is the single CURRENT DESIGN; earlier design historical; every shell link points at the chosen board; record it. |
| FG-004 | Implement Review v2 states with FG-001; map each design state to an app state before building. |
| FG-006 | Keep C-03 (clients place located pins). Isolated rendering origin: sanitized snapshots, restricted scripts, small trusted pin bridge, validated messages. Anchor pins to page + snapshot version + stable element identity (selector/coords as fallback). Security review before implementation. |
| FG-007† | Page settings drawer with explicit Cancel / Save. Readability (supported languages; "Not evaluated" otherwise), optional focus keyphrase, supported schema types, canonical validation. Checklist/status, not an unexplained SEO %. Save updates draft; publishing separate. |
| FG-008 | Pages-panel SEO indicator after FG-007: "Not checked" / "Needs attention" / "No issues detected"; accessible text; stale marker; dot, drawer and site overview share findings. |
| FG-009† | Site SEO in the same milestone as Page SEO: site defaults, title templates, pages overview, structured data, sitemap info, search/social previews; metadata + sitemap from the same resolved settings as publish; structured data limited to types real content supports; previews "approximate". |
| FG-010 | "Fix" navigates to the element + Inspector control. Dirty settings → Save and continue / Discard and continue / Stay; failed save keeps changes and user in place; refresh the issue if its target is gone. |
| FG-011 | X metadata defaults to shared social values with "Customize for X"; initialise from shared; keep custom values when toggled back; label inherited vs customized. |
| FG-012† | Drawer with staged edits and Cancel / Save — supersedes owner decision #20's Cancel/Done. Same unsaved-changes guard on close, page switch, and Fix. |
| FG-015h | Theme-push results distinguish successful / skipped / failed sites, explain skips, per-site Recapture where appropriate; next Brand-plan part. |
| FG-016† | Brand AI suggestions as reviewable proposals (diff, scope, select, undo); after shared-style + theme-push are dependable. |
| FG-018† | Clearly named token-kind sections inside Brand, compact nav; don't create 11 pages from 11 boards before confirming intent. |
| FG-021 | Start with "Hide when the bound field is empty" on collection templates; empty defined per field type (0/false valid); consistent across canvas, Preview, export; hidden elements discoverable in editor. |
| FG-022 | Opacity + Shadow expanded; Filters, Transform/Motion, Advanced under More effects; indicate a collapsed section holds an active effect. |
| FG-026 | One Accessibility category in Issues merged with L4-040: headings, accessible names, form labels, page title/lang, rendered contrast; warnings first; uncertain vs confirmed; link to element. |
| FG-029† | Wide viewport choice at the canonical design's width; a preview preset and a CSS breakpoint are separate decisions — any new breakpoint needs inheritance/compat rules. Width TBD from the board. |
| FG-030† | Custom numeric Preview width (CSS px); keep presets + Fit; remember per site; never creates style overrides. |
| FG-037† | Defer commerce to its own milestone; keep incomplete commerce paths unavailable. |
| FG-041 | Local loading + inline error rows with Retry; keep loaded content; retry only the failed op; no duplicate insertion; no second toast. |
| FG-043 | Date presets short / long / ISO + optional inclusive min/max; format in presentation config, bounds in validation; date-only values without timezone shift. |
| FG-044 | Same fix as L1-025 / L3-014: Start from Scratch opens /edit/:id after successful creation. |

FG-006 rationale: same-origin content with allow-scripts + allow-same-origin can escape its sandbox (HTML standard) → isolated origin. Accessibility checks and structured data must be labelled by what they actually check (no WCAG-conformance / rich-result promises).

## 3. Canvas, onboarding, editor navigation
| ID | Answer |
|---|---|
| L1-012 | Fit when the frame exceeds the column, else 100%; remember per site whether the user chose Fit or a fixed %; recalc Fit on resize unless a zoom was explicitly chosen. |
| L1-013 | 1280px shared Desktop preset for canvas, Preview, export rendering; exported pages stay responsive; existing media queries and overrides untouched without a separate migration. |
| L1-015 | Server-backed onboarding state per user × site; pill and checklist read the same computed progress; milestones derived from real events/state; dismissals stored separately; no global "completed". |
| L1-017 | Inserting an Image stays in Add and selects it; Inspector's Choose image picks the asset. |
| L1-022 | One name per concept: Elements (primitives), Blocks (sections), saved Components; no duplicates; consistent categories across Add, search, command palette. |
| L1-024 | "This site" / "Workspace library" scopes; workspace components discoverable in Components panel, same data as Add → Saved components; scoped empty states. |
| L1-025 | Start from Scratch → /edit/:id after successful creation; primary Edit site on Overview. Resolves FG-044 + L3-014. |
| L1-029 | One tip queue, max one auto tip per session, idle only, never steals focus, seen/dismissed persisted with L1-015; dismissing a tip doesn't complete the task. |
| L1-031 | Neutral Hero placeholders ("Your headline here" / "Add a short introduction to your business or idea.") and a Brand-token Button. |
| L1-033 | Generate Add commands from the element catalog, keep the curated opening list; tighten fuzzy matching, dedupe, consistent zoom labels/actions; context-aware commands only. |

Zoom (how large the canvas looks) and viewport width (which responsive layout applies) stay independent.

## 4. Components, forms, Layers, small interactions
| ID | Answer |
|---|---|
| L2-020 | Light/dark preview background with manual override (+ transparency checker); never touches the component's saved styles. |
| L2-021 | One component-count model; source info on entries; versions vs instances; singular/plural; group identical names visually but keep distinct components. |
| L2-022 | Rename to "Component settings"; reserve "Edit master" for a future in-place master edit mode. |
| L2-024 | Brand-token defaults for Form children (inputs, labels, buttons, spacing); shared with L3-029. |
| L2-031 | "No matching layers" + Clear search for a failed search; "No layers yet" for an empty tree; update board + test together. |
| L2-032 | Stateful Lock/Unlock + contextual Select children; remove genuinely unused branches after checking callers. |
| L2-034 | Remove ↗ from "SEO & social"; make it directly discoverable; keep overflow only with real secondary actions. |
| L2-035 | Toolbar hints on hover and keyboard focus; never cover canvas content; accessible names always present. |

## 5. Pages, CMS, domains, settings
| ID | Answer |
|---|---|
| L3-009 | "Unsaved changes" / "Unpublished changes" / "Draft · not published yet" from one state; same for screen readers. |
| L3-010 | Extensionless URLs for Vercel-published sites (cleanUrls); one URL resolver for settings, links, previews, sitemap, canonicals; real prod host when available; other export hosts keep compatible behaviour. |
| L3-011 | Indexing editable in SEO only (Advanced links there); one stored value "Allow search engines to index this page"; off → noindex + excluded from sitemap. |
| L3-014 | Same as L1-025 / FG-044. |
| L3-017 | Drafts visible + marked Draft while authoring; designed empty state; initial bindings from the schema; published-content preview uses publish filtering; unresolved tokens never reach published output. |
| L3-018 | Hide JSON Sources for normal users until they persist; any dev/sample route says "Sample · this session only"; keep existing session data. |
| L3-020 | Delete + Undo for ordinary record deletes (only if Undo truly restores identity + relations) + Status column; impact-specific confirm where recovery is incomplete; typed DELETE for broad/irreversible ops (#29). |
| L3-021 | Expandable Field / Mine / Theirs diff above conflict actions, tied to a server revision; keep local draft until the chosen action succeeds. |
| L3-022 | Version precondition required for normal updates; "Keep mine" = explicit overwrite against the latest reviewed revision (another edit → fresh conflict); permissions/validation still apply; update callers before enforcing. |
| L3-023 | Keep the settled stepper/title; design pass for binding-field labels, no-selection state, empty-state links, discoverable Dynamic pages, clearer "Open affected record". |
| L3-029 | Contact Form styling with real associated labels for the default Form; Add field asks for a type; shared with L2-024; verify published semantics. |
| L3-033 | Remove unverified registrar nameserver values; show the project's actual required records (or generic instructions); distinguish detected vs required records. |
| L3-035 | "Couldn't load your settings. Try again." + Retry; one auto-retry for eligible transient reads; specific copy for auth/permission errors; keep existing data while retrying. |
| L3-036 | Optional site title template + preview; order: page SEO title → site template → page title; pre-publish check inspects each emitted title; a template alone doesn't satisfy "SEO configured". |

## 6. Assets, templates, Brand, issue visibility
| ID | Answer |
|---|---|
| L4-007 | Automatic paid alt text opt-in, workspace toggle OFF by default; on-demand Generate; explain credits, enforce quotas, dedupe generation; keep manual text; per-placement overrides; decorative images keep empty alt. |
| L4-011 | One shared asset-action list; "Replace across site…" disabled at 0 uses; same order/permissions everywhere. |
| L4-012 | Keep documented columns-control behaviour until the board is checked; responsive select-mode footer that fits supported widths. |
| L4-013 | "Delete" + "You can undo this for a few seconds." only when recovery works; "Delete permanently" only with no recovery path. |
| L4-024 | Re-author templates on semantic Brand tokens; new insertions stay connected; existing template content handled separately, preserving customisations. |
| L4-028 | Neutral starter names (Ocean, Slate, Paper, Mono), keep palettes; editor-chrome colour ban stays scoped to the editor. |
| L4-029 | Banner → "Using default tokens."; keep preview-switch layout. |
| L4-038 | Count badge on Site menu → Issues from the same unresolved findings; count in accessible label; "not checked" ≠ zero; topbar chip deferred. |
| L4-040 | Merge with FG-026 into one accessibility module; static checks first; rendered contrast after L5-050 font/style parity. |

## 7. AI, comments, Preview, publishing, saving
| ID | Answer |
|---|---|
| L5-015† | One clearly labelled AI entry on the selection toolbar, scoped to the selection, reusing the existing AI flow; vector icon. |
| L5-016† | Rewrite / Shorten / Tone / Fix grammar for eligible text; show proposal before apply; keep formatting + links; undo; a late response never overwrites newer edits. |
| L5-026 | "Generate alt text" from missing-alt Issues — NEXT; quota-gated; editable suggestion; one undo step per image; respects decorative empty alt. |
| L5-027 | "Apply with AI" on comments after threading + reliable target mapping; located comments only; flag kept; server-side permissions + quotas; accept then Resolve. |
| L5-031 | Replies after edit/delete; grouped under a root comment/pin; reply permissions; deleted-root placeholder keeps surviving replies; migration coordinated with Review state model. |
| L5-032 | Mentions after threads + notifications; permission-aware picker; respects notification prefs; mentioning never grants access. |
| L5-033 | Comment management first: authors edit/delete own; admins moderate others; admin edits of others' words show attribution; confirm storage needs before promising no migration. |
| L5-050† | Preview/canvas/export font + text-colour parity as a correctness fix; resolve effective defaults even with no saved slot; preserve custom Brand choices; verify fresh and customised sites. |
| L5-061† | One publish flow: topbar button opens the checks surface showing destination + final "Publish site"; no stacked confirm. |
| L5-072† | One primary recovery surface per save-failure incident + passive status; keep work, Retry, canvas usable, dedupe notifications; clear only after recovery confirmed. |

Comment order: L5-033 → L5-031 → L5-032; L5-027 after replies.

## Implementation order (owner)
1. **Correctness and recovery** — Preview style parity (L5-050), save-failure handling (L5-072), CMS conflict behaviour (L3-021/022), publication labels (L3-009), onboarding progress (L1-015, L1-029), domain instructions (L3-033), paid-AI control (L4-007).
2. **Design authority** — single Review v2 board (FG-002), Page settings Save/Cancel (FG-012); decision log + conflicting references.
3. **Shared editor foundations** — viewport presets + zoom (L1-012/013), Start from Scratch routing (L1-025/L3-014/FG-044), catalog naming (L1-022/033), component scopes/counts (L1-024, L2-021/022), form defaults (L2-024, L3-029).
4. **SEO and accessibility** — Page + Site SEO together (FG-007/008/009/010/011/012, L3-010/011/036), one accessibility module (FG-026, L4-040).
5. **Collaboration and expansion** — comments (L5-033 → 031 → 032), secure client pins (FG-006), AI actions (L5-015/016/026/027), Brand AI (FG-016), commerce (FG-037, deferred).

## Plan questions — owner accepted the recommended defaults (2026-10-10)
1. Page settings footer: **Cancel / Save** (FG-012); the designer updates the board's "Discard / Save".
2. Indexing off ⇒ noindex **and** out of the sitemap; no separate per-page sitemap toggle.
3. Site default title applies to the **home page only** in the title order.
4. Client pins (FG-006) need a **separate snapshot domain** (not a subdomain), e.g. `buildrick-snapshots.com`, on cPanel with SSL — **owner registers and provisions it**; the pins plan's Task 0 security review stays blocking.
5. Clients **see team replies** on their own threads.
6. Reply/mention notifications are **in-app only** for now (no email).
7. Archive the Preview accessibility-checker board; one Accessibility category in Issues; designer draws one new Issues board.
8. The real cleanUrls deploy check is run **by the owner** in a test workspace they name (QA workspace never publishes).
CMS items L3-017/018/020/021/022/023 start now (cms-wave0 is already on main).
