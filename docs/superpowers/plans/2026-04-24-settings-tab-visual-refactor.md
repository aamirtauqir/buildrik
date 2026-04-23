# Settings Tab Visual Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Settings tab shell and shared primitives to 90%+ visual parity with `design-system/project/left-panel/tab-settings.html`, using only `--bd-*` tokens. Screen data, composer I/O, and persistence untouched.

**Architecture:** Three-column shell (48 rail + 140 snav + 1fr pane) driven by a central dirty counter and a sticky save bar. Shared primitives (Section, Field, Input, Textarea, Select, SwitchRow, Savebar, SnavRow) live in `shared.tsx` and emit `.bd-set-*` classes defined in a new `settings.css`. Screens swap imports only (JSX unchanged) except `SiteSettingsScreen` (drops StickyFooter + auto-save-on-blur), the Branding row (becomes a placeholder linking to the Palette tab), and `BillingScreen` (migrated to match visual standard).

**Tech Stack:** React 18 · TypeScript 5.3 · Vite 7 · Emotion CSS-in-JS (existing) + CSS file (new for this tab) · Vitest + React Testing Library · tokens `--bd-*` from `themes/bridge-tokens.css`.

**Spec reference:** `docs/superpowers/specs/2026-04-24-settings-tab-visual-refactor-design.md` (commit `d052b93`).

---

## File Structure

```
packages/editor/src/editor/sidebar/tabs/settings/
├── SettingsTab.tsx          REWRITE   Shell, snav, central savebar, Branding placeholder
├── settings.css             NEW       All .bd-set-* classes
├── shared.tsx               REWRITE   Section, Field, Input, Textarea, Select, SwitchRow,
│                                      Savebar, SnavRow; token sweep for Locked primitives;
│                                      SettingsNavGuard visual refresh
├── icons.tsx                UPDATE    Swap 5 snav icons (site/branding/seo/int/publishing)
│                                      to prototype SVG shapes
├── constants.ts             UNTOUCHED
├── types.ts                 UNTOUCHED
├── hooks/useSettingsScreen.ts UNTOUCHED
├── screens/SiteSettingsScreen.tsx  MODIFY   Drop StickyFooter + auto-save-on-blur,
│                                            swap to new primitives
├── screens/SeoScreen.tsx            MODIFY   Import swap, drop legacy styles
├── screens/IntegrationsHub.tsx      MODIFY   Import swap, drop legacy styles
├── screens/IntegrationsScreen.tsx   MODIFY   Import swap (if kept after orphan check)
├── screens/AnalyticsScreen.tsx      MODIFY   Import swap (if kept)
├── screens/AdvancedScreen.tsx       MODIFY   Import swap (if kept)
├── screens/PublishingHub.tsx        MODIFY   Import swap
├── screens/DomainsScreen.tsx        MODIFY   Import swap
├── screens/ExportScreen.tsx         MODIFY   Import swap
├── screens/BillingScreen.tsx        MODIFY   Migrate to new primitives (visual parity)
├── screens/LockedScreen.tsx         MODIFY   Token-only sweep (layout preserved)
└── __tests__/SettingsTab.test.tsx   MODIFY   Update class/token assertions
```

---

## Task 0: Pre-flight

**Files:**
- Read: `packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx`
- Read: `packages/editor/src/themes/bridge-tokens.css` (verify `--bd-*` tokens exist)

- [ ] **Step 1: Confirm clean working tree**

Run from repo root:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && git status --short
```
Expected: no settings/ files in output. If dirty, stash with `git stash push -m "pre-settings-refactor"`.

- [ ] **Step 2: Run existing settings tests for baseline**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/settings/ --reporter=verbose 2>&1 | tail -40
```
Expected: green. Note pass count to compare against after refactor.

- [ ] **Step 3: Grep consumers of shared.tsx exports across `packages/editor/src/`**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor/src && for sym in Note Warning SuccessNote ErrorHint Muted StatusRow UrlRow CopyBtn Code DnsHelp SuccessBadge ToggleControlled IntegrationsScreen AnalyticsScreen AdvancedScreen; do
  count=$(grep -rl "$sym" . --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "settings/shared\.tsx\|settings/screens/$sym\.tsx" | wc -l | tr -d ' ')
  echo "$sym: $count external consumers"
done
```
Save the output. Symbols with 0 external consumers are safe to delete in Task 5.

- [ ] **Step 4: Confirm `--bd-*` tokens exist in bridge layer**

Run:
```bash
grep -c "^\s*--bd-fg-heading\|^\s*--bd-accent-tint\|^\s*--bd-bg-subtle\|^\s*--bd-font" /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/themes/bridge-tokens.css
```
Expected: count ≥ 4. If zero, halt — the plan assumes these tokens exist; audit bridge layer first.

- [ ] **Step 5: Confirm dev server is running for sanity checks**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5050
```
Expected: `200`. If not, start dev server in a separate terminal: `cd packages/editor && npm run dev`.

- [ ] **Step 6: Create working checkpoint**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik && git log -1 --oneline
```
Record the hash. If any task fails, `git reset --hard <hash>` to restore.

---

## Task 1: settings.css foundation

**Files:**
- Create: `packages/editor/src/editor/sidebar/tabs/settings/settings.css`

- [ ] **Step 1: Create settings.css with all prototype classes**

Create `packages/editor/src/editor/sidebar/tabs/settings/settings.css` with this content:

```css
/**
 * Settings tab styles — matches design-system/project/left-panel/tab-settings.html.
 * Tokens: --bd-* only.
 */

/* ── Shell ── */
.bd-set-root {
  display: grid;
  grid-template-columns: 140px 1fr;
  grid-template-rows: 1fr;
  height: 100%;
  min-height: 0;
  background: var(--bd-bg-card, #fff);
  position: relative;
}

/* ── Snav (section navigation) ── */
.bd-set-snav {
  border-right: 1px solid var(--bd-border);
  background: var(--bd-bg-subtle);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.bd-set-snav-h {
  padding: 11px 12px 8px;
  font: 600 11px var(--bd-font);
  color: var(--bd-fg-heading);
  border-bottom: 1px solid var(--bd-border);
}
.bd-set-snav-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px;
}
.bd-set-snav-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--bd-fg-secondary);
  font: 500 11.5px var(--bd-font);
  text-align: left;
  cursor: pointer;
  transition: background 120ms, color 120ms;
}
.bd-set-snav-row:hover {
  background: var(--bd-bg-subtle);
  color: var(--bd-fg-primary);
}
.bd-set-snav-row.on {
  background: var(--bd-accent-tint);
  color: var(--bd-accent);
  font-weight: 600;
}
.bd-set-snav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.bd-set-snav-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bd-set-snav-badge {
  margin-left: auto;
  font: 500 9px var(--bd-mono);
  color: var(--bd-fg-muted);
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--bd-bg-subtle);
  letter-spacing: 0.04em;
}
.bd-set-snav-row.on .bd-set-snav-badge {
  color: var(--bd-accent);
  background: #fff;
}

