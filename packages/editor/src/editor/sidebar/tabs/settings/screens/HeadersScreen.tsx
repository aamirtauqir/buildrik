/**
 * Headers — Clone 3397:32602 (`Advanced / Headers`): the amber restore strip,
 * then one card per response header the published site sends — Content
 * Security Policy (a mono well beside its side label), X-Frame-Options and
 * Referrer-Policy (a `Policy` select each) and HSTS (`Enable HSTS` with a
 * `Max age` under it). Permissions-Policy sits below them: the frame does
 * not draw it, but `Site.permissionsPolicy` exists and no other screen edits
 * it, so the code's row stays as the fifth card.
 *
 * The five columns come off the Site row on open (3397:33335 loading,
 * 3397:33383 load-error with Try again). Edits stay here until Save, when
 * the screen's own handler writes `settings.update` — it rejects on failure,
 * and the shell's banner (3397:33431) sits over the strip. HSTS is stored as
 * seconds in `hstsMaxAge`: the toggle off writes null; a stored value the
 * Max age list does not carry is shown as `<n> seconds`, never snapped to
 * the nearest preset.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ToggleSwitch } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import type { UpdateSiteSettingsInput } from "@buildrik/shared/schemas/site-detail";
import { Input, LoadCard, SCREEN_EMPTY, SaveErrorBanner, Screen, Section, Select, Textarea } from "../shared";
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

/* The amber strip under the header: --bk-warning ink on the warning tint. */
const RESTORE_STRIP =
  "tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-yellow-100)] tw:bg-[var(--bk-warning-tint)] " +
  "tw:px-3 tw:py-2.5 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-warning)]";

/* Label-left rows at the 192 label column (the SEO screen's Indexing card set
   the shape). `stem` is the label's slug — the `set-field-*` anchors the S7
   probes target. A row with a 32 control centres its label; the CSP well is
   top-aligned, its label on the well's first line (the Custom code cards). */
const ROW_LABEL = "tw:w-48 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

const Row: React.FC<{
  stem: string;
  label: string;
  htmlFor?: string;
  align?: "center" | "top";
  children: React.ReactNode;
}> = ({ stem, label, htmlFor, align = "center", children }) => {
  const labelClass = align === "top" ? `${ROW_LABEL} tw:pt-2` : ROW_LABEL;
  return (
    <div
      className={`tw:col-span-full tw:flex tw:min-h-8 tw:gap-4 ${align === "top" ? "tw:items-start" : "tw:items-center"}`}
      data-testid={`set-field-${stem}`}
    >
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass} data-testid={`set-field-label-${stem}`}>
          {label}
        </label>
      ) : (
        <span id={`${stem}-label`} className={labelClass} data-testid={`set-field-label-${stem}`}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
};

const CONTROL = "tw:min-w-0 tw:flex-1";

export const HeadersScreen: React.FC<ScreenProps> = ({
  projectId,
  onDirtyChange,
  registerSaveHandler,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
}) => {
  const [csp, setCsp] = React.useState("");
  const [xFrame, setXFrame] = React.useState<XFrameOptions | "">("");
  const [referrer, setReferrer] = React.useState<ReferrerPolicy | "">("");
  const [hstsEnabled, setHstsEnabled] = React.useState(false);
  /* The seconds the Max age shows — kept while the toggle is off, so turning
     HSTS back on returns to what was chosen rather than to the default. */
  const [hstsMaxAge, setHstsMaxAge] = React.useState(HSTS_DEFAULT_MAX_AGE);
  const [permissions, setPermissions] = React.useState("");
  const [dirty, setDirty] = React.useState(false);

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
      setDirty(false);
    },
    { onLoadStateChange, registerRetryLoad }
  );

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const handleSave = React.useCallback(async () => {
    if (!projectId) return;
    // Rejects on failure — the shell's Save keeps the banner and Retry save up.
    await getBuildrikClient(DASHBOARD_URL).siteDetail.settings.update.mutate({
      id: projectId,
      cspPolicy: csp.trim() || null,
      hstsMaxAge: hstsEnabled ? hstsMaxAge : null,
      xFrameOptions: xFrame || null,
      referrerPolicy: referrer || null,
      permissionsPolicy: permissions.trim() || null,
    });
    setDirty(false);
  }, [projectId, csp, hstsEnabled, hstsMaxAge, xFrame, referrer, permissions]);

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
        <Section title="Headers">
          <div className={SCREEN_EMPTY}>Open this site from the dashboard to manage headers.</div>
        </Section>
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Headers"
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

      <div className={RESTORE_STRIP} data-testid="set-hd-restore">
        Restoring a site version leaves this configuration unchanged.
      </div>

      <Section title="Content Security Policy">
        <Row stem="csp-header-value" label="CSP header value" htmlFor="set-hd-csp" align="top">
          <div className={CONTROL}>
            <Textarea
              id="set-hd-csp"
              value={csp}
              onChange={(e) => {
                setCsp(e.target.value);
                setDirty(true);
              }}
              placeholder="default-src 'self'"
              rows={3}
              spellCheck={false}
              className="tw:resize-y tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)] tw:leading-5"
              data-testid="set-hd-csp"
            />
          </div>
        </Row>
      </Section>

      <Section title="X-Frame-Options">
        <Row stem="x-frame-policy" label="Policy" htmlFor="set-hd-xfo">
          <Select
            id="set-hd-xfo"
            className={CONTROL}
            value={xFrame}
            onChange={(e) => {
              setXFrame(X_FRAME_OPTIONS.find((v) => v === e.target.value) ?? "");
              setDirty(true);
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
              setDirty(true);
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
              setDirty(true);
            }}
            aria-labelledby="enable-hsts-label"
            sizing="sm"
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
              setDirty(true);
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
                setDirty(true);
              }}
              placeholder="camera=(), microphone=()"
              spellCheck={false}
              data-testid="set-hd-permissions"
            />
          </div>
        </Row>
      </Section>
    </Screen>
  );
};
