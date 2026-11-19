/**
 * Security headers — 2L9 B8-SH01…SH11 (245:47988…248:16058): the restore
 * line, then Content Security Policy (a mono well beside its side label),
 * Browser policies (X-Frame-Options and Referrer-Policy, a select each), HSTS
 * (`Enable HSTS` with `Max age` under it, presets as "1 year · 31536000
 * seconds") and Permissions-Policy.
 *
 * The five columns come off the Site row on open (3397:33335 loading,
 * 3397:33383 load-error with Try again). Edits stay here until Save, when
 * the screen's own handler writes `settings.update` through `updateSiteColumns`
 * — a refusal throws `SettingsSaveError`, the shell's banner (3397:33431) sits
 * over the strip and each refused column is said under its control. HSTS is stored as
 * seconds in `hstsMaxAge`: the toggle off writes null; a stored value the
 * presets do not carry stays "<n> seconds (custom)", never snapped to the
 * nearest preset, and the line under Max age says what is kept or what an
 * unsaved choice changes.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { ToggleSwitch } from "@/editor/chrome-ui";
import { updateSiteColumns } from "@/services/BuildrikSyncProvider";
import type { UpdateSiteSettingsInput } from "@buildrik/shared/schemas/site-detail";
import {
  Input,
  LoadCard,
  SCREEN_EMPTY,
  SCREEN_FIELD_ERROR,
  SET_RESTORE_STRIP,
  SET_ROW_LABEL,
  SaveErrorBanner,
  Screen,
  Section,
  Select,
  Textarea,
} from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";

/* The two enum columns, as the server takes them — a value typed here that
   the schema does not carry fails tsc rather than the save. */
type XFrameOptions = NonNullable<UpdateSiteSettingsInput["xFrameOptions"]>;
type ReferrerPolicy = NonNullable<UpdateSiteSettingsInput["referrerPolicy"]>;

const X_FRAME_OPTIONS = ["DENY", "SAMEORIGIN"] as const satisfies readonly XFrameOptions[];
const REFERRER_POLICIES = [
  "no-referrer",
  "no-referrer-when-downgrade",
  "origin",
  "origin-when-cross-origin",
  "same-origin",
  "strict-origin",
  "strict-origin-when-cross-origin",
  "unsafe-url",
] as const satisfies readonly ReferrerPolicy[];

/* The Max age presets (2L9 B8-SH02 245:48243: "1 year · 31536000
   seconds"), storing seconds. Two years is what the toggle turns on to. */
const HSTS_MAX_AGES: ReadonlyArray<{ label: string; seconds: number }> = [
  { label: "1 month", seconds: 2592000 },
  { label: "6 months", seconds: 15552000 },
  { label: "1 year", seconds: 31536000 },
  { label: "2 years", seconds: 63072000 },
].map((p) => ({ ...p, label: `${p.label} · ${p.seconds} seconds` }));
const HSTS_DEFAULT_MAX_AGE = 63072000;

/** What this screen reads off `siteDetail.settings.get`. */
interface HeadersRow {
  cspPolicy?: string | null;
  hstsMaxAge?: number | null;
  xFrameOptions?: string | null;
  referrerPolicy?: string | null;
  permissionsPolicy?: string | null;
}

/* Label-left rows at the 180 label column (the SEO screen's Indexing card set
   the shape). `stem` is the label's slug — the `set-field-*` anchors the S7
   probes target. Every label centres on its control — the CSP well too
   (4418:128374, a 520 well that grows with its content). */
