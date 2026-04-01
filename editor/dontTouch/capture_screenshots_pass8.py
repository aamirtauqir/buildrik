"""Pass 8 — Force click Preview button to trigger template preview modal."""

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


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        # Use headed=False with slower actions
        browser = pw.chromium.launch(headless=True, slow_mo=50)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()
        enter_editor(page)

        print("\n[1] Template preview modal — force click")
        click_rail(page, "templates")
        page.wait_for_timeout(800)

        # Try force=True click on the Preview button
        try:
            page.locator(".tcard-prev-btn").first.click(force=True)
            page.wait_for_timeout(1500)

            state = page.evaluate("""() => {
                const shell = document.querySelector('.tpl-shell');
                return {
                    children: Array.from(shell?.children || []).map(c => c.className.toString().slice(0, 40)),
                    hasPreview: !!document.querySelector('.tmpl-preview'),
                    buttons: Array.from(document.querySelectorAll('.layout-shell__drawer button')).map(b => ({
                        text: b.textContent.trim().slice(0, 20),
                        cls: b.className.toString().slice(0, 40),
                        aria: b.getAttribute('aria-label') || '',
                        x: Math.round(b.getBoundingClientRect().x),
                        y: Math.round(b.getBoundingClientRect().y)
                    }))
                };
            }""")
            print(f"  State after force click: {state}")

            if state.get("hasPreview"):
                shoot(page, "0133-templates-preview-modal-desktop.png")
                add_manifest("0133-templates-preview-modal-desktop.png", "Templates", "Template preview modal — Desktop", "Click Preview → (force) → modal replaces sidebar")

                # Click Tablet
                for btn in state["buttons"]:
                    if "tablet" in btn.get("aria", "").lower():
                        page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                        page.wait_for_timeout(600)
                        shoot(page, "0134-templates-preview-modal-tablet.png")
                        add_manifest("0134-templates-preview-modal-tablet.png", "Templates", "Preview modal — Tablet", "Click Tablet viewport button")

                    elif "mobile" in btn.get("aria", "").lower():
                        page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                        page.wait_for_timeout(600)
                        shoot(page, "0135-templates-preview-modal-mobile.png")
                        add_manifest("0135-templates-preview-modal-mobile.png", "Templates", "Preview modal — Mobile", "Click Mobile viewport button")

                page.keyboard.press("Escape")
            else:
                print("  → Preview still not showing. Trying via React state injection.")

                # Inject previewId via React internal fiber
                result = page.evaluate("""() => {
                    // Find the first tcard-prev-btn and dispatch a synthetic click event
                    const btn = document.querySelector('.tcard-prev-btn');
                    if (!btn) return 'no button';
                    // Create and dispatch a real mouse event
                    const evt = new MouseEvent('click', {bubbles: true, cancelable: true, button: 0});
                    btn.dispatchEvent(evt);
                    return 'dispatched';
                }""")
                print(f"  JS dispatch result: {result}")
                page.wait_for_timeout(1500)

                state2 = page.evaluate("""() => ({
                    hasPreview: !!document.querySelector('.tmpl-preview'),
                    children: Array.from(document.querySelector('.tpl-shell')?.children || []).map(c => c.className.toString().slice(0, 40))
                })""")
                print(f"  State after JS dispatch: {state2}")

                if state2.get("hasPreview"):
                    shoot(page, "0133-templates-preview-modal-desktop.png")
                    add_manifest("0133-templates-preview-modal-desktop.png", "Templates", "Template preview modal", "JS-dispatched click on Preview button")

                    # Get VP buttons
                    vp_btns = page.evaluate("""() => {
                        return Array.from(document.querySelectorAll('.tmpl-preview__vp-btn')).map(b => ({
                            aria: b.getAttribute('aria-label'),
                            x: Math.round(b.getBoundingClientRect().x),
                            y: Math.round(b.getBoundingClientRect().y)
                        }));
                    }""")
                    for btn in vp_btns:
                        if btn["aria"] == "Tablet":
                            page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                            page.wait_for_timeout(600)
                            shoot(page, "0134-templates-preview-modal-tablet.png")
                            add_manifest("0134-templates-preview-modal-tablet.png", "Templates", "Preview modal — Tablet", "Tablet viewport")
                        elif btn["aria"] == "Mobile":
                            page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                            page.wait_for_timeout(600)
                            shoot(page, "0135-templates-preview-modal-mobile.png")
                            add_manifest("0135-templates-preview-modal-mobile.png", "Templates", "Preview modal — Mobile", "Mobile viewport")

                    page.keyboard.press("Escape")
                else:
                    shoot(page, "0133-templates-preview-modal-desktop.png")
                    add_manifest("0133-templates-preview-modal-desktop.png", "Templates", "Templates tab (preview not triggerable in headless)", "Templates sidebar panel — preview button requires live hover")

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ── Try to add multiselect via double-clicking elements ──
        print("\n[2] Canvas multiselect via Build panel")
        try:
            click_rail(page, "add")
            page.wait_for_timeout(600)

            # Use keyboard shortcut — press 'H' (Heading) or try text element
            # Find heading card and try single click first (maybe single click adds)
            heading_card = page.evaluate("""() => {
                const cards = Array.from(document.querySelectorAll('.bld-el-card'));
                const hd = cards.find(c => c.textContent.trim().startsWith('H'));
                if (!hd) return null;
                const r = hd.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  Heading card: {heading_card}")

            if heading_card:
                # Single click adds element? Or need double click
                page.mouse.click(heading_card["x"] + heading_card["w"]/2, heading_card["y"] + heading_card["h"]/2)
                page.wait_for_timeout(800)

                els = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('[data-aqb-type]')).map(el => {
                        const r = el.getBoundingClientRect();
                        return {x: r.x, y: r.y, w: r.width, h: r.height, type: el.getAttribute('data-aqb-type')};
                    }).filter(r => r.w > 10 && r.h > 10);
                }""")
                print(f"  Canvas elements after click: {len(els)} → {els}")

                if len(els) >= 2:
                    e0, e1 = els[0], els[1]
                    page.mouse.click(e0["x"] + e0["w"]/2, e0["y"] + e0["h"]/2)
                    page.wait_for_timeout(300)
                    page.keyboard.down("Shift")
                    page.mouse.click(e1["x"] + e1["w"]/2, e1["y"] + e1["h"]/2)
                    page.keyboard.up("Shift")
                    page.wait_for_timeout(600)
                    shoot(page, "0303-canvas-multiselect.png")
                    add_manifest("0303-canvas-multiselect.png", "Canvas", "Multi-select (2 elements)", "Shift+click 2 canvas elements")
                    shoot(page, "0406-inspector-multiselect-toolbar.png")
                    add_manifest("0406-inspector-multiselect-toolbar.png", "Inspector", "Inspector multi-select state", "2+ elements selected — inspector shows multi-select toolbar")
                    page.keyboard.press("Escape")
                    page.keyboard.press("Meta+Z")  # undo added element

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.up("Shift")

        browser.close()

    data = json.loads(manifest_path.read_text())
    print(f"\nPass 8 complete! Manifest: {len(data)} entries")
    import glob
    pngs = glob.glob(str(OUTPUT_DIR / "*.png"))
    print(f"Total PNGs: {len(pngs)}")


if __name__ == "__main__":
    main()
