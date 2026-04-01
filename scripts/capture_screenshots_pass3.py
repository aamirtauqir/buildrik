"""
capture_screenshots_pass3.py — targeted recon + fixes
- Identify actual right inspector panel selectors
- Capture inspector tabs with element selected
- Capture topbar properly
- Take full-page and viewport screenshots of key areas
"""

import os
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
SETTLE = 800

manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page: Page, fn: str, full_page: bool = False) -> None:
    page.wait_for_timeout(SETTLE)
    page.screenshot(path=str(OUTPUT_DIR / fn), full_page=full_page)
    print(f"  ✓ {fn}")


def add_manifest(fn: str, section: str, state: str, how: str) -> None:
    try:
        data = json.loads(manifest_path.read_text())
    except Exception:
        data = []
    # Update or append
    for i, item in enumerate(data):
        if item["file"] == fn:
            data[i] = {"file": fn, "section": section, "state": state, "how_to_reproduce": how}
            manifest_path.write_text(json.dumps(data, indent=2))
            return
    data.append({"file": fn, "section": section, "state": state, "how_to_reproduce": how})
    manifest_path.write_text(json.dumps(data, indent=2))


def click_rail(page: Page, tab_id: str) -> None:
    page.click(f'[id="rail-tab-{tab_id}"]', timeout=5000)
    page.wait_for_timeout(SETTLE)


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()

        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1500)

        # Enter editor
        try:
            page.click("text=Open", timeout=5000)
            page.wait_for_load_state("networkidle", timeout=15000)
            page.wait_for_timeout(2000)
        except Exception:
            print("  → Already in editor or no Open button")

        # ── RECON: dump the full DOM structure to understand the layout ──
        print("\n[RECON] DOM structure")
        try:
            # Get all role=tablist or inspector-like containers
            html = page.evaluate("""() => {
                const inspect = (el, depth) => {
                    if (depth > 4) return '';
                    const tag = el.tagName?.toLowerCase() || '';
                    const id = el.id ? `#${el.id}` : '';
                    const cls = el.className && typeof el.className === 'string' ?
                        '.' + el.className.split(' ').filter(Boolean).slice(0, 3).join('.') : '';
                    const role = el.getAttribute ? el.getAttribute('role') || '' : '';
                    const aria = el.getAttribute ? el.getAttribute('aria-label') || '' : '';
                    const txt = (el.textContent || '').trim().slice(0, 40);
                    const indent = '  '.repeat(depth);
                    let out = `${indent}<${tag}${id}${cls} role="${role}" aria="${aria}">${txt}\\n`;
                    const children = Array.from(el.children || []).slice(0, 8);
                    children.forEach(c => out += inspect(c, depth + 1));
                    return out;
                };
                return inspect(document.body, 0);
            }""")
            # Print just key parts
            lines = [l for l in html.split('\n') if any(x in l for x in [
                'inspector', 'panel', 'right', 'sidebar', 'tab', 'rail', 'layout',
                'design', 'style', 'settings', 'canvas', 'studio', 'shell', 'main'
            ])]
            for l in lines[:80]:
                print(l)
        except Exception as e:
            print(f"  recon error: {e}")

        # ── RECON: find right panel ──
        print("\n[RECON] Right panel candidates")
        try:
            info = page.evaluate("""() => {
                const results = [];
                // Look for right-side panels
                const selectors = [
                    '[class*="inspector"]',
                    '[class*="right-panel"]',
                    '[class*="rightPanel"]',
                    '[class*="properties"]',
                    '[class*="ProInspector"]',
                    '[class*="pro-inspector"]',
                    '[data-panel="right"]',
                    '[id*="inspector"]',
                    '[id*="right"]',
                ];
                selectors.forEach(sel => {
                    try {
                        const els = document.querySelectorAll(sel);
                        els.forEach(el => {
                            const rect = el.getBoundingClientRect();
                            if (rect.width > 50 && rect.height > 50) {
                                results.push({
                                    selector: sel,
                                    id: el.id,
                                    className: el.className.toString().slice(0, 80),
                                    x: Math.round(rect.x),
                                    y: Math.round(rect.y),
                                    w: Math.round(rect.width),
                                    h: Math.round(rect.height),
                                    text: el.textContent.trim().slice(0, 60)
                                });
                            }
                        });
                    } catch(e) {}
                });
                return results;
            }""")
            for item in info[:20]:
                print(f"  {item}")
        except Exception as e:
            print(f"  error: {e}")

        # ── RECON: find all visible tabs/buttons on screen ──
        print("\n[RECON] All visible tabs/buttons")
        try:
            btns = page.evaluate("""() => {
                const btns = [];
                document.querySelectorAll('[role="tab"], button').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 20 && rect.height > 10 && rect.x > 900) {
                        btns.push({
                            tag: el.tagName,
                            role: el.getAttribute('role'),
                            text: el.textContent.trim().slice(0, 30),
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            w: Math.round(rect.width),
                            className: el.className.toString().slice(0, 60),
                        });
                    }
                });
                return btns.slice(0, 30);
            }""")
            for b in btns:
                print(f"  {b}")
        except Exception as e:
            print(f"  error: {e}")

        # ── RECON: find canvas elements ──
        print("\n[RECON] Canvas elements")
        try:
            canvas_info = page.evaluate("""() => {
                const canvas = document.querySelector('[data-aqb-canvas]') ||
                               document.querySelector('.aqb-canvas') ||
                               document.querySelector('[class*="canvas-frame"]') ||
                               document.querySelector('[class*="canvasFrame"]') ||
                               document.querySelector('[class*="canvas-root"]');
                if (!canvas) return 'NO CANVAS FOUND';
                const rect = canvas.getBoundingClientRect();
                const children = Array.from(canvas.querySelectorAll('*')).slice(0, 20).map(el => ({
                    tag: el.tagName,
                    cls: el.className.toString().slice(0, 60),
                    id: el.id,
                    data: Object.fromEntries(Array.from(el.attributes).filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value])),
                    rect: {x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height)}
                }));
                return {
                    found: canvas.tagName + '#' + canvas.id + '.' + canvas.className.toString().slice(0, 40),
                    rect: {x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height)},
                    childCount: canvas.children.length,
                    children: children
                };
            }""")
            print(f"  {canvas_info}")
        except Exception as e:
            print(f"  error: {e}")

        # ── Targeted Screenshot: Editor overview with DOM labels ──
        print("\n[1] Editor overview")
        shoot(page, "0100-editor-default.png")
        add_manifest("0100-editor-default.png", "Editor", "Default layout — clean state", "Editor opened, nothing selected")

        # ── Targeted: Try clicking canvas elements and get inspector ──
        print("\n[2] Canvas element + Inspector")
        try:
            # Find clickable canvas elements
            canvas_el = page.evaluate("""() => {
                // Try various canvas element selectors
                const selectors = [
                    '[data-element-id]',
                    '[data-aqb-element]',
                    '[data-pen-id]',
                    '.aqb-canvas [class*="element"]',
                    '.aqb-canvas > *',
                    '[data-aqb-canvas] > *',
                    '[data-aqb-canvas] [class]',
                ];
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 5 && rect.height > 5) {
                            return {selector: sel, rect: {x: rect.x, y: rect.y, w: rect.width, h: rect.height}};
                        }
                    }
                }
                return null;
            }""")
            print(f"  Canvas element found: {canvas_el}")

            if canvas_el and canvas_el.get("rect"):
                r = canvas_el["rect"]
                cx = r["x"] + r["w"] / 2
                cy = r["y"] + r["h"] / 2
                # Click element
                page.mouse.click(cx, cy)
                page.wait_for_timeout(800)
                shoot(page, "0301-canvas-element-selected.png")
                add_manifest("0301-canvas-element-selected.png", "Canvas", "Element selected on canvas", "Click canvas element")
                shoot(page, "0302-canvas-selection-handles.png")
                add_manifest("0302-canvas-selection-handles.png", "Canvas", "Selection handles visible", "Element selected showing resize handles")

                # Inspector should now show element properties
                shoot(page, "0401-inspector-layout-tab.png")
                add_manifest("0401-inspector-layout-tab.png", "Inspector", "Layout tab with element selected", "Click element → inspect Layout tab")

                # Find inspector tabs from the RIGHT side of screen (x > 1100)
                right_tabs = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('[role="tab"], button')).filter(el => {
                        const r = el.getBoundingClientRect();
                        return r.x > 1100 && r.width > 20 && r.height > 15;
                    }).map(el => ({
                        text: el.textContent.trim(),
                        x: Math.round(el.getBoundingClientRect().x),
                        y: Math.round(el.getBoundingClientRect().y),
                        cls: el.className.toString().slice(0, 40)
                    }));
                }""")
                print(f"  Right-side tabs: {right_tabs}")

                # Click second right tab
                if len(right_tabs) >= 2:
                    t = right_tabs[1]
                    page.mouse.click(t["x"] + 5, t["y"] + 5)
                    page.wait_for_timeout(700)
                    shoot(page, "0402-inspector-design-tab.png")
                    add_manifest("0402-inspector-design-tab.png", "Inspector", "Design/Style tab with element", f"Click tab '{t['text']}'")

                if len(right_tabs) >= 3:
                    t = right_tabs[2]
                    page.mouse.click(t["x"] + 5, t["y"] + 5)
                    page.wait_for_timeout(700)
                    shoot(page, "0403-inspector-settings-tab.png")
                    add_manifest("0403-inspector-settings-tab.png", "Inspector", "Settings/Advanced tab with element", f"Click tab '{t['text']}'")

                # Hover without clicking for hover overlay
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
                page.mouse.click(cx + 100, cy)  # click nearby empty area
                page.wait_for_timeout(300)
                page.mouse.move(cx, cy)
                page.wait_for_timeout(600)
                shoot(page, "0306-canvas-hover-overlay.png")
                add_manifest("0306-canvas-hover-overlay.png", "Canvas", "Element hover overlay", "Hover over canvas element")

                # Element context menu
                page.mouse.click(cx, cy)
                page.wait_for_timeout(400)
                page.mouse.click(cx, cy, button="right")
                page.wait_for_timeout(600)
                shoot(page, "0305-canvas-element-context-menu.png")
                add_manifest("0305-canvas-element-context-menu.png", "Canvas", "Element right-click context menu", "Right-click selected element")
                page.keyboard.press("Escape")

        except Exception as e:
            print(f"  ⚠ Canvas element click failed: {e}")

        # ── Apply a template to get canvas elements ──
        print("\n[3] Apply template to get canvas content")
        try:
            click_rail(page, "templates")
            page.wait_for_timeout(800)

            # Get template cards
            tcards = page.evaluate("""() => {
                const cards = document.querySelectorAll('[class*="tcard"], [class*="template-card"], [class*="templateCard"]');
                return Array.from(cards).slice(0, 5).map(el => ({
                    cls: el.className.toString().slice(0, 60),
                    rect: {x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height)}
                }));
            }""")
            print(f"  Template cards: {tcards}")

            if tcards:
                r = tcards[0]["rect"]
                cx = r["x"] + r["w"] / 2
                cy = r["y"] + r["h"] / 2
                # Hover
                page.mouse.move(cx, cy)
                page.wait_for_timeout(600)
                shoot(page, "0131-templates-card-hover.png")
                add_manifest("0131-templates-card-hover.png", "Templates", "Template card hover state", "Hover over first template card")

        except Exception as e:
            print(f"  ⚠ Template section failed: {e}")

        # ── Mobile breakpoint ──
        print("\n[4] Mobile breakpoint")
        try:
            # Look for breakpoint/device button in topbar
            topbar_btns = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('button, select')).filter(el => {
                    const r = el.getBoundingClientRect();
                    return r.y < 60 && r.width > 20;
                }).map(el => ({
                    text: el.textContent.trim().slice(0, 30),
                    aria: el.getAttribute('aria-label') || '',
                    title: el.getAttribute('title') || '',
                    x: Math.round(el.getBoundingClientRect().x),
                    cls: el.className.toString().slice(0, 50)
                }));
            }""")
            print(f"  Topbar buttons: {topbar_btns}")

            # Click breakpoint selector
            for btn in topbar_btns:
                if any(x in btn.get("text", "").lower() + btn.get("aria", "").lower() + btn.get("title", "").lower()
                       for x in ["desktop", "device", "breakpoint", "screen"]):
                    page.mouse.click(btn["x"] + 5, 40)
                    page.wait_for_timeout(500)
                    # Look for mobile option
                    mobile_opts = page.evaluate("""() => {
                        return Array.from(document.querySelectorAll('button, li, option')).filter(el => {
                            const t = el.textContent.trim().toLowerCase();
                            return t === 'mobile' || t.includes('mobile');
                        }).map(el => ({
                            text: el.textContent.trim(),
                            x: Math.round(el.getBoundingClientRect().x),
                            y: Math.round(el.getBoundingClientRect().y)
                        }));
                    }""")
                    print(f"  Mobile options: {mobile_opts}")
                    if mobile_opts:
                        page.mouse.click(mobile_opts[0]["x"] + 5, mobile_opts[0]["y"] + 5)
                        page.wait_for_timeout(600)
                        shoot(page, "0203-topbar-breakpoint-mobile.png")
                        add_manifest("0203-topbar-breakpoint-mobile.png", "Topbar", "Mobile breakpoint active", "Click device selector → Mobile")

                        # Reset to desktop
                        for btn2 in topbar_btns:
                            if "desktop" in btn2.get("text", "").lower() + btn2.get("aria", "").lower():
                                page.mouse.click(btn2["x"] + 5, 40)
                                page.wait_for_timeout(300)
                                break
                    break
        except Exception as e:
            print(f"  ⚠ Mobile breakpoint failed: {e}")

        # ── Topbar close-up ──
        print("\n[5] Topbar close-up")
        try:
            # Clip to just the topbar area (top 60px)
            page.screenshot(
                path=str(OUTPUT_DIR / "0101-editor-topbar.png"),
                clip={"x": 0, "y": 0, "width": 1440, "height": 60}
            )
            add_manifest("0101-editor-topbar.png", "Topbar", "Topbar close-up", "Top 60px of editor viewport")
            print("  ✓ 0101-editor-topbar.png")
        except Exception as e:
            print(f"  ⚠ Topbar clip failed: {e}")

        # ── Media type filter pills ──
        print("\n[6] Media type filter pills")
        try:
            click_rail(page, "assets")
            page.wait_for_timeout(800)

            pills = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('button')).filter(el => {
                    const t = el.textContent.trim().toLowerCase();
                    return ['images', 'image', 'video', 'videos', 'audio', 'document', 'icons', 'all'].includes(t);
                }).map(el => ({
                    text: el.textContent.trim(),
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y)
                }));
            }""")
            print(f"  Type filter pills: {pills}")

            if pills:
                p = pills[0]
                page.mouse.click(p["x"] + 5, p["y"] + 5)
                page.wait_for_timeout(500)
                shoot(page, "0152-media-type-filter.png")
                add_manifest("0152-media-type-filter.png", "Media", f"Type filter active ({p['text']})", f"Click '{p['text']}' filter pill")
                # Reset
                page.mouse.click(p["x"] + 5, p["y"] + 5)
        except Exception as e:
            print(f"  ⚠ Media type filter failed: {e}")

        # ── Design color picker ──
        print("\n[7] Design color picker")
        try:
            click_rail(page, "design")
            page.wait_for_timeout(800)

            swatches = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('button, div')).filter(el => {
                    const style = window.getComputedStyle(el);
                    const bg = style.backgroundColor;
                    const r = el.getBoundingClientRect();
                    // Looking for small colored squares/circles that are color swatches
                    return r.width >= 12 && r.width <= 40 && r.height >= 12 && r.height <= 40
                        && bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
                        && !bg.startsWith('rgb(255, 255, 255)') && !bg.startsWith('rgb(0, 0, 0)');
                }).slice(0, 5).map(el => ({
                    tag: el.tagName,
                    cls: el.className.toString().slice(0, 40),
                    bg: window.getComputedStyle(el).backgroundColor,
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y),
                    w: Math.round(el.getBoundingClientRect().width),
                    h: Math.round(el.getBoundingClientRect().height)
                }));
            }""")
            print(f"  Color swatches: {swatches}")

            if swatches:
                s = swatches[0]
                page.mouse.click(s["x"] + s["w"] / 2, s["y"] + s["h"] / 2)
                page.wait_for_timeout(800)
                shoot(page, "0163-design-color-picker.png")
                add_manifest("0163-design-color-picker.png", "Design System", "Color picker open", "Click color swatch in Design System tab")
                page.keyboard.press("Escape")
        except Exception as e:
            print(f"  ⚠ Design color picker failed: {e}")

        # ── Topbar - undo/redo visible ──
        print("\n[8] Topbar elements")
        try:
            shoot(page, "0200-topbar-default.png")
            add_manifest("0200-topbar-default.png", "Topbar", "Topbar at rest state", "Topbar with undo/redo, device selector, publish button")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── Upload zone in media ──
        print("\n[9] Media upload zone")
        try:
            click_rail(page, "assets")
            page.wait_for_timeout(800)

            # Scroll down to find upload zone
            upload_info = page.evaluate("""() => {
                const el = document.querySelector('[class*="upload"], [class*="Upload"], input[type="file"]');
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {cls: el.className.toString().slice(0, 60), x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height)};
            }""")
            print(f"  Upload element: {upload_info}")
            shoot(page, "0153-media-upload-zone.png")
            add_manifest("0153-media-upload-zone.png", "Media", "Media panel with upload zone", "Media tab scrolled to show upload area")
        except Exception as e:
            print(f"  ⚠ Upload zone failed: {e}")

        browser.close()

    print(f"\nPass 3 complete!")
    data = json.loads(manifest_path.read_text())
    print(f"Manifest total: {len(data)} entries")


if __name__ == "__main__":
    main()