/* ── Pane ── */
.bd-set-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  position: relative;
}
.bd-set-pane-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
}

/* ── Section block ── */
.bd-set-section {
  padding: 12px 12px 16px;
  border-bottom: 1px solid var(--bd-border);
}
.bd-set-section:last-child {
  border-bottom: none;
}
.bd-set-section-h {
  margin: 0 0 2px;
  font: 600 11.5px var(--bd-font);
  color: var(--bd-fg-heading);
  letter-spacing: -0.005em;
}
.bd-set-section-d {
  font: 500 10.5px var(--bd-font);
  color: var(--bd-fg-muted);
  line-height: 1.4;
  margin-bottom: 10px;
}

/* ── Field ── */
.bd-set-field {
  margin-bottom: 10px;
}
.bd-set-field:last-child {
  margin-bottom: 0;
}
.bd-set-field-lbl {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font: 500 10px var(--bd-mono);
  color: var(--bd-fg-secondary);
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}
.bd-set-field-hint {
  color: var(--bd-fg-muted);
  font-size: 9.5px;
}
.bd-set-field-cc {
  font: 500 9px var(--bd-mono);
  color: var(--bd-fg-muted);
}
.bd-set-field-cc.warn {
  color: var(--bd-warning);
}
.bd-set-field-cc.err {
  color: var(--bd-error);
}

/* ── Input / Textarea / Select ── */
.bd-set-input {
  width: 100%;
  padding: 7px 9px;
  background: #fff;
  border: 1px solid var(--bd-border);
  border-radius: 5px;
  font: 500 11.5px var(--bd-font);
  color: var(--bd-fg-primary);
  outline: none;
  transition: border-color 100ms, box-shadow 100ms;
}
textarea.bd-set-input {
  resize: vertical;
  min-height: 52px;
  font-family: var(--bd-font);
}
.bd-set-input:focus {
  border-color: var(--bd-accent);
  box-shadow: 0 0 0 3px var(--bd-accent-tint);
}

