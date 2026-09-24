/**
 * MoveToPageDialog — board 4418:82847 "Move Heading to a page": one radio row
 * per OTHER page (the first is picked), Cancel / Move. The caller does the
 * move; this only chooses the page.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal, Radio } from "@/editor/chrome-ui";

export interface MoveToPageDialogProps {
  open: boolean;
  /** "Heading", or "3 elements" for a selection. */
  subject: string;
  /** The page the element leaves. */
  fromPage: string;
  /** Every page except the one it is on. */
  pages: ReadonlyArray<{ id: string; name: string }>;
  onMove: (pageId: string) => void;
  onClose: () => void;
}

/* 4418:82847 row: 36 tall, 1px gray-200, radius 8; picked = accent edge on blue-50. */
const ROW =
  "tw:flex tw:h-9 tw:items-center tw:gap-3 tw:rounded-lg tw:border tw:px-3 tw:text-[13px] tw:text-[var(--bk-ink)] tw:cursor-pointer";
const ROW_IDLE = "tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-card)]";
const ROW_PICKED = "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-subtle)]";

export function MoveToPageDialog({ open, subject, fromPage, pages, onMove, onClose }: MoveToPageDialogProps) {
  const [picked, setPicked] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (open) setPicked(pages[0]?.id ?? null);
  }, [open, pages]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Move ${subject} to a page`}
      testId="layers-move-to-page"
      footer={
        <>
          <Button color="light" size="xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="xs"
            disabled={!picked}
            data-testid="layers-move-to-page-confirm"
            onClick={() => picked && onMove(picked)}
          >
            Move
          </Button>
        </>
      }
    >
      <p className="tw:m-0 tw:mb-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
        The element leaves {fromPage} and is placed at the end of the chosen page.
      </p>
      <div role="radiogroup" aria-label="Pages" className="tw:flex tw:flex-col tw:gap-2">
        {pages.map((p) => (
          <label key={p.id} className={`${ROW} ${picked === p.id ? ROW_PICKED : ROW_IDLE}`}>
            <Radio
              color="blue"
              name="move-to-page"
              value={p.id}
              checked={picked === p.id}
              onChange={() => setPicked(p.id)}
            />
            <span>{p.name}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
