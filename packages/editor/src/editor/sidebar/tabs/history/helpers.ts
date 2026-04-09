/**
 * History Tab Helpers
 * @license BSD-3-Clause
 */

/** Groups an array of timestamped items by calendar day.
 *  Returns labels: "Today", "Yesterday", or "Mon D" (e.g., "Apr 7").
 */
export function groupByDate<T extends { timestamp: number }>(
  items: T[]
): Array<{ label: string; items: T[] }> {
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const dateStr = new Date(item.timestamp).toDateString();
    const label =
      dateStr === todayStr
        ? "Today"
        : dateStr === yesterdayStr
        ? "Yesterday"
        : new Date(item.timestamp).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
