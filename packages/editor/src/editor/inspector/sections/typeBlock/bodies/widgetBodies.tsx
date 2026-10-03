/**
 * Type-block bodies — widgets: Countdown (board 11), Progress (board 12),
 * Accordion (board 13).
 *
 *   Countdown  Ends at · "Uses the visitor's time zone." · When done (Show
 *              message / Hide) · Message. Written as data-countdown-* on the
 *              element; `engine/export/countdownRuntime.ts` ticks it on the
 *              canvas and the published page.
 *   Progress   Value / Maximum · Show label. Written on the element's own
 *              native `<progress>` bar (value, max) and its label (the text,
 *              and `hidden`) — no runtime: the browser draws the bar. A
 *              progress saved before the bar existed gets one on first edit.
 *   Accordion  one Open / Closed row per item ("1 · Reservations") · "Allow
 *              several open at once". Written as data-accordion-state on each
 *              item and data-allow-multiple on the accordion; the accordion
 *              runtime honours both. With one-at-a-time, opening an item
 *              closes the others, in the same Undo.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { writableElements } from "@/engine/commands/commandOperations";
import { InputRow, InputWithUnit, SelectRow } from "../../../shared/controls";
import { runTxn, writeAttribute } from "../attributeWriter";
import { Note, useElementVersion } from "./bodyRows";
import { CheckRow } from "../../../shared/controls/CheckRow";

function useElement(p: TypeBlockBodyProps): Element | undefined {
  useElementVersion(p.composer);
  return p.composer?.elements.getElement(p.element.id) ?? undefined;
}

// ============================================================================
// COUNTDOWN
// ============================================================================

const DONE_OPTIONS = [
  { value: "message", label: "Show message" },
  { value: "hide", label: "Hide" },
];

/** "2026-12-31 23:59" (or with a T) → the stored "2026-12-31T23:59"; null if not a time. */
export function parseEndsAt(text: string): string | null {
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})\s*$/.exec(text);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(+y, +mo - 1, +d, +h, +mi);
  if (date.getMonth() !== +mo - 1 || date.getDate() !== +d || +h > 23 || +mi > 59) return null;
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

const showEndsAt = (stored: string | undefined) => (stored ?? "").replace("T", " ");

const Countdown: React.FC<TypeBlockBodyProps> = (p) => {
  const el = useElement(p);
  const stored = el?.getAttribute("data-countdown-end");
  const [draft, setDraft] = React.useState(showEndsAt(stored));
  React.useEffect(() => setDraft(showEndsAt(stored)), [stored]);
  const write = (name: string, value: string) => {
    if (p.composer) writeAttribute(p.composer, p.targetIds, name, value);
  };
  const setEndsAt = (text: string) => {
    setDraft(text);
    if (!text.trim()) return write("data-countdown-end", "");
    const next = parseEndsAt(text);
    if (next) write("data-countdown-end", next);
  };
  const done = el?.getAttribute("data-countdown-done") === "hide" ? "hide" : "message";
  return (
    <>
      <InputRow label="Ends at" value={draft} placeholder="2026-12-31 23:59" onChange={setEndsAt} />
      <Note testId="inspector-countdown-zone">Uses the visitor&rsquo;s time zone.</Note>
      <SelectRow label="When done" placeholder={null} value={done} options={DONE_OPTIONS} onChange={(v) => write("data-countdown-done", v === "hide" ? "hide" : "")} />
      {done === "message" && (
        <InputRow
          label="Message"
          value={el?.getAttribute("data-countdown-message") ?? ""}
          placeholder="We are open!"
          onChange={(v) => write("data-countdown-message", v)}
        />
      )}
    </>
  );
};

// ============================================================================
// PROGRESS
// ============================================================================

const isBar = (e: Element) => e.getTagName().toLowerCase() === "progress";
const isLabel = (e: Element) => e.hasClass("pb-circle") || e.hasClass("pb-label");

/** The element holding the label's text: the label, or its first text-bearing descendant. */
function labelText(label: Element): Element {
  if (label.getContent()) return label;
  return label.getDescendants().find((d) => d.getContent()) ?? label;
}

function readProgress(el: Element | undefined) {
  const parts = el?.getDescendants() ?? [];
  const bar = parts.find(isBar);
  const label = parts.find(isLabel);
  return {
    value: bar?.getAttribute("value") ?? "",
    max: bar?.getAttribute("max") ?? "100",
    showLabel: !!label && label.getAttribute("hidden") === undefined,
  };
}

const percent = (value: number, max: number) => `${Math.round(Math.min(100, Math.max(0, (value / max) * 100)))}%`;

/** Value / max onto the bar (made if missing) and the label's text. */
function writeProgress(composer: Composer, el: Element, value: string, max: string): void {
  const parts = el.getDescendants();
  let bar = parts.find(isBar);
  if (!bar) {
    bar = composer.elements.createElement("container", { tagName: "progress", classes: ["pb-bar"] });
    composer.elements.addElement(bar, el.getId(), 0);
  }
  bar.setAttribute("value", value);
  bar.setAttribute("max", max);
  const label = parts.find(isLabel);
  const v = Number(value);
  const m = Number(max);
  if (label && Number.isFinite(v) && m > 0) labelText(label).setContent(percent(v, m));
}

