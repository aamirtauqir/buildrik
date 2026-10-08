| ID | Severity | Module / location | Issue | Labels | Evidence | Report |
|---|---|---|---|---|---|---|
| L1-002 | Critical | canvas → export → publish) | Export and publish drop an element's own text once it has a child | BROKEN FUNCTIONALITY, INTEGRATION ISSUE, CODE ONLY ISSUE | LIVE-VERIFIED (export output). The publi | L1 |
| L2-001 | Critical | Templates · ⌘K "Save page as template" → Templates cata | "Save page as template" corrupts the page HTML; applying the saved template strips almost all styling | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L3-002 | Critical | Pages × Add panel · page switching | After a page switch, Add-panel inserts land on the previously selected page | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L4-001 | Critical | Media → Canvas / drag a drawer tile onto the canvas / drag | Dragging a library asset onto the canvas writes `src` onto the section instead of inserting an image | BROKEN FUNCTIONALITY, INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L4 |
| L1-001 | High | Add panel → click-insert; smart placement | Click-to-insert puts blocks INSIDE the selected heading or text | BROKEN FUNCTIONALITY, CODE ONLY ISSUE | LIVE-VERIFIED | L1 |
| L1-003 | High | Canvas → selection toolbar (Duplicate · Delete · More) | Selection toolbar covers small elements; clicking a selected button again deletes it | BROKEN FUNCTIONALITY, FIGMA + CODE ISSUE | LIVE-VERIFIED | L1 |
| L1-004 | High | Canvas resize handles × breakpoints | Canvas resize at Tablet/Mobile writes the Desktop (base) style | BROKEN FUNCTIONALITY, INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L1 |
| L1-007 | High | Undo/redo × Pages | Undo jumps the editor to the first page | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L1 |
| L2-002 | High | Templates · Preview › Create page (also Pages) | Creating a page from a template with a name already in use breaks every autosave (duplicate slug → 500) | BROKEN FUNCTIONALITY · INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L2 |
| L2-003 | High | Layers · row context menu · Delete | Layers row menu → Delete removes a locked element | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L2 |
| L2-004 | High | Layers · row menu Delete on an instance child · Components | Layers row menu → Delete removes a child of a component instance; the instance registry goes stale | BROKEN FUNCTIONALITY · INTEGRATION ISSUE | LIVE-VERIFIED | L2 |
| L2-005 | High | Components · instance text override → "Update from select | Text overrides on an instance are silently lost when the master is updated | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L2 |
| L2-006 | High | Components · detail screen › Insert from saved components | "Insert from saved components" nests the new instance inside the selected instance of the same component | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L2 |
| L2-007 | High | Canvas selected-element toolbar (Duplicate · Delete · ⋯) | The selection toolbar sits on top of the selected element; clicking the element again duplicates it | BROKEN FUNCTIONALITY · FIGMA + CODE ISSUE | LIVE-VERIFIED | L2 |
| L2-008 | High | hover | :hover / :focus state styles never show on canvas when the base value is inline (it always is) | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | LIVE-VERIFIED (canvas); published UNVERI | L2 |
| L2-009 | High | Templates · E-Commerce / Restaurant / Coming Soon ("Built-i | Pro templates are blocked with "requires the Pro plan" on a BUSINESS-plan workspace | BROKEN FUNCTIONALITY · INTEGRATION ISSUE | LIVE-VERIFIED | L2 |
| L2-010 | High | Components · detail › Delete master › toast Undo | Undoing a component delete does not survive a reload (server copy stays deleted) | BROKEN FUNCTIONALITY · INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L2 |
| L3-001 | High | Pages · New page modal / Rename → autosave | A page whose name repeats an existing slug makes every autosave fail with a 500 | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L3 |
| L3-015 | High | CMS · Fields › field inspector › Key | Renaming a field key strips rich-text formatting from existing records | BROKEN FUNCTIONALITY · INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L3 |
| L3-016 | High | CMS binding → canvas | Unpublishing or deleting a bound record leaves stale text on the canvas, and the bound marker disappears on reload | BROKEN FUNCTIONALITY · INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L3 |
| L3-024 | High | Forms public endpoint | Repeated field names drop all but the last submitted value | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L3 |
| L3-025 | High | Forms · Upload element | Upload (file input) block cannot work: multipart is rejected as "Invalid JSON" | BROKEN FUNCTIONALITY · MISSING FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L3 |
| L4-002 | High | Media / canvas drop / auto-save of dropped image | Every library drag re-uploads the asset (duplicate library entry, quota, and an extra paid AI call) | BROKEN FUNCTIONALITY, INTEGRATION ISSUE, AI ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L4 |
| L4-003 | High | Inspector → Image → Replace → "Choose image" → Use s | Replacing an image keeps the old image's alt text | BROKEN FUNCTIONALITY, INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L4 |
| L4-018 | High | Brand → Colours → token ⋯ → Rename token… | Renaming a token does not move its bindings; edits to the renamed token never reach the canvas | BROKEN FUNCTIONALITY, INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L4 |
| L4-019 | High | Brand → token ⋯ → Delete token… → "Replace Primary | "Delete and replace" leaves the deleted token live and the bound element unchanged | BROKEN FUNCTIONALITY, INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L4 |
| L4-020 | High | Brand → Colours "Used" column and token detail "Used by" | Token usage resets to 0 after reload, so "Used by 0 elements" and delete hard-deletes a token still in use | BROKEN FUNCTIONALITY, INTEGRATION ISSUE | LIVE-VERIFIED (count) / CODE-ONLY (hard- | L4 |
| L4-021 | High | Brand → Colour mode → preview Light/Dark switch → Bran | The Brand preview's Light/Dark switch flips the global, persisted colour mode, so lint reports false contrast failures | BROKEN FUNCTIONALITY, INTEGRATION ISSUE | LIVE-VERIFIED | L4 |
| L4-022 | High | Issues panel → "Border fails WCAG AA…" → Fix › | Contrast "Fix ›" rewrites the brand colour the wrong way, and the issue stays | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L4 |
| L4-033 | High | Issues / Publish CTA / open-errors confirm vs `sites.prePubl | Missing alt is a blocking editor error but a server warning | INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE | L4 |
| L4-034 | High | Issues → Whole site → "Second › Work" | Clicking a "Whole site" issue on another page selects an invisible element without switching page | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L4 |
| L5-001 | High | AI › AI column, Generate block, agent plan (`ai.streamProm | In dev, every streamPrompt AI flow is dead: Ollama is not running, and the server forces Ollama whenever OLLAMA_BASE_URL is set | INTEGRATION ISSUE, AI ISSUE, BROKEN FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-002 | High | AI › AI column (✦ AI chip, ⌘J with a selection, board- | An element-scoped AI prompt sends only the element id; the model never sees the element | AI ISSUE, INCOMPLETE FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L5 |
| L5-003 | High | AI › apply path (`applyAiEdit`) | AI edits overwrite and restyle a locked element | AI ISSUE, BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L5 |
| L5-004 | High | AI › agent run › Undo all | "Undo all" after an AI run undoes the user's own earlier edit | AI ISSUE, BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L5 |
| L5-007 | High | AI › Add › Generate a block | Generate a block: pressing Stop still inserts the block, with no toast and no Undo affordance | AI ISSUE, BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L5 |
| L5-030 | High | Review & Comments › Review panel | Team comments are invisible in the Review panel until a client review round is sent | BROKEN FUNCTIONALITY, INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-070 | High | Save › autosave | A failed autosave is never retried automatically, even after the network returns | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-074 | High | Save › reload recovery | Reload after a failed save shows contradictory recovery surfaces | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-075 | High | Save › reload recovery | "Restore my edits" and "Keep changes" do not save the restored edits | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L5 |
| FG-001 | High | Review / right-column Review panel / whole panel | Review panel v2 redesign (03 Oct) is not implemented | CODE ONLY ISSUE, INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED (empty state) + CODE-ONLY  | FG |
| FG-002 | High | Review / topbar `chip/review` / prototype routing | Two "CURRENT DESIGN" Review designs; shells link only the old one | FIGMA ONLY ISSUE | LIVE-VERIFIED (Figma read) | FG |
| FG-007 | High | SEO (page) / Pages ⋯ → Page settings / analysis | Page SEO drawer: no Readability, focus keyphrase, schema type or canonical validation | CODE ONLY ISSUE, MISSING FUNCTIONALITY | LIVE-VERIFIED | FG |
| FG-009 | High | SEO (site) / Settings › SEO | Site SEO: no structured data, sitemap, pages overview or search/social previews | CODE ONLY ISSUE, MISSING FUNCTIONALITY | LIVE-VERIFIED | FG |
| L1-005 | Medium | Canvas lock × drag-move | A locked element can be drag-moved | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L1 |
| L1-006 | Medium | Layers ↔ Canvas sync | Layers "Dim" and lock styling vanish after any edit; canvas-menu Lock never styles the element | INTEGRATION ISSUE, BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L1 |
| L1-008 | Medium | Save / persistence | The whole current project is mirrored to one unscoped localStorage key, `aquibra-project` | INTEGRATION ISSUE, CODE ONLY ISSUE | PHASE-1 CONFIRMED LIVE | L1 |
| L1-010 | Medium | Canvas drag-and-drop reorder | Drag-move ignores the drop indicator: "Drop here" above the target, element lands below | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-011 | Medium | Canvas → section reorder grips | Invisible section-reorder hit zones block clicks on the left edge of every top-level element | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-012 | Medium | Canvas viewport / Zoom | At 1440 px, 100% zoom clips 272 px of the Desktop page; no fit-to-width by default | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-013 | Medium | Breakpoints / Preview / Export | "Desktop" is three different widths: canvas 1024, Preview 1320, Export 1440 | INTEGRATION ISSUE, FIGMA + CODE ISSUE | LIVE-VERIFIED | L1 |
| L1-014 | Medium | Help rail → Keyboard legend | The Help-rail "Keyboard" legend contradicts the real bindings and the shortcuts sheet | CODE ONLY ISSUE | LIVE-VERIFIED | L1 |
| L1-015 | Medium | Onboarding (rail pill, Site menu → Getting started) | Getting started says "Done · 7 of 7" on a brand-new site while its checklist says 0/7 | BROKEN FUNCTIONALITY, INTEGRATION ISSUE | LIVE-VERIFIED (root cause CODE-ONLY) | L1 |
| L1-016 | Medium | Add → Image; canvas; export | An image with no src renders and ships as a broken `<img>` | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-019 | Medium | Canvas resize handles | Short elements have no left/right resize edge, so a horizontal resize also fixes the height | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-022 | Medium | Add panel catalog | The Add panel lists the same things three times under different names | FIGMA + CODE ISSUE | LIVE-VERIFIED | L1 |
| L1-025 | Medium | Site creation → first edit (dashboard → editor journey) | Create site → Start from Scratch lands on the site overview, where Edit is hidden in More | INCOMPLETE FUNCTIONALITY, INTEGRATION ISSUE | LIVE-VERIFIED | L1 |
| L1-035 | Medium | Publish → Pre-publish checks | Pre-publish checks pass an image with no src and a placeholder alt | INCOMPLETE FUNCTIONALITY, INTEGRATION ISSUE | LIVE-VERIFIED | L1 |
| L2-011 | Medium | Inspector · Fill › Colour (button) | Inspector Fill shows the type-default blue for buttons coloured through the `background` shorthand | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L2-012 | Medium | Layers · eye (Dim in editor) | Layers "Dim in editor" is lost on the next canvas edit while the row still says dimmed | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L2 |
| L2-013 | Medium | Layers · double-click rename | Renaming a layer cannot be undone | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L2 |
| L2-014 | Medium | Templates · Preview (built-in and saved) | The template preview renders raw `{{token…}}` placeholders, so primary CTAs look grey with invisible text | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L2-015 | Medium | Components · Update from selection | Updating a component master gives every instance element a new id | INTEGRATION ISSUE | LIVE-VERIFIED | L2 |
| L2-017 | Medium | updated` listener) | A console error during component update: Layers lock resync throws `el.getId is not a function` | CODE ONLY ISSUE | LIVE-VERIFIED (console); emitter UNVERIF | L2 |
| L2-018 | Medium | Inspector · breakpoint / state editing | On Tablet/Mobile and in pseudo-states the Inspector shows type defaults, not the inherited values | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L2 |
| L2-020 | Medium | Components · detail › "Master preview" | The component master preview is blank for light-on-dark components | FIGMA + CODE ISSUE | LIVE-VERIFIED | L2 |
| L2-021 | Medium | Add panel › SAVED COMPONENTS / FROM LIBRARY · Components  | Saved components have inconsistent counts and identical library entries | FIGMA + CODE ISSUE | LIVE-VERIFIED | L2 |
| L2-022 | Medium | Components · Inspector "Edit master ↗" | There is no in-place master editing; "Edit master" opens a management screen | INCOMPLETE FUNCTIONALITY · FIGMA + CODE ISSUE | LIVE-VERIFIED | L2 |
| L2-023 | Medium | Add › Image → Inspector Image section | A newly inserted Image is a broken `<img>` with alt "Image" | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L2 |
| L2-025 | Medium | Templates apply / `importHTMLToActivePage` · Layers | Template import turns `<br>` into a 63-px "Container" layer | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L2-033 | Medium | Layers · row menu Duplicate / Group / Move to page | Layers Duplicate, Group and Move to page bypass the engine commands and the lock gate (one row) | CODE ONLY ISSUE | CODE-ONLY (Phase-1 P2-1) | L2 |
| L2-038 | Medium | Canvas selected element · resize handle vs move | Dragging near a selected element's edge moved it to the end of the page root | BROKEN FUNCTIONALITY | LIVE-VERIFIED (single occurrence; may de | L2 |
| L3-003 | Medium | Add panel / nesting rules (found while testing pages) | Divider can be nested inside a Button (`<hr>` in `<button>`) | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-004 | Medium | Pages · history | Undo on a non-first page jumps the canvas to the first page | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L3 |
| L3-005 | Medium | Pages rename → Settings › Redirects | Rename "Update URL" offers, and saves, a redirect that hijacks another live page | BROKEN FUNCTIONALITY · INTEGRATION ISSUE | LIVE-VERIFIED | L3 |
| L3-006 | Medium | Shell save feedback (seen in Pages flows) | "Save failed" toasts stay up after the save has succeeded | INCOMPLETE FUNCTIONALITY · CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-007 | Medium | Pages toasts (homepage, delete, duplicate) | The Undo button on Pages toasts runs a global undo, not the page action | BROKEN FUNCTIONALITY · CODE ONLY ISSUE | CODE-ONLY (phase-1 P1-4; fix parked on b | L3 |
| L3-008 | Medium | sites.saveProject error path | Saving the project fails with a raw Prisma message that includes server file paths | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-013 | Medium | Pages · plan limits | Plan page limit is never enforced from the editor | MISSING FUNCTIONALITY · INTEGRATION ISSUE | CODE-ONLY (phase-1 P1-2) | L3 |
| L3-017 | Medium | CMS · Collection list element | Collection list on the canvas shows draft records (publish shows only published) and raw `{{item.*}}` when empty | INCOMPLETE FUNCTIONALITY · INTEGRATION ISSUE · Missing State | LIVE-VERIFIED | L3 |
| L3-018 | Medium | CMS › Sources › Connect a source | Data "Sources" added from JSON vanish on reload | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L3 |
| L3-019 | Medium | CMS sync | A collection the server refuses (INVALID) is dropped silently and then blocks publish | BROKEN FUNCTIONALITY · INTEGRATION ISSUE | CODE-ONLY (phase-1 CMS P1-3, partially f | L3 |
| L3-026 | Medium | Forms public endpoint | Visitors see raw JSON error pages on form failures | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L3 |
| L3-027 | Medium | Forms · FormBlock lifecycle | A never-published form already accepts public submissions, and its success redirect points to a site that doesn't exist; there is no test-submission path | INTEGRATION ISSUE · MISSING FUNCTIONALITY | LIVE-VERIFIED | L3 |
| L3-028 | Medium | Form inspector · After submit | Redirect-after-submit rejects internal paths, has no page picker, and shows raw field keys in errors | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L3 |
| L3-029 | Medium | Add → Form element | The default Form element renders unstyled and without labels | FIGMA + CODE ISSUE · Missing State | LIVE-VERIFIED | L3 |
| L3-031 | Medium | Site menu → Activity log (in-editor panel); dashboard site | Activity log stays empty after an hour of real edits | MISSING FUNCTIONALITY · INTEGRATION ISSUE | LIVE-VERIFIED | L3 |
| L3-032 | Medium | Settings › Domains (editor + dashboard) | Domains copy promises a "free buildrick.app address" that does not exist | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-036 | Medium | Settings › SEO | Site SEO has no title-template field, so the pre-publish "SEO configured" check cannot be cleared | MISSING FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (UI half) | L3 |
| L4-004 | Medium | Assets drawer tile click → canvas | Click-insert from Assets appends below the fold and does not scroll to the new image | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L4 |
| L4-005 | Medium | Assets drawer header and search placeholder | "Assets · N" header and "Search all N assets…" stay stale after upload or delete | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L4 |
| L4-006 | Medium | Upload progress bar | Upload progress sits at 75% for the whole network upload | INCOMPLETE FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L4 |
| L4-007 | Medium | Media upload → auto alt text | Every upload silently fires a paid OpenAI alt-text call, with no user control | AI ISSUE, INTEGRATION ISSUE | LIVE-VERIFIED | L4 |
| L4-010 | Medium | Assets empty state "Browse stock", Upload caret "Stock photo | Stock search: the not-configured state is reachable from prominent doors; one-key-missing case unverified | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED (not-configured) / CODE-ON | L4 |
| L4-014 | Medium | Asset detail alt text → canvas images using that asset | Alt-text edits in the library (and AI alt produced after placement) never reach placed images | INTEGRATION ISSUE, INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L4 |
| L4-016 | Medium | MediaManager.uploadFile | The engine's hard-coded 1 GB quota still overrides plan quotas | CODE ONLY ISSUE, INTEGRATION ISSUE | CODE-ONLY (needs >1 GB library) | L4 |
| L4-023 | Medium | Brand → Colour mode; site `darkMode` setting | No control turns site dark mode on, so dark values authored in Brand can never ship | MISSING FUNCTIONALITY, FIGMA + CODE ISSUE | LIVE-VERIFIED + CODE | L4 |
| L4-024 | Medium | Templates → Replace page → Brand | Templates insert literal colours, so after applying one every Brand token is "unused" | INTEGRATION ISSUE | PHASE-1 CONFIRMED LIVE | L4 |
| L4-025 | Medium | Inspector Fill → "Brand colours" picker; Delete-token repl | Colour pickers list internal primitives and duplicate names | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-026 | Medium | Brand → Review changes popover | "Review changes" ignores ⌘Z: undone edits still show as applied | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L4 |
| L4-028 | Medium | Brand → Starters | Starters ship banned indigo/violet accents and real-brand names | FIGMA + CODE ISSUE | LIVE-VERIFIED | L4 |
| L4-030 | Medium | Inspector → Fill → Colour on a template button | The Inspector Fill shows a token colour that is not the element's actual fill | INTEGRATION ISSUE | LIVE-VERIFIED | L4 |
| L4-031 | Medium | Brand → publish path | The BRAND_TOKENS_V2 kill switch is bypassed by the scratch composer (CMS publish, share, compare, time travel) | CODE ONLY ISSUE, INTEGRATION ISSUE | CODE-ONLY (no publish allowed) | L4 |
| L4-035 | Medium | Issues → "No favicon set…" row | Clicking a server-check issue (Favicon, SEO, Domain) opens Brand | BROKEN FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L4 |
| L4-036 | Medium | Issues panel (opened by "Fix issues first" from the open-err | Issues are not sorted by severity, so the one blocking error is buried | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-037 | Medium | Issues row click → Inspector | Locate replaces the Issues panel with the Inspector (no way back) and does not reveal off-viewport elements | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L4 |
| L4-038 | Medium | Topbar / Site menu "Issues" row | The issue count is only visible inside the Site menu row's tooltip | FIGMA + CODE ISSUE | LIVE-VERIFIED | L4 |
| L4-040 | Medium | Accessibility checks (Issues feed) | The a11y checker covers only alt text, links and token-vs-page contrast | MISSING FUNCTIONALITY | LIVE-VERIFIED + CODE | L4 |
| L4-041 | Medium | Issues feed ↔ Publish panel | Server-check rows in Issues are fetched once and never refreshed | INTEGRATION ISSUE | UNVERIFIED (needs a Vercel/pages state c | L4 |
| L5-005 | Medium | AI › agent run summary | An AI step that applied nothing is reported as applied ("2 changes applied") | AI ISSUE, INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-006 | Medium | AI › AI column › Stop run | Stop in the AI agent does not cancel the in-flight request | AI ISSUE, INCOMPLETE FUNCTIONALITY | PHASE-1 CONFIRMED LIVE (fix parked on br | L5 |
| L5-008 | Medium | AI › Generate a block › context | Generate a block sends the elements of every page, not the active page | AI ISSUE | PHASE-1 CONFIRMED LIVE (fix parked on br | L5 |
| L5-009 | Medium | AI › Generate a block › result states | Generate a block shows a "no applicable change" answer as "The AI service didn't respond / Your request timed out" | AI ISSUE, MISSING FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L5 |
| L5-010 | Medium | AI › page-scope context (Generate a block, agent plan) | AI receives zero design tokens on a site that uses the default token set | AI ISSUE, INTEGRATION ISSUE | LIVE-VERIFIED (payload) + CODE | L5 |
| L5-011 | Medium | AI › Generate a block › idle copy | Generate a block says "You review the draft before it lands on the page" but inserts immediately | CODE ONLY ISSUE, AI ISSUE | LIVE-VERIFIED | L5 |
| L5-016 | Medium | AI › context menu, toolbar, inspector | There are no one-click content AI actions (rewrite, shorten, tone, fix grammar) on an element | MISSING FUNCTIONALITY, AI ISSUE | LIVE-VERIFIED (absence) | L5 |
| L5-017 | Medium | AI › Page settings › SEO › Meta title "Write with AI" | SEO "Write with AI" produces an irrelevant title from almost no context | AI ISSUE | LIVE-VERIFIED | L5 |
| L5-019 | Medium | AI › Brand › Component styles | Brand "✦ Generate with AI" is disabled everywhere, its tooltip blames the workspace, and the result has nowhere to go even when the flag is on | AI ISSUE, INCOMPLETE FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L5 |
| L5-021 | Medium | AI / History › AI summary | The History AI summary is wrong and unreadable because it is fed raw element ids | AI ISSUE | LIVE-VERIFIED | L5 |
| L5-025 | Medium | AI › Assets › alt text | Alt-text generation spends no AI quota and runs automatically on every image upload | AI ISSUE, INTEGRATION ISSUE | UNVERIFIED (no assets; avoided a product | L5 |
| L5-031 | Medium | Review & Comments | Comments have no replies or threads | MISSING FUNCTIONALITY | LIVE-VERIFIED + CODE | L5 |
| L5-034 | Medium | Review panel header | Review status copy contradicts itself for an internal (no-client) round | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-040 | Medium | History › Saves › row menu › Compare with current | "Compare with current" does not compare with the current draft | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-042 | Medium | History › Compare (Semantic) and Session entry expand | The semantic diff and Session history expose raw internals (element ids, "other · element", "updatedAt") | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-043 | Medium | History › Restore to draft | After "Restore to draft", a deleted element stays selected and editable in the Inspector | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-044 | Medium | History › Restore to draft | Restore wipes the whole undo stack; its only undo is a toast that expires | INCOMPLETE FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L5 |
| L5-050 | Medium | Preview (all breakpoints) | Preview does not match the canvas: wrong text colour, and Inter is not loaded | INTEGRATION ISSUE, BROKEN FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-051 | Medium | Preview | Clicking an internal link in Preview blanks the preview, and there is no page switcher | BROKEN FUNCTIONALITY, MISSING FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-060 | Medium | Publish › topbar button and lifecycle gate | Publish stays enabled after a save failed, so it can deploy content the server never stored | INTEGRATION ISSUE | LIVE-VERIFIED (gate state); CODE (deploy | L5 |
| L5-071 | Medium | Save › offline state | The dashboard offline banner promises "Auto-retrying in Ns" inside the editor, but retries nothing | INTEGRATION ISSUE | LIVE-VERIFIED | L5 |
| L5-076 | Medium | Save › recovery marker | The "Some work never reached the server" toast never expires, outlives success, and leaks into other tabs | BROKEN FUNCTIONALITY | LIVE-VERIFIED | L5 |
| FG-003 | Medium | Review / topbar Publish / gating | Review v2 "not-sent" dims Publish regardless of approval policy | FIGMA ONLY ISSUE, MISSING FUNCTIONALITY | LIVE-VERIFIED | FG |
| FG-004 | Medium | Review / panel states | Review v2 states with no code state | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-006 | Medium | Review / dashboard `/review/<token>` / client feedback | Client viewer cannot place located pins (owner decision C-03) | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-010 | Medium | SEO / page drawer → canvas | SEO "Fix" hand-off to the element (with dirty guard) missing | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-012 | Medium | Pages / Page settings | Page settings container and save verbs differ from the board | CODE ONLY ISSUE | LIVE-VERIFIED | FG |
| FG-013 | Medium | Settings, SEO, CMS / prototype | 51 of 84 new Settings/SEO boards are unreachable; new Settings states cannot navigate | FIGMA ONLY ISSUE | LIVE-VERIFIED (Figma read; caveat on laz | FG |
| FG-014 | Medium | Brand / Part 1 flows | Brand Part 1 error and edge branches are unreachable | FIGMA ONLY ISSUE | LIVE-VERIFIED (Figma read) | FG |
| FG-015a | Medium | Brand / Add panel + published site | Theme-toggle block not built | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-015b | Medium | Brand / generators | Brand from logo or website not built | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-015d | Medium | Brand / Restore points | Restore points have server support but no UI | CODE ONLY ISSUE, INCOMPLETE FUNCTIONALITY | CODE-ONLY | FG |
| FG-015e | Medium | Brand / binding | Connect to tokens not built | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-015f | Medium | Brand / Colour mode | Dark mode controls (off / auto / generated aliases / preview-disabled) partial | CODE ONLY ISSUE, INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED (partial) + CODE-ONLY | FG |
| FG-015g | Medium | Brand / token delete | Safe delete states partial | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-019 | Medium | Brand / Colours | Brand Colours "unsaved change (dirty)" board contradicts autosave and Part 1 "Header without Save" | FIGMA ONLY ISSUE | LIVE-VERIFIED | FG |
| FG-020 | Medium | Inspector / tab strip | ~500 shells label the inspector's middle tab "Settings"; Inspector v4 and code say "Behaviour" | FIGMA ONLY ISSUE | LIVE-VERIFIED (Figma read) | FG |
| FG-021 | Medium | Inspector / Behaviour / visibility | Inspector "Visibility condition" (CMS-conditional visibility) has no code | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-023 | Medium | AI / assistant → canvas | AI "Applied draft · Canvas" state missing | CODE ONLY ISSUE, AI ISSUE, MISSING FUNCTIONALITY | CODE-ONLY (no live AI call made, by budg | FG |
| FG-026 | Medium | Accessibility / Preview + Issues | No accessibility checker in either Figma or code as a coherent module | FIGMA + CODE ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-029 | Medium | Responsive / breakpoint menu | Wide breakpoint drawn in Figma, absent from the code's breakpoint menu | FIGMA + CODE ISSUE | CODE-ONLY | FG |
| FG-031 | Medium | Forms / submissions | Forms submissions have two homes in Figma; code has one | FIGMA ONLY ISSUE | LIVE-VERIFIED (nav) | FG |
| FG-032b | Medium | Forms / element + published form | Form build / submit failure states are missing in both | FIGMA + CODE ISSUE, MISSING FUNCTIONALITY | UNVERIFIED (no submission made) | FG |
| FG-034 | Medium | Domains / DNS | Domain DNS management ships with no boards (DNS-M1…M12 paused) | FIGMA ONLY ISSUE | CODE-ONLY | FG |
| FG-036 | Medium | Onboarding / tips | Onboarding (checklist, achievement prompt, rail coach) ships with no boards | FIGMA ONLY ISSUE | LIVE-VERIFIED (menu row) + CODE-ONLY | FG |
| DQ-001 | Medium | Publish › Publish confirm facts (topbar fast path + wizard | Pre-publish confirm treats a failed checks request as "no blockers" | CODE ONLY ISSUE | BROKEN FUNCTIONALITY | INTEGRATION ISSUE | CODE-ONLY (forcing a tRPC failure live n | DQ |
| DQ-002 | Medium | Layers panel › row context menu | Layers right-click Delete / Duplicate / Lock bypass the engine command layer (lock gate + read-only refusal) | CODE ONLY ISSUE | BROKEN FUNCTIONALITY | CODE-ONLY (destructive; my session was r | DQ |
| DQ-005 | Medium | Engine → shell error surfacing | Engine failure events are emitted with no listener — save/load/command errors are silent in the UI (Phase-1 re-verified) | CODE ONLY ISSUE | MISSING FUNCTIONALITY | INTEGRATION ISSUE | CODE-ONLY (PHASE-1, re-verified on main) | DQ |
| DQ-006 | Medium | Whole package | 919 `../../` relative imports despite the CLAUDE.md ban — no gate enforces it | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-007 | Medium | Engine + chrome | 26 source files over 800 lines mixing concerns | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-010 | Medium | Brand › lint Auto-fix vs colour token "Fix all" | Two contrast auto-fix algorithms that disagree | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-011 | Medium | History › Time travel › Restore | Time-travel Restore silently proceeds when the safety checkpoint fails | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-018 | Medium | Site menu, panel ⋯ menu, canvas right-click menu, ⌘K pal | Menus: four different row specs and three hand-rolled context menus | CODE ONLY ISSUE | LIVE-VERIFIED | DQ |
| DQ-020 | Medium | All panels | Control-height and input-height spread across panels | CODE ONLY ISSUE | LIVE-VERIFIED | DQ |
| L1-009 | Low | History / load | A brand-new site opens with a phantom "Updated page" undo step and an automatic save | BROKEN FUNCTIONALITY | LIVE-VERIFIED (root cause CODE-ONLY) | L1 |
| L1-017 | Low | Add panel → Image | Inserting an Image switches the left panel to Assets, with no pick mode | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-018 | Low | Canvas context menu | Context menu: Copy/Cut/Paste are buried under "Structure"; Paste is enabled with an empty clipboard; disabled rows give no reason | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-020 | Low | Keyboard shortcuts | ⌘G and ⌘⇧G on a single element are silent no-ops; Cut and Group give no feedback | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-021 | Low | Footer selection readout | The footer readout calls the page root "Container"; the inspector calls it "Home · Page" | CODE ONLY ISSUE | LIVE-VERIFIED | L1 |
| L1-023 | Low | Add panel search | Add search: no synonyms; the ⌘F hint only works once focus is already in the panel | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-024 | Low | Components panel vs Add panel | The Components panel (⇧A) says "No components yet" while Add › Saved components lists 23 | INTEGRATION ISSUE | LIVE-VERIFIED | L1 |
| L1-026 | Low | Dashboard sites → card ⋯ → Delete | The Delete site dialog says "cannot be undone"; the toast then says it can be restored for 30 days | CODE ONLY ISSUE | LIVE-VERIFIED | L1 |
| L1-027 | Low | Rail full-page modes (CMS) | The CMS full-page workspace persists across reload, covers the canvas, and Escape doesn't leave it | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-028 | Low | Shell load | A "Project loaded · Loaded from dashboard." toast on every open | CODE ONLY ISSUE | LIVE-VERIFIED | L1 |
| L1-029 | Low | Onboarding tips | Onboarding tips and coach marks pop over the canvas repeatedly | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-030 | Low | Canvas hooks | Dead code: `useToolbarPosition` | CODE ONLY ISSUE | CODE-ONLY | L1 |
| L1-031 | Low | Add → Blocks → Hero | The Hero block ships "Welcome to Buildrick" product copy and an unstyled "Get Started" link | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-032 | Low | History panel | The History empty state says "Use Ctrl+Z" on macOS | CODE ONLY ISSUE | LIVE-VERIFIED | L1 |
| L1-033 | Low | ⌘K palette | Command palette gaps: no "Add heading", fuzzy false hits, inconsistent zoom rows | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-034 | Low | Site menu → Issues; pre-publish | A brand-new site opens with 11 Issues, 8 of them about default Brand tokens | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-036 | Low | Comments toggle | A click into the page while in comment mode also selects the element under it | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-037 | Low | Add → click-insert with a Section selected | Click-insert into a Section lands next to its inner Container, not inside it | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L1-038 | Low | Keyboard nudge | Keyboard move feedback is inconsistent: ⇧+Arrow explains, ⌘+Arrow is silent | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L1 |
| L2-016 | Low | Canvas/Layers keyboard Delete on an instance child | Deleting an instance child says "Locked elements were skipped" | CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L2-019 | Low | Inspector · every typed field / slider | Inspector edits reach the canvas about 300 ms late | INCOMPLETE FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L2 |
| L2-024 | Low | Add › Form | The default Form block is unstyled: borderless inputs, Submit as plain text | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L2 |
| L2-026 | Low | Templates · Replace page modal | Replace-page copy contradicts the token behaviour | FIGMA + CODE ISSUE | LIVE-VERIFIED | L2 |
| L2-027 | Low | Inspector › Behaviour › + Add interaction | The interaction trigger picker uses emoji as icons | CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L2-028 | Low | Components · rename (detail screen) | Component rename leaves a stale name on the selected instance's Inspector chip | CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L2-029 | Low | Inspector › Instance actions › Detach instance… | Detach instance gives no feedback toast or Undo | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L2 |
| L2-030 | Low | Inspector › Behaviour › Link › URL | Link URL rejects "example.com" instead of normalising it | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L2 |
| L2-031 | Low | Layers · search with no matches | The Layers no-results state uses the empty-page heading | FIGMA + CODE ISSUE | LIVE-VERIFIED | L2 |
| L2-032 | Low | Layers · row context menu | The Layers context-action hook has handlers for rows the menu never shows | CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L2-034 | Low | Inspector · page panel header ⋯ and footer link | The page Inspector ⋯ menu has one item, and "SEO & social" shows an external-link icon but opens in-editor | FIGMA + CODE ISSUE | LIVE-VERIFIED | L2 |
| L2-035 | Low | Canvas selection toolbar hints ("Duplicate ⌘D · Delete � | Toolbar hint labels render under the toolbar on top of canvas content | CODE ONLY ISSUE | LIVE-VERIFIED | L2 |
| L2-036 | Low | Templates catalogue | Template catalogue: no search or filter despite the component's own comment | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L2 |
| L2-037 | Low | Inspector ✦ AI › "Make it more concise" | ✦ AI chip: "The AI service didn’t respond" while `ai.streamPrompt` returned 200; adoption still logged | AI ISSUE | LIVE-VERIFIED (UI and network); cause UN | L2 |
| L3-009 | Low | Pages panel row status | Page rows tell screen readers "Live" on a site that has never been published; "Unpublished" means unsaved | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-010 | Low | Page settings · SEO tab | Page settings preview shows `/about.html` while the slug field shows `/about`, both on a placeholder "yoursite.com" | FIGMA + CODE ISSUE | LIVE-VERIFIED | L3 |
| L3-011 | Low | Page settings | Page indexing is set in two places (SEO "Search indexing" and Advanced "Allow indexing") | FIGMA + CODE ISSUE | LIVE-VERIFIED | L3 |
| L3-012 | Low | Pages panel / inspector Page panel | Small Pages rough edges: New folder skips the naming step; the inspector link icon misleads; cryptic note | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-014 | Low | Dashboard create-site → editor | "Start from Scratch" lands on the dashboard overview, not the editor | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-020 | Low | CMS records | Deleting a record has no guard (Figma requires typed DELETE), and the Records table has no status column or row actions | FIGMA + CODE ISSUE | LIVE-VERIFIED | L3 |
| L3-021 | Low | CMS record sheet · CONFLICT | The CMS conflict banner hides what "theirs" contains | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L3 |
| L3-022 | Low | `cms.entries.upsert` | The CMS server accepts blind writes; the conflict check is opt-in | CODE ONLY ISSUE · INTEGRATION ISSUE | LIVE-VERIFIED | L3 |
| L3-023 | Low | CMS UI | Small CMS rough edges: field picker, wizard stepper, empty workspace, tab label | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-030 | Low | Form inspector | The form's Behaviour tab fetches `forms.getBlock` twice per open, and forms can't be named | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-033 | Low | Settings › Domains › Add a domain | The Add-a-domain dialog shows hard-coded registrar nameservers as facts | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-034 | Low | Settings › Overview "Needs attention" | Settings Overview flags a workspace webhook failure from 28 Sep on a site created today | CODE ONLY ISSUE | LIVE-VERIFIED | L3 |
| L3-035 | Low | Settings › SEO (also Languages, Access loaders) | Settings panes blame "your connection" for server-side load failures | CODE ONLY ISSUE | LIVE-VERIFIED (symptom) / UNVERIFIED (ca | L3 |
| L4-008 | Low | Assets drawer failed-upload band | An unsupported-type upload failure offers "Retry" | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L4 |
| L4-009 | Low | Toast host (raised by Media and Stock) | Error toasts never auto-dismiss and pile up across panels | INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L4 |
| L4-011 | Low | tile ⋯ vs detail-panel ⋯ | Two different action menus for the same asset, with inconsistent labels | FIGMA + CODE ISSUE | LIVE-VERIFIED | L4 |
| L4-012 | Low | Asset library toolbar; drawer select mode | Library layout nits: columns dropdown visible in List view; cramped select-mode footer | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-013 | Low | Asset library delete | The delete confirm says "Delete permanently", then the toast offers Undo | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-015 | Low | Engine recovery (observed while opening the full-page librar | A benign "ResizeObserver loop" warning is recorded as a runtime fault (crash sentinel) | CODE ONLY ISSUE | LIVE-VERIFIED (log) / UNVERIFIED (banner | L4 |
| L4-017 | Low | Asset library footer | The storage footer rounds about 1 KB up to "1 MB" | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-027 | Low | Brand rename dialog / Review changes | Rename changes only the ID; two tokens share the display name and Review labels are ambiguous | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-029 | Low | Brand → Colours banner; Colour mode preview | Brand copy and layout nits | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-032 | Low | Brand → Colours table keyboard navigation | Every Brand token row is its own Tab stop | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-039 | Low | Issues rows | Issue copy is developer-facing | CODE ONLY ISSUE | LIVE-VERIFIED | L4 |
| L4-042 | Low | Issues panel zero state; content scanner | Issues empty-state copy and hidden-page scanning | CODE ONLY ISSUE | CODE-ONLY | L4 |
| L5-012 | Low | AI › AI column › error card | "Your prompt is still here" is false after a failed suggestion-chip run | CODE ONLY ISSUE, AI ISSUE | LIVE-VERIFIED | L5 |
| L5-013 | Low | AI › step approval card | The AI review card never shows the "from" value | AI ISSUE | PHASE-1 CONFIRMED LIVE | L5 |
| L5-014 | Low | AI › entry points | Five AI doors all land on the same empty prompt; none carries an intent | AI ISSUE, INCOMPLETE FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-015 | Low | AI › canvas selection toolbar | The selection toolbar has no direct AI action | FIGMA + CODE ISSUE | LIVE-VERIFIED | L5 |
| L5-018 | Low | AI › SEO Write with AI | SEO AI title is hard-truncated mid-word at 60 characters, and the button disappears (no regenerate) | CODE ONLY ISSUE, AI ISSUE | LIVE-VERIFIED (truncation, button hidden | L5 |
| L5-020 | Low | AI / History › Saves › Compare › Get AI Summary | History "Get AI Summary" is offered with no data, and a click burns the 60-second cooldown | AI ISSUE, MISSING FUNCTIONALITY | PHASE-1 CONFIRMED LIVE | L5 |
| L5-022 | Low | History › Session | Every AI edit in Session history has the same generic label, "Ai Edit" | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-023 | Low | AI › client transport | Three AI transports with three error, retry and cache behaviours (duplicate AI plumbing) | CODE ONLY ISSUE | CODE-ONLY (behaviour difference LIVE) | L5 |
| L5-024 | Low | AI › AI column mount | `ai.quota` is fetched twice per AI open (duplicate request in one batch) | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-026 | Low | AI × Issues | "Missing alt" in Issues has no AI fix, although a vision alt-text service exists | MISSING FUNCTIONALITY, AI ISSUE | CODE-ONLY | L5 |
| L5-027 | Low | AI × Review | Review comments cannot be handed to AI ("Apply this comment") | MISSING FUNCTIONALITY, AI ISSUE | LIVE-VERIFIED (absence) | L5 |
| L5-032 | Low | Review & Comments › New comment | There are no @mentions in comments | MISSING FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-033 | Low | Review & Comments | Comments cannot be edited or deleted | MISSING FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-035 | Low | Review panel comment row | The comment author is rendered twice ("You · you") | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-041 | Low | History › Saves | The compare panel goes stale after a new version is saved | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-045 | Low | History › Saves list | Version rows and the "N changes" link are not clickable; everything is in a hover-only "…" menu | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-061 | Low | Publish | The topbar Publish click opens the confirm dialog on top of the checks panel in one step | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-072 | Low | Save › failure UI | One save failure raises three to four simultaneous surfaces, and the banner covers canvas content | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-073 | Low | Save | The "Save failed" toast stays on screen after a successful retry | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-077 | Low | Save › two-tab conflict | "Reload latest" in the conflict dialog triggers the browser's native "Leave site?" prompt | CODE ONLY ISSUE | LIVE-VERIFIED | L5 |
| L5-078 | Low | Save › multi-tab | No warning when the same site is open in another tab; a conflict is discovered only on save | MISSING FUNCTIONALITY | LIVE-VERIFIED | L5 |
| L5-079 | Low | Save › offline | The editor crashed once to "This page couldn't load" after offline → edit → online (not reproduced) | BROKEN FUNCTIONALITY | UNVERIFIED (one occurrence; likely harne | L5 |
| FG-008 | Low | Pages / page row / SEO health indicator | Pages panel SEO dot missing | CODE ONLY ISSUE, MISSING FUNCTIONALITY | LIVE-VERIFIED | FG |
| FG-011 | Low | SEO (page) / Social tab | Social tab: no explicit linked vs independent X switch | CODE ONLY ISSUE, INCOMPLETE FUNCTIONALITY | CODE-ONLY | FG |
| FG-015c | Low | Brand / Colours | Colour scale generator not built | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-015h | Low | Brand / theme push | Theme push results not built | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-015i | Low | Brand / header + token detail | Review-changes empty state and token-usage "unknown" missing | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-016 | Low | Brand / AI | Brand AI shared-style proposal boards have no code | CODE ONLY ISSUE, AI ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-017 | Low | Brand / Brand checks | A brand-new site opens Brand with 8 Brand-check warnings from its own default tokens | CODE ONLY ISSUE | LIVE-VERIFIED | FG |
| FG-018 | Low | Brand / Radius, Shadow, Motion, … Imagery | Brand token-kind pages: Figma draws 11 loose boards, code hides them behind a disclosure with a stale comment | FIGMA + CODE ISSUE | LIVE-VERIFIED (nav) + Figma read | FG |
| FG-022 | Low | Inspector / Effects | Effects "MORE EFFECTS" expander vs code's flat section split | CODE ONLY ISSUE | CODE-ONLY | FG |
| FG-024 | Low | AI / unavailable state | "Connect AI provider" boards contradict the shipped owner-managed AI model | FIGMA ONLY ISSUE, AI ISSUE | CODE-ONLY | FG |
| FG-025 | Low | AI / inspector | "AI pending · Hero Inspector" board superseded by Inspector v4 "AI column" | FIGMA ONLY ISSUE | CODE-ONLY | FG |
| FG-027 | Low | Issues / empty state | Issues empty state says "No brand issues." while the panel also carries content issues | CODE ONLY ISSUE | CODE-ONLY | FG |
| FG-028 | Low | Issues / fix success | Issue-resolved toast missing | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-030 | Low | Preview | Preview has fixed device widths; no custom width | FIGMA + CODE ISSUE | CODE-ONLY | FG |
| FG-032 | Low | Settings / Advanced | Settings › Security headers has no board | FIGMA ONLY ISSUE | LIVE-VERIFIED | FG |
| FG-033 | Low | History | History still draws a Backups tab after the owner folded it into Saves | FIGMA ONLY ISSUE | CODE-ONLY | FG |
| FG-035 | Low | Notifications | Notifications board is "all sites"; code and the owner decision are this-site | FIGMA ONLY ISSUE | CODE-ONLY | FG |
| FG-037 | Low | Commerce | Commerce is incomplete in both | FIGMA + CODE ISSUE, INCOMPLETE FUNCTIONALITY | CODE-ONLY | FG |
| FG-038 | Low | Templates | Template replace confirm: code adds backup option the board lacks | FIGMA ONLY ISSUE | CODE-ONLY | FG |
| FG-040 | Low | Canvas / footer toolbar | Review v2 boards draw the floating canvas footer the 10-04 change docked | FIGMA ONLY ISSUE | LIVE-VERIFIED | FG |
| FG-041 | Low | Add | Add panel has no loading / error rows | CODE ONLY ISSUE, MISSING FUNCTIONALITY | CODE-ONLY | FG |
| FG-042 | Low | Drag & Drop | Drag & drop: the invalid-drop state ships with no board | FIGMA ONLY ISSUE | CODE-ONLY | FG |
| FG-043 | Low | CMS / field config | CMS Date field has no type-specific configuration; code comment says "no boards" | CODE ONLY ISSUE | CODE-ONLY | FG |
| FG-044 | Low | Onboarding / dashboard create flow → editor | Create site "Start from Scratch" lands on the dashboard site page, not the editor | INTEGRATION ISSUE | LIVE-VERIFIED | FG |
| FG-045 | Low | Sites (dashboard) / row ⋯ › Delete / delete confirm | Dashboard "Delete Site" says "cannot be undone", but delete is a 30-day restorable soft delete | CODE ONLY ISSUE, INTEGRATION ISSUE | LIVE-VERIFIED | FG |
| DQ-003 | Low | Shell event wiring | Dead event subscriptions — "Show in Layers", Layers toggle, zoom-to-selection, templates toggle (Phase-1 re-verified on main) | CODE ONLY ISSUE | INCOMPLETE FUNCTIONALITY | CODE-ONLY (PHASE-1 finding, re-verified  | DQ |
| DQ-004 | Low | Tooling › `scripts/conformance/seam-scan.mjs` | seam-scan reports false orphans and its growth is not enforced | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-008 | Low | Engine › Composer | Six Composer managers constructed and never used (Phase-1 re-verified) | CODE ONLY ISSUE | CODE-ONLY (PHASE-1, still present) | DQ |
| DQ-009 | Low | Engine › integrations / forms | Email-marketing integration is a DEAD/SIMULATED stub still wired into Composer and FormHandler | CODE ONLY ISSUE | INCOMPLETE FUNCTIONALITY | CODE-ONLY | DQ |
| DQ-012 | Low | Cross-cutting | Swallowed promise rejections (25) — notable ones mask state | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-013 | Low | Shell / Pages / Page tab bar / Zoom | Same engine state mirrored in several React states with different subscriptions | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-014 | Low | Shell | Discarded props / dead prop API on the shell | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-015 | Low | Inspector › Spacing box model | Inspector spacing box: labels "Margin"/"Padding" render in Geist Mono (data face) — values are correct | CODE ONLY ISSUE (possibly FIGMA + CODE — board not checked) | LIVE-VERIFIED | DQ |
| DQ-016 | Low | Add panel › Elements › Heading row icon | Add panel "Heading" icon renders in Times (serif) at weight 700 | CODE ONLY ISSUE | LIVE-VERIFIED | DQ |
| DQ-017 | Low | Add panel, Layers, History, Pages, Topbar | Two element-icon systems + 62 hand-rolled inline SVGs; icon sizes on 12 different values | CODE ONLY ISSUE | LIVE-VERIFIED (sizes) + CODE-ONLY (sourc | DQ |
| DQ-019 | Low | AI plan, Page settings drawer, Media replace-across, Asset d | Hand-rolled dialogs and drawers outside chrome-ui overlay primitives | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-021 | Low | Brand empty state, publish/unpublish modals, page bulk bar,  | Weight 700 reaches chrome through `<strong>`/`<b>` and CSS `bold` (the gate is blind to it) | CODE ONLY ISSUE | LIVE-VERIFIED | DQ |
| DQ-022 | Low | Canvas › inline text edit outline; locked-element outline | Indigo `#667eea` / `rgba(102,126,234,…)` and a pink lock outline in canvas chrome CSS | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-023 | Low | Pages status chips, Export code preview, Device frame previe | Off-token hex and near-black surfaces in chrome components | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-024 | Low | Slider, inspector PropertyField, Library manager, LeftSideba | 10 references to undefined `--bk-*` tokens that render via hard-coded fallbacks | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-025 | Low | Tokens / canvas overlays / DS modals | Mono font stack: named fallbacks, two definitions, and raw `monospace` in canvas overlays | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-026 | Low | Add panel › FirstUseTip ("💡 Tip 1/4") | Emoji as a design element in the first-use tip | FIGMA + CODE ISSUE | LIVE-VERIFIED | DQ |
| DQ-027 | Low | Left panels, CMS, Brand, Inspector | Panel header heights and patterns vary across surfaces | CODE ONLY ISSUE | LIVE-VERIFIED | DQ |
| DQ-028 | Low | Inspector heading-level segmented control, colour swatches,  | Off-scale radii in chrome (2/3/5/12px) | CODE ONLY ISSUE | LIVE-VERIFIED | DQ |
| DQ-029 | Low | Assets / Media tab | Duplicate `showToast` pass-through wrappers in Media | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-030 | Low | Docs-in-code | Stale headers: StockService "stub" comment and CLAUDE.md's "closed 2-wrapper set" | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-031 | Low | shared/utils, CSS | ssot-scan residuals: pass-through predicates, duplicate selector, unannotated legacy rules, dead test utils | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-032 | Low | Canvas drag, overlays, AI client, activity list | Residual `any` / `@ts-ignore` in drag and AI paths | CODE ONLY ISSUE | CODE-ONLY | DQ |
| DQ-033 | Low | Chrome | Inline style objects still widespread (345 literal + 109 hoisted) | CODE ONLY ISSUE | CODE-ONLY | DQ |
| 4a. |  |  | Boards with no code (designed, not built) |  |  | FG |
| 4b. |  |  | Code features with no board |  |  | FG |
| 4c. |  |  | Boards that are incomplete or logically wrong |  |  | FG |
| 4d. |  |  | Screens / states missing in both |  |  | FG |
| FG-005 |  |  | (withdrawn: the v2 "email failed → keep round + Copy link" rule is already met by `shell/modals/ReviewSentModal.tsx:61-100`) |  |  | FG |
| FG-039 |  |  | (not filed: page-tab "+" opens the Pages panel in both code and the base shell's prototype (`4418:92256`); consistent) |  |  | FG |
