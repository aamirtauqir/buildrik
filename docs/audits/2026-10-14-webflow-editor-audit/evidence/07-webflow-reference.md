# 07 — Webflow Designer comparison reference

Retrieval date for every source: **2026-10-14**. Product compared: Webflow (Designer, CMS, Site/Workspace settings).

## Method and claim policy

- Sources are current official Webflow pages only: help.webflow.com, developers.webflow.com, webflow.com/pricing and webflow.com/updates. `university.webflow.com` lesson URLs now return a 301 redirect to help.webflow.com articles (checked on `/lesson/navigator` → article 33961320786451), so the Help Center is the University's current home.
- help.webflow.com returns HTTP 403 to automated HTML fetches. Article bodies were read through the Help Center's public Zendesk JSON endpoint (`/api/v2/help_center/en-us/articles/<id>.json`), which serves the same article body and its `updated_at` stamp. Every ledger row records the article's own last-updated date.
- The page text was read and summarized. **Nothing was tested in a Webflow account.** Behaviour is reported only as Webflow documents it. Where Webflow does not document something, this file says **not documented**. That label covers only the sources read here. It does not prove the feature is missing.
- The prior ledger (`docs/master-audit-2026-10-10/evidence/competitor-sources.json`, 16 Webflow URLs, 2026-10-10) was re-fetched in full. All 16 URLs are still valid and keep their IDs W01–W16. W17–W77 are new.
- Plan names are changing. Self-serve Site plans now read Starter / Basic / **Premium**. "CMS" and "Business" are called legacy in some articles. Platform plans read **Team** / **Enterprise**. Some older articles still name the CMS/Business plans. Each such claim cites the page it came from.

---

## 1. Designer layout (panels, toolbars)

**Documented (W01, W12, W77):**
- The **canvas** is the main area. The surrounding chrome:
  - **Top bar** — tabbed navigation (**Design** tab = canvas, **CMS** tab, **Insights** tab for Analyze/Optimize), a **context bar** and **site actions**.
    - The context bar switches locales, pages, Collection pages and Collection items. It also shows when you are editing a *main component* and shows design-approval status.
    - Site actions: collaborator avatars or a count, **Analyze mode**, **Comments**, **Preview**, **Share** (a read-only link or an invite) and **Publish**.
  - **Canvas bar** — undo/redo, **breadcrumb navigation**, canvas settings (open them by clicking the canvas width, e.g. "1440px"; they hold rulers, guides, text zoom preview and the bar position), **breakpoint** icons and **Expand canvas**. The bar sits above the canvas by default and can be moved below it.
  - **Left toolbar** — main menu (Webflow logo) with: theme (darker/brighter), Quick find, undo/redo, Export code, keyboard shortcuts, CSS preview, help/feedback and **Preview role**. The panels, with their shortcuts:

    | Panel | Shortcut |
    |---|---|
    | **Add** | A |
    | **Pages** | P |
    | **Navigator** | Z |
    | **Properties** (only while editing a main component) | K |
    | **Components** | Shift+A |
    | **Variables** | — |
    | **Style selectors** | G |
    | **Assets** | J |
    | **Libraries** | L |
    | **Apps** | E |
    | **Site Activity log** (Enterprise) | — |
    | **Localize** | — |
    | **Settings** | — |
    | **AI learning assistant** | — |
    | **Audit** | U |
    | **Quick find** | ⌘/Ctrl+E |
    | **Video tutorials** | — |

  - **Right toolbar** — **Style panel** (S), **Element settings panel** (D) and **Interactions panel** (H).
- Which tools appear depends on the **site role** (e.g. reviewer, content editor).
- Work autosaves. ⌘/Ctrl+S saves manually.
- The Designer needs a mouse-and-keyboard device with a screen at least **1268px** wide.
- **Add panel** sections (W77, dated 2025-06-27): Layout, Basic, Typography, CMS, Media, Forms, Components. You can add an element three ways: click to add in place, drag onto the canvas, or drag into the Navigator.
- **Click-to-add placement rule:**
  - Text, media or button selected → the new element goes beside or below it.
  - Structural parent selected → the new element goes inside it, at the bottom.
  - Nothing selected → the new element goes at the bottom of Body.
- **Component Canvas** — a separate focused canvas for components and their variants (see §6).
- **Recent change** (W76, updates feed, 2026-10-13): a "Box element and expanded tag selectors" enhancement. One **Box** element replaces seven, and 19 new global tag selectors were added. Its details are not yet in the help articles read here.

**Not documented:** the panel widths and whether panels can be undocked (only the Navigator documents **pin** and resize; see §2).

## 2. Navigator

**Documented (W02):**
- Shows a hierarchical tree of every element on the current page.
- Open it with the icon or **Z**. It also opens automatically while you drag:
  - It opens on the **left** when opened from the icon or Z, or when you drag from the Add panel over its icon.
  - It opens on the **right** when you drag onto the canvas, unless it is pinned.
- **Pin** is available on browsers wider than **1440px**. A pinned Navigator can be resized.
- **Expand/collapse:** per node with the toggle icon, or all at once (icon or **Option/Alt+Z**).
- **Hover sync:** hovering a row puts a blue outline on the canvas element; hovering the canvas highlights the row. Selecting a row scrolls the canvas to the element. The Navigator can select elements set to `display: none` or with a negative z-index.
- **Rename:** double-click a row (or Opt/Alt+R). Hold Opt/Alt to see the original name. Delete the custom name to reset it.
  - Body cannot be renamed. Slots cannot be renamed on an instance, only on the main component.
  - Marketers can rename **component instances** only.
- **Row icons:**

  | Icon | Meaning |
  |---|---|
  | Green box (left) | Component |
  | White box (right) | Open component |
  | Binding | CMS-bound, or has conditional visibility |
  | Hash | Grid child pinned to a cell/area |
  | Eye-slash | Hidden |
  | Lightning | Has an interaction trigger |
  | Globe | Localized in the current locale |

- **Drag to reorder.** To nest, drag over the target parent until the row indents. Moving a parent moves its children too.
- In **expand canvas**, breakpoint frames show up as selectable Navigator items: set the active frame, show/hide frames, add a large breakpoint (W16).

**Not documented:** multi-select in the Navigator, a Navigator search/filter, and per-row lock.

## 3. Canvas: selection, breadcrumbs, drag/insert, settings vs style

**Documented (W03, W01, W19, W77):**
- **Hover** draws a blue outline. **Selection** shows a label at the top-left with the element's name. Name precedence: custom name, then class name, then tag, then default name. A **gear icon** next to the label opens contextual settings.
- **Hierarchy access:**
  - Click the label to get a parent/grandparent menu.
  - Use the **breadcrumb bar**. W03 places it under the canvas at the bottom right; W01 places it in the canvas bar (an inconsistency between the two articles). The breadcrumb runs top-level parent on the left to the selected element on the right.
  - Right-click → **Select Parent Element**.
  - **Up arrow** selects the parent. W13 adds Down = child, Left/Right = sibling, Opt+Left/Right = next/previous.
- **Drag feedback:** a **blue indicator line** shows the insertion position. The new parent gets a blue outline and a blue name label. The older Add-panel article (W77, 2025-06) describes an **orange** parent indicator plus a blue position indicator, so the two sources disagree on the parent-indicator colour. The final position depends on `display` and the box model.
- **Preview mode:** hides most of the UI. The top bar stays (it can be hidden) so breakpoints can still be switched. Selection is disabled. Esc exits.
- **Element settings vs Style panel** are separate panels:
  - The **Style panel** writes CSS to the selector, per breakpoint and state.
  - The **Element settings panel** holds non-CSS settings: links, custom attributes, component properties, tag, editing permissions, image settings and so on.
  - Scope rule (W19): changes in Element settings, structure/order changes, and content changes apply to **all breakpoints**. Only Style-panel changes cascade per breakpoint.

