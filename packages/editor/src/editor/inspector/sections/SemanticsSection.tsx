/**
 * Content › Semantics (2L9 boards 161:8480, 247:26594, 156:716): what the
 * element IS in the page's markup — its Tag and its ID — written once for
 * every breakpoint.
 *
 *   Tag  a heading's level, H1–H6, written on every writable target in ONE
 *        transaction (one Undo, DD-12) — the row the type block's "Level"
 *        used to be. A heading may become a paragraph (and text a
 *        heading) through the "Change semantic tag" review (A12 `247:27113`):
 *        same node, one Undo; then "Content retained" (A13 `247:27602`).
 *        Any other type shows its tag.
 *   ID   the element's `id` attribute, single selection only: one id on two
 *        elements is invalid markup. It moved here from Attributes.
 *   Native attributes  the attributes the element's own native tag defines
 *        (2L9 B4-Native 249:74672 … 249:74983: time · datetime, abbr ·
 *        title, del/ins · cite + datetime, meter · value…optimum, details ·
 *        open, track · kind/srclang/src/label/default, th scope …) on the
 *        actual node, each write one Undo through the lock gate. Tags whose
 *        type block already edits them (img, a, form fields, video, audio,
 *        progress, table cells) are not repeated; a void separator (br, hr,
 *        wbr) says it has no text or children.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { writableElements, writeElement } from "@/engine/commands/commandOperations";
import { EVENTS } from "@/shared/constants/events";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { convertSemantic, semanticConversionFor, type SemanticConversion } from "./elementConversion";
import { markJustAdded, useJustAdded } from "./justAddedField";
import { Button, useToast } from "@/editor/chrome-ui";
import { ControlRow, Section, SelectRow } from "@/editor/inspector/shared/controls";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { runTxn } from "./typeBlock/attributeWriter";
import { PropertyRows, type PropertyConfig } from "./typeBlock/PropertyField";
import { Note, useElementVersion } from "./typeBlock/bodies/bodyRows";

export interface SemanticsSectionProps {
  composer: Composer | null;
  element: { id: string; type: string };
  targetIds: readonly string[];
  isOpen: boolean;
  onToggle: () => void;
}

const ID_ROW: readonly PropertyConfig[] = [{ id: "id", label: "ID", type: "text", placeholder: "element-id" }];

/** How a tag reads on the row (board 161:8480: `p` reads "Paragraph"). */
const TAG_NAMES: Readonly<Record<string, string>> = {
  p: "Paragraph",
  span: "Span",
  div: "Div",
  a: "Link",
  button: "Button",
  img: "Image",
  form: "Form",
  input: "Input",
  textarea: "Textarea",
  select: "Select",
  label: "Label",
  section: "Section",
  article: "Article",
  aside: "Aside",
  header: "Header",
  footer: "Footer",
  main: "Main",
  nav: "Navigation",
  ul: "List",
  ol: "Numbered list",
  li: "List item",
  figure: "Figure",
  blockquote: "Quote",
  video: "Video",
  audio: "Audio",
  iframe: "Embed",
  svg: "SVG",
  table: "Table",
};

export function tagLabel(tag: string): string {
  const t = tag.toLowerCase();
  return TAG_NAMES[t] ?? (/^h[1-6]$/.test(t) ? `Heading ${t[1]}` : t);
}

const onOff = (id: string, label: string): PropertyConfig => ({ id, label, type: "checkbox" });
const text = (id: string, label: string, placeholder = "Not set"): PropertyConfig => ({ id, label, type: "text", placeholder });
const choose = (id: string, label: string, values: readonly string[]): PropertyConfig => ({
  id,
  label,
  type: "select",
  options: [{ value: "", label: "Not set" }, ...values.map((v) => ({ value: v, label: v }))],
});

