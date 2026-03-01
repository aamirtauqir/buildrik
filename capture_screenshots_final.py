"""
capture_screenshots_final.py — Full coverage final pass

Targets:
1. Apply a template to get real canvas content
2. Template Replace modal (before confirming apply)
3. Apply progress overlay (during template apply)
4. Canvas with rich template content
5. Canvas multiselect (2+ elements)
6. Create component modal (right-click element)
7. Inspector with image element → media library picker
8. Project settings modal (from project menu)
9. Settings Integrations (locked screen)
10. Topbar complete state (all elements visible)
"""

import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page: Page, fn: str, clip=None, full_page=False) -> None:
    page.wait_for_timeout(800)
    path = str(OUTPUT_DIR / fn)
    kwargs = {"path": path}
    if clip:
        kwargs["clip"] = clip
    if full_page:
        kwargs["full_page"] = True
    page.screenshot(**kwargs)
    print(f"  ✓ {fn}")


def add_manifest(fn: str, section: str, state: str, how: str) -> None:
    try:
        data = json.loads(manifest_path.read_text())
    except Exception:
        data = []
    for i, item in enumerate(data):
        if item["file"] == fn:
            data[i] = {"file": fn, "section": section, "state": state, "how_to_reproduce": how}
            manifest_path.write_text(json.dumps(data, indent=2))
            return
    data.append({"file": fn, "section": section, "state": state, "how_to_reproduce": how})
    manifest_path.write_text(json.dumps(data, indent=2))


def click_rail(page: Page, tab_id: str) -> None:
    page.click(f'[id="rail-tab-{tab_id}"]', timeout=5000)
    page.wait_for_timeout(800)


def enter_editor(page: Page) -> None:
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(1500)
    try:
        page.click("text=Open", timeout=5000)
        page.wait_for_load_state("networkidle", timeout=15000)
        page.wait_for_timeout(2000)
    except Exception:
        pass