**Not documented:** marquee/multi-element selection on the canvas, and smart-guide snapping. Rulers and guides do exist as canvas settings (W01).

## 4. Style panel, selectors, classes

**Documented (W04, W17, W18):**
- **Header:** an element-type icon and the element name, then the **Selector field** listing every tag, class and combo class on the element. Open the selector with ⌘/Ctrl+Enter or right-click → **Add class**.
- **Auto-class:** when you first style an element, a class is created automatically from the element type (e.g. "Paragraph").
- Class names are **case-insensitive** and must start with a letter. Special characters are converted to a hyphen, so `name +` and `name $` collide into the same class.
- **Recently modified classes** dropdown, kept per user.
- **Class actions** (hover the class → dropdown): **Rename class**, **Duplicate class** (the copy is disconnected from the original), **Remove class**.
  - Removing a class from an element does **not** delete it from the site.
  - A class can only be deleted site-wide when it is unused, from the Style selectors panel.
- **Combo class:** any class after the base class. Styles on it affect only elements carrying that exact combination. Inherited base styles show in **orange**; overrides and new styles show in **blue**. To edit the base class, go up through the **Inheritance menu** and use **Back** to return. Base-class values hidden by a combo override show with a **red strikethrough**. Webflow recommends no more than one level of combo.
- **Global class:** Webflow's term for a class layered onto other classes (e.g. a shadow utility), usually defined on a style-guide page.
- **Inheritance menu** (above the selector): lists the parent/ancestor chain up to the global tag (e.g. **Body (All pages)**). Any of them can be selected and edited. It also shows the base class of a combo and the active state.
- **Affected elements indicator** (below the selector): a count of uses of the class/tag **on this page and across the site**. Click it to outline every element that shares the class/tag. This is Webflow's "affects N".
- **Sections:** Layout, Spacing, Size, Position, Typography, Backgrounds, Borders, Effects, **Custom properties** (free-form CSS property/value pairs).
  - **Focus mode** opens one section at a time. Its on/off state persists per site.
  - Opt/Alt+S expands or collapses all sections. Opt/Alt+Shift+S toggles Focus mode.
- **Source indicators:** collapsed sections show dots; expanded sections show coloured property labels.

  | Colour | Meaning | Action |
  |---|---|---|
  | **Orange** | Inherited from a tag, base class, higher breakpoint, or parent text style | Click to see the source |
  | **Blue** | Set on the current class/tag/breakpoint, or an override of an inherited value | Click → **Reset** |
  | **Pink** | Set on the selected element only, at the current breakpoint. Not saved to a class (e.g. grid child settings, Quick Stack), or an override of an inherited value on a smaller breakpoint | Click → **Reset** |

  **Opt/Alt+click** on an indicator resets it.
- **Style selectors panel** (G; formerly the "Style manager" — W17 still uses that name):
  - Lists **tags** (pink, at the top), **classes** (blue, in creation order), **combo classes** (nested, "+" icon) and **nested tags** (arrow icon).
  - The **list** icon shows affected elements on this page, on other pages, and in components. Click through to jump to them.
  - Rename with the wrench → check / x.
  - **Delete unused:** a trash icon per unused class, or the **broom** icon to remove all unused classes after confirmation.
  - Search covers names *and* property values. Search and hover-preview cover the main breakpoint only.
  - A **Manage library tag styles** row turns Library tag styles Active/Inactive and reorders them (W25).

**Not documented:** an undo-safe "detach class" or a bulk class merge; selector specificity diagnostics beyond the colour indicators.

## 5. Breakpoints

**Documented (W19, W16):**
- **Defaults:**

  | Breakpoint | Applies to |
  |---|---|
  | Desktop (base) | All widths unless overridden |
  | Tablet | ≤991px |
  | Mobile landscape | ≤767px |
  | Mobile portrait | ≤479px |

- **Optional larger breakpoints:** 1280px, 1440px, 1920px (each applies to "and above"). Add them from the canvas-bar options or from the Navigator in expand canvas.
  - **A larger breakpoint cannot be removed once added.** Its unique styles can be cleared with Opt/Alt+click.
- **Cascade is two-way from desktop.** Smaller breakpoints inherit downward (tablet → landscape → portrait). Larger breakpoints inherit upward (1280 → 1440 → 1920). Once a value is overridden, it stops inheriting.
- **Clearing a value at a breakpoint also clears it on the breakpoints that inherited from it.**
- Hiding an element per breakpoint means `display: none`. Because that is a class style, it affects every element sharing the class. Hidden elements stay in the published HTML.
- You can drag the canvas edge to test other widths.
- **Expand canvas:**
  - Shows all breakpoint frames side by side. Edits cascade across them.
  - Pan with Space+drag. Zoom with ⌘/Alt+scroll. Shift+2 resets the view; fit-to-view is also available.
  - Frames can be hidden; some are hidden by default on heavy pages.
  - Limits: frame height is fixed, custom code does not load, rulers are not supported.
  - **Not available** to reviewers or in preview/comment mode. The canvas switches back to focus view automatically for Interactions with GSAP, Analyze and preview.

**Not documented:** custom (arbitrary-width) breakpoints beyond the three larger presets.

## 6. Element states and pseudo-classes

**Documented (W20):**
- Pick a state from the **States** dropdown in the Selector field. A **green state chip** appears at the end of the selector.

  | State | CSS | Notes |
  |---|---|---|
  | None | — | Default |
  | Hover | `:hover` | |
  | Pressed | `:active` | Inherits from Hover |
  | Focused | `:focus` | |
  | Focused (keyboard) | `:focus-visible` | On form inputs both apply and keyboard wins |
  | Disabled | — | Form buttons; used for submit loading and bot protection |
  | Visited | `:visited` | Text, background and border colour only |
  | Placeholder | — | Form fields; typography, background, shadows |
  | Checked | — | Custom-styled checkbox/radio |
  | Current | — | Links/tabs pointing at the current page, section or tab |
  | Current locale | — | Applied automatically in secondary locales (Localize) |

- **Inheritance:** every state inherits from None. Pressed inherits from Hover. Current inherits from None.
- **Exit a state:** choose None, press Esc (this also deselects), or select another element.
- **Reset a state value:** blue indicator → Reset, or Opt/Alt+click.
- Once a state holds local styles, the States arrow turns **blue** and blue circles mark the styled states in the menu.

**Not documented** in the States article or any other source read: **`:focus-within`**, **`::before`/`::after` pseudo-elements** and other pseudo-elements (a Help Center search found no article).

## 7. Variables

**Documented (W05):**
- **Types:**

  | Type | Bindable to |
  |---|---|
  | Color | Text, background, border/text-stroke colours, gradient stops |
  | Size | Layout gaps, spacing, position, dimensions, typography sizes, radius/width, blur, shadows |
  | Percentage | Gaps, flex basis, spacing, sizes, position, typography, radius, opacity/filters, translation |
  | Number | Flex grow/shrink, integer z-index, font weight, line height, variable-font axes, opacity |
  | Font | Font family |

  - Values can use functions (`calc()`, `clamp()`).
  - Swatches were migrated to color variables.
