/**
 * SEO screen — meta title (site name), description placeholder, robots toggle
 * Uses fields available in SiteSEO: siteName and twitterHandle.
 * Per-page SEO (metaTitle, metaDescription) lives in PageSEO on each page.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "../../../../../shared/constants/events";
import { StickyFooter } from "../../../shared/StickyFooter";
import { Section, Field } from "../shared";
import type { ScreenProps } from "../types";

export const SeoScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange }) => {
  const [siteName, setSiteName] = React.useState("");
  const [twitterHandle, setTwitterHandle] = React.useState("");
  const [defaultOgImage, setDefaultOgImage] = React.useState("");
  const [hasChanges, setHasChanges] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  React.useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const loadSettings = React.useCallback(() => {
    if (!composer) return;
    const settings = composer.getProjectSettings();
    const seo = settings.seo ?? {};
    setSiteName(seo.siteName ?? "");
    setTwitterHandle(seo.twitterHandle ?? "");
    setDefaultOgImage(seo.defaultOgImage ?? "");
    hasLoadedRef.current = true;
    setHasChanges(false);
  }, [composer]);

  React.useEffect(() => {
    if (!composer) return;
    loadSettings();

    const handleProjectLoaded = () => {
      if (!hasLoadedRef.current) loadSettings();
    };

    composer.on(EVENTS.PROJECT_LOADED, handleProjectLoaded);
    composer.on(EVENTS.SETTINGS_CHANGE, loadSettings);

    return () => {
      composer.off(EVENTS.PROJECT_LOADED, handleProjectLoaded);
      composer.off(EVENTS.SETTINGS_CHANGE, loadSettings);
    };
  }, [composer, loadSettings]);

  const handleSave = () => {
    if (!composer) return;
    const current = composer.getProjectSettings();
    composer.setProjectSettings({
      ...current,
      seo: {
        ...current.seo,
        siteName,
        twitterHandle,
        defaultOgImage,
      },
    });
    setHasChanges(false);
  };

  return (
    <div className="aqb-st-screen">
      <Section title="Site SEO">
        <Field label="Site Name (meta og:site_name)" htmlFor="seo-sitename">
          <input
            id="seo-sitename"
            type="text"
            value={siteName}
            onChange={(e) => {
              setSiteName(e.target.value);
              setHasChanges(true);
            }}
            placeholder="My Awesome Site"
            className="aqb-st-input"
          />
        </Field>

        <Field label="Twitter Handle" htmlFor="seo-twitter" hint="e.g. @buildrik">
          <input
            id="seo-twitter"
            type="text"
            value={twitterHandle}
            onChange={(e) => {
              setTwitterHandle(e.target.value);
              setHasChanges(true);
            }}
            placeholder="@yourbrand"
            className="aqb-st-input"
          />
        </Field>

        <Field label="Default OG Image URL" htmlFor="seo-og" hint="Used when pages have no custom image">
          <input
            id="seo-og"
            type="url"
            value={defaultOgImage}
            onChange={(e) => {
              setDefaultOgImage(e.target.value);
              setHasChanges(true);
            }}
            placeholder="https://example.com/og-image.jpg"
            className="aqb-st-input"
          />
        </Field>
      </Section>

      <div
        style={{
          padding: "10px 12px",
          background: "rgba(99,102,241,0.06)",
          borderRadius: "var(--aqb-radius-md)",
          border: "1px solid rgba(99,102,241,0.15)",
          fontSize: 12,
          color: "var(--aqb-text-muted)",
          lineHeight: 1.5,
        }}
      >
        Per-page SEO (meta title, description, robots) is set in each page's settings via the
        Pages tab.
      </div>

      <StickyFooter primaryLabel="Save" onPrimary={handleSave} hasChanges={hasChanges} />
    </div>
  );
};
