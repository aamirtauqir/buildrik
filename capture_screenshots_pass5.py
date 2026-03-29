"""
Pass 5 — Final targeted captures:
- Media type filter pills (exact coords known: x=139, y=214)
- Settings integrations + export screens
- Templates preview modal D/T/M viewport switcher (need to find modal buttons)
- Build panel add elements for multiselect
- Canvas drag element to add more content
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


def select_canvas_element(page: Page) -> dict | None:
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
            return el
    except Exception as e:
        print(f"    ⚠ select: {e}")
    return None


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()
        enter_editor(page)

        # ── 1. Media type filter pills ──
        print("\n[1] Media type filter")
        try:
            click_rail(page, "assets")
            page.wait_for_timeout(800)

            # From recon: Images pill is at x=139, y=214
            # Click Images pill
            page.mouse.click(139 + 10, 214 + 8)
            page.wait_for_timeout(600)
            shoot(page, "0152-media-type-filter.png")
            add_manifest("0152-media-type-filter.png", "Media", "Images type filter active", "Click Images filter pill in media tab")

            # Reset to All
            page.mouse.click(72 + 10, 214 + 8)  # All pill
            page.wait_for_timeout(400)
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 2. Media discovery view with search ──
        print("\n[2] Media discovery view")
        try:
            click_rail(page, "assets")
            page.wait_for_timeout(600)
            # Click Discovery button at x=159, y=124
            page.mouse.click(159 + 20, 124 + 8)
            page.wait_for_timeout(800)
            shoot(page, "0151-media-discovery-view.png")
            add_manifest("0151-media-discovery-view.png", "Media", "Media Discovery view (stock assets)", "Click Discovery tab in media panel")
            # Back to Library
            page.mouse.click(70 + 20, 124 + 8)
            page.wait_for_timeout(400)
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 3. Settings: export and integrations ──
        print("\n[3] Settings export + integrations screens")
        try:
            click_rail(page, "settings")
            page.wait_for_timeout(700)

            # Print what's in settings panel
            settings_cards = page.evaluate("""() => {
                const drawer = document.querySelector('.layout-shell__drawer');
                if (!drawer) return [];
                return Array.from(drawer.querySelectorAll('button, [class*="card"], [class*="feature"]')).map(el => ({
                    text: el.textContent.trim().slice(0, 40),
                    cls: el.className.toString().slice(0, 50),
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y),
                    w: Math.round(el.getBoundingClientRect().width),
                    h: Math.round(el.getBoundingClientRect().height),
                })).filter(b => b.w > 50 && b.h > 30);
            }""")
            print(f"  Settings panel: {settings_cards}")

            # Go back to settings home if in a drill-in
            for back_sel in ['button[aria-label*="back" i]', 'button:has-text("← Back")', '.drill-in-header button']:
                try:
                    if page.locator(back_sel).first.is_visible(timeout=800):
                        page.locator(back_sel).first.click()
                        page.wait_for_timeout(400)
                        break
                except Exception:
                    continue

            # Find and click Export card
            for card in settings_cards:
                if 'export' in card.get('text', '').lower():
                    page.mouse.click(card['x'] + card['w']//2, card['y'] + card['h']//2)
                    page.wait_for_timeout(700)
                    shoot(page, "0174-settings-export.png")
                    add_manifest("0174-settings-export.png", "Settings", "Export settings screen", "Click Export feature card in Settings")

                    # Back
                    for back_sel in ['button[aria-label*="back" i]', 'button:has-text("← Back")', '.drill-in-header button']:
                        try:
                            if page.locator(back_sel).first.is_visible(timeout=1000):
                                page.locator(back_sel).first.click()
                                page.wait_for_timeout(400)
                                break
                        except Exception:
                            continue
                    break

            # Refresh settings cards after back
            settings_cards2 = page.evaluate("""() => {
                const drawer = document.querySelector('.layout-shell__drawer');
                if (!drawer) return [];
                return Array.from(drawer.querySelectorAll('button, [class*="card"], [class*="feature"]')).map(el => ({
                    text: el.textContent.trim().slice(0, 40),
                    cls: el.className.toString().slice(0, 50),
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y),
                    w: Math.round(el.getBoundingClientRect().width),
                    h: Math.round(el.getBoundingClientRect().height),
                })).filter(b => b.w > 50 && b.h > 30);
            }""")

            # Find and click Integrations card
            for card in settings_cards2:
                if 'integrat' in card.get('text', '').lower():
                    page.mouse.click(card['x'] + card['w']//2, card['y'] + card['h']//2)
                    page.wait_for_timeout(700)
                    shoot(page, "0175-settings-integrations.png")
                    add_manifest("0175-settings-integrations.png", "Settings", "Integrations settings screen (may be locked)", "Click Integrations feature card in Settings")

                    for back_sel in ['button[aria-label*="back" i]', 'button:has-text("← Back")', '.drill-in-header button']:
                        try:
                            if page.locator(back_sel).first.is_visible(timeout=1000):
                                page.locator(back_sel).first.click()
                                page.wait_for_timeout(400)
                                break
                        except Exception:
                            continue
                    break

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 4. Templates preview modal with viewport buttons ──
        print("\n[4] Templates preview modal viewport buttons")
        try:
            click_rail(page, "templates")
            page.wait_for_timeout(800)

            # Hover first tcard to reveal Preview button, then click it
            tcard = page.evaluate("() => { const c = document.querySelector('.tcard'); if (!c) return null; const r = c.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }")
            if tcard:
                page.mouse.move(tcard["x"] + tcard["w"]/2, tcard["y"] + tcard["h"]/2)
                page.wait_for_timeout(500)

                # Click "Preview →" button (from recon: x=86, y=251 for first card)
                page.mouse.click(86 + 20, 251 + 8)
                page.wait_for_timeout(1200)

                # Look at what opened
                modal_content = page.evaluate("""() => {
                    // Find the modal/overlay
                    const modals = document.querySelectorAll('[class*="modal"], [class*="overlay"], [class*="preview"], [role="dialog"]');
                    return Array.from(modals).map(el => ({
                        cls: el.className.toString().slice(0, 80),
                        visible: el.getBoundingClientRect().width > 100,
                        rect: {x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height)},
                        buttons: Array.from(el.querySelectorAll('button')).map(b => ({text: b.textContent.trim().slice(0, 30), x: Math.round(b.getBoundingClientRect().x), y: Math.round(b.getBoundingClientRect().y)}))
                    }));
                }""")
                print(f"  Modal content: {modal_content}")

                shoot(page, "0133-templates-preview-modal-desktop.png")
                add_manifest("0133-templates-preview-modal-desktop.png", "Templates", "Template preview modal — Desktop", "Hover template card → click 'Preview →'")

                # Try to find viewport toggle buttons
                viewport_btns = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('button')).filter(el => {
                        const t = el.textContent.trim().toLowerCase();
                        const r = el.getBoundingClientRect();
                        return (t.includes('tablet') || t.includes('mobile') || t.includes('desktop')) && r.width > 0;
                    }).map(el => ({text: el.textContent.trim(), x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y)}));
                }""")
                print(f"  Viewport buttons in modal: {viewport_btns}")

                for btn in viewport_btns:
                    if "tablet" in btn["text"].lower():
                        page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                        page.wait_for_timeout(600)
                        shoot(page, "0134-templates-preview-modal-tablet.png")
                        add_manifest("0134-templates-preview-modal-tablet.png", "Templates", "Template preview — Tablet viewport", "Click Tablet button in preview modal")
                    elif "mobile" in btn["text"].lower():
                        page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                        page.wait_for_timeout(600)
                        shoot(page, "0135-templates-preview-modal-mobile.png")
                        add_manifest("0135-templates-preview-modal-mobile.png", "Templates", "Template preview — Mobile viewport", "Click Mobile button in preview modal")

                page.keyboard.press("Escape")
                page.wait_for_timeout(500)

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 5. Add elements from Build panel + multiselect ──
        print("\n[5] Add elements + multiselect")
        try:
            click_rail(page, "add")
            page.wait_for_timeout(700)

            # From recon: bld-el-card buttons at known positions
            # Double-click "Paragraph" card to add it
            para_card = page.evaluate("""() => {
                const cards = document.querySelectorAll('.bld-el-card');
                const para = Array.from(cards).find(el => el.textContent.trim().startsWith('Paragraph'));
                if (!para) return null;
                const r = para.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  Paragraph card: {para_card}")

            if para_card:
                # Double-click to add element
                page.mouse.dblclick(para_card["x"] + para_card["w"]/2, para_card["y"] + para_card["h"]/2)
                page.wait_for_timeout(1000)

                # Now check canvas elements
                canvas_els = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('[data-aqb-type]')).map(el => {
                        const r = el.getBoundingClientRect();
                        return {x: r.x, y: r.y, w: r.width, h: r.height, type: el.getAttribute('data-aqb-type')};
                    }).filter(r => r.w > 10 && r.h > 10);
                }""")
                print(f"  Canvas elements after add: {canvas_els}")

                if len(canvas_els) >= 2:
                    # Select first
                    e0 = canvas_els[0]
                    page.mouse.click(e0["x"] + e0["w"]/2, e0["y"] + e0["h"]/2)
                    page.wait_for_timeout(400)
                    # Shift-click second
                    e1 = canvas_els[1]
                    page.keyboard.down("Shift")
                    page.mouse.click(e1["x"] + e1["w"]/2, e1["y"] + e1["h"]/2)
                    page.keyboard.up("Shift")
                    page.wait_for_timeout(600)
                    shoot(page, "0303-canvas-multiselect.png")
                    add_manifest("0303-canvas-multiselect.png", "Canvas", "Multi-select (2 elements)", "Shift+click 2 canvas elements")
                    shoot(page, "0406-inspector-multiselect-toolbar.png")
                    add_manifest("0406-inspector-multiselect-toolbar.png", "Inspector", "Inspector multi-select toolbar", "2 elements selected — inspector shows alignment/distribution tools")
                    # Undo added element
                    page.keyboard.press("Escape")
                    page.keyboard.press("Meta+Z")
                    page.wait_for_timeout(400)

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.up("Shift")

        # ── 6. Canvas drag state ──
        print("\n[6] Canvas drag mid-state")
        try:
            el = page.evaluate("""() => {
                const el = document.querySelector('[data-aqb-type]');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            if el:
                cx = el["x"] + el["w"]/2
                cy = el["y"] + el["h"]/2
                # Click to select first
                page.mouse.click(cx, cy)
                page.wait_for_timeout(300)
                # Start drag
                page.mouse.move(cx, cy)
                page.mouse.down()
                page.wait_for_timeout(200)
                page.mouse.move(cx + 50, cy + 30, steps=10)
                page.wait_for_timeout(400)
                shoot(page, "0307-canvas-drag-in-progress.png")
                add_manifest("0307-canvas-drag-in-progress.png", "Canvas", "Element drag in progress", "Click element → mouse drag 50px")
                # Release and undo
                page.mouse.up()
                page.wait_for_timeout(300)
                page.keyboard.press("Meta+Z")
                page.wait_for_timeout(300)
        except Exception as e:
            print(f"  ⚠ {e}")
            try:
                page.mouse.up()
            except Exception:
                pass

        # ── 7. Zoom controls close-up ──
        print("\n[7] Zoom controls close-up")
        try:
            shoot(page, "0217-footer-zoom-area.png", clip={"x": 850, "y": 846, "width": 250, "height": 50})
            add_manifest("0217-footer-zoom-area.png", "Canvas Footer", "Zoom controls close-up", "Footer zoom area crop")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 8. Inspector full with element selected ──
        print("\n[8] Full inspector states")
        try:
            # Select element
            el = select_canvas_element(page)
            shoot(page, "0401-inspector-layout-tab.png")
            add_manifest("0401-inspector-layout-tab.png", "Inspector", "Inspector Layout & Size tab", "Element selected → Layout & Size tab active")

            # Click Style tab: x=1273, y=294
            page.mouse.click(1273 + 5, 294 + 5)
            page.wait_for_timeout(700)
            shoot(page, "0402-inspector-design-tab.png")
            add_manifest("0402-inspector-design-tab.png", "Inspector", "Inspector Style tab", "Click Style tab in inspector")

            # Click Advanced tab: x=1358, y=294
            page.mouse.click(1358 + 5, 294 + 5)
            page.wait_for_timeout(700)
            shoot(page, "0403-inspector-settings-tab.png")
            add_manifest("0403-inspector-settings-tab.png", "Inspector", "Inspector Advanced tab", "Click Advanced tab in inspector")

            # Back to Layout
            page.mouse.click(1177 + 5, 294 + 5)
            page.wait_for_timeout(400)
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 9. Canvas all overlays on simultaneously ──
        print("\n[9] All overlays on")
        try:
            # Turn on all overlay toggles
            for label in ["Snap Guides", "Spacing", "Grid"]:
                page.click(f'button[aria-label="{label}"]', timeout=3000)
                page.wait_for_timeout(200)
            shoot(page, "0220-footer-all-overlays-on.png")
            add_manifest("0220-footer-all-overlays-on.png", "Canvas Footer", "Guides + Spacing + Grid overlays all active", "Click Snap Guides, Spacing, Grid buttons to enable all")
            # Turn them back off
            for label in ["Snap Guides", "Spacing", "Grid"]:
                page.click(f'button[aria-label="{label}"]', timeout=3000)
                page.wait_for_timeout(100)
        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    data = json.loads(manifest_path.read_text())
    print(f"\nPass 5 complete! Manifest: {len(data)} entries")
    import glob
    pngs = glob.glob(str(OUTPUT_DIR / "*.png"))
    print(f"Total PNGs: {len(pngs)}")


if __name__ == "__main__":
    main()
