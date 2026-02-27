/**
 * History Formatter
 * Pure functions for converting history entries/patches into UI-friendly labels and change lists.
 * No class state — all inputs are explicit parameters.
 *
 * @module engine/HistoryFormatter
 * @license BSD-3-Clause
 */

import type { HistoryEntry, HistoryChange, HistoryDisplayEntry } from "./historyTypes";
import type { Patch, PatchOperation } from "./utils/JsonPatch";

/**
 * Build display entries from an undo stack for the history panel UI.
 * Returns entries in reverse chronological order (newest first).
 * Skips index 0 (initial state).
 */
export function buildHistoryDisplayEntries(undoStack: HistoryEntry[]): HistoryDisplayEntry[] {
  const entries: HistoryDisplayEntry[] = [];

  for (let i = undoStack.length - 1; i >= 1; i--) {
    const entry = undoStack[i];
    const rawLabel = entry.label ?? "";
    const friendlyLabel = rawLabel
      ? formatTransactionLabel(rawLabel)
      : generateLabelFromEntry(entry);

    const displayEntry: HistoryDisplayEntry = {
      id: `undo-${i}`,
      index: i,
      timestamp: entry.timestamp,
      label: friendlyLabel,
      type: entry.type,
      changes: entry.type === "patch" ? formatPatchChanges(entry.patch) : [],
    };
    entries.push(displayEntry);
  }

  return entries;
}

/**
 * Generate a user-friendly label from an entry when no explicit label exists.
 */
export function generateLabelFromEntry(entry: HistoryEntry): string {
  if (entry.type === "checkpoint") {
    return "Checkpoint";
  }

  if (entry.label) {
    return formatTransactionLabel(entry.label);
  }

  const patch = entry.patch;
  if (patch.length === 0) return "No changes";

  const firstOp = patch[0];
  const pathParts = firstOp.path.split("/").filter(Boolean);

  if (pathParts.includes("elements") || pathParts.includes("children")) {
    if (firstOp.op === "add") return "Added element";
    if (firstOp.op === "remove") return "Removed element";
    if (firstOp.op === "replace") {
      if (pathParts.includes("styles") || pathParts.includes("style")) {
        const styleProp = pathParts[pathParts.length - 1];
        if (styleProp && styleProp !== "styles" && styleProp !== "style") {
          return `Changed ${formatPropertyName(styleProp)}`;
        }
        return "Changed style";
      }
      if (pathParts.includes("content") || pathParts.includes("text")) {
        return "Edited text";
      }
      return "Updated element";
    }
  }

  if (pathParts.includes("pages")) {
    if (firstOp.op === "add") return "Added page";
    if (firstOp.op === "remove") return "Removed page";
    return "Updated page";
  }

  if (pathParts.includes("components")) {
    if (firstOp.op === "add") return "Created component";
    if (firstOp.op === "remove") return "Removed component";
    return "Updated component";
  }

  if (pathParts.includes("selection")) {
    return "Changed selection";
  }

  return `${patch.length} change${patch.length > 1 ? "s" : ""}`;
}

/**
 * Convert a kebab-case transaction label to a user-friendly Title Case string.
 */
export function formatTransactionLabel(label: string): string {
  const labelMap: Record<string, string> = {
    "apply-template": "Applied template",
    "insert-block-sidebar": "Added block",
    "style-change": "Changed style",
    "style-batch": "Changed styles",
    "import-html-to-active-page": "Imported HTML",
    "insert-html-to-element": "Inserted HTML",
    "variant-change": "Changed variant",
    "instance-sync": "Synced component",
    "move-layer": "Moved layer",
    "Add Element": "Added element",
  };

  if (labelMap[label]) {
    return labelMap[label];
  }

  return label
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Convert a CSS property name (camelCase) to a user-friendly spaced string.
 */
export function formatPropertyName(prop: string): string {
  const propMap: Record<string, string> = {
    backgroundColor: "background color",
    fontSize: "font size",
    fontFamily: "font",
    fontWeight: "font weight",
    lineHeight: "line height",
    letterSpacing: "letter spacing",
    textAlign: "text alignment",
    borderRadius: "border radius",
    borderColor: "border color",
    borderWidth: "border width",
    marginTop: "top margin",
    marginBottom: "bottom margin",
    marginLeft: "left margin",
    marginRight: "right margin",
    paddingTop: "top padding",
    paddingBottom: "bottom padding",
    paddingLeft: "left padding",
    paddingRight: "right padding",
    boxShadow: "shadow",
    opacity: "opacity",
    width: "width",
    height: "height",
    display: "display",
    flexDirection: "flex direction",
    justifyContent: "alignment",
    alignItems: "alignment",
    gap: "gap",
    color: "text color",
  };

  if (propMap[prop]) return propMap[prop];

  return prop
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .trim();
}

/**
 * Format patch operations into human-readable HistoryChange list (max 10 shown).
 */
export function formatPatchChanges(patch: Patch): HistoryChange[] {
  const changes: HistoryChange[] = [];
  const maxChanges = 10;

  for (let i = 0; i < Math.min(patch.length, maxChanges); i++) {
    changes.push(formatSingleChange(patch[i]));
  }

  if (patch.length > maxChanges) {
    changes.push({
      property: "...",
      operation: "info",
      description: `and ${patch.length - maxChanges} more changes`,
    });
  }

  return changes;
}

/**
 * Format a single patch operation into a human-readable HistoryChange.
 */
export function formatSingleChange(op: PatchOperation): HistoryChange {
  const pathParts = op.path.split("/").filter(Boolean);
  let property = pathParts[pathParts.length - 1] ?? "root";

  if (pathParts.includes("styles") || pathParts.includes("style")) {
    property = pathParts[pathParts.length - 1] ?? property;
  } else if (pathParts.includes("children")) {
    property = "child element";
  } else if (pathParts.includes("elements")) {
    const elementIndex = pathParts.indexOf("elements");
    if (elementIndex + 1 < pathParts.length) {
      property = `element[${pathParts[elementIndex + 1]}]`;
    }
  }

  const oldValue = formatValue(op.oldValue);
  const newValue = formatValue(op.value);

  let description = "";
  switch (op.op) {
    case "add":
      description = `+ ${newValue}`;
      break;
    case "remove":
      description = `- ${oldValue}`;
      break;
    case "replace":
      description = `${oldValue} → ${newValue}`;
      break;
  }

  return {
    property,
    operation: op.op,
    oldValue: op.oldValue,
    newValue: op.value,
    description,
  };
}

/**
 * Format an arbitrary value for display, truncating long strings/objects.
 */
export function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "null";
  if (typeof value === "string") {
    return value.length > 20 ? `"${value.slice(0, 17)}..."` : `"${value}"`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    return keys.length > 2 ? `{${keys.slice(0, 2).join(", ")}...}` : `{${keys.join(", ")}}`;
  }
  return String(value);
}
