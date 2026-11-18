/**
 * Content › Children (2L9 B4-B69 block control references, 249:71560 …):
 * a block that holds other blocks edits them where they are — its direct
 * children by name (each opens that exact child), and, when every child is
 * the same kind (a list's items, a row's columns), "Add blank {item}" — a
 * copy of the last child's tag and appearance, no content, one Undo — else
 * "Open Add". Nothing is generated or flattened; IDs stay as they are.
 *
 * Types with their own list (Fields, Slides, Collection list, Tabs, Table)
 * do not get it — `registry/content.tsx` decides.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { Button } from "@/editor/chrome-ui";
import { writeElement } from "@/engine/commands/commandOperations";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { EVENTS } from "@/shared/constants/events";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { Section } from "../shared/controls";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";
import { NoteRow } from "./behaviourRows";

const SHOWN = 6;

/** What one child of a uniform list is called on the add button. */
const ITEM_NOUN: Readonly<Record<string, string>> = { li: "list item", dt: "term", dd: "description", option: "option", figure: "figure" };

/** Parents whose container children are columns (Row, 2 / 3 Columns, Grid, Flex). */
const COLUMN_PARENTS: ReadonlySet<string> = new Set(["row", "columns", "columns3", "grid", "flex"]);

const nameOf = (el: Element): string => getLayerName(el) ?? elementTypeLabel(el.getType());

export function useTreeVersion(composer: Composer | null | undefined): void {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    const events = [EVENTS.ELEMENT_CREATED, EVENTS.ELEMENT_DELETED, EVENTS.ELEMENT_MOVED, EVENTS.ELEMENT_UPDATED, EVENTS.HISTORY_UNDO, EVENTS.HISTORY_REDO] as const;
    for (const e of events) composer.on(e, bump);
    return () => {
      for (const e of events) composer.off(e, bump);
    };
  }, [composer]);
}

/** The noun for a blank copy when every child is the same kind; null when mixed or none. */
function uniformItem(parent: Element, children: readonly Element[]): string | null {
  /* Two alike make a list; one child is just a child. */
  if (children.length < 2) return null;
  const tag = children[0].getTagName().toLowerCase();
  const type = children[0].getType();
  if (!children.every((c) => c.getTagName().toLowerCase() === tag && c.getType() === type)) return null;
  return ITEM_NOUN[tag] ?? (type === "container" && COLUMN_PARENTS.has(parent.getType()) ? "column" : elementTypeLabel(type).toLowerCase());
}

/** B69/04 "Reduce count": the last column goes. An empty one goes at once;
 *  one with content is reviewed first — Move its blocks into the column
 *  before it, Remove it with them, or Cancel. Each is one Undo. */
function ReduceColumns({ composer, parent, columns }: { composer: Composer; parent: Element; columns: readonly Element[] }) {
  const [reviewing, setReviewing] = React.useState(false);
  const last = columns[columns.length - 1];
  const before = columns[columns.length - 2];
  React.useEffect(() => setReviewing(false), [last?.getId()]);
  if (!last || !before) return null;
  const held = last.getChildren().length;
  const remove = () =>
    writeElement(composer, parent, "Remove column", () => {
      composer.elements.removeElement(last.getId());
    });
  const moveThenRemove = () =>
    writeElement(composer, parent, "Move column content", () => {
      for (const child of [...last.getChildren()]) composer.elements.moveElement(child.getId(), before.getId());
      composer.elements.removeElement(last.getId());
    });
  if (held === 0) {
    return (
      <Button color="light" size="xs" className={WIDE_BUTTON} onClick={remove} data-testid="columns-reduce">
        Remove empty column
      </Button>
    );
  }
  if (!reviewing) {
    return (
      <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => setReviewing(true)} data-testid="columns-reduce">
        Review populated content
      </Button>
    );
  }
  return (
    <div className="tw:flex tw:flex-col tw:gap-2" data-testid="columns-review">
      <NoteRow>
        Column {columns.length} holds {held === 1 ? "1 block" : `${held} blocks`}. Move {held === 1 ? "it" : "them"} into column {columns.length - 1}, or remove the column with {held === 1 ? "it" : "them"}.
      </NoteRow>
      <div className="tw:grid tw:grid-cols-3 tw:gap-2">
        <Button color="light" size="xs" onClick={moveThenRemove}>Move</Button>
        <Button color="light" size="xs" onClick={remove}>Remove</Button>
        <Button color="light" size="xs" onClick={() => setReviewing(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export function ChildrenSection({ composer, elementId, isOpen, onToggle }: { composer: Composer | null | undefined; elementId: string; isOpen?: boolean; onToggle?: () => void }) {
  useTreeVersion(composer);
  const el = composer?.elements.getElement(elementId);
  if (!composer || !el) return null;
  const children = el.getChildren();
  const item = uniformItem(el, children);

  const addBlank = () => {
    const last = children[children.length - 1];
    if (!last) return;
    writeElement(composer, el, `Add ${item}`, () => {
      const data = last.getData();
      const blank = composer.elements.createElement(data.type, {
        tagName: data.tagName,
        classes: [...(data.classes ?? [])],
        styles: { ...(data.styles ?? {}) },
      });
      composer.elements.addElement(blank, el.getId());
    });
  };

  return (
    <Section
      title="Children"
      isOpen={isOpen}
      onToggle={onToggle}
      action={
        <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="children-count">
          {children.length === 0 ? "Empty" : children.length === 1 ? "1 direct child" : `${children.length} direct children`}
        </span>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-children">
        {children.slice(0, SHOWN).map((c) => (
          <Button key={c.getId()} color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(c)} data-testid="children-open">
            {nameOf(c)} · {c.getTagName().toLowerCase()}
          </Button>
        ))}
        {children.length > SHOWN ? <NoteRow>{children.length - SHOWN} more in Layers.</NoteRow> : null}
        {item ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={addBlank} data-testid="children-add-blank">
            Add blank {item}
          </Button>
        ) : (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "add" })} data-testid="children-open-add">
            Open Add
          </Button>
        )}
        {item === "column" ? <ReduceColumns composer={composer} parent={el} columns={children} /> : null}
        <NoteRow>Each child keeps its own ID, styles and content. Selecting one edits that exact child.</NoteRow>
      </div>
    </Section>
  );
}

/** Commerce block types (B69/12 `249:74541`): editing them is planned. */
export const COMMERCE_TYPES: ReadonlySet<string> = new Set(["product-card", "product-grid", "product-detail", "cart-button"]);

/** B69/12: what a commerce block offers today — its existing text and
 *  media stay editable as ordinary children; product data is kept as saved. */
export function CommerceNoteSection({ isOpen, onToggle }: { isOpen?: boolean; onToggle?: () => void }) {
  return (
    <Section title="Existing content" isOpen={isOpen} onToggle={onToggle}>
      <NoteRow testId="inspector-commerce-note">Edit existing text and media through Canvas or Layers. Saved product attributes are preserved.</NoteRow>
      <NoteRow>Commerce editing is planned.</NoteRow>
    </Section>
  );
}
