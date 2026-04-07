# UX Audit v3 — Deferred Issues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix four remaining deferred UX audit issues: friendly layer names (P-05/P-19), project naming prompt (P-08), unique spacing token labels (P-12), and SEO score info tooltip (P-17).

**Architecture:** All changes are isolated — each task touches exactly one or two files with no cross-task dependencies. No engine changes needed. No new components required for P-12 and P-17. P-05/P-19 adds a lookup map in LayerTreeItem.tsx. P-08 extends TourOverlay with an optional callback prop and adds a name-project step.

**Tech Stack:** React 18, TypeScript 5.3, Emotion CSS-in-JS, Vite. Run `npm run dev` on port 5050.

---

## Deferred Issues Summary

| ID | File(s) | Effort |
|----|---------|--------|
| P-05/P-19 | `src/editor/panels/layers/LayerTreeItem.tsx` | 30 min |
| P-08 | `src/shared/ui/TourOverlay.tsx`, `src/editor/shell/AquibraStudio.tsx` | 45 min |
| P-12 | `src/features/design-system/ui/spacing/SpacingTokenList.tsx` | 15 min |
| P-17 | `src/editor/sidebar/tabs/pages/settings/SeoTab.tsx` | 15 min |

---

## Task 1: P-05/P-19 — Friendly Layer Names

**Problem:** `displayName = customNames.get(layer.id) || layer.type` falls back to raw `layer.type` which can be "h1", "div", "nav", etc. The Build panel calls the same element "Heading" but Layers shows "h1". Users cannot map visual elements to layer entries.

**Files:**
- Modify: `src/editor/panels/layers/LayerTreeItem.tsx:93`

**Step 1: Read the current displayName line**

Open `src/editor/panels/layers/LayerTreeItem.tsx` and confirm line 93:
```ts
const displayName = customNames.get(layer.id) || layer.type;
```

**Step 2: Add TYPE_DISPLAY_NAMES map above the component (after imports, before the component)**

Insert after the last import statement (line 10) and before `export interface LayerTreeItemProps`:

```ts
/** Maps raw type/tagName values to user-friendly display labels */
const TYPE_DISPLAY_NAMES: Record<string, string> = {
  // HTML heading tags
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  // HTML block elements
  p: "Paragraph",
  div: "Container",
  span: "Text",
  section: "Section",
  nav: "Navbar",
  header: "Header",
  footer: "Footer",
  main: "Main",
  article: "Article",
  aside: "Sidebar",
  // HTML inline / media
  a: "Link",
  img: "Image",
  video: "Video",
  // HTML form elements
  button: "Button",
  input: "Input",
  textarea: "Textarea",
  select: "Select",
  form: "Form",
  // HTML list elements
  ul: "List",
  ol: "Ordered List",
  li: "List Item",
  // Semantic type aliases used by the engine (already friendly — just capitalize)
  heading: "Heading",
  paragraph: "Paragraph",
  container: "Container",
  text: "Text",
  image: "Image",
  link: "Link",
  navbar: "Navbar",
  hero: "Hero",
  features: "Features",
  grid: "Grid",
  flex: "Flex",
  icon: "Icon",
};

/** Returns a user-friendly display name for a layer type */
function getLayerDisplayName(type: string): string {
  return (
    TYPE_DISPLAY_NAMES[type] ??
    // Fallback: capitalize first letter of unknown types
    type.charAt(0).toUpperCase() + type.slice(1)
  );
}
```

**Step 3: Update the displayName calculation (line 93)**

Change:
```ts
const displayName = customNames.get(layer.id) || layer.type;
```

To:
```ts
const displayName = customNames.get(layer.id) || getLayerDisplayName(layer.type);
```

**Step 4: Run type check**

```bash
cd /Users/shahg/Desktop/test/buildrik && npx tsc --noEmit 2>&1 | grep -E "LayerTreeItem|error TS"
```

Expected: no errors referencing LayerTreeItem.tsx.

**Step 5: Commit**

