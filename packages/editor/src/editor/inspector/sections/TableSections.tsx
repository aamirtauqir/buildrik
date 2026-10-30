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
 * A cell (245:43495, C14) gets "Cell" — Native tag td / th, Edit cell
 * content, Column / Row span, Back to the table — and "Header associations"
 * (Scope on a th, Headers). The scroll wrapper (245:44049, C15) gets
 * "Wrapper layout" on Style — Width, Overflow X / Y, Back to the table.
 *
 * Every write passes the lock gate (P-1) and is one Undo.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { writeElement } from "@/engine/commands/commandOperations";
import { Button } from "@/editor/chrome-ui";
import { InputWithUnit, Section, SelectRow, type SectionTier } from "../shared/controls";
import { GROUP_TITLE } from "../shared/controls/controlClasses";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import type { BaseStyleSectionProps } from "./registry/_shared";
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

/** The first cell spanning more than one column or row, named like a sheet
 *  ("B2": column letter, row number counting every row of the table). */
function spanningCellOf(table: Element): { cell: Element; name: string; span: string } | null {
  const rows = table.getDescendants().filter((d) => tag(d) === "tr");
  for (let r = 0; r < rows.length; r++) {
    const cells = rows[r].getChildren().filter((c) => tag(c) === "td" || tag(c) === "th");
    for (let c = 0; c < cells.length; c++) {
      const cols = Number(cells[c].getAttribute("colspan") ?? 1);
      const rws = Number(cells[c].getAttribute("rowspan") ?? 1);
      if (cols > 1 || rws > 1) {
        const span = cols > 1 ? `${cols} columns` : `${rws} rows`;
        return { cell: cells[c], name: `${String.fromCharCode(65 + Math.min(c, 25))}${r + 1}`, span };
      }
    }
  }
  return null;
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

  /* C16 245:44573: a cell that spans more than one column or row makes the
     table non-rectangular — row / column commands would have to flatten or
     guess, so they stand down; the structure is kept exactly as authored. */
  const spanning = spanningCellOf(table);
  if (spanning) {
    const select = (section: string) => {
      composer.selection.select(spanning.cell);
      setTimeout(() => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section }), 0);
    };
    return (
      <Section title="Structure" stateTitle="Complex table preserved" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-table-structure">
        <NoteRow testId="table-complex">
          {spanning.name} spans {spanning.span}. Rectangular row and column commands are unavailable for this structure.
        </NoteRow>
        <div className="tw:flex tw:flex-col tw:gap-2">
          <Button color="light" size="xs" className={WIDE_BUTTON} disabled>
            Add blank row
          </Button>
          <Button size="xs" className={`${WIDE_BUTTON} tw:text-white!`} onClick={() => select("table-cell")} data-testid="table-edit-spanning">
            Edit {spanning.name} content
          </Button>
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => select("table-cell")} data-testid="table-inspect-native">
            Inspect native attributes
          </Button>
        </div>
        <NoteRow>No flattening or normalization on selection. Existing spans, IDs, header associations and nested content remain.</NoteRow>
      </Section>
    );
  }

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

/** The table a cell or wrapper belongs to: an ancestor, or the wrapper's child. */
function tableOf(el: Element | null | undefined): Element | null {
  for (let at = el?.getParent() ?? null; at; at = at.getParent()) if (at.getType() === "table") return at;
  return el?.getChildren().find((c) => c.getType() === "table") ?? null;
}

const isCellTag = (el: Element | null | undefined) => Boolean(el) && (tag(el!) === "td" || tag(el!) === "th");

/** Is this a table cell — a td / th inside a table? */
export const isTableCell = (el: Element | null | undefined) => isCellTag(el) && Boolean(tableOf(el));
/** Is this a table's scroll wrapper — the div holding a table? */
export const isTableWrapper = (el: Element | null | undefined) =>
  Boolean(el) && tag(el!) === "div" && (el!.getChildren().some((c) => c.getType() === "table"));

