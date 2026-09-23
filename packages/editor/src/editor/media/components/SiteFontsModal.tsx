/**
 * SiteFontsModal — Clone 3686:42317 "Site fonts", with its two swaps
 * 3695:45594 "Font added" and 3695:45606 "No fonts found" (Assets · Clone
 * Phase 5, section 4184:26629).
 *
 * The model it drives is two-step. A font FILE in the library is UPLOADED;
 * `Add font` makes it ADDED (`MediaAsset.siteFont`), and only then does the
 * Composer register its family with the FontManager and the pickers offer
 * it — "Existing text is unchanged until you choose this font." Until
 * Phase 5 every font asset was registered the moment it landed, so the
 * pickers offered a file nobody had chosen to offer.
 *
 * Mounted ONCE (StudioPanels) and opened by the composer event every door
 * emits — the rail's `Manage font`, the drawer's `Aa Fonts`, the Typography
 * picker's `Manage site fonts` row: `composer.emit("ui:site-fonts",
 * { assetId? })`, the id being the file to scroll to and highlight. Nothing
 * threads through AquibraStudio.
 *
 * One card per font file: `<Family> · <file>` (the family is what the
 * FontManager derives from the file — `libraryFontFamily` — not re-derived
 * here), the sample sentence set in that file, `Add font` (primary) or, once
 * added, `Added` with a secondary `Remove` (the code's undo; the Clone draws
 * none). The sample has to render for a file that is NOT added, whose family
 * the FontManager has never loaded — so the dialog loads its own face per
 * file under a preview-scoped family while it is open and drops them on
 * close. Its own family, not the real one: `registerLibraryFont` deletes
 * every face whose family matches when it re-registers, and would take a
 * shared preview face with it.
 *
 * Search narrows the cards as you type (family or file name). The Clone's
 * no-match state is a separate dialog, reached from the search action
 * (`Action / Search fonts|CLIC|SWA>3695:45606`) — here that is Enter on a
 * query nothing matches, not a debounce: a dialog that yanked the field
 * away mid-word would be worse than the dead end it replaces. `Clear search`
 * returns with the query cleared.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons, 8 gap) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot, TextInput } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { libraryFontFamily } from "@/engine/fonts/FontManager";
import { MEDIA_EVENTS, MEDIA_EXTENSIONS } from "@shared/constants/media";
import type { MediaAsset } from "@shared/types/media";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

const SAMPLE = "The quick brown fox jumps over the lazy dog.";

/** ".woff2, .woff, .ttf or .otf" — the upload gate's own list, not a copy of it. */
const ACCEPTED_FONT_FILES = `${MEDIA_EXTENSIONS.FONT.slice(0, -1).join(", ")} or ${
  MEDIA_EXTENSIONS.FONT[MEDIA_EXTENSIONS.FONT.length - 1]
}`;

