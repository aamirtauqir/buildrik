/**
 * TemplatePreview — a page template's preview inside the full-canvas
 * Templates view (decision #24; board 4418:53202). It replaced
 * TemplatePreviewModal: the preview is a state of the view, not a dialog over
 * it, and its two actions are the board's — Create page (a new page from the
 * template) and Replace page… (this page's content, through the replace
 * confirm when the page has content). Esc returns to the catalogue.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TemplateItem } from "./templatesData";
import { Button } from "@/editor/chrome-ui";

export interface TemplatePreviewProps {
  template: TemplateItem;
  /** The active page — the one Replace page… would overwrite. */
  pageName?: string;
  onCreatePage: (template: TemplateItem) => void;
  onReplacePage: (template: TemplateItem) => void;
  onBack: () => void;
  /** G2-097: the pages this template was applied to — the "Used in" tab of the
   *  retired usage dialog, now a line on the preview. */
  usedOn?: ReadonlyArray<{ id: string; name: string }>;
  /** Jump to one of those pages (closes the view). */
  onOpenPage?: (pageId: string) => void;
  /** A dialog over the preview (the Create page / Replace confirm) owns
   *  Escape while it is open — Escape closes it, not the preview. */
  dialogOpen?: boolean;
}

type ViewportMode = "desktop" | "tablet" | "mobile";

const VIEWPORTS: { id: ViewportMode; label: string; width: number }[] = [
  { id: "desktop", label: "Desktop", width: 1100 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "mobile", label: "Mobile", width: 375 },
];

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  pageName,
  onCreatePage,
  onReplacePage,
  onBack,
  dialogOpen = false,
  usedOn = [],
  onOpenPage,
}) => {
  const [viewport, setViewport] = React.useState<ViewportMode>("desktop");
  const width = VIEWPORTS.find((v) => v.id === viewport)?.width ?? 1100;

  /* Escape belongs to the preview: back to the catalogue, not out of the view. */
  React.useEffect(() => {
    if (dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onBack();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onBack, dialogOpen]);

  const isSaved = template.category === "my-templates";
  return (
    <div className="tw:flex tw:h-full tw:min-h-0 tw:flex-col" data-testid="tpl-ws-preview">
      {/* 4418:53202 head: the name at 24, "Page template · Own colours and
          typography", then Create page (accent) and Replace page… (red). */}
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-4 tw:border-b tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-8 tw:py-5">
        <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-1">
          <h2 className="tw:m-0 tw:text-[length:var(--bk-text-24)] tw:leading-8 tw:font-semibold tw:text-[var(--bk-ink)]">{template.name}</h2>
          <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink-muted)]" data-testid="tpl-ws-preview-kind">
            {isSaved ? "Saved template · Styles captured with it" : "Page template · Own colours and typography"}
          </p>
          {usedOn.length > 0 && (
            <p className="tw:m-0 tw:flex tw:flex-wrap tw:items-center tw:gap-1 tw:text-[length:var(--bk-text-12)] tw:text-[var(--bk-ink-soft)]" data-testid="tpl-ws-used-on">
              Used on
              {usedOn.map((pg) => (
                <Button key={pg.id} color="light" size="xs" variant="link" className="tw:min-h-0 tw:p-0" onClick={() => onOpenPage?.(pg.id)}>
                  {pg.name}
                </Button>
              ))}
            </p>
          )}
        </div>
        <div className="tw:flex tw:flex-none tw:items-center tw:gap-3">
          <Button size="sm" onClick={() => onCreatePage(template)}>
            Create page
          </Button>
          <Button
            size="sm"
            data-testid="tpl-ws-replace"
            className="tw:border-0 tw:bg-[var(--bk-error)] tw:text-[var(--bk-accent-on)] tw:enabled:hover:bg-[var(--bk-error-text)] tw:focus:ring-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]"
            onClick={() => onReplacePage(template)}
          >
            Replace page…
          </Button>
        </div>
      </div>
      <div className="tw:relative tw:flex tw:min-h-0 tw:flex-1 tw:justify-center tw:overflow-auto tw:bg-[var(--bk-bg-subtle)] tw:p-6">
        {/* The width toggle is kept, off-board (owner: never silently remove
            a capability — designer notes): quiet, at the well's corner. */}
        <div className="tw:absolute tw:top-2 tw:right-3 tw:flex tw:gap-1" role="group" aria-label="Preview width">
          {VIEWPORTS.map((v) => (
            <Button
              key={v.id}
              color="light"
              size="xs"
              aria-pressed={viewport === v.id}
              className={`tw:h-6 tw:min-h-0 tw:border-0 tw:px-2 tw:text-[length:var(--bk-text-11)] ${
                viewport === v.id ? "tw:bg-[var(--bk-gray-200)]" : "tw:bg-transparent"
              }`}
              onClick={() => setViewport(v.id)}
            >
              {v.label}
            </Button>
          ))}
        </div>
        <iframe
          className="tw:mt-4 tw:h-full tw:min-h-[480px] tw:max-w-full tw:rounded tw:border-0 tw:bg-white tw:[box-shadow:var(--bk-shadow-raised)]"
          style={{ width }}
          title={`Preview: ${template.name}`}
          sandbox="allow-same-origin"
          srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0">${template.html}</body></html>`}
        />
      </div>
      {/* 4418:53202 foot line. */}
      <div
        className="tw:flex-none tw:border-t tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-8 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink-soft)]"
        data-testid="tpl-ws-preview-foot"
      >
        {pageName
          ? `Create a new page or replace ${pageName}. Replacing saves a backup version to History first.`
          : "Create a new page from this template."}
      </div>
    </div>
  );
};
