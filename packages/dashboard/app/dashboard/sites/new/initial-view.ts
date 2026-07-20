export type NewSiteView = "choose" | "templates" | "preview" | "ai-type" | "ai-pages" | "ai-progress";

/**
 * Which view the create-site page opens on, from its URL params.
 *
 * The Templates tab links each card to `?method=template&template=<id>`. Before
 * the `template` param was read, every link was `?method=template`, which lands
 * on the full gallery — so clicking one template opened a page listing all of
 * them, a redundant second gallery. Reading `template` here is what lets a card
 * deep-link straight into that one template's preview.
 *
 * Extracted from the page so this routing can be tested without mounting the
 * whole stateful component (trpc queries, router, toasts).
 */
export function initialViewFor(params: { method: string | null; template: string | null }): {
  view: NewSiteView;
  previewTemplateId: string | null;
} {
  if (params.template) {
    return { view: "preview", previewTemplateId: params.template };
  }
  if (params.method === "template") {
    return { view: "templates", previewTemplateId: null };
  }
  if (params.method === "ai") {
    return { view: "ai-type", previewTemplateId: null };
  }
  return { view: "choose", previewTemplateId: null };
}
