# P4 · Accessibility Checks Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one "Accessibility" category to the editor's Issues panel. It covers:
- heading structure;
- accessible names for links, buttons and images;
- form labels;
- page title and language;
- contrast measured on rendered colours.

Every finding links to its element. Warnings are listed first. Each finding is marked **Confirmed** or **Needs a check**, and the copy says "checks", never "WCAG compliant".

**Architecture:** The static checks are pure functions in `packages/shared/content/a11yChecks.ts`. They walk the same element tree as `contentIssues.ts`, so the editor scanner and, later, the server can share them. Rendered contrast runs in the editor only, because it needs `getComputedStyle` on the in-document canvas. It is a separate hook gated on L5-050 font/colour parity. Both feed the existing `useIssuesFeed`. The `Issue` type gains `category` and `certainty`, and `IssuesPanel` groups by category.

**Tech Stack:** TypeScript 5 strict, Vitest + RTL (jsdom), React 18 chrome (chrome-ui, `tw:`, `--bk-*`). **No Prisma change. No server endpoint.**

**Spec:**
- `docs/audits/2026-10-08-editor-full-audit/OWNER-ANSWERS-2026-10-10.md`: FG-026, L4-040 (merged), the FG-006 rationale line ("labelled by what they actually check"), and L4-038 ("not checked" ≠ zero).
- Detail: `phase2-live/FG.md` §FG-026, `phase2-live/L4.md` §L4-040, `status-not-done.md:41`.

## Global Constraints

- Copy:
  - Category title: "Accessibility".
  - Category footnote: "These checks catch common problems. Passing them doesn't mean the page meets WCAG." The words "compliant", "compliance" and "WCAG AA passed" never appear as a claim.
  - Certainty pills: "Confirmed" and "Needs a check".
- Severity: every accessibility finding ships as `warning` ("warnings first"). None blocks publish: the editor `open-errors` gate counts errors only (`lifecycle.ts:218`) and no server check is added.
- `packages/shared` stays DOM-free. `engine/` imports only `shared/`. Chrome uses `@/editor/chrome-ui`. No raw native controls (Gate 24). No `../../`.
- The rendered-contrast task (Task 6) **does not start until L5-050 is LIVE-VERIFIED**: preview, canvas and export text colour and font are equal (owner order: priority 1 item).
- The FIGMA loop from `packages/editor/CLAUDE.md` applies to Task 5. Board sample data is never copied literally.
- Live steps never publish from the QA workspace.

## Review Focus

1. **AI-generated or pasted sections stored as `contentFormat: "html"`.** Their headings, links and inputs are invisible to the element walker (`contentIssues.ts` gap). Expected: these elements produce one **"Needs a check"** finding, "Custom HTML here wasn't checked", and never contribute to a "No accessibility issues found" state. Pinned in Task 1.
2. **The default Form block (inputs with only a placeholder, `blocks/Forms/Form.tsx:18`).** Expected: one finding per unlabelled field, not one per form, and a placeholder never counts as a label. A field wrapped in `<label>`, or with `aria-label`, `aria-labelledby` or `label[for=id]` anywhere on the page, passes. Pinned in Task 2.
3. **Text over a background image, gradient or semi-transparent layer.** Expected: contrast is reported as "Needs a check" with the measured ratio against the nearest solid colour. It is never reported as Confirmed pass or Confirmed fail. Pinned in Task 6.
4. **The Issues panel before the first scan finishes, or after a scan fails.** Expected: the category shows "Not checked yet" or "Couldn't check" with "Try again", never "0" and never "No issues" (L4-038). Pinned in Task 4.
5. **A finding whose element was deleted after the scan.** Expected: clicking the row re-runs the scan, and the row disappears instead of selecting nothing or throwing. Pinned in Task 4.

---

## Reality check (code is truth; `origin/main` @ `503bc62cd`)

