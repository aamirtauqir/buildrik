/**
 * "Create collection page" from a Card's Link row (2L9 B5-D88 193:25921 …
 * D97 195:29268): the Dynamic pages tab's own dialog and two-step make
 * (`buildCollectionPage`, then `saveCollectionLink`), run from the Inspector
 * so the user stays on the Card. See docs/design-2l9/engine-record-pages.md.
 *
 *   creating → the page is being made (D89)
 *   ready    → page made and linked; the Card is selected again (D90)
 *   unlinked → page made, the collection link not saved; Retry saves the
 *              link only, never a second page (D93)
 *   saving   → that retry running (D97)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection } from "@/shared/types/cms";
import { useToast } from "@/editor/chrome-ui";
import type { CreateCollectionPageChoice } from "./CreateCollectionPageDialog";
import { buildCollectionPage, retryCollectionLink, saveCollectionLink } from "./createCollectionPage";
import { unsavedCollectionLinks, useUnsavedCollectionLink } from "./unsavedCollectionLinks";
import { recordPageReturn } from "./recordPageReturn";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";

export type LinkRowPagePhase = "idle" | "creating" | "ready" | "unlinked" | "saving";

export function useLinkRowCollectionPage(composer: Composer | null | undefined, collection: CMSCollection | null, cardId: string) {
  const { addToast } = useToast();
  const unlinked = useUnsavedCollectionLink(collection?.id ?? "");
  const [phase, setPhase] = React.useState<Exclude<LinkRowPagePhase, "unlinked">>("idle");
  const [madeName, setMadeName] = React.useState<string | null>(null);

  /* The user started on this Card; the make leaves it selected (D90/D97). */
  const backToCard = React.useCallback(() => {
    const card = composer?.elements.getElement(cardId);
    if (card) composer?.selection.select(card);
  }, [composer, cardId]);

  const announce = React.useCallback(
    (pageId: string, name: string) => {
      setMadeName(name);
      setPhase("ready");
      addToast({
        description: `${name} created`,
        tone: "info",
        action: {
          label: "Open page",
          onClick: () => {
            if (!composer) return;
            /* D98: the opened page offers "‹ {origin page} · {Collection} {card}". */
            const origin = composer.elements.getActivePage();
            const card = composer.elements.getElement(cardId);
            if (origin && card) {
              const cardName = (getLayerName(card) ?? elementTypeLabel(card.getType())).toLowerCase();
              recordPageReturn.set({
                pageId,
                originPageId: origin.id,
                originElementId: cardId,
                label: `${origin.name} · ${collection?.name ?? ""} ${cardName}`.replace(/ {2,}/g, " "),
              });
            }
            composer.elements.setActivePage(pageId);
          },
        },
      });
    },
    [composer, addToast, cardId, collection?.name],
  );

  const create = async (choice: CreateCollectionPageChoice) => {
    if (!composer || !collection) return;
    setPhase("creating");
    const origin = composer.elements.getActivePage()?.id;
    try {
      const made = await buildCollectionPage(composer, collection, choice.plan, choice.layout);
      /* The make must not move the editor off the Card's page. */
      if (origin && composer.elements.getActivePage()?.id !== origin) composer.elements.setActivePage(origin);
      backToCard();
      let reached = false;
      try {
        reached = await saveCollectionLink(composer, collection, { file: made.file, pattern: choice.pattern });
      } catch {
        reached = false;
      }
      if (reached) announce(made.pageId, made.name);
      else {
        setMadeName(made.name);
        setPhase("idle");
        unsavedCollectionLinks.set({
          collectionId: collection.id,
          collectionName: collection.name,
          pageId: made.pageId,
          name: made.name,
          file: made.file,
          pattern: choice.pattern,
        });
      }
    } catch {
      setPhase("idle");
    }
  };

  const retry = async () => {
    if (!composer || !collection || !unlinked) return;
    setPhase("saving");
    const made = unlinked;
    const ok = await retryCollectionLink(composer, collection.id).catch(() => false);
    backToCard();
    if (ok) {
      unsavedCollectionLinks.clear(collection.id);
      announce(made.pageId, made.name);
    } else setPhase("idle");
  };

  const shown: LinkRowPagePhase = phase === "saving" || phase === "creating" || phase === "ready" ? phase : unlinked ? "unlinked" : "idle";
  return { phase: shown, pageName: unlinked?.name ?? madeName, create, retry };
}