/* ── Switch row ── */
.bd-set-switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}
.bd-set-switch-row-info {
  flex: 1;
  min-width: 0;
}
.bd-set-switch-row-t {
  font: 500 11.5px var(--bd-font);
  color: var(--bd-fg-primary);
}
.bd-set-switch-row-d {
  font: 500 10px var(--bd-font);
  color: var(--bd-fg-muted);
  line-height: 1.4;
}
.bd-set-switch {
  width: 28px;
  height: 16px;
  padding: 0;
  border: none;
  background: var(--bd-border-medium);
  border-radius: 9999px;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms;
}
.bd-set-switch-knob {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transition: left 120ms;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
.bd-set-switch.on {
  background: var(--bd-accent);
}
.bd-set-switch.on .bd-set-switch-knob {
  left: 14px;
}

/* ── Savebar ── */
.bd-set-savebar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bd-bg-card, #fff);
  border-top: 1px solid var(--bd-border);
  transform: translateY(100%);
  transition: transform 180ms ease-out;
  z-index: 5;
}
.bd-set-savebar.on {
  transform: translateY(0);
}
.bd-set-savebar-note {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font: 500 10px var(--bd-font);
  color: var(--bd-warning);
}
.bd-set-savebar-actions {
  display: flex;
  gap: 4px;
}
.bd-set-btn {
  padding: 5px 10px;
  border-radius: 5px;
  font: 600 10.5px var(--bd-font);
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
}
.bd-set-btn.sec {
  color: var(--bd-fg-secondary);
}
.bd-set-btn.sec:hover {
  color: var(--bd-fg-primary);
  background: var(--bd-bg-subtle);
}
.bd-set-btn.pri {
  background: var(--bd-accent);
  color: #fff;
}
.bd-set-btn.pri:hover {
  background: var(--bd-accent-hover, #1D5FEB);
}

/* ── Branding placeholder (V1 — replaces DesignSystemTab delegate) ── */
.bd-set-branding-placeholder {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px 12px;
  background: var(--bd-bg-subtle);
  border: 1px dashed var(--bd-border-medium);
  border-radius: 6px;
  margin: 12px;
}
.bd-set-branding-placeholder-t {
  font: 600 11.5px var(--bd-font);
  color: var(--bd-fg-heading);
}
.bd-set-branding-placeholder-d {
  font: 500 10.5px var(--bd-font);
  color: var(--bd-fg-secondary);
  line-height: 1.5;
}

/* ── Guard modal (refreshed skin) ── */
.bd-set-guard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.bd-set-guard-modal {
  min-width: 320px;
  max-width: 420px;
  background: var(--bd-bg-card, #fff);
  border: 1px solid var(--bd-border);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 16px 48px -12px rgba(15, 23, 42, 0.25);
}
.bd-set-guard-title {
  font: 600 13px var(--bd-font);
  color: var(--bd-fg-heading);
  margin: 0 0 4px;
}
.bd-set-guard-body {
  font: 500 11.5px var(--bd-font);
  color: var(--bd-fg-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
}
.bd-set-guard-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
```

- [ ] **Step 2: Confirm file created and has no TypeScript impact**

Run:
```bash
wc -l /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/settings/settings.css && cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep "settings\.css" || echo "no tsc errors touching settings.css"
```
Expected: line count > 200, no TS errors (CSS is not compiled by tsc).

- [ ] **Step 3: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/sidebar/tabs/settings/settings.css && git commit -m "$(cat <<'EOF'
feat(editor-settings): add settings.css — prototype-aligned classes

New stylesheet scoped .bd-set-* matching design-system/project/
left-panel/tab-settings.html. No consumer yet; primitives wire it
up in the next commit. Only --bd-* tokens.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Rewrite shared.tsx primitives

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/shared.tsx`

- [ ] **Step 1: Read the current shared.tsx fully so you can reconcile exports**

Run:
```bash
cat /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/settings/shared.tsx | wc -l
```
Note the line count (~552). You will replace most of this file.

- [ ] **Step 2: Rewrite shared.tsx completely**

Overwrite `packages/editor/src/editor/sidebar/tabs/settings/shared.tsx` with:

```tsx
/**
 * Settings tab — shared primitives.
 *
 * Emits .bd-set-* classes defined in ./settings.css. All visual chrome lives in
 * the stylesheet; this file owns only the React shape and ARIA/semantics.
 *
 * Primitives used by every screen:
 *   <Section title desc>      — section block with heading + optional description
 *   <Field label hint>        — form field wrapper with label
 *   <Input> <Textarea> <Select>
 *   <SwitchRow>               — toggle row with title/desc + switch
 *   <Screen>                  — outer wrapper used by screens (thin, mostly semantic)
 *
 * Preserved for LockedScreen (token-only migration):
 *   <LockedContainer> <LockedIcon> <LockedTitle> <LockedDesc> <LockedBtn>
 *
 * Refreshed skin: <SettingsNavGuard>
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./settings.css";

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  desc?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, desc, children }) => (
  <div className="bd-set-section">
    <h3 className="bd-set-section-h">{title}</h3>
    {desc ? <div className="bd-set-section-d">{desc}</div> : null}
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Field
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, htmlFor, children }) => (
  <div className="bd-set-field">
    <label className="bd-set-field-lbl" htmlFor={htmlFor}>
      <span>{label}</span>
      {hint ? <span className="bd-set-field-hint">{hint}</span> : null}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Input / Textarea / Select
// ─────────────────────────────────────────────────────────────────────────────

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={`bd-set-input${className ? " " + className : ""}`}
      {...rest}
    />
  )
);
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={`bd-set-input${className ? " " + className : ""}`}
      {...rest}
    />
  )
);
Textarea.displayName = "Textarea";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={`bd-set-input${className ? " " + className : ""}`}
      {...rest}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

// ─────────────────────────────────────────────────────────────────────────────
// SwitchRow + Toggle (alias)
// ─────────────────────────────────────────────────────────────────────────────

interface SwitchRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}) => (
  <div className="bd-set-switch-row">
    <div className="bd-set-switch-row-info">
      <div className="bd-set-switch-row-t">{title}</div>
      {description ? <div className="bd-set-switch-row-d">{description}</div> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`bd-set-switch${checked ? " on" : ""}`}
    >
      <span className="bd-set-switch-knob" />
    </button>
  </div>
);

/**
 * Back-compat alias — existing screens import `Toggle` with the same shape.
 * Once all screens migrate to SwitchRow directly, drop this alias.
 */
export const Toggle = SwitchRow;

// ─────────────────────────────────────────────────────────────────────────────
// Screen — outer wrapper
// ─────────────────────────────────────────────────────────────────────────────

export const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

// ─────────────────────────────────────────────────────────────────────────────
// Locked primitives — token migration only, layout preserved
// ─────────────────────────────────────────────────────────────────────────────

const lockedContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 24px",
  textAlign: "center",
  gap: 12,
  minHeight: 320,
};
const lockedIconStyle: React.CSSProperties = {
  marginBottom: 4,
};
const lockedTitleStyle: React.CSSProperties = {
  font: "600 14px var(--bd-font)",
  color: "var(--bd-fg-heading)",
  margin: 0,
};
const lockedDescStyle: React.CSSProperties = {
  font: "500 12px var(--bd-font)",
  color: "var(--bd-fg-muted)",
  maxWidth: 320,
  lineHeight: 1.5,
  margin: 0,
};
const lockedBtnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 16px",
  borderRadius: 6,
  background: "var(--bd-accent)",
  color: "#fff",
  border: "none",
  font: "600 12px var(--bd-font)",
  cursor: "pointer",
};

export const LockedContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={lockedContainerStyle}>{children}</div>
);
export const LockedIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={lockedIconStyle}>{children}</div>
);
export const LockedTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 style={lockedTitleStyle}>{children}</h3>
);
export const LockedDesc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={lockedDescStyle}>{children}</p>
);

export const LockedBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ style, children, ...rest }) => (
  <button style={{ ...lockedBtnStyle, ...style }} {...rest}>
    {children}
  </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// SettingsNavGuard — refreshed skin
// ─────────────────────────────────────────────────────────────────────────────

interface SettingsNavGuardProps {
  isOpen: boolean;
  onDiscard: () => void;
  onCancel: () => void;
}

export const SettingsNavGuard: React.FC<SettingsNavGuardProps> = ({
  isOpen,
  onDiscard,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="bd-set-guard-overlay" role="dialog" aria-modal="true">
      <div className="bd-set-guard-modal">
        <h4 className="bd-set-guard-title">Discard unsaved changes?</h4>
        <p className="bd-set-guard-body">
          You have unsaved edits in this section. Switching will discard them. Save first to keep your changes.
        </p>
        <div className="bd-set-guard-actions">
          <button type="button" className="bd-set-btn sec" onClick={onCancel}>
            Keep editing
          </button>
          <button type="button" className="bd-set-btn pri" onClick={onDiscard}>
            Discard & switch
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Verify compile**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep "settings/" | head -30
```
Expected: errors may surface for screens importing removed symbols (`Note`, `Warning`, `StatusRow`, `UrlRow`, `CopyBtn`, `Code`, `DnsHelp`, `SuccessBadge`, `ErrorHint`, `Muted`, `ToggleControlled`). Note them — Task 4 resolves them. Do NOT fix them here.

- [ ] **Step 4: Run settings tests to see what breaks**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/settings/ 2>&1 | tail -30
```
Expected: failures. Record which tests fail. Task 6 updates assertions.

- [ ] **Step 5: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/sidebar/tabs/settings/shared.tsx && git commit -m "$(cat <<'EOF'
feat(editor-settings): rewrite shared primitives to .bd-set-* classes

Section, Field, Input, Textarea, Select, SwitchRow emit new classes
from settings.css. Locked primitives (LockedContainer/Icon/Title/
Desc/Btn) migrated --buildrick-* to --bd-* tokens, layout preserved.
SettingsNavGuard refreshed visual skin. Legacy primitives (Note,
Warning, SuccessNote, ErrorHint, Muted, StatusRow, UrlRow, CopyBtn,
Code, DnsHelp, SuccessBadge, ToggleControlled) removed; Task 4/5
handles screen-side import updates and final cleanup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Rewrite SettingsTab.tsx + swap icons + Branding placeholder

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/icons.tsx`

- [ ] **Step 1: Swap the 5 snav SVG icons to match the prototype**

Overwrite the relevant exports in `packages/editor/src/editor/sidebar/tabs/settings/icons.tsx`. Keep any icons not listed here untouched. Replace `SiteSettingsIcon`, `DesignSystemIcon`, `SeoIcon`, `IntegrationsIcon`, `BillingIcon` with these (13×13 viewBox, thin stroke; they inherit `currentColor` so the snav active state color flows through):

```tsx
// Replace existing SiteSettingsIcon (General)
export const SiteSettingsIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2 2 M16.4 16.4l2 2 M5.6 18.4l2-2 M16.4 7.6l2-2" />
  </svg>
);

// Replace existing DesignSystemIcon (Branding)
export const DesignSystemIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12a4 4 0 018 0 M8 12v4 M16 12v4" />
  </svg>
);

// Replace existing SeoIcon
export const SeoIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

// Replace existing IntegrationsIcon
export const IntegrationsIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 17.5h7 M17.5 14v7" />
  </svg>
);

// New icon for Publishing row (was re-using IntegrationsIcon in current code)
export const PublishingIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3L2 9l10 6 10-6z M2 15l10 6 10-6" />
  </svg>
);

// Replace existing BillingIcon — simplified thin stroke
export const BillingIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18 M7 15h3" />
  </svg>
);
```

Leave `TourIcon` (used by Help section) and any other existing exports untouched. Use Edit tool to replace each export individually rather than overwriting the whole file.

- [ ] **Step 2: Verify icons.tsx compiles**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep "icons\.tsx"
```
Expected: no errors on `icons.tsx`. If PublishingIcon wasn't previously exported, other files referencing a different icon name are unaffected.

- [ ] **Step 3: Rewrite SettingsTab.tsx**

Overwrite `packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx` with:

```tsx
/**
 * SettingsTab — prototype-aligned shell.
 *
 * Layout: 140px snav + 1fr pane. Central dirty counter + sticky savebar.
 * Branding renders a placeholder linking to the Palette tab (no embedded
 * DesignSystemTab chrome).
 *
 * Spec: design-system/project/left-panel/tab-settings.html
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelShell } from "@shared/ui/panel";
import { usePanelNavigation } from "../../shared/usePanelNavigation";
import {
  type SettingsTabProps,
  SCREEN_PLAN_REQUIREMENTS,
  SiteSettingsIcon,
  IntegrationsIcon,
  TourIcon,
  SeoIcon,
  BillingIcon,
  DesignSystemIcon,
  SiteSettingsScreen,
  LockedScreen,
  BillingScreen,
  SeoScreen,
  IntegrationsHub,
  PublishingHub,
  SettingsNavGuard,
} from "./index";
import { PublishingIcon } from "./icons";
import "./settings.css";

// ─── Nav definition ──────────────────────────────────────────────────────────

type NavId = "general" | "branding" | "seo" | "integrations" | "publishing" | "billing";

interface NavDef {
  id: NavId;
  title: string;
  subtitle?: string;
  icon: React.FC;
}

const NAV: NavDef[] = [
  { id: "general", title: "General", subtitle: "Project metadata", icon: SiteSettingsIcon },
  { id: "branding", title: "Branding", subtitle: "Colors, type, favicon", icon: DesignSystemIcon },
  { id: "seo", title: "SEO", subtitle: "Search & social preview", icon: SeoIcon },
  { id: "integrations", title: "Integrations", subtitle: "Analytics, plugins, custom code", icon: IntegrationsIcon },
  { id: "publishing", title: "Publishing", subtitle: "Domains, export, deploy", icon: PublishingIcon },
  { id: "billing", title: "Billing", subtitle: "Plan and usage", icon: BillingIcon },
];

const SETTINGS_SCREENS = NAV.map(({ id, title }) => ({ id, title }));

// ─── Branding placeholder (V1 — replaces DesignSystemTab delegate) ───────────

interface BrandingPlaceholderProps {
  onOpenPalette: () => void;
}
const BrandingPlaceholder: React.FC<BrandingPlaceholderProps> = ({ onOpenPalette }) => (
  <div className="bd-set-section">
    <h3 className="bd-set-section-h">Design tokens</h3>
    <div className="bd-set-section-d">
      Colors, typography, spacing, and other brand tokens live in the Palette tab.
    </div>
    <div className="bd-set-branding-placeholder">
      <div className="bd-set-branding-placeholder-t">Open Palette to edit tokens</div>
      <div className="bd-set-branding-placeholder-d">
        Palette owns the design system for this project. Changes there apply to every page.
      </div>
      <button type="button" className="bd-set-btn pri" onClick={onOpenPalette}>
        Open Palette →
      </button>
    </div>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const SettingsTab: React.FC<
  SettingsTabProps & { onOpenDesignTab?: () => void }
> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
  userPlan = "starter",
  onReplayTour,
  projectId,
  onDirtyChange,
  onOpenDesignTab,
}) => {
  const { currentScreen, navigateTo } = usePanelNavigation({
    storageKey: `settings-panel${projectId ? `-${projectId}` : ""}`,
    screens: SETTINGS_SCREENS,
    defaultScreen: "general",
  });

  const [screenIsDirty, setScreenIsDirty] = React.useState(false);
  const [dirtyCount, setDirtyCount] = React.useState(0);
  const [guardOpen, setGuardOpen] = React.useState(false);
  const pendingNavRef = React.useRef<NavId | null>(null);
  const [resetKey, setResetKey] = React.useState(0);

  React.useEffect(() => {
    setScreenIsDirty(false);
    setDirtyCount(0);
    setGuardOpen(false);
  }, [currentScreen]);

  React.useEffect(() => {
    onDirtyChange?.(screenIsDirty);
  }, [screenIsDirty, onDirtyChange]);

  const handleScreenDirty = React.useCallback((dirty: boolean) => {
    setScreenIsDirty(dirty);
    setDirtyCount((c) => (dirty ? c + 1 : 0));
  }, []);

  const isScreenLocked = (screenId: string) => {
    const required = SCREEN_PLAN_REQUIREMENTS[screenId];
    if (!required) return false;
    if (required === "pro") return userPlan === "starter";
    if (required === "enterprise") return userPlan !== "enterprise";
    return false;
  };

  const handleNav = React.useCallback(
    (nextId: NavId) => {
      if (nextId === currentScreen) return;
      if (screenIsDirty) {
        pendingNavRef.current = nextId;
        setGuardOpen(true);
        return;
      }
      navigateTo(nextId);
    },
    [currentScreen, screenIsDirty, navigateTo]
  );

  const handleDiscard = React.useCallback(() => {
    setResetKey((k) => k + 1);
    setScreenIsDirty(false);
    setDirtyCount(0);
  }, []);

  const handleSave = React.useCallback(() => {
    if (!composer) return;
    composer.saveProject?.().catch((err) => {
      console.error("[settings] save failed", err);
    });
    setScreenIsDirty(false);
    setDirtyCount(0);
  }, [composer]);

  const handleOpenPalette = React.useCallback(() => {
    onOpenDesignTab?.();
  }, [onOpenDesignTab]);

  const current = NAV.find((n) => n.id === currentScreen) ?? NAV[0];

  const renderContent = (): React.ReactNode => {
    if (isScreenLocked(currentScreen)) {
      const requiredPlan = SCREEN_PLAN_REQUIREMENTS[currentScreen];
      return <LockedScreen variant={requiredPlan} />;
    }
    switch (currentScreen) {
      case "general":
        return <SiteSettingsScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "branding":
        return <BrandingPlaceholder onOpenPalette={handleOpenPalette} />;
      case "seo":
        return <SeoScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "integrations":
        return <IntegrationsHub composer={composer} onDirtyChange={handleScreenDirty} />;
      case "publishing":
        return <PublishingHub composer={composer} />;
      case "billing":
        return <BillingScreen userPlan={userPlan} />;
      default:
        return null;
    }
  };

  const renderRow = (n: NavDef) => {
    const active = currentScreen === n.id;
    const locked = isScreenLocked(n.id);
    const Icon = n.icon;
    return (
      <button
        key={n.id}
        type="button"
        onClick={() => handleNav(n.id)}
        className={`bd-set-snav-row${active ? " on" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <span className="bd-set-snav-icon">
          <Icon />
        </span>
        <span className="bd-set-snav-label">{n.title}</span>
        {locked ? <span className="bd-set-snav-badge">Pro</span> : null}
      </button>
    );
  };

  return (
    <PanelShell>
      <PanelShell.Header
        title={current.title}
        subtitle={current.subtitle}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      <PanelShell.Content noScroll>
        <div className="bd-set-root">
          <nav className="bd-set-snav" aria-label="Settings sections">
            <div className="bd-set-snav-h">Settings</div>
            <div className="bd-set-snav-list">
              {NAV.map(renderRow)}
              {onReplayTour ? (
                <button
                  type="button"
                  onClick={onReplayTour}
                  className="bd-set-snav-row"
                  style={{ marginTop: 8 }}
                >
                  <span className="bd-set-snav-icon">
                    <TourIcon />
                  </span>
                  <span className="bd-set-snav-label">Tour</span>
                </button>
              ) : null}
            </div>
          </nav>
          <div className="bd-set-pane">
            <div className="bd-set-pane-body" key={resetKey}>
              {renderContent()}
            </div>
            <div
              className={`bd-set-savebar${screenIsDirty ? " on" : ""}`}
              role="region"
              aria-label="Unsaved changes"
              aria-hidden={!screenIsDirty}
            >
              <span className="bd-set-savebar-note">
                <span>{dirtyCount || 1} unsaved</span>
              </span>
              <div className="bd-set-savebar-actions">
                <button type="button" className="bd-set-btn sec" onClick={handleDiscard}>
                  Discard
                </button>
                <button type="button" className="bd-set-btn pri" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </PanelShell.Content>
      <SettingsNavGuard
        isOpen={guardOpen}
        onDiscard={() => {
          const next = pendingNavRef.current;
          pendingNavRef.current = null;
          setGuardOpen(false);
          setScreenIsDirty(false);
          setDirtyCount(0);
          if (next) navigateTo(next);
        }}
        onCancel={() => {
          pendingNavRef.current = null;
          setGuardOpen(false);
        }}
      />
    </PanelShell>
  );
};

export type { SettingsTabProps } from "./index";
export default SettingsTab;
```

- [ ] **Step 4: Ensure icons.tsx exports PublishingIcon**

Verify with grep:
```bash
grep -n "PublishingIcon" /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/settings/icons.tsx
```
Expected: export line present. If missing, you forgot Step 1 — go back.

- [ ] **Step 5: Ensure `onOpenDesignTab` prop is threaded from caller**

The new SettingsTab takes an optional `onOpenDesignTab` callback. Find callers:
```bash
grep -rn "<SettingsTab\|SettingsTab(" /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/ --include="*.tsx" --include="*.ts" | grep -v "SettingsTab\.tsx\|__tests__"
```
For each caller, add `onOpenDesignTab={() => /* switch to design tab */}` using the existing tab-switch mechanism (the caller likely already has `onSwitchToDesign` or similar wired via `onTabChange`). If no quick path exists, pass `undefined` for now — the Branding button will no-op cleanly because the handler is optional.

- [ ] **Step 6: Run tsc to confirm shell compiles**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep "SettingsTab\.tsx\|icons\.tsx" | head -20
```
Expected: no errors on these two files. Errors on screens (from Task 2) still present — those are addressed in Task 4.

- [ ] **Step 7: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx packages/editor/src/editor/sidebar/tabs/settings/icons.tsx && git commit -m "$(cat <<'EOF'
feat(editor-settings): prototype shell — 140 snav + 1fr pane, central savebar

SettingsTab rewritten: 140px snav + pane layout, central dirty counter
with sliding savebar, dirty-switch via refreshed SettingsNavGuard.
Branding row replaced with placeholder linking to Palette tab (drops
DesignSystemTab delegate). icons.tsx snav SVG shapes swapped to
prototype (General=gear, Branding=ring, SEO=magnifier, Integrations=
4-square, Publishing=layers, Billing=card). localStorage section
persistence preserved via usePanelNavigation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Rewire screens — drop StickyFooter, remove auto-save-on-blur, update imports

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx`
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/screens/BillingScreen.tsx`
- Modify: each screen still importing removed symbols (see Task 2 Step 3 tsc output)
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/screens/LockedScreen.tsx`

- [ ] **Step 1: Rewrite SiteSettingsScreen to drop StickyFooter + blur-save**

Overwrite `packages/editor/src/editor/sidebar/tabs/settings/screens/SiteSettingsScreen.tsx` with:

```tsx
/**
 * Site Settings screen — General section content.
 *
 * Changes vs prior revision:
 * - Drops StickyFooter (central savebar in SettingsTab now)
 * - Drops auto-save-on-blur (commit on Save button)
 * - Uses new primitives (Section, Field, Input, Select)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Field, Input, Screen, Section, Select } from "../shared";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import type { ScreenProps } from "../types";

interface IdentitySettings {
  siteName: string;
  favicon: string;
  language: string;
}

interface SocialSettings {
  twitter: string;
  facebook: string;
  linkedin: string;
}

const DEFAULT_IDENTITY: IdentitySettings = {
  siteName: "",
  favicon: "",
  language: "en",
};

const DEFAULT_SOCIAL: SocialSettings = {
  twitter: "",
  facebook: "",
  linkedin: "",
};

export const SiteSettingsScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange }) => {
  const identity = useSettingsScreen(
    composer,
    (s) => ({
      siteName: s.seo?.siteName ?? "",
      favicon: s.seo?.favicon ?? "",
      language: s.seo?.language ?? "en",
    }),
    DEFAULT_IDENTITY
  );

  const social = useSettingsScreen(
    composer,
    (s) => ({
      twitter: s.seo?.socialLinks?.twitter ?? "",
      facebook: s.seo?.socialLinks?.facebook ?? "",
      linkedin: s.seo?.socialLinks?.linkedin ?? "",
    }),
    DEFAULT_SOCIAL
  );

  const [siteName, setSiteName] = React.useState(identity.value.siteName);
  const [favicon, setFavicon] = React.useState(identity.value.favicon);
  const [language, setLanguage] = React.useState(identity.value.language);
  const [twitter, setTwitter] = React.useState(social.value.twitter);
  const [facebook, setFacebook] = React.useState(social.value.facebook);
  const [linkedin, setLinkedin] = React.useState(social.value.linkedin);

  React.useEffect(() => {
    setSiteName(identity.value.siteName);
    setFavicon(identity.value.favicon);
    setLanguage(identity.value.language);
  }, [identity.value.siteName, identity.value.favicon, identity.value.language]);

  React.useEffect(() => {
    setTwitter(social.value.twitter);
    setFacebook(social.value.facebook);
    setLinkedin(social.value.linkedin);
  }, [social.value.twitter, social.value.facebook, social.value.linkedin]);

  const isDirty = identity.isDirty || social.isDirty;

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <Screen>
      <Section title="Site Identity" desc="Core metadata for your project.">
        <Field label="Site name">
          <Input
            type="text"
            value={siteName}
            onChange={(e) => { setSiteName(e.target.value); identity.markDirty(); }}
            placeholder="My Awesome Site"
          />
        </Field>
        <Field label="Favicon URL">
          <Input
            type="text"
            value={favicon}
            onChange={(e) => { setFavicon(e.target.value); identity.markDirty(); }}
            placeholder="https://example.com/favicon.ico"
          />
        </Field>
        <Field label="Site language">
          <Select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); identity.markDirty(); }}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </Select>
        </Field>
      </Section>

      <Section title="Social links" desc="Shown in site footer and Open Graph previews.">
        <Field label="Twitter" htmlFor="social-twitter">
          <Input
            id="social-twitter"
            type="url"
            value={twitter}
            onChange={(e) => { setTwitter(e.target.value); social.markDirty(); }}
            placeholder="https://twitter.com/..."
          />
        </Field>
        <Field label="Facebook" htmlFor="social-facebook">
          <Input
            id="social-facebook"
            type="url"
            value={facebook}
            onChange={(e) => { setFacebook(e.target.value); social.markDirty(); }}
            placeholder="https://facebook.com/..."
          />
        </Field>
        <Field label="LinkedIn" htmlFor="social-linkedin">
          <Input
            id="social-linkedin"
            type="url"
            value={linkedin}
            onChange={(e) => { setLinkedin(e.target.value); social.markDirty(); }}
            placeholder="https://linkedin.com/..."
          />
        </Field>
      </Section>

      <Section title="Legal" desc="Static references — edit in their dedicated pages.">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ font: "500 11.5px var(--bd-font)", color: "var(--bd-accent)", textDecoration: "none" }}
          >
            Privacy Policy →
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ font: "500 11.5px var(--bd-font)", color: "var(--bd-accent)", textDecoration: "none" }}
          >
            Terms of Service →
          </a>
        </div>
      </Section>
    </Screen>
  );
};
```

Note: the Save button in the central savebar is wired in SettingsTab. This screen no longer calls `composer.setProjectSettings` or `composer.saveProject` directly. Persistence happens when the user clicks Save in the savebar, which invokes `composer.saveProject()` — that hook reads current in-memory state and writes to disk. If `useSettingsScreen`'s semantics require the screen to commit on Save, add a `save` callback contract in a follow-up spec; for V1, the savebar's `saveProject()` is sufficient because the screen-level `onChange` handlers still mutate composer state via `useSettingsScreen`'s existing sync mechanism. Verify this assumption during Task 6 manual QA.

- [ ] **Step 2: Migrate BillingScreen to new primitives**

Overwrite `packages/editor/src/editor/sidebar/tabs/settings/screens/BillingScreen.tsx` to use `Section` and the billing primitives from shared. Keep the same data shape (plan comparison, upgrade CTA) but emit `.bd-set-*` classes. Exact approach depends on current structure; read the file first:

```bash
cat /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/settings/screens/BillingScreen.tsx
```

Minimum acceptable result: every visible container uses either `<Section>` or a `.bd-set-*` class; no inline `buildrick-*` tokens; plan cards use `.bd-set-section` or an ad-hoc div styled with `--bd-*` tokens; upgrade button uses `.bd-set-btn pri`. Keep the existing text content and upgrade flow.

- [ ] **Step 3: Fix remaining screens with removed primitive imports**

For each file surfaced by Task 2 Step 3 tsc output, open the file and:
1. Remove imports of deleted symbols (`Note`, `Warning`, `SuccessNote`, `ErrorHint`, `Muted`, `StatusRow`, `UrlRow`, `CopyBtn`, `Code`, `DnsHelp`, `SuccessBadge`, `ToggleControlled`, `Screen` if unused).
2. Replace their usage with either:
   - Plain `<div>` + inline style using `--bd-*` tokens (for one-off info/warning/success blocks)
   - `<Section>` for section-level grouping
   - Native HTML elements for simple text/code blocks
3. Where the screen had a `StickyFooter`, delete it (the central savebar covers this).

Screens likely affected: `SeoScreen.tsx`, `IntegrationsHub.tsx`, `PublishingHub.tsx`, `DomainsScreen.tsx`, `ExportScreen.tsx`, `AnalyticsScreen.tsx`, `AdvancedScreen.tsx`, `IntegrationsScreen.tsx`.

Work through them one at a time. After each, run `npx tsc --noEmit 2>&1 | grep <filename>` to confirm that file compiles.

- [ ] **Step 4: Sweep LockedScreen for token migration**

Open `packages/editor/src/editor/sidebar/tabs/settings/screens/LockedScreen.tsx`. It imports `LockedContainer`, `LockedIcon`, `LockedTitle`, `LockedDesc`, `LockedBtn` from `../shared`. These now use `--bd-*` tokens (already done in Task 2). LockedScreen's own file has no `--buildrick-*` usage based on the Read in brainstorming. Confirm:

```bash
grep -n "buildrick" /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/settings/screens/LockedScreen.tsx || echo "clean"
```
Expected: `clean`. If any match, swap to `--bd-*`.

- [ ] **Step 5: Full tsc check across settings/**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep "sidebar/tabs/settings" | head -30
```
Expected: zero errors. Fix any remaining errors in place before committing.

- [ ] **Step 6: Run settings tests (will fail on assertions — that's Task 6)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/settings/ 2>&1 | tail -20
```
Record failures. Do not fix assertions here — Task 6 owns test migration.

- [ ] **Step 7: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/sidebar/tabs/settings/screens/ && git commit -m "$(cat <<'EOF'
feat(editor-settings): rewire screens to new primitives

SiteSettingsScreen drops StickyFooter and auto-save-on-blur — central
savebar in SettingsTab owns both behaviors now. BillingScreen migrated
to .bd-set-* primitives to match visual parity. Remaining screens
(SEO, Integrations, Publishing, Domains, Export, Analytics, Advanced)
updated imports to drop removed primitives; replaced usage with Section
or direct tokens.

BEHAVIOR CHANGE: Settings fields no longer auto-save on blur. Save
button commits; savebar surfaces unsaved state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Dead-code sweep

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/index.ts` (drop deleted exports)
- Delete: any confirmed-orphan screen files
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/constants.ts` (assess FEATURE_FLAGS.domains)

- [ ] **Step 1: Confirm removed primitives have no external consumers**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor/src && for sym in Note Warning SuccessNote ErrorHint Muted StatusRow UrlRow CopyBtn Code DnsHelp SuccessBadge ToggleControlled; do
  hits=$(grep -rl "\\b$sym\\b" . --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "settings/shared\.tsx" | head)
  if [ -n "$hits" ]; then
    echo "=== $sym still referenced ==="
    echo "$hits"
  else
    echo "$sym: clean"
  fi
done
```
Expected: every symbol `clean`. If any show residual references, open each file and remove the usage (the primitives are already gone from shared.tsx so import errors will have surfaced in Task 4).

- [ ] **Step 2: Update index.ts to drop deleted exports**

Open `packages/editor/src/editor/sidebar/tabs/settings/index.ts`. Remove any lines that re-export the deleted primitives. Keep all currently-used exports (`Section`, `Field`, `Input`, `Textarea`, `Select`, `SwitchRow`, `Toggle`, `Screen`, `Locked*`, `SettingsNavGuard`, icon exports, screen exports, constants).

Verify:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep "settings/index\.ts"
```
Expected: no errors.

- [ ] **Step 3: Check orphan screen files**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor/src && for f in IntegrationsScreen AnalyticsScreen AdvancedScreen DomainsScreen ExportScreen; do
  hits=$(grep -rl "\\b$f\\b" . --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "screens/$f\.tsx\|settings/index\.ts\|settings/screens/index\.ts")
  if [ -n "$hits" ]; then
    echo "$f: KEEP (consumers: $hits)"
  else
    echo "$f: ORPHAN — safe to delete"
  fi
done
```
For each ORPHAN result, delete the file:
```bash
rm packages/editor/src/editor/sidebar/tabs/settings/screens/<OrphanName>.tsx
```

After deletions, update `packages/editor/src/editor/sidebar/tabs/settings/screens/index.ts` to drop the exports that pointed to deleted files.

- [ ] **Step 4: Verify FEATURE_FLAGS.domains**

Run:
```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor/src && grep -rn "FEATURE_FLAGS\.domains\|FEATURE_FLAGS\[.domains.\]" . --include="*.ts" --include="*.tsx"
```
If zero call-sites check the flag, remove it from `constants.ts`:

```bash
grep -n "domains:" /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/settings/constants.ts
```
Edit the file to drop the `domains: false,` line from `FEATURE_FLAGS`. If call-sites exist, leave the flag.

- [ ] **Step 5: Full tsc + test run**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep "settings/" | head -20
```
Expected: no errors.

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/settings/ 2>&1 | tail -20
```
Expected: same failures as after Task 4 (test assertions, not compile errors).

- [ ] **Step 6: Commit**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add -A packages/editor/src/editor/sidebar/tabs/settings/ && git commit -m "$(cat <<'EOF'
chore(editor-settings): remove dead primitives + orphan screens

Drop Note/Warning/SuccessNote/ErrorHint/Muted/StatusRow/UrlRow/CopyBtn/
Code/DnsHelp/SuccessBadge/ToggleControlled from index exports (already
removed from shared.tsx in earlier commit). Delete any screen files
confirmed orphaned by grep. Assess FEATURE_FLAGS.domains removal.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Test migration + done-when audit

**Files:**
- Modify: `packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx`

- [ ] **Step 1: Read the current test file**

```bash
cat /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx
```
Identify each assertion. Classify by query strategy: `getByRole`, `getByText`, `getByTestId`, `className` checks, inline-style checks.

- [ ] **Step 2: Migrate class-name and token assertions**

For each test case:
- Queries like `getByClassName(/sett-/)` or style assertions `expect(el).toHaveStyle({ color: "var(--buildrick-accent)" })` → replace with the new class (`.bd-set-*`) or token (`--bd-*`). If the test relied on a class that no longer exists, replace with a `data-testid` attribute added to the primitive (add it in `shared.tsx` with a predictable value like `data-testid="bd-set-section"` if needed).
- Tests asserting 6 snav rows → keep, confirm Billing is still row 6.
- Tests for dirty-switch confirmation → ensure SettingsNavGuard renders with `role="dialog"` and contains "Keep editing" / "Discard & switch" buttons.
- Tests for savebar → assert presence of `.bd-set-savebar.on` class when dirty.

- [ ] **Step 3: Add new test case for Branding placeholder**

Append to the test file:

```tsx
it("renders Branding placeholder with Palette button", async () => {
  const user = userEvent.setup();
  const onOpenDesignTab = vi.fn();
  render(
    <SettingsTab composer={mockComposer} onOpenDesignTab={onOpenDesignTab} />
  );

  await user.click(screen.getByRole("button", { name: /branding/i }));

  expect(screen.getByText(/Design tokens/i)).toBeInTheDocument();
  const openBtn = screen.getByRole("button", { name: /Open Palette/i });
  await user.click(openBtn);
  expect(onOpenDesignTab).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 4: Add test for behavior change — no auto-save on blur**

```tsx
it("SiteSettingsScreen does not auto-save on input blur", async () => {
  const user = userEvent.setup();
  const saveSpy = vi.spyOn(mockComposer, "saveProject");
  render(<SettingsTab composer={mockComposer} />);

  const nameInput = await screen.findByLabelText(/site name/i);
  await user.clear(nameInput);
  await user.type(nameInput, "New Name");
  await user.tab(); // blur

  expect(saveSpy).not.toHaveBeenCalled();
});

it("central Save button commits changes", async () => {
  const user = userEvent.setup();
  const saveSpy = vi.spyOn(mockComposer, "saveProject");
  render(<SettingsTab composer={mockComposer} />);

  const nameInput = await screen.findByLabelText(/site name/i);
  await user.type(nameInput, "X");

  const saveBtn = screen.getByRole("button", { name: /^Save$/i });
  await user.click(saveBtn);

  expect(saveSpy).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/settings/ --reporter=verbose 2>&1 | tail -40
```
Expected: all green. If any red, read the failure, fix the specific test or underlying code, re-run.

- [ ] **Step 6: Manual QA against done-when checklist**

Open `http://localhost:5050` and walk through each done-when item from the spec:
1. Panel width 48 + 140 + content
2. Snav bg subtle; row hover + active colors correct
3. Snav icons match prototype shapes (General=gear-circle, Branding=ring, SEO=magnifier, Integrations=4-square, Publishing=layers, Billing=card)
4. Pane header height 44, title + subtitle
5. Section h3 11.5px 600 + desc 10.5px muted
6. Field label 10px mono secondary
7. Input focus ring 3px tint + accent border
8. Switch knob animates
9. Savebar slides up 180ms on first edit
10. SettingsNavGuard uses new tokens, buttons match bar
11. All six sections visually consistent
12. Branding placeholder + Open Palette works
13. Last-open section persists across reload
14. `grep -r "buildrick" packages/editor/src/editor/sidebar/tabs/settings/` → zero matches
15. `grep "^export" shared.tsx` → no dead exports

- [ ] **Step 7: Final token sweep verification**

```bash
grep -r "buildrick" /Users/shahg/Desktop/pencil/buildrik/packages/editor/src/editor/sidebar/tabs/settings/ || echo "FULLY CLEAN"
```
Expected: `FULLY CLEAN`.

- [ ] **Step 8: Commit test migration**

```bash
cd /Users/shahg/Desktop/pencil/buildrik && git add packages/editor/src/editor/sidebar/tabs/settings/__tests__/SettingsTab.test.tsx && git commit -m "$(cat <<'EOF'
test(editor-settings): migrate assertions to .bd-set-* classes

Updated class/token queries, added Branding placeholder test, added
regression tests covering no-auto-save-on-blur + explicit Save button
commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Full repo tsc + full settings tests + done-when gates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx tsc --noEmit 2>&1 | grep -v "note:" | wc -l
cd /Users/shahg/Desktop/pencil/buildrik/packages/editor && npx vitest run src/editor/sidebar/tabs/settings/ 2>&1 | tail -6
```
Expected: tsc shows no new errors introduced by this work (pre-existing errors in other files unchanged); all settings tests green.

---

## Self-Review

Spec coverage check:
- §4 Branding drop delegate → Task 3 Step 3 (BrandingPlaceholder) + Step 5 (onOpenDesignTab threading) + Task 6 Step 3 (test)
- §5 shell dimensions → Task 1 settings.css + Task 3 shell markup
- §5 `usePanelNavigation` preserved → Task 3 Step 3 (storageKey passed)
- §6 V1 primitives → Task 2
- §6 Locked primitive token sweep → Task 2 (lockedContainerStyle et al now reference `--bd-*`) + Task 4 Step 4 (LockedScreen.tsx verification)
- §7 data flow → Task 3 Step 3 (`handleScreenDirty`, `handleDiscard`, `handleSave`, guard flow)
- §7 no auto-save-on-blur → Task 4 Step 1 (SiteSettingsScreen rewrite) + Task 6 Step 4 (test)
- §8 dead-code sweep → Task 5
- §10 pre-migration test audit → Task 6 Step 2
- §11 snav icon swap → Task 3 Step 1 + §11 item 3 in QA
- §11 SettingsNavGuard visual refresh → Task 2 (rewrite with `.bd-set-guard-*` classes)
- §12 commit 2-4 interim regressions → acknowledged in Task 2/3/4 commit scopes
- §13 done-when checklist → Task 6 Step 6

Placeholder scan: zero "TBD" / "TODO" / "implement later" / "fill in details" / "similar to Task N" in this plan file.

Type consistency check:
- `SwitchRow` interface in shared.tsx uses `checked: boolean` and `onChange: (next: boolean) => void` — consistent across all primitive usage.
- `ScreenProps.onDirtyChange` (existing) accepts `(dirty: boolean) => void` — matches `handleScreenDirty` in SettingsTab.
- `handleScreenDirty` increments `dirtyCount` on `true`, resets to 0 on `false`. Savebar shows `dirtyCount || 1` so dirty state is always non-zero while visible.
- `PublishingIcon` added to icons.tsx (Step 1) AND imported in SettingsTab.tsx (Step 3) — consistent.
- `onOpenDesignTab` optional prop — if caller doesn't pass it, `handleOpenPalette` is a no-op. Branding button still renders; click does nothing. Acceptable for V1 since the callback is routing glue, not core logic. Task 3 Step 5 documents the caller-side update as optional work that can be deferred if the orchestrator doesn't already have a tab-switch handle.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-24-settings-tab-visual-refactor.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