```bash
git add src/editor/panels/layers/LayerTreeItem.tsx
git commit -m "fix(layers): show user-friendly names instead of raw HTML tags (P-05/P-19)

Adds TYPE_DISPLAY_NAMES lookup so h1→'Heading 1', div→'Container',
nav→'Navbar', etc. Fallback capitalizes unknown types. Custom names
(set by user via rename) are preserved as highest priority."
```

---

## Task 2: P-08 — Project Naming Prompt in Tour

**Problem:** The tour starts without ever prompting users to name their project. "Untitled Project" persists through publishing, affecting SEO site title and professionalism.

**Approach:** Add a Step 0 to TourOverlay with a text input. TourOverlay accepts a new optional `onNameProject` callback. AquibraStudio passes a callback that calls `composer.updateProjectMetadata`. The input pre-fills with the current project name from localStorage/composer.

**Files:**
- Modify: `src/shared/ui/TourOverlay.tsx`
- Modify: `src/editor/shell/AquibraStudio.tsx`

---

### Sub-task 2a: Extend TourOverlay

**Step 1: Read TourOverlay.tsx fully (already done — confirmed structure)**

Key facts:
- `TOUR_STEPS` array at line 18 — currently 3 steps
- `TourOverlay` is a `React.FC` with no props (line 41)
- Step 2 (`target: ""`, position: `"center"`) shows a centered card

**Step 2: Add `hasNameInput` flag to TourStep interface and a step 0**

In `src/shared/ui/TourOverlay.tsx`:

Add `hasNameInput?: boolean` to `TourStep` interface (line 10–16):
```ts
export interface TourStep {
  /** Element id to target (empty string = canvas center) */
  target: string;
  title: string;
  description: string;
  position: "center" | "right" | "left" | "bottom";
  /** If true, renders a project name text input */
  hasNameInput?: boolean;
}
```

Prepend a new step to `TOUR_STEPS` (make it the new index 0):
```ts
const TOUR_STEPS: TourStep[] = [
  {
    target: "",
    title: "Name your project",
    description: "Give your project a name — it becomes the browser tab title and SEO site name.",
    position: "center",
    hasNameInput: true,
  },
  {
    target: "rail-tab-templates",
    title: "Choose a template",
    description: "Start with a professionally designed template or build from scratch.",
    position: "right",
  },
  {
    target: "",
    title: "Edit your page",
    description: "Click any element to edit. Drag to rearrange.",
    position: "center",
  },
  {
    target: ".pillPublish",
    title: "Publish when ready",
    description: "Your work saves automatically. Hit Publish only when you're ready to go live.",
    position: "bottom",
  },
];
```

**Step 3: Add props interface and nameInput state to TourOverlay**

Change the component signature from `React.FC` (no props) to:
```ts
export interface TourOverlayProps {
  /** Called when user submits a project name from the naming step */
  onNameProject?: (name: string) => void;
  /** Current project name (pre-fills the input) */
  initialProjectName?: string;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({
  onNameProject,
  initialProjectName = "Untitled Project",
}) => {
```

Add `nameInput` state after the existing state declarations (after line 47, before the first `React.useEffect`):
```ts
const [nameInput, setNameInput] = React.useState(initialProjectName);
```

**Step 4: Render the name input inside the card when `currentStep.hasNameInput`**

In the tooltip card JSX, after `<p style={descStyles}>{currentStep.description}</p>` (line 195), add:

```tsx
{currentStep.hasNameInput && (
  <input
    type="text"
    value={nameInput}
    onChange={(e) => setNameInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        onNameProject?.(nameInput.trim() || "Untitled Project");
        handleNext();
      }
    }}
    placeholder="My Portfolio Website"
    aria-label="Project name"
    style={{
      width: "100%",
      padding: "8px 12px",
      borderRadius: 8,
      border: "1px solid var(--aqb-border)",
      background: "var(--aqb-bg-input, rgba(255,255,255,0.06))",
      color: "var(--aqb-text-primary)",
      fontSize: 14,
      outline: "none",
      boxSizing: "border-box",
    }}
    autoFocus
  />
)}
```

**Step 5: Call `onNameProject` when moving past the name step**

Update `handleNext` to fire the callback when leaving the name step (index 0):

