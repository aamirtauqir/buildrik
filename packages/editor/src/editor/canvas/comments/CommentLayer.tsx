/**
 * CommentLayer — canvas comment mode (Figma shell state 6, board 200:2) +
 * orphan-comment recovery (boards 184:56/70/87).
 *
 * Self-contained: mounts inside the canvas content root (same coordinate space
 * as the page, so pins inherit the zoom transform) and talks to the rest of
 * the shell only through composer events:
 *   "ui:comment-mode"          {on?}  COMMAND in: toggle ({}) or set ({on})
 *   "ui:comment-mode-changed"  {on}   STATE out: layer → topbar pressed state.
 *                                     Fires on every mode change AND from the
 *                                     unmount cleanup while mode is on — a
 *                                     page/project switch mid-mode must
 *                                     un-press the bar toggle.
 *   "comments:refresh"                anyone → refetch pins
 *   "comments:orphans"         {ids}  layer → ReviewTab Detached group
 *   "comments:reattach-start"  {id}   ReviewTab → layer pick-to-reattach
 *   "comments:reattached"      {id}   layer → ReviewTab refresh
 *
 * Inert without a site id (standalone demo) — fetch returns [] and the
 * Topbar toggle simply shows an empty comment mode.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ModalContent, ModalFooter, ModalRoot, ModalTitle, Textarea } from "@/editor/ui";
import { useToast } from "@/editor/ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { Z_LAYERS } from "@/shared/constants/canvas";
import {
  createPinnedComment,
  fetchReviewComments,
  reattachReviewComment,
  currentSiteId,
  type ReviewComment,
} from "@/services/ReviewService";
import {
  anchorSelector,
  detectOrphans,
  pinPosition,
  pointToFractions,
} from "./commentAnchors";

interface CommentLayerProps {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

interface Draft {
  x: number;
  y: number;
  left: number;
  top: number;
  elementId: string | null;
}

const PIN_SIZE = 24;

function PinDot({
  left,
  top,
  label,
  title,
  ghost,
  onClick,
}: {
  left: number;
  top: number;
  label: string;
  title?: string;
  ghost?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      title={title}
      aria-label={title ?? `Comment ${label}`}
      style={{
        position: "absolute",
        left: left - PIN_SIZE / 2,
        top: top - PIN_SIZE / 2,
        width: PIN_SIZE,
        height: PIN_SIZE,
        borderRadius: "var(--bk-radius-full) var(--bk-radius-full) var(--bk-radius-full) var(--bk-radius-sm)",
        background: ghost ? "var(--bk-accent-tint)" : "var(--bk-accent)",
        color: ghost ? "var(--bk-accent)" : "var(--bk-bg-card)",
        border: "2px solid var(--bk-bg-card)",
        boxShadow: "var(--bk-shadow-drag)",
        fontSize: 11,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        zIndex: Z_LAYERS.badge,
        fontFamily: "inherit",
      }}
    >
      {label}
    </Button>
  );
}

export const CommentLayer: React.FC<CommentLayerProps> = ({ composer, canvasRef }) => {
  const { addToast } = useToast();
  const [modeOn, setModeOn] = React.useState(false);
  const [comments, setComments] = React.useState<ReviewComment[]>([]);
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [draftBody, setDraftBody] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [reattachingId, setReattachingId] = React.useState<string | null>(null);
  const [orphanModal, setOrphanModal] = React.useState<ReviewComment[] | null>(null);
  // Re-measure trigger for pin positions (page switch, element edits, resize).
  const [tick, setTick] = React.useState(0);
  const announcedOrphans = React.useRef<Set<string>>(new Set());
  const lastOrphanIds = React.useRef<string[]>([]);
  const layerRef = React.useRef<HTMLDivElement | null>(null);

  const activePageId = composer?.elements.getActivePage()?.id ?? null;
  const hasSite = currentSiteId() != null;

  const refresh = React.useCallback(() => {
    if (!hasSite) return;
    fetchReviewComments("OPEN")
      .then(setComments)
      .catch(() => {
        // Pins are an overlay, not a data surface — a failed fetch keeps the
        // previous pins; the Review panel owns the error+retry treatment.
      });
  }, [hasSite]);

  // ── Event wiring ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!composer) return;
    const onMode = (p: { on?: boolean }) => {
      setModeOn((v) => (typeof p?.on === "boolean" ? p.on : !v));
      setDraft(null);
      setDraftBody("");
    };
    const onRefresh = () => refresh();
    // Late subscribers (the Review panel mounts lazily) ask for a replay.
    const onOrphansRequest = () => {
      composer.emit("comments:orphans", { ids: lastOrphanIds.current });
    };
    const onReattachStart = (p: { id?: string }) => {
      if (p?.id) {
        setReattachingId(p.id);
        setModeOn(false);
        setDraft(null);
      }
    };
    const bump = () => setTick((t) => t + 1);
    composer.on("ui:comment-mode", onMode);
    composer.on("comments:refresh", onRefresh);
    composer.on("comments:orphans-request", onOrphansRequest);
    composer.on("comments:reattach-start", onReattachStart);
    composer.on(EVENTS.PAGE_CHANGED, bump);
    composer.on(EVENTS.PROJECT_CHANGED, bump);
    composer.on(EVENTS.ELEMENT_DELETED, bump);
    return () => {
      composer.off("ui:comment-mode", onMode);
      composer.off("comments:refresh", onRefresh);
      composer.off("comments:orphans-request", onOrphansRequest);
    composer.off("comments:reattach-start", onReattachStart);
      composer.off(EVENTS.PAGE_CHANGED, bump);
      composer.off(EVENTS.PROJECT_CHANGED, bump);
      composer.off(EVENTS.ELEMENT_DELETED, bump);
    };
  }, [composer, refresh]);

  React.useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("resize", bump);
    return () => window.removeEventListener("resize", bump);
  }, []);

  // ── State broadcast (ui:comment-mode-changed) ──────────────────────────────
  // The command event above can't tell subscribers the CURRENT state (its
  // payload is toggle-or-set), so the layer — the state owner — broadcasts
  // every change. The unmount emit is ref-guarded to fire only while mode is
  // on: without it, a page switch mid-mode leaves the topbar toggle pressed.
  const modeOnRef = React.useRef(false);
  React.useEffect(() => {
    modeOnRef.current = modeOn;
    composer?.emit("ui:comment-mode-changed", { on: modeOn });
  }, [composer, modeOn]);
  React.useEffect(() => {
    if (!composer) return;
    return () => {
      if (modeOnRef.current) composer.emit("ui:comment-mode-changed", { on: false });
    };
  }, [composer]);

  // Initial + mode-entry fetch.
  React.useEffect(() => {
    if (modeOn || reattachingId) refresh();
  }, [modeOn, reattachingId, refresh]);
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Escape exits draft → mode → reattach ───────────────────────────────────
  React.useEffect(() => {
    if (!modeOn && !reattachingId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (draft) {
        setDraft(null);
        setDraftBody("");
      } else if (reattachingId) {
        setReattachingId(null);
      } else {
        composer?.emit("ui:comment-mode", { on: false });
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [modeOn, reattachingId, draft, composer]);

  // ── Orphan detection (active page only — others aren't in the DOM) ─────────
  // Runs a beat AFTER the trigger: engine events (ELEMENT_DELETED etc.) fire
  // before the canvas DOM re-syncs, so an immediate scan still sees the dead
  // element. 150ms lets the render settle without being user-noticeable.
  React.useEffect(() => {
    const root = canvasRef.current;
    if (!root || !composer || comments.length === 0) return;
    const timer = window.setTimeout(() => {
      const ids = detectOrphans(comments, root, activePageId);
      lastOrphanIds.current = ids;
      composer.emit("comments:orphans", { ids });
      const fresh = ids.filter((id) => !announcedOrphans.current.has(id));
      if (fresh.length > 0) {
        fresh.forEach((id) => announcedOrphans.current.add(id));
        setOrphanModal(comments.filter((c) => fresh.includes(c.id)));
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [comments, activePageId, composer, canvasRef, tick]);

  // ── Click-to-pin (create) and click-to-reattach ────────────────────────────
  const hitTest = (e: React.MouseEvent): { el: HTMLElement | null; left: number; top: number } => {
    const layer = layerRef.current;
    const root = canvasRef.current;
    if (!layer || !root) return { el: null, left: 0, top: 0 };
    layer.style.pointerEvents = "none";
    // Pierce the overlay stack (grid/hover/selection overlays sit above the
    // page): scan ALL elements under the point for the first one inside an
    // engine element. jsdom has neither API — treat as empty-canvas there.
    let el: HTMLElement | null = null;
    if (typeof document.elementsFromPoint === "function") {
      for (const under of document.elementsFromPoint(e.clientX, e.clientY)) {
        const hit = under instanceof HTMLElement ? under.closest<HTMLElement>("[data-buildrick-id]") : null;
        if (hit) {
          el = hit;
          break;
        }
      }
    } else if (typeof document.elementFromPoint === "function") {
      const under = document.elementFromPoint(e.clientX, e.clientY);
      el = under instanceof HTMLElement ? under.closest<HTMLElement>("[data-buildrick-id]") : null;
    }
    layer.style.pointerEvents = "auto";
    const rootRect = root.getBoundingClientRect();
    // Content-space coords: divide by the rendered scale so pins (which live
    // inside the transformed content) line up with the click point.
    const scaleX = rootRect.width / (root.offsetWidth || 1);
    const scaleY = rootRect.height / (root.offsetHeight || 1);
    return {
      el,
      left: (e.clientX - rootRect.left) / (scaleX || 1),
      top: (e.clientY - rootRect.top) / (scaleY || 1),
    };
  };

  const handleCaptureClick = async (e: React.MouseEvent) => {
    const root = canvasRef.current;
    if (!root) return;
    const { el, left, top } = hitTest(e);
    const { x, y } = pointToFractions(e.clientX, e.clientY, root);

    if (reattachingId) {
      if (!el) {
        addToast({ tone: "warning", title: "Pick an element", description: "Click a page element to re-pin this comment.", duration: 2500 });
        return;
      }
      const id = reattachingId;
      try {
        await reattachReviewComment(id, {
          targetSelector: anchorSelector(el.getAttribute("data-buildrick-id") ?? ""),
          pageId: activePageId,
          x,
          y,
        });
        setReattachingId(null);
        addToast({ tone: "success", title: "Comment re-pinned", description: "The pin now follows the new element.", duration: 2000 });
        composer?.emit("comments:reattached", { id });
        refresh();
      } catch {
        addToast({ tone: "error", title: "Couldn't re-pin", description: "Try again.", duration: 3000 });
      }
      return;
    }

    setDraft({ x, y, left, top, elementId: el?.getAttribute("data-buildrick-id") ?? null });
    setDraftBody("");
  };

  const handlePost = async () => {
    if (!draft || !draftBody.trim()) return;
    setPosting(true);
    try {
      await createPinnedComment({
        body: draftBody.trim(),
        pageId: activePageId,
        x: draft.x,
        y: draft.y,
        targetSelector: draft.elementId ? anchorSelector(draft.elementId) : null,
      });
      setDraft(null);
      setDraftBody("");
      addToast({ tone: "success", title: "Comment pinned", description: "Visible to your team in the Review panel.", duration: 2000 });
      refresh();
    } catch {
      addToast({ tone: "error", title: "Couldn't post comment", description: "Check your connection and try again.", duration: 3500 });
    } finally {
      setPosting(false);
    }
  };

  // ── Pin layout ─────────────────────────────────────────────────────────────
  const pins = React.useMemo(() => {
    void tick;
    const root = canvasRef.current;
    if (!root || (!modeOn && !reattachingId)) return [];
    return comments
      .filter((c) => c.pageId === activePageId && c.status === "OPEN")
      .map((c, i) => ({ comment: c, pos: pinPosition(c, root), label: String(i + 1) }))
      .filter((p): p is typeof p & { pos: { left: number; top: number } } => p.pos !== null);
  }, [comments, activePageId, modeOn, reattachingId, canvasRef, tick]);

  const active = modeOn || reattachingId != null;
  if (!active && !orphanModal) return null;

  return (
    <>
      {active && (
        <div
          ref={layerRef}
          data-testid="comment-capture-layer"
          onClick={handleCaptureClick}
          style={{
            position: "absolute",
            inset: 0,
            cursor: "crosshair",
            zIndex: Z_LAYERS.badge - 1,
          }}
        />
      )}

      {reattachingId && (
        <div
          role="status"
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "4px 10px",
            background: "var(--bk-accent)",
            color: "var(--bk-bg-card)",
            borderRadius: "var(--bk-radius-full)",
            fontSize: 12,
            fontWeight: 600,
            zIndex: Z_LAYERS.floatingPanel,
            whiteSpace: "nowrap",
          }}
        >
          Click an element to re-pin the comment · Esc cancels
        </div>
      )}

      {pins.map((p) => (
        <PinDot
          key={p.comment.id}
          left={p.pos.left}
          top={p.pos.top}
          label={p.label}
          title={`${p.comment.authorName ?? (p.comment.authorKind === "client" ? "Client" : "Team")}: ${p.comment.body.slice(0, 80)}`}
          onClick={() => composer?.emit("ui:switch-tab", { tab: "review" })}
        />
      ))}

      {draft && (
        <>
          <PinDot left={draft.left} top={draft.top} label="+" ghost />
          <div
            role="dialog"
            aria-label="New comment"
            style={{
              position: "absolute",
              left: draft.left + 16,
              top: draft.top + 8,
              width: 236,
              background: "var(--bk-bg-card)",
              border: "1px solid var(--bk-border)",
              borderRadius: "var(--bk-radius-lg)",
              boxShadow: "var(--bk-shadow-drag)",
              padding: 10,
              zIndex: Z_LAYERS.floatingPanel,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Textarea
              autoFocus
              rows={3}
              maxLength={2000}
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              placeholder="Leave a comment…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handlePost();
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8 }}>
              <Button
                kind="ghost"
                size="sm"
                onClick={() => {
                  setDraft(null);
                  setDraftBody("");
                }}
              >
                Cancel
              </Button>
              <Button kind="primary" size="sm" disabled={!draftBody.trim() || posting} onClick={() => void handlePost()}>
                {posting ? "Posting…" : "Post"}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Orphan-comment modal (board 184:56) */}
      <ModalRoot open={orphanModal != null} onOpenChange={(o) => !o && setOrphanModal(null)}>
        <ModalContent size="lg" srTitle="Comments lost their element">
          <ModalTitle>
            {orphanModal?.length === 1
              ? "A comment lost its element"
              : `${orphanModal?.length ?? 0} comments lost their element`}
          </ModalTitle>
          <p style={{ fontSize: 13, color: "var(--bk-ink-muted)", margin: "8px 0 12px" }}>
            The elements these were pinned to were deleted. The comments are kept — never
            auto-deleted — and moved to the Detached group at the top of the Review panel.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(orphanModal ?? []).map((c) => (
              <div
                key={c.id}
                style={{
                  background: "var(--bk-warning-tint)",
                  border: "1px solid var(--bk-warning-text)",
                  borderRadius: "var(--bk-radius-sm)",
                  padding: "8px 10px",
                  fontSize: 12,
                }}
              >
                <div style={{ color: "var(--bk-ink)" }}>&ldquo;{c.body.slice(0, 120)}&rdquo;</div>
                <div style={{ color: "var(--bk-warning-text)", marginTop: 2 }}>was pinned to a deleted element</div>
              </div>
            ))}
          </div>
          <ModalFooter>
            <Button
              kind="primary"
              size="sm"
              onClick={() => {
                setOrphanModal(null);
                composer?.emit("ui:switch-tab", { tab: "review" });
              }}
            >
              Open Review panel
            </Button>
          </ModalFooter>
        </ModalContent>
      </ModalRoot>
    </>
  );
};

export default CommentLayer;