/** The native attributes each tag defines, by the board's families. */
const NATIVE_ATTRS: Readonly<Record<string, readonly PropertyConfig[]>> = {
  /* Text and phrasing */
  time: [text("datetime", "datetime", "2026-10-21"), text("lang", "lang", "en")],
  abbr: [text("title", "Expansion")],
  dfn: [text("title", "Term")],
  q: [text("cite", "cite", "https://")],
  blockquote: [text("cite", "cite", "https://")],
  del: [text("cite", "cite", "https://"), text("datetime", "datetime")],
  ins: [text("cite", "cite", "https://"), text("datetime", "datetime")],
  data: [text("value", "value")],
  bdo: [choose("dir", "dir", ["ltr", "rtl"])],
  bdi: [choose("dir", "dir", ["ltr", "rtl", "auto"])],
  /* Lists */
  ol: [text("start", "start", "1"), onOff("reversed", "Reversed"), choose("type", "Numbering", ["1", "a", "A", "i", "I"])],
  li: [text("value", "value")],
  /* Native forms */
  fieldset: [onOff("disabled", "Disabled"), text("form", "Owner form")],
  output: [text("for", "for"), text("name", "name"), text("form", "Owner form")],
  option: [text("value", "value"), text("label", "label"), onOff("disabled", "Disabled"), onOff("selected", "Selected")],
  optgroup: [text("label", "label"), onOff("disabled", "Disabled")],
  label: [text("for", "for")],
  /* Media and sources */
  track: [
    choose("kind", "Kind", ["subtitles", "captions", "descriptions", "chapters", "metadata"]),
    text("srclang", "Language", "en"),
    text("src", "Source"),
    text("label", "label"),
    onOff("default", "Default"),
  ],
  source: [text("src", "src"), text("type", "type"), text("srcset", "srcset"), text("media", "media"), text("sizes", "sizes")],
  /* Tables (cells have their own section) */
  col: [text("span", "span", "1")],
  colgroup: [text("span", "span", "1")],
  /* Disclosure and dialog */
  details: [onOff("open", "Initial open")],
  dialog: [onOff("open", "Open")],
  /* Metrics (progress has its type block) */
  meter: [text("value", "Value"), text("min", "Min", "0"), text("max", "Max", "1"), text("low", "Low"), text("high", "High"), text("optimum", "Optimum")],
  /* SVG subtree */
  svg: [text("viewBox", "viewBox", "0 0 24 24")],
  path: [text("d", "d"), text("stroke", "Stroke"), text("fill", "Fill")],
  circle: [text("cx", "cx"), text("cy", "cy"), text("r", "r"), text("stroke", "Stroke"), text("fill", "Fill")],
  rect: [text("x", "x"), text("y", "y"), text("width", "width"), text("height", "height"), text("stroke", "Stroke"), text("fill", "Fill")],
  use: [text("href", "Fragment ref", "#icon")],
};

const VOID_SEPARATORS = new Set(["br", "hr", "wbr"]);

/** The child a native structure is named by — edited on that exact node. */
const CHILD_ROUTES: Readonly<Record<string, { tag: string; label: string }>> = {
  figure: { tag: "figcaption", label: "Edit caption" },
  table: { tag: "caption", label: "Edit caption" },
  fieldset: { tag: "legend", label: "Edit legend" },
  details: { tag: "summary", label: "Edit summary" },
};

/** The tags a type may switch between in place — the same element, the
 *  same text, another native tag. Other types show their tag read-only. */
const TAG_CHOICES: Readonly<Record<string, readonly string[]>> = {
  heading: ["h1", "h2", "h3", "h4", "h5", "h6"],
  text: ["p", "span", "div", "blockquote"],
  paragraph: ["p", "span", "div", "blockquote"],
};

/** 2L9 161:8480 / 247:26594: Tag is a select ("Paragraph", "h2"), written
 *  on every writable target in ONE transaction (one Undo, DD-12). The last
 *  choice may be a tag of another type (heading ↔ paragraph): that one is
 *  reviewed first (A12), never applied from the select. */
function TagRow({
  composer,
  element,
  targetIds,
  choices,
  onReview,
}: Pick<SemanticsSectionProps, "composer" | "element" | "targetIds"> & { choices: readonly string[]; onReview: (to: SemanticConversion) => void }) {
  const [, reread] = React.useReducer((n: number) => n + 1, 0);
  const tag = composer?.elements.getElement(element.id)?.getTagName?.()?.toLowerCase() || choices[0];
  const convert = targetIds.length <= 1 ? semanticConversionFor(element.type) : null;
  const write = (next: string) => {
    if (!composer || !next) return;
    if (convert && next === `convert:${convert.tag}`) {
      onReview(convert);
      return;
    }
    const targets = writableElements(composer, targetIds.map((id) => composer.elements.getElement(id)));
    if (targets.length === 0) return;
    runTxn(composer, element.type === "heading" ? "heading-level" : "element-tag", () => {
      for (const el of targets) el.setTagName(next);
    });
    reread();
  };
  const options = (choices.includes(tag) ? choices : [tag, ...choices]).map((t) => ({
    value: t,
    label: element.type === "heading" ? t.toUpperCase() : tagLabel(t),
  }));
  if (convert) options.push({ value: `convert:${convert.tag}`, label: `${convert.tag} — change to ${convert.noun}…` });
  return <SelectRow label="Tag" placeholder={null} value={tag} onChange={write} options={options} />;
}

const CURRENT_PILL =
  "tw:flex tw:h-7 tw:min-w-0 tw:flex-1 tw:items-center tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink-soft)]";

