/**
 * General — Clone 3397:32011 (`Site setup / General`): the site's identity
 * (name, favicon, language) and its social profiles, in two cards.
 *
 * Values come from the Site row on open (3953:26363 loading, 3953:26503
 * load-error with Try again). Edits stay in this screen until Save: the
 * flush writes them to `projectSettings.seo.*`, and the sync provider's
 * dual-save map carries `siteName` / `favicon` / `language` on to
 * `Site.name` / `Site.favicon` / `Site.defaultLocale` (the publish path reads
 * `Site.favicon`; before S1 the editor's favicon never reached a published
 * site). A refused save shows the banner (3950:26309) over the untouched
 * fields.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Field, Input, LoadCard, SCREEN_FIELD_ERROR, SaveErrorBanner, Screen, Section, Select } from "../shared";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { useServerLoad } from "../hooks/useServerLoad";
import { ToggleSwitch } from "@/editor/chrome-ui";
import { SITE_LOCALES, localeLabel } from "../constants";
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

/** The columns this screen reads off `siteDetail.settings.get`. */
interface GeneralRow {
  name?: string | null;
  favicon?: string | null;
  defaultLocale?: string | null;
  /** `Site.defaultLocale` must be one of these or the server refuses the save. */
  enabledLocales?: string[] | null;
  /** A Json column — whatever the dashboard stored; only string values are links. */
  socialLinks?: unknown;
}

