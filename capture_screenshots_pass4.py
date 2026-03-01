"""
Pass 4 — Final targeted captures:
- Inspector pseudostate dropdown (Default/:hover/:focus/:active)
- Inspector color picker (in Style tab)
- Inspector multiselect toolbar
- Media type filter pills
- Project menu dropdown
- Topbar undo/redo area close-up
- Templates preview modal
"""

import json
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page: Page, fn: str, clip=None) -> None:
    page.wait_for_timeout(700)
    kwargs = {"path": str(OUTPUT_DIR / fn)}
    if clip:
        kwargs["clip"] = clip
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
    page.wait_for_timeout(700)


def enter_editor(page: Page) -> None:
    page.goto(BASE_URL, wait_until="networkidle")
    page.wait_for_timeout(1500)
    try:
        page.click("text=Open", timeout=5000)
        page.wait_for_load_state("networkidle", timeout=15000)
        page.wait_for_timeout(2000)
    except Exception:
        pass


def select_canvas_element(page: Page) -> bool:
    """Select the root page element on the canvas."""
    try:
        el = page.evaluate("""() => {
            const el = document.querySelector('.aqb-canvas > *');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {x: r.x, y: r.y, w: r.width, h: r.height};
        }""")
        if el:
            page.mouse.click(el["x"] + el["w"]/2, el["y"] + el["h"]/2)
            page.wait_for_timeout(600)
            return True
    except Exception as e:
        print(f"    ⚠ select canvas element: {e}")
    return False


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()

        enter_editor(page)

        # ── 1. Project menu dropdown ──
        print("\n[1] Project menu")
        try:
            page.click('button.brand, [aria-label="Project menu"]', timeout=3000)
            page.wait_for_timeout(600)
            shoot(page, "0205-topbar-project-menu.png")
            add_manifest("0205-topbar-project-menu.png", "Topbar", "Project menu dropdown open", "Click project name button in topbar")
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 2. Undo/Redo buttons ──
        print("\n[2] Undo/Redo area")
        try:
            shoot(page, "0201b-topbar-undo-redo.png", clip={"x": 150, "y": 0, "width": 200, "height": 60})
            add_manifest("0201b-topbar-undo-redo.png", "Topbar", "Undo/Redo buttons close-up", "Topbar undo/redo button area")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 3. Inspector pseudostate dropdown ──
        print("\n[3] Inspector pseudostate")
        select_canvas_element(page)

        try:
            # The "Default" button is at ~x=1224, y=152 per recon
            # Try clicking it to open the pseudo-state dropdown
            pseudo_btn = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('button')).find(el => {
                    const t = el.textContent.trim();
                    return t === 'Default' || t === ':default';
                });
            }""")
            if pseudo_btn is None:
                # Try a broader search
                pseudo_btn = page.evaluate("""() => {
                    const btns = Array.from(document.querySelectorAll('button')).filter(el => {
                        const r = el.getBoundingClientRect();
                        return r.x > 1100 && r.y > 100 && r.y < 200;
                    });
                    return btns.map(el => ({text: el.textContent.trim(), x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y)}));
                }""")
                print(f"  Buttons in inspector header area: {pseudo_btn}")

            # Click "Default" pseudo-state button area (known coords from recon)
            page.mouse.click(1224 + 5, 152 + 5)
            page.wait_for_timeout(600)
            shoot(page, "0404-inspector-pseudostate-dropdown.png")
            add_manifest("0404-inspector-pseudostate-dropdown.png", "Inspector", "Pseudostate selector (Default selected)", "Click Default pseudo-state button in inspector header")
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 4. Inspector Style tab → color swatch → color picker ──
        print("\n[4] Inspector color picker")
        select_canvas_element(page)
        try:
            # Click "Style" tab — from recon: x=1273, y=294
            page.mouse.click(1273 + 5, 294 + 5)
            page.wait_for_timeout(700)
            shoot(page, "0402b-inspector-style-tab.png")
            add_manifest("0402b-inspector-style-tab.png", "Inspector", "Style tab content", "Click Style tab in inspector")

            # Find color swatches in the right inspector panel
            swatches = page.evaluate("""() => {
                const inspEl = document.querySelector('.layout-shell__inspector');
                if (!inspEl) return [];
                return Array.from(inspEl.querySelectorAll('button, div')).filter(el => {
                    const style = window.getComputedStyle(el);
                    const bg = style.backgroundColor;
                    const r = el.getBoundingClientRect();
                    return r.width >= 12 && r.width <= 40 && r.height >= 12 && r.height <= 40
                        && bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
                }).slice(0, 5).map(el => ({
                    tag: el.tagName,
                    bg: window.getComputedStyle(el).backgroundColor,
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y),
                    w: Math.round(el.getBoundingClientRect().width)
                }));
            }""")
            print(f"  Inspector color swatches: {swatches}")

            if swatches:
                s = swatches[0]
                page.mouse.click(s["x"] + s["w"]/2, s["y"] + 10)
                page.wait_for_timeout(800)
                shoot(page, "0405-inspector-color-picker.png")
                add_manifest("0405-inspector-color-picker.png", "Inspector", "Color picker in inspector", "Click color swatch in inspector Style tab")
                page.keyboard.press("Escape")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 5. Inspector multiselect toolbar ──
        print("\n[5] Inspector multiselect toolbar")
        try:
            # Select first element
            el = page.evaluate("""() => {
                const els = document.querySelectorAll('[data-aqb-type]');
                return Array.from(els).map(e => {
                    const r = e.getBoundingClientRect();
                    return {x: r.x, y: r.y, w: r.width, h: r.height};
                }).filter(r => r.w > 20 && r.h > 20).slice(0, 5);
            }""")
            print(f"  Canvas elements: {el}")

            if len(el) >= 2:
                # Click first
                page.mouse.click(el[0]["x"] + el[0]["w"]/2, el[0]["y"] + el[0]["h"]/2)
                page.wait_for_timeout(400)
                # Shift-click second
                page.keyboard.down("Shift")
                page.mouse.click(el[1]["x"] + el[1]["w"]/2, el[1]["y"] + el[1]["h"]/2)
                page.keyboard.up("Shift")
                page.wait_for_timeout(600)
                shoot(page, "0406-inspector-multiselect-toolbar.png")
                add_manifest("0406-inspector-multiselect-toolbar.png", "Inspector", "Multi-select inspector toolbar", "Shift+click 2 elements → multiselect inspector")
                page.keyboard.press("Escape")
            else:
                print("  → Only 1 element found, can't multiselect")
        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.up("Shift")

        # ── 6. Media type filter pills ──
        print("\n[6] Media type filter pills")
        try:
            click_rail(page, "assets")
            page.wait_for_timeout(800)

            # Print ALL buttons in left sidebar
            sidebar_btns = page.evaluate("""() => {
                const sb = document.querySelector('[class*="sidebar"], [class*="left-panel"], .layout-shell__drawer');
                if (!sb) return 'NO SIDEBAR';
                return Array.from(sb.querySelectorAll('button, [role="tab"]')).map(el => ({
                    text: el.textContent.trim().slice(0, 30),
                    cls: el.className.toString().slice(0, 40),
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y)
                }));
            }""")
            print(f"  Sidebar buttons (assets tab): {sidebar_btns}")

            shoot(page, "0150b-media-panel-detail.png")
            add_manifest("0150b-media-panel-detail.png", "Media", "Media panel full view", "Media tab open showing all controls")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 7. Templates preview modal ──
        print("\n[7] Templates preview modal")
        try:
            click_rail(page, "templates")
            page.wait_for_timeout(800)

            # Get tcard positions from recon
            tcard = page.evaluate("""() => {
                const c = document.querySelector('.tcard');
                if (!c) return null;
                const r = c.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  First tcard: {tcard}")

            if tcard:
                cx = tcard["x"] + tcard["w"]/2
                cy = tcard["y"] + tcard["h"]/2
                # Hover first
                page.mouse.move(cx, cy)
                page.wait_for_timeout(600)
                # Look for preview button appearing on hover
                preview_btn = page.evaluate("""() => {
                    const btns = document.querySelectorAll('button, a');
                    return Array.from(btns).filter(el => {
                        const t = el.textContent.trim().toLowerCase();
                        return t.includes('preview') || t === '→' || t === 'view';
                    }).map(el => ({
                        text: el.textContent.trim(),
                        x: Math.round(el.getBoundingClientRect().x),
                        y: Math.round(el.getBoundingClientRect().y),
                        visible: el.getBoundingClientRect().width > 0
                    }));
                }""")
                print(f"  Preview buttons: {preview_btn}")

                if preview_btn:
                    visible = [b for b in preview_btn if b["visible"]]
                    if visible:
                        page.mouse.click(visible[0]["x"] + 5, visible[0]["y"] + 5)
                        page.wait_for_timeout(1000)
                        shoot(page, "0133-templates-preview-modal-desktop.png")
                        add_manifest("0133-templates-preview-modal-desktop.png", "Templates", "Preview modal — Desktop viewport", "Hover template card → click Preview")

                        # Cycle viewport buttons in modal
                        modal_btns = page.evaluate("""() => {
                            const modal = document.querySelector('[class*="tmpl-preview"], [class*="preview-modal"], [role="dialog"]');
                            if (!modal) return [];
                            return Array.from(modal.querySelectorAll('button')).filter(el => {
                                const t = el.textContent.trim().toLowerCase();
                                return t.includes('tablet') || t.includes('mobile') || t.includes('desktop');
                            }).map(el => ({text: el.textContent.trim(), x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y)}));
                        }""")
                        print(f"  Modal viewport buttons: {modal_btns}")

                        for btn in modal_btns:
                            if "tablet" in btn["text"].lower():
                                page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                                page.wait_for_timeout(600)
                                shoot(page, "0134-templates-preview-modal-tablet.png")
                                add_manifest("0134-templates-preview-modal-tablet.png", "Templates", "Preview modal — Tablet viewport", "Click Tablet in preview modal")
                            elif "mobile" in btn["text"].lower():
                                page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                                page.wait_for_timeout(600)
                                shoot(page, "0135-templates-preview-modal-mobile.png")
                                add_manifest("0135-templates-preview-modal-mobile.png", "Templates", "Preview modal — Mobile viewport", "Click Mobile in preview modal")

                        page.keyboard.press("Escape")
                        page.wait_for_timeout(400)

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 8. Canvas multiselect (canvas has only 1 element — add another first) ──
        print("\n[8] Add element and canvas states")
        try:
            # Use Add/Build panel to insert a text element
            click_rail(page, "add")
            page.wait_for_timeout(600)

            # Print Build panel content
            build_btns = page.evaluate("""() => {
                const sb = document.querySelector('.layout-shell__drawer');
                if (!sb) return 'NO DRAWER';
                return Array.from(sb.querySelectorAll('button, [class*="block"], [class*="card"]')).map(el => ({
                    text: el.textContent.trim().slice(0, 30),
                    cls: el.className.toString().slice(0, 50),
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y),
                    w: Math.round(el.getBoundingClientRect().width),
                    h: Math.round(el.getBoundingClientRect().height),
                })).filter(b => b.w > 20 && b.h > 20).slice(0, 20);
            }""")
            print(f"  Build panel: {build_btns}")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 9. Canvas context menu on empty canvas area ──
        print("\n[9] Full editor refresh screenshots")
        try:
            # Deselect all
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)

            # Click empty canvas area (below the element)
            page.mouse.click(720, 700)
            page.wait_for_timeout(400)
            shoot(page, "0300-canvas-empty.png")
            add_manifest("0300-canvas-empty.png", "Canvas", "Canvas with nothing selected", "Click empty canvas area below elements")

            # Re-select element
            select_canvas_element(page)
            shoot(page, "0301-canvas-element-selected.png")
            add_manifest("0301-canvas-element-selected.png", "Canvas", "Canvas element selected", "Click canvas element to select it")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 10. Inspector full scroll capture ──
        print("\n[10] Inspector full scroll")
        try:
            select_canvas_element(page)
            # Scroll the inspector to show all sections
            insp = page.evaluate("""() => {
                const el = document.querySelector('.layout-shell__inspector');
                return el ? {x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height} : null;
            }""")
            print(f"  Inspector panel: {insp}")

            if insp:
                # Clip inspector only
                shoot(page, "0401b-inspector-panel-full.png", clip={
                    "x": insp["x"], "y": insp["y"],
                    "width": insp["w"], "height": insp["h"]
                })
                add_manifest("0401b-inspector-panel-full.png", "Inspector", "Inspector panel close-up", "Element selected — inspector panel crop")

        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    data = json.loads(manifest_path.read_text())
    print(f"\nPass 4 complete! Manifest: {len(data)} entries")
    import glob
    pngs = glob.glob(str(OUTPUT_DIR / "*.png"))
    print(f"Total PNGs: {len(pngs)}")


if __name__ == "__main__":
    main()
