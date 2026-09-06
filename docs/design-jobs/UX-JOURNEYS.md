# UX Journeys

Five end-to-end journeys, walked step by step. Each step names the screen, what
the user does, what they see, and where it breaks.

Evidence: the 285 findings in `findings/UX-A.jsonl` … `UX-I.jsonl`, cross-read
against `MODULE-INTERACTION-MAP.md` (data-flow chains) and `AI-PLACEMENT-MAP.md`.
Chain-level detail for every row here is in `UX-FLOW-MAP.md`.

**Read the FIRST-STOP line and nothing else, if you read nothing else.** Everything
after it in a journey is a description of work the user has already been prevented
from doing.

| # | Journey | Steps | Broken | First stop |
|---|---|---|---|---|
| 1 | Create site → insert → configure → preview → publish | 11 | 9 | **Step 3** — the Insert panel cannot do what the onboarding step tells the user to do |
| 2 | Collection → fields → content → dynamic page → bind → preview → SEO → publish | 12 | 12 | **Step 2** — the wizard cannot create the field its own default URL pattern needs |
| 3 | Send for review → comments → compare → resolve → re-send → approve | 8 | 7 | **Step 1** — the first send has one door, and it is a row in an overflow menu |
| 4 | Edit a published site → change something → republish | 8 | 7 | **Step 3** — the two publish surfaces give opposite answers about whether anything is waiting |
| 5 | Recover from a mistake (undo → history → restore) | 8 | 8 | **Step 1** — undo is silently switched off by ordinary actions, and only the refusal says so |

Vocabulary, used strictly:

- **BROKEN** — the step runs and does the wrong thing, or reports a result it did not produce.
- **MISSING** — the step does nothing, or the control does not exist.
- **UNDISCOVERABLE** — the step works and has no door.
- **WORKS** — verified working in the code the lanes read.

---

## Journey 1 — Create a site, insert elements, configure, preview, publish

> ### FIRST STOP: step 3.
> A first-time user is told by the product's own onboarding checklist to "drop a
> ready-made section — hero, features, footer — onto the canvas". In the panel
> that opens: **hero and features are not element rows at all**, they exist only
> inside BLOCKS, which is collapsed by default and sits below 53 rows; **BLOCKS
> cards cannot be dragged**; and the 50 cards in it are **blank grey rectangles**
> because no block defines a preview image. The instructed action is impossible.
> `UX-A-07`, `UX-A-05`, `UX-A-06` · `onboardingSteps.ts:57-65`,
> `GroupSection.tsx:234-262`, `BuildTab.tsx:49-51`
>
> One step later comes the harder one: **step 4, a drag from Insert can place
> nothing and report success** (`UX-A-01`). The click path works. So the product's
> first lesson is that the affordance it recommends is the one that fails.

**11 steps · 9 broken · 2 work.**

