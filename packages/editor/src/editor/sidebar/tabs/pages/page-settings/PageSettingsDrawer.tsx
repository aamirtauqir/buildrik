/**
 * PageSettingsDrawer — 580px slide-over for page-level settings.
 *
 * Architecture:
 * - Called by PagesTab when settingsPageId is set.
 * - usePageSettings owns ALL form state (same hook, new container).
 * - Tab switching is guarded by unsaved changes (UnsavedWarningModal).
 * - ⌘S saves immediately. ESC / X closes with guard.
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
}

export const PageSettingsDrawer: React.FC<Props> = ({ page, allPages, composer, onClose }) => {
  const s = usePageSettings(composer, page, allPages);

  // Auto-save: 500ms after any change
  React.useEffect(() => {
    if (!s.isDirty) return;
    const timer = setTimeout(() => { s.save(); }, 500);
    return () => clearTimeout(timer);
  }, [s.isDirty, s]);

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

  const handleTabClick = (tab: DrawerTab) => {
    s.setActiveTab(tab);
  };

  const handleSaveAndSwitch = async () => {
    await s.save();
    s.confirmTabChange();
    onClose();
  };

  const handleClose = () => {
    if (s.isDirty || s.saveState === "error") {
      s.setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  const handleDiscardAndClose = () => {
    s.discard();
    onClose();
  };

  return (
    <>
      {/* Board S3.7: centered modal card on a dark scrim — scrim click closes
          (through the same unsaved guard as ESC). */}
      <div className="bd-pg-drawer-scrim" onClick={handleClose} aria-hidden="true" />
      <div className="bd-pg-drawer" role="dialog" aria-modal="true" aria-label={`${page.name} settings`}>
        {/* ── Header — board 302:1980: title + text-link tab row ──── */}
        <div className="bd-pg-drawer-hdr">
          <div className="bd-pg-drawer-title" title={page.name}>
            Page settings — {page.name}
          </div>
          <div className="bd-pg-drawer-tabs" role="tablist" aria-label="Settings sections">
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                role="tab"
                aria-selected={s.activeTab === tab.id}
                aria-controls={`pg-drawer-tab-${tab.id}`}
                className={["bd-pg-drawer-tab", s.activeTab === tab.id ? "bd-pg-drawer-tab--active" : ""].filter(Boolean).join(" ")}
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
                {tab.id === "seo" && s.seoScore < 80 && s.allowIndex && (
                  <span className="bd-pg-drawer-tab-chip" aria-hidden="true">{s.seoScore}</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Tab content ─────────────────────────────────────────── */}
        <div className="bd-pg-drawer-body">
          {s.activeTab === "seo" && (
            <div id="pg-drawer-tab-seo" role="tabpanel" aria-label="SEO settings">
              <SeoTab s={s} page={page} />
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
        {/* Autosave owns persistence (the board draws no save chrome); a save
            FAILURE still needs a real affordance, shown only then. */}
        {s.saveState === "error" && (
          <div className="bd-pg-drawer-errrow" role="alert">
            <span>Couldn&apos;t save your changes.</span>
            <Button className="bd-pg-drawer-errrow-retry" onClick={() => s.save()}>
              Retry
            </Button>
          </div>
        )}
      </div>
      <UnsavedWarningModal
        isOpen={s.showDiscardConfirm}
        pendingTab={s.pendingTabChange ?? "seo"}
        onSaveAndSwitch={handleSaveAndSwitch}
        onDiscard={() => {
          s.discard();
          s.confirmTabChange();
        }}
        onCancel={() => {
          s.cancelTabChange();
        }}
      />
    </>
  );
};