```ts
const handleNext = () => {
  if (currentStep.hasNameInput) {
    onNameProject?.(nameInput.trim() || "Untitled Project");
  }
  if (currentStepIndex < TOUR_STEPS.length - 1) {
    setCurrentStepIndex((prev) => prev + 1);
  } else {
    handleFinish();
  }
};
```

**Step 6: Run type check**

```bash
cd /Users/shahg/Desktop/test/buildrik && npx tsc --noEmit 2>&1 | grep -E "TourOverlay|error TS"
```

Expected: no errors.

---

### Sub-task 2b: Wire TourOverlay in AquibraStudio

**Step 1: Read AquibraStudio.tsx around the TourOverlay render (line ~451)**

Confirm it currently renders:
```tsx
<TourOverlay />
```

**Step 2: Add a handleNameProject callback and pass props to TourOverlay**

Find the `TourOverlay` render and replace with:
```tsx
<TourOverlay
  onNameProject={(name) => {
    composer?.updateProjectMetadata?.({ name });
  }}
  initialProjectName={
    composer?.getProjectMetadata?.()?.name || "Untitled Project"
  }
/>
```

**Step 3: Run type check**

```bash
cd /Users/shahg/Desktop/test/buildrik && npx tsc --noEmit 2>&1 | grep -E "AquibraStudio|TourOverlay|error TS"
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/shared/ui/TourOverlay.tsx src/editor/shell/AquibraStudio.tsx
git commit -m "feat(tour): add project naming step as step 0 (P-08)

TourOverlay now accepts onNameProject/initialProjectName props.
New step 0 shows a text input pre-filled with current project name.
Moving to next step or pressing Enter fires onNameProject callback.
AquibraStudio wires callback to composer.updateProjectMetadata."
```

---

## Task 3: P-12 — Unique Spacing Token Labels

**Problem:** `SPACE_META` in `SpacingTokenList.tsx` maps two tokens each to SM, MD, LG, and XL — causing duplicate labels in the design panel. Developers referencing tokens by name use the wrong one.

**File:**
- Modify: `src/features/design-system/ui/spacing/SpacingTokenList.tsx:27-37`

**Step 1: Read current SPACE_META (already confirmed)**

```ts
const SPACE_META: Record<string, { semantic: string; size: "xs" | "sm" | "md" | "lg" | "xl" }> = {
  "space-1":  { semantic: "XS",  size: "xs" },
  "space-2":  { semantic: "SM",  size: "sm" },   // ← duplicate SM
  "space-3":  { semantic: "SM",  size: "sm" },   // ← duplicate SM
  "space-4":  { semantic: "MD",  size: "md" },   // ← duplicate MD
  "space-5":  { semantic: "MD",  size: "md" },   // ← duplicate MD
  "space-6":  { semantic: "LG",  size: "lg" },   // ← duplicate LG
  "space-8":  { semantic: "LG",  size: "lg" },   // ← duplicate LG
  "space-10": { semantic: "XL",  size: "xl" },   // ← duplicate XL
  "space-12": { semantic: "XL",  size: "xl" },   // ← duplicate XL
};
```

**Step 2: Replace SPACE_META with unique labels**

Change the `semantic` values to use a "+" suffix for the larger variant in each pair:

```ts
const SPACE_META: Record<string, { semantic: string; size: "xs" | "sm" | "md" | "lg" | "xl" }> = {
  "space-1":  { semantic: "XS",   size: "xs" },
  "space-2":  { semantic: "SM",   size: "sm" },
  "space-3":  { semantic: "SM+",  size: "sm" },
  "space-4":  { semantic: "MD",   size: "md" },
  "space-5":  { semantic: "MD+",  size: "md" },
  "space-6":  { semantic: "LG",   size: "lg" },
  "space-8":  { semantic: "LG+",  size: "lg" },
  "space-10": { semantic: "XL",   size: "xl" },
  "space-12": { semantic: "XL+",  size: "xl" },
};
```

The `size` field drives bar color and opacity — no change needed there. Only `semantic` changes.

**Step 3: Run type check**

```bash
cd /Users/shahg/Desktop/test/buildrik && npx tsc --noEmit 2>&1 | grep -E "SpacingToken|error TS"
```

Expected: no errors (only `semantic` string value changed, type is `string`).

