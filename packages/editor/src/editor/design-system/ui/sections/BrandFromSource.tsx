/**
 * BrandFromSource — Brand › Starters › Brand from logo or website, board
 * BRP1-M11 (source 8224:246458 · loading 8224:247084 · preview 8224:247700 ·
 * no-colours 8224:248332 · timeout 8224:248970 · address-refused 8224:249604 ·
 * confirmed 8224:250233). Behind `dsAi` (spec §9) — the caller decides.
 *
 * A logo is decoded in the browser and never uploaded (D16); a website is
 * read by the server's SSRF-guarded `theme.extractBrandFromUrl`, which
 * returns raw colour and font strings. Both reach the same deterministic role
 * picker and scale generator, and the result is PREVIEWED on the canvas
 * (useBrandPreview) until Confirm, which takes a restore point first (OQ-6:
 * none → nothing changes) and writes everything as one ⌘Z step. Cancel,
 * navigation away and unmount put the saved brand back (D17).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, TextInput, useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { DesignToken } from "@/engine/designSystem/types";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { applyScaleToRole, generateColorScale } from "@/engine/designSystem/scale";
import {
  mapFontFamily,
  normalizeColorCounts,
  pickBrandRoles,
  type BrandRoles,
  type ColorCount,
  type GenericFamily,
} from "@/engine/designSystem/brandColors";
import { mergeProjectTokens } from "@/engine/designSystem/projectTokens";
import { getBuildrikClient } from "@/services/api-client";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { decodeLogoColors } from "@/editor/design-system/utils/decodeLogo";
import { takeRestorePoint } from "@/editor/design-system/state/useBrandRestorePoints";
import { useBrandPreview } from "@/editor/design-system/state/useBrandPreview";
import { useGuardedApply } from "@/editor/design-system/state/useGuardedApply";

// ─── Proposal (pure) ──────────────────────────────────────────────────────────

interface FontChoice {
  heading?: { family: string; replaced?: string };
  body?: { family: string; replaced?: string };
}

/** The brand a logo or site proposes: Primary (and Accent) get a generated
 *  scale, the heading/body families their closest catalogue family. */
function brandProposal(tokens: readonly DesignToken[], roles: BrandRoles, fonts: FontChoice = {}): DesignToken[] {
  let out: DesignToken[] = [...tokens];
  for (const [roleId, hex] of [["color-primary", roles.primary], ["color-accent", roles.accent]] as const) {
    const scale = hex ? generateColorScale(hex) : null;
    if (!scale) continue;
    const applied = applyScaleToRole(out, roleId, scale);
    if (applied.ok) out = applied.tokens;
  }
  if (fonts.heading) out = setTokenLiteral(out, "font-heading", "light", fonts.heading.family);
  if (fonts.body) out = setTokenLiteral(out, "font-body", "light", fonts.body.family);
  return out;
}

type UrlFont = { family: string; generic?: GenericFamily; heading: number; body: number; count: number };

/** OQ-11: headings = the family most used on h1–h3, else the most used;
 *  body = the family on body/html, else the most used. */
function pickFonts(fonts: readonly UrlFont[]): FontChoice {
  if (fonts.length === 0) return {};
  const top = (key: "heading" | "body") =>
    [...fonts].sort((a, b) => b[key] - a[key] || b.count - a.count)[0];
  const most = [...fonts].sort((a, b) => b.count - a.count)[0];
  const heading = top("heading").heading > 0 ? top("heading") : most;
  const body = top("body").body > 0 ? top("body") : most;
  return { heading: mapFontFamily(heading.family, heading.generic), body: mapFontFamily(body.family, body.generic) };
}

// ─── States ───────────────────────────────────────────────────────────────────

type Notice = { tone: "warning" | "error" | "success" | "accent"; text: string };
type State =
  | { kind: "source"; notice?: Notice; retry?: string; refused?: boolean; pickColour?: boolean }
  | { kind: "loading"; from: string }
  | { kind: "preview"; roles: BrandRoles; fonts: FontChoice; failed?: boolean }
  | { kind: "confirmed"; roles: BrandRoles; fonts: FontChoice };

