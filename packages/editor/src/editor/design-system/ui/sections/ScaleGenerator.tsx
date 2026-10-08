/**
 * ScaleGenerator — Brand › Colours › Colour scale generator, board BRP1-M9:
 *
 *   8224:241925  pick-colour      the role's colour in a field, its swatch,
 *                                 Generate scale
 *   8224:242543  generated-scale  11 swatches 50…950, "<Role> · Light → <Role>
 *                                 700 · #… (your colour)", the dark alias,
 *                                 Cancel · Preview
 *   8224:243206  preview          the same, the canvas repainted, Cancel · Confirm
 *   8224:243869  confirmed        "<Role> scale added. <Role> now uses your
 *                                 colour." + the toast "Colour scale applied ·
 *                                 Undo ⌘Z"
 *
 * The swatches are the generator's (`generateColorScale`), never the board's
 * samples; the picked colour is kept EXACTLY at its nearest step. Every
 * semantic colour can take a scale (OQ-3) — the role comes in from the entry
 * (the Colours page action, or a token card's menu). Confirm takes a
 * `generator` restore point first (OQ-6: none, nothing applied), then writes
 * the 11 primitives and the role's light/dark aliases as ONE `setTokens`
 * transaction — one ⌘Z. The preview is cleared on Cancel, on Confirm, on a
 * new colour and on unmount.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { Button, Label, TextInput, BK_HELPER_CLASS, BK_HELPER_ERROR_CLASS } from "@/editor/chrome-ui";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { SCALE_STEPS, applyScaleToRole, generateColorScale, type ColorScale } from "@/engine/designSystem/scale";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useProjectTokenStore } from "@/editor/design-system/state/TokenRegistryContext";
import { useBrandPreview } from "@/editor/design-system/state/useBrandPreview";
import { useGuardedApply } from "@/editor/design-system/state/useGuardedApply";
import { takeRestorePoint } from "@/editor/design-system/state/useBrandRestorePoints";
import { NOTICE, SMALL_ACTION } from "./UsageHighlight";
import { CARD, TITLE } from "./ConnectTokensCheck";
import { RESTORE_POINT_FAILED } from "./DarkModeCard";

const SECONDARY = `${SMALL_ACTION} tw:text-[var(--bk-gray-700)]`;
const LINE = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";

type Phase = "pick" | "generated" | "preview" | "confirmed";

export interface ScaleGeneratorProps {
  composer: Composer | null | undefined;
  /** The semantic colour the scale is for. */
  roleId: string;
  /** After the scale is written — the workspace's toast. */
  onApplied?: () => void;
}

