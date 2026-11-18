/**
 * Table Block
 * Data table with headers and rows
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig, Composer } from "../types";
import { BLOCK_COLORS } from "../blockPalette";

/**
 * Build data table component.
 *
 * The inserted subtree is a scroll wrapper (`div.table-wrapper`, a plain
 * container) around the `<table>` itself, and it is the TABLE this returns
 * for selection: that element is the table, typed `table`. Typing the wrapper
 * `table` instead would make its stored "div" defer to the type's own tag
 * (`Element.getTagName`) and publish a `<table>` inside a `<table>`.
 *
 * Style keys are CSS's own kebab-case — the names the Inspector reads and
 * writes. As camelCase (`overflowX`) the wrapper's overflow read as unset in
 * Wrapper layout (2L9 245:44049).
 */
function buildTable(composer: Composer, parentId: string, dropIndex?: number): string | undefined {
  const tableWrapper = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "table-wrapper",
    },
    styles: {
      width: "100%",
      "overflow-x": "auto",
    },
  });

  composer.elements.addElement(tableWrapper, parentId, dropIndex);
  const wrapperId = tableWrapper.getId();

  const table = composer.elements.createElement("table", {
    tagName: "table",
    attributes: {
      class: "data-table",
    },
    styles: {
      width: "100%",
      "border-collapse": "collapse",
      background: BLOCK_COLORS.surface,
      "border-radius": "var(--buildrick-design-radius-md)",
      overflow: "hidden",
      "box-shadow": "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
  });
  composer.elements.addElement(table, wrapperId);
  const tableId = table.getId();

  // Table header
  const thead = composer.elements.createElement("container", {
    tagName: "thead",
    styles: {
      background: BLOCK_COLORS.surface,
    },
  });
  composer.elements.addElement(thead, tableId);

  const headerRow = composer.elements.createElement("container", {
    tagName: "tr",
  });
  composer.elements.addElement(headerRow, thead.getId());

  const headers = ["Name", "Email", "Status", "Actions"];
  headers.forEach((header) => {
    const th = composer.elements.createElement("container", {
      tagName: "th",
      styles: {
        padding: "14px var(--buildrick-design-space-4)",
        "text-align": "left",
        "font-weight": "600",
        "font-size": "var(--buildrick-design-font-size-xs)",
        color: BLOCK_COLORS.text,
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
        "border-bottom": "2px solid " + BLOCK_COLORS.border,
      },
    });
    composer.elements.addElement(th, headerRow.getId());

    const thText = composer.elements.createElement("text", {
      tagName: "span",
      content: header,
    });
    composer.elements.addElement(thText, th.getId());
  });

  // Table body
  const tbody = composer.elements.createElement("container", {
    tagName: "tbody",
  });
  composer.elements.addElement(tbody, tableId);

  // Sample data rows
  const rows = [
    { name: "John Doe", email: "john@example.com", status: "Active" },
    { name: "Jane Smith", email: "jane@example.com", status: "Pending" },
    { name: "Bob Johnson", email: "bob@example.com", status: "Inactive" },
  ];

  rows.forEach((row) => {
    const tr = composer.elements.createElement("container", {
      tagName: "tr",
      styles: {
        "border-bottom": "1px solid " + BLOCK_COLORS.border,
      },
    });
    composer.elements.addElement(tr, tbody.getId());

    // Name cell
    const tdName = composer.elements.createElement("container", {
      tagName: "td",
      styles: {
        padding: "14px var(--buildrick-design-space-4)",
        "font-weight": "500",
        color: "#1e293b",
      },
    });
    composer.elements.addElement(tdName, tr.getId());

    const nameText = composer.elements.createElement("text", {
      tagName: "span",
      content: row.name,
    });
    composer.elements.addElement(nameText, tdName.getId());

    // Email cell
    const tdEmail = composer.elements.createElement("container", {
      tagName: "td",
      styles: {
        padding: "14px var(--buildrick-design-space-4)",
        color: BLOCK_COLORS.text,
      },
    });
    composer.elements.addElement(tdEmail, tr.getId());

    const emailText = composer.elements.createElement("text", {
      tagName: "span",
      content: row.email,
    });
    composer.elements.addElement(emailText, tdEmail.getId());

    // Status cell
    const tdStatus = composer.elements.createElement("container", {
      tagName: "td",
      styles: {
        padding: "14px var(--buildrick-design-space-4)",
      },
    });
    composer.elements.addElement(tdStatus, tr.getId());

    const statusBadge = composer.elements.createElement("container", {
      tagName: "span",
      attributes: {
        class: `status-badge status-${row.status.toLowerCase()}`,
      },
      styles: {
        display: "inline-block",
        padding: "var(--buildrick-design-space-1) var(--buildrick-design-space-3)",
        "border-radius": "999px",
        "font-size": "var(--buildrick-design-font-size-xs)",
        "font-weight": "500",
        background:
          row.status === "Active" ? "#dcfce7" : row.status === "Pending" ? "#fef3c7" : "var(--buildrick-design-color-surface-muted)",
        color:
          row.status === "Active" ? "#166534" : row.status === "Pending" ? "#92400e" : "var(--buildrick-design-color-text-subtle)",
      },
    });
    composer.elements.addElement(statusBadge, tdStatus.getId());

    const statusText = composer.elements.createElement("text", {
      tagName: "span",
      content: row.status,
    });
    composer.elements.addElement(statusText, statusBadge.getId());

    // Actions cell
    const tdActions = composer.elements.createElement("container", {
      tagName: "td",
      styles: {
        padding: "14px var(--buildrick-design-space-4)",
      },
    });
    composer.elements.addElement(tdActions, tr.getId());

    const editBtn = composer.elements.createElement("button", {
      tagName: "button",
      attributes: {
        class: "table-action-btn",
      },
      styles: {
        padding: "6px var(--buildrick-design-space-3)",
        background: BLOCK_COLORS.surfaceSubtle,
        border: "none",
        "border-radius": "6px",
        "font-size": "var(--buildrick-design-font-size-xs)",
        "font-weight": "500",
        color: BLOCK_COLORS.text,
        cursor: "pointer",
      },
    });
    composer.elements.addElement(editBtn, tdActions.getId());

    const editText = composer.elements.createElement("text", {
      tagName: "span",
      content: "Edit",
    });
    composer.elements.addElement(editText, editBtn.getId());
  });

  return tableId;
}

export const tableBlockConfig: BlockBuildConfig = {
  id: "table",
  label: "Table",
  category: "Components",
  elementType: "table",
  build: buildTable,
};
