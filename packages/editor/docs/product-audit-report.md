# Buildrik — Product Audit Report
**Date:** 2026-03-29
**Source reviewed:** `docs/product-blueprint.md`
**Method:** CEO-level product review — broken flows, blockers, missing navigation, missing flows, structural risks

---

## VERDICT UPFRONT

The product has a strong engine and decent editing core. But it has **3 categories of critical failure** that will kill conversion before a user ever publishes:

1. **The most important action (Publish) is invisible and broken**
2. **Users have no idea if their work is saved**
3. **4 of 10 core features are hidden behind keyboard shortcuts nobody knows**

Fix these three before adding anything new.

---

# PART 1 — BROKEN FLOWS

Flows that exist in the product but do not work correctly end-to-end.

---

## BF-1 — Publish Flow (CRITICAL)

**What's broken:**

| # | Bug | Impact |
|---|-----|--------|
| 1 | `hasSeoTitle`, `hasMetaDesc`, `hasSocialImg` hardcoded `false` | Checklist always shows 3 failures regardless of actual data |
| 2 | No rail button for Publish panel | Users cannot find Publish by clicking — keyboard-only (shortcut `U`) |
| 3 | `onPublish` callback required from host app | If not injected, Publish button does nothing — no error, no feedback, nothing |
| 4 | No publishing progress state | After click, user sees nothing change until success |
| 5 | No publish error state | If deploy fails, user has no way to know why or retry |
| 6 | No "unpublished changes" indicator anywhere | User edits published site, re-publishes — but has no idea if they're looking at a stale live version |

**User experience:** A user fills in their SEO, uploads a favicon, sets the title, then goes to publish. The checklist tells them 3 things are missing that are actually complete. They're confused. They click Publish anyway. Nothing happens. They don't know if the site is live. They refresh. They have no idea. **They give up.**

**Fix priority:** P0. Fix before anything else.

---

## BF-2 — SEO → Publish Data Disconnection (CRITICAL)

**What's broken:** Settings → SEO and Pages → Page Settings → SEO are two separate places to enter SEO data. Neither feeds the Publish panel checklist. The publish checklist checks for SEO completion but reads from a hardcoded `false` instead of actual data.

**User mental model:** "I filled in my SEO in Settings. Why does it say SEO is missing?"

**The actual flow the user expects:**
```
Settings → SEO → fill in global meta
  ↓
Pages → Page Settings → SEO → fill in per-page SEO
  ↓
Publish panel → checklist reads this data → shows ✓ SEO title set
```

**What actually happens:**
```
Settings → SEO → fill in global meta
  ↓
Publish panel → still shows ✗ SEO title (ignores what you entered)
```

**Fix:** Wire `hasSeoTitle`, `hasMetaDesc`, `hasSocialImg` to read from actual SEO data in composer state.

---

## BF-3 — Save State (HIGH)

**What's broken:** There is no autosave indicator anywhere in the product. No "Saving...", no "Saved ✓", no "Last saved 2 minutes ago", no "Unsaved changes" warning.

**User experience:** A user spends 45 minutes building a page. Their browser crashes. They have no idea if their work was saved. They reopen the app. It's gone (or it's there — they don't know which). Either way, they lost trust.

This is the "blinking cursor in a text editor" problem. Users need a constant ambient signal that their work is safe.

**Flows affected:**
- Every editing session
- Especially: long sessions, before closing tab, before publishing

---

## BF-4 — History Panel Misleads Users (MEDIUM)

**What's broken:** The History panel shows a list of past actions and lets users click to see before/after diffs. But clicking an entry does NOT revert to that state. It only shows the diff.

**User mental model:** "I see my history. I'll click 'Added heading 20 minutes ago' to go back to that state."

**What actually happens:** The diff shows but nothing changes on canvas. The user is confused — did it revert? Did it not? They can't tell.

**Risk:** This is worse than not having the feature. An empty History panel is honest. A clickable History panel that doesn't do what users think it does destroys trust.

**Fix:** Either (A) make clicking an entry revert to that state, or (B) make the click action explicitly non-revertible with a label ("View diff only — click Undo to go back").

---

## BF-5 — Responsive Editing Has No Breakpoint Indicator (MEDIUM)

**What's broken:** When a user switches to Mobile breakpoint and edits styles in the Inspector, the Inspector looks identical to Desktop. There is no visual indicator saying "you are editing MOBILE styles" and no diff indicator showing which properties are overridden vs inherited from base.