1. **There is no category concept.** The `Issue` type (`editor/shell/hooks/useStudioState.ts:81-113`) is `{id, type: error|warning|info, message, tokenId?, autoFixHint?, elementId?, location?, pageId?, contentKind?}`. `IssuesPanel.tsx` (428 lines) renders a flat list sorted errors-first, with filter All / Errors / Warnings and scope This page / Whole site.
2. **The feed merges three sources** (`useIssuesFeed.ts:162`): DS-lint (Brand contrast between **tokens**, not rendered elements, `design-system/utils/contrastLint.ts:106`), content issues (`useContentIssueScanner.ts:57` → `packages/shared/content/contentIssues.ts`), and publish-check rows.
3. **Content issue kinds today** are `missing-alt | missing-image | broken-link` (`contentIssues.ts:44`). Missing alt is already reported. This plan **moves it into the Accessibility category** and does not duplicate it. Decorative handling already exists (`data.decorative` or `alt=""` skipped, `:104-129`).
4. **`contentFormat: "html"` blocks are never inspected** (`editor/src/shared/types/element.ts:62`), so their content is unchecked.
5. **Form fields are unlabelled by default.** The Form block's inputs carry only `placeholder`. The Inspector field named "Label" writes `placeholder` (`inspector/sections/FormFieldsSection.tsx:116-118`). L3-029 (owner priority 3) gives the default form real labels, so this plan's form check will flag every existing form until L3-029 lands. That is correct, and noted for the owner (Q2).
6. **The page `<title>` is never empty.** `resolvePageTitle` falls back to the page name or "Untitled" (`SEOInjector.ts:24-39`). The language falls back to `"en"` (`resolveLanguage`, `:81`). The "title" and "lang" checks therefore mean "fell back to a default", not "absent". If P4-SEO Task 3 lands first, use `resolveEmittedTitle(...).source` from `packages/shared/seo/titles.ts`. Otherwise use a local equivalent that is replaced when it lands.
7. **The canvas is in-document, not an iframe** (`Canvas.tsx:788`, `data-buildrick-canvas`). Elements carry `data-buildrick-id` (`shared/constants/config.ts:18`), and `findDOMElementById` is at `shared/utils/dragDrop/domHelpers.ts:42`. `getComputedStyle` therefore works on the **active page only**.
8. **There are two WCAG contrast implementations.** One is `engine/designSystem/colorMath.ts:142` `calcContrastRatio` (hex only). The other is `shared/utils/parsers/colorContrast.ts:36` `getContrastRatio` (rgb strings). Task 6 uses the second, because computed styles are rgb. The duplicate is noted and not consolidated here.
9. **L5-050 is not fixed.** `status-wave6.md:56` records preview text at rgb(0,0,0) without the Inter link versus the canvas at rgb(51,65,85). The owner approved parity as a correctness fix (priority 1). Measuring contrast before parity would measure a colour the published site may not have.
10. **Boards.**
    - The only a11y board is "Preview · accessibility checker" `4418:141508` (Figma-only, annotated NOT IMPLEMENTED; boards.json lists it as `817:4899` "design-ahead / undecided").
    - The owner puts the module **in Issues**, so the anatomy comes from the v3 Issues board `4418:147641` (row dot, severity pill, scope toggle, contrast row with Fix), "Whole site" `6698:66970` (draws a missing-title check), and "No issues" `6158:51949`.
    - **No board draws a category header or certainty pill.** That is a designer request (Q1).
11. **L4-038 (Site menu Issues count badge) is not built** (`SiteMenu.tsx:179-182`, title attribute only). It is not in this plan's scope, but Task 4's "not checked ≠ zero" state is the data the badge will read.

## File Structure

| File | Responsibility | New / Modify |
|---|---|---|
| `packages/shared/content/a11yChecks.ts` | static checks over `ContentPage[]` | Create |
| `packages/shared/content/__tests__/a11yChecks.test.ts` | rule fixtures | Create |
| `packages/shared/content/contentIssues.ts` | export the walker helpers a11yChecks reuses; tag missing-alt as accessibility | Modify |
| `packages/editor/src/editor/shell/hooks/useStudioState.ts:81-113` | `Issue.category`, `Issue.certainty` | Modify |
| `packages/editor/src/editor/shell/hooks/useContentIssueScanner.ts` | run a11y checks with the content scan; page meta (title source, lang) | Modify |
| `packages/editor/src/editor/shell/hooks/useRenderedContrastScan.ts` | computed-style contrast on the active page | Create (Task 6, gated) |
| `packages/editor/src/editor/shell/hooks/useIssuesFeed.ts` | merge, scan state per category | Modify |
| `packages/editor/src/editor/shell/IssuesPanel.tsx` | category groups, certainty pill, footnote, not-checked state | Modify |
| `packages/editor/src/editor/shell/AquibraStudio.tsx:597-618` | row click: stale element → rescan | Modify |

