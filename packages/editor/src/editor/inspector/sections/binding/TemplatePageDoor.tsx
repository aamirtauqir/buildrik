/**
 * TemplatePageDoor — "‹ CMS · Dynamic pages" at the head of the Content tab
 * while the page is a collection's template page (2L9 B5-D02…D05,
 * 173:9019 / 173:9757): the way back to the collection's Dynamic pages,
 * which made this page its template. Drawn only from real state — the
 * active page is some collection's `pageTemplatePath` (useCmsBinding's
 * `templateCollection`).
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
  if (!composer || !templateCollection) return null;
  return (
    <Button
      type="button"
      variant="link"
      size="xs"
      data-testid="inspector-template-door"
      onClick={() => composer.emit(EVENTS.UI_CMS_OPEN, { collectionId: templateCollection.id, tab: "dynamic-pages" })}
      className="tw:h-10 tw:self-center tw:text-[13px] tw:font-normal"
    >
      ‹ CMS · Dynamic pages
    </Button>
  );
}
