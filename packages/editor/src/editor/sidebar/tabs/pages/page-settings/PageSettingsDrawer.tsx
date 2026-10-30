/**
 * PageSettingsDrawer — 580px slide-over for page-level settings.
 *
 * Architecture:
 * - Called by PagesTab when settingsPageId is set.
 * - usePageSettings owns ALL form state (same hook, new container).
 * - Decision #20 (boards 6887:73809/73848/73882, toast 6887:73801): Cancel ·
 *   Save in the foot (design-2l9 63:15939 names it Save; "Retry save" after a
 *   failure, 63:18189), no autosave. The three tabs are one form — switching
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
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine";
import type { PageItem, DrawerTab } from "../types";
import { usePageSettings } from "./usePageSettings";
import { SeoTab } from "./SeoTab";
import { SocialTab } from "./SocialTab";
import { AdvancedTab } from "./AdvancedTab";
import { UnsavedWarningModal, type LeaveGuardMode } from "./UnsavedWarningModal";
import { Button, Portal, useFocusTrap } from "@/editor/chrome-ui";
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

/* DQ-019: the card mounts in the overlay root (it rendered inside the Pages
   panel) and takes chrome-ui's focus trap — Tab stays in the card, focus
   returns on close, and Escape is answered only while it is the topmost
   dialog (the discard confirm above it owns its own). The trap lives in the
   card because the overlay root resolves in an effect. */
export const PageSettingsDrawer: React.FC<Props> = (props) => (
  <Portal>
    <PageSettingsCard {...props} />
  </Portal>
);