**Result:** Users accidentally edit mobile styles thinking they're editing desktop, or vice versa. They publish, check on mobile, see broken layout, don't know why.

**What the user expects:**
```
Inspector header: [ 📱 MOBILE — editing overrides ]
Background color: [blue] ← overridden (dot indicator)
Font size: [16px]  ← inherited from base
```

**What they get:** Inspector that looks exactly the same at every breakpoint.

---

## BF-6 — Pseudo-State Editing Has No Prominent Warning (MEDIUM)

**What's broken:** The pseudo-state selector (:default, :hover, :focus, :active) is a small set of chips in the Inspector header. It's easy to accidentally click :hover, change a color, and not notice you're now styling the hover state.

**User experience:** User changes button background to red. They click off, check the canvas — button looks blue (default state). They're confused. They styled :hover, not :default. They don't realize because the indicator was too subtle.

**Fix:** When in a non-default pseudo-state, show a prominent colored banner at the top of the Inspector: "EDITING :HOVER STATE — changes apply on mouse over only."

---

## BF-7 — Template Panel Has No Error Recovery (LOW)

**What's broken:** If a template fails to load (network error, API down), there is no error state. The template grid simply doesn't populate. The user sees an empty grid with no explanation.

**Also:** After successfully applying a template, there is no confirmation toast. The canvas just changes. Subtle, but disorienting for new users.

---

# PART 2 — BLOCKERS

Actions users cannot complete because of structural product decisions.

---

## BLK-1 — Cannot Publish Without Knowing Keyboard Shortcut

**Blocker:** Publish panel has no rail button. The only ways to open it:
- Know the keyboard shortcut `U`
- Have a custom onboarding flow that shows it

A user who discovers the editor organically, explores by clicking, and doesn't know keyboard shortcuts will **never find the Publish button**. The product's core conversion action is invisible.

**The irony:** The top bar has a "Publish" button. Clicking it either opens the sidebar Publish tab OR fires publish directly (unclear from code). If it opens the tab, users may find it. If it fires directly, the full publish flow (checklist, URL, status) is never seen.

**Doc gap:** The blueprint doesn't clarify what the Topbar Publish button actually does. This needs to be documented and verified.

---

## BLK-2 — Cannot Find Templates After First Run

**Blocker:** First-run auto-opens the template picker (good). But after the first session, Templates panel has no rail button. To use templates again (e.g., for a new page), users need shortcut `T`.

**Result:** The most common "I need a starting point" action is hidden after the first use. Users who want to apply a section template while building will give up and build from scratch.

---

## BLK-3 — Cannot Find Components Feature

**Blocker:** Components panel has no rail button. Shortcut `⇧A` (shift + A). No user will discover this.

Components are a professional-grade feature — master/instance relationship, changes propagate everywhere. For a freelancer building 5-10-page client sites, this is the feature that saves hours. They will never use it because they'll never find it.

---

## BLK-4 — Cannot Find History/Version Recovery

**Blocker:** History panel has no rail button. Shortcut `H`.

If a user makes a mistake and needs to go back beyond a few Ctrl+Z presses, they're stuck unless they know this shortcut. The Topbar has Undo/Redo buttons — but those are one-step. The History panel is the "time machine" — and it's invisible.

---

## BLK-5 — Cannot See If Site Is Live or Draft

**Blocker:** After publishing, if a user returns to edit the site, there is no indicator anywhere showing:
- "This site is currently published"
- "You have X unpublished changes"
- "The live site is behind by N edits"

Users with published sites are always editing in "unknown state." They don't know if what's on the live URL matches what's in the editor.

---

## BLK-6 — Cannot Invite Team Members From Within Editor

**Blocker:** No invite flow is visible in the editor. Collaboration works (real-time cursors, conflict modal) but there's no way to invite a collaborator from inside the editor. Presumably happens outside the editor scope — but this isn't documented, and users will look for it.

---

## BLK-7 — Cannot Preview Site As a Client Would See It

**Blocker:** Preview mode exists (button in topbar) but it opens a full-screen iframe. There is no:
- Shareable preview link (send to client without editor access)
- "View as visitor" mode (preview without editor chrome)
- Password-protected preview (for client approval flows)

For a freelancer showing a site to a client — the primary use case in the design doc — this is a significant gap.

---

# PART 3 — MISSING NAVIGATION

Navigation paths that don't exist or are structurally broken.

---

