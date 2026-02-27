/**
 * Media Library Panel Styles
 * Extracted for maintainability
 * @license BSD-3-Clause
 */

export const mediaLibraryStyles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    minHeight: 400,
  },
  toolbar: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
  },
  viewToggle: {
    display: "flex",
    gap: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 12,
    maxHeight: 400,
    overflow: "auto",
    padding: 4,
  },
  listView: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    maxHeight: 400,
    overflow: "auto",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: 60,
    color: "var(--aqb-text-muted)",
  },
  uploadArea: {
    padding: 20,
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: "1px solid var(--aqb-border)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
};

export const assetCardStyles = {
  card: {
    position: "relative" as const,
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid var(--aqb-border)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    background: "var(--aqb-bg-panel)",
  },
  cardSelected: {
    border: "2px solid var(--aqb-primary)",
    boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.2)",
  },
  thumbnail: {
    width: "100%",
    height: 100,
    objectFit: "cover" as const,
    background: "var(--aqb-bg-panel-secondary)",
  },
  info: {
    padding: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  meta: {
    fontSize: 10,
    color: "var(--aqb-text-muted)",
    marginTop: 2,
  },
  deleteBtn: {
    position: "absolute" as const,
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewBtn: {
    position: "absolute" as const,
    bottom: 4,
    left: 4,
    padding: "4px 8px",
    background: "rgba(0,0,0,0.7)",
    border: "none",
    borderRadius: 4,
    color: "#fff",
    fontSize: 10,
    cursor: "pointer",
    zIndex: 2,
  },
};