- **Create:** Variables panel → New variable. Rename or delete through the cog. Reorder by drag, including keyboard drag (arrows, Enter/Space, Esc to cancel). Bulk select with checkbox and Shift-range, then bulk update or delete.
- **Bind:** a **purple dot** on a Style-panel field opens the variable picker or "+" to create one. A bound value is highlighted purple. A **pencil** on a bound field edits the variable in place. **Unlink** through the variable menu. Variables also bind in Interactions with GSAP (an *Animate Variable* action and *Set variable value*).
- **Groups:** use a `Group/Name` naming convention.
- **Aliases:** same-type only. Cross-collection aliases resolve to the target's base-mode value.
- **Collections:** "+" next to Site variables. Variables and modes can be moved between collections; automatic modes become manual when moved.
- **Modes:**
  - *Automatic/responsive* modes are tied to tablet, landscape or portrait, with **one mode per breakpoint per collection**. A missing value falls back to Base.
  - *Manual* modes (themes) are applied to a class through the **Selector field dropdown**.
  - Documented caveat: a child that inherits from body may not pick up mode values unless bound directly.
- **Sharing:** shared across sites through Libraries. Values are editable only on the source site (W25).

**Not documented:** per-type or plan limits on variable count.

## 8. Components

**Documented (W06, W21, W22, W23, W24, W25):**
- **Terms:** **Main component** (the definition; edits hit every instance) and **component instance** (unique content or settings through props and slots; structure and styles are editable only on the main component). Also **properties (props)**, **slots** and **variants**.
- **Create:**
  - **Convert selection** from the Components panel or ⌘/Ctrl+Shift+A. **Suggested props** can be reviewed, renamed or deselected.
  - **Create blank** opens the Component Canvas with a wrapper div.
  - Components have optional **group** and **description**.
- **Editing locations:**
  - *In-context*: double-click an instance, use the Navigator "edit component" icon, right-click → **Edit component**, or the label/right-panel icon. A green banner/ribbon shows. Exit with the back arrow, a click outside, or Esc.
  - *Component Canvas* (dedicated): every variant shown side by side in frames, with pan/zoom. Not available on page branches, Build mode or Edit mode; in-context editing still works there.
- **Instance selection** shows a **green** outline. The Components panel shows usage counts.
- **Rename an instance:** local custom name; reset by deleting it or **Reset name**.
- **Delete a component:** only when it has zero instances.
- **Duplicate a main component:** W06 says it is "not natively possible" while also listing a **Duplicate** action in the Components panel. The two statements conflict.
- **Prop types:**
  - *Content*: Text, Rich text, Image, Link, Video, Number.
  - *Switch*: visibility.
  - *Collection list* props: filter, sort, pagination, limit, curated items.
  - *Variant* prop: created automatically.
  - Bind through the purple dot or the **Properties panel** (K). Props can be grouped and reordered.
  - Styles per instance are **not** a prop; use the "class custom attribute".
  - Props can bind to **CMS fields**, except inside rich text.
- **Override/reset:** edit prop values on the instance. **Reset all properties** or **Reset to default property value** per prop.
- **Slots:**
  - A Slot element is added inside the main component and creates a slot prop automatically. Its default tag is div and can be changed.
  - Not allowed in regular lists, Collection lists or links. Slots can be nested.
  - Deleting a slot deletes its content in every instance.
  - **Allowed components** restriction: set by the Designer role or higher, applies to Marketers. Restrictions apply only going forward.
- **Variants:**
  - One variant property per component, with unlimited variants. Created from the Navigator "Variants +", the canvas "+ Variant", or the Style panel.
  - **Base-variant styles are shared; styles set on another variant apply only to that variant.**
  - The default variant is set in the Properties panel. Conditionals can switch the variant.
- **Unlink instance** (right-click → **Unlink instance**): props become static settings, variants become styles, slots become elements. Instances inside rich text cannot be unlinked.
- **Libraries:**
  - A shared Library can share Webflow components, code components, AI code components, variables, fonts, tag styles and assets. It is shared from a **source site**.
  - **Shared Libraries per Workspace plan:**

    | Workspace plan | Shared Libraries |
    |---|---|
    | Starter | 0 |
    | Freelancer / Core / Growth | 1 each |
    | Agency / Enterprise | Unlimited |

  - Libraries cannot cross Workspaces. A site that is itself a Library cannot install other shared Libraries.
  - **Updates:** the source shares updates and changelog; the consumer gets a **blue dot** on the Libraries icon, then **Review changes** → **Accept all updates**. Bulk update runs from Workspace settings. Only admin/owner/Designer roles can accept.
  - Library variables, fonts, tag styles and assets are **read-only** on consumer sites.
  - Converting a Library component to a site component (right-click / Duplicate) stops it receiving updates.
  - **Auto-install** on new sites is Enterprise only.
- **Marketer visibility:** a component can be hidden from the Marketer role per component or per group. **Show for Marketers** is the per-component setting; Hide all / Show all for Marketers works per group.

**Not documented:** a separate "detach" distinct from Unlink (Unlink is the documented term); per-instance style overrides other than through props, variants or the class attribute.

## 9. Interactions with GSAP

**Documented (W08, W09, W26, W27, W28):**
- **Two versions:** **Interactions with GSAP** (the default on new sites, launched summer 2025) and **Classic Interactions**. Switch between them with a dropdown at the bottom of the Interactions panel.
- **Model:** trigger type → trigger target → action → action target. An animation is an action that changes over time.
- **Triggers:** Click, Hover, Mouse move (continuous, with Smooth ms and Rest state X/Y), Page load, Scroll, Custom event. GSAP interactions do **not** support element-specific triggers for navbar, tabs, dropdown or slider.
- **Targets:** element ID, class, attribute, or the initiating element.
  - **Simple scopes:** all matching, children, siblings, parent, next/previous sibling.
  - **Advanced scopes** (need a selector): descendants, ancestors, first descendant, first ancestor.
  - **Component scopes:** main component (all instances), variant(s), component instance (page-scoped).
- **Timeline:** sits at the bottom of the canvas. Actions are tracks and animations are blocks you drag for timing. Playback has play, pause, reverse, loop, speed and a scrubbing playhead. Settings cover repeat, infinite loop and yoyo. Keyboard nudges move 10ms or 100ms.
- **Presets:** "Save as preset", reused from the Interactions manager panel.
- **Hide action:** the eye icon keeps the action but skips it in preview and publish.
- **Delete interaction:** removes every instance of it site-wide.
- **Conditional playback:** page scoping; breakpoint cascade (same rules as styles); reduced-motion handling ("no animation" or "skip to end").
- **FOUC prevention:** automatic.
- Opening Interactions with GSAP exits expand canvas.
- **Libraries:** component-scoped interactions travel with Libraries; page-scoped ones do not.
- **Version comparison table (W09):**

  | Only in GSAP | Currently only in Classic |
  |---|---|
  | Horizontal timeline | Navbar/dropdown/tab/slider change events |
  | Realtime collaboration | Page branching |
  | Repeat/stagger/split-text actions | Creating interactions on non-primary locales |
  | Prefers-reduced-motion | Interactions included in DevLink component exports |
  | Granular scroll and click/hover settings | |
  | Advanced targeting | |
  | Presets | |
  | Instance-scoped interactions | |
  | Component canvas support | |

  (Read straight from the table HTML.)
- **Role:** "Toggle GSAP Core, plugins, and eases" is limited to Site manager and Designer (W58).

**Not documented in the sources read:** the detailed scroll-trigger parameters (start/end offsets, scrub). The actions article was not fetched; "granular scroll settings" is only named in W09.

## 10. CMS