## MN-1 — No "Back to Dashboard" Path

The editor has no way to navigate back to a project list or dashboard. Once in the editor, the user is trapped. No breadcrumb, no home button, no "My Projects" link.

**User experience:** User opens wrong project. They must manually change the URL or close the tab. For a product targeting non-technical users, this is a jarring experience.

---

## MN-2 — No Consistent "Back" Pattern Inside Settings

Settings uses a card-drill-in pattern. Each screen slides in. This is fine. But the pattern breaks when:
- User is deep in Settings → SEO → editing a field
- They want to jump directly to Settings → Domains
- They have to hit Back, land on the card list, then click Domains

No direct panel-to-panel navigation within settings. Only back → forward.

---

## MN-3 — Inspector Has No Search

The Inspector has 3 tabs and 16+ sections. Finding "where is the border-radius setting?" requires knowing which tab it's in (Appearance) and scrolling to it.

A user who doesn't remember the layout must read every section label. For power users editing 10 properties at once, this creates constant friction.

**Missing:** Search bar at top of Inspector: type "shadow" → jumps to box-shadow section.

---

## MN-4 — No Cross-Panel "Jump" Navigation

There are many points where the product should offer a direct navigation action but doesn't:
- In Layers panel: "Open this element in Inspector" shortcut
- In Pages panel: "View SEO settings for this page" → should open Page Settings → SEO
- In Publish panel: "Fix SEO" → should jump to Settings → SEO
- In Inspector: "Edit this image in Media Library" → should jump to Media panel

Every one of these dead ends forces users to manually switch panels, remember where they were, and navigate back. For a product targeting non-technical users, this is death by a thousand cuts.

---

## MN-5 — No "Current State" Visibility

Users cannot see, at a glance:
- Which breakpoint they're on (other than looking at the device switcher)
- Which pseudo-state they're editing
- Whether the canvas is showing draft or published content
- Whether autosave is active
- What the last saved timestamp was

The product asks users to hold a lot of state in their heads that should be visible in the UI.

---

# PART 4 — MISSING FLOWS

Flows that users will need but are not documented as existing, or don't exist at all.

---

## MF-1 — Client Preview / Share Flow

**Missing:** No way for a freelancer to send a preview link to a client for review and approval before publishing.

This is one of the top 3 use cases for the primary persona (freelancer building client sites). Webflow has this. Framer has this. Without it, the freelancer must publish to live and send the real URL — which is unprofessional if the site isn't ready.

**What's needed:** "Get preview link" button → generates a time-limited shareable URL that shows the current draft without the editor chrome.

---

## MF-2 — Dashboard → Editor Transition Flow

**Missing from doc:** How does a user get into the editor from a project dashboard? The blueprint starts with "User opens app" but doesn't describe the project selection / creation flow that leads there.

This matters because:
- "Create new project" likely triggers a different first-run experience than "open existing"
- The project switcher (if it exists) is not documented
- Users managing multiple sites need to understand how to move between them

---

## MF-3 — CMS Create / Edit Flow

**Missing:** The engine supports CMS collections and entries. No editing UI exists. There is no documented flow for:
- Creating a collection (e.g., "Blog Posts")
- Adding fields to a collection
- Creating/editing entries
- Connecting a collection to a page template (dynamic pages)

This is a major product capability that is invisible. The blueprint mentions it as "in scope for engine, no UI" — but doesn't flag it as a planned flow or explain the timeline.

---

## MF-4 — Domain Connection Step-by-Step Flow

**Missing:** Settings → Domains exists as a screen. But the actual user flow for connecting a custom domain (point DNS, verify, wait for propagation, set SSL) is not documented.

This is one of the most anxiety-inducing flows for non-technical users. It requires leaving the editor, going to their domain registrar, making DNS changes, and waiting hours. If the product doesn't guide this clearly, users will fail here and churn.

**What's needed:** A step-by-step flow:
```
Enter domain → Get DNS records to copy → Step-by-step DNS instructions
  → "Waiting for propagation" status indicator
  → SSL certificate provisioning status
  → "Your domain is live" confirmation
```

---

## MF-5 — Collaboration Invite Flow

**Missing:** Real-time collaboration works but the invite flow is not documented. How does a second user get access to a project?
- Is there an invite by email?
- Is it managed outside the editor?
- Can users see who has access?
- Can they revoke access?

None of this is in the blueprint.

---

## MF-6 — Billing / Upgrade Flow

