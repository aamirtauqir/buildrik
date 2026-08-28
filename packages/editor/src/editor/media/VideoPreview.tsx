/**
 * Video Preview Component
 * Video player with controls, thumbnail extraction, and duration display
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalClose, ModalContent, ModalRoot, ModalTitle, TextInput } from "@/editor/chrome-ui";

/** Transport glyph over the video — white on dark, no chrome of its own. */
const GLYPH_BTN =
  "tw:p-1 tw:border-0 tw:bg-transparent tw:text-base tw:text-white tw:hover:bg-white/20";
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
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-0 tw:p-10 tw:rounded-lg tw:bg-[var(--bk-bg-subtle)] tw:text-gray-500">
        <span className="tw:mb-3 tw:text-3xl">⚠️</span>
        <span>{state.error}</span>
      </div>
    );
  }

  return (
    <div className="tw:relative tw:rounded-lg tw:overflow-hidden">
      {/* Hidden canvas for thumbnail extraction */}
      <canvas ref={canvasRef} className="tw:hidden" />
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
        className="tw:block tw:w-full tw:max-h-100 tw:bg-gray-900"
      />
      {/* Loading overlay */}
      {state.isLoading && (
        <div className="tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center tw:bg-black/50">
          <span className="tw:text-sm tw:text-white">Loading...</span>
        </div>
      )}
      {/* Controls */}
      <div className="tw:absolute tw:inset-x-0 tw:bottom-0 tw:p-3 tw:bg-linear-to-b tw:from-transparent tw:to-black/80">
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="tw:h-1 tw:mb-3 tw:rounded-sm tw:cursor-pointer tw:bg-white/30"
        >
          {/* width is the playhead — data, not style */}
          <div
            className="tw:h-full tw:rounded-sm tw:bg-[var(--bk-accent)] tw:transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Control buttons */}
        <div className="tw:flex tw:items-center tw:gap-3">
          {/* Skip back */}
          <Button
            onClick={() => skipSeconds(-10)}
            className={GLYPH_BTN}
            title="Skip back 10s"
          >
            ⏪
          </Button>

          {/* Play/Pause */}
          <Button
            onClick={togglePlay}
            className="tw:px-3 tw:py-2 tw:rounded-md tw:border-0 tw:text-lg tw:text-white tw:bg-white/20 tw:hover:bg-white/30"
          >
            {state.isPlaying ? "⏸️" : "▶️"}
          </Button>

          {/* Skip forward */}
          <Button
            onClick={() => skipSeconds(10)}
            className={GLYPH_BTN}
            title="Skip forward 10s"
          >
            ⏩
          </Button>

          {/* Time display */}
          <span className="tw:text-xs tw:text-white tw:[font-family:var(--bk-font-mono)]">
            {formatTime(state.currentTime)} / {formatTime(state.duration)}
          </span>

          {/* Spacer */}
          <div className="tw:flex-1" />

          {/* Volume */}
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button onClick={toggleMute} className={GLYPH_BTN}>
              {state.isMuted || state.volume === 0 ? "🔇" : "🔊"}
            </Button>
            <TextInput
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={state.volume}
              onChange={handleVolumeChange}
              className="tw:w-15"
            />
          </div>
        </div>
      </div>
      {/* Title overlay */}
      {title && (
        <div className="tw:absolute tw:top-3 tw:left-3 tw:px-3 tw:py-1 tw:rounded tw:bg-black/60 tw:text-[13px] tw:font-medium tw:text-white">
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
    const handleClose = props.onClose || (() => {});
    return (
      <ModalRoot
        open={props.isOpen || false}
        onOpenChange={(next) => !next && handleClose()}
      >
        <ModalContent size="lg">
          <ModalTitle>{props.title || "Video Preview"}</ModalTitle>
          <ModalClose aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </ModalClose>
          <ModalBody>
            <VideoPlayerCore {...props} />
            <div className="tw:flex tw:justify-end tw:mt-4">
              <Button color="light" onClick={props.onClose} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                Close
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </ModalRoot>
    );
  }

  return <VideoPlayerCore {...props} />;
};

export default VideoPreview;