const Row: React.FC<{
  stem: string;
  label: string;
  htmlFor?: string;
  /** B8-SH01: the free-text headers (CSP, Permissions-Policy) put the label over a full-width field. */
  stacked?: boolean;
  children: React.ReactNode;
}> = ({ stem, label, htmlFor, stacked = false, children }) => {
  return (
    <div
      className={stacked ? "tw:col-span-full tw:flex tw:flex-col tw:gap-1" : "tw:col-span-full tw:flex tw:min-h-8 tw:items-center tw:gap-3"}
      data-testid={`set-field-${stem}`}
    >
      {htmlFor ? (
        <label htmlFor={htmlFor} className={SET_ROW_LABEL} data-testid={`set-field-label-${stem}`}>
          {label}
        </label>
      ) : (
        <span id={`${stem}-label`} className={SET_ROW_LABEL} data-testid={`set-field-label-${stem}`}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
};

const CONTROL = "tw:min-w-0 tw:flex-1";
/* B8-SH01/SH06: the Max age note, 12 muted, from the card's left edge. */
const HSTS_NOTE = "tw:col-span-full tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/** A column the server refused on the last Save, under its row at the control's column. */
const FieldError: React.FC<{ message?: string; stacked?: boolean }> = ({ message, stacked = false }) =>
  message ? (
    <div role="alert" className={`${SCREEN_FIELD_ERROR} tw:col-span-full${stacked ? "" : " tw:pl-51"}`}>
      {message}
    </div>
  ) : null;

export const HeadersScreen: React.FC<ScreenProps> = ({
  projectId,
  onDirtyChange,
  registerSaveHandler,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
  fieldErrors,
}) => {
  const online = useOnlineStatus();
  const [csp, setCsp] = React.useState("");
  const [xFrame, setXFrame] = React.useState<XFrameOptions | "">("");
  const [referrer, setReferrer] = React.useState<ReferrerPolicy | "">("");
  const [hstsEnabled, setHstsEnabled] = React.useState(false);
  /* The seconds the Max age shows — kept while the toggle is off, so turning
     HSTS back on returns to what was chosen rather than to the default. */
  const [hstsMaxAge, setHstsMaxAge] = React.useState(HSTS_DEFAULT_MAX_AGE);
  const [permissions, setPermissions] = React.useState("");
  /* The columns as the server holds them — dirty is a difference from them. */
  const [saved, setSaved] = React.useState<string | null>(null);

  const load = useServerLoad<HeadersRow>(
    projectId,
    (client, siteId) => client.siteDetail.settings.get.query({ siteId }),
    (row) => {
      setCsp(row.cspPolicy ?? "");
      setXFrame(X_FRAME_OPTIONS.find((v) => v === row.xFrameOptions) ?? "");
      setReferrer(REFERRER_POLICIES.find((v) => v === row.referrerPolicy) ?? "");
      setHstsEnabled(row.hstsMaxAge != null);
      setHstsMaxAge(row.hstsMaxAge ?? HSTS_DEFAULT_MAX_AGE);
      setPermissions(row.permissionsPolicy ?? "");
      setSaved(
        JSON.stringify({
          cspPolicy: row.cspPolicy?.trim() || null,
          hstsMaxAge: row.hstsMaxAge ?? null,
          xFrameOptions: X_FRAME_OPTIONS.find((v) => v === row.xFrameOptions) ?? null,
          referrerPolicy: REFERRER_POLICIES.find((v) => v === row.referrerPolicy) ?? null,
          permissionsPolicy: row.permissionsPolicy?.trim() || null,
        }),
      );
    },
    { onLoadStateChange, registerRetryLoad }
  );

  const patch = React.useMemo(
    () => ({
      cspPolicy: csp.trim() || null,
      hstsMaxAge: hstsEnabled ? hstsMaxAge : null,
      xFrameOptions: xFrame || null,
      referrerPolicy: referrer || null,
      permissionsPolicy: permissions.trim() || null,
    }),
    [csp, hstsEnabled, hstsMaxAge, xFrame, referrer, permissions],
  );
  const dirty = saved !== null && JSON.stringify(patch) !== saved;

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const handleSave = React.useCallback(async () => {
    if (!projectId) return;
    // Rejects on failure — the shell's Save keeps the banner and Retry save up.
    await updateSiteColumns(projectId, patch);
    setSaved(JSON.stringify(patch));
  }, [projectId, patch]);

  // The shell's Save changes runs this instead of composer.saveProject(),
  // which omits the header columns. Registered only while there is something
  // to save.
  React.useEffect(() => {
    if (!registerSaveHandler) return;
    registerSaveHandler(dirty ? handleSave : null);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, dirty, handleSave]);

  if (!projectId) {
    return (
      <Screen>
        <Section title="Security headers">
          <div className={SCREEN_EMPTY}>Open this site from the dashboard to manage headers.</div>
        </Section>
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Security headers"
          state={load.state}
          errorLine="The settings service did not respond. Your existing configuration has not changed."
          failure={load.failure}
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  /* A stored max-age the presets do not carry (86400, 300 from the old
     testing preset) stays its own "<n> seconds (custom)" option at the top
     (B8-SH01/SH02), so opening the screen changes nothing and the custom
     value can still be chosen back after trying a preset. */
  const savedMaxAge: number | null = saved ? (JSON.parse(saved) as { hstsMaxAge: number | null }).hstsMaxAge : null;
  const savedIsCustom = savedMaxAge !== null && !HSTS_MAX_AGES.some((p) => p.seconds === savedMaxAge);
  const customAge = savedIsCustom ? savedMaxAge : HSTS_MAX_AGES.some((p) => p.seconds === hstsMaxAge) ? null : hstsMaxAge;
  const maxAges =
    customAge === null ? HSTS_MAX_AGES : [{ label: `${customAge} seconds (custom)`, seconds: customAge }, ...HSTS_MAX_AGES];
  /* The line under Max age: what is kept, or what the unsaved choice changes
     (B8-SH01 / SH06 / SH11). */
  const maxAgeNote = !hstsEnabled
    ? null
    : savedIsCustom && hstsMaxAge === savedMaxAge
      ? "Existing custom value retained. Changing presets is an explicit edit."
      : savedIsCustom
        ? `Unsaved choice: ${hstsMaxAge} seconds. Saved custom value: ${savedMaxAge} seconds.`
        : savedMaxAge !== hstsMaxAge
          ? `The chosen preset changes max age to ${hstsMaxAge} seconds. Save settings to apply.`
          : null;

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <div className={SET_RESTORE_STRIP} data-testid="set-hd-restore">
        Restoring a site version leaves this configuration unchanged.
      </div>
      {/* B8-SH04 245:48768: offline, a plain line under the restore note —
          the screen stays editable; only Save waits for the network. */}
      {online ? null : (
        <div className={SET_RESTORE_STRIP} role="status" data-testid="set-offline">
          You’re offline. Save settings needs a connection.
        </div>
      )}

      <Section title="Content Security Policy">
        <Row stem="csp-header-value" label="CSP header value" htmlFor="set-hd-csp" stacked>
          <div className="tw:w-full">
            <Textarea
              id="set-hd-csp"
              value={csp}
              onChange={(e) => {
                setCsp(e.target.value);
              }}
              placeholder="default-src 'self'"
              spellCheck={false}
              className="tw:min-h-7 tw:resize-y tw:border-[var(--bk-border-medium)] tw:px-3 tw:py-1.5 tw:[field-sizing:content] tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
              data-testid="set-hd-csp"
            />
          </div>
        </Row>
        <FieldError message={fieldErrors?.cspPolicy} stacked />
      </Section>

      {/* B8-SH01: the two browser policies share one card. */}
      <Section title="Browser policies">
        <Row stem="x-frame-policy" label="X-Frame-Options" htmlFor="set-hd-xfo">
          <Select
            id="set-hd-xfo"
            className={CONTROL}
            value={xFrame}
            onChange={(e) => {
              setXFrame(X_FRAME_OPTIONS.find((v) => v === e.target.value) ?? "");
            }}
            data-testid="set-hd-xfo"
          >
            {X_FRAME_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value="">Not set</option>
          </Select>
        </Row>
        <Row stem="referrer-policy" label="Referrer-Policy" htmlFor="set-hd-referrer">
          <Select
            id="set-hd-referrer"
            className={CONTROL}
            value={referrer}
            onChange={(e) => {
              setReferrer(REFERRER_POLICIES.find((v) => v === e.target.value) ?? "");
            }}
            data-testid="set-hd-referrer"
          >
            {REFERRER_POLICIES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
            <option value="">Not set</option>
          </Select>
        </Row>
      </Section>

      <Section title="HSTS">
        <Row stem="enable-hsts" label="Enable HSTS">
          <div className="tw:flex tw:items-center tw:gap-3">
            <ToggleSwitch
              id="set-hd-hsts-enable"
              checked={hstsEnabled}
              onChange={(next) => {
                setHstsEnabled(next);
              }}
              aria-labelledby="enable-hsts-label"
              sizing="md"
              data-testid="set-hd-hsts-enable"
            />
            {/* B8-SH01: the switch says its state beside it. */}
            <span className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]" aria-hidden>
              {hstsEnabled ? "Enabled" : "Off"}
            </span>
          </div>
        </Row>
        <Row stem="max-age" label="Max age" htmlFor="set-hd-hsts-max">
          <Select
            id="set-hd-hsts-max"
            className={CONTROL}
            value={String(hstsMaxAge)}
            disabled={!hstsEnabled}
            onChange={(e) => {
              setHstsMaxAge(Number(e.target.value));
            }}
            data-testid="set-hd-hsts-max"
          >
            {maxAges.map((p) => (
              <option key={p.seconds} value={String(p.seconds)}>
                {p.label}
              </option>
            ))}
          </Select>
        </Row>
        {maxAgeNote ? (
          <p className={HSTS_NOTE} data-testid="set-hd-hsts-note">
            {maxAgeNote}
          </p>
        ) : null}
        <FieldError message={fieldErrors?.hstsMaxAge} />
      </Section>

      <Section title="Permissions-Policy">
        <Row stem="header-value" label="Header value" htmlFor="set-hd-permissions" stacked>
          <div className={CONTROL}>
            <Input
              id="set-hd-permissions"
              value={permissions}
              onChange={(e) => {
                setPermissions(e.target.value);
              }}
              placeholder="camera=(), microphone=()"
              spellCheck={false}
              data-testid="set-hd-permissions"
            />
          </div>
        </Row>
        <FieldError message={fieldErrors?.permissionsPolicy} stacked />
      </Section>
    </Screen>
  );
};
