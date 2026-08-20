/**
 * Where a share link sends its visitor.
 *
 * There is no server-side render of a site's draft — the pages a visitor can be
 * shown are produced by the editor (publish, and the review snapshot). So a
 * share link can only open the site's PUBLISHED page, and a site that has never
 * been published has nothing to show.
 *
 * Both share entry points computed this inline as
 * `link.site.publishedUrl ?? "/" + link.site.slug`, and that fallback is not a
 * page: `/<slug>` is not a route in this app, so every link for an unpublished
 * site 404'd the client while the modal that minted it said "Anyone with this
 * link can preview the current draft". Verified end to end on an unpublished
 * site: create link → open in a clean browser → 404 Page Not Found.
 */
export function shareDestination(site: { publishedUrl: string | null }): string | null {
  return site.publishedUrl ?? null;
}