**Missing:** The Billing screen exists but the upgrade flow is not documented. What happens when a user hits a feature gate (Locked screen)? Is there an in-product upgrade path? Does clicking "Upgrade" open Billing in-editor or go to an external checkout?

For a SaaS product, the upgrade path is a revenue-critical flow. It should be documented explicitly.

---

## MF-7 — Error Recovery Flow (Composer Crash)

**Missing:** What happens if the editor engine (Composer) fails? The app has an ErrorBoundary but:
- What does the user see?
- Can they recover their work?
- Is there a "reload" path that preserves state?
- Is there a "report error" path to Sentry?

There is no documented crash/recovery flow.

---

## MF-8 — Empty Page / New Page Flow

**Partially documented.** Adding a page is mentioned. But what does a user see when they switch to a brand new empty page?
- Does it show the CanvasEmptyCTA?
- Does it auto-open the Add panel?
- Does it offer to apply a section template?

The transition from "page created" to "page has content" is not clearly mapped.

---

## MF-9 — Undo After Publish Flow

**Missing:** Can a user "undo" a publish? I.e., if they accidentally published a site that wasn't ready, can they revert to the previous published state?

The Unpublish button exists (takes the site offline). But "rollback to previous version" is not documented. If History doesn't support revert, and Publish doesn't have a version system, users who push a broken site live have no recovery path.

---

## MF-10 — Offline / Connection Lost Flow

**Missing:** The product has a SyncStatusIndicator. But what happens when a user loses internet mid-edit?
- Do edits queue locally and sync when reconnected?
- Do edits fail silently?
- Does the user get a warning?
- Can they continue editing offline?

Not documented. For a product where the entire value (saving, publishing) depends on connectivity, this is a critical gap.

---

# PART 5 — STRUCTURAL GAPS IN THE DOC ITSELF

Things the blueprint should contain but doesn't.

---

## DG-1 — No Error State Map

The blueprint documents happy paths well. It does not systematically document error states for any flow. Every flow should have a documented error variant:

| Flow | Happy Path | Error State |
|------|-----------|-------------|
| Publish | Site goes live | Deploy fails — user sees what? |
| Template apply | Canvas populated | Template load fails — user sees what? |
| Media upload | Asset appears in grid | Upload fails — user sees what? |
| Domain connect | DNS verified | DNS propagation fails — user sees what? |
| Collaboration | Cursors visible | Connection lost — user sees what? |

None of these error states are documented in the blueprint.

---

## DG-2 — No Empty State Map

Similarly, empty states are mentioned for some panels but not systematically:

| Panel / Screen | Empty State |
|----------------|-------------|
| Canvas | CanvasEmptyCTA — documented |
| Layers | "Add first block" — documented |
| Components | Missing — not documented |
| Media | Not documented |
| Pages (0 pages) | Not documented |
| History (fresh project) | Not documented |
| Templates (0 templates loaded) | Not documented |

---

## DG-3 — CMS is Mentioned but Not Scoped

The blueprint mentions CMS 3 times: "engine built, no UI", "in scope for engine", "UI tab needed before adding." But:
- When is CMS UI planned?
- What will it look like?
- Which panel will it live in? (Navigation is already at 10 tabs / 6 rail icons)
- What user actions will it support?

CMS being invisible creates confusion: users who import the editor and look for CMS won't know it exists. The blueprint should either scope CMS as "explicitly not in this product" or provide a rough shape of when/how.

---

## DG-4 — AI Features Are Vague

The blueprint mentions AI in 4 places:
- "AI-assisted design suggestions" in product scope
- "AI Assistant bar" (persistent bottom bar)
- "AI Request" in context menu
- "SmartSuggestions" on canvas
- "AISuggestion" section in Inspector

But none of these are explained in the flows. What does "AI Request" on the context menu actually do? What does the AI bar do? What are SmartSuggestions? This is either a deep feature that's under-documented or a shallow feature that's over-indexed in the UI surface.

---

## DG-5 — E-Commerce is Mentioned but Unresolved

The blueprint says "E-commerce transaction processing: structure exists in engine, not exposed." Like CMS, there is no clarity on:
- Is e-commerce a future product pillar or a technical artifact?
- Does it block or compete with any current flows?
- Should it be documented as "not available" somewhere in the product?

---

# PART 6 — PRIORITY MATRIX

## Critical (Fix Before Adding Anything New)

