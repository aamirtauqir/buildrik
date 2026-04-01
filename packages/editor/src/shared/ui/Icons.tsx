/**
 * Aquibra Icon Components
 * Professional SVG icons using Lucide React
 *
 * @license BSD-3-Clause
 */

import {
  Link,
  MousePointer2,
  Image,
  Video,
  FormInput,
  FileText,
  ListOrdered,
  Square,
  LayoutGrid,
  Type,
  FileType,
  AlignLeft,
  List,
  Globe,
  Box,
  LayoutTemplate,
  Home,
  Navigation,
  Footprints,
  CreditCard,
  Layers,
  Search,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Settings,
  Palette,
  Move,
  Zap,
  Sparkles,
  PanelLeft,
  Puzzle,
  Tag,
  Target,
  FolderTree,
  Database,
  Edit,
  Info,
} from "lucide-react";
import * as React from "react";

// Icon size variants
type IconSize = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
};

interface IconProps {
  size?: IconSize;
  className?: string;
  style?: React.CSSProperties;
}

// Element Type Icons
export const IconLink: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Link size={sizeMap[size]} {...props} />
);

export const IconButton: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <MousePointer2 size={sizeMap[size]} {...props} />
);

export const IconImage: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Image size={sizeMap[size]} {...props} />
);

export const IconVideo: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Video size={sizeMap[size]} {...props} />
);

export const IconInput: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <FormInput size={sizeMap[size]} {...props} />
);

export const IconTextarea: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <FileText size={sizeMap[size]} {...props} />
);

export const IconSelect: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <ListOrdered size={sizeMap[size]} {...props} />
);

export const IconForm: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Square size={sizeMap[size]} {...props} />
);

export const IconContainer: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Box size={sizeMap[size]} {...props} />
);

export const IconSection: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <LayoutTemplate size={sizeMap[size]} {...props} />
);

export const IconHero: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Home size={sizeMap[size]} {...props} />
);

export const IconNavbar: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Navigation size={sizeMap[size]} {...props} />
);

export const IconFooter: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Footprints size={sizeMap[size]} {...props} />
);

export const IconCard: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <CreditCard size={sizeMap[size]} {...props} />
);

export const IconHeading: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Type size={sizeMap[size]} {...props} />
);

export const IconText: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <FileType size={sizeMap[size]} {...props} />
);

export const IconParagraph: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <AlignLeft size={sizeMap[size]} {...props} />
);

export const IconList: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <List size={sizeMap[size]} {...props} />
);

export const IconIframe: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Globe size={sizeMap[size]} {...props} />
);

export const IconGrid: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <LayoutGrid size={sizeMap[size]} {...props} />
);

export const IconFlex: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Move size={sizeMap[size]} {...props} />
);

export const IconFeatures: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Sparkles size={sizeMap[size]} {...props} />
);

export const IconDefault: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Box size={sizeMap[size]} {...props} />
);

// UI Icons
export const IconLayers: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Layers size={sizeMap[size]} {...props} />
);

export const IconSearch: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Search size={sizeMap[size]} {...props} />
);

export const IconTrash: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Trash2 size={sizeMap[size]} {...props} />
);

export const IconChevronDown: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <ChevronDown size={sizeMap[size]} {...props} />
);

export const IconChevronRight: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <ChevronRight size={sizeMap[size]} {...props} />
);

export const IconPlus: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Plus size={sizeMap[size]} {...props} />
);

export const IconClose: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <X size={sizeMap[size]} {...props} />
);

export const IconSettings: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Settings size={sizeMap[size]} {...props} />
);

export const IconPalette: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Palette size={sizeMap[size]} {...props} />
);

export const IconLayout: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <PanelLeft size={sizeMap[size]} {...props} />
);

export const IconSpacing: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Move size={sizeMap[size]} {...props} />
);

export const IconTypography: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Type size={sizeMap[size]} {...props} />
);

export const IconEffects: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Sparkles size={sizeMap[size]} {...props} />
);

export const IconBorder: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Square size={sizeMap[size]} {...props} />
);

export const IconFlexbox: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Zap size={sizeMap[size]} {...props} />
);

export const IconBackground: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Palette size={sizeMap[size]} {...props} />
);

export const IconBinding: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Puzzle size={sizeMap[size]} {...props} />
);

export const IconTag: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Tag size={sizeMap[size]} {...props} />
);

// Info Icon
export const IconInfo: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Info size={sizeMap[size]} {...props} />
);

export const IconTarget: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Target size={sizeMap[size]} {...props} />
);

export const IconTree: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <FolderTree size={sizeMap[size]} {...props} />
);

export const IconDatabase: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Database size={sizeMap[size]} {...props} />
);

export const IconEdit: React.FC<IconProps> = ({ size = "md", ...props }) => (
  <Edit size={sizeMap[size]} {...props} />
);

// ============================================
// Custom SVG Icons (Sidebar Navigation)
// Single source of truth - consolidated from:
// - SidebarTabs.tsx
// - GroupedSidebarTabs.tsx
// - GlobalSettingsMenu.tsx
// ============================================