const PageSettingsCard: React.FC<Props> = ({ page, allPages, composer, onClose, initialTab, previousSlug }) => {
  const s = usePageSettings(composer, page, allPages);
  /* The page open on the canvas, when it is another one. */
  const active = allPages.find((pg) => pg.isActive);
  const stays = active && active.id !== page.id ? active.name : null;

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

  /* What to do once the dialog has closed — set by a door that leaves it
     (Site SEO defaults), run after the close or the discard. */
  const afterCloseRef = React.useRef<(() => void) | null>(null);
  const close = () => {
    onClose();
    afterCloseRef.current?.();
    afterCloseRef.current = null;
  };

  /* The return to Pages with unsaved settings (boards 101:22426…101:28183,
     109:32246). `leaving` follows the REAL save that Save and leave started:
     "saving" while it is in flight, "rejected" when it failed. Cancel
     navigation stops only the leaving — the save carries on, and a save that
     lands after it leaves the dialog open (101:28183). `returnPending` is the
     form's own "After saving: return to Pages" foot, reached through Fix page
     URL when the URL is what blocks the save (101:24836). */
  const [leaving, setLeaving] = React.useState<"none" | "saving" | "rejected">("none");
  const [returnPending, setReturnPending] = React.useState(false);
  const navCancelled = React.useRef(false);
  /* 101:28183: Cancel navigation while the save runs — said in the form
     until that save ends. */
  const [stayAfterSave, setStayAfterSave] = React.useState(false);
  const saving = s.saveState === "saving";
  const guardMode: LeaveGuardMode =
    leaving === "saving" ? "saving" : leaving === "rejected" ? "rejected" : s.slugError ? "invalid-url" : "ask";

  const saveAndLeave = async () => {
    navCancelled.current = false;
    setReturnPending(false);
    s.setShowDiscardConfirm(true);
    setLeaving("saving");
    const ok = await s.save();
    setStayAfterSave(false);
    if (navCancelled.current) {
      setLeaving("none");
      return;
    }
    if (ok) {
      setLeaving("none");
      s.setShowDiscardConfirm(false);
      close();
    } else {
      setLeaving("rejected");
    }
  };

  const handleClose = () => {
    if (s.isDirty || s.saveState === "error") {
      s.setShowDiscardConfirm(true);
      return;
    }
    close();
  };

  /* 6887:73809 "Site SEO defaults ›" → full-screen Settings › SEO defaults,
     through the same unsaved guard as ✕. */
  const openSiteDefaults = () => {
    afterCloseRef.current = () => composer?.emit(EVENTS.UI_SETTINGS_OPEN, { screen: "seo" });
    handleClose();
  };

  // ESC — the same guarded close as the scrim, through the trap. While the
  // discard modal is open it is the topmost dialog and owns Escape, so the
  // guard behind it cannot reopen what it just dismissed.
  const trapRef = useFocusTrap(true, handleClose);

  return (
    <>
      {/* Board S3.7: centered modal card on a dark scrim — scrim click closes
          (through the same unsaved guard as ESC). */}
      <div className="bd-pg-drawer-scrim" onClick={handleClose} aria-hidden="true" />
      <div ref={trapRef} className="bd-pg-drawer" data-testid="pg-drawer" role="dialog" aria-modal="true" aria-label={`${page.name} settings`}>
        {/* ── Header — design-2l9 board 63:15939: "{Page} · Page settings" and
            the ✕ on one row over a hairline, then the three tabs as a
            segmented row. */}
        <div className="bd-pg-drawer-hdr" data-testid="pg-drawer-hdr">
          {/* One text node: a split title reads as two labels. */}
          <div className="bd-pg-drawer-title" title={page.name} data-testid="pg-drawer-title">
            {`${page.name} · Page settings`}
          </div>
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
            </Button>
          ))}
        </div>

        {/* ── Tab content ─────────────────────────────────────────── */}
        <div className="bd-pg-drawer-body" data-testid="pg-drawer-body">
          {/* Board 63:15939: which page, and that the canvas page stays —
              or, dirty, that edits are unsaved (63:18189). */}
          <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="pg-drawer-subtitle">
            {saving && stayAfterSave
              ? `${page.name} · Saving settings… · Navigation cancelled`
              : s.isDirty || s.saveState === "error"
              ? `${page.name} · Unsaved settings changes${stays ? ` · ${stays} stays open` : ""}`
              : stays
                ? `Editing ${page.name} · ${stays} stays open on the canvas`
                : active?.id === page.id
                  ? /* 94:29621: the page on the canvas — its appearance is the Inspector's. */
                    `Editing ${page.name} · Page appearance stays in the Inspector`
                  : `Editing ${page.name}`}
          </p>
          {/* 101:28183: the form is read-only while its save runs. */}
          <fieldset disabled={saving} className="tw:m-0 tw:min-w-0 tw:border-0 tw:p-0">
          {s.activeTab === "seo" && (
            <div id="pg-drawer-tab-seo" role="tabpanel" aria-label="SEO settings">
              <SeoTab s={s} page={page} composer={composer} previousSlug={previousSlug} onOpenSiteDefaults={openSiteDefaults} />
            </div>
          )}
          {s.activeTab === "social" && (
            <div id="pg-drawer-tab-social" role="tabpanel" aria-label="Social settings">
              <SocialTab s={s} />
            </div>
          )}
          {s.activeTab === "advanced" && (
            <div id="pg-drawer-tab-advanced" role="tabpanel" aria-label="Advanced settings">
              <AdvancedTab s={s} />
            </div>
          )}
          </fieldset>
          {saving && stayAfterSave && (
            <p className="tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="pg-drawer-stay-note">
              {`When this save finishes, you’ll stay in ${page.name} settings.`}
            </p>
          )}
        </div>
        {/* The SEO tab says it in its form (63:18189); the other two here. */}
        {s.saveState === "error" && s.activeTab !== "seo" && (
          <p
            role="alert"
            className="tw:m-0 tw:px-5 tw:py-2 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-error-text)] tw:bg-[var(--bk-error-tint)]"
            data-testid="pg-drawer-save-error"
          >
            Couldn’t save page settings. Your changes are still here.
          </p>
        )}
        {returnPending ? (
          /* 101:24836: the return is still pending while the URL is fixed. */
          <div className="bd-pg-drawer-foot" data-testid="pg-drawer-foot">
            <p className="tw:m-0 tw:mr-auto tw:self-center tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="pg-drawer-return-note">
              {`After saving: return to Pages${stays ? ` · ${stays} stays open` : ""}`}
            </p>
            <Button color="light" size="xs" data-testid="pg-drawer-cancel-nav" onClick={() => setReturnPending(false)}>
              Cancel navigation
            </Button>
            <Button
              size="xs"
              data-testid="pg-drawer-save-leave"
              disabled={Boolean(s.slugError) || s.saveState === "saving"}
              onClick={() => void saveAndLeave()}
            >
              Save and leave
            </Button>
          </div>
        ) : (
        <div className="bd-pg-drawer-foot" data-testid="pg-drawer-foot">
          <Button color="light" size="xs" data-testid="pg-drawer-cancel" disabled={saving} onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="xs"
            data-testid="pg-drawer-done"
            /* 94:29621: nothing to save draws Save disabled (Cancel / ✕ close). */
            disabled={s.saveState === "saving" || (!s.isDirty && s.saveState !== "error")}
            aria-busy={s.saveState === "saving" || undefined}
            onClick={() => void handleDone()}
          >
            {s.saveState === "error" ? "Retry save" : "Save"}
          </Button>
        </div>
        )}
      </div>
      {/* The guarded close (✕ / ESC / scrim on a dirty form): Discard throws
          the edits away and closes, Keep editing returns to the form. */}
      <UnsavedWarningModal
        isOpen={s.showDiscardConfirm}
        mode={guardMode}
        pageName={page.name}
        stays={stays}
        emptyUrl={!s.slug.trim()}
        onSaveAndLeave={() => void saveAndLeave()}
        onFixUrl={() => {
          s.setShowDiscardConfirm(false);
          s.setActiveTab("seo");
          setReturnPending(true);
          requestAnimationFrame(() => document.getElementById("seo-slug")?.focus());
        }}
        onDiscard={() => {
          s.discard();
          setLeaving("none");
          s.setShowDiscardConfirm(false);
          close();
        }}
        onCancel={() => {
          /* Keep editing, or — while saving — Cancel navigation. */
          if (leaving === "saving") {
            navCancelled.current = true;
            setStayAfterSave(true);
          }
          setLeaving("none");
          afterCloseRef.current = null;
          s.setShowDiscardConfirm(false);
        }}
      />
    </>
  );
};
