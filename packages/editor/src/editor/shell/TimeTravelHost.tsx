/**
 * TimeTravelHost — History's time-travel, drawn to the v3 boards
 * 4418:74736 (previewing), 4418:76095 (restore confirm), 4418:76323 (no
 * preview for this point).
 *
 * What replaced what: the old bottom drawer (board 163:113, page 1:3 — the
 * archived V1) was a dark 200px sheet mounted INSIDE the History panel, so a
 * `position: fixed` that the panel's containing block captured left it a 60px
 * column over the panel foot; and its preview was a JPEG of the nearest named
 * version, which almost never existed, so scrubbing changed nothing on the
 * canvas. v3 draws no scrubber at all: a warning band across the top of the
 * CANVAS column says what is previewed, and the canvas shows it.
 *
 * - Global: ⌃⇧T (anywhere) and History ⋯ › Time-Travel emit / land here, and
 *   opening it opens the History panel.
 * - The points are this session's undo stack, oldest → newest; it opens on
 *   the newest (the draft as it is), ←/→ step, Esc exits, Enter asks to
 *   restore.
 * - The preview is the REAL past state: the history entry's reconstructed
 *   project, rendered in a scratch composer (`renderProjectPages`, never the
 *   live one) and laid over the canvas frame. Nothing is written until
 *   Restore.
 * - Restore saves the current draft as a version first (the board's promise),
 *   then `history.restoreEntry`.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { HistoryDisplayEntry } from "@/engine/HistoryManager";
import { Button, Portal } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { renderProjectPages } from "./exportPublishPages";

type Frame = { status: "live" } | { status: "loading" } | { status: "ready"; html: string } | { status: "none" };

const BAND =
  "tw:fixed tw:z-[60] tw:flex tw:h-[34px] tw:items-center tw:gap-2 tw:border-b tw:border-[var(--bk-border)] " +
  "tw:bg-[var(--bk-warning-tint)] tw:px-3 tw:[font-family:var(--bk-font-ui)]";
const BAND_TEXT = "tw:min-w-0 tw:flex-1 tw:truncate tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text)]";
const BAND_BTN = "tw:h-6 tw:min-h-0 tw:px-3 tw:text-[12px] tw:whitespace-nowrap tw:rounded-[var(--bk-radius-sm)]";

const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** The canvas column (below the page tabs) and the page frame inside it. */
function measure() {
  const col = document.querySelector("[data-bk-toast-anchor]")?.getBoundingClientRect() ?? null;
  const frameEl = document.querySelector<HTMLElement>(".buildrick-canvas");
  const frame = frameEl?.getBoundingClientRect() ?? null;
  return {
    col,
    frame,
    /* The frame is drawn at the canvas zoom; the preview renders at the
       frame's own width and scales by the same factor. */
    logicalWidth: frameEl?.offsetWidth ?? 0,
  };
}

