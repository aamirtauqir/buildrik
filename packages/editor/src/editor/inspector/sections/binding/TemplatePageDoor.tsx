/**
 * TemplatePageDoor — "‹ CMS · Dynamic pages" at the head of the Content tab
 * while the page is a collection's template page (2L9 B5-D02…D05,
 * 173:9019 / 173:9757): the way back to the collection's Dynamic pages,
 * which made this page its template. Drawn only from real state — the
 * active page is some collection's `pageTemplatePath` (useCmsBinding's
 * `templateCollection`). Not above a Collection list (B5-D94 `195:27443`):
 * the list carries its own "Open collection ›", and the board omits the door.
 *
 * @license BSD-3-Clause
 */
import type * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { useCmsBinding } from "./useCmsBinding";

export function TemplatePageDoor({ composer, elementId }: { composer: Composer | null | undefined; elementId: string }): React.ReactElement | null {
  const { templateCollection } = useCmsBinding(composer, elementId);
  if (!composer || !templateCollection || composer.cms?.bindings?.getCollectionBinding(elementId)) return null;
  return (
    <div className="tw:flex tw:justify-center">
    <Button
      type="button"
      variant="link"
      size="xs"
      data-testid="inspector-template-door"
      onClick={() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: templateCollection.id, tab: "dynamic-pages" })}
      className="tw:h-10 tw:text-[13px] tw:font-normal"
    >
      ‹ CMS · Dynamic pages
    </Button>
    </div>
  );
}
