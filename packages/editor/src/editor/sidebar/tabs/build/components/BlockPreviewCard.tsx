/**
 * BlockPreviewCard — board 4428:145110 (Add · Blocks · hover): hovering a
 * block card opens a 320-wide card beside the drawer — name, what it is, a
 * preview, "Add {name}" and "or drag it onto the canvas".
 *
 * Portaled (chrome-ui Portal) because the drawer scrolls and clips; placed at
 * the drawer's right edge + 8, level with the hovered card, kept on screen.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Portal } from "@/editor/chrome-ui";
import type { BlockDefinition } from "../../../../../blocks/blockRegistry";
import { BlockThumb } from "./BlockThumb";

const CARD_W = 320;
const CARD_H_EST = 300;

interface Props {
  block: BlockDefinition;
  /** The hovered card — the preview sits level with it. */
  anchor: HTMLElement;
  onInsert: () => void;
  onPointerEnter: () => void;
  onPointerLeave: () => void;
}

export const BlockPreviewCard: React.FC<Props> = ({ block, anchor, onInsert, onPointerEnter, onPointerLeave }) => {
  const drawer = anchor.closest(".bld-container") ?? anchor;
  const left = drawer.getBoundingClientRect().right + 8;
  const top = Math.max(8, Math.min(anchor.getBoundingClientRect().top + 36, window.innerHeight - CARD_H_EST - 8));
  return (
    <Portal>
      <div
        role="dialog"
        aria-label={`${block.label} block`}
        data-testid="insert-block-preview"
        style={{ left, top, width: CARD_W }}
        onMouseEnter={onPointerEnter}
        onMouseLeave={onPointerLeave}
        className="tw:fixed tw:z-50 tw:flex tw:flex-col tw:gap-3 tw:p-4 tw:rounded-lg tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:[box-shadow:var(--bk-shadow-overlay)]"
      >
        <p className="tw:m-0 tw:text-[14px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]">{block.label}</p>
        {block.description ? (
          <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-gray-500)]">{block.description}</p>
        ) : null}
        {block.preview ? (
          <img src={block.preview} alt="" className="tw:h-[150px] tw:w-full tw:rounded-md tw:object-cover tw:border tw:border-[var(--bk-border)]" />
        ) : (
          <BlockThumb blockId={block.id} className="tw:h-[150px] tw:w-full tw:rounded-md tw:bg-[var(--bk-gray-50)] tw:border tw:border-[var(--bk-border)]" />
        )}
        <div className="tw:flex tw:items-center tw:gap-2.5">
          <Button size="xs" data-testid="insert-block-preview-add" onClick={onInsert} className="tw:h-7 tw:px-3 tw:text-[13px] tw:font-medium tw:focus:ring-0">
            Add {block.label}
          </Button>
          <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-gray-500)]">or drag it onto the canvas</span>
        </div>
      </div>
    </Portal>
  );
};