function writeLabelShown(composer: Composer, el: Element, shown: boolean): void {
  const parts = el.getDescendants();
  let label = parts.find(isLabel);
  if (!label && shown) {
    const { value, max } = readProgress(el);
    const created = composer.elements.createElement("text", {
      tagName: "span",
      classes: ["pb-label"],
      content: percent(Number(value) || 0, Number(max) || 100),
    });
    const bar = parts.find(isBar);
    const parent = bar?.getParent() ?? el;
    composer.elements.addElement(created, parent.getId(), bar ? parent.getChildIndex(bar) + 1 : undefined);
    label = created;
  }
  if (!label) return;
  if (shown) label.removeAttribute("hidden");
  else label.setAttribute("hidden", "");
}

const Progress: React.FC<TypeBlockBodyProps> = (p) => {
  const el = useElement(p);
  const { value, max, showLabel } = readProgress(el);
  const run = (fn: (composer: Composer, target: Element) => void) => {
    const composer = p.composer;
    if (!composer) return;
    const targets = writableElements(composer, p.targetIds.map((id) => composer.elements.getElement(id)));
    if (targets.length === 0) return;
    runTxn(composer, "progress-change", () => {
      for (const target of targets) fn(composer, target);
    });
  };
  const setValue = (next: string) => {
    if (next === "" || Number(next) < 0) return;
    run((c, t) => writeProgress(c, t, next, max));
  };
  const setMax = (next: string) => {
    if (!(Number(next) > 0)) return;
    run((c, t) => writeProgress(c, t, value || "0", next));
  };
  return (
    <>
      {/* Board 12 draws both as number fields with a stepper and no unit. */}
      <InputWithUnit label="Value" noUnit value={value} placeholder="0" onChange={setValue} />
      <InputWithUnit label="Maximum" noUnit value={max} placeholder="100" onChange={setMax} />
      <CheckRow label="Show label" checked={showLabel} onChange={(on) => run((c, t) => writeLabelShown(c, t, on))} />
    </>
  );
};

// ============================================================================
// ACCORDION
// ============================================================================

const STATE_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const classTokens = (e: Element) => [...e.getClasses(), ...(e.getAttribute("class")?.split(/\s+/) ?? [])];

function accordionItems(el: Element | undefined): Element[] {
  const kids = el?.getChildren() ?? [];
  const classed = kids.filter((k) => classTokens(k).includes("accordion-item"));
  return classed.length > 0 ? classed : kids;
}

function isItemOpen(item: Element): boolean {
  const state = item.getAttribute("data-accordion-state");
  return state ? state === "open" : classTokens(item).includes("open");
}

/** The item's header text ("Reservations"), read off its first text-bearing part. */
function itemTitle(item: Element): string {
  const withText = item.getDescendants().find((d) => d.getContent().trim());
  return (withText?.getContent() ?? "").replace(/<[^>]*>/g, "").trim();
}

const allowsMultiple = (el: Element | undefined) => {
  const v = el?.getAttribute("data-allow-multiple");
  return v === "true" || v === "";
};

const Accordion: React.FC<TypeBlockBodyProps> = (p) => {
  const el = useElement(p);
  const items = accordionItems(el);
  const multiple = allowsMultiple(el);
  const composer = p.composer;

  const setStates = (states: ReadonlyArray<[Element, boolean]>) => {
    if (!composer) return;
    runTxn(composer, "accordion-change", () => {
      for (const [item, open] of states) writeAttribute(composer, [item.getId()], "data-accordion-state", open ? "open" : "closed");
    });
  };

  const setItem = (index: number, open: boolean) =>
    setStates(items.map((item, i) => [item, i === index ? open : open && !multiple ? false : isItemOpen(item)]));

  const setMultiple = (on: boolean) => {
    if (!composer || !el) return;
    runTxn(composer, "accordion-change", () => {
      writeAttribute(composer, [el.getId()], "data-allow-multiple", on ? "true" : "false");
      if (!on) {
        /* One at a time from now on: the first open item stays open. */
        const first = items.findIndex(isItemOpen);
        setStates(items.map((item, i) => [item, i === first]));
      }
    });
  };

  return (
    <>
      {items.map((item, i) => (
        <SelectRow
          key={item.getId()}
          placeholder={null}
          label={`${i + 1} · ${itemTitle(item) || "Item"}`}
          value={isItemOpen(item) ? "open" : "closed"}
          options={STATE_OPTIONS}
          onChange={(v) => setItem(i, v === "open")}
        />
      ))}
      <CheckRow label="Allow several open at once" checked={multiple} onChange={setMultiple} />
    </>
  );
};

export const WIDGET_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  countdown: Countdown,
  progress: Progress,
  accordion: Accordion,
};
