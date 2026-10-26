/**
 * Analytics — 2L9 B8-AN01…AN06 (245:45159…245:46449): one card per provider
 * (Google Analytics, Google Tag Manager, Meta Pixel, Microsoft Clarity), each
 * a single row — the id's label, the id, the switch with "Enabled"/"Off".
 * Google Analytics adds the tracker's status in words ("Not verified" /
 * "Waiting for data" / "Receiving data") with Verify, the last received line,
 * and "Buildrick tracker status; this does not confirm Google Analytics
 * delivery." No Consent card (G3-108, 4418:127827): its switch recorded a
 * flag nothing reads, so it is hidden until wired; the stored value is
 * written back unchanged on the flush.
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
import { Button, ToggleSwitch } from "@/editor/chrome-ui";
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
// ProviderRow — 2L9 B8-AN01 245:45159: one row per provider — the id's label
// in a 192 column, the id (368), and the provider's switch with its state
// word ("Enabled" / "Off", 104) at the right. `stem` keeps the search
// landing (`set-field-<stem>`); the switch keeps its `enable-…` id.
// ─────────────────────────────────────────────────────────────────────────────

const ROW_LABEL = "tw:w-48 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const INPUT_CELL = "tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1";
const SWITCH_CELL = "tw:flex tw:w-26 tw:shrink-0 tw:items-center tw:gap-2 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const NOTE = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

interface ProviderRowProps {
  stem: string;
  label: string;
  inputId: string;
  switchId: string;
  provider: string;
  enabled: boolean;
  onEnabled(next: boolean): void;
  switchTestId: string;
  children: React.ReactNode;
}

const ProviderRow: React.FC<ProviderRowProps> = ({ stem, label, inputId, switchId, provider, enabled, onEnabled, switchTestId, children }) => (
  <div className="tw:col-span-full tw:flex tw:min-h-8 tw:items-start tw:gap-3" data-testid={`set-field-${stem}`}>
    <label htmlFor={inputId} className={`${ROW_LABEL} tw:py-1.5`} data-testid={`set-field-label-${stem}`}>
      {label}
    </label>
    <div className={INPUT_CELL}>{children}</div>
    <div className={`${SWITCH_CELL} tw:min-h-8`}>
      <ToggleSwitch
        id={switchId}
        checked={enabled}
        onChange={onEnabled}
        aria-label={`Enable ${provider}`}
        sizing="md"
        data-testid={switchTestId}
      />
      <span aria-hidden>{enabled ? "Enabled" : "Off"}</span>
    </div>
  </div>
);

/** B8-AN01/03/04: the tracker's status in words, not a pill. */
const STATUS_WORDS: Record<ConnectionPill, string> = {
  "RECEIVING DATA": "Receiving data",
  "NO DATA YET": "Waiting for data",
  "NOT VERIFIED": "Not verified",
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
  registerFieldErrors,
  fieldErrors,
}) => {
  const { value: stored } = useSettingsScreen(
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
  /* B8-AN06: a status re-read that fails says so in place; the values stay. */
  const [verifyFailed, setVerifyFailed] = React.useState(false);
  /** The Connection verified dialog's subject, while it is open. */
  const [verified, setVerified] = React.useState<{ id: string; events24h: number } | null>(null);
  const gaInputRef = React.useRef<HTMLInputElement>(null);

  /* Dirty is a difference from what is stored, so a field typed back to its
     saved value is clean again (after Save the composer adopts the values,
     SETTINGS_CHANGE re-reads `stored`). */
  const isDirty =
    gaId !== stored.gaId ||
    gaEnabled !== stored.gaEnabled ||
    gaVerifiedAt !== stored.gaVerifiedAt ||
    gtmId !== stored.gtmId ||
    gtmEnabled !== stored.gtmEnabled ||
    pixelId !== stored.pixelId ||
    pixelEnabled !== stored.pixelEnabled ||
    clarityId !== stored.clarityId ||
    clarityEnabled !== stored.clarityEnabled;
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
  /* What the field shows: its own shape check first, else what the server
     refused on the last Save (ScreenProps.fieldErrors, keyed by settings path). */
  const shown = (own: string | null, path: string) => own ?? fieldErrors?.[`analytics.${path}`] ?? null;
  const gaShown = shown(gaError, "googleAnalytics.measurementId");
  const gtmShown = shown(gtmError, "googleTagManager.containerId");
  const pixelShown = shown(pixelError, "facebookPixel.pixelId");
  const clarityShown = shown(clarityError, "microsoftClarity.projectId");

  /* Verify (4256:26844): the id's shape, then the tracker's status read
     again, then `verifiedAt` into the draft — the next Save carries it. A
     malformed or empty id just lands the cursor on the field (its sentence is
     already under it); a failed re-read says "Couldn't check status" in the
     status row (B8-AN06), not a dialog that claims a check it could not make. */
  const verify = async () => {
    if (gaId === "" || gaError) {
      gaInputRef.current?.focus();
      return;
    }
    setVerifying(true);
    setVerifyFailed(false);
    try {
      const next = projectId ? await getBuildrikClient(DASHBOARD_URL).siteDetail.analyticsStatus.query({ siteId: projectId }) : status;
      setStatus(next);
      setGaVerifiedAt(new Date().toISOString());
      setVerified({ id: gaId, events24h: next?.events24h ?? 0 });
    } catch (error: unknown) {
      devError("settings", `analytics status re-read failed for site ${projectId}`, error);
      setVerifyFailed(true);
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

  /* §27: the shell disables Save while any id is malformed. */
  React.useEffect(() => {
    if (!registerFieldErrors) return;
    const errors: Record<string, string> = {};
    if (gaError) errors["analytics.googleAnalytics.measurementId"] = gaError;
    if (gtmError) errors["analytics.googleTagManager.containerId"] = gtmError;
    if (pixelError) errors["analytics.facebookPixel.pixelId"] = pixelError;
    if (clarityError) errors["analytics.microsoftClarity.projectId"] = clarityError;
    registerFieldErrors(Object.keys(errors).length > 0 ? errors : null);
  }, [registerFieldErrors, gaError, gtmError, pixelError, clarityError]);
  React.useEffect(() => () => registerFieldErrors?.(null), [registerFieldErrors]);

  // On Save the shell calls this and saves what it returns (ScreenProps.registerFlushHandler). The
  // other providers' `verifiedAt` ride through from the stored config.
  const stateRef = React.useRef({ gaId, gaEnabled, gaVerifiedAt, gtmId, gtmEnabled, pixelId, pixelEnabled, clarityId, clarityEnabled, cookieConsent, firstError });
  stateRef.current = { gaId, gaEnabled, gaVerifiedAt, gtmId, gtmEnabled, pixelId, pixelEnabled, clarityId, clarityEnabled, cookieConsent, firstError };
  React.useEffect(() => {
    if (!composer || !registerFlushHandler) return;
    registerFlushHandler(() => {
      const s = stateRef.current;
      if (s.firstError) throw new Error(s.firstError);
      const current = composer.getProjectSettings();
      return {
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
      };
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
        <ProviderRow
          stem="google-analytics-id"
          label="Measurement ID"
          inputId="google-analytics-id"
          switchId="enable-google-analytics"
          provider="Google Analytics"
          enabled={gaEnabled}
          onEnabled={setGaEnabled}
          switchTestId="set-an-ga-enable"
        >
          <Input
            ref={gaInputRef}
            id="google-analytics-id"
            type="text"
            value={gaId}
            onChange={(e) => {
              setGaId(e.target.value.toUpperCase());
              // A different id is a different connection: its verification goes with it.
              setGaVerifiedAt(undefined);
            }}
            placeholder="G-XXXXXXXXXX"
            aria-describedby={gaShown ? "ga-error" : undefined}
            aria-invalid={gaShown !== null}
            data-testid="set-an-ga-id"
          />
          {gaShown && (
            <div id="ga-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-an-ga-error">
              {gaShown}
            </div>
          )}
        </ProviderRow>
        <div className="tw:col-span-full tw:flex tw:min-h-8 tw:items-center tw:gap-3" data-testid="set-field-connection-status">
          <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
            <span className="tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]" role="status" data-testid="set-an-ga-status">
              {verifyFailed ? "Couldn’t check status" : STATUS_WORDS[pill]}
            </span>
            {verifyFailed ? (
              <span className={NOTE} data-testid="set-an-ga-verify-error">
                The status service did not respond. Try Verify again.
              </span>
            ) : gaVerifiedAt ? (
              <span className={NOTE} data-testid="set-an-ga-verified">
                Measurement ID verified on {formatDay(gaVerifiedAt)}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className={`${SET_BTN} tw:w-37 tw:shrink-0`}
            disabled={verifying}
            onClick={verify}
            data-testid="set-an-ga-verify"
          >
            {verifying ? "Checking…" : "Verify"}
          </Button>
        </div>
        <p className={`${NOTE} tw:col-span-full`} data-testid="set-field-last-received-data">
          <span data-testid="set-an-ga-last">{lastReceivedLine(status)}</span>
        </p>
        <p className={`${NOTE} tw:col-span-full`} data-testid="set-an-ga-disclaimer">
          Buildrick tracker status; this does not confirm Google Analytics delivery.
        </p>
      </Section>

      <Section title="Google Tag Manager">
        <ProviderRow
          stem="gtm-container-id"
          label="Container ID"
          inputId="gtm-container-id"
          switchId="enable-google-tag-manager"
          provider="Google Tag Manager"
          enabled={gtmEnabled}
          onEnabled={setGtmEnabled}
          switchTestId="set-an-gtm-enable"
        >
          <Input
            id="gtm-container-id"
            type="text"
            value={gtmId}
            onChange={(e) => {
              setGtmId(e.target.value.toUpperCase().trim());
            }}
            placeholder="GTM-XXXXXXX"
            aria-describedby={gtmShown ? "gtm-error" : undefined}
            aria-invalid={gtmShown !== null}
            data-testid="set-an-gtm-id"
          />
          {gtmShown && (
            <div id="gtm-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-an-gtm-error">
              {gtmShown}
            </div>
          )}
        </ProviderRow>
      </Section>

      <Section title="Meta Pixel">
        <ProviderRow
          stem="pixel-id"
          label="Pixel ID"
          inputId="pixel-id"
          switchId="enable-meta-pixel"
          provider="Meta Pixel"
          enabled={pixelEnabled}
          onEnabled={setPixelEnabled}
          switchTestId="set-an-pixel-enable"
        >
          <Input
            id="pixel-id"
            type="text"
            value={pixelId}
            onChange={(e) => {
              setPixelId(e.target.value.replace(/\D/g, ""));
            }}
            placeholder="1234567890123456"
            aria-describedby={pixelShown ? "pixel-error" : undefined}
            aria-invalid={pixelShown !== null}
            data-testid="set-an-pixel-id"
          />
          {pixelShown && (
            <div id="pixel-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-an-pixel-error">
              {pixelShown}
            </div>
          )}
        </ProviderRow>
      </Section>

      <Section title="Microsoft Clarity">
        <ProviderRow
          stem="clarity-project-id"
          label="Project ID"
          inputId="clarity-project-id"
          switchId="enable-microsoft-clarity"
          provider="Microsoft Clarity"
          enabled={clarityEnabled}
          onEnabled={setClarityEnabled}
          switchTestId="set-an-clarity-enable"
        >
          <Input
            id="clarity-project-id"
            type="text"
            value={clarityId}
            onChange={(e) => {
              setClarityId(e.target.value.trim());
            }}
            placeholder="abcdefghij"
            aria-describedby={clarityShown ? "clarity-error" : undefined}
            aria-invalid={clarityShown !== null}
            data-testid="set-an-clarity-id"
          />
          {clarityShown && (
            <div id="clarity-error" role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-an-clarity-error">
              {clarityShown}
            </div>
          )}
        </ProviderRow>
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