/** Build/Elements - Shapes icon */
export const SvgShapes: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <circle cx="11.5" cy="4.5" r="2.5" />
    <path d="M4.5 14L2 10h5L4.5 14z" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

/** Structure - Layers icon */
export const SvgLayers: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M2 8l6 3 6-3M2 11l6 3 6-3M2 5l6 3 6-3-6-3-6 3z" strokeLinejoin="round" />
  </svg>
);

/** Assets - Image icon */
export const SvgImage: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <circle cx="5.5" cy="5.5" r="1.5" />
    <path d="M14 10l-3-3-4 4-2-2-3 3" strokeLinejoin="round" />
  </svg>
);

/** Templates - Layout icon */
export const SvgLayout: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M2 6h12M6 6v8" />
  </svg>
);

/** AI - Sparkles icon */
export const SvgSparkles: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      d="M8 2v2M8 12v2M2 8h2M12 8h2M4 4l1.5 1.5M10.5 10.5L12 12M12 4l-1.5 1.5M5.5 10.5L4 12"
      strokeLinecap="round"
    />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

/** Alternate sparkles (star pattern) */
export const SvgSparklesStar: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M8 2l1.5 3.5L13 7l-3.5 1.5L8 12l-1.5-3.5L3 7l3.5-1.5L8 2z" />
    <path d="M12 2l.75 1.75L14.5 4.5l-1.75.75L12 7l-.75-1.75L9.5 4.5l1.75-.75L12 2z" />
    <path d="M4 10l.75 1.75L6.5 12.5l-1.75.75L4 15l-.75-1.75L1.5 12.5l1.75-.75L4 10z" />
  </svg>
);

/** Design System - Palette icon */
export const SvgPalette: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="8" cy="8" r="6" />
    <circle cx="6" cy="6" r="1" fill="currentColor" />
    <circle cx="10" cy="6" r="1" fill="currentColor" />
    <circle cx="6" cy="10" r="1" fill="currentColor" />
    <path d="M10 10c1.5 0 2.5-1 2.5-2.5S11.5 5 10 5" />
  </svg>
);

/** Components - Grid of boxes */
export const SvgComponents: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);

/** Pages - Document icon */
export const SvgPages: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
    <path d="M5 5h6M5 8h6M5 11h4" strokeLinecap="round" />
  </svg>
);

/** CMS - Database icon */
export const SvgDatabase: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <ellipse cx="8" cy="4" rx="5" ry="2" />
    <path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4" />
    <path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" />
  </svg>
);

/** History - Clock icon */
export const SvgClock: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4v4l2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Settings - Gear icon */
export const SvgSettings: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" />
    <path d="M13.6 10a1.2 1.2 0 00.24 1.32l.04.04a1.46 1.46 0 11-2.06 2.06l-.04-.04a1.2 1.2 0 00-1.32-.24 1.2 1.2 0 00-.73 1.1v.12a1.45 1.45 0 11-2.9 0v-.06a1.2 1.2 0 00-.79-1.1 1.2 1.2 0 00-1.32.24l-.04.04a1.46 1.46 0 11-2.06-2.06l.04-.04a1.2 1.2 0 00.24-1.32 1.2 1.2 0 00-1.1-.73h-.12a1.45 1.45 0 110-2.9h.06a1.2 1.2 0 001.1-.79 1.2 1.2 0 00-.24-1.32l-.04-.04a1.46 1.46 0 112.06-2.06l.04.04a1.2 1.2 0 001.32.24h.06a1.2 1.2 0 00.73-1.1v-.12a1.45 1.45 0 012.9 0v.06a1.2 1.2 0 00.73 1.1 1.2 1.2 0 001.32-.24l.04-.04a1.46 1.46 0 112.06 2.06l-.04.04a1.2 1.2 0 00-.24 1.32v.06a1.2 1.2 0 001.1.73h.12a1.45 1.45 0 010 2.9h-.06a1.2 1.2 0 00-1.1.73z" />
  </svg>
);

/** Publish - Rocket icon */
export const SvgRocket: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M3 11c-1 .84-1.33 3.33-1.33 3.33s2.5-.33 3.33-1.33c.47-.56.47-1.42-.06-1.94a1.45 1.45 0 00-1.94-.06z" />
    <path d="M8 10l-2-2a14.67 14.67 0 011.33-2.63A8.59 8.59 0 0114.67 1.33c0 1.81-.52 5-4 7.34A14.9 14.9 0 018 10z" />
    <path d="M6 8H2.67s.37-2.02 1.33-2.67c1.08-.72 3.33 0 3.33 0M8 10v3.33s2.02-.37 2.67-1.33c.72-1.08 0-3.33 0-3.33" />
  </svg>
);

/** Plugins - Chip/CPU icon */
export const SvgPlugin: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="4" y="4" width="8" height="8" rx="1" />
    <path d="M7 4V2M9 4V2M7 14v-2M9 14v-2M12 7h2M12 9h2M2 7h2M2 9h2" />
  </svg>
);

