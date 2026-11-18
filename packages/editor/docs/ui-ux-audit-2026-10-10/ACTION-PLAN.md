# Buildrick UI/UX priorities

Recommendations only. No production code was changed. Issue IDs refer to [REPORT.md](REPORT.md). These tasks combine related findings so the same root cause is not scheduled repeatedly.

## 1. Make styling and preview trustworthy

**UX-09, UX-10, UX-25. Highest priority.**

Use one consistent resolved-style model for inspector, canvas and preview. Show the effective inherited value alongside its source; distinguish that from a locally authored override. Investigate the runtime mismatch before choosing implementation details.

Acceptance: set H1 to 32px at Mobile; canvas and Mobile preview both measure 32px, Desktop stays 52px, reload preserves the intended values in an authenticated project, Undo/Redo restore each state. Displayed line-height must agree with measured output. Inherited center alignment is visibly represented and announced. Repeat with spacing, font weight and a second breakpoint to establish whether the mismatch is broader.

## 2. Fix first-use layout and overlay ownership

**UX-01–04, UX-13.**

Keep one guidance layer active at a time. Use a small non-blocking success message after template creation; enter the created page directly. Trigger learning tips when the relevant task begins, not alongside every completion. Open a selected starter's own preview directly. Reserve confirmation for replacement/destructive consequences rather than routine reversible creation.

Acceptance: the 1280×720 empty state shows its complete heading and all start actions without clipping; no guidance covers Add controls; creating a starter returns to an editable canvas with one success message; first Preview shows the page immediately. Back/Escape/focus behave predictably.

## 3. Make responsive editing a visible primary workflow

**UX-06, UX-11, UX-12.**

Expose Desktop/Tablet/Mobile and active width next to canvas controls. Carry current page and device into Preview. Give built-in templates appropriate narrow-screen navigation, wrapping and typography defaults.

Acceptance: a new user can identify the active breakpoint without opening a menu; Preview keeps that context; SaaS starter fits at 375px with readable navigation and no collisions. Check intermediate widths, not only three named devices.

## 4. Reduce inspector effort and canvas obstruction

**UX-05, UX-07, UX-08, UX-14.**

Keep common text controls visible; collapse white-space, word-break, indentation and vertical alignment under an advanced group. Show override scope once at the panel top and mark only relevant properties. Place selection actions outside the selected content when space allows, with a fallback position near viewport edges. Use meaningful starter layer names such as Hero, Navigation links and Feature grid.

Acceptance: font, size, spacing and alignment are reachable with minimal scrolling at 1280×720; a selected small heading remains readable; toolbar stays usable at multiple zoom levels; a single font override does not produce misleading Text style state.

## 5. Isolate full-page tools for keyboard users

**UX-22.**

Remove covered editor chrome from the active accessibility/focus scope while full-page tools are open. Move focus to the new view's heading/first useful control, and restore it to the initiating control on exit.

Acceptance: Tab/Shift+Tab traverse only visible relevant controls in Settings, Brand, Templates and Asset library; screen readers do not encounter an inactive editor; closing a tool returns focus predictably. Preserve visible focus and Escape behavior.

## 6. Give CMS a coherent first task

**UX-15–17.**

Put “Create your first collection” and its primary action in the main work area. Explain records first and optional dynamic pages second. Keep Sources, Variables and Conditions secondary. Use a single honest form or a stepper that reflects actual completed steps.

Acceptance: opening empty CMS presents a clear main action; collection copy matches the form's default; an untouched name is not presented as a completed step; populated-state tests confirm the same navigation model.

## 7. Make Brand understandable before exposing implementation names

**UX-18–19.**

Start with semantic palette roles and typography styles. Group advanced/raw token names separately. Show whether the selected page/template is connected to brand tokens, and explain the impact before editing. Keep useful usage counts and preview, but distinguish a token-pair contrast check from a page-wide accessibility assessment.

Acceptance: a user can locate the primary action colour without choosing between several unexplained aliases; disconnected template colours are clearly identified; affected elements and preview match the scope described.

## 8. Standardize shell, controls and feedback

**UX-20–21, UX-23–24.**

Use one placement/treatment for Back to canvas across tools. Standardize primary actions. Label the asset column-count control explicitly. Prefer contextual/recent commands in the palette and show ↑↓, Enter and Escape hints. Delay input error styling until meaningful validation, or explain existing incomplete site setup separately from save status.

Acceptance: equivalent controls look and behave alike; command search remains fast for experienced users; untouched General settings does not look like a failed submission.

## Implementation sequence

1. Reproduce and fix style resolution/preview parity, line-height and alignment state.
2. Fix full-page keyboard isolation and 1280×720 clipping.
3. Unify onboarding/creation feedback and preserve device in Preview.
4. Improve responsive starter defaults and inspector disclosure.
5. Refine CMS, Brand, command palette and cross-tool consistency.
6. Run authenticated end-to-end checks before approving a whole-product redesign or launch.

Webflow's useful lesson here is explicit styling scope and inheritance; Framer's is a direct canvas-to-preview workflow. Apply those principles to Buildrick's own navigation instead of copying either product's surface appearance. Reference sources and limits are in the main report.
