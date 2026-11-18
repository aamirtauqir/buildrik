/**
 * DarkModeCard — Brand › Dark mode, Figma 2L9 B6-B12…B14:
 *
 *   B6-B12  Mode · Off   "Website appearance" — "Auto follows the visitor’s
 *                        device appearance. Editor controls stay light." —
 *                        [Turn on Auto…]
 *   B6-B13  confirm      "Turn on automatic dark mode?" — what Auto adds (the
 *                        generated dark values, or "No new values are
 *                        needed."), the restore-point line, Cancel · Turn on Auto
 *                        (+ Preview in dark when values are generated)
 *   B6-B14  Mode · Auto  [Turn off Auto]
 *
 * Turning Auto on fills every semantic colour with no dark value first
 * (`proposeMissingDarks`, D11), takes a restore point, then ONE
 * `setDarkMode("auto", tokens?)` — one ⌘Z. A restore point that cannot be
 * saved blocks the switch (OQ-6). Auto → Off takes no restore point (OQ-7).
 * "Preview in dark" paints the proposal through the preview layer
 * (`useBrandPreview`), recomputed on every settings change and cleared on
 * Cancel, on Turn on Auto and on unmount.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { Button, Modal } from "@/editor/chrome-ui";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { proposeMissingDarks } from "@/engine/designSystem/scale";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useProjectTokenStore } from "@/editor/design-system/state/TokenRegistryContext";
import { useBrandPreview } from "@/editor/design-system/state/useBrandPreview";
import { useGuardedApply } from "@/editor/design-system/state/useGuardedApply";
import { takeRestorePoint } from "@/editor/design-system/state/useBrandRestorePoints";
import { useSiteDarkMode } from "@/editor/design-system/state/useSiteDarkMode";
import { displayValue } from "../colors/ColorTokenList";
import { NOTICE, SMALL_ACTION } from "./UsageHighlight";
import { CARD, COPY, TITLE } from "./ConnectTokensCheck";

/** OQ-6's copy, shared by every apply that takes a restore point first. */
export const RESTORE_POINT_FAILED = "We couldn't save a restore point — nothing was changed.";

const SECONDARY = `${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`;
const LINE = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";

type Phase = "idle" | "confirm" | "preview";

export interface DarkModeCardProps {
  composer: Composer | null | undefined;
  /** The workspace's preview-only Light / Dark switch (L4-021) — the card
   *  draws it as "Light preview · Dark preview". Absent: not drawn. */
  previewTheme?: "light" | "dark";
  onPreviewTheme?: (theme: "light" | "dark") => void;
}

