/**
 * General — 8135:212718 (default) · 8135:212966 (Advanced open) ·
 * 8135:213221 (slug taken) · 8135:213477 (slug format) · 8135:213733 (slug
 * confirm): the site's identity in one card — name, author, favicon and touch
 * icon (upload + preview), the favicon URL, and a link to Languages for the
 * site language — and a collapsed `Advanced` card holding the URL slug.
 *
 * Values come from the Site row on open (`siteDetail.settings.get`; load card
 * while it reads, Try again when it fails). Edits stay here until Save:
 *  - name / favicon / touch icon go out through the flush the shell saves
 *    (`seo.siteName` / `seo.favicon` / `seo.touchIcon` → the Site columns);
 *  - Author has no Site column: it is `seo.author` in the project JSON, which
 *    no settings mutation covers, so the shell hands it to the composer and
 *    the project save carries it (ScreenProps.registerFlushHandler);
 *  - a changed slug has no settings path at all, so while one is pending the
 *    screen registers its own Save: confirm (SlugChangeDialog), then one
 *    `siteDetail.settings.update` carrying the slug with every other change.
 *
 * Social profiles moved to SEO (Phase B §1 row 20); the language select moved
 * to Languages (row 11).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, TextInput } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import type { ProjectSettings } from "@/shared/types/project";
import { getBuildrikClient } from "@/services/api-client";
import {
  SettingsSaveError,
  planSettingsSave,
  saveSiteSettings,
  type SiteColumnPatch,
} from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Field, Input, LoadCard, SCREEN_FIELD_ERROR, SaveErrorBanner, Screen } from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import { localeLabel } from "../constants";
import { SettingsCard } from "../components/SettingsCard";
import { SlugChangeDialog } from "../components/SlugChangeDialog";
import type { ScreenProps } from "../types";

/** The columns this screen reads off `siteDetail.settings.get`. */
interface GeneralRow {
  name?: string | null;
  slug?: string | null;
  favicon?: string | null;
  touchIcon?: string | null;
  defaultLocale?: string | null;
}

/* `Site.name` is `z.string().min(2).max(100)` on the server. */
const SITE_NAME_MIN = 2;
const SITE_NAME_MAX = 100;
export function siteNameError(value: string): string | null {
  const length = value.trim().length;
  if (length === 0) return "Give the site a name — it is what the browser tab and search results show.";
  if (length < SITE_NAME_MIN) return `Needs at least ${SITE_NAME_MIN} characters.`;
  if (length > SITE_NAME_MAX) return `Keep it under ${SITE_NAME_MAX} characters.`;
  return null;
}

/* `updateSiteSettingsSchema.slug`: 3–50, `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_FORMAT_ERROR = "Use only lowercase letters, numbers and hyphens.";
export const SLUG_TAKEN_ERROR = "This site URL is already taken. Choose another.";
export function slugError(value: string): string | null {
  if (!SLUG_PATTERN.test(value)) return SLUG_FORMAT_ERROR;
  if (value.length < 3 || value.length > 50) return "Use 3 to 50 characters.";
  return null;
}

/**
 * One Settings save that also carries Site columns no settings path names
 * (`slug`, `canonicalUrl`): the same plan the shell's flush save runs
 * (`planSettingsSave` → `saveSiteSettings`), with the extra columns in the one
 * `settings.update`. The composer adopts `next` once the server has it — or,
 * when a changed key no mutation covers (Author), takes it as an edit so the
 * project save carries it, exactly as the shell does for a flush.
 */
export async function saveSettingsWithColumns(
  composer: Composer,
  siteId: string,
  next: ProjectSettings,
  extraColumns: SiteColumnPatch,
): Promise<void> {
  const wasDirty = composer.isDirty?.() ?? true;
  const plan = planSettingsSave(composer.getProjectSettings(), next);
  const columns: SiteColumnPatch = { ...plan.columns, ...extraColumns };
  await saveSiteSettings(siteId, { ...plan, columns });
  if (plan.unrouted) {
    composer.setProjectSettings(next);
    return;
  }
  composer.adoptSavedProjectSettings(next);
  if (!wasDirty) composer.markSaved?.();
}

/** The live site's host (`bella-cucina.vercel.app`), or null before the first publish. */
function liveHostOf(publishedUrl: string | null | undefined): string | null {
  if (!publishedUrl) return null;
  try {
    return new URL(publishedUrl).host;
  } catch {
    return null;
  }
}

