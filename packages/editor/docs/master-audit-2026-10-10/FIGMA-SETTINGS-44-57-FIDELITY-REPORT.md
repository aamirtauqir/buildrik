# Settings 44–57: independent AS-IS fidelity review

Reviewed 2026-10-10. Scope: the fourteen new Settings frames on AS-IS page `8280:2`, file `g4GzQFqzNYz5sosz1QtZXC`. No app code, browser state, original pages, or frames 58 onward were changed. This is a Phase 4 reconstruction review, not a Phase 4 completion claim or a TO-BE design.

All fourteen frames are **1440 × 900**, clip to their viewport, contain editable native nodes, and have **zero image fills**. The structural read found no text bounds outside any frame. Eight views were visually compared with their corresponding running-app screenshots: Overview, SEO, Analytics, Members, Redirects, Access, Security headers, and Custom code. The other six received structural checks only; this report does not claim their complete visual comparison.

## Evidence and frame coverage

The browser captures were supplied by the parent browser session and independently viewed here; this reviewer did not drive the browser. All fourteen browser PNGs and matching layout JSONs are retained in [settings-44-57-validation](evidence/settings-44-57-validation/). Layout JSON records its original capture time and viewport. Figma screenshots were taken using native `node.screenshot({scale:1})` and saved at the original 1440-pixel width.

| Frame | Native ID | Current state | Review |
|---|---|---|---|
| 44 | `8302:2` | Overview | Visual + bounds |
| 45 | `8302:234` | SEO | Visual + bounds |
| 46 | `8302:473` | Redirects, no rules, suggester on | Visual + bounds; thumb restored |
| 47 | `8302:682` | Domains, no custom domain | Bounds |
| 48 | `8302:883` | Access, password off | Visual + bounds; thumb restored |
| 49 | `8302:1095` | Analytics, providers off, not verified | Visual + bounds; three thumbs restored |
| 50 | `8302:1327` | Form submissions, empty | Bounds |
| 51 | `8302:1527` | Languages | Bounds |
| 52 | `8302:1748` | Custom code, empty code fields with placeholders | Visual + bounds; placeholder/resize affordances restored |
| 53 | `8302:1966` | Security headers, unset policies, HSTS off | Visual + bounds; native control details restored |
| 54 | `8302:2194` | Danger zone | Bounds |
| 55 | `8302:2404` | Members, workspace handoff | Visual + bounds |
| 56 | `8302:2608` | Billing, workspace handoff | Bounds |
| 57 | `8302:2812` | Integrations, workspace handoff | Bounds |

Structural evidence: [native-structure-before-corrections.json](evidence/settings-44-57-validation/native-structure-before-corrections.json). Subsequent changes below added bounded native nodes or edited existing placeholder fills/bounds; no frame dimensions changed.

## Comparisons and corrections

**Overview:** the 256-pixel navigation rail, 112-pixel content header, seven category cards, selected Overview row, scope copy, role footer, and card shadows match the captured organization and geometry. [Browser](evidence/settings-44-57-validation/buildrick-settings-overview.png) · [Figma](evidence/settings-44-57-validation/figma-overview.png).

**SEO:** Defaults and Social profiles expanded, Indexing collapsed, six social inputs, Open Graph placeholder, blue Pages handoff notice, selected SEO row, and saved footer are represented in the captured positions. [Browser](evidence/settings-44-57-validation/buildrick-settings-seo.png) · [Figma](evidence/settings-44-57-validation/figma-seo.png).

**Analytics:** provider cards, ID placeholders, `NOT VERIFIED`, `No events yet`, verification action, body clipping, and footer are retained. The initial native view omitted the white switch thumbs. Three native 20 × 20 ellipses now reproduce the captured off positions. [Browser](evidence/settings-44-57-validation/buildrick-settings-analytics.png) · [Final Figma](evidence/settings-44-57-validation/figma-analytics.png) · [Before](evidence/settings-44-57-validation/figma-analytics-before.png). This comparison does not validate the verification backend; finding WS-04 remains applicable.

