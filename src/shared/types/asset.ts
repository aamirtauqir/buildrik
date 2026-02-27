/**
 * Asset Types
 * Types for project assets (images, videos, audio, documents)
 *
 * @module types/asset
 * @license BSD-3-Clause
 */

// ============================================
// Asset Types
// ============================================

export interface AssetData {
  /** Asset ID */
  id: string;
  /** Asset type */
  type: AssetType;
  /** Asset URL */
  src: string;
  /** Asset name */
  name?: string;
  /** File size */
  size?: number;
  /** Dimensions for images */
  width?: number;
  height?: number;
}

export type AssetType = "image" | "video" | "audio" | "document" | "other";
