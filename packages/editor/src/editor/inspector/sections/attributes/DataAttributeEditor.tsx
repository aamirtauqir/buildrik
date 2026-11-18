/**
 * DataAttributeEditor — the row that adds a custom data-* / aria-* attribute;
 * CustomAttributesList lists the ones the element has. `data-buildrick-*` is
 * the editor's own namespace (element id, interactions, runtimes) and is
 * neither listed nor writable here.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS, Button, TextInput } from "@/editor/chrome-ui";
import { writeElement } from "@/engine/commands/commandOperations";
import { CommitRow, NoteRow } from "../behaviourRows";
import { useElementVersion } from "../typeBlock/bodies/bodyRows";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";

interface DataAttributeEditorProps {
  elementId: string;
  composer?: Composer | null;
}

const RESERVED_PREFIX = "data-buildrick";
const VALID_NAME = /^(data|aria)-[a-z0-9][a-z0-9._-]*$/;

/** The attribute a typed key writes (a bare key gets `data-`), or why not. */
export function resolveAttributeName(raw: string): { name: string } | { error: string } {
  const key = raw.trim().toLowerCase();
  if (/^on/.test(key)) return { error: "Event handlers (on…) can't be added as attributes." };
  const name = key.startsWith("data-") || key.startsWith("aria-") ? key : `data-${key}`;
  if (name.startsWith(RESERVED_PREFIX)) return { error: "data-buildrick-* is reserved by the editor." };
  if (!VALID_NAME.test(name)) return { error: "Use letters, digits, '-', '_' or '.' after the prefix." };
  return { name };
}

export const DataAttributeEditor: React.FC<DataAttributeEditorProps> = ({ elementId, composer }) => {
  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const addAttribute = () => {
    if (!newKey.trim()) return;
    const resolved = resolveAttributeName(newKey);
    if ("error" in resolved) {
      setError(resolved.error);
      return;
    }
    if (!composer) return;
    /* P-1: the lock gate — refused (and said) on a locked element. */
    if (!writeElement(composer, composer.elements.getElement(elementId), "data-attribute-add", (el) => el.setAttribute?.(resolved.name, newValue))) return;
    setNewKey("");
    setNewValue("");
    setError(null);
  };

  return (
    <div>
      <div className="tw:flex tw:gap-2 tw:mb-2">
        <TextInput
          sizing="sm"
          type="text"
          value={newKey}
          onChange={(e) => {
            setNewKey(e.target.value);
            setError(null);
          }}
          placeholder="data-*"
          aria-label="Attribute name"
          aria-invalid={error ? true : undefined}
          className="tw:flex-1 tw:min-w-0"
        />
        <TextInput
          sizing="sm"
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="value"
          aria-label="Attribute value"
          className="tw:flex-1 tw:min-w-0"
        />
        {/* The row's only action was a bare "+" — announced as "plus" with no
            hint of what it adds, on a panel that also adds classes and ids. */}
        <Button aria-label="Add attribute" size="sm" onClick={addAttribute}>
          +
        </Button>
      </div>
      {error ? (
        <p role="alert" className={BK_HELPER_ERROR_CLASS}>
          {error}
        </p>
      ) : (
        <p className={`${BK_HELPER_CLASS} tw:text-[var(--bk-ink-soft)]`}>Add custom data-* or aria-* attributes</p>
      )}
    </div>
  );
};

/** The aria-* / data-* attributes the element really carries (editor
 *  markers excluded). */
export function customAttributesOf(attrs: Readonly<Record<string, string>>): [string, string][] {
  return Object.entries(attrs).filter(([k]) => (k.startsWith("aria-") || k.startsWith("data-")) && !k.startsWith(RESERVED_PREFIX) && !k.startsWith("data-bk-"));
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