/** A12 "Change semantic tag": current, new, what survives, one Undo. */
function ConversionReview({ composer, element, to, onDone }: { composer: Composer; element: { id: string; type: string }; to: SemanticConversion; onDone: () => void }) {
  const { addToast } = useToast();
  const el = composer.elements.getElement(element.id);
  if (!el) return null;
  const from = elementTypeLabel(element.type);
  const apply = () => {
    let made: ReturnType<typeof convertSemantic> = null;
    if (!writeElement(composer, el, `Change to ${to.noun}`, () => (made = convertSemantic(composer, el, to))) || !made) return;
    const undo = composer.history.captureUndo();
    markJustAdded(composer, element.id, "semantic-converted");
    composer.selection.select(made);
    onDone();
    addToast({ description: `${from} changed to ${to.noun}.`, action: { label: "Undo", onClick: undo } });
  };
  return (
    <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-semantics-review">
      <ControlRow label="Current">
        <span className={CURRENT_PILL}>{el.getTagName().toLowerCase()}</span>
      </ControlRow>
      <ControlRow label="New tag">
        <span className={CURRENT_PILL}>{to.tag}</span>
      </ControlRow>
      <Note>{to.impact}</Note>
      <Button size="xs" className={`${WIDE_BUTTON} tw:text-white!`} onClick={apply} data-testid="inspector-semantics-convert">
        Change to {to.noun}
      </Button>
      <Button color="light" size="xs" className={WIDE_BUTTON} onClick={onDone} data-testid="inspector-semantics-convert-cancel">
        Cancel
      </Button>
      <Note>One Undo restores the original tag and attributes.</Note>
    </div>
  );
}

export function SemanticsSection({ composer, element, targetIds, isOpen, onToggle }: SemanticsSectionProps) {
  useElementVersion(composer);
  const [review, setReview] = React.useState<SemanticConversion | null>(null);
  const converted = useJustAdded(composer, element.id, "semantic-converted");
  React.useEffect(() => setReview(null), [element.id]);
  if (review && composer) {
    return (
      <Section title="Semantics" stateTitle="Change semantic tag" isOpen={isOpen} onToggle={onToggle} id="inspector-section-semantics">
        <ConversionReview composer={composer} element={element} to={review} onDone={() => setReview(null)} />
      </Section>
    );
  }
  const tag = composer?.elements.getElement(element.id)?.getTagName?.() ?? "";
  const single = targetIds.length <= 1;
  const childRoute = CHILD_ROUTES[tag.toLowerCase()];
  const routeTarget = childRoute ? composer?.elements.getElement(element.id)?.getChildren().find((ch) => ch.getTagName().toLowerCase() === childRoute.tag) : undefined;
  return (
    <Section title="Semantics" isOpen={isOpen} onToggle={onToggle} id="inspector-section-semantics">
      {TAG_CHOICES[element.type] ? (
        <TagRow composer={composer} element={element} targetIds={targetIds} choices={TAG_CHOICES[element.type]} onReview={setReview} />
      ) : single && tag ? (
        <ControlRow label="Tag">
          <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink)]" data-testid="inspector-semantics-tag">
            {tagLabel(tag)}
          </span>
        </ControlRow>
      ) : null}
      {single && <PropertyRows composer={composer} element={element} targetIds={targetIds} rows={ID_ROW} />}
      {single && NATIVE_ATTRS[tag.toLowerCase()] ? (
        <div data-testid="inspector-native-attributes">
          <div className="tw:pb-1 tw:pt-3 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Native attributes</div>
          <PropertyRows composer={composer} element={element} targetIds={targetIds} rows={NATIVE_ATTRS[tag.toLowerCase()]} />
        </div>
      ) : null}
      {single && childRoute && routeTarget ? (
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer?.selection.select(routeTarget)} data-testid="inspector-semantics-child">
          {childRoute.label}
        </Button>
      ) : null}
      {single && VOID_SEPARATORS.has(tag.toLowerCase()) ? (
        <Note testId="inspector-semantics-void">No text or children — a {tag.toLowerCase()} keeps its place in the line.</Note>
      ) : null}
      {converted ? (
        <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-semantics-retained">
          <div className="tw:pt-3 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Content retained</div>
          <Note>The same node and inline children are retained. Styles and references are unchanged.</Note>
          <Button
            color="light"
            size="xs"
            className={WIDE_BUTTON}
            onClick={() => composer?.emit(EVENTS.UI_INLINE_EDIT_REQUEST, { elementId: element.id })}
            data-testid="inspector-semantics-edit-text"
          >
            Edit text on canvas
          </Button>
        </div>
      ) : (
        <Note testId="inspector-semantics-note">Content and semantic changes apply to all breakpoints.</Note>
      )}
    </Section>
  );
}