---

### Task 0: Board request and parity gate check (blocking for Tasks 5–6 only)

**Files:**
- Create: `docs/design-jobs/A11Y/BRIEF.md`

- [ ] **Step 1:** Write a one-page brief for the designer. The board must show:
  - the Issues panel (`4418:147641` anatomy) with an **Accessibility** group header, a count, and the footnote copy from Global Constraints;
  - rows carrying a "Confirmed" or "Needs a check" pill next to the severity pill;
  - group states "Not checked yet", "Couldn't check · Try again", and "No accessibility issues found by these checks";
  - a contrast row showing the measured ratio and required ratio ("3.0 : 1 · needs 4.5 : 1").

  Reference `6698:66970` (missing-title row) and `6158:51949` (empty). The Preview checker `4418:141508` stays design-ahead; the brief recommends archiving it (Q1).
- [ ] **Step 2:** Read `docs/audits/2026-10-08-editor-full-audit/status-wave*.md` and the L5-050 row of `ISSUE-INDEX.md`. Write in the brief whether L5-050 is LIVE-VERIFIED. If it is not, Task 6 is parked and the plan ships Tasks 1–5.
- [ ] **Step 3:** Commit: `git commit -m "docs(a11y): Issues accessibility category board brief + L5-050 gate"`

### Task 1: Shared static checks — headings and unchecked HTML

**Files:**
- Create: `packages/shared/content/a11yChecks.ts`, `packages/shared/content/__tests__/a11yChecks.test.ts`
- Modify: `packages/shared/content/contentIssues.ts` (export `walkPage`, `describeElement` and the `ContentElement`/`ContentPage` types if they are not already exported)

**Interfaces:**
- Consumes: `ContentPage`, `ContentElement` (`contentIssues.ts:27-37`).
- Produces:

```ts
export type A11yKind =
  | "heading-skip" | "heading-empty" | "h1-missing" | "h1-multiple"
  | "name-missing-link" | "name-missing-button" | "form-label-missing"
  | "title-default" | "lang-default" | "html-unchecked" | "contrast-low";
export type Certainty = "confirmed" | "uncertain";
export interface A11yFinding { id: string; kind: A11yKind; certainty: Certainty; message: string; location: string; elementId?: string; pageId: string; }
export interface A11yPageMeta { titleSource: "page-seo" | "home-default" | "template" | "page-name"; langExplicit: boolean }
export function detectA11yIssues(pages: ContentPage[], meta: Record<string, A11yPageMeta>): A11yFinding[];
```

- [ ] **Step 1: Write the failing tests** (headings and HTML part).

```ts
import { describe, it, expect } from "vitest";
import { detectA11yIssues } from "../a11yChecks";
const page = (children: any[]) => ({ id: "p1", name: "Home", root: { id: "root", type: "section", children } });
const meta = { p1: { titleSource: "page-seo" as const, langExplicit: true } };
const h = (id: string, level: number, content = "Title") => ({ id, type: "heading", tagName: `h${level}`, content });

describe("headings", () => {
  it("flags a skipped level on the deeper heading", () => {
    const f = detectA11yIssues([page([h("a", 1), h("b", 3)])], meta);
    expect(f).toContainEqual(expect.objectContaining({ kind: "heading-skip", elementId: "b", certainty: "confirmed" }));
  });
  it("flags an empty heading", () => {
    expect(detectA11yIssues([page([h("a", 1), h("b", 2, "  ")])], meta).map((x) => x.kind)).toContain("heading-empty");
  });
  it("flags no h1 once per page and two h1s on the second", () => {
    expect(detectA11yIssues([page([h("a", 2)])], meta).filter((x) => x.kind === "h1-missing")).toHaveLength(1);
    expect(detectA11yIssues([page([h("a", 1), h("b", 1)])], meta)).toContainEqual(expect.objectContaining({ kind: "h1-multiple", elementId: "b" }));
  });
});

describe("custom HTML", () => {
  it("reports html-format content as uncertain, once per element", () => {
    const f = detectA11yIssues([page([h("a", 1), { id: "x", type: "section", data: { contentFormat: "html" }, content: "<h4>Hi</h4>" }])], meta);
    expect(f).toContainEqual(expect.objectContaining({ kind: "html-unchecked", certainty: "uncertain", elementId: "x" }));
  });
});
```