/** The family the dialog's own sample face for a file registers under. */
const previewFamily = (assetId: string) => `bk-font-preview-${assetId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

type View = { kind: "list" } | { kind: "added"; family: string } | { kind: "none"; query: string };

const CARD =
  "tw:flex tw:flex-col tw:items-start tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:p-4 " +
  "tw:data-[highlighted=true]:border-[var(--bk-accent)]";
const CARD_NAME = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]";
const CARD_SAMPLE = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";
const CARD_STATE = "tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";

interface SiteFontsModalProps {
  composer: Composer;
}

export function SiteFontsModal({ composer }: SiteFontsModalProps) {
  const [open, setOpen] = React.useState(false);
  const [highlightId, setHighlightId] = React.useState<string | null>(null);
  const [fonts, setFonts] = React.useState<MediaAsset[]>([]);
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<View>({ kind: "list" });
  const highlightRef = React.useRef<HTMLLIElement>(null);

  /* The door. A reopened dialog starts clean — a stale query or a leftover
     result dialog is never what the next door meant. */
  React.useEffect(() => {
    const openFrom = (data: unknown) => {
      setHighlightId((data as { assetId?: string } | undefined)?.assetId ?? null);
      setQuery("");
      setView({ kind: "list" });
      setOpen(true);
    };
    composer.on("ui:site-fonts", openFrom);
    return () => {
      composer.off("ui:site-fonts", openFrom);
    };
  }, [composer]);

  /* The library's font files, followed while open: an upload lands a card,
     Add / Remove flip one, a delete takes one away. */
  React.useEffect(() => {
    if (!open) return;
    const reload = () => setFonts(composer.media.getAssets({ type: "font" }));
    reload();
    composer.media.on(MEDIA_EVENTS.MEDIA_ADDED, reload);
    composer.media.on(MEDIA_EVENTS.MEDIA_UPDATED, reload);
    composer.media.on(MEDIA_EVENTS.MEDIA_DELETED, reload);
    return () => {
      composer.media.off(MEDIA_EVENTS.MEDIA_ADDED, reload);
      composer.media.off(MEDIA_EVENTS.MEDIA_UPDATED, reload);
      composer.media.off(MEDIA_EVENTS.MEDIA_DELETED, reload);
    };
  }, [composer, open]);

  /* One sample face per file while open, dropped on close. Keyed on the
     files' ids and urls rather than the array, so a flag flipping on a card
     does not reload every face. */
  const faceKey = JSON.stringify(fonts.map((f) => [f.id, f.src]));
  React.useEffect(() => {
    if (!open || typeof FontFace === "undefined" || !document.fonts) return;
    const faces = (JSON.parse(faceKey) as [string, string][]).map(([id, src]) => {
      const face = new FontFace(previewFamily(id), `url(${src})`);
      document.fonts.add(face);
      void face.load().catch(() => {});
      return face;
    });
    return () => {
      for (const face of faces) document.fonts.delete(face);
    };
  }, [open, faceKey]);

  React.useEffect(() => {
    if (open && view.kind === "list") highlightRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [open, view.kind, highlightId, faceKey]);

  const close = () => setOpen(false);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? fonts.filter(
        (f) => libraryFontFamily(f.originalName).toLowerCase().includes(q) || f.originalName.toLowerCase().includes(q),
      )
    : fonts;

  const add = async (font: MediaAsset) => {
    await composer.media.updateAsset(font.id, { siteFont: true });
    setView({ kind: "added", family: libraryFontFamily(font.originalName) });
  };

  if (view.kind === "added") {
    return (
      <ModalRoot open={open} onClose={close}>
        <ModalContent size="table" srTitle="Font added" data-testid="site-fonts-added">
          <h2 className={LIBRARY_MODAL_TITLE} data-testid="site-fonts-added-title">
            Font added
          </h2>
          <ModalBody>
            <p className={LIBRARY_MODAL_BODY} data-testid="site-fonts-added-body">
              Uploaded {view.family} is now available in the font pickers. Existing text is unchanged until you
              choose this font.
            </p>
          </ModalBody>
          <div className={LIBRARY_MODAL_FOOT} data-testid="site-fonts-added-foot">
            <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} onClick={close} data-testid="site-fonts-added-done">
              Done
            </Button>
            <Button
              size="xs"
              variant="secondary"
              className={LIBRARY_MODAL_BTN_SECONDARY}
              onClick={() => setView({ kind: "list" })}
              data-testid="site-fonts-added-manage"
            >
              Manage site fonts
            </Button>
          </div>
        </ModalContent>
      </ModalRoot>
    );
  }

  if (view.kind === "none") {
    return (
      <ModalRoot open={open} onClose={close}>
        <ModalContent size="table" srTitle="No fonts found" data-testid="site-fonts-none">
          <h2 className={LIBRARY_MODAL_TITLE} data-testid="site-fonts-none-title">
            No fonts found
          </h2>
          <ModalBody>
            <p className={LIBRARY_MODAL_BODY} data-testid="site-fonts-none-body">
              No fonts match &quot;{view.query}&quot;. Clear the search to browse available fonts.
            </p>
          </ModalBody>
          <div className={LIBRARY_MODAL_FOOT} data-testid="site-fonts-none-foot">
            <Button
              size="xs"
              variant="secondary"
              className={LIBRARY_MODAL_BTN_SECONDARY}
              onClick={close}
              data-testid="site-fonts-none-cancel"
            >
              Cancel
            </Button>
            <Button
              size="xs"
              className={LIBRARY_MODAL_BTN_PRIMARY}
              onClick={() => {
                setQuery("");
                setView({ kind: "list" });
              }}
              data-testid="site-fonts-none-clear"
            >
              Clear search
            </Button>
          </div>
        </ModalContent>
      </ModalRoot>
    );
  }

  return (
    <ModalRoot open={open} onClose={close}>
      <ModalContent size="table" srTitle="Site fonts" data-testid="site-fonts">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="site-fonts-title">
          Site fonts
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="site-fonts-body">
            Manage this site&apos;s fonts. Built-in Inter stays available.
          </p>
          <TextInput
            type="search"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter" && q && filtered.length === 0) setView({ kind: "none", query: query.trim() });
            }}
            placeholder="Search fonts"
            aria-label="Search fonts"
            className="tw:mt-3"
            data-testid="site-fonts-search"
          />
          {/* A heading, so the list has a landmark — sized like the body line
              above it, since the overlay root's reset leaves the UA's 1.17em
              on headings. */}
          <h3
            className={`${LIBRARY_MODAL_BODY} tw:mt-3 tw:text-[length:var(--bk-text-13)] tw:font-normal`}
            data-testid="site-fonts-section"
          >
            Uploaded fonts
          </h3>
          {fonts.length === 0 ? (
            <p className={`${LIBRARY_MODAL_BODY} tw:mt-3`} data-testid="site-fonts-empty">
              No uploaded fonts yet. Upload a {ACCEPTED_FONT_FILES} file to the Asset library to add it here.
            </p>
          ) : (
            <ul
              className="tw:m-0 tw:mt-3 tw:flex tw:max-h-[40vh] tw:list-none tw:flex-col tw:gap-2 tw:overflow-y-auto tw:p-0"
              data-testid="site-fonts-list"
            >
              {filtered.map((font) => {
                const highlighted = font.id === highlightId;
                return (
                  <li
                    key={font.id}
                    ref={highlighted ? highlightRef : undefined}
                    className={CARD}
                    data-highlighted={highlighted ? "true" : undefined}
                    data-testid={`site-font-${font.id}`}
                  >
                    <h4 className={CARD_NAME} data-testid={`site-font-name-${font.id}`}>
                      {libraryFontFamily(font.originalName)} · {font.originalName}
                    </h4>
                    {/* The one computed style CLAUDE.md allows: the family
                        exists only as this file's own face. */}
                    <p
                      className={CARD_SAMPLE}
                      style={{ fontFamily: `"${previewFamily(font.id)}", var(--bk-font-ui)` }}
                      data-testid={`site-font-sample-${font.id}`}
                    >
                      {SAMPLE}
                    </p>
                    {font.siteFont ? (
                      <div className="tw:flex tw:items-center tw:gap-3">
                        <span className={CARD_STATE} data-testid={`site-font-added-${font.id}`}>
                          Added
                        </span>
                        <Button
                          size="xs"
                          variant="secondary"
                          className={LIBRARY_MODAL_BTN_SECONDARY}
                          onClick={() => void composer.media.updateAsset(font.id, { siteFont: false })}
                          data-testid={`site-font-remove-${font.id}`}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="xs"
                        className={LIBRARY_MODAL_BTN_PRIMARY}
                        onClick={() => void add(font)}
                        data-testid={`site-font-add-${font.id}`}
                      >
                        Add font
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="site-fonts-foot">
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            onClick={close}
            data-testid="site-fonts-cancel"
          >
            Cancel
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
