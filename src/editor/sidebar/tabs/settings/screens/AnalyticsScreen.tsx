/**
 * Analytics screen (L1→L2: Wired to project settings)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "../../../../../shared/constants/events";
import { StickyFooter } from "../../../shared/StickyFooter";
import { Section, Field, ToggleControlled } from "../shared";
import {
  screenStyles,
  inputStyles,
  errorHintStyles,
  successNoteStyles,
  noteStyles,
} from "../styles";
import type { ScreenProps } from "../types";

export const AnalyticsScreen: React.FC<ScreenProps> = ({ composer }) => {
  // Load initial values from project settings
  const initialSettings = React.useMemo(() => {
    if (!composer)
      return {
        gaId: "",
        gaEnabled: false,
        metaPixelId: "",
        metaPixelEnabled: false,
        cookieBanner: true,
      };
    const settings = composer.getProjectSettings();
    const analytics = settings.analytics ?? {};
    return {
      gaId: analytics.googleAnalytics?.measurementId ?? "",
      gaEnabled: analytics.googleAnalytics?.enabled ?? false,
      metaPixelId: analytics.facebookPixel?.pixelId ?? "",
      metaPixelEnabled: analytics.facebookPixel?.enabled ?? false,
      cookieBanner: analytics.cookieConsent?.enabled ?? true,
    };
  }, [composer]);

  const [gaId, setGaId] = React.useState(initialSettings.gaId);
  const [gaEnabled, setGaEnabled] = React.useState(initialSettings.gaEnabled);
  const [metaPixelId, setMetaPixelId] = React.useState(initialSettings.metaPixelId);
  const [metaPixelEnabled, setMetaPixelEnabled] = React.useState(initialSettings.metaPixelEnabled);
  const [cookieBanner, setCookieBanner] = React.useState(initialSettings.cookieBanner);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Load settings from project
  const loadSettings = React.useCallback(() => {
    if (!composer) return;
    const settings = composer.getProjectSettings();
    const analytics = settings.analytics ?? {};
    setGaId(analytics.googleAnalytics?.measurementId ?? "");
    setGaEnabled(analytics.googleAnalytics?.enabled ?? false);
    setMetaPixelId(analytics.facebookPixel?.pixelId ?? "");
    setMetaPixelEnabled(analytics.facebookPixel?.enabled ?? false);
    setCookieBanner(analytics.cookieConsent?.enabled ?? true);
    setHasChanges(false);
  }, [composer]);

  // Re-sync on mount and when project loads
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

  // Validation
  const isValidGA = !gaId || /^G-[A-Z0-9]{8,}$/i.test(gaId);
  const isValidPixel = !metaPixelId || /^\d{15,16}$/.test(metaPixelId);

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
    <div style={screenStyles}>
      <Section title="Google Analytics">
        <Field label="Measurement ID" hint="Format: G-XXXXXXXXXX">
          <input
            type="text"
            value={gaId}
            onChange={(e) => {
              setGaId(e.target.value.toUpperCase());
              setHasChanges(true);
            }}
            placeholder="G-XXXXXXXXXX"
            style={{ ...inputStyles, borderColor: !isValidGA ? "var(--aqb-error)" : undefined }}
          />
          {!isValidGA && <span style={errorHintStyles}>Invalid format. Use G-XXXXXXXXXX</span>}
        </Field>
        <ToggleControlled
          label="Enable Google Analytics"
          checked={gaEnabled}
          onChange={(v) => {
            setGaEnabled(v);
            setHasChanges(true);
          }}
        />
        {gaEnabled && gaId && (
          <div style={successNoteStyles}>✓ Will be injected into exported HTML</div>
        )}
      </Section>

      <Section title="Meta Pixel">
        <Field label="Pixel ID" hint="15-16 digit number">
          <input
            type="text"
            value={metaPixelId}
            onChange={(e) => {
              setMetaPixelId(e.target.value.replace(/\D/g, ""));
              setHasChanges(true);
            }}
            placeholder="1234567890123456"
            style={{ ...inputStyles, borderColor: !isValidPixel ? "var(--aqb-error)" : undefined }}
          />
          {!isValidPixel && <span style={errorHintStyles}>Invalid format. Use 15-16 digits</span>}
        </Field>
        <ToggleControlled
          label="Enable Meta Pixel"
          checked={metaPixelEnabled}
          onChange={(v) => {
            setMetaPixelEnabled(v);
            setHasChanges(true);
          }}
        />
        {metaPixelEnabled && metaPixelId && (
          <div style={successNoteStyles}>✓ Will be injected into exported HTML</div>
        )}
      </Section>

      <Section title="Cookie Consent">
        <ToggleControlled
          label="Show Cookie Banner"
          checked={cookieBanner}
          onChange={(v) => {
            setCookieBanner(v);
            setHasChanges(true);
          }}
        />
        <div style={noteStyles}>💡 GDPR compliant cookie consent banner</div>
      </Section>

      <StickyFooter
        primaryLabel="Save"
        onPrimary={handleSave}
        hasChanges={hasChanges}
        disabled={!isValidGA || !isValidPixel}
      />
    </div>
  );
};
