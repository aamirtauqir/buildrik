/**
 * GlobalBannerSlot — the one banner slot under the topbar (2L9 B7-G31
 * `227:14297`; slot geometry B7-G02 `225:2821`: full width, 40 px, pushes the
 * workspace down).
 *
 * One condition is the bar: the site's load failure when there is one (it
 * carries its own retry state, so it arrives as `lead`), otherwise the most
 * serious condition in `globalBanners`. Every other condition waits behind
 * "{n} more ⌄", a popover that lists each with its actions — nothing is
 * dropped, and nothing stacks three bars deep over the canvas.
 *
 * Offline, a narrow window and a phone are the conditions the slot produces
 * itself: only the browser can say them (`SmallScreen.tsx` for the last two).
 *
 * Bar look is board 297:2139 (`state-banner`), shared with the load-failed bar:
 * 14 medium on the tone's tint, 20/12 insets, radius 8, plain bordered actions.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { AlertTriangle, ChevronDown, Info, X } from "lucide-react";
import { Button, IconButton, Popover } from "@/editor/chrome-ui";
import {
  OFFLINE_BANNER,
  clearGlobalBanner,
  showGlobalBanner,
  useGlobalBanners,
  type BannerTone,
  type GlobalBanner,
} from "./globalBanners";
import { PhoneScreen, useNarrowWindowBanner } from "./SmallScreen";
import { useWorkspaceDeletionBanner } from "./useWorkspaceDeletionBanner";

/* 2L9 B7-G02 225:2821 / G04 225:3888: a full-bleed 40 px bar under the
   topbar — glyph at 13, the line at 40 in 13/20, the actions 32 tall at the
   right, 24 in from the edge. (It was a rounded 20/12 card, board 297:2139.) */
export const BANNER_BAR =
  "tw:flex tw:h-10 tw:w-full tw:flex-none tw:items-center tw:gap-3 tw:pl-[13px] tw:pr-6 " +
  "tw:text-[13px] tw:leading-5 tw:font-normal tw:[font-family:var(--bk-font-ui)]";
export const BANNER_TONE: Record<BannerTone, string> = {
  error: "tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]",
  warning: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
  info: "tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)]",
};
/** The bar's actions: 32 tall, 13 medium on radius 6 — the accent fill, 24
 *  inset, for the bar's one primary (G02 Retry 79 wide, G04 Sign in 103);
 *  white with a hairline, 16 inset, for the rest (Download local copy 164). */
const ACTION_BASE = "tw:h-8 tw:min-h-0 tw:shrink-0 tw:py-0 tw:rounded-md tw:text-[13px] tw:leading-5 tw:font-medium";
export const BANNER_ACTION = `${ACTION_BASE} tw:px-6`;
export const BANNER_ACTION_SECONDARY = `${ACTION_BASE} tw:px-4 tw:border tw:border-[var(--bk-border)] tw:bg-white tw:text-[var(--bk-ink)]`;

/** Every bar opens with its tone's glyph — ✕ error, ⚠ warning, ⓘ info.
 *  Decorative: the role and the text already say it. */
export function ToneGlyph({ tone }: { tone: BannerTone }) {
  const Glyph = tone === "warning" ? AlertTriangle : tone === "info" ? Info : X;
  return <Glyph size={14} aria-hidden="true" className="tw:shrink-0" />;
}

function BannerActions({ banner }: { banner: GlobalBanner }) {
  return (
    <>
      {banner.actions?.map((action) => (
        <Button
          key={action.label}
          color={action.primary ? undefined : "light"}
          size="xs"
          onClick={action.onClick}
          className={action.primary ? BANNER_ACTION : BANNER_ACTION_SECONDARY}
          data-testid={action.testId}
        >
          {action.label}
        </Button>
      ))}
      {banner.dismissible ? (
        <IconButton label="Dismiss" size="sm" onClick={() => clearGlobalBanner(banner.id)} className="tw:text-current">
          <X size={14} aria-hidden="true" />
        </IconButton>
      ) : null}
    </>
  );
}

function BannerBar({ banner, more }: { banner: GlobalBanner; more: React.ReactNode }) {
  return (
    <div
      className={`${BANNER_BAR} ${BANNER_TONE[banner.tone]}`}
      role={banner.tone === "error" ? "alert" : "status"}
      data-testid="global-banner"
      data-banner-id={banner.id}
    >
      <ToneGlyph tone={banner.tone} />
      <span className="tw:min-w-0 tw:flex-1 tw:truncate" title={banner.message}>
        {banner.message}
      </span>
      <div className="tw:flex tw:flex-none tw:items-center tw:gap-2.5">
        <BannerActions banner={banner} />
        {more}
      </div>
    </div>
  );
}

/** "{n} more ⌄" and the conditions behind it (board's "More conditions", 520 wide). */
function MoreConditions({ rest }: { rest: readonly GlobalBanner[] }) {
  const [open, setOpen] = React.useState(false);
  if (rest.length === 0) return null;
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      portal
      label="More conditions"
      className="tw:w-[520px] tw:max-w-[calc(100vw-16px)] tw:p-1"
      trigger={
        <Button
          color="light"
          size="xs"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`${BANNER_ACTION} tw:px-2! tw:border-transparent tw:bg-transparent tw:text-current`}
          data-testid="global-banner-more"
        >
          {rest.length} more
          <ChevronDown size={14} aria-hidden="true" className="tw:ml-1" />
        </Button>
      }
    >
      <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-1 tw:p-0" data-testid="global-banner-more-list">
        {rest.map((banner) => (
          <li
            key={banner.id}
            className={`tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:rounded-md tw:px-3 tw:py-2 ${BANNER_TONE[banner.tone]}`}
            data-banner-id={banner.id}
          >
            <ToneGlyph tone={banner.tone} />
            <span className="tw:grow tw:basis-60 tw:text-[13px]">{banner.message}</span>
            <BannerActions banner={banner} />
          </li>
        ))}
      </ul>
    </Popover>
  );
}

/** Raise the offline condition while the browser says it is offline. */
function useOfflineBanner(): void {
  React.useEffect(() => {
    const sync = () => {
      if (navigator.onLine) clearGlobalBanner(OFFLINE_BANNER.id);
      else showGlobalBanner(OFFLINE_BANNER);
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      clearGlobalBanner(OFFLINE_BANNER.id);
    };
  }, []);
}

export interface GlobalBannerSlotProps {
  /** The site's load-failure bar, which owns its retry state. Outranks every
   *  stored condition; a stored condition with the same id is not repeated. */
  lead?: { id: string; render: (more: React.ReactNode) => React.ReactNode } | null;
}

export const GlobalBannerSlot: React.FC<GlobalBannerSlotProps> = ({ lead }) => {
  useOfflineBanner();
  useNarrowWindowBanner();
  useWorkspaceDeletionBanner();
  const banners = useGlobalBanners();
  if (lead) {
    const rest = banners.filter((b) => b.id !== lead.id);
    return (
      <div data-testid="global-banner-slot">
        {lead.render(<MoreConditions rest={rest} />)}
        <PhoneScreen />
      </div>
    );
  }
  if (banners.length === 0) return <PhoneScreen />;
  const [top, ...rest] = banners;
  return (
    <div data-testid="global-banner-slot">
      <BannerBar banner={top} more={<MoreConditions rest={rest} />} />
      <PhoneScreen />
    </div>
  );
};

export default GlobalBannerSlot;