| # | Screen | User does | User sees | Verdict |
|---|---|---|---|---|
| 1 | Dashboard → new site | Creates a site (blank, or the AI draft path) | A site opens in the editor | **WORKS** — but the AI path has two wizards asking different questions and feeding one job, so a second site gets a poorer brief with no explanation (`UX-G-18`), and the brief is never handed to the editor (`UX-G-22`) |
| 2 | Canvas · empty state | Presses "Start blank" | The buttons disappear; the copy becomes "Drop an element from the Insert panel" | **BROKEN** — the flag is permanent for the session; close the drawer (a second click on the active rail icon) and the canvas instructs the user to use a panel that is not on screen, with no way back to the template choice · `UX-F-33` |
| 3 | Insert panel | Follows "Insert a section" | 53 text rows; BLOCKS collapsed below them; opening it shows 50 blank grey cards, none draggable | **BROKEN — FIRST STOP** · `UX-A-07`, `UX-A-05`, `UX-A-06` |
| 4 | Canvas (drag from Insert) | Drags an element row onto the page | Nothing lands. No toast, no error | **BROKEN** — `handleBlockDrop` re-reads the DataTransfer past an `await` and gets `""`, returns false, and the dispatcher sets `dropSucceeded = true` regardless · `UX-A-01` · `useDropExecution.ts:302-303` |
| 4b | Canvas (click from Insert) | Clicks the row instead | "Inserted: Heading" | **WORKS** — but on a page longer than the viewport nothing scrolls: the element, its flash and its selection ring are all below the fold (`UX-A-21`), and the drag path that failed at step 4 is silent by design even when it succeeds (`UX-A-20`) |
| 5 | Insert → Media | Clicks "Image" | The panel is replaced by the Media library, filtered | **BROKEN** — if the user cancels rather than picking, nothing routes them back: they are left in Media with an empty media element selected on the canvas · `UX-A-17`. Dragging the same row instead produces a src-less broken image with no hint that an asset is what is missing · `UX-A-18` |
| 6 | Canvas (during a drag) | Hovers a drop target | A green "this will work" indicator | **BROKEN** — the validator asks whether a generic container could nest there, not the thing being dragged; the drop then refuses with "Cannot place X inside Y" · `UX-A-19` |
| 7 | Inspector | Styles the element | Live repaint, one undo step | **WORKS** — for CSS. Not for what a page is made of: a Slider, Tabs, Accordion or Navbar gets three raw HTML attributes and no component editor (`UX-D-08`); a form gets Action URL / Method / Encoding and no email, webhook, success message or redirect (`UX-D-09`, `MOD-D-01`); and there is no search, no expand-all and no reset in a 16-section column (`UX-D-10`, `UX-D-11`, `UX-D-25`) |
| 8 | Layers → Inspector | Selects a locked element from the tree | Every control is enabled | **BROKEN** — the canvas refuses locked elements and says "Unlock it in the Layers panel"; Layers has no such check, and the panel it names may be drawing an open padlock because lock lives in `localStorage` and in the element model and they never reconcile · `UX-D-02`, `UX-H-15`, `UX-H-14` |
| 9 | Preview overlay | Presses Preview to check the site | One page, in an iframe with `sandbox=""`, after a sanitizer stripped every script and form | **BROKEN** — no navigation, no forms, no interactions, no page switcher; and any element with a background image loses its entire style attribute, so the hero renders unstyled · `UX-E-17`, `UX-F-09`, `UX-E-18` |
| 10 | Publish panel / topbar | Checks whether the site is ready | The topbar says "Publish changes"; the panel says "Nothing has changed since the last deploy" | **BROKEN** — three different answers to "is anything waiting" (undo stack, save clock, server flags) computed from three different sources, on screen at once · `UX-E-02` |
| 11 | Confirm publish → deploy | Approves "Pages: 4" and presses Publish now | A progress bar with a bare percentage, then a result | **BROKEN** — the count is the browser's and the server appends CMS pages afterwards (`UX-E-23`); the running step never names itself because the worker writes `active` and the panel looks for `running` (`UX-E-08`); a failure always blames step 0 (`UX-E-07`); there is no cancel (`UX-E-09`); a failed poll strands the panel in "publishing" forever (`UX-E-03`); and a simulated publish is indistinguishable from a real one (`UX-E-24`) |

**What this journey costs the user.** A first-time user is stopped at the third
step by their own onboarding instruction, taught at the fourth that a
drag-and-drop builder's drag can silently do nothing, and — if they get past
both — shown a preview that cannot show them their site and a publish flow that
cannot agree with itself about whether their work is live.

---

## Journey 2 — Collection → fields → content → dynamic page → bind → preview → SEO → publish