- [ ] **Step 2: Run them and confirm they fail.** `pnpm vitest run packages/shared/content/__tests__/a11yChecks.test.ts`. Expected: module not found.
- [ ] **Step 3: Implement.** Walk in document order with the exported `walkPage`. The heading level comes from `tagName` (`h1`..`h6`). Heading text is `content` stripped of tags and trimmed. Ids use the form `a11y:<kind>:<elementId|pageId>`. Messages are plain sentences ("Heading jumps from level 1 to level 3"). Read `contentFormat` from `el.data?.contentFormat ?? el.contentFormat`; match how `element.ts:62` is serialised by `exportPages()` and pin that in the test fixture.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(a11y): shared heading checks + unchecked-HTML marker"`

### Task 2: Shared static checks — accessible names and form labels

**Files:**
- Modify: `packages/shared/content/a11yChecks.ts`, `__tests__/a11yChecks.test.ts`

- [ ] **Step 1: Write the failing tests** (append).
  - A `link` with no text and no `aria-label`, `title` or image child with alt gives `name-missing-link`, confirmed.
  - A link whose only child is an image with alt "Home" passes.
  - A `button` with only an icon child (no text) and no `aria-label` gives `name-missing-button`.
  - `input` with only `placeholder` gives `form-label-missing` with `elementId` = the input id.
  - The same input with `attributes.id = "email"` and a `label` element on the page with `attributes.for = "email"` passes.
  - An input nested inside a `label` passes.
  - `aria-label` or `aria-labelledby` passes.
  - `type="hidden"`, `type="submit"` with a value, and `type="button"` with a value are skipped.
  - `select` and `textarea` follow the same rules.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.** Do a first pass collecting `label[for]` ids per page, then a second pass for the checks. Images are **not** re-checked here; missing alt stays in `contentIssues.ts` (Task 3 re-categorises it).
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(a11y): accessible-name and form-label checks"`

### Task 3: Page title and language checks; wire into the scanner with categories

**Files:**
- Modify: `packages/shared/content/a11yChecks.ts` (+ tests), `packages/editor/src/editor/shell/hooks/useStudioState.ts:81-113`, `packages/editor/src/editor/shell/hooks/useContentIssueScanner.ts`, `packages/editor/src/editor/shell/hooks/useIssuesFeed.ts`
- Test: `packages/editor/src/editor/shell/hooks/__tests__/useContentIssueScanner.test.ts`, `useIssuesFeed.test.ts`

**Interfaces:**
- Produces:
  - `Issue.category?: "brand" | "content" | "accessibility" | "publish"` (absent is read as content, for old rows).
  - `Issue.certainty?: "confirmed" | "uncertain"`.
  - `ContentScanResult.a11yState: "idle" | "scanning" | "done" | "error"` (the existing `scanState`, now exposed per category).
- Category mapping:
  - DS-lint → `brand`
  - `missing-alt` → `accessibility` (confirmed)
  - `missing-image` and `broken-link` → `content`
  - publish bridge → `publish`
  - every `A11yFinding` → `accessibility`

- [ ] **Step 1: Write the failing tests.**
  - `titleSource === "page-name"` gives `title-default` with the message "This page's title is just its name — set an SEO title in Page settings". `"template"` and `"page-seo"` pass.
  - `langExplicit: false` gives one `lang-default` per **site**, attached to the home page: "Site language isn't set; pages declare English".
  - Scanner: on a composer fixture, the feed contains `category: "accessibility"` rows, every one with `type: "warning"`. A missing-alt row is tagged accessibility, and no duplicate missing-alt row appears.
