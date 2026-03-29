/**
 * Aquibra Image Editor Modal
 * Crop, rotate, flip, and apply filters to images
 *
 * @module components/Media/ImageEditorModal
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ImageProcessor } from "../../engine/media";
import type {
  RotationDegrees,
  ImageAdjustments,
  ImageFilters,
  CropConfig,
  AspectRatioPreset,
} from "../../shared/types/media";
import {
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_IMAGE_FILTERS,
  ASPECT_RATIO_PRESETS,
} from "../../shared/types/media";
import { Modal, Button, Tabs, Spinner } from "../../shared/ui";
import { CropOverlay } from "./CropOverlay";
import { imageEditorStyles as styles } from "./ImageEditorStyles";
import { SliderControl } from "./SliderControl";

// ============================================
// Types
// ============================================

export interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onSave: (editedSrc: string) => void;
}

type EditTab = "crop" | "transform" | "filters" | "adjustments";

// ============================================
// Component
// ============================================

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onSave,
}) => {
  const [processor] = React.useState(() => new ImageProcessor());
  const [activeTab, setActiveTab] = React.useState<EditTab>("crop");
  const [processing, setProcessing] = React.useState(false);
  const [previewSrc, setPreviewSrc] = React.useState(imageSrc);

  // Image dimensions
  const [imageDimensions, setImageDimensions] = React.useState({ width: 0, height: 0 });

  // Edit state
  const [crop, setCrop] = React.useState<CropConfig | null>(null);
  const [aspectRatio, setAspectRatio] = React.useState<AspectRatioPreset>(ASPECT_RATIO_PRESETS[0]);
  const [rotation, setRotation] = React.useState<RotationDegrees>(0);
  const [flipH, setFlipH] = React.useState(false);
  const [flipV, setFlipV] = React.useState(false);
  const [adjustments, setAdjustments] = React.useState<ImageAdjustments>(DEFAULT_IMAGE_ADJUSTMENTS);
  const [filters, setFilters] = React.useState<ImageFilters>(DEFAULT_IMAGE_FILTERS);

  // Load image dimensions
  React.useEffect(() => {
    if (isOpen && imageSrc) {
      const img = new Image();
      img.onload = () => setImageDimensions({ width: img.width, height: img.height });
      img.src = imageSrc;
    }
  }, [isOpen, imageSrc]);

  // Reset when modal opens with new image
  React.useEffect(() => {
    if (isOpen) {
      setPreviewSrc(imageSrc);
      setCrop(null);
      setAspectRatio(ASPECT_RATIO_PRESETS[0]);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setAdjustments(DEFAULT_IMAGE_ADJUSTMENTS);
      setFilters(DEFAULT_IMAGE_FILTERS);
    }
  }, [isOpen, imageSrc]);

  // Apply changes and update preview
  const applyChanges = async () => {
    setProcessing(true);
    try {
      let result = imageSrc;

      // Apply crop first
      if (crop) {
        result = await processor.crop(result, crop);
      }

      if (rotation !== 0) {
        result = await processor.rotate(result, rotation);
      }

      if (flipH || flipV) {
        result = await processor.flip(result, { horizontal: flipH, vertical: flipV });
      }

      const hasFilters = Object.entries(filters).some(
        ([key, value]) => value !== DEFAULT_IMAGE_FILTERS[key as keyof ImageFilters]
      );
      if (hasFilters) {
        result = await processor.applyFilters(result, filters);
      }

      const hasAdjustments = Object.entries(adjustments).some(
        ([key, value]) => value !== DEFAULT_IMAGE_ADJUSTMENTS[key as keyof ImageAdjustments]
      );
      if (hasAdjustments) {
        result = await processor.applyAdjustments(result, adjustments);
      }

      setPreviewSrc(result);
    } finally {
      setProcessing(false);
    }
  };

  // Debounce apply changes (skip for crop tab - it has its own preview)
  React.useEffect(() => {
    if (activeTab === "crop") return;
    const timer = setTimeout(applyChanges, 300);
    return () => clearTimeout(timer);
  }, [rotation, flipH, flipV, adjustments, filters, activeTab]);

  const handleRotate = (deg: 90 | -90) => {
    setRotation((prev) => ((prev + deg + 360) % 360) as RotationDegrees);
  };

  const handleReset = () => {
    setCrop(null);
    setAspectRatio(ASPECT_RATIO_PRESETS[0]);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAdjustments(DEFAULT_IMAGE_ADJUSTMENTS);
    setFilters(DEFAULT_IMAGE_FILTERS);
    setPreviewSrc(imageSrc);
  };

  // Apply crop when switching away from crop tab
  const handleTabChange = async (tab: string) => {
    if (activeTab === "crop" && crop && tab !== "crop") {
      setProcessing(true);
      try {
        const cropped = await processor.crop(imageSrc, crop);
        setPreviewSrc(cropped);
      } finally {
        setProcessing(false);
      }
    }
    setActiveTab(tab as EditTab);
  };

  const handleSave = () => {
    onSave(previewSrc);
    onClose();
  };

  const updateAdjustment = (key: keyof ImageAdjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };

  const updateFilter = (key: keyof ImageFilters, value: number | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Image" size="lg">
      <div style={styles.container}>
        {/* Preview - hide on crop tab since CropOverlay has its own */}
        {activeTab !== "crop" && (
          <div style={styles.preview}>
            {processing ? (
              <Spinner size="lg" />
            ) : (
              <img src={previewSrc} alt="Preview" style={styles.previewImage} />
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <Tabs
          tabs={[
            { id: "crop", label: "Crop" },
            { id: "transform", label: "Transform" },
            { id: "filters", label: "Filters" },
            { id: "adjustments", label: "Adjust" },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {/* Controls */}
        <div style={styles.controls}>
          {activeTab === "crop" && imageDimensions.width > 0 && (
            <CropOverlay
              imageSrc={imageSrc}
              imageWidth={imageDimensions.width}
              imageHeight={imageDimensions.height}
              crop={crop}
              onCropChange={setCrop}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
            />
          )}

          {activeTab === "transform" && (
            <div style={styles.toolbar}>
              <button style={styles.toolBtn} onClick={() => handleRotate(-90)}>
                <span style={{ fontSize: 20 }}>↺</span>
                <span style={{ fontSize: 12 }}>Rotate Left</span>
              </button>
              <button style={styles.toolBtn} onClick={() => handleRotate(90)}>
                <span style={{ fontSize: 20 }}>↻</span>
                <span style={{ fontSize: 12 }}>Rotate Right</span>
              </button>
              <button
                style={{ ...styles.toolBtn, ...(flipH ? styles.toolBtnActive : {}) }}
                onClick={() => setFlipH(!flipH)}
              >
                <span style={{ fontSize: 20 }}>⇆</span>
                <span style={{ fontSize: 12 }}>Flip H</span>
              </button>
              <button
                style={{ ...styles.toolBtn, ...(flipV ? styles.toolBtnActive : {}) }}
                onClick={() => setFlipV(!flipV)}
              >
                <span style={{ fontSize: 20 }}>⇅</span>
                <span style={{ fontSize: 12 }}>Flip V</span>
              </button>
            </div>
          )}

          {activeTab === "filters" && (
            <>
              <SliderControl
                label="Grayscale"
                value={filters.grayscale}
                onChange={(v) => updateFilter("grayscale", v)}
                min={0}
                max={100}
              />
              <SliderControl
                label="Sepia"
                value={filters.sepia}
                onChange={(v) => updateFilter("sepia", v)}
                min={0}
                max={100}
              />
              <SliderControl
                label="Blur"
                value={filters.blur}
                onChange={(v) => updateFilter("blur", v)}
                min={0}
                max={20}
              />
            </>
          )}

          {activeTab === "adjustments" && (
            <>
              <SliderControl
                label="Brightness"
                value={adjustments.brightness}
                onChange={(v) => updateAdjustment("brightness", v)}
                min={-100}
                max={100}
              />
              <SliderControl
                label="Contrast"
                value={adjustments.contrast}
                onChange={(v) => updateAdjustment("contrast", v)}
                min={-100}
                max={100}
              />
              <SliderControl
                label="Saturation"
                value={adjustments.saturation}
                onChange={(v) => updateAdjustment("saturation", v)}
                min={-100}
                max={100}
              />
              <SliderControl
                label="Hue"
                value={adjustments.hue}
                onChange={(v) => updateAdjustment("hue", v)}
                min={0}
                max={360}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={processing}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImageEditorModal;