> ### FIRST STOP: step 2.
> The create-collection wizard offers five field types — Text, Number, Image,
> Date, Boolean — and **no Slug**, while the same wizard's default URL pattern for
> generated pages is `/{slug}`. The Content panel's own Fields screen offers nine
> types including Slug. So the first screen of the CMS cannot create the field the
> first screen of the CMS depends on. `UX-C-20` ·
> `CMSCollectionSetupModal.tsx:47,122`, `ContentViews.tsx:437`
>
> The deeper stop is **step 6**: there is **no repeater anywhere in the UI**. Every
> binding is element-to-one-record. The reason to build a CMS — one design serving
> many rows — is the one thing no screen can do, though `bindCollection`,
> `RepeaterRenderer` and a `collectionPicker` control all exist in the engine with
> no UI caller. `UX-C-06`, `MOD-A-01`, `MOD-A-02`

**12 steps · 12 broken or missing · 0 a user can complete and verify.**

| # | Screen | User does | User sees | Verdict |
|---|---|---|---|---|
| 1 | Content panel → Create collection | Picks a Content type: Articles / Products / Team / Custom | Step 2 of the wizard | **BROKEN** — `contentType` appears nowhere in `handleCreate`: the answer is discarded, no preset fields, no icon, no behaviour · `UX-C-22` |
| 2 | Create collection wizard · fields | Adds fields | Five types, no required flag, a drag handle that does not drag | **BROKEN — FIRST STOP** — no Slug type here; the handle has a grab cursor and no drag handlers; a zero-field, duplicate-named collection can be created · `UX-C-20`, `UX-C-11`, `UX-C-22` |
| 3 | Content panel · Fields | Notices a typo in a field name | A `⋯` menu whose only item is "Delete field" | **MISSING** — no rename, no type change, no required toggle, no reorder; `updateField` and `reorderFields` exist with no UI caller. The only fix destroys that field's value on every record · `UX-C-11` |
| 4 | Content panel · record (new) | Adds the first record with Published on and a required field empty | Field errors; the form stays open | **BROKEN** — the path creates the draft first and validates only on the status flip, so every retry leaves a hidden duplicate draft. Three fumbles = three drafts and one record · `UX-C-08` |
| 4b | Records modal (the other editor) | Adds a record via ⌘⇧P instead | A table, required-field asterisks, real date/select widgets, per-row publish, **delete with no confirmation** | **DUPLICATE** — two record editors, neither a superset; the same destructive act asks in one door and not in the other · `UX-C-07`, `MOD-A-21` |
| 5 | Record · Image field | Puts a photo on a product | A plain text box; the table reads "— missing" | **MISSING** — no media picker in either editor, though `openMediaLibrary` exists; and there is no CSV/JSON record import at all, so 40 menu items are 40 hand-typed forms · `UX-C-14`, `UX-C-28` |
| 6 | Content panel · Dynamic pages | Turns on "one page per record" | "No template page is bound, so publishing emits none of these yet" — and the only control on the screen is the URL pattern | **BROKEN** — the template path, SEO title and SEO description can be set once, inside the create wizard, and never again. The screen names the blocker and offers no way to fix it · `UX-C-09` |
| 7 | Inspector · binding popover | Binds an image on the page to the Photo field | The popover offers every field type | **BROKEN** — it always passes the literal `"content"`, so the URL is written as text and the picture never changes; unbinding leaves the record's text in the element permanently, outside undo · `UX-C-13`. And there is no repeater, so one binding serves exactly one record · `UX-C-06` |
| 8 | Content panel · record | Flips a record to Published | The record list updates | **BROKEN** — the engine emits `CMS_CONTENT_PUBLISHED`; the binding re-apply and the canvas preview listen only to created/updated/deleted. The canvas does not change until an unrelated edit or a reload — the moment the feature is meant to pay off is the moment nothing happens · `UX-C-04`, `MOD-A-04` |
| 9 | (next day) Reopen the site | Comes back to the bound page | The element still shows the record's text | **BROKEN** — on a real site the binding is gone: `editorSaveProjectSchema` has no `.passthrough()` so Zod strips `cmsBindings` at the transport boundary, and the loader never re-reads it. The text is frozen, not following. Fixed only in the localStorage demo · `UX-C-01` (half-stale `MOD-A-03`) |
| 10 | Pages panel / Publish panel | Looks for the pages the collection will create | Nothing. No file under `tabs/pages/` mentions collections; the publish surfaces mention no collection, record or generated page | **MISSING** — the promise "Generates N pages from published records" is made in one panel and confirmed by no other screen, right up to the deployed site · `UX-C-19`, `UX-B-25` |
| 11 | Publish | Publishes | "All checks pass", then success | **BROKEN** — the server matches the free-text template path by exact string against exported `<slug>.html` names, so any mismatch (including the shape in the field's own placeholder) skips the collection silently · `UX-E-22`. Draft records ship anyway, because export resolves bindings with no status filter · `UX-C-05` |
| 12 | The published detail pages | Opens one, or shares it | The template's title and the template's social card | **BROKEN** — `generateDynamicPages` clones the template head whole and appends a second `<title>`; browsers take the first. A hundred pages announce themselves as the template, and a blank SEO field ships `<title></title>` · `UX-E-05` |

**What this journey costs the user.** Every one of the twelve steps can be
completed, and the result is a CMS that cannot repeat, cannot survive a reload on
a real site, cannot show its result on the canvas, and publishes either nothing
or a hundred pages wearing the same name.

---

## Journey 3 — Send for review → client comments → compare → resolve → re-send → approve

> ### FIRST STOP: step 1.
> Review is the only module with **no rail seat** — its tab config carries no
> `zone`, so the zone-driven rail leaves it out. Every other door exists only once
> a round already exists: the topbar pill is null in state `none`, the ReviewBar
> returns null with no active round, and the History approval band renders only
> once approved. **The first send has exactly one door: a row in the topbar's
> overflow menu.** `UX-I-17` · `tabsConfig.ts:231-244`, `SiteMenu.tsx:203`,
> `StudioHeader.tsx:136-142`, `ReviewBar.tsx:116`
>
> The most damaging step is **6**: re-sending from the review bar ships a round
> with `token: null`, so the client receives no working link while the button
> reports success and the old link is superseded. `UX-I-18`

**8 steps · 7 broken · 1 works.** (Steps 5b and 5c are facets of step 5, not extra steps.)

| # | Screen | User does | User sees | Verdict |
|---|---|---|---|---|
| 1 | (looking for the door) | Tries to send the site to a client | Nothing on the rail; nothing in the topbar until a round exists | **UNDISCOVERABLE — FIRST STOP** · `UX-I-17` |
| 2 | Review panel → Send for review | Enters a client email and sends | A round is created; a token is minted; the client gets a link | **WORKS** · `ReviewTab.tsx:292-294` |
| 3 | Topbar pill + review bar + review panel | Checks where the review stands | "In review" / "Opened · no reply" · "Sent — waiting on your client" · "<Reviewer> has not commented yet" | **BROKEN** — one state, three names, on three surfaces visible at once; and "Opened · no reply" is derived from a field the status enum has no value for · `UX-I-23` |
| 4 | Review panel · comments | Answers the third comment, which is on another page | One reply box at the bottom | **BROKEN** — the reply posts against `comments[0].pageId`, so it attaches to the wrong page; the helper text says only "Replies are internal notes on the thread" · `UX-I-26`. Stepping the comments with "Next ›" gives no position and no way back · `UX-I-28` |
| 5 | Review › Compare with approved | Compares approved against current | Two full web pages side by side in a 280px drawer — about 130px each | **BROKEN** — and the Compare screen replaces the panel header entirely, so the only control that could widen the panel to 700px is removed from the screen that needs it most · `UX-I-21` |
| 5b | Compare · List mode | Finds "section removed from /pricing" and tries to go to it | Plain `<div>` rows | **MISSING** — nothing is clickable; the user must leave Compare, switch page and find it by eye · `UX-I-27`. Compare also offers no next move at all — no re-send, no publish-anyway, no mark-as-intended, and no conflict state · `UX-I-20` |
| 5c | (arriving from History) | Used History's "Compare with current" to get here | Compare, in the Review module | **BROKEN** — Back lands in the Review comment thread, and the deep link fires once: there is no route back to the version list they started from · `UX-I-29` |
| 6 | Review bar → Re-send | Re-sends the round after fixing things | "Re-sent" | **BROKEN** — the bar calls `onResend()` with no client email, so the shell mints no token: the client gets no working link and the old one is dead. The panel's version of the same button passes `invitedEmail` correctly, and raises a confirm the bar does not · `UX-I-18`, `UX-I-19` |
| 7 | Review panel (as a VIEWER) | A teammate without permission opens the review | Resolve, Reopen, Reattach, Revoke and Re-send all live | **BROKEN** — the role is computed and used in exactly one place; every other control is refused by the server after the click, with no chrome explaining why · `UX-I-22` |
| 8 | Publish gate · stale-approval modal | Publishes after an approval has aged | Page names with "edited / added / removed", capped at six | **DUPLICATE** — the moment the decision is actually made shows the weaker of the product's two diffs and offers no door to the stronger one · `UX-I-24`. And the pre-publish checklist does not include the approval gate at all, so the refusal arrives as a 6-second toast after the wizard has closed · `UX-E-06` |

**What this journey costs the user.** The client-facing module is the one with no
front door, the round history is a list of outcomes nobody can open, and the most
prominent re-send control in the product sends a link that does not work.

---

## Journey 4 — Edit an existing published site, change something, republish

> ### FIRST STOP: step 3.
> On a site that has been published before, opening the Publish panel on a fresh
> load says **"Published to production."** and **disables its own primary button** —
> because `changeCount` counts the in-session undo stack, which `HistoryManager`
> wipes on every `PROJECT_LOADED`. At the same moment the topbar, reading a
> different source, says **"Publish changes"**. A user who edited yesterday, saved,
> and came back today is told their work is live and refused the button that would
> make it so. `UX-E-01`, `UX-E-02` · `PublishTab.tsx:222,698`,
> `usePublishSnapshot.ts:156-166`, `HistoryManager.ts:155-159`
>
> If the change was made in page settings, they were misled earlier — at **step 2**,
> silently. See that row.

**8 steps · 7 broken · 1 works.**

| # | Screen | User does | User sees | Verdict |
|---|---|---|---|---|
| 1 | Editor opens on the live site | Opens the site to make one edit | The page, the Pages list | **WORKS** — unless the project load failed, in which case the shell invents a page called "Home" and the panel says "This site has one page. + Add page" over a ten-page site · `UX-B-27` |
| 2 | Pages → page settings | Fixes a typo in a meta description | The field updates; it autosaves | **BROKEN** — the drawer reads any non-hidden page as "live" and every save writes that back, so editing one unrelated field **publishes the page**; the save also replaces the whole SEO object, deleting canonical URL, JSON-LD and Twitter fields that no screen can show; and the Title field was silently frozen from the page name on first save · `UX-B-03`, `UX-B-23`, `UX-B-22` |
| 2b | Pages panel | Renames "Page 3" to "Pricing" instead | The row updates | **BROKEN** — the URL stays `/page-3`, and the SEO panel then penalises the page for a numbered placeholder slug its own rename refused to update. The rename popover under the canvas even displays `/pricing` and writes only the name · `UX-B-08`, `UX-B-09` |
| 3 | Publish panel + topbar | Checks what is waiting to ship | "Published to production" + a disabled button, beside "Publish changes" | **BROKEN — FIRST STOP** · `UX-E-01`, `UX-E-02`. The disabled button prints a reason for two of its three cases and nothing for this one · `UX-E-27` |
| 4 | Topbar → Confirm publish | Publishes from the topbar instead (the only route left) | Four facts and a Publish now | **BROKEN** if a check is blocking: the modal prints the first failing check as red text, disables the button, and offers no Connect Vercel and no Fix — while the panel's wizard, for the same job, offers both · `UX-E-12` |
| 5 | Publish wizard · "Fix ›" | Acts on a failing check | Settings' default screen | **BROKEN** — three of five fix targets map to the tab id `settings` and the event carries no sub-screen, so all three land on a 14-row nav; the same click closed the wizard, and there is no re-check · `UX-E-11` |
| 6 | Deploy | Waits | A percentage, then a result | **BROKEN** — no step name (`UX-E-08`), no cancel (`UX-E-09`), a poll failure strands the panel in "publishing" with a timer counting up forever (`UX-E-03`), a failure always blames step 0 (`UX-E-07`), and raw server strings reach the user (`WORKER_DISPATCH_FAILED`; `ALREADY_PUBLISHING` painted as a red failure over a running deploy) (`UX-E-25`) |
| 7 | Publish panel · just published | Looks at "v3 · live" and wants v2, or wants to see what changed | "Compare v2 → v3" | **BROKEN** — the button emits a tab id only and lands on History › Saves, a different subject, with no comparison · `UX-E-26`; and the panel has no link to the version list at all, which lives in History › Published behind a site-menu row · `UX-E-29` |
| 8 | Site menu → "Unpublish site…" | Decides to take the site down | The left panel switches to Publish. No confirmation appears | **BROKEN** — the row emits the unpublish request in the same tick as the panel switch, and `PublishTab` is lazily imported and mounts a render later, so there is no listener. The user has been moved to a panel they did not ask for and nothing else happens · `UX-F-30` |

**Cross-cutting, and easy to miss:** half of Settings is inside version history
and half is outside it. General / SEO / Analytics / Custom code go through the
composer; Redirects / Headers / Localization / Domains / Forms / Webhooks write
straight to the server. A restore therefore keeps the redirects and headers from
the state the user was trying to leave, under a banner promising "nothing is
lost" (`UX-I-40`).

---

## Journey 5 — Recover from a mistake (undo, version history, restore)

> ### FIRST STOP: step 1.
> Ordinary actions — creating a CMS binding, deleting a media asset — deliberately
> change the project outside history and **switch undo off until the next recorded
> action**. The engine announces this on `HISTORY_UNRECORDED` and **nothing in the
> UI listens**, so the only way to learn is to press ⌘Z and read the refusal. Worse,
> on a freshly opened site with bindings the refusal **names an action the user
> never performed** ("binding a field to content"), at the exact moment they are
> most likely to be trying to undo something they think went wrong. `UX-I-15`,
> `UX-I-27` · `HistoryManager.ts:639-646`, `BaseBindingManager.ts:106`
>
> The most destructive step is **3**: in the change list, the clickable timestamp
> labelled **"Jump to 14:32"** does not jump or preview — it **restores**, and the
> restore permanently truncates history. No confirm, no toast, no way back.
> `UX-I-01` · `ActivityView.tsx:360-393`, `HistoryManager.ts:757-775`

**8 steps · 8 broken.**

| # | Screen | User does | User sees | Verdict |
|---|---|---|---|---|
| 1 | Canvas | Presses ⌘Z | Either the edit reverses, or a toast says undo will not work | **BROKEN — FIRST STOP** — the switch-off is silent; only the refusal speaks, and after a load it blames the wrong culprit · `UX-I-15`, `UX-I-27`. Undo after browsing pages also records a non-empty patch and appears to do nothing (`MOD-B-04`) |
| 2 | History panel (⌘H or the site menu) | Opens history | Two filter chips: "Milestones" and "All changes" | **BROKEN** — two fundamentally different stores presented as two filters of one list: persistent named versions vs the in-memory, 100-entry, wiped-on-reload undo stack. The retention promise ("named ones never prune") is printed under both, which reinforces the misread · `UX-I-09` |
| 3 | History › Saves › All changes | Clicks "Jump to 14:32" to look at an earlier state | The canvas jumps — and everything after that point is deleted from the stack, redo emptied | **BROKEN — most destructive** · `UX-I-01`, `MOD-G-15`. The list is also capped at 100 with no line saying where history begins (`UX-I-05`), its built error state is unreachable so a failed read reads as "No undo history" (`UX-I-06`), and "Clear" never states its consequence (`UX-I-07`) |
| 4 | History › Time-Travel drawer | Opens time travel | The slider parked at the MIDDLE of the stack | **BROKEN** — an arbitrary past moment is armed on open · `UX-I-13`; and the drawer's left edge sits under the panel that opened it, hiding the start-of-range timestamp · `UX-I-11` |
| 5 | Time-Travel · preview | Scrubs back to look before restoring | "Previewing: 14:32 — Added block" over an unchanged canvas | **BROKEN** — the preview is the nearest NAMED version's screenshot; with no named versions the layer is set to `opacity: 0` and the live canvas shows through. The user is looking at the present, being told it is the past, with a restore button under it · `UX-I-12` |
| 6 | Time-Travel · the search field above it | Types a query and presses Enter | The state is restored | **BROKEN** — the scrubber's document-level keydown has no text-field guard, so Enter fires "Restore this point" on whatever the slider is parked on. **A search keystroke destroys the user's later work** · `UX-I-03`. Arrow keys fire in both the canvas and the scrubber at once (`UX-I-04`), and Escape does nothing: the drawer declares `aria-modal` and implements no Escape (`UX-I-10`) |
| 7 | History › Milestones → Restore | Takes the safe route: restores a named version | A confirm band: "Your current work is saved first — nothing is lost" | **BROKEN as promised** — the snapshot is taken, but the restore silently keeps the server-backed half of Settings (`UX-I-40`) and leaves CMS / media / component ids dangling with no reconciliation (`MOD-G-02`). And the only control that creates a named version is a text link three navigations from the canvas, suggested by nothing (`UX-I-14`) |
| 8 | Pages → the page deleted five minutes ago | Tries to get it back | Nothing — no trash, no recently-deleted, no restore | **MISSING** — the only route is N undos on the single editor-wide stack, which also throws away everything done since; the confirm names ⌘Z as the way back and is honest only for the very next action · `UX-B-31` |

**What this journey costs the user.** The recovery module is the one where a
mislabelled control performs an irreversible act, where the safe-looking button
promises a safety that half of Settings is outside of, and where typing in a
search box can delete an afternoon.

---

## What the five journeys have in common

1. **Four of the five are stopped by a screen reporting a result it did not
   produce** — a drag that says it worked (J1), a checklist that says all checks
   pass (J2), a re-send that says it sent (J3), a panel that says the site is
   published (J4). This is not a polish problem. A screen cannot be redesigned
   around a lie; the code has to stop lying first.

2. **Every journey crosses a seam where two surfaces answer the same question
   differently.** Insert vs the canvas picker (J1), the wizard vs the Fields
   screen (J2), the review bar vs the review panel (J3), the topbar vs the
   publish panel (J4), Milestones vs All changes (J5). In each case one of the
   two is safer and it is never the more prominent one.

3. **The features that would rescue each journey are usually already built and
   unreachable** — `FormSettingsSection` (J1), `RepeaterRenderer` and
   `bindCollection` (J2), the panel's confirmed re-send (J3), `cancelPublish`
   (J4), `exportVersions` and the change list's error state (J5). More is built
   than ships.

4. **Undo is the product's stated safety net in all five journeys and holds in
   none of them.** Bindings and media deletes silently switch it off; folders,
   layer names and layer locks live outside the project entirely; template apply
   and restore truncate it; and half of Settings never enters it.

5. **Nothing tells the user where they are.** No surface names site / page /
   panel together (`UX-F-36`), six of twelve panel destinations have no rail
   button (`UX-F-01`), and full-page mode swaps the entire work surface while the
   rail shows six items with none of them lit (`UX-F-13`).
