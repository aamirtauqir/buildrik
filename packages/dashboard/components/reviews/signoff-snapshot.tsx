"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/dashboard/primitives";

/**
 * The frozen site on the client sign-off page (boards 4418:121903 / 173613 /
 * 173649), rendered in a fully-sandboxed iframe (no scripts, unique origin) so
 * the reviewed site's markup can never touch the review page. Always the
 * snapshot taken at send, never the live draft (contracts §1.6).
 */

/** `name` is the page's own name where the caller knows it (the /share draft
 *  preview); a review snapshot carries only the path, so the label falls back
 *  to one derived from it. */
export type SnapshotPage = { path: string; html: string; name?: string };

const labelOf = (page: SnapshotPage): string => page.name || pageLabel(page.path);

/** "index.html" → "Home", "menu.html" → "Menu". */
export function pageLabel(path: string): string {
  const base = path.replace(/\.html$/, "").replace(/\/index$/, "").replace(/^index$/, "") || "Home";
  const last = base.split("/").pop() ?? base;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

/**
 * The page segment of the header breadcrumb ("Bella Cucina · Home · …").
 *
 * The boards move between pages from the snapshot's own nav (Home → Menu →
 * Contact), which a script-less sandboxed frame cannot do. The page switch the
 * old tab strip offered therefore lives here, in the crumb that names the page:
 * plain text for a one-page snapshot, a quiet menu when there are more.
 */
export function PageCrumb({
  pages,
  active,
  onPick,
}: {
  pages: SnapshotPage[];
  active: number;
  onPick: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = pages[active] ? labelOf(pages[active]) : "Home";
  if (pages.length < 2) return <span>{current}</span>;
  return (
    <span className="relative inline-flex">
      <Button
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Page: ${current}. Change page`}
        onClick={() => setOpen((v) => !v)}
        className="tw:h-auto tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[12px] tw:font-normal tw:text-[#4B5563] tw:shadow-none tw:hover:bg-transparent tw:hover:text-[#111827]"
      >
        {current}
        <ChevronDown size={12} aria-hidden="true" className="ml-0.5" />
      </Button>
      {open ? (
        <span
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 flex min-w-[140px] flex-col rounded-lg border border-[#E5E7EB] bg-white p-1 shadow-md"
        >
          {pages.map((p, i) => (
            <Button
              key={p.path}
              role="menuitem"
              variant="ghost"
              size="sm"
              onClick={() => {
                onPick(i);
                setOpen(false);
              }}
              className={`tw:justify-start tw:border-transparent tw:shadow-none tw:text-[12px] ${
                i === active ? "tw:font-semibold tw:text-[#111827]" : "tw:font-normal tw:text-[#4B5563]"
              }`}
            >
              {labelOf(p)}
            </Button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

/**
 * The snapshot card. `scale` < 1 draws the page small inside a fixed box — the
 * commenting board (4418:121999) shows the whole page shrunk beside the notes,
 * not a narrower reflow of it.
 */
export function SnapshotFrame({
  page,
  scale = 1,
  height,
}: {
  page: SnapshotPage | null;
  scale?: number;
  height: number;
}) {
  const width = 680;
  if (!page) {
    return (
      <div
        className="mx-auto flex items-center justify-center rounded-lg border border-dashed border-[#D1D5DB] bg-white"
        style={{ width: width * scale, height: height * scale }}
      >
        <p className="text-[13px] text-[#6B7280]">Preview unavailable for this version.</p>
      </div>
    );
  }
  return (
    <div
      className="mx-auto overflow-hidden bg-white shadow-md"
      style={{ width: width * scale, height: height * scale }}
    >
      <iframe
        title="Site preview"
        srcDoc={page.html}
        sandbox=""
        className="block origin-top-left border-0 bg-white"
        style={{ width, height, transform: scale === 1 ? undefined : `scale(${scale})` }}
      />
    </div>
  );
}
