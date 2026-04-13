/**
 * Analytics screen (L2: Wired to project settings)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AnalyticsConfig } from "../../../../../shared/types/project";
import { StickyFooter } from "../../../shared/StickyFooter";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { Section, Field, ToggleControlled } from "../shared";
import type { ScreenProps } from "../types";

// GA4 measurement ID: exactly G- followed by 10 alphanumeric characters (EC-05)
const GA_ID_REGEX = /^G-[A-Z0-9]{10}$/i;

const DEFAULT_ANALYTICS_SETTINGS: Required<
  Pick<AnalyticsConfig, "googleAnalytics" | "facebookPixel" | "cookieConsent">
> = {
  googleAnalytics: {
    enabled: false,
    measurementId: "",
  },
  facebookPixel: {
    enabled: false,
    pixelId: "",
  },
  cookieConsent: {
    enabled: true,
  },
};

export const AnalyticsScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange }) => {
  const { value: savedAnalytics } = useSettingsScreen(
    composer,
    (settings) => ({
      googleAnalytics: settings.analytics?.googleAnalytics ?? DEFAULT_ANALYTICS_SETTINGS.googleAnalytics,
      facebookPixel: settings.analytics?.facebookPixel ?? DEFAULT_ANALYTICS_SETTINGS.facebookPixel,
      cookieConsent: settings.analytics?.cookieConsent ?? DEFAULT_ANALYTICS_SETTINGS.cookieConsent,
    }),
    DEFAULT_ANALYTICS_SETTINGS
  );

  const [gaId, setGaId] = React.useState("");
  const [gaEnabled, setGaEnabled] = React.useState(false);
  const [metaPixelId, setMetaPixelId] = React.useState("");
  const [metaPixelEnabled, setMetaPixelEnabled] = React.useState(false);
  const [cookieBanner, setCookieBanner] = React.useState(true);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Notify shell of dirty state for nav guard
  React.useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  React.useEffect(() => {
    setGaId(savedAnalytics.googleAnalytics.measurementId);
    setGaEnabled(savedAnalytics.googleAnalytics.enabled);
    setMetaPixelId(savedAnalytics.facebookPixel.pixelId);
    setMetaPixelEnabled(savedAnalytics.facebookPixel.enabled);
    setCookieBanner(savedAnalytics.cookieConsent.enabled);
    setHasChanges(false);
  }, [savedAnalytics]);

  // Validation
  const gaError = gaId && !GA_ID_REGEX.test(gaId);
  const pixelError = metaPixelId && !/^\d{15,16}$/.test(metaPixelId);
  const isValidGA = !gaError;
  const isValidPixel = !pixelError;

  const handleSave = () => {
    if (!composer) return;
    const current = composer.getProjectSettings();
    composer.setProjectSettings({
      ...current,
      analytics: {
        ...current.analytics,
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
    <div className="aqb-st-screen">
      <Section title="Google Analytics">
        <p id="ga-privacy-note" style={privacyNoteStyles}>
          Track visitor behavior on your published site. When enabled, Google&apos;s analytics
          script is added to every page — visitors&apos; page views, clicks, and sessions are sent
          to your Google Analytics account.
        </p>
        <Field
          label="Google Analytics ID"
          hint="Find this in Google Analytics → Admin → Data Streams → your stream → Measurement ID"
          htmlFor="ga-measurement-id"
        >
          <input
            id="ga-measurement-id"
            type="text"
            value={gaId}
            onChange={(e) => {
              setGaId(e.target.value.toUpperCase());
              setHasChanges(true);
            }}
            placeholder="G-XXXXXXXXXX"
            className="aqb-st-input" style={{ borderColor: gaError ? "var(--aqb-error)" : undefined }}
            aria-describedby={gaError ? "ga-error" : "ga-hint"}
            aria-invalid={!!gaError}
          />
          <span id="ga-hint" style={hintTextStyles}>
            Find this in Google Analytics → Admin → Data Streams → your stream → Measurement ID
          </span>
          {gaError && (
            <span id="ga-error" role="alert" className="aqb-st-error-hint">
              This doesn&apos;t look right. Your Google Analytics ID should start with G- followed
              by 10 characters, like G-ABCD123456.
            </span>
          )}
        </Field>
        <ToggleControlled
          label="Enable Google Analytics"
          checked={gaEnabled}
          onChange={(v) => {
            setGaEnabled(v);
            setHasChanges(true);
          }}
        />
        {gaEnabled && gaId && isValidGA && (
          <div className="aqb-st-success-note">
            ✓ Tracking will be added to your published site automatically
          </div>
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
          htmlFor="meta-pixel-id"
        >
          <input
            id="meta-pixel-id"
            type="text"
            value={metaPixelId}
            onChange={(e) => {
              setMetaPixelId(e.target.value.replace(/\D/g, ""));
              setHasChanges(true);
            }}
            placeholder="1234567890123456"
            className="aqb-st-input" style={{ borderColor: pixelError ? "var(--aqb-error)" : undefined }}
            aria-describedby={pixelError ? "pixel-error" : "pixel-hint"}
            aria-invalid={!!pixelError}
          />
          <span id="pixel-hint" style={hintTextStyles}>
            Find this in Meta Events Manager → your Pixel → Pixel ID
          </span>
          {pixelError && (
            <span id="pixel-error" role="alert" className="aqb-st-error-hint">
              Pixel IDs are 15 or 16 digits. Check your Meta Events Manager for the correct ID.
            </span>
          )}
        </Field>
        <ToggleControlled
          label="Enable Meta Pixel"
          checked={metaPixelEnabled}
          onChange={(v) => {
            setMetaPixelEnabled(v);
            setHasChanges(true);
          }}
        />
        {metaPixelEnabled && metaPixelId && isValidPixel && (
          <div className="aqb-st-success-note">
            ✓ Tracking will be added to your published site automatically
          </div>
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
        <div className="aqb-st-note">
          💡 Displays a banner asking visitors to accept cookies before tracking begins. Required in
          the EU (GDPR) and recommended everywhere else.
        </div>
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

const privacyNoteStyles: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--aqb-text-secondary)",
};

const hintTextStyles: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "var(--aqb-text-muted)",
  marginTop: 4,
  lineHeight: 1.4,
};