**Step 4: Commit**

```bash
git add src/features/design-system/ui/spacing/SpacingTokenList.tsx
git commit -m "fix(design): deduplicate spacing token labels SM/MD/LG/XL (P-12)

Was: space-2 and space-3 both labelled 'SM' (8px and 12px).
Now: space-3 → 'SM+', space-5 → 'MD+', space-8 → 'LG+', space-12 → 'XL+'.
Preserves visual grouping (same bar color/opacity) while making each
label unique for design handoff and token reference."
```

---

## Task 4: P-17 — SEO Score Info Tooltip

**Problem:** The SEO score badge shows "30 — Needs work" with no explanation of what the score means or how to improve it. P2 (non-technical founders) are alarmed by the red badge but don't know what to do.

**File:**
- Modify: `src/editor/sidebar/tabs/pages/settings/SeoTab.tsx:84-92`

**Step 1: Read SeoTab.tsx lines 83-100 (already confirmed)**

The score row at line 84:
```tsx
<div className="pg-seo__score-row">
  <div
    className="pg-seo__score-badge"
    aria-live="polite"
    aria-label={`SEO Score: ${s.seoScore} out of 100 — ${scoreLabel(s.seoScore)}`}
  >
    <span className="pg-seo__score-num" style={{ color: scoreColor(s.seoScore) }}>{s.seoScore}</span>
    <span className="pg-seo__score-label">{scoreLabel(s.seoScore)}</span>
  </div>
  <div className="pg-seo__score-checks">
    ...
  </div>
</div>
```

`Tooltip` is already imported at line 11: `import { Tooltip } from "@shared/ui/Tooltip";`

**Step 2: Add an info icon with Tooltip after the score badge**

After the closing `</div>` of `.pg-seo__score-badge` (after line 92) and before `<div className="pg-seo__score-checks">`, insert:

```tsx
<Tooltip
  content="SEO score measures how well search engines can find and understand your page. Aim for 80+ before publishing. Completing the checklist below will raise your score."
  position="right"
>
  <span
    aria-label="What is SEO score?"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 16,
      height: 16,
      borderRadius: "50%",
      border: "1px solid var(--aqb-text-muted, #64748b)",
      color: "var(--aqb-text-muted, #64748b)",
      fontSize: 10,
      fontWeight: 700,
      cursor: "help",
      flexShrink: 0,
      lineHeight: 1,
      userSelect: "none",
    }}
  >
    ?
  </span>
</Tooltip>
```

**Step 3: Check Tooltip `position` prop is valid**

Run a quick grep to confirm the Tooltip component supports `position="right"`:

```bash
grep -n "position" /Users/shahg/Desktop/test/buildrik/src/shared/ui/Tooltip.tsx | head -10
```

If `position` prop does not exist on Tooltip, omit it (Tooltip will use its default positioning).

**Step 4: Run type check**

```bash
cd /Users/shahg/Desktop/test/buildrik && npx tsc --noEmit 2>&1 | grep -E "SeoTab|error TS"
```

Expected: no errors.

**Step 5: Commit**

```bash
git add src/editor/sidebar/tabs/pages/settings/SeoTab.tsx
git commit -m "feat(seo): add info tooltip explaining SEO score to P2 users (P-17)

Adds a circular '?' icon next to the score badge. On hover, shows:
'SEO score measures how well search engines can find your page.
Aim for 80+ before publishing.' Uses existing Tooltip component.
Tooltip is already imported; no new dependencies added."
```

---

## Deferred (Not in This Plan)

**P-14 — Context menu consolidation:** 3 concurrent context menu surfaces (floating toolbar + right-click menu + Quick Style sub-menu). Requires redesigning the entire context menu system. Estimated 1–2 weeks. Defer to a dedicated refactor sprint.

**P-20 — Version history thumbnails:** Requires server-side canvas thumbnail generation at each auto-save checkpoint. No frontend-only solution. Estimated 2–3 weeks including backend work. Defer.

---

## Execution Order

Tasks are independent — execute in order 1 → 2a → 2b → 3 → 4. Each task can be committed separately.

Total estimated time: ~2 hours for all four tasks.
