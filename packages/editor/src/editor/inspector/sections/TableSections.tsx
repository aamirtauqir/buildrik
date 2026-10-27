/**
 * Table — 2L9 245:42929 (C13): a table's Content is its structure and its
 * accessibility, read off the real `<table>` tree the Table block builds
 * (`thead > tr > th`, `tbody > tr > td`, the `div.table-wrapper` around it).
 *
 *   Structure      Body rows [2] · Columns [3]
 *                  [ Add blank row ]            a copy of the last body row's
 *                                               cells — tag and appearance, no
 *                                               content
 *                  [ Edit A1 · Name ]           selects that cell
 *                  [ Inspect scroll wrapper ]   selects the wrapper
 *                  Add copies cell type and appearance only. …
 *   Accessibility  Caption [ … ]                its <caption>, made / removed
 *
 * Every write passes the lock gate on the table (P-1) and is one Undo.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { writeElement } from "@/engine/commands/commandOperations";
import { Button } from "@/editor/chrome-ui";
import { Section, type SectionTier } from "../shared/controls";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";
import { CommitRow, NoteRow } from "./behaviourRows";
import { EVENTS } from "@/shared/constants/events";

interface TableSectionProps {
  composer: Composer | null;
  elementId: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const tag = (el: Element) => el.getTagName().toLowerCase();
const childrenTagged = (el: Element | undefined | null, name: string) => (el?.getChildren() ?? []).filter((c) => tag(c) === name);
const textOf = (el: Element | undefined): string => {
  if (!el) return "";
  const own = el.getContent?.().replace(/<[^>]*>/g, "").trim();
  return own || el.getChildren().map(textOf).join(" ").trim();
};

/** The table's parts, as far as the tree has them. */
function partsOf(table: Element | undefined) {
  const thead = childrenTagged(table, "thead")[0];
  const tbody = childrenTagged(table, "tbody")[0];
  const headerCells = childrenTagged(childrenTagged(thead, "tr")[0], "th");
  const bodyRows = childrenTagged(tbody, "tr");
  const firstRow = bodyRows[0]?.getChildren() ?? [];
  const caption = childrenTagged(table, "caption")[0];
  const wrapper = table?.getParent();
  return {
    tbody,
    bodyRows,
    columns: Math.max(headerCells.length, firstRow.length),
    headerCells,
    firstCell: firstRow[0],
    caption,
    wrapper: wrapper && tag(wrapper) === "div" ? wrapper : null,
  };
}

/* Rows and a caption come and go as elements, not as an update of the
   table: re-read on every structural event (and undo / redo). */
const TREE_EVENTS = [EVENTS.ELEMENT_UPDATED, EVENTS.ELEMENT_CREATED, EVENTS.ELEMENT_DELETED, EVENTS.ELEMENT_MOVED, EVENTS.HISTORY_UNDO, EVENTS.HISTORY_REDO] as const;

function useTreeVersion(composer: Composer | null) {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    for (const e of TREE_EVENTS) composer.on(e, bump);
    return () => {
      for (const e of TREE_EVENTS) composer.off(e, bump);
    };
  }, [composer]);
}

const ROW_LINE = "bdi-row-ctrl";
const VALUE_BOX =
  "tw:flex tw:h-6 tw:min-w-0 tw:flex-1 tw:items-center tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:text-[12px] tw:text-[var(--bk-ink)]";

function CountRow({ label, value }: { label: string; value: number }) {
  return (
    <div className={ROW_LINE}>
      <span className="bdi-lb">{label}</span>
      <span className="bdi-row-content">
        <span className={VALUE_BOX} aria-label={`${label} ${value}`} data-testid={`table-${label.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </span>
      </span>
    </div>
  );
}

export const TableStructureSection: React.FC<TableSectionProps> = ({ composer, elementId, isOpen, onToggle, tier }) => {
  useTreeVersion(composer);
  const table = composer?.elements.getElement(elementId);
  if (!composer || !table) return null;
  const parts = partsOf(table);

  const addBlankRow = () => {
    const last = parts.bodyRows[parts.bodyRows.length - 1];
    if (!parts.tbody || !last) return;
    writeElement(composer, table, "table-add-row", () => {
      const row = composer.elements.createElement("container", { tagName: "tr", styles: { ...last.getStyles() } });
      composer.elements.addElement(row, parts.tbody!.getId());
      for (const cell of last.getChildren()) {
        const blank = composer.elements.createElement("container", { tagName: tag(cell), styles: { ...cell.getStyles() } });
        composer.elements.addElement(blank, row.getId());
      }
    });
  };

  const header = parts.headerCells[0] ? textOf(parts.headerCells[0]) : "";
  return (
    <Section title="Structure" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-table-structure">
      <CountRow label="Body rows" value={parts.bodyRows.length} />
      <CountRow label="Columns" value={parts.columns} />
      <div className="tw:flex tw:flex-col tw:gap-2 tw:pt-1">
        <Button color="light" size="xs" className={WIDE_BUTTON} disabled={!parts.tbody || parts.bodyRows.length === 0} onClick={addBlankRow}>
          Add blank row
        </Button>
        {parts.firstCell ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(parts.firstCell!)}>
            Edit A1{header ? ` · ${header}` : ""}
          </Button>
        ) : null}
        {parts.wrapper ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(parts.wrapper!)}>
            Inspect scroll wrapper
          </Button>
        ) : null}
      </div>
      <NoteRow>Add copies cell type and appearance only. Duplicate is a separate content-copy command.</NoteRow>
    </Section>
  );
};

export const TableAccessibilitySection: React.FC<TableSectionProps> = ({ composer, elementId, isOpen, onToggle, tier }) => {
  useTreeVersion(composer);
  const table = composer?.elements.getElement(elementId);
  if (!composer || !table) return null;
  const { caption } = partsOf(table);

  const writeCaption = (text: string) =>
    writeElement(composer, table, "table-caption", () => {
      const value = text.trim();
      if (!value) {
        if (caption) composer.elements.removeElement(caption.getId());
        return;
      }
      if (caption) caption.setContent(value);
      else {
        const made = composer.elements.createElement("container", { tagName: "caption", content: value });
        /* <caption> must be the table's first child. */
        composer.elements.addElement(made, table.getId(), 0);
      }
    });

  return (
    <Section title="Accessibility" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-table-accessibility">
      <CommitRow label="Caption" value={caption ? textOf(caption) : ""} placeholder="Describe this table" onCommit={writeCaption} testId="table-caption" />
    </Section>
  );
};
