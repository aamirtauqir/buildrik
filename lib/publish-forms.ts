/**
 * Forms on a published site.
 *
 * The pieces were all built and none of them met: `POST /api/public/forms/
 * <siteId>/<formBlockId>` is real, validated and rate-limited; the Submissions
 * tab reads what it writes; and `submitForm` refuses without a FormBlock row.
 * But nothing ever created a row (only site duplication copies existing ones),
 * and the export only sets a form `action` for Formspree or a custom webhook.
 * A form built in the editor and published therefore posted nowhere — it had no
 * action at all, so submitting reloaded the page.
 *
 * This closes it at publish time, where the siteId is known for certain: every
 * form without an action is pointed at the endpoint, keyed by its own element
 * id, and the worker upserts the site's FormBlock row under (siteId, that id).
 * The ids come from the URLs we ship, so the two cannot drift. The element id
 * is only unique within a site — sites made from one template share them.
 */
import {
  postProcessPages,
  wireForms,
  type DiscoveredForm,
  type FormBlockWireSettings,
} from "@buildrik/editor/src/engine/export/publishPostProcess";

/** One page as the publish worker holds it, and hands it to the deploy. */
export interface PublishPage {
  path: string;
  html: string;
}

/** What a deploy should do about forms. */
export interface FormWiringPlan {
  /** Pages to deploy, post-processed (forms + widget runtimes). */
  pages: PublishPage[];
  /** Forms to upsert a row for. Empty when wiring could not run. */
  forms: DiscoveredForm[];
  /**
   * Whether rows absent from `forms` may be switched off. False whenever
   * wiring did not run: `forms` is then empty for want of an origin, not
   * because the site has no forms, and sweeping on it would deactivate every
   * working form on the site.
   */
  deactivateMissing: boolean;
  /** Set when the deploy must not proceed, and why. */
  error: string | null;
}

/** A form this publish would have wired, had it been able to. */
const wouldHaveWired = (pages: PublishPage[]): boolean =>
  pages.some(({ html }) => wireForms(html, { target: { siteId: "x", appOrigin: "https://x" }, path: "" }).forms.length > 0);

/**
 * Decide the whole of it in one place, because the origin being missing has
 * two consequences and the worker only ever acted on one. Without an origin no
 * form can be pointed at the endpoint, so `discovered` comes back empty — and
 * an empty list fed to a `notIn` sweep matches every row, which switched off
 * every live form on the site while the job reported success. Publishing a
 * form with no action is the exact failure this module exists to close, so a
 * site that has one refuses to deploy instead; a site with none is unaffected
 * and publishes as before.
 *
 * The pages themselves go through `postProcessPages` — the one post-processing
 * step the editor's ZIP export runs too, so the two cannot drift.
 */
export function planPublishPages(
  pages: PublishPage[],
  opts: { siteId: string; appOrigin: string; formSettings?: Record<string, FormBlockWireSettings> },
): FormWiringPlan {
  const appOrigin = opts.appOrigin.replace(/\/+$/, "");
  if (!appOrigin) {
    return {
      pages: postProcessPages(pages, { formTarget: null }).pages,
      forms: [],
      deactivateMissing: false,
      error: wouldHaveWired(pages)
        ? "This site has a form, and NEXT_PUBLIC_APP_URL is not set — the form would publish with no action and submitting it would reload the page."
        : null,
    };
  }

  const { pages: wired, forms } = postProcessPages(pages, {
    formTarget: { siteId: opts.siteId, appOrigin },
    formSettings: opts.formSettings,
  });
  return { pages: wired, forms, deactivateMissing: true, error: null };
}