export const TimeTravelHost: React.FC<{ composer: Composer | null }> = ({ composer }) => {
  const [active, setActive] = React.useState(false);
  const [entries, setEntries] = React.useState<HistoryDisplayEntry[]>([]);
  const [index, setIndex] = React.useState(0);
  const [frame, setFrame] = React.useState<Frame>({ status: "live" });
  const [confirming, setConfirming] = React.useState(false);
  const [geom, setGeom] = React.useState(measure);

  const open = React.useCallback(() => {
    if (!composer) return;
    const list = [...(composer.history?.getHistoryStack?.() ?? [])].reverse();
    setEntries(list);
    setIndex(Math.max(0, list.length - 1));
    setFrame({ status: "live" });
    setConfirming(false);
    setActive(true);
    composer.emit(EVENTS.UI_PANEL_OPEN, { panel: "history", screen: "session" });
  }, [composer]);
  const exit = React.useCallback(() => {
    setActive(false);
    setConfirming(false);
    setFrame({ status: "live" });
  }, []);

  /* ⌃⇧T is global — it used to live in HistoryTab, so it only worked with the
     panel already open. */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        if (active) exit();
        else open();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, open, exit]);

  React.useEffect(() => {
    if (!composer) return;
    const onToggle = () => (active ? exit() : open());
    composer.on(EVENTS.UI_TIME_TRAVEL_TOGGLE, onToggle);
    return () => {
      composer.off(EVENTS.UI_TIME_TRAVEL_TOGGLE, onToggle);
    };
  }, [composer, active, open, exit]);

  const newest = entries.length - 1;
  const entry = entries[index] ?? null;
  const later = Math.max(0, newest - index);

  /* The preview: the entry's reconstructed project, rendered off-screen. The
     newest point IS the live draft, so it shows the canvas itself. */
  React.useEffect(() => {
    if (!active || !composer || !entry) return;
    if (index === newest) {
      setFrame({ status: "live" });
      return;
    }
    let cancelled = false;
    setFrame({ status: "loading" });
    const snapshot = composer.history?.getEntrySnapshot?.(entry.id) ?? null;
    if (!snapshot) {
      setFrame({ status: "none" });
      return;
    }
    const pageId = composer.elements.getActivePage()?.id;
    void renderProjectPages(snapshot)
      .then((pages) => {
        if (cancelled) return;
        const i = snapshot.pages.findIndex((p) => p.id === pageId);
        const page = pages[i >= 0 ? i : 0];
        setFrame(page ? { status: "ready", html: page.html } : { status: "none" });
      })
      .catch(() => !cancelled && setFrame({ status: "none" }));
    return () => {
      cancelled = true;
    };
  }, [active, composer, entry, index, newest]);

  React.useLayoutEffect(() => {
    if (!active) return;
    const update = () => setGeom(measure());
    update();
    /* The canvas column moves when a drawer opens or closes, and the frame
       moves when the canvas scrolls or zooms — watch the elements themselves,
       not the window. */
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    for (const sel of ["[data-bk-toast-anchor]", ".buildrick-canvas"]) {
      const el = document.querySelector(sel);
      if (el) ro?.observe(el);
    }
    return () => {
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
      ro?.disconnect();
    };
  }, [active, index]);

  const restore = React.useCallback(async () => {
    if (!composer || !entry) return;
    const targetId = entry.id;
    /* Exit Time-Travel the moment a restore is confirmed, before the
       checkpoint/restore work below even runs. The band's own copy
       ("nothing is written until you restore") stops being true the instant
       the user confirms — leaving the host mounted until the async work
       resolved left the stale "Previewing …" band and an enabled Restore…
       sitting over a write that had already landed (reproduced whenever the
       session had 2+ prior entries; the extra render pass between the
       confirm click and the checkpoint/restore promises settling was enough
       for `entries`/`index` to be read again against a stack that had
       already changed shape under it). Exiting first means there is no
       window where a completed write is still described as pending. */
    exit();
    await composer.versions?.autoCheckpoint?.("Before restoring").catch(() => null);
    composer.history?.restoreEntry?.(targetId);
  }, [composer, entry, exit]);

  React.useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (confirming) setConfirming(false);
        else exit();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setConfirming(false);
        setIndex((i) => Math.max(0, Math.min(newest, i + (e.key === "ArrowLeft" ? -1 : 1))));
      } else if (e.key === "Enter" && index < newest) {
        e.preventDefault();
        setConfirming(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, confirming, exit, index, newest]);

  if (!active) return null;
  const { col, frame: fr, logicalWidth } = geom;
  const scale = fr && logicalWidth ? fr.width / logicalWidth : 1;
  const where = entry ? `${time(entry.timestamp)} · ${entry.label}` : "";
  const text =
    entries.length === 0
      ? "Nothing to travel through yet — this session has no changes · Esc exits"
      : index === newest
        ? `Now — the draft as it is · ← steps back through ${newest} change${newest === 1 ? "" : "s"} · Esc exits`
        : frame.status === "none"
          ? `No preview for ${where} — restore would be blind · Esc exits`
          : `Previewing ${where} — nothing is written until you restore · Esc exits`;

  return (
    <Portal>
      <div
        className={BAND}
        style={col ? { left: col.left, top: col.top, width: col.width } : { left: 0, top: 92, right: 0 }}
        role="region"
        aria-label="Time travel"
        aria-live="polite"
        data-testid="tt-band"
        data-index={index}
        data-count={entries.length}
      >
        <span className={BAND_TEXT} data-testid="tt-band-text">
          {text}
        </span>
        <Button color="light" size="xs" className={BAND_BTN} onClick={exit} data-testid="tt-exit">
          Exit
        </Button>
        <Button
          size="xs"
          className={`${BAND_BTN} tw:bg-[var(--bk-ink)] tw:text-white tw:hover:bg-[var(--bk-ink)]`}
          disabled={index >= newest}
          onClick={() => setConfirming(true)}
          data-testid="tt-restore"
        >
          Restore…
        </Button>
      </div>
      {confirming && entry ? (
        /* 4418:76095 draws this at the top of the History panel; it sits
           under the band here so the host stays out of the panel's tree
           (designer note). */
        <div
          className="tw:fixed tw:z-[60] tw:flex tw:w-[340px] tw:flex-col tw:gap-2 tw:rounded-b-[var(--bk-radius-md)] tw:border tw:border-t-0 tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:p-3 tw:[box-shadow:var(--bk-shadow-overlay)]"
          style={col ? { left: col.left + col.width - 340, top: col.top + 34 } : { right: 0, top: 126 }}
          role="alertdialog"
          aria-label={`Restore to ${time(entry.timestamp)}?`}
          data-testid="tt-confirm"
        >
          <span className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-accent)]">Restore to {time(entry.timestamp)}?</span>
          <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
            Your current work is saved as a version first. This discards {later} later change{later === 1 ? "" : "s"} and
            everything you can currently redo.
          </span>
          <span className="tw:flex tw:items-center tw:justify-end tw:gap-2">
            <Button color="light" size="xs" className={BAND_BTN} onClick={() => setConfirming(false)}>
              Keep scrubbing
            </Button>
            <Button color="red" size="xs" className={BAND_BTN} onClick={() => void restore()} data-testid="tt-confirm-restore">
              Restore, discard {later} change{later === 1 ? "" : "s"}
            </Button>
          </span>
        </div>
      ) : null}
      {fr && frame.status !== "live" ? (
        <div
          className="tw:pointer-events-none tw:fixed tw:z-[55] tw:overflow-hidden tw:bg-[var(--bk-bg-card)]"
          style={{ left: fr.left, top: fr.top, width: fr.width, height: fr.height }}
          data-testid="tt-preview"
          data-status={frame.status}
        >
          {frame.status === "ready" ? (
            <iframe
              title="Time-travel preview"
              srcDoc={frame.html}
              sandbox=""
              style={{
                border: 0,
                width: logicalWidth,
                height: fr.height / scale,
                transform: `scale(${scale})`,
                transformOrigin: "0 0",
              }}
            />
          ) : null}
        </div>
      ) : null}
    </Portal>
  );
};