export const DarkModeCard: React.FC<DarkModeCardProps> = ({ composer, previewTheme, onPreviewTheme }) => {
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

  const askAuto = () => {
    if (siteMode === "auto" || phase !== "idle") return;
    setFailed(false);
    setPhase("confirm");
  };
  const turnOff = () => {
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

  const nameOf = (id: string) => {
    const t = store.all.find((x) => x.id === id);
    return t ? (t.friendlyName ?? t.name) : id;
  };
  const semanticCount = store.all.filter((t) => t.kind === "color" && t.layer === "semantic" && !t.replacedBy).length;
  const generated = proposal.filled.map((id) => (
    <p key={id} className={LINE} data-testid={`brand-dark-alias-${id}`} data-hex={resolveTokenLiteral(proposal.tokens, id, "dark") ?? ""}>
      {nameOf(id)} → {displayValue(resolveTokenLiteral(proposal.tokens, id, "dark") ?? "")}
    </p>
  ));
  const failedNotice = failed && (
    <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-error-tint)]`} role="alert" data-testid="brand-dark-mode-error">
      {RESTORE_POINT_FAILED}
    </p>
  );
  const confirmButton = (
    <Button type="button" variant="primary" size="xs" className={SMALL_ACTION} onClick={() => void switchOn()} disabled={guard.busy} data-testid="brand-dark-mode-confirm">
      {failed ? "Retry" : "Turn on Auto"}
    </Button>
  );
  const cancelButton = (
    <Button type="button" variant="secondary" size="xs" className={SECONDARY} onClick={cancel} disabled={guard.busy} data-testid="brand-dark-mode-cancel">
      Cancel
    </Button>
  );

  return (
    <section aria-label="Dark mode" className={CARD} data-testid="brand-dark-mode" data-dark-mode-state={phase !== "idle" ? phase : siteMode}>
      <p className={TITLE} data-testid="brand-dark-mode-state">Mode · {siteMode === "auto" ? "Auto" : "Off"}</p>
      <p className={`${LINE} tw:font-semibold`}>Website appearance</p>
      <p className={COPY}>Auto follows the visitor’s device appearance. Editor controls stay light.</p>

      {phase === "preview" ? (
        <>
          <p className={TITLE}>Generated dark values</p>
          {generated}
          <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-accent-tint)]`} role="status">
            Preview only · Turn on Auto creates a restore point first. Cancel keeps Dark mode Off.
          </p>
          {failedNotice}
          <div className="tw:flex tw:items-center tw:gap-2">
            {cancelButton}
            {confirmButton}
          </div>
        </>
      ) : siteMode === "off" ? (
        <Button type="button" variant="secondary" size="xs" className={`${SECONDARY} tw:self-start`} onClick={askAuto} disabled={guard.busy} data-testid="brand-dark-mode-auto">
          Turn on Auto…
        </Button>
      ) : (
        <Button type="button" variant="secondary" size="xs" className={`${SECONDARY} tw:self-start`} onClick={turnOff} data-testid="brand-dark-mode-off">
          Turn off Auto
        </Button>
      )}

      {phase === "idle" && previewTheme && onPreviewTheme && (
        <PreviewSwitch theme={previewTheme} onChange={onPreviewTheme} siteOff={siteMode === "off"} />
      )}

      <Modal
        open={phase === "confirm"}
        onClose={cancel}
        title="Turn on automatic dark mode?"
        testId="brand-dark-mode-dialog"
        footer={
          <>
            {cancelButton}
            {proposal.filled.length > 0 && (
              <Button type="button" variant="secondary" size="xs" className={SECONDARY} onClick={showDark} disabled={guard.busy} data-testid="brand-dark-mode-preview">
                Preview in dark
              </Button>
            )}
            {confirmButton}
          </>
        }
      >
        <div className="tw:flex tw:flex-col tw:gap-2">
          {proposal.filled.length === 0 ? (
            <p className={COPY}>
              Your {semanticCount} semantic color{semanticCount === 1 ? "" : "s"} already have dark values. No new values are needed.
            </p>
          ) : (
            <>
              <p className={COPY}>
                {proposal.filled.length} color{proposal.filled.length === 1 ? " has" : "s have"} no dark value. These are generated:
              </p>
              {generated}
            </>
          )}
          <p className={COPY}>A restore point is created first. Auto and any generated dark values apply as one Undo step.</p>
          {failedNotice}
        </div>
      </Modal>
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

/** Light / Dark preview of the canvas — the designer's view, never saved and
 *  never in the undo history (L4-021). Dark is disabled while the site's Dark
 *  mode is Off (8224:241285): an Off site publishes light only, so there is
 *  nothing dark to see. */
const PreviewSwitch: React.FC<{ theme: "light" | "dark"; onChange: (t: "light" | "dark") => void; siteOff: boolean }> = ({
  theme,
  onChange,
  siteOff,
}) => (
  <div className="tw:flex tw:items-center tw:gap-2" role="group" aria-label="Canvas preview">
    <SegButton on={theme === "light"} onClick={() => onChange("light")} testId="brand-dark-mode-preview-light">
      Light preview
    </SegButton>
    <SegButton on={theme === "dark"} onClick={() => onChange("dark")} disabled={siteOff} testId="brand-dark-mode-preview-dark">
      Dark preview
    </SegButton>
  </div>
);
