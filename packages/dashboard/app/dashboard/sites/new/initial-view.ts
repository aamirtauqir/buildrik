export type NewSiteView = "choose" | "ai-type" | "ai-pages" | "ai-progress";

/**
 * Which view the create-site page opens on, from its `?method` param.
 *
 * Templates used to be a view here (`?method=template` → gallery, `?template=<id>`
 * → preview). They now live in their own full-width browser at
 * `/dashboard/templates`, so this page no longer hosts a template view — the page
 * redirects any template-shaped URL to the browser (see page.tsx). What's left is
 * the AI wizard (`?method=ai`) and the default chooser.
 *
 * Pure and separate from the page so this routing can be tested without mounting
 * the stateful component (trpc queries, router, toasts).
 */
export function initialViewFor(method: string | null): NewSiteView {
  return method === "ai" ? "ai-type" : "choose";
}

/** A template-shaped URL that should redirect to /dashboard/templates instead of
 *  opening a view here: `?method=template` (from empty-state / quick-actions /
 *  the create-site modal) or a bare `?template=<id>` deep link. */
export function isTemplateRedirect(method: string | null, template: string | null): boolean {
  return method === "template" || !!template;
}
