# How to read this document

This is a complete inventory of everything the Buildrik editor does **today**, written from the running code on 2026-09-16. It is for the designer redesigning the editor in Figma. Nothing here is a wish-list — every screen, button, menu, state and message listed exists in the product now. Where something is hidden behind a flag, a paid plan, or marked "coming soon", it is tagged so you can decide whether to design it.

## The editor at a glance

The editor is a desktop-only, single-window app laid out as five fixed regions:

| Region | Where | What it holds |
|---|---|---|
| **Top bar** | full width, top | Exit, site name + site menu, save-status pill, live chip, review pill, preview / comments / issues tools, presence, notifications bell, the publish call-to-action |
| **Rail** | far left, narrow vertical strip | The 6 main entry points — Add · Layers · Pages · Assets · CMS · Brand (off-rail panels such as Settings, History, Templates, Components open from the top bar, site menu or ⌘K) |
| **Drawer** (left panel) | next to the rail | The panel the rail item opens (elements catalogue, page list, layer tree, asset library, CMS, brand) |
| **Canvas** | centre | The live page being edited, with selection, hover, floating selection toolbar, context menu, drop indicators, and a floating footer toolbar (undo/redo, breakpoint switcher, overlay toggles, help) |
| **Inspector** (right panel) | right edge | Properties of the selected element in collapsible sections (layout, size, spacing, typography, background, border, effects, element settings, animation, and more) |
| **Footer** | full width, bottom | Breakpoint · zoom readout with zoom flyout, structure popover, status chips |

Modals, popovers, toasts and the ⌘K command palette float above all of this.

## Tags used in this document

| Tag | Meaning |
|---|---|
| **(behind flag)** | Exists in code but only shows when a feature flag is on. Not visible to normal users today. |
| **(Pro plan)** / **(Business plan)** | Visible but locked unless the workspace is on that plan; shows an upgrade prompt. |
| **(coming soon)** | The UI shows the item but it is disabled or labelled as not ready. |
| **(disabled)** | Present but greyed out in the situation described. |
| **(demo-only)** | Works in the local demo but is not shipped to real users. |

## Conventions

- On-screen text is shown in quotes, exactly as the product shows it: "Publish", "Nothing matches 'hero'".
- Keyboard shortcuts are written Mac-style (⌘ = Ctrl on Windows).
- "Element" means any item on the page (section, container, text, image, button…). "Block" means a ready-made group of elements (hero, footer…). "Component" means a user-saved reusable element with instances.
- Each module below follows the same shape: where it lives → purpose → layout → actions → states → flows → shortcuts → copy → gating notes.

---

# Editor Shell — Top Bar, Footer, Left Rail, Global Modals, Notifications, Review, Publish, Recovery, Keyboard & Onboarding

**What this module is.** The "shell" is the frame that wraps everything else in the Buildrik editor: the 56px top bar (exit, site name, save status, review status, tools, notifications, the one blue call-to-action, and the ⋯ site menu), the 60px icon rail on the left with its sliding drawer, the 32px status footer, the page-tab strip at the foot of the canvas, and every global dialog that can appear over the whole editor — publish confirmations and gates, the ⌘K command palette, the keyboard-shortcuts sheet, notifications, the issues panel, the review bar, recovery/error banners, session-expired and conflict dialogs, the create-component and CMS dialogs, the getting-started checklist, and the toast system that reports on saves, undo/redo, syncing and publishing. It also owns the global keyboard shortcuts and the F6 region-cycling behaviour. Individual panels that open inside the drawer (Add, Layers, Pages, Assets, CMS, Brand, Templates, Components, Publish, History, Review, AI) and the canvas/inspector are documented by other modules; this document covers the container they live in and every surface the container itself draws.

---

## 1. The frame — overall layout

- **Where it lives:** the whole browser window.
- **Purpose:** hold the top bar, rail + drawer, canvas, inspector and footer in a fixed grid.
- **Layout / contents (left to right, top to bottom):**
  - **Top bar** — 56px tall, full width, white with a hairline under it.
  - **Optional banners under the top bar** (each only when relevant, stacked in this order): Recovered-work banner, Load-error banner, then the Review bar (44px tinted strip).
  - **Left rail** — 60px wide column, full height between top bar and footer.
  - **Drawer** — slides out to the right of the rail. Default width 280px. Can be widened to 700px by a header "expand" control inside a panel; the Assets panel can request 560px and the Templates panel 700px for their own detail views. When closed it collapses to 0 width, fades out, and its contents cannot be tabbed into.
  - **Canvas** — takes all remaining width. Dotted grid background. The **page-tab strip** sits at the very bottom edge of the canvas area.
  - **Inspector** — 300px column on the right (documented by the inspector module). Shown by default; the canvas toolbar has a control to hide/show it, and the choice is remembered per browser. Below 1366px browser width the inspector stops taking a grid column and instead floats over the right side of the canvas as a rounded, shadowed panel.
  - **Footer** — 32px status bar, full width.
- **Full-page mode:** when a "full-page" tab is active (today only **Settings**, plus the **Assets library** when opened from the Assets drawer), the drawer, canvas and inspector are hidden and the full-page surface takes their place. Settings and the Asset library actually paint edge-to-edge over the entire editor (they bring their own sidebar/close control). The rail stays. The footer stays but drops its selection readout and zoom control (they would describe something not on screen).
- **View mode (read-only):** reached from the site menu ("Enter view mode"). The rail, drawer and inspector are not rendered at all; the canvas takes the full width; the page-tab strip stays (switching pages is allowed) but its "+" and right-click menu are withheld; the top bar keeps only Exit ("‹ Back to editing"), site name, the Comments tool, the bell and a trimmed site menu. No save pill, no publish button, no onboarding chip. Nothing on the canvas can be edited (keyboard commands that would mutate are refused).
- **Accessibility furniture:** a hidden "Skip to Canvas" link is the first focusable thing in the frame. Each region (top bar "Editor toolbar", rail "Editor navigation", drawer "Sidebar panel", canvas "Design canvas", inspector "Element properties", full-page "Full-page view", footer "Editor status") is a landmark for screen readers and for F6 cycling (§16).
- **Dev-only alternate rails:** `?rail=e3` (a 4-tool rail: Insert / Pages / Styles / Site, with AI in the top bar and a "Structure" button in the footer) and `?rail=legacy` (the old 11-button rail in three groups). Both resolve to the standard six-item rail in production builds. (dev-only)
- **Notes:** a comment reserves a "minimum supported width" warning under 1024px but nothing is built for it.

---

## 2. Boot, loading and crash states

### Boot skeleton
- **Where:** full viewport, before the editor engine is ready.
- **Contents:** a placeholder top bar (two chips left, a title block, two action blocks right), a rail of five placeholder squares, and a pulsing body. A spinner in the accent colour.

### "Loading…" state (site arriving from the dashboard)
- The chrome is up, the canvas shows placeholders, and the footer's selection slot reads **"Loading…"** instead of "Nothing selected". Cleared when the site loads (or fails to).
- On success a toast: **"Project loaded"** / "Loaded from dashboard." (success tone).
- If the design-system schema of the loaded site could not be upgraded: toast **"Project update failed"** / "Could not update design system schema. Loaded as-is." (warning).
- If a save failed before the last reload and edits were kept in the browser, the save pill opens in the red **"Save failed — retry"** state and a **persistent** toast appears: **"Some work never reached the server"** / "A save failed before this page was reloaded. The version on screen is the server's. Restoring puts your unsaved edits back so you can save them again." with an action **"Restore my edits"** (never applied automatically). Otherwise the save pill seeds as **"Saved just now"**.
- Local-only (no site id) fallback: toast **"Load failed"** / "Could not load saved project." if the browser copy is unreadable.

### Crash screen
- If the shell itself throws: a full-height panel with **"Something went wrong"**, the error message in red, **"Please reload the editor."** and a **Reload** button.

### Panel crash / panel loading (inside the drawer or a full-page view)
- Loading: five skeleton rows (avatar-sized dot + one text line each).
- Crash: centred "**!**", **"Something went wrong"**, **"This panel encountered an error. Your work is safe."**, button **"Try Again"** (remounts the panel).

---

## 3. Top bar

- **Where it lives:** top of the window, 56px, full width.
- **Purpose:** leave the editor, see whose site this is and whether it is saved/reviewed/live, reach preview / comments / issues / notifications, take the site's ONE next action, and open the ⋯ site menu.
- **Layout / contents, left to right (this exact order is the design):**
  1. **Exit button** — text button "**‹ Exit**" (28px tall, 12px regular, hover gets a light grey background). In view mode it reads "**‹ Back to editing**" and leaves view mode instead of the product. Leaving always goes through the exit guard (§3.9).
  2. **Site name** — fixed 200px column, 14px medium, ellipsised; hover shows the full name. Defaults to "**Untitled site**". Updates live when the site is renamed.
  3. **Save status pill** (§3.1). Not rendered in view mode.
  4. **Live chip** — only when the site has a live URL: a small green dot + the domain (e.g. `bella-cucina.vercel.app`), 24px tall, hover grey. Click opens the live site in a new tab; hover title "Open the live site — https://…". Hidden in view mode.
  5. **Review pill** (§3.2) — only while a review state exists.
  6. *(flexible space)*
  7. **Tool cluster** (§3.3): Quick preview · Comments · Issues chip, separated from what follows by a vertical hairline. In view mode only Comments shows.
  8. **Presence** (§3.4) — collaboration avatars + connection pill. (behind flag)
  9. **Notifications bell** (§3.5).
  10. **The primary call-to-action** (§3.6) — the only filled blue button in the shell. Hidden in view mode.
  11. **⋯ Site menu** (§3.7).
- **Screen-reader announcements:** two invisible live regions speak for save transitions ("Saved", "Save failed", "Sync conflict — reload", "Offline — changes not saved") and publish outcomes ("Published — site is live", "Publish failed"). They are never shown visually.
- **What is NOT in the top bar:** there is no breakpoint/device switcher, no undo/redo buttons and no zoom control up here. Device switching, undo/redo and the overlay toggles live in the canvas's floating toolbar (canvas module); zoom lives in the footer (§12). Undo/redo are also reachable via ⌘Z/⌘⇧Z and the ⌘K palette.
- **Compact behaviour:** the bar measures its own width; below 1200px of bar width the save pill drops its "just now / 2m ago" timestamp (the word "Saved" stays).

### 3.1 Save status pill
- **Where:** top bar, right of the site name. 24px tall rounded pill, 12px text, a 6px dot then the label. The bar shows exactly one of six states:

| State | Label | Look | Clickable? |
|---|---|---|---|
| Saved | **"Saved"** + " just now" / " 12s ago" / " 2m ago" / " 3h ago" / " 2d ago" (timestamp refreshes every 30s; hidden on narrow bars) | green text, green dot, no fill | No |
| Saving | **"Saving…"** | soft grey text, grey dot | No |
| Unsaved | **"Unsaved changes"** | amber text, amber dot | **Yes** — click saves now |
| Conflict | **"Conflict — reload"** | amber text on amber tint | No (the conflict dialog handles it, §18.4) |
| Offline | **"Offline — not saved"** | amber text on amber tint | No |
| Error | **"Save failed — retry"** | red text on red tint | **Yes** — click retries the save |

- **Rules:** offline beats every other state (a dropped connection must never read as lost work). Unsaved **brand** edits (Brand panel staging) also flip the pill to "Unsaved changes" even if the pages are saved. "Unsaved" and "Saving" are not announced to screen readers (they fire on every keystroke).
- **Autosave:** every change is saved about 1 second after you stop editing; undo, redo and "restore version" also trigger a save. ⌘S / Ctrl+S saves immediately.

### 3.2 Review pill
- **Where:** top bar after the live chip; only present when a review exists. 24px rounded pill, 12px medium. Clicking it always opens the **Review panel** in the drawer. Hover title: "<label> — <reviewer name>" when a reviewer is known. Label capped at 140px with ellipsis.

| Review state | Label | Tone |
|---|---|---|
| Sent, not opened | **"In review"** | neutral grey |
| Opened, no reply | **"Opened · no reply"** | neutral grey |
| Client asked for changes | **"Changes requested"** | amber (demoted to neutral grey if the save pill is also amber AND the Issues chip is amber — at most two amber signals at once) |
| Approved | **"Approved"**, or **"Approved by Sara · 2d ago"** when the reviewer is known | neutral grey |
| Approved, but edited since | **"Approved · edited since"** | amber (same demotion rule) |

- **Refresh:** re-checked whenever the browser tab regains focus.
- **Transition toasts** (only when a live round closes while you are here, never on first load): **"Review closed"** / "Sara approved this design." (success) or **"Review closed"** / "Sara asked for changes." (info). "Your client" replaces the name when unknown.

### 3.3 Tool cluster
- **Quick preview** — icon button (eye), label/tooltip "**Quick preview**". Opens the Preview overlay (§13). While the page HTML is being built the icon becomes a spinner and the button is disabled.
- **Comments** — icon button (speech bubble), label "**Comments**", toggles canvas comment mode; shows pressed state while comment mode is on. Also toggled by the bare **C** key.
- **Issues chip** — always visible, 28px, icon + count:
  - none: shield-with-check, muted grey, no number; tooltip/name **"No issues"**.
  - warnings only: amber triangle + total count.
  - any error: red octagon + total count.
  - Count shows "99+" past 99. Tooltip: "**3 issues · 1 error, 2 warnings — review before publish**". For viewers the tooltip ends "**— ask an editor to fix these**".
  - Click opens the Issues panel (§7).

### 3.4 Presence (behind flag — collaboration is demo-only and off in production)
- Up to 2 avatars (initials fallback, colour derived from the person), then "+N". Renders nothing when you are alone and the connection is fine. Beside the avatars a small pill: "**2 editing**" (green), "**Reconnecting…**" (amber) or "**Offline**" (red).

### 3.5 Notifications bell
- Icon button, label "**Notifications**" or "**Notifications, 4 unread**". An accent dot sits on the bell's top-right when anything is unread. Click toggles the Notification panel (§6). Unread count re-checked on tab focus.

### 3.6 The primary call-to-action (state-dependent)
- **Where:** top bar, right of the bell, 32px tall, 14px medium, filled blue. It is the ONE filled button in the shell and its verb follows where the site stands.
- **Verb / state table:**

| Situation | Button reads | Enabled? | Tooltip (when disabled) | Hover hint (title) |
|---|---|---|---|---|
| Still checking review settings (first paint) | "Publish" | disabled | "Checking this site's review settings…" | "Checking where this site stands." |
| Workspace requires client approval, no round sent | **"Send for review"** | yes (opens Review panel) | viewer: "Viewers can't send for review — ask an editor"; offline: "Can't send for review while offline" | "This workspace publishes after a client approves." |
| Round pending (not opened) | "Publish" | disabled | "Waiting on Sara's approval" | "Sent to Sara — waiting on approval." |
| Round opened, no reply | "Publish" | disabled | "Waiting on Sara's approval" | "Sara has opened the review." |
| Changes requested | **"Open feedback"** | yes (opens Review panel) | offline: "Can't load feedback while offline" | "Sara asked for changes." |
| Approved | "Publish" / "Publish changes" | yes | — | "Approved — ready to go live." |
| Approved but edited since | "Publish" / "Publish changes" | yes | — | "Edited since approval — your client hasn't seen these changes." |
| No approval required, never published | "Publish" | yes | — | "Not live yet." |
| No approval required, live with changes | **"Publish changes"** | yes | — | "Changes since this site went live." |
| No approval required, live, nothing changed | *(no button at all — the live chip carries the status)* | — | — | — |
| Any of the above with open **errors** on the site (and not otherwise blocked) | "Publish anyway" / "Publish changes anyway" | yes | — | as above |
| Publishing is not switched on for the workspace | "Publish" | disabled | "Publishing isn't switched on for this workspace yet" | — |
| You are a viewer | "Publish" | disabled | "Viewers can't publish — ask an editor" | — |
| Offline | "Publish" | disabled | "Can't publish while offline" | — |
| A publish is running | current label | disabled (spinner state) | — | — |
| Publish just landed | **"✓ Published"** | disabled, green tint, for 2 seconds, then returns to the normal verb | — | — |
| View mode | hidden | — | — | — |

- "Your client" replaces the reviewer's name when the server did not send one; the possessive form "your client's" is used where grammar needs it.
- A disabled button stays focusable so keyboard users can read the reason.
- **Click flow:**
  1. If the verb is "Send for review" or "Open feedback" → the Review panel opens in the drawer.
  2. Else if there are open **errors** → the **"Publish with N open errors?"** dialog (§3.8).
  3. Else → the **Publish confirm** dialog (§17.1). After confirming, the server may still refuse and open one of the gate dialogs (§17.2, §17.3).

### 3.7 ⋯ Site menu
- **Where:** last item in the top bar. Icon button (three dots), label "**Site menu**". Opens a popover menu anchored bottom-right. Groups render only when they have at least one row.
- **Rows (top to bottom):**

| Group | Row | Shortcut printed | What it does |
|---|---|---|---|
| **Site** | Site settings | ⌃, (Mac) / Ctrl , | Opens the full-page Settings |
| | Version history | ⌃H / Ctrl H | Opens History panel |
| | Review | — | Opens Review panel (this row exists so the panel is reachable even when the review pill is absent) |
| | Publish panel | — | Opens the Publish panel in the drawer |
| | Publish history | — | Opens History panel on its "Published" sub-view |
| | Unpublish site… | — | Only when the site is live AND you are an admin. Opens the Publish panel and starts its unpublish confirm |
| | Export code | — | Opens the Export modal (format chooser) |
| *(no label)* | Site health | — | Opens the dashboard's Site Health section in a new tab |
| | Activity log | — | Opens the dashboard's Recent Activity in a new tab |
| **Build** | Templates | — (no shortcut printed on purpose — "T" collides with the canvas device chip) | Opens Templates panel |
| | Components | ⇧A | Opens Components panel |
| | Brand | — | Opens Brand panel (same destination as the rail's Brand) |
| | Plugins | — | Opens Settings full-page on its Plugins screen |
| **Share** | Enter view mode / Exit view mode | — | Navigates to the read-only view and back (goes through the exit guard) |
| | View live site | — | Only when live. Opens the live URL in a new tab |
| | Copy live URL | — | Only when live. Toast "**Live URL copied**" + URL (success) or "**Couldn't copy**" + URL (error) |
| | Share preview link | — | Opens the dashboard's share-draft dialog in a new tab |
| **Workspace** | Invite teammates | — | Dashboard team settings, new tab |
| | Account settings | — | Dashboard account settings, new tab |
| | Start collaboration | — | (behind flag, only while not connected) Starts a collab session. Toasts: "**Save your site first**" / "Open a saved site to collaborate." (no site id) or "**Couldn't start collaboration**" / "Try again in a moment." |
| | Ask AI | — | (dev-only E3 rail mode) Opens the AI panel |
| *(footer)* | Getting started | — | Re-opens the onboarding checklist from scratch (§20) |
| | Keyboard shortcuts | ⌘/ (Mac) / Ctrl / | Opens the Keyboard Shortcuts sheet (§15) |

- **In view mode** the menu keeps only: Exit view mode, View live site and Copy live URL (when live). Every build/workspace door is withheld.

### 3.8 "Publish with open errors?" dialog
- **Where:** centred question-size modal, opened by the CTA when the site has errors.
- **Title:** **"Publish with 3 open errors?"** (singular "error" for 1).
- **Body:** "These will ship to every visitor exactly as they are now." plus, if a review round is open, " A review round is open — Sara will see the published site." ("your reviewer" when unnamed).
- **List:** up to 3 issue rows, errors first, each a tinted pill in its own severity colour: "● Brand › color.accent · <message>" (red) or "▲ … " (amber). If more exist, a quiet link "**+2 more warnings**" closes the dialog and opens the Issues panel.
- **Buttons:** **"Fix issues first"** (primary, focused on open; closes and opens the Issues panel) and **"Publish anyway"** (amber-filled; proceeds to publish immediately — this path skips the confirm dialog).
- Esc / scrim closes.

### 3.9 Exit guard dialogs
Every navigation out of the editor (‹ Exit, Enter/Exit view mode, a notification row jump) checks for unsaved work first. Browser-level exits (refresh, close tab, ⌘W) get the browser's native "leave site?" prompt whenever there is unsaved work, a save in flight, or queued sync items.

| Dialog | Title | Body | Buttons |
|---|---|---|---|
| Dirty (save is possible) | **"Leave with unsaved changes?"** | "Your last edits aren't saved yet." — plus a red note "The last save failed." if the last save errored | **Stay** (quiet) · **Leave anyway** (red outline) · **Save & leave** (primary; shows busy while saving) |
| Dirty, save-and-leave failed | same | red note "Save failed — your changes may be lost if you leave." | same |
| Risky (offline or conflict with unsaved work) | **"You're offline with unsaved changes"** | "Saving isn't possible right now — leaving loses this work. Reconnect first, or stay until the connection returns." | **Stay** (primary) · **Leave and lose changes** (red outline) |
| Stranded (pages saved, but CMS/components/templates/versions still queued) | **"Some changes are only on this device"** | "3 changes haven't reached the server yet. Leaving drops the retry queue — they stay on this device and never reach your account." ("1 change hasn't…") | **Stay** (primary) · **Leave anyway** (red outline) |

- "Save & leave" waits at most 3 seconds for the save; a queued-offline or conflict outcome switches to the Risky dialog.

---

## 4. Review bar (under the top bar)

- **Where:** a 44px tinted (accent-tint) strip directly under the top bar, full width. Only present while a review round is **open** (sent, or changes requested). Hidden for approved, revoked, or no round.
- **Layout, left to right:** a status sentence, "Next ›", "Compare", *(space)*, "Re-send".
- **Status sentence:** "**3 open**" when there are open comments; otherwise "**Changes requested — nothing left open**" (changes-requested round) or "**Sent — waiting on your client**" (pending round).
- **Actions:**
  - **"Next ›"** — steps through the open comments in order: switches page if needed and selects the anchored element on the canvas. Disabled with tooltip "**No open comments to step through**" when there are none.
  - **"Compare"** — opens the Review panel on its Compare view.
  - **"Re-send"** (accent text; "**Re-sending…**" while busy) — re-renders the site snapshot and sends a fresh round to the same client email; the bar reloads afterwards.
- Refreshes when comments are re-attached.

---

## 5. Send for review (popover) and its outcome dialog

The "Send for review" control is hosted inside the Review panel (drawer). It is documented here because the shell owns it.

### 5.1 Send-for-review popover
- **Trigger button (small, primary):** label by state — **"Send for review"** (idle; a host may override it, e.g. the round view uses a different idle label), **"Sending…"**, **"Sent for review ✓"** (stays until the server reports the new round, then after 1.5s becomes) **"Send again"**, or **"Retry send"** after an error. Disabled while sending/sent.
- **Viewer:** the button stays visible but is marked disabled with a tooltip carrying the reason (e.g. "Viewers can't send for review — ask an editor").
- **Popover form (280px wide, anchored bottom-right):**
  - **"Client email"** — email field, hint "**Leave blank to keep this internal.**" (max 320 chars)
  - **"What changed?"** — text, placeholder "**e.g. hero copy, 2 images**" (max 500)
  - **"Note to the reviewer"** — 3-row textarea, hint "**Optional.**" (max 500)
  - Error line (red): "**Couldn't send — try again.**"
  - Invite-failed box (red outline): "**The round was created, but the invite email didn't go out.**" / "Nothing is lost — send your client the link yourself." + button **"Copy the review link"** → "**Link copied ✓**"
  - Footer: **Cancel** (quiet) · **Send** (primary; disabled while sending)
- **Flow:** Send → the popover closes, the site is frozen (every page rendered), the round is created → outcome dialog (§5.2). A snapshot render failure does not block the send.

### 5.2 Review-sent outcome dialog
| State | Size | Contents |
|---|---|---|
| Sending | 440 wide, not dismissible | spinner + "**Creating review link…**" |
| Sent | 560 wide | title "**Sent ✓**"; "Review link created." (or "Review link created for v3."); link row (monospace URL + **Copy** → "**Copied ✓**" + **Open**); footnote "**Emailed to sara@…**" or "**No email was sent — share the link yourself.**"; button **Done** |
| Email failed | 560 wide | title "**We couldn't send the email.**"; "The review link was created and still works — send it yourself."; link row; footnote "Nothing was lost. The link exists whether or not the mail lands."; buttons **Try email again** · **Done** |

---

## 6. Notification panel

- **Where:** a 360px-wide dropdown hanging from the top bar's right edge, under the bell; max 60% of the viewport height, scrolls. Opens/closes from the bell; closes on Esc or a click anywhere outside the top bar. Focus lands in the panel and returns to the bell on close.
- **Header (48px, sticky):** title "**Notifications**", a quiet "**Mark all read**" button (only when there are rows), and a ✕ close.
- **States:**
  - **Loading:** a day band ("TODAY") over four 44px skeleton rows (so the panel does not jump when rows arrive).
  - **Error:** centred "**Couldn't load notifications.**" (red) / "**Client replies and publish results may be waiting.**" / left-aligned link "**Try again**".
  - **Empty:** "**You're all caught up**" / "**New activity on this site shows up here.**"
  - **Ready:** the 5 most recent notifications, unread first then newest. Rows are grouped under 28px day bands: **TODAY**, **YESTERDAY**, then a date like **"12 SEP"**.
- **Row (44px):** an unread row has a 2px accent bar on its left edge, an accent-tint background and an 8px accent dot (accessible name "Unread"); a read row has neither. Text column (268px, 12px) = "<actor name> <message>"; age at the right ("just now", "2h", "1d", "3d"). Clicking a row marks it read and jumps to its target (through the exit guard, since it leaves the editor).
- **Deleted target:** the row is not clickable and is followed by a 64px amber note: "**What this points to was deleted**" / "**The notification is kept, but there's nothing to jump to.**"
- **Footer:** "**See all notifications**" (accent text link) → the dashboard's full notifications page.
- **Toast:** "**Couldn't mark read**" / "Try again in a moment." if mark-all fails.

---

## 7. Issues panel

- **Where:** a 360px panel docked to the right edge, from just under the top bar to the bottom, over the inspector. Opened by the Issues chip, the "+N more" link, or "Fix issues first".
- **Header (48px):** "**Issues**" + ✕.
- **Empty (no issues at all):** "**No issues.**" (green) / "**This page is ready to publish.**"
- **Scope toggle** — only shown when at least one issue is page-specific: a two-button group "**This page**" | "**All pages**" (defaults to This page; site-wide issues show in both).
- **Filter line (36px, accent text):** one clickable label that cycles **"All"** → **"Errors only"** → **"Warnings only"** → All, followed by "· <count>". Tooltip: "**Showing all — click for errors only**" etc.
- **Rows (56px, clickable):** severity icon (red circle-alert for errors, amber for warnings, grey info), the message, and a smaller location line under it (today's issues come from the Brand linter, so location reads like "**Brand › color.accent**"). Clicking a row closes the panel (jump-to-element is not wired yet — noted limitation). A "**Fix ›**" accent link sits beside rows that can be auto-fixed; all Fix links disable while one fix runs.
- **Fixing band** (accent tint, above the list): "**Fixing <message>…**", an indeterminate progress bar, and "**Auto-fix lands as ONE undo step.**"
- **Fix-failed band** (amber tint): "**Couldn't fix this automatically.**" / "**<location> comes from your brand tokens, so changing it here would change every site using them.**" + quiet buttons **Open Brand** (closes panel, opens Brand) and **Ignore once** (suppresses that token's issues for the session).
- **Filtered-empty:** a centred check icon with "**No errors**" / "**No warnings**".
- **Filter note (bottom, outside the scroll):** "**Filtered to one severity. 2 issues are hidden.**" ("1 issue is hidden.")

---

## 8. Left rail

- **Where:** 60px column on the left, full height between the top bar and the footer. White, hairline on its right.
- **Layout, top to bottom:** a 36px accent-coloured logo mark (stacked-layers glyph), a 24px hairline divider, then six items in one group with 48px pitch, then empty space.
- **The six items** (icon 20px over an 11px label, 44×44 hit area, radius 8):

| Item | Label | Tooltip (right side) | Key | Accessible description |
|---|---|---|---|---|
| Add | **Add** | "Add · A" | **A** | Add elements, blocks and components to your page |
| Layers | **Layers** | "Layers · L" | **L** | View and reorder page structure |
| Pages | **Pages** | "Pages · P" | **P** | Manage all pages in your site |
| Assets | **Assets** | "Assets · M" | **M** | Upload and manage images, videos, and fonts |
| CMS | **CMS** | "CMS · D" | **D** | Collections, records and data sources for dynamic content |
| Brand | **Brand** | "Brand · B" | **B** | Brand — global colors, fonts, spacing tokens |

- **States:** rest = soft-grey icon+label; hover = light grey plate, dark ink; **active with drawer open** = accent-tint plate, accent text, and a 3px accent bar flush against the rail's left edge running the item's full 44px height; **active but drawer closed** = a plain grey plate (no bar) so you keep your place; keyboard focus = 2px accent outline; pressing = icon scales down slightly. A 6px amber "unsaved" dot can sit top-right of an item whose panel has unsaved edits (today only the Settings item in the dev-only legacy rail).
- **Click behaviour:** clicking a different item switches the drawer to that panel (opening the drawer if it was closed). Clicking the **already-active** item toggles the drawer closed/open — this is how panels without their own ✕ (Layers, Add) are closed.
- **Keyboard inside the rail:** ↑/↓ move between items (and switch the panel), Home/End jump to first/last.
- **Panels that are NOT on the rail** (still real panels, reached by shortcut, ⌘K "Open … panel", the site menu, or other doors):

| Panel | Key | Other doors | Mode |
|---|---|---|---|
| AI | **I** (also ⌘J, and ⌘K "Open AI panel") | inspector "Ask AI", canvas selection ✨, ⌘K "Ask AI instead" | opens in the **inspector column** with a "‹ Inspector" way back, not in the drawer |
| Templates | **T** | Pages › "From template", site menu, ⌘K "Replace page layout with template…" | drawer (280, widens to 700 in detail) |
| Components | **⇧A** | site menu, ⌘K | drawer |
| Settings | **S** | site menu "Site settings", ⌃, / Ctrl , , "Plugins" row | **full page** (edge-to-edge, own "‹ Back to canvas") |
| Publish | **U** | site menu "Publish panel" / "Unpublish site…", onboarding "Publish now" | drawer |
| History | **H** | site menu "Version history" / "Publish history", ⌃H | drawer |
| Review | **R** | review pill, CTA, site menu "Review", review bar, gate dialogs | drawer |

- **Rail letters** fire only when no modifier is held and focus is not in a text field.
- **Rail coach mark** (first run): see §20.1.

---

## 9. The drawer (panel container)

- **Where:** immediately right of the rail. 280px wide by default (the generated design token); a panel's header "expand" control widens it to 700px; Assets may switch to 560px and Templates to 700px for their detail flows; all overrides reset when you leave that tab.
- **Closed:** width animates to 0 (0.2s), fades out, and the contents are inert (not tabbable, hidden from assistive tech).
- **Contents:** the active panel, mounted fresh on every tab switch with a 0.15s fade-up. While a panel's code downloads: the 5-row skeleton. If a panel crashes: the "Something went wrong / Try Again" fallback (§2). Each panel draws its own header/✕ (other modules).
- **Remembered:** the last open tab and its sub-view are remembered across sessions; the drawer always starts **open** on a new session (a closed drawer is per-session only).
- **Dev-only E3 rail:** a sub-tab row appears at the top of the drawer for tools that fold several panels (Insert: Add/Templates/Components/Assets; Site: Settings/Publish/History) — 12px chips, active one accent-tinted. (dev-only)

### 9.1 Settings dirty guard
- Switching away from Settings with unsaved edits opens a destructive confirm: title **"Unsaved Changes"**, message **"You have unsaved changes in Settings. Switching tabs will discard them."**, confirm **"Discard & Switch"**, Cancel (returns to Settings).

### 9.2 Cross-panel hand-offs the container performs
- Pages › "From template" opens Templates in **new-page mode** (apply creates a page instead of replacing the current one).
- Site menu › "Unpublish site…" opens Publish and starts its unpublish confirm on the first click.
- Inserting an image/video/audio/icon block that has no file switches the drawer to Assets and asks it to pick a file for that element.
- "Show in layers" (from the canvas) switches to Layers, opens the drawer and scrolls to the selection.
- Pages › "Add redirect" opens Settings on Redirects; Settings › "Back to <Page> SEO" opens Pages on that page's SEO.
- The inspector's "Manage video" opens the Asset library full-page.

---

## 10. Full-page views

- **Which tabs:** **Settings** (always full page); **Assets** when its "open library" action is used (returns to the slim Assets drawer on close). Templates is a drawer panel (it has a full-page router entry but is configured as a drawer).
- **Container:** replaces drawer + canvas + inspector; the rail stays; the footer keeps only its band (no selection/zoom). Settings and the Asset library paint over the whole editor edge-to-edge with their own sidebar/close (their contents are other modules). Loading and crash fallbacks as in §2.
- **Closing** a full-page view returns to the Add panel (or, for the Asset library, back to the Assets drawer).

---

## 11. Page tab bar (foot of the canvas)

- **Where:** a strip along the bottom edge of the canvas area, above the footer; app-grey background with hairlines above and below. Hidden until the site's pages have loaded.
- **Layout:** a horizontally-scrolling row of page tabs, then a dashed-outline "**+**" button (tooltip "**Add page**", accessible name "Add new page"). Hidden "+" in view mode.
- **A tab:** 13px, rounded top corners. The **active** page is a white browser-style tab fused to the canvas edge (bordered, medium weight, soft shadow); resting tabs are plain soft-grey text. A **⌂** glyph precedes the homepage's name. Names ellipsise past 120px (hover for full). A small blue **dot** after the name marks a page with unsaved changes (title "Unsaved changes").
- **Actions:**
  - Click a tab → switches the canvas to that page.
  - **+** → creates a page with the next default name and switches to it.
  - Right-click a tab (or Shift+F10 / the Menu key while focused) → context menu (160px, opens upward): **Rename**, **Duplicate**, **Set as home**, and **Delete** (only when more than one page; red).
  - **F2** on a focused tab → inline rename.
  - ←/→ move focus between tabs; Enter/Space activates.
- **Inline rename:** the name becomes a 100px input; Enter commits, Esc cancels, clicking away commits. A small validation popover floats above it: red "**Page name is required**" (blocks commit), amber "**Short name — consider 3+ characters**", and a grey preview of the URL slug "**/about-us**". The input border turns red/amber/blue to match.
- **Duplicate:** deep-copies the page and names it. Toasts on failure: "**Couldn't duplicate — source page not found.**" (warning) / "**Duplicate failed — page may have corrupt content.**" (error).
- **Set as home:** makes it the homepage (⌂ moves).
- **Delete:** if it is the homepage → warning toast "**Set another page as Homepage before deleting this one.**". Otherwise a destructive confirm: title **"Delete "About"?"**, message **"This page and everything on it is removed. You can undo this from the toast that follows."**, confirm **"Delete page"**. After deleting: info toast **""About" deleted"** with an **Undo** action (8 seconds).

---

## 12. Footer (status bar)

- **Where:** 32px band along the bottom, full width, white with a hairline above; 11px medium muted text, 16px side padding.
- **Layout, left to right:**
  1. *(dev-only E3 rail only)* a "**Structure**" text button with a tree icon — opens the Structure popover (§12.2).
  2. **Selection readout:** "**Nothing selected**", "**Loading…**" (while the site loads), "**3 elements selected**" (multi-select), or "**Section · Hero**" — the element's type, then " · " and its custom layer name if it has one (e.g. "Container", "Heading · Title"). Ellipsised; hover shows the full text.
  3. **Size readout:** the selected element's rendered size, e.g. "**680 × 250**" (only when something is selected and on screen).
  4. *(flexible space — this gap also hosts the onboarding chip, §20.2)*
  5. **Device · zoom button:** e.g. "**Desktop · 100%**" (device labels: Wide, Desktop, Tablet, Mobile). Click opens the zoom flyout.
- In full-page mode items 2–5 are dropped.

### 12.1 Zoom flyout
- **Where:** opens **upward** from the device·zoom button, right-aligned, 196px min width, 28px rows (13px medium label left, 12px muted chord right). Closes on outside click or picking a row.
- **Rows:** "**Zoom to fit**" ⌘1 · "**Zoom to selection**" ⌘2 · "**Zoom to 100%**" ⌘0 · *divider* · presets **10% · 25% · 50% · 75% · 100% · 150% · 200% · 400%** (the current one is accent-tinted) · *divider* · "**Zoom in**" ⌘+ · "**Zoom out**" ⌘−.
- Zoom range 10%–400%.

### 12.2 Structure popover (dev-only E3 rail)
- A 400px-wide floating dialog anchored bottom-left over the canvas (max 60% viewport height), titled "**Structure**" with a ✕ ("Close structure"), containing the Layers tree (layers module). Closes on ✕, Esc, or clicking outside.

---

## 13. Preview overlay

- **Where:** covers everything below the top bar (the top bar stays). Opened by the Quick preview eye, ⌘P / Ctrl+P, ⌘K "Preview", or the onboarding "Open preview" step. Toggles closed if already open.
- **Layout, top to bottom:**
  - a 40px grey **device strip** with labelled chips **Desktop · Tablet · Mobile** (tooltips "Desktop · ≥1024px", "Tablet · 768–1023px", "Mobile · ≤767px"; the selected chip is filled). Defaults to Desktop.
  - the **stage**: on Desktop the page renders inside a rounded, shadowed frame up to 1100px wide on the app background; on Tablet/Mobile the page sits inside a device bezel (the same frame the canvas uses). The stage scrolls if the bezel is taller than the window.
  - a dark rounded "**Done**" pill floating bottom-centre.
- **Actions:** Done or **Esc** closes. The preview is a sandboxed render of the page's exported HTML (no editor scripts).
- **Note:** the design also draws a "Share preview" button here; not built — the site menu's "Share preview link" is the single door.

---

## 14. Command palette (⌘K / Ctrl+K)

- **Where:** a 560px-wide card (max 90vw) floating at 20% from the top over a dark scrim; radius 12, hairline border, overlay shadow. Toggled by ⌘K/Ctrl+K anywhere in the editor. Not available in view mode; not opened while another dialog is up.
- **Search row (56px):** magnifier icon + a borderless input, placeholder "**Type a command or search…**", 16px semibold. Focus lands here on open.
- **List (max 360px, scrolls):** rows are 40px, 13px label left, an 11px grey monospace chord right ("⌘Z", "⇧⌘G" on Mac; "Ctrl+Z" elsewhere). The highlighted row is accent-tinted; mouse-over highlights. A command that cannot run right now is shown dimmed with its reason in small grey text after the label (e.g. "Undo  nothing to undo") and does nothing when chosen (the palette stays open).
- **Bands (28px uppercase grey strips):** with an empty query: **RECENT** (the last 5 commands you ran, most recent first, remembered in the browser; a promoted command is moved out of its normal spot, not duplicated), then **SUGGESTED** (the next 5 commands), then **ACTIONS** and **GO TO**. With a query: **ACTIONS** then **GO TO**. Search matches label or group text.
- **Footer (36px):** "**↑↓ navigate**", "**↵ run**", "**Esc close**".
- **Keys:** ↑/↓ move, Enter runs, Esc closes; Enter on an empty result set with a query sends it to AI.
- **No results:**
  - one-word query: centred "**Nothing matches 'foo'.**" + accent link "**Ask AI instead ›**".
  - multi-word query: "**That isn't a command — send it to AI?**" / "AI proposes a diff and never writes directly. Apply lands as one undo step." + button "**✨ Ask AI ›**".
  - Both open the AI panel (in the inspector column).
  - empty list with no query (engine not ready): "**No commands found**".

### 14.1 Every command the palette exposes

**GO TO band** ("Open <panel> panel", each with its rail/off-rail letter): Open **Add** panel (A) · Open **AI** panel (I) · Open **Templates** panel (T) · Open **Assets** panel (M) · Open **Layers** panel (L) · Open **Pages** panel (P) · Open **Components** panel (⇧A) · Open **Brand** panel (B) · Open **Settings** panel (S) · Open **Publish** panel (U) · Open **History** panel (H) · Open **Review** panel (R) · Open **CMS** panel (D).

**ACTIONS band:**

| Command | Chord shown | Disabled reason (when applicable) |
|---|---|---|
| Undo | Ctrl+Z / ⌘Z | "nothing to undo" |
| Redo | Ctrl+Y / ⌘Y | "nothing to redo" |
| Preview | Ctrl+P | — (opens the preview overlay) |
| Zoom in | Ctrl++ | — |
| Zoom out | Ctrl+- | — |
| Fit to view | Ctrl+0 | — (note: the footer flyout and shortcuts sheet print fit as ⌘1 and 100% as ⌘0; this row's printed chord disagrees) |
| Undo last action | Ctrl+Z | "nothing to undo" |
| Clear history | — | — |
| Replace page layout with template… | — | opens Templates |
| Keyboard shortcuts | ? | opens the canvas cheat sheet |
| Save | ctrl+s | — |
| Delete element | delete | "nothing selected" |
| Group | ctrl+g | "select two or more" |
| Ungroup | ctrl+shift+g | "select a group" |
| Duplicate | ctrl+d | "nothing selected" |
| Copy | ctrl+c | "nothing selected" |
| Cut | ctrl+x | "nothing selected" |
| Paste | ctrl+v | "nothing copied" |
| Nudge up / Nudge down / Nudge left / Nudge right | — | "nothing selected" |
| Nudge up (10px) / down (10px) / left (10px) / right (10px) | — | "nothing selected" |
| Bring forward | ctrl+] | "nothing selected" |
| Send backward | ctrl+[ | "nothing selected" |
| Bring to front | ctrl+shift+] | "nothing selected" |
| Send to back | ctrl+shift+[ | "nothing selected" |
| Toggle snap to grid | — | — |
| Select all | ctrl+a | — |
| Deselect | escape | — |
| Export HTML | — | — |
| Export JSON | — | — |
| Open templates | — | — |
| Open exporter | ctrl+shift+e | — (opens the Export modal) |
| Open AI assistant | ctrl+shift+a | — |
| Toggle component view | ctrl+shift+c | — |
| Reset zoom | — | sets 100% |
| Desktop view / Tablet view / Mobile view / Watch view | — | switches the canvas device |

(Undo, Redo, Preview, Zoom in and Zoom out appear once — the engine's duplicates are folded into the rows above.)

---

## 15. Keyboard Shortcuts sheet (⌘/ · Ctrl+/ · site menu)

- **Where:** a centred table-size modal titled "**Keyboard Shortcuts**" with a ✕. Body scrolls (max 60vh).
- **Search:** a search field at the top, placeholder "**Search shortcuts…**"; matches the description or the chord (both "Ctrl+Z" and "⌘+Z" spellings); groups with no matches disappear; empty → "**Nothing matches 'foo'.**". Cleared on every open.
- **Groups (one column, 12px semibold headings over a hairline; rows = 13px description left, 24px monospace key chip right; ⌘/⇧/⌥ on Mac):**
  - **Panels** — "Open Add panel" A · "Open AI panel" I · "Open Templates panel" T · "Open Assets panel" M · "Open Layers panel" L · "Open Pages panel" P · "Open Components panel" ⇧A · "Open Brand panel" B · "Open Settings panel" S · "Open Publish panel" U · "Open History panel" H · "Open Review panel" R · "Open CMS panel" D
  - **Edit** — Save Ctrl+S · Undo Ctrl+Z · Redo Ctrl+Shift+Z · Copy Ctrl+C · Paste Ctrl+V · Delete element Del · Duplicate Ctrl+D
  - **View** — Preview Ctrl+P · Command palette Ctrl+K · This shortcuts panel Ctrl+/ · Canvas gestures & selection ? · Zoom to 100% Ctrl+0 · Zoom to fit Ctrl+1 · Zoom to selection Ctrl+2 · Zoom in Ctrl++ · Zoom out Ctrl+-
- **Esc** closes it.
- **Note:** there are two help screens on purpose — this sheet (app-wide chords) and the canvas cheat sheet opened by **?** (gestures and selection; canvas module).

### 15.1 Global shortcuts owned by the shell (complete)
All stand down while any modal dialog is open. Letter keys are ignored while typing in a field.

| Keys | Does |
|---|---|
| ⌘K / Ctrl+K | Toggle the command palette (not in view mode) |
| ⌘S / Ctrl+S | Save now |
| ⌘Z / Ctrl+Z | Undo |
| ⌘⇧Z / Ctrl+Shift+Z, or ⌘Y / Ctrl+Y | Redo |
| ⌘P / Ctrl+P | Toggle the preview overlay (browser print is suppressed) |
| ⌘/ / Ctrl+/ | Keyboard Shortcuts sheet |
| ⌘J / Ctrl+J | Open the AI panel |
| ⌃, (Mac) / Ctrl+, | Site settings (Settings full page) |
| ⌃H (Mac) / Ctrl+H | Version history panel |
| ⇧A | Components panel |
| C | Toggle comment mode |
| A · I · T · M · L · P · B · S · U · H · R · D | Open that panel (rail letters, §8) |
| F6 / ⇧F6 | Cycle focus between shell regions (works even from inside a text field) |
| Esc | Close the shortcuts sheet; also closes the preview overlay, structure popover, notification panel, command palette, page-tab menu, zoom flyout |
| ⌘⇧P | Canvas command palette (canvas module) |
| ? | Canvas cheat sheet (canvas module) |
| ⌘1 / ⌘2 / ⌘0 / ⌘+ / ⌘− | Zoom to fit / to selection / 100% / in / out (printed in the footer flyout; bound by the canvas toolbar) |

---

## 16. F6 region cycling

- **F6** moves keyboard focus to the next visible region, **⇧F6** to the previous, wrapping. Focus lands on the region's first focusable control (or the region itself).
- **Order:** 1 top bar → 2 rail → 3 drawer (skipped when closed) → 4 page tabs (skipped on one-page sites) → 5 canvas, or the full-page view when one is open → 6 inspector (skipped when hidden) → 7 footer.
- Each region shows a 2px accent outline when it holds keyboard focus.

---

## 17. Publish flow (dialogs, gates, history)

### 17.1 Publish confirm dialog
- **Where:** centred 440px question modal. Opened by the top-bar CTA (the Publish **panel** has its own wizard whose last step shows the same facts, so it does not open this).
- **Title:** "**Publish this site?**" (never published) or "**Update the live site?**" (live).
- **Facts (label left, value right):**
  - **Target** — "Production · bella-cucina.vercel.app", or "your connected Vercel project", or "**No Vercel connection**"
  - **Pages** — "Preparing…" then "4 pages"
  - **Client approval** — "Checking review status…" / "Not sent for review." / "Approved by Sara on 2 Jul." / "Sara asked for changes — 2 unresolved comments." / "Round 2 open — 1 unresolved comment." / "Round 2 is still open."
  - **Rollback** — "v6 stays restorable in publish history" / "The current version stays restorable" / "The last 20 versions stay restorable"
- **Bands under the facts:** amber "**This replaces the live site immediately for all visitors.**" (when live); amber "**⚠ 2 warnings — none block. Client approval is a separate gate.**" (when the site has warnings and nothing blocks); red blocker text (e.g. the Vercel-not-connected sentence from the pre-publish check).
- **Buttons:** **Cancel** · **"Publish now"** / **"Update now"** → "**Publishing…**". The primary is disabled while submitting, when there are 0 pages, or when blocked.

### 17.2 Publish gate dialogs (server refused — approval required)
520px modal, 16px semibold title, 14px grey body, two 32px buttons inside the card (primary + "Cancel"). The primary always opens the Review panel.

| Reason | Title | Body | Primary |
|---|---|---|---|
| No review sent | **"No review sent yet"** | "This site needs client approval before it can go live. Send it for review first." | **"Send for review"** |
| Review pending | **"Waiting on approval"** | "This site was sent to Sara (sara@…) for review. Publishing unlocks once they approve." (or "This site is with its reviewer. Publishing unlocks once it is approved.") | **"View review"** |
| Changes requested | **"Changes were requested"** | "Sara asked for changes. Resolve their comments, then re-send for review before publishing." ("Your reviewer" when unnamed) | **"See comments"** |

### 17.3 Stale-approval dialog (approved, then edited)
- **Where:** 560px modal. Opened when the server refuses because the approval predates the latest edits.
- **Title:** "**The approval is older than your latest edits**"
- **Body:** "Sara approved round 2 on 2 Jul — since then, 3 things changed. Publishing now would go live with work the client hasn't seen." Variants: "This site was approved earlier" (no round data); " — comparing with the approved version…" (while diffing); " — the changes since couldn't be itemized." (no diff).
- **"CHANGED SINCE APPROVAL"** list: up to 6 amber 44px rows — page name left ("Home", "About us"), verb right ("edited" / "added" / "removed"); "and 2 more" beyond six.
- **Footnote:** "**Sara's approval still stands — publishing now just ships these changes on top of it.**"
- **Buttons:** **"Request fresh review"** (primary; "**Requesting…**" while busy; sends a new round to the same client, toast "**Sent for approval**" / "A fresh review round is on its way to sara@…", or error toast "**Couldn't re-send**" / "The review link didn't go out. Try again.") · **"Publish anyway"** (amber; publishes acknowledging the stale approval).

### 17.4 Publish outcome toasts (the only place publish results are toasted)
- **"Published — site is live"** + the URL, action **"View live"** (6 s, success).
- **"Vercel not connected"** / "Connect this workspace to Vercel before publishing." action **"Open settings"** (dashboard integrations).
- **"Vercel connection lost"** / "Reconnect Vercel in workspace settings to publish again." action **"Reconnect"**.
- **"Publish failed"** + the server's message, action **"Try again"** (re-exports and republishes).
- **"Cannot publish"** / "Open this editor from a site URL with ?siteId=… to publish." (no site id).
- **"Nothing to publish"** / "Add at least one page before publishing." (warning).
- **"Publish failed"** / "Could not start publish." (export error).
- A home-page thumbnail is captured silently at publish time for the dashboard card; failures are invisible by design.
- The onboarding "Publish" step ticks only on a real completed publish.

### 17.5 Publish history (History panel › "Published" view)
- **Where:** inside the History drawer panel; opened directly from the site menu "Publish history".
- **States:**
  - Loading: spinner + "**Loading versions…**"
  - Error: alert icon, "**Couldn't load publish history**", button **Retry**
  - Empty: check icon, "**No published versions yet**" / "**Publish this site and each version shows up here — you can roll back to any of the last 20.**"
- **Live banner** (green tint): "**LIVE · v6**" with a green dot (the "LIVE ·" prefix and dot only when the site is known to be serving) and a meta line "bella-cucina.vercel.app · published 2h ago".
- **Notice line** (grey): e.g. "Rolling back to version 5 — publishing a new version…"
- **Version rows:** "**Version 6**" with a "**Live**" tag on the live one; meta "2h ago" or "**↩ from v3 · 2d ago**" for a rollback; an accent "**Compare**" link on every row but the oldest (compares it with the version before it → §17.6).
- **Footnote:** "**Every publish is restorable. Rolling back redeploys that version.**"
- **Button (full width):** "**Roll back to a published version…**". Disabled with tooltip "**Ask an admin to roll back**" (non-admins) or "**There is only one published version**".
- **Rollback picker modal** ("**Roll back to a published version**", 560): a single-choice list of 56px bordered rows — "**v5**" (or "**v6 · current**" with a green "**live**" tag), meta "published 2h ago". The live row and pruned rows cannot be picked (tooltips "**This version is already live**" / "**This version's snapshot is no longer stored**"). The chosen row is accent-tinted. Footer **Cancel** · **Continue** (disabled until a pick).
- **Rollback confirm** (amber tone, 440): title "**Roll back to v5?**"; body "**This publishes v5 again as v7. Your current v6 stays in history — nothing is deleted or rewritten.**"; accent info box "**The publish list only ever grows.**" / "**v7 will name v5 as its source.**"; buttons **Cancel** · **"Roll back to v5"** (amber).
- **Progress modal** ("**Rolling back…**"): a determinate accent progress bar + caption "**Publishing v5 as v7**". Shown while the job runs.
- **Success modal** ("**Rolled back**"): green check disc; "**v7 is live — a re-publish of v5.**" / "**v6 is still in your history and can be rolled forward the same way.**"; button **Close**.
- **Failure modal** ("**Rollback failed**"): red alert disc; "**v5 could not be re-published. Your live site is unchanged — still v6.**"; reason line: "**Nothing was overwritten. Retry the rollback, or pick a different version.**" / "**That version's snapshot is no longer stored, so it cannot be re-published.**" / "**A publish is already running. Wait for it to finish, then try again.**"; buttons **Close** · **"Try again"** (reopens the confirm for the same version).

### 17.6 Publish diff view ("Compare")
- **Where:** replaces the version list inside the History panel.
- **Header:** "**‹ Versions**" back link left; "**v3 → v4**" right.
- **States:** loading skeleton; error "**Couldn't compare these versions.**" + "**Try again**"; pruned: "**One of these versions is older than the kept window, so its content is no longer stored and there is nothing to compare.**"
- **Ready:** summary "**2 changed · 1 added · 0 removed · 3 unchanged**" then one 12px row per page: path (e.g. `about.html`), sizes in monospace ("12.3 KB → 12.9 KB" for changed, a single size otherwise), and a badge **Added** (green) / **Removed** (red) / **Changed** (accent) / **Unchanged** (grey).

---

## 18. Recovery, error and save surfaces

### 18.1 Recovered-work banner
- **Where:** a tinted bar at the very top of the shell (above the top bar), shown once after a reload that found a locally kept draft.
- **Copy:** "**Recovered your work** · 5 minutes ago · 3 pages. It was kept on this device, so it may not be on the server yet." (time: "moments ago", "N minutes ago", "N hours ago")
- **Buttons:** **"Discard & reload"** (quiet; drops the local draft and reloads the server copy) · **"Keep changes"** (primary; dismisses).

### 18.2 Load-error banner
- **Where:** a red-tinted rounded bar under the recovery banner / above the top bar; stays until acted on. Starts with a ⚠ glyph.

| Kind | Text | Buttons |
|---|---|---|
| Session expired | "**Session expired. Sign in to load this site from the dashboard — you're seeing local changes for now.**" | Dismiss · **Sign in** (opens the dashboard sign-in in a new tab) · **Retry** |
| Network | "**Couldn't load the latest version of this site. You're seeing local changes for now.**" | Dismiss · **Retry** |
| Site not found | "**This site isn't there anymore. It was deleted, or it isn't yours to open. Deleting is permanent — there is no trash to restore from — so nothing you do here can be saved.**" | Dismiss · **Go to dashboard** |
| No access | "**Your role changed, or the site isn't yours to open. Ask the owner — signing in again won't change it, and nothing you do here can be saved.**" | Dismiss · **Go to dashboard** |

- **Retry** reloads the page; while it runs the button reads "**Reconnecting…**" (tooltip "Reaching the server — this usually takes a moment.").

### 18.3 Session-expired dialog (a 401 while saving)
- **Where:** centred 440px modal, opened when a manual save or autosave is refused because you are signed out. Esc/scrim = "Keep editing". Closes by itself once any save succeeds (e.g. after signing in from another tab).
- **Title:** "**Your session expired**"
- **Body:** "**You have unsaved changes — they live in this tab. Keep it open, sign in again, then save.**"
- **"3 CHANGES AT RISK"** (uppercase kicker) then up to three amber rows naming the recent history entries (e.g. "Moved element", "Edited text") and "**and 4 more**".
- Retry failed line (red): "**Still signed out — finish signing in first, then try again.**"
- **Buttons:** **"Keep editing"** · **"Try saving again"** ("**Saving…**") · **"Sign in"** (primary; opens sign-in in a new tab so this tab's work survives).

### 18.4 Conflict dialog (site changed elsewhere)
- **Where:** centred 440px card over a dark scrim; opened when the server rejects a save because another tab/device saved first. Only one at a time.
- **Title:** "**This site changed somewhere else**"
- **Body:** "**Your copy is behind — it was edited in another tab or device since you opened it. We can't auto-merge, so pick how to continue. Nothing is lost without your choice.**"
- **Buttons (right-aligned):** **"Reload latest"** (primary; discards local, reloads) · **"Save a backup"** (downloads your copy as a JSON file, then reloads) · **"Overwrite…"** (quiet) → reveals an amber warning "**Overwrite replaces the newer copy with yours. The other changes will be gone.**" and the button becomes red "**Yes, overwrite**" (forces your copy over the server's).
- The save pill reads "Conflict — reload" meanwhile.

### 18.5 Save toasts (manual ⌘S and autosave)
| Toast | Tone / action |
|---|---|
| **"Saved"** / "Project saved successfully" | success, 1.8 s (manual save only) |
| **"Saved — site settings didn't"** / "Your pages are on the server. The site-level settings were refused: <reason>" | warning |
| **"Offline — not saved"** / "Your changes are still open in this tab. Keep it open and save again once you're back online." | warning |
| **"Couldn't reach the server — not saved"** / "Your changes are still open in this tab. Keep it open and try saving again." | warning |
| **"Offline — saved on this device"** or **"Couldn't reach the server — saved on this device"** / "Your edits are in this browser and will go up when they can." | info (local-only projects without a site id) |
| **"Not saved — this site never loaded"** / "Saving now would overwrite the stored pages with what's on screen. Reload to get the real site first." (autosave variant: "Autosave is held back so it can't overwrite the stored pages. Reload to get the real site.") | warning, action **Reload** |
| **"This site isn't there anymore"** / "It was deleted, or it isn't yours to open — either way nothing can be saved to it." | warning, action **Go to dashboard** (manual) |
| **"You don't have access to save this site"** / "Your role changed, or the site isn't yours to edit. Ask the owner." | warning |
| **"Session expired"** / "Sign in again to save your changes. Keep this tab open." action **Sign in** | warning (fallback only when the session-expired dialog is not wired) |
| **"Save failed"** / one of: "Network error — check your internet connection and try again." · "Storage full — try clearing browser data or exporting your project." · "Permission denied — try refreshing the page." · "Request timed out — the server may be busy, try again shortly." · "Could not save project." (manual; action **Retry**) or "Could not save to dashboard. Changes are unsaved." (autosave) | error |

### 18.6 Sync-failure toasts (persistent until retried or the queue drains; each has a "Retry now" action)
- **"Some content changes didn't sync"** / "3 CMS changes are saved on this device but not yet on the server. Retry now, or leave it — a reconnect replays the queue." ("1 CMS change is …")
- **"A component didn't sync to the cloud"** / "It's saved on this device but not yet shared across your sites. Retry now, or leave it — a reconnect replays the queue."
- **"A saved version didn't sync to the cloud"** / "It's saved on this device but not yet on the server. Retry now, or leave it — a reconnect replays the queue."
- **"Template saved on this device only"** / "It didn't reach the server, so your other sites can't use it yet. Retry now, or leave it — a reconnect replays the queue."

---

## 19. Global modals hosted by the shell

(Export modal, Media Library, Image Editor, Icon Picker and Site Fonts are also mounted here but belong to the export/media modules.)

### 19.1 Create Component
- **Where:** large centred modal, title "**Create Component**", ✕. Opened from the Components panel "+" / "Create component", or the canvas right-click "Save as component". If nothing is selected when opened from the Components panel: info toast "**Select an element on the canvas first — a component is made from something.**"
- **Fields:** **Name \*** (placeholder "e.g., Hero Section", focused) · **Description** (textarea, "Optional description...") · **Category** ("e.g., Headers, Footers, Cards") · **Tags** ("e.g., responsive, dark-mode (comma-separated)", hint "Comma-separated tags for easier searching").
- **Variant Options** section: checkbox "**This is a variant set (has multiple variants)**"; when on, a grey panel "**Select variant properties:**" with toggle chips **Size** (S, M, L) · **State** (Default, Hover, Disabled) · **Theme** (Light, Dark) and hint "**You can configure variant values after creation**".
- **Pre-fill section:** checkbox "**Pre-fill from DS styles**" (on by default) with hint "**Lift matching values into token / preset bindings on save. Recommended.**" — or, from the canvas path, "**3 styles will bind to your DS tokens. Editing tokens later updates this component too.**" ("1 style will bind…").
- **Footer:** **Cancel** · **"Create component"** ("**Creating...**"; disabled until a name is typed). ⌘Enter submits.
- **Toasts:** "**Component "Hero" created successfully!**" · "**Component name is required**" · "**Failed to create component**" · "**Invalid state**" · "**Error: <message>**".

### 19.2 Create Collection (CMS, two steps)
- **Where:** centred modal; title "**Create Collection**" on step 1, "**Fields for <name>**" on step 2; ✕. A stray click on the scrim will not close it once anything has been typed.
- **Step bar:** pill "1" + "**Name & Type**", a rule, pill "2" + "**Fields**". The current step's pill is accent, a finished step's pill is green with a tick.
- **Caption:** "**A collection turns rows of data into pages — one page per row.**"
- **Step 1:** **Collection name \*** (placeholder "Blog Posts", focused) · **Content type** select: **Articles / Products / Team Members / Custom** · **Description (optional)** ("Describe the purpose of this collection…"). Footer: **Cancel** · **"Next: Add Fields"** (needs a name).
- **Step 2:** **NAME** (editable) · **FIELDS** list — each row: drag handle ⠿, field-name input ("field_name"), type select **Text / Number / Image / Date / Boolean**, trash icon ("Remove field"); starts with one "title" Text field; link "**＋ Add field**". A tinted block with a switch "**Generate a page per entry**" that reveals four inputs: "Slug pattern — /blog/{slug}", "Template page path — blog/_template/index.html", "SEO title — {title} — Blog", "SEO description — Read about {title}". Red error band on failure (e.g. "Collections are unavailable in this editor session."); green band "**Collection "Blog Posts" created successfully!**" then auto-closes after ~1.2 s. Footer: **Cancel** · **"Create Collection"**.

### 19.3 Records (CMS records manager)
- **Where:** wide centred modal titled "**<Collection> — 12 records**" ("Records" before load), ✕. Opened from CMS "manage records" doors.
- **Empty (no collections):** "**No collections yet. Create one from an element's CMS binding first.**"
- **Toolbar:** a collection select (280px).
- **Table (11px):** columns = the collection's first three fields + **Updated** + **Actions**. Image fields show "**✓ photo**" or amber "**— missing**"; booleans "Yes/No"; empty "—"; Updated "today" or "12 Sep". Empty body: "**No records yet.**" Row actions (22px bordered buttons): **Publish** / **Unpublish**, ✎ edit, 🗑 delete. A failed publish shows a red line under the row: "**Can't publish: <reason>**".
- **Notice** (amber) when the collection generates pages but nothing is published: "**No records published yet — this collection generates a page per entry, but dynamic pages won't generate until at least one record is published.**"
- **Footer:** "**＋ Add record**" (the design's "Import JSON" is not built).
- **Add/edit form:** one control per field (text/number/date inputs, textarea, select with "—", checkbox for booleans; required fields marked \*); red band "**Can't save: <reason>**"; buttons **"Add record"** / **"Save"** and **Cancel**.

### 19.4 Set Up Products Collection (e-commerce)
- **Where:** opened automatically the first time a Product Card / Product Grid / Product Detail block is inserted and no Products collection exists (asked once per session).
- **Contents:** shopping-bag icon; "**E-commerce blocks require a Products collection in your CMS. Would you like to create one now?**"; a bordered checkbox card "**Include sample products**" / "Add 3 example products to get started quickly"; three green checks: "**8 product fields (name, price, image, etc.)**", "**Validation rules included**", "**Ready for CMS data binding**".
- **Buttons:** **"Skip for now"** · **"Create Collection"** ("**Creating...**"). Toast "**Collection Created**" / "Products collection created with sample data" (or "Products collection created"). Error toast "**Collection setup failed**" + message.

### 19.5 Save page as template
- **Where:** large modal "**Save page as template**", ✕. Opened from a "save as template" request (Templates/Pages).
- **Fields:** **Template Name** ("My Template", focused) · **Description (optional)** ("Describe your template...", 3 rows). Hint: "**Tokens are snapshotted — applying it later re-maps them to that site's brand.**"
- **Buttons:** **Cancel** · **"Save template"** (needs a name). Toast "**Template saved**" / "<name> saved to My Templates" or "**Save failed**" / "Could not save template."

### 19.6 Upgrade Your Plan
- **Where:** centred modal "**Upgrade Your Plan**", opened when a feature needs a higher plan.
- **Contents:** a purple **PRO** badge (plan name); "**<Feature> requires the Pro plan.**" (or "This feature requires the Pro plan."); four green-check rows: **Custom domain · Premium templates · AI-powered features · Priority support**.
- **Buttons:** **"Maybe Later"** · **"Upgrade to Pro"** (opens dashboard billing in a new tab).

---

## 20. Onboarding (first-run)

Everything here is hidden in view mode and once the checklist is finished or dismissed. "Getting started" in the site menu brings it all back.

### 20.1 Rail coach mark
- **Where:** a dark 240px bubble with a left-pointing arrow, floating beside the rail level with its first item. Shown only while zero steps are done and it has not been dismissed.
- **Copy:** "**Everything you build lives behind these six.**" / "Insert sections, manage layers and pages, add media and content, and set your brand — all from this rail." · link "**Got it**" (dismisses permanently).

### 20.2 Getting-started chip and checklist
- **Minimised chip:** a 96×24 accent-tinted pill sitting in the footer band (right of centre, clear of the zoom readout): a 6px dot (accent; green when done) + "**0/7 done**" … "**7/7 done**" / "**All done!**". Always starts minimised. Click/Enter expands.
- **Expanded panel:** 320px wide, opens upward from the chip; max 540px tall.
  - **Header:** "**Get started**" (or "**You're all set**") with "**2/7**" at the right; a **−** minimise button and an **✕** close button. Close first asks inline: "**Hide this?**" **Yes** (red) / **No** — clicking elsewhere cancels.
  - **Progress bar** (2px, accent; green when complete).
  - **Steps** (accordion, one open at a time; the first incomplete step opens by default): a square checkbox (accent-filled with a tick when done; accent outline when active; grey outline otherwise), the label (struck-through and muted when done), and a chevron. The open step shows its description and a small primary button with →.
  - **All-done footer:** "**You've finished every getting-started step. Go build something great.**" + **"Close checklist"**.
- **The 7 steps:**

| Step | Description | Button | Completes when |
|---|---|---|---|
| **Set your brand** | "Pick a starter or set your six colours and two fonts in Brand — every block and template uses them." | Open Brand panel | a brand is applied |
| **Add your first page** | "Create a page — blank, or from a template." | Open Pages | the site has more than one page |
| **Add a block** | "Drop a ready-made block — hero, features, footer — from Add › Blocks onto the canvas. Blocks use your brand colours and fonts." | Open Add panel | a section-type block lands on the canvas |
| **Connect first client** | "Invite your client by email when you send the site for review — they get their own link." | Open Review | a review is sent **with** a client email |
| **Send for review** | "Send a review link so your client can approve the site or request changes." | Open Review | any review is sent |
| **Preview your site** | "Click Preview in the top bar to see your site on desktop, tablet, and mobile." | Open preview | the preview overlay is opened |
| **Publish** | "Connect your Vercel account once, then Publish deploys the site there and gives you its URL." | Publish now (opens the Publish panel) | a publish completes |

- Pressing a step's button never completes it — only the real outcome does. Steps already true when a site opens (extra pages, existing sections, an existing round) are pre-ticked. Progress is kept in the browser and mirrored to your account so it follows you across devices.
- The panel auto-minimises whenever you select an element (it would otherwise cover the inspector).

### 20.3 Step-complete prompt
- **Where:** a 380px centred card over a dimmed scrim, each time a step completes. Auto-dismisses after 4 seconds (a thin countdown bar across the top drains); clicking the scrim, the button, or Esc dismisses sooner.
- **Normal step:** accent disc with **✓**; kicker "**STEP COMPLETE**" (green); the step's label as the title; a bordered "**NEXT UP**" box with the next step's label and description; full-width accent button "**Continue →**".
- **Final step:** green disc with **★**; kicker "**ALL DONE**"; title "**You're all set**"; "You've finished every getting-started step. Go build something great."; green button "**Done**". Dismissing it retires the checklist.

---

## 21. Toasts from the shell (anatomy + catalogue)

- **Anatomy:** stacked bottom-right, 360px wide, 5 s by default, ✕ to dismiss ("Dismiss notification"), optional title, body and one action button. Tones: info (pale blue), success (green), warning (amber), error (red), and **dark** (ink card, used for undo/redo).

### 21.1 Undo / redo feedback (dark toasts)
- On undo: "**Undo: <what>**" with a **Redo** action (2.5 s; 4 s for deletes). On redo: "**Redo: <what>**" with an **Undo** action.
- Empty stack: "**Nothing to undo**" / "**Nothing to redo**" (2 s, no action). Un-undoable last action: "**Can't undo <reason> — it isn't recorded in history. Your earlier edits are still there.**"
- `<what>` is a past-tense phrase: Added element · Added block · Added component · Added template · Imported HTML · Inserted HTML · Applied generated layout · Applied an AI edit · Deleted element · Deleted layer(s) · Cut element · Duplicated element/layer · Pasted element · Pasted styles · Moved element(s) · Reordered layer/section · Brought layer to front · Sent layer to back · Grouped elements/layers · Ungrouped elements · Aligned horizontally/vertically · Distributed elements · Resized element · Changed style(s) · Fixed contrast · Changed a design token · Edited text · Changed link / link target / animation / interactions · Replaced media (across the page / across pages) · Synced component instances · Changed variant. Unknown labels are title-cased.

### 21.2 Editing feedback
- Delete key: "**Heading deleted**" / "**Section (3 children) deleted**" / "**3 elements deleted**" with **Undo** (5 s). Canvas-toolbar delete: "**<Type> deleted**" with **Undo**.
- Clipboard: "**Element copied**" / "**3 elements copied**" / "**Element cut**" / "**Element pasted**" / "**3 elements pasted**" / "**Element duplicated**" (2 s).
- Inserting a block from Add: "**Inserted: Hero**" (success, 2 s). Failures: "**Can't add Hero — text doesn't allow it. Try selecting a section or container first.**" (warning, 5 s) · "**Editor not ready. Please wait.**" · "**No active page. Please select a page first.**" · "**Page root element not found.**" · "**Block "X" not found in registry.**" · "**Error inserting block: <message>**".
- Export: "**Export complete**" / "Your site has been downloaded as a zip file." or "**Export failed**" / <message>.

---

## 22. View mode summary (what changes when `?view=readonly`)
- Top bar: "‹ Back to editing", site name, Comments only, bell, trimmed site menu (Exit view mode · View live site · Copy live URL). No save pill, live chip stays hidden, no CTA, no review pill actions beyond display.
- No rail, drawer, inspector, canvas toolbar, onboarding chip or coach. Page tabs stay (read-only). ⌘K is disabled. Editing keystrokes are refused by the engine.

---

# Canvas — the main editing surface

**What this module is.** The canvas is the big central area of the editor where the user's own web page is drawn at a chosen device width and zoom level. Everything the user does to the page visually happens here: hovering elements to see what they are, clicking to select, dragging the resize handles, double-clicking text to type into it, dragging new blocks in from the sidebar, dragging sections up and down, and toggling helper overlays (grid, rulers, snap guides, spacing, badges, X-ray). A floating toolbar sits at the bottom of the canvas with undo/redo, the breakpoint switcher, the overlay toggles and a help button. The canvas also owns three keyboard-driven popups: a command palette (⌘⇧P), a keyboard-shortcut cheat sheet (?), and an "Add element" picker. Context menus (right-click), the drag/drop and keyboard *logic*, and comment pins are covered in the sibling "canvas menus / hooks / comments" document; this one covers what the user sees.

Terminology used below: **accent** = the single product blue. **Element** = any block on the page (section, container, heading, image, button…). **Breakpoint / device** = the width the page is previewed at.

---

## 1. The canvas surface itself

- **Where it lives:** the centre column of the editor, between the left rail/drawer and the right inspector. Above it is the top bar; at its foot is the page-tab bar (separate module). Inside the column, the canvas area has 24px of soft grey padding all round, and the page is drawn on a white "sheet" with 12px rounded corners and a soft drop shadow.
- **Purpose:** render the user's page exactly as it will publish, at the chosen device width and zoom, and host every editing affordance on top of it.
- **Layout / contents (outer to inner):**
  1. A grey padded wrapper (does not scroll; it also anchors the floating footer toolbar so the toolbar never scrolls away).
  2. A scrolling viewport. The page sheet is centred inside it when it fits; when the sheet is wider than the column (e.g. Desktop at 1024px with a drawer open) the viewport scrolls horizontally and the sheet is left-aligned so nothing is stranded off-screen.
  3. Optional **device bezel** (phone/tablet mockup — see §4) wrapped around the sheet.
  4. The **page sheet**: white, rounded, shadowed; width/height set by the breakpoint (see §2); scales with zoom from its top-left corner; while something is being dragged over it, it gains an accent focus ring in addition to its shadow. It scrolls internally when the page is taller than it.
  5. The **page content** (the user's actual HTML) with 20px inner padding, plus a set of transparent overlay layers stacked on top (hover, selection, drop feedback, guides, rulers, grid, marquee, section handles, remote cursors, comment pins).
- **What the page content looks like on the canvas (editor-only decoration on the user's own elements):**
  - Every element shows a **move cursor** on hover (the page root does not). While being dragged, the element fades to 50% with a grabbing cursor.
  - A **selected element** gets a 2px solid accent outline offset 2px outside its box (the selection box in §9 draws on top of this).
  - A **locked element** (locked from the Layers panel) shows a 2px **dotted pink** outline and a not-allowed cursor; text inside cannot be selected. Locked + selected keeps the dotted pink outline.
  - A **hidden element** (hidden from the Layers panel) stays in the tree but is drawn at 25% opacity and ignores the mouse, so it can still be selected from Layers to un-hide.
  - An element **hidden for the current breakpoint** (via the inspector's per-breakpoint visibility toggle) disappears entirely on the canvas at that breakpoint and reappears when you switch breakpoint.
  - **Empty container / columns block** the user placed: a 60px-tall light-grey box with a 1px dashed mid-grey border, 8px radius, and centred muted 13px text "Drop a block here, or select this box and use +". (The page root never shows this — the empty page has its own first-run state, §5.) In view-only mode this hint and the dashed box are removed entirely.
  - **Rows / column blocks:** a row lays its columns out side by side with a 16px gap; each column is a light-grey dashed 8px-radius box with 16px padding and a minimum height of 60px; an empty column shows the word "Column" in accent 13px text.
  - **Image with no picture yet:** instead of the browser's broken-image icon, a 120×80 minimum slate-grey slab with a centred grey "picture" glyph. (An image *element* with no source shows a 100px-tall soft gradient rounded box.)
  - **Just-dropped element** fades in over 180ms with a 2px upward slide; a **newly created/duplicated element** flashes with a brief accent glow ring (0.4–0.5s) and a subtle "settle" scale bounce.
  - Hovering a row in the **Layers panel** highlights the matching element on the canvas with a 1px accent outline and a faint accent tint.
  - A **drop target while dragging** may show a green outline; when the target already has children a small green circular "+" badge (20px) appears centred under its bottom edge.
  - The user's **global custom CSS** (from Settings → Advanced) is applied live to the canvas, and element animations set from the inspector play on the canvas.
- **Cursors:** move over elements; crosshair everywhere during "pick an element" mode (§26); not-allowed over invalid drop targets and across the whole canvas while a drag has no valid destination; copy cursor + dashed accent outline + a small accent "+" badge at the top-right corner of the element while Ctrl/⌘-drag "clone mode" is active; text cursor inside an element being inline-edited; grab/grabbing on drag handles.
- **States:** normal; loading (§6); empty page (§5); project unavailable (§7); read-only/view mode (§29); drag-over (accent focus ring on the sheet); invalid-drop (not-allowed cursor).
- **Gating / notes:** In read-only (view/review) mode the canvas still renders, still lets you click and hover, but withholds every editing handler.

---

## 2. Breakpoints / device widths

- **Where it lives:** the page sheet's size is driven by the breakpoint switcher in the footer toolbar (§23). Switching animates the sheet's width/height over 0.3s.
- **Sizes drawn on the canvas:**

| Breakpoint | Switcher glyph / label | Sheet width × height on canvas | Tooltip text on the switcher |
|---|---|---|---|
| Wide | "W" / Wide | 1920px wide, full height | "Wide · preview width, uses Desktop styles" |
| Desktop | "D" / Desktop | fills the column but never narrower than 1024px; full height | "Desktop · ≥1024px" |
| Tablet | "T" / Tablet | 768 × 1024px | "Tablet · 768–1023px" |
| Mobile | "M" / Mobile | 375 × 812px | "Mobile · ≤767px" |
| Watch *(no UI door — legacy)* | — | 196 × 230px | — |

- **Notes:** Tablet/Mobile/Wide keep their real width even when the column is narrower (the viewport scrolls). Styles edited while on "Wide" are stored as Desktop styles. The status-bar footer (separate module) prints "Desktop · 100%" and owns the zoom flyout; the canvas just reacts.

---

## 3. Zoom

- **Range:** 10% – 400%. Presets: 10, 25, 50, 75, 100, 150, 200, 400. Step for "zoom in/out": 10% when triggered from the command palette; the footer-toolbar keyboard chords walk the preset list instead.
- **How it looks:** the sheet scales from its top-left corner over 0.3s; layout footprint shrinks with it so there is no dead scroll area.
- **Actions the canvas performs (triggered from the status-bar zoom flyout, the command palettes or keyboard):**
  - *Zoom to fit* — fits the whole page into the viewport with 64px breathing room, clamped 10–500%.
  - *Zoom to selection* — fits the selected element into the viewport (10–400%) and scrolls it to centre.
  - *Zoom to 100%*, *Zoom in*, *Zoom out*.
- **Keyboard shortcuts (active whenever focus is not in a text field and no modal is open):** ⌘1 fit · ⌘2 zoom to selection · ⌘0 100% · ⌘= / ⌘+ next preset up · ⌘- previous preset down.

---

## 4. Device frame mockup (phone / tablet bezel)

- **Where it lives:** wraps the page sheet when active; toggled by a small square icon button that sits in the footer-toolbar row (§23).
- **Purpose:** show the Mobile or Tablet preview inside a realistic dark device shell.
- **Layout:**
  - **Mobile shell:** 405 × 862 dark (ink-coloured) rounded shell (44px radius) with 30px top / 20px bottom / 15px side bezels; a 150×28 notch at the top with a small camera dot; a 134×5 translucent home indicator at the bottom; three thin side buttons on the left (silent switch + two volume) and one longer power button on the right. The screen inside is 375 × 812 with 38px radius and scrolls.
  - **Tablet shell:** 800 × 1064 dark shell (24px radius), 24/16/16 bezels, no notch, no home indicator; screen 768 × 1024, 16px radius.
  - **Desktop / Wide / Watch:** no frame (toggle button is hidden).
- **Toggle button:** 28×28, rounded 6px, a line-drawn phone or tablet icon (16px). Rest: grey icon on transparent; hover: faint white tint; active: accent icon on accent tint. Tooltip/label "Show device frame" / "Hide device frame".
- **States:** off (default), on.

---

## 5. Empty page — first-run call to action

- **Where it lives:** centred over the page sheet, only when the current page has no elements on it, the project has finished loading, and the project is available. Not shown in view-only mode.
- **Purpose:** give a first-time user two equal routes into building.
- **Layout:** one bold 16px sentence (semibold, tight tracking), then two buttons side by side with a 12px gap. Fades in with a 10px rise over 0.4s.
- **State A (nothing chosen yet):**
  - Sentence: **"Start with a template, or drop your first section."**
  - Primary button (accent, 32px tall): **"Browse templates"** → opens the Templates drawer.
  - Secondary light button (32px tall, 13px label): **"Start blank"** → opens the Insert/Add drawer and switches this CTA to state B.
- **State B (after "Start blank"):** buttons disappear; the sentence becomes **"Drop an element from the Insert panel, or drag a section."** As soon as anything lands on the page the CTA goes away; if the page is emptied again later it returns to state A.
- **Copy used:** as above. Screen-reader label: "Canvas is empty".

---

## 6. Loading state (site still arriving)

- **Where it lives:** over the page sheet while the project is loading and the page is still empty (replaces §5 during that window so nobody is invited to build over a site that is about to land).
- **Layout:** top-aligned stack of four full-width grey skeleton bars with 16px gaps and 24px padding: one short bar (56px tall) then three tall bars (104px each). The pulse uses a slightly darker grey than panel skeletons so it stays visible over white.
- **Copy:** screen-reader only — "Loading your site".

---

## 7. Project unavailable

- When the server reports the site is gone, the empty-page CTA is suppressed (the shell shows a banner above the canvas; that banner belongs to the shell module). The canvas shows just the empty sheet.

---

## 8. Hover outline and label

- **Where it lives:** drawn over whichever element the mouse is over, as long as that element is not the selected one and nothing is being dragged, resized, or inline-edited.
- **Purpose:** tell the user what they are pointing at before they click.
- **Three escalation levels:**

  **Level 1 — default hover**
  - 1px dashed pale-accent outline hugging the element (2px radius).
  - A small label pill 18px above the element's top-left: light-grey background, 12px medium dark text = the element's friendly name (see §28 naming table), 90% opacity.
  - A tiny **drag grip** just left of the element, vertically centred: an 8×8 accent square (2px radius) with a 2×2 grid of white dots. Hover turns it darker accent with a focus ring; grab/grabbing cursor. Mouse-down on it starts a drag of that element. Label for screen readers: "Drag to move element".
  - If Ctrl/⌘ is held: a **clone badge** — an 18px green circle with a white "⊕" at the element's top-right corner (meaning "drag will duplicate").

  **Level 2 — hold Alt while hovering ("hierarchy")**
  - 1px solid accent outline.
  - A dark pill 28px above the element (near-black, 12px text, soft shadow): "*Parent name* › **Element name**" — the parent dimmed, the current element bold in pale accent. (Only one parent level is ever shown.)
  - The full-size drag grip: 16×24 accent rounded rectangle with a 2×3 grid of white dots, 20px left of the element.
  - Clone badge as above when Ctrl/⌘ is held.

  **Level 3 — hold Alt+Shift while hovering ("box model", DevTools-style)**
  - Translucent coloured boxes painted over the element: **orange** margin areas outside it, **green** padding areas inside it, **blue** content area; plus a 1px solid accent outline.
  - Small monospace value chips (10px, orange for margin, green for padding) centred on the top and bottom margin/padding bands showing the pixel value (e.g. "16").
  - A dark **info badge** (#3b3b3b, white 12px text) above the element, two lines: line 1 = friendly name in bold pale-accent, then optional glyphs: 🔗 (has a link), 📊 (CMS-bound — note: this check looks for an attribute the CMS preview never sets, so in practice this glyph does not appear), a small accent tag "flex→" / "flex↓" or "grid" if the element is a flex/grid container. Line 2 = "in *Parent name*" (muted), the element's size in cyan monospace "W × H", and its first CSS class in yellow (".hero").
  - For text elements an extra accent hint pill under the bottom-right corner: **"Double-click to edit"**.
  - Full-size drag grip and clone badge as in level 2.
  - A persisted "Inspector mode" flag would force level 3 permanently, but the button that toggles it (an "Inspect / Minimal" eye button, "I" key) is not mounted anywhere in the current editor, so Alt+Shift is the only door. *(Unreachable today.)*

- **Interaction with other panels:** hovering on the canvas also highlights the matching row in the Layers panel.

---

## 9. Selection box, resize handles, rotation, size label, badges

- **Where it lives:** over the selected element(s). Hidden entirely in view-only mode.
- **Single selection:**
  - 2px solid accent border 1px outside the element (3px radius) with an accent focus glow.
  - **Eight resize handles** (white squares with a 2px accent border, 2px radius, soft glow; they spring-scale slightly on hover):
    - 4 **corner** handles (8×8) always: top-left, top-right, bottom-left, bottom-right. Cursors: diagonal resize.
    - **Top and bottom edge** handles (24×8 pills, centred) only when the element is wider than 50px. Cursor: vertical resize.
    - **Left and right edge** handles (8×24 pills, centred) only when the element is taller than 50px. Cursor: horizontal resize.
    - Each handle is keyboard-focusable and reads as e.g. "Resize from top-left corner".
  - **Rotation handle:** a 1px accent stem rising 24px from the top-centre of the box, ending in a 12px white circle with a 2px accent border (grab cursor). Tooltip: "Drag to rotate (Shift for 15° snap)". Reads to screen readers as a slider 0–360 with the current angle.
  - **Size label while resizing:** an accent pill centred 8px below the box, white 11px monospace text "W × H" (rounded pixels). While resizing, the floating toolbar (§10) hides and the compact selection label (§11) shows instead; hover outlines are suppressed.
  - **Resize behaviour the user feels:** dragging any handle live-updates the element; **Shift** keeps the aspect ratio (images, videos and icons *always* keep it); **Alt** resizes from the centre; **Ctrl** temporarily flips grid snapping; **Esc** cancels and restores the original size. Edges snap to other elements' edges and centres within 5px, to ruler guides, and to the grid when "Snap to grid" is on in project settings / ⌘K. The element cannot grow past its parent's box or the page. Minimums: default 10×10; image 20×20; video 100×60; icon 16×16 (max 256); button 40×24; input 60×24; container 40×40; text 20×16. Rotation snaps to every 15° when Shift is held (and gently to 15° multiples within 5° otherwise). Each resize/rotation is one undo step; body cursor switches to the matching resize cursor for the whole drag.
  - **CMS-bound badge:** if the element has a CMS binding, a 20px accent circle with a white "database" glyph sits at the box's top-left corner (tooltip "Element has CMS binding").
  - **Locked badge:** for a locked element the resize and rotation handles are hidden and a 16px amber circle with a white padlock sits centred 20px above the box (tooltip "Element is locked. Unlock in Layers panel.").
- **Multi-selection (2+ elements):**
  - One combined bounding box with a 1px **dashed** pale-accent border (no glow).
  - Each member gets its own thin outline: the **primary** element 1px solid accent with glow, the others 1px dashed pale-accent.
  - Resize handles are drawn on the combined box; no rotation handle; no CMS/locked badges.
  - The **alignment toolbar** (§13) floats 48px above the combined box, centred.
  - The floating selection toolbar (§10) is hidden; the compact selection label (§11) shows for the primary element.

---

## 10. Floating selection toolbar (single selection)

- **Where it lives:** a 28px-tall pill 36px above the selected element's top-left (flips to below the element if there is no room above; never closer than 8px to the canvas edge). Light-grey background, 1px border, 8px radius, drop shadow, blurred backdrop. Hidden while resizing, in multi-select, and in view-only mode.
- **Purpose:** the most common element actions, right where the selection is.
- **Layout, left to right:**
  1. **Select parent** (24×24 icon button, chevron-up) — only when the element has a parent. Tooltip "Select Parent · ←". Click selects the parent.
  2. **Element name chip** — the element's type capitalised ("Section", "Heading", "Image"…), 12px medium, truncated at 100px, with a small chevron-down if it has ancestors. Click opens the **ancestor dropdown** (below the chip, min 140px, white card with shadow): one row per ancestor from nearest to furthest, each indented 8px more than the last, prefixed with a faded "↑". Clicking a row selects that ancestor. Closes on outside click. Screen-reader label "Show element path".
  3. Divider.
  4. **Add** (+ icon). Tooltip "Add Element". Opens the **Add Child Element** picker modal (§10a) to insert a new block *inside* this element.
  5. **Duplicate** (two-squares icon). Tooltip "Duplicate · ⌘D". Duplicates and shows toast "Element duplicated" with an **Undo** action.
  6. Divider.
  7. **More** (⋯). Tooltip "More". Toggles a dropdown (right-aligned) with:
     - **Copy** — copies the element to the editor clipboard; toast "*Type* copied to clipboard" (2s).
     - divider
     - **Wrap in Container** — wraps the element in a new container.
     - divider
     - **Bring Forward** — moves it one step later among its siblings.
     - **Send Backward** — moves it one step earlier.
  8. **Delete** (trash icon) — visually separated at the far right by a 12px gap and a divider line, slightly smaller (22×22), muted colour. Tooltip "Delete · ⌫". Deletes and shows a 5s toast "*Type* deleted" or "*Type* (N children) deleted" / "(1 child)" with an **Undo** action.
  9. **Edit with AI** (sparkles icon, 14px, pressed state while open). Toggles the AI popover (§10b).
- **Notes:** the toolbar absorbs clicks so clicking it never deselects. Right-click context menus are covered in the sibling document.

### 10a. "Add element" picker modal (from the + button)

- **Where it lives:** centred modal, 380px wide, up to 80% viewport height, rounded 12px, panel background, strong shadow, scale-in animation. Standard modal overlay, focus trap, Esc closes.
- **Layout:** header row with the title and a ✕ close button (18px icon); a search row with a small magnifier icon and a text field (placeholder **"Search elements..."**, auto-focused); then the same Elements list the Insert drawer shows (filtered by the search).
- **Titles:** "Add Child Element" (from the toolbar). The same modal can also be titled "Add Element Before" / "Add Element After" when opened for sibling insertion.
- **Flow:** click a block → it is inserted (as the last child of the selected element) in one undo step, the new element becomes selected, the modal closes. If the block is not allowed inside this element type, the modal simply closes with no insertion (no message).

### 10b. "Edit with AI" popover

- **Where it lives:** a 248px card anchored directly under the selection toolbar (36px below its top), panel background, border, 8px radius, drop shadow. Dialog label "AI edit".
- **States:**
  1. **Prompt:** a 2-row textarea (auto-focused) with placeholder **"Describe a change… e.g. make this dark"**; a right-aligned primary button **"Generate"** (disabled until text is typed). Enter submits; Shift+Enter makes a new line.
  2. **Thinking:** muted 11px text **"Thinking…"**.
  3. **Diff:** a list of proposed style changes, one row each: property name (monospace muted), old value struck through, new value in monospace; then two buttons — light **"Discard"** and primary **"Apply"**. Apply writes the change as one undo step and closes.
  4. **Error:** red 11px error text (whatever the AI service returned).
- **Esc** closes from any state. Clicks inside do not deselect the element.
- **Gating:** requires the AI service to be configured; otherwise the error state shows.

---

## 11. Compact selection label (shown only while resizing or in multi-select)

- **Where it lives:** 32px above the selected element's top-left, a small dark rounded bar with a panel shadow.
- **Layout:** optional **parent button** (24×24, up-arrow, accent tint; tooltip "Go to parent: *Parent name* (Alt+↑)"), then the **element name button** with a type glyph in front (□ container, ▭ section, ⫿ row, ⫾ column, H heading, ¶ paragraph, T text, 🖼 image, ⬜ button/input, 🔗 link, ▶ video, 📋 form, ☰ nav, ▤ header/footer, ⟨⟩ span, ◇ anything else) and a chevron if it has ancestors.
- **Ancestor dropdown:** rows for every ancestor from the page root downwards, indented 12px per level, each with its glyph; the final row is the current element highlighted in accent tint with the word "current" at the right. Clicking an ancestor selects it.

---

## 12. Bottom breadcrumb bar

- **Where it lives:** a translucent dark bar (75% ink, blurred backdrop, 8px radius) pinned across the bottom of the page sheet, 56px up from the sheet's bottom so the footer toolbar does not cover it. Shown whenever one element is selected and nothing is being dragged or resized.
- **Layout:** left: a row of small pills separated by "›" — first pill **"Canvas"** (white, disabled), then one pill per ancestor down to the selected element. Pills are white with muted 11px text; the **current** element's pill is filled accent with white medium text. If an element has been given a custom name in the Layers panel the pill reads "*Type* · *Name*" (e.g. "Section · Hero"). Right side: two hints in light grey 11px text: **"← Parent"** and **"→ Child"**.
- **Actions:** click any non-current pill to select that ancestor.

---

## 13. Multi-select alignment toolbar

- **Where it lives:** floating 48px above the combined multi-selection box, centred. Rounded (large radius) light gradient panel with blur, border and shadow; 32×32 icon buttons in three groups separated by dividers.
- **Buttons (icon · tooltip):**
  - Horizontal: ⫷ "Align Left (Ctrl+Shift+L)", ⫿ "Align Center Horizontally (Ctrl+Shift+C)", ⫸ "Align Right (Ctrl+Shift+R)"
  - Vertical: ⊤ "Align Top (Ctrl+Shift+T)", ⊖ "Align Middle Vertically (Ctrl+Shift+M)", ⊥ "Align Bottom (Ctrl+Shift+B)"
  - Distribute: ⋯ "Distribute Horizontally (Ctrl+Shift+H)", ⋮ "Distribute Vertically (Ctrl+Shift+V)" — **disabled (40% opacity, not-allowed cursor)** with 2 elements; tooltip gains " (Need 3+ elements)". Enabled with 3+.
- **Behaviour:** aligns/distributes by setting each element's left/top position (works meaningfully on absolutely positioned elements); one undo step per click. Hover: darker background.
- **Note:** the shortcuts printed in these tooltips are labels only — they are not bound by this toolbar. The inspector's multi-select state also carries an identical Align ×6 / Distribute ×2 row (separate module).

---

## 14. Marquee (lasso) selection

- **Where it lives:** drawn on the canvas when the user presses on empty canvas (not on an element, toolbar, label, breadcrumb, alignment toolbar or context menu) and drags.
- **Look:** a rectangle with a 1px accent border, 15% accent fill, 2px radius, updated as the mouse moves.
- **Behaviour:** once the drag exceeds a small minimum distance the existing selection is cleared; on release every element intersecting the rectangle becomes selected (multi-select, §9). Not available while inline-editing, while dragging an element, or while a drop is in progress.

---

## 15. Inline text editing on the canvas

- **Trigger:** double-click a text-bearing element that has no nested elements (paragraph, span, link, button, label, list item, headings h1–h6, table cells, figcaption, blockquote, cite, strong, etc.). Not available in view-only mode.
- **Look on the element:** 2px solid accent outline (2px offset), faint accent tint background, text cursor, accent caret, 2px radius; text selection highlights in translucent accent. If the element is emptied it shows an italic muted placeholder **"Type here..."**.
- **Floating rich-text toolbar:** appears 52px above the element (never closer than 8px to the canvas edge), panel background, 1px border, 8px radius, 4px padding. Controls left to right:
  1. **Text style** dropdown: Paragraph, Heading 1–6.
  2. **Font size** dropdown: 10px, 13px, 16px, 18px, 24px, 32px, 48px.
  3. divider · **B** Bold · *I* Italic · U̲ Underline · S̶ Strikethrough (active state = accent fill, white glyph)
  4. divider · • Bullet List · 1. Numbered List
  5. divider · ⬅ Align Left · ⬌ Align Center · ➡ Align Right · ☰ Justify
  6. divider · ⇤ Decrease Indent · ⇥ Increase Indent
  7. divider · **Text color** (an "A" underlined in accent; opens a colour field popover titled "Text Color") · **Highlight color** (an "A" on an amber block; popover "Highlight Color")
  8. divider · 🔗 **Insert link** — popover 250px wide with a text field (placeholder "https://...") and two buttons: light **"Remove"** (unlinks) and primary **"Apply"**.
  9. ✕ **Clear Formatting**.
  Every button has a tooltip with its name. Clicking the toolbar keeps the caret and selection inside the text.
- **Ending the edit:** click elsewhere / blur commits (the typed markup is sanitised); Esc cancels and restores. Hover outlines, marquee and drop feedback are all suppressed while editing.

---

## 16. Drag-and-drop feedback on the canvas

(What is shown while a block from the sidebar, an existing element, a media asset or an OS file is dragged over the page. The drag mechanics live in the sibling document.)

- **Page sheet:** gains an accent focus ring while anything hovers over it.
- **Target highlight:** the element under the pointer gets a full-size overlay box: **valid** = 2px dashed accent border with an accent tint fill; **invalid** = 2px solid red border with a red tint fill (4px radius, 150ms colour transition).
- **Insertion line** (for "before"/"after" placements): a 3px accent bar (red when invalid) running the target's width plus 4px each side, at the target's top or bottom edge, with an 8px round **dot at each end** so it reads as an insertion point. Fades/scales in over 150ms.
- **Slot preview** (valid drops only): a dashed accent rounded box with accent tint showing where the new element will occupy space, growing in vertically (or horizontally inside rows) over 150ms.
- **Destination label** (valid): a dark pill just right of the target's top-right corner, 12px white-on-ink: **"Insert inside *Target*"**, **"Insert before *Target*"** or **"Insert after *Target*"**.
- **Invalid badge** (invalid): a red pill at the same spot with one of:
  - "Cannot have children"
  - "Text cannot contain elements"
  - "Cannot drop inside itself"
  - "Cannot drop inside child"
  - "Max depth reached"
  - "Already in position"
  - "Not allowed here"
  - "Cannot nest interactive"
  - "Cannot place here"
  - fallback "Cannot drop here"
  The same message is announced to screen readers.
- **Drop path pill** (valid, nested 2+ levels): a dark 28px-tall pill 34px above the target: **"Drop inside:"** then the chain "Section › Container › **Column**" (current bold, others dimmed, "›" separators), max 300px wide.
- **Level badge** (valid, nested 3+ levels): a small light pill under the target's bottom-right corner reading **"Level N"**.
- **Cursor:** not-allowed over invalid targets and across the canvas while no valid target exists; copy cursor in clone mode.
- **After a successful drop:** no toast (the new element appears, flashes, and becomes selected; "Inserted: *Label*" is announced to screen readers only). An OS-file drop that must upload first shows an info toast **"Uploading *file.png*..."** (4s); when it lands, "*file.png* applied ✓" is announced. A media asset dropped onto an existing element announces "*Name* applied ✓" / "*Name* added ✓".
- **Drop errors:** a warning toast (3s) with the error message.
- **Section handles and hover outlines are hidden during a drag; the bottom breadcrumb hides too.**

---

## 17. Section reorder handles

- **Where it lives:** at the left edge of the page (4px in), vertically centred on the boundary between two top-level sections. Only exist when the page has 2+ sections; there is no handle above the first section.
- **Look:** a 24×24 accent rounded square with a 2×3 grid of small white dots. Invisible (0 opacity, slightly shrunk) until the mouse enters a 48×40 hit area around the boundary, then fades/scales in. Grab cursor; grabbing while dragging.
- **Behaviour:** mouse-down and drag vertically moves the section; a 3px accent-hover **drop line** with a soft accent glow slides between sections to show the destination (it animates its position over 150ms). Release drops; **Esc** cancels. Screen-reader label "Drag to reorder section N".

---

## 18. Snap / smart alignment guides

- **Where it lives:** thin lines drawn over the page while an element is being dragged or resized, only when the **Snap Guides** overlay toggle is on (default on).
- **Two kinds:**
  - **Alignment guides — magenta (#FF00FF), 1px, 85% opacity with a faint glow.** Drawn when the dragged element's left/right/top/bottom edge or centre comes within 5px of another element's edge or centre; the line spans both elements plus 10px. The element snaps to that position.
  - **Spacing indicators — red (#E02424), 1px** with an 11px red value label (e.g. "60") centred on the line: shown when the gap to a sibling equals another gap ("equal gap") or when the distance to the parent's padding edge matches ("parent padding").
- Lines stay 1px thick at any zoom. Ruler guides (§19) also act as snap targets.

---

## 19. Rulers and user-placed guides

- **Where it lives:** enabled by the **Rulers** toggle (⌘R). A 20px horizontal ruler across the top of the page sheet, a 20px vertical ruler down the left, and a 20px blank corner square at top-left; all in the panel background colour.
- **Look:** tick marks every 10px (5px long), major ticks every 100px (10px long) with the pixel number in 10px muted text (rotated on the vertical ruler). Ticks scale with zoom so numbers always read in page pixels. Hovering a ruler shows a 2px translucent accent line under the cursor. Pointer cursor.
- **Actions:**
  - **Click a ruler** to create a guide at that position (horizontal guide from the top ruler, vertical from the left).
  - **Drag a guide** (8px grab zone, ns/ew resize cursor) to move it; while dragging it is fully opaque with a glow.
  - **Double-click a guide** to remove it.
  - A locked guide shows a not-allowed cursor and cannot be moved.
- **Look of a guide:** 1px accent line at 80% opacity across the full sheet. Guides only render while Rulers are on. (Guides from the engine's guide list also render as pale-blue lines when Snap Guides is on; the "centre guides" default is turned off on the canvas.)

---

## 20. Grid overlay

- Enabled by the **Grid** toggle (⌘'). A faint accent-tinted line grid (10px cells by default) over the whole sheet, matching the sheet's rounded corners, non-interactive. Grid *snapping* during resize/drag is a separate project setting ("Snap to grid", also in the ⌘K palette).

---

## 21. Spacing indicators ("spots")

- **Where it lives:** over the selected element when the **Spacing** toggle (⌘⇧;) is on. Spacing auto-turns on the first time something is selected, until the user has toggled it manually once.
- **Look:** one dashed 2px box per non-zero margin and padding side — margins outlined in teal-green, paddings in dark accent — with a faint dark tint that turns solid-bordered and darker on hover. Each box wider and taller than 20px carries a centred value chip ("16px"), green for margin, accent for padding, white bold 12px text with a shadow.
- **Actions:** click a box to edit its value inline — the chip becomes a small 50px numeric field (auto-focused). Enter or blur commits the new pixel value to the element's style; Esc cancels.

---

## 22. Overlay view modes on the page content

| Mode | How it is turned on | What the user sees |
|---|---|---|
| **X-Ray** | footer "X-Ray" toggle / ⌘⇧X | Wireframe mode: every element gets a 1px grey outline, all fills/background images/shadows removed, text recoloured to soft ink so it survives losing its background; images and videos drop to 15% opacity in greyscale. |
| **Badges** | footer "Badges" toggle / ⌘B | Hovering an element shows a tiny accent chip with white 11px semibold capitalised type name ("Section", "Image") at its bottom-right corner — one at a time. |
| **Component view** | ⌘K command "Toggle component view" (Ctrl+Shift+C) — not on the footer bar | Every element gets a 1px dashed accent outline and a small dark chip above its top-left with the type name in accent 11px semibold (all at once). |
| **Outlines** | *(no UI door — default off)* | Would draw 1px dashed pale-accent outlines on every element, solid accent on containers/sections/rows/columns. |
| **Dev mode** | *(no UI door)* | Intended to force the level-3 box-model hover; currently unused by the overlay. |

---

## 23. Canvas footer toolbar

- **Where it lives:** floating across the bottom of the canvas column (pinned to the padded wrapper, so it never scrolls away), left-aligned, wrapping to a second row when the column is narrow. White, 1px light-grey border, 8px radius, drag shadow, 40px minimum height, 16px side padding. Hidden in view-only mode. To its right in the same row sits the device-frame toggle (§4).
- **Layout, left to right (groups separated by 1px × 20px dividers):**
  1. **Undo** (28×28 icon, curved-arrow-left). Tooltip "Undo · ⌘Z". Disabled when nothing to undo.
  2. **Redo** (curved-arrow-right). Tooltip "Redo · ⌘⇧Z". Disabled when nothing to redo.
  3. **Breakpoint switcher**: a segmented well (light grey, 1px border, 8px radius) with four 32×24 cells "W" "D" "T" "M"; the active one is filled accent with white semibold text; rest state muted grey text, darkens on hover. Tooltips as in §2 ("Wide · preview width, uses Desktop styles", "Desktop · ≥1024px", "Tablet · 768–1023px", "Mobile · ≤767px").
  4. divider
  5. **Overlay toggles** — word buttons (28px tall, 11px text). Off: muted medium text, hover light-grey; On: light-grey pill with dark semibold text. Each has a tooltip "*Label* · *shortcut*":
     - **Snap Guides** · ⌘;  (default on)
     - **Spacing** · ⌘⇧;
     - **Grid** · ⌘'
     - **Rulers** · ⌘R
     - **Badges** · ⌘B
     - **X-Ray** · ⌘⇧X
     - **Inspector** (no shortcut) — shows/hides the right inspector column; "on" = inspector visible.
  6. divider
  7. **Help** (28×28, circled "?" icon). Tooltip "Keyboard shortcuts · ?". Opens the cheat sheet (§25).
- **Keyboard shortcuts bound by this bar** (ignored while typing in a field or when a modal is open): ⌘; ⌘⇧; ⌘' ⌘R ⌘B ⌘⇧X toggle the overlays above; ⌘1 fit, ⌘2 zoom to selection, ⌘0 100%, ⌘=/⌘+ zoom in a preset, ⌘-/⌘_ zoom out a preset. (⌘R deliberately overrides browser reload; ⌘⇧R and F5 still reload.)

---

## 24. Canvas command palette (⌘⇧P)

- **Where it lives:** a centred dialog 20% from the top of the window, 520px wide (max 90vw), max 60vh tall, card background, 1px border, 12px radius, overlay shadow, over a 50% black backdrop. Not available in view-only mode. Distinct from the shell's ⌘K palette.
- **Layout:**
  - Search field (auto-focused): placeholder **"Type a command or search..."** (12px).
  - Scrolling list grouped under uppercase 11px headers in fixed order **EDIT, VIEW, INSERT, TOOLS**. Rows are plain 11px text (no icons); the highlighted row has an accent tint background and accent text. A row you have used recently carries a small grey **"Recent"** chip and sorts to the top of its group (last 5 remembered). Rows that need a selection show **"(Select an element first)"** in light grey and are dimmed to 45% when nothing is selected. Shortcut printed at the right of a row in light grey (⌘/⌥/⇧/⌫ on Mac; Ctrl/Alt/Shift/Del elsewhere).
  - Empty search: **"No commands found"** (centred, muted).
  - Footer hints: **"↑↓ Navigate" · "↵ Select" · "Esc Close"** and, right-aligned, **"N commands · distinct from shell ⌘K"**.
- **Keys:** ↑/↓ move, Enter runs, Esc closes, click backdrop closes, hover highlights a row.
- **Commands:**

| Group | Label | Shortcut shown | Needs selection | What it does |
|---|---|---|---|---|
| Edit | Undo | ⌘Z | | undo |
| Edit | Redo | ⌘⇧Z | | redo |
| Edit | Duplicate | ⌘D | yes | duplicate selection |
| Edit | Delete | ⌫ | yes | delete selection |
| Edit | Select all | ⌘A | | select every element |
| Edit | Deselect all | Esc | | clear selection |
| View | Zoom in | ⌘+ | | +10% |
| View | Zoom out | ⌘− | | −10% |
| View | Zoom to fit | ⌘1 | | fit page |
| View | Toggle layers panel | | | show/hide Layers |
| View | Preview site | ⌘P | | open preview |
| Insert | Add text | | | inserts a text element |
| Insert | Add image | | | inserts an image element |
| Insert | Add button | | | inserts a button |
| Insert | Add container | | | inserts a container |
| Tools | Manage CMS records | | | opens CMS records |
| Tools | Save page as template | | | starts save-as-template |
| Tools | Start collaboration session *(behind flag — hidden unless collab is enabled; never in production)* | | | starts a live session |
| Tools | Browse templates | T | | opens Templates |
| Tools | Open analytics settings | | | Settings → Analytics |
| Tools | Open page settings (SEO, slug, status) | | | opens the Pages tab |
| Tools | Open export settings | | | Settings → Export |
| Tools | Open integrations | | | Settings → Integrations |
| Tools | Open media library | | | opens Assets tab |
| Tools | Replace selected media | | yes | asks the media library to replace the selected image/element |
| Tools | Search stock photos | | | opens Assets tab |

---

## 25. Keyboard shortcuts cheat sheet ("?")

- **Where it lives:** a large centred modal, min(900px, 90vw) wide, max 85vh, panel background, rounded, bordered, scale-in animation. Opened by pressing **?** (outside text fields), by the footer Help button, or by the shell's ⌘K "Keyboard shortcuts" command. **?** or **Esc** or the ✕ button closes.
- **Layout:**
  - Header: "⌨️ **Keyboard Shortcuts**" (16px semibold) and a ✕ close button (32×32, hover grey).
  - A search field: placeholder **"Search shortcuts…"** — filters rows by description, keys or group name; if nothing matches: **"Nothing matches “*query*”."**
  - A scrollable, keyboard-focusable grid of group cards (auto-fit, min 280px wide, 24px gaps; each card light-grey with 16px padding, an uppercase accent group title, and rows of "description … key badges"). Key badges: 24px-tall grey chips with a 1px border and subtle shadow.
  - Footer: "Press **?** or **Esc** to close" · "Pro tip: **⌘ ⇧ P** opens command palette".
- **Contents:**

| Group | Keys | Description |
|---|---|---|
| Selection | Click | Select element |
| | Double-click | Select child / deep select |
| | Triple-click | Select innermost element |
| | ⌘ Click | Cycle through overlapping |
| | ⇧ Click | Add to selection |
| | ⌘ A | Select all elements |
| | Escape | Clear selection |
| | Tab / ⇧ Tab | Next / Previous element |
| Navigation | ↑ / ↓ | Select previous / next sibling |
| | ← / → | Select parent / first child |
| | Home / End | Select first / last sibling |
| Positioning | ⇧ ↑/↓/←/→ | Move element 10px |
| | ⌘ ↑/↓/←/→ | Move element 1px |
| | ⌥ ↑ / ⌥ ↓ | Reorder up / down in DOM |
| | ⌥ Home / ⌥ End | Move to first / last position |
| Editing | ⌘ C / ⌘ ⌥ C | Copy element / Copy styles only |
| | ⌘ V / ⌘ ⌥ V | Paste element / Paste styles |
| | ⌘ X | Cut element |
| | ⌘ D | Duplicate element |
| | Delete | Delete element |
| | ⌘ Z / ⌘ ⇧ Z | Undo / Redo |
| View | ⌘ + / ⌘ − | Zoom in / out |
| | ⌘ 0 / ⌘ 1 / ⌘ 2 | Zoom to 100% / Zoom to fit / Zoom to selection |
| | ⌘ ⇧ P | Canvas command palette |
| | ⌘ K | Command palette |
| | ? | Show this cheat sheet |
| | ⌘ / | App shortcuts panel |
| Context Menu | Right-click | Open context menu |
| | ⇧ F10 | Open context menu (a11y) |

---

## 26. "Pick an element" mode (from the inspector / Content tab crosshair)

- When the inspector's crosshair button (or the Content tab's pick action) is pressed, the whole canvas — page, gaps and elements alike — switches to a **crosshair cursor**. The next click anywhere on the canvas selects the element under the pointer and hands it back to the panel that asked; the mode ends. **Esc** cancels. Locked elements can be picked (picking reads, it does not edit).

---

## 27. Remote collaborator cursors (collaboration — behind flag)

- When a collaboration session is active, each other user's pointer is drawn on the canvas as a 16px arrow filled in that user's colour with a white edge and a drop shadow, plus a small rounded name tag (12px white text on the user's colour, max 120px, truncated) offset to the arrow's lower right. Cursors glide with a 0.1s ease. Off-canvas positions are hidden; a user leaving removes their cursor. *(Collaboration is demo-only and never enabled in production.)*

---

## 28. Element friendly names used on hover/selection/breadcrumbs

| Type | Shown as | | Tag fallback | Shown as |
|---|---|---|---|---|
| container | Container | | div | Div |
| section | Section | | h1–h6 | Heading 1 … Heading 6 |
| row / column | Row / Column | | p | Paragraph |
| heading / paragraph / text | Heading / Paragraph / Text | | a | Link |
| image / video | Image / Video | | img | Image |
| button / link / input / form | Button / Link / Input / Form | | ul / ol / li | List / Ordered List / List Item |
| nav / header / footer / main | Navigation / Header / Footer / Main | | table | Table |
| aside / article | Sidebar / Article | | iframe | Embed |
| span | Span | | anything else | capitalised tag name |

A custom name set on the element wins over all of these.

---

## 29. Read-only / view mode (review links)

- The canvas still draws the page, still shows hover outlines and lets you click/select, but: no double-click text editing, no drag-and-drop, no right-click menu, no Delete/⌘Z/⌘D keys, no selection box/handles, no floating toolbar, no command palette (⌘⇧P does nothing), no footer toolbar, no empty-page CTA, no "Drop a block here" hints on empty containers, and the shell's selection readout/size, review bar and onboarding checklist are hidden. Comment pinning still works (separate document).

---

## 30. Accessibility notes visible to assistive tech

- One polite live region announces selection changes and "Inserted: *Label*" after each drop (repeats are re-announced). Drop-invalid messages are announced assertively. Every handle, grip, badge and toolbar button has a spoken name.

---

## 31. Legacy / unreachable pieces in this module (for awareness only)

- A three-button **Desktop 🖥️ / Tablet 📱 / Mobile 📲** device selector (tooltips "Desktop (1920px)", "Tablet (768px)", "Mobile (375px)") exists but is used only inside the template preview, not on the canvas.
- An **"Inspect / Minimal" eye toggle** with an "I" shortcut (tooltip "Inspector: ON/OFF (Press I to toggle)") is not mounted anywhere.
- A set of older styled pieces (a top-right multi-select count badge with a clear ✕, a legacy dark full-width breadcrumb, gradient resize handles) is no longer rendered; only the grid pattern from that set is still used.

---

# Canvas interactions — right-click menu, drag & drop, keyboard, comments, collaboration

**What this module is.** Everything a user does *directly on the page preview in the middle of the editor* that is not a panel or a toolbar: the right-click menu on an element, dragging things from the side panels onto the page, dragging page elements around to re-order or re-nest them, every keyboard shortcut that works while the page has focus, the "leave a comment pinned to the page" mode, and the (demo-only) real-time collaboration presence: avatars, remote cursors, connection state.

Vocabulary used below:
- **Page body** = the invisible outermost box of the page. Everything on the page is inside it. It cannot be moved, deleted, cut, wrapped or dragged.
- **Element** = any single thing on the page (a heading, an image, a section, a button…).
- **Section-shaped element** = Container, Section, Hero, Features, Header, Footer, Nav, Navbar, CTA, Card, Pricing, Columns, Grid, Flex.
- **Text-like element** = Text, Heading, Paragraph (also Image, Button, Link where noted).
- **Component instance** = an element that is a live copy of a saved component.
- **Locked element** = an element locked from the Layers panel or the right-click menu.
- **Accent** = the single blue accent colour used everywhere in the editor.

---

## 1. Element right-click menu ("context menu")

### 1.1 The menu surface
- **Where it lives:** Floating over the canvas, anchored at the mouse position (top-left corner of the menu at the click point). Sits above every other canvas overlay; its submenus sit one layer higher still.
- **Purpose:** Every element-level action in one place, so the user does not have to hunt through the left rail.
- **How it opens:**
  1. **Right-click any element on the page.** The element is selected first (even if it is locked — right-click bypasses the "locked" click guard), then the menu opens.
  2. **Shift + F10** with an element selected: the menu opens centred on that element (accessibility route).
  3. There is **no "⋯" button** on the selection toolbar that opens this menu today. The Figma board ("Canvas · selected · Hero · ⋯ menu") shows one; the code has only the two routes above. (Design should still draw the ⋯ door; it is the intended third route.)
- **Right-clicking empty canvas** (not on an element) closes any open element menu and shows no editor menu; the browser's own native right-click menu appears instead (only clicks that land on an element suppress it).
- **How it closes:** click anywhere outside it · Esc (first Esc closes an open submenu, second closes the menu) · any scroll or window resize · running any item · left-click on the canvas · selecting a different element. If the element itself changes while the menu is open, the menu does **not** update — it is frozen at open time.
- **Read-only / "view" mode:** the menu never opens (right-click is withheld entirely).

**Layout:** a white card, 200 px wide minimum, rounded corners (large radius token), panel shadow, **6 px vertical padding and no horizontal padding** — every row highlight runs edge to edge. Rows are 11 px text, 6 px top/bottom + 12 px left/right inset, no row radius. Row anatomy left→right: 14 px line icon · label · (right-aligned) shortcut hint in muted 12 px, then a `>` chevron if the row has a submenu. Hover / keyboard-focus highlight = the accent tint background. Disabled rows: muted text, `not-allowed` cursor, no hover highlight.

**Structure, top to bottom:**
1. Four **group rows**, each opening a submenu: **Edit**, **Insert**, **Layout**, **Quick Style**.
2. A 1 px divider (6 px margin above/below).
3. The **standalone rows** (listed in 1.7).

A group row disappears entirely if none of its submenu rows apply to the element.

**Submenu behaviour:** opens after hovering the group row for 150 ms; closes 150 ms after the mouse leaves both the row and the panel (so you can travel diagonally). Opens to the **right** of the menu with a 4 px gap, top-aligned with the row (minus 6 px so the first row lines up). If there is less than ~220 px of space on the right it opens to the **left**; if there is less than ~300 px below it is shifted up so it stays on screen. A submenu is the same 200 px card style.

**Keyboard inside the menu** (menu takes focus when it opens):
| Key | Result |
|---|---|
| ↓ / ↑ | Move highlight through all rows (group rows then standalone rows); wraps around. Closes any open submenu. |
| → | Open the highlighted group's submenu |
| ← | Close the open submenu |
| Enter | Group row: open its submenu · Standalone row: run it (if enabled) and close the menu |
| Esc | Close submenu, else close menu |

**Shortcut hint rendering:** on a Mac, `Cmd`→⌘, `Alt`→⌥, `Shift`→⇧, `Del`→⌫, arrows→↑↓←→, and all `+` signs are removed (so "⌘⇧]"). On Windows/Linux the words are kept but the `+` signs are still removed, so a hint reads `CtrlAltC` with no separators — a visible quirk worth fixing in the redesign.

### 1.2 Icons used (line icons, 14 px, current-colour stroke)
pencil-in-square (Edit) · clipboard (Copy / Copy styles) · clipboard with a hand (Paste / Paste styles) · scissors (Cut) · two overlapping squares (Duplicate) · trash can (Delete) · plus (Insert) · arrow up (Insert before, Select parent) · arrow down (Insert after, Make flex column) · arrow right (Make flex row) · corner-down-right chevron (Insert inside – First) · corner-down-left chevron (Insert inside – Last) · cube (Wrap in section, Group) · shrink-arrows (Unwrap) · window-panes (Layout, Replace with block) · 2×2 grid (Make grid) · centred lines (Center content) · expand-arrows (Space between) · single chevron up/down (Bring forward / Send backward) · double chevron up/down (Bring to front / Send to back) · palette (Quick Style) · square (Add padding, Add border) · four-way move cross (Add margin) · picture frame (Add background) · stacked layers (Add shadow) · circular arrows (Reset all styles) · eye (Reveal in layers) · sparkles (Improve with AI) · database cylinder (Bind to CMS field) · lightning bolt (Add interaction) · package box (Save as component) · dashed selection box (Ungroup) · padlock closed / open (Lock / Unlock). If an icon name is unknown the slot stays empty (keeps alignment).

### 1.3 Edit submenu
| Row | Shortcut hint | Shown when | Enabled | What it does | Feedback |
|---|---|---|---|---|---|
| Copy | ⌘C | Always (incl. page body) | Always | Puts the element on the editor's internal clipboard **and** copies its data as text to the OS clipboard | Toast (success, 2 s) "Copied to clipboard"; if the OS copy fails, toast (error, 3 s) "Failed to copy to clipboard" |
| Cut | ⌘X | Not on the page body | Always | Copies to OS clipboard, removes the element, clears selection | If OS copy fails: toast (warning) "Failed to copy to clipboard". Then toast (info, 5 s) "**Heading** cut" or "**Section (3 children)** cut" with an **Undo** action button |
| Paste | ⌘V | Always | Always | Runs the same paste as ⌘V (pastes what was last copied/cut in the editor) | If nothing is on the internal clipboard: toast (info, 3 s) "Nothing to paste — copy an element first". Otherwise the standard paste toast "Element pasted" / "3 elements pasted" (success, 2 s) |
| Duplicate | ⌘D | Always | Always | Inserts a copy right after the element | Toast (success, 2 s) "Element duplicated" |
| Delete | ⌫ (Del) | Not on the page body | Always | Removes the element and clears selection. **No confirmation.** | Toast (info, 5 s) "**Image** deleted" / "**Section (2 children)** deleted" with an **Undo** button |

Element names in these toasts are friendly type names ("Heading", "Paragraph", "Image", "Section", "Container"…).

### 1.4 Insert submenu
| Row | Shown when | Enabled | What it does |
|---|---|---|---|
| Insert before | The element has a parent (not the page body) | Always | Creates a new generic **Container** box containing the placeholder text "New element" immediately **above** the element, and selects it. Silently does nothing if a container is not allowed in that parent. |
| Insert after | Same | Always | Same, immediately **below** the element. |
| Insert inside (First) | Element can hold children **and** is not locked **and** is not a component instance | Always | New "New element" container as the **first** child; selects it. Silently no-op if a container is not allowed inside this element type. |
| Insert inside (Last) | Same | Always | Same, as the **last** child. |
| Wrap in section | Element is not the page body, not locked, not a component instance | Always | Wraps the element in a brand-new **Section**. |
| Unwrap element | Always shown | **Greyed out** unless the element has a parent **and** at least one child | Removes the element and puts its children in its place. (Deliberately shown disabled rather than hidden so the menu keeps its shape and the command is discoverable.) |

No confirmation on any of these.

### 1.5 Layout submenu
All five "make it a…" rows appear **only for container-type elements** (Container, Columns, Grid, Flex, Card, Pricing, Social, Section, Hero, Features, CTA, Header, Footer, Navbar, Nav, Form, List, Table, Slider, Testimonials, Accordion, Product card / grid / detail, Gallery, Custom). The four ordering rows appear for anything except the page body.

| Row | Shortcut hint | What it does |
|---|---|---|
| Make flex row | — | Display flex, direction row |
| Make flex column | — | Display flex, direction column |
| Make grid (2 cols) | — | Display grid, two equal columns; sets a 16 px gap if the element has none |
| Center content | — | Display flex, items centred both ways |
| Space between | — | Display flex, children spread to the edges |
| Bring to front | ⌘⇧] | Moves the element to the last position among its siblings (draws on top) |
| Bring forward | ⌘] | One step later among siblings |
| Send backward | ⌘[ | One step earlier |
| Send to back | ⌘⇧[ | First position |

Each is one undo step. No toast.

### 1.6 Quick Style submenu
Always shown (including on the page body). Each row is one undo step, no toast, no confirmation.

| Row | Shortcut hint | Enabled | What it does |
|---|---|---|---|
| Add padding (16px) | — | Always | Sets padding to 16 px on all sides |
| Add margin (16px) | — | Always | Sets margin to 16 px on all sides |
| Add border | — | Always | 1 px solid light grey border |
| Add background | — | Always | Light grey (#f5f5f5) background |
| Add shadow | — | Always | Soft drop shadow (0 2 8, 15 % black) |
| Copy styles | ⌘⌥C | Always | Copies every style on the element to a separate "style clipboard" (no toast from the menu route) |
| Paste styles | ⌘⌥V | **Disabled until something is on the style clipboard** | Applies the copied styles onto this element (adds/overrides; does not clear others) |
| Reset all styles | — | Always | **Removes every style from the element.** No confirmation. |

### 1.7 Standalone rows (below the divider)
| Row | Shortcut hint | Shown when | What it does |
|---|---|---|---|
| Replace with block… | — | Element is section-shaped (Container, Section, Hero, Features, Header, Footer, Nav, Navbar, CTA, Card, Pricing, Columns, Grid, Flex) and not the page body | Selects the element, switches the left panel to the **Add** tab and opens its **Blocks** group so the user can pick a replacement. (It is a door to the Add panel, not a replace-in-place dialog.) |
| Improve with AI | — | Only when the editor was opened with AI available (otherwise the row is hidden, never disabled) | Opens the AI assistant for this element (same door as the ✦ chip in the inspector) |
| Bind to CMS field… | — | Element is Text, Heading, Paragraph, Image, Button or Link; not the page body | Selects the element and switches the left panel to the **Content** tab, where the binding is made |
| Add interaction | — | Not the page body | Selects the element and scrolls/focuses the inspector's **Interactions** section |
| Save as component | — | Not the page body | Opens the **Create Component** modal. If several elements are selected, all of them are included; otherwise just this one. The modal is pre-fed with the design-system token bindings found in the selection (it shows a "Pre-fill bindings from DS" hint with a count). |
| Reveal in layers | — | Always | Selects the element, opens the left drawer on **Layers** and scrolls the tree to the row |
| Select parent | ← | Element has a parent | Selects the parent element |
| Group | ⌘G | **Two or more elements are selected** at the moment the menu opens | Wraps the selected elements in a new container and selects it |
| Ungroup | ⌘⇧G | Element is a plain **Container** with at least one child | Replaces the container with its children; clears selection |
| Lock | — | Not locked; not the page body | Locks the element (it can no longer be clicked/selected on the canvas — see 3.1) |
| Unlock | — | Locked; not the page body | Unlocks it |

**Note on Group via right-click:** a right-click selects the element under the cursor. If that element is the *primary* item of an existing multi-selection the multi-selection survives and **Group** appears; if it is any other member, the selection collapses to that one element and **Group** does not appear. Shift+F10 keeps the multi-selection, so Group is reliably reachable that way (or with ⌘G directly).

**Not in this menu** (designers often expect them): Rename, Hide/Show, "Select from stack" (the element stack under the cursor is captured when the menu opens, but no row uses it yet), Copy link, Export, Delete-with-confirm. Multi-select Delete from the menu deletes only the right-clicked element.

### 1.8 What the menu shows for each kind of element (worked examples)
| Right-clicked on… | Edit | Insert | Layout | Quick Style | Standalone rows |
|---|---|---|---|---|---|
| **Page body** | Copy, Paste, Duplicate | Insert inside (First/Last) (unless locked); Unwrap greyed | The five "make it…" rows only | All | Improve with AI (if available), Reveal in layers, Ungroup (if it is a container with children) |
| **Section / Hero / container with children** | All five | Before, After, Inside First, Inside Last, Wrap in section, Unwrap | All nine | All | Replace with block…, Improve with AI, Add interaction, Save as component, Reveal in layers, Select parent, Ungroup (plain Container only), Lock |
| **Empty container** | All five | Before, After, Inside First/Last, Wrap; Unwrap greyed | All nine | All | Replace with block…, Improve with AI, Add interaction, Save as component, Reveal in layers, Select parent, Lock |
| **Heading / Paragraph / Text** | All five | Before, After, Inside First/Last (text types can hold children), Wrap; Unwrap greyed unless it has child elements | Ordering rows only (not a container) | All | Improve with AI, Bind to CMS field…, Add interaction, Save as component, Reveal in layers, Select parent, Lock |
| **Image** | All five | Before, After, Wrap (no "inside": images cannot hold children); Unwrap greyed | Ordering rows only | All | Improve with AI, Bind to CMS field…, Add interaction, Save as component, Reveal in layers, Select parent, Lock |
| **Button / Link** | All five | Before, After, Inside First/Last, Wrap | Ordering rows only | All | Improve with AI, Bind to CMS field…, Add interaction, Save as component, Reveal in layers, Select parent, Lock |
| **Component instance** | All five | Before, After only (no Inside, no Wrap) | As per type | All | Same as its type; Save as component still offered |
| **Locked element** | All five | Before, After only (no Inside, no Wrap) | As per type | All | Same as its type but **Unlock** instead of Lock |
| **Primary element of a multi-selection** | All five | As per type | As per type | All | Adds **Group** |

---

## 2. Drag & drop

### 2.1 Dragging something from a side panel onto the page
- **Where it lives:** Starts in the Add panel (elements and blocks), the Components panel (saved components), the component Catalog, the Templates panel, or the Media/Assets panel; ends on the canvas.
- **Purpose:** Place new content at an exact spot.

**Sources and what they carry:**
| Source | Drag ghost | Cursor while over canvas |
|---|---|---|
| Add panel element/block card | A clone of the card, held 40 px in from its top-left | "copy" |
| Saved component (Components panel) | Browser default ghost | "copy"/"move" as set by that panel |
| Catalog component card | As set by the catalog card | — |
| Template card | Browser default | — |
| Media asset (image / video / icon / SVG / audio / Lottie / font) | Browser default | — |
| A file dragged in from the desktop (OS) | OS ghost | — |

**While the drag is over the page (updated continuously, some parts throttled to ~20 fps):**
1. **Target resolution.** The element under the pointer becomes the target; if none, the page body is the target.
2. **Position within the target.** The pointer's place inside the target's box decides *before / inside / after*: the outer **25 %** at the top means "before", the outer 25 % at the bottom means "after", the middle 50 % means "inside". If the target's parent lays children out horizontally (flex row / a grid with more columns than rows) the same rule applies left/right instead of top/bottom.
3. **Target highlight.** The target gets a **2 px dashed accent border with an accent-tint fill** (valid) or a **2 px solid red border with a red-tint fill** (invalid). Small radius; 150 ms colour transition.
4. **Insertion line** (before/after only): a **3 px accent bar** spanning the target's width, overhanging 4 px each side, with an **8 px round dot at each end**, drawn at the target's top edge (before) or bottom edge (after). Fades in over 150 ms. Turns red when the drop is invalid.
5. **Drop slot preview** (before/after only, valid only): a **48 px tall dashed accent box** (or 48 px wide, beside the target, in horizontal layouts) showing roughly where the new item will sit; grows in over 150 ms.
6. **Destination label** (valid only): a dark pill to the right of the target's top-right corner reading **"Insert before Heading"**, **"Insert after Section"** or **"Insert inside Container"** (friendly element name).
7. **Invalid badge** (invalid only, same spot as the destination label): red pill with white 12 px text, one of: "Cannot have children", "Text cannot contain elements", "Cannot drop inside itself", "Cannot drop inside child", "Max depth reached", "Already in position", "Not allowed here", "Cannot nest interactive", "Cannot place here", fallback "Cannot drop here". The same message is announced to screen readers.
8. **Breadcrumb pill** (valid, target nested ≥ 2 deep): a dark 28 px pill above the target: "Drop inside: Page › Section › Container" — the final crumb in bold, the rest at 70 % opacity, `›` separators, max 300 px wide.
9. **"Level N" badge** (valid, target nested ≥ 3 deep): small grey pill under the target's bottom-right corner, e.g. "Level 4".
10. **Cursor:** `not-allowed` while over an invalid target.
11. **Auto-scroll:** when the pointer is within **50 px** of any edge of the visible canvas viewport, the canvas scrolls in that direction, faster the closer to the edge (up to 15 px per frame). Stops when the pointer moves away, on drop, or on leaving the canvas.
12. **Smart guides** (when guides are on, default on): magenta alignment lines appear when the dragged item's left/centre/right or top/middle/bottom edge comes within 5 px of a sibling's; red spacing indicators with a px label appear when the dragged item would make equal gaps between siblings or sit at the same distance from the parent edge as a sibling. Up to five lines at once.
13. Leaving the canvas clears everything.

**On drop — by what was dragged:**
| Dragged | Result | Feedback |
|---|---|---|
| Add-panel element/block | The editor walks **up** from the target until it finds a parent that may contain this element type (so a heading dropped onto an image lands next to the image inside its parent). If the pointer was in a before/after zone, that exact slot is honoured. If the final parent still cannot hold the element: rejected. New element is auto-selected, flashes green and "settles" (unless reduced motion), and is announced to screen readers as "Inserted: Heading". If dropped into a column placeholder that still says "Column 1", that placeholder text is cleared. | No toast on success. Warning toasts (3 s) on failure: "Cannot place **Hero** inside **button**", "Unknown block type: …", "Block "…" has no element type", "Page root element not found", "Failed to add element to canvas", "Invalid block data" |
| Saved component | Instance placed inside the target (or page body); auto-selected; 200 ms fade-in | Warning toast "Failed to instantiate component" on error |
| Catalog component | Placeholder placed inside the target (v1: the placeholder carries the component id/variant; full rendering is a later arc) | Announced "Inserted: <Component name>"; warning "Unknown catalog component: …", "No active page for catalog drop", "Could not place <name>" |
| Template | Its HTML is inserted before/after the target (or appended to the page body); first created element selected and flashed | Warning "Failed to insert template" |
| Media asset from the Media panel | Image/video/icon/etc. is inserted at the pointer (or applied to the target element if it is the right kind). If the asset is a remote stock image it is also quietly saved into the library. | Announced "**photo.jpg** applied ✓" / "**Media** added ✓". If the asset only exists on this device (never uploaded): warning toast "**photo.jpg** is only on this device — it won't show on the page or publish. Re-upload when you're back online." Failure: "Could not place media" |
| Image file from the desktop | First image file is uploaded and set as the target element's image | Info toast (4 s) "Uploading photo.png..." while it uploads; then either silent success (screen-reader: "photo.png applied ✓") or the "only on this device" warning above; failure "Could not upload dropped image" |
| Anything, while inline text editing is active | Rejected | Warning toast "Cannot drop while editing text" |
| Multi-element / single element from the Layers panel or canvas | See 2.2 | |

### 2.2 Moving existing elements by dragging them on the page
- **Where it lives:** On the canvas itself. Every element except the page body is draggable directly (no handle needed; the 6-dot grip handle also exists on the selection overlay, labelled "Drag to move element").
- **Cursors:** `grab` when hovering any draggable element, `grabbing` while pressing/dragging.

**Drag start:**
- The dragged element drops to **40 % opacity** on the page.
- A **custom ghost** follows the pointer: a clone of the element, capped at 300 px wide × 200 px tall, white card background, **2 px accent border**, large radius, overlay shadow, content at 90 % opacity and scaled 95 %, plus an **uppercase accent chip** hanging off its bottom edge with the element type ("HEADING"). In clone mode the chip reads "+ HEADING".
- **⌘ / Ctrl held at drag start = clone mode**: a duplicate is created next to the original and *that* is what you drag; the cursor becomes "copy". (The hover overlay's ⊕ badge advertises this.)
- **Shift held during drag**: cursor becomes a crosshair ("sibling mode" hint). Visual only — it does not change where the element lands.
- **Alt held (not dragging)**: cursor becomes a magnifier ("inspect" cursor, same as when Inspector mode is on).
- **Multi-selection:** dragging any element of a multi-selection drags all of them together; on drop they are inserted in their original relative order at the target slot.

**While dragging:** the element under the pointer that can legally contain the dragged element type gets the drop-target highlight (the accent dashed box); the insertion line / slot / label / breadcrumb described in 2.1 apply; smart guides and auto-scroll (60 px edge band, 2–20 px per tick, vertical and horizontal scroll separately) run; the page body is never a highlighted target.

**Validation shown live (red state + badge):**
- dropping an element onto itself → "Cannot drop inside itself"
- into one of its own descendants → "Cannot drop inside child"
- deeper than 30 levels → "Max depth reached"
- into an element that cannot hold children (image, icon, input, spacer, divider…) → "Cannot have children"
- into a text-type element that cannot hold that type → "Text cannot contain elements"
- a button or link into (or beside something inside) another button/link → "Cannot nest interactive"
- any other forbidden pairing from the table in 2.5 → "Not allowed here"
- back into the exact same slot → "Already in position"

**On drop:** one undo step; the element moves; the selection is re-announced so overlays refresh. If a legal target cannot be found, the drop is silently ignored (no toast). Rare failures: warning toast "Failed to move element" / "Failed to move elements" / "No valid elements to drop" / "No active page to drop into".

**Cancel:** dropping outside the canvas or releasing over nothing cancels; opacity and cursor restore; all indicators clear.

**Touch (tablet):** press and hold **500 ms** on an element to pick it up (moving more than 5 px before that cancels); the element goes 40 % transparent; the element under the finger gets the drop highlight; smart guides show. On release the element is placed **after** the touched element as its sibling (touch never nests "inside"). Invalid targets (self/descendant/forbidden nesting) get a red outline and a 0.5 s **shake**.

### 2.3 Re-ordering top-level sections with the side handle
- **Where it lives:** A **24 px accent square handle** at the far-left edge of the canvas at each section boundary (top edge of every direct child of the page body). Invisible until hovered (40 px tall hit area); scales from 80 %→100 % and fades in on hover; `grab` cursor, `grabbing` while dragging. Accessible name "Drag to reorder section 3".
- **Drag:** press the handle and move vertically. A **3 px full-width accent-hover line** shows the drop slot (between sections, or at the very bottom). Release to move the section; **Esc** cancels. One undo step. Nothing happens if released in the original slot.

### 2.4 Marquee (rubber-band) selection
Press on **empty canvas** (not on an element, not on a toolbar) and drag. Once the drag exceeds 5 px the current selection is cleared and a rectangle is drawn; on release, every element (page body excluded) whose box **intersects** the rectangle (fully or partially, at any depth) is selected as a multi-selection. A marquee smaller than 5 × 5 px is treated as a click. Not available while inline-editing text or during a drag. (A second implementation with Shift-to-add and Esc-to-cancel exists in code but is not mounted.)

### 2.5 Nesting rules — what can go inside what
Computed from the live validator (51 element types). "Everything" means all 51 types.

| Parent element | May contain |
|---|---|
| Container, Columns, Grid, Flex, Card, Pricing, Social, Section, Hero, Features, CTA, Navbar, Nav, List, Table, Slider, Testimonials, Accordion, Product card, Product detail, Custom | **Everything** |
| Header, Footer | Everything **except** Header and Footer |
| Form | Everything **except** another Form |
| Video | Almost everything, **except** Pricing, Social, CTA, Navbar, Gallery, Slider, Testimonials, Countdown, Product detail |
| Gallery | Only Container, Image, Video |
| Product grid | Only Container, Product card |
| Text (inline span) | Text, Heading, Paragraph, Link, Button, Image, Video, Audio, SVG, Lottie, Icon, Input, Textarea, Select, Checkbox, Radio, Switch, Upload, Progress, Video embed, Map embed, Spacer, Divider — **never** any container, section, form, list, table, slider, accordion, product element or custom element |
| Heading | Container, Columns, Grid, Flex, Card, Hero, Features, Text, Link, Image, Video, Audio, SVG, Lottie, Gallery, Icon, Progress, Accordion, Product card, Product grid, Video embed, Map embed, Custom, Spacer, Divider — **never** Heading, Paragraph, Button, any form control, Section, Header, Footer, Nav, Navbar, Pricing, Social, CTA, Form, List, Table, Slider, Testimonials, Countdown, Product detail |
| Paragraph | Same as Heading **minus** Container, Grid, Flex (Columns and Card are still allowed) |
| Link | Container, Columns, Grid, Flex, Card, Hero, Features, Text, Heading, Paragraph, Image, Video, Audio, SVG, Lottie, Gallery, Icon, Checkbox, Radio, Switch, Upload, Progress, Accordion, Product card, Product grid, Video embed, Map embed, Custom, Spacer, Divider — **never** Link, Button, Form, Input, Textarea, Select, List, Table, Section, Header, Footer, Nav, Navbar, Pricing, Social, CTA, Slider, Testimonials, Countdown, Product detail |
| Button | Text, Heading, Paragraph, Image, Video, Audio, SVG, Lottie, Gallery, Icon, Checkbox, Radio, Switch, Upload, Progress, Accordion, Product card, Product grid, Video embed, Map embed, Custom, Spacer, Divider — **never** any container/layout/section, Link, Button, Form, Input, Textarea, Select, List, Table, Slider, Testimonials, Countdown, Product detail |
| Image, Audio, SVG, Lottie, Icon, Input, Textarea, Select, Checkbox, Radio, Switch, Upload, Progress, Countdown, Video embed, Map embed, Spacer, Divider | **Nothing** — these can never hold children |

Extra rules applied on top of the table during any drop or move: no element into itself or its own descendants; at most 30 levels deep; a Button or Link can never end up anywhere *inside* another Button or Link, even several levels down and even when dropped "before/after" something inside one. Some allowances above are surprising but real (a Heading may hold a Container; a Text span may hold a Button) — design for the table, not for HTML intuition.

For **side-panel drags** the editor walks up the tree to the nearest legal parent, so the red "invalid" state is rare; it only appears when the pointer is over an element that cannot hold children *and* has no parent. For **moving existing elements** the red state is shown immediately.

### 2.6 Other visible drag facts
- Two different drag "engines" run (side-panel drags and element moves) but the user sees one consistent language: accent dashed target, 3-px insertion line with end dots, dark destination pill.
- Hover overlay and hover outline are suppressed during any drag, resize or inline edit.
- The page body can never be dragged.
- Dropping while the editor is in read-only/view mode does nothing (drag-over and drop are withheld).

---

## 3. Pointer & selection behaviours on the canvas (needed to understand the above)

### 3.1 Clicking
| Gesture | Result |
|---|---|
| Click an element | Selects it (small elements get an expanded hit area). Clicking a **locked** element does nothing except a toast (info, 2.5 s): "This element is locked. Unlock it in the Layers panel." |
| Shift + click | Adds to / keeps a multi-selection |
| ⌘ / Ctrl + click | "Click-through": selects the innermost element under the pointer; clicking again at the same spot (within 5 px) cycles to the next element behind it, and so on, wrapping around |
| Double-click (within 400 ms, same spot) on a selected element with children | Selects the child under the pointer (or the first child) |
| Triple-click | Selects the innermost element under the pointer |
| Double-click on a text-bearing element | Starts inline text editing (see 3.3) |
| Click empty canvas | Clears selection; resets click-through |
| Click on a toolbar, selection label, breadcrumb, alignment toolbar, floating helper or the command palette | Ignored by selection |

Hovering an element (not the selected one) shows the hover outline; hovering a row in the Layers panel highlights the same element on the canvas. A screen-reader live region announces "Selected: heading", "Selected 3 elements", "Selection cleared".

### 3.2 Cursors
`default` on empty canvas · `pointer` over an element · `text` (I-beam) over text · `zoom-in` while Alt is held or Inspector mode is on · `grab` / `grabbing` for drags · `copy` in clone mode · `crosshair` with Shift during a drag · `not-allowed` over an invalid drop · `nwse-resize` while resizing.

### 3.3 Inline text editing
- **Trigger:** double-click a paragraph, span, link, button, label, list item, heading (h1–h6), table cell, figcaption, blockquote, cite, strong, em, small or mark element that has **no child elements** (double-clicking a container that contains text does nothing — you must double-click the text itself).
- **On start:** the element becomes editable in place, all its text is selected, drag is disabled on it, and the inline text toolbar appears (that toolbar is documented in the canvas-controls module).
- **Toolbar commands available:** bold, italic, underline, strikethrough, insert text, create link (only http/https-style safe URLs are accepted; unsafe schemes are ignored; links open in a new tab), remove link, block format (e.g. turn into a heading/paragraph), bulleted list, numbered list, align left/centre/right/justify, indent, outdent, font size, text colour, highlight colour.
- **Commit:** Enter, or clicking anywhere outside the element (left-click only — right- and middle-click do not commit), or focus leaving to anything other than the inline toolbar. Content is sanitised, saved as one undo step, autosaved, and counts as the "edited text on canvas" onboarding step.
- **Cancel:** Esc restores the original text.
- Not available in read-only mode.

---

## 4. Keyboard shortcuts

Three layers bind keys, and the user experiences them as one set. Rules that apply to *all* of them:
- **Never while typing** in an input, textarea, dropdown or editable text (⌘A/⌘C/⌘V/⌘X/⌘Z then act on the text).
- **Never while a modal dialog is open** (the dialog owns the keyboard). Exception: F6.
- **Read-only / view mode:** every shortcut that changes the document is refused; the canvas palette (⌘⇧P) is not bound at all.
- Bare keys (no modifier) are also withheld inside menus, list boxes, trees, grids and similar widgets that own their own arrows.
- The canvas-only keys (arrows, Tab, Home/End, ⌘⌥C/V, Shift+F10) need the canvas to have focus (it takes focus when you click it).

### 4.1 Selection & navigation (canvas)
| Keys | Action | Notes |
|---|---|---|
| Tab / Shift+Tab | Select next / previous element in page order (page body skipped); wraps | |
| ↑ / ↓ | Select previous / next sibling | |
| ← | Select parent | Printed as "←" in the context menu's Select parent row |
| → | Select first child | |
| Home / End | Select first / last sibling | |
| ⌘A | Select all elements on the page | |
| Esc | Clear selection (also closes the shortcuts panel / cheat sheet / palette if open) | |
| Shift+F10 | Open the right-click menu on the selected element | |

### 4.2 Moving & re-ordering (canvas, selected element, never the page body)
| Keys | Action | Notes |
|---|---|---|
| ⌘ + arrow | Move element 1 px | Absolutely/fixed positioned: adjusts top/left. Otherwise a transform offset is added (keeps the element in flow). One undo step each. |
| Shift + arrow | Move element 10 px | Same |
| ⌥↑ / ⌥↓ | Move one slot earlier / later among siblings | |
| ⌥Home / ⌥End | Move to first / last slot among siblings | |

### 4.3 Editing (app-wide)
| Keys | Action | Feedback |
|---|---|---|
| ⌘C | Copy selection | Toast "Element copied" / "3 elements copied" |
| ⌘X | Cut selection | Toast "Element cut" / "3 elements cut" |
| ⌘V | Paste | Toast "Element pasted" / "3 elements pasted" |
| ⌘D | Duplicate | Toast "Element duplicated" |
| Delete / Backspace | Delete every selected element (top-most only; page body never) in one undo step | No toast on the key route (the menu/toolbar routes do toast) |
| ⌘Z | Undo | |
| ⌘⇧Z or ⌘Y | Redo | |
| ⌘G | Group (needs ≥ 2 selected) | |
| ⌘⇧G | Ungroup (selected plain container) | |
| ⌘] / ⌘[ | Bring forward / Send backward | |
| ⌘⇧] / ⌘⇧[ | Bring to front / Send to back | |
| ⌘⌥C | Copy styles only (canvas) | Toast "5 styles copied" (info) or "No styles to copy" (warning) |
| ⌘⌥V | Paste styles (canvas) | Toast (success) "5 styles applied" with **Undo** |
| ⌘S | Save | |

### 4.4 View, panels & tools (app-wide)
| Keys | Action |
|---|---|
| ⌘= (⌘+) / ⌘- | Zoom in / out (owned by the footer zoom control; steps through its presets) |
| ⌘0 | Zoom to 100 % |
| ⌘1 | Zoom to fit |
| ⌘2 | Zoom to selection |
| ⌘K | App command palette |
| ⌘⇧P | **Canvas** command palette (see 4.6) |
| ? | Canvas keyboard cheat sheet |
| ⌘/ | App keyboard-shortcuts panel |
| ⌘P | Toggle preview |
| C | Toggle comment mode (see 5) |
| ⌘J | Open the AI panel |
| ⌘⇧A | Open AI assistant |
| ⌘⇧E | Open exporter |
| ⌘⇧C | Toggle component view |
| ⌘, | Site settings |
| ⌘H | Open left panel on History |
| Shift+A | Open left panel on Components |
| F6 / Shift+F6 | Cycle keyboard focus between editor regions (works even from inside inputs) |
| Right-click | Element context menu |

### 4.5 Listed somewhere but **not bound** (do not print these on the design)
A constants table in the code claims these; nothing binds them: tool keys V / H / T / R / F, Alt+1…Alt+6 panel toggles, ⌘L / ⌘⇧L lock/unlock, ⌘⇧H show, ⌘' grid, ⌘; guides, ⌘R rulers, ⌘E export, ⌘I import, ⌘N / ⌘O new/open, ⌘⇧S save-as, ⌘⇧D debug, ⌘⇧T templates, ⌘3/⌘4 device presets. "Toggle snap to grid", "Nudge …", "Desktop/Tablet/Mobile/Watch view", "Reset zoom", "Preview", "Export HTML/JSON", "Open templates" exist only as palette rows by name.

### 4.6 Canvas command palette (⌘⇧P)
- **Where it lives:** floating over the canvas; Esc closes; ⌘⇧P toggles. Not bound in view mode.
- **Rows** (category · label · hint · icon): Edit · Undo ⌘Z ↩ · Redo ⌘⇧Z ↪ · Duplicate ⌘D (needs selection) · Delete Del 🗑 (needs selection) · Select all ⌘A ☐ · Deselect all Esc ☒ · View · Zoom in ⌘+ 🔍 · Zoom out ⌘- 🔎 · Zoom to fit ⌘1 ⛶ · Toggle layers panel ☰ · Preview site ⌘P ▶ · Insert · Add text (T) · Add image 🖼 · Add button ◻ · Add container ▢ · Tools · Manage CMS records 🗃 · Save page as template 💾 · Start collaboration session 👥 **(only when the collab flag is on)** · Browse templates (hint "T", but T is not actually bound) 📐 · Open analytics settings 📊 · Open page settings (SEO, slug, status) 🔍 · Open export settings 📦 · Open integrations 🔗 · Open media library 🖼 · Replace selected media 🔄 (needs selection) · Search stock photos 🔍.
- Rows have keyword synonyms for search (e.g. "cta" finds Add button, "unsplash" finds Search stock photos).

### 4.7 Canvas keyboard cheat sheet (?)
Modal titled "⌨️ Keyboard Shortcuts" with a search field ("Search shortcuts…"), a close button ("Close keyboard shortcuts"), and grouped rows: **Selection** (Click, Double-click, Triple-click, ⌘Click cycle, ⇧Click add, ⌘A, Escape, Tab, ⇧Tab) · **Navigation** (↑ ↓ ← → Home End) · **Positioning** (⇧arrows 10 px, ⌘arrows 1 px, ⌥↑/↓ reorder, ⌥Home/End) · **Editing** (⌘C, ⌘⌥C, ⌘V, ⌘⌥V, ⌘X, ⌘D, Delete, ⌘Z, ⌘⇧Z) · **View** (⌘+, ⌘-, ⌘0, ⌘1, ⌘2, ⌘⇧P, ⌘K, ?, ⌘/) · **Context Menu** (Right-click, ⇧F10). Empty search state: "Nothing matches “{query}”."

---

## 5. Comments on the canvas (comment mode)

- **Where it lives:** A capture layer over the whole page, pins drawn on the page itself (they zoom with it), a small draft popover, and one modal. Turned on by the **Comments** button in the top bar (pressed state mirrors the mode) or the **C** key. Esc turns it off.
- **Purpose:** Leave review notes pinned to a spot / element on the page; the notes are read and answered in the **Review** panel (left rail — documented in the sidebar module).
- **Gating:** Only does anything for a saved site opened from the dashboard. In the standalone demo the mode turns on but there are no pins and posting is impossible. In read-only/view mode comment pinning still works (it is the one thing viewers can do).

**States of the layer**
| State | What the user sees |
|---|---|
| Off | Nothing (no pins on the page) |
| Comment mode on | Crosshair cursor over the page; every **open** comment pinned to *this page* shown as a pin; the top-bar Comments button pressed |
| Draft open | A ghost pin "+" (accent-tint disc) at the click point plus the draft popover |
| Re-pin mode | Crosshair; a centred accent banner at the top of the canvas: **"Click an element to re-pin the comment · Esc cancels"**; comment mode itself is off |
| Orphan modal | See below |

**Pin:** 24 px accent-blue disc, 2 px white ring, drag shadow, white 11 px regular numeral (1, 2, 3… in list order), tooltip / accessible name "**Ana**: first 80 characters of the comment" ("Client" or "Team" when the author has no name). Clicking a pin opens the **Review** panel. Pins are positioned at the exact fraction of the page where they were placed; a comment attached to an element but without coordinates sits at that element's top-centre; general (unpinned) notes are not drawn on the canvas at all. Pins re-measure on resize, page switch, undo/redo and edits.

**Flow — add a comment:**
1. Turn on comment mode (Comments button / C).
2. Click anywhere on the page. The element under the point (if any) is recorded as the anchor; the ghost "+" pin and the draft popover appear 16 px right / 8 px below the point.
3. Popover (236 px wide, white card, border, large radius, drag shadow, 10 px padding; labelled "New comment"): a 3-row text area, placeholder **"Leave a comment…"**, 2000-character limit, autofocused; below it right-aligned **Cancel** (ghost) and **Post** (primary, disabled until there is text; reads **"Posting…"** while sending). ⌘Enter / Ctrl+Enter posts.
4. Success: toast (success, 2 s) "**Comment pinned** — Visible to your team in the Review panel." Pins refresh.
5. Failure: toast (error, 3.5 s) "**Couldn't post comment** — Check your connection and try again."
6. Esc while drafting closes the draft (mode stays on); a second Esc leaves comment mode. Clicking inside the popover does not place another pin.

**Flow — re-pin a detached comment** (started from the Review panel's "Detached" group):
1. Banner appears; click a page element. Clicking empty space: toast (warning, 2.5 s) "**Pick an element** — Click a page element to re-pin this comment."
2. Success: toast (success, 2 s) "**Comment re-pinned** — The pin now follows the new element."; Review panel refreshes. Failure: toast (error, 3 s) "**Couldn't re-pin** — Try again."
3. Esc cancels.

**Orphan comments modal** — appears automatically (~150 ms after the page settles) when an open, pinned comment's element no longer exists on the current page (it was deleted). Each comment is announced once per session.
- Title: **"A comment lost its element"** or **"3 comments lost their element"**.
- Body copy: "The elements these were pinned to were deleted. The comments are kept — never auto-deleted — and moved to the Detached group at the top of the Review panel."
- One 56 px warning-tint row per comment: the quote “first 120 chars…” (12 px ink) over a warning-coloured 11 px line: **was on: "Book a table"** (the deleted element's text or type, remembered for this session) or, if unknown, **was pinned to a deleted element**.
- Footer: one primary button **"Open Review panel"** (closes the modal, opens Review). Closing the modal any other way just dismisses it.
- It is suppressed when the *entire* page has not rendered yet (so it does not fire on load).

**Not on the canvas** (lives in the Review panel): threads/replies, resolve/reopen, the list, author/round metadata. There are **no @mentions** anywhere. The top-bar Comments button shows **no count badge** — only pressed/unpressed.

---

## 6. Collaboration presence (demo-only, behind a flag)

- **Gating:** the whole surface is behind the collaboration feature flag, which must stay **off in production** (collaboration is last-write-wins with known non-convergence bugs). With the flag off nothing below is visible, even if a session somehow connects.
- **Where it lives:** Top bar (presence avatars + connection pill), the Site menu row **"Start collaboration"**, the canvas palette row "Start collaboration session", and coloured remote cursors on the canvas.

**Starting:** Site menu → "Start collaboration" (only shown while not connected). If the site is not saved: toast (info) "**Save your site first** — Open a saved site to collaborate." If connecting fails: toast (error) "**Couldn't start collaboration** — Try again in a moment." Joining asks the host for the current page state and replaces the local document with it (silent). Everyone in the room is keyed by the site id.

**Presence in the top bar** (Figma "Presence" organism):
- Shown only while a session is connected or reconnecting. When you are alone and live, **nothing renders**.
- Avatar stack (24 px round, overlapping by 8 px, 2 px white ring): profile image, or initials on one of five tones (blue, green, amber, purple, neutral — derived from the user id so a person is always the same colour). Your own avatar gets a **2 px accent outline** offset 2 px. Up to **3** avatars, then a grey **"+N"** disc. Tooltip = name.
- Connection pill (20 px, 11 px medium, dot + text): green **"2 editing"** (live) · yellow **"Reconnecting…"** (connecting or reconnecting) · red **"Offline"** (disconnected — announced assertively).
- Dev builds only: with no session, a demo pair "You" and "Ana" is shown.

**On the canvas:** other users' cursors are drawn as a 16 px arrow in the user's colour (one of eight: red, orange, yellow, green, cyan, indigo, pink, rose) with a same-colour name label (12 px, white text, max 120 px, ellipsised), sliding with a 100 ms ease. A cursor disappears when that user leaves or moves off the canvas. Your own cursor position is broadcast at most every 50 ms.

**Tracked but NOT shown anywhere (no UI exists):** other users' selections, "someone is editing this element" (3 s soft state), element soft-locks (5 s), connection quality (latency / pending edits are polled every 2 s but never displayed), operation timeouts and divergence warnings.

**Conflict behaviour (what a user would experience):** edits are merged remote-wins — if two people change the same property, the other person's change replaces yours; if someone deletes an element you were editing, your edit is dropped. There is no conflict dialog. Undo is local. Leaving the room clears all presence.

---

## 7. Interactions (what "Add interaction" leads to — user-visible parts only)

The context menu's **Add interaction** row focuses the inspector's Interactions section (documented in the inspector module). What the engine guarantees the user sees:
- **Triggers** offered, grouped: **Mouse** (Hover, Click, Mouse over, Mouse move, Mouse out) · **Focus** (Focus, Blur) · **Page** (Page load, Page scroll, Page leave) · **Scroll** (Scroll into view, While scrolling, Scroll out) · plus **While pressed**.
- **Defaults for a new interaction:** trigger Hover, animation Fade In, 300 ms, 0 ms delay, ease-out, target "self", not reversed, plays once.
- **Animation presets (42):** Fade In/Out, Fade In Up/Down/Left/Right, Slide Up/Down/Left/Right, Slide In Up/Down, Scale In/Out/Up/Down, Zoom In/Out, Rotate, Rotate In/Out, Flip, Flip X/Y, Pulse, Heart Beat, Flash, Shake, Wobble, Jello, Bounce, Rubber Band, Swing, Tada, Hinge, Roll In/Out, Blur, Glow, Bounce In/Out, Custom.
- **Runtime facts:** animations run in preview/published pages, not while editing. "Scroll into view" fires once, when 50 % of the element is visible. Hover / focus / while-pressed can be set to "reverse" on leave/blur/release — **reverse is currently a placeholder and does nothing visible**. Target can be self, parent, or a CSS selector. Interactions can be toggled on/off, duplicated (name gets " (copy)"), reordered and cleared.

---

## 8. Toolbar actions that live in this module's code (copy reference)
The floating selection toolbar (documented in the canvas-controls module) calls these; the copy comes from here:
- Duplicate → toast (info, 2 s) "Element duplicated" with **Undo**
- Delete → toast (info, 5 s) "**Image** deleted" / "**Section (2 children)** deleted" with **Undo** (no confirmation)
- Copy → toast (info, 2 s) "**Heading** copied to clipboard"
- Wrap → wraps the selection in a plain **Container** (no toast)
- Move up / Move down → Bring forward / Send backward
- Undo → undo
- Select parent / Select ancestor (breadcrumb) → selects that element

---

# Left drawer tabs — Pages, Templates, Layers, Version History

**What this module is.** Four of the panels that open in the editor's left drawer (280px wide by default, widenable to 700px). **Pages** lists the site's pages, lets you add, rename, reorder, group, duplicate and delete them, and opens a per-page settings dialog (SEO, social sharing, visibility, custom code). **Templates** is a gallery of ready-made page designs you can apply to the current page or turn into a new page. **Layers** is the tree of every element on the current page, with show/lock, rename, drag-to-reorder and a right-click menu. **Version History** shows named saves, the session's undo trail, a time-travel scrubber, and the list of published versions with rollback. A few small shared drawer pieces (panel header, drill-in header, search field, empty/error blocks) are described at the end.

---

## Part 1 — PAGES

### Pages panel (drawer)
- **Where it lives:** Left drawer, "Pages" tab.
- **Purpose:** See, organise and switch between the pages of the site; open per-page settings.
- **Layout / contents (top to bottom):**
  1. **Panel header** — title "Pages"; right side: a small keycap button reading "⌘K" (mono, bordered) that opens the Go-to-page palette; then the standard header actions: expand/collapse (widens drawer to 700), help "?", close "×".
  2. **Search band** (36px tall) — a bare 28px search box (placeholder "Search"; no magnifier icon, no inline clear button) plus two text links on its right: "⊞ Listings" and "⌸ Structure".
  3. **"Select all" row** — appears only once at least one page is checkbox-selected: a 14px checkbox and the text "Select all (N pages)". Clicking toggles all.
  4. **Page tree** — folders first (each with its nested pages), then ungrouped pages. Scrollable, 32px rows.
  5. **One-page note** — when the site has exactly one page (and no search): centred grey line "This site has one page." followed by a centred accent link "+ Add page".
  6. **Footer** (pinned at bottom, fades in over the list) — "+  Add page" accent text link, "From template" muted text link, and a "⋯" icon button ("More add options") that opens a tiny menu above it with one item: "New folder".
  7. When one or more pages are selected the footer is replaced by the **Bulk toolbar** (see below).
- **States:**
  - *Loading* (project still arriving): six skeleton rows on the page-row grid — a 16px pulsing square plus an uneven grey bar, two of them indented as folder children. Label for screen readers: "Loading pages".
  - *Empty (no pages)*: compact empty state — title "No pages yet", text "Add your first page to get started. Pages are the screens visitors see.", buttons "Create blank page" (primary, small) and "From template" (ghost).
  - *Load error*: the search band and footer stay; the tree is replaced by a centred block — red line "Couldn't load your pages.", muted line "The site is fine — this panel isn't.", accent link "Try again".
  - *No search matches*: "Nothing matches 'query'." (grey) and an accent link "Clear search".
  - *Searching*: folders are hidden and results are shown flat; a page that lives in a folder gets a muted "in {Folder name}" tag at the right of its row.
- **Keyboard shortcuts:** `/` (when not typing in a field) focuses the search box; `Esc` in the search box clears it; `⌘K` / `Ctrl+K` toggles the Go-to-page palette; `Esc` clears a bulk selection.
- **Copy used:** "Pages", "⌘K", "Search", "⊞ Listings", "⌸ Structure", "Select all (N pages)", "This site has one page.", "+ Add page", "+  Add page", "From template", "More add options", "New folder", "No pages yet", "Add your first page to get started. Pages are the screens visitors see.", "Create blank page", "Couldn't load your pages.", "The site is fine — this panel isn't.", "Try again", "Nothing matches '…'.", "Clear search", "Loading pages".

### Page row
- **Where it lives:** Inside the Pages tree.
- **Layout (left to right):** checkbox slot (16px square, radius 4, 1.5px grey border — visible on every row while any selection exists; filled accent with white tick when this row is selected) · 6-dot drag grip (appears on hover, tooltip "Drag to reorder") · icon **only** for the home page (house glyph) or an external-link page (chain-link glyph) — ordinary pages carry no icon · page name (13/20, ellipsised, full name in tooltip) · spacer · optional muted "in {Folder}" (search only) · optional 8px orange dot when the page has unsaved edits · "⋯" overflow button (appears on hover; tooltip/label "More options for {name}").
- **States:** *hover* light grey wash; *active page* accent-tinted background with a 2px accent bar on the left edge and accent-coloured icon; *selected (bulk)* accent-tinted background plus filled checkbox; *nested in folder* indented 22px; *focus* 2px accent outline.
- **Actions:**
  - Click → makes that page the active page on the canvas.
  - `⌘/Ctrl`+click or `Shift`+click → toggles / range-selects for bulk actions (also the checkbox slot itself).
  - Double-click the name → inline rename.
  - Right-click, or click "⋯" → opens the page context menu at the pointer.
  - Drag the row and drop it onto another page row → moves the dragged page to just after that row (reorder). Drop it onto a folder row → moves it into the folder. A 2px accent drop-indicator line shows during drag.
- **Keyboard (row focused):** `Enter` selects the page; `F2` starts rename; `Space` toggles bulk selection. The context menu also prints shortcut hints `F2` (rename), `⌘D` (duplicate) and `⌫` (delete) beside those items.
- **Inline rename:** the name becomes a 22px input with an accent border, text pre-selected. `Enter` or clicking away commits; `Esc` cancels; an empty name keeps the old one. If another page already has that name (case-insensitive) a red 11px line appears under the input: "A page with this name already exists" and the rename stays open.
- **Page status values that exist in the data model:** Live (default), Draft, Hidden, Password, Scheduled, External, Error. Only Home and External get a glyph on the row today; no status chip is rendered on the row (chip styles exist but are unused). Status is read out to screen readers only.

### Page context menu
- **Where it lives:** Floating menu at the click point (over the drawer), 200px-ish wide.
- **Items, in order:**
  | Item | Hint | Notes |
  |---|---|---|
  | "Rename…" | F2 | starts inline rename |
  | "Duplicate" | ⌘D | deep copy with " Copy" suffix |
  | "Set as homepage" | — | hidden when the page is already home |
  | "Copy link" | — | copies `https://{domain}/{slug}` |
  | "Page settings…" | — | opens the Page settings dialog |
  | — separator — | | |
  | "Delete page" | ⌫ | red; **disabled** when the page is the home page (tooltip "Set another page as Homepage before deleting this one") or the only page (tooltip "A site needs at least 1 page. Add another page first.") |
- **Keyboard:** `↑ ↓ Home End` move between items (skipping disabled), `Esc` closes. Clicking outside closes.
- **Outcomes / toasts:**
  - Set as homepage → green toast "Homepage updated. Your navigation menu may need updating manually." External-link page → amber "External link pages can't be set as the homepage." Failure → red "Couldn't update homepage. Try again."
  - Duplicate → new page appears; amber "Couldn't duplicate — source page not found." or red "Duplicate failed — page may have corrupt content." on failure.
  - Copy link → if the site has no domain yet: info toast titled "No address yet" with "Connect a custom domain in Settings, or publish the site first." Otherwise green "Link copied: {url}". If the browser blocks clipboard: "Copy manually: {url}" (8s); on failure "Couldn't copy. Link: {url}".
  - Delete → see Delete flow below.

### Delete a page (single)
- **Flow:** menu "Delete page" → guards first: if it is the only page an amber toast "Can't delete — your site needs at least 1 page"; if it is the home page an amber toast "Set another page as Homepage before deleting this one". Otherwise a confirm dialog opens.
- **Confirm dialog:** title `Delete "{Page name}"?`; body "This page and everything on it is removed. Undo (⌘Z) brings it back."; buttons "Cancel" and destructive "Delete Page".
- **After confirm:** page is removed; an info toast `"{name}" deleted` with an "Undo" action button (8 seconds).

### Add a page
- **Flow:** footer "+  Add page" (or "Create blank page" in the empty state, or "+ Add page" in the one-page note) → a new page is created and its row opens straight into rename mode with the name selected. Default names: first page "Home", second "About", then "Page 3", "Page 4"… Failure → red toast "Couldn't add page right now. Try again."
- "From template" → switches the drawer to the Templates tab in **new-page mode** (see Templates).
- "⋯" → "New folder" → creates a folder called "New Folder" (rename it inline).

### Folders (browser-only grouping)
- **Notes:** Folders are a visual grouping stored in the browser per site — they are not part of the published site and do not change URLs.
- **Folder row (32px):** checkbox (filled when all members selected; a short dash "mixed" state when only some are) · chevron (rotates 90° when expanded) · folder glyph · folder name (13px) · member count in mono 11px, right-aligned · hover-only actions: pencil "Rename folder" and trash "Delete folder (pages kept)".
- **Actions:** click / `Enter` / `Space` toggles expand-collapse; double-click name or pencil → inline rename (`Enter` commits, `Esc` cancels, blank names are ignored); trash → removes the folder immediately, pages return to the ungrouped list (no confirm); drag a page onto the row → adds it (accent tint + dashed accent outline while hovering with a drag).
- **Expanded contents:** each member page row is indented and shows, on hover, a tiny "×" at its far left ("Remove from folder"). An expanded folder with no pages shows an italic muted line "Drag pages here" (also a drop target).
- **Copy used:** "New Folder", "Untitled Folder" (fallback for blank name), "Rename folder", "Delete folder (pages kept)", "Remove from folder", "Drag pages here", "Collapse {name}" / "Expand {name}", "Select all pages in {name}".

### Bulk toolbar (multi-select)
- **Where it lives:** Replaces the footer as a full-width 44px band on dark ink at the bottom of the panel, as soon as one or more pages are selected.
- **Contents:** "**N** selected" · "Duplicate" · "Move to…" · "Delete" (red text) · spacer · round "×" button (tooltip "Clear selection"). All text 12px white; hover gives a dark-grey pill.
- **"Move to…"** opens a small white menu above the band: one item per folder (or italic "No folders yet"), a separator, then "Remove from folder".
- **Duplicate:** duplicates each selected page, then clears the selection.
- **Delete:** opens the bulk confirm: title "Delete N pages?" (singular "Delete 1 page?"); body lists the names: "“Home 2”, “About” are removed from this site. One undo (⌘Z) brings them all back."; destructive button "Delete pages". After confirming the dialog switches to a success state — "Deleted" / "N pages deleted." — then closes itself. The home page is never bulk-deleted, and if the selection would remove every page the first page is spared; if nothing is deletable the single-page guard toast shows instead.
- **Keyboard:** `Esc` clears the selection.

### Go-to-page palette (⌘K)
- **Where it lives:** Anchored inside the panel just under the header, 256px wide, radius 10, shadow; an invisible overlay catches clicks outside to dismiss.
- **Contents:** text input (placeholder "go to page…", no border, bottom rule) and a scrolling list (max 320px) of page names in 11px; home page rows end with a "⌂" glyph. The highlighted row is accent-tinted with accent text.
- **Actions / keys:** fuzzy typing filters; `↑ ↓` move; `Enter` opens the highlighted page and closes; `Esc` or clicking outside closes; hovering highlights; clicking a row opens it.
- **Empty:** `No pages match “query”`.

### Listings view (SEO at a glance)
- **Where it lives:** Replaces the tree inside the Pages panel when "⊞ Listings" is clicked.
- **Layout:** accent back link "‹ Pages"; a grey 28px caps header band "PAGE · TITLE · DESC · SCORE"; 32px rows: page name (ink), search title (muted; falls back to the page name), "Set" (muted) or "Missing" (red), and a mono score right-aligned (red when under 50). Footer strip with an accent link "Open full listings ›" which widens the drawer to the 700px view.
- **Score rule (visible as the number):** starts at 100, −40 with no meta description, −15 when the title is just the page name, −25 when another page has the same title, −20 when indexing is off; never below 0.
- **Actions:** click a row (or `Enter`/`Space`) → opens that page's settings dialog.

### Structure view (site as a route tree)
- **Where it lives:** Replaces the tree when "⌸ Structure" is clicked.
- **Layout:** "‹ Pages" back link; muted line "N pages, by route."; a tree built from URL paths — "▾" before branches, "·" before leaves; each node shows the page name as a text button (accent when it is the active page) followed by its mono path (e.g. `/pricing/teams`). A path segment that has no page of its own is shown muted as "pricing/ (no page)".
- **Actions:** click a page name → opens that page on the canvas.

### Page settings dialog
- **Where it lives:** Centred card over a dark scrim, 580×520, radius 16, slides up 8px on open. Reached from a row's "Page settings…", from a Listings row, from the Templates "Page created" modal, and from Settings › Redirects ("Back to {Page} SEO", which lands on the SEO tab).
- **Header:** one-line title "Page settings — {Page name}" (16 semibold, ellipsised); under it a row of three text-link tabs "SEO", "Social", "Advanced" (active = blue, semibold). While indexing is on and the score is under 80, the SEO tab carries a small amber pill with the score number. A muted "✕" sits top-right ("Close page settings").
- **Saving:** there is no Save button — every change autosaves half a second after you stop typing; `⌘S`/`Ctrl+S` saves immediately. Success toast "Page settings saved". If a save fails, a red row appears at the bottom of the card: "Couldn't save your changes." with an underlined "Retry"; plus a sticky red toast "Save failed — your changes are still here." with a "Retry" action.
- **Validation toasts (amber) that block a save:** "Fix slug error before saving"; "Unclosed HTML tag detected. Ensure all tags are properly closed."; "Set an access password before saving".
- **Closing / switching with unsaved edits** (✕, scrim click, `Esc`, or clicking another tab while a save is pending or failed) opens the **Discard dialog** (440px): title "Discard unsaved SEO changes?" (or "…Social…" / "…Advanced…"); body "You edited the page title and description but didn't save. Leaving this tab throws those edits away." (Social: "the social title, description and image"; Advanced: "the page's advanced settings"); buttons "Keep editing" (accent, focused by default) and "Discard changes" (red outline). Discard then either switches tab or closes the dialog. `Esc` inside this dialog = Keep editing.
- **Error boundary:** if the dialog itself crashes it shows a header with a back chevron ("Close page settings"), title "Settings error", the error text in red, and a "Try again" button.

#### SEO tab (top to bottom)
1. Caps label "How your page looks in Google Search".
2. **Google preview card**: mono line "{domain} › {slug}" (domain falls back to "yoursite.com"), blue 16px title (meta title or page name), description in ink — or italic muted "No description — add one below to improve ranking".
3. **Score card** (when indexing is on): big mono number (green at 80+, amber below), caption "Looks good" / "Needs work", and a two-column checklist with green/grey dots: "Page title +30 pts", "Meta description +40 pts", "Clean URL slug +30 pts", "Allow indexing Required". Below it, when the score is under 80, an amber note "Reach 80+ before publishing — add a meta description (up to +40 pts)" (the clause after the dash only when the description is missing).
   - When indexing is **off** the score card is replaced by an amber banner: "**noIndex is ON** — search engines won't index this page regardless of your SEO settings." with an inline accent link "Turn indexing on →".
4. **"Meta title"** — header row has the label and a mono counter "N/60" with a suffix " · Too short" (amber, under 30), "" (green, 30–49), " · Ideal" (green, 50–60), " · Too long" (red). While the title is under 10 characters a small pill button "Write with AI" (play glyph, accent outline) appears; it asks the AI service for a title and fills the field (shows busy state; silently leaves the field if AI is unavailable). Input, max 60. Helper "Aim for 50–60 characters for best Google ranking".
5. **"Meta description"** — label plus a round "i" tooltip ("A short summary of your page shown in Google search results (keep under 160 characters)"); counter "N/160" (green over 50, red over 160); 3-row textarea, placeholder `E.g. "We help small businesses build professional websites. Start free today."`, max 160; helper "Briefly describe this page (150–160 chars). Appears in Google results below your title."
6. **"URL slug"** — mono prefix box "{domain}/" joined to a mono input. Typing is auto-formatted (lowercase, hyphens; "/" allowed for nested paths like `blog/post`; a leading slash is dropped). Helper states, in priority: red error ("URL slug cannot be empty" / "Slug must be lowercase" / "Slug cannot contain spaces — use hyphens instead" / "Only lowercase letters, numbers, and hyphens allowed" / `This slug is already used by "{Other page}". Choose a unique slug.`) → placeholder warning `“page-3” is a numbered URL — a descriptive slug ranks better (+10 pts)` → default "Lowercase letters, numbers, and hyphens only — auto-formatted as you type".
   - When the slug differs from the saved one **and the site is published**, an amber warning with a triangle icon: "Changing this URL will break existing links, bookmarks, and search engine results for this page. You can add a redirect once it saves."
   - After a slug change has saved, a grey **redirect offer card**: "URL changed from /old to /new. Add a redirect so old links keep working?" with "Add redirect" (secondary — leaves for Settings › Redirects with the pair prefilled) and "Not now" (ghost — dismisses for this change only). The home page's public path is always "/", so its slug edits raise no offer.

#### Social tab
1. **Share-card preview** (max 420 wide): a 1200:630 image area (the OG image, or a mono "1200 × 630" placeholder on grey), then domain (mono muted), title (13 medium — OG title → meta title → page name), description (OG description → meta description → "Add a description to preview here").
2. **"OG title"** — counter "N/60" (mono muted); input whose placeholder is the meta title/page name; helper "Title shown when the page is shared on social networks. Defaults to SEO title."
3. **"OG description"** — counter "N/160"; textarea, placeholder is the meta description or "Brief summary shown on social".
4. **"OG image"** — URL input, placeholder "https://…"; helper "Recommended size: 1200×630. Appears in Facebook, Twitter/X, LinkedIn previews."

#### Advanced tab
1. Caps label **"VISIBILITY"** — a three-segment control "Live / Hidden / Password" (selected segment is a raised white chip). Helper under it changes with the choice: "Page is publicly accessible." / "Page is not linked in menus but reachable via direct URL." / "Visitors must enter a password to view this page." When Hidden or Password is chosen an extra helper reads: "Not published. Hidden pages are left out of the deploy, and static hosting cannot ask for a password — so a password page is left out too, rather than going live unprotected. Until the published-site middleware ships, this is the only way the setting can be kept."
2. **Password box** (only for Password): grey card with an input (placeholder "Enter password", masked), "Show"/"Hide" toggle button, "Copy" button (disabled while empty; red toast "Could not copy password" on failure); helper "Share this password with visitors who need access."
3. Caps label **"SEARCH ENGINE INDEXING"** — two toggle rows: "Allow indexing" ("Let search engines list this page in results.") and "Follow links" ("Let search engines follow outbound links on this page.").
4. Caps label **"CUSTOM <HEAD> CODE"** — 6-row mono textarea, placeholder `<!-- analytics, meta tags, fonts -->`; red helper on error "Unclosed HTML tag detected. Ensure all tags are properly closed."; helper "Injected into the <head> of this page only. Sanitized before save."
- **Not present in this dialog** (for the designer's checklist): favicon, canonical URL, language, per-page scripts in body, scheduling, dynamic/CMS pages. Redirects live in the Settings panel and are only linked from here.

### Routing facts a user can see
- Paths are lower-cased, always start with "/", never end with "/". The home page answers at "/" no matter what its slug says. Slugs may contain "/" to make nested URLs ("blog/post"). There is no 404 page, redirect, or dynamic-page feature in this part of the editor.

---

## Part 2 — TEMPLATES

### Template catalogue (what ships)
Ten built-in **page** templates, all single-page HTML layouts with their own colours and fonts (the site's brand tokens are **not** applied to them). "Sections" appear as a category but no section templates ship, so that group is always empty. User-saved templates appear under "My Templates".

| Name | Icon | Tier | Card colour | Sections (as counted on screen) | What it contains |
|---|---|---|---|---|---|
| SaaS Landing | 🚀 | Free | dark navy → indigo | 3 | Nav ("Acme SaaS": Product, Pricing, Docs, "Get Started"), hero "Ship faster with less complexity" with "Start free trial" / "Watch demo", 3-feature row (Blazing Fast, Enterprise Security, Deep Analytics) |
| Portfolio | 🎨 | Free | dark slate | 3 | Nav ("Alex Chen": Work, About, Contact), hero "Product Designer" with "View Work" / "Download CV", two work tiles |
| Agency | 💼 | Free | dark green | 3 | Nav ("Studio.": Services, Work, About, "Get in touch"), hero "We build brands that matter." + "See our work →", stats row (150+ projects, 8yr, 98%) |
| E-Commerce | 🛒 | **Pro** | dark brown → orange | 3 | Nav ("ShopCo": Men, Women, Sale, search/cart), hero "Summer Collection 2024 · Style that speaks for itself." with "Shop Now" / "View Sale", 4-product grid with prices |
| Blog | 📝 | Free | dark navy | 3 | Nav ("The Dispatch": Articles, Topics, Newsletter, "Subscribe"), featured article card with author/date, 3 article rows with read times |
| Startup | ⚡ | Free | deep purple | 2 | Nav ("LaunchKit": Product, Pricing, "Join beta"), hero "Launching Q1 2025 · From idea to launch in 24 hours." + "Get early access" |
| Restaurant | 🍽️ | **Pro** | dark brown → red | 3 | Nav ("Ember": Menu, About, Contact, "Reserve"), hero "Where every meal is an experience." + "Reserve a table →", 3 dish tiles |
| Minimal | ◻ | Free | near-black | 3 | Nav ("MJ": Work, About), hero "Designer & Maker" + "View work ↓", two tiles |
| SaaS Pro | 🔷 | **Pro** | dark blue | 2 | Nav ("Prism": Platform, Pricing, Docs, "Sign in", "Start free"), hero "The analytics platform for serious teams." + "Start for free" / "Book demo" |
| Coming Soon | ⏳ | Free | dark navy → purple | 1 | Single full-height section "Something awesome is coming." with "Notify me" and a days/hours/minutes countdown |

Each also carries a "page count" (SaaS Landing 4, Portfolio 3, Agency 5, E-Commerce 6, Blog 3, Startup 4, Restaurant 4, Minimal 2, SaaS Pro 7, Coming Soon 1) which the detail panel prints as "with N pages" even though applying inserts one page of content. Categories shown on cards: "Site pages". Every template is version "1.0.0".

### Templates drawer — compact gallery (default, 280px)
- **Where it lives:** Left drawer, "Templates" tab (also reached from Insert's TEMPLATES group).
- **Layout:** panel header "Templates" (expand, close) → a search field on a panel-coloured band (placeholder "Search templates…", always visible) → scrolling list: caps section label "PAGE TEMPLATES" then one full-width card per template (88px gradient thumbnail with a hairline border, then name in 13 medium and "N sections" muted right) → caps label "SECTION TEMPLATES" followed by 32px rows "Name · Free/Pro · ›" (never shown today: no section templates exist) → pinned white footer with a bordered secondary button "Browse all templates".
- **Actions:** click / `Enter` / `Space` on a card → **Apply modal**; "Browse all templates" → expands the drawer to the 700px full gallery; typing filters by name and description.
- **States:** *no matches* — "Nothing matches ‘query’." with accent "Clear search" (left-aligned under the search); *catalogue empty* (not reachable with built-ins) — "No templates yet." / accent "Starter templates are coming — start blank for now."; *saved-templates sync failed* — a block above the list: red "Couldn't load templates.", muted "You can keep building from Insert.", accent "Try again" (the built-in cards still show below it). Section labels are omitted when their group is empty.

### Apply modal (from a compact-gallery card)
- **Where it lives:** Large centred modal.
- **Layout:** title = template name (16 semibold); fact line "N sections · Free" or "N sections · Pro"; a 320px-tall bordered white box showing the real template scaled down (desktop width) as a live preview; sentence "Applying replaces the content of {Page name}. Your version history keeps the previous state." (or "Applying replaces the current page content." if no page name); bordered footer with ghost "Cancel" and primary "Apply template".
- **Flow:** "Apply template" → same gate as everywhere: non-admin → toast; Pro template → Upgrade modal; page already has content → **Replace confirm**; otherwise applies immediately with the progress card.

### Full gallery (expanded 700px, detail mode, or new-page mode)
- **Header variants:**
  - Default: title "Templates" with subtitle "10 templates"; a magnifier icon button on the right toggles a search row (label "Search templates" / "Close search").
  - Detail open: **drill-in header** — "‹ Back to Templates" button and breadcrumb "Site pages / {Template name}", plus close.
  - New-page mode (arrived from Pages › "From template"): title "Choose a template for your new page" with an accent-tinted pill "New Page" and a close "×"; search row is shown by default.
- **Search row:** 36px grey box with magnifier, placeholder "Search templates...", and an "×" clear button when non-empty. While searching, a small muted line above the grid reads "N results for “query”" and matching letters in card names are highlighted with an accent-tinted mark.
- **Filter pills (stage 1):** "All", "Site Pages", "Sections", "My Templates" (28px bordered pills; active = dark ink border). Choosing Site Pages or Sections switches to **stage 2**: type pills "Page Templates" / "Section Templates", and a second row of rounded grey tag chips "Hero", "Features", "Pricing", "Testimonials", "CTA", "Footer", "Contact" (accent-tinted when active; click again to clear). "My Templates" lists the user's saved templates (📄 icon, description as subtitle).
- **Grid:** 2 columns, 6 cards per page. Card = 4:3 gradient thumbnail with the emoji icon; top-right "Pro" badge, or an accent "APPLIED" badge when this template is the one last applied to the current page; below: name (13 semibold) and "Site pages · Free" / "Site pages · **Pro**" (Pro in amber). Hover: accent border + raised shadow; selected: accent border + accent ring; applied: 2px accent border; focus: accent outline. Click / `Enter` / `Space` toggles the detail panel.
- **Pagination bar** (only with more than one page): "‹  1 2 3 … 7  ›" with the current page filled accent; Prev/Next disabled at the ends.
- **Empty states:** large faded magnifier icon + `No templates found for "query"` with link "Clear search", or "No templates in this category" with link "Show all templates".
- **Keyboard:** `← →` move the detail selection to the previous/next card; `Esc` closes, in priority: full-screen preview → replace confirm → detail panel.
- **Error banner** (floating near the bottom of the panel, red tint, red border): the error text, an outlined "Try again" (when retry is possible) and an "×" dismiss.

### Template detail panel
- **Where it lives:** A 380px column on the right of the full gallery (the grid dims to 55% opacity while it is open).
- **Layout (top to bottom):** 180px preview block (gradient) with an optional mono accent badge "APPLIED HERE" → name (15 semibold) → description, or the fallback "A site pages template with N pages." / "A site pages template with N pages — Pro plan required." → pill row: type pill (grey, e.g. "Page"), tier pill ("Free" green tint / "Pro" amber tint), and when used somewhere an accent pill button "Used in N pages →" → caps label "APPLY TO" above a rule → stacked full-width buttons: primary "Apply to current page ({Page name})", outlined "Add as new page", ghost "Preview full-screen" (Pro templates show a single primary "🔒 Upgrade to use" instead of the first two) → grey info note with an "i" glyph: "Replacing current {Page name} page content. Add as new page instead?" (the last sentence is an underlined link; hidden for Pro).
- **Actions:** as labelled; "Used in N pages →" opens the Usage dialog.

### "Where this template is used" dialog
- **Where it lives:** Large centred modal.
- **Layout:** title "Where ‘{Template}’ is used" → underline tabs "Preview", "Used in", "Versions" → panel (scrolls, max ~360px) → footnote "Changes to the template never touch pages already created from it." → footer with a ghost "Close".
- **Preview tab:** thumbnail image if one exists, otherwise a dashed grey box "No preview thumbnail"; primary button "Open full preview →" (opens the full-screen preview).
- **Used in tab:** one tinted chip per page — page name (medium), small "v1.0.0" chip, date ("Jan 15, 2026"); clicking jumps to that page and closes. Empty: "Not applied to any page yet".
- **Versions tab:** a grey "Current version — v1.0.0" row, then a newest-first timeline of applications (page · version chip · date); rows applied with an older version get an amber border and the label "update available". Empty: "No applies yet — when you apply this template, the history will appear here."

### Full-screen preview
- **Where it lives:** Centred on a dark scrim, up to 1100×780 (92vw × 88vh), fades/scales in and out (150ms).
- **Top bar (42px):** template name + "N sections" · a segmented viewport toggle with three icons (Desktop 1100px, Tablet 700px, Mobile 375px; tooltips "Desktop"/"Tablet"/"Mobile"; active = white chip with accent icon) · "×" ("Close preview").
- **Body:** grey stage with a white framed page at the chosen width (width animates), showing the template scaled down.
- **Bottom bar:** grey "← Back" and a full-width primary button reading "Apply to Canvas" (empty page), "Replace Canvas with This" (page has content) or "🔒 Upgrade to Use" (Pro).
- **Keys:** `Esc` closes.

### Replace confirm (page already has content)
- **Where it lives:** Centred modal, dismissible by scrim.
- **Copy:** title "Replace this page with ‘{Template}’?"; body "Everything on {Page name} will be replaced by the template (N elements). The template brings its own colours and type — your brand tokens are not applied to it."; two checkbox options each with a bold title and small hint: ☑ "Save the current page as a backup version first" — `Keeps your work as “{Page name} (backup)”.` (checked by default); ☐ "Reset global styles to template defaults" — "Overrides your brand colours with the template's."; footer "Cancel" / primary "Replace page".
- **After "Replace page":** if backup is on, a duplicate named "{Page} (backup)" (numbered "(backup 2)" on collision) is added first; then the progress card runs.

### Applying progress card
- **Where it lives:** 440px card centred on a scrim, above everything.
- **Layout:** title "Applying {Template}…" (16 semibold), sub "Do not close the editor"; a 6px determinate accent bar; then one 12px line per step with its state as a word: "Resolving brand tokens — done", "Importing template HTML — applying…", "Rendering on canvas — queued", "Saving applied state — queued" (queued rows are muted; the active one is medium weight). While importing, the sections actually converted are appended under the import step as done rows, named from the markup, e.g. "Navigation (1/3) — done", "Section (2/3) — done". A bordered footer holds a 28px secondary "Cancel" — only offered until the import lands; afterwards the footer disappears.
- **Outcome:** green toast `"{Template}" applied successfully`; the card's APPLIED badge moves to this template; a version snapshot is taken automatically. Failure: red toast "Template apply failed — nothing was changed" with a "Retry" action and the in-panel error banner. Specific messages: "Editor not ready — please reload and try again", "Template has no content", "Template apply timed out. Please retry." (after 15s), or the underlying error text.

### New page from template (Pages › "From template")
- **Flow:** Templates opens in new-page mode → pick a card → detail → "Add as new page" → confirm modal "Create a page from ‘{Template}’?" with body "A new page ‘{Template}’ will be added after your current pages." and buttons "Cancel" / "Create page" → progress card → on success the editor is already on the new page and a modal "Page created" shows "✓ ‘{Template}’ is ready — you're on it now." with "Open page settings" (jumps to Pages and opens that page's settings dialog) and "Done". On failure: modal "Couldn't create the page" — "{reason} Your pages are unchanged." (default reason "The template failed to load.") with "Cancel" / "Try again". The new page takes the template's name.

### Gating
- **Role:** applying or adding a template needs the Admin (or Owner) workspace role; anyone lower sees an amber toast "Only an admin can apply a template".
- **Pro templates (E-Commerce, Restaurant, SaaS Pro):** any apply action opens the **Upgrade modal** — title "Upgrade Your Plan", a purple "Pro" badge, "{Template} requires the Pro plan.", a ✓ checklist "Custom domain / Premium templates / AI-powered features / Priority support", buttons "Maybe Later" and "Upgrade to Pro" (opens the billing page in a new tab).

### Save page as template (modal, opened from elsewhere in the editor)
- **Copy:** title "Save page as template", "×" close; field "Template Name" (placeholder "My Template", auto-focused); "Description (optional)" textarea (placeholder "Describe your template...", 3 rows); muted note "Tokens are snapshotted — applying it later re-maps them to that site's brand."; footer ghost "Cancel" and primary "Save template" (disabled until a name is typed; shows busy while saving). Saved templates then appear under the "My Templates" pill and in the compact gallery, and are synced to the server.

### Legacy pieces that exist but are not reachable from any screen
- An older "My Templates" list (search "Search my templates...", grey count pill "N saved templates", rows with a dark thumbnail, 👁 "Preview" / ✏️ "Rename" / 🗑️ "Delete" hover icons and a "Use" button; two-click delete with a red bottom toast "Click delete again to confirm"; empty state 📁 "No saved templates" / "Save your designs as templates to reuse them later.").
- An older template preview modal with 🖥️/📱/📲 device buttons and a "Use Template" button, a category badge and tag badges.
- An engine-level template manager (categories "landing-page, portfolio, blog, ecommerce, dashboard, email, marketing, business, creative, other") marked deprecated; nothing on screen uses it.

---

## Part 3 — LAYERS

### Layers panel
- **Where it lives:** Left drawer, "Layers" tab.
- **Purpose:** Every element on the current page as a tree; select, reorder/nest by drag, dim, lock, rename.
- **Layout (top to bottom):**
  1. Panel header "Layers" (expand, help, close).
  2. **Toolbar** (36px): a grey 28px search box (placeholder "Search", no icon) and three 13px text-glyph icon buttons "⊞" (tooltip "Expand all"), "⊟" ("Collapse all"), "⚙" ("Display settings").
  3. **Breadcrumb slot** (always present so the tree never jumps): when exactly one element is selected and it has ancestors — "Section / Container / **Heading**" where each ancestor is a clickable grey button and the current one is accent bold.
  4. **Purpose line** (when the page has elements and no search): "Every element on this page. Drag a row to reorder or nest it." (11px muted).
  5. **Selection banner** (2+ selected) — see below.
  6. **Tree** (scrolls; native scrollbar hidden, replaced by a persistent 4px grey thumb on the right edge).
  7. **Count footer** (28px): "N layers" / "1 layer", or "N selected of M" when 2+ are selected. Hidden when the tree failed to load.
- **States:** *loading* — 7 skeleton rows (12px pulsing square + uneven bar, indented like a nested tree), label "Loading layers"; *load error* — red "Couldn't load the layer tree.", muted "The page is fine — only this list failed.", accent link "Try again" (re-mounts the tree only); *empty page* — centred muted "This page is empty. Drop something on the canvas to see it here." plus accent link "Open Insert"; *no search matches* — "Nothing matches ‘query’." + "Clear search"; *searching* — only matching rows, shown **flat** (no indent, no chevrons), ancestors auto-expanded; screen-reader text "N layers found" / "No layers match your search".

### Display settings popover
- **Where it lives:** Small popover (min 220px) under the "⚙" button; closes on outside click or `Esc`.
- **Contents:** caps mono header "DISPLAY SETTINGS" with an "×"; three toggle rows with tiny 18×10 switches: "Show HTML tags" (sub "div, section, h1…"), "Show element IDs" (sub "#abc123 format"), "Compact rows" (on by default). Choices are remembered in the browser.

### Layer row
- **Size:** 28px tall (compact default), indented 12px + 16px per level.
- **Left to right:** chevron (9px, points down when expanded, rotated when collapsed; invisible on leaves; tooltip "Expand children"/"Collapse children") · 13px type icon · name · optional "◇" green **component instance** badge (tooltip "Component instance") · optional mono grey tag badge (e.g. "div") when "Show HTML tags" is on · optional mono "#" + first 12 characters of the id when "Show element IDs" is on · optional tiny bordered "M" / "T" badges (tooltips "Hidden on mobile" / "Hidden on tablet") · **eye** button · **lock** button.
- **Name rule:** a custom name you gave it → otherwise, for text-like elements, the first 32 characters of their own text (with "…") → otherwise the type label.
- **Type labels and icons** (label → icon shape): Heading 1–6 → heading glyph; Paragraph → left-aligned lines; Text → text file; Container → box; Section → layout template; Navigation/Navbar → compass; Header → panel-top; Footer → footprints; Main → panel; Article → newspaper; Sidebar → panel-right; Link → chain; Image → picture; Video → camera; Button → mouse pointer; Input → form field; Textarea → document; Select → ordered list; Form → square; List / Ordered List / List Item → list, ordered list, dot; Hero → house; Features → sparkles; Grid → grid; Flex → move arrows; Icon → shapes; Divider → minus; Card → credit card; iframe → globe; anything else → box.
- **Eye button** (always visible, muted; darker on hover/selection): tooltip "Dim in editor — the element still publishes"; when dimmed the glyph is a slashed eye and the tooltip reads "Show in editor — this element publishes either way". Dimming affects only the editor canvas (element drawn at 25% and not clickable) — it does not hide the element on the live site.
- **Lock button:** tooltips "Lock element" / "Unlock element"; a locked element cannot be dragged or renamed from the tree and the canvas treats it as locked.
- **Row states:** *hover* light grey; *canvas is hovering this element* light grey; *selected* accent tint with a 2px accent bar at the left; *renaming* panel-white with a 1px accent stroke; *dimmed* whole row at 45% opacity; *dragging* 50% opacity; *drop before/after* a 2px accent line above/below; *drop inside* accent tint with an inset accent ring; *focus* 2px accent outline.
- **Actions:** click → select on canvas (auto-scrolls the row into view and expands ancestors when selection comes from the canvas); `⌘/Ctrl`+click → add/remove from selection; `Shift`+click → select the range; double-click → inline rename (not on locked rows); right-click → context menu; drag → reorder or nest (top 30% of a row = before, bottom 30% = after, middle = inside for containers). Top-level rows cannot be dragged (only nested rows can). Hovering a row highlights the element on the canvas, and hovering on the canvas highlights the row.
- **Inline rename:** the name becomes a borderless 13px input inside the accent-stroked row; `Enter`/blur saves, `Esc` cancels; an empty name removes the custom name and the row falls back to its default label. Names, dims, locks and expand state are remembered per page in the browser.
- **Keyboard (row focused):** `Enter`/`Space` select; `F2` rename; `→` expand; `←` collapse; `↑ ↓` move selection through visible rows (wraps).
- **Drop rejections** show a dark 3-second alert band above the tree: "Cannot drop inside a locked container", "{type} cannot contain children", "{type} cannot be nested inside {type}", "Cannot drop next to elements in a locked container", "{type} cannot be placed in {type}".

### Layer context menu
- **Where it lives:** 140px white card, radius 8, at the pointer; focus moves to the first item; closes on outside click or `Esc`.
- **Items:** "Cut", "Copy", "Paste" (disabled until something is cut/copied — tooltip "Copy or cut an element first") — rule — "Copy link", "Duplicate", "Delete" — rule — "Rename", "Group selection" (disabled with fewer than 2 selected — tooltip "Select 2 or more layers first"). No icons, no shortcut hints. Disabled items are muted with a not-allowed cursor.
- **Outcomes:** Copy link copies an editor URL that reopens this site with the element selected — toast "Link copied — opens the editor with this element selected" or "Couldn't copy the link". Delete removes immediately (undoable). Group wraps the selection in a new container in place. Paste inserts into/next to the clicked row using the canvas paste rules.
- **Note:** an older layer context menu (Rename / Group / Lock–Unlock / Delete with icons, plus a red "drag validation" tooltip) still exists in the codebase but is not used by any screen.

### Selection banner (2+ layers selected)
- **Where it lives:** Grey band with a bottom rule, above the tree.
- **Contents:** "N selected" · icon buttons: four-squares "Group", eye "Dim in editor — these elements still publish", trash "Delete", "×" "Done" (clears the selection; `Esc` does the same).
- **Delete flow:** shows an inline amber-railed confirm under the banner — "Delete N layers?" with a red "Delete" and a ghost "Cancel"; confirming removes all of them in one undoable step.

---

## Part 4 — VERSION HISTORY

### Version History panel
- **Where it lives:** Left drawer, "History" tab (title "Version History"). Can also be deep-linked straight to its Published view from the top bar's menu.
- **Layout (top to bottom):**
  1. Panel header "Version History" (expand, help, close).
  2. **View switcher** (40px, bottom rule): two tabs each with a helper line — "Saves" / "Named milestones" and "Published" / "What's live". Active tab = ink, semibold, 2px accent underline; inactive = muted.
  3. *(Saves only)* **Filter row**: two 24px pill chips "Saved versions" and "This session" (active = filled accent), and — on Saved versions — a right-aligned small "Time-Travel" button with a clock-arrow icon (tooltip "Time-Travel (Ctrl+Shift+T)").
  4. *(Saves only)* **Search bar** (53px band): magnifier icon, input placeholder "Search saves..." or "Search changes...", "×" clear when non-empty.
  5. **List area** (scrolls) with fixed chrome above and below it.
- The last-used view/filter is remembered per site.

### Chrome shared by both Saves lists
- **Time-travel preview band** (only while the scrubber is open): accent-tinted 44px row "Previewing {entry label}" with buttons "Exit (Esc)" (light) and "Restore this version" (primary); under it a muted line "Nothing is written until Restore. Esc exits time-travel."
- **Approval band** (only when a client review has been approved): full-bleed green-tinted strip with a 3px green rail — "⚑ APPROVED", meta "{Reviewer name} · 18 Jul, 15:42", and a bordered white "Compare with current" button (opens the Review panel's compare view). Below it a "now" row: accent dot + "Now — N changes since approval" and a muted summary of up to three change labels, e.g. "hero copy · 2 images · menu".
- **Retention note** (grey strip under the list): on Saved versions "50 versions kept. Auto-saves prune oldest first; named ones never prune."; on This session "This session only — the last 100 steps, cleared when you reload. Save a version to keep a point."

### Saved versions (milestones) list
- **Purpose:** Named snapshots you can compare, restore or delete. A snapshot is also taken automatically whenever a template is applied ("Auto-save").
- **States:** *loading* — five staggered skeleton rows; *load error* — red "Couldn't load version history.", muted "Your versions are still stored. Only this list failed to load.", and a grey 40px foot "Retry, or reopen Versions in a moment." with an accent "Try again"; *feature unavailable* — clock icon, "Version history appears here as you save changes." / "Use Ctrl+Z for undo. Saved versions persist across sessions."; *empty* — "No saved versions yet." / "Versions are created whenever you name one, or when a template is applied."; *no matches* — "No matching versions" / "Try a different search term."
- **Notices above the list:** amber rounded "Older auto-saves were removed" / "Past 50. Named versions were kept." (after pruning); accent "Restoring {name}…" / "Saving your current work as {version} first." (while a restore runs).
- **Date group headers:** "Today", "Yesterday", or "Sep 12, 2026".
- **Version row** (64px slot): name (13 medium; auto-saves always read "Auto-save"), then time "16:20", relative time ("2h ago"), an accent-tinted "N changes" chip when known, and a grey "Auto" chip for auto-saves. Hover/focus reveals a right-aligned action strip: primary "Compare", "Restore" (shows "..." while restoring), red "×" (delete). Hovering 300ms shows a 160px floating thumbnail of that version to the right of the row (if a snapshot exists).
- **Delete:** the row turns red-tinted and the strip becomes "Delete" (red) / "×" cancel; confirming removes it — toast "Deleted {name}" or "Delete failed".
- **Restore:** an accent-tinted confirm block appears at the top of the panel: "Restore “{name}”?" / "Your current work is saved first — nothing is lost." with "Cancel" and "Restore". Then the restoring notice, then a toast "Restored to 16:20" (or "Restore failed").
- **Save a version:** footer link "+ Save a version" (accent text) → an inline grey form: label "Version name *", input placeholder "e.g. Homepage redesign" (max 50, counter "N/50"), buttons "Cancel" and primary "Save Version" ("Saving..." while busy; disabled until a name is typed). `Enter` saves, `Esc` cancels. Toast "Saved '{name}'" or "Save failed".

### Compare (inline under the list, from a row's "Compare")
- **Layout:** a pill toggle "Visual | Semantic" (Visual is disabled with tooltip "No visual snapshot available for this version." when no screenshots exist) → optional AI summary bubble → in Visual mode two side-by-side screenshots labelled "Current" and "{version name}" → summary chips "N style", "N text", "N layout", "N content", "N other" → "N pages added, N pages removed" line when relevant → in Semantic mode a list of up to 20 changes, each "+ / − / ~" then the property then before and after values, with "+N more changes" if longer → button "Get AI Summary".
- **Empty compare copy:** "This is the newest version — there is nothing later to compare it against." or "Nothing changed since “{name}”."
- **AI summary:** button reads "Generating..." while running and "Get AI Summary (Ns)" during a 60-second cooldown; errors under it: "Please wait Ns before requesting another summary", "AI summary unavailable", "Compare data not loaded yet", "Empty summary returned". A summary, once produced, is stored on the version and shown immediately next time.

### Milestone suggestion banner (AI)
- **Where it lives:** Accent-tinted rounded banner at the top of the Saved versions list, when the AI proposes a checkpoint (after a page is added, an element is deleted, a large change, or ~10 automatic checkpoints; at most one suggestion every 30 seconds).
- **Layout:** clock icon; trigger line in 11px muted ("New page added" / "Element deleted" / "Significant changes" / "Editing session progress"); suggested version name in 13 medium; a one-line muted reasoning; a full-width action row: primary "Save" (shows "…" while saving), secondary white "Edit", ghost "Dismiss". Edit turns the name into an input (max 50; `Enter` saves, `Esc` reverts) with a single primary "Save".
- **Gating:** requires the AI service; hidden otherwise.

### This session (undo trail)
- **Purpose:** The step-by-step undo history of this editing session (up to 100 steps, gone on reload).
- **Header row:** "Undo History" label; right side "Clear" (disabled when nothing to undo; click turns it into red "Clear all" + "Cancel") and the "Time-Travel" button.
- **Rows** (44px, grouped under "Today" / "Yesterday" / "Apr 7"): label such as "Moved layer", "Added block", "Changed background color", "Edited text", "Applied template", "Imported HTML", "Deleted", "Resize", "Paste", "Checkpoint"…; a meta line with the time as a small link ("14:32", tooltip "Restore the project to 14:32 — discards every later change"), relative time, a 16px accent initial chip for the author when known, and badges: "Current" (newest row), "Checkpoint", "N changes". Rows with details end in a chevron; clicking expands a diff list: each line an operation glyph ("+", "−", "~", "·"), the property, a type badge (style / text / layout / content / other) and "× N" when repeated; over five lines a "Show all N changes" / "Show less" button. Hover/focus highlights a row; the "Current" row is tinted.
- **Restore from a step:** clicking the time opens a destructive confirm: title "Restore to 14:32?"; body "This rewinds the project to **{label}** at 14:32. It permanently discards 3 later changes and everything you can currently redo. Some of that work has not been saved yet." (or "Nothing later is discarded."); confirm "Restore, discard 3 changes" (or "Restore to 14:32"). The canvas cross-fades during the restore.
- **Footer hints:** keycaps "j k navigate · Enter expand · g G start/end".
- **Keyboard:** `j`/`↓` and `k`/`↑` move focus, `g`/`G` first/last, `Enter`/`Space` expand, `Esc` collapse and cancel Clear.
- **States:** *loading* — three skeleton rows; *empty* — wave icon, "No undo history", "Use Ctrl+Z to undo changes"; *no matches* — "No matching entries" / "Try a different search term"; *error* — "⚠ Failed to load activity" with "Retry".

### Time-Travel scrubber
- **Where it lives:** A drawer that slides up over the bottom of the canvas (the panel stays open); the canvas shows a screenshot of the nearest saved version as a preview layer. Opened by the "Time-Travel" button or `Ctrl+Shift+T`.
- **Contents:** label "Previewing: 14:32 — {entry label}" (or "No entry selected"); a range slider; three times underneath (first, current in accent, last); buttons "Restore this point" (primary) and "Exit time-travel" with a small "Ctrl+Shift+T" hint. Empty: "No history entries to scrub through."
- **Keys:** `← →` step one entry; `Enter` restores; `Esc` or `Ctrl+Shift+T` exits. Dragging the slider dims the rest of the UI slightly.

### Published view
- **Purpose:** The versions that have actually gone live, with rollback. (This list is the same component the Publish panel embeds; the full rollback flow is documented with Publish.)
- **Summary of what is shown:** a green "LIVE · v5" banner with "{domain} · published 2h ago"; rows "Version N" with a "Live" chip on the current one and meta like "↩ from v3 · 2h ago"; a "Compare" link between consecutive versions; a note "Every publish is restorable. Rolling back redeploys that version."; and a full-width "Roll back to a published version…" button (disabled with tooltip "Ask an admin to roll back" for non-admins or "There is only one published version") that opens a picker modal ("Roll back to a published version", radio rows "v3 · published 2d ago", the live one marked "live" and unselectable; "Cancel"/"Continue") then an amber confirm "Roll back to v3?" — "This publishes v3 again as v6. Your current v5 stays in history — nothing is deleted or rewritten." with an info box "The publish list only ever grows." / "v6 will name v3 as its source." and buttons "Cancel" / "Roll back to v3"; then a "Rolling back…" progress modal and result states "Rolled back" / "Rollback failed" + "Try again".
- **States:** loading "Loading versions…" with spinner; error "Couldn't load publish history" + "Retry"; empty "No published versions yet" / "Publish this site and each version shows up here — you can roll back to any of the last 20."; no site open: "Open this site from the dashboard to see its publish history."

### Engine facts a user can observe
- Undo/redo keeps the last 100 steps; a template apply, a bulk page delete, a layer group/move/delete are each a single step.
- 50 saved versions are kept; when the cap is hit the oldest auto-saves are pruned (named ones never are) and the amber notice appears. Restoring a version first saves the current state as its own version. An auto-save is created every time a template is applied (deduplicated if nothing changed).

---

## Part 5 — Shared drawer pieces (used by these and other tabs)

- **Panel header:** 48px, title in 13 semibold; right-side actions — expand/collapse (labels "Expand {Panel}" / "Collapse {Panel}", toggles the drawer between 280 and 700), "Help", and "Close {Panel}". Some tabs add their own controls beside the title (Pages' ⌘K keycap, Templates' magnifier).
- **Drill-in header:** used by Templates detail and component detail — a "‹ Back to {Parent}" button (auto-focused) over a small breadcrumb "Parent / Current" (current in medium weight), with the same expand/help/close actions on the right. `Esc` goes back unless you are typing in a field; can be guarded by an unsaved-changes prompt.
- **Search bar:** 28px grey box with a hairline border, 13px text, no magnifier and no clear button; optional mono keyboard hint at the right (e.g. "⌘F"); typing is debounced 300ms. Clearing is `Esc` or an empty-state "Clear search" link. (Used by Build and Media; Pages/Layers/History draw their own variants described above.)
- **Panel load-error block:** left-aligned, 24px gutters — red 13px headline (e.g. "Couldn't load your brand system."), 12px muted "what was not lost" line, accent "Try again" link. Used by Components and Brand; Pages/Layers/History render the same shape inline.
- **Available but currently unused by any screen:** a "View: {value}" dropdown switcher (28px trigger, listbox with check mark on the selected row), a 60px feature card (icon box, title, subtitle, count/"Pro"/"Coming Soon" badge, chevron) with an optional caps group label, a horizontal scrolling filter-chip row (arrow keys move selection), and a sticky footer with "Unsaved changes" dot indicator and primary/secondary buttons.

---

# Add / Insert panel, Components, and the AI panel

**What this module is.** This is everything a user reaches for when they want to *put something new on the page* or *ask the AI to change the page*. It has four faces: (1) the **Add panel**, a left-hand drawer opened from the rail's "Add" button, listing every element, pre-built block, and reusable component the user can click or drag onto the canvas; (2) a smaller **Element Picker modal** that pops up from the canvas selection toolbar's "Add" action to drop an element *inside* the selected one; (3) the **Components** system — the user's own saved, reusable pieces (create from a selection, insert copies called "instances", update every copy at once, detach a copy, delete), plus a read-only catalogue of Buildrik's canonical design-system components; and (4) the **AI panel**, a chat-style assistant that proposes edits as a reviewable diff (never writes directly), can run a multi-step "draft" plan, and has an in-canvas mini popover for one-element edits.

Throughout, "toast" means the small temporary notification that slides in at the edge of the editor.

---

## PART A — The Add panel (left drawer)

### A1. Add panel frame and header
- **Where it lives:** Left drawer, opened from the rail button labelled **"Add"** (rail tooltip / screen-reader text: "Add elements, blocks and components to your page"). Keyboard shortcut to open the tab: **A**. Default drawer width 280px; the header's expand action widens it to 700px.
- **Purpose:** One place to insert anything: elements, blocks, catalogue components, and the user's own components.
- **Layout / contents (top to bottom):**
  1. **Header row** — title **"Add"**. Right-hand icon buttons, in order: **Expand** (corner-brackets icon; screen-reader label "Expand Add", becomes "Collapse Add" when expanded; shows pressed state) then **Close** ("Close Add"). There is no Help button on this panel today (the header supports one, but nothing wires it for Add).
  2. **Search band** (40px tall, 12px inset) — see A2.
  3. **Purpose line** (hidden while searching) — see A3.
  4. **Scrolling body** with four collapsible groups: **ELEMENTS**, **BLOCKS**, **COMPONENTS**, **MINE** — see A4–A7. When a search is active the body is replaced by the flat search-results list (A8).
  5. **Pinned bottom** (never scrolls, stays even during search): the **"⌥  Paste HTML…"** row (A9) then the **Tips strip** (A10).
- **Other entry points into this panel:**
  - Canvas right-click menu on a section-type element → **"Replace with block…"** opens the Add panel *and* expands the BLOCKS group.
  - Layers panel empty state has an "add a block" call to action that switches to Add.
  - The Templates tab returns the user to Add after a template is used.
- **Gating / notes:** No feature flags. The panel is static data, so it never loads or errors in practice (designed loading/error states exist — see A11).

### A2. Search
- **Where:** Directly under the header.
- **Layout:** A single text field, placeholder **"Search elements"**. At the right edge, inside the band, a bare monospace hint **"⌘F"** (no chip, no border, no background). There is **no magnifier icon and no ✕ clear button**. The hint stays visible while typing.
- **Actions:**
  - Typing filters after a 150ms pause.
  - **Escape** while the field has text clears it (and restores whichever groups were open before the search).
  - Clearing the field or the "Clear search" link in the empty state exits search.
- **Keyboard shortcuts:** **/** (when not typing in another field) and **⌘F / Ctrl+F** (always, even while typing — the panel hijacks browser find) focus and select the search field.
- **States:** default (empty, hint shown); typing; results (A8); no results (A8).

### A3. Purpose line
- A single muted 11px sentence under the search band, hidden during search. It changes with the canvas selection:
  - Nothing selected / multiple selected: **"Click a row to add it at the end of the page. Drag elements onto the canvas instead."**
  - One element selected: **"Click a row to add it inside or next to {Type} where it fits. Drag elements onto the canvas instead."** — where {Type} is the selected element's type with a capital (e.g. "Section", "Container", "Heading").

### A4. Group headers (shared by all four groups)
- **Layout:** 28px tall row: a small chevron (**▾** open / **▸** closed), the group label in 11px semibold caps with 0.5px tracking (**ELEMENTS / BLOCKS / COMPONENTS / MINE**), and a right-aligned live **count** in 11px tabular numerals. Counts today: ELEMENTS 53, BLOCKS 50, COMPONENTS 14, MINE = number of the user's own saved components (0 when none; the count is omitted entirely if components storage is unavailable).
- **Default open state:** ELEMENTS open; BLOCKS, COMPONENTS, MINE closed. Any number of groups can be open at once; clicking a header toggles that group only. Open state is not remembered between sessions.
- **Hover:** row takes a light grey fill and its text darkens.
- **Accessibility:** header is a real button with expanded/collapsed state announced.

### A5. ELEMENTS group (53 rows, one flat list)
- **Purpose:** The atomic building blocks, in a fixed catalogue order. (Internally they are grouped into six categories — Basic, Layout, Forms, Media, Navigation, Interactive — but **the category names are never shown**; they only make search smarter. Each element also has a one-line description that is **not shown on screen** — it is used for search matching and would appear as a tooltip only if the row were disabled.)
- **Row design:** 28px tall, indented under the chevron; a 14px hand-drawn line-icon glyph in muted ink, then a 13px label. Hover: light grey fill. Focusable; Enter/Space activates.
- **Actions:**
  - **Click** → inserts the element (see A12 for placement rules and toasts).
  - **Drag** → drag onto the canvas; the canvas shows its drop indicator line and inserts where dropped (ELEMENT rows are the *only* rows in this panel that are draggable).
- **Disabled state (designed, currently unused):** a disabled row shows a **"Soon"** tag after its label, cannot be clicked or dragged, and shows a dark tooltip below it giving the reason. No element is disabled today.

**Full ELEMENTS table** (in on-screen order). "Icon" describes the glyph. "Inserts" is the default content the user sees on the canvas. "Children?" = whether other elements can be placed inside it.

| # | Row label | Icon glyph | Hidden category | Hidden description (search only) | What it inserts (default content) | Children? |
|---|---|---|---|---|---|---|
| 1 | Heading | Bold serif "H" | Basic | Title or section heading (H1–H6) | An H2 reading "Heading" (36px bold) | Yes (text-level only) |
| 2 | Text | Three horizontal lines, last short | Basic | Multi-line body text block | Paragraph "Lorem ipsum dolor sit amet, consectetur adipiscing elit." | Yes (text-level only) |
| 3 | Link | Chain link | Basic | Inline hyperlink or anchor text | Underlined accent-blue link "Link" pointing to "#" | Yes (inline only) |
| 4 | List | Three lines with bullet dots | Basic | Bulleted or numbered list of items | Bullet list: Item 1, Item 2, Item 3 | Yes |
| 5 | Button | Rounded rectangle with a line | Basic | Clickable action button with label | Accent-blue button "Click Me" | Yes (inline only) |
| 6 | Icon | Star | Basic | Inline icon from the icon library | A 32px Lucide star icon (white stroke) | No |
| 7 | Divider | Single horizontal line | Basic | Horizontal rule to separate sections | A horizontal rule | No |
| 8 | Spacer | I-beam (vertical line with end caps) | Basic | Empty space block for vertical/horizontal gaps | 40px-tall empty space | No |
| 9 | Label | Tag shape | Basic | Tag-style label for categorizing content | Text "Label text" (medium weight) | Yes (inline) |
| 10 | Progress | Bar, left part filled | Basic | Progress bar showing completion percentage | A card: "Your Progress", a circle "93%", "32 of 42 complete", "Finish course to get certificate." | No |
| 11 | Countdown | Clock face | Basic | Countdown timer to a target date | "Launch in" / "We are preparing something amazing." and four tiles: 12 Days, 08 Hours, 45 Minutes, 20 Seconds | No |
| 12 | Container | Square outline | Layout | Generic wrapper box for grouping elements | Empty box with 20px padding | Yes |
| 13 | Section | Rectangle with a top divider line | Layout | Full-width page section with header area | A full-width section (60px vertical padding) containing an empty inner container | Yes |
| 14 | Grid | Four small squares | Layout | CSS grid layout with configurable columns | 3-column grid with three grey placeholder tiles "Grid Item 1/2/3" | Yes |
| 15 | Columns | Two tall rectangles | Layout | Two or more columns arranged side by side | Two columns labelled "Column 1" and "Column 2" | Yes |
| 16 | Flex | Three tall bars | Layout | Flexible row or column container with alignment controls | A row of three grey tiles "Flex Item 1/2/3" | Yes |
| 17 | Stack | Three stacked bars | Layout | Vertical stack of equally-spaced children | Three white bordered cards stacked vertically: "Stack Item 1/2/3" | Yes |
| 18 | Card | Rectangle with a divider | Layout | Content card with title, body, and optional image | White rounded card (max 320px): placeholder image 320×180, "Card Title", "Card description goes here." | Yes |
| 19 | Table | Rectangle with grid lines | Layout | Tabular data display with rows and columns | Table with columns Name / Email / Status / Actions and three sample rows (John Doe – Active, Jane Smith – Pending, Bob Johnson – Inactive) with coloured status pills and an "Edit" button per row | Yes |
| 20 | Input | Rounded rectangle with a short cursor line | Forms | Single-line text input field | Text field, placeholder "Enter text..." | No |
| 21 | Textarea | Square with three lines | Forms | Multi-line text area for longer input | Multi-line field, placeholder "Enter message..." | No |
| 22 | Select | Rectangle with a small caret line | Forms | Dropdown select menu | Dropdown with "Option 1", "Option 2" | No |
| 23 | Checkbox | Square with a tick | Forms | Checkbox for boolean or multi-select options | Checkbox with label "Checkbox option" | No |
| 24 | Radio | Concentric circles | Forms | Radio button group for single-select options | One radio with label "Radio option" | No |
| 25 | Switch | Pill with a knob | Forms | On/off toggle switch | Grey track with white knob and label "Toggle Option" | No |
| 26 | Slider | Line with a knob | Forms | Range slider input for numeric values | Range slider 0–100 set to 50, full width | No |
| 27 | Upload | Tray with an up arrow | Forms | File upload dropzone | Native file chooser | No |
| 28 | Submit | Paper plane | Forms | Submit button for sending form data | Button "Submit" (note: ships with an old purple #667eea fill) | Yes (inline) |
| 29 | Email | Envelope | Forms | Email address input field with validation | Email field, placeholder "email@example.com", full width | No |
| 30 | Password | Key | Forms | Password input field (masked) | Masked field, placeholder "Password", full width | No |
| 31 | Number | Hash sign | Forms | Numeric input with optional min/max | Number field, placeholder "0" | No |
| 32 | Date | Calendar | Forms | Date picker input | Native date picker | No |
| 33 | Time | Clock | Forms | Time picker input | Native time picker | No |
| 34 | Color | Circle with dashed cross | Forms | Color picker input swatch | 50×40 colour swatch (defaults to old purple #667eea) | No |
| 35 | Form | Document with a line | Forms | Contact form container with submit handling | Form with a "Name" field, an "Email" field and a "Submit" button | Yes |
| 36 | Image | Picture frame with mountain | Media | Responsive image with alt text support | An empty image (alt "Image") — **immediately switches the drawer to Assets and opens the picker** so the user chooses a file | No |
| 37 | Video | Screen with play triangle | Media | Video player with controls | Empty video player with controls — opens the Assets picker | Yes |
| 38 | Audio | Music note | Media | Audio player for music or podcasts | Empty audio player — opens the Assets picker | No |
| 39 | Gallery | Four uneven tiles | Media | Masonry or grid photo gallery | Grid of three 400×260 placeholder images | Yes |
| 40 | SVG | Smiley circle | Media | Inline SVG vector graphic element | 100×100 circle outline (old purple stroke) — opens the Assets picker | No |
| 41 | Lottie | Circle with play triangle | Media | Lottie JSON animation player | 200×200 grey box reading "Lottie Animation" — opens the Assets picker | No |
| 42 | Embed | Window with a title bar | Media | Embed external content (YouTube, Spotify, Figma) | Dark 16:9 box with 🎬 and "Paste YouTube or Vimeo URL" | No |
| 43 | Map | Folded map | Media | Google Maps or Mapbox embed | Dark 400px box with 🗺️ and "Enter address or coordinates" | No |
| 44 | Navbar | Bar with a dot and a line | Navigation | Top navigation bar with logo and links | White bar: "Logo" left; Home · About · Services · Contact right | Yes |
| 45 | Footer | Bar at the bottom with a line | Navigation | Site footer with links and copyright | Dark navy footer, centred "© 2024 Buildrick. All rights reserved." | Yes |
| 46 | CTA | Rounded rectangle with a line | Navigation | Call-to-action banner with headline and button | Purple-gradient section: "Ready to get started?", "Join thousands of happy customers today.", white button "Start Free Trial" | Yes |
| 47 | Accordion | Circle with question mark | Interactive | Collapsible accordion / FAQ section | Three FAQ items ("What is Aquibra?", "Is it free to use?", "Can I export my designs?"), first one open | Yes |
| 48 | Tabs | Box with three tabs on top | Interactive | Tabbed content panel with switchable sections | Tab 1 / Tab 2 / Tab 3 (purple active underline) with panels "Content for Tab N. Click to edit this text and add your own content." | Yes |
| 49 | Modal | Rectangle with two lines | Interactive | Dialog/modal overlay trigger | A purple "Open Modal" button plus a hidden dialog: "Modal Title", "×", "This is the modal content. Add your text, forms, or any other content here." | Yes |
| 50 | Testimonials | Double quote marks | Interactive | Customer testimonial cards or quote display | One quote: "Great product experience." — Alex Doe, Founder, Nova, ★★★★★ | Yes |
| 51 | Pricing | Price tag | Interactive | Pricing plans comparison table | Two plan cards: Starter $19/mo (Basic features, Email support, "Choose Plan") and featured Pro $49/mo (Everything in Starter, Advanced analytics, Priority support, "Get Pro") | Yes |
| 52 | Social Icons | Three circles in a row | Interactive | Row of social media platform icons | Four accent-blue circles containing 📘 🐦 📷 💼 emoji | Yes |
| 53 | Carousel | Box with arrows either side | Interactive | Swipeable image or content carousel | Two slides: "Slide One / Add your slide copy here." and "Slide Two / Share another highlight." | Yes |

Search aliases (not shown, but each row matches on them) — examples: Heading matches "title, h1, h2, h3, headline, header"; Button matches "cta, click, action, submit"; Accordion matches "faq, questions, collapse"; Embed matches "youtube, spotify, figma, iframe"; Carousel matches "slider, slideshow, swipe, banner, hero slider".

### A6. BLOCKS group (50 cards)
- **Purpose:** Pre-built pieces from the block registry, shown as a card grid. (Everything in the registry that is *not* in the COMPONENTS subset.)
- **Layout:** A responsive card grid (as many 128px-minimum columns as fit; two columns at the default width, more when the drawer is expanded), 8px gaps, 16px side inset. Each card: a **136×80 thumbnail** with rounded corners, then an 11px muted label, truncated to one line. **No block has a preview image today, so every thumbnail is a blank light-grey rectangle.** (The design intent notes the thumb is "empty until first publish".)
- **Actions:** **Click** (or Enter/Space) inserts. Cards are **not draggable**. No hover preview.
- **Note for the designer:** most of these duplicate ELEMENTS rows under slightly different names (e.g. "Heading" appears in both; "Flex Container" here = "Flex" there; "Range Slider" here = "Slider" there). Only these are unique to BLOCKS: Row, Column, 3 Columns, Hero Section, Features, Product Card, Product Grid, Product Detail, Cart Button, Contact Form (Contact Form also sits in COMPONENTS).

**Full BLOCKS table** (in on-screen order):

| # | Card label | Group (hidden) | One-line description | Key parts inside | Variants |
|---|---|---|---|---|---|
| 1 | Container | Basic | Generic wrapper | Empty box | — |
| 2 | Text | Basic | Inline text element | Span "Enter text here" | — |
| 3 | Heading | Basic | H1–H6 titles | H2 "Heading" | — |
| 4 | Paragraph | Basic | Body text element | "Lorem ipsum dolor sit amet, consectetur adipiscing elit." | — |
| 5 | Button | Basic | Interactive button | Button "Click Me" | — |
| 6 | Link | Basic | Clickable hyperlink | Link "Link" | — |
| 7 | List | Basic | Ordered/unordered list | Bullets: Item 1, Item 2, Item 3 | — |
| 8 | Divider | Basic | Horizontal separator | Horizontal rule | — |
| 9 | Row | Basic | Horizontal stack | Empty row (columns container) | — |
| 10 | Column | Basic | Vertical stack | Empty column container | — |
| 11 | Spacer | Basic | Empty spacing element | 40px space | — |
| 12 | Image | Media | Image with lazy load | Empty image; opens Assets picker | — |
| 13 | Video | Media | Self-hosted video | Empty player with controls; opens Assets picker | — |
| 14 | Audio | Media | Audio player | Empty audio player; opens Assets picker | — |
| 15 | SVG | Media | Custom SVG upload | 100×100 circle outline | — |
| 16 | Lottie Animation | Media | Lottie animation | 200×200 grey placeholder "Lottie Animation" | — |
| 17 | Icon | Media | SVG icon library | 32px star icon | — |
| 18 | Image Gallery | Media | Image carousel | Grid of three placeholder images | — |
| 19 | Video Embed | Media | YouTube, Vimeo embed | Dark 16:9 box "🎬 Paste YouTube or Vimeo URL" | — |
| 20 | Map Embed | Media | Google Maps embed | Dark box "🗺️ Enter address or coordinates" | — |
| 21 | Section | Layout | Full width container | Section with empty inner container | — |
| 22 | 2 Columns | Layout | Split layout 50/50 | Row with "Column 1", "Column 2" | — |
| 23 | 3 Columns | Layout | Evenly distributed | Row with "Col 1", "Col 2", "Col 3" | — |
| 24 | Grid | Layout | Auto-layout grid | 3 grey tiles "Grid Item 1/2/3" | — |
| 25 | Flex Container | Layout | Advanced alignment control | 3 grey tiles "Flex Item 1/2/3" in a row | — |
| 26 | Form | Forms | Form container | Name field, Email field, Submit button | — |
| 27 | Input | Forms | Text input field | Placeholder "Enter text..." | — |
| 28 | Textarea | Forms | Multi-line text | Placeholder "Enter message..." | — |
| 29 | Select | Forms | Dropdown select | Option 1, Option 2 | — |
| 30 | Checkbox | Forms | Checkbox input | "Checkbox option" | — |
| 31 | Radio | Forms | Radio button group | "Radio option" | — |
| 32 | File Upload | Forms | File upload field | Native file chooser | — |
| 33 | Date | Forms | Date picker | Native date input | — |
| 34 | Time | Forms | Time picker | Native time input | — |
| 35 | Email | Forms | Email field | Placeholder "email@example.com" | — |
| 36 | Password | Forms | Password field | Placeholder "Password" | — |
| 37 | Number | Forms | Number field | Placeholder "0" | — |
| 38 | Range Slider | Forms | Slider input | 0–100 at 50 | — |
| 39 | Color Picker | Forms | Color picker | Colour swatch | — |
| 40 | Label | Forms | Form label | "Label text" | — |
| 41 | Submit Button | Forms | Form submit | Button "Submit" | — |
| 42 | Hero Section | Sections | Hero section layout | H1 "Welcome to Buildrick", "Build beautiful websites in minutes with our visual composer.", link-button "Get Started" | Has editable attributes defined (title, subtitle, button text/URL, background image/colour, text align left/center/right, height) — surfaced only if the inspector exposes them |
| 43 | Features | Sections | Feature grid section | Three feature items: "Fast Editing / Drag, drop, and style in seconds.", "Responsive / Looks great on every device.", "AI Assist / Generate sections with one prompt." | — |
| 44 | Footer | Sections | Footer section | Dark footer "© 2024 Buildrick. All rights reserved." | — |
| 45 | Navbar | Sections | Navigation bar | "Logo" + Home · About · Services · Contact | — |
| 46 | Call to Action | Sections | Call to action | Purple gradient: "Ready to get started?", "Join thousands of happy customers today.", "Start Free Trial" | — |
| 47 | Product Card | Ecommerce | E-commerce product | White card: product photo (Unsplash headphones), green "In Stock" badge, "Category", "Product Name", description, "$0.00", blue "Add to Cart" — fields bind to CMS product data | — |
| 48 | Product Grid | Ecommerce | Product listing | Empty responsive grid bound to the "products" CMS collection (fills from CMS) | — |
| 49 | Product Detail | Ecommerce | Product page | Two-column article: large product photo; "Category", H1 "Product Name", long description, "$0.00", "SKU: SKU-000", "Stock: 0 units", "Add to Cart" | — |
| 50 | Cart Button | Ecommerce | Add to cart | Blue button with cart icon: "Cart (0) - Checkout" | — |

### A7. COMPONENTS group (14 rows)
- **Purpose:** The registry's richer, multi-part pieces, shown as plain rows (no thumbnails).
- **Row design:** Same 28px dense row as ELEMENTS, but the icon slot is a solid 14px soft-ink **square** (these rows carry no artwork). Click (or Enter/Space) inserts. **Not draggable.**

| # | Row label | Description | Key parts inside |
|---|---|---|---|
| 1 | Card | Content card wrapper | Placeholder image 320×180, "Card Title", "Card description goes here." |
| 2 | Slider/Carousel | Image/content slider | Two slides ("Slide One", "Slide Two") |
| 3 | Testimonials | Customer review | Quote, name "Alex Doe", role "Founder, Nova", ★★★★★ |
| 4 | Pricing Table | Pricing table card | Starter $19/mo and featured Pro $49/mo cards with feature lists and buttons |
| 5 | Progress Bar | Progress indicator | Card "Your Progress", 93% circle, "32 of 42 complete", "Finish course to get certificate." |
| 6 | Countdown Timer | Timer countdown | "Launch in", subtitle, Days/Hours/Minutes/Seconds tiles |
| 7 | Accordion / FAQ | Expandable content | Three FAQ rows about Aquibra, first open |
| 8 | Social Icons | Social media links | Four blue circular emoji links |
| 9 | Contact Form | Form container | Labels + fields Name ("Your name"), Email ("you@example.com"), Message ("How can we help?"), button "Send Message" |
| 10 | Stack (Vertical) | Flex stack container | Three white cards "Stack Item 1/2/3" |
| 11 | Switch / Toggle | Toggle switch | Track + knob + "Toggle Option" |
| 12 | Tabs | Tabbed content | Tab 1/2/3 with content panels |
| 13 | Modal / Dialog | Popup modal dialog | "Open Modal" trigger + hidden dialog with title, close ×, body text |
| 14 | Table | Data table | Name/Email/Status/Actions table with three sample people |

### A8. MINE group (the user's own components)
- **Purpose:** Inline shortcut to the user's saved components (the same list the Components panel shows).
- **Layout:** Plain rows with the solid-square icon, labelled with each component's name, most recently updated first. When the user has no components the group simply has **no rows** (the header count reads 0) — there is no empty-state copy or call to action here.
- **Actions:** Click inserts a new instance of that component. Placement: inside the selected element if one is selected, else at the end of the page; the engine walks up to the nearest ancestor that legally accepts it.
- **Toasts:** success **"Component added to canvas"**; failure **"Couldn't add component. Try again."**; no page open **"Open a page first to add this component."**
- **Notes:** MINE hydrates from browser storage a moment after load, so it can briefly read 0 before filling in. Not draggable. Not included in search.

### A9. Search results (replaces the groups while typing)
- **Layout:** One flat, cross-source list. 32px rows with the item's label (13px ink) on the left and its source tag (**ELEMENTS / BLOCKS / COMPONENTS**, 11px caps, soft ink, 0.5 tracking) on the right. No headings, no category grouping, no cards. Order: element hits, then block hits, then component hits.
- **Matching:** elements match on name, description, tags and category name; blocks and components match on label and id. MINE is not searched.
- **Actions:** click / Enter / Space inserts. Element hits are draggable; block and component hits are not.
- **No results:** centred, two lines: muted **"Nothing matches ‘{query}’."** (curly quotes, trailing period) and an accent link **"Clear search"**. No icon.
- The pinned bottom (Paste HTML row + Tips strip) stays visible under the results.

### A10. "⌥  Paste HTML…" row (pinned)
- **Layout:** A full-height row at the panel inset with **no icon slot**, 12px soft-ink text **"⌥  Paste HTML…"**, sitting directly above the Tips strip.
- **Flow:** click → the editor reads the clipboard → the text is sanitised and inserted as a block labelled "Pasted HTML" using the normal insert path (selection-aware placement, auto-select, flash) → toast **"Inserted: Pasted HTML"**.
- **Errors (toasts):** clipboard blocked → **"Clipboard is not readable — allow clipboard access and try again."**; nothing copied → **"Clipboard is empty — copy some HTML first."**
- Note: despite the "⌥" glyph in the label, there is no Option-key shortcut wired; it is click only.

### A11. Tips strip (pinned bottom band)
- **Layout:** 28px strip on the accent tint, 12px insets, 11px accent-coloured text: **"💡 Tip 1/4"** on the left, and on the right three 20px icon buttons **‹** ("Previous tip"), **›** ("Next tip"), **✕** ("Hide tips for this session"; hover title "Hide tips for this session — bring them back from Help"). Hover on the arrows/✕ gives a subtle accent wash.
- The tip's **body text is not drawn** — it appears only as a hover tooltip on the strip. The four tips cycle:
  1. **Drag to canvas** — Drag an element card onto the canvas to place it.
  2. **/ to search** — Press / to jump to search. Esc or ✕ to clear.
  3. **My Components** — Once available, save any element as a reusable component from the right-click menu.
  4. **Browse categories** — Click any category row to expand it in-place and explore elements.
- **Dismiss:** ✕ removes the strip entirely and the choice persists across sessions. **There is no "bring them back from Help" path implemented** — the title text promises one that does not exist.

### A12. One-time "Quick Picks removed" callout
- Shown once, at the top of the scroll area, only to returning users who had "Quick Picks" saved in an older version of the panel: an info-circle icon plus **"Quick Picks removed. Browse and drag elements directly from categories below."** on an accent-tinted, accent-bordered rounded box. Auto-dismisses after 8 seconds; never shown to new users.

### A13. Loading and load-error states (designed; not reachable today)
- **Loading:** six skeleton rows (grey 12px square + uneven grey bars, two indent levels), pulsing; screen-reader label "Loading element library".
- **Load error:** red 13px **"Couldn't load the element library."**, muted 12px **"You can still edit what's already on the canvas."**, and a link-style **"Try again"**.
- The catalogue is bundled data, so the panel never actually enters these states; they exist for future async sources.

### A14. What happens when something is inserted (click path)
- Spam-guard: repeated clicks within ~150ms are ignored.
- Placement ("smart placement"): if one element is selected and it can hold the new item → inserted inside it, at the end. Otherwise the editor walks up the ancestors to the nearest one that can hold it and inserts *after* the branch that contained the selection. If nothing accepts it → appended to the end of the page. With no selection → end of the page.
- After insert: the new element is **selected**, and it **flashes** briefly on the canvas. The whole insert is one undo step.
- Media elements inserted empty (Image, Video, Audio, Icon, SVG, Lottie) **switch the drawer to the Assets tab and open the asset picker** for that element.
- **Toasts:** success **"Inserted: {label}"** (2s). Not allowed here → **"Can't add {label} — {parent type} doesn't allow it. Try selecting a {suggested parent} or {second suggestion} first."** (or "…Select a container element and try again.") shown 5s. Editor not ready → **"Editor not ready. Please wait."** No page → **"No active page. Please select a page first."** Root missing → **"Page root element not found."** Unknown block → **"Block "{label}" not found in registry."** Unexpected failure → **"Error inserting block: {message}"**.
- **Drag path (ELEMENTS rows only):** the canvas draws the drop indicator; on drop the block is inserted at the indicated before/after position or inside the hovered container (walking up to a legal parent), then auto-selected with a fade-in. Drop errors surface through the canvas's own drop-error handling.

### A15. Keyboard summary (Add panel)
| Key | Effect |
|---|---|
| A | Open the Add tab (rail shortcut) |
| / | Focus search (when not typing elsewhere) |
| ⌘F / Ctrl+F | Focus search (always) |
| Esc (in search with text) | Clear search |
| Enter / Space on a row or card | Insert it |

---

## PART B — Quick-add Element Picker modal (from the canvas)

### B1. Modal frame
- **Where it lives:** Centred modal over the canvas (380px wide, up to 80% viewport height), opened from the **selection toolbar's "Add" action** on a selected element.
- **Purpose:** Add a new element *as a child* of the selected element without leaving the canvas.
- **Layout:** Header **"Add Child Element"** with an **×** close button (the code also has titles "Add Element Before" / "Add Element After" but only the child mode is ever opened). Below it a search row: magnifier icon + text field placeholder **"Search elements..."** (auto-focused). Then the scrolling element library (B2).
- **Actions:** pick an element → it is inserted as the *last child* of the selected element, selected, and the modal closes. If nesting is not allowed, the modal simply closes with **no message**. Escape / overlay click closes.

### B2. Element library inside the modal
This is an older library design (it is not the Add panel). Much of it renders with minimal styling today.
- **Quick-access pill row:** two outlined pills — **"Recents"** (history icon, plus a count when > 0) and **"Favorites"** (star icon, plus count). Active pill fills accent blue. Clicking one opens its overlay and closes the other.
- **Tip pill:** an amber pill with a lightbulb, **"Drag onto canvas"**, and a small ✕; clicking it dismisses it permanently.
- **Recents overlay:** header "Recent Elements" with ✕; a list of up to 8 recently inserted/dragged element cards; empty state: history icon + **"No recent elements"**.
- **Favorites overlay:** header "Favorite Elements" with ✕; favourite cards; empty state: star icon + **"No favorites yet"** / **"Click the star on any element"**.
- **Category accordions** (only one open at a time; the open one is remembered): header row 28px with a category icon, the name, a count, and a chevron that rotates when open. Categories, in order: **Most Used** (sparkles) · **Layout** (layers) · **Basic** (box) · **Typography** (type — never appears, nothing maps to it) · **Media** (image) · **Forms** (form) · **Advanced** (grid). Contents: Most Used = Section, Grid, Flex Container, Button, Card, Image, Heading, Paragraph; Layout = the 5 layout blocks; Basic = the 11 basic blocks; Media = 9 media blocks; Forms = 16 form blocks + Contact Form; Advanced = the 5 Sections, 13 Components, and 4 Ecommerce blocks.
- **Element card:** a bordered tile with a small **star** button top-right (tooltip "Add to favorites" / "Remove from favorites"; filled when favourited), an 18px Lucide icon, the label, and a short description (e.g. "Split layout 50/50", "Image with lazy load", "Popup modal dialog"). Tooltip on the card: **"Drag or click to add {label}"**. The Flex Container card spans full width. Cards are draggable (a ghost copy of the card follows the cursor) and clickable.
- **On click:** toast **"Added {label} to canvas"** (2s), the item is added to Recents, and the modal's insert runs.
- **Search:** filters by label/id inside each category; categories with no matches disappear; if none remain: compact empty state **"No elements found"**.

---

## PART C — Components (the user's reusable pieces)

### C1. What a component is (plain language)
- A **component** is a saved copy ("master") of an element and everything inside it, stored in the browser for this project (up to 100 per project). It has a name and optional description, category, tags, and "variant properties".
- Inserting a component places an **instance** — a live copy linked to the master. Instances remember their own local edits ("overrides"). When the master is **updated**, every instance is rebuilt from the new master and the local edits are re-applied where they still fit; edits that no longer have a place are dropped and the user is told how many.
- **Detaching** an instance turns it into ordinary elements; it stops following the master. **Reset to master** throws away an instance's own edits.
- **Deleting** a component detaches all its instances (they keep their content).
- Components require browser storage; in a private window or when storage is blocked the whole feature reports itself unavailable.
- There is an export/import-to-file capability in the engine (JSON file "aquibra-components-{project}-{timestamp}.json") but **no UI exposes it**.

### C2. Entry points
- Rail: a **"Components"** tab (box icon; screen-reader "Create and use reusable components"; shortcut **⇧A**). In the default six-item rail it has no button, so it is reached via the shortcut, the ⌘K command "Open Components panel", or the Brand panel's summary.
- Canvas right-click on any non-root element → **"Save as component"** → Create Component modal.
- Add panel → MINE group (insert only).
- AI: the assistant can also save a selection as a component or insert one by name (see E9).

### C3. Components panel — list view
- **Where:** Left drawer, title **"Components"** (header has Expand, optional Help, Close).
- **Layout:**
  - A section header **"YOUR COMPONENTS"** (11px caps, muted).
  - One 32px row per component: **name** (13px ink) · right-aligned muted **"{n} on this site"** (instance count, live) · a **›** chevron. Hover: light fill. Rows are **draggable onto the canvas** (drop = insert an instance where dropped, auto-selected with a fade-in).
  - While loading: four skeleton rows with 24px avatar circles.
  - Bordered footer with the one primary button **"+ Create component"**.
- **No search field and no filter chips** in the current design (the state still supports filters All / UI / Sections / Saved / Favorites and a favourites store, but nothing renders them).
- **Actions:** click a row → detail screen (C5). Drag → canvas. Footer button → Create flow (C6).
- **Sorted:** most recently updated first.

### C4. Components panel — empty, unavailable and error states
- **Empty (no components yet):** left-aligned at the top: **"No components yet."** (13px medium) and **"Select an element on the canvas and save it as a component to reuse it everywhere."** (12px muted), then an accent link **"Create component"**. The same bordered footer with **"+ Create component"** stays so the button does not move when the first component appears. (A compact variant used when embedded elsewhere reads **"No components saved yet."** with a **"+ New"** link whose tooltip is "Right-click any element to save as component".)
- **Storage unavailable:** icon (four squares) + **"Components not available"** / **"Components require storage access. Try opening in a regular browser window."**
- **Load error:** **"Couldn't load your components."** / **"Your components are safe — only this list failed."** with a **"Try again"** link.

### C5. Component detail screen (drill-in)
- **Header:** back button **"← Back to Components"** (Escape also goes back) over a breadcrumb **"Components / {name}"**.
- **Body (scrolls):**
  1. **Preview box** 120px tall, bordered, subtle fill: shows the component thumbnail if it has one, else muted **"No Preview"**. (Thumbnails are never generated today, so this always reads "No Preview".)
  2. **Info rows** (12px): **Type** — the category, or "UI component" if none; **Tags** — tags joined with " • ", or "No tags"; **Description** — only if set.
  3. Primary full-width button **"Insert Component"**.
  4. A row of three equal light buttons with icons: **Duplicate** (copy icon; tooltip "Duplicate component"), **Update** (refresh icon; **disabled unless an element is selected on the canvas**; tooltip "Replace this component with the element selected on canvas" or, when disabled, "Select an element on the canvas to update this component from"), **Delete** (trash icon, red/failure style; tooltip "Delete component").
  5. **"INSTANCE ACTIONS"** section (bordered top) — shown only when the selected canvas element is an instance of *this* component **and** the design-system panel is in **Pro mode** (a density toggle in the Brand panel, not a paid tier). Contains one light button **"Detach instance"** (unlink icon; tooltip "Detach this instance from the component").
  6. **"VARIANTS"** section — only if the component has variant properties (e.g. Size / State / Theme from creation). Each property shows "{Name}:" and a row of 22px pill chips (S / M / L etc.); the selected chip fills accent. **These chips only change the preview state in this screen; they do not change anything on the canvas.**
- **Flows & dialogs:**
  - **Insert Component** → placed inside the selected element (or page root) → back to the list is *not* automatic. If no page: toast **"Open a page first to add this component."** If placement fails: toast **"Couldn't add "{name}" here."**
  - **Duplicate** → creates "{name} Copy" immediately (no dialog).
  - **Update** → confirm dialog titled **"Update component"**: *"Replace "{name}" with the element selected on the canvas? {n} instance(s) will change to match. Any edits made on an instance are kept where they still fit, and lost where the new version no longer has that part. Undo won't take the component back — it reverts the pages, not the component itself."* (the middle sentences appear only when instances exist). Confirm label **"Update component"** (destructive style). Result toasts: **""{name}" updated — {n} instances followed."** or **"…— no instances placed yet."**; if overrides were lost, an 8-second warning toast **""{name}" updated — {n} instances followed. {k} override(s) couldn't be re-applied and was/were lost."**; failure **"Couldn't update "{name}" from that selection."**
  - **Delete** → confirm **"Delete Component"**: with instances *"This component has {n} instance(s). Deleting will detach all instances. Continue?"*, otherwise *"Are you sure you want to delete "{name}"?"*. Button **"Delete"**. Then toast **""{name}" deleted"** and back to the list.
  - **Detach instance** → confirm **"Detach from component?"**: *"This copy stops receiving updates from "{name}". The component itself is untouched."*, button **"Detach"** (accent, not destructive; undo restores the link).

### C6. Create Component modal
- **Where:** Centred modal (large). Opened by the Components panel's "Create component" link / "+ Create component" button, or by canvas right-click "Save as component".
- **Pre-check (panel buttons only):** with nothing selected on the canvas the modal does not open; instead an info toast: **"Select an element on the canvas first — a component is made from something."** The right-click path always has a selection.
- **Layout:** Title **"Create Component"**, × close. Fields, top to bottom:
  1. **Name** (required, marked with an accent asterisk) — text field, placeholder **"e.g., Hero Section"**, auto-focused.
  2. **Description** — 3-row textarea, placeholder **"Optional description..."**.
  3. **Category** — text field, placeholder **"e.g., Headers, Footers, Cards"**.
  4. **Tags** — text field, placeholder **"e.g., responsive, dark-mode (comma-separated)"**; hint **"Comma-separated tags for easier searching"**.
  5. **Variant Options** (section with top rule): checkbox **"This is a variant set (has multiple variants)"**. When ticked, a light-grey panel appears: hint **"Select variant properties:"**, then three toggle chips — **Size (S, M, L)**, **State (Default, Hover, Disabled)**, **Theme (Light, Dark)** — selected chips fill accent; hint **"You can configure variant values after creation"**. (There is no later UI to configure variant values.)
  6. **Pre-fill from DS styles** (section with top rule): checkbox, **on by default**. Hint depends on entry point: from the panel, **"Lift matching values into token / preset bindings on save. Recommended."**; from right-click, the real count: **"1 style will bind to your DS tokens. Editing tokens later updates this component too."** / **"{n} styles will bind to your DS tokens. …"**
- **Footer:** **Cancel** (text button) and primary **"Create component"** (disabled until a name is typed; reads **"Creating..."** while saving).
- **Keyboard:** ⌘Enter submits when a name is present.
- **Result toasts:** **"Component "{name}" created successfully!"**; **"Component name is required"**; **"Failed to create component"**; **"Error: {message}"**; **"Invalid state"** (nothing to save from).
- After success the modal closes and the new component appears at the top of the Components list and in the Add panel's MINE group.

### C7. Instances on the canvas
- **Layers panel:** an instance row carries a small **◇** badge after its name (tooltip "Component instance").
- **Inspector (right panel):** when an instance is selected a tinted band appears above the style sections:
  - Without variants: caps label **"COMPONENT INSTANCE"** and **"Linked to {name}. Edits here apply to this copy only."**
  - With variants: caps label **"VARIANT"** and one dropdown per variant property (e.g. Size: S / M / L). Picking a value switches the instance to the matching variant if one exists.
  - In both cases an accent link **"Reset to master"** — drops the instance's own edits and rebuilds it from the component (no confirmation).
- **Inspector, Pro mode only:** an amber outlined button with a dot, **"Detach instance"** → the same **"Detach from component?"** confirm as C5. Failure toasts: **"Couldn't detach this instance. It may already be detached."** / **"Couldn't detach this instance. Try again."**
- Editing an instance's text, styles or attributes records an override on that instance.

### C8. Dialogs that exist but are currently unreachable
- **Rename Component** modal: title "Rename Component", text field placeholder "Component name" (Enter submits), buttons **Cancel** / **Rename**; toasts "Component renamed" / "Couldn't rename component.".
- **Select Variant — {name}** modal: a vertical list of variant buttons, the current one highlighted with **"(current)"**. Toasts when it cannot open: "This component has no variants defined.", "Select a component instance on the canvas first.", "Select an instance of this component on the canvas first."
- **Legacy row design** (not rendered): a 36px row with the four-squares icon, name, a **"{n}x"** count pill, an **"Add"** button (tooltip "Add {name} to canvas"), and a **⋯** "More options" menu with **Insert / Rename / Duplicate / Swap Variant (only with variants) / Favorite–Unfavorite / Delete**; double-click inserted.
- Those flows (rename, favourite, swap variant) have no live entry point in today's UI. Rename is therefore not possible from the interface.

---

## PART D — Buildrik design-system component catalogue (27 canonical components)

- **Where it appears today:** As a read-only list inside the **Brand** panel's "Components" destination (documented in full by the Brand module). Each row shows the component name and "{n} variant(s)" plus "· {m} in use" when instances exist, followed by a › chevron; below the list sits a tinted row with **"✨ Generate with AI"** (blocked with tooltip **"AI generation isn't switched on for this workspace yet"** when AI is off), then **"Your saved components · {n}"** listing the user's components as "1 master · {n} instance(s)", or **"No saved components yet — save a selection from the canvas to start."**, and a footer callout **"Read-only by design: Components live in their own panel. This summary lets you see what's installed without leaving Brand — but every action here jumps to the Components panel to author."**
- **A draggable card design exists but is not mounted anywhere:** a two-column grid grouped under **"From your Design System · {n}"** with tiers **Atoms (n) / Molecules (n) / Organisms (n)**; each card is a white bordered tile with a tiny sketch preview (e.g. a blue "Btn" pill, a grey input bar, "Home / Page" breadcrumb, "$9 $19 $29") and the name; tooltip "{name} · {n} variants"; empty tier reads "No components yet" or, when searching, "No matches in this tier". Dragging a card to the canvas places a real element tree styled by design tokens, and the AI can insert these by id.

**Full catalogue table:**

| # | Name | Tier | Variants | Sizes | Default text / parts |
|---|---|---|---|---|---|
| 1 | Button | Atom | primary, secondary, ghost | sm, md, lg | Label "Click me" |
| 2 | Input | Atom | default | md | Placeholder "Enter text…" |
| 3 | Select | Atom | default | md | Placeholder "Select an option…" |
| 4 | Checkbox | Atom | default | — | Unchecked box |
| 5 | Radio | Atom | default | — | Unchecked radio |
| 6 | Switch | Atom | default | — | Off switch |
| 7 | Label | Atom | default | — | "Label" |
| 8 | Spinner | Atom | default | sm, md, lg | Loading indicator, label "Loading" |
| 9 | Card | Molecule | elevated, flat | — | "Card title" heading + body slot |
| 10 | Form field | Molecule | default | — | "Field label", input slot, "Helper text" |
| 11 | Alert | Molecule | info, success, warning, error | — | "Alert message" |
| 12 | Avatar | Molecule | default | sm, md, lg | Round image, alt "User" |
| 13 | Badge | Molecule | neutral, success, error | — | "New" |
| 14 | Breadcrumb | Molecule | default | — | Items slot |
| 15 | Tabs | Molecule | default | — | Tabs slot |
| 16 | Pagination | Molecule | default | — | Pages slot |
| 17 | Search bar | Molecule | default | — | Search field placeholder "Search…" + submit slot |
| 18 | List item | Molecule | default | — | "Item title" / "Item subtitle" |
| 19 | Tooltip | Molecule | default | — | "Tooltip text" |
| 20 | Modal | Organism | default | — | "Modal title" + body slot |
| 21 | Section | Organism | default | — | Content slot |
| 22 | Hero | Organism | default | — | "Build something great" / "Lead copy that convinces" + CTA slot |
| 23 | Footer | Organism | default | — | Columns slot + "© 2026" |
| 24 | Pricing | Organism | default | — | "Pricing" heading + tiers slot |
| 25 | Call to action | Organism | default | — | "Ready to start?" + actions slot |
| 26 | Header | Organism | default | — | Brand, nav and actions slots |
| 27 | Feature grid | Organism | default | — | "Features" heading + features slot |

Slots are inserted as empty drop-target containers the user fills.

---

## PART E — The AI panel

### E1. Entry points
- Rail tab **"AI"** (sparkles icon; screen-reader "AI assistant — chat with Claude to edit elements"; shortcut **I**) — not present in the default six-item rail.
- **⌘J / Ctrl+J** anywhere in the editor.
- ⌘K command palette → "AI".
- Top bar **"✨ Ask AI"** button (in the four-tool rail mode).
- Inspector's **"✦ AI"** chip, the multi-select toolbar, and the inspector's no-selection state.
- Canvas right-click → **"Improve with AI"** (hidden when AI is not wired).
- **Where it opens:** in the **right-hand inspector column**, replacing the inspector, with a way back. (The panel can also render in the left drawer with a normal panel header "AI" + Help + Close, but every live entry point uses the inspector placement.)

### E2. Panel layout (top to bottom)
1. **Back row** (36px, rule beneath): text button **"‹ Inspector"** (screen-reader "Back to Inspector") — returns to the inspector.
2. **Title row** (44px): **"AI"** (14px medium).
3. **Scope band** — full-width accent-tinted strip, 11px accent text: **"Scope: {target}"** where target is the selected element's accessible name or its type (e.g. "Scope: **heading**"), **"Scope: Whole page"** when nothing is selected, or **"Scope: {n} selected"** for multi-select. While a request is running a **🔒** appears at the right edge (screen-reader "Scope locked during prompt") and the scope no longer follows selection changes until the run ends.
4. **Prompt block** (72px: 8 above, a 52px field, 12 below) — a 2-row textarea with a visible input border, placeholder **"Ask AI to change something…"**. Inside the field, bottom-right, a round accent **↑** send button (disabled until text is typed) that becomes a red **■** stop button while streaming. **Enter** sends; **Shift+Enter** inserts a newline.
5. **Body** — one of: the idle "empty thread" (E3), the chat thread (E4), the Draft/agent run (E5), or a full-width state block (E6).

There is **no model picker** (the server chooses the model by plan) and **no chat/agent mode toggle** — the Draft row is the only way into the multi-step flow.

### E3. Idle state (before anything is asked)
- Band label **"TRY"** (11px caps muted) followed by three accent-coloured prompt links, each runs immediately when clicked:
  - **"Make the hero warmer"**
  - **"Write alt text for every image"**
  - **"Shorten the menu descriptions"**
- A muted 12px note: **"AI proposes a diff and never writes directly. Each Apply lands as one undo step — a multi-step draft applies one step at a time."**
- Band label **"DRAFT"** followed by one bordered 40px card-row: **"✦ Draft a new section from a brief"** with a **›** on the right → switches the panel into Draft mode (E5); the next prompt typed becomes the brief.

### E4. Chat thread (single-shot edits)
- Each exchange shows a role label (**"You"** in accent / **"Assistant"**) above a bubble: the user's bubble on the accent tint, the assistant's on white with a hairline border.
- **Streaming:** before any text arrives the assistant slot is a 56px accent-tinted band reading **"Thinking…"**; as text streams, a blinking **▍** cursor trails it. Pressing **■** stops; the message then carries a small **"(stopped)"** tag.
- **Multi-select guard:** submitting with several elements selected does not call the AI; an assistant message says **"AI editing supports one element at a time in v1 — select a single element."**
- **Proposed-change card** (when the AI returns an edit): green 13px heading **"{n} change(s) proposed"** (at least 1), then the **diff rows** — one line per change: the property/field name, the previous value if known (usually empty for canvas styles), and the proposed value; when there are no rows the AI's one-line summary is shown instead. Below: two buttons **"Discard"** (text) and **"Apply"** (primary), and the note **"Apply lands as one undo step."**
- **After acting on a card** the buttons are replaced by one of: **"✓ Applied"**, **"Discarded"**, or **"Nothing to apply — no change this editor can make"** (the AI answered with commands this editor cannot map, or none of them reached the canvas).
- A plain assistant reply (no edit) gets a small **"↻ Regenerate"** link that re-sends the preceding user prompt.
- The thread auto-scrolls to the newest message. After any completion the scope unlocks.
- Element scope → the AI is asked for a style/content command; whole-page scope → the AI receives the page's element list, the design tokens and the media library so it can edit many elements, set tokens, or swap images across the page in one batch.

### E5. Draft mode (multi-step agent run)
Entered from the DRAFT row; the prompt block's next submission is the brief. The panel returns to chat by itself once a run is dismissed.
- **Before a run** (idle): a checkbox **"Auto-apply steps (skip per-step approval)"** and the sentence **"Describe what to build. The agent will plan it, then walk each step for your approval."** (…**"and apply automatically."** when auto-apply is on).
- **Run band** (28px, subtle fill, 11px caps): **"PLANNING"** → **"RUNNING · {i} OF {n}"** → **"PAUSED AT STEP {i}"** (waiting for approval) → **"DONE · {applied} OF {n}"**; or **"STOPPED AT STEP {i}"** after a failure; or **"STOPPED BY YOU"**.
- **Step list:** 40px rows: a status glyph in colour (**○** pending grey · **●** running/awaiting accent · **✓** applied green · **–** skipped/no change muted · **✕** failed red), a monospace step number, the step title, and for some statuses a trailing word **"skipped"**, **"no change"**, **"failed"**.
- **Stop** — a light button under the steps while planning or running.
- **Step gate** (amber panel, appears when a step needs approval): title **"Step {i}: {title}"**, body **"{instruction} Approve it, or skip it and keep the rest."**, the step's diff rows, buttons **"Skip"** (light) and **"Approve"** (primary), and the footnote **"The run waits rather than guessing."**
- **Failure panel** (amber, red title): **"Step {i} failed — {reason}"**, body **"{k} step(s) kept."** or **"Nothing was applied."** followed by **"Nothing after step {i} ran."**; buttons **"Undo all"** (disabled if nothing applied) and **"Retry"** (re-runs the same brief). Planning failures show **"Couldn't break that into steps. Try a more specific build request."** or **"Planning failed"** / the server's message.
- **Stopped-by-user panel** (grey): **"Stopped after step {k}."**, **"What already ran is kept. Undo all takes back the {k} step(s) that applied."**, links **"Undo all"** (when anything applied) and **"Ask something else"**.
- **Done panel** (green tint): **"{k} change(s) applied, {s} skipped."**, then **"Each step is its own undo step — ⌘Z takes back the last of the {k}."** or **"⌘Z takes it back."**, and the link **"Ask something else"** (returns to chat).
- The auto-apply checkbox stays visible under the run until it is done. While a step runs, the inspector column is told to show "AI · {step}…" instead of stale controls.

### E6. Full-panel states (replace the thread)
- **Not configured** (grey block): **"AI drafting isn't configured yet."** / **"No API key is set for this workspace, so nothing here will run. This is the real message — not a silent fallback that pretends to work."** / link **"Open workspace settings"** (opens the dashboard settings in a new tab).
- **Out of credit** (amber block, red title): **"AI is out of credit."** / **"Nothing was changed. {server's own sentence with the limit and reset time}"** / link **"See plans"** (opens dashboard billing in a new tab).
- **Service failed** (red-tinted block): **"The AI service didn't respond."** / **"Nothing was changed. This is usually the model provider, not your site — try again in a moment."** / the server's raw line (e.g. "Daily limit reached (10). Resets at …") / link **"Try again"** (re-sends the last prompt). The panel gives a provider two reconnect attempts before showing this rather than sitting on "Thinking…".
- Credits/limits are server-owned; the panel only relays the server's sentence.

### E7. Privileged-action confirm (publishing from chat)
If the AI proposes a privileged action such as publishing, it is never applied silently: a confirm dialog opens with a server-supplied title and consequence, buttons **"Cancel"** and **"Publish"** (reads **"Publishing…"** while busy). Toasts: **"Can't run that" — "Open this editor from a site URL with ?siteId=…"**; **"Couldn't prepare that action"**; **"Publishing…" — "Your site is deploying."**; then **"Published" — "{url}"** or "Your site is live."; **"Publish failed"**; **"Action failed"**.

### E8. What the AI can actually change (the command set)
Every proposal is one or more of these; anything else is reported as "Nothing to apply".

| Command | What the user sees it do |
|---|---|
| Set style | Change a desktop/normal-state style on an element (colour, background, spacing, size, typography, borders, shadow, flex/grid layout, position, overflow, transform, filter, etc.; values with URLs/scripts are refused) |
| Set style variant | The same, but for a hover/focus/active/disabled state and/or the tablet/mobile breakpoint |
| Set text | Replace an element's text (plain text only, ≤2000 chars) |
| Set attribute | Set link URL, alt text, title, target, rel, aria-label, name, or image source (safe URLs only) |
| Add element | Insert a heading, text, paragraph, button, link, list, container, section, columns, grid or flex next to / inside the reference element |
| Add section | Build a container/section/columns/grid/flex with up to 12 child elements in one go |
| Delete / Duplicate / Move up / Move down | The obvious tree operations on one element |
| Insert component | Insert a catalogue component or one of the user's saved components (capped at 200 nodes) |
| Save as component | Turn the selected element into a saved component with a given name |
| Set page setting | Change the active page's SEO title (≤60), meta description (≤160) or slug (lower-case-dashes, must be unique) |
| Set token | Change a design-system token's value |
| Propose action | Ask for a privileged action (publish) → confirm dialog (E7) |

Applying a chat edit = one undo step; each approved Draft step = its own undo step.

### E9. In-canvas "Edit with AI" popover
- **Where:** A small dialog anchored just under the canvas selection toolbar, opened by the toolbar's **sparkles** icon button (label "Edit with AI"; shows pressed while open). Also the door for "Improve with AI" flows.
- **Layout / states:**
  - Prompt state: 2-row textarea, placeholder **"Describe a change… e.g. make this dark"**, auto-focused; button **"Generate"** (disabled until text). Enter sends.
  - Loading: **"Thinking…"**.
  - Result: the diff rows, then **"Discard"** (text) and **"Apply"** (primary). Apply lands as one undo step and closes the popover.
  - Error: the raw error text in an alert style.
- **Escape** closes and discards from any state. Scope is always the single selected element.

### E10. AI content helpers that exist outside this panel (pointers only)
- The Page settings **SEO** tab and the Assets **image detail** overlay call the AI content service (e.g. meta description, alt text) — documented in their own modules.
- The Brand panel's **"✨ Generate with AI"** row (Part D) opens an AI-assist modal owned by the Brand module.
- A library of **content types** (Headline, Paragraph, Tagline, Call to Action, Description, Bullet Points, FAQ, Testimonial, Bio, Meta Description, Social Post, Email Subject, Email Body, Feature List, Pricing Description, Team Bio) and **tones** with emoji (💼 Professional, 😊 Casual, 👋 Friendly, 🎩 Formal, 🎉 Playful, ⚡ Urgent, ✨ Inspirational, 🔧 Technical, 💬 Conversational, 📢 Authoritative, ❤️ Empathetic, 😄 Witty) exists for those helpers; the AI panel itself shows none of them.
- Generic AI error suggestions available to those helpers: "Check your request parameters and try again", "The request took too long. Try with a shorter prompt", "Check your internet connection and try again", "Too many requests. Please wait before trying again", "The request format is invalid. Check your input", "The content was filtered. Try rephrasing your prompt", "Multiple attempts failed. Please try again later", "The request was cancelled", "An unexpected error occurred. Please try again". A client-side cap of 30 requests per minute applies to those helpers (error "Rate limit exceeded").

---

## PART F — Element type reference (what the engine knows how to draw)

Every element on the canvas has one of these types. This is the reference for the Layers panel labels, inspector glyphs, and nesting rules. "Layers label" is the friendly name shown in the tree; "Glyph" is the Lucide icon used in Layers/Inspector.

| Type | Layers label | Glyph | Rendered as | Can hold children | Notes |
|---|---|---|---|---|---|
| container | Container | Box | div | Yes | Generic box; default 20px padding |
| section | Section | Layout template | section | Yes | Landmark region; default 60px/20px padding |
| columns | (Container) | Box | div | Yes | Row of columns |
| grid | Grid | Grid | div | Yes | 3 equal columns, 16px gap by default |
| flex | Flex | Move | div | Yes | Row, 16px gap |
| card | (Container) | Credit card | div | Yes | |
| pricing | (Container) | Box | div | Yes | |
| social | (Container) | Box | div | Yes | |
| hero | Hero | Home | section | Yes | |
| features | Features | Sparkles | section | Yes | |
| cta | (Container) | Box | section | Yes | |
| header | Header | Panel top | header | Yes | Banner landmark; cannot contain header/footer; should be unique |
| footer | Footer | Footprints | footer | Yes | Content-info landmark; same rules as header |
| nav | Navigation | Navigation | nav | Yes | Navigation landmark |
| navbar | Navbar | Navigation | nav | Yes | Navigation landmark |
| text | Text | File-type | span | Yes (inline only) | 16px, cannot hold sections/forms/tables/lists |
| heading | Heading (Heading 1–6 by tag) | Type / H1–H6 | h2 by default | Yes (inline only) | 32px bold default; cannot hold headings, paragraphs, form controls, layout |
| paragraph | Paragraph | Align-left | p | Yes (inline only) | 16px/1.6 |
| link | Link | Link | a | Yes (inline only) | Accent, underlined |
| button | Button | Mouse pointer | button | Yes (inline only) | Accent fill, white text |
| image | Image | Image | img | No | |
| video | Video | Video | video | Yes | |
| audio | (Container) | Box | audio | No | |
| svg | (Container) | Box | svg | No | |
| lottie | (Container) | Box | div | No | |
| gallery | (Container) | Box | div | Yes | |
| icon | Icon | Shapes | span | No | |
| form | (Container) | Square | form | Yes | Cannot contain another form |
| input | Input | Form input | input | No | |
| textarea | Textarea | File text | textarea | No | |
| select | Select | List ordered | select | No | |
| checkbox / radio / switch / upload | (Container) | Box | input (typed) | No | Switch renders as a checkbox with switch role |
| list | List / Ordered List | List / List ordered | ul | Yes | |
| table | (Container) | Box | table | Yes | |
| slider | (Container) | Box | input | Yes | Carousel type |
| testimonials | (Container) | Box | div | Yes | |
| progress | (Container) | Box | div | No | |
| countdown | (Container) | Box | div | No | |
| accordion | (Container) | Box | div | Yes | |
| product-card / product-grid / product-detail | (Container) | Box | div | Yes | CMS-bound e-commerce |
| video-embed / map-embed | (Container) | Box | div | No | |
| spacer | (Container) | Box | div | No | 40px tall |
| divider | Divider | Minus | hr | No | |
| custom | (Container) | Box | div | Yes | Anything unrecognised |

Grouping: selecting two or more siblings and grouping wraps them in a new Container; ungrouping dissolves a container into its parent. The page root can never be deleted.

---

## PART G — Known gaps a designer should decide on
- The Add panel lists the same thing up to twice (ELEMENTS vs BLOCKS/COMPONENTS) with different names and different presentations (row vs card).
- Block cards have no artwork; every thumbnail is blank grey.
- The Add panel has **no Recent row and no favourites/"★ Mine" affordance** — those exist only in the older Element Picker modal (Part B).
- No hover preview anywhere in Add; tooltips exist only for disabled rows (none today) and Element Picker cards.
- Component thumbnails are never generated ("No Preview" always); rename, favourite and swap-variant have no live entry point; variant values cannot be configured after creation; export/import has no UI.
- Tips "bring them back from Help" has no implementation.
- Several defaults still carry pre-rebrand purple (#667eea / #8b5cf6): Submit button, Color picker default, SVG stroke, CTA gradient, Modal trigger, Tabs active colour.

---

# Assets / Media Library · CMS / Content · Forms

**What this module is.** Three related areas of the editor. **Assets** is where the user keeps the site's images, videos, SVGs, icons and fonts: a slim "Assets" drawer in the left sidebar for quick insert-to-canvas, a full-page "Asset library" manager for organising (folders, tags, versions, replace-everywhere, delete), an image editor (crop / adjust / resize / optimise), a stock-photo browser (Unsplash / Pexels via the server), an icon picker (370 Lucide icons), and a "Choose an image" picker the inspector opens for a single element. **CMS** is the "CMS" drawer (collections → records → fields → dynamic pages, plus Data: sources, variables, conditions), a two-step "Create Collection" wizard, a "Records" table modal reachable from the command palette, and the inspector's "Bind to collection field" popover that pipes a record's field into a text element. **Forms** is a Form block, a small "form settings" section in the inspector, an engine that validates and routes submissions (store / webhook / email), and a submissions inbox in Site Settings.

Throughout: one accent blue, Inter for UI, Geist Mono for numbers/sizes/keys, 32px control height, 4px spacing. Copy in quotes is the exact on-screen text.

---

# PART A — ASSETS / MEDIA

## A1. Assets drawer (left sidebar panel)

- **Where it lives:** Left sidebar drawer, 320px wide, opened from the "Assets" rail icon. Also auto-opens when the inspector asks for media or when an empty media element is dropped from the Build tab.
- **Purpose:** Find an asset fast and put it on the canvas; upload; jump into stock, icons, fonts, or the full library.
- **Layout / contents (top → bottom):**
  1. **Panel header** — title "Assets", close (×) and expand-brackets buttons. The expand brackets do NOT widen the drawer; they open the full-page Asset library (A9).
  2. **"Manage assets ↗"** — full-width quiet grey button directly under the header. Opens the full-page library.
  3. **Replacement banner** (only right after a "Choose a smaller file…" replacement upload lands, see A1 · Failed uploads): the landed file name; a meta line "Uploaded · JPG · 1.2 MB · In site library" (or "· On this device only" when the server mirror failed); a text link "Manage in full library" (opens the library with that file selected). Clears on the next upload.
  4. **Status pill** (floats over the top-left of the grid while a long job runs; not clickable): "Image editor — crop · rotate · adjust" while the image editor is open from this drawer, "Optimizing → WebP…" while an optimised copy is being saved. Any click/tap in the drawer dismisses it.
  5. **Search box** — 36px bordered box, placeholder "Search". No magnifier icon, no inline clear. Filters the grid by file name as you type. Two or more characters also searches the server side of the library when only part of it is loaded (see scope line).
  6. **Search-scope line** (only when a query of ≥2 chars is running AND the library is bigger than what is loaded): accent text "Searching all 412 items…" → "Searching all 412 items"; or "First 200 matches — narrow the search to see more"; or red "Couldn't reach the rest of your library".
  7. **Folder row** — left: folder icon + current scope name + ▾ ("All" by default; disabled when the site has no folders). Click → dropdown menu: "All", then one item per folder. Right: "☑ Select" text link that turns bulk-select mode on/off (pressed state when on).
  8. **Type chips** (multi-select filter, none selected = everything): "image 128 · video 6 · svg 24 · icon 370" — four chips labelled `image`, `video`, `svg`, `icon`, each with a mono count of the WHOLE library (counts never change with search/scope). Tooltips: "Images", "Video", "Icons and SVG", "Fonts and icon sets". A chip whose count is 0 is disabled with tooltip "No image files in this library yet" (unless it is already selected, so you can always un-select it). Counts are hidden when the library failed to load.
  9. **Asset grid** — two fluid columns of 136×104 cards (see A2). Between grid and footer, when the server holds more than is loaded: a 36px row "Showing 200 of 412" (mono, left) and a text link "Load more" → "Loading…" → on failure "Try again".
  10. **Bulk bar** (replaces the footer while Select mode is on): dark (near-black) 44px band, white 12px text: "3 selected" · "Move to…" (opens a menu: "(Root)" then every folder, nested ones indented) · "Delete" · right-aligned "Done". Move/Delete are disabled with nothing selected.
  11. **Footer** (hidden in Select mode):
      - **Upload drop strip** — invisible at rest. While you drag files over the drawer it becomes a 36px dashed strip "Drag files or click to browse" (or "Almost full (84%)" with a warning icon at ≥80% quota, or "Storage full" when full). Dropping files uploads them. The strip is also the hidden file input the "Upload" link opens: multiple files; images, videos, .svg, .ttf, .otf, .woff, .woff2.
      - **Quota band** (only when ≥80% used):
        - Near limit (80–99%): warning-tinted 78px band — "842 MB of 1 GB used" (warning text), a 4px track, then accent link "Optimise images to free space ›" (opens the full library).
        - Full (100%): a 40px red-washed band, then an 84px grey block: "1 GB of 1 GB used — upload is off until you free space" and, lower, "Nothing already on your sites is affected." Upload link and drop strip are disabled; the whole footer turns grey.
      - **Uploads in progress** — one 44px row per file: file name (left), mono "42%" (right), 4px accent progress track underneath. No cancel.
      - **Failed uploads** — one warning-tinted row per failure: file name; the reason in full (warning text, wraps) e.g. "Upload failed — file is 62.0 MB, the limit is 10 MB per file" or "Unsupported file type: application/pdf"; then EITHER "Choose a smaller file…" (when the size limit was the reason — opens a single-file picker and then the Replacement modal, A8) OR accent "Retry". Rows persist until acted on.
      - **Links row** (one line, spread across the width): "↑ Upload" · "☁ Stock" · "◇ Icons" · "Aa Fonts". Upload is disabled when storage is full.
      - **Accept line** (soft grey): "Images, videos and fonts · up to 10 MB per image · 1 MB per SVG · 100 MB per video · 5 MB per font".
  12. **Selection-context bar** (top of panel, above the header, only when the canvas asked for an image): accent-blue band with a pulsing white dot — "Selecting image for:" / "{element label}" (e.g. "Hero block", falls back to "Canvas element") and a small "Cancel" button. While this is up, clicking a card REPLACES that element's image instead of inserting a new one.

- **Actions:**
  - Single-click a card → inserts it on the active page (image/video/SVG element) and selects the new element; if an image or video element is currently the only selected thing on the canvas and the asset is the same kind, the click REPLACES that element's source instead. Fonts can't be placed: info toast "To use this font: select text on canvas → Inspector → Font → My Fonts". Insert waits ~250ms so a double-click is not also an insert.
  - Double-click a card → opens the Asset detail drill-in (A3).
  - Right-click a card → enters Select mode with that card checked.
  - Drag a card → drop on the canvas (inserts at the drop point) or, in the full library, onto a folder (moves it).
  - In Select mode: click toggles the card's checkbox.
  - Drag files anywhere over the drawer → drop strip lights up; drop uploads.
- **States:**
  - No project: header "Assets" and the line "Open a project to manage media."
  - Loading (storage not yet read): six skeleton cells (thumb bar + uneven label bars) on the grid geometry, no empty text.
  - Load error (browser storage could not be read): centred red "Couldn't load your media." with two text links "Try again" · "Browse stock". Type-chip counts hidden.
  - Empty library: centred grey "No images or files yet." with link "Browse stock" (upload lives in the footer).
  - Search with no match: left-aligned grey "Nothing matches ‘hero’." + link "Clear search".
  - Type filter with no match: "No assets matching this filter." + link "Clear filter".
  - Hover a card: no fill change (flat); focus ring on keyboard focus.
  - Selected (Select mode): card gets the focus-ring box shadow and a ticked accent checkbox beside its name.
- **Flows:**
  - Upload: click "Upload" → OS file picker (multi) → progress rows appear above the footer → toast "hero.jpg uploaded ✓" (or warning toast "hero.jpg saved on this device — it didn't reach the server, so it won't publish yet." when the server mirror failed) → card appears. A file that already exists by name gets info toast "\"hero.jpg\" already exists — uploading as duplicate". If a whole batch would overflow the quota: error toast "Not enough storage — delete some files to free space" and nothing is sent. If some files were refused: error toast "2 uploads failed" plus the per-file failed rows.
  - Oversized file: failed row with the size reason → "Choose a smaller file…" → pick one → Replacement modal (A8) → "Upload file" → the failed row disappears, the new file uploads, and the Replacement banner appears at the top of the drawer.
  - Bulk delete: "☑ Select" → tick cards → "Delete" → Confirm-delete modal (A7) → toast "Deleted 3 files." (or "Deleted \"hero.jpg\" and cleared it from 2 elements.") with an **Undo** action, 8 seconds. Undo puts the files back AND restores their references on the page.
  - Bulk move: "Move to…" → pick a folder → toast "Moved 3 files" → Select mode ends.
  - Insert local-only asset: warning toast "hero.jpg is only on this device — it won't show on the page or publish. Re-upload when you're back online."
  - Insert with no page open: info toast "Select a page first, then add media". Other failure: error toast "Could not apply media — try again". Storage-full failure: error toast "Storage full — delete unused assets to free space".
  - Replace via selection-context: inspector "Choose image" / empty Image element → drawer opens with the bar "Selecting image for: …", the search prefilled with the element's label and the type chips pre-set to that kind → click a card → toast "{name} applied ✓" → editor switches back to the Build ("add") tab.
- **Keyboard shortcuts:** Esc inside the drill-ins pops one level (see A3–A5). Cards are focusable buttons (Enter/Space activates).
- **Copy used:** all strings above; also "Search library" (accessibility label), "Filter by media type", "Asset library", "Loading media", "Uploads in progress", "Failed uploads".
- **Gating / notes:** The "APPLIED" badge (accent, top-right of a card) and the lock overlay exist in the card design but nothing in the drawer ever sets them. The "AI" provenance badge is drawn but nothing generates assets yet; only "STOCK" ever appears. Server paging/search lines only appear in the real app (there is no server in the standalone demo).

## A2. Asset card (grid tile)

- **Where it lives:** Drawer grid (A1). Similar but larger cards in the full library (A9).
- **Layout:** 136×76 thumbnail on light grey (image: the picture, cover-fit; video: a play glyph; svg/icon: a file glyph; font: "Aa" rendered in that font), then an 18px row: [checkbox in Select mode] file name with extension (e.g. "hero-dark.jpg", truncated) and, right, up to three 5px accent "usage pips" (one per page the asset is used on; a fourth wider faded pip means more than 3). Bottom-left of the thumb: a 52×14 dark badge "STOCK" (or "AI"). Top-right: "APPLIED" accent badge (never set today).
- **Accessibility label:** "{name} asset"; pips read "Used on 2 pages".

## A3. Asset detail drill-in (drawer)

- **Where it lives:** Slides over the whole drawer (same 320 width) when you double-click a card.
- **Purpose:** The hub for one asset: alt text, usage, versions, edit, optimise, replace-everywhere.
- **Layout / contents:**
  1. Panel header "Assets" with close ×.
  2. Back row: "‹  hero-dark.jpg" (in sub-views: "‹  hero-dark.jpg · versions", "· used in", "· optimise").
  3. **Hub view:**
     - 160px preview well on light grey (image or a video element). Bottom-left mono caption "1440×960 · 245 KB" (dimensions measured from the file; size only if unknown).
     - "Alt text" label + input, placeholder "Describe this image for screen readers". Saves on blur or Enter.
     - Link "✨  Generate" → "✨  Generating…" (AI writes ≤125-char alt text and saves it; silently stays manual if AI is unavailable).
     - Five 32px rows with a right chevron: "Used in 3 places ›" · "Versions" with a mono count "2" when restore points exist "›" · "Edit image ›" (images only; opens the image editor A10) · "Optimise ›" (images only) · "Replace across site ›" (images and videos).
     - Preview failure: "Preview unavailable" / "The file may have been moved or deleted." / link "Retry".
  4. **Versions view:** a pinned accent-tinted 44px chip with a 3px accent bar: "now" … mono "current". Then one grey chip per server restore point: dot, relative time ("2h ago", "3d"), mono size delta ("+120 KB", "−80 KB", or "original" for the oldest) and a "⋯" button. "⋯" opens an inline 84px grey band: "Restore this version? It is used in 3 places — those will update too." with links "Cancel" · "Restore". While restoring the ⋯ shows "…". Empty: "No saved versions yet. Edits create restore points automatically."
  5. **Used-in view:** one 44px grey chip per placement: page name (12px) over the element's name (11px muted) with a right accent link "Go ›" (switches to that page and selects the element). Empty: "Not used on any page" / "Deleting this file won't change anything on your site." When used: a warning band at the bottom "Deleting this breaks 2 pages. Replace it instead."
  6. **Optimise view:** the Optimise panel (A11); its "Optimise" button saves a new file "{name}_opt_v1234.webp" into the library, toast "Optimized hero-dark ✓" (error: "Could not save optimized image"), and returns to the hub.
- **Actions / flows:** Edit image → image editor opens (pill "Image editor — crop · rotate · adjust" shows on the drawer); saving there creates a hidden VERSION of this asset ("hero-dark-v2.webp") and "Done" opens the full library with the parent selected. Replace across site → OS file picker (images or videos) → the replacement uploads → Replace-across dialog (A6).
- **Keyboard shortcuts:** Esc pops one level (sub-view → hub → grid). Tab is trapped inside the overlay. Esc is ignored while a modal (e.g. the image editor) is open above.

## A4. Icon browser drill-in (drawer)

- **Where it lives:** Over the drawer, from the footer "◇ Icons" link.
- **Purpose:** Drop one of 370 line icons onto the canvas.
- **Layout / contents:** header "Assets" + ×; back row "‹  Icons"; search field, placeholder "Search 370 icons"; category row: dropdown "All ▾" (menu: "All", then Arrows, Actions, Interface, Users, Communication, Media, Files, Text, Time, Shopping, Social, Technology, Alerts, Charts, Design, Security, Location) and, right, mono "17 categories"; a grey "RECENT" band with a mono count (only with no search, "All" category, and something recent) followed by a 6-column grid of the last 12 picked; then the main 6-column grid of 40px-tall tiles (icon at 18px). Tooltip on each tile is the icon's name (e.g. "arrow-up-right").
- **Actions:** click a tile → inserts the icon on the canvas with default size/colour, remembers it in Recent, closes the overlay; toast "arrow-right icon added ✓" (error: "Could not add icon").
- **States:** no match → "Nothing matches ‘foo’." + link "Clear search".
- **Keyboard:** Esc closes.
- **Notes:** Size/colour/stroke controls are NOT here; they live in the inspector's icon picker modal (A12). Recents are shared with that modal.

## A5. Stock browser drill-in (drawer)

- **Where it lives:** Over the drawer, from "☁ Stock" (footer), or the "Browse stock" links in the empty and error states.
- **Purpose:** Search free stock photos/videos and save one into the library (it does not touch the canvas).
- **Layout / contents:** header "Assets" + ×; back row "‹  Stock photos" (or "‹  Stock videos"); search field placeholder "Search free stock" (press Enter to search); a horizontally scrolling row of three 88px dropdowns: "Orientation ▾" (All / Landscape / Portrait / Square), "Colour ▾" (All / B&W / Black / White / Red / Orange / Yellow / Green / Teal / Blue), "Type ▾" (Photos / Videos). A chosen non-"All" value replaces the button label (e.g. "Landscape"); Type always shows "Type" and the back row tells you which. Results: 3-column grid, 66px-tall thumbs, under each a 24px muted credit "Unsplash · Author Name" / "Pexels · Author". Below: "Loading 8 more…" while fetching; a centred "Load more" link when idle with results. Scrolling to the bottom auto-loads up to three times, then only the link loads more.
- **Actions:** click a result → saved into the library as "restaurant-interior.jpg" (named from the photo's description) with a "STOCK" badge; the normal upload toast fires. Error: toast "Failed to save to library".
- **States:** empty → "Search to browse free photos." / "Search to browse free videos."; provider failure → error toast: "Stock search isn't set up on this site" / "The stock provider rejected our API key" / "Couldn't reach the stock library".
- **Keyboard:** Esc closes; Enter in the field searches.

## A6. "Replace across site" dialog (drawer)

- **Where it lives:** Centred dialog with a dark scrim, after you pick a replacement file from the detail hub's "Replace across site ›".
- **Layout / contents:** title "Replace across site"; body "Every place that uses **hero-dark.jpg** — 3 in total — will switch to the image you pick. This can be undone."; a Before → After preview (two 96×64 plates with an arrow; the incoming one ringed in accent); caption "PAGES" over a list of checkboxes, one per page: "Home … 2 uses", "Menu … 1 use" (all ticked by default); footer "Cancel" · primary "Replace 3 uses on 2 pages" (disabled at 0 selected).
- **States:** not used anywhere → "This asset is not used on any page." and the button is disabled.
- **Flow:** commit → the Replace-result card (A9 · Replace result): "Replacing image" → "Replacement complete" or "Some uses could not update" with a "Retry failed use" option. One undo step reverses the whole batch.

## A7. Confirm-delete modal

- **Where it lives:** Centred modal (both drawer and full library). Does not close on scrim click.
- **Layout / contents:**
  - Single file: title "Delete hero-dark.jpg?"; body "Used in 3 site placements. Deleting this file permanently breaks those elements. Replace the file instead if you want to preserve them." or "This file is not used on the site."; footer "Cancel" · "Replace instead" (only in the full library, only when in use — opens the replace picker) · red "Delete permanently".
  - Multiple: title "Delete 3 selected files?"; body "hero-dark.jpg (3 uses), chef.mp4 (unused) and menu.png (1 use) will be permanently deleted. This affects 4 placements." (or "None of them is used on the site."; more than five files reads "… and 29 more"); footer "Cancel" · red "Delete 3 files".
  - More than 20 files: an extra block "Type **DELETE** to confirm:" with an input (placeholder "DELETE"); the red button stays red but dimmed and disabled with the reason under the footer "Delete stays disabled until the word matches exactly."
- **Flow:** confirm → files leave the library at once, their references on the page are cleared, and a toast with **Undo** (8 s) is the only way back. A file's saved versions go with it. Failure: toast "Could not delete \"hero-dark.jpg\"".

## A8. "Upload this replacement file?" modal

- **Where it lives:** Centred modal after "Choose a smaller file…" in the drawer.
- **Layout / contents:** title "Upload this replacement file?"; line "pasta-small.jpg · 2.1 MB"; verdict line "JPG image · Within the 10 MB limit. The original 62.0 MB file was not uploaded." (or, in warning colour, the engine's refusal e.g. "Upload failed — file is 14.0 MB, the limit is 10 MB per file", in which case the primary is disabled); full-width primary "Upload file"; below it a bare text link "Cancel".

## A9. Asset library (full-page manager)

- **Where it lives:** Covers the whole editor (portalled full page). Opened by "Manage assets ↗", the drawer's expand brackets, "Manage in full library", "Optimise images to free space ›", or a saved image-editor "Done".
- **Purpose:** Organise the whole site library: folders, tags, list/grid, bulk actions, versions, replace-everywhere, import, stock, fonts.
- **Layout:** a 52px top bar; a 3-column body (240px folder rail · fluid grid · 378px details rail; below 1320px wide the grid drops to 4 columns; the rail hides on narrow widths); a grey status bar at the foot.

### A9.1 Top bar
- Title "Asset library".
- Search field with a magnifier and a "⌘K" hint at the right: placeholder "Search across all folders…". When a tag filter is on, the field leads with a grey token "Tag: menu · Clear filter ×" (× clears the tag) and typing searches within the tag.
- Buttons: "⭳ Import URL" (outlined) · "↑ Upload" (accent primary) · "+ Add from stock" (outlined) · "Close" (borderless text).
- **Keyboard:** Esc closes the library; ⌘/Ctrl+K focuses search.

### A9.2 Folder rail (left)
- Section caption "Smart" (10px, uppercase-ish): rows "Recent" (blue clock icon, count = added in last 7 days), "In use" (green check, count = used on the site), "Unused" (grey minus, count = not used).
- Caption "Folders": "All assets" with the total count (open-folder icon), then each user folder inset one level with a folder icon, its own direct-child count, a chevron to collapse/expand when it has sub-folders, and a small trash icon on the row ("Delete folder"). Then a "＋ New folder" row (opens the Create-folder modal). "No folders yet" (muted) when there are none.
- Caption "Tags" (only if any asset has tags): pill chips, one per tag; click to filter, click the active one again to clear; active chip = accent edge on accent tint.
- Foot: "Trash" row with count 0 → info toast "Trash coming soon".
- Rows are keyboard-reachable (Tab, Enter/Space). The active scope row is highlighted.
- **Drag & drop:** while an asset card/row is being dragged, "All assets" and every folder row get a dashed accent outline; the one under the pointer tints. Dropping moves the asset (or the whole checked set if the dragged one was checked) and the rail shows the move result.
- **Note:** the trash icon deletes an EMPTY folder immediately with no confirm. On a non-empty folder the request is refused silently (nothing visible happens).

### A9.3 Grid column (middle)
- **Toolbar** (hidden when an empty folder is the scope): count line "24 files · All assets" (scope name = folder, "Recent", "In use", "Unused"; during a search "1 result for \"menu\""; with a tag "3 matching assets · Tag: menu"; right after a card-menu move "Products · team-photo.jpg moved"); format chips built from the formats actually present ("JPG", "PNG", "WEBP", "SVG", "MP4"…; click toggles, active = accent); a chip "img + vid ✕" when a type filter was carried in from the drawer (click clears it); then "Grid · 3 columns" (active when in grid), a "2 / 3 / 4" column group, "List", a sort button labelled "Date added" / "Name A–Z" / "Name Z–A" / "Size" / "Type" with ▾ (menu: the four options with a ✓ on the current, a separator, then "Ascending ↑" or "Descending ↓" toggle), and a ☑ button "Select files" (enters Select mode and switches to List; pressing again leaves).
- **Bulk bar** (below the toolbar, only in Select mode with ≥1 checked): "3 selected" … "Move to folder…" · "Download" (accent links) · "Delete" (red) · "✕ Clear" (muted). Download hands each file to the browser, toast "Downloading 3 files", then the "Download prepared" modal.
- **Unused scope note:** "12 unused assets · No current site references."
- **Uploads list** (files in flight or failed): "hero.jpg → uploading…" with a progress track; "big.mp4 → Upload failed — file is 120 MB, the limit is 100 MB per file" with a "Dismiss" button.
- **List view:** header row: select-all checkbox · "Name" · "Type" · "Size" · "Usage". Rows: checkbox · name · "IMG / VID / SVG / FONT" · "1.2 MB" · "used ×3" or grey "unused". Click selects (rail), double-click inserts and closes the library, right-click opens the asset menu, rows are draggable.
- **Grid view:** bordered cards: thumb (image / video poster or neutral tile with ▶ / SVG at 36px with ◆ badge / "Aa" with Aa badge), a white "···" button top-right of the thumb on hover/focus (opens the asset menu anchored under it), a white check disc when selected; below: name (12px medium) and a dot + "used ×3" / "unused".
- **Empty folder:** left-aligned "Products" (16px), "Folder created · No assets yet", "Upload files or move existing assets into this folder.", button "Upload files".
- **Empty library / no results:** centred folder icon; "No images or files yet." / "Everything you upload lives here, in one library for the whole site." with buttons "↑ Upload" (primary) and "🔍 Browse stock"; during a search: "No results" / "No assets match \"foo\"" and no buttons.
- **File drag-over:** the whole column becomes a dashed accent zone with a centred card "Drop files to upload" / "JPG · PNG · GIF · WebP · AVIF · SVG · MP4 · WebM · OGV · MOV · WOFF2 · WOFF · TTF · OTF — up to 10 MB per image · 1 MB per SVG · 100 MB per video · 5 MB per font". Dropping uploads into the current folder (no confirm).
- **Asset drag ghost:** the thumb (grid) or up to two stacked rows (list) with an accent pill "3 items"; the status bar reads "Drop on a folder to move · release outside to cancel" (or "Drop 3 files on a folder to move them · …"); the details rail dims.
- **Selection:** click = select for the rail; ⌘/Ctrl+click = enter Select mode and toggle; in Select mode click toggles.

### A9.4 Details rail (right)
- Nothing selected: "Select an asset to see details."
- Select mode with 0 or 2+ checked: "No assets selected" / "Select a file to inspect it. Select checkboxes to manage multiple assets." or "3 assets selected" / "Actions apply to all 3 selected files. Moving files only changes library organisation." ("both" for two), the file names, then full-width "Move to folder" (primary) and "Clear selection" (quiet).
- After a move: "Moved to Hero shots" / "2 assets moved successfully. Their existing site placements are unchanged." (or "a.jpg moved; b.jpg was already here. Site placements are unchanged."), the file list, "View destination" (primary; makes that folder the scope) and "Clear selection".
- One asset (clicked, or exactly one checked):
  - Preview (image; video first frame; SVG at 64px; font "Aa Bb" at 48px).
  - File name; meta line "1600 × 1200 · 220 KB · PNG · added Aug 4" (font: "Site font · added · WOFF2" or "Uploaded · not added · WOFF2"; otherwise "Selected asset · MP4").
  - "Alt text" (images): 2-row textarea, placeholder "Add a description for this image", max 125; under it either "43 / 125" or "✨ AI-generated by gpt-4o on 9/3/2026"; right: small "✨ Generate" / "✨ Regenerate" / "Generating…" button. Toasts: "Alt text regenerated" · "Kept your alt text instead of overwriting" · "Couldn't generate alt text — try again later". Typing clears the AI provenance.
  - "Tags": chips with an × each; input placeholder "Add tag" (Enter adds; lower-cased; max 24 chars; duplicates ignored).
  - "Versions" (only when a saved version exists): rows newest first "v2 · Latest saved" / "v1 · Original" with a thumb, a short date, and an "APPLIED" marker on whichever version the site actually uses. Clicking a row opens the Asset versions modal.
  - "Used in": "Not used on this site" / "3 places — Home, Menu" / "Used in 3 places".
  - Actions (stacked): "Insert to canvas" (primary; inserts and closes the library; not for fonts) · for fonts "Manage font" (quiet; opens Site fonts on this file) · images/SVG: "Edit image" + "Rename" side by side, others just "Rename" · "Replace across site…" (not for fonts; disabled with tooltip "Nothing on the site uses this asset yet" when unused) · "Optimize" (images; opens the image editor on its Optimise tab) · red "Delete".
- **Replace picker modal** (from "Replace across site…"): title "Replace \"hero-dark.jpg\" across 3 uses", × close, "Pick a replacement asset. All canvas usages will be swapped atomically (one undo reverses everything).", a 3-column grid of same-type candidates; empty "No other images in your library." (or "No other assets of the same type in your library."). Clicking a candidate runs the replacement and shows the Replace-result card.

### A9.5 Status bar
"24 assets" · dot · "842 MB / 1 GB" · a thin quota track (right) · when any file never reached the server, a pill "⚠ 3 not on the server".

### A9.6 Asset context menu (right-click / "···")
182px menu, 11px rows, one divider before Delete: "Insert to canvas" · "Select" (enters Select mode with this file checked) · "Rename…" · "Edit image…" (images) · "Move to folder…" (opens the Move modal for this one file) · "Copy URL" (toasts "URL copied ✓" / "Could not copy URL" / "Clipboard not available in this browser") · "Copy alt text" (images that have alt) · ─── · red "Delete". Esc closes. ("Replace across pages…" exists in the menu design but is not wired in the library today.)

### A9.7 Library modals (all: 16px title, 13px grey body, 32px buttons, left-aligned footer)
- **Upload files** (after picking files with "↑ Upload" or the empty-state buttons; a drag-drop skips it): title "Upload files"; one line per file "hero.jpg · JPG · 2.4 MB", with a warning-coloured reason under any the engine refuses; status "Ready to upload to this site library." / "Nothing to upload." / "Uploading…"; footer "Cancel" · "Upload file" / "Upload 3 files" (disabled when nothing is accepted). While uploading each accepted line shows a mono "42%" and a progress bar; a failure shows its reason in place.
- **Upload complete:** "Upload complete"; "hero.webp is now in your library." or "3 files are now in your library."; warning lines "big.mp4 — Upload failed — …"; "Not used on this site. Choose the image when you are ready to insert it." (or "Choose one when you are ready to insert it."); "Done" · "View asset" (single file only; selects it in the rail).
- **Import image from URL:** "Import image from URL"; "Add an image to your library. Importing does not replace an image on the canvas."; URL field placeholder "https://" (Enter submits); inline red error "That is not a web address. It needs to start with http:// or https://."; "Cancel" · "Import image" → "Importing…". Lands in the current folder.
- **Image imported:** "Image imported"; "photo.jpg · Image"; "Added to your library · Not used on this site."; "Done" · "View asset".
- **Image could not be imported:** "Image could not be imported"; "This URL does not return a supported file. Use a direct JPG, PNG, GIF, WebP, AVIF, SVG, MP4, WebM, OGV, MOV, WOFF2, WOFF, TTF or OTF file URL." (or the engine's own refusal when the file was fetched but too big); "Cancel" · "Edit URL" (reopens the import dialog with the address kept).
- **Stock assets** (from "+ Add from stock"): title "Stock assets"; "Browse stock photos and save an image to this site. Your canvas selection stays unchanged."; search field placeholder "Search stock photos…" (debounced 400ms; "…videos…", "…icons…") beside a three-button switch "Photos" / "Videos" / "Icons"; results as 2-column cards (image, bold title = the photo's description or "Stock photo" / "Video · 12s", credit "Author · Unsplash" with the author as a link) or 4-column icon cards (icon, name, category); one card selectable (accent border). Icons tab has a link "Browse full icon library ↗" (opens the Select Icon modal, A12). States: "Searching..."; "Search to see stock photos."; "No photos found for \"foo\"" / "No icons found."; failures: "Stock search isn't configured for this site yet. Ask an admin to add a stock provider key." · "The stock provider rejected our API key. It may have expired — an admin will need to renew it." · "Couldn't reach the stock library. Try again" (only this one offers Try again). "Load more" / "Loading..." full-width under photo/video results. Footer "Cancel" · "Save to library" → "Saving…" (disabled until a card is selected). Success closes it and shows:
- **Stock image saved:** "Stock image saved"; "restaurant-interior.jpg is now in your asset library."; "Not used on this site. Choose it from Assets when you are ready to insert or replace an image."; "Done" · "View asset".
- **New folder:** "New folder"; "Folder name:"; input placeholder "Folder name" (Enter creates); "Cancel" · "Create folder" (disabled when blank). The new folder becomes the scope. Duplicate name → second step "Folder name already exists": "Products already exists. Choose a different name. Your assets have not changed."; "Cancel" · "Use Products 2" (first free numbered name).
- **Rename:** "Rename hero-dark.jpg"; "Changing the file name will not move or replace its site usages."; field prefilled with the full name, the stem pre-selected; "Cancel" · "Save name" (disabled until changed). Clash → "A file with that name exists": "Choose a different file name. The original file name has not changed."; "Cancel" · "Edit name". A dirty rename pulses instead of closing on a stray scrim click.
- **Move assets:** "Move 2 assets" / "Move 1 asset"; "hero-dark.jpg is in Hero shots; chef-intro.mp4 is unfiled. Choose a destination."; one full-width grey button per folder (all folders, nested included); "Cancel". Choosing a folder moves immediately.
- **Files could not be moved:** "No files moved. Your selection and current folders are unchanged. Try again."; "Cancel" · "Retry".
- **Download prepared:** "Download prepared"; "The selected file or selected-file archive is ready. Your assets and site placements are unchanged."; "Done".
- **Asset versions:** "Asset versions"; "hero-dark.jpg · Original retained"; cards newest first, bordered, the selected one ringed in accent: head "v2 · Latest saved · 2400 × 1600" (or "v1 · Original"), state "Not applied to site" / "Applied to site · 3 placements" / for the original "Currently used on Home and Menu · 3 placements" / "Not on site", and for saved versions two muted lines "Crop: Free · Preset: None · Format: Original" and "Brightness: 0 · Contrast: 0 · Saturation: 0 · Blur: 0". Footer "Close" · "Edit latest saved version" (opens the editor on that file; its save becomes v3) · primary "Apply latest saved version" (disabled with tooltip "No saved version yet — Edit image and Save version to create one" or "The site already uses the latest saved version").
- **Apply saved version across site:** "Update 3 uses on Home and Menu to the latest saved version. The original and prior saved version remain available." (or "Nothing on the site uses hero-dark.jpg yet, so there is nothing to update. The saved version stays in Asset versions." with the primary disabled); "Cancel" · "Apply to 3 uses". Then a brief non-dismissable card "Applying saved version" / "Updating 3 uses across Home and Menu. Please wait." then the result card titled "Saved version applied" with an extra "View versions" button.
- **Replace result card** (shared by Replace across site and Apply version): "Replacing image" / "Updating 3 uses across Home and Menu. Please wait." (not dismissable) → "Replacement complete": "3 of 3 uses updated", "Home: 2 updated · Menu: 1 updated", "Other elements are unchanged.", "Done" (+ "View versions" for apply). Partial: "Some uses could not update": "2 updated · 1 failed", the per-page line, then per failure "Menu / Hero image: update could not be saved. The previous image remains.", footer "Close" · "Retry failed use" → "Retrying failed use": "Retrying Menu / Hero image only. The 2 successful updates will not be repeated."
- **Site fonts** (from the drawer's "Aa Fonts", the rail's "Manage font", or the Typography picker's "Manage site fonts"): "Site fonts"; "Manage this site's fonts. Built-in Inter stays available."; search field "Search fonts" (Enter on a no-match query swaps to the "No fonts found" dialog); heading "Uploaded fonts"; empty "No uploaded fonts yet. Upload a .woff2, .woff, .ttf or .otf file to the Asset library to add it here."; one bordered card per font file: "Inter · Inter-Var.woff2", the sample "The quick brown fox jumps over the lazy dog." rendered in that font, and either primary "Add font" or "Added" + quiet "Remove"; the file it was opened for is ringed in accent; footer "Cancel". **Font added:** "Uploaded Inter is now available in the font pickers. Existing text is unchanged until you choose this font."; "Done" · "Manage site fonts". **No fonts found:** "No fonts match \"foo\". Clear the search to browse available fonts."; "Cancel" · "Clear search".

## A10. Image editor modal

- **Where it lives:** Centred 960×740 card over a scrim (from the detail hub "Edit image", the rail's "Edit image"/"Optimize", the asset menu "Edit image…", or "Edit latest saved version").
- **Purpose:** Crop, adjust, resize and optimise; saving creates a new VERSION of the same asset (the original is kept; the site is not changed until you apply/replace).
- **Layout / contents:**
  - Head: "Edit image"; subtitle "hero-dark.jpg · 1800 × 1200"; four equal 32px tab chips "Crop" · "Adjust" · "Resize" · "Optimise" (selected = accent tint).
  - Body (grey): LEFT a 510px white preview card with a dashed well containing the interactive cropper (drag to pan, wheel/slider to zoom, grid off), under it a mono status "1600 × 1200 · Free · WebP" and a ghost "Reset all" button. RIGHT the active tab's controls.
  - Foot: note "Your draft stays with you across tabs. Save creates a version; site placements stay unchanged." · "Cancel" · primary "Save version" → "Saving…".
- **Crop tab:** "Aspect ratio" chips Free · 1:1 · 4:3 · 3:2 · 16:9; "Rotation" slider −180…180 with mono "0°"; two half-width buttons "↺ 90°" / "↻ 90°"; "Flip" chips "Horizontal" / "Vertical" (toggle); "Zoom" slider 100%–200% with mono readout and hint "Drag the image in the preview to reposition."
- **Adjust tab:** sliders "Brightness", "Contrast", "Saturation" (−100…100), "Blur" (0–20, "3px"); "Preset" chips None · B&W · Sepia · Cool · Warm · Vibrant.
- **Resize tab:** "Width" and "Height" text fields (default = the crop's size); red error under them: "Width and height cannot be negative." / "Enter whole pixel values for width and height." / "Width and height must be at least 1 px." / "Maximum is 8192 × 8192 px. Enter a smaller size to continue."; a full-width chip "Aspect ratio locked" / "Aspect ratio unlocked" (locked: the other field follows); "Scale" chips 25% · 50% · 75% · 100%; note "The original 1800 × 1200 file is kept. Resizing only affects the new version." Save is disabled while the size is invalid.
- **Optimise tab:** "Format" chips WebP · JPEG · PNG; "Quality" slider 10–100 (mono readout); a bordered box "Original · 840 KB" / "Estimated · 495 KB (-41%)" (green when smaller, "…" while estimating); note "File size is an estimate until the version is saved."
- **States:** image can't load → in the well: warning icon, "Image failed to load", "The asset's URL may be stale. Reload the page, or upload the image again." (Save disabled). **Saved state** (after a successful save): tabs disappear, the well shows the saved bytes full-width, right column: green "Version saved", "Version saved. Original retained. / Not yet applied to site.", then the edits list "Width: 1600", "Height: 1200", "Crop: Free", "Preset: Original", "Format: Original", "Transform: Rotate 90° · Flip horizontal" (or "Original"), "Brightness: 0 · Contrast: 0 · Saturation: 0 · Blur: 0"; foot note "To update site placements, use Replace across site from asset details." · ghost "‹ Back to editor" · primary "Done" (opens Asset versions on this file and closes).
- **Dialogs:** Cancel/Esc/scrim on a changed draft → "Discard unsaved changes?" / "The original and saved versions will remain unchanged." / primary "Keep editing" · red "Discard changes" (Esc = keep editing). Save rejected → "Version could not be saved" / "Your edits are retained. Check your connection and try again." / "Continue editing" · "Retry save" → "Saving…" (retries the exact same bytes).
- **Notes:** Output defaults to WebP at quality 85. JPEG output flattens transparency to white. Longest side capped at 8192px.

## A11. Optimise panel (drawer drill-in)

- **Where it lives:** Inside the Asset detail drill-in ("Optimise ›"). (The full library's "Optimize" opens the image editor's Optimise tab instead.)
- **Layout / contents:** 160px preview well (the optimised result once ready; a spinner while processing) with a mono caption "2400×1600 · 840 KB"; "Format" pill chips WebP · AVIF (disabled if the browser can't encode it) · JPEG · PNG; "Quality" label with mono "85%" and a slider 10–100; "Max dimension (px)" number field, placeholder "No limit"; rows "Original … 840 KB" and "Optimised … 495 KB · −41%" (green when smaller, warning when bigger, "…" while processing); full-width accent "Optimise" button (disabled while processing); note "Optimised copy saves as a new version."
- **Flow:** Optimise → uploads "{name}_opt_v1234.webp" into the library (toast "Optimized hero-dark ✓") and returns to the hub; status pill "Optimizing → WebP…" shows meanwhile.

## A12. "Select Icon" modal (inspector icon picker)

- **Where it lives:** Centred large modal, opened from the inspector when configuring an icon element, or from the Stock dialog's "Browse full icon library ↗".
- **Layout / contents:** title "Select Icon" + ×; "370 icons available"; search field "Search icons by name or keyword..."; a wrapping row of pill buttons "All" + the 17 categories; "RECENTLY USED" grid (no search, "All" category, up to 12); "ALL ICONS" grid (or "12 results for \"arrow\"") of 48px white tiles (selected = accent border/tint); empty "No icons found for \"foo\""; once a tile is selected, a grey preview panel: the icon at the chosen size/colour, its name and tags, controls "SIZE" (number 12–96), "STROKE" (slider 0.5–4 in 0.5 steps with mono readout), "COLOR" (native colour swatch); footer "Powered by Lucide Icons" … "Cancel" · primary "Select Icon" (disabled until a tile is chosen). Opening on an existing icon preselects it and its settings.

## A13. "Choose an image" picker (inspector)

- **Where it lives:** Centred modal, opened by the inspector's image/background/video source rows ("Choose image" etc.) for ONE element.
- **Layout / contents:** title "Choose an image" (caller may change it); line "For Menu preview · Image" (or "Image"/"Video"/"SVG"/"Media" alone); three buttons "Library" · "Upload" · "From URL" (active = filled accent); label "Search library" + search field (placeholder "Search images…", "Search videos…" or "Search library…").
  - **Library pane:** spinner while loading; 3-column cards (16:9 thumb, name with extension, dot + "used ×3" / "Unused"), one selectable (accent border); empty "Nothing matches \"foo\"." or "No images in your library yet. Upload one or import it from a URL."
  - **Upload pane:** dashed panel "Drop an image here, or" + "Choose file" (drag-drop works too); after picking: "photo.jpg · Ready to upload" + "Choose a different file"; red error line on failure.
  - **From URL:** opens the Import-image-from-URL dialog over the picker; success lands the file in Library selected; failure shows the "Image could not be imported" dialog (its "Edit URL" reopens with the address).
  - Hint line: "JPG, PNG, GIF, WebP or AVIF · up to 10 MB for this image field." (built from what the field accepts) or, after an upload/import, "Image added · photo.webp selected. Use it to update this image element."
  - Footer: "Cancel" · "Use selected image" (disabled until a card is selected) — or on the Upload pane "Upload image" → "Uploading…".
- **Notes:** Saved versions never appear as cards. Clicking a card only selects; the primary button applies it.

## A14. Under-the-hood rules the user runs into

- **Accepted files:** images JPG, PNG, GIF, WebP, AVIF, SVG (svg max 1 MB); video MP4, WebM, OGV, MOV (max 100 MB); fonts WOFF2, WOFF, TTF, OTF (max 5 MB); images max 10 MB. Audio (MP3, WAV, OGG, WebM, AAC, max 50 MB) is accepted by the engine but has no library bucket and never syncs to the server, so it is effectively unsupported in the UI.
- **Refusal copy:** "Unsupported file type: application/pdf" (or the file name when the type is blank); "Upload failed — file is 62.0 MB, the limit is 10 MB per file"; "SVG rejected: invalid SVG document after sanitization" (SVGs are stripped of scripts/links before storage).
- **What upload does:** raster images are converted to WebP (quality 85) and get a 200px thumbnail; the stored name loses its extension (the UI restores the real one); files land in the browser first, then mirror to the server. If the mirror fails (offline, signed-out, quota) the file is "local-only": it shows in the library, is flagged in the status bar ("N not on the server"), warns when inserted, and retries automatically when back online.
- **Storage quota:** 1 GB local cap; the server's plan quota when reachable (Free ≈ 500 MB, Pro ≈ 5 GB, Business unlimited). Sizes are shown in binary MB/GB.
- **Delete:** an 8-second grace with Undo in the toast; placements on pages are cleared immediately and restored by Undo; ⌘Z does not undo a media delete.
- **Versions:** a saved edit is a hidden child of the original ("hero-dark-v2.webp"); it never appears as a card, only in Versions; deleting the original deletes its versions.
- **Built-in stock stubs:** the Stock dialog's "Icons" tab lists four demo icons (User, Settings, Search, Heart in category "General"); a demo font list (Inter, Playfair Display, Fira Code, Roboto) exists in the engine but no screen shows it.

---

# PART B — CMS / CONTENT

## B1. CMS drawer — root

- **Where it lives:** Left sidebar drawer titled "CMS" (header with expand, help, close). Rail label "Content"/"CMS".
- **Purpose:** Manage collections (structured data → pages) and the Data layer (sources, variables, conditions).
- **Layout / contents:**
  - Tinted 32px group band "Collections" with a count; one row per collection: table icon, name, mono record count (or "—" until counted), chevron.
  - Row "+ New collection" ("+" in the icon column, accent label) — opens the Create Collection wizard (B9).
  - Tinted band "Data": rows "Sources [N] ›" (database icon), "Variables [N] ›" (braces icon), "Conditions [N] ›" (branch icon).
- **States:**
  - Loading (first server sync not done): the two bands with three skeleton rows each (glyph square + label bar).
  - Load error: red "Couldn't load your collections." / "This is a connection problem, not a change to your data." / link "Try again".
  - Empty (no collections, sources, variables or conditions): a 160px block "Collections turn a spreadsheet into pages — one page per row, updated when the data changes." with the accent link "Create a collection".
- **Actions:** click a collection → B2; click a Data row → B6/B7/B8.

## B2. Collection view

- **Layout:** crumb "‹ Menu items" (back to root); a 32px meta strip "12 records" … accent "+ Add"; the record list — one row per record with the display field's value (or "Record a1b2" from the id) and a published indicator, chevron; empty "No records yet — add the first one."; a bordered footer with rows "Fields [N] ›" and "Dynamic pages ›".
- **Actions:** row → B3 (edit); "+ Add" → B3 (new); "Fields" → B4; "Dynamic pages" → B5.

## B3. Record view (add / edit)

- **Layout:** crumb "‹ {record title}" (title = display field value, "Record a1b2", or "New record"); one control per field in field order: boolean → a 32px row "Field name … toggle"; textarea / rich text → label + 56px textarea; number → label + number input; everything else → label + text input. Red error text under a field when publishing fails validation (e.g. "Price is required", "Name must be at least 3 characters"). Then a row "Published … toggle". For existing records a red link "Delete record".
- **Save bar** (warning-tinted 44px, shown whenever something changed or the record is new): "Unsaved changes" … "Discard" (muted) · "Save" (accent) → "Saving…". Save creates the record (as draft, then flips to published if the toggle is on) or updates it, then returns to the collection.
- **Dialogs:** "Delete record?" / "\"Pasta\" will be removed. This one can't be undone." / "Delete record" (red). Back with changes → "Discard changes?" / "This record has unsaved changes. Going back throws them away." / "Discard".
- **Notes:** Image/date/slug/reference fields render as plain text inputs here (no picker). Drafts are not validated; publishing runs the collection's rules and shows the per-field errors.

## B4. Fields view

- **Layout:** crumb "‹ Menu items · fields"; one two-line row per field: name (13px) over the type in words (11px muted: "Text", "Long text", "Rich text", "Number", "Boolean", "Image", "Date", "Slug", "Reference"); right: a small "required" tag when required, and a "⋯" button → menu "Delete field".
- **Add:** accent link "+ Add field" → inline form: "Field name" input, a type select (the nine types above), a "required" checkbox, "Cancel" · primary "Add" (disabled until a name is typed). The slug is derived from the name.
- **Dialog:** "Delete field?" / "\"Price\" and its values on every record will be removed." / "Delete field".

## B5. Dynamic pages view

- **Layout:** crumb "‹ Menu items · dynamic pages"; label "URL pattern" + mono input, placeholder "/menu/{slug}"; hint "One page per record. Use a field slug in braces — {slug} — to build the URL."; status line: "No pattern set — this collection generates no pages." / "Generates 4 pages from published records." / warning "3 records, none published. Dynamic pages only generate from published records." / "No records yet — nothing to generate."; extra warnings: "This collection has no field called \"slug\", so every record resolves to the same URL." (or "…no fields called \"a\", \"b\"…") and "No template page is bound, so publishing emits none of these yet."
- **Save bar:** "Unsaved changes" · "Discard" · "Save"/"Saving…"; back with changes → "Discard changes?" / "The page pattern has unsaved changes. Going back throws them away." / "Discard".
- **Notes:** Only the URL pattern can be edited here; the template page path and SEO fields are set only in the Create-Collection wizard.

## B6. Sources view

- **Layout:** crumb "‹ Sources"; when any source exists a green pill "Watching for changes" under the crumb; one two-line row per source: name over a status line with a dot (green when it holds data, grey otherwise): "array · 12 items", "object · 4 keys", "api · https://…" / "api · no endpoint", "function", "csv · empty"; a "⋯" button → "Remove source".
- **Empty:** grey pill "No data source connected".
- **Add:** accent link "+ Connect a source" → inline form: a mono JSON textarea, placeholder `{"products": [{"name": "…"}]}`, red error "Not valid JSON — check the syntax and try again." (or "Editor not ready."), "Cancel" · primary "Add source" (disabled when blank). Each top-level key of the JSON becomes a source.
- **Note under the link:** "A source feeds a collection. Edits sync one way — from the source in."
- **Gating:** No Google Sheets, Airtable, CSV-file or API connect flow exists — JSON paste is the only way in. No "last synced" clock (the status is whether the source holds data).

## B7. Variables view

- **Layout:** crumb "‹ Variables"; one two-line row per variable: mono accent key "{{site.phone}}" over its value (or "—"); "⋯" → "Edit value" / "Delete variable". Editing shows an inline input under the key (Enter saves, Esc cancels) and a "Save" button.
- **Empty:** "No variables yet. A variable is a value you write once and reuse in this panel — {{site.name}} is saved in this browser, and pages do not read it yet."
- **Add:** accent link "+ New variable" → inline form: inputs "key (e.g. phone)" and "value"; red errors "A variable with this key already exists." / "Keys are letters/digits/dashes, starting with a letter."; "Cancel" · "Add".
- **Gating:** Variables are saved in this browser only and are not substituted on the canvas or in published pages yet.

## B8. Conditions view

- **Layout:** crumb "‹ Conditions"; one two-line row per element with a condition: the element's text (first 24 chars) or type, over a summary "when menu.available is false" (operators read as: is · is not · > · < · ≥ · ≤ · contains · doesn't contain · exists · doesn't exist · is empty · isn't empty); "⋯" → "Select element" / "Remove condition".
- **Empty:** "No conditions yet. A condition shows or hides an element based on data — "+ New condition" starts by picking the element on the canvas it controls."
- **Add:** accent link "+ New condition" → the canvas enters pick mode (same as the inspector's picker) → after a click the inline form appears: caption "Show the picked element when…", a path input (placeholder "site.hours or menu.available"), an operator select (==, !=, >, <, >=, <=, contains, exists, empty), a "value" input (hidden for exists/empty), "Cancel" · "Add condition" (disabled until filled).
- **Effect:** a false condition marks the element hidden on the canvas.

## B9. "Create Collection" wizard (modal)

- **Where it lives:** Centred modal; from "+ New collection", "Create a collection", or the binding popover's "+ Create Collection".
- **Layout / contents:**
  - Title "Create Collection" (step 2: "Fields for Blog Posts"); × close.
  - Step bar: pill "1" + "Name & Type" — line — pill "2" + "Fields" (current = accent pill + bold label; done = green tick pill).
  - Caption "A collection turns rows of data into pages — one page per row."
  - **Step 1:** "Collection name *" input, placeholder "Blog Posts" (autofocus); "Content type" select: Articles / Products / Team Members / Custom (cosmetic — it changes nothing today); "Description (optional)" textarea, placeholder "Describe the purpose of this collection…". Footer "Cancel" · "Next: Add Fields" (disabled until a name).
  - **Step 2:** "NAME" input (still editable); "FIELDS" list of grey rows: a "⠿" handle (decorative, not draggable), "field_name" input, a type select Text / Number / Image / Date / Boolean, and a trash button ("Remove field"); starts with one row "title · Text"; accent link "＋ Add field". A tinted block with a switch "Generate a page per entry"; when on, four inputs with placeholders "Slug pattern — /blog/{slug}" (default value "/{slug}"), "Template page path — blog/_template/index.html", "SEO title — {title} — Blog", "SEO description — Read about {title}". Red error banner on failure (e.g. "Collections are unavailable in this editor session."). Green banner on success: "✓ Collection \"Blog Posts\" created successfully!" then the modal closes itself after ~1.2 s. Footer "Cancel" · "Create Collection".
- **Notes:** Closing by scrim click is refused once anything is typed (the modal pulses). Field slugs are the name lower-cased with spaces → underscores.

## B10. "Records" table modal

- **Where it lives:** Centred modal. Opened from the command palette entry "Manage CMS records" (category Tools). Not linked from the CMS drawer.
- **Layout / contents:**
  - Title "Menu items — 12 records" (or "Records"); × close.
  - Empty: "No collections yet. Create one from an element's CMS binding first."
  - A collection select (max 280px).
  - Warning banner (when the collection generates pages and nothing is published): "No records published yet — this collection generates a page per entry, but dynamic pages won't generate until at least one record is published."
  - Table: columns = the collection's first three fields + "Updated" + right-aligned "Actions". Cells: first column in ink (display value or "(untitled)"), others soft grey; booleans "Yes"/"No"; blanks "—"; image fields "✓ photo" or warning "— missing"; Updated "today" or "Sep 3". Row actions: small bordered buttons "Publish"/"Unpublish", a pencil (edit), a trash (delete — no confirmation). Under a row that failed to publish: red "Can't publish: Price is required, Image is required". Empty table: "No records yet."
  - Foot: "+ Add record" (right-aligned).
  - **Add/Edit form** (replaces the table): one control per field — checkbox + label (boolean), textarea (long/rich text), select with "—" plus options (select/multiselect with options), date input (date/datetime), number, text; required fields marked "*"; red box "Can't save: …" on validation failure; buttons "Add record" / "Save" · "Cancel".
- **Gating:** No search, sort, filter, pagination, bulk actions or CSV import/export here. "Import JSON" appears in the design but is not built.

## B11. Binding popover (inspector) and "Bound" chip

- **Where it lives:** A link-icon button in the inspector header of any selected element; the popover (240px) opens under it. A "🔗 Bound" outlined accent chip appears in the header when the element is bound (tooltip "Bound to Menu items › Name").
- **Layout / contents:** if bound, a status strip "🔗 Menu items › Name" with an unlink button ("Remove binding"). Then a menu: heading "Collections" → one item per collection with "4 fields" at the right; choosing one shows "← Menu items" (back), heading "Fields" → items with the field type at the right ("No fields defined" if none); choosing a field shows "← Name", heading "Record" → items labelled by the record's display value ("(untitled)") with its status ("draft"/"published") at the right; empty "No records yet. Add records via the command palette → "Manage CMS Records"." Bottom: full-width link "+ Create Collection" (opens B9). Empty overall: "No collections yet. / Create one first."
- **Flow:** collection → field → record → the element's text becomes that record's field value and the popover closes; the header gains "Bound".
- **Notes:** Only text content can be bound, and only to a specific record (no "current item in list" binding from the UI). Only PUBLISHED records resolve — a draft shows the fallback (empty). Binding is not an undo step (Undo is announced as unavailable for "binding a field to content").

## B12. Under-the-hood rules the user runs into

- **Field types:** the model has 15 (text, textarea, richtext, number, date, datetime, boolean, select, multiselect, image, file, reference, color, url, email); the Fields view offers 9; the wizard offers 5.
- **Validation messages (on publish):** "{Field} is required" · "{Field} must be a number" · "{Field} must be at least 3" / "at most 100" · "{Field} must be at least 3 characters" / "at most 200 characters" · "{Field} format is invalid" (or a custom message) · "{Field} must be a valid email" · "{Field} must be a valid URL" · "{Field} must be one of: a, b, c".
- **Record status:** draft / published (/ archived in the model). New records start as drafts.
- **Products preset:** e-commerce blocks can auto-create a "Products" collection ("E-commerce product catalog") with fields Name (required, 3–200 chars, placeholder "Product name"), Description (rich text), Price (required, ≥0, "Price in USD"), Image (required, "Main product image"), Category, SKU ("Stock Keeping Unit", "SKU-001"), Inventory, Featured ("Show on homepage"), optionally with three sample products (Premium Wireless Headphones, Organic Cotton T-Shirt, Minimalist Watch).
- **Repeaters / templates:** an element bound as a collection list is cloned per published record at export; text and attributes may use `{{item.field}}`, `{{index}}`, `{{isFirst}}`, `{{isLast}}`, `{{total}}`. Export can also emit Handlebars/Liquid/EJS templates instead of static values. Value transforms available to bindings: uppercase, lowercase, capitalize, trim, slug, number, round, floor, ceil, abs, currency, date, datetime, time, iso, boolean, url, email, tel, alt, className, length, json, keys, values.
- **Storage:** collections and records live in the browser (scoped per site) and are hydrated from the server on load.

---

# PART C — FORMS

## C1. Form block

- **Where it lives:** Build tab → "Forms" category → block "Form".
- **What it inserts:** a form with a "Name" text field, an "Email" field and a "Submit" button. (A richer "Contact form" block exists in Components.)

## C2. Form settings (inspector section)

- **Where it lives:** Right inspector, when a form element is selected.
- **Layout / contents:** hint when nothing suitable is selected: "Select a form element to configure submission settings."; header row with the mono "FORM ID"; "ACTION" select: "Store Submission" / "Send to Webhook" / "Send Email"; "WEBHOOK URL" input (placeholder "https://...", only for webhook); "SUCCESS MESSAGE" (default "Thank you for your submission!"); "ERROR MESSAGE" (default "Something went wrong. Please try again."); "SUCCESS REDIRECT" (placeholder "/thank-you (optional)"); "EMAIL FIELD NAME" (placeholder "email") with hint "Field name containing submitter email for confirmations".
- **Notes:** Field-level rules (required, min/max length, pattern, phone/number type) and the email options below exist in the engine but have no editor UI.

## C3. Forms inbox (Site Settings → Forms)

- **Where it lives:** Settings drawer, "Forms" screen.
- **Layout / contents:** section "Forms": states "Open this site from the dashboard to manage forms." (standalone), "Loading forms…", errors "Failed to load forms.", empty "No forms yet." with the description "A Form block renders on the published page, but its submissions are not captured yet — this inbox stays empty until that is wired."; a "Form" select listing "Contact (12)"; filter tabs "Inbox" · "Unread" · "Spam" · "Archived"; section "Submissions (12)" with a right-aligned "Export CSV" → "Exporting…" ("No submissions to export." when empty); list rows with an accent left border when unread: a summary of the data, a mono time, the source URL; click expands to a key/value list and actions "Mark spam" / "Not spam", "Archive" / "Unarchive", "Delete" → dialog "Delete this submission?" / "Delete submission"; "No submissions in inbox."; pagination when more than a page; errors "Failed to load submissions." / "Failed to update submission." / "Failed to delete submission." with "Retry".

## C4. Under-the-hood rules the visitor / user runs into

- **Actions:** store the submission, POST to a webhook, or send email (optionally also subscribe the submitter to a mailing list when an email-marketing integration is configured).
- **Field types the engine knows:** text, email, phone, number, textarea, select, checkbox, radio.
- **Validation messages:** "{field} is required" · "Invalid email format" · "Invalid phone format" · "Must be a valid number" · "Minimum length is 3 characters" · "Maximum length is 200 characters" · "Invalid format" · "Form not found" · generic "Submission failed".
- **Email defaults:** confirmation subject "Thank you for your submission"; owner notification subject "New submission: {form id}"; other templates "Welcome!" and "Message".
- **Not built:** spam protection (no honeypot/captcha/rate limit in the engine), submission persistence from the editor (in-memory only), field-rule editing in the UI, and the published-page capture path (the inbox description says so).

---

# Site Settings, Publish, Review, Export, E-commerce, Animation, Sync & Feature Flags

**What this module is.** This is everything in the editor that sits *around* the page-building work: the full-pane **Site Settings** area (identity, SEO, domains, redirects, analytics, forms inbox, custom code, security headers, integrations, webhooks, locales), the **Publish** drawer and its two-step publish wizard, the **Review** drawer where a client's feedback round lives, the **Export** modal (download the site as HTML / ZIP / React), a small **e-commerce** setup prompt, the per-element **Animation** editor, and the invisible plumbing the user only meets as banners, toasts and dialogs — autosave, cloud save conflicts, "we kept your unsaved work" recovery, retry queues, crash recovery. A feature-flag table closes the document.

Conventions used below: quoted text is the exact on-screen copy. "(Pro plan)", "(behind flag)", "(coming soon)", "(disabled)", "(demo only)" mark gated or unreachable things. "The site name" means whatever the project is called (default "Untitled site").

---

# PART 1 — SITE SETTINGS

Settings is a **full-width two-column pane** that replaces the canvas: a 256px sidebar on the left listing every section, and a content pane on the right holding whichever screen is open. It is reached from the editor's site menu / rail ("Settings"), from deep links that name a section (e.g. the site menu's "Plugins" opens Integrations), and from the Pages panel after a page's URL slug is changed (opens Redirects with a pre-filled repair draft). The last screen you were on is remembered per site, so reopening Settings lands where you left off.

### Settings shell (sidebar + pane frame)

- **Where it lives:** Full pane over the canvas. Sidebar left (256px), content pane right, footer bar along the bottom of the pane.
- **Purpose:** Navigate between settings screens; save or discard a screen's edits; leave back to the canvas.
- **Layout / contents:**
  - **Sidebar, top:** a small link "‹ Back to canvas" (chevron-left icon, 12px, muted), then the heading "Settings" (20px semibold), then the site name in small muted text.
  - **Sidebar, nav** (32px-high rows, icon + label; current row on the blue accent tint with blue text):
    - "Overview" (grid icon)
    - Group eyebrow "SITE SETUP" (11px uppercase muted): "General" (gear icon) · "Fonts & colours" (pencil icon) · "Localization" (languages icon)
    - "SEO & PUBLISHING": "SEO defaults" (search icon) · "Domains" (globe icon) · "Redirects" (left-right arrows icon) · "Export" (download icon)
    - "VISITORS": "Analytics" (bar-chart icon) · "Forms" (document icon)
    - "ADVANCED": "Custom code" (code icon) · "Headers" (sliders icon) · "Integrations" (puzzle icon)
    - "WORKSPACE": "Webhooks" (lightning icon) · "Members" (people icon, with a small ↗ arrow at the row's right) · "Billing" (credit-card icon, ↗)
    - Rows that are plan-locked show a small "Pro" pill (blue tint, blue text) at the row's right — on a Starter plan that is "Custom code" and "Integrations".
    - "Members" and "Billing" are external links: they open the dashboard's Team page / Billing page in a new browser tab. "Fonts & colours" and "Export" are *doors* — they leave Settings (see below). Everything else opens a screen in the pane.
  - **Pane header** (48px padding, bottom hairline except on Overview):
    - Title: "Settings" on Overview; otherwise "<Group> / <Screen>" in sentence case, e.g. "Site setup / General", "SEO & publishing / Domains". A screen with a sub-view appends it: "Advanced / Integrations / Browse all".
    - Subtitle: on Overview, "<site name> · everything on this page is scoped to this project."; otherwise the screen's own line (table below).
    - Right side: on Overview, a wide muted secondary button with a magnifier icon reading "Search settings" (opens the Search modal). On a locked screen, a primary "Upgrade" button. Otherwise the screen's own primary action when it has one ("Add domain", "Add redirect", "Add locale").
  - **Pane body:** the screen's cards on a subtle grey ground (white ground on Overview), scrolling.
  - **Footer** (56px, top hairline, white): a status sentence on the left and buttons on the right. Hidden entirely on a locked screen.

  | Screen | Header subtitle |
  |---|---|
  | General | "Manage your site identity, language and social profiles." |
  | Fonts & colours (door) | "Site fonts and colour tokens" |
  | Localization | "Locale claim and preview" |
  | SEO defaults | "Search & social preview" |
  | Domains | "Custom domain + DNS" |
  | Redirects | "301 / 302 + 404 suggester" |
  | Export (door) | "HTML, ZIP or React" |
  | Analytics | "GA4, Plausible, PostHog, Pixel" *(note: the Analytics screen actually offers GA4, Tag Manager, Meta Pixel and Clarity — this subtitle is stale)* |
  | Forms | "Submissions inbox + config" |
  | Custom code | "Head, body, CSS injections" |
  | Headers | "CSP, HSTS, security policy" |
  | Integrations | "Third-party OAuth" |
  | Webhooks | "Workspace event deliveries" |
  | Members (external) | "Seats and roles" |
  | Billing (external) | "Plan and invoices" |

- **Actions:**
  - Click any nav row → switches screen (if the current screen has unsaved edits, the Unsaved settings dialog appears first).
  - "‹ Back to canvas", footer "Cancel", footer "Done", and the **Escape** key (when focus is not in a text field and no dialog is open) all leave Settings — guarded by the Unsaved settings dialog when dirty.
  - Footer "Save changes" → saves the screen. On success the "Settings saved" dialog opens. On failure the footer turns red and the button relabels "Retry save"; the screen shows a red banner above its cards.
  - "Fonts & colours" row → closes Settings and opens the Brand / design panel.
  - "Export" row → closes Settings and opens the Export modal.
  - "Members" / "Billing" rows → new tab to the dashboard.
  - "Upgrade" (header, locked screens) → new tab to dashboard Billing.
- **States (footer status text):**
  - Overview: "Pick a section to edit its settings" + "Done" button.
  - Domains, Forms, Integrations (actions apply immediately): "Actions apply immediately · nothing to save here" + "Done".
  - Loading a screen: "Loading settings…" (muted); Save button disabled.
  - Screen failed to load: "Settings could not load" (red).
  - Last save failed: "Changes not saved" (red); button reads "Retry save".
  - Edits pending: "Unsaved changes" (amber).
  - Clean: "All changes saved" (muted).
  - Buttons for normal screens: "Cancel" (ghost) and "Save changes" (primary, disabled while loading or saving).
- **Keyboard shortcuts:** Escape = leave Settings (guarded).
- **Gating / notes:** Settings persistence for General / SEO / Custom code / Analytics / Redirects-toggle goes through the cloud save; Localization / Headers write their own columns; Domains / Forms / Integrations / Webhooks act immediately. In the standalone demo (no real site) several screens show a "demo" placeholder (noted per screen).

### Unsaved settings dialog

- **Where it lives:** Centered modal (640 wide) over Settings.
- **Purpose:** Guard every exit from a dirty screen.
- **Layout / contents:** Title "Unsaved settings". Body: "These settings have not been saved. Keep editing to finish them, or discard the pending edits and return to the canvas." Footer: "Keep editing" (secondary, takes focus) and "Discard and return to canvas" (red danger button).
- **Actions:** "Keep editing" / Escape / clicking the backdrop → close and stay. "Discard and return to canvas" → rolls the screen back to its last saved values and completes whatever you were doing (leaves Settings, or switches to the screen you clicked).
- **Copy used:** as above.

### Settings saved dialog

- **Where it lives:** Centered modal (640 wide).
- **Purpose:** Confirm a successful "Save changes" (a modal, deliberately, not a toast).
- **Layout / contents:** Title "Settings saved". Body: "<site name> · Configuration saved. Your canvas content is unchanged." Footer: one primary button "Return to settings" (takes focus).
- **Actions:** Button / Escape / backdrop → close.

### Shared building blocks every screen uses

- **Card:** white on a hairline border, 24px padding, 14px semibold title, optional muted description line, fields in a two-column grid (tables, code wells and button rows span both columns).
- **Field:** 13px label above a 32px-tall control; optional 11px muted hint beside the label.
- **Loading / load-error card** (replaces the cards while a screen fetches): an uppercase eyebrow (the card's name), a one-line description, then "Loading…" or the failure line, and on error a "Try again" button at the right.
- **Save error banner:** red-tinted strip with red text above the cards. Per-screen copy:
  - General: "Site settings were not saved. Your changes are still here. Review the values, then retry."
  - SEO: "SEO defaults were not saved. Your changes are still here. Review the values, then retry."
  - Custom code: "Custom code was not saved. Your changes are still here. Review the values, then retry."
  - Domains: "Domain changes were not saved. Your changes are still here. Review the values, then retry."
  - Analytics: "Analytics settings were not saved. Your changes are still here. Review the values, then retry."
  - Localization: "Localization settings were not saved. Your changes are still here. Review the values, then retry."
  - Redirects: "Redirect changes were not saved. Your changes are still here. Review the values, then retry."
  - Headers: "Header changes were not saved. Your changes are still here. Review the values, then retry."
  - Webhooks: "Couldn't save the webhook. Your endpoint is still here. Check the connection and retry."
  - Any other screen: "Changes to <Screen> were not saved. Your changes are still here. Review the values, then retry."
  - Analytics with a malformed ID: the banner repeats the field's own sentence (see Analytics).
- **"Restore" strip** (amber tint, yellow hairline, 12px amber text) shown under the header on Domains, Localization, Redirects and Headers: "Restoring a site version leaves this configuration unchanged."
- **Info box** (grey, 12px medium): used on SEO, Domains, Analytics for explanatory notes.
- **Empty placeholder** (dashed border, grey): "No … yet" style lines.
- **Toggle switch:** small blue pill toggle.

---

### Overview screen

- **Where it lives:** The landing screen of Settings (pane, white ground).
- **Purpose:** One glance at where every setting stands; jump into any section.
- **Layout / contents:**
  - While fetching: a loading card — eyebrow "OVERVIEW", line "Where every setting stands.", "Loading…". If the fetch fails (or there is no real site): the same card with "Couldn't load the overview. Check your connection, then try again." and a "Try again" button.
  - **"Needs attention" block** (only when something needs it): amber-tinted panel with a warning-triangle icon, uppercase "Needs attention" and a count pill; under it one white row per item — an amber dot, the item's title (13px medium), its detail line (12px muted), and an "Open ›" text link at the right (disabled if the item points at a section that isn't a screen).
  - **Three-column grid of group cards**, in this order: "SITE SETUP", "VISITORS", "SEO & PUBLISHING", "ADVANCED", "WORKSPACE" (eyebrow title, then one row per section). Each row: a 32px icon tile (the section's icon on a grey tile), the section title (13px medium; Members/Billing carry an inline ↗), a one-line summary (12px muted), an amber dot if that section needs attention, and a "›" chevron (or "↗" for external rows).
  - Summary line per row (live data):
    - General: "<site name> · <Language> (<locale>)" e.g. "Bella Cucina · English (en-US)"
    - Fonts & colours: "Site fonts and colour tokens"
    - Localization: "<n> locale(s)" plus " · <Names> not started" when some are untouched
    - SEO defaults: "Indexing allowed · robots.txt set" / "Indexing blocked · robots.txt default"
    - Domains: "No custom domain" / "<domain> · <n> DNS pending" / "<domain> · DNS verified"
    - Redirects: "<n> rule(s) · <n> suggestion(s)"
    - Export: "HTML, ZIP or React"
    - Analytics: "No provider" / "GA4 receiving data" / "GA4 not receiving yet" (provider names: GA4, GTM, Meta Pixel, Clarity, Plausible, PostHog)
    - Forms: "<n> form(s) · <n> submission(s)"
    - Custom code: "None set" / "Head, body and CSS set" (any combination)
    - Headers: "Defaults" / "CSP on" / "CSP and HSTS on"
    - Integrations: "<n> connected · <m> available"
    - Webhooks: "No endpoints" / "<n> endpoint(s) · no deliveries yet" / "… · last delivery ok" / "… · last delivery failed"
    - Members: "<used> of <seats> seats used"
    - Billing: "<Plan> · $<price> / month"
- **Actions:** Row click → opens that screen (same as the sidebar; external rows open the dashboard in a new tab). "Open ›" on an attention item → opens the named section. Header "Search settings" → Search modal. Footer "Done" → leave.
- **States:** loading card; error card with retry; no attention block when nothing needs it.

### Search settings modal

- **Where it lives:** Centered modal (640 wide), opened from the Overview header's "Search settings" button.
- **Purpose:** Find any section or field and jump straight to it.
- **Layout / contents:** Title "Search settings". Scope line "<site name> · all sections" (empty query) or "<site name> · N results for "query"" (or "1 result"). Label "Search" over a text field (autofocused) with a small ✕ clear button inside it once you've typed. Below: a bordered list (max 40% viewport height) of 32px rows — title (13px medium) over description (12px muted), and an uppercase group label at the right. Empty: "No settings match "query"." Footer: left "N sections" (no query) or "N results"; right "Clear search" (disabled until you type) and "Cancel".
- **Actions:** Type → filters live (case-insensitive over title, description, group). Click a row → closes the modal, opens that screen and scrolls to / focuses the field. ✕ or "Clear search" → clears and refocuses. "Cancel" / Escape / backdrop → close.
- **What is indexed** (title — description — group):
  - Sections: General — "Manage your site identity, language and social profiles." — Site setup · Fonts & colours — "Site fonts and colour tokens" — Site setup · Localization — "Locale claim and preview" — Site setup · SEO defaults — "Search & social preview" — SEO & publishing · Domains — "Custom domain + DNS" — SEO & publishing · Redirects — "301 / 302 redirects" — SEO & publishing · Export — "HTML, ZIP or React" — SEO & publishing · Analytics — "Google Analytics, Meta Pixel, Clarity, Tag Manager" — Visitors · Forms — "Submissions inbox + config" — Visitors · Custom code — "Head, body, CSS injections" — Advanced · Headers — "CSP, HSTS, security policy" — Advanced · Integrations — "Third-party services" — Advanced · Webhooks — "Workspace event deliveries" — Workspace · Members — "Members, roles & seats" — Workspace · Billing — "Invoices & payment method" — Workspace.
  - Fields (group = the section name): General: Site name, Favicon URL, Site Language, Author (all "Site identity"), Twitter, Facebook, LinkedIn ("Social links"), Grid size, Snap to grid ("Canvas"). Localization: Default locale, Auto-redirect by browser ("Default"), Locales ("Path, pages translated and status"). SEO defaults: Meta title, Meta description, Twitter Handle, Default OG Image URL ("Site SEO"), Allow search indexing, robots.txt ("Indexing"). Domains: Domain, Force HTTPS ("Custom domain"), DNS records ("Records to add at your registrar"). Redirects: Redirect rules ("From path, to URL and type"), Suggest redirects from 404s ("404 suggester"). Analytics: Enable Google Analytics, Google Analytics ID, Connection status, Last received data ("Google Analytics"), Enable Google Tag Manager, GTM Container ID ("Google Tag Manager"), Enable Meta Pixel, Pixel ID ("Meta Pixel"), Enable Microsoft Clarity, Clarity Project ID ("Microsoft Clarity"), Cookie Consent ("Consent"). Forms: Form ("Select a form to view its submissions inbox."). Custom code: Head scripts ("<head>"), Body scripts (end) ("</body>"), Global CSS ("styles"). Headers: CSP header value ("Content Security Policy"), Policy ("X-Frame-Options"), Policy ("Referrer-Policy"), Enable HSTS, Max age ("HSTS (HTTP Strict Transport Security)"), Header value ("Permissions-Policy"). Webhooks: Endpoint URL, Events, Signing secret ("Endpoint").

---

### General screen ("Site setup / General")

- **Where it lives:** Settings pane.
- **Purpose:** Site identity, language, social profiles, and canvas grid.
- **Layout / contents:**
  - Loading / error card: eyebrow "SITE IDENTITY", line "Site name, favicon, language and social profiles.", error "Couldn't load your site settings. Check your connection, then try again." + "Try again".
  - Card **"Site identity"**:
    - "Site name" — text input. Inline red error under it when invalid: empty → "Give the site a name — it is what the browser tab and search results show."; under 2 chars → "Needs at least 2 characters."; over 100 → "Keep it under 100 characters."
    - "Favicon URL" — text input, placeholder "https://example.com/favicon.ico".
    - "Site Language" — select listing every locale as "<Language> (<code>)": English (en), Spanish (es), French (fr), German (de), Italian (it), Portuguese (pt), Dutch (nl), Polish (pl), Swedish (sv), Danish (da), Norwegian (no), Finnish (fi), Russian (ru), Chinese (Simplified) (zh), Chinese (Traditional) (zh-TW), Japanese (ja), Korean (ko), Arabic (ar), Hebrew (he), Hindi (hi), Urdu (ur), Turkish (tr), Indonesian (id), Vietnamese (vi), Thai (th). A stored language not in the list is added at the top as its own option so it is never silently changed. Inline red error if the chosen language isn't enabled for the site: "<Language> is not enabled for this site yet — add it under Localization first, or the save will be refused."
    - "Author" — text input, placeholder "Who this site belongs to".
  - Card **"Social links"**: "Twitter" (URL input, placeholder "https://twitter.com/…"), "Facebook" ("https://facebook.com/…"), "LinkedIn" ("https://linkedin.com/company/…").
  - Card **"Canvas"**: "Grid size" — number input 1–100 with hint "Pixels between snap points, 1–100." (values are clamped into range); "Snap to grid" — label-left row with a small toggle.
- **Actions:** Every edit marks the screen dirty; nothing is written until footer "Save changes". Saving also renames the project (the site name shown in the sidebar/topbar updates) and applies grid size / snap to the canvas.
- **States:** loading card; error card; save error banner; field-level errors as above.
- **Gating / notes:** Social links end up in the published page's structured data (Organization "sameAs"); favicon and language reach the published site.

### Localization screen ("Site setup / Localization")

- **Where it lives:** Settings pane; "Add locale" primary button in the pane header (only once loaded).
- **Purpose:** Default language, browser auto-redirect, and which languages the site has with their translation progress.
- **Layout / contents:**
  - No real site: card "Localization" with dashed placeholder "Open this site from the dashboard to manage locales."
  - Loading / error card: eyebrow "LOCALIZATION", line "Default locale, enabled locales and translation progress.", error "Couldn't load your locales. Check your connection, then try again." + "Try again".
  - Restore strip: "Restoring a site version leaves this configuration unchanged."
  - Card **"Default"**: label-left rows — "Default locale" (select of the enabled locales, "<Language> (<code>)") and "Auto-redirect by browser" (toggle).
  - Card **"Locales"**: table with uppercase headers "Locale", "Path", "Pages translated", "Status", (actions). One 32px row per enabled locale: the language name as a ghost button (keyboard door), path in mono ("/" for the default, "/<code>" for others), "<translated> of <total>", a status pill — "Live" (green), "Pending" (amber), "Not started" (grey) — and, for non-default rows, a small "Remove" ghost button (disabled when only one locale remains). Hovering a row tints it; clicking anywhere on a row opens the Translation checklist dialog.
- **Actions:** Change default / toggle redirect / Remove → dirty; footer "Save changes" writes them (the default must be one of the enabled list or the server refuses and the banner shows). "Add locale" → Add locale dialog (creating writes immediately and reloads the table). Row click → Translation checklist.
- **States:** as above; save error banner.
- **Gating / notes:** URL scheme is sub-directory (`/fr/about`); the default locale serves at the root. Saving also sets the published document's language attribute. The "Auto-redirect by browser" setting is honoured on the published site: a visitor's first page per session is redirected to `/<their language>/…` when the site has that locale.

#### Add locale dialog
- **Where it lives:** Centered modal (640 wide).
- **Layout / contents:** Title "Add locale". Scope "<site name> · Localization". Label "Language" over a select of the not-yet-enabled locales, each "<Language> — <Native name> · <code>" (e.g. "Spanish — Español · es"). Label "Locale code" over a read-only field showing the code with "URL prefix /<code>" inside the field at the right. A boxed row: "Set as default locale" (13px medium) with hint "Visitors without a matching language land here." and a toggle at the right. Note: "Starts as a draft. Translate every required page before this locale can be published." Error line (red) above the buttons if the create is refused (server message, or "The locale was not created. Try again."). Footer: "Cancel", "Create locale" (disabled while pending or when nothing is left to add).
- **Actions:** "Create locale" → saves at once, closes, table reloads. Cancel / Escape / backdrop → close (blocked while pending).

#### Translation checklist dialog
- **Where it lives:** Centered modal (640 wide), from a Locales row.
- **Layout / contents:** Title "<Language> · Translation checklist". Meta line "<site name> · /<code> · Draft · <n> of <total> pages" ("Live" instead of "Draft" once live). Then one sentence: for right-to-left locales (Arabic, Hebrew, Persian, Urdu) it starts "Right-to-left locale. "; then "Begin with <First page>." / "Begin with Home, then Menu, Contact and Privacy." / "Every page is translated." Footer: one primary button "Back to localization" (takes focus).

### SEO defaults screen ("SEO & publishing / SEO defaults")

- **Where it lives:** Settings pane.
- **Purpose:** Site-wide title/description/social defaults; search indexing and robots.txt preview.
- **Layout / contents:**
  - Loading / error card: eyebrow "SEO DEFAULTS", line "Title, description and social preview defaults.", error "Couldn't load your SEO defaults. Check your connection, then try again." + "Try again".
  - Info box: "Site-wide SEO defaults are set here. Per-page titles, descriptions and social images are edited in Page settings — values set there override these defaults."
  - Card **"Site SEO"**: "Meta title" (text; over 60 chars → red "Keep it under 60 characters — search results cut it there."), "Meta description" (text; over 160 → "Keep it under 160 characters — search results cut it there."), "Twitter Handle" (placeholder "@yourbrand"), "Default OG Image URL" (URL input, placeholder "https://example.com/og-image.jpg"; not a full http(s) URL → red "Needs a full URL, starting with https://").
  - Card **"Indexing"**: label-left rows — "Allow search indexing" (toggle) and "robots.txt" (a read-only mono preview block). The preview shows the site's own robots.txt verbatim if one has been set on the dashboard; otherwise "User-agent: *" then "Allow: /" or "Disallow: /", plus "Sitemap: https://<domain>/sitemap.xml" when indexing is on and the site's domain (verified custom domain, else last published URL) is known.
- **Actions:** Edits → dirty → footer "Save changes".
- **States:** loading, error, save banner, field errors as above.

### Domains screen ("SEO & publishing / Domains")

- **Where it lives:** Settings pane; "Add domain" primary in the pane header once at least one domain exists.
- **Purpose:** Connect custom domains and check their DNS. Everything applies immediately; the footer reads "Actions apply immediately · nothing to save here" + "Done".
- **Layout / contents:**
  - No real site: card "Custom domain" with description "Open a real site to connect a domain." and the line "The demo project can't have a custom domain."
  - Loading / error card: eyebrow "CUSTOM DOMAIN", line "Point your own domain at this site. DNS changes happen at your domain registrar.", error "Couldn't load your domains. Check your connection, then try again." + "Try again".
  - Red banner on a refused action (the Domains save-error sentence).
  - Info box: "Domain actions apply as soon as you confirm them. There is nothing to save on this screen."
  - Restore strip: "Restoring a site version leaves this configuration unchanged."
  - **Empty state card** (no domains): eyebrow "CUSTOM DOMAIN", the line above, then "No custom domain. Using the free buildrick.app address until you connect one." — or, right after a removal, "<domain> removed. This site is still available at its buildrick.app address." — and an "Add domain" button.
  - **Per domain** (primary first), two cards:
    - Card **"Custom domain"**: label-left rows — "Domain" (read-only text field), "Status" (pill: "VERIFIED" green / "PENDING" amber / "FAILED" red / other grey), "Force HTTPS" (toggle, writes at once), and a red "Remove <domain>…" button.
    - Card **"DNS records"**: table "Type" / "Name" / "Value" (mono, truncated with tooltip) / "Status" ("VERIFIED" or "PENDING" pill per record); empty row "No DNS records for this domain."; a secondary "Check DNS" button (reads "Checking…" while running).
- **Actions:** "Add domain" → Add a domain dialog. "Force HTTPS" toggle → immediate write. "Check DNS" → real DNS check, then the list refreshes. "Remove <domain>…" → Remove domain dialog. Any refused action → red banner; rows stay as the server has them.
- **States:** admin-only controls (Add domain, Force HTTPS, Remove) are **disabled with the tooltip "Only an admin can change the domain"** for non-admins — never hidden.

#### Add a domain dialog
- **Where it lives:** Centered modal (640 wide).
- **Layout / contents:** Title "Add a domain". Scope "<site name> · Domains". "Domain name" — text input (autofocus, placeholder "yourdomain.com") with a status tag inside the field at the right: "Checking…" (muted) / "Couldn't check" (red) / "Available" (green) / "Already connected" (red) / "Not a valid domain" (red). Availability is checked 300 ms after you stop typing. "Domain type" — segmented buttons "Primary" · "Redirect" · "Subdomain" (Primary selected by default). "DNS provider" — select: Namecheap (default), Cloudflare, GoDaddy, Other; note under it "Cloudflare, GoDaddy and Other are also supported." "Nameservers" — label with "Read-only · set at your registrar" at the right, and a mono block listing the provider's nameservers (Namecheap: dns1.registrar-servers.com / dns2.registrar-servers.com; Cloudflare: <first>.ns.cloudflare.com / <second>.ns.cloudflare.com; GoDaddy: ns01.domaincontrol.com / ns02.domaincontrol.com; Other: "Set at your registrar."). "DNS records" — label with "Add these at <Provider>" (or "…at your registrar") and a mono table Type/Name/Value: A · @ · 76.76.21.21; CNAME · www · cname.vercel-dns.com; TXT · _buildrick · brk-verify-… A boxed row "Force HTTPS" / "Redirect every http:// request to https://." with a toggle (on by default). Note: "DNS can take up to 48 hours to propagate. SSL is issued automatically." Red error line if the connect is refused (server reason, or "Couldn't add the domain."). Footer: "Cancel", "Add domain" (enabled only when the name is valid and available).
- **Flow:** type name → tag says Available → pick type/provider → "Add domain" → dialog closes → domain cards appear with real DNS records.

#### Remove domain dialog
- **Layout / contents:** Title "Remove <domain>?". Body: "<domain> stops pointing at this site. Visitors following that address get nothing until you reconnect it or change your DNS; the site keeps serving on its buildrick.app address." Footer (right-aligned): "Cancel" (secondary, takes focus) and "Remove domain" (red). Both disabled while removing.

### Redirects screen ("SEO & publishing / Redirects")

- **Where it lives:** Settings pane; "Add redirect" primary in the pane header once at least one rule exists.
- **Purpose:** Manage 301/302 rules; accept suggested redirects for renamed pages.
- **Layout / contents:**
  - No real site: card "Redirects" / "Open a real site to manage its redirects." / "The demo project has no redirects."
  - Loading / error card: eyebrow "REDIRECTS", line "Old URLs sent to new ones, and the 404 suggester.", error "Couldn't load your redirects. Check your connection, then try again." + "Try again".
  - Red banner on a refused Accept or a failed save.
  - Restore strip: "Restoring a site version leaves this configuration unchanged."
  - **URL repair draft** (only when arriving from the Pages panel after a slug change; drawn directly on the pane, not in a card): heading "Redirect for <Page name>", line "<site name> · URL change /old → /new", two mono fields side by side "From path" and "To path" (prefilled, editable), the line "301 · Permanent redirect", buttons "Save redirect" (reads "Saving…"; disabled until both paths valid) and "Cancel", an error line if refused, and the muted note "Unsaved redirect · Save this rule for <site name>." After saving it becomes: heading "Redirect saved", line "/old → /new · 301", and a button "Back to <Page name> SEO" which returns to that page's SEO settings.
  - Card **"Redirects"**: empty → "No redirects yet. Add one to send an old URL to a new one." + "Add redirect" button. Otherwise a table with headers "From path" / "To URL" / "Type" / (actions): 40px rows — from path (medium, truncated), to URL (muted, truncated), "301"/"302", and a secondary "Edit" button.
  - Card **"404 suggester"**: label-left row "Suggest redirects from 404s" with a toggle (this toggle is the one thing the footer's Save writes). Below, when on: one row per suggestion — "/old-slug → /new-slug" with a muted " renamed 12 Sep" — and an "Accept" text link ("Accepting…" while running). None: "No suggestions — every renamed page already has a redirect." When the toggle is off, the rows hide.
- **Actions:** "Add redirect" / "Edit" → the redirect dialog (create/update/delete apply at once and the list refreshes). "Accept" → creates a 301 at once; refused → red banner. Toggle → dirty → footer Save.

#### Add / Edit redirect dialog
- **Where it lives:** Centered modal (640 wide).
- **Layout / contents:** Title "Add redirect" or "Edit redirect". Scope "<site name> · Redirects". "From path" (mono text, autofocus, placeholder "/old-url"; error "From path must start with / (e.g. /old-page)"). "To URL" (mono, placeholder "/new-url"; error "To URL must start with / or http(s):// (e.g. /new-page)" — protocol-relative "//host", javascript:, bare domains are refused). "Redirect type" segmented: "301 Permanent" · "302 Temporary". Boxed row "Match query strings" / "Forward ?utm_source and other parameters to the destination." with a toggle. "Notes" (text, placeholder "Optional — why this redirect exists."). Note: "Paths must start with /. A 301 is cached by browsers — use it for permanent moves; a 302 stays uncached while you test." Red error line on refusal (e.g. "A redirect from <path> already exists.", or "Couldn't save the redirect." / "Couldn't delete the redirect."). Footer: in edit mode a red-text ghost "Delete redirect" at the far left ("Deleting…" while running — deletes immediately, no second confirm); then "Cancel" and "Add redirect" / "Save redirect" (enabled only when both paths are valid).

### Analytics screen ("Visitors / Analytics")

- **Where it lives:** Settings pane.
- **Purpose:** Tracking IDs for four providers and a consent preference.
- **Layout / contents** (label-left rows, 192px label column):
  - Loading / error card: eyebrow "ANALYTICS", line "GA4, GTM, Meta Pixel and Clarity keys.", error "Couldn't load your analytics settings. Check your connection, then try again." + "Try again".
  - Card **"Google Analytics"**: "Enable Google Analytics" (toggle); "Google Analytics ID" (text, uppercased as typed, placeholder "G-XXXXXXXXXX"; red error "This doesn't look right. Your Google Analytics ID should start with G- followed by 10 characters, like G-ABCD123456."); "Connection status" — a pill "RECEIVING DATA" (green) / "NO DATA YET" (grey) / "NOT VERIFIED" (grey), optionally "Measurement ID verified on 2 Jul 2025" in muted text, and a secondary "Verify" button at the far right; "Last received data" — "2 Jul 2025, 19:38 · 1,284 events in the last 24 hours" or "No events yet".
  - Card **"Google Tag Manager"**: "Enable Google Tag Manager" (toggle); "GTM Container ID" (uppercased, placeholder "GTM-XXXXXXX"; error "This doesn't look right. Your GTM Container ID should start with GTM- followed by 6 to 8 characters, like GTM-ABC1234.").
  - Card **"Meta Pixel"**: "Enable Meta Pixel"; "Pixel ID" (digits only, placeholder "1234567890123456"; error "This doesn't look right. Your Pixel ID should be 15 or 16 digits, like 1234567890123456.").
  - Card **"Microsoft Clarity"**: "Enable Microsoft Clarity"; "Clarity Project ID" (placeholder "abcdefghij"; error "This doesn't look right. Your Clarity Project ID should be 10 letters or digits, like abcdefghij.").
  - Card **"Consent"**: "Cookie Consent" (toggle, on by default) and an info box: "Records the preference only. Buildrick does not render a consent banner yet, and the analytics above load as soon as the page does — they do not wait for consent. If you need GDPR consent today, add your own banner in Settings → Custom code."
- **Actions:** Edits → dirty → footer Save. **Save is refused while any ID is malformed** — the footer banner shows that field's sentence. Changing the GA ID clears its verification. "Verify" → if the ID is empty/malformed just focuses the field; otherwise re-reads the tracker status, stamps "verified today", marks dirty, and opens the Connection verified dialog. A toggle beside an empty ID is saved as off.
- **Gating / notes:** Enabled providers are injected into every exported/published page (GA4 with IP anonymisation and Google signals off; Pixel with noscript fallback; Clarity; GTM head snippet). The consent toggle does nothing on the published page.

#### Connection verified dialog
- Title "Connection verified". Line: "<ID> is receiving data. 1,284 events arrived in the last 24 hours." or "<ID> is verified. No events have arrived yet." Note: "Last checked just now · Data usually appears within 30 minutes of the first visit." One button "Back to analytics".

### Forms screen ("Visitors / Forms") — submissions inbox

- **Where it lives:** Settings pane. Footer: "Actions apply immediately · nothing to save here" + "Done".
- **Purpose:** Read, triage, export and delete form submissions per form.
- **Layout / contents:**
  - No real site: card "Forms" with dashed placeholder "Open this site from the dashboard to manage forms."
  - Loading: card "Forms" / "Loading forms…". Error: red box with the error message.
  - No forms: card "Forms" with description "A Form block renders on the published page, but its submissions are not captured yet — this inbox stays empty until that is wired." and placeholder "No forms yet." **(not yet functional — see note)**
  - Card **"Form"** (description "Select a form to view its submissions inbox."): "Form" select listing "<form name> (<count>)"; a row of pill filter tabs "Inbox" · "Unread" · "Spam" · "Archived" (selected = blue).
  - Card **"Submissions (<total>)"**: top-right ghost "Export CSV" ("Exporting…"; disabled while loading or when there are none). Body: "Loading…" / a red error box with the message and a "Retry" link / "No submissions in <filter>." / a list of rows. Each row: grey card with a 3px left edge (blue = unread, grey = read); the summary line (email / name / subject / message, first 80 chars, bold if unread) and a mono relative time ("just now", "5m", "3h", "2d", or a date); the source URL in mono under it. Click a row → expands (and marks it read) to show a key/value list of every field and an action row: "Mark spam" / "Not spam", "Archive" / "Unarchive", "Delete". Pagination (20 per page): "← Prev" · "Page 1 of 3" · "Next →".
  - **Delete confirm** (modal): title "Delete this submission?", message ""<summary>" is a visitor's own message to you. Deleting removes it from the server for good — no copy is kept anywhere and it can't be recovered. Export CSV first if you might need it.", buttons "Cancel" / "Delete submission" (destructive).
- **Actions:** filter/form change → reloads page 1. Export CSV → downloads "<form-name>-submissions.csv" (whole dataset). Errors: "Failed to load forms.", "Failed to load submissions.", "Failed to update submission.", "Failed to delete submission.", "Failed to export submissions.", "No submissions to export."
- **Gating / notes:** **Form capture is unbuilt** — published forms post nowhere, so this inbox is empty for every site today. The screen says so.

### Custom code screen ("Advanced / Custom code") (Pro plan)

- **Where it lives:** Settings pane. On a Starter plan the Locked screen shows instead.
- **Purpose:** Head scripts, end-of-body scripts and global CSS for every published page.
- **Layout / contents:**
  - Loading / error card: eyebrow "CUSTOM CODE", line "Head, body and CSS injections for this site.", error "Couldn't load your custom code. Check your connection, then try again." + "Try again".
  - Three cards, each a mono side label beside a resizable mono code textarea (min 120px):
    - **"Head scripts"** — side label `<head>`, placeholder `<script src="https://…/analytics.js"></script>` / `<link rel="preconnect" href="https://…">`.
    - **"Body scripts (end)"** — side label `</body>`, placeholder `<script src="https://…/widget.js"></script>`.
    - **"Global CSS"** — side label `styles`, placeholder `/* Custom CSS */` / `.my-class { color: red; }`.
  - Under the two HTML fields, after a 500 ms pause in typing: red "✗ <error>" lines, amber "⚠ <warning>" lines, or green "✓ HTML looks good". Under the CSS field: red "✗ <error>" lines or green "✓ CSS brace balance looks good".
- **Actions:** Edits → dirty → footer Save.
- **Gating / notes:** Inline `<script>…</script>` blocks are stripped from the published page (only `<script src>`, `<meta>`, `<link>`, `<style>`, `<noscript>`, `<base>`, `<title>` survive); the validator warns about this as you type.

### Headers screen ("Advanced / Headers")

- **Where it lives:** Settings pane.
- **Purpose:** Security response headers the published site sends.
- **Layout / contents:**
  - No real site: card "Headers" with placeholder "Open this site from the dashboard to manage headers."
  - Loading / error card: eyebrow "HEADERS", line "CSP, X-Frame-Options, Referrer-Policy and HSTS.", error "Couldn't load your headers. Check your connection, then try again." + "Try again".
  - Restore strip.
  - Card **"Content Security Policy"**: "CSP header value" — 3-row mono textarea, placeholder "default-src 'self'".
  - Card **"X-Frame-Options"**: "Policy" — select: DENY, SAMEORIGIN, "Not set".
  - Card **"Referrer-Policy"**: "Policy" — select: no-referrer, no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url, "Not set".
  - Card **"HSTS (HTTP Strict Transport Security)"**: "Enable HSTS" (toggle); "Max age" — select (disabled until enabled): "1 month", "6 months", "1 year", "2 years (recommended)" (default); a stored value not in the list is shown as its own "<n> seconds" option.
  - Card **"Permissions-Policy"** (description "Which browser features (camera, microphone, geolocation) the published site may use."): "Header value" — text, placeholder "camera=(), microphone=()".
- **Actions:** Edits → dirty → footer Save (writes the site columns directly).

### Integrations screen ("Advanced / Integrations") (Pro plan)

- **Where it lives:** Settings pane. Footer: "Actions apply immediately · nothing to save here" + "Done". On a Starter plan the Locked screen shows instead. The site menu's "Plugins" entry deep-links here.
- **Purpose:** A catalogue of third-party services; today each row only links out.
- **Layout / contents:** Intro line (12px muted): "Third-party services you can wire up yourself for now — each row opens the provider's own setup. Connecting them from here is coming." Then one card per category ("forms", "payments", "email", "automation") holding integration rows: name, a one-line scope, a grey "COMING SOON" status badge, and a light "Learn More" button.

  | Category | Name | Scope line | Learn More opens |
  |---|---|---|---|
  | forms | Formspree | "Simple form backend. Receive form submissions by email." | formspree.io |
  | forms | Netlify Forms | "Collect form submissions directly in your Netlify dashboard." | Netlify docs |
  | payments | Stripe | "Accept payments online with the world's leading payment platform." | Stripe docs |
  | email | Mailchimp | "Email marketing platform to grow your audience." | Mailchimp developer site |
  | email | ConvertKit | "Email marketing for creators and small businesses." | ConvertKit developers |
  | automation | Zapier | "Connect your site to 5000+ apps without code." | Zapier apps |

- **Gating / notes:** Nothing connects. (coming soon) The row component also knows "CONNECTED" (green), "AVAILABLE" (grey) and "ERROR" (red) badges for a future connect flow.

### Webhooks screen ("Workspace / Webhooks")

- **Where it lives:** Settings pane.
- **Purpose:** One workspace-wide endpoint that receives signed JSON events.
- **Layout / contents:**
  - Non-admin: card "Webhooks" / "Send workspace events to your own endpoint." with the line "Only an admin can manage webhooks — the signing secret is part of the configuration. Ask a workspace admin to set this up."
  - Card **"Endpoint"** (description "One endpoint per workspace. Buildrick POSTs JSON, signed with HMAC-SHA256 in the x-buildrick-signature header."):
    - "Loading…" / error line "Couldn't load the webhook. Is the dashboard running?" (also "Couldn't regenerate the secret." / "Couldn't disconnect the webhook.").
    - **Empty:** "No endpoint connected." + light button "Connect endpoint".
    - **Edit form:** "Endpoint URL" (hint "HTTPS endpoint that receives POST deliveries", placeholder "https://api.yourapp.com/hooks/buildrick", autofocus); "Events" — two checkboxes: "site.publish — fires after every successful publish" and "form.submit — ready, but nothing sends it yet (form capture is unbuilt)" (both checked by default); error line; buttons "Connect" (or "Save changes" when editing an existing one; "Saving…"; disabled without a URL or with no events) and "Cancel".
    - **Connected view:** the URL (mono bold), "Events: site.publish, form.submit", a delivery line — "Never fired yet — publish the site or submit a form to see the first delivery." / "✓ Delivering — last delivery 3h ago." / red "⚠ 2 failed deliveries in the last 24h · last attempt 14m ago" — and, when there are failures, a mono log of "<ago> <error>" rows. "Signing secret" (hint "Verify deliveries by recomputing the HMAC with this secret"): a masked code "whsec_••••abcd" with "Reveal"/"Hide" and "Copy" ghost buttons. Action row: "Edit", "Regenerate secret", "Disconnect".
    - **Inline confirms** (red-bordered box replacing the action row): "Regenerate the secret? Every existing endpoint stops verifying until you update it with the new secret." → "Regenerate" / "Cancel"; "Disconnect the endpoint? This is a workspace connection — every site stops sending events immediately." → "Disconnect" / "Cancel". After regenerating, the new secret is shown unmasked once.
- **Actions:** as listed; while editing with a URL typed, the footer counts the screen as dirty (so leaving asks).

### Members / Billing (external rows)

- Sidebar rows and Overview rows open the dashboard in a new tab: Members → dashboard team page, Billing → dashboard billing page. Billing is also where every "Upgrade" goes.

### Locked screen (plan gate)

- **Where it lives:** Replaces Custom code or Integrations on a Starter plan; the pane header carries an "Upgrade" button; there is no footer.
- **Layout / contents:** A centered card (max 672 wide): a pill "PRO" (blue tint), title "<Feature> is a Pro feature" ("Custom code is a Pro feature" / "Integrations is a Pro feature"; an Enterprise variant reads "… is an Enterprise feature"), a body line, and a primary "Upgrade to Pro" button.
  - Custom code body: "Custom code injects your own <head> markup, end-of-<body> scripts and CSS into every published page — analytics, fonts, chat widgets. It ships on every publish."
  - Integrations body: "Integrations connect your published site to the services you already run — forms, payments, email and automation — without pasting code by hand."
- **Actions:** "Upgrade to Pro" / header "Upgrade" → dashboard Billing in a new tab.
- **Gating / notes:** Plan comes from the workspace (FREE → Starter, PRO → Pro, BUSINESS → Enterprise). No screen currently requires Enterprise.

---

# PART 2 — PUBLISH

### Publish panel (left drawer)

- **Where it lives:** A 280px drawer panel with the standard panel header "Publish" (pin/expand, help, close), a scrolling body, a pinned footer with the CTA, and a legal line.
- **Purpose:** Show where the site goes, what changed since it last went out, what is live, and start (or undo) a publish.
- **Layout / contents (normal state):** Sections drawn flat (uppercase 11px section titles, one-line rows):
  - **ENVIRONMENT**: "Production" — the live domain as a blue link "bellacucina.com ›" (opens the site) or "Not published yet"; "Preview" — "None" (preview deployments aren't read yet). While loading: skeleton bars.
  - **SINCE LAST DEPLOY** (hidden during a run, right after a publish, or on failure): "<n> change(s)" on the left, "<n> page(s)" on the right (live pages only); up to six change rows — the undo-history label (e.g. "Menu — price updates") with "<author> · 2m" or just "2m"/"41m"/"3h"/"2 Jul"; when no changes: "Nothing has changed since the last deploy." (site has deployed before) or "Publishing will put the whole site live for the first time." (never deployed).
  - **LAST DEPLOY**: "v3 · live" / "v3 · not live" with "2 Jul, 14:22" at the right; when live, a red text button "Unpublish site…" ("Unpublishing…" while running); never deployed: "This site has never been published."
  - **Footer** (bordered white band): the primary CTA "Publish to production" (small chip-sized button; grey disabled chip while publishing, right after a publish with nothing pending, or when history failed to load). Under it, when the checks block: the blocking details in red 11px, e.g. "Sites deploy to your own Vercel account. Connect it to publish." During a run: "Publishing in progress — please wait." or "Update in progress — please wait." (if already live).
  - **Legal line** (centered, 12px): "By publishing, your site is deployed to your connected Vercel account. Privacy policy · Terms of service" (both underlined links to the dashboard's /privacy and /terms).
- **Other states:**
  - **Publishing not wired (flag off)**: body shows only the heading "Connect Vercel to publish." and "Buildrick deploys into your own Vercel account — we host nothing."; the footer button is "Connect Vercel" (opens the dashboard's Integrations page in a new tab). (behind flag)
  - **Deploy service unreachable** (history read failed): red "Couldn't reach the deploy service.", muted "Nothing was published. Your work is saved.", and a "Try again" link.
  - **Publishing** (full-width block above the sections): "Publishing to production…" (13px semibold), a meta line "<Step name> · step 2 of 4 · started 14s ago" (falls back to "<n>%" or "Starting"), and a thin blue progress bar. ENVIRONMENT stays; the two "what would go out" sections drop away.
  - **Just published** (a job ran this session and nothing is pending): green heading "Published to production.", meta "v4 · live · just now", links "View live site" and "Compare v3 → v4" (opens the History panel). CTA disabled.
  - **Failed**: red heading "Publish failed.", the error message plus " Nothing was deployed." (added unless the message already says so), links "Try again" (reopens the wizard) and — when the job carries a step log — "View log" / "Hide log", which expands a list of steps each with ✕ (red) / ✓ (green) / · and the words "failed" / "done" / "in progress" / "not run".
- **Actions:** CTA → opens the Publish wizard (never publishes directly). "Unpublish site…" → Unpublish confirm. Production link → new tab. The site menu's "Unpublish" entry opens this panel and raises the same confirm.
- **Gating / notes:** The publish path exists only when the publish feature flag is on. Publishing deploys to the workspace's own Vercel account; Buildrick hosts nothing.

### Unpublish confirm

- **Where it lives:** Confirm dialog from the Publish panel (or via the site menu).
- **Layout / contents:** Title "Unpublish site?". Message: "**<site name>** will be taken offline and its public URL will stop working until you publish again." Buttons "Cancel" / "Unpublish" (destructive).
- **Flow:** confirm → toast "Site unpublished" / "Its public URL stops working until you publish again." (info). Failure → toast "Couldn't unpublish" / "<error>" or "The site is still live. Try again." (error).
- **Gating:** Admin only (server-enforced).

### Publish wizard (two-step modal)

- **Where it lives:** Centered modal, 520 wide, opened by the panel's "Publish to production".
- **Purpose:** Gate the publish on readiness checks, then state the consequence before the irreversible button.
- **Layout / contents:**
  - **Stepper band** (56px grey band at the top): two pills "1. Review" and "2. Confirm" (active = blue with white text; inactive = blue tint with muted text). Always reopens on step 1.
  - **Step 1 — "Pre-Publish Checklist"** (16px semibold heading):
    - Loading: spinner + "Checking readiness…".
    - Error: "Couldn't load the readiness checks." + "Retry".
    - No site: "Open this site from the dashboard to see readiness checks."
    - Check rows (one per check): a 20px disc — green "✓" for pass, amber "!" for warning, amber "✕" for blocking — the label (14px), and for non-pass rows the detail sentence (13px amber) plus a fix affordance: "Fix ›" (switches to the Pages or Settings tab and closes the wizard) or, on the Vercel row, a "Connect" link (dashboard Integrations, new tab).
    - Summary band (amber tint): "✕ Blocked — connect Vercel to publish." / "⚠ 1 blocking — Pages ready. Fix to publish." / "⚠ 2 warnings — none block. Client approval is a separate gate." / "All checks pass."
    - Footer: "Cancel" and "Continue to Confirm →" (disabled while anything blocks) — or, when the Vercel connection is the blocker, "Connect Vercel" replaces the primary.
  - **Step 2 — "Confirm publish"**: four fact rows (key muted 12px, value 13px medium right-aligned):
    - "Target" — "Production · bellacucina.com" (current live host) / "your connected Vercel project" / "No Vercel connection"
    - "Pages" — "Preparing…" then "<n> page(s)"
    - "Client approval" — "Checking review status…" / "Not sent for review." / "Approved by <name> on 2 Jul." / "Approved by <name>." / "<name> asked for changes — 3 unresolved comments." / "<name> asked for changes on round 2." / "Round 2 open — 1 unresolved comment." / "Round 2 is still open."
    - "Rollback" — "v3 stays restorable in publish history" / "The current version stays restorable" / "The last 20 versions stay restorable"
    - Amber band: "⚠ This replaces the live site immediately for all visitors."
    - Footer (60px): "← Back" (muted) and "Publish now" (primary, 40px tall).
- **Pre-publish checks** (server-defined; only "fail" blocks):

  | Check label | Pass detail | Warning / Fail detail | Fix link |
  |---|---|---|---|
  | Vercel connected | "This workspace is connected to Vercel." | FAIL: "Sites deploy to your own Vercel account. Connect it to publish." | "Connect" → dashboard Integrations |
  | Pages ready | "<n> page(s) ready to publish." | FAIL: "No pages found. Add at least one page before publishing." | "Fix ›" → Pages tab |
  | SEO configured | "Meta title template is configured." | WARN: "No meta title template set. Search engines may not index your site properly." | "Fix ›" → Settings |
  | Domain connected | "Connected to <domain>." | WARN: "No custom domain. Your site will be live on its Vercel URL." | "Fix ›" → Settings |
  | Empty pages | "All pages have content." | WARN: "<n> page(s) have no content blocks." | "Fix ›" → Pages tab |
  | Favicon | "Favicon is configured." | WARN: "No favicon set. Browsers will show a default icon." | "Fix ›" → Settings |

- **Flow:** "Publish to production" → wizard step 1 → checks load → "Continue to Confirm →" → step 2 facts load → "Publish now" → wizard closes → panel shows the progress block → success/failure toast (owned by the canonical publish handler in the shell) and the panel's just-published / failed state. The checks are re-read after every publish settles.
- **Gating / notes:** A third "Options" step (environment, per-publish note, scheduler) is drawn in design but deliberately not built — no backend for it. The same four fact rows also appear in the topbar's publish confirm (documented with the shell).

### Publish history, rollback and diff (services only here)

The editor can list the published versions (version number, completed time, whether rollbackable, "rolled back from"), roll back to a prior version (creates a new publish job whose id the panel then polls), compute a page-by-page diff between two versions (added / removed / changed / same, with byte sizes), and cancel an in-flight publish. The rows and rollback buttons live in the **History panel's "Published" view** (site menu → "Publish history"), documented with the History module. The Publish panel itself ends after LAST DEPLOY by design. Only the 20 most recent completed publishes keep a restorable payload.

---

# PART 3 — REVIEW (client approval loop)

### Review panel (left drawer)

- **Where it lives:** 280px drawer with header "Review" (pin, help, close).
- **Purpose:** Send the site to a client for sign-off, read their comments, reply, resolve, re-send, revoke, and compare against the approved version.
- **Frame shared by every state** (top to bottom): the header; a 44px progress block with a fixed 140px green progress track and a mono count "<resolved> of <total>" (only when there is at least one comment); a 28px meta line "Sent 2d ago · Sara" (or "Sent just now") and any notice; the thread; a fixed foot.
- **States:**
  - **Loading:** a skeleton of five bars shaped like a grouped thread list (indented rows).
  - **Load error:** red "Couldn't load this review round." and muted "Your work is safe — only the review list failed to load."; foot has "Compare with approved" and a full-width "Try again".
  - **Never sent:** empty state with a check-circle icon, title "No review yet", body "Send this site to a client and they get a link to comment on it.", and the **Send for review** control (see below). Viewers see it disabled with the tooltip "Viewers can't send for review — ask an editor".
  - **Open round, nothing back yet:** "<Reviewer> has not commented yet." (or "Your reviewer has not commented yet.") and "You will be notified."
  - **Changes requested:** "<Reviewer> asked for changes." with "They left no notes — the round is closed and it is your move." or "<open> of <total> still open."
  - **All resolved:** green "Everything is resolved." and "<n> of <n> — ready to send round 3."
  - **Revoked:** red "This review link was revoked." / "This review request was withdrawn." with "<Reviewer> can no longer open it. Earlier comments are kept below." / "Nobody is waiting on it now. Earlier comments are kept below."
- **Thread body:**
  - **Detached** group (amber band with a warning icon, "Detached", count): comments whose element was deleted; each row carries the note "element deleted" and buttons "Reattach" (starts pick-an-element on the canvas) and "Resolve".
  - **Open** groups: one grey band per page — the first reads "Open · <Page name>", the rest just the page name — with a mono count; comment rows underneath (author "Client"/their name or "You", body, meta "<Page> · 2d", action "Resolve").
  - **Resolved** band (collapsible, "Resolved" + count + chevron): rows with meta "resolved by <name> · 3h" and action "Reopen".
- **Below the thread:**
  - A grey strip button "Round 2 of 3 ▸" (▾ when open; the arrow only appears when there is more than one round). Opening it lists previous rounds: "Round 1 · approved 3d ago", "… · changes requested …", "… · revoked …", "… · sent …" (plus " · link revoked" when an approved/changes-requested round's link was revoked); "This is the first round." when there is only one; "Loading…"; or "Couldn't load the history. Try again". Under the list: "Older rounds are read-only."
  - **Reply composer:** textarea placeholder "Reply to the client…" (max 2000 chars), error "Couldn't send that reply. Try again.", the note "Replies are internal notes on the thread." and a "Send" button (disabled when empty).
  - **Compare block:** full-width secondary "Compare with approved" (disabled with tooltip "Compare isn't available here" when the shell doesn't provide it).
  - **Primary button** (full width): "Re-send for review" / "Sending round 3…" / after a revoke: "Send a new link" (client round) or "Send for review again" (internal round). Disabled with tooltip "Re-send isn't available here" when not wired.
  - For a round with no client link: an extra **Send for review** control labelled "Invite a client…".
  - A ghost "Revoke link" / "Withdraw request" (hidden once revoked).
- **Inline confirms** (amber panels, not modals):
  - **Re-send with open comments:** "<n> comment(s) is/are still open. Re-send anyway?" + "<Reviewer> gets a NEW link. The old one stops working immediately." → "Cancel" / "Re-send". (A clean round re-sends without asking.)
  - **Revoke** (at the top of the panel): "Revoke this review link?" + "<Reviewer> will lose access immediately. You can send a new link any time." (or "Withdraw this review request?" + "The request stops waiting for a reply. You can send it again any time.") → "Cancel" / "Revoke" (red).
- **Notices** (muted line under the sent line): "Review link revoked." / "Review request withdrawn." / "This round changed (a re-send happened) — reloading." / "This link was already revoked." / "This request was already withdrawn." / "Couldn't revoke the link. Try again." / "Couldn't withdraw the request. Try again." / "Couldn't update that comment. Try again." / "Round created — but the invite email didn't go out. Send your client the link yourself."
- **Flows:** Send → round appears → client comments (pins on canvas + rows here) → Resolve/Reopen/Reply → all resolved → "Re-send for review" (new link, round +1) → client approves → publish confirm reads "Approved by …". Revoke kills the link; comments stay.
- **Gating / notes:** No ‹ › pager between rounds (older rounds' comments cannot be fetched). Viewers cannot send. A round sent from the dashboard without a client email has no link; the copy switches to "request"/"withdraw" wording.

### Send for review control (popover)

- **Where it lives:** A small button that opens a popover (bottom-right aligned) — in the Review panel's never-sent state and the "Invite a client…" slot. Its label is the state: "Send for review" (or "Invite a client…"), "Sending…", "Sent for review ✓", "Send again", "Retry send".
- **Layout / contents:** "Client email" (email input, hint "Leave blank to keep this internal."), "What changed?" (text, placeholder "e.g. hero copy, 2 images", max 500), "Note to the reviewer" (textarea, hint "Optional.", max 500). Error "Couldn't send — try again." If the round was created but the email failed: red "The round was created, but the invite email didn't go out." + "Nothing is lost — send your client the link yourself." + button "Copy the review link" → "Link copied ✓". Footer "Cancel" / "Send".
- **Flow:** Send → the site is rendered to a frozen snapshot, a review link `/review/<token>` is minted, the client is emailed (if an address was given) → a "Review sent" modal (shell) confirms → the panel reloads.

### Compare with approved

- **Where it lives:** Replaces the Review panel body; the split and overlay modes open a 1080×760 overlay window instead of the 280px drawer; list mode stays in the drawer. One 48px toolbar with a "‹ Back" hotspot and the title "Compare with approved".
- **States:** loading — spinner + "Loading approved snapshot…"; error — "Couldn't load the approved snapshot" / "The dashboard didn't answer. Try again." + "Retry"; otherwise the compare view (modes "split" / "overlay" / "list", a "refresh current" action). Closing the overlay drops back to list mode rather than leaving Compare. The comparison view itself is documented with the History module.

---

# PART 4 — EXPORT

### Export modal ("Export site as …")

- **Where it lives:** Centered modal, 560 wide, opened from the topbar's Export button and from Settings → Export.
- **Purpose:** Download the site as code.
- **Layout / contents:**
  - Title "Export site as HTML" / "Export site as ZIP" / "Export site as React" (follows the chosen format); close ✕.
  - Description line per format: HTML — "One HTML file with styles inlined — open it anywhere."; ZIP — "A .zip with every page, one stylesheet and your media — host it anywhere."; React — "Component source you can drop into an existing React project."; (Vue — "A single-file component…"; Next.js — "A page component…"; JSON — "The document tree as JSON, for tooling of your own." — these three are not selectable.)
  - **Format row** (11px pills): "HTML" (default), "ZIP", "React" selectable (selected = blue tint, blue border); "Vue" and "Next.js" dimmed with a grey "Soon" tag (coming soon, not clickable).
  - **Tabs:** "Preview" · "Code" · "Options".
  - **Preview tab:** device buttons "Desktop (1440px)", "Tablet (768px)", "Mobile (375px)" (selected = blue), then the page rendered in a scaled frame on a dark ground (tablet/mobile get a phone-style bezel). React format: "⚛ React components cannot be previewed directly." / "Download and run locally to preview."
  - **Code tab:** sub-tabs "HTML" · "CSS" with "<n> lines" at the right; a dark code block with line numbers, syntax colouring and a "Copy" button top-right. React: shows the first page component and its CSS module.
  - **Options tab:** "Page Title" (text, seeded from the site's own title with its template applied — a customer's file is never titled "Buildrick Export" unless they type it); "CSS Style" segmented "embedded" · "external" · "inline"; checkboxes "Minify output", "Include reset CSS" (on), "Include meta tags" (on), "Include viewport meta" (on). When the project has CMS bindings and a CMS handler is supplied: "CMS Content" segmented "None" · "Embed Data" · "Template", "Template Syntax" "handlebars" · "liquid", and a note "CMS bindings will not be resolved in export." / "CMS data will be embedded directly in HTML." / "Output will use {{variable}} syntax."
  - **Stats line** (not for React): "<n> element(s) · 12.4 KB HTML · 3.1 KB CSS".
  - **Body states:** spinner + "Generating export..." while building; on failure a large "Error" and the message.
  - **Footer** (right-aligned, small 11px buttons): "Cancel"; when CSS style is "external": "Download CSS" and "Download All"; primary "Export as HTML" / "Export as ZIP" / "Export as REACT" (shows spinner + "Exporting…" while working; disabled until output exists).
- **Actions / what you get:**
  - HTML → downloads `index.html` (the *active* page, styles embedded/external/inline per option; with "external", "Download All" gives `export.html` + `styles.css`).
  - ZIP → `<page title>.zip` containing **every live page** (`index.html` for the home page, `<slug>.html` for the rest, duplicates suffixed `-2`), one `styles.css`, and an `assets/` folder with every referenced image and font (rewritten to local paths; assets that can't be fetched are skipped).
  - React → `<page title>-react.zip` with `components/<PageName>.tsx` + `<PageName>.module.css` per page, an `index.tsx`, and a `package.json`.
- **Gating / notes:** Hidden and password-protected pages are left out of ZIP/publish; the export never includes the editor's own attributes.

### What every exported / published page contains (user-visible outcomes)

- Head: charset & viewport (per options), the page's SEO block — title (page SEO title → page title → page name, wrapped in the site's title template `{page_title}` / `{site_name}` if one exists), description, canonical, og:locale/type/title/description/image/url/site_name, twitter card/title/description/image/site, favicon link, robots "noindex"/"nofollow" from the page's toggles, JSON-LD structured data, an Organization JSON-LD with the social links, then the page's own custom head code (sanitised).
- The stylesheet (reset, site design tokens, site fonts, element styles, responsive rules, per-breakpoint "hide on mobile/tablet/desktop" rules, animation keyframes, uploaded-font faces), Google Fonts links for used families, the site's Global CSS, Head scripts, the locale auto-redirect snippet, analytics snippets, Stripe cart script (when configured), and at the end of body the interaction runtime (only if the page uses interactions) and Body scripts.
- Internal links written as "page links" resolve to the right file; a link to a deleted page falls back to the home page.
- Forms with a Formspree URL or a custom webhook URL get their action wired (plus hidden `_next` / `_subject` fields for Formspree).
- Multi-page publishes also get a `sitemap.xml` (excludes noindex pages) when a base URL is known.

---

# PART 5 — E-COMMERCE

### Set Up Products Collection modal

- **Where it lives:** Large centered modal, shown when a user first drops an e-commerce block onto the canvas.
- **Layout / contents:** Title "Set Up Products Collection"; close ✕; a large shopping-bag icon; "E-commerce blocks require a Products collection in your CMS. Would you like to create one now?"; a bordered checkbox card "Include sample products" (checked by default) with sub-line "Add 3 example products to get started quickly"; three green-check bullets "8 product fields (name, price, image, etc.)", "Validation rules included", "Ready for CMS data binding"; footer "Skip for now" (ghost) and "Create Collection" ("Creating..." while working, both disabled meanwhile).
- **Actions:** Create → builds the collection (with samples if ticked) and closes; on failure the modal stays open for a retry. Skip → closes.

### Cart & checkout on the published site (Stripe)

- When a Stripe configuration is present at export time, the published page gets a small cart runtime: "Add to Cart" buttons show "Added!" for 1.5 s, cart count/total placeholders update, and "checkout" buttons either jump to the product's Stripe Payment Link or call a checkout endpoint. Visitor-facing alerts: "Your cart is empty", "Payment link not configured for this product", "Unable to process checkout. Please try again."
- **Gating / notes:** No editor UI in this module writes the Stripe configuration; the Integrations screen's Stripe row only links out. Treat cart/checkout as (not wired from the editor).

---

# PART 6 — ANIMATION

### Animation section (in the right-hand inspector, "Animation")

- **Where it lives:** A collapsible section of the element inspector.
- **Layout / contents:** A status strip: "No Animation" (grey) with an "Enable" button, or "Animation Enabled" (blue tint) with a "Disable" button. When disabled, a soft amber tip: "Click **Enable** above to add entrance, attention, or exit effects to this element. Choose from presets like fade, slide, bounce, and more." When enabled, the Animation editor below, then a dark "Generated CSS:" block showing e.g. `animation: fadeIn 1000ms ease 0ms 1;`.

### Animation editor

- **Layout / contents:**
  - Tabs "Entrance" · "Attention" · "Exit" (accessible label "Animation type").
  - A 3-column grid of 40px preset chips (selected = blue):
    - Entrance: Fade In (default), Fade In Up, Fade In Down, Fade In Left, Fade In Right, Zoom In, Bounce In, Slide In Up, Slide In Down, Flip In X, Flip In Y, Rotate In.
    - Attention: Pulse, Bounce, Shake, Swing, Wobble, Flash, Heart Beat, Rubber Band.
    - Exit: Fade Out, Fade Out Up, Fade Out Down, Zoom Out, Slide Out Up.
  - Eyebrow "TIMING", then: "Duration" slider 100–3000 ms (step 100, default 1000); "Delay" slider 0–2000 ms (default 0); "Easing" select — Linear, Ease (default), Ease In, Ease Out, Ease In Out, Bounce, Elastic; "Iterations" number 1–10 (default 1).
  - A full-width light button "▶️ Preview Animation".
  - A mono summary box: `animation: <preset> <duration>ms <easing> <delay>ms <iterations or "infinite">;`
- **Actions:** pick chip / adjust timing → applies to the selected element live; Preview replays it on the canvas; "Disable" removes it.
- **Gating / notes:** No trigger option here (load/scroll/hover triggers were removed because the engine ignored them); triggered motion belongs to the **Interactions** section. Published pages emit the matching keyframes so these animations run live.

### Interactions on the published site (what the visitor gets)

- Triggers honoured: click, while pressed, hover / mouse over (reverses on leave), mouse out, focus (reverses on blur), blur, mouse move, page leave, page load, page scroll / while scrolling, scroll into view, scroll out of view.
- Presets honoured (39): fadeIn, fadeOut, slideUp, slideDown, slideLeft, slideRight, scaleIn, scaleOut, rotateIn, rotateOut, bounceIn, bounceOut, flipX, flipY, pulse, shake, blur, glow, fadeInUp, fadeInDown, fadeInLeft, fadeInRight, slideInUp, slideInDown, scaleUp, scaleDown, zoomIn, zoomOut, rotate, flip, rollIn, rollOut, hinge, bounce, flash, heartBeat, tada, rubberBand, swing, wobble, jello, plus "custom" properties.
- Easings honoured: linear, ease in/out/in-out (quad/cubic/quart), spring, bounce, and the editor's own list — none, power1–power4 in/out/inOut, elastic.out, bounce.out, back.out, expo.out, circ.out. Loop count and reverse-on-exit are respected; "prefers reduced motion" fast-forwards animations in the editor.

---

# PART 7 — INTEGRATIONS (engine side)

- **Email marketing (Mailchimp / SendGrid / Mailgun / Resend):** a stub. Nothing in the UI reaches it and every provider call fails with "backend proxy endpoint not yet configured". (dead / simulated)
- **Form submission + email notifications:** an in-memory service with validation messages ("<field> is required", "Invalid email format", "Invalid phone format", "Must be a valid number", "Minimum length is N characters", "Maximum length is N characters", "Invalid format") and email templates ("Thank You!", "New Form Submission", "Welcome!"). No published page calls it; SMTP returns "SMTP not supported in browser…". (dead / simulated)

---

# PART 8 — SYNC, AUTOSAVE & RECOVERY (what the user actually sees)

The visible controls (save chip, conflict dialog, toasts) are rendered by the shell/topbar; this section lists the behaviours and copy these services drive so the designer can place them.

### Autosave
- Every change is saved to the browser 5 seconds after the last edit (debounced). Dashboard-backed sites also mirror to the cloud on the same rhythm through the cloud save below. A failure raises a storage error the shell surfaces.
- Secrets (email API key, published-site password) are never written to browser storage.

### Cloud save (dashboard-backed sites)
- Saves are refused for a site whose project never finished loading in this session — the message explains that saving would replace the stored pages with what the fallback put on screen; for a site the server says no longer exists, the refusal says the site is gone (reload will not help).
- **Save conflict:** if someone else saved since you loaded, the server refuses and a **conflict dialog** is raised (same dialog for manual save and autosave) offering to reload the latest version or overwrite with yours.
- **Settings mirror refused:** page content saved but a site setting was rejected (e.g. an invalid OG image URL) — a separate, smaller message; inside Settings this becomes the red save banner + "Retry save".
- The topbar chip reads things like "Saved · just now" and "Save failed — retry" (shell-owned).

### Unsaved-work recovery
- When a cloud save fails, the snapshot is kept in the browser per site. On the next load the user is **told and asked** whether to restore it — it is never applied automatically. Cleared once saved.

### Mirror retry queues (CMS, versions, components, "My Templates")
- Each of these writes locally first and mirrors to the server in the background. A failed mirror is queued (latest wins per record), announced so the shell can show a retryable "not on the server" toast, and replayed automatically when the browser comes back online or on an explicit retry. The exit guards count pending mirrors before letting you leave. The toast clears when the queue drains.
- CMS hydration states: loading / ready / error — error copy (from the board): "This is a connection problem, not a change to your data."
- Saved-templates hydration states: idle / loading / error / ready — error copy: "You can keep building from Insert."

### Crash recovery
- Uncaught errors stamp a crash record; the next start can offer a restore-from-autosave prompt. Returning to a hidden tab, or any caught error, silently re-validates the editor (recreates a missing page root, clears an invalid selection, re-syncs the canvas).

### Version history storage
- Versions live in the browser (and mirror to the server). **50 versions kept; auto-saves prune oldest first; named versions never prune.** If the browser's storage quota is hit, the 10 oldest auto-checkpoints are removed and the save retried. Versions can be exported/imported as a JSON file (`versions-<site>-<time>.json`).

### Migration notices
- On load, project design-system migrations emit started / complete / failed / skipped events for the shell to show a spinner, toast or blocking modal. No copy lives in this module.

### Other user-facing plumbing
- **Notifications bell** (topbar): recent notifications (actor, message, action link, read state); unread count fails closed to 0; the list shows "couldn't load · Retry" on error; mark one / all read.
- **Roles:** VIEWER / EDITOR / DESIGNER / ADMIN / OWNER. Denied controls are shown **disabled with the reason attached**, never hidden (e.g. "Only an admin can change the domain", "Viewers can't send for review — ask an editor").
- **Media uploads:** files go straight to cloud storage after the dashboard validates session, quota and size; images record their pixel size; failures fall back to local-only with retry.
- **AI alt text:** silently requested for uploaded images; a user-typed alt text is never overwritten.
- **Asset versions:** per-asset version history (list / create / restore) behind the media drawer's Versions tab.

---

# PART 9 — FEATURE FLAGS

| Flag (env) | What it shows / hides |
|---|---|
| `FEATURE_PUBLISH` | The whole publish path: the topbar Publish dropdown, the Publish panel's "Publish to production" CTA and wizard. Off → the panel shows "Connect Vercel to publish." with a "Connect Vercel" button, and the topbar's publish reason reads "Publishing isn't switched on for this workspace yet". |
| `FEATURE_DS_AI` | The AI assist entry point inside the Brand / design-system panel (and the AI client behind it). Off → no AI button there. |
| `FEATURE_COLLAB` | The entire real-time collaboration surface (presence, "Collaborate" CTA, session state). Off → nothing collab shows. **Demo-only; never on in production.** |
| Dev build (`MODE=development`) | Dev-only behaviours: console warnings, demo presence indicators, the dev/Figma view-mode switch, unsaved-changes browser prompt in dev. |
| Legacy static flags (`AI_ASSISTANT`, `TEMPLATES`, `CUSTOM_COMPONENTS`, `DATA_BINDING`, `RESPONSIVE_PREVIEW`, `CODE_EXPORT` = on; `COLLABORATION`, `PLUGINS`, `VERSION_HISTORY` = off) | Declared but **no UI reads them** — dead. |

Plan gates (not flags): Custom code and Integrations require **Pro** (Starter sees the Locked screen with "Upgrade to Pro"). Role gates: domain changes, webhooks and unpublish require Admin; sending for review is blocked for Viewers.

---

# Inspector (right-hand properties panel)

**What this module is.** The Inspector is the 300px-wide column on the right edge of the editor. Whatever is selected on the canvas, the Inspector shows its editable properties: a header naming the element, a small row of three pills (edit reach · breakpoint · state), a run of optional banners that explain "what you are editing right now", and then one long scrolling column of collapsible sections (Layout, Size, Spacing, Typography, Background, Border, …). There is **no tab strip** any more — the older Style / Element / Effects tabs were removed and every section now sits in one flat, scrollable list whose order depends on the type of the selected element. When two or more elements are selected the panel swaps to an Align / Distribute / batch-edit view. When nothing is selected it shows a one-line prompt. The Inspector writes every change into the design immediately (with a 300 ms typing debounce so rapid keystrokes become one undo step), and it respects the currently chosen breakpoint (Desktop / Tablet / Mobile) and interaction state (Base / hover / focus / active / disabled).

---

## 1. Panel frame, dimensions and global states

### 1.1 Overall shape
- **Where it lives:** right-hand column of the editor shell, full height, 300px wide, flush to the edge (no card, no shadow). One hairline rule on its left edge.
- **Purpose:** edit the selected element.
- **Layout / contents (top to bottom, single selection):**
  1. **Header** (48px tall) — element icon, element name, action icons.
  2. **Context pill row** (32px tall, light-grey strip) — `This ▾ · Desktop ▾ · Base ▾` (+ "Detach instance" when relevant).
  3. **Banner stack** (each optional): reach banner, binding banner, component-instance band, state banner, breakpoint-override rows.
  4. **Media source row** (image / video / SVG only).
  5. **Scrolling section list** (Layout, Size, Spacing, …), each a collapsible section.
  6. **Footer line** "N of M sections apply".
- **Typography:** body copy 11px medium; row labels 12px regular in soft grey; section headers 11px semibold UPPERCASE letter-spaced grey.
- **Scroll memory:** the panel remembers the scroll position per element; reselecting an element restores where you were, a brand-new selection starts at the top.
- **Screen readers:** a hidden live region announces "Text selected", "Button selected", etc. on every selection change.

### 1.2 Empty state (nothing selected)
- **Where:** whole panel.
- **Layout:** 64px of top padding, then one centred muted sentence and one small accent link under it.
- **Copy:** "Select something on the canvas to edit it." and the link "✦ Ask AI ›".
- **Actions:** "✦ Ask AI ›" switches the left sidebar to the AI tab.
- **Notes:** the older version of this state (icon, headline, "Open Build Panel" / "Browse Templates" buttons and a keyboard tip) has been deliberately reduced to these two lines.

### 1.3 Loading state (site still arriving, nothing selected)
- **Layout:** a 48px header bar containing a short skeleton pill (52px), then six 32px rows each with an 88px skeleton label and a full-width skeleton field.
- **Purpose:** avoids showing "Select something on the canvas…" over an empty canvas, which reads as "your site is empty".

### 1.4 Template-just-applied state (nothing selected)
- **When:** for 30 minutes after a template is applied from the Templates picker.
- **Layout:** left-aligned, 16px top padding. A pale-green rounded banner containing: title "Template applied!" (12px semibold, success green), the template's name (11px), and a solid-accent small button "Set Brand Colors". Below the banner: "Tip: Click an element to edit its properties" (11px muted, "Tip:" at 70% opacity).
- **Actions:** "Set Brand Colors" opens the Design / Brand panel.

### 1.5 Error state
- If any section throws, the section area is replaced with a red-tinted, red-bordered card: title "Inspector Error", the error message, and a button "Try Again" that re-renders. The header and pill row remain.

### 1.6 Multi-selection state (2+ elements selected) — see §3.

### 1.7 AI-run takeover
- **When:** while the AI agent is running a task.
- **Layout:** the header + pill row stay; everything below is replaced by a status card: bold "AI", then the run's summary text (or "Working…" if none), then a muted line "Your selection is kept and restored when you go back."

### 1.8 Whole-site takeover
- **When:** user picks "Whole site" in the scope pill.
- **Layout:** three stacked bands replace all sections:
  1. Warning-tinted band (36px): "Editing the whole site — every page".
  2. Accent-tinted band (52px): "Site-wide colours, fonts and spacing live in the Brand panel — change them once, everywhere updates."
  3. Action row (44px): primary button "Open Brand" and ghost button "Back to this element", both 28px tall.
- **Actions:** "Open Brand" switches to the Design/Brand panel; "Back to this element" restores the normal view. Selecting a different element also resets scope to "This".

---

## 2. Header (single selection)

- **Where it lives:** top of the panel, 48px, 16px side padding, hairline below.
- **Layout (left → right):**
  1. **Element icon** — 26×26 rounded square, pale-accent fill, accent-coloured glyph representing the element type.
  2. **Element name** — the element type capitalised ("Text", "Heading", "Button", "Container", "Image"…; falls back to "Element"). 14px medium, truncates with ellipsis. **Not editable** — there is no rename field and no breadcrumb.
  3. **Action cluster** (2px gaps, 22×22 icon buttons):
     - **Pick element on canvas** (crosshair icon). Tooltip "Pick element on canvas". Toggles a pressed (accent-tinted) state and puts the canvas into pick mode; the button un-presses when the canvas reports a pick or a cancel.
     - **Select parent** (corner-arrow icon). Tooltip "Select parent". Disabled (35% opacity, not-allowed cursor) when the element has no parent. Selects the parent element.
     - **"✦ AI" chip** — 22px tall pale-accent pill with accent text. Tooltip "Ask AI about this element". Switches the sidebar to the AI tab.
     - **Bind to collection field** (chain-link icon button). Pressed/accent when the element is bound. Opens the binding popover (§2.3).
     - **"Bound" chip** — only when bound: outlined accent pill with a small link icon and the word "Bound"; tooltip "Bound to Collection.field".
     - **Element actions "⋯"** (28×28, more-horizontal icon). Tooltip "Element actions". Opens the menu in §2.1.

### 2.1 Element actions menu (⋯)
- **Where:** drops down from the ⋯ button, right-aligned, 180px min width, rounded, shadowed.
- **Items (top → bottom):**
  | Item | Icon | Behaviour |
  |---|---|---|
  | Duplicate | copy-plus | Duplicates the element and selects the copy (one undo step). |
  | Copy styles | copy | Snapshots every style on the element into the shared style clipboard (same clipboard as ⌘⌥C on canvas and the right-click menu). |
  | Paste styles | clipboard-paste | Applies the clipboard styles to this element. **Disabled** (50% opacity) when the clipboard is empty. |
  | — divider — | | |
  | Delete | trash | Red text. Opens the delete confirmation (§2.2). |
- **Hover:** items get a light grey background; Delete gets a faint red background.
- **Closes on:** outside click, Escape, or choosing an item.

### 2.2 Delete confirmation modal
- **Where:** centred modal (large size).
- **Title:** "Delete Text?" (uses the element name).
- **Close:** × in the corner, tooltip "Close modal".
- **Body:** "**Text** is removed from the page. You can undo it with `Ctrl+Z`." (element name in bold, shortcut rendered as a keycap).
- **Footer:** secondary "Cancel", danger "Delete Text".
- **Note:** deliberately does *not* say "This cannot be undone" — a delete is one undo step.

### 2.3 Bind to collection field (popover)
- **Where:** 240px popover anchored bottom-right of the chain-link header button. Label for screen readers: "Bind to collection field".
- **Purpose:** link this element's content to a CMS collection → field → record.
- **Layout / flow:**
  1. **Bound row** (only when already bound): small link icon + "Collection › Field" label, and a red unlink icon button on the right (tooltip "Remove binding").
  2. **Step 1 — Collections:** label "Collections", then one row per collection with the name on the left and "N fields" on the right. Empty: "No collections yet." / "Create one first." (centred, muted).
  3. **Step 2 — Fields:** first row "← CollectionName" (accent, goes back), a divider, label "Fields", then one row per field: name left, field type right. Empty: "No fields defined".
  4. **Step 3 — Record:** first row "← FieldName" (back), divider, label "Record", one row per record: the record's display-field value (or "(untitled)") left, its status right. Empty: "No records yet. Add records via the command palette → "Manage CMS Records"."
  5. Picking a record binds the element, closes the popover, and the header shows the "Bound" chip and the banner in §4.2.
  6. **Footer:** full-width text button "+ Create Collection" — closes the popover and opens the Create Collection modal.
- **Closes on:** outside click / Escape (also resets the drill-down back to step 1).

---

## 3. Multi-selection view (2+ elements)

- **Where lives:** replaces the whole single-element panel.
- **Layout (top → bottom):**
  1. **Header** (48px): "3 selected" (14px semibold ink) on the left, "✦ AI" chip on the right (tooltip "Ask AI about this selection").
  2. **ALIGN band** (72px, full-width light-grey fill): uppercase label "Align", then six 36×28 white bordered icon buttons on a 6px gap: align left, align centre (horizontal), align right, align top, align middle (vertical), align bottom. Tooltips: "Align Left", "Align Center", "Align Right", "Align Top", "Align Middle", "Align Bottom". When fewer than 2 selected the tooltip appends "(select 2+ elements)" and the buttons are disabled.
  3. **DISTRIBUTE row** (44px, plain panel): uppercase label "Distribute" on the left and two 36×28 grey-tinted icon buttons on the right: distribute horizontally, distribute vertically. Tooltips "Distribute Horizontally" / "Distribute Vertically"; when fewer than 3 selected they are disabled and the tooltip appends "(select 3+ elements)".
  4. **Batch style panel** — five property rows in the standard label/control layout, applied to *every* selected element in one undo step:
     | Row | Control | Units |
     |---|---|---|
     | Background | colour row (swatch + hex) | — |
     | Text color | colour row | — |
     | Radius | number + unit | px, %, rem |
     | Padding | number + unit | px, %, rem, em |
     | Font size | number + unit | px, rem, em, % |
     - Where the selection disagrees, the field is empty and shows the placeholder **"Mixed"**.
     - **Hint line under the rows** (11px muted): "Editing a Mixed field applies it to all N." when any field is mixed, otherwise "Edits apply to all N elements in one action."
- **Notes:** batch edits also respect the breakpoint and state that were active before the multi-select (they write to the same layer).

---

## 4. Context pill row and banners

### 4.1 Context pill row
- **Where:** directly under the header, 32px, light-grey strip, 16px side padding, 8px gaps. Three 22px-tall pills, 11px text, small radius; the first pill is white, the other two are the same grey as the strip.

#### 4.1.1 Scope pill ("This ▾" / "All like this ▾")
- **Purpose:** decides how far an edit reaches.
- **Pill label:** "This" normally; "All like this" while that mode is on. Chevron on the right.
- **Menu (200px, three two-line options):**
  | Option | Sub-line | Behaviour |
  |---|---|---|
  | This item | "just here — the default" (tooltip "Just this element") | Edits go to the selected element only. Highlighted when active. |
  | All like this | "edits also go to N other buttons" (or "no other buttons here" when none) | A **mode**: every edit you make from now on is also applied to every other element of the same type on the page, until you switch back. **Disabled** when there are no peers; tooltip "No other buttons on this page" / "Every edit also goes to N other buttons". |
  | Whole site | "colors & fonts — Styles tab" (tooltip "Site-wide colors & fonts live in the Styles tab") | Switches the panel into the whole-site takeover (§1.8). |
- **Reach banner** (shown while "All like this" is on, warning-tinted, 12px): "Editing all 4 paragraphs — All like this" (count includes this element; type name pluralised). No close control — leave via the pill.
- Scope resets to "This" when a different element is selected.

#### 4.1.2 Breakpoint pill ("Desktop ▾")
- **Pill:** device icon (monitor / tablet / smartphone) + breakpoint name + chevron. A 5px accent dot appears after the name when this breakpoint has any overrides on the element.
- **Menu (160px listbox):** one row per breakpoint — icon, name, and on the right the range for the narrow ones:
  | Row | Range shown |
  |---|---|
  | Desktop | — (base, no range) |
  | Tablet | ≤1023px |
  | Mobile | ≤767px |
  Active row is accent-tinted and bold.
- **Behaviour:** choosing a breakpoint changes the canvas device preview and makes every subsequent edit an override for that breakpoint. Desktop is the base layer; Tablet and Mobile are override layers (desktop-first cascade: mobile preview also applies tablet rules).

#### 4.1.3 State pill ("Base ▾")
- **Pill:** state label + a small dot (in the text colour) when a non-Base state is chosen + chevron.
- **Menu (150px listbox):** "Base", ":hover", ":focus", ":active", ":disabled". Rows with existing overrides at the current breakpoint show a 5px accent dot on the right. Active row accent-tinted.
- **State banner** (when not Base; accent-tinted, 11px, 32px band): "Editing :hover — not Base".
- **Behaviour:** every edit made while a state is picked lands on that state's rule (at the current breakpoint) instead of the base. State resets to Base when a different element is selected.
- **Not available:** pressed / visited / checked / custom states.

#### 4.1.4 "Detach instance" button
- **When:** only in **Pro mode** (set in the Design/Brand panel) *and* only when the selected element is a component instance. Otherwise hidden.
- **Look:** small outlined amber button with a 5px dot: "Detach instance".
- **Flow:** click → confirm dialog "Detach from component?" / "This copy stops receiving updates from "Hero Card". The component itself is untouched." / confirm label "Detach". Failure toasts: "Couldn't detach this instance. It may already be detached." or "Couldn't detach this instance. Try again."

### 4.2 Banner stack (each optional, in this order)
All banners are hidden during the whole-site and AI takeovers.

1. **Reach banner** — see §4.1.1.
2. **Binding banner** (accent-tinted, full-bleed, 16px inset) — shown when the element is bound to a CMS field: "Text is bound to Blog.title" with a plain 11px "Unbind" text button on the right, and a muted second line "Edit the record in Content, or unbind to type here."
3. **Component instance / Variant band** (accent-tinted) — shown when the element is a component instance:
   - Small uppercase caption "COMPONENT INSTANCE" (no variant properties) or "VARIANT" (has variant properties).
   - Without variants: "Linked to {Component name}. Edits here apply to this copy only."
   - With variants: one label + dropdown row per variant property (e.g. "Size" → Small / Medium / Large). Changing a value switches the instance to the matching variant.
   - Plain accent text button "Reset to master" — discards this copy's local overrides.
4. **State banner** — see §4.1.3.
5. **Breakpoint override rows** — shown only on Tablet/Mobile when this element has overrides on that breakpoint. One block per overridden property:
   - A row with a 2px accent bar on the left, the property humanised as the label ("Padding top", "Font size"), and a white bordered value box showing the override value with a small ↺ revert icon inside on the right (tooltip "Revert to base"; screen-reader "Revert padding top to base").
   - Under it an accent-tinted note: "Overridden on Tablet — Base is 16px" (or "Base is not set").
   - Revert removes the override (one undo step).

### 4.3 Media source row
- **When:** the selected element is an **image**, **video** or **SVG**. Sits above the first section, with a hairline below.
- **Layout:** 12px medium label, then the file's name in 11px soft grey (the library display name, else the URL's file name, else "No source yet"; tooltip shows the raw URL), then a small 28px primary button.
  | Element | Label | Button | Button does |
  |---|---|---|---|
  | Image | "Image source" | "Choose image" | Opens the media picker filtered to images; picking one sets the source. |
  | Video | "Video source" | "Manage video" | Opens the full-page Asset library with this file selected. |
  | SVG | "SVG image source" | "Manage SVG" | Opens the full-page Asset library with this file selected. |

---

## 5. Section list — shell, order, and shared behaviours

### 5.1 Section shell
- **Header:** 28px tall when collapsed, 20px when open; 16px side padding. Contents: uppercase 11px semibold label ("LAYOUT", "SPACING", …), an optional **preview pill** (only while collapsed — a muted monospace summary such as "flex · relative", "Inter · 14px", "200px × auto", "1px solid", "3 × 2", "2 shadows · 50%", "hidden on 2"), and a chevron at the right that points down when open and right when closed. Hover tints the row very slightly. Enter / Space toggles from the keyboard.
- **Optional header action:** Background has an 18×18 "+" icon button (tooltip "Add background image") that opens the media picker straight away without expanding the section.
- **Body:** 16px left / 20px right padding, 8px bottom. Rows stack with no extra gap.
- **Open/closed memory:** the panel remembers, per element type, which sections you left open. On first sight of a type, the sections that already carry a value on that element open; sections with nothing set stay shut. "Expand all / collapse all" exists in code but there is no visible control for it in the panel.

### 5.2 Footer line
- After the last section: "4 of 13 sections apply" (11px muted, 16px inset). A section "applies" when the element has a value for anything the section owns.

### 5.3 Simplified density (URL-driven)
- When the editor is opened with `?density=fewer` (or the read-only view), only the first three visible sections render, followed by a helper "Simplified view — 9 more controls hidden. It's a preference, not a limit." and a ghost button "Show all controls" that reloads with full density.

### 5.4 "More settings" disclosure
- Several sections end with a small text toggle: chevron-right + "More settings" + a grey monospace count chip (e.g. "5"); when open it reads chevron-down + "Less". Layout's toggle instead reads "Position, overflow & visibility". Hover turns it accent. The open/closed state is remembered per section and **auto-opens** on first selection of an element when any of its advanced properties already has a value.

### 5.5 Row anatomy (the standard property row)
- 34px tall row. **Label** column 95px (12px regular, soft grey, left-aligned); **control** column 160px (starts at x120, ends at x280). Controls are 28px tall, very-light-grey fill on a hairline border, radius 4; hover → white; focus → accent border + focus glow.
- **Override dot:** a 6px accent dot after the label when the value comes from the current breakpoint's override layer.
- **Helper (i):** some rows carry a faint info icon after the label with a tooltip (e.g. Z-Index: "Controls the vertical stack order").
- **Mixed dot (multi-select):** a 6px amber dot over the field, tooltip "Mixed — values differ across selected elements"; some spots use a full amber "Mixed" badge instead.
- **Disabled:** row dims to 50% and ignores clicks; hovering shows the reason as a tooltip (see §11 for the reason strings).

### 5.6 Section order per element type
Sections that don't apply are skipped (Flexbox only shows for flex containers/items, Grid only for grid containers/items, Typography only for text-like types, Link only for link/button/CTA, All CSS only in dev mode).

| Element types | Order (top → bottom) |
|---|---|
| **Container fallback** — container, section, card, pricing, social, hero, features, form, list, table, header, footer, nav, navbar, slider, testimonials, accordion, custom, spacer, divider, progress, countdown, product-card, product-grid, product-detail, and any unknown type | Layout · Flexbox · Grid · Size · Spacing · Typography · Background · Border · Corner radius · Effects · Interactions · Animation · Visibility · Element Properties · CSS classes · All CSS |
| **Text** — text, heading, paragraph | Typography · Spacing · Size · Background · Border · Effects · Link · Interactions · Animation · Visibility · Element Properties · CSS classes · All CSS |
| **Flex** container | Layout · Flexbox · Size · Spacing · Background · Border · Corner radius · Effects · Interactions · Animation · Visibility · Element Properties · CSS classes · All CSS |
| **Grid / Columns** | Layout · Grid · Size · Spacing · Background · Border · Corner radius · Effects · Interactions · Animation · Visibility · Element Properties · CSS classes · All CSS |
| **Media** — image, video, audio, svg, lottie, icon, gallery, video-embed, map-embed | Size · Spacing · Background · Border · Corner radius · Effects · Interactions · Animation · Visibility · Element Properties · CSS classes · All CSS |
| **Button / Link / CTA** | Typography · Background · Border · Corner radius · Spacing · Size · Effects · Interactions · Animation · Link · Visibility · Element Properties · CSS classes · All CSS |
| **Input / Textarea / Select** | Typography · Border · Spacing · Size · Background · Corner radius · Effects · Element Properties · Interactions · Animation · Visibility · CSS classes · All CSS |

---

## 6. Sections in detail

### 6.1 LAYOUT
- **Preview pill (collapsed):** display value, plus position if not static — e.g. "flex · absolute".
- **Face (always visible):**
  - **Display** row — six tiny glyph buttons in one row (2px gaps, 24px min height): Block, Flex, Grid, I-Block, Inline, None. Each button is a little diagram (two stacked bars, three side-by-side bars, 2×2 grid, two inline boxes, grey-blue-grey inline run, dashed ghost box). Tooltips: "Block — Full width, stacks vertically", "Flex — Flexible box layout", "Grid — 2D grid layout", "I-Block — Inline with block properties", "Inline — Flows with text", "None — Hidden from view". Active = accent tint.
- **More settings** (toggle reads "Position, overflow & visibility"):
  - Sub-heading **POSITION**, caption "Position" with an (i) tooltip: "Static: normal flow. Relative: offset from normal position. Absolute: positioned relative to nearest positioned parent. Fixed: stays in viewport. Sticky: sticks when scrolling past."
    - Five card buttons (diagram + label): "Auto" (static), "Rel", "Abs", "Fixed", "Sticky". Tooltips: "Default — follows normal flow", "Offset relative to its normal position", "Positioned relative to nearest parent", "Pinned to the viewport — stays on scroll", "Sticks to edge when you scroll past it".
    - When position ≠ static a grey **Position Offset** panel appears: a cross of four 50px text fields around a small accent block — top / left · [block] · right / bottom (placeholders "top", "left", "right", "bottom") — then a **Z-Index** number row (placeholder "auto", (i) "Controls the vertical stack order").
  - Sub-heading **OVERFLOW**: one row of four compact buttons "vis / hid / scr / aut" (tooltips "Content can overflow", "Clip overflow content", "Always show scrollbars", "Scrollbars when needed"); then two small selects side by side labelled "X" and "Y" (options Default, visible, hidden, scroll, auto); then a two-button row "content / border" (tooltips "Size excludes padding + border (content-box)", "Size includes padding + border (border-box)").
  - Sub-heading **VISIBILITY & FLOAT**: "Visible" row → vis / hid / col; "Float" row → none / left / right; "Clear" row → none / left / right / both.

### 6.2 FLEXBOX
- **Shows when:** the element is a flex container, or its parent is one.
- **Preview pill:** "row · center" (direction · justify) for containers; "grow 1" or "self: center" for items.
- **If the element is not yet flex:** a pale-accent box "Enable Flexbox" with a solid accent button "Enable Flex" (sets display to flex).
- **Container controls:**
  - Caption "Flex Direction", four card buttons with arrow diagrams: "Row", "Column", "Row-R", "Col-R".
  - Caption "Alignment": a **9-dot pad** (3×3, 20px cells; the active dot is solid accent) on the left — clicking a dot sets justify + align together (axes swap in column direction; tooltip "Justify: flex-start, Align: center"). To its right, caption "Justify Content" with six compact buttons "sta / cen / end / bet / aro / eve", and caption "Align Items" with five "sta / cen / end / str / bas".
  - "Wrap" row → "nowrap / wrap / rev".
  - **Gap** group in a bordered grey box: the linked gap control (§8.4).
  - "A-Cont" (align-content) row → "sta / cen / end / str / bet / aro".
- **Item controls** (when the parent is flex) under a rule and the uppercase heading "FLEX ITEM (SELF)":
  - Three narrow cells "Grow" (number, placeholder 0), "Shrink" (number, placeholder 1), "Basis" (text, placeholder auto).
  - "A-Self" row → "aut / sta / cen / end / str / bas".
  - "Order" number row (placeholder 0).
  - When the parent is not flex these are disabled with tooltip "Applies only to flex items".

### 6.3 GRID
- **Shows when:** the element is a grid container or a grid item.
- **Preview pill:** "3 × 2" (column count × row count; "auto" for auto-fit/auto-fill; "—" when unset).
- **GRID CONTAINER** (uppercase heading):
  - Caption "Column Templates": 8 preset tiles in 4 columns — "2 Col", "3 Col", "4 Col", "Auto", "1:2", "2:1", "Sidebar", "Holy" (these write `1fr 1fr`, `1fr 1fr 1fr`, `repeat(4, 1fr)`, `repeat(auto-fit, minmax(200px, 1fr))`, `1fr 2fr`, `2fr 1fr`, `250px 1fr`, `200px 1fr 200px`).
  - "Columns" text row (placeholder "1fr 1fr 1fr"); "Rows" text row (placeholder "auto").
  - "Flow" compact buttons → "row / col / r+d / c+d".
  - Three small labelled fields in a row: "Gap", "Row", "Col" (placeholders 0).
  - Caption "Item Alignment": a 60×60 **9-dot pad** with a readout beside it — "JUSTIFY  start" / "ITEMS  stretch" (each dot's tooltip "justify: center, align: end").
  - "J-Content" and "A-Content" compact rows → "sta / cen / end / bet / aro".
- **GRID ITEM** (uppercase heading, when the parent is a grid):
  - Two fields "Col" and "Row" (placeholders "auto").
  - "Col Span" and "Row Span" compact rows → "1 / 2 / 3 / 4 / full".
  - "J-Self" and "A-Self" compact rows → "aut / sta / cen / end / str".

### 6.4 SIZE
- **Preview pill:** "200px × auto" (width × height) when either is set.
- **Width** group: caption "Width", three card buttons with mini diagrams and labels **Fixed / Fill / Hug** (tooltips "Fixed size - element has a specific pixel or unit value", "Fill - element expands to fill available space (100%)", "Hug content - element shrinks to fit its content (fit-content)"). Fill writes 100%, Hug writes fit-content, Fixed reveals a unit field with a bold "W" glyph inside, plus a hover-reveal **chain button** (§9.1) to bind a spacing token.
- **Height** group: identical, with "H" glyph.
- **More settings (5):** two paired rows — "min | max" width and "min | max" height — each a unit field with a small "min" / "max" glyph inside, separated by a 6px tick.
- **Object Fit** select (images/videos only; hidden otherwise): Default, Fill, Contain, Cover, None, Scale Down.
- **Disabled reasons:** on inline elements every size field is disabled with tooltip "Inline elements ignore width/height".

### 6.5 SPACING
- **Preview pill:** "m 16px p 8px" (per-side values collapse to one value when equal, otherwise "·"); "link", "m·link" or "p·link" when a link toggle is on; amber when mixed.
- **Face:**
  - **Padding** row → a pair of unit fields "vertical | horizontal" (screen-reader "Padding top and bottom" / "Padding left and right"), placeholders 0. Each writes both sides of its axis.
  - **Gap** unit row (placeholder 0).
  - **Margin** row → same pair; the horizontal field's unit list adds "auto" (px, %, rem, auto).
- **More settings (4):**
  - Two toggle chips "Margin" and "Padding" with a link / broken-link icon (tooltips "Link margin sides" / "Unlink margin sides" etc.). When linked, editing one side writes all four.
  - The **nested box editor**: an outer dashed amber box tagged "MARGIN" containing an inner dashed blue box tagged "PADDING" with a small "CONTENT" rectangle in the centre. Each box has four tiny inline number fields sitting on its edges (top / right / bottom / left; placeholders 0; amber digits for margin, blue for padding; typing a bare number writes px; "auto"/"inherit" allowed and shown muted). A bound side shows a green token chip next to the field (§9.3).
  - "Row gap" and "Column gap" unit rows.
- **Disabled reasons:** inline elements — vertical margin/padding fields disabled with "Inline elements ignore vertical spacing"; gaps disabled with "Enable flex/grid to use gaps" when not a flex/grid container.

### 6.6 TYPOGRAPHY
- **Shows for:** text-like elements (text, heading, paragraph, link, button, label, input, textarea, span, etc.).
- **Preview pill:** "Inter · 14px" (primary family · size).
- **Face:**
  - **Family** row → a 28px dropdown-style button showing the current font name *in that font* (or "Select font…"), with ▼/▲ on the right. Opens the **font picker panel** (§6.6.1).
  - **Size** row → pair "font size | line height". Font size unit field (px, em, rem, %, vw; default shows 16px) and line height (px, em, %, normal; placeholder 1.5). Hover titles "Font size" / "Line height". Each has a hover-reveal chain button to bind a type token (§9.1).
  - **Weight** select: Thin (100), Extra Light (200), Light (300), Regular (400), Medium (500), Semi Bold (600), Bold (700), Extra Bold (800), Black (900).
  - **Align** segmented (icons ⬅ ⬌ ➡ ☰; tooltips Left / Center / Right / Justify).
  - **Color** colour row (§8.5).
  - **Transform** segmented: "Aa" None, "AA" Upper, "aa" Lower, "Aa" Cap.
  - **Decoration** segmented: "—" None, "U̲" Under, "S̶" Strike, "O̅" Over.
  - **Letter** unit row (px, em, normal) — letter spacing.
  - **Word** unit row (px, em, normal) — word spacing.
- **More settings (5):** "Style" segmented (N Normal / I Italic); "White Space" select (Normal, No Wrap, Pre, Pre Wrap, Pre Line); "Word Break" select (Normal, Break All, Keep All, Break Word); "Text Indent" unit row; "Vertical Align" select (Baseline, Top, Middle, Bottom, Sub, Super).

#### 6.6.1 Font picker panel
- **Where:** drops directly under the Family row, full row width, rounded, bordered, max height 360px, scrolls inside.
- **Layout (top → bottom):**
  1. Search field, auto-focused, placeholder "Search fonts...".
  2. Category tabs (pill buttons, horizontally scrollable): "All", "Sans Serif", "Serif", "Display", "Monospace".
  3. Count line: "Showing 50 of 1400 Google fonts" (capped at 50 results).
  4. Groups (32px rows, name rendered in its own typeface, selected row accent-tinted):
     - **UPLOADED** (only if the site has uploaded fonts; each row shows "Uploaded" on the right).
     - **SYSTEM**: Inherit, System, Arial, Georgia, Times New Roman, Courier New.
     - **GOOGLE FONTS**: family name left, category (sans-serif / serif / display / handwriting / monospace) right.
     Uploaded and System groups only appear under "All" and "Sans Serif" tabs.
  5. Foot: accent text button "Manage site fonts" — closes the picker and opens the Site fonts screen.
- Picking a Google font loads it and closes the panel.

### 6.7 BACKGROUND
- **Preview:** a 14px colour swatch chip (tooltip = the value) when a colour/background is set.
- **Header action:** "+" (tooltip "Add background image") — opens the media picker; picking sets the background image.
- **Face:** segmented control "color / gradient / image" (capitalised on screen) choosing which editor is shown. The initial tab is derived from what's already set.
  - **Color:** "Fill" colour row.
  - **Gradient:** "Type" row → segmented "Linear / Radial"; "Color 1" and "Color 2" colour rows; **Angle** slider 0–360 with a "90°" readout (linear only). Only two stops — there is no multi-stop editor.
  - **Image:** "Image URL" text row (placeholder "https://...") with a "Browse" button beside it (tooltip "Browse media library"). Then **More settings (4)**: "Size" select (Auto, Cover, Contain, Stretch); "Position" select (Center, Top, Bottom, Left, Right, Top Left, Top Right, Bottom Left, Bottom Right); "Repeat" select (No Repeat, Repeat, Repeat X, Repeat Y); "Attachment" select (Scroll, Fixed (Parallax), Local); "Blend Mode" select (Normal, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge, Difference).

### 6.8 BORDER
- **Preview pill:** "1px solid" (width + style), or the shorthand, or "set".
- **Face:** "Width" unit row (px, em, rem); "Style" select (None, Solid, Dashed, Dotted, Double, Groove, Ridge, Inset, Outset); "Color" colour row.
- **More settings (8):**
  - Caption "Individual Borders": four text fields "Top", "Right", "Bottom", "Left" (placeholder "1px solid #ccc").
  - Caption "Outline" (above a rule): "Width" unit (px, em); "Style" select (None, Solid, Dashed, Dotted); "Color" colour row; "Offset" unit (px, em).
- **(Behind a hidden flag)** a schema-driven replacement exists: same essentials, then a disclosure button "▸ Individual borders & outline" that opens group headings "Individual Borders" and "Outline"; corner radius rendered as four "TL / TR / BR / BL" fields with a "Link / Linked" toggle; colour as a native 48px colour swatch. Only reachable by setting a local-storage key, so treat as not shipped.

### 6.9 CORNER RADIUS
- **Preview pill:** the radius value.
- **Body:** small caption "Radius" with an 18px link/unlink icon button on the right (tooltip "Link all corners" / "Unlink corners"; accent when linked — default linked). Below, a 2×2 grid of number fields each prefixed with a corner tag TL / TR / BL / BR (placeholder 0, px unit shown). Linked: typing in any corner writes all four; unlinked: each corner is separate.

### 6.10 EFFECTS
- **Preview pill:** the top two of: "2 shadows", "blur 4", "50%" (opacity), or "transform".
- **Rows (top → bottom):**
  1. **Opacity** slider 0–100 with "%" readout.
  2. Caption **Box Shadow** → preset tiles (4 per row): None, SM, MD, LG, XL, 2XL, Glow; then a free text field (placeholder "0 4px 6px rgba(0,0,0,0.1)").
  3. Caption **Inner Shadow** → tiles: None, Soft, SM, MD, Deep, Top, All; then a free text field (placeholder "inset 0 2px 4px rgba(0,0,0,0.1)"). Inner and outer shadows are combined automatically.
  4. Caption **Transform** → "Scale" slider 0–200 "x"; "Rotate" slider −180–180 "°"; "Move X" text (placeholder 0px); "Move Y" text; "Skew" slider −45–45 "°". Editing one keeps the others.
  5. Caption **Transition** → "Property" select (All, None, Transform, Opacity, Background, Color, Box Shadow); "Duration" text (placeholder 0.3s); "Delay" text (placeholder 0s); "Easing" select (Ease, Ease In, Ease Out, Ease In Out, Linear, Smooth).
  6. **Cursor** select: Auto, Default, Pointer (Hand), Move, Text, Wait, Help, Not Allowed, Crosshair, Grab, Grabbing, Zoom In, Zoom Out.
  7. Caption **Filters** (above a rule) → sliders "Blur" 0–20 px, "Brightness" 0–200 %, "Contrast" 0–200 %, "Grayscale" 0–100 %.
  8. **Blend Mode** select: Normal, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge, Color Burn, Difference, Exclusion.
  9. **Text Shadow** text (placeholder "2px 2px 4px rgba(0,0,0,0.3)").
  10. **Will Change** select: Auto, Transform, Opacity, Scroll, Contents.
- All selects begin with a "Default" (empty) option.

### 6.11 LINK
- **Shows for:** link, button, CTA.
- **Rows:**
  - "Link Type" select: No Link, Page, External URL, Email, Phone, Anchor.
  - **Page:** "Target Page" select ("Select a page...", then every page; the home page is prefixed 🏠). After choosing, a pale-accent hint: "Links to internal page. Will navigate when clicked in preview mode."
  - **External URL:** "URL" text (placeholder "https://example.com"). Error under the field: "⚠ URL must start with http:// or https://".
  - **Email:** "Email" text (placeholder "hello@example.com"). Error "⚠ Enter a valid email address".
  - **Phone:** "Phone" text (placeholder "+1234567890"). Error "⚠ Enter a valid phone number".
  - **Anchor:** "Anchor ID" text (placeholder "section-id"). Error "⚠ Anchor ID cannot contain spaces".
  - "Open In" select (Same Window, New Tab) — shown for every type except No Link, Email and Phone. New Tab also sets safe rel attributes.

### 6.12 INTERACTIONS
- **Purpose:** trigger-driven animations (runs on the GSAP runtime).
- **Empty state:** centred muted text "No interactions yet — click Add Interaction to trigger animations on hover, click, or scroll." above the button.
- **"+ Add Interaction"** full-width light button → replaces itself with the **Choose Trigger** card: title "Choose Trigger", × close, then four uppercase groups laid out as 2-column button grids (each button = emoji + label):
  | Group | Triggers |
  |---|---|
  | Element Triggers | 👆 On Hover · 🖱 On Click · 👇 While Pressed · 🎯 On Focus · 💨 On Blur |
  | Page Triggers | 📄 Page Load · 📜 Page Scroll · 👋 Page Leave |
  | Scroll Triggers | 👁 Scroll Into View · 🔄 While Scrolling · 👁‍🗨 Scroll Out |
  | Mouse Triggers | 🐭 Mouse Over · ➡️ Mouse Move · 🚪 Mouse Out |
  Picking one adds an interaction with defaults (Fade In, 0.3 s, 0 delay, Ease Out) and opens it for editing.
- **Interaction item** (grey rounded card, 50% opacity when disabled): header row = trigger emoji, trigger label, preset name in muted text, and a ▶ chevron that rotates when expanded. Click to expand/collapse.
- **Expanded editor:**
  - "Animation" select with 44 presets in six groups: **Fade** (Fade In, Fade Out, Fade In Up, Fade In Down, Fade In Left, Fade In Right); **Slide** (Slide Up, Slide Down, Slide Left, Slide Right, Slide In Up, Slide In Down); **Scale** (Scale Up, Scale Down, Scale In, Scale Out, Zoom In, Zoom Out); **Rotate** (Rotate, Rotate In, Rotate Out, Flip, Flip X, Flip Y); **Attention** (Shake, Bounce, Pulse, Wobble, Jello, Heartbeat, Flash, Rubber Band); **Special** (Blur, Glow, Swing, Tada, Hinge, Roll In, Roll Out).
  - "Duration" number (seconds, 0.1–10, step 0.1) and "Delay" number (seconds, 0–5, step 0.1) side by side.
  - "Easing" select: Linear, Ease, EaseIn, EaseOut, EaseInOut, Elastic, Bounce, Back, Expo, Circ.
  - Buttons: "Preview" (full width, plays it on the canvas); then "Enable" / "Disable" and red "Delete" side by side.
- **Actions/none:** there is no action picker (show/hide, scroll-to, open modal, toggle class) — an interaction is always "trigger → animation preset".

### 6.13 ANIMATION
- **Purpose:** a CSS keyframe animation that plays on the element (on load).
- **Preview pill:** the preset name when enabled (e.g. "fadeIn").
- **Toggle box** at the top: grey box reading "No Animation" with an "Enable" button; once on it turns accent-tinted reading "Animation Enabled" with a "Disable" button.
- **Off state tip** (amber box): "Click **Enable** above to add entrance, attention, or exit effects to this element. Choose from presets like fade, slide, bounce, and more."
- **On state — animation editor:**
  - Tabs "Entrance / Attention / Exit".
  - 3-column grid of 40px chips (active = solid accent):
    - Entrance: Fade In, Fade In Up, Fade In Down, Fade In Left, Fade In Right, Zoom In, Bounce In, Slide In Up, Slide In Down, Flip In X, Flip In Y, Rotate In.
    - Attention: Pulse, Bounce, Shake, Swing, Wobble, Flash, Heart Beat, Rubber Band.
    - Exit: Fade Out, Fade Out Up, Fade Out Down, Zoom Out, Slide Out Up.
  - Uppercase caption "TIMING": "Duration" slider 100–3000 ms (step 100); "Delay" slider 0–2000 ms (step 100); "Easing" select (Linear, Ease, Ease In, Ease Out, Ease In Out, Bounce, Elastic); "Iterations" number 1–10.
  - Full-width light button "▶️ Preview Animation" (restarts the animation on the canvas).
  - A monospace readout box, e.g. `animation: fadeIn 1000ms ease 0ms 1;` and below it a second dark "Generated CSS:" box with the same value.
- **Defaults:** Fade In, 1000 ms, 0 delay, ease, 1 iteration.

### 6.14 VISIBILITY
- **Preview pill:** amber "hidden on 2" when any breakpoint is hidden.
- **Body:** three rows "Show on Desktop", "Show on Tablet", "Show on Mobile", each with a tiny 22×12 switch (accent when on, grey when off; tooltips "Hide on Tablet" / "Show on Tablet").

### 6.15 ELEMENT PROPERTIES (the per-type settings section)
- **Shows for:** every element (there are always at least the three generic fields).
- **Field types:** text row, textarea row (60px min, resizable), select row (starts with "Default"), checkbox row (label, 16px checkbox, and the word "Enabled" / "Disabled" beside it).
- **Icon elements** get a full-width pale-accent button "🎨 Change Icon" (tooltip "Open icon picker") above the fields, with "Current: star" under it. Picking an icon sets its name, size, colour and stroke.
- **Image / Video source** rows get a "Browse" button beside the URL field (tooltip "Browse media library").
- **Form field name warning:** if a field's "Name" is one of `name`, `id`, `submit`, `action`, `method`, a warning appears under it: "“name” won’t survive publishing — it collides with a form property, so the field ships with no name and its answer is dropped from the submission. Try “fullname”." (suggestion becomes "full_" + word for the others).
- **Custom Data Attributes** block at the bottom (above a rule, caption "Custom Data Attributes"): two fields "data-*" and "value" and a solid "+" button (screen-reader "Add attribute"), hint "Add custom data-* or aria-* attributes". A key typed without a prefix is saved as `data-…`.

**Per-type fields** (the three generic rows "ID" (placeholder element-id), "Title" (placeholder Element title), "Tab Index" (placeholder 0) are appended to every type unless the type already defines that field):

| Element | Fields |
|---|---|
| **Link** | URL (https://...) · Open In: Same Window / New Tab / Parent Frame / Top Frame · Rel (noopener noreferrer) · Title (Link title) |
| **Button** | Button Label (textarea, "Button text") · Link URL · Open In: Same Window / New Tab · Button Type: Button / Submit / Reset · Disabled ☐ |
| **Image** | Image URL (+ Browse) · Alt Text ("Image description") · Title ("Image title") · Loading: Lazy / Eager · Decoding: Auto / Sync / Async |
| **Heading** | Heading Text (textarea, "Enter heading...") · Level: H1–H6 (changes the tag) |
| **Text** | Text Content (textarea, "Enter text...") |
| **Paragraph** | Paragraph Content (textarea, "Enter paragraph...") |
| **Label** | Label Text (textarea, "Field label") |
| **Video** | Video URL (+ Browse) · Poster Image · Autoplay ☐ · Loop ☐ · Muted ☐ · Show Controls ☐ · Plays Inline ☐ · Preload: Auto / Metadata / None |
| **Input** | Input Type: Text, Email, Password, Number, Phone, URL, Date, Time, Date & Time, Search, File, Hidden, Checkbox, Radio, Range, Color · Name (field_name) · Placeholder (Enter text...) · Default Value · Required ☐ · Disabled ☐ · Read Only ☐ · Autocomplete: On / Off / Name / Email / Phone |
| **Textarea** | Name · Placeholder · Default Value (textarea) · Rows (4) · Columns (50) · Required ☐ · Disabled ☐ · Read Only ☐ · Max Length |
| **Select** | Name · Options (one per line) (textarea, "Option 1 / Option 2 / Option 3") · Required ☐ · Disabled ☐ · Multiple ☐ |
| **Form** | Action URL (/submit) · Method: POST / GET · Encoding: URL Encoded / Multipart (File Upload) / Plain Text · Disable Validation ☐ · Autocomplete: On / Off |
| **Iframe / Embed** | URL · Title (Embed title) · Width (100%) · Height (400) · Loading: Lazy / Eager · Allow Fullscreen ☐ |
| **Columns** | Number of Columns: 2–6 Columns (adds/removes column children) · Gap Between Columns: None / Small (8px) / Medium (16px) / Large (24px) / Extra Large (32px) |
| **Icon** | Change Icon button · Icon Size: 16px (XS) / 20px (S) / 24px (M) / 32px (L) / 48px (XL) / 64px (XXL) · Stroke Width: Thin (1) / Light (1.5) / Normal (2) / Medium (2.5) / Bold (3) |
| **Everything else** (container, section, navbar, menu, footer, slider/carousel, accordion, tabs, modal, map, social, countdown, list, collection list, rich text, card, hero, pricing, table, spacer, divider, progress, product-*) | Only the generic ID / Title / Tab Index |

- **Not built (visible gap):** there is no dedicated settings UI for navbar (menu items, logo, sticky), slider (slides, autoplay, arrows/dots), accordion (items, single/multiple), tabs, modal (open trigger, close behaviour), map, social, countdown, list, collection list, rich text, or a "Content: Static / From CMS" block. A spec table for these lives in code but nothing renders it. Content binding for any element is done via the header chain-link popover (§2.3).
- **Accessibility fields present:** Alt Text (image), Title, Tab Index, custom aria-* attributes via the data-attribute editor. No dedicated ARIA label / role fields.

### 6.16 CSS CLASSES
- **Body:** a wrapping row of monospace chips ".hero", ".card" (the first chip is accent-tinted as the primary class), each with a small × (screen-reader "Remove class hero"). A dashed "+" chip (tooltip "Add class") turns into an inline chip input (placeholder "class-name", prefixed with a faint "."). While typing, a suggestion list (up to 8, from the project's stylesheet classes) drops below; clicking one adds it. Enter adds, Escape cancels, blur adds if non-empty. Duplicates are silently ignored.

### 6.17 ALL CSS (dev mode only)
- **Gate:** only when the hidden dev-mode local-storage key is set. Hidden for normal users.
- **Body:** every inline style on the element as a row "property-name  [value]  ✕" (tooltip "Remove property"); empty state "No inline styles applied". Below a rule: two fields "property-name" and "value" and an "Add" button (disabled until a name is typed; Enter in the value field adds).

---

## 7. Shared input controls (behaviour reference)

### 7.1 Number-with-unit field
- 28px field: optional leading glyph (W, H, min, max, gap icon), the number, and a unit dropdown on the right in lowercase monospace (default list px, %, em, rem, vw, vh, auto; sections override the list).
- Choosing "auto" / "none" / "inherit" replaces the number with that word in muted italic and makes the text read-only until another unit is chosen.
- **Typing:** only digits, "." and a leading "-" are accepted; anything else turns the border red with tooltip "Invalid number — press Escape to revert" and is not written. Valid keystrokes write immediately (debounced 300 ms into one undo step).
- **Keyboard:** Enter = commit and blur; Escape = revert to the last value and blur. **There is no arrow-key nudging, no Shift-nudge, and no drag-to-scrub** anywhere in the inspector.
- **Reset:** hovering a field that has a value reveals a tiny × inside it (tooltip "Reset Width"); clicking clears the value (returns it to inherited/default).
- **Bound state:** when the value is a design token, the number area shows the token reference and the chain button turns into the bound pill (§9.1).

### 7.2 Select rows
- 28px dropdown frame with a small chevron; first option is always "Default" (writes nothing). Selects are native.

### 7.3 Segmented rows
- 28px grey track with 2px padding; the chosen segment is a white raised chip in bold. Segments show either an icon (⬅ ⬌ ➡ ☰, Aa/AA/aa, —/U/S/O, N/I) with the name as tooltip, or the short text itself. Compact variants are 22px tall with three-letter abbreviations ("sta", "cen", "end", …).

### 7.4 Linked gap control (Flexbox)
- Label "Gap" with a 16px link / broken-link icon beside it (tooltips "Unlink row and column gap" / "Link row and column gap"). Linked: one field with a gap glyph. Unlinked: two fields with "R" and "C" glyphs (screen-reader "Row gap" / "Column gap"). Typing a bare number writes px.

### 7.5 Colour row
- 28px frame containing: an 18px **swatch** (checkerboard under transparent colours; this is the button that opens the picker, screen-reader "Choose Color color"), the **hex** typed without "#" (placeholder "000000"; accepts 3/6-digit hex, values starting with "#", and the words transparent / inherit / currentColor), and — only when a value is set — an **eye** toggle (tooltips "Hide color" / "Show color"; note: this only flips the icon, it does not currently write anything).
- **Bound state:** the frame turns accent-tinted; a small link icon and the token **name** in accent replace the hex; an unlink icon button (tooltip "Unlink token") resolves the token to its current hex. Immediately after unlinking, a "relink" link icon appears (tooltip "Relink to Primary") to undo that unlink; it disappears once the value changes or the selection changes.
- A green **token chip** (§9.3) sits to the right of the frame while bound.
- In the batch panel the hex placeholder becomes "Mixed".

### 7.6 Sliders
- 4px track with the current value on the right in tabular figures with its unit ("50%", "1.2x", "45°", "4px"). Labels are clickable to focus the slider.

### 7.7 Switches
- 22×12 pill switch, accent when on, grey when off, white 8px thumb.

### 7.8 Chips / presets
- Preset tiles: grey rounded tiles in a 4-column grid, accent-tinted with accent border when active, white on hover.

---

## 8. Colour / token picker popover

- **Opens from:** the swatch in any colour row (colour tokens, swatch grid) and from the chain buttons on Width, Height, Font size, Line height (spacing / type tokens, list layout).
- **Size / look:** 236px wide, rounded, bordered, overlay shadow.
- **Tabs:** "Tokens" and "Custom" (the Custom tab is omitted where a raw value is not allowed).
- **Tokens tab:**
  - Search field, auto-focused, placeholder "Search tokens…".
  - **Colour tokens:** a 4-column grid of 46×30 swatches with the token name under each (truncated); selected = accent border + tint; keyboard-focused = tint. Tooltip "Primary: #1A56DB".
  - **Spacing / type tokens:** a single-column list — token name left, monospace value badge right ("16px", "1.25rem").
  - **Empty state (no tokens at all):** 🎨 icon at 40% opacity, "No color tokens yet" (or spacing / type), and "Add tokens in the Design tab".
  - **Empty state (search):** "No tokens found".
  - **Keyboard:** ↑/↓ move by row (4 at a time in the grid), ←/→ move within the grid, Enter selects, Escape closes.
  - Selecting binds the property to the token (the element stores a reference, not the raw value).
- **Custom tab:** caption "Enter any CSS color value"; a 46×30 live preview swatch and a text field (placeholder "#000000", auto-focused); Enter or blur applies; foot note "Accepts hex, rgb(), hsl(), or any CSS keyword".
- **Not present:** no Brand / Recent / Custom rows, no eyedropper, no RGB/HSL sliders, no alpha slider, no gradient stop editing, no image-fill picker inside the popover, no "Update everywhere (N×)" confirmation.

---

## 9. Token binding chips and chain buttons

### 9.1 Chain button (Width, Height, Font size, Line height)
- **Unbound:** a small link icon that is **invisible until you hover the row** (or focus into it). Tooltip "Link to spacing token" / "Link to type token". Click → token picker (list layout) anchored bottom-right.
- **Bound:** always visible accent-outlined pill inside the field showing a link icon, the token name (truncated to ~48px) and a faint broken-link glyph. Tooltip "Unlink "space-16" — resolves to current value". Click → replaces the token with its resolved value.

### 9.2 Colour row bound state — see §7.5.

### 9.3 Design-system binding chip
- A 20px pill, 11px medium text, appears beside a bound colour row or a bound margin/padding side:
  | State | Look | Text | Click |
  |---|---|---|---|
  | Bound to token | green tint, green border | the token id, e.g. "color-primary" | Opens the Design panel (screen-reader "Jump to token color-primary in Design tab") |
  | Bound to preset | blue tint | preset id | Opens the Design panel |
  | Off-design-system value | amber tint, "⚠" only (the value itself is not repeated) | — | "Click to bind to a token". In **Beginner mode** a dotted-underlined "Bind to token" link is added beside it. |
  In practice the inspector only renders the green "token" state; the amber and blue states exist as a component but no row currently shows them.

---

## 10. Reach, breakpoints and states — how edits land (visible rules)

- **Three breakpoints:** Desktop (base, no width limit), Tablet (≤1023px), Mobile (≤767px). Desktop-first: a Tablet override also applies on Mobile unless Mobile overrides it too. The canvas preview shows overrides when the matching device is chosen.
- **Five states:** Base, :hover, :focus, :active, :disabled — per breakpoint. Overrides are written per element, never as global classes.
- **What a row shows:** the effective value for the chosen breakpoint + state; unset rows show what the element actually renders (on Desktop/Base) rather than a type default; colour rows keep the type default when unset.
- **Override signals:** accent dot on the breakpoint pill, accent dot after the label of an overridden row, the "Overridden on Tablet — Base is …" rows, and the dot in the state menu.
- **Undo:** every inspector change is one undo step, including a fan-out to peers under "All like this", a four-side linked spacing write, a batch write across a multi-selection, and a breakpoint revert.
- **Classes:** the CSS classes section adds/removes class names; class-based rules are read from the project stylesheet for suggestions. There is no per-class style editor in the inspector.
- **Global style presets** (Primary Button, Secondary Button, Heading 1, Heading 2, Body Text, Container, Card) exist in the engine but are **not surfaced anywhere in the inspector**.

## 11. Disabled-reason strings (tooltips on greyed rows)
| Rows | Reason shown |
|---|---|
| width, height, min/max width, min/max height on inline elements | "Inline elements ignore width/height" |
| margin-top/bottom, padding-top/bottom on inline elements | "Inline elements ignore vertical spacing" |
| gap, row-gap, column-gap when not flex/grid | "Enable flex/grid to use gaps" |
| grow, shrink, basis, align-self, order when parent is not flex | "Applies only to flex items" |
| top / right / bottom / left / z-index when position is static | "Set position to relative/absolute/fixed to edit offsets" |
| Object Fit on non-media | hidden entirely |

## 12. Colour mode (light / dark)
- The engine stores a colour-mode preference (Light / Dark / System, resolved against the OS setting) and design tokens can carry a separate dark value; when a token lacks a dark value the engine notes it internally.
- **There is no light/dark toggle, per-mode value, or "missing dark value" warning in the Inspector.** The planned "warn chip" for missing dark values is explicitly not built yet. Any colour-mode switch lives elsewhere (Design/Brand panel or top bar), not in this panel.

## 13. Beginner / Pro and "show all"
- A **Beginner / Pro** mode exists (toggled in the Design/Brand panel, remembered per browser). In the Inspector it only affects two things: the "Detach instance" button appears in Pro only, and the "Bind to token" hint beside an off-system chip appears in Beginner only. There is no "Show all" tier toggle in the panel; progressive disclosure is per-section "More settings" plus the URL-driven simplified density (§5.3).

## 14. Things the brief asked about that do not exist in this module
- No Style / Settings / Effects tab strip (one flat list instead).
- No element rename in the header, no breadcrumb, no locked-element state.
- No colour-mode toggle; no per-mode colour values in rows.
- No eyedropper, alpha, RGB/HSL inputs, multi-stop gradient editor, or image fill inside the colour picker.
- No "Update everywhere (N×)" confirmation when editing a swatch (token edits happen in the Design panel).
- No interaction *actions* (show/hide, scroll to, open modal, toggle class) — only animation presets.
- No arrow-key / Shift nudging or scrubbing on numeric fields.
- No per-type settings for navbar, menu, footer, slider, accordion, tabs, modal, map, social, countdown, list, collection list, rich text; no "Static / From CMS" content block in the settings section (binding is via the header popover only).
- No dedicated ARIA label / role rows (only via custom attributes).
- No Custom CSS / custom code section for normal users (All CSS is dev-mode only).

---

# Brand / Design System panel

**What this module is.** The "Brand" panel is the left-drawer surface where a site owner defines the site's design system: colours, fonts, spacing, radius, shadows and eleven other kinds of "token" (a named, reusable value such as *Primary = #1A56DB*), reusable component style presets (e.g. "Primary button"), whole-brand starting points ("starters"), light/dark colour values, a brand linter that flags rule violations, and import/export of the whole token set. Everything edited here is *staged* first (a "Draft" state, live-previewed on the canvas) and only reaches the site when the user reviews and saves. Tokens defined here show up as chips in the right-hand inspector, drive the canvas via CSS variables, and are exported with the published site.

---

## 1. Reaching the panel

- **Left rail → "Brand"** (palette icon, in the bottom "config" group). Tooltip / accessible label: "Brand — global colors, fonts, spacing tokens". Keyboard shortcut: **B**.
- **Site menu (top-left) → "Brand"** row — same destination.
- Opens as the standard left drawer (320 px wide; the header's expand control widens it to 700 px).
- Other doors that land here: the Issues panel / topbar Issues chip (brand lint findings), the Components tab's "switch to Brand" affordance, the inspector token picker's hint "Add tokens in the Design tab".

---

## 2. Panel frame — present on every Brand screen

### 2.1 Header
- **Where it lives:** top of the drawer, 44 px.
- **Contents:** title "Brand" (constant on every screen, at every depth) · right-side icon buttons: **Expand/Collapse** ("Expand Brand" / "Collapse Brand", toggles the 700 px wide drawer), **Help**, **Close** ("Close Brand").
- **Status chip** (left of the icons, announced to screen readers):
  - `All saved` — green pill, when nothing is staged.
  - `Draft` — amber pill with a small pulsing amber dot, when any change is staged. (A count is tracked but not printed on the chip.)

### 2.2 Mode row (root screen only)
- **Where:** directly under the header, 40 px, 1 px rule beneath.
- **Contents:** a two-segment radio group labelled "Design system display mode": **"Beginner"** · **"Pro"** (24 px tall pills; selected = filled accent blue with white text; unselected = white with grey stroke). Beside it a one-line grey hint that changes with the mode:
  - Beginner: "Friendly · hides token IDs and empty foundations"
  - Pro: "Full power · token IDs, every kind, off-DS allowed silently"
- **Behaviour:** display-only; flips instantly with no data loss; remembered per user (browser), not per project. Default is Beginner.
- **What the mode changes (summary — details in each section):**

| Surface | Beginner | Pro |
|---|---|---|
| Root row counts | Tokens, Presets, Starters only | + Classes, Component styles |
| Root footnote | "Beginner hides token IDs and empty foundations. Switch to Pro to show them." | none |
| Tokens list | only *semantic* tokens are listed (today that is the 4 semantic colours; every other kind reads 0); empty "foundation" kinds fold behind "More token kinds" | every token, every kind, no folding |
| Token rows | name + value | + monospace token ID and "→ alias" arrow |
| Token detail | name only; Delete disabled + blue notice | ID + CSS variable shown; Delete enabled |
| Colour list | "Primitives" group hidden; empty state explains what is hidden | all groups |
| Brand preview swatches | semantic colours only | all colours |

### 2.3 Back row (inside any destination)
- 36 px row, left-aligned accent-blue link with a chevron: **"‹ Tokens"**, "‹ Presets", "‹ Starters", "‹ Classes", "‹ Component styles", "‹ Typography", "‹ Colour mode", "‹ Lint", "‹ Import / export". Inside a token kind it reads **"‹ Tokens · color"** (kind name appended). Back walks *one* level: out of the open kind first, then to the root. Hover underlines.

### 2.4 Status pill band (under the back row, when applicable)
One bordered pill per screen, 16 px inset: `Draft preset` (grey) · `Exported CSS` / `Exported JSON` / `Exported Tailwind` (green) · `Imported tokens` (green) · `Import failed` (red) · `Starter applied` (green) · `Warnings suppressed` (amber, root only).

### 2.5 Footer save bar
- **Where:** pinned to the drawer bottom, 44 px.
- **Clean state:** grey band, single status line "Brand is up to date". No buttons.
- **Dirty state:** amber-tinted band, status "Unsaved brand changes" (amber text) and two text actions on the right: **"Discard"** (grey link) and **"Save"** (accent link).
- **Save →** opens the *Review changes* modal (§13). **Discard →** reverts every staged token and preset change and shows an info toast "N changes discarded" with an **"Undo"** action that re-stages the same edits.

### 2.6 Panel error state
If the brand system fails to load: title "Couldn't load your brand system.", body "Your tokens are safe — only this list failed to load.", link **"Try again"**.

### 2.7 Toasts and cross-window behaviour (whole panel)
- "Design tokens applied successfully" (success) after a save.
- "Failed to apply tokens. Try again." (error) if the save fails.
- "Design tokens changed from another window. Your edits may conflict." (warning) — another tab saved while this one has staged edits; without staged edits the panel silently reloads.
- "Canvas undo/redo — your unsaved design token edits were kept." (info) — a canvas Cmd+Z fired while brand edits were staged; without staged edits the panel reloads from the project.
- Staged brand edits survive navigating between sections, closing the drawer and even switching tabs — only Discard (or the review modal's "Discard all") throws them away.
- The topbar's global "Saved" indicator is told about brand dirtiness so it does not read "Saved" over staged brand work.

---

## 3. Brand root (home screen)

- **Where it lives:** the drawer body when no destination is open.
- **Purpose:** show what the brand looks like, then list the nine places to change it.
- **Layout, top to bottom:**
  1. *Mode row* (§2.2).
  2. `Warnings suppressed` pill — only when the user has pressed "Ignore" on at least one lint finding.
  3. **Brand preview band** (16/12 inset): a row of up to 10 colour swatches (20 px squares, grey hairline; hover title "Name — #HEX"), a "+N" grey count if more colours exist, then two type specimens on their own lines: a large "Aa" set in the heading font with the label "Heading", and "Aa" in the body font with the label "Body". The preview follows staged (unsaved) edits live. It is *not* a control — nothing here is editable.
  4. **Nine destination rows** (52 px each, full-width, chevron "›" at the right, hover grey). Each has a 13 px label, an 11 px grey hint under it, and — where the number is real — a monospace count beside the chevron:

| Row label | Hint | Count shown |
|---|---|---|
| Tokens | Colours, type, spacing | number of tokens visible in the current mode (Pro ≈ 56, Beginner 4) |
| Presets | Component style presets | 18 |
| Starters | Whole-brand starting points | 6 |
| Classes | Names shared across elements | number of distinct CSS classes on the site (Pro only) |
| Component styles | What the brand ships | 27 (Pro only) |
| Typography | The fonts this site uses | — |
| Colour mode | Light and dark values | — |
| Lint | What breaks the brand | number of open lint findings (hidden when 0) |
| Import / export | Move the brand in and out | — |

  - A 5 px amber dot after "Tokens" or "Presets" when that section holds staged edits (accessible label "unsaved changes").
  5. **Beginner footnote** (Beginner only, grey band at the bottom of the list): "Beginner hides token IDs and empty foundations. Switch to Pro to show them."
- **Actions:** click a row → that destination (back row appears). Toggle mode. Hover a swatch for its name/value.

---

## 4. Tokens destination

### 4.1 First-run banner
When the project has never saved brand tokens, a blue-tinted card sits at the top of the Tokens screen: "These are your site's default design tokens. Customize them and click **Save** to go live."

### 4.2 Kind list (Tokens root)
- **Layout:** one 32 px row per token *kind*, lowercase label, right side shows a monospace count and "›". An amber dot after the label when that kind has staged edits.
- **Order and default counts (Pro):** color 18 · spacing 9 · radius 2 · typography 11 · shadow 2 · motion 2 · border 1 · opacity 2 · z-index 2 · breakpoint 2 · grid 1 · sizing 2 · icon 1 · imagery 1.
- **Beginner:** the first six (color, spacing, radius, typography, shadow, motion) always list; the eight "foundation" kinds (border, opacity, z-index, breakpoint, grid, sizing, icon, imagery) fold behind a disclosure row when they have no visible tokens: **"More token kinds"** (11 px accent link, count "8", chevron "›") → expands to list them and the row reads **"Fewer token kinds"** ("⌃"). Because Beginner lists only semantic tokens, every kind except color currently reads 0.
- **Beginner note** (blue card under the list): "Beginner mode hides token IDs and alias graph. Toggle Pro to expose."
- **Action:** click a kind → that kind's list; the back row becomes "‹ Tokens · <kind>".

### 4.3 Shared token row (used by Color and the drill-in)
44 px row, grey hover, click/Enter/Space opens the token detail (§4.8):
- Left: preview slot (16 px colour swatch — light colours get a darker hairline; a 5 px amber dot on the swatch when staged).
- Middle: name (13 px) · value in monospace grey (e.g. `#1A56DB`) · **Pro only:** monospace token ID line (e.g. `color-action`) with an accent "→ color-brand-500" arrow when the token aliases another.
- Right: usage chip — green `used 12×` or grey `unused` — plus an amber `[lint]` tag if the token has an open lint finding.
- **Lint state:** row turns amber-tinted with a 3 px amber left border and an italic amber line "△ <finding message>".

### 4.4 Color kind screen
- **Toolbar:** search field (placeholder "Search colors…") · filter pills **"All"** (accent when active) and **"Issues"** / **"Issues (N)"** (red when active; tooltip "N tokens fail WCAG AA").
- **Dark-missing chip** (only while the canvas is in dark mode and ≥1 colour has no dark value): amber pill "⚠ N tokens missing dark variant" → click opens the first such token's detail.
- **Issues filter banner** (when Issues is active and N > 0): red-tinted card "N tokens with low contrast — fails WCAG AA." with a green **"Fix all (N)"** button that applies the suggested replacement to every failing colour.
- **Pass state** (Issues active, nothing failing, no search): large "✓", "All colors pass WCAG", "No contrast issues found".
- **Empty states:** with a search → `No colors match "query"`; in Beginner with colours hidden → "Beginner mode is hiding N colors." / "They are primitives. Switch to Pro to see them."; truly empty → "No colors yet." with link **"+ Add a color"**.
- **Groups** (each with an uppercase mono header, a rule, an optional mono mini-value, and a one-line description):

| Group header | Description | Default tokens (light value / dark value) |
|---|---|---|
| Semantic | "Role-named tokens — Buildrick's recommended palette." | Action #1A56DB → aliases Brand 500 · Surface #F8FAFC → Slate 50 · Text Primary #334155 → Slate 700 · Feedback Error #EF4444 → Red 500 |
| Brand color (mini shows the first value) | "Primary palette — used for CTAs, links, and key UI elements." | Primary #1A56DB / #60A5FA · Secondary #64748B / #94A3B8 · Accent #15803D / #4ADE80 |
| Surface | "Background layers and card fills." | Background #F8FAFC / #0F172A · Text #334155 / #E2E8F0 · Muted #71717A / #A1A1AA · Border #27272A / #3F3F46 |
| States | "Feedback colors — success, error, warning, info." | Success #15803D / #4ADE80 · Warning #8E4B10 / #FACA15 · Error #EF4444 / #F87171 |
| Primitives (Pro only) | "Raw color scale — semantic tokens alias these. Pro mode only." | Brand 500 #1A56DB · Slate 50 #F8FAFC · Slate 700 #334155 · Red 500 #EF4444 |

- **Fix suggestion rows** (Issues filter only, under each failing token): mono "Name · 2.1:1 → 4.5:1", a 12 px swatch of the proposed colour, the proposed hex, and a green **"Fix"** button. Contrast is measured against the site's own Background token (dark value when in dark mode), never against the editor.
- **"+ Add token"** — dashed full-width button at the bottom → *Add color token* modal (§4.10).
- Contrast is also what the Lint destination reports, so the Issues count here and the Lint row on the root always agree.

### 4.5 Typography kind screen
- Intro line: "One type scale for the whole site. The toggle below previews how it reads on a narrow screen; it does not set separate mobile sizes."
- **Preview toggle:** two buttons with icons — **"Desktop preview"** (monitor icon) and **"Mobile preview (85%)"** (phone icon). Tooltip on the group: "Preview only. The site does not resize type by itself — for a different size on phones, select the element and set it at the Mobile breakpoint."
- **Preview band** (grey card): "Heading 1" (heading font, 4XL size, bold), "Heading 2" (heading font, 3XL), "Body text — the quick brown fox jumps over the lazy dog." (body font, base size), right-aligned caption "Live preview — updates as you type". Mobile preview scales the specimens to 85 %.
- **"Fonts" section** — one row per font token (defaults: Heading Font = Inter, Body Font = Inter, Mono Font = Geist Mono): name, a specimen "Aa Bb Cc 123" set in that font, warning "Font unavailable — may fall back to system font" if the browser cannot load it, a **dropdown** of families (Inter, Roboto, DM Sans, Geist, Montserrat, Playfair Display, Merriweather, JetBrains Mono, plus the current value if it is something else), and the usage chip. Clicking the name opens the token detail.
- **"Text Sizes" section** — one row per size token:

| Row label | Token ID | Default | Preview text |
|---|---|---|---|
| Caption | font-size-xs | 12px | "Caption text XS" |
| Caption | font-size-sm | 14px | "Caption text" |
| Body | font-size-base | 16px | "Body text" |
| Body LG | font-size-lg | 18px | "Body large text" |
| Sub-heading | font-size-xl | 20px | "Sub-heading text" |
| Heading 3 | font-size-2xl | 24px | "Heading 3" |
| Heading 2 | font-size-3xl | 30px | "Heading 2" |
| Heading 1 | font-size-4xl | 36px | "Heading 1" |

  Each row: label + ID (click → detail) · number input (1–200) with unit label "px" · **B** / **I** toggles (preview-only bold/italic, accent when on; tooltips "Toggle B" / "Toggle I") · live preview text at that size · "⚠" (tooltip "Extreme font size may break layout") when < 8 or > 128 · **↩** Undo / **↪** Redo icon buttons (only when available) · usage chip.

### 4.6 Spacing kind screen
- **Preset chips** (pill row): **"Compact (2px)"**, **"Normal (4px)"**, **"Spacious (6px)"** (active = accent outline/tint) and, right-aligned, **"Reset defaults"** (tooltip "Reset all spacing to factory defaults"). Editing any value by hand clears the active preset. Reset defaults stages the factory values and toasts "Spacing reset to defaults — review and Apply to save."

| Preset | Space 1 / 2 / 3 / 4 / 5 / 6 / 8 / 10 / 12 |
|---|---|
| Compact | 2 / 6 / 8 / 12 / 16 / 20 / 24 / 32 / 40 |
| Normal (default) | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 |
| Spacious | 6 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 |

- **Warning banner** when a preset differs from the saved one: "⚠ 9 spacing tokens updated. Review before applying."
- **"Scale" header** with a rule and the mono note "4-pt grid".
- **Value chips:** a wrapping grid of small mono pills showing the number only (4, 8, 12 …); active chip = accent. Under each chip is its usage chip (click it → token detail; right-click the chip group also opens detail).
- **Inline edit drawer** (click a chip): grey card with the token name, a number input (0–999, unit "px"), "⚠" (tooltip "Zero spacing will collapse layout gaps") when the value is 0, **↩** / **↪** undo/redo when available, and **×** to close.

### 4.7 Other kinds (Radius · Shadow · Motion · Border · Opacity · Z-index · Breakpoint · Grid · Sizing · Icon · Imagery)
- **Layout:** one row per token in a 4-column grid: name (Pro adds a mono "id · --css-variable" line; click → detail) · monospace text input (border turns amber when staged) · **"Restore"** button (enabled only when there is something to undo) · usage chip (+ `[lint]` tag). Lint rows get the amber tint and "△ message" line.
- **Empty:** "No tokens yet — defaults will appear once seeded."
- **Default tokens:**

| Kind | Tokens (friendly name = value) |
|---|---|
| Radius | Small radius = 4px · Medium radius = 8px |
| Shadow | Small shadow = 0 1px 2px rgba(15,23,42,0.04) · Medium shadow = 0 4px 12px rgba(15,23,42,0.08) |
| Motion | Fast motion = 150ms ease-out · Slow motion = 300ms ease-in-out |
| Border | Default border = 1px solid |
| Opacity | 50% opacity = 0.5 · 80% opacity = 0.8 |
| Z-index | Dropdown z-index = 1000 · Modal z-index = 1050 |
| Breakpoint | Tablet breakpoint = 768px · Desktop breakpoint = 1024px |
| Grid | 12-column grid = 12 |
| Sizing | Container max width = 1200px · Prose max width = 65ch |
| Icon | Default icon size = 16px |
| Imagery | Placeholder image = https://placehold.co/600x400 |

### 4.8 Token detail screen (any kind)
- **Where:** replaces the kind list inside Tokens.
- **Layout, top to bottom:**
  1. Ghost link **"← Back to tokens"**.
  2. Header: 24 px preview (colour swatch / "Aa" in the font / a spacing bar / neutral chip) · name (16 px semibold) · **Pro:** mono token ID and mono CSS variable (e.g. `--buildrick-design-color-primary`).
  3. **"Light value"** field row: monospace text input (edits stage immediately). For colour tokens the inline *Colour picker* (§4.9) opens under it when "Replace value" is pressed. For font-family tokens a **font family picker** button sits above the input (§4.11).
  4. **"Dark value"** (colour tokens only): mono input, placeholder "+ add (currently falls back)" when empty; commits on blur.
  5. **"Used by"**: "N elements" / "1 element" (disabled when 0). With usage, a "▸/▾" disclosure expands a list of rows "Heading · background-color" (element type + property); clicking a row **selects that element on the canvas**.
  6. **"Aliased by"** (only when other tokens point at this one): "N · Action, Surface".
  7. **"Lint"**: green "✓ pass", or amber "△ <message>" with buttons **"Auto-fix"** (only when the finding carries a fix hint — no rule produces one today, so it never appears) and **"Ignore"** (suppresses this token's findings; remembered in the browser; adds to the root's "Warnings suppressed" count).
  8. **Action row** (13 px text links): **"Replace value"** (accent; opens the colour picker for colours, otherwise just focuses the input) · **"Rename ID"** (accent; opens a plain browser prompt "Rename token ID:" pre-filled with the current ID; the old ID is kept as a hidden bridge so existing bindings keep working; tooltip "Rename token id"; disabled with tooltip "Rename API coming soon — edit value inline above" for kinds without rename) · **"Delete token"** (red; **disabled in Beginner**).
  9. **Beginner notice** (blue card): "**Delete blocked in Beginner mode.** Pro shows replace-with / cascade-clear when N elements bind."
- **Delete flow (Pro):** 0 consumers → deleted immediately and back to the list. ≥1 consumer → *Replace token* modal (§4.12). Type and Spacing tokens cannot be deleted or renamed (the buttons no-op / are disabled).
- If the token disappears while open (deleted elsewhere), the view falls back to the list.

### 4.9 Colour picker (inline)
- Grey card containing: a 128 px **saturation/brightness canvas** with a round crosshair · a 12 px **hue slider** with a round knob · a 12 px **alpha slider** on a checkerboard, with a "NN%" label to its right · a row with a 28 px swatch preview, a **hex field** prefixed "#" (up to 8 characters, uppercase as you type; red border on invalid input) and a **contrast badge** "4.6:1" (tooltip "Contrast ratio: 4.6:1") · error "Enter a valid hex like #3B82F6" · warning "Background has transparency — contrast may not be accurate" when alpha < 80 % · buttons **"Cancel"** and **"Set color"** (primary; disabled while the hex is invalid).
- Dragging updates the canvas live; "Set color" commits to the token. (No tabs, no palettes, no eyedropper.)

### 4.10 Add color token modal
- **Where:** overlay inside the panel (dark scrim). Title "Add color token".
- **Fields:** "Token name" (placeholder "e.g., Purple") · "Hex value" with a 32 px live swatch and mono input (default "#3B82F6").
- **Errors:** "Name is required" · "A token with this name already exists" · "Enter a valid 6-digit hex color".
- **Buttons:** "Cancel" · "Add token" (primary). Success toast: `Token "Name" added`. The token lands in the Brand group, staged.

### 4.11 Font family picker (token detail, font-family tokens only)
- Full-width 32 px button showing the current family *set in that family* (or "Select font..."), with ▼/▲.
- Opens the shared font listbox (240 px, hangs from the right edge): **search** ("Search fonts...") · **category tabs** All / Sans Serif / Serif / Display / Monospace · count line "Showing N of M Google fonts" · groups **"Uploaded"** (fonts added under Site fonts; each row tagged "Uploaded"), **"System"** (Inherit, System, Arial, Georgia, Times New Roman, Courier New), **"Google Fonts"** (family name + category, up to 50 matches) · foot link **"Manage site fonts"** → opens the *Site fonts* dialog (media module: upload .woff2 etc., search, "Font added", "No fonts found").
- Picking writes the bare family name (e.g. "Playfair Display") into the token.

### 4.12 Replace token modal (delete with consumers)
- Title "Replace <Name>?" · body "N consumers reference this token. Pick a replacement and Buildrick will redirect every binding via the rename bridge — no consumer breaks."
- Radio-style list of same-kind tokens (name + mono ID; selected = accent border). Empty: "No same-kind tokens available. Add one first, then come back to delete."
- Buttons **"Cancel"** · **"Delete and replace"** (red, disabled until a pick).

---

## 5. Presets destination ("Presets" row)

- **Purpose:** the reusable component style presets — each maps CSS properties to tokens.
- **List screen:** 11 rows (44 px): category name left, "N variants" / "1 variant" grey right. Rows with zero presets are dimmed and not clickable. A `Draft preset` pill shows under the back row when any preset is staged.

| Category row | Default variants (friendly name) and bindings |
|---|---|
| Button | primary "Primary button" (background → Primary, text → Background, radius → btn-radius, padding X → btn-padding-x, height → btn-height-md, font size → btn-font-size, weight → btn-font-weight) · secondary "Secondary button" · ghost "Ghost button" |
| Card | elevated "Elevated card" (Background, radius-lg, shadow-md) · flat "Flat card" (Background, radius-lg, border-default) |
| Form input | default "Text input" (input-border, input-radius, input-padding-x, input-height, font-size-base) |
| Link | default "Default link" (Primary) · muted "Muted link" (Muted) |
| Badge | success "Success badge" · error "Error badge" (state colour, Background text, radius-full) |
| Alert | info "Info alert" · error "Error alert" |
| Tooltip | default "Tooltip" (Text bg, Background text, radius-sm, font-size-sm) |
| Modal | default "Modal panel" (Background, radius-lg, shadow-xl, zindex-modal) |
| Nav | topbar "Top bar" (Background, border-default, input-height) |
| Table | default "Default table" (border-default, radius-md, font-size-base) |
| Layout | section "Page section" (section-padding-y, layout-padding-x) · container "Container" (sizing-container, layout-padding-x) |

- **Detail screen** (click a row): ghost link **"← Back to styles"** · heading "Button · primary" with mono preset ID under it (`preset.button.primary`) · **preview area** (grey card) showing every variant as a chip, active one filled accent · **variant tabs** (underlined accent when active) · **binding rows**: humanised property on the left ("Background", "Text color", "Radius", "Padding X", "Height", "Font size", "Font weight", "Shadow", "Border", "Hover bg"…) and a green mono token chip on the right (e.g. `color-primary`). Rows are **read-only** — clicking a chip does nothing today. Footer callout: "**Variant tabs:** primary / secondary / ghost — each an independent token-binding map. Edit any binding here = all canvas elements restyle."
- **Empty:** "No presets in this category yet."
- **Gating / notes:** there is no add/rename/duplicate/delete preset UI; a binding editor row (property · token button · "×" delete, with an inline token picker) exists in code but is not mounted anywhere (unreachable). Two boarded pills "Bound to elements" / "Unbound" are deliberately not shipped — the data cannot answer them.

---

## 6. Starters destination

- **Purpose:** apply a whole-brand starting point (9 colours with light + dark values) as a staged change.
- **Layout:** `Starter applied` pill (after a click, stays for the visit) · amber note card (min 150 px): "Selecting a starter previews it on the canvas. Applying replaces your colour, type and spacing tokens and clears per-token undo; the other eleven kinds keep their values. The confirm names every staged edit it will overwrite before it does." · a **2-column grid of 6 cards** (104 px tall): a 76 px thumbnail filled with a diagonal gradient from the starter's Primary to its Background, and the starter name in 12 px grey beneath (no description on this screen). Selected card = 2 px accent border + halo.
- **Actions:** clicking a card is the whole action — it stages the starter's colours (type/spacing registries receive the same set, which currently carries only colours), turns the canvas to that palette, marks the card selected, shows the pill, and the footer flips to "Unsaved brand changes". Nothing persists until Save → Review → Apply. A second click on another card overwrites the staging.
- **Starters (light value / dark value):**

| Starter | Description (kept in data, shown in the first-run gallery only) | Primary | Secondary | Accent | Background | Text | Muted | Border | Success | Error |
|---|---|---|---|---|---|---|---|---|---|---|
| Buildrik Default | "Buildrick's own — brand blue on warm slate neutrals." | #1A56DB / #4B83E8 | #64748B / #94A3B8 | #1A56DB / #4B83E8 | #F8FAFC / #0F172A | #334155 / #E2E8F0 | #71717A / #A1A1AA | #27272A / #3F3F46 | #22C55E / #4ADE80 | #EF4444 / #F87171 |
| Stripe Blue | "Clean blue brand. Bright, financial-friendly, high-contrast." | #635BFF / #897EFF | #0A2540 / #425466 | #00D4FF / #5BE3FF | #FFFFFF / #0A2540 | #1A1F36 / #F5F6FA | #697386 / #B9BFCB | #E3E8EE / #425466 | #0F9D58 / #34D399 | #DF1B41 / #F87171 |
| Notion Warm | "Warm neutrals + tan accent. Friendly editorial feel." | #37352F / #E2E0DD | #787774 / #9B9A97 | #D9730D / #FF9442 | #FFFFFE / #191919 | #37352F / #E2E0DD | #787774 / #9B9A97 | #E9E9E7 / #373737 | #448361 / #529E72 | #D44C47 / #FF7369 |
| Apple Minimal | "Almost monochrome, restrained. Premium product feel." | #1D1D1F / #F5F5F7 | #86868B / #A1A1A6 | #0071E3 / #2997FF | #FBFBFD / #1D1D1F | #1D1D1F / #F5F5F7 | #6E6E73 / #A1A1A6 | #D2D2D7 / #3E3E40 | #34C759 / #30D158 | #FF3B30 / #FF453A |
| Linear Dark | "Dark-first surface with electric accent. Tool-builder default." | #5E6AD2 / #7B85E7 | #3F4253 / #5C6076 | #26B5CE / #48C8DD | #F4F5F8 / #1B1C22 | #15192C / #F4F5F8 | #62687C / #9098A8 | #D8DAE0 / #2D2E36 | #3F8F58 / #4EAB6C | #EB5757 / #F47272 |
| Vercel Mono | "Pure monochrome, technical, sharp." | #171717 / #FAFAFA | #525252 / #A3A3A3 | #0070F3 / #3291FF | #FAFAFA / #0A0A0A | #171717 / #EDEDED | #737373 / #A3A3A3 | #EAEAEA / #333333 | #0070F3 / #3291FF | #E00 / #F33 |

- **Note:** in Beginner mode a freshly applied starter's colours are all primitives, so the Color list shows the "Beginner mode is hiding N colors" empty state until the user switches to Pro.

---

## 7. Classes destination (Pro count on root)

- **Purpose:** every CSS class name currently carried by elements on the site, and how often.
- **Layout:** 44 px rows, no dividers: mono class name (`.hero-card`) over a grey "used 12×" line, most-used first. Live — updates as elements change.
- **Empty:** "No classes yet. A class is a name you put on elements so they can share one rule — add one from an element's Classes section."
- No actions (read-only).

---

## 8. Component styles destination

- **Purpose:** read-only summary of the components the brand ships, plus the AI entry point.
- **Layout:**
  - Scrolling list of the 27 catalog components (44 px rows, chevron): Button, Input, Select, Checkbox, Radio, Switch, Label, Spinner, Card, Form field, Alert, Avatar, Badge, Breadcrumb, Tabs, Pagination, Search bar, List item, Tooltip, Modal, Section, Hero, Footer, Pricing, Call to action, Header, Feature grid. Right side: "N variants" and, when placed on the page, "· N in use". Clicking a row does nothing today.
  - Pinned blue-tinted row: **"✨ Generate with AI"** (accent link). **(behind flag)** — when AI is not enabled for the workspace the link is blocked (still focusable) with tooltip "AI generation isn't switched on for this workspace yet".
  - "Your saved components · N" header; empty card "No saved components yet — save a selection from the canvas to start."; otherwise rows "Name" / "1 master · N instances" with chevron.
  - Footer callout: "**Read-only by design:** Components live in their own panel. This summary lets you see what's installed without leaving Brand — but every action here jumps to the Components panel to author."

### 8.1 "Generate component with AI" modal (behind flag)
- Title "Generate component with AI"; subtitle "Describe what you want. The AI returns a structured schema bound to your design system."
- 4-row textarea, placeholder "e.g. A pricing card with three tiers, one highlighted, each tier has a CTA button bound to color-primary."
- **States:** idle → buttons "Cancel" / "Generate" · generating → textarea disabled, status "Generating schema…", button "Cancel generation" · success → mono preview box of the returned schema, buttons "Discard" / "Retry" (an "Accept" button only renders when a consumer supplies a destination — none does today, so the schema cannot be kept) · error → amber box with the message ("Please describe the component first", "AI service not configured", timeout / invalid-schema messages), buttons "Cancel" / "Retry".

---

## 9. Typography destination

- **Purpose:** the fonts this site uses and how many weights are in play.
- **Layout:** small caps header "ACTIVE FONTS", then one block per font slot: the family name at 17 px *set in that family*, a grey pill with the role ("Display", "Body", "Mono") and a grey note "N weights in use" / "1 weight in use" / "not used yet" (measured off the elements on the page).
- **Empty:** "No fonts set. Pick a font family under Tokens and it appears here."
- No actions here — fonts are changed under Tokens › typography. (The board's "+ Add a font", .woff2 drop zone and licence checkbox are not built — font upload lives in the Site fonts dialog.)

---

## 10. Colour mode destination

- **Purpose:** switch the canvas between light and dark and fill in missing dark values.
- **Layout:** 44 px row with a two-pill segmented control **"Light"** / **"Dark"** (active = white raised pill; sets the canvas colour mode immediately; the canvas resolves colour tokens to their dark values) · grey caps header "NO DARK VALUE" with a mono count · one 32 px row per colour token lacking a dark value: mono token ID (hover title shows the name) and an accent **"Set"** link → turns into an inline mono input pre-filled with the light value (Enter/blur commits, Escape cancels; empty = no change). Committing stages a dark value for that token.
- **Empty:** "Every colour token has a dark value."

---

## 11. Lint destination (brand checks)

- **Purpose:** every current brand-rule violation, errors first.
- **Layout:** one row per finding: 6 px dot (red = error, amber = warning), the finding message (13 px), and a grey line "<rule label> · <token id>". Footer note: "Auto-fix isn't available yet — the linter reports what is wrong, not what to replace it with. Edit the token in Tokens."
- **Empty:** "Nothing to fix" / "Every token passes the brand rules."
- Lint re-runs 500 ms after any token edit, runs even when the panel is closed, and feeds the topbar Issues chip / Issues panel and the publish "issues open" confirm.
- **Rules:**

| Rule label (Lint screen) | Severity | Message shown | Fix offered |
|---|---|---|---|
| Fails WCAG AA on the page background | warning | "<Name> fails WCAG AA against the page background" | Color list → Issues filter → "Fix" / "Fix all (N)" |
| Banned hue — purple, violet or indigo | error | `Token "id" uses a purple/violet/indigo hue ("#8B5CF6"). DESIGN.md bans these — use the accent #1A56DB or a gray neutral.` (dark variant: `Token "id" darkValue ("…") uses a banned hue.`) | none (edit the token) |
| Pure black | error | `Token "id" is pure black. DESIGN.md NO BLACK rule — use the ink scale (#111827) or the accent instead.` (dark: `Token "id" darkValue is pure black. DESIGN.md NO BLACK rule.`) | none |
| Empty value | warning for colours, error otherwise | `Token "id" has empty value.` | none |
| No dark variant | warning | `Color token "id" missing darkValue. Will fall back to light value in dark mode.` (only once at least one colour has a dark value) | Colour mode › "Set" |
| Alias chain too deep | error | `Token "id" alias chain exceeds max depth 3 — a → b → c → d → e` | none |
| Semantic token needs an alias | error | `Semantic token "id" (semanticKind="action") is missing aliasOf. Every semantic token must point to a primitive or another semantic via aliasOf.` | none |
| Unresolved binding | error | `Preset "button-primary" binding color → unknown token "x".` | not currently produced (preset lint is not run) |

- Per-token: the token row shows the amber state + `[lint]`; the token detail's Lint row offers **"Ignore"** (and "Auto-fix" when a hint exists — never today).
- A legacy amber **lint banner** ("N DS errors · M warnings", per-rule counts like "2 WCAG contrast failure", buttons "Review all" / "Dismiss") exists in code but is not mounted anywhere — unreachable.

---

## 12. Import / export destination

- **Dark strategy row** (32 px): label "Dark strategy" and a bare dropdown pill with options **media-query** (tooltip "@media (prefers-color-scheme: dark)"), **data-attr** (":root[data-theme='dark']"), **off** ("light only — no dark block"). Affects CSS output only.
- **"EXPORT" section** (grey caps band), one 48 px row per format — bold title, grey description, and on live rows a **"Copy"** button (flips to "Copied!" for 2 s and toasts "Copied to clipboard!") and an accent **"Download"** link:

| Format | Description | Download file | Notes |
|---|---|---|---|
| CSS | Custom properties | design-tokens.css | includes a dark block per the strategy and, for older schemas, a compatibility alias block |
| JSON | Design tokens format | design-tokens.json | full token array (round-trips through Import) |
| Tailwind | theme.extend config | tailwind.config.js | description gains "· N dropped" when colours have dark values (Tailwind cannot carry per-token dark variants) |
| Figma Variables JSON | "Coming soon — export JSON and use the Figma Variables importer" | — | **(coming soon / disabled)** — no Copy or Download |

  - After Download the band under the back row shows `Exported CSS` / `Exported JSON` / `Exported Tailwind`.
  - Stats line: "14 kinds · 56 tokens · 4 alias edges · 10 dark variants".
  - Tailwind warning card (only while the Preview dropdown is on Tailwind): "**Tailwind warning:** N tokens drop because Tailwind doesn't model dark variants per token. Dark mode disabled on round-trip — banner surfaces this before commit."
- **Preview card:** "Preview" + a format dropdown (CSS / JSON / Tailwind) and a scrolling mono code block of the output.
- **"IMPORT" section:**
  1. **Drop zone** (56 px dashed band; accent tint while dragging): "Drop .json or .ts" — click opens a file browser (accepts .json, .ts, .js). Below it a small underlined link **"or paste JSON"** → reveals a mono textarea (placeholder `[{"id": "color-brand", "value": "#0055FF", ...}]`) and a **"Parse"** button (disabled while empty).
  2. **Parse errors** (red card, and `Import failed` pill under the back row): "JSON parse error: …" · "Unrecognized format — expected token array or { schemaVersion, tokens }" · "Import is empty — no tokens to apply" · "Token #3 is missing required fields (id, name, value, category, cssVar, type)" · `Token "x" has category "y", which isn't one of colors, typography, spacing, effects, layout, icons, buttons, forms, theme — it would not survive a save.` · `Token "x" has no "kind" and category "effects" doesn't name one — add "kind" (e.g. radius, shadow, motion) so it can be applied.` (Tailwind .ts files are detected but currently fail to parse.)
  3. **"RECENT" detail block** after a successful parse: "Detected" (Tailwind config (AST) / Tokens Studio JSON / Figma Variables JSON / Design tokens JSON / Unknown format) · "Valid tokens N" · "Errors 0" · "Conflicts 0" / "N ID collisions".
  4. **"Resolve conflicts"** amber card (when IDs collide): "N tokens already exist with the same ID. Choose how to handle them:" with toggle buttons **"Replace"** (default; incoming values overwrite) and **"Merge · keep mine"** (only new IDs are added).
  5. Actions: primary **"Apply N valid only"** (disabled at 0) · **"Cancel"**.
  - Apply stages the tokens (footer turns dirty), shows `Imported tokens` under the back row and toasts "Imported · 2 modified · 3 added" (+ "· skipped id1, id2" for tokens whose kind has no add path — typography and spacing accept modifications only). "Nothing to apply" (info) if the filter leaves nothing.
- An older **Export dropdown** (button "Export" → menu "CSS Variables / for custom CSS / SCSS", "Tailwind Config / for Tailwind CSS projects", "JSON / for design tools & APIs", with a "⚠ Exporting unsaved changes — not yet live on your site." / "Save first →" warning) exists in code but is not mounted — unreachable.

---

## 13. Review changes modal (Save)

- **Where:** centred dialog (520 px) over the whole editor; Esc closes.
- **Title:** "Review N staged changes" / "Review 1 staged change".
- **Sections:** "COLOR CHANGES" — one grey row per colour: old swatch → new swatch, name as "colors/Primary", struck-through old value, "→", green new value. "TYPOGRAPHY CHANGES" and "SPACING CHANGES" — name, old, "→", new. (Changes to the other eleven kinds and to presets are saved by Apply but are **not listed** here, and are not included in N.)
- Consequence line: "Applying updates every element bound to these tokens — 63 places." (or just "…tokens." when nothing is bound).
- **Buttons:** **"Discard all"** (white, red outline — discards everything staged and shows the undo toast) · **"Keep editing"** (closes, keeps staging; receives focus on open) · **"Apply N changes"** (accent primary).
- Apply persists tokens + presets to the project and the browser, resets the Draft chip to "All saved", toasts "Design tokens applied successfully", and completes the onboarding step "Set your brand".

---

## 14. Undo, unsaved indicator and canvas behaviour

- Every token edit is **live-previewed on the canvas** immediately (CSS variables on the page) and staged; nothing is written to the project until Apply.
- Per-token **undo/redo** lives inside the Typography rows, Spacing edit drawer and the "Restore" button on generic rows. Colour tokens have per-token history but no button surfaces it. Applying a starter or a spacing preset clears per-token undo.
- Global canvas Cmd+Z / Cmd+Shift+Z never discards staged brand edits (info toast, §2.7).
- Dirty indicators: header "Draft" chip · amber dots on root rows and on kind rows · amber swatch/chip dots · amber input borders on generic rows · footer "Unsaved brand changes" · topbar no longer says "Saved".
- Brand data is also cached in the browser per project, so the panel opens instantly; a teammate without that cache sees the project's saved tokens applied to the canvas at load, not the defaults.

---

## 15. Project migration modal (global, on project load)

- **Where it lives:** centred dialog over the editor, opens automatically when a loaded project's brand data is on an older schema.
- **Running state:** title "Updating your project", caption "Schema v0 → v3 · 3 migrations", a list of steps "v1 · Seed 18 placeholder tokens for 11 token kinds (radius/shadow/motion/border/opacity/zindex/breakpoint/grid/sizing/icon/imagery).", "v2 · Seed darkValue on 9 default color tokens (color-primary/secondary/accent/background/text/muted/border/success/error). Skip tokens that already have darkValue.", "v3 · Add the color-warning state token to projects that predate G4. Skip projects that already have it (value never overwritten)." — each tagged "queued" / "running…" / green "✓" / red "failed"; a thin accent progress bar and "1 of 3". Closes itself 0.6 s after all steps are done.
- **Failed state:** title "Migration failed", red banner "Migration v2 failed" with the mono error, rows "Snapshot saved" (green), "Migrations applied 1 of 3", "Stuck at v2", buttons **"Restore snapshot"** and **"Retry v2"** — both currently just close the dialog (**not implemented**). The editor then loads the project as-is and shows the toast "Project update failed" / "Could not update design system schema. Loaded as-is." The same toast appears if the saved alias graph has a cycle or a chain deeper than 3.
- A separate, silent token-schema migration (v1→v5: adds the primitive/semantic colour seeds and renames the brand primitive) runs with no UI; a project saved by a newer editor loads as-is with a console warning only.

---

## 16. Unreachable or unwired pieces (present in code, not visible)
- Lint aggregate banner with "Review all" / "Dismiss" (§11).
- Export dropdown (§12).
- Preset binding editor row with inline token picker and "×" delete (§5).
- Starter card description line and a first-run starter gallery modal (the destination replaced it).
- "Accept" button on the AI modal (no destination for the schema).
- "Auto-fix" on token detail (no rule produces a fix hint).
- Figma Variables export row (coming soon).
- Migration "Restore snapshot" / "Retry" (close only).

---

## 17. How brand tokens show up elsewhere (one line each)
- **Inspector colour / spacing / size / font controls:** a token picker popover with "Tokens" (search "Search tokens"; empty "No [X] tokens yet" + "Add tokens in the Design tab", or "No tokens found") and optional "Custom" tabs; bound values render as a token chip; in Beginner the chip hides IDs/CSS variables.
- **Canvas:** every token is a CSS variable on the page, so staged edits, starters, spacing presets and the Light/Dark switch repaint the canvas instantly.
- **Topbar Issues chip / Issues panel:** brand lint findings are listed there too, with the same messages; open errors gate the publish "publish anyway" confirm.
- **Publish / export:** the CSS bundle (light block + dark block per the strategy) ships with the site; renamed tokens keep a two-version compatibility alias so published sites do not break.
- **Components catalog:** placed components bind their styles to brand tokens, which is what the "used N×" counts and "Used by" lists measure.
- **Site fonts dialog (media module):** fonts uploaded to the media library appear under "Uploaded" in every font picker, including the Brand token font picker.
- **Onboarding checklist:** a successful brand Apply ticks the "Set your brand" step.

---

# Editor UI Component Kit & Design Tokens

**What this module is.** This is the "components page" of the Buildrik editor: the shared building blocks every screen in the editor is assembled from (buttons, inputs, selects, modals, toasts, tooltips, badges, tabs, menus, rows, cards, panel chrome, the top bar, the rail), plus the design tokens they all draw from (colour, type, spacing, radius, elevation, z-order, motion, focus). Nothing in this document is a screen; it is the vocabulary screens are written in. The editor chrome is a light, quiet, compact desktop tool ("Webflow meets Linear, daylight edition"). One blue accent, Flowbite greys everywhere else, Inter for UI text, Geist Mono for numbers. The kit is built on the Flowbite component library, re-skinned to these tokens; where Flowbite has no matching part (tabs with arrow keys, roving menus, the command palette, rows, the top bar) the editor has its own.

A note on sources of truth for the designer: colour, type, spacing, radius, elevation, z-order and motion values are generated **from the Figma file "Buildrick — Product"** and the code cannot hand-edit them. If a value here looks wrong, the fix is in Figma. Where the code deliberately diverged from an existing Figma board (a few places, noted inline as "founder call"), the code is currently the winner and the board is flagged for redraw.

---

## Part A — Design rules a designer must follow

Summarised from the product design document. These are binding for **editor chrome** (rail, drawers, inspector, top bar, canvas overlays, modals, toasts). The dashboard, auth and onboarding surfaces have their own scoped rules and are out of scope here.

### Accent
- **Exactly one accent: `#1A56DB`** (Flowbite blue-700). Hover `#1E429F` (blue-800), pressed `#233876` (blue-900), subtle fill `#E1EFFE` (blue-100), tint fill `#EBF5FF` (blue-50), text-on-accent white.
- The accent may appear only on: (a) the one primary CTA per screen, (b) selection outlines and selected-row tint, (c) the active rail / tab indicator, (d) focus rings, (e) the account avatar. Nowhere else.
- **Red means error/danger/destructive only** — delete confirms, failed status, validation, over-limit. Never a red CTA or accent.
- **Purple / violet / indigo are banned as accents** and as gradients. Two data-only exceptions: avatar identity tones (a person's colour is derived from their id) and the **PRO badge** may use the Flowbite purple ramp.
- Info colour = the accent. There is no second blue.

### The NO BLACK rule (editor chrome only)
- Zero pure-black or near-black **surfaces** — no `#000`, `#0A0A0A`, `#14141F`, `#1F2937`, nor any hex with all three RGB channels under `0x35` as a background or fill.
- Text may be dark; the darkest text token in use is ink `#111827` (gray-900) — the doc's older "cap at `#334155`" line predates the Flowbite migration and the live tokens use gray-900 for primary ink. Tooltips, context menus and the account avatar all follow the no-black-surface rule (tooltips are white with a hairline border, not dark bubbles — a founder call on 2026-08-27 that overrides a Figma board drawing a dark bubble).
- Icons inherit the text colour; there is no separate "icon dark tone".
- The one deliberate exception in the kit: the **dark undo/redo toast** (see Toast) is drawn on ink with light text because a Figma board specifies it as a transient "here is what just happened" bar.

### Typography
- **Inter** for all UI text. **Geist Mono** with tabular figures for data: dimensions, timestamps, slugs, file sizes, counts, version numbers.
- **No system fallbacks** named anywhere: no `system-ui`, `-apple-system`, `Roboto`, `Helvetica`, `Arial`, `Segoe UI`.
- **Weights cap at 600.** No 700 anywhere in chrome.
- Editor chrome lives mostly at 12–14 px. Panel/drawer headers are 11 px medium, wide-tracked, soft ink.

### Spacing, density, radius
- Base unit 4 px. Scale: 2 / 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 36 / 40 / 48 / 64.
- **Compact density.** Row heights are 28 (dense tree/list) and 32 (standard). Never 40 for rows.
- Radius: 4 (row corners, small chips) · 6 (icon tiles, compact controls, text inputs) · 8 (buttons, panels, cards, popovers) · 12 (modals) · full (pills, avatars).
- Panel chrome containers (panels, headers, toolbars, footers, rows, rail) cap at 4 px radius. Form atoms and overlays (buttons, inputs, modals, popovers, toasts) use the full scale. The rule is split by surface, not by number.

### Elevation
- Depth is nesting + hairline borders, not shadows. Exactly three shadows exist: **raised** `0 1px 2px rgba(0,0,0,.08)` (knobs, chips, hover-lift on site cards) · **drag** `0 4px 6px rgba(0,0,0,.10)` (picked-up state, dragging knob) · **overlay** `0 10px 15px rgba(0,0,0,.10)` (modals, popovers, menus, command palette, toasts, tooltips).
- No gradients in panel chrome. No shadows on flat surfaces.
- Tints are pre-mixed opaque colours, never alpha on a frame. Alpha survives only where transparency is the point: scrims, canvas overlays, the focus ring.

### Motion
- House curve `cubic-bezier(0.2, 0, 0, 1)` for enter/hover; ease-in for exit.
- Durations: 100 ms (hover/press), 160 ms (panel/drawer), 240 ms (modal/overlay enter).
- No spring physics, no scroll choreography, no entrance animations on first paint, no hover lifts or scales — the design moves colour, not geometry. Entrance/exit on panels/modals/menus is at most a simple opacity fade ≤ 150 ms.
- Respect reduced-motion: every non-essential transition and animation is disabled.

### Anti-slop list (editor chrome)
1. No black or near-black surfaces.
2. No purple / violet / indigo gradients. Ever.
3. No 3-column feature grid with icons in coloured circles.
4. No centred-everything sections.
5. No decorative blobs, wavy dividers, floating circles.
6. **No emoji as design elements.** (One legacy violation exists in the kit — the File drop zone draws a folder emoji. Flagged below.)
7. No coloured left-border card treatment.
8. No default / named-fallback font stacks.
9. Cards earn their existence: if it is not interactive, do not wrap it in a card.
10. No shadows on flat surfaces.
11. No category-coloured accents (e.g. a blue for images, a green for video). Category is grouping + label, not hue.
12. No per-row action strips. Actions live in hover-reveal overflow menus.

### Content rules
- Numbers use Geist Mono + tabular figures.
- Icons only where they disambiguate; labels carry meaning.
- Hover on rows is quiet: a light grey fill.
- Selection is accent-tinted: subtle blue fill, accent text, and (product-wide) a 3 px accent bar on the left edge.
- Empty states are typographic: 13 px muted title, 12 px body, one primary action. No illustrations.
- **Truncate a NAME, wrap a FACT.** Page names, layer names, filenames, token names: single line, ellipsis, full value on hover. Anything the user must read to decide (confirm-modal rows, error text, a permission reason) wraps. A truncated name without a hover title is a bug.
- A disabled control without a reason (tooltip) is a bug.

### Accessibility
- WCAG AA on all body text. Primary ink on white ≈ 11.6:1, soft ink ≈ 7.6:1, muted ≈ 4.4–5:1 (AA large / AA on the right ground).
- Keyboard: ⌘K command palette, ⌘Z / ⌘⇧Z undo/redo, ⌘P preview. Rail: `A` Insert · `P` Pages · `L` Layers · `M` Media · `D` Content · `B` Brand · `C` comment mode.
- Editor minimum hit target 20 px (the glyph inside may be smaller); icon buttons are 32 px; chips are at least 24 px tall.
- ARIA landmarks on top bar, rail, drawer, canvas, inspector.

---

## Part B — Design tokens

All values below are the live generated tokens (Editor mode of the Figma "Package" collection, plus the Primitives collection).

### B1. Palette — the Flowbite ramps

| Ramp | Steps available (name → hex) |
|---|---|
| Blue (accent ramp) | 50 `#EBF5FF` · 100 `#E1EFFE` · 200 `#C3DDFD` · 300 `#A4CAFE` · 400 `#76A9FA` · 500 `#3F83F8` · 600 `#1C64F2` · **700 `#1A56DB`** · 800 `#1E429F` · 900 `#233876` |
| Gray (neutrals) | 50 `#F9FAFB` · 100 `#F3F4F6` · 200 `#E5E7EB` · 300 `#D1D5DB` · 400 `#9CA3AF` · 500 `#6B7280` · 600 `#4B5563` · 700 `#374151` · 800 `#1F2937` · 900 `#111827` |
| Red (error) | 50 `#FDF2F2` · 100 `#FDE8E8` · 500 `#F05252` · 600 `#E02424` · 700 `#C81E1E` · 800 `#9B1C1C` |
| Green (success) | 50 `#F3FAF7` · 100 `#DEF7EC` · 400 `#31C48D` · 500 `#0E9F6E` · 600 `#057A55` · 700 `#046C4E` · 800 `#03543F` |
| Yellow (warning) | 50 `#FDFDEA` · 100 `#FDF6B2` · 300 `#FACA15` · 400 `#E3A008` · 500 `#C27803` · 800 `#723B13` |
| Purple (identity/PRO only) | 50 `#F6F5FF` · 100 `#EDEBFE` · 500 `#9061F9` · 600 `#7E3AF2` · 700 `#6C2BD9` · 800 `#5521B5` |

Gray-800 (`#1F2937`) and gray-900 (`#111827`) exist in the ramp but are text-only in chrome (no-black-surface rule). Gray-900 is used as a **surface** in exactly one place: the dark undo/redo toast.

### B2. Role colours — what components actually reference

| Role | Value | Used for |
|---|---|---|
| App background | `#F3F4F6` (gray-100) | Shell / canvas backdrop, rail, full-page surfaces, disabled button fill, hover fill on ghost controls |
| Panel | `#FFFFFF` | Drawers, inspector, panel headers, top bar, footer |
| Subtle | `#F3F4F6` (gray-100) | Search fields, section-header tint, hover fills, disabled input fill |
| Card | `#FFFFFF` | Cards, list rows (effective), inputs, popovers, slider knob, avatar-stack ring |
| Elevated | `#FFFFFF` | Modals, dropdown menus, command palette, tooltips, toasts (tinted) |
| Border | `#E5E7EB` (gray-200) | Default hairline: panel header bottom, toolbar edge, menu separators, popover border, kbd border, card border |
| Border medium | `#D1D5DB` (gray-300) | Raw text-field border, secondary ("light") button border, disabled slider fill |
| Border input | `#9CA3AF` (gray-400) | Themed text-input border, slider number-field border, outline copy-button border |
| Border strong | `#9CA3AF` (gray-400) | Hover border (legacy inputs), draft status dot |
| Ink | `#111827` (gray-900) | Primary text, modal titles, row labels, menu items, site name |
| Ink soft | `#4B5563` (gray-600) | Secondary labels, panel header title, field labels, tooltip text, body copy in modals, ghost button text, chip counts |
| Ink muted | `#6B7280` (gray-500) | Captions, counts, hints, footer text, section captions, placeholders, rail icons at rest, tab labels at rest |
| Ink disabled | `#D1D5DB` (gray-300) | Disabled menu items, disabled rows, disabled command-palette items, disabled text-field text |
| Accent | `#1A56DB` | Primary CTA fill, selected states, active rail/tab, focus ring, links, checkbox/radio/toggle checked, slider fill, progress fill, notification dot |
| Accent hover | `#1E429F` | Primary CTA hover |
| Accent pressed | `#233876` | Primary CTA pressed |
| Accent subtle | `#E1EFFE` (blue-100) | Selected-row fill (pre-mixed), drop-zone drag fill |
| Accent tint | `#EBF5FF` (blue-50) | Badge/pill fill, selected tab pill, selected chip, selected menu/palette item, info toast |
| Accent text | `#1A56DB` | Accent-coloured text on light (links, selected labels, checkmark in checkable menu items) |
| Accent on | `#FFFFFF` | Text on accent surfaces |
| Success | `#0E9F6E` (green-500) | Status dots, saved dot, resolved comment dot, checkmarks in upgrade modal |
| Success tint | `#DEF7EC` (green-100) | Success toast fill, "✓ Published" button fill, "CURRENT"/"CONNECTED" badge fill, live-connection pill |
| Success text | `#057A55` (green-600) | Labels on success tint, "Saved" pill text, success disc in confirm dialog |
| Warning | `#C27803` (yellow-500) | Unsaved/offline/conflict dots, open-comment dot, warning confirm button, "review" status dot |
| Warning tint | `#FDFDEA` (yellow-50) | Warning toast, conflict/offline pill fill, "Changes requested" review pill, reconnecting pill, warning issue-chip hover |
| Warning text | `#723B13` (yellow-800) | Labels on warning tint, unsaved pill text, issue-chip warning tone, detached-comment note |
| Error | `#E02424` (red-600) | Error dot, failed status dot, invalid-input border, required asterisk, offline-connection dot, file drop-zone error border |
| Error tint | `#FDE8E8` (red-100) | Error toast, save-failed pill fill, offline-connection pill fill, error issue-chip hover |
| Error text | `#C81E1E` (red-700) | Labels on error tint, danger menu items, danger button fill (red-700), error issue-chip tone, "ERROR" badge text |

### B3. Alpha values (transparency is the point)

| Token | Value | Used for |
|---|---|---|
| Accent 15% | `rgba(26,86,219,.15)` | Canvas subtle selection glow |
| Accent 30% | `rgba(26,86,219,.30)` | **Focus ring** colour; canvas hover ring (dashed) |
| Ink 6 / 8 / 10 / 12 % | `rgba(17,24,39,.06/.08/.10/.12)` | Solid copy-button hover (8%), light separators |
| Ink 30 / 40 / 50 % | `rgba(17,24,39,.30/.40/.50)` | **Modal scrim = ink 40%** |
| On-dark 12 / 15 / 40 % | `rgba(255,255,255,.12/.15/.40)` | Reserved for the dark toast / dark surfaces |

### B4. Canvas dev-tooling overlay colours (box-model inspector)
Margin `rgba(246,178,107,.45)` (orange) · Border `rgba(255,229,153,.45)` (yellow) · Padding `rgba(147,196,125,.45)` (green) · Content `rgba(111,168,220,.45)` (blue). These paint on the user's page when box-model overlays are on; they are the familiar browser-devtools colours.

### B5. Typography tokens

**Families**
- UI: `"Inter", "Inter Tight", sans-serif` (Inter Tight is a transition fallback only).
- Mono: `"Geist Mono", "SF Mono", Menlo, Consolas, monospace`.
- Self-hosted weights actually shipped: Inter 400 / 500 / 600; Geist Mono 400 / 500. Latin + Latin-Extended subsets only (chrome is English-only). Fonts load with `font-display: block` so text never paints in a fallback face.

**Sizes** 11 · 12 · 13 · 14 · 16 · 20 · 24 px.
**Line heights** 16 · 18 · 20 · 21 · 24 · 30 · 32 px (plus unitless tight 1.25 and normal 1.5).
**Weights** 400 regular · 500 medium · 600 semibold (ceiling).
**Tracking** tight −0.01em · normal 0 · wide 0.08em (used on 11 px uppercase/caps labels).

**The Figma type ramp (11 styles)**
ui/11 caption (11/16, 500) · ui/12 small (12/16) · ui/13 row label (13/20, 400 or 500) · ui/14 panel title (14/20–21, 500–600) · ui/16 heading (16/24, 600, −0.06em) · ui/20 heading-lg (20/28–30, 600) · ui/24 title (24/32, 600) · data/11, data/12, data/13 in Geist Mono with tabular figures.

**The five chrome type roles the code composes from** (reach for these before inventing a size):

| Role | Spec | Where |
|---|---|---|
| Panel title | 11 px, 500, +0.08em tracking, ink-soft, Title Case (not uppercase) | Drawer panel headers |
| Section caption | 11 px, 500, +0.08em, **UPPERCASE**, ink-muted | Section headers inside panels, menu group labels |
| Body | 13 px, 400, ink | Rows, menu items, modal body, popovers |
| Label | 12 px, 500, ink-soft | Field labels, control labels |
| Hint | 11 px, 400, ink-muted | Helper lines, quiet metadata, footer |

### B6. Spacing scale
2 · 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 36 · 40 · 48 · 64 px.

### B7. Radius scale
sm 4 · md 6 · lg 8 · full 9999. (Modals additionally use 12 via the extended scale; kbd and copy button use 4.)

### B8. Shell sizes (the committed numbers)

| Token | px | What it is |
|---|---|---|
| Row dense | 28 | Layers tree, dense lists (11 px label) |
| Row | 32 | Standard list row (13 px label) |
| Header | 44 | Drawer panel header |
| Top bar | 56 | The editor top bar |
| Row tall | 64 | Comment rows, integration rows, format rows |
| Rail | 60 | Left icon rail width |
| Drawer | 280 | Left drawer width (all six tools); expands to 700 via the header's expand toggle |
| Right panel | 360 | Wide right-hand surfaces (Issues, Notifications, History, Review) |
| Inspector | 300 | Right inspector width |
| Nav | 240 | Settings sub-nav column |
| Footer | 32 | Shell status bar |

### B9. Z-order layers
canvas 0 · chrome 10 · drawer 20 · top bar 30 · popover 40 · overlay/scrim 50 · modal 60 · command palette 70 · toast 80 · tooltip 90.

### B10. Motion tokens
fast 100 ms · base 160 ms · slow 240 ms. Easing default `cubic-bezier(0.2,0,0,1)`, out `cubic-bezier(0,0,0.2,1)`, in-out `cubic-bezier(0.4,0,0.2,1)`. Two composed transitions: fast (all 100 ms default ease) and base (all 160 ms).

### B11. Focus
Ring width 2 px, offset 2 px. Two languages coexist and a designer should draw **both**:
- **Keyboard focus outline** (global rule): 2 px solid accent outline, 2 px offset, following the element's own corner radius. No halo. Applied to any focusable thing (buttons, links, tab-stops) only when focus came from the keyboard; mouse focus shows nothing.
- **Focus shadow ring** (the Flowbite language, applied per component): `0 0 0 2px rgba(26,86,219,.30)` — a soft 2 px accent ring. Used on icon buttons, chips, rows (inset), tabs, menu items, cards, slider track, inputs (with an accent border).
- Flowbite primary buttons keep Flowbite's own 4 px `#A4CAFE` (blue-300) focus ring.

### B12. Elevation
raised `0 1px 2px rgba(0,0,0,.08)` · drag `0 4px 6px rgba(0,0,0,.10)` · overlay `0 10px 15px rgba(0,0,0,.10)` · focus `0 0 0 2px rgba(26,86,219,.30)`.

### B13. Accessibility rules baked into the stylesheet
- **Reduced motion:** all animations collapse to 0.01 ms and run once; transitions collapse; scroll-behaviour auto; spinners and skeleton pulses stop (the grey block stays — the placeholder is the information); the "dirty modal" pulse is suppressed; canvas drop-feedback overlays are forced fully opaque; hover lifts/scales on legacy buttons are removed.
- **High contrast:** hairline border darkens to gray-500, strong border to gray-700; legacy inputs/selects/textareas get a 2 px border; keyboard focus becomes a 3 px system-colour outline; a selected canvas element gets a 3 px system-highlight outline.
- **Skip link:** an accent-filled pill ("skip to content" style) hidden above the viewport that drops to 16/16 from the top-left when it receives keyboard focus; 8/16 padding, 8 px radius, white 600 text.
- **Screen-reader-only utility** exists for hidden text (e.g. "Live at" before a domain).
- **Print:** toolbars, sidebar, panel actions and all buttons hide; canvas goes white; shadows removed.

### B14. Customer-site tokens (NOT chrome — listed so the designer does not confuse the two)
A second, independent token set styles the **user's website on the canvas** and is edited by the Brand/Design panel. It ships inside published sites and is never regenerated from the chrome Figma file. Defaults: primary `#1A56DB`, secondary `#64748B`, accent `#15803D`, background `#F8FAFC`, text `#334155`, muted `#71717A`, border `#27272A`, success `#15803D`, error `#EF4444`, warning `#8E4B10`; fonts Inter / Inter / Geist Mono; size scale xs 12 → 4xl 36; space 4→48; radius none/4/8/12/16/full; shadows sm→xl; layout max-width 1280, gutter 24, section padding 80, content max-width 720, mobile breakpoint 768; icons outline, 1.5 stroke, 16/20/24; buttons 32/40/48 tall, 16 horizontal padding, 600 weight, 14 px, radius 8, CTA radius pill; inputs 40 tall, radius 8, focus `#3B82F6`, label 13/500, placeholder `#71717A`. On the canvas, the customer's page renders at the browser's 16 px base with the customer's fonts; headings keep browser sizes (h1 2em … h6 0.67em, bold) and lists keep bullets. Chrome must never be dressed in these tokens and vice-versa.

### B15. Legacy canvas-overlay tokens (dark-era values still referenced by canvas overlays)
Canvas selection/drag tooling keeps an older token set: selection outline = accent; selection glow `0 0 0 3px rgba(26,86,219,.2)` (strong `.4`, subtle 2px `.15`); handle gradient accent→accent-hover (the one gradient still in code, canvas only); dark surfaces `#0A0A0A / #121212 / #1A1A1A` and white-alpha borders (used by rulers/dev overlays drawn on a canvas context — **not chrome**); status green `#10B981` / red `#EF4444` / amber `#F59E0B`; drop-zone valid green / invalid red at 5% fill; z-layers 99 backdrop → 5000 tooltip inside the canvas; handle size 8, ruler size 20, min element 20, badge padding 8/4; older layout numbers (top bar 52, footer 40, rail 56, panel 280, inspector 300, touch min 44). Canvas keyframes: pulse (selection glow breathing, 2 s), fade-in (4 px rise), scale-in (0.95→1), shimmer, ripple. A designer redrawing canvas overlays should treat the chrome tokens in B1–B12 as the target and these as the legacy they replace.

### B16. Engine-level canvas selection & hover rings (chrome-side, always on)
- **Selected element on canvas:** 2 px solid accent outline, 1 px offset, no halo.
- **Hovered (unselected) element:** 1 px **dashed** accent-30% outline, 0 offset.
- **Element being dragged:** 40% opacity, text selection suppressed, grabbing cursor everywhere.
- **Element just created/duplicated:** a 300 ms scale "flash" (1 → 1.04 → 1) — the only scale animation permitted, and it is skipped under reduced motion.
- Canvas backdrop: app grey, 32 px padding, content centred. The old 20 px grid was removed; the toolbar's Grid toggle is the only thing that draws a grid.
- Native disabled inputs anywhere: subtle fill, muted text, hairline border, not-allowed cursor, 50% opacity.

---

## Part C — Components

Conventions used below: sizes are in px; "hairline" = 1 px gray-200; "focus ring" = the 2 px accent-30% shadow ring unless stated; "quiet hover" = gray-100 fill. Existing Figma board ids are given where the code cites one, so the designer can find the current drawing.

---

### C1. Button
*(Existing Figma component 9:102.)*
- **Purpose:** the one labelled action control. Flowbite's button, re-themed.
- **Variants (role vocabulary):**
  - **Primary** — accent fill `#1A56DB`, white text, hover `#1E429F`. Flowbite focus ring 4 px `#A4CAFE`. The single filled CTA per screen (topbar Publish; modal confirms).
  - **Secondary** ("light") — white fill, 1 px gray-300 border, ink text, hover gray-100 fill. The most common button in the product (~105 uses).
  - **Ghost** — transparent, no visible border, ink-soft text; hover gray-100 fill + ink text; focus = focus ring.
  - **Link** — accent text on nothing, 13 px regular, no padding, auto height (min 24); hover underline; focus = focus ring. Replaces the "6-class ghost-link incantation" (~70 uses).
  - **Danger** — red-700 fill `#C81E1E`, white text, hover red-800 `#9B1C1C`. Delete confirms only.
  - Flowbite also exposes **outline**, **pill** and **full-width** modifiers and a dozen other named colours (green, yellow, purple, dark …); none of those are sanctioned in chrome — only the five roles above plus "light" and "red".
- **Sizes (Flowbite scale):** xs 32 tall / 12 h-pad / 12 px text · sm 36 / 12 / 14 px · md 40 / 20 / 14 px · lg 48 / 20 / 16 px · xl 52 / 24 / 16 px. Chrome uses **xs (32) almost everywhere** and sm occasionally; md is Flowbite's default but is never the intent.
  - **Inside a modal footer every button is forced to 28 tall with 12/6 padding** (the design-system button is 28 h wherever a board instantiates it).
  - Topbar **Publish**: 32 tall, 16 horizontal, 14 px medium. Topbar **Exit**: 28 tall, 10 horizontal, 12 px regular, ink text, hover gray-100.
  - Radius 8 (Flowbite rounded-lg). Text weight 500. Label centred.
- **States:** default · hover · pressed · focus (keyboard) · **disabled = gray-100 fill, ink-muted text, no border, no shadow, full opacity, not-allowed cursor** (never the accent at 50% — a dead control must not dress as the primary action) · **loading/busy** = natively disabled + busy flag (Publish while publishing) · **blocked** = looks disabled but stays focusable, with a tooltip giving the reason (Publish when publishing is unavailable).
- **Anatomy:** label; optional leading/trailing icon (16 px, inherits text colour); can be the trigger of a tooltip.
- **Behaviour:** Enter/Space activate. Disabled removes pointer events.
- **Copy defaults:** none. Destructive confirms must **name the action** ("Delete 3 pages"), never "Confirm".

### C2. Icon button
*(Existing Figma component 697:440.)*
- **Purpose:** icon-only action (close, help, expand, preview, comments, notifications, "···").
- **Sizes:** md **32 × 32** (default — "clears the 24 px touch minimum"); sm **24 × 24**. Glyph 16 px.
- **Look:** transparent, radius 6, ink-soft glyph. Hover gray-100 fill + ink glyph. Pressed/toggled-on (e.g. Comments mode on, Expand on): blue-50 fill + blue-700 glyph. Focus: focus ring. Disabled 50% opacity, not-allowed cursor. Transition 100 ms.
- **Anatomy:** glyph only; **an accessible label is mandatory** and doubles as the native hover tooltip.
- **Behaviour:** toggle buttons announce pressed state.

### C3. Icon (wrapper)
- A sizing/colour box for any glyph: default 16 px square, inline, inherits text colour. Icons are decorative unless given a label. The icon set is **Lucide** (outline, 2 px stroke in the kit's inline SVGs; the customer-site DS uses 1.5). See C60 for the element-type icon map.

### C4. Keyboard key (kbd)
- **Purpose:** show a shortcut key ("j", "k", "Enter", "g", "G", "⌘K").
- **Look:** min 20 wide × 20 tall, 4 h-pad, gray-100 fill, 1 px gray-200 border with a **2 px bottom border** (keycap feel), radius 4, Geist Mono 11 px, ink-soft.

### C5. Spinner
- **Kit spinner:** a ring — gray-200 track with a blue-700 arc, rotating 700 ms linear. Sizes sm 12 (1.5 px stroke) · md 16 (2 px) · lg 24 (2 px). Accessible label default "Loading".
- **Boot spinner** (Flowbite's double-ring SVG): 48 px, accent arc; used only on the studio boot screen (C48).
- **Inline glyph spinner** (top bar Quick-preview while busy): a 16 px open-arc icon in place of the eye.
- Under reduced motion the spinner stops.

### C6. Text input
*(Existing Figma board 149:108 is the winner — founder call 2026-09-08.)*
- **Purpose:** single-line text entry (Flowbite text input, re-themed).
- **Geometry:** **32 tall**, radius **6**, 13 px text, 10 h-pad (Flowbite md), white fill, 1 px **gray-400** border. (A second board, 1170:4713, draws 42 tall / radius 4 and is now the one that needs redrawing.)
- **States:** default · hover (no change) · **focus** = accent border + 1 px accent ring · **invalid** = red-600 border (stays red while focused; ring goes red) · **disabled** = 50% opacity, not-allowed cursor · placeholder gray-500.
- **Sizes:** Flowbite sm (8 pad, 12 px) / md (themed to 32) / lg (16 pad, 16 px) exist; chrome uses md.
- **Anatomy:** optional left icon (absolutely placed, 12 px inset, muted) — used for **search fields** (search field = text input + left magnifier icon, in a subtle-grey well when it sits in a toolbar); optional right icon; optional addon (squares the left corners).
- **Raw text field** (the one sanctioned "plain input" for search bars, inline rename fields, hex swatch entry): **36 tall**, radius 8, 12 h-pad, 1 px gray-300 border, white, 13 px ink; placeholder gray-500; focus accent border + focus ring; invalid red border; disabled gray-100 fill + gray-300 text. The two heights (32 vs 36) currently coexist.
- **Legacy hover** (older inputs still on old classes): border darkens to gray-400, fill goes subtle, and the field **lifts 1 px** — a hover-lift the design rules now ban; italic placeholders at 70% opacity likewise legacy. Flag for removal.

### C7. Number input / stepper
- **Purpose:** numeric entry. **There is no −/+ stepper in the design** (the old stepper buttons were removed); the native ArrowUp/ArrowDown step the value, and the browser's own spin buttons are hidden in the slider's number field.
- **Number field composition:** a text input in number mode, clamped to min/max, with an optional **unit suffix** rendered as plain 12 px muted text to the right ("px", "%"). Wraps in the label/hint/error field wrapper (C41) when labelled.
- **Inspector number well** (inside the slider, C13): **46 × 26**, white, 1 px gray-400 border, radius 4, Geist Mono 12 px ink right-aligned, unit in 11 px UI muted; focus-within = accent border.

### C8. Select (native dropdown)
- **Purpose:** pick one of a fixed list (Flowbite select, re-themed; native OS dropdown menu opens).
- **Look:** white fill, 1 px gray-300 border, radius 8, 10 pad, 14 px (Flowbite md), a small chevron-down icon 12 px from the right edge, right padding 40 to clear it. Focus = accent border + 1 px accent ring. Disabled 50% opacity.
- **Placeholder** option: "Select..." shown in muted ink until a value is chosen.
- **Option groups** supported (native optgroup headings); options can be disabled.
- **Two "bare" variants** for the inspector's pill controls: the select loses its border, background, arrow image, padding and shadow so it sits invisibly inside a custom pill — **unit picker** (e.g. px/rem, 11 px Geist Mono 500) and **value picker** (dropdown pill, 11 px Inter 500).

### C9. Combobox / Command palette
*(Existing Figma 166:2, 640 × 420.)*
- **Where:** floating over everything, aligned to the **top** of the viewport (12% down), on the modal scrim. ⌘K opens it.
- **Layout:** white card 640 wide (max viewport − 32), max 420 tall, radius 8, overlay shadow. Top row 56 tall with a hairline below: a borderless 16 px input, placeholder "Type a command or search…" in gray-300. Below: a scrolling list of 40-tall rows, 16 h-pad, 13 px, each with a label and an optional right-aligned shortcut in 11 px muted.
- **States per row:** idle (ink on transparent) · highlighted (blue-50 fill, accent text) · disabled (gray-300 text, not clickable, skipped by arrows). Empty: one disabled-styled row "No matching commands".
- **Behaviour:** typing filters by label substring (case-insensitive); ↑/↓ move the highlight (wrapping, skipping disabled); Enter runs the highlighted command; Escape closes; mouse hover moves the highlight; the input keeps focus the whole time; query clears on close. Scrim click closes.

### C10. Textarea
- Flowbite textarea: white, 1 px gray-300 border, radius 8, 10 pad, 14 px; focus accent border + ring; **error** = red-600 border and red focus ring; disabled 50%. Wraps in the field wrapper (C41) when labelled.

### C11. Checkbox
- 16 × 16, radius 4, gray-100 fill, 1 px gray-300 border. **Checked = filled accent** (chrome always passes the blue colour so the fill is `#1A56DB`, not Flowbite's default blue-600) with a white check glyph, border disappears. Focus: 2 px ring, 2 px offset, accent. Used in bulk-select rows, "remember" options, plan steps, settings.

### C12. Radio
- 16 × 16 circle, gray-100 fill, 1 px gray-300 border. Checked = accent fill with a white dot. Focus as checkbox. Chrome sets white fill when the radio sits on a white row (Format row, C51).

### C13. Toggle switch
- Flowbite toggle, **small size everywhere (13 uses)**: track 36 × 20, knob 16, knob inset 2. (Flowbite md 44 × 24 and lg 52 × 28 exist but are unused.) Off: gray-200 track, white knob with gray-300 border. On: **accent track**, knob slides right. Focus: 4 px ring (Flowbite). Disabled: 50% opacity, not-allowed. Label sits to the left as separate text; a disabled toggle carries a hover reason (e.g. the admin-only reason).

### C14. Slider (range)
*(Existing Figma component set 92:30.)*
- **Anatomy:** a **118-wide, 4-tall** track (full radius) — accent fill from the left up to the value, gray-200 beyond — with a **14 px round knob** (white, 2 px accent border, raised shadow) that **grows to 16 px while dragging** (drag shadow); to the right, the **number well** (C7) with optional unit. Gap 8.
- **States:** focus-visible = focus ring on the track; disabled = 55% opacity, not-allowed, fill goes gray-300 on subtle, knob border gray-300, number muted.
- **Behaviour:** native drag and arrow keys; typing in the number well clamps to min/max.
- **Labelled slider field:** a 12 px medium ink-soft label above the slider.
- **Legacy sliders** (older classes): knob scales 1.15 on hover, 1.3 while active, with blue glow halos — banned hover-lift behaviour; flag for removal.

### C15. Segmented control — Breakpoint switcher
*(Existing Figma board 807:8069 / 807:8321.)*
- **Purpose:** the editor's canonical viewport switcher (canvas toolbar and preview overlay). It is deliberately **not** a generic segmented control.
- **Look:** a **well** — gray-50 fill, 1 px gray-200 border, radius 8, 2 px inner padding, 2 px gaps — holding 3 (or 4) cells, each **24 tall**, radius 4, 11 px medium, ink-muted at rest, hover ink. Cells are 32 wide (glyph mode) or hug text with 12 h-pad (labelled mode).
- **Selected cell: accent fill, white semibold label.** Focus: focus ring.
- **Cells:** Desktop "D" · Tablet "T" · Mobile "M" · optional Wide "W" prepended. Tooltips/accessible names give the pixel range: "Desktop · ≥1024px", "Tablet · 768–1023px", "Mobile · ≤767px", "Wide · preview width, uses Desktop styles". Richer glyphs (device icons) can replace the letters.
- **Behaviour:** click selects; group announced as "Breakpoint".

### C16. Tabs
*(Boards 1172:4867, 1172:4825, 1164:4713.)*
- **Purpose:** child-level navigation inside a surface (settings sections, export options, media picker sources, image-editor tools).
- **Look:** a row with 4 px gaps, 4/12 padding, **no underline and no rule beneath**. Each tab is a pill 32 tall, 10 h-pad, radius 6, 13 px, ink-muted; hover ink + gray-100 fill. **Selected = accent-tint fill (blue-50) + accent text + medium weight.** Disabled 50%, not-allowed. Focus: focus ring.
- **Behaviour:** ← / → move selection (wrapping, skipping disabled), Home/End jump; one tab-stop for the whole row; selection carries keyboard focus with it. Group name default "Sections".
- A host can restyle the pills (the image editor draws 112-wide grey chips) while keeping the keyboard contract.

### C17. Badge
- Flowbite badge, size xs: 12 px semibold, 8/2 padding, radius 4, no border. Tints:
  - gray — gray-100 fill / gray-800 text ("AVAILABLE", "COMING SOON", neutral media badges)
  - success — green-100 / text overridden to **green-600** ("CURRENT", "LIVE", "CONNECTED")
  - failure — red-100 / text overridden to **red-700** ("ERROR", danger media badges)
  - warning — yellow-100 / yellow-800 (media cards override the fill to yellow-50)
  - **purple — purple-100 / purple-800: the PRO / plan badge** (the one sanctioned purple)
  - Flowbite's unstated default is **cyan-100 / cyan-800 ("info")** — note: the Integration row's "PRO" badge currently falls back to this cyan; it should be purple like the other two PRO badges. Flag.
- With an icon the badge becomes a full-radius pill with 6 pad. Badge labels in chrome are UPPERCASE nouns.

### C18. Chip (filter chip)
*(Figma 144:14–144:25, the Media drawer's type filters.)*
- **Purpose:** a pill toggle with a label and usually a live count ("image 12", "video 3", "svg 0").
- **Look:** full-radius pill, **min 24 tall** (the board's 22 fails the 24 px minimum, so the floor lives in the component), 8 h-pad, 3 v-pad, 11 px, 4 px gap. Unselected: gray-100 fill, ink label, count in Geist Mono 500 ink-soft; hover gray-200. **Selected: blue-50 fill, accent text — label AND count** take the accent. Focus: focus ring. Count uses tabular figures so a filtering list does not twitch. Labels are lowercase in the board.
- **Behaviour:** acts as a tab inside a tablist or as a pressed toggle on its own.

### C19. Issue chip (top bar)
- **Purpose:** the permanent issues anchor in the top bar — always visible, even at zero, so its position is learned before the first failure. Opens the Issues panel.
- **Look:** 28 tall, 8 h-pad, radius 6, transparent, 4 px gap, a 16 px glyph + (when > 0) a 12 px semibold tabular count (caps at "99+"). Severity by **shape and colour**: zero = shield-check, ink-muted, hover gray-100; warnings = triangle, yellow-800, hover yellow-50; errors = octagon, red-700, hover red-100. Focus: focus ring.
- **Tooltip / accessible copy:** "No issues" · "3 issues · 1 error, 2 warnings — review before publish" (pluralised correctly: "1 issue", "1 error"). A read-only viewer gets " — <reason>" appended. An amber/red chip previews that Publish will read "Publish anyway".

### C20. Status dot
*(Figma component set 10:27.)*
- 8 × 8 round. States and default labels: **live** green-500 "Live" · **review** yellow-500 "In review" · **changes** accent "Changes requested" · **draft** gray-400 "Draft" · **failed** red-600 "Failed". Colour never carries meaning alone — every dot ships a label (visible text beside it or accessible name).

### C21. Save status pill (top bar)
*(Figma 697:461 / 813:4836; colours are a founder call over the board's off-token hues.)*
- **Look:** 24 tall, 8 h-pad, full radius, 12 px, 8 px gap, a **6 px dot** then the text. Six states:

| State | Fill | Text colour | Dot | Copy |
|---|---|---|---|---|
| Saved | none | success-text green | success | "Saved", then a timestamp suffix: "Saved just now" (<10 s), "Saved 12s ago", "Saved 2m ago", "Saved 3h ago", "Saved 2 days ago" |
| Saving | none | ink-soft | gray-500 | "Saving…" |
| Unsaved | none | warning-text | warning | "Unsaved changes" |
| Conflict | warning tint | warning-text | warning | "Conflict — reload" |
| Offline | warning tint | warning-text | warning | "Offline — not saved" |
| Error | error tint | error-text | error | "Save failed — retry" |

- **Behaviour:** in Unsaved and Error the pill **becomes a button** (click = save now / retry); otherwise it is plain status. When the top bar is narrower than 1200 px the timestamp suffix hides and "Saved" stays. In read-only view mode the pill is omitted entirely. No live-region of its own (the top bar announces).

### C22. Review pill (top bar)
- 24 tall, 8 h-pad, full radius, 12 px medium, label capped at 140 px with ellipsis (full text on hover). Tones: **info** and **success** are identical — gray-100 fill, ink-soft text ("In review", "Approved"); **warning** — yellow-50 fill, yellow-800 text ("Changes requested" — the only review state that blocks publish keeps amber). It is a button when there is somewhere to go, plain text when not.

### C23. Live chip (top bar)
- Appears beside the save pill when the site is live: a 6 px green-600 dot + the **domain only** (not the full URL), 12 px ink-soft, 24 tall, 8 h-pad, radius 4, hover gray-100 + ink. Opens the live site in a new tab; hover title "Open the live site — <full url>"; screen readers hear "Live at <domain>".

### C24. Presence (avatar stack + connection pill)
*(Figma 692:472.)*
- **Renders nothing when you are alone and connected.** Otherwise: up to 3 avatars (24 px, round, overlapping by 8, each with a 2 px white ring; **your own avatar has a 2 px accent outline 2 px out**), then a "+N" overflow disc (20 px, gray-200 fill, gray-700 11 px medium, white ring) past three, then the **connection pill**: 20 tall, 8 h-pad, full radius, 11 px medium, 8 px dot — live green-100/green-600 "N editing" · reconnecting yellow-50/yellow-800 "Reconnecting…" · offline red-100/red-700 "Offline". Offline announces assertively.

### C25. Avatar
- Flowbite avatar. Sizes xs 24 · sm 32 · md 40 · lg 80 · xl 144; round or radius-4 square; optional status dot (online green-400 / away yellow-400 / busy red-400 / offline gray-400) and bordered ring. Image, else **initials** (first letters of the first two words, uppercase), never a placeholder glyph.
- **Identity tones** (derived from the user id so a person is the same colour everywhere): neutral gray-200/gray-700 · blue blue-100/blue-800 · green green-100/green-800 · purple purple-100/purple-800 · amber yellow-100/yellow-800.
- Avatar group counter (Flowbite): 40 px gray-700 disc, white text — unused in chrome; the Presence overflow disc above is the kit's version.

### C26. Tooltip (standard)
- Flowbite tooltip forced to its **light** style: white bubble, 1 px gray-200 border, radius 8, 12/8 padding, 14 px medium (Flowbite) with **ink-soft text**, small shadow, optional 8 px arrow. Default placement top; opens on hover and keyboard focus; Escape closes. Max width is set per use (e.g. 220 or 280 with wrapping). Never dark (no-black rule; founder call).

### C27. Help tooltip ("What's this?")
- An **18 × 18** round, transparent trigger with a 14 px (or 16 px) circled-question-mark glyph in ink-muted, help cursor, 4 px left margin, sitting after a label. Opens the standard tooltip (no arrow, max 220 wide, 1.4 line-height) with the help text and, optionally, a second line "Learn more →" in accent 12 px that opens docs in a new tab. Accessible name "What's this?".

### C28. Hint tooltip (rail / tablist-safe)
- A tooltip that adds nothing around its trigger (needed inside the rail, which is a tablist). Bubble: white, 1 px gray-200 border, radius 8, 12/8 padding, **12 px medium ink-soft**, overlay shadow, max 280 wide, sits on the topmost layer. Placements: below-left, below-right, or **right** (beside a rail icon, vertically centred). Hover opens after 150 ms; focus opens immediately; pointer-down, blur, Escape, scroll or resize close/reposition; clamps 8 px inside the viewport and flips above when there is no room below. Content can compose label + shortcut key.

### C29. Popover
- **Purpose:** an anchored floating panel next to its trigger (not portalled, so reading order stays intact).
- **Look:** white, 1 px gray-200 border, radius 8, 8 pad, min 180 wide, overlay shadow, 13 px ink. Placements: below-start, below-end, above-start, above-end, right — each offset 4 px from the trigger. If it would leave the viewport it nudges back to stay 8 px inside.
- **Behaviour:** closes on Escape and on pointer-down outside. The trigger can be inline or stretch full width.

### C30. Dropdown menu / context menu
- **Menu container:** 4 pad, min 200 wide (usually inside a Popover). Opening moves focus to the first item.
- **Menu item:** 32 tall, 8 h-pad, radius 6, 13 px ink, left-aligned, full width; hover gray-100; keyboard focus blue-50 fill + accent text; **danger** items red-700; **disabled** gray-300 and unclickable. Anatomy left→right: optional **checkmark column** (12 wide, accent "✓" when a checkable item is on), optional icon (muted), label (fills), optional shortcut hint (11 px muted, right-aligned).
- **Group:** separated by a hairline above with 4 px spacing (no rule above the first group).
- **Group label:** 11 px medium, +0.08em, UPPERCASE, ink-muted, 4/8/2 padding.
- **Separator:** 1 px gray-200, 4 px vertical margin.
- **Keyboard:** ↑/↓ move (wrapping, skipping disabled), Home/End jump, one tab-stop for the whole menu, Escape closes (via the Popover). Group name default "Actions".
- There is **no separate context-menu component**; right-click menus compose this same Menu.

### C31. Modal / dialog
*(Figma component set 19:79 — kinds question | flow | form; sizes measured on 1164:4713, 1175:4827, 1205:4804, 1170:4713/4749, 1172:4840, 184:24.)*
- **Scrim:** full-viewport ink-40%, centred content (or top-aligned for the palette), layer 50; the dialog sits at layer 60.
- **Frame:** elevated white, **radius 12**, overlay shadow, max 80% viewport height, max viewport − 32 wide, column layout.
- **Widths:** question **440** · form **560** · flow **720**; the compound form adds sm **360**, md **520** (Brand review), fields **500** (collection fields), table **640** (records table, media picker), lg 720, xl **960**.
- **Header:** 16 top / 16 sides / 12 bottom. Title **14 px semibold ink**; optional subtitle 12 px ink-muted beneath, 4 px gap. (Compound form: title 20 left / 48 right / 16 top / 12 bottom to clear the close button; subtitle 20 sides.)
- **Body:** 16 sides, 0 top, 16 bottom, scrolls, 13 px ink-soft.
- **Footer:** hairline above, 12/16 padding, right-aligned, 8 px gap; **every button inside is 28 tall with 12/6 padding**.
- **Close button:** an icon button "✕" absolutely at 12/12 from the top-right; accessible name "Close".
- **Behaviour:** focus moves to the first focusable control on open, Tab cycles inside, focus returns to the opener on close; Escape closes **only the topmost** dialog; scrim click closes by default — **destructive/warning confirms turn scrim-dismiss off**; a **dirty form** (unsaved input) answers a scrim click with a single 320 ms 1.5% scale pulse instead of closing (board 183:16; suppressed under reduced motion). While any modal is open, global shortcuts stand down.
- Destructive confirms name the action in the button, never "Confirm".

### C32. Confirm dialog
*(Boards 183:60 success-then-close, 184:24 rollback, 183:16 dirty.)*
- A 440-wide question modal with a message body and two footer buttons: **Cancel** (ghost-styled light button, ink-soft → ink on hover; label configurable) and the **confirm** (label required, names the action).
- **Tones:** default (accent confirm, scrim-dismiss on) · **warning** (amber `#C27803` confirm, white text — "consequential and reversible", e.g. re-publishing an older version; scrim-dismiss off) · **destructive** (red confirm; scrim-dismiss off). Busy = confirm disabled + busy flag.
- **Success-then-close variant:** after confirming a synchronous action the same dialog swaps to a centred result: a **40 px green-600 disc with a white "✓"** (16 px semibold), the result sentence at 13/20 ink ("3 pages deleted."), then "Closing…" at 11/16 muted; it closes itself after 1.4 s. Padding 8 sides / 16 top / 24 bottom.

### C33. Upgrade modal (plan gating)
*(Board 1175:4804.)*
- Opened by any Pro-gated control (the component owns a single global "open upgrade" door; the old second upgrade modal is gone).
- **Title** "Upgrade Your Plan". **Body**, left-aligned on plain white, 12 px gap: a **purple PRO badge** showing the required plan ("Pro"), a 14 px ink-soft sentence "<Feature> requires the Pro plan." (or "This feature requires the Pro plan." when unnamed), then four benefit rows each with a green "✓" and 13 px ink text: "Custom domain", "Premium templates", "AI-powered features", "Priority support".
- **Footer:** "Maybe Later" (light) · "Upgrade to Pro" (primary) — the latter opens the dashboard billing page in a new tab and closes the modal.

### C34. Drawer (left panel)
*(Figma component set 19:46 — layouts list | grid | table; shell 52:2.)*
- The panel every rail tool opens into. **280 wide** (token; the header's expand toggle takes it to 700), white, hairline right border (gray-100), column: **panel header (C36)** → body → optional footer (hairline top, 8/12 padding). Body layouts: list (scrolls) · grid (2 columns, 12 gap, 12 pad) · table.
- Note: this is the left drawer, **not** a slide-in side sheet. **The kit has no overlay drawer/side-sheet component**; "drawer" always means the left panel.

### C35. Right panel (inspector column)
*(Figma 19:47.)*
- White, hairline left border, **300 wide** (inspector) or **360 wide** (Issues, Notifications, History, Review), column: panel header → scrolling body with 12 pad and 12 gap.

### C36. Panel header + action cluster
*(Figma molecule 16:6; measured on 148:2 → Title Case, not caps.)*
- **Drawer size (default): 44 tall**, white, hairline bottom (gray-100), 16 left / 12 right padding, 8 gap. Title **11 px medium, +0.08em, ink-soft, Title Case** ("Content", "Pages", "Layers"). It is a level-2 heading.
- **Panel size: 48 tall**, title **14 px medium / 21 line, ink** — for the 360-wide right-hand surfaces.
- **Optional subtitle** sits to the **right** of the title (not below), max 160 wide, truncates with hover title, normal case, ink-soft ("53 blocks · 6 categories").
- **Action cluster** (right, 4 gap, all 32 px icon buttons): custom actions → **Expand** (four-corner-brackets glyph; toggled state = blue-50/blue-700; label "Expand <title>" / "Collapse <title>") → **Help** ("?") → **Close** ("✕", label "Close <title>" or an override when the close affects something other than the titled section). Drill-in headers reuse the cluster with their own title area.

### C37. Panel frame
- The width contract + head/body split every panel uses: **narrow** = fills its drawer host (white) · **wide** = 360 (white) · **fullpage** = fills the canvas area on app-grey. Optional 1 px gray-200 border with radius 8 (bordered card mode). Header delegates to C36; body scrolls (or is fixed) and shrinks correctly.

### C38. Section header (collapsible group caption)
*(Figma 16:16 — Tint · Count.)*
- **28 tall**, 16 h-pad, 8 gap; label **11 px medium, +0.08em, UPPERCASE, ink-muted**; optional **tint** (subtle gray-100 fill); optional right-aligned **count in Geist Mono tabular, tracking reset** so filtering does not jitter ("Collections" … "3"). Renders as a heading (level 3 by default) so panels have a skimmable outline.
- **Collapsing:** the kit's section header carries no chevron of its own; collapsible sections compose it with a tree twisty or an expand icon button. **There is no Accordion component in the kit** — accordions are built from Section header + a hidden body.

### C39. Toolbar (control strip under a panel header)
- 12 h-pad, 8 v-pad, 6 px gaps, wraps rather than scrolling, hairline on the bottom edge (or top edge when it sits under content). Carries filters, scope switches, view modes, search. A spacer pushes what follows to the far end. Distinct from the panel header (which owns pin/help/close).

### C40. Footer (shell status bar)
- **32 tall**, white, hairline top (gray-200), 16 h-pad, 12 gap, **11 px ink-muted**. Selection count, batch actions, status. Spacer available.

### C41. Form field wrapper (label / hint / error wiring) + Field row + Label / Helper text
- **Form field wrapper:** vertical stack, 4 px gap: **label** (12 px, medium, ink-soft; optional red "*" for required) → the control → **hint** (11 px, muted, no top margin) **or** **error** (11 px, error-text red, announced as an alert). The control receives the id and "described-by" wiring automatically.
- **Field row (inspector label + control):** a **96-wide** fixed label column (12 px ink-soft) beside a control area, 12 gap, min 32 tall; or **stacked** (label above, 4 gap) for full-width controls such as textareas and segmented groups. Optional hint appears as the label's hover title. One label width for the whole inspector.
- **Label** (Flowbite): 12 px medium ink-soft in chrome. **Helper text**: 11 px muted; error colour red-700 text (`#C81E1E`).

### C42. Form field compositions (label + control, ready-made)
- **Input field:** label/hint/error + text input; optional left icon (muted, 10 px inset, input text starts at 32). Bare (no label) renders just the input.
- **Number field:** label + number input + optional unit suffix (12 px muted). Native arrow-key stepping only.
- **Select field:** label + select with "Select..." placeholder (muted until chosen), option groups, disabled options.
- **Slider field:** 12 px medium ink-soft label above the slider (C14).
- **Textarea field:** label + textarea; error = red border.
- **Colour field:** see C52.
- **File field (drop zone):** see C53.

### C43. Toast
*(Boards 1177:4859 catalogue; 814:7027 dark undo/redo bar.)*
- **Viewport:** fixed **bottom-right, 16 px in**, **360 wide** (max viewport − 32), stacks upward with 8 px gaps, layer 80. Polite announcements; assertive if any error toast is present.
- **Card (tinted tones):** radius 8, overlay shadow, **12 pad**, top-aligned row, 8 gap; **title 13 px medium in the tone's text colour**, **body 12 px ink-soft**, then an optional **action** (light xs button styled ghost) and a **dismiss "✕"** button (ghost). The whole card is tinted:

| Tone | Fill | Title colour |
|---|---|---|
| neutral | gray-100 | ink-soft |
| info (default) | accent tint blue-50 | accent |
| success | green-100 | green-600 |
| warning | yellow-50 | yellow-800 |
| error | red-100 | red-700 |
| **dark** (undo/redo) | **ink `#111827`** | white |

- **Dark tone:** a one-line bar, 10/10 padding, centred row, **11 px gray-200 text**, the reverse action as an inline **blue-300 link** (11 px semibold, hover white) rather than a button. This is the kit's sole dark surface (board 814:7027).
- **Duration:** default **5 s**; a toast can persist until dismissed. Copy button toasts use 2 s (success) / 4 s (error).
- **Copy:** dismiss button accessible name "Dismiss notification".
- Toasts fired before the shell mounts still land (queued).

### C44. Banner / inline alert
- **There is no dedicated banner/alert component in the kit.** Inline notices are composed from the toast tints (a tinted box with a title and body) or from the helper-text error line; the top bar surfaces trouble through the save pill and the issue chip. The legacy **offline tooltip** (white card, 1 px red border, radius 8, 4/10 padding, 11 px red medium, hanging 6 px below its anchor at the right) still exists for the old top bar and should be considered retired.

### C45. Progress bar
- Flowbite progress: rounded track (gray-200), fill **forced to the accent** (chrome overrides Flowbite's default blue-600). Sizes sm 6 tall (what chrome uses) · md 10 · lg 16 · xl 24. Optional text label and percentage label inside/outside (unused in chrome). Used by publish progress, issue auto-fix ("Applying the fix"), upload progress, publish history.

### C46. Skeleton
- **Block:** gray-100, radius 4 (or a circle), a slow opacity pulse; the pulse stops under reduced motion but the block stays. Every skeleton in the editor is this grey and this animation; only geometry varies.
- **List-item skeleton:** a white card row (hairline border, radius 8, 12/16 padding, 12 gap): optional circle (40) + two lines (12 tall; 50% and 80% wide, 4 apart) + optional 32 × 32 action block.
- **Studio boot screen:** full-viewport app-grey; a 56-tall white top bar (two 32 chips, a 160 × 32 title block, two 80 × 32 actions, hairline below); a 60-wide white rail with five 36 × 36 blocks and a 36 avatar circle at the bottom; a canvas area with a 70%-sized white "page" (radius 4, raised shadow) and, centred over it, the 48 px accent boot spinner with the caption **"INITIALIZING ENGINE"** (13 px medium, +0.08em, ink-muted).

### C47. Empty state
*(Figma 17:18.)*
- **Rule:** an empty state without an action is a dead end — every one of the editor's 11 empty states has a next step. Typographic only, no illustration.
- **Anatomy (top→bottom):** optional icon → **title** (13 px medium ink) → **body** (12 px ink-muted, max 34 characters wide) → **action(s)** (8 gap row, usually a link or secondary button).
- **Sizes:** md (full panel: 8 gap, 32/24 padding) · sm and compact (inline slots: 4 gap, 16/12 padding).
- **Alignment:** centred card (default) or **left-anchored top-of-panel block** (newer boards). Both are the same component.

### C48. Rows (the list vocabulary)
*(Figma component set 8:47 Size × State; Nav 16:26; List 232:6; Tree 243:6; Version 240:6; Record 240:14; Format 249:6; Integration 257:6; Comment 17:40 / 156:2 / 157:2.)*

**Base row** — full-width, 16 h-pad, 8 gap, 13 px ink, transparent, no radius. Sizes: dense **28** (11 px) · default **32** (13 px) · header **44** · stack **44** (a name over a type line, centred) · tall **56** · comment **min 64, top-aligned, 12 v-pad**. States: interactive → pointer + quiet hover (gray-100); **selected → blue-50 fill, blue-700 text, and a 3 px accent bar flush on the left edge** (the product-wide "chosen" language shared with the rail and nav); disabled → gray-300 text, no pointer; keyboard focus → **inset** focus ring. Enter/Space activate an interactive row. Rows are containers, so they may hold their own buttons (rename, delete, chevron). Shared internals: label truncates with ellipsis; **meta is Geist Mono 11 px medium tabular ink-muted**; chevron "›" ink-muted; leading icon ink-muted.

| Row | Height | Anatomy & specifics |
|---|---|---|
| **List row** (collections, pages, media folders) | 32, radius 4 | icon · label 13/20 · mono count 11/16 · chevron "›" |
| **Tree row** (Layers, Pages tree) | 28 dense | indent = 16 + depth × 12 · 16 px **twisty** ("›" rotates 90° when expanded; empty 16 px spacer when not expandable; labels "Expand X"/"Collapse X") · icon · label · mono meta. Flat list with levels, so long trees can virtualise. |
| **Version row** (History, Publish history) | 56, column | top line: optional leading glyph/thumbnail · status dot · **title 500** · optional **"CURRENT"** badge (History) or **"LIVE"** (Publish history) in green · actions; second line: mono meta ("2m ago · 12 changes"). |
| **Record row** (CMS records) | 32, radius 4 | status dot (green "Published" / gray "Draft") · label 13/20 · mono meta · chevron |
| **Format row** (export formats, publish targets) | min 64, 8/16 padding | a **real radio** (16, white, accent when checked) · title · 12 px ink-soft description · trailing slot. Card-like: 1 px gray-200 border, radius 8, white; **checked = accent border + blue-50 fill**. Disabled ("coming soon") draws an empty 16 px ring instead of a radio, 50% opacity, and is skipped by arrow keys. Arrow keys move between options. |
| **Integration row** (Settings → Integrations) | 64, 16 h-pad, 12 gap | logo · name (500) over scope (12 px muted) · optional **PRO** badge · status badge **CONNECTED** (green) / **AVAILABLE** (gray) / **COMING SOON** (gray) / **ERROR** (red) · action. Card-like (border, radius 8, white). |
| **Comment row** (Review panel) | 64, 16 left / 12 right / 10 v, 8 gap, hairline bottom | **status dot** (warning = open, success = resolved, 8 px, nudged 6 down) · the quoted comment **“…” on ONE line at 13/20 ink, clipped, full text on hover** · optional detached note in 11 px warning-text ("was on: "Book a table" — element deleted") · meta line **12/18 ink-muted**: "<author> · client|you · Home · 2d · resolved" · trailing actions (Resolve, Reattach). The comment is the row; people come second. |
| **Nav item** (Settings sub-nav) | 32, 16 left / 12 right, radius 8 | icon (muted) · label · trailing (count/chevron). Hover gray-100 + ink. **Current = blue-50 fill, blue-700 medium text, 3 px accent bar on the left (rounded left corners)**; announced as "current page". |

### C49. Cards
- **Media card** *(Figma 17:6)*: a 4:3 thumbnail well (gray-100, 1 px gray-200 border, radius 6, image cover-fit) with an optional badge at top-left 4/4 (neutral gray · success green · warning yellow-50 · danger red · **pro purple**), then the filename at 12 px ink, one line, ellipsis. 4 gap. Keyboard focus rings the thumbnail.
- **Site card** *(Figma 17:9)*: white card, 1 px gray-200 border, radius 8; 16:10 thumbnail well (gray-100, hairline below); body 12 pad, 4 gap: name 13 px medium ink; a row of status dot + label (11 px muted) with meta right-aligned. **Hover: border gray-300 + raised shadow** (the one sanctioned hover elevation, dashboard tile). Focus: focus ring.
- **Card** (Flowbite): white, 1 px gray-200, radius 8, **md shadow**, 24 pad, 16 gap; optional image top. Used for the stock-source picker tiles (selectable). Note Flowbite's default shadow is heavier than the chrome scale — flag when redrawing.

### C50. Colour swatch / colour field
- **Colour field:** vertical stack, 8 gap: optional 12 px medium ink-soft label → a row (8 gap) of a **32 × 32 swatch** (radius 6, 1 px hairline; a checkerboard when the value is "transparent"; the native OS colour picker opens on click) and a text input for the hex (placeholder "#000000") → an **11-column preset grid** of **20 × 20** swatches (radius 4, hairline, 4 gap): black, white, red, orange, yellow, green, teal, blue, violet, pink, transparent. The selected preset shows a 2 px accent outline 2 px out. Disabled dims everything. Note the preset palette is the site-builder's, not chrome's.
- **Native colour input** (anywhere): pointer cursor, 2 px inner padding, swatch radius 4, no border.
- **Legacy swatch class:** inset 1 px 10% black + 1 px drop shadow, 200 ms transition — retire.

### C51. Copy button
- Inline button: 4 gap, radius 4, 12 px medium, a 14 px copy icon + label ("Copy" by default). Sizes sm 4/8 · md 4/12 padding. Variants: **ghost** (transparent, hover gray-100, ink-soft → ink) · **outline** (1 px gray-400 border) · **solid** (gray-100 fill, hover ink-8%). On success the icon becomes a check, the label reads **"Copied!"** in green-500 for 2 s, and a success toast says **"Copied to clipboard!"**. On failure an error toast says **"Failed to copy — your browser may not support clipboard access"**. Accessible name "Copy <label>" / "Copied".

### C52. File drop zone (file field)
- Optional 12 px ink-soft label → a **dashed 2 px** box, radius 8, 24 pad, centred: a large folder **emoji** (32 px — **violates anti-slop rule 6; replace with a Lucide glyph**), the line "Drop files here or click to upload" (ink) or "Uploading..." while busy, then 12 px muted "Accepted: <types>" (or "All file types accepted") with " • Max: 2.0 MB" when a limit exists. Border colour: hairline → accent while dragging over (fill turns accent-subtle) → red on error. **Bug/flag:** the resting fill is set to gray-900 — a near-black surface that breaks the no-black rule; it should be subtle grey. Disabled 50% opacity, not-allowed.
- Chosen files list below (8 top): each a subtle-grey row (radius 6, 8/12 padding): filename 13 px ellipsis · size 12 px muted ("B / KB / MB") · a muted "✕" remove button. Error line 12 px red underneath.

### C53. Form settings section (inspector, for a form element)
- Not a form element selected: a single 11 px muted hint "Select a form element to configure submission settings."
- Form not yet enabled: a primary button **"Enable Form Handling"** and the hint "Enable form handling to add submission actions, validation, and notifications."
- Enabled: 12 pad, 12 gap column. A subtle-grey header strip (8/12 padding, radius 6) showing **"Form ID"** (11 px UPPERCASE muted, +0.5px) and the id in 12 px monospace. Then fields (label 11 px uppercase muted over a control; controls are white, hairline, radius 6, 8/12 padding, 13 px): **Action** select — "Store Submission" / "Send to Webhook" / "Send Email"; **Webhook URL** (only for webhook; placeholder "https://..."); **Success Message** (placeholder "Thank you for your submission!"); **Error Message** (placeholder "Something went wrong..."); **Success Redirect** (placeholder "/thank-you (optional)"); **Email Field Name** (placeholder "email") with hint "Field name containing submitter email for confirmations". Defaults when enabling: success "Thank you for your submission!", error "Something went wrong. Please try again."
- Flag: these controls are hand-styled, not the kit's text input/select; restyle to C6/C8 when redrawing.

### C54. Form state overlay (submission result, on the canvas)
- A full-screen 50% black scrim (legacy value) with a centred white card: max 400 wide (90%), **radius 12**, 32 pad, heavy 20/40 shadow, and a **4 px coloured top border** (emerald `#10B981` success / red `#EF4444` error — off-palette legacy values). Inside: a 48 px circled check or X icon, a **24 px semibold** title "Success!" / "Error" in the same colour, a 14 px ink-soft message ("Form submitted successfully!" / "There was a problem submitting the form."), for errors a left-aligned list of red 13 px rows "<field>: <message>" on a 10% red fill, and a primary button **"Continue"** / **"Try Again"**. Auto-dismisses after 5 s. Flags: coloured top border (anti-slop 7), off-palette colours, heavy shadow — redraw to the modal (C31) with the confirm-success pattern.

### C55. Overlay root, portal, scrim & focus trap (behaviour every floating surface shares)
- All floating chrome (modals, palette, toasts, hint tooltips, portalled popovers) mounts into **one overlay container** at the end of the page, so stacking is predictable (B9 layers).
- **Scrim** = ink 40%, full viewport, layer 50; content centred (or top-aligned at 12% for the palette).
- **Focus trap:** focus moves into the first focusable control on open (skipping anything hidden or deliberately out of the tab order, e.g. unselected tabs), Tab/Shift-Tab wrap inside, focus returns to the opener on close. Escape closes only the topmost dialog. While a dialog is open, all global shortcuts (C, ?, ⌘K, ⌘S, undo) are suspended.
- **Portal (no scrim):** an escape hatch for surfaces that draw their own chrome and merely need to escape a clipping ancestor (hint tooltips).

### C56. Rail + rail item
*(Shell 52:6.)*
- **Rail:** 60 wide, app-grey (gray-100) fill, hairline right (gray-200), column, 8 v-pad, 4 gap. It is a toolbar (switches the drawer), announced as "Editor tools". Spacer pushes bottom items down (account avatar).
- **Rail item:** **44 × 44**, radius 8, column: icon over an 11 px label (label can be hidden → tooltip via C28). Rest ink-muted; hover gray-100 + ink; **active = blue-50 fill, blue-700 icon+label, and a 3 px accent bar 8 px outside the left edge (full radius, inset 8 top/bottom)**; focus ring. Active is announced as current.
- The six tools, frequency-ordered: Insert · Layers · Pages · Media · Content · Brand (shortcuts A · L · P · M · D · B).

### C57. Editor shell (the frame every screen renders into)
*(Figma 52:2.)*
- Column on app-grey: **top bar (56)** → a row of **rail (60) · drawer (280) · canvas (flex, app-grey, labelled "Canvas") · inspector (300)** → **footer (32)**. Slots are optional per screen (settings has no inspector, preview has no drawer) but nothing else varies — that is the mechanism that prevents cross-screen drift.

### C58. Top bar
*(Figma component 681:122; frames 681:26 / 682:4576 / 682:4651.)*
- **56 tall**, white, hairline bottom (gray-100), 12 h-pad, 12 gap, 13 px ink. Ten children in fixed order, left → right:
  1. **Exit** — "‹ Exit" (28 tall, 10 h-pad, 12 px regular, ink; hover gray-100). In view mode the label changes to leave the mode, not the product.
  2. **Site name** — a **fixed 200 px column**, 14 px medium ink, single line, ellipsis, full name on hover.
  3. **Save status pill** (C21) — omitted in read-only view.
  4. **Live chip** (C23) — when the site is live.
  5. **Review pill** (C22) — when a review round exists.
  6. *spacer*
  7. **Tools cluster** (right-bordered by a hairline, 2 gap, 8 right pad): **Quick preview** eye icon button (spinner glyph while busy) · **Comments** toggle icon button (pressed state) · **Issue chip** (C19). The cluster shows only what the container passes (view mode: comments only; viewer: read-only-labelled issues).
  8. **Presence** (C24).
  9. **Notifications** bell icon button with an **8 px accent dot** (2 px white ring) at top-right when unread; accessible "Notifications, N unread".
  10. **Publish CTA** — the one filled button in the shell (32 tall, 16 h-pad, 14 px medium). States: **ready** "Publish" · **anyway** "Publish anyway" (issues exist) · **disabled/blocked** "Publish", looks disabled but stays focusable with a tooltip (default "Publishing is unavailable", max 280 wide, below-right, no arrow) · **published** "✓ Published" in green-100/green-600 for a 2 s beat, non-clickable · **hidden** (no control at all, e.g. viewers) · **busy** natively disabled. The verb can be overridden by lifecycle ("Send for review", "Open feedback", "Publish changes") with a one-sentence hover hint. A different action node (e.g. an editor's "Send for review") can replace the button entirely.
  11. **Site menu** "···" trigger (a 16 px three-dot glyph in an icon button) opening a Menu (C30).
- The bar measures its own width; below 1200 px the save timestamp hides first.
- Inline glyphs (16 px, 2 px stroke): eye, speech bubble, open-arc spinner, bell, three dots.

### C59. Legacy leftovers a designer will still see (retire on redraw)
- Old **toast** (fixed bottom-right 24/24, min 300 wide, 16/20 padding, white, hairline, radius 8, overlay shadow, slide-in + fade 300 ms).
- Old **spinner** (16 px ring, 2 px, white-20% track, 600 ms) and a `float` bob keyframe.
- Old input **hover lift** and italic placeholders; old select hover lift / active accent border; old **slider knob scale-up glows**; old colour-swatch shadow.
- Global radius 8 on old input/select/button/panel classes.
- **Dirty-modal pulse** (320 ms, 1.5% scale) and **shake** keyframe (±4 px) — the pulse is live and sanctioned; the shake is unused.

### C60. Element-type icon map (Lucide glyphs used in Insert, Layers and the Inspector)
Sizes: xs 12 · sm 14 · md 16 (default) · lg 20. Anything unlisted draws the generic box.

| Element type | Glyph (Lucide) | Meaning to the user |
|---|---|---|
| link / a | Link (chain) | Hyperlink |
| button | Mouse pointer | Button |
| image / img | Image (landscape) | Picture |
| video | Video camera | Video |
| input | Form input (box with cursor) | Text field |
| textarea | File-text | Multi-line text field |
| select | Ordered list | Dropdown |
| form | Square | Form container |
| container / div | Box (3D cube) | Generic container |
| section | Layout template | Page section |
| hero | Home | Hero block |
| navbar / nav | Navigation arrow | Navigation bar |
| footer | Footprints | Page footer |
| card | Credit card | Card block |
| heading | Type (T) | Heading |
| h1 … h6 | Heading 1 … Heading 6 (H with number) | Heading by level |
| text / span | File-type | Inline text |
| paragraph / p | Align-left lines | Paragraph |
| list / ul | List (bullets) | Bulleted list |
| ol | Ordered list | Numbered list |
| li | Dot | List item |
| iframe | Globe | Embedded frame |
| grid | Layout grid (2×2) | Grid container |
| flex | Move (four arrows) | Flex container |
| features | Sparkles | Features block |
| header | Panel-top | Page header region |
| main | Layout panel-top | Main region |
| article | Newspaper | Article |
| aside | Panel-right | Sidebar region |
| icon | Shapes | Icon element |
| divider | Minus | Horizontal rule |
| *(default)* | Box | Unknown / other |

### C61. Behaviour hooks that produce something visible (brief)
- **Click-outside / Escape** — dropdowns and popovers close on outside mouse-down and on Escape.
- **Reduced motion** — components can read the OS preference and stop their own animations (skeleton pulse, boot spinner).
- **Element flash** — a newly created or duplicated canvas element scales 1 → 1.04 → 1 over ~300–500 ms as confirmation.
- **Dirty pages** — pages with unsaved edits show an **accent ● dot** in the page tab bar and the Pages tree (boards 435:2368, 140:21 / 1171:4729: "checkbox · chevron · icon · name · home ⌂ · dirty ●"); navigating between pages does not mark them dirty; a project save clears every dot.
- **Refetch on focus** — ambient status (review pill, unread badge) refreshes when the user returns to the tab, at most every 30 s.
- **History state** — powers the History panel's list, Undo/Redo enablement and "clear history".
- **Version history** — powers the Versions list (loading skeleton until storage answers; an error state with retry; the empty state "Version history appears here as you save changes" only when truly empty).
- **Auto-milestone suggestion** — after a page is added, an element deleted, a large multi-property change, or 10 auto-checkpoints, the editor may propose a named save version (AI-suggested name, default "Update") with reasoning; the user can dismiss, edit the name, or accept. At most one suggestion per 30 s; silently skipped when AI is unavailable.
- **Form handler** — registers a canvas form's submission config and drives C53/C54.

### C62. Not in the kit (so the designer does not look for them)
No Accordion (compose Section header + body) · no overlay Drawer/side sheet · no Banner/Alert · no standalone Divider (only the menu separator and hairline borders) · no Scroll-area or custom scrollbar · no Resizable panel handle (the drawer expands via the header toggle, 280 ↔ 700) · no Table component (rows compose lists; "table" is a drawer body layout) · no −/+ Stepper · no Token chip (lives in the inspector module) · no Date picker · no Context-menu distinct from Menu · no Combobox other than the command palette · no Pagination.

---

# Engine rules, shortcuts and limits — the "rules of the world"

**What this module is.** This is not a screen. It is the set of rules every screen in the Buildrik editor obeys: how an element is built and named, which screen sizes exist and how styles cascade between them, which states an element can be styled in, what undo can and cannot take back, how often work is saved and what happens when a save fails, the hard limits (pages, file sizes, history depth), the exact validation and error sentences the product prints, what each subscription tier locks, the getting-started checklist, and every keyboard shortcut in one place. A designer needs this to know what any panel can promise, what it must refuse, and what copy is already fixed.

Throughout: "⌘" means Cmd on Mac and Ctrl on Windows/Linux — every chord below accepts either.

---

## 1. Screen sizes (breakpoints) and device previews

There are two different things that both look like "device switching", and they are not the same list. A designer should keep them apart.

### 1a. Responsive breakpoints (where styles live)

These three are the only sizes a style can be *saved against*. They decide the cascade on the published site.

| Name | Width range | How it is applied on the live site | Icon |
|---|---|---|---|
| Desktop | 1024px and wider | Base styles — no media query. Everything starts here. | desktop |
| Tablet | 768–1023px | Overrides applied at 1023px and below | tablet |
| Mobile | 0–767px | Overrides applied at 767px and below | mobile |

**Cascade rule — desktop-first.** Desktop is the base. A Tablet override sits on top of Desktop. A Mobile override sits on top of *both* Desktop and Tablet — so when you preview Mobile, the Tablet overrides are applied first, then the Mobile ones. Editing on the Desktop breakpoint changes the base that Tablet and Mobile inherit; editing on Tablet or Mobile changes only that override.

**What the canvas does while previewing Tablet/Mobile.** The canvas is a narrowed frame inside a full-width page, so real media queries would never trigger. The editor re-applies that breakpoint's overrides on the canvas directly (forced, so they win over the element's base styles). Exports do not carry this hack. Consequence for design: a Tablet/Mobile override is *visible* on the canvas, and the inspector marks properties that carry an override at the current breakpoint (the "override badge" — pills/dots in the inspector's breakpoint row).

**Element data model for breakpoints.** Each element stores desktop styles inline as its base, plus an optional per-breakpoint override map (`tablet`, `mobile`). Removing a single property from a breakpoint or clearing a whole breakpoint's overrides are both supported operations.

**Known inconsistency to flag:** an older, still-present device-rule path uses different thresholds (tablet at 991px and below, mobile at 575px and below). The breakpoint constants above (1023/767) are the ones the breakpoint UI and export use.

### 1b. Device previews (canvas frame sizes only)

Device previews just resize the canvas frame; they do not create a new place to save styles. Three separate size tables exist in the code and they disagree — flagged for the designer to reconcile:

| List | Desktop | Tablet | Mobile | Watch | Wide |
|---|---|---|---|---|---|
| Canvas viewport (engine) | 100% of available (nominal 1280) | 768 × 1024 | 375 × 812 | 196 × 230 | 1920 (full height) |
| Device-preview constants | 100% × 100% | 768 × 1024 | 375 × 812 | 196 × 230 | — |
| Toolbar device presets (with emoji icons 🖥️ 📱 📲) | 1920 | 768 | 375 | — | — |
| Export/preview modal devices | 1440 × 900 "Desktop (1440px)" | 768 × 1024 "Tablet (768px)" | 375 × 667 "Mobile (375px)" | — | — |

Switching device is *not* undoable and does not count as an edit. Palette commands exist for "Desktop view", "Tablet view", "Mobile view", "Watch view" (no shortcuts — ⌘1–⌘4 are reserved for zoom). The device switcher lives in the footer toolbar; switching device re-renders the canvas stylesheet.

**Trap already measured:** the canvas Tablet/Mobile preview also decides *which breakpoint the next style edit lands on*. Switching device therefore switches the edit target.

---

## 2. Element states (pseudo-states)

An element can be styled in five states. The inspector shows them as a compact "Base ▾" dropdown in the breakpoint/state pill row (`This ▾ · Desktop ▾ · Base ▾`).

| State (dropdown label) | Meaning | Notes |
|---|---|---|
| **Base** | Normal/default state | Where every ordinary edit lands |
| **:hover** | Mouse over | Saved as a separate rule; can differ per breakpoint |
| **:focus** | Keyboard/tap focus | Same |
| **:active** | While pressed | Same |
| **:disabled** | Disabled form control | Same |

- A state that carries at least one override *at the current breakpoint* shows an accent dot in the dropdown.
- State rules are stored as separate CSS rules keyed to the element, so a hover rule on Mobile and a hover rule on Desktop are two different things.
- The inspector prints a line saying what a write will land on while a state is picked (e.g. "Writes to :hover").

Other per-element flags that behave like states but are not styling states:

| Flag | Effect |
|---|---|
| **Locked** | Cannot be selected on canvas, cannot be structurally edited; the toast tells users to "Unlock it in the Layers panel". Deleting a multi-selection skips locked elements. |
| **Hidden** (layer visibility) | Toggle from the Layers panel; toggling emits an undo action. |
| **Component instance** | Cannot be wrapped, cannot be deleted as part of a multi-select delete (deliberately), but *can* be selected and have per-instance style/attribute overrides recorded. |
| **Draggable / Droppable / Resizable** | Per-element permissions. New elements are draggable by default; droppable only if their type is a container. |
| **Page root** | The invisible top container of every page. Can never be deleted ("Cannot delete page root element"), is excluded from Select All, and if a delete would leave the root selected the selection is cleared instead. |

---

## 3. Colour modes

Two different notions of "dark mode" exist. Neither changes the editor chrome (the chrome is light-only by design).

**Brand/design-token colour mode (Brand panel).** A two-pill toggle labelled **Light / Dark** (accessible name "Color mode"). It picks which value of each colour token the canvas shows. Internally there are three preferences — `light`, `dark`, and `system` (follows the OS setting) — but the toggle only exposes Light and Dark; "system" is the stored default before the user ever clicks. The choice is remembered per browser.

Token rule: each colour token has a light value and an optional dark value. In dark mode, a token with no dark value falls back to its light value and the engine raises a "dark value missing" signal (a warning chip in the inspector is planned; not shipped).

**Published-site theme (project settings).** A `light / dark / auto` theme setting exists in the project configuration type but no editor UI currently writes it.

---

## 4. Master keyboard shortcut table

Merged from every place that binds or prints a key. Column "Owner" says which surface actually handles it (only one does, by design — several double-bindings were removed after measured double-fires). Column "Printed where" says where the product shows the chord to the user.

### 4a. App-wide (work anywhere except while typing in a field; every chord stands down while a modal is open)

| Keys | Action | Owner | Printed where |
|---|---|---|---|
| ⌘S | Save project | shell | Shortcuts panel · Edit group |
| ⌘Z | Undo | shell | Shortcuts panel, canvas cheat sheet, ⌘K palette |
| ⌘⇧Z **or** ⌘Y | Redo | shell (⌘Y works but is unlisted) | Shortcuts panel, cheat sheet |
| ⌘P | Toggle in-editor Preview | shell | Shortcuts panel · View, ⌘K palette |
| ⌘K | Command palette (shell) | topbar | Shortcuts panel · View, cheat sheet |
| ⌘⇧P | Canvas command palette | canvas | Cheat sheet ("Pro tip: ⌘⇧P opens command palette") |
| ⌘/ | This shortcuts panel (app-wide chords) | shell | Shortcuts panel, cheat sheet, site menu row |
| ? | Canvas cheat sheet (gestures & selection) | canvas | Shortcuts panel, cheat sheet ("Press ? or Esc to close") |
| ⌘J | Open the AI tab | shell | — |
| ⌘, | Site settings (project-settings modal) | shell | Site menu row |
| ⌘H | Left panel → History | shell | Site menu row (advertised as Ctrl+H on Mac because ⌘H hides the window) |
| ⇧A | Left panel → Components | shell + rail | Site menu row, rail |
| C | Toggle comment mode on canvas | shell | Keyboard legend |
| F6 / ⇧F6 | Cycle focus between shell regions (works even from inside a text field) | shell | — |
| Esc | Close shortcuts modal / close palette / clear selection (context-dependent) | several | Cheat sheet |
| Ctrl+⇧T | Toggle Time-Travel scrubber (History panel) | History tab | Time-Travel button label and tooltip "Time-Travel (Ctrl+Shift+T)" |
| / | Focus the search field (Pages panel, when nothing else is focused) | Pages tab | — |

### 4b. Rail — open a left panel (single letter, no modifier; ignored while typing)

| Key | Panel |
|---|---|
| A | Add |
| I | AI |
| T | Templates |
| M | Assets (media) |
| L | Layers |
| P | Pages |
| ⇧A | Components |
| B | Brand |
| S | Settings (full-page) |
| U | Publish |
| H | History |
| R | Review |
| D | CMS (Content) |

These are listed in the Shortcuts panel under "Panels" as "Open <name> panel".

### 4c. Edit commands (global command registry; capture-phase on the window)

These are the engine's own bindings. Rule: when the caret is in a text field, ⌘A / ⌘X / ⌘C / ⌘V / ⌘Z / ⌘⇧Z belong to the text, not the canvas. Bare keys (Delete, Escape) never fire inside inputs, editable text, or inside widgets that own arrow keys (menus, listboxes, trees, dialogs, sliders, tabs, radio groups).

| Keys | Command | Undoable? | Blocked in read-only view? |
|---|---|---|---|
| Delete **or** Backspace | Delete element(s) | Yes, one step for the whole selection | Yes |
| ⌘C | Copy element(s) | — | No |
| ⌘X | Cut element(s) | Yes, one step | Yes |
| ⌘V | Paste | Yes, one step | Yes |
| ⌘D | Duplicate | Yes | Yes |
| ⌘G | Group (needs ≥2 siblings) | Yes | Yes |
| ⌘⇧G | Ungroup (selected container only) | Yes | Yes |
| ⌘A | Select all elements on page (root excluded) | — | No |
| Esc | Deselect | — | No |
| ⌘] | Bring forward (one sibling later) | Yes | Yes |
| ⌘[ | Send backward | Yes | Yes |
| ⌘⇧] | Bring to front (last sibling) | Yes | Yes |
| ⌘⇧[ | Send to back (first sibling) | Yes | Yes |
| ⌘⇧E | Open exporter | — | No |
| ⌘⇧A | Open AI assistant | — | No |
| ⌘⇧C | Toggle component view | — | No |

### 4d. Canvas selection, navigation and positioning (when the canvas has focus and an element is selected)

| Keys | Action |
|---|---|
| Click | Select element |
| Double-click | Select child / deep select |
| Triple-click | Select innermost element |
| ⌘ Click | Cycle through overlapping elements |
| ⇧ Click | Add to selection |
| Tab / ⇧Tab | Next / previous element (cycles all elements on the page, root excluded) |
| ↑ / ↓ | Select previous / next sibling |
| ← | Select parent |
| → | Select first child |
| Home / End | Select first / last sibling |
| ⇧ + arrow | Move element 10px |
| ⌘ + arrow | Move element 1px |
| ⌥↑ / ⌥↓ | Reorder up / down among siblings |
| ⌥Home / ⌥End | Move to first / last position |
| ⌘⌥C | Copy styles only |
| ⌘⌥V | Paste styles |
| Right-click | Context menu |
| ⇧F10 | Context menu (accessibility) |

Nudging (1px/10px) sets the element to relative positioning if it was static, and honours snap-to-grid when it is on. Palette-only commands "Nudge up/down/left/right" and "(10px)" variants exist without keys.

### 4e. Canvas footer — zoom and overlays

| Keys | Action |
|---|---|
| ⌘0 | Zoom to 100% |
| ⌘1 | Zoom to fit |
| ⌘2 | Zoom to selection |
| ⌘= / ⌘+ | Zoom in (next preset) |
| ⌘- | Zoom out (previous preset) |
| ⌘' | Toggle grid overlay |
| ⌘; | Toggle guides |
| ⌘⇧; | Toggle spacing overlay |
| ⌘B | Toggle badges |
| ⌘R | Toggle rulers (deliberately overrides browser reload; ⌘⇧R and F5 still reload) |
| ⌘⇧X | Toggle X-ray |

Zoom presets: **10, 25, 50, 75, 100, 150, 200, 400 %**. Range 10–400 % in the UI (engine would accept up to 500). Palette "Zoom in/out" commands step by 10 instead of by preset — a known mismatch, kept for the palette only.

### 4f. Documented-but-unbound (a designer must not print these)

A documentation map in the code lists chords that nothing binds today: ⌘⇧S Save as, ⌘E Export, ⌘I Import, ⌘N New project, ⌘O Open, ⌘L/⌘⇧L Lock/Unlock, ⌘⇧H Show/Hide, Alt+1…Alt+6 panel toggles, V/H/T/R/F tool keys, ⌘⇧D debug. Treat them as false unless a surface is built for them.

### 4g. Keyboard-drag (list reordering)

While keyboard-dragging a row: ↑/← previous, ↓/→ next (⇧ jumps 10), Home first, End last, Esc cancels, Enter/Space confirms.

---

## 5. Commands table (everything the ⌘K palette can run)

| Palette label | What it does | Key | Undoable | Notes |
|---|---|---|---|---|
| Undo | Undo last step | ⌘Z (shell) | — | Registry entry has no key (shell owns it) |
| Redo | Redo | ⌘⇧Z / ⌘Y (shell) | — | Same |
| Save | Save project | ⌘S | — | |
| Delete element | Delete whole selection (ancestor wins; children not double-counted) | Delete / Backspace | Yes | Toast "<Type> deleted" / "<Type> (2 children) deleted" / "3 elements deleted" with **Undo** action, 5 s |
| Group | Wrap ≥2 selected siblings in a container, select the group | ⌘G | Yes | Silently does nothing with <2 selected or if they have different parents |
| Ungroup | Dissolve a selected container into its parent | ⌘⇧G | Yes | Only when the selection is a container with children; clears selection after |
| Duplicate | Clone selection after original, select the clones | ⌘D | Yes | Toast "Element duplicated" |
| Copy | Copy selection to editor clipboard | ⌘C | — | Toast "Element copied" / "3 elements copied" |
| Cut | Copy then delete, one undo step | ⌘X | Yes | Toast "Element cut" / "3 elements cut" |
| Paste | Paste at the smartest legal spot (see §13) | ⌘V | Yes | One toast per paste: "Element pasted" / "3 elements pasted" |
| Nudge up/down/left/right | Move 1px | — | Yes | Keys owned by canvas |
| Nudge … (10px) | Move 10px | — | Yes | |
| Bring forward / Send backward / Bring to front / Send to back | Sibling order | ⌘] ⌘[ ⌘⇧] ⌘⇧[ | Yes | |
| Toggle snap to grid | Flip snap setting | — (⌘' is the *grid overlay*, different thing) | — | Nothing on screen shows this flipping — a known gap |
| Select all | Select every element on the page (root excluded) | ⌘A | — | |
| Deselect | Clear selection | Esc | — | |
| Preview | Opens a new browser tab with the exported page | — | — | Distinct from ⌘P in-editor preview |
| Export HTML / Export JSON | Produce export | — | — | |
| Open templates | Open Templates | — (T on the rail) | — | |
| Open exporter | Open the export modal | ⌘⇧E | — | |
| Open AI assistant | Open AI | ⌘⇧A | — | |
| Toggle component view | Toggle component view | ⌘⇧C | — | |
| Zoom in / Zoom out / Reset zoom | ±10 % / 100 % | — | — | |
| Desktop / Tablet / Mobile / Watch view | Switch canvas device | — | — | |

Rules that apply to every command:
- In **read-only view** (`?view=readonly` — no rail, no drawer, no inspector), any command that changes the document is refused at the gateway (keyboard *and* palette), and the palette itself does not open. Selecting by click still works.
- A command fires once per user action, so toasts count what actually happened.
- A failing command surfaces an error event; nothing is swallowed silently.

---

## 6. Undo / redo rules

| Rule | Detail |
|---|---|
| Depth | **100 steps** (the History panel prints this cap rather than hard-coding it). Oldest steps drop off; a full snapshot is kept at the new oldest step so nothing breaks. |
| Grouping ("coalescing") | Rapid changes within **~500 ms** merge into one step. Typing a sentence is one undo; dragging a slider is one undo. Any explicit command (delete, paste, move, drag-drop, group…) is wrapped as one transaction = one step, however many elements it touched. |
| Style batches | If a burst contains only style changes it is labelled "Changed styles". |
| Checkpoints | Every 10 steps the engine stores a full snapshot (invisible to the user; makes restoring fast). |
| Baseline | Loading a project resets the stack and records a "loaded" baseline; the first undo returns to the loaded state, never to a half-loaded canvas. |
| Selection after undo | If the selected element no longer exists after undo/redo, selection clears; otherwise the selection re-points at the restored element. |
| Undo before the window closes | Pressing ⌘Z inside the 500 ms window first commits the pending edit, then undoes it — nothing is lost. |
| Redo invalidation | Any new edit clears the redo stack. |
| Cannot-undo cases | Some features change the project **outside history** (a CMS binding, applying brand tokens, a page created mid-load). After one of these, Undo is disabled until the next recorded action, and pressing it says why. |
| Failure safety | If a recorded step can no longer be applied (tree shape diverged), undo/redo bails without changing anything; the step stays on its stack. |
| Excluded from history | Device switch, zoom, selection, panel state, snap/grid toggles, version saves, media library changes, colour-mode toggle. |
| Restore version / undo / redo all count as document changes for autosave | So an undo *is* saved. |

**Toast copy (bottom bar, dark tone, one line):**

| Situation | Copy | Action link | Duration |
|---|---|---|---|
| After undo | "Undo: <Past-tense action>" e.g. "Undo: Deleted element", "Undo: Moved element", "Undo: Changed styles" | **Redo** | 2.5 s (4 s if the action was a delete/cut) |
| After redo | "Redo: <Past-tense action>" | **Undo** | same |
| Nothing left | "Nothing to undo" / "Nothing to redo" | none | 2 s |
| Last action not recorded | "Can't undo <reason> — it isn't recorded in history. Your earlier edits are still there." | none | 4 s |
| Unknown label | Falls back to Title Case of the internal label, or "last action" | | |

**Past-tense labels the toasts can print:** Added element · Added block · Added component · Added template · Imported HTML · Inserted HTML · Applied generated layout · Applied an AI edit · Deleted element · Deleted layer · Deleted layers · Cut element · Duplicated element · Duplicated layer · Pasted element · Pasted styles · Moved element · Moved elements · Reordered layer · Reordered section · Brought layer to front · Sent layer to back · Grouped elements · Grouped layers · Ungrouped elements · Aligned horizontally · Aligned vertically · Distributed elements · Resized element · Changed style · Changed styles · Fixed contrast · Changed a design token · Edited text · Changed link · Changed link target · Changed animation · Changed interactions · Replaced media · Replaced media across the page · Replaced media across pages · Synced component instances · Changed variant.

**History panel row labels** (the "All changes" list, newest first, index 0 hidden): explicit labels shown Title-Cased ("Applied template", "Added block", "Changed style", "Changed styles", "Imported HTML", "Inserted HTML", "Changed variant", "Synced component", "Moved layer", "Added element"); otherwise derived from the change: "Added element", "Removed element", "Changed <property>" (e.g. "Changed background color", "Changed font", "Changed top margin", "Changed shadow", "Changed text color", "Changed alignment"), "Edited text", "Updated element", "Added page", "Removed page", "Updated page", "Created component", "Removed component", "Updated component", "Changed selection", "N changes", "Checkpoint", "No changes". Each row expands to at most 10 property changes formatted as `"old" → "new"`, `+ value`, `- value`, then "and N more changes". Long strings are cut to 17 characters + "…", arrays show "[N items]". Clicking a row restores to that point and records "Restored to: <label>".

---

## 7. Autosave, saving, versions and recovery

### 7a. Saving

| Fact | Value |
|---|---|
| Autosave | On by default. The shipping editor saves to the dashboard **1 second** after the last change settles (the standalone/local mode uses a 5-second debounce). |
| Manual save | ⌘S or Save. |
| What "dirty" means | Any real edit. Switching pages, selecting, zooming do **not** mark the project unsaved. |
| Per-page unsaved dot | Pages show a dirty marker until the next successful save; a navigation-only change never lights it. |
| Status bar copy | "Saved · just now", then "Saved · 2m ago", "Saved · 2 days ago" (minutes short form, days long form). |
| Browser storage safety | Anything stored in the browser has the email-integration API key and the published-site password stripped out. |
| Leaving with unsaved edits | Exit prompt is shown only when genuinely dirty. |

**Save failure toasts (persist until dismissed unless noted):**

| Condition | Title | Body | Action |
|---|---|---|---|
| Offline | "Offline — not saved" | "Your changes are still open in this tab. Keep it open and save again once you're back online." | — |
| Network error | "Couldn't reach the server — not saved" | "Your changes are still open in this tab. Keep it open and try saving again." | — |
| Session expired (401) | "Session expired" | "Sign in again to save your changes. Keep this tab open." | opens the blocking sign-in |
| Forbidden (403) | "You don't have access to save this site" | "Your role changed, or the site isn't yours to edit. Ask the owner." | — |
| Site gone | "This site isn't there anymore" | "It was deleted, or it isn't yours to open — either way nothing can be saved to it." | — |
| Site never loaded | "Not saved — this site never loaded" | "Autosave is held back so it can't overwrite the stored pages. Reload to get the real site." | **Reload** |
| Other | "Save failed" | "Could not save to dashboard. Changes are unsaved." | — |
| Status chip | "Save failed — retry" (red) | | |

**Unsaved-work recovery on reload.** If a save failed before the page was reloaded, on the next open: status shows "This site has edits that never reached the server." and a warning toast (never auto-dismissed): title "Some work never reached the server", body "A save failed before this page was reloaded. The version on screen is the server's. Restoring puts your unsaved edits back so you can save them again.", action **Restore my edits**. It is never applied automatically.

**Loading.** While a site's pages are still arriving, the canvas shows placeholders and the status bar says so — it must *not* show the empty-canvas "Start building · Browse templates" state. If the server says the site does not exist, the editor stops offering "Start blank".

### 7b. Version history ("Saves")

| Rule | Detail |
|---|---|
| Cap | **50 versions kept.** Auto-saves prune oldest first; **named versions never prune** (even if that leaves the total above 50). The panel prints this rule. When pruning happens a notice says how many were removed and how many are kept. |
| Named version | User gives a name and optional description. Captures a JPEG thumbnail of the canvas. |
| Auto-checkpoint | Only when a template is applied (opening a site no longer creates one). Stored as "Auto: template:applied"; **always displayed as "Auto-save"**, distinguished by time and change count ("Auto-save · 3 changes · 16:20"). An auto-checkpoint is skipped if the project has no pages or if it is identical to the newest auto-save. |
| Change count badge | "N changes" = undo steps recorded between this version and the previous one. Shown only when known; never "0 changes". |
| Restore | Restoring **first saves the current work** as a named version called `Before restoring "<target name>"` with description "Automatic — the work that was open when a restore was requested." (banner: "Saving your current work as v4 first"). If that safety save fails, the restore is aborted. Restore then replaces the whole project. |
| List failed to load | State copy: "Your versions are still stored. Only this list failed to load." with **Try again**. The empty state ("Version history appears here as you save changes") is never shown while loading. |
| Storage full | On a quota error the 10 oldest versions are pruned and the save retried once. |
| Export / import | Versions can be downloaded as a JSON file named `versions-<project>-<timestamp>.json` and re-imported (optionally replacing existing). |
| Compare | Two versions can be compared: counts of style / text / layout / content / other changes plus pages added/deleted, titled "Version Comparison (A → B)". |
| Auto-milestone suggestion | The editor may suggest naming a version (AI-generated name, best-effort) when a page is added, an element is deleted, more than half of an element's properties change at once, or after 10 auto-checkpoints — at most once every 30 seconds. User can accept, edit the name, or dismiss. |
| Attribution | Versions and history entries record who made them (team attribution). |

### 7c. Crash recovery

- When the tab becomes visible again, or on an uncaught error, the engine silently checks that a page is active, the page has a root, and the selection still exists, then forces a canvas re-sync. Nothing is shown to the user.
- A crash sentinel is written so the next start can offer a restore prompt (the "Some work never reached the server" flow above is the one that ships).
- A project loaded with zero pages gets a page created automatically so inserts never fail silently.

---

## 8. Limits table

| Limit | Value | Where it bites |
|---|---|---|
| Undo steps | 100 | History |
| Undo coalesce window | ~500 ms | Typing/drag = one step |
| Versions kept | 50 (auto prune; named never) | Saves |
| Autosave debounce | 1 s (dashboard) / 5 s (local) | |
| Zoom | 10–400 % (presets 10/25/50/75/100/150/200/400) | Footer |
| Grid size | 1–100 px, default 10 | Snap |
| Snap to elements threshold | 5 px | Drag |
| Rotation snap | every 15° | Resize/rotate |
| Drag start threshold | 5 px | |
| Marquee minimum | 3 px | Multi-select |
| Auto-scroll edge margin | 50 px; speed 10–30 px/frame | Drag near edge |
| Touch long-press to drag | 500 ms; 10 px move cancels | Touch |
| Drop zone edge | outer 25 % of a target = before/after; middle = inside | Drag |
| Element size | min 10 × 10 px, max 10 000 × 10 000 px | Resize |
| Text element minimum | 20 × 16 px | |
| Canvas maximum | 20 000 × 20 000 px | |
| Nesting depth | hard max 30 levels ("Maximum nesting depth (30) exceeded"); warning above 15 ("Deep nesting detected (N levels)"); drag refuses beyond 50 | Structure |
| Children per element | warning above 500 ("Element has N children (max recommended: 500)") | |
| Pages per site | plan: Free 10 · Pro 30 · Business 50 | Pages |
| Sites | Free 3 · Pro 15 · Business 50 | Dashboard |
| Components per project | 100 | Components |
| Applied-template records per page | 25 (oldest dropped) | |
| Slug history per page | 100 (oldest dropped) | Redirects |
| Recently used items (Add panel etc.) | 8 | |
| Image upload | 10 MB; max 4096 px per side | Media |
| SVG upload | 1 MB | |
| Video upload | 100 MB | |
| Audio upload | 50 MB (no library bucket — cannot be browsed) | |
| Font upload | 5 MB (.woff2 .woff .ttf .otf) | |
| Image editor resize | 8192 px per side ("Maximum is 8192 × 8192 px") | Image editor |
| Thumbnails | 200 px; compression quality 0.85 | |
| Media library page size | 50 assets per page | |
| Storage quota | 1 GB constant in the editor; plan says Free 500 MB · Pro 5 GB · Business 50 GB; warning at 80 %, critical at 95 %, checked every 30 s | Media |
| Asset versions per asset | Free 5 · Pro 25 · Business 100 | Media |
| AI requests | 30 per window (client-side rate limit); plan: Free 3 generations / 10 prompts a day · Pro 20 / 200 · Business unlimited | AI |
| Plugins | HTTPS only, hosts limited to cdn.jsdelivr.net, unpkg.com, esm.sh (feature disabled) | — |
| Head code | only `<meta> <link> <script src> <noscript> <style> <base> <title>` survive publish | Settings · Custom code |
| Panel width | 200–600 px, default 280 | Drawer |
| Achievement prompt auto-dismiss | 4 s | Onboarding |
| Milestone suggestion cooldown | 30 s | |
| Refetch-on-focus throttle | 30 s | Review pill, badges |

---

## 9. Validation and error messages

### 9a. Structure / nesting (drag-drop, paste, move)

| Situation | Message |
|---|---|
| Dropping an element on itself | "Cannot drop element inside itself" |
| Dropping into its own child | "Cannot drop element inside its own child" |
| Target cannot hold children | "This element cannot have children (img, input, br, etc.)" |
| Target is a text element | "Text elements cannot contain other elements" |
| Interactive inside interactive (button in link etc.) | "Interactive elements cannot be nested inside each other" / "…inside interactive elements" |
| Forbidden pair | "<child> cannot be placed inside <parent>" · generic "This element type is not allowed here" · "This element cannot be placed inside the target" |
| Too deep | "Maximum nesting depth reached" |
| No-op move | "Element is already in this position" |
| Nothing under the cursor | "No valid drop target found" · "Maximum tree depth reached" · "No elements to check" · "No valid candidates found" |
| Longer-form nesting explanations | "<parent> elements cannot contain child elements (void element)" · "<child> cannot be placed inside <parent> (HTML restriction)" · "<parent> only allows specific children: image, video, container" · "Interactive elements (<child>) cannot be nested inside other interactive elements (<parent>)" · "<child> cannot be nested inside <parent>" |
| Suggestions | "Try placing <child> inside: container, section, flex" · "Move <child> outside of <parent>" · "<parent> cannot have children. Try using a container instead." · "Consider restructuring the layout" · "Wrap <child> in a container" · "Move <child> to container" |
| Paste refused | "Cannot paste <type> into <parent>" |
| Move would break children | "Child <type> would become invalid after move" |
| Tree audit (Issues) | "Maximum nesting depth (30) exceeded" · "<type> cannot be nested inside <parent>" (suggestion "Try placing <type> in a container element") · "Interactive element <type> cannot be nested inside <ancestor>" · "Void element <type> cannot have children" · "Element has N children (max recommended: 500)" · "Deep nesting detected (N levels)" · warning "Landmark <type> is nested inside another landmark <x>" · info "<type> should typically appear only once per page" (header, footer) |
| Page audit recommendations | "Consider adding a navigation landmark (nav) for accessibility" · "Multiple header landmarks detected - consider using only one main header" · "N empty container(s) detected - consider removing or populating them" · "Deep nesting detected (N levels) - consider simplifying the structure" |
| Delete root | "Cannot delete page root element" (developer-facing; the UI just refuses) |

**Nesting rules a designer should know (the shape, not the full matrix):**
- Cannot have children at all: image, audio, SVG, Lottie, icon, input, textarea, select, checkbox, radio, switch, upload, progress, countdown, spacer, divider, video-embed, map-embed.
- Gallery accepts only image, video, container. Product grid accepts only product-card, container.
- Heading and Paragraph refuse: sections, header/footer/nav, forms, tables, lists, other headings/paragraphs, any form control or button; Paragraph additionally refuses container/flex/grid.
- Link refuses link, button, form controls, form, table, list, sections, header/footer/nav. Button refuses all of those plus every container type.
- Header and Footer refuse header/footer inside them. Form refuses form.
- Text (inline span) refuses sections, header/footer/nav, form, table, list.

### 9b. Media upload

| Situation | Message |
|---|---|
| Wrong type | "Unsupported file type: <mime>" |
| Format hint under pickers | "PNG, JPG, GIF, WebP, AVIF or SVG · up to 10 MB for this image field." |
| URL import refusal | "Use a direct JPG, PNG, WebP or SVG image URL." |
| Library-wide accepted formats line | "JPG · PNG · GIF · WebP · AVIF · SVG · MP4 · WebM · OGV · MOV · WOFF2 · WOFF · TTF · OTF" |
| Library-wide limit line | "up to 10 MB per image · 1 MB per SVG · 100 MB per video · 5 MB per font" |
| Multi-kind pickers | "up to 10 MB per image, 1 MB per SVG, 100 MB per video" (single kind: "up to 10 MB") |
| Insert failed reasons | no active page · invalid type · "no text selected" (applying a font with no text element selected) |
| Media library failed to read storage | "Couldn't load your media." + **Try again** (never "Your library is empty") |
| Storage bar | "842 MB of 1 GB used" · "Optimise images to free space ›" |

### 9c. Custom code (Settings · Custom code)

| Check | Message |
|---|---|
| Forbidden tags | "Forbidden tag: <html>" / "Forbidden tags: <html>, <body>" (html, body, head, iframe) |
| Unclosed | "Unclosed tag: <div>" / "Unclosed tags: <div>, <span>" |
| Stray close | "Unexpected closing tag: </div>" |
| Inline script | warning "Inline <script> is removed when the site is published — load the code from a file with <script src="…"> instead" |
| Tags that will be stripped | warning "Removed when published: <div>, <p> — only <meta>, <link>, <script>, <noscript>, <style>, <base>, <title> survive" |
| Event handlers | warning "Inline event handlers detected (e.g., onclick) — consider external scripts instead" |
| document.write | warning "document.write can break page rendering — avoid if possible" |
| Global CSS | "2 unclosed braces — missing }" / "1 extra closing brace — stray }" (structure only; never judges property names) |
| Empty | "✓ HTML looks good" / valid |

### 9d. CMS field validation (Content)

"<Field> is required" · "<Field> must be a number" · "<Field> must be at least N" · "<Field> must be at most N" · "<Field> must be at least N characters" · "<Field> must be at most N characters" · "<Field> format is invalid" (or the field's custom pattern message) · "<Field> must be a valid email" · "<Field> must be a valid URL" · "<Field> must be one of: a, b, c".

### 9e. Plans

"<Feature> requires the Pro plan." / "This feature requires the Pro plan." (upgrade modal) · "<Feature> is a Pro feature" / "…is an Enterprise feature" (locked settings screen).

### 9f. Other engine messages that can reach a toast

"Operation timed out" · "Remote endpoint not configured" · plugin messages ("Plugins must be loaded over HTTPS…", "Plugin host … is not allowed. Allowed hosts: …", "Failed to load plugin from …") — plugins are off, so these are not user-facing today.

---

## 10. Naming defaults

| Thing | Default name / rule |
|---|---|
| Project | "Untitled Project" |
| First page | "Home"; second page "About"; third and later "Page N" (N = count + 1) |
| Page created by importing HTML with no page | "Page 1", URL `/page-1` |
| Duplicated page | "<Name> Copy", then "<Name> Copy 2", "Copy 3"…; URL `<slug>-copy`, `<slug>-copy-2`…; never becomes Home; keeps all content and settings |
| Page URL (slug) from a name | lower-cased, trimmed, punctuation removed, spaces/underscores → hyphens, no leading/trailing hyphens ("About Us!" → `about-us`). Auto-derived until the user types one; after that renaming the page does not change the URL. Every old slug is remembered (up to 100) for redirects. |
| Route matching | Paths are case-insensitive, always start with `/`, trailing slash ignored. A page with no slug is reachable at `/<id>`. |
| Home page | Exactly one page is Home; setting another clears the previous. |
| Element display names (Layers, status bar) | From type: Heading 1–6, Paragraph, Container, Text, Section, Navigation, Header, Footer, Main, Article, Sidebar, Link, Image, Video, Button, Input, Textarea, Select, Form, List, Ordered List, List Item, Heading, Navbar, Hero, Features, Grid, Flex, Icon, Divider. A user can rename a layer; clearing the name returns to the type label. |
| Group created by ⌘G | A plain Container |
| Sections created by importing/applying a template | Named from the markup: Navigation, Header, Main content, Section, Article, Footer, Sidebar (anything else: its tag, capitalised) — shown as progress "Section 2 of 3" while applying |
| New named version | User-typed; safety version `Before restoring "<name>"` |
| Auto-checkpoint | Displayed "Auto-save" |
| Exported page title | The page's SEO title → page title → page name; fallback "Untitled" (never the brand name) |
| Version export file | `versions-<project>-<timestamp>.json` |
| Form-notification sender | noreply@buildrick.io |
| Element IDs | Never shown; generated as prefix + timestamp + random |

---

## 11. Plan / tier gating

Plans: **Free**, **Pro** ($29/mo, $23/mo yearly), **Business** ($79/mo, $63/mo yearly). (The editor's settings code also knows "starter / pro / enterprise" names for the same ladder.)

| Capability | Free | Pro | Business |
|---|---|---|---|
| Sites | 3 | 15 | 50 |
| Pages per site | 10 | 30 | 50 |
| Custom domains | 0 | 3 | 20 |
| Team members | 1 | 5 | 25 |
| Storage | 500 MB | 5 GB | 50 GB |
| Bandwidth | 1 GB | 10 GB | 100 GB |
| AI site generations | 3 | 20 | unlimited |
| AI prompts / day | 10 | 200 | unlimited |
| Max file upload | 10 MB | 50 MB | 200 MB |
| Form submissions | 100 | 2 500 | unlimited |
| URL redirects | 100 | 500 | unlimited |
| Integrations | 0 | 2 | unlimited |
| Analytics retention | 7 days | 30 days | 90 days |
| Share-link expiry (max) | 7 days | 30 days | 90 days |
| Password-protected share links | no | yes | yes |
| Asset versions per asset | 5 | 25 | 100 |
| Exports | unlimited on every plan | | |

**What the editor locks today**
- Settings → **Custom code** and **Integrations** screens are Pro-locked. Instead of the screen, a card: plan pill ("PRO"), "Custom code is a Pro feature", body "Custom code injects your own <head> markup, end-of-<body> scripts and CSS into every published page — analytics, fonts, chat widgets. It ships on every publish." (Integrations: "Integrations connect your published site to the services you already run — forms, payments, email and automation — without pasting code by hand."), button **Upgrade to Pro** → dashboard billing in a new tab.
- **Premium templates** carry a purple "PRO" badge; applying one on Free opens the upgrade modal.
- **Upgrade modal** (global): title "Upgrade Your Plan", purple plan badge, "<Feature> requires the Pro plan.", checklist ✓ Custom domain · ✓ Premium templates · ✓ AI-powered features · ✓ Priority support, buttons **Maybe Later** / **Upgrade to Pro**. The plan name in the copy follows whatever plan the feature needs.
- Media storage bar reflects the plan allowance ("842 MB of 1 GB used") with "Optimise images to free space ›".
- AI model is the same on every tier today (no "better model on Pro").

---

## 12. Onboarding — "Get started" checklist

One linear checklist (phase active → done); no modal or spotlight tour any more. Progress is stored per browser; the list was reset for everyone when its content changed. The floating panel header reads "Get started" with "N/7 done" (or "You're all set" / "All done!" when complete); it can be minimised, and closing asks "Hide this?" inline before hiding. It can be re-opened later via a replay action. Each completion shows a 4-second achievement card: "Step complete" + step label, **Continue →**; the last one reads "All done" / "You're all set" with **Done**, and its accessible text is "Congratulations! You have completed all getting started steps." A first-run coach mark on the rail reads "Everything you build lives behind these six." with a **Got it** button.

| # | Step label | Description | Button | Opens | Credited when |
|---|---|---|---|---|---|
| 1 | Set your brand | "Pick a starter or set your six colours and two fonts in Brand — every block and template uses them." | Open Brand panel | Brand | Brand tokens are applied (Apply succeeds) |
| 2 | Add your first page | "Create a page — blank, or from a template." | Open Pages | Pages | A page is created (or site already has >1 page) |
| 3 | Add a block | "Drop a ready-made block — hero, features, footer — from Add › Blocks onto the canvas. Blocks use your brand colours and fonts." | Open Add panel | Add | A block/element is inserted (or a section already exists) |
| 4 | Connect first client | "Invite your client by email when you send the site for review — they get their own link." | Open Review | Review | A review round is sent with an invited email |
| 5 | Send for review | "Send a review link so your client can approve the site or request changes." | Open Review | Review | A review round is sent |
| 6 | Preview your site | "Click Preview in the top bar to see your site on desktop, tablet, and mobile." | Open preview | Preview | Preview is toggled |
| 7 | Publish | "Connect your Vercel account once, then Publish deploys the site there and gives you its URL." | Publish now | Publish | A publish job completes |

Pressing a step's button no longer credits the step — only the real action does.

---

## 13. Paste, import and clipboard behaviours

**Element clipboard (⌘C / ⌘X / ⌘V).** Copy takes the whole selection; if a parent and one of its children are both selected only the parent is copied (no duplicates). Paste chooses a landing spot per item: if the selected element can legally hold the pasted type, it goes *inside* (at the end); otherwise it goes *after* the selected element in its parent; if the parent cannot hold it either, it goes to the end of the page. Items that cannot land anywhere are skipped and the toast counts only what landed. Pasted copies get fresh identities. A paste is one undo step.

**Style clipboard (⌘⌥C / ⌘⌥V).** Copies only the selected element's styles; pasting applies them on top of the target. Toasts: "3 styles copied" · "No styles to copy" (warning) · "3 styles applied" with **Undo**.

**Paste-styles from the context menu / "Copied style"** uses the same clipboard.

**Importing / applying HTML (templates, AI, "Replace with block").**
- Everything is sanitised first: event handlers (`onclick`…), `javascript:` links, inline scripts and dangerous CSS are removed; `data:` URLs allowed only on media; `blob:` allowed on images only.
- Each top-level tag becomes an element; loose text becomes a Text element; text-only tags (headings, paragraphs, buttons, links, labels, list items, cells…) keep their text as content rather than creating child elements.
- Tag → element type: p→Paragraph, h1–h6→Heading, div/aside/main/figure/blockquote→Container, span/code/pre/figcaption→Text, a→Link, img→Image, hr→Divider, ul/ol→List, article/section→Section, header/footer/nav as themselves, form controls as themselves. Unknown tags become Containers.
- Classes and inline styles are preserved; editor bookkeeping attributes are stripped.
- Applying a template replaces the page's content and is **one undo step** ("Applied template"); progress reports each top-level section by its landmark name.
- Inserting HTML into a specific element ("Inserted HTML") is likewise one step.
- Project files loaded from anywhere (browser storage, dashboard, templates) are sanitised again on load.

**Dragging from outside the editor.** The drag system recognises files, plain text, HTML and URLs as external drops (each becomes the matching element/asset where a handler exists).

**Media insert rules.** Inserting from the library: if one empty container is selected the media goes inside it; if a non-empty element is selected the media goes right after it; otherwise to the end of the page. Dropping with coordinates places it absolutely at that point. Choosing a font applies it to the selected text elements instead of inserting anything ("no text selected" otherwise). Replacing media on a target swaps its source (or its background image if it has one) and keeps the alt text.

**Head-code / custom code** is validated as in §9c and sanitised on publish.

---

## 14. Other cross-cutting rules

### 14a. Element model (what every element is)
Each element has: a type (see list), a tag, attributes, classes, base (desktop) styles, per-breakpoint overrides, optional text content (plain text is escaped on export; AI-generated blocks may carry raw HTML that is sanitised), children, traits (named properties), flags (locked, draggable, droppable, resizable), custom data (animation, interactions), and optional data bindings. Twelve form types used to render as plain boxes; now Email/Password/Number/Date/Time/Color/Checkbox/Radio/Switch/Slider/Upload/Submit get the right control type automatically.

**Element types the engine knows:** container, text, heading, paragraph, link, image, video, audio, svg, lottie, button, form, input, textarea, select, checkbox, radio, switch, upload, list, table, section, columns, grid, flex, hero, features, header, footer, nav, navbar, cta, card, pricing, spacer, divider, social, icon, slider, testimonials, progress, countdown, gallery, accordion, product-card, product-grid, product-detail, video-embed, map-embed, custom.

### 14b. Default styles of new elements
Accent colour **#1A56DB** (buttons, links, blockquote rule, checkbox/radio accent, badges). Font **Inter, sans-serif** on everything text. Text colours #1a1a1a (headings) / #333333 (body).

| Element | Defaults |
|---|---|
| H1 / H2 / H3 / H4 / H5 / H6 | 48 / 36 / 28 / 24 / 20 / 18 px; weights 700/700/600/600/500/500; line-height 1.1–1.4; bottom margin 24→10 px |
| Heading (no level) | 32 px 700 (defaults to H2 tag) |
| Paragraph | 16 px, 1.6 line height, 12 px bottom margin |
| Text | 16 px, 1.5 |
| Label | 14 px 500 |
| Blockquote | 18 px italic, 4 px accent left border |
| Code | monospace 14 px on #f3f4f6 |
| Container | 20 px padding, transparent |
| Section | 60 px 20 px padding |
| Flex / Row / Column | gap 16 / 16 / 12 px |
| Grid | 3 equal columns, gap 16 |
| Spacer | 40 px tall |
| Button | accent background, white text, brand button height/padding/radius tokens |
| Link | accent, underlined |
| Nav | flex, gap 24 |
| Image / Video | block, max-width 100 %, auto height, 0 radius |
| Icon | 24 × 24, currentColor |
| Embed | 16:9 · Iframe 400 px tall |
| Form | column, gap 16 · Inputs/Select use brand input height/padding/radius tokens, white background · Textarea min 100 px, vertical resize |
| Checkbox / Radio | 18 × 18, accent |
| File upload | dashed 2 px border, 8 px radius, centred |
| List | 16 px, 24 px left padding · List item 8 px bottom margin |
| Card | 24 px padding, white, 12 px radius, soft shadow |
| Badge | pill, 12 px 500, accent background |
| Avatar | 48 px circle |
| Divider / HR | 1 px #e5e7eb, 24 px vertical margin |
| Social | flex gap 12 · Map 300 px tall · Countdown 24 px bold · Progress 8 px bar · Rating gap 4 · Testimonial #f9fafb 12 px radius · Pricing 32 px padding 16 px radius centred |

A separate built-in "global styles" preset set exists (Primary Button, Secondary Button, Heading 1, Heading 2, Body Text, Container, Card) that still uses an old purple accent (#667eea) and #1a1a2e ink — flag: it does not match the product accent.

### 14c. Selection rules
Single primary selection plus a multi-selection set. Select All takes every element on the active page except the root. Deleting the selected element selects its parent, unless the parent is the page root (then selection clears). Multi-select bounds are the union box of all selected elements (used for alignment tools). Selection changes are broadcast to collaborators when a session is connected.

### 14d. Read-only "view mode"
URL `?view=readonly`: no rail, no drawer, no inspector, no owner controls, no ⌘K palette; the engine refuses every document-changing command from keyboard *or* click, so autosave never writes. Clicking still selects. Two developer-only rail variants (`?rail=e3`, `?rail=legacy`) resolve to the normal rail in production. `?density=fewer` trims the inspector (no consumer in view mode).

### 14e. Feature flags (all off unless set for the shipping build)
Publish flow (dropdown + pipeline) · AI in the Brand panel · Real-time collaboration (demo-only: last-write-wins, must stay off). Internal "features" constants also mark Collaboration, Plugins and Version-history-as-a-feature-flag as off, though the Saves panel ships regardless.

### 14f. Error tracking and logging
Errors are reported to Sentry only in production and only when configured; there is no user-visible error dialog from this layer. Developers can enable console tracing per domain (hover, selection, drag, resize, keyboard, guides, toolbar, sync, style) in dev builds. Sidebar analytics events are no-ops until a provider is wired.

### 14g. Browser storage
Preferences and per-panel state (favourites, recents, dismissed tips, panel widths, media sort/grid/filter, onboarding progress, recent commands, recent icons, applied template id, debug settings) live in browser storage under `buildrick-…` keys, migrated silently from two older prefixes on first run. Favourites in the Add panel are browser-local, and the panel says so once. Undo history is *not* persisted across reloads; versions and the media library are (IndexedDB).

### 14h. Toasts (tones available)
info · success · warning · error · dark (undo/redo bar). Durations used: 2 s (clipboard), 2.5 s/4 s (undo), 4–5 s (delete, unrecorded), ∞ (save failures, restore prompt). Most carry a single action link (Undo, Redo, Retry, Reload, Restore my edits).

### 14i. Fonts offered (Google catalogue; the only families the export may load)
Sans: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, Source Sans Pro, Nunito, Raleway, Ubuntu. Serif: Playfair Display, Merriweather, Lora, PT Serif, Crimson Pro. Mono: Fira Code, JetBrains Mono, Source Code Pro, Roboto Mono. Handwriting: Dancing Script, Pacifico, Caveat. Display: Oswald, Bebas Neue, Anton. Each with its available weights (400–700; some 400 only). Uploaded font files become available to pickers only after "Add font" ("Existing text is unchanged until you choose this font").

### 14j. Icon library
369 Lucide icons in 17 categories: Arrows, Actions, Interface, Users, Communication, Media, Files, Text, Time, Shopping, Social, Technology, Alerts, Charts, Design, Security, Location. Searchable by name and tags; recents kept (8).

### 14k. Animation presets and interactions (enumerations the user picks from)
- **Element animation presets (45):** fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight, zoomIn, bounceIn, slideInUp, slideInDown, flipInX, flipInY, rotateIn, pulse, bounce, shake, swing, wobble, flash, heartBeat, rubberBand, fadeOut, fadeOutUp, fadeOutDown, zoomOut, slideOutUp, slideUp, slideDown, slideLeft, slideRight, scaleIn, scaleOut, scaleUp, scaleDown, rotate, rotateOut, flip, flipX, flipY, rollIn, rollOut, hinge, tada, jello, blur, glow (plus "custom"). Categories: entrance / attention / exit.
- **Animation defaults:** fadeIn, 1000 ms, 0 delay, "ease", normal direction, 1 iteration (−1 = infinite), trigger on load, scroll offset 100 px, fill forwards. Directions: normal, reverse, alternate, alternate-reverse. Fill: none, forwards, backwards, both.
- **Simple animation triggers:** load, scroll, hover, click.
- **Interaction triggers:** hover, click, active ("While Pressed"), focus, blur, page-load, page-scroll, page-leave, scroll-into-view, while-scrolling, scroll-out, mouse-over, mouse-move, mouse-out.
- **Easing names:** linear, easeIn, easeOut, easeInOut, easeInQuad, easeOutQuad, easeInCubic, easeOutCubic, easeInQuart, easeOutQuart, spring, bounce (inspector may also offer raw GSAP eases).
- Interaction targets: self, parent, or a selector; options reverse-on-end and loop count.
- Interactions run on the canvas only in **Preview mode**; on the published page they always run.

### 14l. Data binding transforms (Content/CMS)
Text: uppercase, lowercase, capitalize, trim, slug. Number: number (locale), round, floor, ceil, abs, currency ($x.xx). Date: date, datetime, time, iso. Attribute: boolean, url (adds https://), email (mailto:), tel, alt (strips < >), className. Utility: length, json, keys, values. Binding kinds: variable, collection (loop), condition (==, !=, >, <, >=, <=, contains, startsWith, endsWith, exists, empty; AND/OR groups). Template syntaxes for export: handlebars, mustache, liquid, ejs.

### 14m. CMS field types
text, textarea, richtext, number, date, datetime, boolean, select, multiselect, image, file, reference, color, url, email. Validation options: required, min/max, minLength/maxLength, pattern (+ custom message). Content status: draft / published / archived. The built-in **Products** collection: Name (required, 3–200 chars), Description (rich text), Price (required, ≥0, "Price in USD"), Image (required, "Main product image"), Category, SKU (pattern `^[A-Z0-9-]+$`, "Stock Keeping Unit"), Inventory (≥0, default 0), Featured (default off, "Show on homepage"). Sample products: Premium Wireless Headphones $199.99, Organic Cotton T-Shirt $34.99, Minimalist Watch $149.99.

### 14n. Components (symbols)
Master + instances; per-instance overrides for content, style, attribute, trait; variant axes (e.g. Size S/M/L, State) with named variant combinations; instances auto-sync when the master changes; detach to break the link. Cap 100 per project.

### 14o. Settings enumerations
- Page visibility: live / hidden / password (+ password).
- Per-page SEO: meta title, meta description, OG title/description/image, Twitter card (summary / summary_large_image) + title/description/image, noindex, nofollow, canonical URL, structured data. Structured-data types offered: Article, BreadcrumbList, Event, FAQPage, HowTo, LocalBusiness, Organization, Person, Product, Recipe, WebPage, WebSite.
- Site SEO: site name, default title/description, title template "{page} — Site Name", default OG image, Twitter handle, favicon, touch icon, language, allow indexing, custom robots.txt, social links (twitter, facebook, linkedin).
- Analytics: Google Analytics (G-XXXXXXXXXX, Verify), Facebook Pixel, Google Ads, Microsoft Clarity, Google Tag Manager, cookie-consent banner on/off.
- Email provider: mailchimp, sendgrid, mailgun, resend, none (+ API key, list ID, enabled). Only SendGrid actually sends form notifications; others fall back to a mock.
- Stripe: publishable key, mode payment-links / api, endpoint, success/cancel URLs, currency USD/EUR/GBP/CAD/AUD.
- Publishing provider: vercel / netlify / github; last deployment status queued / building / ready / error / canceled.
- Localization: default locale, enabled locales, auto-redirect by browser (read-only in the editor).
- Redirects: "suggest from 404s" switch (on by default).
- Custom code: head scripts, body scripts, global CSS.
- Template categories: landing-page, portfolio, blog, ecommerce, dashboard, email, marketing, business, creative, other; licences free / personal / commercial / custom.
- Export formats: html, zip, json, react, vue, nextjs; CSS inline / embedded / external; default export title "Buildrick Export" in the export config (the page-title precedence in §10 overrides it for previews).

### 14p. Image editor enumerations
Crop presets: Free, Square (1:1), Standard (4:3), Photo (3:2), Widescreen (16:9), Ultrawide (21:9), Portrait (9:16), Instagram (4:5), Pinterest (2:3). Rotation 0/90/180/270; flip H/V. Filters: grayscale, sepia (0–100), blur (0–20 px), sharpen, invert. Adjustments (−100…100): brightness, contrast, saturation, exposure, highlights, shadows, temperature, tint, vibrance; hue 0–360. Export formats jpeg/png/webp/avif, default png at 0.92 quality. A saved edit becomes a hidden "version" row of the original ("Crop: Free · Preset: None · …").

### 14q. Colour tooling available to pickers
Named CSS colours, hex/rgb/hsl/hwb/lab/lch/oklch parsing; contrast ratio with AA/AAA checks and an auto "fix contrast" (recorded as the undo step "Fixed contrast"); colour-blindness simulation (protanopia, protanomaly, deuteranopia, deuteranomaly, tritanopia, tritanomaly, achromatopsia, achromatomaly); palette schemes (complementary, analogous, triadic, tetradic, split-complementary, double-complementary, monochromatic); blend modes (normal, multiply, screen, overlay, darken, lighten, color-dodge, color-burn, hard-light, soft-light, difference, exclusion). CSS units understood: px, rem, em, %, vh, vw, vmin, vmax, pt, cm, mm, in.

### 14r. The standalone demo app
The Vite demo (port 5050) mounts the full editor shell with licence key "DEMO", the self-hosted Inter/Geist Mono fonts, and — in dev builds only — an "Agentation" overlay for AI-agent annotations. There is no demo-only toolbar, switch, or sample-project picker; it is the same editor without a dashboard behind it (local browser storage, no site id). Its page title is "Buildrick Editor".

### 14s. Public API surface (for completeness)
The package exposes the editor shell as its default export plus the engine classes and types; it is not published and has no external consumers.

---

**Not verified in the running app:** every fact above comes from reading the code and its own measured-behaviour notes, not from a live walk in this session. Items explicitly flagged as drift (device size tables, legacy 991/575 breakpoints, purple global-style presets, documented-but-unbound chords, 1 GB quota constant vs plan values) should be settled with the founder before being drawn.

---

# Appendix — Coverage and known gaps

**What this appendix is.** Proof of completeness, plus a single list of the things that exist in the code but never reach a user today. Use the second list to decide what to design, what to drop, and what to ask engineering about before drawing it.

## How this inventory was produced

Eleven independent readers each took one area of the editor and read every source file in it (tests excluded), then wrote what a user can see and do. Counts below are files read per area. Nothing was inaccessible.

| Module | Area covered | Source files read |
|---|---|---|
| 1 | Shell — top bar, footer, rail, drawer container, global modals, notifications, review, publish flow, recovery, ⌘K, onboarding | 92 of 92 |
| 2 | Canvas — surface, breakpoints, zoom, device frame, empty/loading states, hover, selection, toolbars, overlays, footer toolbar | 82 of 82 |
| 3 | Canvas interactions — context menu, drag & drop, nesting rules, keyboard, comments, collaboration | 109 of 109 |
| 4 | Pages, page settings, templates, layers, history / version history | 113 of 113 |
| 5 | Add panel — elements, blocks, components, AI panel; element & block catalogues | 157 of 157 |
| 6 | Assets / media library, image editor, stock photos, CMS, variables, forms | 95 of 95 |
| 7 | Site settings, publish, review, export, e-commerce, animation editor, autosave/sync, feature flags | 90 of 90 |
| 8 | Inspector — every section, control and per-element property form | 121 of 121 |
| 9 | Brand / design system — tokens, presets, starters, classes, lint, import/export, colour mode | 124 of 124 |
| 10 | UI kit — every reusable chrome component, design tokens, design rules | 101 of 101 |
| 11 | Engine rules — breakpoints, states, commands, undo, limits, validation, naming, plan gating, onboarding steps, paste/import | 217 of 217 |

Some subjects appear in more than one module on purpose (for example keyboard shortcuts are listed per surface in modules 1–3 and consolidated in module 11; the publish flow is described from the top bar in module 1 and from the Publish drawer in module 7). Where two modules describe the same thing, both are describing the same code.

## Built but not reachable, unfinished, or gated — consolidated

Each of these is also flagged inline in its module. This list exists so nobody designs a screen for something that is dead, and so the owner can decide what to revive.

### Behind a feature flag (off for real users)
- Real-time collaboration: presence avatars, connection pill, remote cursors, the collaboration command in ⌘⇧P. Demo-only; last-write-wins.
- AI generation inside Brand (component-style generation modal).
- "All CSS" section and the schema-driven Border section in the Inspector (developer flags).
- Developer-only alternate rails in the shell.

### Coming soon / disabled in the UI
- Export as Vue and as Next.js ("Soon" pills in the Export modal).
- Figma export in Brand → Import/export.
- Integrations screen in Settings — every card is a link-out; nothing connects.
- Assets: "Trash" and "Import JSON" in the records/asset menus.
- Preview overlay "Share preview" button; Issues panel "jump to element"; both are drawn, not wired.

### Present in code, no door in the UI (unreachable)
- Canvas "Inspect / Minimal" hover toggle (I key) is never mounted — the level-3 box-model hover is Alt+Shift only.
- Canvas "Outlines" and "Dev mode" overlays; the "Watch" breakpoint (196×230) has no switcher button.
- The older 3-button device selector (used only inside template preview).
- The hover CMS glyph checks a marker nothing ever sets.
- Old "My Templates" list and old template preview modal; the older icon-style Layers context menu; four shared drawer pieces (view switcher, feature card, filter chips, sticky footer).
- Brand: lint banner, export dropdown, binding-editor row, starter-gallery modal — four unmounted pieces. Auto-fix has nothing that produces fixes. Restore/Retry on the migration modal only close it.
- Components: Rename and Variant-picker designs; export/import of components to a file has no UI.
- Add panel: no Recent row and no favourites in the drawer version (the canvas Element Picker modal has them).
- Inspector: no tab strip, no rename/breadcrumb, no colour-mode toggle, no eyedropper, no alpha/HSL inputs, no multi-stop gradient editor, no interaction *actions* (only animation presets), no per-type settings for navbar/slider/accordion/tabs/modal.
- Nothing produces a comment count badge; comments have no @mentions.

### Working but limited (design around it)
- CMS sources: JSON paste only — no Google Sheets, Airtable or CSV connectors. Variables live in the browser only and are not rendered on published pages.
- Forms: submissions inbox is always empty (capture not built); no spam protection; email notifications not sent.
- Cookie-consent toggle only records the choice.
- "APPLIED" / "AI" badges on assets never render. Folder trash silently refuses non-empty folders. Records-modal delete has no confirm.
- Pro-gated: Custom code, Integrations, Templates beyond the free set, Upgrade modal copy in module 1 / module 11.
- ⌘K prints "Ctrl+0" for Fit to view while the footer and cheat sheet print "⌘1" — one of them is wrong.
- Some block cards have blank thumbnails; a few catalogue entries are duplicated; some defaults still use an old purple.
- Inputs exist at two heights (32px and 36px) in the chrome; a few components carry off-palette colours (file drop zone, integration PRO badge, form-state overlay).