function socialLink(links: unknown, key: "twitter" | "facebook" | "linkedin"): string {
  if (typeof links !== "object" || links === null) return "";
  const value: unknown = (links as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

/* `Site.name` is `z.string().min(2).max(100)` on the server — a one-letter
   name is refused by the whole settings mutation, and an empty one cannot be
   sent at all (the column is required; the sync provider skips it). Said
   here, under the field, before Save has to say it in a banner. */
const SITE_NAME_MIN = 2;
const SITE_NAME_MAX = 100;
function siteNameError(value: string): string | null {
  const length = value.trim().length;
  if (length === 0) return "Give the site a name — it is what the browser tab and search results show.";
  if (length < SITE_NAME_MIN) return `Needs at least ${SITE_NAME_MIN} characters.`;
  if (length > SITE_NAME_MAX) return `Keep it under ${SITE_NAME_MAX} characters.`;
  return null;
}

export const SiteSettingsScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerFlushHandler,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
}) => {
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
  /* Board 1172:4867's Project settings modal held these three and nothing
     else did; the modal is superseded by this screen (its `Site settings`
     door lands here), so its Author and Canvas grid live on — the author in
     Site identity, the grid in its own card. They are the engine's, not the
     Site row's: read once on mount, written on the flush. */
  const [author, setAuthor] = React.useState(() => composer?.getProjectMetadata?.()?.author ?? "");
  const [gridSize, setGridSize] = React.useState(() => composer?.getState?.().gridSize ?? 10);
  const [snapToGrid, setSnapToGrid] = React.useState(() => composer?.getState?.().snapToGrid ?? false);
  /* null = no Site row read (the standalone demo), so nothing to check
     against; the server enforces `defaultLocale ∈ enabledLocales` either way. */
  const [enabledLocales, setEnabledLocales] = React.useState<string[] | null>(null);

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

  // The Site row, as it is now. The composer's copy of these columns is the
  // one `loadProject` merged when the editor opened; the frame wants the row
  // at the moment the screen opens, and wants a failed read to be a state.
  const load = useServerLoad<GeneralRow>(
    projectId,
    (client, siteId) => client.siteDetail.settings.get.query({ siteId }),
    (row) => {
      setSiteName(row.name ?? "");
      setFavicon(row.favicon ?? "");
      setLanguage(row.defaultLocale ?? "en");
      setEnabledLocales(row.enabledLocales ?? null);
      setTwitter(socialLink(row.socialLinks, "twitter"));
      setFacebook(socialLink(row.socialLinks, "facebook"));
      setLinkedin(socialLink(row.socialLinks, "linkedin"));
    },
    { onLoadStateChange, registerRetryLoad }
  );

  // Register flush handler — SettingsTab.handleSave invokes this BEFORE
  // composer.saveProject(). Pulls latest local state from refs so the
  // closure stays single — re-registering per keystroke would defeat the
  // fan-out reduction this whole refactor exists for.
  const stateRef = React.useRef({ siteName, favicon, language, twitter, facebook, linkedin, author, gridSize, snapToGrid });
  stateRef.current = { siteName, favicon, language, twitter, facebook, linkedin, author, gridSize, snapToGrid };
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
      /* The site name is the project's name too: the sidebar, the topbar and
         the Settings saved dialog read `getProjectMetadata().name`, which was
         loaded from the Site row and would keep the old name until a reload
         after the mirror wrote `Site.name` (walked live 2026-09-14). */
      const name = s.siteName.trim();
      const meta = composer.getProjectMetadata?.();
      const author = s.author.trim();
      if ((name && name !== meta?.name) || author !== (meta?.author ?? "")) {
        composer.updateProjectMetadata?.({ ...(name ? { name } : {}), author });
      }
      composer.setGridSize?.(s.gridSize);
      composer.setSnapToGrid?.(s.snapToGrid);
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Site identity"
          line="Site name, favicon, language and social profiles."
          state={load.state}
          errorLine="Couldn't load your site settings. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const nameError = siteNameError(siteName);
  /* A row whose locale the list does not carry still has to show — and keep —
     its own value; otherwise the select would silently fall to the first
     option and the next Save would change the site's language. */
  const languageOptions = SITE_LOCALES.some((l) => l.code === language)
    ? SITE_LOCALES
    : [{ code: language, label: localeLabel(language) }, ...SITE_LOCALES];
  /* `Site.defaultLocale` must be one of the site's enabled locales — the
     server refuses the whole settings mirror otherwise
     (`DEFAULT_LOCALE_NOT_ENABLED`), and Localization is where a locale is
     enabled. Said under the select, before Save has to say it in a banner. */
  const languageError =
    enabledLocales && !enabledLocales.includes(language)
      ? `${localeLabel(language)} is not enabled for this site yet — add it under Localization first, or the save will be refused.`
      : null;

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <Section title="Site identity">
        <Field label="Site name" htmlFor="site-name">
          <Input
            id="site-name"
            type="text"
            value={siteName}
            aria-invalid={nameError ? true : undefined}
            onChange={(e) => { setSiteName(e.target.value); identity.markDirty(); }}
          />
          {nameError && (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              {nameError}
            </div>
          )}
        </Field>
        <Field label="Favicon URL" htmlFor="favicon-url">
          <Input
            id="favicon-url"
            type="text"
            value={favicon}
            onChange={(e) => { setFavicon(e.target.value); identity.markDirty(); }}
            placeholder="https://example.com/favicon.ico"
          />
        </Field>
        <Field label="Site Language" htmlFor="site-language">
          <Select
            id="site-language"
            value={language}
            aria-invalid={languageError ? true : undefined}
            onChange={(e) => { setLanguage(e.target.value); identity.markDirty(); }}
          >
            {languageOptions.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label} ({l.code})
              </option>
            ))}
          </Select>
          {languageError && (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              {languageError}
            </div>
          )}
        </Field>
        <Field label="Author" htmlFor="site-author">
          <Input
            id="site-author"
            type="text"
            value={author}
            onChange={(e) => { setAuthor(e.target.value); identity.markDirty(); }}
            placeholder="Who this site belongs to"
          />
        </Field>
      </Section>

      <Section title="Social links">
        <Field label="Twitter" htmlFor="social-twitter">
          <Input
            id="social-twitter"
            type="url"
            value={twitter}
            onChange={(e) => { setTwitter(e.target.value); social.markDirty(); }}
            placeholder="https://twitter.com/…"
          />
        </Field>
        <Field label="Facebook" htmlFor="social-facebook">
          <Input
            id="social-facebook"
            type="url"
            value={facebook}
            onChange={(e) => { setFacebook(e.target.value); social.markDirty(); }}
            placeholder="https://facebook.com/…"
          />
        </Field>
        <Field label="LinkedIn" htmlFor="social-linkedin">
          <Input
            id="social-linkedin"
            type="url"
            value={linkedin}
            onChange={(e) => { setLinkedin(e.target.value); social.markDirty(); }}
            placeholder="https://linkedin.com/company/…"
          />
        </Field>
      </Section>

      <Section title="Canvas">
        <Field label="Grid size" htmlFor="canvas-grid-size" hint="Pixels between snap points, 1–100.">
          <Input
            id="canvas-grid-size"
            type="number"
            min={1}
            max={100}
            value={gridSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next)) setGridSize(Math.min(100, Math.max(1, Math.round(next))));
              identity.markDirty();
            }}
          />
        </Field>
        <div className="tw:col-span-full tw:flex tw:items-center tw:gap-4">
          <span
            id="canvas-snap-label"
            className="tw:w-48 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]"
          >
            Snap to grid
          </span>
          <ToggleSwitch
            id="canvas-snap"
            checked={snapToGrid}
            onChange={(next) => {
              setSnapToGrid(next);
              identity.markDirty();
            }}
            aria-labelledby="canvas-snap-label"
            sizing="sm"
          />
        </div>
      </Section>
    </Screen>
  );
};
