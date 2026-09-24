/**
 * Content Section — board 4428:141642's CONTENT: "Source ● Static ○ From CMS".
 *
 * G2-144: the binding door moves out of the inspector header (a chain-link
 * icon) into the Settings tab, where the board draws it. Both options open
 * the same collection → field → record popover: From CMS to bind, Static to
 * see and remove the current binding.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { Section, type SectionTier } from "../shared/controls/Section";
import { BindingPopover } from "../components/BindingPopover";

export interface ContentSectionProps {
  elementId: string;
  composer: Composer | null;
  onOpenCreateCollection?: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const OPTION =
  "tw:h-6 tw:px-1 tw:gap-1 tw:rounded-md tw:text-[12px] tw:font-normal tw:whitespace-nowrap tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)]";

function Dot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "tw:inline-block tw:size-2.5 tw:rounded-full tw:border " +
        (on ? "tw:border-[var(--bk-ink)] tw:bg-[var(--bk-ink)]" : "tw:border-[var(--bk-ink-muted)] tw:bg-transparent")
      }
    />
  );
}

export const ContentSection: React.FC<ContentSectionProps> = ({ elementId, composer, onOpenCreateCollection, isOpen, onToggle, tier = "tertiary" }) => (
  <Section title="Content" icon="Database" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-content">
    <BindingPopover
      elementId={elementId}
      composer={composer}
      onOpenCreateCollection={onOpenCreateCollection}
      renderTrigger={({ isBound, toggle, open }) => (
        <div className="bdi-row-ctrl" data-testid="content-source">
          <span className="bdi-lb">Source</span>
          <div className="bdi-row-content" role="radiogroup" aria-label="Content source">
            <Button type="button" color="light" size="xs" className={OPTION} role="radio" aria-checked={!isBound} aria-expanded={open} data-testid="content-source-static" onClick={toggle}>
              <Dot on={!isBound} /> Static
            </Button>
            <Button type="button" color="light" size="xs" className={OPTION} role="radio" aria-checked={isBound} aria-expanded={open} data-testid="content-source-cms" onClick={toggle}>
              <Dot on={isBound} /> From CMS
            </Button>
          </div>
        </div>
      )}
    />
  </Section>
);
