/**
 * Aquibra Map Embed Block
 * @license BSD-3-Clause
 */

export const mapEmbedBlockConfig = {
  id: "map-embed",
  label: "Map Embed",
  category: "Media",
  icon: "🗺️",
  elementType: "map-embed" as const,
  content:
    '<div class="buildrick-map-embed" data-buildrick-type="map-embed" style="width:100%;height:400px;border-radius:12px;overflow:hidden;background:#1a1a2e;">' +
    '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:#666;">' +
    '<div><div style="font-size:48px;">🗺️</div>' +
    '<div style="margin-top:8px;">Enter address or coordinates</div></div>' +
    "</div>" +
    "</div>",
};

