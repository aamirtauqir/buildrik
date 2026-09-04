// PURE FUNCTIONS ONLY — no React, no side effects, no imports from React

export interface ScrollThumbGeometry {
  top: number;
  height: number;
}

/** Below this, a thumb on a very tall list shrinks to an unclickable sliver. */
const MIN_THUMB_HEIGHT = 24;

/**
 * Board 1082:4835's 4px thumb, sized and positioned the way any scrollbar
 * thumb is: proportional to the visible fraction of the content, moved along
 * the remaining track by the scrolled fraction. Returns null when there is
 * nothing to scroll — the caller renders no thumb at all, same as a browser
 * omits one when content fits.
 */
export function computeThumbGeometry(box: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): ScrollThumbGeometry | null {
  const { scrollTop, scrollHeight, clientHeight } = box;
  if (scrollHeight <= clientHeight || clientHeight <= 0) return null;

  const height = Math.max(MIN_THUMB_HEIGHT, (clientHeight / scrollHeight) * clientHeight);
  const track = clientHeight - height;
  const scrollable = scrollHeight - clientHeight;
  const top = scrollable > 0 ? track * (scrollTop / scrollable) : 0;

  return { top, height };
}
