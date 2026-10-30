/**
 * ListItemNote — the Content tab of an element inside a Collection list
 * (2L9 B5-D99 197:28410, Team Card): what an edit here reaches, and the
 * element's link, which lives on Behavior —
 *
 *   Inside list of Team
 *   Edits to this Card apply to every Team record.
 *   Card
 *   This card has no link.          (or: Links to {href})
 *   Edit link in Behavior ›
 *
 * Real state only: the list is `useCmsBinding`'s `listCollection` (the
 * element sits in a Collection list of that collection, so every copy is
 * this one); the link block only where Behavior › Link exists for the
 * element (`hasLinkSection`), read from the element's own `href`.
 *
 * @license BSD-3-Clause
 */
import type * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { useCmsBinding } from "./useCmsBinding";
import { GROUP_TITLE } from "@/editor/inspector/shared/controls/controlClasses";

const NOTE = "tw:m-0 tw:py-1 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

export function ListItemNote({
  composer,
  elementId,
  hasLinkSection,
}: {
  composer: Composer | null | undefined;
  elementId: string;
  hasLinkSection: boolean;
}): React.ReactElement | null {
  const { listCollection } = useCmsBinding(composer, elementId);
  const el = composer?.elements.getElement(elementId);
  if (!composer || !el || !listCollection) return null;
  const name = getLayerName(el) ?? elementTypeLabel(el.getType());
  const href = el.getAttribute?.("href") || "";
  return (
    <div className="tw:flex tw:flex-col tw:px-3 tw:pb-2" data-testid="inspector-list-item-note">
      <div className={`${GROUP_TITLE} tw:mt-4!`}>Inside list of {listCollection.name}</div>
      <p className={NOTE}>
        Edits to this {name} apply to every {listCollection.name} record.
      </p>
      {hasLinkSection ? (
        <>
          <div className={`${GROUP_TITLE} tw:mt-4!`}>{name}</div>
          <p className="tw:m-0 tw:py-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="inspector-list-item-link">
            {href ? `Links to ${href}.` : `This ${name.toLowerCase()} has no link.`}
          </p>
          <Button
            type="button"
            variant="link"
            size="xs"
            className="tw:h-8 tw:self-center tw:text-[13px] tw:font-normal"
            onClick={() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: "link" })}
            data-testid="inspector-list-item-edit-link"
          >
            Edit link in Behavior ›
          </Button>
        </>
      ) : null}
    </div>
  );
}