**Documented (W29–W38, W11, W75, W72):**
- **Collection field types:**

  | Field | Notes |
  |---|---|
  | Plain text | |
  | Rich text | Inline links |
  | Image | Not from the Assets panel |
  | Multi-image | |
  | Video | URL |
  | Link | |
  | Email | |
  | Phone | |
  | Number | |
  | Date/Time | |
  | Switch | |
  | Color | |
  | Option | |
  | File | |
  | Reference | Same or another Collection, incl. Ecommerce |
  | **Multi-reference** | |

  - Fields can be duplicated and organized into **field groups**.
  - A used field cannot simply be deleted; there is a "used field" flow.
  - **Max 10 reference fields per Collection.**
- **Collection list anatomy:** wrapper, list, item, **Empty state**, Pagination. No other elements are allowed directly in the list.
- **Collection list settings:**
  - **Source** — to change it, first disconnect the bound fields.
  - **Type** — **Dynamic** or **Curated** (hand-picked, drag order). Filters, sort, pagination and limit are **dynamic only**.
  - **UI state** — toggles items vs empty state for styling only.
  - **Layout.**
- **Filters:** many rules per field type, combinable. Common uses: exclude the current item, show related items through a reference, featured items through a switch. Can bind to component props.
- **Sort:** multiple levels. Rules: number small→large, date old→new, switch on first, alphabetical (the article spells out character-order caveats). Custom sort means adding a number field.
- **Limit:** **Limit items**, then Show (≤100) and **Skip** (offset). Blank Show displays everything up to 100.
- **Pagination:** 1–100 items per page. Next/Prev controls. Site search indexes only the first page.
- **Display limits (W38):**
  - ≤**40 Collection lists per page**, including nested ones.
  - ≤**10 nested lists per page**, ≤**3 nesting levels**.
  - ≤100 items per list by default; ≤100 nested items per parent (W36).
  - **Collection lists cannot be nested inside components.**
- **Multi-reference:** a list bound to the multi-ref field shows only the referenced items, in the order chosen on the item. **No filter or sort** on those lists. Filter rules include "contains Current X" and "contains any X of current item".
- **Conditionals** (W37, the current name for conditional visibility):
  - Drive visibility, variants or text from rules on CMS fields, component props, the current variant, or locale data.
  - Output/fallback values; condition groups.
  - Work in components, in Collection lists and pages, and on static pages with Localize.
  - **Hidden elements are excluded from published HTML** unless **Keep in HTML when hidden** is set (Element settings > Advanced).
- **Collection page templates (W11):**
  - One template per Collection, under Pages panel > CMS Collection pages. Template pages show in **purple**.
  - Switch the previewed item from the top-bar item menu, or Shift+Opt/Alt+arrow.
  - On the canvas, static elements show **blue** outlines and CMS-bound ones **purple**. Bind by clicking the purple icon in Settings.
  - Static links cannot target Collection pages without a Collection list.
- **CMS limits by plan** (W75 static pricing HTML, W72):

  | Plan | CMS items | Collections |
  |---|---|---|
  | Starter | 50 | 20 |
  | Basic | none (no CMS) | — |
  | Premium | 20,000 | 40 |

  - CMS API: 60 RPM on Starter, 120 RPM on Premium.
  - Per-item, multi-item and scheduled publishing are Premium features in the pricing table.
  - *Limitation:* the comparison header in the static HTML labels the third column "Premier/CMS". Confirm in a rendered browser before relying on the exact numbers.

**Not documented here:** item-state UI (draft/staged/published) in detail; that article was not fetched.

## 11. Assets panel

**Documented (W07, W39, W40):**
- **Max upload size:** images **4MB**; documents and audio **10MB**; ZIP **25MB**. Uploading documents or audio needs a paid Workspace or Site plan.
- **Supported types** include Lottie JSON and dotLottie. dotLottie cannot be dropped straight onto the canvas.
- A "well-known" folder holds `/.well-known/` files.
- **Manage:**
  - Copy link, rename.
  - **Replace** updates the asset everywhere it is used.
  - Delete singly or in bulk; you must remove the usages first.
  - **Folders** (nested, mixed file types).
  - Search (by name only), filter, sort.
  - Expand the panel; grid or list view.
  - Compress JPG/PNG to AVIF/WebP.
- Images cannot be edited inside Webflow.
- Shared Library assets are managed only on the source site; **duplicate** one to get a local copy.
- **Alt text:** set on the asset (**Descriptive** or **Decorative**). Element instances inherit it and can override per instance (**Custom description** / **Decorative**). CMS images take dynamic alt text. Webflow AI can generate alt text.
- **Responsive images:**
  - Automatic `srcset`/`sizes` variants, created only for in-Webflow uploads (not CSV or API uploads).
  - Original images are used if they are already compressed enough.
  - Regenerate across the site with a shortcut.
  - Per-image **Disable responsiveness**.
  - Variants are computed from the normal state, not hover or interaction states.

## 12. Forms

**Documented (W41–W44, W75):**
- **Form block structure:** form wrapper with inputs and labels, Form button, **Success message**, **Error message**.
- **Elements:** Field label, Input, File upload, Text area, Checkbox, Radio, Select (multi allowed), reCAPTCHA, Form button. They must sit inside the wrapper.
- **Field settings:** Name, Required, Placeholder, Text type, Autofocus. The button has Text and **Loading** text.
- **Form settings:**
  - Name (default "Email Form").
  - **Normal / Success / Error** state editing.
  - **Send to** destinations: Webflow (default), Email notifications (default), webhooks, Apps, or **Custom action**. Custom action cannot be combined with Webflow or Email.
  - Redirects are mentioned.
- **Submissions:**
  - Kept in Site settings > Forms: counts and table; files appear as URLs.
  - **Export all** to CSV.
  - Delete singly or in bulk; deleting also removes the uploaded files.
  - Notification editor (To, Sender, Subject, variables), with **Reset to defaults** to restore site-level defaults.
  - On the **Starter** plan: max **5 recipients**, all Workspace members.
  - Starter **50 submissions/site**; Basic and up unlimited (W75).
- **Spam protection:** reCAPTCHA field; **Cloudflare Turnstile** bot blocking (site-wide, Site settings > Apps & Integrations; submit buttons show the Disabled state while it loads); spam filtering; honeypot through custom code.
- **File upload:**
  - Requires **Premium** (or legacy Business), Ecommerce Plus or Ecommerce Advanced.
  - Max **10MB**, 1 file per button, **≤20 upload buttons per form**.
  - Allowed-type restriction; executables are blocked.
  - Four states: Default, Uploading, Success, Error.

## 13. Pages, page settings, site settings, SEO/OG, custom code, redirects

**Documented (W12, W45–W49, W72, W75):**
- **Pages panel:**
  - Create a page (blank, from a template, or from Quick find). The Create button has an arrow for **draft**.
  - Folders; reorder (static pages only); search.
  - **Page deletion cannot be undone**; restore from a backup. The homepage cannot be deleted. Webflow recommends 301s for deleted pages.
  - Branched pages and template, User, Ecommerce, Collection and Utility pages don't count toward static page limits (**Starter 2**, **Basic 300**).
- **Page settings:**
  - Name, parent folder, slug, homepage.
  - **Password** (needs a Site plan).
  - **SEO settings**: title (under 60 characters recommended), meta description, sitemap indexing.
  - **Open Graph settings**: title, description, image from assets or URL.
  - Site search, RSS (Collection pages), head/body custom code.
  - Collection templates use **Add field** for dynamic SEO/OG. Dynamic OG images must share the same dimensions.
  - No site-wide SEO title/description and no meta keywords, by design.
  - AI SEO generation needs a paid plan.