/** `trpc.upload.presign` → PUT → `upload.confirm`, as the dashboard's Settings tab uploads icons. */
async function uploadSiteIcon(siteId: string, file: File, context: "favicon" | "touch_icon"): Promise<string> {
  const client = getBuildrikClient(DASHBOARD_URL);
  const { fileId, uploadUrl } = await client.upload.presign.mutate({
    fileName: file.name,
    fileType: file.type,
    context,
    siteId,
  });
  const res = await fetch(new URL(uploadUrl, DASHBOARD_URL || window.location.origin).toString(), {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "The upload did not go through.");
  }
  return (await client.upload.confirm.mutate({ fileId })).cdnUrl;
}

const ICON_LABEL = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink)]";
const ICON_HINT = "tw:text-[length:var(--bk-text-11)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
/* 8135:212925 `Button · Upload favicon`: ghost, 32 tall, 12 in, 13/500. */
const UPLOAD_BTN =
  "tw:h-8 tw:rounded-[var(--bk-radius-md)] tw:border-0 tw:bg-transparent tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium " +
  "tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0 tw:focus:shadow-none " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
/* 8135:212955: the language row, an accent text link. */
const LINK_BTN =
  "tw:h-5 tw:w-fit tw:justify-start tw:rounded-[var(--bk-radius-sm)] tw:border-0 tw:bg-transparent tw:p-0 " +
  "tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-accent)] tw:enabled:hover:bg-transparent " +
  "tw:enabled:hover:underline tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const FIELD_ROW = "tw:grid tw:grid-cols-2 tw:gap-x-6 tw:gap-y-4";

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? words[0]?.[1] ?? "")).toUpperCase();
}

interface IconUploadProps {
  id: string;
  label: string;
  hint: string;
  button: string;
  accept: string;
  value: string;
  initials: string;
  busy: boolean;
  /** Read-only (role below ADMIN): the preview and hint stay, the upload goes. */
  readOnly?: boolean;
  onPick(file: File): void;
}

/** 8135:212920 `Favicon` / 8135:212935 `Touch icon`: label, a 40 preview tile, the upload button, the format hint. */
function IconUpload({ id, label, hint, button, accept, value, initials, busy, readOnly, onPick }: IconUploadProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  return (
    <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-2" data-testid={`set-field-${id}`}>
      <p className={ICON_LABEL}>{label}</p>
      <div className="tw:flex tw:h-10 tw:items-center tw:gap-3">
        <div
          className="tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-[var(--bk-radius-lg)] tw:bg-[var(--bk-accent-tint)]"
          data-testid={`set-${id}-preview`}
        >
          {value ? (
            <img src={value} alt="" className="tw:size-full tw:object-contain" />
          ) : (
            <span className="tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-accent)]">
              {initials}
            </span>
          )}
        </div>
        {readOnly ? null : (
          <Button
            id={id}
            type="button"
            size="xs"
            variant="ghost"
            className={UPLOAD_BTN}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            data-testid={`set-${id}-upload`}
          >
            {busy ? "Uploading…" : button}
          </Button>
        )}
        <span className={ICON_HINT}>{hint}</span>
        <TextInput
          ref={fileRef}
          type="file"
          accept={accept}
          className="tw:hidden"
          tabIndex={-1}
          data-testid={`set-${id}-file`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onPick(file);
          }}
        />
      </div>
    </div>
  );
}

