/**
 * The page post-processing every shipped site gets — ONE step, run by both
 * the publish worker (`lib/publish-forms.ts` → `planPublishPages`) and the
 * editor's ZIP export (`ExportEngine.generateZip`).
 *
 * Until 2026-10-20 the worker did this on its own (`lib/publish-sliders.ts`,
 * `lib/publish-widgets.ts`, `wireForms`) and the ZIP did none of it, so a
 * downloaded site had every accordion panel open and a contact form that
 * submitted the visitor's details as a GET query string (REA audit R4 P0 #5).
 *
 * Three jobs, per page:
 *   1. Forms — every form without an action is pointed at the public
 *      submissions endpoint (when the site is known) and always sent as
 *      urlencoded POST, never GET.
 *   2. Runtimes — each widget's behaviour is injected only on a page that has
 *      that widget, and only once. Every runtime is one import-free function,
 *      also run directly by the canvas, serialized here with
 *      `Function.prototype.toString()`.
 *   3. The site's inline custom-code scripts, carried inert by the export,
 *      are made runnable (`activateCustomCode`).
 *
 * Keep this file free of `@/` imports: the dashboard imports it through
 * `@buildrik/editor/src/...`, where `@/` resolves to the dashboard first.
 *
 * @license BSD-3-Clause
 */
import { initSliderRuntime, SLIDER_RUNTIME_CSS } from "./sliderRuntime";
import { initCountdownRuntime } from "./countdownRuntime";
import { initAccordionRuntime } from "./accordionRuntime";
import { initTabsRuntime } from "./tabsRuntime";
import { initModalRuntime } from "./modalRuntime";
import { initNavbarRuntime, NAVBAR_RUNTIME_CSS } from "./navbarRuntime";

export function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// =============================================================================
// FORMS
// =============================================================================

/** A form found in a published page, with what it needs a row for. */
export interface DiscoveredForm {
  /** The form element's id — used verbatim as the FormBlock's `blockId`. */
  blockId: string;
  /** Page path the form lives on, for naming it in the dashboard. */
  path: string;
  name: string;
  fields: Array<{ name: string; type: string }>;
}

/** Per-form settings that came from a prior publish's FormBlock row (inspector
 *  AFTER SUBMIT / PROTECTION). Missing keys — a form never edited from the
 *  inspector — get the same defaults their row would get. */
export interface FormBlockWireSettings {
  spamProtection?: boolean;
  successMessage?: string | null;
}

/** Where actionless forms post: `${appOrigin}/api/public/forms/${siteId}/<formId>`. */
export interface FormTarget {
  siteId: string;
  appOrigin: string;
}

/**
 * On an element a Collection list repeated: the id of the element it is a copy
 * of (keyCollectionCopies). Each copy has its own `data-buildrick-id`, but a
 * form in a card is still the one form block the site saved.
 */
export const COPY_OF_ATTR = "data-buildrick-copy-of";

const FORM_TAG = /<form\b[^>]*>/gi;
const ATTR = (html: string, attr: string) =>
  new RegExp(`\\b${attr}="([^"]*)"`, "i").exec(html)?.[1] ?? null;

