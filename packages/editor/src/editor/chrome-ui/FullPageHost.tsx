/**
 * FullPageHost — the one host for the edge-to-edge tools (Templates, Asset
 * library, Settings, Brand), with design decision 14's focus contract
 * (BK-65, DR-T7):
 *
 *   - entry: focus lands on the tool's heading (`[data-bk-fullpage-heading]`,
 *     else its first h1/h2) — unless the tool already focused something;
 *   - while open: the editor behind it (rail, drawer, sidebar, canvas,
 *     inspector, footer) is `inert`, and Tab cycles inside the host. The
 *     topbar — the save pill — and the overlay root (toasts) stay live;
 *   - exit: focus returns to what opened it, else the rail's active item.
 *
 * Escape stays the tool's own: each closes its innermost surface first and
 * then itself (their dialogs and guards live inside them).
 *
 * `data-bk-surface="fullpage"` is what the command registry and the history
 * keys read to know a tool covers the canvas (BK-05, D36).
 *
 * A Portal, not an OverlayMount: these tools draw their own chrome and own
 * their Escape and dialogs; a scrim would close them on a stray click.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Portal } from "./Portal";

/** The editor regions a full-page tool covers. The topbar is not one. */
const BEHIND =
  ".layout-shell__rail, .layout-shell__drawer, .layout-shell__sidebar, " +
  ".layout-shell__canvas, .layout-shell__inspector, .layout-shell__footer";

/* The rail's open tool (RailItem's aria-current), wherever the shell puts the
   rail — its own column or inside the sidebar. */
const RAIL = ".layout-shell__rail, .layout-shell__sidebar nav";
const RAIL_ACTIVE = RAIL.split(", ")
  .map((r) => `${r} [aria-current]:not([aria-current="false"]), ${r} [aria-pressed="true"]`)
  .join(", ");
const RAIL_FIRST = RAIL.split(", ")
  .map((r) => `${r} button`)
  .join(", ");

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const COVER = "tw:fixed tw:inset-0 tw:z-[var(--bk-z-overlay)] tw:bg-[var(--bk-bg-panel)]";

export interface FullPageHostProps {
  children: React.ReactNode;
  "data-testid": string;
  /** Replaces the default full-screen cover (the Asset library styles its own). */
  className?: string;
  /** D36: Brand keeps ⌘Z for its own token edits only. */
  history?: "tokens";
}

export function FullPageHost({ children, className = COVER, history, ...rest }: FullPageHostProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const behind = [...document.querySelectorAll<HTMLElement>(BEHIND)].filter((el) => !el.hasAttribute("inert"));
    behind.forEach((el) => el.setAttribute("inert", ""));

    const raf = requestAnimationFrame(() => {
      const host = hostRef.current;
      if (!host || host.contains(document.activeElement)) return;
      const heading = host.querySelector<HTMLElement>("[data-bk-fullpage-heading], h1, h2") ?? host;
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(raf);
      behind.forEach((el) => el.removeAttribute("inert"));
      const back =
        opener && opener !== document.body && document.contains(opener) && !opener.closest("[inert]")
          ? opener
          : document.querySelector<HTMLElement>(RAIL_ACTIVE) ?? document.querySelector<HTMLElement>(RAIL_FIRST);
      back?.focus({ preventScroll: true });
    };
  }, []);

  /* Tab never leaves the tool: the topbar under it is covered, not gone. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !hostRef.current) return;
    const items = [...hostRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => !el.closest('[inert], [hidden], [aria-hidden="true"]'),
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !hostRef.current.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <Portal>
      <div
        ref={hostRef}
        className={className}
        data-bk-surface="fullpage"
        data-bk-history={history}
        onKeyDown={onKeyDown}
        {...rest}
      >
        {children}
      </div>
    </Portal>
  );
}
