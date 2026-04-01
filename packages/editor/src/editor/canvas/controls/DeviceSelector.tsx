/**
 * Aquibra Device Selector
 * Desktop/Tablet/Mobile preview switcher
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CanvasButton, DEVICE_PRESETS, SIZES } from "../shared";

export interface Device {
  id: string;
  name: string;
  width: number;
  height?: number;
  icon: string;
}

export interface DeviceSelectorProps {
  devices?: Device[];
  activeDevice: string;
  onChange: (deviceId: string) => void;
  showLabels?: boolean;
  className?: string;
}

// Convert readonly preset to mutable Device array
const defaultDevices: Device[] = DEVICE_PRESETS.map((d) => ({ ...d }));

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices = defaultDevices,
  activeDevice,
  onChange,
  showLabels = false,
  className,
}) => {
  return (
    <div
      className={`aqb-device-selector ${className || ""}`}
      data-control="device"
      style={{
        display: "flex",
        alignItems: "center",
        gap: SIZES.padding.xs,
        padding: SIZES.padding.xs,
        background: "var(--aqb-bg-panel-secondary)",
        borderRadius: SIZES.borderRadius.lg,
      }}
    >
      {devices.map((device) => (
        <CanvasButton
          key={device.id}
          data-device={device.id}
          onClick={() => onChange(device.id)}
          icon={device.icon}
          label={showLabels ? device.name : undefined}
          active={activeDevice === device.id}
          title={`${device.name} (${device.width}px)`}
          variant="ghost"
          size="md"
        />
      ))}
    </div>
  );
};

export default DeviceSelector;
