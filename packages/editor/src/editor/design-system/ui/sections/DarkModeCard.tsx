/**
 * DarkModeCard — Brand › Colour mode's "Dark mode" card, board BRP1-M8:
 *
 *   8224:238726  off                Auto | [Off] · "Dark mode is off for this site."
 *                                   · [Light preview] (Dark preview disabled)
 *   8224:241285  preview-disabled   the same card — Dark preview is disabled
 *   8224:239369  auto               [Auto] | Off · Light preview · Dark preview
 *   8230:232622  auto-dark-preview  the auto card with the preview in dark
 *   8224:240003  generated-aliases  "Generated missing dark values", one line
 *                                   per filled token, Cancel · Preview in dark
 *   8224:240644  dark-preview       the same, canvas in dark, Cancel · Confirm
 *
 * Off → Auto fills every semantic colour that has no dark value first
 * (`proposeMissingDarks`, D11). Nothing missing: a restore point, then
 * `setDarkMode("auto")`. Something missing: the list, a dark preview of the
 * proposal on the canvas, and Confirm → restore point → `setDarkMode("auto",
 * tokens)` — Dark mode and the filled values in ONE transaction, one ⌘Z.
 * A restore point that cannot be saved blocks the switch (OQ-6). Auto → Off
 * takes no restore point (OQ-7): it removes nothing.
 *
 * The preview is recomputed from the saved tokens on every settings change
 * (`useBrandPreview`), so a ⌘Z mid-preview never leaves a stale set painted,
 * and it is cleared on Cancel, on Confirm and on unmount.
 *
 * The board's auto line also says "New sites start with Auto." — new sites
 * start Off in 1c (OQ-1), so that sentence is not drawn.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { Button } from "@/editor/chrome-ui";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { proposeMissingDarks } from "@/engine/designSystem/scale";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useProjectTokenStore } from "@/editor/design-system/state/TokenRegistryContext";
import { useBrandPreview } from "@/editor/design-system/state/useBrandPreview";
import { useGuardedApply } from "@/editor/design-system/state/useGuardedApply";
import { takeRestorePoint } from "@/editor/design-system/state/useBrandRestorePoints";
import { useColorMode, useSiteDarkMode } from "@/editor/design-system/state/useColorMode";
import { displayValue } from "../colors/ColorTokenList";
import { NOTICE, SMALL_ACTION } from "./UsageHighlight";
import { CARD, COPY, TITLE } from "./ConnectTokensCheck";

/** OQ-6's copy, shared by every apply that takes a restore point first. */
export const RESTORE_POINT_FAILED = "We couldn't save a restore point — nothing was changed.";

const SECONDARY = `${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`;
const LINE = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";

type Phase = "idle" | "aliases" | "preview";

export interface DarkModeCardProps {
  composer: Composer | null | undefined;
}

