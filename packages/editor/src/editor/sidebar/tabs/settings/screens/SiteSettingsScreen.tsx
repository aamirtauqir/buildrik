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
 *  - Author has no Site column: it is `seo.author` in the project JSON, saved
 *    by `siteDetail.projectSettings.update` in the same Save (never the
 *    autosave's `sites.saveProject`);
 *  - a changed slug has no settings path at all: the flush asks first
 *    (SlugChangeDialog), then hands the shell the slug as an extra column, so
 *    one `siteDetail.settings.update` carries it with every other change.
 *    Cancel calls the save off (`SettingsSaveCancelled`, no banner); while the
 *    slug is malformed or taken the footer says "Fix the site URL before
 *    saving".
 *
 * Social profiles moved to SEO (Phase B §1 row 20); the language select moved
 * to Languages (row 11).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, TextInput } from "@/editor/chrome-ui";
import type { ProjectSettings } from "@/shared/types/project";
import { getBuildrikClient } from "@/services/api-client";
import { SettingsSaveCancelled } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Field, Input, LoadCard, SCREEN_FIELD_ERROR, SaveErrorBanner, Screen } from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import { localeLabel } from "../constants";
import { SettingsCard } from "../components/SettingsCard";
import { SlugChangeDialog } from "../components/SlugChangeDialog";
import type { ScreenProps, SettingsFlushResult } from "../types";

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
function siteNameError(value: string): string | null {
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
/** 8135:213221 / 8135:213477: the footer's status while the slug blocks Save. */
const SLUG_FOOTER_MESSAGE = "Fix the site URL before saving";
function slugError(value: string): string | null {
  if (!SLUG_PATTERN.test(value)) return SLUG_FORMAT_ERROR;
  if (value.length < 3 || value.length > 50) return "Use 3 to 50 characters.";
  return null;
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
/* 8135:212925 `Button · Upload favicon`: ghost, 32 tall, 12 in, 13/500;
   8134:212323 draws it disabled as grey text, no fill. */
const UPLOAD_BTN =
  "tw:h-8 tw:rounded-[var(--bk-radius-md)] tw:border-0 tw:bg-transparent tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium " +
  "tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:disabled:bg-transparent tw:disabled:text-[var(--bk-gray-400)] " +
  "tw:focus:ring-0 tw:focus:shadow-none " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
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
  /** Read-only (role below ADMIN): the upload stays in view, disabled (8134:212323). */
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
        <Button
          id={id}
          type="button"
          size="xs"
          variant="ghost"
          className={UPLOAD_BTN}
          disabled={busy || readOnly}
          onClick={() => fileRef.current?.click()}
          data-testid={`set-${id}-upload`}
        >
          {busy ? "Uploading…" : button}
        </Button>
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
  registerFieldErrors,
  registerFooterMessage,
  onOpenScreen,
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

  /* What the server holds — dirty is a difference from it, so typing a value
     back to the saved one is clean again. */
  const [saved, setSaved] = React.useState(() => ({
    siteName: seo?.siteName ?? "",
    author: seo?.author ?? composer?.getProjectMetadata?.()?.author ?? "",
    favicon: seo?.favicon ?? "",
    touchIcon: seo?.touchIcon ?? "",
  }));

  const load = useServerLoad<GeneralRow>(
    projectId,
    (client, siteId) => client.siteDetail.settings.get.query({ siteId }),
    (row) => {
      setSiteName(row.name ?? "");
      setFavicon(row.favicon ?? "");
      setTouchIcon(row.touchIcon ?? "");
      setSaved((v) => ({ ...v, siteName: row.name ?? "", favicon: row.favicon ?? "", touchIcon: row.touchIcon ?? "" }));
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

  const dirty =
    siteName !== saved.siteName ||
    author.trim() !== saved.author.trim() ||
    favicon !== saved.favicon ||
    touchIcon !== saved.touchIcon ||
    slug !== savedSlug;
  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

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

  /* While the slug blocks Save, the footer says what to fix (8135:213221 / 213477). */
  const slugBlocks = !!(slugFormatError ?? slugRefused);
  React.useEffect(() => {
    if (!registerFooterMessage) return;
    registerFooterMessage(slugBlocks ? SLUG_FOOTER_MESSAGE : null);
    return () => registerFooterMessage(null);
  }, [registerFooterMessage, slugBlocks]);

  /* A slug the server refused (taken) comes back on the field and keeps Save
     off until it changes (8135:213221); the card it lives in opens. */
  const slugRef = React.useRef({ slug, savedSlug, slugChanged });
  slugRef.current = { slug, savedSlug, slugChanged };
  React.useEffect(() => {
    const message = fieldErrors?.slug;
    if (!message) return;
    setAdvancedOpen(true);
    setRefused({ slug: slugRef.current.slug, message: /already uses/i.test(message) ? SLUG_TAKEN_ERROR : message });
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

  /* Save: the settings, and — when the slug changed — a confirm first
     (SlugChangeDialog), then the slug riding in the same `settings.update`.
     Cancel calls the save off: nothing is sent and nothing reads as failed. */
  /* After the server has them, the sent values are the saved ones. */
  const markSaved = React.useCallback(() => {
    const st = stateRef.current;
    setSaved({ siteName: st.siteName, author: st.author.trim(), favicon: st.favicon, touchIcon: st.touchIcon });
  }, []);

  const flush = React.useCallback((): SettingsFlushResult | Promise<SettingsFlushResult> => {
    const { slug: to, savedSlug: from, slugChanged: changed } = slugRef.current;
    if (!changed) {
      const settings = buildNext();
      return settings ? { settings, onSaved: markSaved } : undefined;
    }
    return new Promise<boolean>((resolve) => {
      confirmRef.current = resolve;
      setSlugConfirm({ from, to });
    }).then((ok): SettingsFlushResult => {
      if (!ok) throw new SettingsSaveCancelled();
      const settings = buildNext();
      if (!settings) return;
      return {
        settings,
        columns: { slug: to },
        onSaved: () => {
          setSavedSlug(to);
          markSaved();
        },
      };
    });
  }, [buildNext, markSaved]);

  React.useEffect(() => {
    if (!registerFlushHandler) return;
    registerFlushHandler(flush);
    return () => registerFlushHandler(null);
  }, [registerFlushHandler, flush]);

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
  const onlySlugRefused = !!fieldErrors?.slug && Object.keys(fieldErrors).length === 1;
  const touchIconError = fieldErrors?.["seo.touchIcon"];

  return (
    <Screen>
      {/* 8135:213221: a taken slug is said on its field and in the footer, not in a banner. */}
      {saveError && !onlySlugRefused ? <SaveErrorBanner message={saveError} /> : null}

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
            }}
            placeholder="https://example.com/favicon.ico"
          />
          {faviconError && (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              {faviconError}
            </div>
          )}
        </Field>

        {/* Navigation, so it stays — and works — on the read-only screen
            (8134:212323): an anchor, which the shell's disabled fieldset
            does not disable. */}
        <Button
          href="#localization"
          variant="link"
          className="tw:min-h-5 tw:w-fit tw:font-medium"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            onOpenScreen?.("localization");
          }}
          data-testid="set-general-language"
        >
          {`${localeLabel(language)} (${language}) · Manage in Languages ›`}
        </Button>
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
