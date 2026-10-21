/**
 * DataAttributeEditor — the element's custom data-* / aria-* attributes:
 * each listed with an editable value and a remove control, then a row to add
 * one. `data-buildrick-*` is the editor's own namespace (element id,
 * interactions, runtimes) and is neither listed nor writable here.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { X } from "lucide-react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS, Button, IconButton, TextInput } from "@/editor/chrome-ui";
import { writeElement } from "@/engine/commands/commandOperations";
import { useElementVersion } from "../typeBlock/bodies/bodyRows";

interface DataAttributeEditorProps {
  elementId: string;
  composer?: Composer | null;
}

const RESERVED_PREFIX = "data-buildrick";
const VALID_NAME = /^(data|aria)-[a-z0-9][a-z0-9._-]*$/;

/** The element's user-owned attributes: data-* and aria-*, minus the
 *  editor's reserved `data-buildrick-*` namespace. */
export function customAttributes(el: Pick<Element, "getAttributes"> | null | undefined): [string, string][] {
  return Object.entries(el?.getAttributes?.() ?? {}).filter(
    ([name]) => (name.startsWith("data-") || name.startsWith("aria-")) && !name.startsWith(RESERVED_PREFIX),
  );
}

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
  useElementVersion(composer);

  const element = composer?.elements.getElement(elementId);
  const attributes = customAttributes(element);

  const write = (label: string, fn: (el: Element) => void): boolean =>
    composer ? writeElement(composer, composer.elements.getElement(elementId), label, fn) : false;

  const addAttribute = () => {
    if (!newKey.trim()) return;
    const resolved = resolveAttributeName(newKey);
    if ("error" in resolved) {
      setError(resolved.error);
      return;
    }
    /* P-1: the lock gate — refused (and said) on a locked element. */
    if (!write("data-attribute-add", (el) => el.setAttribute?.(resolved.name, newValue))) return;
    setNewKey("");
    setNewValue("");
    setError(null);
  };

  const commitValue = (name: string, previous: string, next: string) => {
    if (next !== previous) write("data-attribute-edit", (el) => el.setAttribute?.(name, next));
  };

  return (
    <div>
      {attributes.length > 0 && (
        <ul className="tw:flex tw:flex-col tw:gap-1 tw:mb-2" aria-label="Custom attributes" data-testid="custom-attribute-list">
          {attributes.map(([name, value]) => (
            <li key={name} className="tw:flex tw:items-center tw:gap-2">
              <span
                className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-xs tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-mono)]"
                title={name}
              >
                {name}
              </span>
              {/* Keyed by the stored value: an undo or another write resets the draft. */}
              <TextInput
                key={value}
                sizing="sm"
                type="text"
                defaultValue={value}
                aria-label={`${name} value`}
                className="tw:flex-1 tw:min-w-0"
                onBlur={(e) => commitValue(name, value, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitValue(name, value, e.currentTarget.value);
                }}
              />
              <IconButton
                label={`Remove ${name}`}
                size="sm"
                className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]"
                onClick={() => write("data-attribute-remove", (el) => el.removeAttribute?.(name))}
              >
                <X size={14} aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
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