export const DarkModeCard: React.FC<DarkModeCardProps> = ({ composer }) => {
  const store = useProjectTokenStore();
  const siteMode = useSiteDarkMode(composer);
  const preview = useBrandPreview(composer ?? null);
  const guard = useGuardedApply();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [failed, setFailed] = React.useState(false);

  /* What turning Auto on would fill, from the saved set as it is now. */
  const proposal = React.useMemo(() => proposeMissingDarks(store.all), [store.all]);

  const switchOn = () =>
    guard.run(async () => {
      if (!composer) return false;
      setFailed(false);
      const siteId = getSiteIdFromUrl();
      if (!siteId || !(await takeRestorePoint(composer, siteId, "dark-auto"))) {
        setFailed(true);
        return false;
      }
      const fill = proposeMissingDarks(store.all);
      preview.clear();
      const ok =
        fill.filled.length > 0
          ? composer.designSystem.setDarkMode("auto", "Turn on dark mode", fill.tokens)
          : composer.designSystem.setDarkMode("auto", "Turn on dark mode");
      if (ok) setPhase("idle");
      return ok;
    });

  const chooseAuto = () => {
    if (siteMode === "auto" || phase !== "idle") return;
    if (proposal.filled.length === 0) {
      void switchOn();
      return;
    }
    setFailed(false);
    setPhase("aliases");
  };
  const chooseOff = () => {
    if (siteMode === "off") return;
    composer?.designSystem.setDarkMode("off", "Turn off dark mode");
  };
  const showDark = () => {
    preview.show((tokens) => ({ tokens: proposeMissingDarks(tokens).tokens, darkMode: "auto", theme: "dark" }));
    setPhase("preview");
  };
  const cancel = () => {
    preview.clear();
    setFailed(false);
    setPhase("idle");
  };

  const pending = phase !== "idle";
  const nameOf = (id: string) => {
    const t = store.all.find((x) => x.id === id);
    return t ? (t.friendlyName ?? t.name) : id;
  };

  return (
    <section aria-label="Dark mode" className={CARD} data-testid="brand-dark-mode" data-dark-mode-state={pending ? phase : siteMode}>
      <p className={TITLE}>Dark mode</p>
      <p className={COPY}>Auto follows each visitor’s device. Off publishes only your light theme.</p>
      <div className="tw:flex tw:items-center tw:gap-2" role="group" aria-label="Dark mode">
        {/* While the switch is pending neither is drawn chosen (8224:240003). */}
        <SegButton on={!pending && siteMode === "auto"} onClick={chooseAuto} testId="brand-dark-mode-auto" disabled={guard.busy}>
          Auto
        </SegButton>
        <SegButton on={!pending && siteMode === "off"} onClick={chooseOff} testId="brand-dark-mode-off" disabled={guard.busy || pending}>
          Off
        </SegButton>
      </div>

      {pending ? (
        <>
          <p className={TITLE}>Generated missing dark values</p>
          <p className={COPY}>Your existing dark values are kept. These missing aliases will be added.</p>
          {proposal.filled.map((id) => (
            <p key={id} className={LINE} data-testid={`brand-dark-alias-${id}`} data-hex={resolveTokenLiteral(proposal.tokens, id, "dark") ?? ""}>
              {nameOf(id)} → {displayValue(resolveTokenLiteral(proposal.tokens, id, "dark") ?? "")}
            </p>
          ))}
          <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-accent-tint)]`} role="status">
            Preview only · Confirm creates a restore point and turns on Auto. Cancel keeps Dark mode Off.
          </p>
        </>
      ) : siteMode === "off" ? (
        <p className={COPY} data-testid="brand-dark-mode-note">Dark mode is off for this site.</p>
      ) : (
        <p className={COPY} data-testid="brand-dark-mode-note">Your site has light and dark values.</p>
      )}

      {failed && (
        <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-error-tint)]`} role="alert" data-testid="brand-dark-mode-error">
          {RESTORE_POINT_FAILED}
        </p>
      )}

      {pending ? (
        <div className="tw:flex tw:items-center tw:gap-2">
          <Button type="button" variant="secondary" size="xs" className={SECONDARY} onClick={cancel} disabled={guard.busy} data-testid="brand-dark-mode-cancel">
            Cancel
          </Button>
          {phase === "aliases" ? (
            <Button type="button" variant="primary" size="xs" className={SMALL_ACTION} onClick={showDark} data-testid="brand-dark-mode-preview">
              Preview in dark
            </Button>
          ) : (
            <Button type="button" variant="primary" size="xs" className={SMALL_ACTION} onClick={() => void switchOn()} disabled={guard.busy} data-testid="brand-dark-mode-confirm">
              {failed ? "Retry" : "Confirm"}
            </Button>
          )}
        </div>
      ) : (
        <>
          {failed && (
            <Button type="button" variant="primary" size="xs" className={SMALL_ACTION} onClick={() => void switchOn()} disabled={guard.busy} data-testid="brand-dark-mode-retry">
              Retry
            </Button>
          )}
          {composer?.colorMode && <PreviewSwitch composer={composer} siteOff={siteMode === "off"} />}
          {siteMode === "off" && <p className={`${COPY} tw:text-[var(--bk-ink-muted)]`}>Existing sites start with Dark mode Off.</p>}
        </>
      )}
    </section>
  );
};

/** The board's two-button switch: the chosen one filled accent, the other a
 *  hairline secondary (8224:238726 "Action · Off"). */
const SegButton: React.FC<{ on: boolean; onClick: () => void; testId: string; disabled?: boolean; children: React.ReactNode }> = ({
  on,
  onClick,
  testId,
  disabled,
  children,
}) => (
  <Button
    type="button"
    variant={on ? "primary" : "secondary"}
    size="xs"
    aria-pressed={on}
    onClick={onClick}
    disabled={disabled}
    className={on ? SMALL_ACTION : SECONDARY}
    data-testid={testId}
  >
    {children}
  </Button>
);

/** Light / Dark preview of the canvas — the designer's view, never the site's
 *  setting. Dark is disabled while the site's Dark mode is Off (8224:241285):
 *  an Off site publishes light only, so there is nothing dark to see. */
const PreviewSwitch: React.FC<{ composer: Composer; siteOff: boolean }> = ({ composer, siteOff }) => {
  useColorMode(composer);
  const resolved = composer.colorMode.resolved?.() === "dark" && !siteOff ? "dark" : "light";
  return (
    <div className="tw:flex tw:items-center tw:gap-2" role="group" aria-label="Canvas preview">
      <SegButton on={resolved === "light"} onClick={() => composer.colorMode.set("light")} testId="brand-dark-mode-preview-light">
        Light preview
      </SegButton>
      <SegButton
        on={resolved === "dark"}
        onClick={() => composer.colorMode.set("dark")}
        disabled={siteOff}
        testId="brand-dark-mode-preview-dark"
      >
        Dark preview
      </SegButton>
    </div>
  );
};
