import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Render one CSV cell: RFC-4180 quoting plus spreadsheet formula
 * neutralization. User-supplied values starting with = + - @ or a tab/CR
 * execute as formulas when the export opens in Excel/Sheets (`=cmd|...`
 * reaches the OS on Windows), so those get a leading apostrophe.
 */
export function csvCell(value: unknown): string {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
