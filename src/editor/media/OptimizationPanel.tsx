/**
 * Optimization Panel Component
 * Quality slider, format picker, and compression preview
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MediaOptimizer, formatBytes } from "../../engine/media";
import type { ImageExportFormat } from "../../shared/types/media";
import { Button, Spinner } from "../../shared/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface OptimizationPanelProps {
  imageSrc: string;
  onOptimized: (optimizedSrc: string) => void;
  onClose?: () => void;
}

interface OptimizationState {
  format: ImageExportFormat;
  quality: number;
  originalSize: number;
  optimizedSize: number;
  optimizedSrc: string | null;
  isProcessing: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 500,
    color: "var(--aqb-text-secondary)",
  },
  formatRow: {
    display: "flex",
    gap: 8,
  },
  formatBtn: {
    flex: 1,
    padding: "8px 12px",
    fontSize: 12,
    background: "var(--aqb-bg-panel-secondary)",
    border: "1px solid var(--aqb-border)",
    borderRadius: 6,
    color: "var(--aqb-text)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  formatBtnActive: {
    background: "var(--aqb-primary)",
    borderColor: "var(--aqb-primary)",
    color: "#fff",
  },
  sliderContainer: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 4,
    WebkitAppearance: "none",
    appearance: "none",
    background: "var(--aqb-border)",
    borderRadius: 2,
    outline: "none",
  },
  qualityValue: {
    minWidth: 40,
    textAlign: "right" as const,
    fontSize: 13,
    fontFamily: "monospace",
    color: "var(--aqb-text)",
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "var(--aqb-bg-panel-secondary)",
    borderRadius: 8,
    marginBottom: 16,
  },
  stat: {
    textAlign: "center" as const,
  },
  statLabel: {
    fontSize: 12,
    color: "var(--aqb-text-muted)",
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--aqb-text)",
  },
  savings: {
    color: "#a6e3a1",
  },
  previewContainer: {
    display: "flex",
    gap: 12,
    marginBottom: 16,
  },
  previewBox: {
    flex: 1,
    background: "var(--aqb-bg-panel-secondary)",
    borderRadius: 8,
    padding: 8,
    textAlign: "center" as const,
  },
  previewImg: {
    maxWidth: "100%",
    maxHeight: 120,
    borderRadius: 4,
  },
  previewLabel: {
    fontSize: 12,
    color: "var(--aqb-text-muted)",
    marginTop: 6,
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  imageSrc,
  onOptimized,
  onClose,
}) => {
  const [optimizer] = React.useState(() => new MediaOptimizer());
  const [state, setState] = React.useState<OptimizationState>({
    format: "webp",
    quality: 85,
    originalSize: 0,
    optimizedSize: 0,
    optimizedSrc: null,
    isProcessing: false,
  });

  // Check format support
  const [formatSupport, setFormatSupport] = React.useState({ webp: true, avif: false });

  React.useEffect(() => {
    optimizer.checkFormatSupport().then(setFormatSupport);
  }, [optimizer]);

  // Calculate original size
  React.useEffect(() => {
    if (imageSrc) {
      const base64 = imageSrc.split(",")[1];
      if (base64) {
        const size = Math.round((base64.length * 3) / 4);
        setState((s) => ({ ...s, originalSize: size }));
      }
    }
  }, [imageSrc]);

  // Optimize on settings change
  React.useEffect(() => {
    const optimize = async () => {
      setState((s) => ({ ...s, isProcessing: true }));
      try {
        const result = await optimizer.optimize(imageSrc, {
          format: state.format,
          quality: state.quality / 100,
          preserveTransparency: state.format !== "jpeg",
        });

        if (result.success && result.dataUrl) {
          setState((s) => ({
            ...s,
            optimizedSize: result.optimizedSize ?? 0,
            optimizedSrc: result.dataUrl ?? null,
            isProcessing: false,
          }));
        } else {
          setState((s) => ({ ...s, isProcessing: false }));
        }
      } catch {
        setState((s) => ({ ...s, isProcessing: false }));
      }
    };

    const timer = setTimeout(optimize, 300);
    return () => clearTimeout(timer);
  }, [imageSrc, state.format, state.quality, optimizer]);

  const handleFormatChange = (format: ImageExportFormat) => {
    setState((s) => ({ ...s, format }));
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((s) => ({ ...s, quality: parseInt(e.target.value, 10) }));
  };

  const handleApply = () => {
    if (state.optimizedSrc) {
      onOptimized(state.optimizedSrc);
    }
  };

  const savings =
    state.originalSize > 0 ? Math.round((1 - state.optimizedSize / state.originalSize) * 100) : 0;

  const formats: Array<{ id: ImageExportFormat; label: string; supported: boolean }> = [
    { id: "webp", label: "WebP", supported: formatSupport.webp },
    { id: "jpeg", label: "JPEG", supported: true },
    { id: "png", label: "PNG", supported: true },
  ];

  return (
    <div style={styles.container}>
      {/* Format Selection */}
      <div style={styles.section}>
        <label style={styles.label}>Output Format</label>
        <div style={styles.formatRow}>
          {formats.map(({ id, label, supported }) => (
            <button
              key={id}
              onClick={() => supported && handleFormatChange(id)}
              disabled={!supported}
              style={{
                ...styles.formatBtn,
                ...(state.format === id ? styles.formatBtnActive : {}),
                opacity: supported ? 1 : 0.5,
                cursor: supported ? "pointer" : "not-allowed",
              }}
            >
              {label}
              {id === "webp" && " (Recommended)"}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider */}
      <div style={styles.section}>
        <label style={styles.label}>Quality</label>
        <div style={styles.sliderContainer}>
          <input
            type="range"
            min={10}
            max={100}
            value={state.quality}
            onChange={handleQualityChange}
            style={styles.slider}
          />
          <span style={styles.qualityValue}>{state.quality}%</span>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Original</div>
          <div style={styles.statValue}>{formatBytes(state.originalSize)}</div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Optimized</div>
          <div style={styles.statValue}>
            {state.isProcessing ? "..." : formatBytes(state.optimizedSize)}
          </div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Savings</div>
          <div style={{ ...styles.statValue, ...styles.savings }}>
            {state.isProcessing ? "..." : `${savings}%`}
          </div>
        </div>
      </div>

      {/* Preview Comparison */}
      <div style={styles.previewContainer}>
        <div style={styles.previewBox}>
          <img src={imageSrc} alt="Original" style={styles.previewImg} />
          <div style={styles.previewLabel}>Original</div>
        </div>
        <div style={styles.previewBox}>
          {state.isProcessing ? (
            <Spinner size="sm" />
          ) : state.optimizedSrc ? (
            <img src={state.optimizedSrc} alt="Optimized" style={styles.previewImg} />
          ) : null}
          <div style={styles.previewLabel}>Optimized</div>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.footer}>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button onClick={handleApply} disabled={state.isProcessing || !state.optimizedSrc}>
          Apply Optimization
        </Button>
      </div>
    </div>
  );
};

export default OptimizationPanel;