export const SiteSettingsScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerFlushHandler,
  registerSaveHandler,
  registerFieldErrors,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
  fieldErrors,
  readOnly,
}) => {
  /* The composer's copy first — all the standalone demo (no site) has —
     then the Site row replaces it once read. */
  const seo = composer?.getProjectSettings().seo;
  const [siteName, setSiteName] = React.useState(seo?.siteName ?? "");
  const [author, setAuthor] = React.useState(seo?.author ?? composer?.getProjectMetadata?.()?.author ?? "");
  const [favicon, setFavicon] = React.useState(seo?.favicon ?? "");
  const [touchIcon, setTouchIcon] = React.useState(seo?.touchIcon ?? "");
  const [language, setLanguage] = React.useState(seo?.language ?? "en");
  const [slug, setSlug] = React.useState("");
  /* The slug the server holds — a Save is only a slug change against this. */
  const [savedSlug, setSavedSlug] = React.useState("");
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState<"favicon" | "touch-icon" | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  /* The slug the server refused as taken — Save stays off until it changes (8135:213221). */
  const [refused, setRefused] = React.useState<{ slug: string; message: string } | null>(null);
  const [slugConfirm, setSlugConfirm] = React.useState<{ from: string; to: string } | null>(null);
  const confirmRef = React.useRef<((ok: boolean) => void) | null>(null);

  const edit = React.useCallback(() => onDirtyChange?.(true), [onDirtyChange]);

  const load = useServerLoad<GeneralRow>(
    projectId,
    (client, siteId) => client.siteDetail.settings.get.query({ siteId }),
    (row) => {
      setSiteName(row.name ?? "");
      setFavicon(row.favicon ?? "");
      setTouchIcon(row.touchIcon ?? "");
      setLanguage(row.defaultLocale ?? "en");
      setSlug(row.slug ?? "");
      setSavedSlug(row.slug ?? "");
    },
    { onLoadStateChange, registerRetryLoad },
  );

  const nameError = siteNameError(siteName);
  const slugFormatError = slug !== savedSlug ? slugError(slug) : null;
  const slugRefused = refused && slug === refused.slug ? refused.message : null;
  const slugMessage = slugFormatError ?? slugRefused;
  const slugChanged = !!projectId && slug !== savedSlug && !slugFormatError;

  /* The screen's own refusals disable Save (§27) — keyed as the server keys them. */
  React.useEffect(() => {
    if (!registerFieldErrors) return;
    const errors: Record<string, string> = {};
    if (load.state === "ready" && nameError) errors["seo.siteName"] = nameError;
    const slugProblem = slugFormatError ?? slugRefused;
    if (slugProblem) errors.slug = slugProblem;
    registerFieldErrors(errors);
    return () => registerFieldErrors(null);
  }, [registerFieldErrors, load.state, nameError, slugFormatError, slugRefused]);

  /* A refused slug opens the card it lives in. */
  React.useEffect(() => {
    if (fieldErrors?.slug) setAdvancedOpen(true);
  }, [fieldErrors?.slug]);

  const stateRef = React.useRef({ siteName, author, favicon, touchIcon });
  stateRef.current = { siteName, author, favicon, touchIcon };

  /** The settings this screen wants saved: the composer's, plus its edits. */
  const buildNext = React.useCallback((): ProjectSettings | void => {
    if (!composer) return;
    const current = composer.getProjectSettings();
    const s = stateRef.current;
    /* The site name is the project's name too: the topbar and the Settings
       header read `getProjectMetadata().name`. Merged without dirtying the
       document — the name is saved as the `Site.name` column. */
    const name = s.siteName.trim();
    if (name && name !== composer.getProjectMetadata?.()?.name) composer.mergeProjectMetadata?.({ name });
    return {
      ...current,
      seo: {
        ...current.seo,
        siteName: s.siteName,
        favicon: s.favicon,
        touchIcon: s.touchIcon,
        author: s.author.trim(),
      },
    };
  }, [composer]);

  React.useEffect(() => {
    if (!registerFlushHandler) return;
    registerFlushHandler(buildNext);
    return () => registerFlushHandler(null);
  }, [registerFlushHandler, buildNext]);

  /* While a valid slug change is pending, Save is this: confirm, then one
     save with the slug riding along. Cancel leaves everything unsaved. */
  React.useEffect(() => {
    if (!registerSaveHandler || !slugChanged || !composer || !projectId) return;
    const from = savedSlug;
    const to = slug;
    registerSaveHandler(async () => {
      const ok = await new Promise<boolean>((resolve) => {
        confirmRef.current = resolve;
        setSlugConfirm({ from, to });
      });
      if (!ok) throw new SettingsSaveError("The site URL change was cancelled. Nothing was saved.");
      const next = buildNext();
      if (!next) return;
      try {
        await saveSettingsWithColumns(composer, projectId, next, { slug: to });
      } catch (err) {
        /* SLUG_TAKEN / PROJECT_NAME_TAKEN come back as CONFLICTs with no
           field path ("Another site already uses …"); name the field. */
        if (err instanceof SettingsSaveError && err.fieldErrors.slug) setRefused({ slug: to, message: err.fieldErrors.slug });
        if (err instanceof SettingsSaveError && !err.fieldErrors.slug && /already uses/i.test(err.message)) {
          setRefused({ slug: to, message: SLUG_TAKEN_ERROR });
          throw new SettingsSaveError(err.message, { ...err.fieldErrors, slug: SLUG_TAKEN_ERROR });
        }
        throw err;
      }
      setSavedSlug(to);
    });
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, slugChanged, composer, projectId, savedSlug, slug, buildNext]);

  const answerConfirm = (ok: boolean) => {
    setSlugConfirm(null);
    confirmRef.current?.(ok);
    confirmRef.current = null;
  };

  const pickIcon = async (file: File, which: "favicon" | "touch-icon") => {
    if (!projectId) return;
    setUploadError(null);
    setUploading(which);
    try {
      const url = await uploadSiteIcon(projectId, file, which === "favicon" ? "favicon" : "touch_icon");
      if (which === "favicon") setFavicon(url);
      else setTouchIcon(url);
      edit();
    } catch (err) {
      setUploadError(
        `Couldn't upload the ${which === "favicon" ? "favicon" : "touch icon"}: ${err instanceof Error ? err.message : "please try again."}`,
      );
    } finally {
      setUploading(null);
    }
  };

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Site identity"
          line="Site name, author, favicon and touch icon."
          state={load.state}
          errorLine="Couldn't load your site settings. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const initials = initialsOf(siteName);
  const liveHost = liveHostOf(composer?.getProjectMetadata?.()?.publishedUrl);
  const faviconError = fieldErrors?.["seo.favicon"];
  const touchIconError = fieldErrors?.["seo.touchIcon"];

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <SettingsCard title="Site identity">
        <div className={FIELD_ROW}>
          <Field label="Site name" htmlFor="site-name" siteColumn="seo.siteName">
            <Input
              id="site-name"
              type="text"
              value={siteName}
              aria-invalid={nameError ? true : undefined}
              onChange={(e) => {
                setSiteName(e.target.value);
                edit();
              }}
            />
            {nameError && (
              <div role="alert" className={SCREEN_FIELD_ERROR}>
                {nameError}
              </div>
            )}
          </Field>
          <Field label="Author" htmlFor="site-author">
            <Input
              id="site-author"
              type="text"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                edit();
              }}
              placeholder="Who this site belongs to"
            />
          </Field>
        </div>

        <div className={FIELD_ROW}>
          <IconUpload
            id="favicon"
            label="Favicon"
            hint="ICO, PNG or SVG"
            button="Upload favicon"
            accept="image/x-icon,image/png,image/svg+xml,.ico"
            value={favicon}
            initials={initials}
            busy={uploading === "favicon"}
            readOnly={readOnly}
            onPick={(file) => void pickIcon(file, "favicon")}
          />
          <IconUpload
            id="touch-icon"
            label="Touch icon"
            hint="PNG · 180×180 recommended"
            button="Upload touch icon"
            accept="image/png"
            value={touchIcon}
            initials={initials}
            busy={uploading === "touch-icon"}
            readOnly={readOnly}
            onPick={(file) => void pickIcon(file, "touch-icon")}
          />
        </div>
        {uploadError || touchIconError ? (
          <div role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-icon-error">
            {uploadError ?? touchIconError}
          </div>
        ) : null}

        <Field label="Favicon URL" htmlFor="favicon-url" siteColumn="seo.favicon" span="full">
          <Input
            id="favicon-url"
            type="text"
            value={favicon}
            aria-invalid={faviconError ? true : undefined}
            onChange={(e) => {
              setFavicon(e.target.value);
              edit();
            }}
            placeholder="https://example.com/favicon.ico"
          />
          {faviconError && (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              {faviconError}
            </div>
          )}
        </Field>

        {readOnly ? (
          <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
            {`${localeLabel(language)} (${language})`}
          </p>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className={LINK_BTN}
            onClick={() => composer?.emit(EVENTS.UI_SETTINGS_OPEN, { screen: "localization" })}
            data-testid="set-general-language"
          >
            {`${localeLabel(language)} (${language}) · Manage in Languages ›`}
          </Button>
        )}
      </SettingsCard>

      <SettingsCard title="Advanced" open={advancedOpen} onToggle={setAdvancedOpen} anchors={["site-slug"]}>
        <Field label="Site URL slug" htmlFor="site-slug" span="full">
          <Input
            id="site-slug"
            type="text"
            value={slug}
            aria-invalid={slugMessage ? true : undefined}
            onChange={(e) => {
              setSlug(e.target.value);
              edit();
            }}
          />
        </Field>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
          Use lowercase letters, numbers and hyphens.
        </p>
        <p
          className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]"
          data-testid="set-general-default-url"
        >
          {liveHost
            ? `Current default URL · ${liveHost}`
            : "Current default URL · not published yet — your first publish takes it from this slug"}
        </p>
        {slugMessage ? (
          <p
            role="alert"
            className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-red-700)]"
            data-testid="set-general-slug-error"
          >
            {slugMessage}
          </p>
        ) : null}
      </SettingsCard>

      <SlugChangeDialog
        change={slugConfirm}
        liveHost={liveHost}
        onCancel={() => answerConfirm(false)}
        onConfirm={() => answerConfirm(true)}
      />
    </Screen>
  );
};
