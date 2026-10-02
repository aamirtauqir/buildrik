/**
 * Refine generic element types to the specific type an element's stored
 * markup proves (Q2, owner 2026-09-27).
 *
 * Until Q2 the catalog's Checkbox, Radio, Switch and Label were saved as
 * `container<label>`, the embeds, Lottie, Social icons, Stack and Tabs as
 * `container<div>`, and every `<li>` and `<table>` as a `container` — so the
 * engine, canvas, export and inspector read different answers to "what is
 * this?". New inserts carry their real type now; this upgrades what is
 * already saved.
 *
 * Only on PROOF. The `data-buildrick-type` marker never survives a parse and
 * no block id is stored, so the proof is the markup each block writes and
 * nothing else writes: a `<label>` wrapping its own checkbox/radio input, the
 * `.buildrick-video-embed` class, a `.stack` of `.stack-item`s. A card, a
 * spacer, a navbar and a CTA are a styled `<div>`/`<nav>`/`<section>`
 * indistinguishable from any other, so they are left exactly as stored.
 *
 * Markup-neutral by construction. Every proof is keyed on the element's
 * stored tag, and the type it assigns renders that same tag (a stored "div"
 * defers to the type's tag, and each div-keyed type's tag IS "div") with no
 * default attributes on it (`getDefaultAttributes` is tag-aware). Pinned by
 * `__tests__/refineElementTypes.test.ts` against a real pre-Q2 save.
 *
 * Mutates in place, like the sanitizer it runs beside in `importProject`, and
 * is idempotent: it only ever reads a `container` (or a parser's `label`).
 *
 * @license BSD-3-Clause
 */
import type { ElementData, ElementType } from "@/shared/types";

function classList(el: ElementData): string[] {
  const fromAttr = el.attributes?.class?.split(/\s+/) ?? [];
  return [...(el.classes ?? []), ...fromAttr];
}

const hasClass = (el: ElementData, name: string) => classList(el).includes(name);
const tagOf = (el: ElementData) => (el.tagName ?? "div").toLowerCase();

/** A `<label>` is the control it wraps: its own checkbox or radio input. */
function labelType(el: ElementData): ElementType {
  const input = el.children?.find((c) => tagOf(c) === "input");
  const kind = input?.attributes?.type?.toLowerCase();
  if (kind === "radio") return "radio";
  if (kind !== "checkbox") return "label";
  const isSwitch =
    input?.attributes?.role === "switch" || hasClass(el, "switch-wrapper") || (input ? hasClass(input, "switch-input") : false);
  return isSwitch ? "switch" : "checkbox";
}

function divType(el: ElementData): ElementType | null {
  if (hasClass(el, "buildrick-video-embed")) return "video-embed";
  if (hasClass(el, "buildrick-map-embed")) return "map-embed";
  if (hasClass(el, "buildrick-social-icons")) return "social";
  if (hasClass(el, "lottie-container") && el.attributes?.["data-lottie-src"] !== undefined) return "lottie";
  const kids = el.children ?? [];
  if (hasClass(el, "stack") && kids.length > 0 && kids.every((c) => hasClass(c, "stack-item"))) return "stack";
  if (hasClass(el, "tabs") && kids.some((c) => c.attributes?.role === "tablist")) return "tabs";
  return null;
}

function provenType(el: ElementData): ElementType | null {
  const tag = tagOf(el);
  if (el.type === "label") return tag === "label" ? labelType(el) : null;
  if (el.type !== "container") return null;
  if (tag === "label") return labelType(el);
  if (tag === "li") return "list-item";
  if (tag === "table") return "table";
  if (tag === "div") return divType(el);
  return null;
}

/** Upgrade every element in the tree whose stored markup proves its type. */
export function refineElementTypes(el: ElementData): void {
  const proven = provenType(el);
  if (proven) el.type = proven;
  el.children?.forEach(refineElementTypes);
}
