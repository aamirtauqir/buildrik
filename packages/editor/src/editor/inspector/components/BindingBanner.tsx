/**
 * BindingBanner — board 160:105 (Inspector · bound-to-CMS).
 *
 * A bound element is not editable here, and used to look exactly like one that
 * was: the only sign was a pressed link icon in the header, and the name of
 * the field it followed lived inside that icon's popover. Typing into the
 * canvas produced a change that the next content refresh silently took back.
 *
 * The banner says what it follows, where to change it, and offers the one
 * escape — unbind — that makes the panel below mean what it says again.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";

export interface BindingBannerProps {
  composer: Composer | null | undefined;
  elementId: string;
  /** "Text", "Section" — what the header calls this element. */
  elementLabel: string;
}

/** The field an element follows, named the way the board names it. */
export function useElementBinding(
  composer: Composer | null | undefined,
  elementId: string
): string | null {
  const read = React.useCallback((): string | null => {
    const bindings = composer?.cms?.bindings?.getBindings?.(elementId) ?? [];
    const first = bindings[0];
    if (!first) return null;
    const collection = composer?.cms?.collections?.getCollection?.(first.collectionId);
    return `${collection?.name ?? first.collectionId}.${first.fieldSlug}`;
  }, [composer, elementId]);

  const [label, setLabel] = React.useState<string | null>(read);

  React.useEffect(() => {
    setLabel(read());
    if (!composer) return;
    const refresh = () => setLabel(read());
    composer.on(EVENTS.BINDING_CREATED, refresh);
    composer.on(EVENTS.BINDING_REMOVED, refresh);
    return () => {
      composer.off(EVENTS.BINDING_CREATED, refresh);
      composer.off(EVENTS.BINDING_REMOVED, refresh);
    };
  }, [composer, read]);

  return label;
}

export const BindingBanner: React.FC<BindingBannerProps> = ({
  composer,
  elementId,
  elementLabel,
}) => {
  const label = useElementBinding(composer, elementId);
  if (!label) return null;

  return (
    <div
      className="tw:bg-[var(--bk-accent-tint)] tw:px-3 tw:py-2"
      data-testid="binding-banner"
    >
      <div className="tw:flex tw:items-start tw:gap-2">
        <p className="tw:m-0 tw:flex-1 tw:text-[12px] tw:text-[var(--bk-accent)]">
          {elementLabel} is bound to {label}
        </p>
        <Button
          color="light"
          size="xs"
          className="tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[12px] tw:text-[var(--bk-accent)]"
          onClick={() => composer?.cms?.bindings?.unbindAll?.(elementId)}
        >
          Unbind
        </Button>
      </div>
      <p className="tw:m-0 tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
        Edit the record in Content, or unbind to type here.
      </p>
    </div>
  );
};

export default BindingBanner;
