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
 * id, and the worker upserts a FormBlock row under that same id. The ids come
 * from the URLs we ship, so the two cannot drift.
 */

/** A form found in a published page, with what it needs a row for. */
export interface DiscoveredForm {
  /** The form element's id — used verbatim as the FormBlock id. */
  blockId: string;
  /** Page path the form lives on, for naming it in the dashboard. */
  path: string;
  name: string;
  fields: Array<{ name: string; type: string }>;
}

const FORM_TAG = /<form\b[^>]*>/gi;
const ATTR = (html: string, attr: string) =>
  new RegExp(`\\b${attr}="([^"]*)"`, "i").exec(html)?.[1] ?? null;

/** The form element that owns everything up to its closing tag. */
function formBodies(html: string): Array<{ open: string; body: string; index: number }> {
  const out: Array<{ open: string; body: string; index: number }> = [];
  for (const m of html.matchAll(FORM_TAG)) {
    const start = m.index ?? 0;
    const close = html.indexOf("</form>", start);
    out.push({
      open: m[0],
      body: close === -1 ? html.slice(start) : html.slice(start, close),
      index: start,
    });
  }
  return out;
}

const FIELD_TAG = /<(input|textarea|select)\b[^>]*>/gi;

function fieldsOf(body: string): Array<{ name: string; type: string }> {
  const fields: Array<{ name: string; type: string }> = [];
  for (const m of body.matchAll(FIELD_TAG)) {
    const tag = m[1].toLowerCase();
    const name = ATTR(m[0], "name");
    // A field with no name submits nothing, so it is not a field.
    if (!name) continue;
    const type = tag === "input" ? (ATTR(m[0], "type") ?? "text") : tag;
    if (type === "submit" || type === "button") continue;
    fields.push({ name, type });
  }
  return fields;
}

/**
 * Point every actionless form at the public endpoint and report what was found.
 * A form that already has an action (Formspree, a custom webhook, anything the
 * user typed) is left exactly as it is.
 */
export function wireForms(
  html: string,
  opts: { siteId: string; appOrigin: string; path: string },
): { html: string; forms: DiscoveredForm[] } {
  const found: DiscoveredForm[] = [];
  let out = html;

  for (const { open, body } of formBodies(html)) {
    if (/\baction="/i.test(open)) continue;
    const blockId = ATTR(open, "data-buildrick-id") ?? ATTR(open, "id");
    if (!blockId) continue;

    const action = `${opts.appOrigin.replace(/\/+$/, "")}/api/public/forms/${opts.siteId}/${blockId}`;
    const rewritten = open.replace(/>$/, ` action="${action}" method="POST">`);
    out = out.replace(open, rewritten);

    found.push({
      blockId,
      path: opts.path,
      name: ATTR(open, "aria-label") ?? ATTR(open, "name") ?? `Form on ${opts.path}`,
      fields: fieldsOf(body),
    });
  }

  return { html: out, forms: found };
}

/** One page as the publish worker holds it, and hands it to the deploy. */
export interface PublishPage {
  path: string;
  html: string;
}

/** What a deploy should do about forms. */
export interface FormWiringPlan {
  /** Pages to deploy — rewritten when wiring ran, untouched when it could not. */
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
  pages.some(({ html }) => wireForms(html, { siteId: "x", appOrigin: "https://x", path: "" }).forms.length > 0);

/**
 * Decide the whole of it in one place, because the origin being missing has
 * two consequences and the worker only ever acted on one. Without an origin no
 * form can be pointed at the endpoint, so `discovered` comes back empty — and
 * an empty list fed to a `notIn` sweep matches every row, which switched off
 * every live form on the site while the job reported success. Publishing a
 * form with no action is the exact failure this module exists to close, so a
 * site that has one refuses to deploy instead; a site with none is unaffected
 * and publishes as before.
 */
export function planFormWiring(
  pages: PublishPage[],
  opts: { siteId: string; appOrigin: string },
): FormWiringPlan {
  const appOrigin = opts.appOrigin.replace(/\/+$/, "");
  if (!appOrigin) {
    return {
      pages,
      forms: [],
      deactivateMissing: false,
      error: wouldHaveWired(pages)
        ? "This site has a form, and NEXT_PUBLIC_APP_URL is not set — the form would publish with no action and submitting it would reload the page."
        : null,
    };
  }

  const forms: DiscoveredForm[] = [];
  const wired = pages.map((page) => {
    const r = wireForms(page.html, { siteId: opts.siteId, appOrigin, path: page.path });
    forms.push(...r.forms);
    return { ...page, html: r.html };
  });

  return { pages: wired, forms, deactivateMissing: true, error: null };
}