| ID | Issue | What Breaks Without Fix |
|----|-------|------------------------|
| BF-1 | Publish flow broken | Users cannot successfully publish |
| BF-2 | SEO data disconnected from Publish checklist | Checklist always shows 3 failures |
| BF-3 | No save state indicator | Users don't trust the product with their work |
| BLK-1 | Publish panel has no rail button | Most users will never find publish |
| BLK-5 | No draft vs published indicator | Users don't know if their live site is current |

## High Priority (Fix Before Onboarding New Users)

| ID | Issue | Impact |
|----|-------|--------|
| MN-1 | No "back to dashboard" | Users trapped in editor |
| BLK-2 | Templates hidden after first run | Users can't find templates for new pages |
| BLK-3 | Components feature invisible | Power feature wasted |
| BF-4 | History panel misleads on revert | Users expect click-to-revert |
| BF-5 | No breakpoint indicator in Inspector | Users break responsive layouts accidentally |
| MF-1 | No client preview share link | Freelancer primary use case blocked |
| MF-4 | Domain connection flow not guided | Non-technical users will fail at DNS |
| BLK-7 | No read-only preview link for clients | Freelancer use case broken |

## Medium Priority

| ID | Issue | Impact |
|----|-------|--------|
| BF-6 | Pseudo-state editing not prominent | Users style hover by accident |
| MN-3 | Inspector has no search | Power users lose time finding properties |
| MN-4 | No cross-panel jump navigation | Users navigate manually through dead ends |
| MF-3 | CMS flow not mapped | Major capability invisible |
| MF-5 | Collaboration invite not documented | Teams can't onboard new members in-product |
| DG-1 | Error states not documented | Error recovery is ad hoc |
| MF-7 | No crash recovery flow | Users lose work without knowing why |

## Low Priority (Polish)

| ID | Issue | Impact |
|----|-------|--------|
| BF-7 | Template error state missing | Edge case, low frequency |
| DG-2 | Empty states inconsistent | Polish |
| DG-4 | AI features undocumented | Could become high if AI is a key differentiator |
| MN-2 | No direct panel-to-panel nav in Settings | Minor friction |
| MF-8 | Empty page flow not mapped | Minor gap |

---

# PART 7 — WHAT THE BLUEPRINT IS MISSING (Structural Holes)

Things that must be added to the blueprint before it can serve as a "master reference."

| Missing Section | Why Needed |
|----------------|-----------|
| Error State Map | Every flow's failure variant — required for implementation |
| Empty State Map | Every screen's zero-data state |
| CMS Flow Scope | Either document it or explicitly mark it out-of-scope |
| E-Commerce Status | Same — resolve the ambiguity |
| AI Features Detail | What do each of the 4 AI surfaces actually do? |
| Dashboard → Editor Flow | How does the user get here? |
| Domain Connection Flow | Step-by-step guided flow for DNS setup |
| Client Preview/Share Flow | Shareable read-only link flow |
| Collaboration Invite Flow | How collaborators get added |
| Billing/Upgrade Flow | In-product upgrade path |
| Crash/Recovery Flow | ErrorBoundary behavior and recovery path |
| Offline Flow | What happens without internet |
| Version/Rollback Flow | Can user revert a published site? |
| Topbar "Publish" Button Behavior | Does it open the panel or fire publish directly? |
| Page Deletion Confirmation | Is there a guard for deleting pages with content? |
| Asset Management at Scale | What happens with 1000+ assets? |

---

# PART 8 — BEFORE NEXT FEATURE IS ADDED

Run this checklist. If any item is NO — fix it first.

```
[ ] Publish button is visible without keyboard shortcuts
[ ] Publish checklist reads from actual data (no hardcoded false)
[ ] Publish button works in standalone (or shows clear error if host callback missing)
[ ] "Saving / Saved / Unsaved changes" indicator exists somewhere in UI
[ ] "X unpublished changes" warning shown to users editing published sites
[ ] Templates panel is accessible without keyboard shortcut
[ ] Components panel is accessible without keyboard shortcut
[ ] History panel is accessible without keyboard shortcut
[ ] "Back to dashboard" path exists somewhere in editor
[ ] Inspector shows which breakpoint is being edited
[ ] Inspector shows which pseudo-state is being edited (prominent, not subtle)
[ ] History panel either supports revert OR makes it clear it's view-only
```

Until all 12 are YES, every new feature added is built on a broken foundation.

---

*End of Audit Report — Buildrik / Aquibra Studio — 2026-03-29*
