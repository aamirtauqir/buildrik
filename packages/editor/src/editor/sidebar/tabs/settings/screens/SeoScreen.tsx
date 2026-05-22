/**
 * SEO screen — Twitter Handle and Default OG Image
 * Site name lives in Site Settings (canonical location).
 * Per-page SEO (meta title, meta description) lives in PageSEO on each page.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Field, Input, Screen, Section } from "../shared";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import type { ScreenProps } from "../types";

const DEFAULT_SEO = {
  twitterHandle: "",
  defaultOgImage: "",
};

export const SeoScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange, registerFlushHandler }) => {
  const { value: seo, isDirty, markDirty } = useSettingsScreen(
    composer,
    (s) => ({
      twitterHandle: s.seo?.twitterHandle ?? "",
      defaultOgImage: s.seo?.defaultOgImage ?? "",
    }),
    DEFAULT_SEO
  );

  const [twitterHandle, setTwitterHandle] = React.useState(seo.twitterHandle);
  const [defaultOgImage, setDefaultOgImage] = React.useState(seo.defaultOgImage);

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Sync local state when composer reloads (preserves user's unsaved edits)
  React.useEffect(() => {
    setTwitterHandle(seo.twitterHandle);
    setDefaultOgImage(seo.defaultOgImage);
  }, [seo.twitterHandle, seo.defaultOgImage]);

  // Flush local buffer → composer once on Save click (see SettingsTab).
  const stateRef = React.useRef({ twitterHandle, defaultOgImage });
  stateRef.current = { twitterHandle, defaultOgImage };
  React.useEffect(() => {
    if (!composer || !registerFlushHandler) return;
    registerFlushHandler(() => {
      const current = composer.getProjectSettings();
      composer.setProjectSettings({
        ...current,
        seo: {
          ...current.seo,
          twitterHandle: stateRef.current.twitterHandle,
          defaultOgImage: stateRef.current.defaultOgImage,
        },
      });
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

  return (
    <Screen>
      <Section title="Site SEO">
        <Field label="Twitter Handle" htmlFor="seo-twitter" hint="e.g. @buildrik">
          <Input
            id="seo-twitter"
            type="text"
            value={twitterHandle}
            onChange={(e) => {
              setTwitterHandle(e.target.value);
              markDirty();
            }}
            placeholder="@yourbrand"
          />
        </Field>

        <Field label="Default OG Image URL" htmlFor="seo-og" hint="Used when pages have no custom image">
          <Input
            id="seo-og"
            type="url"
            value={defaultOgImage}
            onChange={(e) => {
              setDefaultOgImage(e.target.value);
              markDirty();
            }}
            placeholder="https://example.com/og-image.jpg"
          />
        </Field>
      </Section>

      <div
        style={{
          padding: "10px 12px",
          background: "var(--bd-bg-subtle)",
          border: "1px solid var(--bd-border)",
          borderRadius: "var(--buildrick-radius-sm)",
          fontSize: 12,
          color: "var(--bd-fg-muted)",
          lineHeight: 1.5,
        }}
      >
        Per-page SEO (meta title, description, robots) is set in each page&apos;s settings via the
        Pages tab.
      </div>
    </Screen>
  );
};
