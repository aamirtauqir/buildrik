/**
 * Element-type icon map — lucide glyphs keyed by engine element type.
 *
 * Ported from src/shared/ui/Icons.tsx (Slice 6B, shared/ui drain). This is a
 * domain palette (element library / layers / inspector), not a ui primitive —
 * the ui library's Icon stays a sizing wrapper and lucide stays the icon set.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  AlignLeft,
  Box,
  CreditCard,
  FileText,
  FileType,
  Footprints,
  FormInput,
  Globe,
  Home,
  Image,
  LayoutGrid,
  LayoutTemplate,
  Link,
  List,
  ListOrdered,
  MousePointer2,
  Move,
  Navigation,
  Sparkles,
  Square,
  Type,
  Video,
  type LucideIcon,
} from "lucide-react";

export type ElementIconSize = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<ElementIconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
};

export interface ElementIconProps {
  size?: ElementIconSize;
  className?: string;
  style?: React.CSSProperties;
}

const glyphs: Record<string, LucideIcon> = {
  link: Link,
  button: MousePointer2,
  image: Image,
  video: Video,
  input: FormInput,
  textarea: FileText,
  select: ListOrdered,
  form: Square,
  container: Box,
  section: LayoutTemplate,
  hero: Home,
  navbar: Navigation,
  footer: Footprints,
  card: CreditCard,
  heading: Type,
  text: FileType,
  paragraph: AlignLeft,
  list: List,
  iframe: Globe,
  grid: LayoutGrid,
  flex: Move,
  features: Sparkles,
  div: Box,
  span: FileType,
  default: Box,
};

const wrap = (Glyph: LucideIcon): React.FC<ElementIconProps> => {
  const ElementIcon: React.FC<ElementIconProps> = ({ size = "md", ...props }) => (
    <Glyph size={sizeMap[size]} {...props} />
  );
  return ElementIcon;
};

// Prebuilt so getElementIcon returns stable component identities across renders.
export const elementIcons: Record<string, React.FC<ElementIconProps>> = Object.fromEntries(
  Object.entries(glyphs).map(([type, Glyph]) => [type, wrap(Glyph)]),
);

export const getElementIcon = (type: string): React.FC<ElementIconProps> =>
  elementIcons[type] || elementIcons.default;
