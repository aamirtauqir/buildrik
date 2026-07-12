// SSOT for site-status badge colors. Consumed by site-card-full, site-list-view,
// and site-detail/site-header — previously duplicated in all three.
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PUBLISHED: { bg: "#DCFCE7", text: "#166534" },
  DRAFT: { bg: "#FEF9C3", text: "#854D0E" },
  ARCHIVED: { bg: "#FED7AA", text: "#9A3412" },
};

export function siteStatusColor(status: string): { bg: string; text: string } {
  return STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT;
}
