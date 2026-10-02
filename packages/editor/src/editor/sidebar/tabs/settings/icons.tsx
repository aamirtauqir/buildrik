/**
 * Settings nav icons — one glyph per sidebar row (Phase B IA), reused by the
 * Overview's section cards so a row looks the same in both places.
 *
 * @license BSD-3-Clause
 */

import {
  ArrowLeftRight,
  ChartColumn,
  Code,
  CreditCard,
  FileText,
  Globe,
  Languages,
  LayoutGrid,
  LockKeyhole,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  TriangleAlert,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { SettingsNavId } from "./types";

export const NAV_ICONS: Record<SettingsNavId, LucideIcon> = {
  overview: LayoutGrid,
  general: Settings,
  localization: Languages,
  branding: Pencil,
  seo: Search,
  domains: Globe,
  redirects: ArrowLeftRight,
  access: LockKeyhole,
  analytics: ChartColumn,
  forms: FileText,
  "custom-code": Code,
  headers: ShieldCheck,
  "danger-zone": TriangleAlert,
  members: Users,
  billing: CreditCard,
  webhooks: Zap,
};
