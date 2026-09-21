/**
 * PreviewShareModal — in-editor share dialog opened from the preview
 * overlay's Share button. Plan row G1-022 (SH-43, SH-87).
 *
 * Surfaces:
 *   · Link (read-only display) — the public URL for this site.
 *   · Copy — pushes the link to the clipboard + fires a success toast via
 *     chrome-ui's CopyButton (which already owns the toast wiring).
 *   · Open ↗ — window.open(url, "_blank", "noopener,noreferrer"). New tab.
 *
 * The existing SiteMenu "Share preview link" entry hands off to the
 * dashboard's share modal at `${DASHBOARD_URL}/dashboard/sites/${siteId}
 * ?share=1`. That surface is intentionally separate: this is the
 * in-editor affordance while the preview is on screen, not a duplicate.
 *
 * Built from chrome-ui ModalParts (ModalRoot/Content/Title/Description/
 * Body/Footer) — no new chrome primitive, no flowbite-react import
 * outside chrome-ui. The link row is a `<code>` (read-only, selectable)
 * rather than a raw `<input>` — Gate 24 forbids inline form controls in
 * chrome, and the input would not let users open in a new tab anyway;
 * copy is delegated to CopyButton.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ExternalLink } from "lucide-react";
import {
  Button,
  CopyButton,
  ModalRoot,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
} from "@/editor/chrome-ui";

export interface PreviewShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Absolute share URL shown in the link row. */
  shareUrl: string;
}

const LINK_BOX_CLASS =
  "tw:flex-1 tw:min-w-0 tw:h-9 tw:px-3 tw:flex tw:items-center tw:rounded-sm " +
  "tw:border tw:border-[var(--bk-gray-400)] tw:bg-[var(--bk-gray-50)] " +
  "tw:text-[var(--bk-ink)] tw:text-xs tw:[font-family:var(--bk-font-mono)] " +
  "tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:select-all " +
  "tw:cursor-text";

export const PreviewShareModal: React.FC<PreviewShareModalProps> = ({
  open,
  onOpenChange,
  shareUrl,
}) => {
  return (
    <ModalRoot open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md" srTitle="Share preview">
        <ModalTitle inset={false} className="tw:text-base tw:font-semibold">
          Share preview
        </ModalTitle>
        <ModalDescription inset={false} className="tw:mt-1 tw:text-[var(--bk-ink-muted)] tw:text-[length:var(--bk-text-11)]">
          Anyone with this link can view the current preview of your site.
        </ModalDescription>

        <ModalBody>
          <div className="tw:flex tw:items-stretch tw:gap-2">
            <code
              role="textbox"
              aria-readonly="true"
              aria-label="Share link"
              data-testid="preview-share-link"
              title={shareUrl}
              className={LINK_BOX_CLASS}
            >
              {shareUrl}
            </code>
            <CopyButton
              content={shareUrl}
              label="Copy"
              size="md"
              variant="outline"
              className="tw:shrink-0"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            size="sm"
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open(shareUrl, "_blank", "noopener,noreferrer");
              }
            }}
            aria-label="Open share link in new tab"
          >
            <ExternalLink size={14} aria-hidden="true" />
            <span className="tw:ml-1.5">Open</span>
          </Button>
          <Button
            size="sm"
            color="light"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
          <ModalClose label="Close share dialog" className="tw:sr-only" />
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

export default PreviewShareModal;