def get_canvas_elements(page: Page) -> list:
    return page.evaluate("""() => {
        return Array.from(document.querySelectorAll('[data-aqb-type], [data-aqb-id]'))
            .map(el => {
                const r = el.getBoundingClientRect();
                return {
                    x: r.x, y: r.y, w: r.width, h: r.height,
                    type: el.getAttribute('data-aqb-type') || '',
                    id: el.getAttribute('data-aqb-id') || ''
                };
            })
            .filter(e => e.w > 10 && e.h > 10 && e.x > 60 && e.x < 1100);
    }""")


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, slow_mo=30)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()
        enter_editor(page)

        # ══════════════════════════════════════════════════════
        # STEP 1: Apply a template to fill canvas with content
        # ══════════════════════════════════════════════════════
        print("\n[1] Select template + capture Replace modal")
        try:
            click_rail(page, "templates")
            page.wait_for_timeout(600)

            # Click first NON-locked template card to select it
            result = page.evaluate("""() => {
                const cards = Array.from(document.querySelectorAll('.tcard:not(.tcard--locked)'));
                if (!cards.length) return null;
                const c = cards[0];
                const r = c.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  First free template: {result}")

            if result:
                # Click the card to select it (not the Preview button — click the card itself)
                page.mouse.click(result["x"] + result["w"]/2, result["y"] + result["h"]/2)
                page.wait_for_timeout(600)

                # Confirm selection happened
                selected = page.evaluate("""() => {
                    const sel = document.querySelector('.tcard--sel');
                    return sel ? sel.getAttribute('data-id') : null;
                }""")
                print(f"  Selected template: {selected}")

                # Now click "Use This →" nudge button
                nudge = page.evaluate("""() => {
                    const btn = document.querySelector('.tpl-nudge-btn');
                    if (!btn) return null;
                    const r = btn.getBoundingClientRect();
                    return {x: r.x, y: r.y, w: r.width, h: r.height, disabled: btn.disabled, text: btn.textContent.trim()};
                }""")
                print(f"  Nudge button: {nudge}")

                if nudge and not nudge.get("disabled"):
                    page.mouse.click(nudge["x"] + nudge["w"]/2, nudge["y"] + nudge["h"]/2)
                    page.wait_for_timeout(1000)

                    # Check what appeared — Replace modal or progress overlay
                    state = page.evaluate("""() => {
                        const hasReplace = !!document.querySelector('.tmpl-replace-modal, [class*="replace-modal"], [class*="ReplaceModal"]');
                        const hasProgress = !!document.querySelector('[class*="progress"], [class*="ApplyProgress"]');
                        const hasTplShell = !!document.querySelector('.tpl-shell');
                        const tplChildren = Array.from(document.querySelector('.tpl-shell')?.children || []).map(c => c.className.toString().slice(0, 50));
                        return {hasReplace, hasProgress, tplChildren};
                    }""")
                    print(f"  State after nudge click: {state}")

                    # Screenshot whatever appeared
                    if state.get("hasReplace"):
                        shoot(page, "0137-templates-replace-modal.png")
                        add_manifest("0137-templates-replace-modal.png", "Templates", "Replace confirmation modal", "Select template → click 'Use This →' → Replace modal (canvas has content)")
                        # Click Apply
                        for sel in ['button:has-text("Apply")', 'button:has-text("Replace")', 'button:has-text("Continue")', '.tmpl-replace-modal button']:
                            try:
                                if page.locator(sel).first.is_visible(timeout=1500):
                                    page.locator(sel).first.click()
                                    page.wait_for_timeout(600)
                                    # Capture progress overlay
                                    prog = page.evaluate("() => !!document.querySelector('[class*=\"progress\"], [class*=\"Progress\"]')")
                                    if prog:
                                        shoot(page, "0139-templates-apply-progress.png")
                                        add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Click Apply in Replace modal → progress bar shows")
                                    break
                            except Exception:
                                continue
                    elif state.get("hasProgress"):
                        shoot(page, "0139-templates-apply-progress.png")
                        add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Click 'Use This →' (no existing content) → progress bar")
                    else:
                        shoot(page, "0137-templates-apply-modal-state.png")
                        add_manifest("0137-templates-apply-modal-state.png", "Templates", "Template apply state", "After clicking 'Use This →'")

                    # Wait for apply to complete (progress auto-completes)
                    page.wait_for_timeout(3000)

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ══════════════════════════════════════════════════════
        # STEP 2: Check canvas state after template apply
        # ══════════════════════════════════════════════════════
        print("\n[2] Canvas state after template apply")
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)

            # Click somewhere on canvas to deselect
            page.mouse.click(720, 400)
            page.wait_for_timeout(400)

            shoot(page, "0100b-editor-after-template.png")
            add_manifest("0100b-editor-after-template.png", "Editor", "Editor with template content applied", "After applying a template — canvas shows real content")

            # Count canvas elements
            els = get_canvas_elements(page)
            print(f"  Canvas elements: {len(els)}")
            for e in els[:10]:
                print(f"    {e}")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ══════════════════════════════════════════════════════
        # STEP 3: Canvas multiselect with real elements
        # ══════════════════════════════════════════════════════
        print("\n[3] Canvas multiselect")
        try:
            els = get_canvas_elements(page)
            print(f"  Available canvas elements: {len(els)}")

            # Filter to visible, reasonably-sized elements that differ from each other
            clickable = [e for e in els if e["w"] > 30 and e["h"] > 10]
            print(f"  Clickable elements: {len(clickable)}")

            if len(clickable) >= 2:
                e0, e1 = clickable[0], clickable[1]
                # Select first
                page.mouse.click(e0["x"] + e0["w"]/2, e0["y"] + e0["h"]/2)
                page.wait_for_timeout(400)
                # Shift-click second
                page.keyboard.down("Shift")
                page.mouse.click(e1["x"] + e1["w"]/2, e1["y"] + e1["h"]/2)
                page.keyboard.up("Shift")
                page.wait_for_timeout(700)
                shoot(page, "0303-canvas-multiselect.png")
                add_manifest("0303-canvas-multiselect.png", "Canvas", "Multi-select (2 elements)", "Shift+click 2 elements → blue selection borders on both")
                shoot(page, "0406-inspector-multiselect-toolbar.png")
                add_manifest("0406-inspector-multiselect-toolbar.png", "Inspector", "Inspector multi-select toolbar", "2+ elements selected → inspector shows alignment/distribution controls")
                page.keyboard.press("Escape")

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.up("Shift")

        # ══════════════════════════════════════════════════════
        # STEP 4: Create Component modal
        # ══════════════════════════════════════════════════════
        print("\n[4] Create Component modal")
        try:
            els = get_canvas_elements(page)
            clickable = [e for e in els if e["w"] > 50 and e["h"] > 20]

            if clickable:
                e = clickable[0]
                # Select the element
                page.mouse.click(e["x"] + e["w"]/2, e["y"] + e["h"]/2)
                page.wait_for_timeout(400)
                # Right-click to open context menu
                page.mouse.click(e["x"] + e["w"]/2, e["y"] + e["h"]/2, button="right")
                page.wait_for_timeout(600)

                # Screenshot context menu
                shoot(page, "0305b-canvas-element-context-menu-rich.png")
                add_manifest("0305b-canvas-element-context-menu-rich.png", "Canvas", "Element context menu on rich content", "Right-click template element → full context menu")

                # Look for "Create component" or "Component" option
                ctx_items = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"], [class*="context-menu"] li, [class*="contextMenu"] button, [class*="menu-item"]'))
                        .map(el => ({
                            text: el.textContent.trim(),
                            x: Math.round(el.getBoundingClientRect().x),
                            y: Math.round(el.getBoundingClientRect().y)
                        }));
                }""")
                print(f"  Context menu items: {ctx_items}")

                comp_item = next((i for i in ctx_items if "component" in i.get("text", "").lower()), None)
                if comp_item:
                    page.mouse.click(comp_item["x"] + 5, comp_item["y"] + 5)
                    page.wait_for_timeout(800)
                    shoot(page, "0505-modal-create-component.png")
                    add_manifest("0505-modal-create-component.png", "Modals", "Create Component modal", "Right-click element → Create Component → modal opens")
                    page.keyboard.press("Escape")
                else:
                    page.keyboard.press("Escape")
                    print("  → No 'Create component' in context menu")

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ══════════════════════════════════════════════════════
        # STEP 5: Inspector with image element → media picker
        # ══════════════════════════════════════════════════════
        print("\n[5] Inspector image element + media library picker")
        try:
            # Find an image element on canvas
            img_el = page.evaluate("""() => {
                const imgEls = Array.from(document.querySelectorAll('[data-aqb-type="image"], img, [class*="image"]'));
                for (const el of imgEls) {
                    const r = el.getBoundingClientRect();
                    if (r.width > 20 && r.height > 20 && r.x > 60 && r.x < 1100) {
                        return {x: r.x, y: r.y, w: r.width, h: r.height};
                    }
                }
                return null;
            }""")
            print(f"  Image element: {img_el}")

            if img_el:
                page.mouse.click(img_el["x"] + img_el["w"]/2, img_el["y"] + img_el["h"]/2)
                page.wait_for_timeout(700)

                # Inspector should show image properties
                shoot(page, "0401c-inspector-image-element.png")
                add_manifest("0401c-inspector-image-element.png", "Inspector", "Inspector with image element selected", "Click image on canvas → inspector shows image controls")

                # Look for media picker button in inspector
                media_btn = page.evaluate("""() => {
                    const insp = document.querySelector('.layout-shell__inspector');
                    if (!insp) return null;
                    const btns = Array.from(insp.querySelectorAll('button'));
                    const mediaBtn = btns.find(b => {
                        const t = b.textContent.trim().toLowerCase();
                        const a = (b.getAttribute('aria-label') || '').toLowerCase();
                        return t.includes('media') || t.includes('image') || t.includes('upload') || t.includes('choose') || t.includes('pick') || a.includes('media') || a.includes('image');
                    });
                    if (!mediaBtn) return null;
                    const r = mediaBtn.getBoundingClientRect();
                    return {text: mediaBtn.textContent.trim(), x: r.x, y: r.y, w: r.width, h: r.height};
                }""")
                print(f"  Media picker button: {media_btn}")

                if media_btn:
                    page.mouse.click(media_btn["x"] + media_btn["w"]/2, media_btn["y"] + media_btn["h"]/2)
                    page.wait_for_timeout(1000)
                    shoot(page, "0503-modal-media-library.png")
                    add_manifest("0503-modal-media-library.png", "Modals", "Media library picker (from inspector)", "Select image element → click pick image in inspector → media library opens")
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(400)

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ══════════════════════════════════════════════════════
        # STEP 6: Project settings modal
        # ══════════════════════════════════════════════════════
        print("\n[6] Project settings modal")
        try:
            # Click project name/brand button
            page.click('button.brand, [aria-label="Project menu"]', timeout=3000)
            page.wait_for_timeout(700)

            # Look for Settings option in dropdown
            menu_items = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('button, [role="menuitem"], li')).filter(el => {
                    const r = el.getBoundingClientRect();
                    const t = el.textContent.trim().toLowerCase();
                    return r.width > 50 && r.height > 10 && (t.includes('setting') || t.includes('rename') || t.includes('project') || t.includes('properties'));
                }).map(el => ({
                    text: el.textContent.trim(),
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y)
                }));
            }""")
            print(f"  Project menu items: {menu_items}")

            # Screenshot the open project menu
            shoot(page, "0205-topbar-project-menu.png")
            add_manifest("0205-topbar-project-menu.png", "Topbar", "Project menu dropdown open", "Click project name → dropdown menu with project options")

            settings_item = next((i for i in menu_items if "setting" in i.get("text", "").lower() or "properties" in i.get("text", "").lower()), None)
            if settings_item:
                page.mouse.click(settings_item["x"] + 5, settings_item["y"] + 5)
                page.wait_for_timeout(800)
                shoot(page, "0501-modal-project-settings.png")
                add_manifest("0501-modal-project-settings.png", "Modals", "Project settings modal", "Click project name → Settings → modal opens")
                page.keyboard.press("Escape")
            else:
                page.keyboard.press("Escape")

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ══════════════════════════════════════════════════════
        # STEP 7: Inspector sections expanded/collapsed
        # ══════════════════════════════════════════════════════
        print("\n[7] Inspector sections detail")
        try:
            # Select an element
            els = get_canvas_elements(page)
            if els:
                e = [x for x in els if x["w"] > 50][0]
                page.mouse.click(e["x"] + e["w"]/2, e["y"] + e["h"]/2)
                page.wait_for_timeout(600)

                # Go to Style tab: coords x=1273, y=294 from recon
                page.mouse.click(1273 + 5, 294 + 5)
                page.wait_for_timeout(600)

                # Scroll inspector to see more sections
                insp = page.evaluate("() => { const el = document.querySelector('.layout-shell__inspector'); return el ? {scrollTop: el.scrollTop, scrollHeight: el.scrollHeight} : null; }")
                print(f"  Inspector scroll: {insp}")

                # Take full clip of inspector
                insp_rect = page.evaluate("() => { const el = document.querySelector('.layout-shell__inspector'); if (!el) return null; const r = el.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }")
                if insp_rect:
                    shoot(page, "0402c-inspector-style-tab-full.png", clip={"x": insp_rect["x"], "y": insp_rect["y"], "width": insp_rect["w"], "height": insp_rect["h"]})
                    add_manifest("0402c-inspector-style-tab-full.png", "Inspector", "Inspector Style tab — full panel crop", "Element selected → Style tab → full inspector panel")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ══════════════════════════════════════════════════════
        # STEP 8: Layers panel with rich tree content
        # ══════════════════════════════════════════════════════
        print("\n[8] Layers panel with rich tree")
        try:
            click_rail(page, "layers")
            page.wait_for_timeout(700)
            shoot(page, "0720b-layers-panel-rich.png")
            add_manifest("0720b-layers-panel-rich.png", "Layers", "Layers tree with template content", "Layers panel with rich element tree from applied template")

            # Expand a layer item
            expand_btns = page.evaluate("""() => {
                const drawer = document.querySelector('.layout-shell__drawer');
                if (!drawer) return [];
                return Array.from(drawer.querySelectorAll('button, [class*="expand"], [class*="toggle"], [class*="chevron"]'))
                    .filter(el => {
                        const r = el.getBoundingClientRect();
                        return r.width > 5 && r.width < 30 && r.height > 5 && r.height < 30;
                    })
                    .slice(0, 3)
                    .map(el => ({x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y)}));
            }""")
            print(f"  Expand buttons: {expand_btns}")

            if expand_btns:
                page.mouse.click(expand_btns[0]["x"] + 5, expand_btns[0]["y"] + 5)
                page.wait_for_timeout(400)
                shoot(page, "0721-layers-panel-expanded.png")
                add_manifest("0721-layers-panel-expanded.png", "Layers", "Layers panel with node expanded", "Click expand arrow on layer row → shows child elements")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ══════════════════════════════════════════════════════
        # STEP 9: Canvas with template — right panel full state
        # ══════════════════════════════════════════════════════
        print("\n[9] Full editor with template — all panels")
        try:
            # Open pages panel and screenshot full editor
            click_rail(page, "pages")
            page.wait_for_timeout(500)
            # Select an element so inspector is populated
            els = get_canvas_elements(page)
            if els:
                e = [x for x in els if x["w"] > 80][0]
                page.mouse.click(e["x"] + e["w"]/2, e["y"] + e["h"]/2)
                page.wait_for_timeout(400)
            shoot(page, "0100c-editor-full-state.png")
            add_manifest("0100c-editor-full-state.png", "Editor", "Editor full state: sidebar + canvas + inspector all populated", "Template applied, element selected, Pages panel open")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ══════════════════════════════════════════════════════
        # STEP 10: Icon picker modal (if accessible)
        # ══════════════════════════════════════════════════════
        print("\n[10] Icon picker modal")
        try:
            # Look for icon elements on canvas
            icon_el = page.evaluate("""() => {
                const icons = Array.from(document.querySelectorAll('[data-aqb-type="icon"], svg[data-aqb-id], [class*="icon-el"]'));
                for (const el of icons) {
                    const r = el.getBoundingClientRect();
                    if (r.width > 10 && r.height > 10 && r.x > 60 && r.x < 1100) {
                        return {x: r.x, y: r.y, w: r.width, h: r.height};
                    }
                }
                return null;
            }""")
            print(f"  Icon element: {icon_el}")

            if icon_el:
                page.mouse.click(icon_el["x"] + icon_el["w"]/2, icon_el["y"] + icon_el["h"]/2)
                page.wait_for_timeout(600)

                # Look for "Change icon" or icon picker button in inspector
                icon_btn = page.evaluate("""() => {
                    const insp = document.querySelector('.layout-shell__inspector');
                    if (!insp) return null;
                    const btns = Array.from(insp.querySelectorAll('button'));
                    const b = btns.find(b => {
                        const t = (b.textContent.trim() + b.getAttribute('aria-label')).toLowerCase();
                        return t.includes('icon') || t.includes('change');
                    });
                    if (!b) return null;
                    const r = b.getBoundingClientRect();
                    return {text: b.textContent.trim(), x: r.x, y: r.y, w: r.width, h: r.height};
                }""")
                print(f"  Icon picker button: {icon_btn}")

                if icon_btn:
                    page.mouse.click(icon_btn["x"] + icon_btn["w"]/2, icon_btn["y"] + icon_btn["h"]/2)
                    page.wait_for_timeout(800)
                    shoot(page, "0504-modal-icon-picker.png")
                    add_manifest("0504-modal-icon-picker.png", "Modals", "Icon picker modal", "Select icon element → click change icon in inspector → icon picker opens")
                    page.keyboard.press("Escape")

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ══════════════════════════════════════════════════════
        # STEP 11: Topbar — Publish button state
        # ══════════════════════════════════════════════════════
        print("\n[11] Topbar Publish button")
        try:
            # Just take a clean topbar screenshot
            shoot(page, "0200b-topbar-with-content.png", clip={"x": 0, "y": 0, "width": 1440, "height": 60})
            add_manifest("0200b-topbar-with-content.png", "Topbar", "Topbar with template content applied", "Topbar strip showing all controls after template apply")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ══════════════════════════════════════════════════════
        # STEP 12: Design system after template — tokens populated
        # ══════════════════════════════════════════════════════
        print("\n[12] Design system with template tokens")
        try:
            click_rail(page, "design")
            page.wait_for_timeout(700)
            shoot(page, "0160b-design-colors-after-template.png")
            add_manifest("0160b-design-colors-after-template.png", "Design System", "Design System colors after template apply", "Design System tab after template applied — shows template color tokens")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ══════════════════════════════════════════════════════
        # STEP 13: Publish tab — fresh state after template
        # ══════════════════════════════════════════════════════
        print("\n[13] Final editor full state")
        try:
            # Open publish section from settings
            click_rail(page, "settings")
            page.wait_for_timeout(600)

            # Look for Publish card in settings
            pub_card = page.evaluate("""() => {
                const cards = Array.from(document.querySelectorAll('button, [class*="card"], [class*="feature"]'))
                    .filter(el => {
                        const t = el.textContent.toLowerCase();
                        const r = el.getBoundingClientRect();
                        return (t.includes('publish') || t.includes('deploy') || t.includes('launch') || t.includes('domain')) && r.width > 100;
                    });
                return cards.map(el => ({text: el.textContent.trim().slice(0, 30), x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y)}));
            }""")
            print(f"  Publish/deploy cards: {pub_card}")

        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    # ── Regenerate manifest + README ──────────────────────────────────────────
    print("\n\nRegenerating manifest + README...")

    all_pngs = sorted(OUTPUT_DIR.glob("*.png"), key=lambda p: p.name)
    try:
        existing_manifest = {item["file"]: item for item in json.loads(manifest_path.read_text())}
    except Exception:
        existing_manifest = {}

    final = []
    for png in all_pngs:
        fn = png.name
        if fn in existing_manifest:
            final.append(existing_manifest[fn])
        else:
            final.append({"file": fn, "section": "Other", "state": fn.replace(".png", ""), "how_to_reproduce": f"Auto-captured: {fn}"})

    manifest_path.write_text(json.dumps(final, indent=2))

    # Write README
    sections: dict[str, list] = {}
    for item in final:
        sections.setdefault(item.get("section", "Other"), []).append(item)

    section_order = ["Entry", "Editor", "Topbar", "Left Rail", "Left Sidebar", "Templates", "Pages",
                     "Media", "Design System", "Settings", "Publish", "Canvas Footer", "Canvas",
                     "Inspector", "Modals", "Notifications", "Empty States", "Layers", "History", "Other"]
    ordered = {s: sections.pop(s) for s in section_order if s in sections}
    ordered.update(sections)

    readme = ["# Aquibra Editor — Complete Screenshot Library", "",
              f"> **Total screenshots:** {len(final)}  ",
              f"> **Generated:** {time.strftime('%Y-%m-%d %H:%M')}  ",
              "> **Viewport:** 1440×900 · Chromium headless · Dark mode", "",
              "## Quick Index", ""]
    for s, items in ordered.items():
        anchor = s.lower().replace(" ", "-").replace("/", "")
        readme.append(f"- [{s} ({len(items)})](#{anchor})")
    readme += ["", "---", ""]
    for s, items in ordered.items():
        readme += [f"## {s}", "", "| File | State | How to Reproduce |", "|------|-------|-----------------|"]
        for item in items:
            readme.append(f"| [`{item['file']}`]({item['file']}) | {item['state']} | {item['how_to_reproduce']} |")
        readme.append("")

    (OUTPUT_DIR / "README.md").write_text("\n".join(readme))

    print(f"\n{'='*60}")
    print(f"FINAL PASS COMPLETE!")
    print(f"  Screenshots: {len(final)}")
    print(f"  Manifest: manifest.json ({len(final)} entries)")
    print(f"  Index: README.md")
    print(f"  Location: {OUTPUT_DIR}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
