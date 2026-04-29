export function getCssVariable(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "";
}