const NOTICE_BG: Record<Notice["tone"], string> = {
  warning: "tw:bg-[var(--bk-warning-tint)]",
  error: "tw:bg-[var(--bk-error-tint)]",
  success: "tw:bg-[var(--bk-success-tint)]",
  accent: "tw:bg-[var(--bk-accent-tint)]",
};

const NoticeStrip: React.FC<Notice & { testId?: string }> = ({ tone, text, testId }) => (
  <div
    role={tone === "error" || tone === "warning" ? "alert" : "status"}
    data-testid={testId}
    className={`${NOTICE_BG[tone]} tw:w-full tw:p-3 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink)]`}
  >
    {text}
  </div>
);

const TITLE = "tw:m-0 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-[30px] tw:tracking-[-0.24px] tw:text-[var(--bk-ink)]";
const SMALL = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px]";
const FIELD_LABEL = "tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";

const COPY = {
  noColours: "We couldn't find brand colours in this logo",
  restoreFailed: "We couldn't save a restore point — nothing was changed.",
  unsupported: "Use a PNG, JPG or SVG logo",
  tooBig: "That logo is too big — use one under 5 MB (SVG under 1 MB)",
  refused: "This address can't be used",
  timeout: "That site took too long to answer",
};

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));
const isTooManyRequests = (e: unknown) =>
  typeof e === "object" && e !== null && "data" in e &&
  (e as { data?: { code?: string } }).data?.code === "TOO_MANY_REQUESTS";

export interface BrandFromSourceProps {
  composer: Composer | null;
}

