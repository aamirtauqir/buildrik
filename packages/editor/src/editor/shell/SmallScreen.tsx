/**
 * Small screens (2L9 B7-G32 `227:14836`, B7-G33 `227:15364`).
 *
 * A window under 1024 px wide gets the info banner — it never blocks, and once
 * dismissed it stays away for the session. A phone (a coarse pointer on a
 * screen under 640 px) gets the full-screen "needs a larger screen" notice
 * with one way on: the read-only view (`?view=readonly`), which is what a
 * phone can honestly do with this editor. In that view the notice is not
 * shown again.
 *
 * Both are produced by the global banner slot, which every editor mounts.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Portal } from "@/editor/chrome-ui";
import { getEditorViewMode } from "@/shared/utils/editorViewMode";
import { NARROW_WINDOW_BANNER, clearGlobalBanner, showGlobalBanner, useGlobalBanners } from "./globalBanners";

/** The width the editor is built for (DESIGN: desktop-only, 1024 minimum). */
const MIN_EDITOR_WIDTH = 1024;
const PHONE_MAX_WIDTH = 640;

let narrowDismissed = false;

/** Raise the narrow-window banner while the window is under 1024 px. */
export function useNarrowWindowBanner(): void {
  const banners = useGlobalBanners();
  const shown = banners.some((b) => b.id === NARROW_WINDOW_BANNER.id);
  const shownRef = React.useRef(false);
  /* A ✕ removes it from the store: remember that, so a resize does not
     bring it back this session. */
  React.useEffect(() => {
    if (shownRef.current && !shown) narrowDismissed = true;
    shownRef.current = shown;
  }, [shown]);
  React.useEffect(() => {
    const sync = () => {
      if (window.innerWidth < MIN_EDITOR_WIDTH && !narrowDismissed) showGlobalBanner(NARROW_WINDOW_BANNER);
      else clearGlobalBanner(NARROW_WINDOW_BANNER.id);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      clearGlobalBanner(NARROW_WINDOW_BANNER.id);
    };
  }, []);
}

function isPhone(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
  return coarse && window.innerWidth < PHONE_MAX_WIDTH;
}

/** B7-G33: the full-screen notice on a phone, outside the read-only view. */
export const PhoneScreen: React.FC = () => {
  const [phone] = React.useState(isPhone);
  if (!phone || getEditorViewMode().readOnlyView) return null;
  const openReadOnly = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "readonly");
    window.location.assign(url.toString());
  };
  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-screen-title"
        data-testid="phone-screen"
        className="tw:fixed tw:inset-0 tw:z-[80] tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:bg-[var(--bk-bg-panel)] tw:px-6 tw:text-center tw:[font-family:var(--bk-font-ui)]"
      >
        <h2 id="phone-screen-title" className="tw:m-0 tw:text-[16px] tw:font-semibold tw:leading-6 tw:text-[var(--bk-ink)]">
          Buildrick needs a larger screen
        </h2>
        <p className="tw:m-0 tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
          Editing works on a computer. You can look at this site read-only here.
        </p>
        <Button size="sm" onClick={openReadOnly}>
          Open read-only anyway
        </Button>
      </div>
    </Portal>
  );
};
