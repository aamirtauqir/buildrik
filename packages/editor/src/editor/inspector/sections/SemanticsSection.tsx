/**
 * Content › Semantics (2L9 boards 161:8480, 247:26594, 156:716): what the
 * element IS in the page's markup — its Tag and its ID — written once for
 * every breakpoint.
 *
 *   Tag  a heading's level, H1–H6, written on every writable target in ONE
 *        transaction (one Undo, DD-12) — the row the type block's "Level"
 *        used to be. Any other type shows its tag; changing it needs the
 *        board's "Change semantic tag" impact review (A12/A13), not built.
 *   ID   the element's `id` attribute, single selection only: one id on two
 *        elements is invalid markup. It moved here from Attributes.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { writableElements } from "@/engine/commands/commandOperations";
import { ControlRow, Section, SelectRow } from "@/editor/inspector/shared/controls";
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

/** The tags a type may switch between in place — the same element, the
 *  same text, another native tag. Other types show their tag read-only. */
const TAG_CHOICES: Readonly<Record<string, readonly string[]>> = {
  heading: ["h1", "h2", "h3", "h4", "h5", "h6"],
  text: ["p", "span", "div", "blockquote"],
  paragraph: ["p", "span", "div", "blockquote"],
};

/** 2L9 161:8480 / 247:26594: Tag is a select ("Paragraph", "h2"), written
 *  on every writable target in ONE transaction (one Undo, DD-12). */
function TagRow({ composer, element, targetIds, choices }: Pick<SemanticsSectionProps, "composer" | "element" | "targetIds"> & { choices: readonly string[] }) {
  const [, reread] = React.useReducer((n: number) => n + 1, 0);
  const tag = composer?.elements.getElement(element.id)?.getTagName?.()?.toLowerCase() || choices[0];
  const write = (next: string) => {
    if (!composer || !next) return;
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
  return <SelectRow label="Tag" placeholder={null} value={tag} onChange={write} options={options} />;
}

export function SemanticsSection({ composer, element, targetIds, isOpen, onToggle }: SemanticsSectionProps) {
  useElementVersion(composer);
  const tag = composer?.elements.getElement(element.id)?.getTagName?.() ?? "";
  const single = targetIds.length <= 1;
  return (
    <Section title="Semantics" isOpen={isOpen} onToggle={onToggle} id="inspector-section-semantics">
      {TAG_CHOICES[element.type] ? (
        <TagRow composer={composer} element={element} targetIds={targetIds} choices={TAG_CHOICES[element.type]} />
      ) : single && tag ? (
        <ControlRow label="Tag">
          <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink)]" data-testid="inspector-semantics-tag">
            {tagLabel(tag)}
          </span>
        </ControlRow>
      ) : null}
      {single && <PropertyRows composer={composer} element={element} targetIds={targetIds} rows={ID_ROW} />}
      <Note testId="inspector-semantics-note">Content and semantic changes apply to all breakpoints.</Note>
    </Section>
  );
}
