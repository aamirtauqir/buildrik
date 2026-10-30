/**
 * Content › Images — an Image gallery's own list (2L9 B69/04 `249:72335`):
 *
 *   Images                       4 image children
 *   [ Gallery item 1        ↑ ↓ ]   opens that exact <img>; Move up / down
 *   …
 *   [ Choose asset ]                 a new <img> of the picked file, styled
 *                                    like the last image; one Undo
 *
 * The images are the gallery's own <img> children, or those of the grid it
 * wraps them in (the Image gallery block's markup). An image inside a gallery
 * gets "Back to {gallery}" (`GalleryImageBackSection`). Nothing is
 * regenerated: every image keeps its id, alt and styles.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import type { MediaAsset, MediaAssetType } from "@/shared/types/media";
import { Button, IconButton } from "@/editor/chrome-ui";
import { writeElement } from "@/engine/commands/commandOperations";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { Section } from "../shared/controls";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";
import { NoteRow } from "./behaviourRows";
import { useTreeVersion } from "./ChildrenSection";

const isImg = (el: Element) => el.getTagName().toLowerCase() === "img";

/** The element whose children are the gallery's images. */
export function galleryList(gallery: Element): Element {
  if (gallery.getChildren().some(isImg)) return gallery;
  return gallery.getChildren().find((c) => c.getChildren().some(isImg)) ?? gallery;
}

/** The gallery an image belongs to, when it is one of a gallery's images. */
export function galleryOf(el: Element | null | undefined): Element | null {
  if (!el || !isImg(el)) return null;
  const parent = el.getParent?.();
  if (!parent) return null;
  if (parent.getType() === "gallery") return parent;
  const grand = parent.getParent?.();
  return grand?.getType() === "gallery" ? grand : null;
}

function imageName(img: Element, index: number): string {
  return getLayerName(img) ?? (img.getAttribute("alt")?.trim() || `Image ${index + 1}`);
}

export interface GallerySectionProps {
  composer: Composer | null | undefined;
  elementId: string;
  isOpen?: boolean;
  onToggle?: () => void;
  onOpenMediaLibrary?: (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void, forLabel?: string) => void;
}

export function GallerySection({ composer, elementId, isOpen, onToggle, onOpenMediaLibrary }: GallerySectionProps) {
  useTreeVersion(composer);
  const gallery = composer?.elements.getElement(elementId);
  if (!composer || !gallery) return null;
  const list = galleryList(gallery);
  const images = list.getChildren().filter(isImg);

  const move = (img: Element, by: -1 | 1) => {
    const kids = list.getChildren();
    const at = kids.indexOf(img);
    /* Down by one = the next sibling up by one: the target index is then
       the same before and after the move. */
    const [mover, to] = by < 0 ? [img, at - 1] : [kids[at + 1], at];
    if (!mover || to < 0) return;
    writeElement(composer, gallery, by < 0 ? "Move image up" : "Move image down", () => {
      composer.elements.moveElement(mover.getId(), list.getId(), to);
    });
  };

  const choose = () => {
    if (!onOpenMediaLibrary) return;
    onOpenMediaLibrary(
      ["image"],
      (asset) => {
        const last = images[images.length - 1];
        const data = last?.getData();
        writeElement(composer, gallery, "Add image", () => {
          const img = composer.elements.createElement("image", {
            tagName: "img",
            classes: [...(data?.classes ?? [])],
            styles: { ...(data?.styles ?? {}) },
            attributes: { src: asset.src, alt: asset.altText ?? "" },
          });
          composer.elements.addElement(img, list.getId());
        });
      },
      getLayerName(gallery) ?? "Image gallery",
    );
  };

  return (
    <Section
      title="Images"
      isOpen={isOpen}
      onToggle={onToggle}
      action={
        <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="gallery-count">
          {images.length === 1 ? "1 image child" : `${images.length} image children`}
        </span>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="inspector-gallery">
        {images.map((img, i) => (
          <div key={img.getId()} className="tw:flex tw:items-center tw:gap-1">
            <Button color="light" size="xs" className={`${WIDE_BUTTON} tw:min-w-0 tw:flex-1`} onClick={() => composer.selection.select(img)} data-testid="gallery-open">
              <span className="tw:truncate">{imageName(img, i)}</span>
            </Button>
            <IconButton label={`Move ${imageName(img, i)} up`} size="sm" disabled={i === 0} onClick={() => move(img, -1)}>
              <ChevronUp size={14} aria-hidden />
            </IconButton>
            <IconButton label={`Move ${imageName(img, i)} down`} size="sm" disabled={i === images.length - 1} onClick={() => move(img, 1)}>
              <ChevronDown size={14} aria-hidden />
            </IconButton>
          </div>
        ))}
        {onOpenMediaLibrary ? (
          <Button color="light" size="xs" className={WIDE_BUTTON} onClick={choose} data-testid="gallery-choose-asset">
            Choose asset
          </Button>
        ) : null}
        <NoteRow>Selecting an image edits that exact image. Each keeps its own ID, alt text and styles.</NoteRow>
      </div>
    </Section>
  );
}

/** An image of a gallery: the way back to the gallery it sits in. */
export function GalleryImageBackSection({ composer, elementId }: { composer: Composer | null | undefined; elementId: string }) {
  const gallery = galleryOf(composer?.elements.getElement(elementId));
  if (!composer || !gallery) return null;
  return (
    <div className="tw:py-2">
      <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => composer.selection.select(gallery)} data-testid="gallery-back">
        Back to {getLayerName(gallery) ?? "Image gallery"}
      </Button>
    </div>
  );
}
