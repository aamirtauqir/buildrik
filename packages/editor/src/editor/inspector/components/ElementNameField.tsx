/**
 * ElementNameField — the inspector header's element name (G2-139): the
 * layer name when the element has one, else its type. Double-click (or
 * Enter / F2 on it) opens the rename card (2L9 S28, `RenameCard`) — the one
 * rename path; the card writes through renameElement, the writer Layers
 * uses, so Layers, the canvas tag and the canvas bar follow.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { openSubview } from "../tabs/subviewStore";

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

  React.useEffect(() => {
    setName(read());
    if (!composer) return;
    const onRenamed = (p: { id: string; name: string | null }) => {
      if (p.id === elementId) setName(p.name);
    };
    composer.on(EVENTS.ELEMENT_RENAMED, onRenamed);
    return () => {
      composer.off(EVENTS.ELEMENT_RENAMED, onRenamed);
    };
  }, [composer, elementId, read]);

  const rename = () => openSubview({ kind: "rename", elementId });

  return (
    <div
      className="bdi-n tw:cursor-text"
      data-testid="inspector-element-name"
      title="Double-click to rename"
      tabIndex={0}
      onDoubleClick={rename}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "F2") {
          e.preventDefault();
          rename();
        }
      }}
    >
      {name ?? typeLabel}
    </div>
  );
}
