/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * DataAttributeEditor - Custom data-* attribute editor
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button, TextInput } from "@/editor/chrome-ui";
import { writeElement } from "@/engine/commands/commandOperations";
import { CommitRow, NoteRow } from "../behaviourRows";
import { useElementVersion } from "../typeBlock/bodies/bodyRows";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
// ============================================================================
// TYPES
// ============================================================================

interface DataAttributeEditorProps {
  elementId: string;
  composer?: Composer | null;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  input: {
    flex: 1,
    padding: "8px 10px",
    background: "var(--bk-bg-subtle)",
    border: "1px solid var(--bk-border-medium)",
    borderRadius: 6,
    color: "var(--bk-ink)",
    fontSize: 12,
    outline: "none",
  } as React.CSSProperties,
  addButton: {
    padding: "8px 16px",
    background: "var(--bk-accent)",
    border: "none",
    borderRadius: 6,
    color: "var(--bk-accent-on)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  } as React.CSSProperties,
  hint: {
    fontSize: 12,
    color: "var(--bk-ink-soft)",
  } as React.CSSProperties,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const DataAttributeEditor: React.FC<DataAttributeEditorProps> = ({
  elementId,
  composer,
}) => {
  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");

  const addAttribute = () => {
    if (!newKey.trim()) return;

    const key =
      newKey.startsWith("data-") || newKey.startsWith("aria-") ? newKey : `data-${newKey}`;

    if (composer) {
      /* P-1: the lock gate — refused (and said) on a locked element. */
      if (!writeElement(composer, composer.elements.getElement(elementId), "data-attribute-add", (el) => el.setAttribute?.(key, newValue))) return;
      setNewKey("");
      setNewValue("");
    }
  };

  return (
    <div>
      <div className="tw:flex tw:gap-2 tw:mb-2">
        <TextInput
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="data-*"
          style={styles.input}
        />
        <TextInput
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="value"
          style={styles.input}
        />
        {/* The row's only action was a bare "+" — announced as "plus" with no
            hint of what it adds, on a panel that also adds classes and ids. */}
        <Button aria-label="Add attribute" onClick={addAttribute} style={styles.addButton}>
          +
        </Button>
      </div>
      <div style={styles.hint}>Add custom data-* or aria-* attributes</div>
    </div>
  );
};

/** The aria-* / data-* attributes the element really carries (editor
 *  markers excluded). */
export function customAttributesOf(attrs: Readonly<Record<string, string>>): [string, string][] {
  return Object.entries(attrs).filter(([k]) => (k.startsWith("aria-") || k.startsWith("data-")) && !k.startsWith("data-buildrick") && !k.startsWith("data-bk-"));
}

/**
 * 2L9 A11 `247:26594` "Custom attributes · {n} set": each aria-* / data-*
 * attribute the element has, its value editable (one step each); an
 * attribute authored empty says so and can be removed; the element's
 * internal id is shown read-only — it is not an attribute anyone may edit.
 */
export function CustomAttributesList({ elementId, composer }: DataAttributeEditorProps) {
  useElementVersion(composer);
  const el = composer?.elements.getElement(elementId);
  if (!composer || !el) return null;
  const list = customAttributesOf(el.getAttributes?.() ?? {});
  const write = (label: string, fn: (e: NonNullable<typeof el>) => void) => writeElement(composer, el, label, fn);
  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:pb-2" data-testid="inspector-custom-attributes">
      <div className="tw:flex tw:items-center tw:justify-between tw:pt-1">
        <span className="tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Custom attributes</span>
        <span className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">{list.length} set</span>
      </div>
      {list.map(([key, value]) => (
        <React.Fragment key={key}>
          <CommitRow label={key} value={value} onCommit={(v) => write("attribute-change", (e) => e.setAttribute(key, v))} testId={`custom-attr-${key}`} />
          {value === "" ? (
            <>
              <NoteRow>Empty is authored empty. Remove deletes the attribute.</NoteRow>
              <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => write("attribute-remove", (e) => e.removeAttribute(key))} data-testid={`custom-attr-remove-${key}`}>
                Remove {key}
              </Button>
            </>
          ) : null}
        </React.Fragment>
      ))}
      <div className="bdi-row-ctrl">
        <span className="bdi-lb">Internal ID</span>
        <span className="bdi-row-content">
          <span className="tw:flex tw:h-7 tw:min-w-0 tw:flex-1 tw:items-center tw:truncate tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-muted)]" data-testid="custom-attr-internal-id">
            {el.getId()}
          </span>
        </span>
      </div>
      <NoteRow>Internal identity is protected.</NoteRow>
    </div>
  );
}

export default DataAttributeEditor;
