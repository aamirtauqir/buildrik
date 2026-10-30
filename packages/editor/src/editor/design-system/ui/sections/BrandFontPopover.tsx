/**
 * BrandFontPopover — a font role's `Change` on the Fonts & type styles page
 * (7316:81551) opens the editor's one font picker, Choose font (2L9 R02,
 * `inspector/sections/typography/ChooseFont`), in the token's form: a pick
 * writes the bare family the token holds ("Inter"), never the inspector's
 * quoted stack, and there is no Inherit. The rows are the font list's own —
 * uploaded, system, the Google catalogue — so the role sees exactly what an
 * element's Font row sees. Above it, the line on what is being chosen; under
 * it, "Type a font stack ›" for a hand-typed stack (the token's text field).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { Button, Popover } from "@/editor/chrome-ui";
import { ChooseFont } from "@/editor/inspector/sections/typography/ChooseFont";

export interface BrandFontPopoverProps {
  open: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  /** The role being chosen for, e.g. "Body Font" — also the key its kept search is held under. */
  roleName: string;
  /** The token's id: Choose font keeps its search per subject. */
  tokenId: string;
  /** The token's current value — a bare family or a typed stack. */
  value: string;
  onPick: (family: string) => void;
  /** The token's text field, for a hand-typed stack. */
  onTypeStack: () => void;
  composer: Composer | null | undefined;
}

const LINK =
  "tw:h-auto tw:min-h-0 tw:self-start tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-normal tw:leading-4 tw:text-[var(--bk-accent-text)] tw:enabled:hover:no-underline";

export const BrandFontPopover: React.FC<BrandFontPopoverProps> = ({
  open,
  onClose,
  trigger,
  roleName,
  tokenId,
  value,
  onPick,
  onTypeStack,
  composer,
}) => (
  <Popover open={open} onClose={onClose} trigger={trigger} placement="bottom-end" label={`${roleName} font`}>
    <div className="tw:flex tw:max-h-[480px] tw:w-70 tw:flex-col tw:gap-1 tw:pt-3" data-testid="brand-font-popover">
      <p className="tw:m-0 tw:px-3 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
        Brand › Fonts &amp; type styles › {roleName}. Choose the font this role uses across the site.
      </p>
      <ChooseFont
        composer={composer}
        elementId={`brand-token:${tokenId}`}
        value={value}
        onChange={onPick}
        onClose={onClose}
        form="family"
        subject={roleName}
      />
      <div className="tw:flex tw:px-3 tw:pb-3">
        <Button type="button" variant="link" className={LINK} onClick={onTypeStack} data-testid="brand-font-type-stack">
          Type a font stack ›
        </Button>
      </div>
    </div>
  </Popover>
);
