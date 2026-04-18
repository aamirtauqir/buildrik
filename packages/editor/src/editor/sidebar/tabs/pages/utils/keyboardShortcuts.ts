export function shouldFocusSearch(e: KeyboardEvent): boolean {
  if (e.key !== "/") return false;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return false;
  const t = e.target;
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;
  if (t.isContentEditable || t.contentEditable === "true") return false;
  return true;
}
