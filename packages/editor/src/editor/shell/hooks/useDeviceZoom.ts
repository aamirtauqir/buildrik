/**
 * useDeviceZoom - Hook for managing device type and zoom level state
 *
 * @module Editor/hooks/useDeviceZoom
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DeviceType } from "../../../shared/types";

/** Hook return type for device and zoom state */
export interface UseDeviceZoomReturn {
  device: DeviceType;
  setDevice: React.Dispatch<React.SetStateAction<DeviceType>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Manages device type (desktop/tablet/mobile) and canvas zoom level
 */
function useDeviceZoom(): UseDeviceZoomReturn {
  const [device, setDevice] = React.useState<DeviceType>("desktop");
  const [zoom, setZoom] = React.useState(100);

  return {
    device,
    setDevice,
    zoom,
    setZoom,
  };
}