- **Custom code:**
  - Site settings > Custom code (**Head code**, **Footer code**) and page settings (`<head>`, before `</body>`).
  - HTML, CSS and JS only; **50,000 characters** per field.
  - Requires a Core/Growth/Agency/Freelancer Workspace or an active Site plan. Site managers and Designers can add it; the Custom-code section is limited to Site manager and Designer (W58).
  - Shows in preview (custom-code toggle) but goes live only on publish.
- **Code Embed element:**
  - 50,000 characters. Can also sit in rich text and use **dynamic CMS fields**.
  - Open the code editor by double-click, Enter, the settings icon, or **Open code editor**.
  - The canvas previews `<iframe>`/`<style>`; `<script>` shows a placeholder.
  - Exclude code from preview with `<!-- EXCLUDE FROM PREVIEW: START/END -->`.
- **301 redirects** (Site settings > Publishing > 301 redirects):
  - Needs a paid Site or Workspace plan.
  - Wildcards / capture groups `(.*)` → `%1`, `%2`.
  - `%` escaping of special characters.
  - **Executed oldest-first**, so specific rules must be added before wildcards.
  - About 1,000 recommended as best practice (no hard limit).
  - CSV import/export.
  - The page must be deleted, drafted or re-slugged before redirecting its old path.
- **Site settings** hold: plans, custom code, forms, publishing/redirects, backups, apps & integrations, Advanced publishing (optimized publishing, SSL, minify, async JS, per-page CSS, secure frame headers — W74).

## 14. Publishing, staging, backups, versions, branching

**Documented (W10, W50, W51, W53, W54, W55, W73):**
- **Domains:**
  - Every site has a `*.webflow.io` **staging** subdomain. A **custom domain** (production) needs a Site plan and domain verification.
  - Publish dialog: check domains → **Publish to selected domains**. Shift+P opens it; Shift+Enter publishes.
  - Unpublish from all domains or a single domain. A site showcased on Made in Webflow cannot unpublish staging.
- **Who can publish:**
  - Non-Enterprise: Site manager, plus members with **Can publish** on.
  - Enterprise: Site manager, Designer, and custom roles (staging-only or staging + production).
  - CMS items: every role except reviewers (Enterprise adds further restrictions).
- **Publish a single page:**
  - **Team and Enterprise Platform plans** only, plus Can publish.
  - Publishes only that page and its locales.
  - Global changes (styles, components, variables, interactions) are flagged in the summary and apply only to that page.
  - No rollback, no unpublish, no scheduling.
  - One publish runs at a time (the UI shows who is publishing). Main branch only.
- **Publishing workflow** (Enterprise per W54; the pricing page lists "Publishing workflows" under **Team**):
  - Designer → Staging → Production.
  - Pre-publish change summary from the Activity log, attributed to teammates. Site settings are excluded except custom code.
  - Publish staging → production.
  - Custom staging domain.
- **Backups** (W50):
  - Created automatically on **every 50th autosave**, on every restore, and manually. No scheduled backups.
  - Paid Site plans keep unlimited backups. Starter restores only from the **two most recent** unless the Workspace is paid.
  - **Only Site managers** can access backups (W58).
  - A restore locks the site for everyone (W62).
  - **Restore side effects:** scheduled items become queued; reCAPTCHA keys must be re-added; bot blocking turns off; "Published on" dates update; comments stay but may become orphaned. IDs survive for backups made after 2024-03-25.
- **Site Activity log:** Enterprise only. Logs publishes, backups, page create/delete/duplicate/rename, and class/component/custom-code changes. Filterable.
- **Page branching** (Team and Enterprise Platform plans):
  - A branch is a working copy isolated from main. You can **pull updates** from main.
  - **Conflict resolution** per item (Main site or Branch).
  - Merge, then a full-site publish. Branches cannot be published directly.
  - Comments are **deleted on merge**.
  - A read-only share link is available.
  - Takeover is possible if the original designer is idle.
  - Components inside rich text are read-only on branches.
- **Versions / version history:** **not documented** as a feature separate from backups and restore.

## 15. Roles and permissions, modes

**Documented (W56–W61, W68, W52):**
- **Seats:**

  | Seat | Workspace roles | Site roles |
  |---|---|---|
  | Full | Admin, Site admin, Designer | Site manager, Designer |
  | Limited | Marketer, Content editor | Marketer, Content editor |
  | Client (service-provider plans) | — | Marketer, Content editor, Reviewer |
  | Free | Reviewer | Reviewer |
  | Freelancer/Agency Guest | Guest | Any |

  - Every Workspace has 1 owner seat plus 100 free reviewer seats.
- **Workspace roles:** Owner, Admin, Site manager, Designer, Marketer, Content editor, Reviewer, Guest. A matrix covers billing, membership, integrations, apps, API tokens and Library sharing. **Designer can share** Libraries.
- **Site roles:** Site manager (all site settings + design), Designer (design), **Marketer** (build pages with components), **Content editor** (content only), Reviewer (view + comment). Enterprise adds **Limited designer**, **Designer (needs approval)** and custom roles.
- **Key permission rows (W58):**

  | Permission | Allowed roles |
  |---|---|
  | Create components | Site manager, Designer |
  | Modify existing classes/components/variables | Site manager, Designer (Designer (needs approval) on branches) |
  | Create classes | Up to Limited designer |
  | Edit prop values / global component content | Down to Content editor |
  | Create Collections | Up to Limited designer |
  | Create, update, delete and publish items | Includes Marketer and Content editor |
  | Merge branches | Site manager, Designer, Limited designer, Designer (needs approval) with approval |
  | Custom code section | Site manager, Designer |
  | Backups, site API token | Site manager only |
  | Share/install Libraries, install Apps | Site manager, Designer |
  | Comments, preview | Everyone |

- **Modes:** the Designer API documents **sitemode = design | build** (W68). Help articles also name **design mode, build mode, edit mode** (W01, W24).
  - Content editors get a simplified interface: Pages, CMS, Assets, Settings, Activity log; comment; publish if allowed. They can open the site by adding **`?update`** to the URL.
  - Designers restrict which elements are editable through **Element settings > Editing permissions** (⌘⇧L toggles it). CMS-bound elements cannot be restricted.
  - **Preview role:** a designer can view as Marketer or Content editor and set it as the default for a site.
- **Page building:**
  - Designers create static **page templates** (≤40; not for Collection pages) and **Page slot** elements.
  - Marketers build from a template or a blank page (which contains a page slot). Without page slots they can only edit content.
- **Design approvals** (Enterprise): "Designer (needs approval)" and custom roles without "Make changes without approval" edit only on branches and **request review**. Site manager, Designer, Reviewer and custom roles with "Approve changes" can approve.
- **Concurrent content edits:** the last edit wins (W59).

## 16. Comments

**Documented (W15):**
- **Who can comment:** every Workspace role, including guests and reviewers.
- **Placement:** comments attach to an element at the current breakpoint. Comments on dynamic (CMS-bound) elements are per item.
- **Threads:** share a link; edit or delete your own comments; **resolve** and unresolve (with the Show resolved filter).
- **@mentions** send emails. Notification setting: all, replies only, or off.
- **Comments panel filters:** Only on this page, Show resolved. A blue dot marks unread threads.
- **When things are deleted:** deleting a page deletes its comments; deleting an element moves its comments to the parent.
- **Known limits:**
  - Accented characters are not supported.
  - Reviewers cannot comment on components or CMS-panel items.
  - Comments are not compatible with real-time collaboration (W62).
  - Comments are deleted when a branch merges (W51).

