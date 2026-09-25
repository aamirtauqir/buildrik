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
import { Button, useToast } from "@/editor/chrome-ui";
import { SaveVersionModal } from "./SaveVersionModal";

export const SaveVersionFooter: React.FC<{ composer: Composer | null }> = ({ composer }) => {
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
      <div className="fab-container" data-testid="saves-footer">
        {/* Board 162:2 writes this as a labelled link at the foot of the
            panel — "+ Save a version". It was a floating "+" circle with the
            label only in a tooltip, so the one action that creates a NAMED
            version (the kind the prune rule promises never to remove)
            announced itself as an unlabelled dot. */}
        <Button
          type="button"
          color="light"
          size="xs"
          onClick={() => setOpen(true)}
          data-testid="saves-save-version"
          className="tw:h-8 tw:min-h-0 tw:border-transparent tw:bg-transparent tw:px-1 tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-accent-text)]"
        >
          + Save a version
        </Button>
      </div>
      <SaveVersionModal
        open={open}
        siteName={composer?.getProjectMetadata?.()?.name || "Untitled site"}
        onClose={() => setOpen(false)}
        onSave={save}
      />
    </>
  );
};
