/**
 * Aquibra Video Embed Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface VideoEmbedProps {
  url: string;
  aspectRatio?: "16:9" | "4:3" | "1:1";
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

export const VideoEmbed: React.FC<VideoEmbedProps> = ({
  url,
  aspectRatio = "16:9",
  autoplay = false,
  muted = false,
  loop = false,
}) => {
  const getEmbedUrl = (url: string) => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    if (ytMatch) {
      const params = new URLSearchParams();
      if (autoplay) params.set("autoplay", "1");
      if (muted) params.set("mute", "1");
      if (loop) params.set("loop", "1");
      return `https://www.youtube.com/embed/${ytMatch[1]}?${params.toString()}`;
    }
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  const ratioMap = { "16:9": "56.25%", "4:3": "75%", "1:1": "100%" };

  return (
    <div
      className="aqb-video-embed"
      style={{
        position: "relative",
        paddingBottom: ratioMap[aspectRatio],
        height: 0,
        overflow: "hidden",
        borderRadius: 12,
      }}
    >
      <iframe
        src={getEmbedUrl(url)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export const videoEmbedBlockConfig = {
  id: "video-embed",
  label: "Video Embed",
  category: "Media",
  icon: "🎬",
  elementType: "video-embed" as const,
  content:
    '<div class="aqb-video-embed" data-aqb-type="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#1a1a2e;">' +
    '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#666;">' +
    '<div style="font-size:48px;">🎬</div>' +
    '<div style="margin-top:8px;">Paste YouTube or Vimeo URL</div>' +
    "</div>" +
    "</div>",
};

export default VideoEmbed;
