/**
 * PageSwitcher — the bottom bar's current page and the menu that changes it
 * (Figma 2L9 `Shell/BottomBar` Context=Editor 497:99485, menu 558:4419).
 *
 * Replaces the page tab bar (deleted 2026-10-22): tabs did not survive a site
 * with 100 pages, a menu with search reaches any of them in two steps. What
 * the tabs carried is kept — the home glyph, the unsaved dot, and "Add page".
 *
 * Open state is the caller's, so the chord (useEditorShortcuts →
 * UI_TOGGLE_PAGE_SWITCHER) and the button drive one menu.
 *
 * The board prints "⌘P to switch"; ⌘P is Preview in code
 * (`authority: code:shortcut-cmd-p-is-preview`), so the chord is ⇧⌘O on macOS
 * and Ctrl+Alt+O elsewhere.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronDown, File, House } from "lucide-react";
import { Button, PageSwitcherMenu, Popover, plural } from "@/editor/chrome-ui";
import { isMac } from "@/editor/canvas/menus/shortcutHint";
import type { PageSummary } from "@/shared/types";
import { pageSwitcherHint } from "./pageSwitcherChord";

export interface PageSwitcherProps {
  pages: readonly PageSummary[];
  activePageId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  onManagePages: () => void;
  onAddPage: () => void;
  /** Rows listed but not openable, with this reason (the site is not loaded). */
  disabledReason?: string;
}

export function PageSwitcher({
  pages,
  activePageId,
  open,
  onOpenChange,
  onSelect,
  onManagePages,
  onAddPage,
  disabledReason,
}: PageSwitcherProps) {
  const mac = isMac();
  const hint = pageSwitcherHint(mac);
  const active = pages.find((p) => p.id === activePageId) ?? null;
  const statics = pages.filter((p) => p.kind === "static").length;
  const templates = pages.length - statics;
  const count = [plural(statics, "page"), templates ? plural(templates, "template") : null, `${hint} to switch`]
    .filter(Boolean)
    .join(" · ");
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);
  const then = (fn: () => void) => () => {
    close();
    fn();
  };

  return (
    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3" data-testid="page-switcher">
      <Popover
        open={open}
        onClose={close}
        placement="top"
        portal
        label="Switch page"
        className="tw:min-w-0! tw:p-1.5!"
        /* my-1 grows the anchor to the bar's full 32, so the menu opens 4px
           above the bar rather than over its top edge. */
        trigger={
          <Button
            ref={triggerRef}
            variant="ghost"
            size="xs"
            className="tw:my-1 tw:h-6 tw:min-w-0 tw:gap-1.5 tw:px-1.5 tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink)]"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-keyshortcuts={mac ? "Shift+Meta+O" : "Control+Alt+O"}
            title={`Switch page (${hint})`}
            data-testid="page-switcher-trigger"
            data-region="page-switcher"
            onClick={() => onOpenChange(!open)}
          >
            {active?.isHome ? (
              <House size={14} role="img" aria-label="Homepage" className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />
            ) : (
              <File size={14} aria-hidden="true" className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />
            )}
            <span className="tw:truncate">{active ? (active.collectionName ?? active.name) : "No pages"}</span>
            {active ? <span className="tw:flex-none tw:font-normal tw:text-[var(--bk-ink-muted)]">{active.slug}</span> : null}
            {active?.dirty ? (
              <span role="img" aria-label="unsaved changes" className="tw:size-1.5 tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]" />
            ) : null}
            <ChevronDown size={14} aria-hidden="true" className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />
          </Button>
        }
      >
        <PageSwitcherMenu
          pages={pages}
          activePageId={activePageId}
          onSelect={(id) => {
            close();
            onSelect(id);
            /* The chosen row unmounts under focus; Chrome reports that as a
               focusout to nowhere, so the Popover cannot tell focus was inside. */
            triggerRef.current?.focus();
          }}
          onAddPage={then(onAddPage)}
          onManagePages={then(onManagePages)}
          disabledReason={disabledReason}
        />
      </Popover>
      <span className="tw:truncate tw:text-[12px] tw:text-[var(--bk-ink-muted)]" data-testid="page-switcher-count">
        {count}
      </span>
    </div>
  );
}
