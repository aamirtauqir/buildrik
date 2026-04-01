/**
 * Aquibra Map Embed Block
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface MapEmbedProps {
  address?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  height?: string;
}

export const MapEmbed: React.FC<MapEmbedProps> = ({
  address = "New York, NY",
  lat,
  lng,
  zoom = 14,
  height = "400px",
}) => {
  const mapUrl =
    lat && lng
      ? `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1`
      : `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(
          address
        )}&zoom=${zoom}`;

  return (
    <div
      className="aqb-map-embed"
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--aqb-bg-panel, #1a1a2e)",
      }}
    >
      <iframe
        src={mapUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export const mapEmbedBlockConfig = {
  id: "map-embed",
  label: "Map Embed",
  category: "Media",
  icon: "🗺️",
  elementType: "map-embed" as const,
  content:
    '<div class="aqb-map-embed" data-aqb-type="map-embed" style="width:100%;height:400px;border-radius:12px;overflow:hidden;background:#1a1a2e;">' +
    '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;color:#666;">' +
    '<div><div style="font-size:48px;">🗺️</div>' +
    '<div style="margin-top:8px;">Enter address or coordinates</div></div>' +
    "</div>" +
    "</div>",
};

export default MapEmbed;
