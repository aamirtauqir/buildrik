/**
 * Video Preview Component
 * Video player with controls, thumbnail extraction, and duration display
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Modal } from "../../shared/ui";

// ============================================================================
// TYPES
// ============================================================================

export interface VideoPreviewProps {
  /** Video source URL or blob URL */
  src: string;
  /** Optional poster image */
  poster?: string;
  /** Video title/name */
  title?: string;
  /** Callback when thumbnail is extracted */
  onThumbnailExtracted?: (thumbnailDataUrl: string) => void;
  /** Show in modal */
  isModal?: boolean;
  /** Modal open state */
  isOpen?: boolean;
  /** Modal close callback */
  onClose?: () => void;
}

interface VideoState {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isFullscreen: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================================================
// VIDEO PLAYER CORE
// ============================================================================

const VideoPlayerCore: React.FC<VideoPreviewProps & { extractThumbnail?: boolean }> = ({
  src,
  poster,
  title,
  onThumbnailExtracted,
  extractThumbnail = true,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const progressRef = React.useRef<HTMLDivElement>(null);

  const [state, setState] = React.useState<VideoState>({
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    isMuted: false,
    volume: 1,
    isFullscreen: false,
    isLoading: true,
    error: null,
  });

  // Extract thumbnail when video loads
  React.useEffect(() => {
    if (!extractThumbnail || !onThumbnailExtracted) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const handleLoadedData = () => {
      // Seek to 1 second or 10% of duration
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    const handleSeeked = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
      onThumbnailExtracted(thumbnail);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [extractThumbnail, onThumbnailExtracted]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setState((s) => ({
        ...s,
        duration: videoRef.current?.duration || 0,
        isLoading: false,
      }));
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setState((s) => ({ ...s, currentTime: videoRef.current?.currentTime || 0 }));
    }
  };

  const handleError = () => {
    setState((s) => ({ ...s, error: "Failed to load video", isLoading: false }));
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setState((s) => ({ ...s, isPlaying: !s.isPlaying }));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !state.isMuted;
    setState((s) => ({ ...s, isMuted: !s.isMuted }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
    setState((s) => ({ ...s, volume, isMuted: volume === 0 }));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * state.duration;
  };

  const skipSeconds = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(state.duration, videoRef.current.currentTime + seconds)
      );
    }
  };

  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  if (state.error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          background: "var(--aqb-bg-panel-secondary)",
          borderRadius: 8,
          color: "var(--aqb-text-muted)",
        }}
      >
        <span style={{ fontSize: 32, marginBottom: 12 }}>⚠️</span>
        <span>{state.error}</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
      {/* Hidden canvas for thumbnail extraction */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onPlay={() => setState((s) => ({ ...s, isPlaying: true }))}
        onPause={() => setState((s) => ({ ...s, isPlaying: false }))}
        onEnded={() => setState((s) => ({ ...s, isPlaying: false }))}
        style={{
          width: "100%",
          display: "block",
          background: "#000",
          maxHeight: 400,
        }}
      />

      {/* Loading overlay */}
      {state.isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <span style={{ color: "#fff", fontSize: 14 }}>Loading...</span>
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 12,
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
        }}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          style={{
            height: 4,
            background: "rgba(255,255,255,0.3)",
            borderRadius: 2,
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: "var(--aqb-primary)",
              borderRadius: 2,
              transition: "width 0.1s linear",
            }}
          />
        </div>

        {/* Control buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Skip back */}
          <button
            onClick={() => skipSeconds(-10)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
              padding: 4,
            }}
            title="Skip back 10s"
          >
            ⏪
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            {state.isPlaying ? "⏸️" : "▶️"}
          </button>

          {/* Skip forward */}
          <button
            onClick={() => skipSeconds(10)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 16,
              padding: 4,
            }}
            title="Skip forward 10s"
          >
            ⏩
          </button>

          {/* Time display */}
          <span style={{ color: "#fff", fontSize: 12, fontFamily: "monospace" }}>
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </span>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Volume */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={toggleMute}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontSize: 16,
                padding: 4,
              }}
            >
              {state.isMuted || state.volume === 0 ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={state.volume}
              onChange={handleVolumeChange}
              style={{ width: 60 }}
            />
          </div>
        </div>
      </div>

      {/* Title overlay */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            padding: "4px 12px",
            background: "rgba(0,0,0,0.6)",
            borderRadius: 4,
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VideoPreview: React.FC<VideoPreviewProps> = (props) => {
  if (props.isModal) {
    return (
      <Modal
        isOpen={props.isOpen || false}
        onClose={props.onClose || (() => {})}
        title={props.title || "Video Preview"}
        size="lg"
      >
        <VideoPlayerCore {...props} />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <Button variant="ghost" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return <VideoPlayerCore {...props} />;
};

export default VideoPreview;