- [ ] **Step 2: Run them and confirm they fail.** `cd packages/editor && npx vitest run src/editor/shell/hooks` and `pnpm vitest run packages/shared/content`
- [ ] **Step 3: Implement.**
  - Build `meta` in the scanner. `titleSource` comes from `resolveEmittedTitle` (P4-SEO Task 3) when that file exists. Otherwise use a local `titleSourceOf(page)` that mirrors `SEOInjector.resolvePageTitle`'s branches; leave a one-line comment naming the P4-SEO task that replaces it.
  - `langExplicit = Boolean(projectSettings.seo.language?.trim())`.
  - Map `A11yFinding` to `Issue` with `type: "warning"`.
- [ ] **Step 4: Run them and confirm they pass.** Update `useIssuesFeed.test.ts` expectations that counted missing-alt under content in the same commit.
- [ ] **Step 5: Commit.** `git commit -m "feat(a11y): page title/lang checks; Issue.category + certainty in the feed"`

### Task 4: IssuesPanel groups, certainty pill, footnote, not-checked state, stale rows

**Files:**
- Modify: `packages/editor/src/editor/shell/IssuesPanel.tsx`, `packages/editor/src/editor/shell/AquibraStudio.tsx:597-618`
- Test: `packages/editor/src/editor/shell/__tests__/IssuesPanel.test.tsx` (extend), `IssuesPanel.a11y.test.tsx` (new)

**Interfaces:**
- Consumes: `Issue.category`, `Issue.certainty`, `a11yState` (Task 3).
- Produces: `IssuesPanel` prop `categoryStates: Partial<Record<IssueCategory, "idle" | "scanning" | "done" | "error">>` and `onRetry(category)`.