/** The form element that owns everything up to its closing tag. */
function formBodies(html: string): Array<{ open: string; body: string }> {
  const out: Array<{ open: string; body: string }> = [];
  for (const m of html.matchAll(FORM_TAG)) {
    const start = m.index ?? 0;
    const close = html.indexOf("</form>", start);
    out.push({ open: m[0], body: close === -1 ? html.slice(start) : html.slice(start, close) });
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

const HONEYPOT_FIELD =
  '<input type="text" name="_honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" ' +
  'style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" data-buildrick-honeypot="1">';

/** Carries the visitor's own `location.href` back to the submit endpoint
 *  (`_return`, filled by the script below) — a cross-origin form POST's
 *  `Referer` is origin-only by default, so without this the "show message"
 *  redirect always lands on the site's home page regardless of which page
 *  the form was actually on. Unconditional, not gated by any inspector
 *  setting. */
const RETURN_FIELD = '<input type="hidden" name="_return" value="">';

/** Runs on every page that has a wired form:
 *  1. Fills each `_return` field with `location.href` before submit.
 *  2. After a same-page redirect (`?submitted=1&form=<id>`), swaps that form
 *     for its configured success message. A redirect-based after-submit
 *     action never reaches this (the browser lands on the redirect target
 *     instead), and a scripted/JSON submitter never loads a page at all.
 *  `id` from the query string is untrusted — CSS.escape it before it reaches
 *  a selector string, or a crafted `?form=` value could break out of the
 *  attribute-selector syntax. */
const FORM_PAGE_SCRIPT = `<script data-buildrick-form-success>(function(){
try{
var r=document.querySelectorAll('input[name="_return"]');
for(var i=0;i<r.length;i++){r[i].value=location.href;}
}catch(e){}
try{
var p=new URLSearchParams(location.search);
if(p.get("submitted")!=="1")return;
var id=p.get("form");
if(!id)return;
var esc=(window.CSS&&CSS.escape)?CSS.escape(id):id.replace(/[^a-zA-Z0-9_-]/g,"");
var f=document.querySelector('[data-buildrick-id="'+esc+'"],[${COPY_OF_ATTR}="'+esc+'"]')||document.getElementById(id);
if(!f)return;
var m=f.getAttribute("data-success-message")||"Thanks — your message was sent.";
var el=document.createElement("p");
el.className="bk-form-success";
el.textContent=m;
f.replaceWith(el);
}catch(e){}
})();</script>`;

const POST_ATTRS = ' method="POST" enctype="application/x-www-form-urlencoded"';

/**
 * Point every actionless form at the public endpoint and report what was found.
 * A form that already has an action (Formspree, a custom webhook, anything the
 * user typed) is left exactly as it is.
 *
 * With no target (a ZIP exported outside a saved site) there is nowhere to
 * post, but the form is still made POST: a form with no method submits as GET
 * and puts the visitor's name and email in the URL, its history and the
 * host's access log.
 */
export function wireForms(
  html: string,
  opts: { target: FormTarget | null; path: string },
  formSettings: Record<string, FormBlockWireSettings> = {},
): { html: string; forms: DiscoveredForm[] } {
  const found: DiscoveredForm[] = [];
  let out = html;

  for (const { open, body } of formBodies(html)) {
    if (/\baction="/i.test(open)) continue;
    /* BK-44: the endpoint takes urlencoded POST, but the inspector's Method /
       Encoding stayed on the tag — GET put the visitor's name and email in
       the URL (405) and multipart/plain bodies were refused. Ours go FIRST,
       straight after the tag name: a browser keeps the first of a repeated
       attribute, so the inspector's later ones are ignored. Nothing on the
       tag is removed or re-parsed — cutting attributes out of markup found
       by pattern is how a value can end up read as a new attribute. */
    const rest = open.slice("<form".length);
    if (!opts.target) {
      out = out.replace(open, `<form${POST_ATTRS}${rest}`);
      continue;
    }
    const blockId = ATTR(open, COPY_OF_ATTR) ?? ATTR(open, "data-buildrick-id") ?? ATTR(open, "id");
    if (!blockId) continue;

    const settings = formSettings[blockId];
    const spamProtection = settings?.spamProtection ?? true;
    const successMessage = settings?.successMessage;

    const action = `${opts.target.appOrigin.replace(/\/+$/, "")}/api/public/forms/${opts.target.siteId}/${blockId}`;
    let attrs = ` action="${escapeAttr(action)}"${POST_ATTRS}`;
    if (successMessage) attrs += ` data-success-message="${escapeAttr(successMessage)}"`;
    out = out.replace(open, `<form${attrs}${rest}` + RETURN_FIELD + (spamProtection ? HONEYPOT_FIELD : ""));

    found.push({
      blockId,
      path: opts.path,
      name: ATTR(open, "aria-label") ?? ATTR(open, "name") ?? `Form on ${opts.path}`,
      fields: fieldsOf(body),
    });
  }

  if (found.length > 0) out = beforeBodyEnd(out, FORM_PAGE_SCRIPT);
  return { html: out, forms: found };
}

// =============================================================================
// RUNTIMES
// =============================================================================

function beforeBodyEnd(html: string, block: string): string {
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${block}</body>`) : html + block;
}

/** An IIFE running `fn(document)` once the DOM is parsed. */
function onReady(fn: (root: ParentNode) => unknown): string {
  const call = `(${fn.toString()})(document);`;
  return `(function(){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){${call}});}else{${call}}})();`;
}

/** `uses`: the markup that means the page has the widget. `marker`: set on the
 *  injected tags, so a page is never given the same runtime twice. */
const RUNTIMES: ReadonlyArray<{ marker: string; uses: string; fn: (root: ParentNode) => unknown; css?: string }> = [
  { marker: "data-buildrick-slider-runtime", uses: "buildrick-slider", fn: initSliderRuntime, css: SLIDER_RUNTIME_CSS },
  { marker: "data-buildrick-countdown-runtime", uses: "data-countdown-end=", fn: initCountdownRuntime },
  { marker: "data-buildrick-accordion-runtime", uses: "data-allow-multiple", fn: initAccordionRuntime },
  { marker: "data-buildrick-tabs-runtime", uses: 'role="tablist"', fn: initTabsRuntime },
  { marker: "data-buildrick-modal-runtime", uses: "modal-trigger", fn: initModalRuntime },
  { marker: "data-buildrick-navbar-runtime", uses: "<nav", fn: initNavbarRuntime, css: NAVBAR_RUNTIME_CSS },
];

/**
 * Injects each widget runtime the page needs before `</body>`. A page with
 * none of the widgets is returned byte-for-byte unchanged.
 */
export function injectPageRuntimes(html: string): string {
  const blocks = RUNTIMES.filter((r) => html.includes(r.uses) && !html.includes(r.marker))
    .map((r) => (r.css ? `<style ${r.marker}>${r.css}</style>` : "") + `<script ${r.marker}>${onReady(r.fn)}</script>`)
    .join("");
  return blocks ? beforeBodyEnd(html, blocks) : html;
}

// =============================================================================
// SITE CUSTOM CODE
// =============================================================================

/** Marks an inline script from the site's custom code that the export kept
 *  inert (`type="text/plain"`, `sanitizeHeadCode`'s `inertInlineScripts`);
 *  its value is the type the script was written with. */
export const CUSTOM_CODE_ATTR = "data-buildrick-custom-code";

const INERT_SCRIPT = new RegExp(`<script\\b([^>]*?)\\s${CUSTOM_CODE_ATTR}="([^"]*)"([^>]*)>`, "gi");

