/**
 * TemplateApplyModal — Templates board 642:2556 (Templates · preview).
 *
 * What a template card in the drawer opens: the template's name, what it is
 * made of, a look at it, the consequence of applying it, and the two ways out.
 * Before this, a card click jumped straight into the expanded 700-wide gallery
 * with a detail pane — a different surface, with three apply buttons and no
 * statement of what applying replaces.
 *
 * The preview is the template's own markup in a sandboxed, scaled iframe (the
 * same mechanism the full-screen preview uses), not a coloured placeholder:
 * the board's grey block is a drawing of a preview, and a gradient would be a
 * drawing of one too.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import { getSectionCount, type TemplateItem } from "../templatesData";

export interface TemplateApplyModalProps {
  template: TemplateItem | null;
  open: boolean;
  onClose(): void;
  onApply(template: TemplateItem): void;
  /** The page that would be replaced — named so the consequence is concrete. */
  pageName?: string;
}

/** "6 sections · Free" — the board also carries "updated 12 Jun", which this
 *  catalog has no date for. A made-up date is worse than a missing one. */
function factLine(t: TemplateItem): string {
  const n = getSectionCount(t.html);
  return `${n} section${n === 1 ? "" : "s"} · ${t.status === "premium" ? "Pro" : "Free"}`;
}

export const TemplateApplyModal: React.FC<TemplateApplyModalProps> = ({
  template,
  open,
  onClose,
  onApply,
  pageName,
}) => {
  const srcDoc = React.useMemo(() => {
    if (!template) return "";
    /* Laid out at a desktop width and scaled to the modal, so the preview is
       the page a visitor would see rather than its phone reflow: 1100 scaled
       to the ~672px the lg modal leaves inside its padding. */
    const w = 1100;
    return `<!DOCTYPE html><html><head>
      <meta charset="utf-8"><meta name="viewport" content="width=${w}">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: #fff; }
        body { overflow: hidden; }
        .tpl-scale { transform: scale(0.61); transform-origin: top left; width: ${w}px; }
      </style>
    </head><body><div class="tpl-scale">${template.html}</div></body></html>`;
  }, [template]);

  if (!template) return null;

  return (
    <ModalRoot open={open} onOpenChange={(next) => !next && onClose()}>
      <ModalContent size="lg" srTitle={template.name} className="tw:px-0 tw:py-0">
        <div className="tw:flex tw:flex-col tw:gap-1 tw:px-5 tw:pt-[18px]">
          <h2 className="tw:m-0 tw:text-[16px] tw:font-semibold tw:text-[var(--bk-ink)]">
            {template.name}
          </h2>
          <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
            {factLine(template)}
          </span>
        </div>

        <div className="tw:px-5 tw:pt-4">
          <div className="tw:h-80 tw:w-full tw:overflow-hidden tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:bg-white">
            <iframe
              className="tw:h-full tw:w-full tw:border-0"
              title={`Preview: ${template.name}`}
              sandbox="allow-same-origin"
              srcDoc={srcDoc}
            />
          </div>
        </div>

        {/* Board 642:2556 — the consequence, stated before the button that
            causes it, with the way back named.

            The page's name goes in an "of X" clause, not in front of the word
            "page". Interpolating it there reads correctly only when the page is
            named like a noun ("the current Home page content") and breaks on
            the default name every new site has: "the current Page 1 page
            content". */}
        <p className="tw:m-0 tw:px-5 tw:pt-3 tw:text-[13px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
          {pageName
            ? `Applying replaces the content of ${pageName}.`
            : "Applying replaces the current page content."}{" "}
          Your version history keeps the previous state.
        </p>

        <div className="tw:mt-4 tw:flex tw:items-center tw:justify-end tw:gap-2 tw:border-t tw:border-[var(--bk-border)] tw:px-5 tw:py-3.5">
          <Button color="light" onClick={onClose} className="tw:h-7 tw:border-transparent tw:bg-transparent">
            Cancel
          </Button>
          <Button onClick={() => onApply(template)} data-testid="tpl-apply" className="tw:h-7">
            Apply template
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};

export default TemplateApplyModal;
