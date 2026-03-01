/**
 * SvgIcon — renders hardcoded SVG strings via DOMParser + replaceChildren
 * Extracted from inline BuildTab.tsx
 * @license BSD-3-Clause
 */

import * as React from "react";

interface SvgIconProps {
  html: string;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ html }) => {
  const ref = React.useRef<SVGSVGElement>(null);
  React.useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const doc = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg">${html}</svg>`,
      "image/svg+xml"
    );
    svg.replaceChildren(...Array.from(doc.documentElement.childNodes));
  }, [html]);
  return <svg ref={ref} viewBox="0 0 24 24" />;
};