## 17. Quick find, shortcuts, undo, collaboration

**Documented (W14, W13, W62):**
- **Quick find:**
  - Opens with ⌘/Ctrl+E or ⌘/Ctrl+K.
  - Searches elements, components, layouts, assets, pages and Collection items, and runs actions: add to canvas (⌘/Ctrl+Enter adds a layout), select elements or classes, convert elements, navigate.
  - Default actions can be customized.
- **Shortcuts (selection):**
  - Undo ⌘Z / redo ⇧⌘Z. Copy/paste. Duplicate ⌘D or Opt+drag. Delete. Esc deselects.
  - ⇧⌘P preview. ⇧P publish. ⇧⌘S "Save as snapshot".
  - Panel letter keys (see §1).
  - Class shortcuts: ⌘Enter add, ⇧⌘Enter rename, ⌥⌘Enter duplicate, ⌥⇧Enter remove last class.
  - Arrow-key tree navigation.
  - Move element: `[` / `]`, ⌘[ / ⌘], ⌘⇧↑/↓ (out of parent).
- **Undo scope:**
  - Per user in real-time collaboration ("undo or redo their own actions").
  - Page deletion is not undoable.
  - AI-generated sections are undone with ⌘Z (W70).
- **Real-time collaboration:**
  - On all plans; up to **25 concurrent users**.
  - Presence avatars and coloured element outlines. **No live cursors.** Text syncs when the editor clicks out.
  - **Last write wins** on conflict.
  - Not compatible with Classic Interactions or comments.
  - Offline indicator ("You're offline").

## 18. Audit panel

**Documented (W63):**
- Opens with **U**. Checks run before publish.
- **Severity:** critical = red square; moderate = yellow triangle.
- **Accessibility checks (4):** missing alt text, non-descriptive link content, skipped heading level, duplicate element IDs.
- **SEO/AEO checks:** missing image alt, meta titles, meta descriptions, schema markup. Webflow AI can generate the missing content (paid plan).
- **Ignore** (silenced-bell icon) and **Unignore**.
- **Coverage gaps:** **does not audit inside components**, Lightbox media, or CMS-bound images.

## 19. Localization

**Documented (W64, W20, W37, W75):**
- **Locales:** a primary locale plus secondary locales. Secondaries **inherit everything** from the primary.
- **Overrides:** any per-locale override can be reset to re-inherit. Content, styles (the **Current locale** state), visibility, assets, CMS items/fields, page settings and SEO can all be localized.
- **Context bar** has a locale switcher.
- Conditionals can use locale data.
- AI translation draws on a monthly word allowance, then Webflow AI credits.
- **Not compatible with Ecommerce** Site-plan features.
- **Plans:**

  | Plan | Price | Locales | Words/month | Adds |
  |---|---|---|---|---|
  | **Localize Essential** | from $9/mo | 1–3 | 10,000 | — |
  | **Localize Advanced** | from $29/mo | 1–10 | 50,000 | Asset localization, localized URLs, automatic visitor routing (also on Enterprise) |

- Interactions on non-primary locales: Classic only (W09).

## 20. Apps and Designer API

**Documented (W65, W66, W67, W68):**
- **Apps:**
  - Installed from the Marketplace or the Apps panel (E).
  - Workspace-level authorization covers all current and future sites; revoking it for one site means revoking it for the whole Workspace.
  - Install and uninstall: Site manager and Designer (site); Owner, Admin, Site manager/Designer and Guest (Workspace).
- **APIs:**
  - REST APIs: Sites, Pages, Assets, CMS, Ecommerce, Users, Forms, Custom Code, Comments, Audit log.
  - **Designer APIs** are client-side JavaScript running in an iframe Designer Extension built with the Webflow CLI. They cover Elements, Styles, Components, Variables, Pages and extension utilities.
  - An MCP server is documented (`developers.webflow.com/_mcp/server`); the updates feed also mentions MCP.
- **App Modes:**
  - Every API method declares the *abilities* it needs across Locale (primary/secondary), Branch (main/branch), Workflow (canvas/preview) and Sitemode (design/build).
  - Examples: `canDesign` = primary + main + canvas + design; `canModifyVariables` = main + canvas + design.
  - Errors: `ModeForbidden` for the wrong mode; `Forbidden` for the wrong role, locale or branch.
  - `webflow.canForAppMode()` checks abilities in advance.

## 21. Webflow AI

**Documented (W69, W70, W71, W40, W63):**
- **Enable/disable:** Workspace Admin/Owner toggle.
- **Features:** AI site builder; AI Assistant for in-app help; AI Assistant **modify page designs**; copy generation; CMS item generation; alt-text generation; Audit-panel SEO/AEO fixes; Webflow AEO (Team/Enterprise); AI code components.
- **Modify page designs (public beta):**
  - Limited to some free templates and to AI-site-builder sites. Uses no credits.
  - Applies the site's existing classes and variables, creating new classes when needed.
  - Undo inside the chat; ⌘Z removes the section and its classes.
  - The panel can sit Right, Left or Floating.
- **Credits:**
  - Pooled per Workspace.

    | Workspace plan | AI credits |
    |---|---|
    | Starter | 200/month |
    | Core / Freelancer | 300/month |
    | Growth / Agency | 400/month |
    | Team | 100,000/year |
    | Enterprise | Custom |

  - No rollover. Add-on packs available. Running out never auto-upgrades the plan.
  - Copy generation needs a paid plan. CMS generation needs a plan that includes CMS.

## 22. Plan quick reference (webflow.com/pricing, static HTML, 2026-10-14)

- **Site plans:**

  | Plan | Price | Includes |
  |---|---|---|
  | **Starter** | Free | webflow.io, 2 static pages, 1GB bandwidth, 50 form submissions, limited CMS |
  | **Basic** | $15/mo billed yearly | Custom domain, 300 pages, 10GB, unlimited submissions, password protection |
  | **Premium** (new) | $25/mo billed yearly | CMS, bandwidth tiers 50GB–2.5TB, code components, site search, form file upload, well-known files |

- **Platform plans:**
  - **Team** ($2,500/mo, annual): Localize, AEO agents, publishing workflows, single-page publishing, Site activity log & API.
  - **Enterprise**: granular permissions, custom roles.
- **Seats:** Full (design/admin), Limited (edit content or build pages with components), Free.
- **Not read:** Ecommerce plan prices and limits and Workspace plan prices were not in the static HTML. Treat them as not captured.

---

## Source ledger

All rows retrieved 2026-10-14. "Updated" is the article's own last-updated stamp. For help.webflow.com rows, the limitation applies to every article: body read through the public Help Center JSON API because HTML returns 403; no hands-on test.

