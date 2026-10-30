/**
 * RecordPageReturnRow — on a collection page opened from a Card's Link row,
 * the way back to that Card (2L9 B5-D98 195:29753):
 *
 *   ‹ Home · Team card
 *
 * State: `recordPageReturn` (editor/cms), set by the make's "Open page".
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { recordPageReturn } from "@/editor/cms/recordPageReturn";

export function RecordPageReturnRow({ composer, pageId }: { composer: Composer; pageId: string }) {
  const back = React.useSyncExternalStore(
    recordPageReturn.subscribe,
    () => recordPageReturn.forPage(pageId),
    () => recordPageReturn.forPage(pageId),
  );
  if (!back) return null;
  return (
    <div className="tw:flex tw:justify-center tw:pb-2" data-testid="inspector-record-page-return">
      <Button type="button" variant="link" size="xs" className="tw:h-8 tw:text-[13px] tw:font-normal" onClick={() => recordPageReturn.go(composer)}>
        {`‹ ${back.label}`}
      </Button>
    </div>
  );
}
