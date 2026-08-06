/**
 * DrawerGallery — Templates board 641:2487 (Templates · gallery), the 320
 * drawer view Insert's TEMPLATES group lands on.
 *
 * Board layout: form Input search (10:16) · "PAGE TEMPLATES" section (16:16
 * header) as full-width thumb cards · "SECTION TEMPLATES" as 32h rows with
 * Free/Pro tier + › · flex spacer · bordered footer with the secondary
 * "Browse all templates" button (opens the expanded 700 gallery — the
 * pre-existing grid view).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, TextInput } from "@/editor/chrome-ui";
import { SITE_TEMPLATES, type TemplateItem } from "../templatesData";

interface DrawerGalleryProps {
  searchQ: string;
  onSearchChange: (q: string) => void;
  onOpenDetail: (id: string) => void;
  onBrowseAll?: () => void;
}

const SECTION_HEADER =
  "tw:flex tw:items-center tw:h-7 tw:px-4 tw:text-[11px] tw:leading-4 tw:font-medium tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]";

const matches = (t: TemplateItem, q: string) =>
  !q || t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q);

export const DrawerGallery: React.FC<DrawerGalleryProps> = ({
  searchQ, onSearchChange, onOpenDetail, onBrowseAll,
}) => {
  const q = searchQ.trim().toLowerCase();
  // `type` holds element-ish tags ("hero", …) for most entries — the real
  // page/section split in this catalog is pageCount: multi-page templates
  // carry it, section templates do not.
  const pages = SITE_TEMPLATES.filter((t) => t.pageCount != null && matches(t, q));
  const sections = SITE_TEMPLATES.filter((t) => t.pageCount == null && matches(t, q));

  return (
    <div className="tw:flex tw:flex-col tw:flex-1 tw:min-h-0" data-testid="tpl-drawer-gallery">
      {/* Board 641:2498: the FORM Input (10:16), always visible — not the
          Insert-style search band, and no toggle button. */}
      <div className="tw:px-2 tw:py-1.5">
        <TextInput
          type="text"
          value={searchQ}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search templates…"
          aria-label="Search templates"
        />
      </div>

      <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto">
        <div className={SECTION_HEADER}>PAGE TEMPLATES</div>
        {pages.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            className="tw:flex tw:flex-col tw:gap-1.5 tw:px-4 tw:py-2 tw:cursor-pointer tw:select-none hover:tw:bg-[var(--bk-bg-subtle)]"
            data-testid={`tpl-card-${t.id}`}
            onClick={() => onOpenDetail(t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetail(t.id); }
            }}
          >
            {/* Board thumb: full-width 88h, bg-subtle + border, rounded-6 —
                the template's gradient fills it when one exists. */}
            <div
              className="tw:h-[88px] tw:w-full tw:rounded-6 tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-subtle)]"
              style={t.gradient ? { background: t.gradient } : undefined}
              aria-hidden="true"
            />
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">
                {t.name}
              </span>
              {t.pageCount != null && (
                <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                  {t.pageCount} page{t.pageCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        ))}

        <div className={SECTION_HEADER}>SECTION TEMPLATES</div>
        {sections.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            className="tw:flex tw:items-center tw:gap-2 tw:h-8 tw:px-4 tw:cursor-pointer tw:select-none hover:tw:bg-[var(--bk-bg-subtle)]"
            data-testid={`tpl-row-${t.id}`}
            onClick={() => onOpenDetail(t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetail(t.id); }
            }}
          >
            <span className="tw:flex-1 tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
              {t.name}
            </span>
            <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
              {t.status === "premium" ? "Pro" : "Free"}
            </span>
            <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]" aria-hidden="true">›</span>
          </div>
        ))}

        {q && pages.length === 0 && sections.length === 0 && (
          <p className="tw:m-0 tw:px-4 tw:pt-6 tw:text-center tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
            Nothing matches &lsquo;{searchQ.trim()}&rsquo;.
          </p>
        )}
      </div>

      {/* Board 641:2543 panel footer: border-t, secondary bordered button. */}
      {onBrowseAll && (
        <div className="tw:flex tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:py-2.5 tw:shrink-0">
          <Button
            type="button"
            color="light"
            size="xs"
            className="tw:h-7 tw:rounded-8 tw:px-3 tw:text-[13px] tw:font-medium"
            data-testid="tpl-browse-all"
            onClick={onBrowseAll}
          >
            Browse all templates
          </Button>
        </div>
      )}
    </div>
  );
};
