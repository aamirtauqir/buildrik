/**
 * Collection list block — G3-079 (board 4428:151488).
 *
 * The list is one container; its children are the item template, repeated
 * once per record of the collection it is bound to (inspector › Settings ›
 * Collection). `{{item.<field>}}` in the template's text is the record's
 * value — the bind retargets the two starter placeholders onto the chosen
 * collection's own fields.
 *
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig } from "../types";

/* The build path does not seed type defaults, so the block carries them
   (as the Grid block does) — the 3-up row the board draws. */
const LIST_STYLES: Record<string, string> = {
  display: "grid",
  "grid-template-columns": "repeat(3, 1fr)",
  gap: "16px",
};

const CARD_STYLES: Record<string, string> = {
  display: "flex",
  "flex-direction": "column",
  gap: "8px",
  background: "#f3f4f6",
  padding: "16px",
  "border-radius": "8px",
};

const MEDIA_STYLES: Record<string, string> = {
  height: "96px",
  background: "#e5e7eb",
  "border-radius": "6px",
};

export const collectionListBlockConfig: BlockBuildConfig = {
  id: "collection-list",
  label: "Collection list",
  category: "Layout",
  elementType: "collection-list",
  content:
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px"><div style="display:flex;flex-direction:column;gap:8px;background:#f3f4f6;padding:16px;border-radius:8px"><div style="height:96px;background:#e5e7eb;border-radius:6px"></div><h3>{{item.name}}</h3><p>{{item.description}}</p></div></div>',
  build: (composer, parentId, dropIndex) => {
    const els = composer.elements;
    const list = els.createElement("collection-list", { styles: LIST_STYLES });
    const card = els.createElement("container", { styles: CARD_STYLES });
    card.addChild(els.createElement("container", { styles: MEDIA_STYLES }));
    card.addChild(els.createElement("heading", { content: "{{item.name}}", tagName: "h3" }));
    card.addChild(els.createElement("paragraph", { content: "{{item.description}}" }));
    list.addChild(card);
    els.addElement(list, parentId, dropIndex);
    return list.getId();
  },
};
