# Vizcom Clone — Brainstorm Answers

Date: 2026-05-06
Mode: verbatim clone with 2 pragmatic compromises (animation tier, assets).

---

## 1. Product Identity — KEEP
Visual development platform. Blank canvas in → Production-grade web experiences out. Industry: Visual website builders / No-code tools / Web design platforms.

## 2. Audience Persona — KEEP
Pro web designers, digital agencies, and frontend developers. Mid-to-senior. Software-fluent (understands box model, CSS layout). Taste-sensitive. Time-poor. Psychographic: Pixel-perfectionists, craft-driven, skeptical of rigid templates and bloated code generation.

## 3. Brand Feeling — KEEP
Crafted. Cinematic. Confident.

## 4. Color Palette — KEEP VERBATIM

| Token | Hex |
|-------|-----|
| canvas-white | #f8f4f1 |
| ink-black | #191919 |
| paper-grey | #e8e3dd |
| dots-black | #242425 |
| ideation-blue | #4586da |
| blueprint-navy | #1145a0 |
| mat-green | #4b6621 |
| brick-red | #c94b3c |
| ideate-purple | #974069 |
| dream-pink | #cb83d1 |
| clay-orange | #ee855a |
| work-olive | #c2ba43 |
| lighter-lime | #cdea9d |

## 5. Page Sections — KEEP 9-ORDER VERBATIM
1. Hero
2. Logo Marquee
3. Ideation Toolkit Demo
4. Playground
5. Case Studies
6. Challenges
7. Resources
8. FAQ
9. Final CTA + Footer

## 6. Primary Headline — KEEP
- h1: Make it real
- sub: A new way to design for the real world.

## 7. Primary CTA — KEEP
Label: Get Started
Color: ideation-blue (#4586da)
Target: app.vizcom.com/auth

## 8. Key Differentiator — REFINED
Original: "AI that respects designer craft — sketch in, render out, no taste compromise."
Refined: **"Sketch in, render out. AI that respects the line you drew."**
Why: tightens, keeps craft angle, drops cliché.

## 9. Animation Intensity — 4/5 (compromise)
- Keep: scroll-pin narratives, Lenis smooth scroll, custom cursor, sticky scrub.
- Drop: WebGL canvases.
- Replace: image-sequence scrub (preloaded webp frames driven by ScrollTrigger).
- Why: WebGL = ~60% extra dev cost for ~15% fidelity gain. Image-sequence reads identical to most users.

## 10. Tech Stack — OPTION B (modern rebuild)
- Framework: Next.js (App Router) + React 19
- Animation: GSAP + ScrollTrigger
- Smooth scroll: Lenis
- 3D / canvas: skip Three.js. canvas2d only if image-sequence insufficient.
- Why: scroll-pin narratives need ScrollTrigger primitives (`scrub`, `pin`, `snap`). Vanilla JS = 800+ LOC edge-case hell (resize, mobile bounce, anchor jumps). Webflow IX2 not portable.

## 11. Content Assets — OPTION B (recreate placeholders)
- Sketch products (jacket / chair / car @ 1440×4957): generate stand-ins matching shape + density.
- 130 client SVGs: generic shapes or open-source brand SVGs.
- Case-study thumbs: stock or generated.
- Why: hot-linking vizcom CDN = breaks on their next deploy + IP risk.

## 12. Section Modifications — NONE
All 9 sections kept as-is. Pure clone.

---

## Locked Summary

| Dim | Lock |
|-----|------|
| Identity / audience / brand / palette / sections / headline / CTA | verbatim |
| Differentiator | tightened |
| Animation tier | 4/5 (no WebGL) |
| Stack | Next.js + GSAP + ScrollTrigger + Lenis |
| Assets | placeholder recreation |
| Section mods | zero |

Next step: write design doc → spec → implementation plan via writing-plans skill.
