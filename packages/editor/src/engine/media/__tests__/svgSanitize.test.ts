/**
 * Security contract: DOMPurify SVG sanitization used by MediaManager.uploadFile.
 *
 * The MediaManager upload path runs DOMPurify.sanitize(raw, {
 *   USE_PROFILES: { svg: true, svgFilters: true }
 * }) on every SVG before IndexedDB write. This test locks in that
 * sanitization behavior — the exact thing that keeps stored XSS out of
 * the library.
 *
 * The full upload path (FileReader + IndexedDB + Image() for dimensions)
 * is heavy for a unit test. Isolating the security-critical step here
 * keeps the contract testable without pulling in the whole storage
 * stack.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import DOMPurify from "dompurify";

const SVG_PROFILES = { USE_PROFILES: { svg: true, svgFilters: true } };

describe("SVG upload sanitization (XSS defense)", () => {
  it("strips inline <script> tags", () => {
    const malicious = `<svg xmlns="http://www.w3.org/2000/svg">
      <script>alert('xss')</script>
      <circle cx="50" cy="50" r="40" fill="red"/>
    </svg>`;
    const clean = DOMPurify.sanitize(malicious, SVG_PROFILES);

    expect(clean).not.toMatch(/<script/i);
    expect(clean).not.toMatch(/alert\(/);
    // Preserves the legitimate drawing content.
    expect(clean).toMatch(/<circle/);
  });

  it("strips inline event handlers (onclick, onload, onerror)", () => {
    const malicious = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
      <rect onclick="steal()" width="10" height="10"/>
    </svg>`;
    const clean = DOMPurify.sanitize(malicious, SVG_PROFILES);

    expect(clean).not.toMatch(/onload=/i);
    expect(clean).not.toMatch(/onclick=/i);
    expect(clean).not.toMatch(/steal\(/);
    expect(clean).not.toMatch(/alert\(/);
  });

  it("strips javascript: URLs in href/xlink:href", () => {
    const malicious = `<svg xmlns="http://www.w3.org/2000/svg">
      <a href="javascript:alert(1)">
        <circle cx="50" cy="50" r="40"/>
      </a>
    </svg>`;
    const clean = DOMPurify.sanitize(malicious, SVG_PROFILES);

    expect(clean).not.toMatch(/javascript:/i);
  });

  it("strips <foreignObject> with embedded HTML script", () => {
    const malicious = `<svg xmlns="http://www.w3.org/2000/svg">
      <foreignObject>
        <iframe src="javascript:alert(1)"></iframe>
      </foreignObject>
    </svg>`;
    const clean = DOMPurify.sanitize(malicious, SVG_PROFILES);

    expect(clean).not.toMatch(/<iframe/i);
    expect(clean).not.toMatch(/javascript:/i);
  });

  it("preserves legitimate drawing primitives", () => {
    const safe = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="40" fill="#1D4ED8"/>
      <rect x="10" y="10" width="20" height="20" fill="red"/>
      <path d="M10 10 L50 50"/>
      <g><text x="10" y="50">hi</text></g>
    </svg>`;
    const clean = DOMPurify.sanitize(safe, SVG_PROFILES);

    expect(clean).toMatch(/<circle/);
    expect(clean).toMatch(/<rect/);
    expect(clean).toMatch(/<path/);
    expect(clean).toMatch(/<text/);
  });

  it("preserves SVG filters (blur, shadow, etc.) — svgFilters profile is on", () => {
    const withFilter = `<svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <circle cx="50" cy="50" r="40" filter="url(#blur)"/>
    </svg>`;
    const clean = DOMPurify.sanitize(withFilter, SVG_PROFILES);

    expect(clean).toMatch(/<filter/);
    expect(clean).toMatch(/feGaussianBlur/);
  });

  it("empty-or-junk input produces empty or short output the upload path rejects", () => {
    // MediaManager.uploadFile checks `!clean || !clean.trim().startsWith("<")`
    // and rejects. This confirms sanitize returns something the check will catch.
    const clean = DOMPurify.sanitize("<script>alert(1)</script>", SVG_PROFILES);
    // Profile is SVG-only, so a bare <script> produces no valid SVG content.
    expect(clean.trim().startsWith("<svg")).toBe(false);
  });
});
