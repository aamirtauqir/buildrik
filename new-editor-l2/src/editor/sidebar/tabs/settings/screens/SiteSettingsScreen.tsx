/**
 * Site Settings screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EVENTS } from "../../../../../shared/constants/events";
import { StickyFooter } from "../../../shared/StickyFooter";
import { Section, Field } from "../shared";
import { screenStyles, inputStyles } from "../styles";
import type { ScreenProps } from "../types";

export const SiteSettingsScreen: React.FC<ScreenProps> = ({ composer }) => {
  const [name, setName] = React.useState("");
  const [favicon, setFavicon] = React.useState("");
  const [language, setLanguage] = React.useState("en");
  const [twitter, setTwitter] = React.useState("");
  const [facebook, setFacebook] = React.useState("");
  const [linkedin, setLinkedin] = React.useState("");
  const [hasChanges, setHasChanges] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  // Load settings from project
  const loadSettings = React.useCallback(() => {
    if (!composer) return;
    const settings = composer.getProjectSettings();
    const seo = settings.seo ?? {};

    setName(seo.siteName ?? "");
    setFavicon(seo.favicon ?? "");
    setLanguage(seo.language ?? "en");
    setTwitter(seo.socialLinks?.twitter ?? "");
    setFacebook(seo.socialLinks?.facebook ?? "");
    setLinkedin(seo.socialLinks?.linkedin ?? "");
    hasLoadedRef.current = true;
    setHasChanges(false);
  }, [composer]);

  // Load on mount and when project loads
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
        siteName: name,
        favicon,
        language,
        socialLinks: { twitter, facebook, linkedin },
      },
    });
    setHasChanges(false);
  };

  return (
    <div style={screenStyles}>
      <Section title="Site Identity">
        <Field label="Site Name">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setHasChanges(true);
            }}
            placeholder="My Awesome Site"
            style={inputStyles}
          />
        </Field>
        <Field label="Favicon URL">
          <input
            type="text"
            value={favicon}
            onChange={(e) => {
              setFavicon(e.target.value);
              setHasChanges(true);
            }}
            placeholder="https://example.com/favicon.ico"
            style={inputStyles}
          />
        </Field>
        <Field label="Site Language">
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setHasChanges(true);
            }}
            style={inputStyles}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
        </Field>
      </Section>

      <Section title="Social Links">
        <Field label="Twitter">
          <input
            type="text"
            value={twitter}
            onChange={(e) => {
              setTwitter(e.target.value);
              setHasChanges(true);
            }}
            placeholder="https://twitter.com/..."
            style={inputStyles}
          />
        </Field>
        <Field label="Facebook">
          <input
            type="text"
            value={facebook}
            onChange={(e) => {
              setFacebook(e.target.value);
              setHasChanges(true);
            }}
            placeholder="https://facebook.com/..."
            style={inputStyles}
          />
        </Field>
        <Field label="LinkedIn">
          <input
            type="text"
            value={linkedin}
            onChange={(e) => {
              setLinkedin(e.target.value);
              setHasChanges(true);
            }}
            placeholder="https://linkedin.com/..."
            style={inputStyles}
          />
        </Field>
      </Section>

      <StickyFooter primaryLabel="Save" onPrimary={handleSave} hasChanges={hasChanges} />
    </div>
  );
};
