/**
 * "+ Save a version" — the History panel's footer link and the modal it opens
 * (boards 4418:73791 Session, 162:2 Saves; modal 4418:165661).
 *
 * Both tabs draw the same footer, so it lives here once: it was built inside
 * VersionHistoryPanel, which renders only on Saves, and the Session tab had no
 * way to name a point at all.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button, Tooltip, useToast } from "@/editor/chrome-ui";
import { SaveVersionModal } from "./SaveVersionModal";

const FooterWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="fab-container" data-testid="saves-footer">
    {children}
  </div>
);

export const SaveVersionFooter: React.FC<{
  composer: Composer | null;
  /** FC-9 (fix-all 2026-09-25): set for a viewer — the footer disables and
   *  explains rather than disappearing. */
  disabledReason?: string;
  /** "header": the button in the Saves filter row (2L9 B7-H04), labelled
   *  "Save a version"; the footer (Session) keeps "+ Save a version". */
  placement?: "footer" | "header";
}> = ({ composer, disabledReason, placement = "footer" }) => {
  const label = placement === "header" ? "Save a version" : "+ Save a version";
  const buttonClass =
    placement === "header"
      ? "tw:h-6 tw:min-h-0 tw:px-2 tw:text-[12px] tw:leading-[18px] tw:font-normal"
      : "tw:h-8 tw:min-h-0 tw:border-transparent tw:bg-transparent tw:px-1 tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-accent-text)]";
  const Wrap = placement === "header" ? React.Fragment : FooterWrap;
  const [open, setOpen] = React.useState(false);
  const { addToast, removeToast } = useToast();

  /* A failure rejects so the modal stays open with it. */
  const save = async (name: string) => {
    try {
      await composer?.versions?.createVersion(name, "");
      /* Board 4418:165677 — a titled card: the name, then where it went,
         closed by "Done". */
      const id = addToast({
        title: "Version saved",
        description: `${name}\nYour current draft is saved as a named milestone. It is available in Saved versions.`,
        tone: "success",
        action: { label: "Done", onClick: () => removeToast(id) },
      });
    } catch (err) {
      addToast({ description: "Save failed", tone: "error" });
      throw err;
    }
  };

  return (
    <>
      <Wrap>
        {/* Board 162:2 writes this as a labelled link at the foot of the
            panel — "+ Save a version". It was a floating "+" circle with the
            label only in a tooltip, so the one action that creates a NAMED
            version (the kind the prune rule promises never to remove)
            announced itself as an unlabelled dot. */}
        {disabledReason ? (
          <Tooltip content={disabledReason} placement="top" arrow={false}>
            <Button
              type="button"
              color="light"
              size="xs"
              aria-disabled="true"
              onClick={() => {}}
              data-testid="saves-save-version"
              /* 2L9 H15: the unavailable action reads unavailable — grey
                 fill, muted label — while keeping its reason on hover. */
              className={`${buttonClass} tw:cursor-not-allowed tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-muted)] tw:hover:bg-[var(--bk-bg-subtle)]`}
            >
              {label}
            </Button>
          </Tooltip>
        ) : (
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={() => setOpen(true)}
          data-testid="saves-save-version"
          className={buttonClass}
        >
          {label}
        </Button>
        )}
      </Wrap>
      <SaveVersionModal
        open={open}
        siteName={composer?.getProjectMetadata?.()?.name || "Untitled site"}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
};
