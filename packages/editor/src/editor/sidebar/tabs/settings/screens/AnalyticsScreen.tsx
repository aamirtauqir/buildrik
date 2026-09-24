/**
 * Analytics — Clone 3397:32295 (`Visitors / Analytics`): Google Analytics
 * (enable · Measurement ID · Connection status · Last received data), Google
 * Tag Manager, Meta Pixel, then Microsoft Clarity below the fold. No Consent
 * card (G3-108, 4418:127827): its switch recorded a flag nothing reads — no
 * banner, no export effect — so it is hidden until wired; the stored value is
 * written back unchanged on the flush.
 * Label-left rows at 32, as SEO's Indexing card draws them.
 *
 * Two sources. The ids and toggles are the composer's `projectSettings.
 * analytics`, edited here and flushed once on Save (the shell persists them).
 * The Connection status and Last received data rows are the tracker's own
 * `siteDetail.analytics.status` — OUR `AnalyticsEvent` rows, phase2-backend
 * §5; GA's Data API is OAuth, `blocked:external` — read on open (3953:49515
 * loading, 3953:49670 load-error) and again on Verify, which checks the id's
 * shape, stamps `verifiedAt` into the draft (flushed on the next Save — no
 * mutation of its own, phase2-backend §1) and opens Connection verified
 * (4256:26844). A malformed id shows its provider's sentence under the field
 * and holds Save (3397:34148); a refused save shows the banner (3951:26455).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Badge, Button, ToggleSwitch } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { devError } from "@/shared/utils/devLogger";
import { Input, LoadCard, SCREEN_FIELD_ERROR, SET_BTN, SaveErrorBanner, Screen, Section } from "../shared";
import { ConnectionVerifiedDialog, eventsPhrase } from "../components/ConnectionVerifiedDialog";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import type { AnalyticsStatus } from "@buildrik/shared/schemas/site-detail";
import { validateProviderId } from "./analyticsIds";

const DEFAULT_ANALYTICS = {
  gaId: "",
  gaEnabled: false,
  gaVerifiedAt: undefined as string | undefined,
  gtmId: "",
  gtmEnabled: false,
  pixelId: "",
  pixelEnabled: false,
  clarityId: "",
  clarityEnabled: false,
  cookieConsent: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// The frame's date, time and count shapes — `2 Jul 2025`, `19:38`, `1,284
// events`. Hand-assembled rather than Intl so September is `Sep` on every
// ICU build (en-GB's short month is `Sept` on recent ones) and the live walk
// reads the same on every machine.
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const two = (n: number) => String(n).padStart(2, "0");

/** `2 Jul 2025` — the frame's `d MMM yyyy`, in the viewer's zone. */
export function formatDay(at: string | Date): string {
  const d = new Date(at);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `2 Jul 2025, 19:38`. */
export function formatDayTime(at: string | Date): string {
  const d = new Date(at);
  return `${formatDay(d)}, ${two(d.getHours())}:${two(d.getMinutes())}`;
}

export type ConnectionPill = "RECEIVING DATA" | "NO DATA YET" | "NOT VERIFIED";

/**
 * The Connection status pill: events in the last 24 hours = receiving, no
 * matter what was verified (the events are the tracker's, not GA's); a
 * verified id with none yet = no data yet; otherwise not verified.
 */
export function connectionPill(status: AnalyticsStatus | null, verifiedAt: string | undefined): ConnectionPill {
  if (status && status.events24h > 0) return "RECEIVING DATA";
  return verifiedAt ? "NO DATA YET" : "NOT VERIFIED";
}

/** The Last received data line: `2 Jul 2025, 19:38 · 1,284 events in the last 24 hours` or `No events yet`. */
export function lastReceivedLine(status: AnalyticsStatus | null): string {
  if (!status?.lastEventAt) return "No events yet";
  return `${formatDayTime(status.lastEventAt)} · ${eventsPhrase(status.events24h)} in the last 24 hours`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Row — the label-left row (3397:32295): a 144 label column against a 32
// control, the shape SEO's Indexing card set. `stem` is the label's slug —
// the `set-field-*` anchors the S7 probes already target, and the Search
// landing (`set-field-<fieldId>`) for the rows that have no control of their
// own. Inputs get a real <label>; the switches are labelled by the span's id.
// ─────────────────────────────────────────────────────────────────────────────

const ROW_LABEL =
  "tw:w-48 tw:shrink-0 tw:py-1.5 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

const Row: React.FC<{ stem: string; label: string; htmlFor?: string; children: React.ReactNode }> = ({
  stem,
  label,
  htmlFor,
  children,
}) => (
  <div className="tw:col-span-full tw:flex tw:min-h-8 tw:items-start tw:gap-4" data-testid={`set-field-${stem}`}>
    {htmlFor ? (
      <label htmlFor={htmlFor} className={ROW_LABEL} data-testid={`set-field-label-${stem}`}>
        {label}
      </label>
    ) : (
      <span id={`${stem}-label`} className={ROW_LABEL} data-testid={`set-field-label-${stem}`}>
        {label}
      </span>
    )}
    {children}
  </div>
);

const SWITCH_CELL = "tw:flex tw:min-h-8 tw:items-center";
const INPUT_CELL = "tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1";
/* The frame draws the Last received data line a shade lighter than a value — it is a reading, not an input. */
const LINE_CELL = "tw:flex tw:min-h-8 tw:items-center tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

const PILL =
  "tw:rounded-[var(--bk-radius-sm)] tw:border tw:px-2 tw:py-0 tw:text-[length:var(--bk-text-11)] tw:font-medium tw:uppercase tw:leading-4 tw:tracking-[0.04em]";
const PILL_TONE: Record<ConnectionPill, string> = {
  "RECEIVING DATA": "tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success-text)]",
  "NO DATA YET": "tw:border-[var(--bk-border-medium)] tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)]",
  "NOT VERIFIED": "tw:border-[var(--bk-border-medium)] tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)]",
};

export const AnalyticsScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerSaveHandler,
  registerFlushHandler,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
}) => {
  const { value: stored, isDirty, markDirty } = useSettingsScreen(
    composer,
    (s) => ({
      gaId: s.analytics?.googleAnalytics?.measurementId ?? "",
      gaEnabled: s.analytics?.googleAnalytics?.enabled ?? false,
      gaVerifiedAt: s.analytics?.googleAnalytics?.verifiedAt,
      gtmId: s.analytics?.googleTagManager?.containerId ?? "",
      gtmEnabled: s.analytics?.googleTagManager?.enabled ?? false,
      pixelId: s.analytics?.facebookPixel?.pixelId ?? "",
      pixelEnabled: s.analytics?.facebookPixel?.enabled ?? false,
      clarityId: s.analytics?.microsoftClarity?.projectId ?? "",
      clarityEnabled: s.analytics?.microsoftClarity?.enabled ?? false,
      cookieConsent: s.analytics?.cookieConsent?.enabled ?? true,
    }),
    DEFAULT_ANALYTICS
  );

  const [gaId, setGaId] = React.useState(stored.gaId);
  const [gaEnabled, setGaEnabled] = React.useState(stored.gaEnabled);
  const [gaVerifiedAt, setGaVerifiedAt] = React.useState(stored.gaVerifiedAt);
  const [gtmId, setGtmId] = React.useState(stored.gtmId);
  const [gtmEnabled, setGtmEnabled] = React.useState(stored.gtmEnabled);
  const [pixelId, setPixelId] = React.useState(stored.pixelId);
  const [pixelEnabled, setPixelEnabled] = React.useState(stored.pixelEnabled);
  const [clarityId, setClarityId] = React.useState(stored.clarityId);
  const [clarityEnabled, setClarityEnabled] = React.useState(stored.clarityEnabled);
  const cookieConsent = stored.cookieConsent;
  const [status, setStatus] = React.useState<AnalyticsStatus | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  /** The Connection verified dialog's subject, while it is open. */
  const [verified, setVerified] = React.useState<{ id: string; events24h: number } | null>(null);
  const gaInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Sync local state when composer reloads (preserves user's unsaved edits)
  React.useEffect(() => {
    setGaId(stored.gaId);
    setGaEnabled(stored.gaEnabled);
    setGaVerifiedAt(stored.gaVerifiedAt);
    setGtmId(stored.gtmId);
    setGtmEnabled(stored.gtmEnabled);
    setPixelId(stored.pixelId);
    setPixelEnabled(stored.pixelEnabled);
    setClarityId(stored.clarityId);
    setClarityEnabled(stored.clarityEnabled);
  }, [
    stored.gaId,
    stored.gaEnabled,
    stored.gaVerifiedAt,
    stored.gtmId,
    stored.gtmEnabled,
    stored.pixelId,
    stored.pixelEnabled,
    stored.clarityId,
    stored.clarityEnabled,
  ]);

  const load = useServerLoad<AnalyticsStatus>(
    projectId,
    (client, siteId) => client.siteDetail.analyticsStatus.query({ siteId }),
    setStatus,
    { onLoadStateChange, registerRetryLoad }
  );

  const gaError = validateProviderId("googleAnalytics", gaId);
  const gtmError = validateProviderId("googleTagManager", gtmId);
  const pixelError = validateProviderId("facebookPixel", pixelId);
  const clarityError = validateProviderId("microsoftClarity", clarityId);
  /** The first malformed id's sentence — while one stands, Save is refused. */
  const firstError = gaError ?? gtmError ?? pixelError ?? clarityError;

  /* Verify (4256:26844): the id's shape, then the tracker's status read
     again, then `verifiedAt` into the draft — the next Save carries it. A
     malformed or empty id just lands the cursor on the field (its sentence is
     already under it); a failed re-read is the load-error card, not a dialog
     that claims a check it could not make. */
  const verify = async () => {
    if (gaId === "" || gaError) {
      gaInputRef.current?.focus();
      return;
    }
    setVerifying(true);
    try {
      const next = projectId ? await getBuildrikClient(DASHBOARD_URL).siteDetail.analyticsStatus.query({ siteId: projectId }) : status;
      setStatus(next);
      setGaVerifiedAt(new Date().toISOString());
      markDirty();
      setVerified({ id: gaId, events24h: next?.events24h ?? 0 });
    } catch (error: unknown) {
      devError("settings", `analytics status re-read failed for site ${projectId}`, error);
      load.retry();
    } finally {
      setVerifying(false);
    }
  };

  /* 3397:34148: Save is refused while an id is malformed. The shell runs a
     registered save handler IN PLACE of the flush + persist, so while an id
     is wrong the screen registers one that rejects with the field's sentence
     — the shell shows its banner and nothing is written — and clears it the
     moment every id is right again. The flush below throws the same sentence
     as a second lock, for a host that reaches it directly. */
  React.useEffect(() => {
    if (!registerSaveHandler || !firstError) return;
    registerSaveHandler(() => Promise.reject(new Error(firstError)));
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, firstError]);

  // Flush local buffer → composer once on Save click (see SettingsTab). The
  // other providers' `verifiedAt` ride through from the stored config.
  const stateRef = React.useRef({ gaId, gaEnabled, gaVerifiedAt, gtmId, gtmEnabled, pixelId, pixelEnabled, clarityId, clarityEnabled, cookieConsent, firstError });
  stateRef.current = { gaId, gaEnabled, gaVerifiedAt, gtmId, gtmEnabled, pixelId, pixelEnabled, clarityId, clarityEnabled, cookieConsent, firstError };
  React.useEffect(() => {
    if (!composer || !registerFlushHandler) return;
    registerFlushHandler(() => {
      const s = stateRef.current;
      if (s.firstError) throw new Error(s.firstError);
      const current = composer.getProjectSettings();
      composer.setProjectSettings({
        ...current,
        analytics: {
          ...current.analytics,
          googleAnalytics: {
            enabled: s.gaEnabled && !!s.gaId,
            measurementId: s.gaId,
            ...(s.gaVerifiedAt ? { verifiedAt: s.gaVerifiedAt } : {}),
          },
          googleTagManager: { ...current.analytics?.googleTagManager, enabled: s.gtmEnabled && !!s.gtmId, containerId: s.gtmId },
          facebookPixel: { ...current.analytics?.facebookPixel, enabled: s.pixelEnabled && !!s.pixelId, pixelId: s.pixelId },
          microsoftClarity: { ...current.analytics?.microsoftClarity, enabled: s.clarityEnabled && !!s.clarityId, projectId: s.clarityId },
          cookieConsent: { enabled: s.cookieConsent },
        },
      });
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Analytics"
          line="GA4, GTM, Meta Pixel and Clarity keys."
          state={load.state}
          errorLine="Couldn't load your analytics settings. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const pill = connectionPill(status, gaVerifiedAt);

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <Section title="Google Analytics">
        <Row stem="enable-google-analytics" label="Enable Google Analytics">
          <div className={SWITCH_CELL}>
            <ToggleSwitch
              id="enable-google-analytics"
              checked={gaEnabled}
              onChange={(next) => {
                setGaEnabled(next);
                markDirty();
              }}
              aria-labelledby="enable-google-analytics-label"
              sizing="sm"
              data-testid="set-an-ga-enable"
            />
          </div>
        </Row>
        <Row stem="google-analytics-id" label="Google Analytics ID" htmlFor="google-analytics-id">
          <div className={INPUT_CELL}>
            <Input
              ref={gaInputRef}
              id="google-analytics-id"
              type="text"
              value={gaId}
              onChange={(e) => {
                setGaId(e.target.value.toUpperCase());
                // A different id is a different connection: its verification goes with it.
                setGaVerifiedAt(undefined);
                markDirty();
              }}
              placeholder="G-XXXXXXXXXX"
              aria-describedby={gaError ? "ga-error" : undefined}
              aria-invalid={gaError !== null}
              data-testid="set-an-ga-id"
            />
            {gaError && (
              <div id="ga-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-an-ga-error">
                {gaError}
              </div>
            )}
          </div>
        </Row>
        <Row stem="connection-status" label="Connection status">
          <div className="tw:flex tw:min-h-8 tw:min-w-0 tw:flex-1 tw:items-center tw:gap-3">
            <Badge className={`${PILL} ${PILL_TONE[pill]}`} data-testid="set-an-ga-status">
              {pill}
            </Badge>
            {gaVerifiedAt ? (
              <span
                className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]"
                data-testid="set-an-ga-verified"
              >
                Measurement ID verified on {formatDay(gaVerifiedAt)}
              </span>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className={`${SET_BTN} tw:ml-auto`}
              disabled={verifying}
              onClick={verify}
              data-testid="set-an-ga-verify"
            >
              Verify
            </Button>
          </div>
        </Row>
        <Row stem="last-received-data" label="Last received data">
          <div className={LINE_CELL} data-testid="set-an-ga-last">
            {lastReceivedLine(status)}
          </div>
        </Row>
      </Section>

      <Section title="Google Tag Manager">
        <Row stem="enable-google-tag-manager" label="Enable Google Tag Manager">
          <div className={SWITCH_CELL}>
            <ToggleSwitch
              id="enable-google-tag-manager"
              checked={gtmEnabled}
              onChange={(next) => {
                setGtmEnabled(next);
                markDirty();
              }}
              aria-labelledby="enable-google-tag-manager-label"
              sizing="sm"
              data-testid="set-an-gtm-enable"
            />
          </div>
        </Row>
        <Row stem="gtm-container-id" label="GTM Container ID" htmlFor="gtm-container-id">
          <div className={INPUT_CELL}>
            <Input
              id="gtm-container-id"
              type="text"
              value={gtmId}
              onChange={(e) => {
                setGtmId(e.target.value.toUpperCase().trim());
                markDirty();
              }}
              placeholder="GTM-XXXXXXX"
              aria-describedby={gtmError ? "gtm-error" : undefined}
              aria-invalid={gtmError !== null}
              data-testid="set-an-gtm-id"
            />
            {gtmError && (
              <div id="gtm-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-an-gtm-error">
                {gtmError}
              </div>
            )}
          </div>
        </Row>
      </Section>

      <Section title="Meta Pixel">
        <Row stem="enable-meta-pixel" label="Enable Meta Pixel">
          <div className={SWITCH_CELL}>
            <ToggleSwitch
              id="enable-meta-pixel"
              checked={pixelEnabled}
              onChange={(next) => {
                setPixelEnabled(next);
                markDirty();
              }}
              aria-labelledby="enable-meta-pixel-label"
              sizing="sm"
              data-testid="set-an-pixel-enable"
            />
          </div>
        </Row>
        <Row stem="pixel-id" label="Pixel ID" htmlFor="pixel-id">
          <div className={INPUT_CELL}>
            <Input
              id="pixel-id"
              type="text"
              value={pixelId}
              onChange={(e) => {
                setPixelId(e.target.value.replace(/\D/g, ""));
                markDirty();
              }}
              placeholder="1234567890123456"
              aria-describedby={pixelError ? "pixel-error" : undefined}
              aria-invalid={pixelError !== null}
              data-testid="set-an-pixel-id"
            />
            {pixelError && (
              <div id="pixel-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-an-pixel-error">
                {pixelError}
              </div>
            )}
          </div>
        </Row>
      </Section>

      <Section title="Microsoft Clarity">
        <Row stem="enable-microsoft-clarity" label="Enable Microsoft Clarity">
          <div className={SWITCH_CELL}>
            <ToggleSwitch
              id="enable-microsoft-clarity"
              checked={clarityEnabled}
              onChange={(next) => {
                setClarityEnabled(next);
                markDirty();
              }}
              aria-labelledby="enable-microsoft-clarity-label"
              sizing="sm"
              data-testid="set-an-clarity-enable"
            />
          </div>
        </Row>
        <Row stem="clarity-project-id" label="Clarity Project ID" htmlFor="clarity-project-id">
          <div className={INPUT_CELL}>
            <Input
              id="clarity-project-id"
              type="text"
              value={clarityId}
              onChange={(e) => {
                setClarityId(e.target.value.trim());
                markDirty();
              }}
              placeholder="abcdefghij"
              aria-describedby={clarityError ? "clarity-error" : undefined}
              aria-invalid={clarityError !== null}
              data-testid="set-an-clarity-id"
            />
            {clarityError && (
              <div id="clarity-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-an-clarity-error">
                {clarityError}
              </div>
            )}
          </div>
        </Row>
      </Section>

      <ConnectionVerifiedDialog
        open={verified !== null}
        id={verified?.id ?? ""}
        events24h={verified?.events24h ?? 0}
        onBack={() => setVerified(null)}
      />
    </Screen>
  );
};
