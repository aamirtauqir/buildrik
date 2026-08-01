/**
 * Site Settings screen
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Field, Input, Screen, Section, Select } from "../shared";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import type { ScreenProps } from "../types";

interface IdentitySettings {
  siteName: string;
  favicon: string;
  language: string;
}

interface SocialSettings {
  twitter: string;
  facebook: string;
  linkedin: string;
}

const DEFAULT_IDENTITY: IdentitySettings = {
  siteName: "",
  favicon: "",
  language: "en",
};

const DEFAULT_SOCIAL: SocialSettings = {
  twitter: "",
  facebook: "",
  linkedin: "",
};

export const SiteSettingsScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange, registerFlushHandler }) => {
  const identity = useSettingsScreen(
    composer,
    (s) => ({
      siteName: s.seo?.siteName ?? "",
      favicon: s.seo?.favicon ?? "",
      language: s.seo?.language ?? "en",
    }),
    DEFAULT_IDENTITY
  );

  const social = useSettingsScreen(
    composer,
    (s) => ({
      twitter: s.seo?.socialLinks?.twitter ?? "",
      facebook: s.seo?.socialLinks?.facebook ?? "",
      linkedin: s.seo?.socialLinks?.linkedin ?? "",
    }),
    DEFAULT_SOCIAL
  );

  const [siteName, setSiteName] = React.useState(identity.value.siteName);
  const [favicon, setFavicon] = React.useState(identity.value.favicon);
  const [language, setLanguage] = React.useState(identity.value.language);
  const [twitter, setTwitter] = React.useState(social.value.twitter);
  const [facebook, setFacebook] = React.useState(social.value.facebook);
  const [linkedin, setLinkedin] = React.useState(social.value.linkedin);

  const isDirty = identity.isDirty || social.isDirty;

  // Notify central savebar when dirty state changes
  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Sync local state when composer reloads (preserves user's unsaved edits)
  React.useEffect(() => {
    setSiteName(identity.value.siteName);
    setFavicon(identity.value.favicon);
    setLanguage(identity.value.language);
  }, [identity.value.siteName, identity.value.favicon, identity.value.language]);

  React.useEffect(() => {
    setTwitter(social.value.twitter);
    setFacebook(social.value.facebook);
    setLinkedin(social.value.linkedin);
  }, [social.value.twitter, social.value.facebook, social.value.linkedin]);

  // Register flush handler — SettingsTab.handleSave invokes this BEFORE
  // composer.saveProject(). Pulls latest local state from refs so the
  // closure stays single — re-registering per keystroke would defeat the
  // fan-out reduction this whole refactor exists for.
  const stateRef = React.useRef({ siteName, favicon, language, twitter, facebook, linkedin });
  stateRef.current = { siteName, favicon, language, twitter, facebook, linkedin };
  React.useEffect(() => {
    if (!composer || !registerFlushHandler) return;
    registerFlushHandler(() => {
      const current = composer.getProjectSettings();
      const s = stateRef.current;
      composer.setProjectSettings({
        ...current,
        seo: {
          ...current.seo,
          siteName: s.siteName,
          favicon: s.favicon,
          language: s.language,
          socialLinks: {
            twitter: s.twitter,
            facebook: s.facebook,
            linkedin: s.linkedin,
          },
        },
      });
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

  return (
    <Screen>
      <Section title="Site Identity">
        <Field label="Site Name">
          <Input
            type="text"
            value={siteName}
            onChange={(e) => { setSiteName(e.target.value); identity.markDirty(); }}
            placeholder="My Awesome Site"
          />
        </Field>
        <Field label="Favicon URL">
          <Input
            type="text"
            value={favicon}
            onChange={(e) => { setFavicon(e.target.value); identity.markDirty(); }}
            placeholder="https://example.com/favicon.ico"
          />
        </Field>
        <Field label="Site Language">
          <Select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); identity.markDirty(); }}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </Select>
        </Field>
      </Section>

      <Section title="Social Links">
        <Field label="Twitter" htmlFor="social-twitter">
          <Input
            id="social-twitter"
            type="url"
            value={twitter}
            onChange={(e) => { setTwitter(e.target.value); social.markDirty(); }}
            placeholder="https://twitter.com/..."
          />
        </Field>
        <Field label="Facebook" htmlFor="social-facebook">
          <Input
            id="social-facebook"
            type="url"
            value={facebook}
            onChange={(e) => { setFacebook(e.target.value); social.markDirty(); }}
            placeholder="https://facebook.com/..."
          />
        </Field>
        <Field label="LinkedIn" htmlFor="social-linkedin">
          <Input
            id="social-linkedin"
            type="url"
            value={linkedin}
            onChange={(e) => { setLinkedin(e.target.value); social.markDirty(); }}
            placeholder="https://linkedin.com/..."
          />
        </Field>
      </Section>

      <Section title="Legal">
        <div className="tw:flex tw:flex-col tw:gap-1">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ font: "500 11.5px var(--bk-font-ui)", color: "var(--bk-accent)", textDecoration: "none" }}
          >
            Privacy Policy →
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ font: "500 11.5px var(--bk-font-ui)", color: "var(--bk-accent)", textDecoration: "none" }}
          >
            Terms of Service →
          </a>
          <span style={{ fontSize: 12, color: "var(--bk-ink-muted)", marginTop: 4 }}>
            Your data is stored securely. We do not sell or share your site data.
          </span>
        </div>
      </Section>
    </Screen>
  );
};
