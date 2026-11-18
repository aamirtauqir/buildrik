/**
 * RenameCard — 2L9 258:35802 (S28): renaming the element is the tab's whole
 * body while it is open, the one rename path in the Inspector (the header's
 * name opens it):
 *
 *   Element name
 *   Name   [ Opening headline ]
 *   Editor label only. DOM ID "hero-title" and tag H1 are unchanged. Enter
 *   commits; Escape restores "Hero heading".
 *   [ Rename to Opening headline ]
 *   [ Cancel ]
 *
 * The name is the editor's layer label (`renameElement`, the writer Layers
 * uses); the note names the element's real DOM id and tag, which a rename
 * never touches, and leaves the id out when the element has none.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { Button, TextField } from "@/editor/chrome-ui";
import { getLayerName, renameElement } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";
import { rowTestId } from "../shared/controls";

export interface RenameCardProps {
  composer: Composer | null | undefined;
  elementId: string;
  onClose: () => void;
}

const NOTE = "tw:m-0 tw:py-1.5 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export function RenameCard({ composer, elementId, onClose }: RenameCardProps) {
  const el = composer?.elements.getElement(elementId);
  const typeLabel = el ? elementTypeLabel(el.getType()) : "Element";
  const current = (el ? getLayerName(el) : undefined) ?? typeLabel;
  const [draft, setDraft] = React.useState(current);
  const domId = el?.getAttribute("id");
  const tag = el?.getTagName().toUpperCase();
  const next = draft.trim() || typeLabel;
  const changed = next !== current;

  const commit = () => {
    if (changed) renameElement(composer, elementId, draft);
    onClose();
  };

  const kept = [domId ? `DOM ID "${domId}"` : null, tag ? `tag ${tag}` : null].filter(Boolean).join(" and ");

  return (
    <div className="tw:flex tw:flex-col tw:px-3 tw:pb-3" role="group" aria-label="Element name" data-testid="inspector-rename-card">
      <div className={`${GROUP_TITLE} tw:mt-4!`}>Element name</div>
      <div className="bdi-row-ctrl" data-testid={rowTestId("Name")}>
        <label className="bdi-lb" htmlFor="inspector-rename-input">
          Name
        </label>
        <div className="bdi-row-content">
          <TextField
            id="inspector-rename-input"
            className="bdi-text"
            autoFocus
            value={draft}
            placeholder={typeLabel}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
          />
        </div>
      </div>
      <p className={NOTE} data-testid="inspector-rename-note">
        Editor label only.{kept ? ` ${kept.charAt(0).toUpperCase()}${kept.slice(1)} ${domId && tag ? "are" : "is"} unchanged.` : ""} Enter
        commits; Escape restores “{current}”.
      </p>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:pt-1">
        <Button color="light" size="xs" className={WIDE_BUTTON} disabled={!changed} onClick={commit} data-testid="inspector-rename-commit">
          Rename to {next}
        </Button>
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={onClose} data-testid="inspector-rename-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}