- [ ] **Step 1: Write the failing tests.**
  - The groups render in a fixed order: Accessibility, Content, Brand, Publish. Each has a header with its count. The existing filter and scope still apply inside groups, and errors still sort first within a group.
  - Every accessibility row shows a chrome-ui `Badge` "Confirmed" or "Needs a check".
  - The group footnote text equals the Global Constraints copy. `screen.queryByText(/compliant|compliance/i)` is null.
  - `a11yState: "scanning"` renders "Not checked yet" with **no count**. `"error"` renders "Couldn't check" and a "Try again" button calling `onRetry("accessibility")`. `"done"` with zero rows renders "No accessibility issues found by these checks".
  - Clicking a row whose `elementId` no longer exists in the composer calls the rescan and does not call `locateComment`.
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run src/editor/shell/__tests__/IssuesPanel`
- [ ] **Step 3: Implement.** Group headers use chrome-ui `Row` / section-label tokens. In `AquibraStudio.tsx`, before `locateComment`, check `composer.elements.getById(issue.elementId)`. If it is missing, emit the scanner's rescan and return.
- [ ] **Step 4: Run them and confirm they pass.** Rewrite flat-list assertions in `IssuesPanel.test.tsx` in this commit.
- [ ] **Step 5: Commit.** `git commit -m "feat(issues): category groups with Accessibility first, certainty pills, not-checked state (FG-026)"`

### Task 5: Figma loop and live verification of the static module

**Figma:** the board from Task 0's brief once delivered. Until then, compare row anatomy against `4418:147641` and the empty state against `6158:51949`, and mark the group header **pending board** in the PR.

- [ ] **Step 1:** Load `figma:figma-design-to-code` and call `get_design_context` on the delivered board (or `4418:147641`). Compare with live at 1440×900, Issues open, Whole site scope. Fix until they match by eye.
- [ ] **Step 2: Live done-condition** on a local dev site (no publish):
  1. Insert the default Form block. The Accessibility group lists one "Form field has no label" per field, each "Confirmed".
  2. Click a row. The input is selected on the canvas (`document.querySelector('[data-buildrick-id="<id>"]')` carries the selection outline class).
  3. Add an H3 directly under the H1. A "Heading jumps from level 1 to level 3" row appears within 1 s.
  4. Paste an HTML section. One "Custom HTML here wasn't checked" row appears, "Needs a check".
  5. Throttle offline and reload. Before the scan finishes the group reads "Not checked yet", not 0.
- [ ] **Step 3:** Record the measurements in `docs/audits/2026-10-08-editor-full-audit/status-p4-a11y.md` and commit: `git commit -m "docs(audits): a11y static checks live-verified"`

### Task 6: Rendered contrast on the active page (gated on L5-050 LIVE-VERIFIED)

**Files:**
- Create: `packages/editor/src/editor/shell/hooks/useRenderedContrastScan.ts`, `__tests__/useRenderedContrastScan.test.ts`
- Create: `packages/editor/src/editor/shell/hooks/effectiveBackground.ts` + test (one job: walk ancestors to the first opaque background)
- Modify: `packages/editor/src/editor/shell/hooks/useIssuesFeed.ts`

**Interfaces:**
- Consumes: `getContrastRatio(fg: string, bg: string): number` (`shared/utils/parsers/colorContrast.ts:36`), `findDOMElementById` (`shared/utils/dragDrop/domHelpers.ts:42`).
- Produces:
  - `effectiveBackground(el: Element): { color: string; certain: boolean }`. `certain` is false when any ancestor up to the canvas root has a `background-image`, an alpha < 1 background, `opacity` < 1, `mix-blend-mode` ≠ normal, or a `filter`.
  - `useRenderedContrastScan(composer, enabled: boolean): { findings: Issue[]; state }`. It covers the active page only. Its scope note reads "Contrast is checked on the page open in the canvas".

- [ ] **Step 1: Write the failing tests** (jsdom with stubbed `getComputedStyle`).
  - Text `rgb(14,18,32)` on `rgb(26,86,219)` at 16px/400 gives ratio ≈3.0, a `contrast-low` "Confirmed" warning, with the message "Text contrast 3.0 : 1 — needs 4.5 : 1". This is the L4-040 "View Work" button case.
  - The same colours at 24px give the requirement 3 : 1, so it passes. 18.66px at weight ≥700 also counts as large.
  - Text over a parent with `background-image: url(x)` gives "Needs a check", with the ratio computed against the nearest solid colour and the message suffix "(background image; check by eye)".
  - Hidden elements (`display:none`, `visibility:hidden`, zero size) and empty text nodes are skipped.
  - When `enabled` is false the hook does nothing and returns `state: "idle"`.
- [ ] **Step 2: Run them and confirm they fail.** `npx vitest run src/editor/shell/hooks/__tests__/useRenderedContrastScan.test.ts`
- [ ] **Step 3: Implement.**
  - Only text-bearing element types (heading, paragraph, text, link, button, label, list item) are measured.
  - Debounce 600 ms on `ELEMENT_UPDATED`, `PROJECT_CHANGED` and the page switch.
  - Cap at 400 elements per pass, reporting "Checked the first 400 text elements" as one uncertain info row when capped.
  - The `enabled` input comes from a constant `RENDERED_CONTRAST_READY` in `shared/constants/` that the L5-050 fix commit flips to `true`. **Do not use a feature flag**: the dependency is a code fact, not a rollout.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Live done-condition** after L5-050:
  - Build a hero with a `#1A56DB` button and dark text. The Issues › Accessibility row reports the ratio.
  - In DevTools, compute `getComputedStyle(btn).color` and the background and recompute the ratio by hand (record both). They must agree to one decimal.
  - Open Preview and measure the same element. The colour is equal, which is the parity precondition.
- [ ] **Step 6: Commit.** `git commit -m "feat(a11y): rendered text contrast on the active page (L4-040), after L5-050 parity"`

---

## Owner questions (recommended defaults in bold)

| # | Question | Recommendation |
|---|---|---|
| Q1 | The Preview a11y checker board `4418:141508` vs one category in Issues. | **Archive the Preview board.** Ask the designer for one Issues board with the category header, certainty pills and the three group states (Task 0 brief). |
| Q2 | Should form-label findings ship before L3-029 gives the default Form real labels? Every existing form will light up. | **Yes, ship as warnings.** They are true findings. L3-029 (priority 3) removes them for new forms. |
| Q3 | Should accessibility findings feed the publish panel as a warning row? | **Not now.** They stay in Issues only. Revisit after a month of use, then add a non-blocking server row that reuses `a11yChecks.ts`. |
| Q4 | Should rendered contrast be checked on every page or only the open one? | **The open page only**, which avoids rendering hidden pages. The note says so. |

## Migrations

None.
