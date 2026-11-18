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
import type { TypeBlockBodyProps } from "@/editor/inspector/config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { writableElements } from "@/engine/commands/commandOperations";
import { InputRow, InputWithUnit, SelectRow } from "@/editor/inspector/shared/controls";
import { runTxn, writeAttribute } from "../attributeWriter";
import { Note, useElementVersion } from "./bodyRows";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";
import { Button, useToast } from "@/editor/chrome-ui";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { CommitRow } from "@/editor/inspector/sections/behaviourRows";

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

/** One field across the selection: its value when every bar agrees, else
 *  "Mixed" — shown as the field's placeholder, never written. */
function agreed(values: readonly string[]): { value: string; mixed: boolean } {
  const mixed = values.some((v) => v !== values[0]);
  return { value: mixed ? "" : (values[0] ?? ""), mixed };
}

/* 2L9 B03: a batch edit says what it touched — and what it left alone. */
const BATCH_NOTE: Record<"value" | "max" | "label", string> = {
  value: "Only Value changed. Each Maximum and derived percentage uses its own pair.",
  max: "Only Maximum changed. Each Value and derived percentage uses its own pair.",
  label: "Only Show label changed.",
};

const FIELD_NAME = { value: "Value", max: "Maximum" } as const;

/** "20 and 80", "20, 40 and 80". */
const listOf = (xs: readonly string[]): string => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** B06: what Undo put back, in the bars' own numbers. */
function restoredNote(field: "value" | "max", before: readonly { value: string; max: string }[]): string {
  const own = before.map((r) => (field === "max" ? r.max : r.value));
  const other = before.map((r) => (field === "max" ? r.value || "0" : r.max));
  const kept = field === "max" ? "Value" : "Maximum";
  const head =
    own.every((x) => x === own[0]) ? `${own.length === 2 ? "Both" : "All"} original ${field === "max" ? "maxima" : "values"} are ${own[0]}.` : `Original ${field === "max" ? "maxima" : "values"}: ${listOf(own)}.`;
  return `${head} Each original ${kept} remains ${listOf(other)}.`;
}

type Applied = { key: string; count: number; note: string };

const Progress: React.FC<TypeBlockBodyProps> = (p) => {
  const el = useElement(p);
  const composer = p.composer;
  const { addToast } = useToast();
  const all = p.targetIds.map((id) => composer?.elements.getElement(id)).filter((e): e is Element => !!e);
  const read = all.length > 0 ? all.map((e) => readProgress(e)) : [readProgress(el)];
  const value = agreed(read.map((r) => r.value));
  const max = agreed(read.map((r) => r.max));
  const { showLabel } = read[0];
  const [applied, setApplied] = React.useState<Applied | null>(null);
  /* B02: a Maximum below some bar's Value refuses the WHOLE operation and
     keeps the draft, with the smallest maximum every bar accepts. */
  const [refused, setRefused] = React.useState<{ key: string; draft: string; floor: number; values: string[] } | null>(null);
  const draftId = React.useId();
  const selectionKey = p.targetIds.join(",");
  const run = (field: "value" | "max" | "label", fn: (composer: Composer, target: Element) => void, shown?: string) => {
    if (!composer) return;
    const targets = writableElements(composer, p.targetIds.map((id) => composer.elements.getElement(id)));
    if (targets.length === 0) return;
    const before = targets.map((t) => readProgress(t));
    runTxn(composer, "progress-change", () => {
      for (const target of targets) fn(composer, target);
    });
    setRefused(null);
    if (targets.length < 2) return setApplied(null);
    setApplied({ key: selectionKey, count: targets.length, note: BATCH_NOTE[field] });
    if (field === "label" || shown === undefined) return;
    /* B03 → B06: the receipt's Undo is the batch's one history step; after it
       the panel says what came back. */
    const undo = composer.history.captureUndo();
    addToast({
      description: `${FIELD_NAME[field]} set to ${shown} on ${targets.length} bars.`,
      action: {
        label: "Undo",
        onClick: () => {
          undo();
          setApplied({ key: selectionKey, count: targets.length, note: restoredNote(field, before) });
          addToast({ description: `Original ${field === "max" ? "maxima" : "values"} restored.` });
        },
      },
    });
  };
  /* Each bar keeps its own other half: a Value typed across three bars
     leaves each one's Maximum (and so its percentage) its own. */
  const setValue = (next: string) => {
    if (next === "" || Number(next) < 0) return;
    run("value", (c, t) => writeProgress(c, t, next, readProgress(t).max), next);
  };
  const setMax = (next: string) => {
    if (!(Number(next) > 0)) return;
    const values = read.map((r) => r.value || "0");
    const floor = Math.max(...values.map(Number).filter(Number.isFinite));
    if (Number(next) < floor) {
      setRefused({ key: selectionKey, draft: next, floor, values });
      return;
    }
    run("max", (c, t) => writeProgress(c, t, readProgress(t).value || "0", next), next);
  };
  const note = applied?.key === selectionKey ? applied : null;
  const draft = refused?.key === selectionKey ? refused : null;
  return (
    <>
      {/* Board 12 draws both as number fields with a stepper and no unit. */}
      <InputWithUnit label="Value" noUnit value={value.value} mixed={value.mixed} placeholder="0" onChange={setValue} />
      {draft ? (
        <>
          <CommitRow label="Maximum" value={draft.draft} onCommit={setMax} error={{ id: draftId }} testId="inspector-progress-max-draft" />
          <div id={draftId} role="alert" data-testid="inspector-progress-refused">
            <Note>Maximum must be at least {draft.floor}; lower those values first.</Note>
            <Note>
              {draft.values.length > 1 ? `Neither bar changed. Their individual values remain ${listOf(draft.values)}.` : `Nothing changed. The value remains ${draft.values[0]}.`}
            </Note>
          </div>
          <Button size="xs" className={`${WIDE_BUTTON} tw:text-white!`} onClick={() => setMax(String(draft.floor))} data-testid="inspector-progress-use-floor">
            Use maximum {draft.floor}
          </Button>
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => setRefused(null)} data-testid="inspector-progress-revert-draft">
            Revert draft
          </Button>
        </>
      ) : (
        <InputWithUnit label="Maximum" noUnit value={max.value} mixed={max.mixed} placeholder="100" onChange={setMax} />
      )}
      <CheckRow label="Show label" checked={showLabel} onChange={(on) => run("label", (c, t) => writeLabelShown(c, t, on))} />
      {note && !draft ? (
        <div className="tw:pt-4" role="status" data-testid="inspector-progress-applied">
          <p className="tw:m-0 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Applied to {note.count}</p>
          <Note>{note.note}</Note>
        </div>
      ) : null}
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