function BackToTable({ composer, table }: { composer: Composer; table: Element | null }) {
  if (!table) return null;
  return (
    <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(table)}>
      Back to {getLayerName(table) ?? "table"}
    </Button>
  );
}

const SCOPES = [
  { value: "col", label: "Column" },
  { value: "row", label: "Row" },
  { value: "colgroup", label: "Column group" },
  { value: "rowgroup", label: "Row group" },
];

export const TableCellSection: React.FC<TableSectionProps> = ({ composer, elementId, isOpen, onToggle, tier }) => {
  useTreeVersion(composer);
  const cell = composer?.elements.getElement(elementId);
  if (!composer || !cell) return null;
  const write = (label: string, fn: () => void) => writeElement(composer, cell, label, fn);
  const setAttr = (name: string) => (value: string) =>
    write(`cell-${name}`, () => {
      if (value.trim()) cell.setAttribute(name, value.trim());
      else cell.removeAttribute(name);
    });
  const content = cell.getChildren()[0];
  const isHeader = tag(cell) === "th";
  return (
    <Section title="Cell" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-table-cell">
      <SelectRow
        label="Native tag"
        placeholder={null}
        value={tag(cell)}
        options={[
          { value: "td", label: "td" },
          { value: "th", label: "th" },
        ]}
        onChange={(v) => write("cell-tag", () => cell.setTagName(v))}
      />
      {content ? (
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(content)}>
          Edit cell content
        </Button>
      ) : null}
      <CommitRow label="Column span" value={cell.getAttribute("colspan") ?? ""} placeholder="1 · implicit" onCommit={setAttr("colspan")} testId="cell-colspan" />
      <CommitRow label="Row span" value={cell.getAttribute("rowspan") ?? ""} placeholder="1 · implicit" onCommit={setAttr("rowspan")} testId="cell-rowspan" />
      <NoteRow>Remove span differs from Set 1. Row span 0 means to the end of this row group.</NoteRow>
      <BackToTable composer={composer} table={tableOf(cell)} />
      <div className={GROUP_TITLE}>Header associations</div>
      <NoteRow>Scope is available only for a th header. Existing headers references are preserved.</NoteRow>
      {isHeader ? (
        <SelectRow label="Scope" value={cell.getAttribute("scope") ?? ""} placeholder="Auto" options={SCOPES} onChange={setAttr("scope")} />
      ) : null}
      <CommitRow label="Headers" value={cell.getAttribute("headers") ?? ""} placeholder="header ids" onCommit={setAttr("headers")} testId="cell-headers" />
    </Section>
  );
};

const OVERFLOW = [
  { value: "visible", label: "Visible" },
  { value: "auto", label: "Auto" },
  { value: "scroll", label: "Scroll" },
  { value: "hidden", label: "Hidden" },
];

export const TableWrapperSection: React.FC<BaseStyleSectionProps & { composer?: Composer | null; elementId: string }> = ({
  styles,
  onChange,
  isOpen,
  onToggle,
  composer,
  elementId,
}) => {
  const wrapper = composer?.elements.getElement(elementId);
  return (
    <Section title="Wrapper layout" isOpen={isOpen} onToggle={onToggle} id="inspector-section-table-wrapper">
      <InputWithUnit label="Width" property="width" units={["%", "px", "rem", "vw"]} value={styles.width || ""} onChange={(v) => onChange("width", v)} />
      <SelectRow label="Overflow X" property="overflow-x" value={styles["overflow-x"] || "visible"} options={OVERFLOW} onChange={(v) => onChange("overflow-x", v)} />
      <SelectRow label="Overflow Y" property="overflow-y" value={styles["overflow-y"] || "visible"} options={OVERFLOW} onChange={(v) => onChange("overflow-y", v)} />
      <NoteRow>These values belong to the wrapper. Table cells keep native table layout.</NoteRow>
      {composer ? <BackToTable composer={composer} table={tableOf(wrapper)} /> : null}
    </Section>
  );
};
