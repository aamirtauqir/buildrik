/**
 * SEO screen — Twitter Handle and Default OG Image
 * Site name lives in Site Settings (canonical location).
 * Per-page SEO (meta title, meta description) lives in PageSEO on each page.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Field, Input, SCREEN_FIELD_ERROR, Screen, Section } from "../shared";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import type { ScreenProps } from "../types";

const DEFAULT_SEO = {
  twitterHandle: "",
  defaultOgImage: "",
  metaTitleTemplate: "",
};

export const SeoScreen: React.FC<ScreenProps> = ({ composer, onDirtyChange, registerFlushHandler }) => {
  const { value: seo, isDirty, markDirty } = useSettingsScreen(
    composer,
    (s) => ({
      twitterHandle: s.seo?.twitterHandle ?? "",
      defaultOgImage: s.seo?.defaultOgImage ?? "",
      metaTitleTemplate: s.seo?.metaTitleTemplate ?? "",
    }),
    DEFAULT_SEO
  );

  const [twitterHandle, setTwitterHandle] = React.useState(seo.twitterHandle);
  const [defaultOgImage, setDefaultOgImage] = React.useState(seo.defaultOgImage);
  /* The template column has existed (and been graded by the pre-publish "SEO
     configured" check) with no field anywhere that could set it. */
  const [titleTemplate, setTitleTemplate] = React.useState(seo.metaTitleTemplate);

  /* The server takes this column as `z.string().url()`, so "mysite.com/og.png"
     — a plausible thing to type — is refused. Before this, the only sign was a
     toast after saving, from a mutation two layers away. Same inline shape the
     Analytics screen uses for its ID fields. */
  const ogImageError =
    defaultOgImage.trim() !== "" && !/^https?:\/\/\S+$/i.test(defaultOgImage.trim());

  React.useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Sync local state when composer reloads (preserves user's unsaved edits)
  React.useEffect(() => {
    setTwitterHandle(seo.twitterHandle);
    setDefaultOgImage(seo.defaultOgImage);
    setTitleTemplate(seo.metaTitleTemplate);
  }, [seo.twitterHandle, seo.defaultOgImage, seo.metaTitleTemplate]);

  // Flush local buffer → composer once on Save click (see SettingsTab).
  const stateRef = React.useRef({ twitterHandle, defaultOgImage, titleTemplate });
  stateRef.current = { twitterHandle, defaultOgImage, titleTemplate };
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
          metaTitleTemplate: stateRef.current.titleTemplate,
        },
      });
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

  return (
    <Screen>
      <Section title="Site SEO">
        <Field
          label="Title template"
          htmlFor="seo-title-template"
          hint={
            titleTemplate.trim() && !titleTemplate.includes("{page_title}")
              ? "Add {page_title} — without it every page would ship the same title, so the template is ignored."
              : "Wraps every page title. {page_title} and {site_name} are replaced."
          }
        >
          <Input
            id="seo-title-template"
            type="text"
            value={titleTemplate}
            onChange={(e) => {
              setTitleTemplate(e.target.value);
              markDirty();
            }}
            placeholder="{page_title} | {site_name}"
          />
        </Field>

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
            aria-invalid={ogImageError || undefined}
            value={defaultOgImage}
            onChange={(e) => {
              setDefaultOgImage(e.target.value);
              markDirty();
            }}
            placeholder="https://example.com/og-image.jpg"
          />
          {ogImageError && (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              Needs a full URL, starting with https://
            </div>
          )}
        </Field>
      </Section>

      <div
        style={{
          padding: "10px 12px",
          background: "var(--bk-bg-subtle)",
          border: "1px solid var(--bk-border)",
          borderRadius: "var(--bk-radius-sm)",
          fontSize: 12,
          /* muted on subtle is 4.39:1 — under AA at 12px (axe). */
          color: "var(--bk-ink-soft)",
          lineHeight: 1.5,
        }}
      >
        Per-page SEO (meta title, description, robots) is set in each page&apos;s settings via the
        Pages tab.
      </div>
    </Screen>
  );
};
