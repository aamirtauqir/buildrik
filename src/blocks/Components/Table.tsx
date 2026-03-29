/**
 * Table Block
 * Data table with headers and rows
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig, Composer } from "../types";

/**
 * Build data table component
 */
function buildTable(composer: Composer, parentId: string, dropIndex?: number): string | undefined {
  const tableWrapper = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "table-wrapper",
    },
    styles: {
      width: "100%",
      overflowX: "auto",
    },
  });

  composer.elements.addElement(tableWrapper, parentId, dropIndex);
  const wrapperId = tableWrapper.getId();

  const table = composer.elements.createElement("container", {
    tagName: "table",
    attributes: {
      class: "data-table",
    },
    styles: {
      width: "100%",
      borderCollapse: "collapse",
      background: "#ffffff",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
  });
  composer.elements.addElement(table, wrapperId);
  const tableId = table.getId();

  // Table header
  const thead = composer.elements.createElement("container", {
    tagName: "thead",
    styles: {
      background: "#f8fafc",
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
        padding: "14px 16px",
        textAlign: "left",
        fontWeight: "600",
        fontSize: "12px",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: "2px solid #e2e8f0",
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
        borderBottom: "1px solid #e2e8f0",
      },
    });
    composer.elements.addElement(tr, tbody.getId());

    // Name cell
    const tdName = composer.elements.createElement("container", {
      tagName: "td",
      styles: {
        padding: "14px 16px",
        fontWeight: "500",
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
        padding: "14px 16px",
        color: "#64748b",
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
        padding: "14px 16px",
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
        padding: "4px 12px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: "500",
        background:
          row.status === "Active" ? "#dcfce7" : row.status === "Pending" ? "#fef3c7" : "#f3f4f6",
        color:
          row.status === "Active" ? "#166534" : row.status === "Pending" ? "#92400e" : "#6b7280",
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
        padding: "14px 16px",
      },
    });
    composer.elements.addElement(tdActions, tr.getId());

    const editBtn = composer.elements.createElement("button", {
      tagName: "button",
      attributes: {
        class: "table-action-btn",
      },
      styles: {
        padding: "6px 12px",
        background: "#f1f5f9",
        border: "none",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "500",
        color: "#64748b",
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

  return wrapperId;
}

export const tableBlockConfig: BlockBuildConfig = {
  id: "table",
  label: "Table",
  category: "Components",
  elementType: "container",
  build: buildTable,
};