/** Plugins alternate - Document with pins */
export const SvgPlugins: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M6 2v2M10 2v2M4 6h8M4 4h8a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
    <path d="M6 9h4M6 11h2" strokeLinecap="round" />
  </svg>
);

// ============================================
// Toggle Icons for Top Bar
// ============================================

/** Dev Mode / Code icon */
export const SvgCode: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M5 4L1 8l4 4M11 4l4 4-4 4M9 2l-2 12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Wrench icon for dev/tools */
export const SvgWrench: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M10.5 2.5c1.5-.5 3 .5 3.5 2 .5 1.5-.5 3-2 3.5L6 14l-3-3 6-6z" />
    <path d="M3 13l2-2" strokeLinecap="round" />
  </svg>
);

/** Eye icon for X-Ray */
export const SvgEye: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

/** Eye off icon */
export const SvgEyeOff: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      d="M2 2l12 12M6.5 6.5a2 2 0 002.9 2.9M1 8s2.5-5 7-5c1 0 1.9.2 2.7.5M15 8s-1.5 3-4.5 4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Lightbulb icon for suggestions */
export const SvgLightbulb: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      d="M6 12h4M6 14h4M6 12V9.5c0-.5-.5-1-1-1.5-1-1-1.5-2-1.5-3.5a4.5 4.5 0 019 0c0 1.5-.5 2.5-1.5 3.5-.5.5-1 1-1 1.5V12"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Moon icon for dark theme */
export const SvgMoon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M13.5 8.5a6 6 0 01-6 6c-3.3 0-6-2.7-6-6 0-3 2.2-5.5 5-6 0 0-1 2 1 4s4 1 4 1c-.5 2.8-3 5-6 5" />
    <path d="M14 4.5a5.5 5.5 0 01-5.5 9" />
  </svg>
);

/** Sun icon for light theme */
export const SvgSun: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="8" cy="8" r="3" />
    <path
      d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M13 3l-1.5 1.5M4.5 11.5L3 13"
      strokeLinecap="round"
    />
  </svg>
);

/** Save/Disk icon */
export const SvgSave: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M13 14H3a1 1 0 01-1-1V3a1 1 0 011-1h8l3 3v9a1 1 0 01-1 1z" />
    <path d="M11 14v-4H5v4M5 2v3h5" />
  </svg>
);

/** Sync/Refresh icon */
export const SvgSync: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4" strokeLinecap="round" />
    <path d="M12.5 1v3h-3M3.5 15v-3h3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Warning/Alert icon */
export const SvgWarning: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M8 1l7 14H1L8 1z" strokeLinejoin="round" />
    <path d="M8 6v3M8 11.5v.5" strokeLinecap="round" />
  </svg>
);

/** Check/Success icon */
export const SvgCheck: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M3 8l3.5 3.5 6.5-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Plus icon for Add Page */
export const SvgPlusCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v6M5 8h6" strokeLinecap="round" />
  </svg>
);

/** Globe icon — v16 rail "Global" tab (design system) */
export const SvgGlobe: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.65"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/** Templates icon — v16 rail bento grid layout */
export const SvgTemplates: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.65"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="5" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="10" width="8" height="11" rx="1.5" />
  </svg>
);

/** More horizontal dots — overflow menu trigger */
export const SvgMoreHorizontal: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.65"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

/** Chevron Left icon */
export const SvgChevronLeft: React.FC<IconProps> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Chevron Right icon */
export const SvgChevronRight: React.FC<IconProps> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Pin icon for panel pinning */
export const SvgPin: React.FC<IconProps> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path
      d="M9.5 2.5L13.5 6.5L10 10L9 14L6 11L2 14L5 10L2 9L6 5.5L9.5 2.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Close/X icon */
export const SvgClose: React.FC<IconProps> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Pointer icon */
export const SvgPointer: React.FC<IconProps> = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path
      d="M5.5 12.5L2 9l3.5-3.5M10.5 5.5L14 9l-3.5 3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="9" r="2" />
  </svg>
);

// Element type icon mapping
export const elementIcons: Record<string, React.FC<IconProps>> = {
  link: IconLink,
  button: IconButton,
  image: IconImage,
  video: IconVideo,
  input: IconInput,
  textarea: IconTextarea,
  select: IconSelect,
  form: IconForm,
  container: IconContainer,
  section: IconSection,
  hero: IconHero,
  navbar: IconNavbar,
  footer: IconFooter,
  card: IconCard,
  heading: IconHeading,
  text: IconText,
  paragraph: IconParagraph,
  list: IconList,
  iframe: IconIframe,
  grid: IconGrid,
  flex: IconFlex,
  features: IconFeatures,
  div: IconContainer,
  span: IconText,
  default: IconDefault,
};

// Get icon component by element type
export const getElementIcon = (type: string): React.FC<IconProps> => {
  return elementIcons[type] || elementIcons.default;
};