**Workspace handoff:** Members retains the workspace name and scope, 640-pixel handoff card, descriptive copy, Close and Open workspace settings actions, selected navigation row, and absence of the site Save footer. It is a representation of the current handoff screen, not the destination team-management page. [Browser](evidence/settings-44-57-validation/buildrick-settings-members.png) · [Figma](evidence/settings-44-57-validation/figma-members.png).

**Additional control corrections:** Redirects, Access, and Security headers also lacked captured switch thumbs. Restored one each while preserving Redirects on and Access/HSTS off. Installed Flowbite source uses `after:h-5 after:w-5` and a 2-pixel inset for the medium 44 × 24 switch; the capture/extraction included its track but omitted the CSS pseudo-element. Evidence: `node_modules/flowbite-react/dist/components/ToggleSwitch/theme.js:14–17,41` and the corresponding browser PNGs. Created thumb IDs: `8303:241529` through `8303:241534`.

**Code placeholders:** four existing text nodes in Custom code and Security headers had opacity-zero fills because their captured color uses `oklab(...)`. Converted that exact captured OKLab value to sRGB with 0.5 opacity; retained Geist Mono Regular. Nodes: `8302:1935`, `8302:1940`, `8302:1945`, `8302:2155`. Head scripts and Global CSS contain two lines; their extractor coordinates incorrectly centered a single-line height. Restored 32-pixel text bounds and moved those two nodes up 8 pixels to match the screenshot. These are placeholders, not newly saved scripts or CSP values.

**Native browser affordances:** restored two missing Security headers select chevrons and four visible textarea resize grips as editable vectors. Chevron node roots: `8303:241654`, `8303:241656`; vector descendants: `8303:241655`, `8303:241657`. Resize-grip roots: `8303:241658`, `8303:241660`, `8303:241662`, `8303:241664`; vector descendants: `8303:241659`, `8303:241661`, `8303:241663`, `8303:241665`. These small native-browser details are visually matched to the capture, not claimed as exact Chromium internal vector geometry.

Final corrected views: [Redirects](evidence/settings-44-57-validation/figma-redirects.png), [Access](evidence/settings-44-57-validation/figma-access.png), [Security headers](evidence/settings-44-57-validation/figma-headers.png), [Custom code](evidence/settings-44-57-validation/figma-custom-code.png). Every affected view was screenshot-checked after its final relevant correction. Total change: 18 newly created native nodes, four existing text nodes edited; two of those four also received multiline bounds corrections.

## Preserved runtime conditions and limits

- The lower-right black Agentation control is development tooling captured over the product footer, and it can obscure Save. It remains represented to preserve this measured runtime condition; it is not a proposed product control. The Next.js development badge was already omitted by the reconstruction workflow. Neither treatment proves the underlying Save interaction works.
- Browser and Figma font rasterization/baselines differ slightly, commonly around two pixels in these captures. Native form-control microdetails are approximations. No pixel-perfect claim is made.
- These views are snapshots at 1440 × 900. No responsive resizing, keyboard focus, scrolling, validation, role switching, provider configuration, destination workspace route, modal state, or save mutation was exercised by this review.
- Bounds and zero image fills demonstrate native structure, not full Auto Layout behavior or reusable-component coverage. Those requirements are tracked separately by the Phase 4 component-library and gate review documents.
- Empty, disabled, off, unverified, and workspace-handoff states were preserved. Existing source/runtime limitations remain documented in [AS-IS-WORKSPACE-STATE-SPEC.md](AS-IS-WORKSPACE-STATE-SPEC.md) and [WORKSPACES-SERVICES-COVERAGE.md](WORKSPACES-SERVICES-COVERAGE.md).
- Six Settings views are structurally checked but have not received an independent full screenshot comparison in this pass. Phase 4 responsive/state completeness and the broader Phase 4 gate remain the parent's aggregate review responsibility.