export const ScaleGenerator: React.FC<ScaleGeneratorProps> = ({ composer, roleId, onApplied }) => {
  const store = useProjectTokenStore();
  const preview = useBrandPreview(composer ?? null);
  const guard = useGuardedApply();
  const role = store.all.find((t) => t.id === roleId);
  const roleName = role ? (role.friendlyName ?? role.name) : roleId;

  const [input, setInput] = React.useState(() => resolveTokenLiteral(store.all, roleId, "light") ?? "");
  const [phase, setPhase] = React.useState<Phase>("pick");
  const [error, setError] = React.useState<string | null>(null);
  const scale = React.useMemo(() => generateColorScale(input), [input]);
  /* Where the scale would land in the set as it is now — the prefix names the
     steps the summary lines call out. */
  const landing = React.useMemo(() => (scale ? applyScaleToRole(store.all, roleId, scale) : null), [scale, store.all, roleId]);
  const stepName = (step: number) => {
    if (!landing?.ok) return `${roleName} ${step}`;
    const t = landing.tokens.find((x) => x.id === `${landing.prefix}-${step}`);
    return t ? t.name : `${roleName} ${step}`;
  };
  const hexAt = (s: ColorScale, step: number) => s.hexes[SCALE_STEPS.indexOf(step as (typeof SCALE_STEPS)[number])];

  const edit = (value: string) => {
    setInput(value);
    setError(null);
    if (phase !== "pick") {
      preview.clear();
      setPhase("pick");
    }
  };
  const cancel = () => {
    preview.clear();
    setError(null);
    setPhase("pick");
  };
  const showPreview = () => {
    if (!scale) return;
    preview.show((tokens, settings) => {
      const r = applyScaleToRole(tokens, roleId, scale);
      return r.ok ? { tokens: r.tokens, darkMode: DarkModeSchema.catch("off").parse(settings.darkMode) } : null;
    });
    setPhase("preview");
  };
  const confirm = () =>
    guard.run(async () => {
      if (!composer || !scale) return false;
      setError(null);
      const siteId = getSiteIdFromUrl();
      if (!siteId || !(await takeRestorePoint(composer, siteId, "generator"))) {
        setError(RESTORE_POINT_FAILED);
        return false;
      }
      preview.clear();
      const r = applyScaleToRole(store.all, roleId, scale);
      if (!r.ok || !composer.designSystem.setTokens(r.tokens, "Generate colour scale")) {
        setError("The colour scale wasn't applied — nothing was changed.");
        setPhase("generated");
        return false;
      }
      setPhase("confirmed");
      onApplied?.();
      return true;
    });

  const invalid = input.trim() !== "" && !scale;
  const shown = phase !== "pick" && scale;

  return (
    <section aria-label="Colour scale generator" className={CARD} data-testid="brand-scale-generator" data-scale-state={phase}>
      <p className={TITLE}>One colour → full scale</p>
      <div className="tw:flex tw:w-full tw:flex-col tw:gap-1">
        <Label htmlFor="brand-scale-input" className="tw:text-[length:var(--bk-text-11)] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-soft)]">
          Brand colour
        </Label>
        <TextInput
          id="brand-scale-input"
          sizing="sm"
          value={input}
          onChange={(e) => edit(e.target.value)}
          color={invalid ? "failure" : undefined}
          aria-invalid={invalid || undefined}
          data-testid="brand-scale-input"
        />
        <p
          className={`${invalid ? BK_HELPER_ERROR_CLASS : `${BK_HELPER_CLASS} tw:text-[var(--bk-ink-muted)]`} tw:m-0 tw:leading-4`}
          data-testid="brand-scale-helper"
        >
          {invalid ? "Enter an opaque colour, like #1A56DB." : "Your picked colour is kept exactly."}
        </p>
      </div>

      {shown ? (
        <>
          <ol className="tw:m-0 tw:flex tw:list-none tw:gap-1 tw:p-0" aria-label="Generated scale" data-testid="brand-scale-swatches">
            {SCALE_STEPS.map((step, i) => (
              <li
                key={step}
                className="tw:flex tw:flex-col tw:items-start tw:gap-1"
                data-step={step}
                data-hex={scale.hexes[i]}
                data-picked={step === scale.pickedStep || undefined}
                data-dark={step === scale.darkStep || undefined}
              >
                <span
                  aria-label={`${step} ${scale.hexes[i]}`}
                  className="tw:size-12 tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)]"
                  /* The generated value is data, not chrome: inline, like every swatch. */
                  style={{ background: scale.hexes[i] }}
                />
                <span className="tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-soft)]">{step}</span>
              </li>
            ))}
          </ol>
          <p className={`${LINE} tw:font-semibold tw:text-[var(--bk-ink)]`} data-testid="brand-scale-light">
            {roleName} · Light → {stepName(scale.pickedStep)} · {hexAt(scale, scale.pickedStep)} (your colour)
          </p>
          <p className={LINE} data-testid="brand-scale-dark">
            {roleName} · Dark → {stepName(scale.darkStep)} · {hexAt(scale, scale.darkStep)}
          </p>
          <p className={LINE}>11 primitive values with light and dark semantic aliases.</p>
        </>
      ) : (
        <span
          aria-hidden="true"
          className="tw:size-12 tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)]"
          style={scale ? { background: scale.hexes[SCALE_STEPS.indexOf(scale.pickedStep)] } : undefined}
          data-testid="brand-scale-pick-swatch"
        />
      )}

      {error && (
        <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-error-tint)]`} role="alert" data-testid="brand-scale-error">
          {error}
        </p>
      )}

      {phase === "confirmed" ? (
        <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-success-tint)]`} role="status" data-testid="brand-scale-confirmed">
          {roleName} scale added. {roleName} now uses your colour.
        </p>
      ) : phase === "pick" ? (
        <Button
          type="button"
          variant="primary"
          size="xs"
          className={SMALL_ACTION}
          disabled={!scale || !landing?.ok}
          onClick={() => setPhase("generated")}
          data-testid="brand-scale-generate"
        >
          Generate scale
        </Button>
      ) : (
        <>
          {!error && (
            <p className={`${NOTICE} tw:w-full tw:bg-[var(--bk-accent-tint)]`} role="status">
              Preview only · Confirm creates a restore point. One ⌘Z restores the previous brand.
            </p>
          )}
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button type="button" variant="secondary" size="xs" className={SECONDARY} onClick={cancel} disabled={guard.busy} data-testid="brand-scale-cancel">
              Cancel
            </Button>
            {phase === "generated" ? (
              <Button type="button" variant="primary" size="xs" className={SMALL_ACTION} onClick={showPreview} data-testid="brand-scale-preview">
                Preview
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="xs"
                className={SMALL_ACTION}
                onClick={() => void confirm()}
                disabled={guard.busy}
                data-testid="brand-scale-confirm"
              >
                {error ? "Retry" : "Confirm"}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
};