| ID | Title | URL | Updated | Retrieved | Topics | Limitations |
|---|---|---|---|---|---|---|
| W01 | Intro to Webflow | https://help.webflow.com/hc/en-us/articles/33961260162323-Intro-to-Webflow | 2026-09-15 | 2026-10-14 | 1, 3 | Breadcrumb location differs from W03 |
| W02 | Navigator | https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator | 2026-09-02 | 2026-10-14 | 2 | Drag accuracy not tested |
| W03 | Webflow canvas overview | https://help.webflow.com/hc/en-us/articles/33961319255059-Webflow-canvas-overview | 2026-09-02 | 2026-10-14 | 3 | Drag-indicator colour differs from W77 |
| W04 | Style panel overview | https://help.webflow.com/hc/en-us/articles/33961362040723-Style-panel-overview | 2026-09-08 | 2026-10-14 | 4 | — |
| W05 | Variables | https://help.webflow.com/hc/en-us/articles/33961268146323-Variables | 2026-09-21 | 2026-10-14 | 7 | No limits documented |
| W06 | Components overview | https://help.webflow.com/hc/en-us/articles/33961303934611-Components-overview | 2026-09-02 | 2026-10-14 | 8 | Duplicate-main statement is internally inconsistent |
| W07 | Assets panel | https://help.webflow.com/hc/en-us/articles/33961269934227-Assets-panel | 2026-06-02 | 2026-10-14 | 11 | — |
| W08 | Create and manage Interactions with GSAP | https://help.webflow.com/hc/en-us/articles/53580099234579-Create-and-manage-Interactions-with-GSAP | 2026-07-20 | 2026-10-14 | 9 | — |
| W09 | Interactions with GSAP vs. Classic Interactions | https://help.webflow.com/hc/en-us/articles/46300264646803-Interactions-with-GSAP-vs-Classic-Interactions | 2026-09-08 | 2026-10-14 | 9 | Table parsed from HTML |
| W10 | How do I publish or unpublish a Webflow site? | https://help.webflow.com/hc/en-us/articles/33961351954579-How-do-I-publish-or-unpublish-a-Webflow-site | 2026-08-04 | 2026-10-14 | 14 | No publish executed |
| W11 | Structure and style Collection pages | https://help.webflow.com/hc/en-us/articles/33961277976467-Structure-and-style-Collection-pages | 2025-08-05 | 2026-10-14 | 10 | Older article |
| W12 | Pages panel overview | https://help.webflow.com/hc/en-us/articles/33961360067987-Pages-panel-overview | 2025-10-03 | 2026-10-14 | 13 | Older article |
| W13 | Keyboard shortcuts in Webflow | https://help.webflow.com/hc/en-us/articles/33961359609875-Keyboard-shortcuts-in-Webflow | 2026-08-24 | 2026-10-14 | 3, 17 | Mac keys quoted |
| W14 | Quick find | https://help.webflow.com/hc/en-us/articles/33961382093587-Quick-find | 2026-07-16 | 2026-10-14 | 17 | — |
| W15 | Comments | https://help.webflow.com/hc/en-us/articles/33961339882131-Comments | 2026-09-02 | 2026-10-14 | 16 | — |
| W16 | Expand canvas to see all breakpoints at once | https://help.webflow.com/hc/en-us/articles/54857752965139-Expand-canvas-to-see-all-breakpoints-at-once | 2026-09-08 | 2026-10-14 | 5 | — |
| W17 | Classes | https://help.webflow.com/hc/en-us/articles/33961311094419-Classes | 2026-09-08 | 2026-10-14 | 4 | Still says "Style manager" |
| W18 | Style selectors panel | https://help.webflow.com/hc/en-us/articles/33961365722899-Style-selectors-panel | 2026-10-09 | 2026-10-14 | 4 | — |
| W19 | Breakpoints overview | https://help.webflow.com/hc/en-us/articles/33961300305811-Breakpoints-overview | 2026-09-08 | 2026-10-14 | 3, 5 | — |
| W20 | States | https://help.webflow.com/hc/en-us/articles/33961301727251-States | 2026-09-08 | 2026-10-14 | 6, 19 | No pseudo-elements or focus-within listed |
| W21 | Component properties | https://help.webflow.com/hc/en-us/articles/33961219350547-Component-properties | 2026-09-02 | 2026-10-14 | 8 | Long article; key sections read |
| W22 | Slots | https://help.webflow.com/hc/en-us/articles/33961195339923-Slots | 2026-09-08 | 2026-10-14 | 8 | — |
| W23 | Component variants | https://help.webflow.com/hc/en-us/articles/51307110086547-Component-variants | 2026-04-30 | 2026-10-14 | 8 | — |
| W24 | Component canvas | https://help.webflow.com/hc/en-us/articles/49505240420755-Component-canvas | 2026-07-31 | 2026-10-14 | 8, 15 | — |
| W25 | Libraries | https://help.webflow.com/hc/en-us/articles/33961343551763-Libraries | 2026-10-09 | 2026-10-14 | 4, 7, 8 | — |
| W26 | Intro to Interactions with GSAP | https://help.webflow.com/hc/en-us/articles/42832301823635-Intro-to-Interactions-with-GSAP | 2026-09-02 | 2026-10-14 | 9 | — |
| W27 | Triggers & targets in Interactions with GSAP | https://help.webflow.com/hc/en-us/articles/42832349989395-Triggers-targets-in-Interactions-with-GSAP | 2026-07-20 | 2026-10-14 | 9 | Scroll-trigger parameters not covered |
| W28 | Timeline in Interactions with GSAP | https://help.webflow.com/hc/en-us/articles/42861689104531-Timeline-in-Interactions-with-GSAP | 2026-07-20 | 2026-10-14 | 9 | — |
| W29 | Collection fields | https://help.webflow.com/hc/en-us/articles/33961390084499-Collection-fields | 2026-06-30 | 2026-10-14 | 10 | — |
| W30 | Multi-reference Collection field | https://help.webflow.com/hc/en-us/articles/33961260360083-Multi-reference-Collection-field | 2026-08-13 | 2026-10-14 | 10 | — |
| W31 | Collection list | https://help.webflow.com/hc/en-us/articles/33961294051347-Collection-list | 2025-08-05 | 2026-10-14 | 10 | Older article |
| W32 | Filter Collection lists | https://help.webflow.com/hc/en-us/articles/33961242538259-Filter-Collection-lists | 2025-06-24 | 2026-10-14 | 10 | Older article |
| W33 | Sort Collection lists | https://help.webflow.com/hc/en-us/articles/33961326669587-Sort-Collection-lists | 2025-05-15 | 2026-10-14 | 10 | Older article |
| W34 | Paginate Collection lists | https://help.webflow.com/hc/en-us/articles/33961307617683-Paginate-Collection-lists | 2025-06-24 | 2026-10-14 | 10 | Older article |
| W35 | Limit Collection lists | https://help.webflow.com/hc/en-us/articles/33961368695827-Limit-Collection-lists | 2025-07-29 | 2026-10-14 | 10 | Older article |
| W36 | Nest Collection lists | https://help.webflow.com/hc/en-us/articles/33961268936851-Nest-Collection-lists | 2026-04-09 | 2026-10-14 | 10 | — |
| W37 | Conditionals | https://help.webflow.com/hc/en-us/articles/33961320868115-Conditionals | 2026-07-02 | 2026-10-14 | 10, 19 | Long article; key sections read |
| W38 | Dynamic content limits | https://help.webflow.com/hc/en-us/articles/33961370432275-Dynamic-content-limits | 2026-10-06 | 2026-10-14 | 10 | — |
| W39 | Responsive images | https://help.webflow.com/hc/en-us/articles/33961378697107-Responsive-images | 2026-09-08 | 2026-10-14 | 11 | — |
| W40 | Include alt text on images | https://help.webflow.com/hc/en-us/articles/33961330170643-Include-alt-text-on-images | 2026-01-30 | 2026-10-14 | 11, 21 | — |
| W41 | How do I add forms in Webflow? | https://help.webflow.com/hc/en-us/articles/33961347548563-How-do-I-add-forms-in-Webflow | 2026-05-18 | 2026-10-14 | 12 | Redirect setting only mentioned |
| W42 | Form submissions | https://help.webflow.com/hc/en-us/articles/33961344521235-Form-submissions | 2026-08-01 | 2026-10-14 | 12 | — |
| W43 | Prevent spam in form submissions | https://help.webflow.com/hc/en-us/articles/34277758554771-Prevent-spam-in-form-submissions | 2025-10-31 | 2026-10-14 | 12 | — |
| W44 | Form file upload | https://help.webflow.com/hc/en-us/articles/33961307228947-Form-file-upload | 2026-05-13 | 2026-10-14 | 12 | — |
| W45 | Add SEO title and meta description | https://help.webflow.com/hc/en-us/articles/33961237278611-Add-SEO-title-and-meta-description | 2026-09-08 | 2026-10-14 | 13 | — |
| W46 | Control the look of social shares with Open Graph | https://help.webflow.com/hc/en-us/articles/33961370297107-Control-the-look-of-social-shares-with-Open-Graph | 2026-09-07 | 2026-10-14 | 13 | — |
| W47 | Custom code in head and body tags | https://help.webflow.com/hc/en-us/articles/33961357265299-Custom-code-in-head-and-body-tags | 2026-09-02 | 2026-10-14 | 13 | — |
| W48 | Custom code embed | https://help.webflow.com/hc/en-us/articles/33961332238611-Custom-code-embed | 2026-09-02 | 2026-10-14 | 13 | — |
| W49 | How do I set up redirects in Webflow? | https://help.webflow.com/hc/en-us/articles/33961294898835-How-do-I-set-up-redirects-in-Webflow | 2026-09-08 | 2026-10-14 | 13 | — |
| W50 | Save and restore backups | https://help.webflow.com/hc/en-us/articles/33961244069395-Save-and-restore-backups | 2026-07-02 | 2026-10-14 | 14 | Uses legacy plan names |
| W51 | Page branching | https://help.webflow.com/hc/en-us/articles/46651751861139-Page-branching | 2026-09-18 | 2026-10-14 | 14, 15 | — |
| W52 | Design approvals | https://help.webflow.com/hc/en-us/articles/46651772348947-Design-approvals | 2025-11-18 | 2026-10-14 | 15 | Says Enterprise only |
| W53 | Publish a single page | https://help.webflow.com/hc/en-us/articles/50064706725395-Publish-a-single-page | 2026-08-10 | 2026-10-14 | 14 | — |
| W54 | Publishing workflow | https://help.webflow.com/hc/en-us/articles/46651740529811-Publishing-workflow | 2026-10-07 | 2026-10-14 | 14 | Says Enterprise; pricing lists it under Team |
| W55 | Site Activity log | https://help.webflow.com/hc/en-us/articles/46651707969043-Site-Activity-log | 2026-10-09 | 2026-10-14 | 14 | — |
| W56 | Seats, roles, and permissions overview | https://help.webflow.com/hc/en-us/articles/33961273067411-Seats-roles-and-permissions-overview | 2026-10-05 | 2026-10-14 | 15 | — |
| W57 | Workspace roles and permissions | https://help.webflow.com/hc/en-us/articles/41015530193811-Workspace-roles-and-permissions | 2026-09-02 | 2026-10-14 | 15 | Tables parsed from HTML |
| W58 | Site roles and permissions | https://help.webflow.com/hc/en-us/articles/41015796747667-Site-roles-and-permissions | 2026-08-03 | 2026-10-14 | 9, 13, 14, 15 | Tables parsed from HTML; a few cells truncated |
| W59 | Edit site content as a content editor | https://help.webflow.com/hc/en-us/articles/33961251014931-Edit-site-content-as-a-content-editor | 2026-09-02 | 2026-10-14 | 15 | — |
| W60 | Page building | https://help.webflow.com/hc/en-us/articles/33961210206483-Page-building | 2026-04-01 | 2026-10-14 | 15 | — |
| W61 | Preview your site as another site role | https://help.webflow.com/hc/en-us/articles/48419307967507-Preview-your-site-as-another-site-role | 2026-05-12 | 2026-10-14 | 15 | — |
| W62 | Real-time collaboration | https://help.webflow.com/hc/en-us/articles/43232037920275-Real-time-collaboration | 2026-07-17 | 2026-10-14 | 14, 16, 17 | — |
| W63 | Intro to the Audit panel | https://help.webflow.com/hc/en-us/articles/33961313088531-Intro-to-the-Audit-panel | 2026-03-26 | 2026-10-14 | 18 | — |
| W64 | Webflow Localize overview | https://help.webflow.com/hc/en-us/articles/33961240752147-Webflow-Localize-overview | 2026-09-29 | 2026-10-14 | 19 | Sub-articles not read |
| W65 | Intro to Webflow's APIs | https://help.webflow.com/hc/en-us/articles/33961356296723-Intro-to-Webflow-s-APIs | 2026-07-16 | 2026-10-14 | 20 | — |
| W66 | Webflow Apps overview | https://help.webflow.com/hc/en-us/articles/33961266872211-Webflow-Apps-overview | 2026-07-02 | 2026-10-14 | 20 | — |
| W67 | Designer API — Introduction | https://developers.webflow.com/designer/reference/introduction | n/a | 2026-10-14 | 20 | Read via `.md` variant |
| W68 | Designer API — App Modes | https://developers.webflow.com/designer/reference/app-modes | n/a | 2026-10-14 | 15, 20 | Read via `.md` variant |
| W69 | Webflow AI overview | https://help.webflow.com/hc/en-us/articles/34297897805715-Webflow-AI-overview | 2026-05-21 | 2026-10-14 | 21 | — |
| W70 | Modify page designs with the Webflow AI Assistant | https://help.webflow.com/hc/en-us/articles/34205154436243-Modify-page-designs-with-the-Webflow-AI-Assistant | 2026-07-31 | 2026-10-14 | 17, 21 | Beta |
| W71 | Webflow AI credits | https://help.webflow.com/hc/en-us/articles/51060121155347-Webflow-AI-credits | 2026-09-29 | 2026-10-14 | 21 | — |
| W72 | Choose a Site plan | https://help.webflow.com/hc/en-us/articles/33961232582419-Choose-a-Site-plan | 2026-08-02 | 2026-10-14 | 10, 13, 22 | — |
| W73 | Preview mode | https://help.webflow.com/hc/en-us/articles/40881969908627-Preview-mode | 2026-09-08 | 2026-10-14 | 3, 14 | — |
| W74 | Advanced publishing options | https://help.webflow.com/hc/en-us/articles/33961287288339-Advanced-publishing-options | 2026-06-24 | 2026-10-14 | 13 | Headings only |
| W75 | Webflow pricing | https://webflow.com/pricing | n/a | 2026-10-14 | 10, 12, 13, 19, 22 | Static HTML only: interactive table columns are ambiguous; Ecommerce and Workspace prices not captured; WebFetch failed (header overflow), read via curl |
| W76 | Webflow updates | https://webflow.com/updates | n/a | 2026-10-14 | 1, 8 | First page of the feed only (latest entries, through 2026-10-13) |
| W77 | The Add panel | https://help.webflow.com/hc/en-us/articles/33961270096659-The-Add-panel | 2025-06-27 | 2026-10-14 | 1, 3 | Older article; indicator colours conflict with W03 |

### Known source conflicts (do not resolve without hands-on verification)

1. **Breadcrumb location:** under the canvas at the bottom right (W03) vs in the canvas bar (W01).
2. **Drag parent indicator:** blue outline and label (W03, 2026) vs orange (W77, 2025).
3. **Duplicating a main component:** "not natively possible" vs a documented Duplicate action (both in W06).
4. **Publishing workflow plan:** Enterprise only (W54) vs listed under the Team plan (W75).
5. **Plan names:** Premium vs "CMS/Business" across articles (W50, W44, W75).
