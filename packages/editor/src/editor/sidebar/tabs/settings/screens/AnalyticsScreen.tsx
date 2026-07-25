/**
 * Analytics screen — Google Analytics, Meta Pixel, Cookie Consent
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Field, Input, Screen, Section, SwitchRow } from "../shared";
import { EVENTS } from "../../../../../shared/constants/events";
import type { ScreenProps } from "../types";

// GA4 measurement ID: exactly G- followed by 10 alphanumeric characters (EC-05)
const GA_ID_REGEX = /^G-[A-Z0-9]{10}$/i;

export const AnalyticsScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange, registerFlushHandler }) => {
  const [gaId, setGaId] = React.useState("");
  const [gaEnabled, setGaEnabled] = React.useState(false);
  const [metaPixelId, setMetaPixelId] = React.useState("");
  const [metaPixelEnabled, setMetaPixelEnabled] = React.useState(false);
  const [clarityId, setClarityId] = React.useState("");
  const [clarityEnabled, setClarityEnabled] = React.useState(false);
  const [gtmId, setGtmId] = React.useState("");
  const [gtmEnabled, setGtmEnabled] = React.useState(false);
  const [cookieBanner, setCookieBanner] = React.useState(true);
  const [hasChanges, setHasChanges] = React.useState(false);

  const loadSettings = React.useCallback(() => {
    if (!composer) return;
    const settings = composer.getProjectSettings();
    const analytics = settings.analytics ?? {};
    setGaId(analytics.googleAnalytics?.measurementId ?? "");
    setGaEnabled(analytics.googleAnalytics?.enabled ?? false);
    setMetaPixelId(analytics.facebookPixel?.pixelId ?? "");
    setMetaPixelEnabled(analytics.facebookPixel?.enabled ?? false);
    setClarityId(analytics.microsoftClarity?.projectId ?? "");
    setClarityEnabled(analytics.microsoftClarity?.enabled ?? false);
    setGtmId(analytics.googleTagManager?.containerId ?? "");
    setGtmEnabled(analytics.googleTagManager?.enabled ?? false);
    setCookieBanner(analytics.cookieConsent?.enabled ?? true);
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

  React.useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const gaError = gaId && !GA_ID_REGEX.test(gaId);
  const pixelError = metaPixelId && !/^\d{15,16}$/.test(metaPixelId);
  const clarityError = clarityId && !/^[a-z0-9]{6,15}$/i.test(clarityId);
  const gtmError = gtmId && !/^GTM-[A-Z0-9]{4,}$/i.test(gtmId);
  const isValidGA = !gaError;
  const isValidPixel = !pixelError;

  // Flush local buffer → composer on Save (see SettingsTab).
  const stateRef = React.useRef({ gaId, gaEnabled, metaPixelId, metaPixelEnabled, clarityId, clarityEnabled, gtmId, gtmEnabled, cookieBanner });
  stateRef.current = { gaId, gaEnabled, metaPixelId, metaPixelEnabled, clarityId, clarityEnabled, gtmId, gtmEnabled, cookieBanner };
  React.useEffect(() => {
    if (!composer || !registerFlushHandler) return;
    registerFlushHandler(() => {
      const current = composer.getProjectSettings();
      const s = stateRef.current;
      composer.setProjectSettings({
        ...current,
        analytics: {
          googleAnalytics: { enabled: s.gaEnabled && !!s.gaId, measurementId: s.gaId },
          facebookPixel: { enabled: s.metaPixelEnabled && !!s.metaPixelId, pixelId: s.metaPixelId },
          microsoftClarity: { enabled: s.clarityEnabled && !!s.clarityId, projectId: s.clarityId },
          googleTagManager: { enabled: s.gtmEnabled && !!s.gtmId, containerId: s.gtmId },
          cookieConsent: { enabled: s.cookieBanner },
        },
      });
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

  return (
    <Screen>
      <Section title="Google Analytics">
        <p style={privacyNoteStyles}>
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
            placeholder="G-XXXXXXXXXX"
            style={{ borderColor: gaError ? "var(--bd-error)" : undefined }}
            aria-describedby={gaError ? "ga-error" : undefined}
            aria-invalid={!!gaError}
          />
          {gaError && (
            <div id="ga-error" role="alert" style={errorHintStyles}>
              This doesn&apos;t look right. Your Google Analytics ID should start with G- followed
              by 10 characters, like G-ABCD123456.
            </div>
          )}
        </Field>
        <SwitchRow
          title="Enable Google Analytics"
          checked={gaEnabled}
          onChange={(next) => {
            setGaEnabled(next);
            setHasChanges(true);
          }}
        />
        {gaEnabled && gaId && isValidGA && (
          <div style={successNoteStyles}>
            ✓ Tracking will be added to your published site automatically
          </div>
        )}
      </Section>

      <Section title="Meta Pixel">
        <p style={privacyNoteStyles}>
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
            placeholder="1234567890123456"
            style={{ borderColor: pixelError ? "var(--bd-error)" : undefined }}
            aria-describedby={pixelError ? "pixel-error" : undefined}
            aria-invalid={!!pixelError}
          />
          {pixelError && (
            <div id="pixel-error" role="alert" style={errorHintStyles}>
              Pixel IDs are 15 or 16 digits. Check your Meta Events Manager for the correct ID.
            </div>
          )}
        </Field>
        <SwitchRow
          title="Enable Meta Pixel"
          checked={metaPixelEnabled}
          onChange={(next) => {
            setMetaPixelEnabled(next);
            setHasChanges(true);
          }}
        />
        {metaPixelEnabled && metaPixelId && isValidPixel && (
          <div style={successNoteStyles}>
            ✓ Tracking will be added to your published site automatically
          </div>
        )}
      </Section>

      <Section title="Microsoft Clarity">
        <p style={privacyNoteStyles}>
          Free heatmaps and session recordings — see exactly where visitors click and scroll.
          When enabled, Clarity&apos;s script is added to every published page.
        </p>
        <Field
          label="Clarity Project ID"
          hint="Clarity → Settings → Overview → your project ID"
        >
          <Input
            id="clarity-project-id"
            type="text"
            value={clarityId}
            onChange={(e) => {
              setClarityId(e.target.value.trim());
              setHasChanges(true);
            }}
            placeholder="abcdefghij"
            style={{ borderColor: clarityError ? "var(--bd-error)" : undefined }}
            aria-invalid={!!clarityError}
          />
          {clarityError && (
            <div role="alert" style={errorHintStyles}>
              A Clarity project ID is a short alphanumeric code (6–15 characters).
            </div>
          )}
        </Field>
        <SwitchRow
          title="Enable Microsoft Clarity"
          checked={clarityEnabled}
          onChange={(next) => {
            setClarityEnabled(next);
            setHasChanges(true);
          }}
        />
        {clarityEnabled && clarityId && !clarityError && (
          <div style={successNoteStyles}>
            ✓ Clarity will be added to your published site automatically
          </div>
        )}
      </Section>

      <Section title="Google Tag Manager">
        <p style={privacyNoteStyles}>
          Manage all your marketing tags and pixels from one GTM container without editing code.
          When enabled, the GTM container loads on every published page.
        </p>
        <Field
          label="GTM Container ID"
          hint="Google Tag Manager → Workspace → your container ID (top bar)"
        >
          <Input
            id="gtm-container-id"
            type="text"
            value={gtmId}
            onChange={(e) => {
              setGtmId(e.target.value.toUpperCase().trim());
              setHasChanges(true);
            }}
            placeholder="GTM-XXXXXXX"
            style={{ borderColor: gtmError ? "var(--bd-error)" : undefined }}
            aria-invalid={!!gtmError}
          />
          {gtmError && (
            <div role="alert" style={errorHintStyles}>
              A GTM container ID looks like GTM-XXXXXXX.
            </div>
          )}
        </Field>
        <SwitchRow
          title="Enable Google Tag Manager"
          checked={gtmEnabled}
          onChange={(next) => {
            setGtmEnabled(next);
            setHasChanges(true);
          }}
        />
        {gtmEnabled && gtmId && !gtmError && (
          <div style={successNoteStyles}>
            ✓ GTM will be added to your published site automatically
          </div>
        )}
      </Section>

      <Section title="Cookie Consent">
        <SwitchRow
          title="Show Cookie Banner"
          checked={cookieBanner}
          onChange={(next) => {
            setCookieBanner(next);
            setHasChanges(true);
          }}
        />
        <div style={infoNoteStyles}>
          Displays a banner asking visitors to accept cookies before tracking begins. Required in
          the EU (GDPR) and recommended everywhere else.
        </div>
      </Section>
    </Screen>
  );
};

const privacyNoteStyles: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--bd-fg-secondary)",
};

const errorHintStyles: React.CSSProperties = {
  marginTop: 4,
  font: "500 10.5px var(--bd-font)",
  color: "var(--bd-error)",
};

const successNoteStyles: React.CSSProperties = {
  padding: "10px 12px",
  background: "rgba(22, 163, 74, 0.08)",
  border: "1px solid rgba(22, 163, 74, 0.3)",
  borderRadius: "var(--buildrick-radius-sm)",
  font: "500 11.5px var(--bd-font)",
  color: "var(--bd-success)",
  lineHeight: 1.5,
};

const infoNoteStyles: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--bd-bg-subtle)",
  border: "1px solid var(--bd-border)",
  borderRadius: "var(--buildrick-radius-sm)",
  font: "500 11.5px var(--bd-font)",
  color: "var(--bd-fg-primary)",
  lineHeight: 1.5,
};
