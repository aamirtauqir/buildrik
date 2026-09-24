/**
 * PageSettingsDrawer — 580px slide-over for page-level settings.
 *
 * Architecture:
 * - Called by PagesTab when settingsPageId is set.
 * - usePageSettings owns ALL form state (same hook, new container).
 * - Decision #20 (boards 6887:73809/73848/73882, toast 6887:73801): Cancel ·
 *   Done in the foot, no autosave. The three tabs are one form — switching
 *   keeps the edits; Done saves once and closes with "Page settings saved";
 *   Cancel discards and closes. A failed Done keeps the dialog open.
 * - ⌘S saves without closing. ESC, the scrim and the header ✕ close through
 *   the unsaved guard (UnsavedWarningModal). The ✕ is board 2838:12107, inside header frame 302:1980
 *   on all three S3.7 boards (SEO / Social / Advanced) as of the 2026-09-07
 *   capture. This docblock previously said "There is no ✕", which was true of
 *   an older board and left a modal dialog whose only exits were ESC and a
 *   scrim click — neither of which is on screen.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { PageItem, DrawerTab } from "../types";
import { usePageSettings } from "./usePageSettings";
import { SeoTab } from "./SeoTab";
import { SocialTab } from "./SocialTab";
import { AdvancedTab } from "./AdvancedTab";
import { UnsavedWarningModal } from "./UnsavedWarningModal";
import { Button } from "@/editor/chrome-ui";
const TABS: { id: DrawerTab; label: string }[] = [
  { id: "seo", label: "SEO" },
  { id: "social", label: "Social" },
  { id: "advanced", label: "Advanced" },
];

interface Props {
  page: PageItem;
  allPages: PageItem[];
  composer: Composer | null;
  onClose: () => void;
  /** The tab a door asked for (`ui:pages-open-settings`); SEO otherwise. */
  initialTab?: DrawerTab;
  /** The slug a rename's "Update URL" just moved the page off (G2-076). */
  previousSlug?: string;
}

export const PageSettingsDrawer: React.FC<Props> = ({ page, allPages, composer, onClose, initialTab, previousSlug }) => {
  const s = usePageSettings(composer, page, allPages);

  /* A door's tab (`ui:pages-open-settings`) lands on open and whenever a new
     request arrives. Tab switches are unguarded now (#20), so it applies at once. */
  const { setActiveTab } = s;
  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, setActiveTab]);

  // ⌘S / Ctrl+S — immediate save
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (s.isDirty || s.saveState === "error") s.save();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [s.isDirty, s.saveState, s]);

  const handleDone = async () => {
    if (!s.isDirty && s.saveState !== "error") {
      onClose();
      return;
    }
    if (await s.save()) onClose();
  };

  const handleCancel = () => {
    s.discard();
    onClose();
  };

  const handleClose = () => {
    if (s.isDirty || s.saveState === "error") {
      s.setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  // ESC — the same guarded close as the scrim. Skipped while the discard modal
  // is open: that dialog owns Escape, and running the guard behind it would
  // reopen what the dialog had just dismissed.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || s.showDiscardConfirm) return;
      e.preventDefault();
      handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [s.showDiscardConfirm, handleClose]);

  return (
    <>
      {/* Board S3.7: centered modal card on a dark scrim — scrim click closes
          (through the same unsaved guard as ESC). */}
      <div className="bd-pg-drawer-scrim" onClick={handleClose} aria-hidden="true" />
      <div className="bd-pg-drawer" data-testid="pg-drawer" role="dialog" aria-modal="true" aria-label={`${page.name} settings`}>
        {/* ── Header — board 302:1980: title + text-link tab row ──── */}
        <div className="bd-pg-drawer-hdr" data-testid="pg-drawer-hdr">
          {/* One text node, not `Page settings — {page.name}`: JSX splits that
              into two, and 302:1981 draws one string. A split title reads as
              two labels to anything walking the accessibility tree or the
              rendered copy. */}
          <div className="bd-pg-drawer-title" title={page.name} data-testid="pg-drawer-title">
            {`Page settings — ${page.name}`}
          </div>
          <div className="bd-pg-drawer-tabs" role="tablist" aria-label="Settings sections">
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                role="tab"
                aria-selected={s.activeTab === tab.id}
                aria-controls={`pg-drawer-tab-${tab.id}`}
                data-testid={`pg-drawer-tabbtn-${tab.id}`}
                className={["bd-pg-drawer-tab", s.activeTab === tab.id ? "bd-pg-drawer-tab--active" : ""].filter(Boolean).join(" ")}
                onClick={() => s.setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.id === "seo" && s.seoScore < 80 && s.allowIndex && (
                  <span className="bd-pg-drawer-tab-chip" aria-hidden="true">{s.seoScore}</span>
                )}
              </Button>
            ))}
          </div>
          {/* Board 2838:12107 — 13px ink-muted ✕. Figma exports the header as a
              flex COLUMN, so the glyph lands under the tab row in the generated
              code; a close control belongs at the card's top-right corner and
              that is where it is placed. Same guarded exit as ESC. */}
          <Button
            type="button"
            aria-label="Close page settings"
            className="bd-pg-drawer-close"
            data-testid="pg-drawer-close"
            onClick={handleClose}
          >
            ✕
          </Button>
        </div>

        {/* ── Tab content ─────────────────────────────────────────── */}
        <div className="bd-pg-drawer-body" data-testid="pg-drawer-body">
          {s.activeTab === "seo" && (
            <div id="pg-drawer-tab-seo" role="tabpanel" aria-label="SEO settings">
              <SeoTab s={s} page={page} composer={composer} previousSlug={previousSlug} />
            </div>
          )}
          {s.activeTab === "social" && (
            <div id="pg-drawer-tab-social" role="tabpanel" aria-label="Social settings">
              <SocialTab s={s} page={page} />
            </div>
          )}
          {s.activeTab === "advanced" && (
            <div id="pg-drawer-tab-advanced" role="tabpanel" aria-label="Advanced settings">
              <AdvancedTab s={s} />
            </div>
          )}
        </div>
        <div className="bd-pg-drawer-foot" data-testid="pg-drawer-foot">
          <Button color="light" size="xs" data-testid="pg-drawer-cancel" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="xs"
            data-testid="pg-drawer-done"
            disabled={s.saveState === "saving"}
            aria-busy={s.saveState === "saving" || undefined}
            onClick={() => void handleDone()}
          >
            Done
          </Button>
        </div>
      </div>
      {/* The guarded close (✕ / ESC / scrim on a dirty form): Discard throws
          the edits away and closes, Keep editing returns to the form. */}
      <UnsavedWarningModal
        isOpen={s.showDiscardConfirm}
        pendingTab={s.activeTab}
        onDiscard={() => {
          s.discard();
          s.setShowDiscardConfirm(false);
          onClose();
        }}
        onCancel={() => s.setShowDiscardConfirm(false)}
      />
    </>
  );
};