export const BrandFromSource: React.FC<BrandFromSourceProps> = ({ composer }) => {
  const { addToast } = useToast();
  const preview = useBrandPreview(composer);
  const guard = useGuardedApply();
  const [state, setState] = React.useState<State>({ kind: "source" });
  const [url, setUrl] = React.useState("");
  const [pick, setPick] = React.useState("#1A56DB");
  const [dragOver, setDragOver] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const urlRef = React.useRef<HTMLInputElement>(null);
  /* A late answer to a cancelled or superseded request is dropped. */
  const request = React.useRef(0);

  const savedTokens = (): DesignToken[] => {
    const s = composer?.getProjectSettings();
    return mergeProjectTokens(s?.designTokens ?? [], s?.designTokensSchemaVersion);
  };

  const showPreview = (roles: BrandRoles, fonts: FontChoice) => {
    preview.show((tokens, settings) => ({
      tokens: brandProposal(tokens, roles, fonts),
      darkMode: settings.darkMode === "auto" ? "auto" : "off",
    }));
    setState({ kind: "preview", roles, fonts });
  };

  const fromColours = (colours: ColorCount[], fonts: FontChoice, source: "logo" | "site") => {
    const roles = pickBrandRoles(colours);
    if (!roles) {
      setState({
        kind: "source",
        notice: { tone: "warning", text: source === "logo" ? COPY.noColours : "We couldn't find brand colours on this site" },
        pickColour: true,
      });
      return;
    }
    showPreview(roles, fonts);
  };

  const readLogo = async (file: File) => {
    const id = ++request.current;
    setState({ kind: "loading", from: file.name });
    try {
      const colours = await decodeLogoColors(file);
      if (id !== request.current) return;
      fromColours(colours, {}, "logo");
    } catch (e) {
      if (id !== request.current) return;
      const code = errorMessage(e);
      setState({ kind: "source", notice: { tone: "error", text: code === "TOO_BIG" ? COPY.tooBig : COPY.unsupported } });
    }
  };

  const readSite = async (address: string) => {
    const siteId = getSiteIdFromUrl();
    if (!siteId) {
      setState({ kind: "source", notice: { tone: "error", text: COPY.refused }, refused: true });
      return;
    }
    const id = ++request.current;
    let host = address;
    try { host = new URL(address).host || address; } catch { /* the server refuses it */ }
    setState({ kind: "loading", from: host });
    try {
      const result = await getBuildrikClient(DASHBOARD_URL).theme.extractBrandFromUrl.mutate({ siteId, url: address });
      if (id !== request.current) return;
      fromColours(normalizeColorCounts(result.colors), pickFonts(result.fonts), "site");
    } catch (e) {
      if (id !== request.current) return;
      if (isTooManyRequests(e)) {
        addToast({ tone: "error", description: errorMessage(e) });
        setState({ kind: "source" });
        return;
      }
      const message = errorMessage(e);
      if (message.startsWith("TIMEOUT:")) {
        setState({ kind: "source", notice: { tone: "warning", text: COPY.timeout }, retry: address });
      } else {
        setState({ kind: "source", notice: { tone: "error", text: COPY.refused }, refused: true });
      }
    }
  };

  const cancel = () => {
    request.current += 1;
    preview.clear();
    setState({ kind: "source" });
  };

  const confirm = (roles: BrandRoles, fonts: FontChoice) =>
    guard.run(async () => {
      const siteId = getSiteIdFromUrl();
      if (!composer || !siteId || !(await takeRestorePoint(composer, siteId, "logo"))) {
        setState({ kind: "preview", roles, fonts, failed: true });
        return false;
      }
      preview.clear();
      if (!composer.designSystem.setTokens(brandProposal(savedTokens(), roles, fonts), "Brand from logo")) {
        addToast({ tone: "error", description: "That brand couldn't be applied — a token it replaces is still in use." });
        setState({ kind: "source" });
        return false;
      }
      setState({ kind: "confirmed", roles, fonts });
      addToast({ description: "Brand applied · Undo ⌘Z" });
      return true;
    });

  // ─── Render ─────────────────────────────────────────────────────────────────

  const source = (s: Extract<State, { kind: "source" }>) => (
    <>
      <div
        data-testid="brand-source-drop"
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void readLogo(f);
        }}
        className={`tw:flex tw:w-full tw:flex-col tw:items-start tw:gap-3 tw:rounded-[var(--bk-radius-md)] tw:border tw:p-6 ${
          dragOver ? "tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)]" : "tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)]"
        }`}
      >
        <p className="tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)]">
          Drop your logo here
        </p>
        <p className={`${SMALL} tw:text-[var(--bk-ink-muted)]`}>PNG, JPG or SVG</p>
        <Button type="button" variant="secondary" size="xs" onClick={() => fileRef.current?.click()}>
          Choose file
        </Button>
        <TextInput
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="tw:hidden"
          aria-label="Upload a logo"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void readLogo(f);
            e.target.value = "";
          }}
        />
      </div>
      <p className={`${SMALL} tw:text-[var(--bk-ink-muted)]`}>Or use a website</p>
      <label className="tw:flex tw:w-full tw:flex-col tw:gap-1">
        <span className={FIELD_LABEL}>Website URL</span>
        <TextInput
          type="url"
          sizing="sm"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          ref={urlRef}
          onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) void readSite(url.trim()); }}
          aria-label="Website URL"
          data-testid="brand-source-url"
        />
      </label>
      <Button type="button" size="xs" onClick={() => (url.trim() ? void readSite(url.trim()) : urlRef.current?.focus())}>
        Extract brand
      </Button>
      {s.notice && <NoticeStrip {...s.notice} testId="brand-source-notice" />}
      {s.retry && (
        <Button type="button" variant="secondary" size="xs" onClick={() => void readSite(s.retry!)}>
          Try again
        </Button>
      )}
      {s.refused && (
        <p className={`${SMALL} tw:text-[var(--bk-ink-soft)]`}>Enter a public website address starting with https:// or http://.</p>
      )}
      {s.pickColour && (
        <>
          <label className="tw:flex tw:w-full tw:flex-col tw:gap-1">
            <span className={FIELD_LABEL}>Pick your brand colour</span>
            <TextInput sizing="sm" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Pick your brand colour" />
          </label>
          <Button
            type="button"
            size="xs"
            disabled={!generateColorScale(pick)}
            onClick={() => {
              const scale = generateColorScale(pick);
              if (scale) showPreview({ primary: pick.trim().toUpperCase() }, {});
            }}
          >
            Use this colour
          </Button>
        </>
      )}
    </>
  );

  const summary = (roles: BrandRoles, fonts: FontChoice) => {
    const tokens = brandProposal(savedTokens(), roles, fonts);
    const hex = (id: string) => (resolveTokenLiteral(tokens, id, "light") ?? "").toUpperCase();
    const chips = [
      { label: "Primary", value: roles.primary.toUpperCase() },
      ...(roles.accent ? [{ label: "Accent", value: roles.accent.toUpperCase() }] : []),
      { label: "Text", value: hex("color-text") },
      { label: "Surface", value: hex("color-surface") },
    ].filter((c) => c.value);
    const replaced = [fonts.heading, fonts.body].filter(
      (f, i, all): f is { family: string; replaced: string } =>
        Boolean(f?.replaced) && all.findIndex((g) => g?.replaced === f?.replaced) === i,
    );
    return (
      <>
        <h3 className={TITLE}>Preview extracted brand</h3>
        <p className={`${SMALL} tw:text-[var(--bk-ink-soft)]`}>Review colours and fonts before applying them.</p>
        <div className="tw:flex tw:items-center tw:gap-2" aria-hidden="true">
          {chips.map((c) => (
            <span
              key={c.label}
              className="tw:size-14 tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)]"
              /* The swatch IS the extracted value — data, not a chrome colour. */
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
        <p className={`${SMALL} tw:whitespace-pre-wrap tw:text-[var(--bk-ink)]`} data-testid="brand-source-chips">
          {chips.map((c) => `${c.label} · ${c.value}`).join("   ")}
        </p>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">Fonts</p>
        <p className={`${SMALL} tw:text-[var(--bk-ink)]`}>
          {`Headings: ${resolveTokenLiteral(tokens, "font-heading", "light") ?? ""} · Body: ${resolveTokenLiteral(tokens, "font-body", "light") ?? ""}`}
        </p>
        {replaced.map((f) => (
          <React.Fragment key={f.replaced}>
            <NoticeStrip tone="accent" text={`Replaced ${f.replaced} with ${f.family}`} />
            <p className={`${SMALL} tw:text-[var(--bk-ink-soft)]`}>
              {`${f.replaced} is unavailable. ${f.family} is the closest available family.`}
            </p>
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <section
      aria-label="Start with your brand"
      data-testid="brand-from-source"
      data-state={state.kind}
      className="tw:flex tw:w-full tw:max-w-[620px] tw:flex-col tw:items-start tw:gap-3 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:p-4"
    >
      <h2 className={TITLE}>Start with your brand</h2>
      {state.kind === "source" && source(state)}
      {state.kind === "loading" && (
        <>
          <h3 className={TITLE}>Finding your brand…</h3>
          <p className={`${SMALL} tw:text-[var(--bk-ink-soft)]`}>{`Extracting colours and fonts from ${state.from}.`}</p>
          <div className="tw:h-1 tw:w-full tw:overflow-hidden tw:bg-[var(--bk-bg-subtle)]" role="progressbar" aria-label="Finding your brand">
            <div className="tw:h-1 tw:w-[42%] tw:bg-[var(--bk-accent)]" />
          </div>
          <Button type="button" variant="secondary" size="xs" onClick={cancel}>
            Cancel
          </Button>
        </>
      )}
      {state.kind === "preview" && (
        <>
          {summary(state.roles, state.fonts)}
          {state.failed && <NoticeStrip tone="error" text={COPY.restoreFailed} testId="brand-source-notice" />}
          <p className={`${SMALL} tw:text-[var(--bk-ink-muted)]`}>Confirm creates a restore point. Undo the whole change with one ⌘Z.</p>
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button type="button" variant="secondary" size="xs" onClick={cancel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="xs"
              disabled={guard.busy}
              onClick={() => void confirm(state.roles, state.fonts)}
            >
              Confirm
            </Button>
          </div>
        </>
      )}
      {state.kind === "confirmed" && (
        <>
          {summary(state.roles, state.fonts)}
          <NoticeStrip tone="success" text="Your new brand is applied." testId="brand-source-notice" />
        </>
      )}
    </section>
  );
};
