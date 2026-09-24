/**
 * ElementNameField — the inspector header's element name (G2-139): the
 * layer name when the element has one, else its type; double-click (or
 * Enter on it) renames in place. Writes go through renameElement, the same
 * writer Layers uses, so Layers, the canvas tag and the canvas bar follow.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { TextInput } from "@/editor/chrome-ui";
import { getLayerName, renameElement } from "@/editor/panels/layers/hooks/layersPersistence";

export interface ElementNameFieldProps {
  composer: Composer | null | undefined;
  elementId: string;
  /** Shown when the element has no layer name ("Section"). */
  typeLabel: string;
}

export function ElementNameField({ composer, elementId, typeLabel }: ElementNameFieldProps) {
  const read = React.useCallback(
    () => getLayerName(composer?.elements.getElement(elementId) ?? null) ?? null,
    [composer, elementId],
  );
  const [name, setName] = React.useState<string | null>(read);
  const [editing, setEditing] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(read());
    setEditing(null);
    if (!composer) return;
    const onRenamed = (p: { id: string; name: string | null }) => {
      if (p.id === elementId) setName(p.name);
    };
    composer.on(EVENTS.ELEMENT_RENAMED, onRenamed);
    return () => {
      composer.off(EVENTS.ELEMENT_RENAMED, onRenamed);
    };
  }, [composer, elementId, read]);

  const commit = () => {
    if (editing === null) return;
    renameElement(composer, elementId, editing);
    setName(editing.trim() || null);
    setEditing(null);
  };

  if (editing !== null) {
    return (
      <TextInput
        aria-label="Element name"
        sizing="sm"
        autoFocus
        value={editing}
        placeholder={typeLabel}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") setEditing(null);
        }}
      />
    );
  }

  return (
    <div
      className="bdi-n tw:cursor-text"
      data-testid="inspector-element-name"
      title="Double-click to rename"
      tabIndex={0}
      onDoubleClick={() => setEditing(name ?? "")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "F2") {
          e.preventDefault();
          setEditing(name ?? "");
        }
      }}
    >
      {name ?? typeLabel}
    </div>
  );
}
