/**
 * Minimal RFC 4180 CSV parser — no external dependency. Handles quoted
 * fields (commas/newlines inside quotes), doubled-quote escaping (`""` → `"`),
 * and both `\r\n` and `\n` line endings. Used server-side for CMS CSV import
 * (`server/services/cms.service.ts`) so parsing happens at the write
 * boundary, not in the browser.
 *
 * Every row (including the header) is returned as an array of trimmed-of-BOM
 * strings; ragged rows (fewer/more columns than the header) are returned as-is
 * — the caller decides how to handle a short/long row.
 *
 * @license BSD-3-Clause
 */

/** Parses CSV text into rows of string cells. A trailing blank line is
 *  dropped; blank lines in the middle of the file become `[""]` rows and are
 *  left for the caller to skip. */
export function parseCsvText(text: string): string[][] {
  // Strip a leading UTF-8 BOM (common from Excel exports).
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = input.length;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (i < n) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      endField();
      i += 1;
      continue;
    }
    if (c === "\r") {
      // Treat \r\n and a lone \r as one line break.
      if (input[i + 1] === "\n") i += 1;
      endRow();
      i += 1;
      continue;
    }
    if (c === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  // Last field/row, unless the file ended cleanly on a line break (no
  // trailing empty row to emit in that case).
  if (field !== "" || row.length > 0) endRow();

  return rows;
}
