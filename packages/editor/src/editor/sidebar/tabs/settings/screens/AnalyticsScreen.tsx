/**
 * Analytics screen — Google Analytics, Meta Pixel, Cookie Consent
 * @license BSD-3-Clause
 */

import * as React from "react";
import { StickyFooter } from "../../../shared/StickyFooter";
import { ErrorHint, Field, Input, Note, Screen, Section, SuccessNote, Toggle } from "../shared";
import { EVENTS } from "../../../../../shared/constants/events";
import type { ScreenProps } from "../types";

// GA4 measurement ID: exactly G- followed by 10 alphanumeric characters (EC-05)
const GA_ID_REGEX = /^G-[A-Z0-9]{10}$/i;

export const AnalyticsScreen: React.FC<ScreenProps> = ({ composer }) => {
  const [gaId, setGaId] = React.useState("");
  const [gaEnabled, setGaEnabled] = React.useState(false);
  const [metaPixelId, setMetaPixelId] = React.useState("");
  const [metaPixelEnabled, setMetaPixelEnabled] = React.useState(false);
  const [cookieBanner, setCookieBanner] = React.useState(true);
  const [hasChanges, setHasChanges] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  const loadSettings = React.useCallback(() => {
    if (!composer) return;
    const settings = composer.getProjectSettings();
    const analytics = settings.analytics ?? {};
    setGaId(analytics.googleAnalytics?.measurementId ?? "");
    setGaEnabled(analytics.googleAnalytics?.enabled ?? false);
    setMetaPixelId(analytics.facebookPixel?.pixelId ?? "");
    setMetaPixelEnabled(analytics.facebookPixel?.enabled ?? false);
    setCookieBanner(analytics.cookieConsent?.enabled ?? true);
    hasLoadedRef.current = true;
    setHasChanges(false);
  }, [composer]);

  React.useEffect(() => {
    if (!composer) return;
    loadSettings();

    composer.on(EVENTS.PROJECT_LOADED, loadSettings);
    composer.on(EVENTS.SETTINGS_CHANGE, loadSettings);

    return () => {
      composer.off(EVENTS.PROJECT_LOADED, loadSettings);
      composer.off(EVENTS.SETTINGS_CHANGE, loadSettings);
    };
  }, [composer, loadSettings]);

  const gaError = gaId && !GA_ID_REGEX.test(gaId);
  const pixelError = metaPixelId && !/^\d{15,16}$/.test(metaPixelId);
  const isValidGA = !gaError;
  const isValidPixel = !pixelError;
  const canSave = isValidGA && isValidPixel;

  const handleSave = () => {
    if (!composer) return;
    const current = composer.getProjectSettings();
    composer.setProjectSettings({
      ...current,
      analytics: {
        googleAnalytics: {
          enabled: gaEnabled && !!gaId,
          measurementId: gaId,
        },
        facebookPixel: {
          enabled: metaPixelEnabled && !!metaPixelId,
          pixelId: metaPixelId,
        },
        cookieConsent: {
          enabled: cookieBanner,
        },
      },
    });
    setHasChanges(false);
  };

  return (
    <Screen>
      <Section title="Google Analytics">
        <p id="ga-privacy-note" style={privacyNoteStyles}>
          Track visitor behavior on your published site. When enabled, Google&apos;s analytics
          script is added to every page — visitors&apos; page views, clicks, and sessions are sent
          to your Google Analytics account.
        </p>
        <Field
          label="Google Analytics ID"
          hint="Find this in Google Analytics → Admin → Data Streams → your stream → Measurement ID"
        >
          <Input
            id="ga-measurement-id"
            type="text"
            value={gaId}
            onChange={(e) => {
              setGaId(e.target.value.toUpperCase());
              setHasChanges(true);
            }}
            placeholder="G-XXXXXXXXXX" style={{ borderColor: gaError ? "var(--buildrick-error)" : undefined }}
            aria-describedby={gaError ? "ga-error" : undefined}
            aria-invalid={!!gaError}
          />
          {gaError && (
            <ErrorHint id="ga-error" role="alert" >
              This doesn&apos;t look right. Your Google Analytics ID should start with G- followed
              by 10 characters, like G-ABCD123456.
            </ErrorHint>
          )}
        </Field>
        <Toggle
          label="Enable Google Analytics"
          checked={gaEnabled}
          onChange={(v) => {
            setGaEnabled(v);
            setHasChanges(true);
          }}
        />
        {gaEnabled && gaId && isValidGA && (
          <SuccessNote>
            ✓ Tracking will be added to your published site automatically
          </SuccessNote>
        )}
      </Section>

      <Section title="Meta Pixel">
        <p id="meta-privacy-note" style={privacyNoteStyles}>
          Measure ad performance and build retargeting audiences. When enabled, Meta&apos;s
          tracking pixel is loaded on every page — visitor interactions are reported to your
          Meta Events Manager.
        </p>
        <Field
          label="Meta (Facebook) Pixel ID"
          hint="15–16 digit number from your Meta Events Manager"
        >
          <Input
            id="meta-pixel-id"
            type="text"
            value={metaPixelId}
            onChange={(e) => {
              setMetaPixelId(e.target.value.replace(/\D/g, ""));
              setHasChanges(true);
            }}
            placeholder="1234567890123456" style={{ borderColor: pixelError ? "var(--buildrick-error)" : undefined }}
            aria-describedby={pixelError ? "pixel-error" : undefined}
            aria-invalid={!!pixelError}
          />
          {pixelError && (
            <ErrorHint id="pixel-error" role="alert" >
              Pixel IDs are 15 or 16 digits. Check your Meta Events Manager for the correct ID.
            </ErrorHint>
          )}
        </Field>
        <Toggle
          label="Enable Meta Pixel"
          checked={metaPixelEnabled}
          onChange={(v) => {
            setMetaPixelEnabled(v);
            setHasChanges(true);
          }}
        />
        {metaPixelEnabled && metaPixelId && isValidPixel && (
          <SuccessNote>
            ✓ Tracking will be added to your published site automatically
          </SuccessNote>
        )}
      </Section>

      <Section title="Cookie Consent">
        <Toggle
          label="Show Cookie Banner"
          checked={cookieBanner}
          onChange={(v) => {
            setCookieBanner(v);
            setHasChanges(true);
          }}
        />
        <Note>
          Displays a banner asking visitors to accept cookies before tracking begins. Required in
          the EU (GDPR) and recommended everywhere else.
        </Note>
      </Section>

      <StickyFooter
        primaryLabel="Save"
        onPrimary={handleSave}
        hasChanges={hasChanges}
        disabled={!canSave}
      />
    </Screen>
  );
};

const privacyNoteStyles: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--buildrick-text-secondary)",
};

const hintTextStyles: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--buildrick-text-muted)",
  marginTop: 4,
  lineHeight: 1.4,
};
