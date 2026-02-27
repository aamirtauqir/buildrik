/**
 * Aquibra Image Gallery Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  columns?: 2 | 3 | 4 | 5;
  gap?: number;
  layout?: "grid" | "masonry";
  lightbox?: boolean;
  aspectRatio?: "square" | "4:3" | "16:9" | "auto";
}

const defaultImages: GalleryImage[] = [
  { src: "https://picsum.photos/400/300?random=1", alt: "Gallery Image 1" },
  { src: "https://picsum.photos/400/400?random=2", alt: "Gallery Image 2" },
  { src: "https://picsum.photos/400/350?random=3", alt: "Gallery Image 3" },
  { src: "https://picsum.photos/400/300?random=4", alt: "Gallery Image 4" },
  { src: "https://picsum.photos/400/450?random=5", alt: "Gallery Image 5" },
  { src: "https://picsum.photos/400/300?random=6", alt: "Gallery Image 6" },
];

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images = defaultImages,
  columns = 3,
  gap = 16,
  // layout prop reserved for masonry/grid switching
  lightbox = true,
  aspectRatio = "auto",
}) => {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const aspectRatioMap = {
    square: "1 / 1",
    "4:3": "4 / 3",
    "16:9": "16 / 9",
    auto: "auto",
  };

  const openLightbox = (index: number) => {
    if (lightbox) {
      setActiveIndex(index);
      setLightboxOpen(true);
    }
  };

  return (
    <>
      <div
        className="aqb-image-gallery"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap,
          padding: 20,
        }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="aqb-gallery-item"
            onClick={() => openLightbox(index)}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 8,
              cursor: lightbox ? "pointer" : "default",
              aspectRatio: aspectRatioMap[aspectRatio],
            }}
          >
            <img
              src={image.src}
              alt={image.alt || ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s ease",
              }}
            />
            {image.caption && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "12px 16px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                {image.caption}
              </div>
            )}
            <div
              className="aqb-gallery-overlay"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.3s ease",
              }}
            >
              <span
                style={{
                  opacity: 0,
                  fontSize: 32,
                  transition: "opacity 0.3s ease",
                }}
              >
                🔍
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="aqb-lightbox"
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => Math.max(0, prev - 1));
            }}
            style={{
              position: "absolute",
              left: 20,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              fontSize: 32,
              padding: "20px 24px",
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            ←
          </button>

          <img
            src={images[activeIndex].src}
            alt={images[activeIndex].alt || ""}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "80%",
              maxHeight: "80%",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => Math.min(images.length - 1, prev + 1));
            }}
            style={{
              position: "absolute",
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              fontSize: 32,
              padding: "20px 24px",
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            →
          </button>

          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              fontSize: 24,
              padding: "12px 16px",
              cursor: "pointer",
              borderRadius: 8,
            }}
          >
            ✕
          </button>

          <div
            style={{
              position: "absolute",
              bottom: 20,
              color: "#fff",
              fontSize: 14,
            }}
          >
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
};

export const galleryBlockConfig = {
  id: "gallery",
  label: "Image Gallery",
  category: "Media",
  elementType: "gallery" as const,
  icon: "/src/assets/icons/blocks/media/carausal.svg",
  content:
    '<div class="aqb-image-gallery" data-aqb-type="gallery">' +
    '<div class="aqb-gallery-grid">' +
    '<img src="https://via.placeholder.com/400x260" alt="Gallery item 1"/>' +
    '<img src="https://via.placeholder.com/400x260" alt="Gallery item 2"/>' +
    '<img src="https://via.placeholder.com/400x260" alt="Gallery item 3"/>' +
    "</div>" +
    "</div>",
};

export default ImageGallery;