/**
 * REA #27: the site's inline head/body scripts (chat widgets, analytics
 * snippets) run on the shipped site. The export's pages carry them inert,
 * because that same HTML is rendered inside the app (Review, Compare, the
 * share preview); only this step — the shipped site — gives each back the
 * type it was written with (none, for plain JavaScript), in place, so their
 * order is kept.
 */
function activateCustomCode(html: string): string {
  if (!html.includes(CUSTOM_CODE_ATTR)) return html;
  return html.replace(INERT_SCRIPT, (_tag, before: string, type: string, after: string) => {
    const rest = `${before}${after}`.replace(/\stype="text\/plain"/i, "");
    return `<script${type ? ` type="${escapeAttr(type)}"` : ""}${rest}>`;
  });
}

// =============================================================================
// THE STEP
// =============================================================================

export interface ShippedPage {
  path: string;
  html: string;
}

/** Forms, then runtimes, then the site's own inline scripts, on every page —
 *  what Publish deploys and the ZIP holds. */
export function postProcessPages<P extends ShippedPage>(
  pages: P[],
  opts: { formTarget: FormTarget | null; formSettings?: Record<string, FormBlockWireSettings> },
): { pages: P[]; forms: DiscoveredForm[] } {
  const forms: DiscoveredForm[] = [];
  const out = pages.map((page) => {
    const r = wireForms(page.html, { target: opts.formTarget, path: page.path }, opts.formSettings);
    forms.push(...r.forms);
    return { ...page, html: activateCustomCode(injectPageRuntimes(r.html)) };
  });
  return { pages: out, forms };
}
