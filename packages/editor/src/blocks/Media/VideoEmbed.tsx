/**
 * Aquibra Video Embed Block
 * @license BSD-3-Clause
 */

export const videoEmbedBlockConfig = {
  id: "video-embed",
  label: "Video Embed",
  category: "Media",
  icon: "🎬",
  elementType: "video-embed" as const,
  content:
    '<div class="buildrick-video-embed" data-buildrick-type="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;background:#1a1a2e;">' +
    '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#666;">' +
    '<div style="font-size:48px;">🎬</div>' +
    '<div style="margin-top:8px;">Paste YouTube or Vimeo URL</div>' +
    "</div>" +
    "</div>",
};

