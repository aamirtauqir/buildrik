/**
 * Security headers — 4418:128374 (Clone 3397:32602): the amber restore strip,
 * then one card per response header the published site sends — Content
 * Security Policy (a mono well beside its side label), X-Frame-Options and
 * Referrer-Policy (a `Policy` select each) and HSTS (`Enable HSTS` with a
 * `Max age` under it). Permissions-Policy sits below them: the frame does
 * not draw it, but `Site.permissionsPolicy` exists and no other screen edits
 * it, so the code's row stays as the fifth card.
 *
 * The five columns come off the Site row on open (3397:33335 loading,
 * 3397:33383 load-error with Try again). Edits stay here until Save, when
 * the screen's own handler writes `settings.update` through `updateSiteColumns`
 * — a refusal throws `SettingsSaveError`, the shell's banner (3397:33431) sits
 * over the strip and each refused column is said under its control. HSTS is stored as
 * seconds in `hstsMaxAge`: the toggle off writes null; a stored value the
 * Max age list does not carry is shown as `<n> seconds`, never snapped to
 * the nearest preset.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
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

/* The Max age list the frame draws (3397:32602: `2 years (recommended)`),
   storing seconds. Two years is what the toggle turns on to. */
const HSTS_MAX_AGES: ReadonlyArray<{ label: string; seconds: number }> = [
  { label: "1 month", seconds: 2592000 },
  { label: "6 months", seconds: 15552000 },
  { label: "1 year", seconds: 31536000 },
  { label: "2 years (recommended)", seconds: 63072000 },
];
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
  children: React.ReactNode;
}> = ({ stem, label, htmlFor, children }) => {
  return (
    <div
      className="tw:col-span-full tw:flex tw:min-h-8 tw:items-center tw:gap-4"
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

/** A column the server refused on the last Save, under its row at the control's column. */
const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <div role="alert" className={`${SCREEN_FIELD_ERROR} tw:col-span-full tw:pl-49`}>
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
          line="CSP, X-Frame-Options, Referrer-Policy and HSTS."
          state={load.state}
          errorLine="Couldn't load your headers. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  /* A stored max-age the list does not carry (300 from the old testing
     preset, say) is shown as its own `<n> seconds` option, so opening the
     screen changes nothing. */
  const maxAges = HSTS_MAX_AGES.some((p) => p.seconds === hstsMaxAge)
    ? HSTS_MAX_AGES
    : [{ label: `${hstsMaxAge} seconds`, seconds: hstsMaxAge }, ...HSTS_MAX_AGES];

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <div className={SET_RESTORE_STRIP} data-testid="set-hd-restore">
        Restoring a site version leaves this configuration unchanged.
      </div>

      <Section title="Content Security Policy">
        <Row stem="csp-header-value" label="CSP header value" htmlFor="set-hd-csp">
          <div className="tw:w-130 tw:shrink-0">
            <Textarea
              id="set-hd-csp"
              value={csp}
              onChange={(e) => {
                setCsp(e.target.value);
              }}
              placeholder="default-src 'self'"
              spellCheck={false}
              className="tw:min-h-9 tw:resize-y tw:border-[var(--bk-border-medium)] tw:px-3 tw:py-2.5 tw:[field-sizing:content] tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
              data-testid="set-hd-csp"
            />
          </div>
        </Row>
        <FieldError message={fieldErrors?.cspPolicy} />
      </Section>

      <Section title="X-Frame-Options">
        <Row stem="x-frame-policy" label="Policy" htmlFor="set-hd-xfo">
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
      </Section>

      <Section title="Referrer-Policy">
        <Row stem="referrer-policy" label="Policy" htmlFor="set-hd-referrer">
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

      <Section title="HSTS (HTTP Strict Transport Security)">
        <Row stem="enable-hsts" label="Enable HSTS">
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
        <FieldError message={fieldErrors?.hstsMaxAge} />
      </Section>

      {/* Not on 3397:32602 — kept because the Site column exists and nothing
          else edits it (phase3-brief.md, "Headers"). */}
      <Section
        title="Permissions-Policy"
        desc="Which browser features (camera, microphone, geolocation) the published site may use."
      >
        <Row stem="header-value" label="Header value" htmlFor="set-hd-permissions">
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
        <FieldError message={fieldErrors?.permissionsPolicy} />
      </Section>
    </Screen>
  );
};
