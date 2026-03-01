"""
Pass 6 — Final: Template preview modal D/T/M viewports, final cleanup
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


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()
        enter_editor(page)

        # ── Template preview modal ──
        print("\n[1] Template preview modal (replaces sidebar tab)")
        try:
            click_rail(page, "templates")
            page.wait_for_timeout(800)

            # Click "Preview →" button on first card (coord from recon: x=86, y=251)
            # The tcard-prev-btn is inside tcard-hover-ov which appears on hover
            page.mouse.click(86 + 20, 251 + 8)
            page.wait_for_timeout(1200)

            # Check what rendered — look for tmpl-preview class
            modal_info = page.evaluate("""() => {
                const modal = document.querySelector('.tmpl-preview, [role="dialog"][aria-label*="Preview"]');
                if (!modal) return {found: false};
                return {
                    found: true,
                    cls: modal.className,
                    rect: {x: Math.round(modal.getBoundingClientRect().x), y: Math.round(modal.getBoundingClientRect().y), w: Math.round(modal.getBoundingClientRect().width), h: Math.round(modal.getBoundingClientRect().height)},
                    vpButtons: Array.from(modal.querySelectorAll('button[aria-label]')).map(b => ({
                        label: b.getAttribute('aria-label'),
                        pressed: b.getAttribute('aria-pressed'),
                        x: Math.round(b.getBoundingClientRect().x),
                        y: Math.round(b.getBoundingClientRect().y)
                    }))
                };
            }""")
            print(f"  Modal info: {modal_info}")

            if modal_info.get("found"):
                # Desktop view (default)
                shoot(page, "0133-templates-preview-modal-desktop.png")
                add_manifest("0133-templates-preview-modal-desktop.png", "Templates", "Template preview — Desktop viewport", "Click 'Preview →' on template card → Desktop view")

                # Find viewport buttons
                vp_buttons = modal_info.get("vpButtons", [])
                for btn in vp_buttons:
                    lbl = btn.get("label", "").lower()
                    if "tablet" in lbl:
                        page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                        page.wait_for_timeout(600)
                        shoot(page, "0134-templates-preview-modal-tablet.png")
                        add_manifest("0134-templates-preview-modal-tablet.png", "Templates", "Template preview — Tablet viewport", "Click Tablet viewport button in template preview")
                    elif "mobile" in lbl:
                        page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                        page.wait_for_timeout(600)
                        shoot(page, "0135-templates-preview-modal-mobile.png")
                        add_manifest("0135-templates-preview-modal-mobile.png", "Templates", "Template preview — Mobile viewport", "Click Mobile viewport button in template preview")

                # Close
                page.keyboard.press("Escape")
                page.wait_for_timeout(500)
            else:
                print("  → Modal not found after click — trying hover approach")
                # The Preview button may only be visible on hover
                tcards = page.evaluate("""() => {
                    return Array.from(document.querySelectorAll('.tcard')).map(el => {
                        const r = el.getBoundingClientRect();
                        return {x: r.x, y: r.y, w: r.width, h: r.height};
                    });
                }""")
                print(f"  tcards: {tcards}")

                if tcards:
                    tcard = tcards[0]
                    # Move to center of first card
                    page.mouse.move(tcard["x"] + tcard["w"]/2, tcard["y"] + tcard["h"]/2)
                    page.wait_for_timeout(400)

                    # Now find the preview button
                    prev_btn = page.evaluate("""() => {
                        const btn = document.querySelector('.tcard-prev-btn');
                        if (!btn) return null;
                        const r = btn.getBoundingClientRect();
                        return {x: r.x, y: r.y, w: r.width, h: r.height, vis: r.width > 0};
                    }""")
                    print(f"  Preview button: {prev_btn}")

                    if prev_btn and prev_btn.get("vis"):
                        page.mouse.click(prev_btn["x"] + prev_btn["w"]/2, prev_btn["y"] + prev_btn["h"]/2)
                        page.wait_for_timeout(1200)
                        shoot(page, "0133-templates-preview-modal-desktop.png")
                        add_manifest("0133-templates-preview-modal-desktop.png", "Templates", "Template preview modal", "Hover card → click Preview → button")

                        # Find viewport buttons after modal opens
                        vp = page.evaluate("""() => {
                            return Array.from(document.querySelectorAll('.tmpl-preview__vp-btn, button[aria-label="Tablet"], button[aria-label="Mobile"]'))
                                .map(b => ({
                                    label: b.getAttribute('aria-label') || b.textContent.trim(),
                                    x: Math.round(b.getBoundingClientRect().x),
                                    y: Math.round(b.getBoundingClientRect().y)
                                }));
                        }""")
                        print(f"  VP buttons: {vp}")

                        for btn in vp:
                            if btn.get("label", "").lower() in ["tablet", "t"]:
                                page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                                page.wait_for_timeout(600)
                                shoot(page, "0134-templates-preview-modal-tablet.png")
                                add_manifest("0134-templates-preview-modal-tablet.png", "Templates", "Preview modal — Tablet", "Click Tablet button")
                            elif btn.get("label", "").lower() in ["mobile", "m"]:
                                page.mouse.click(btn["x"] + 5, btn["y"] + 5)
                                page.wait_for_timeout(600)
                                shoot(page, "0135-templates-preview-modal-mobile.png")
                                add_manifest("0135-templates-preview-modal-mobile.png", "Templates", "Preview modal — Mobile", "Click Mobile button")

                        page.keyboard.press("Escape")

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ── Template category filters ──
        print("\n[2] Template category filters")
        try:
            click_rail(page, "templates")
            page.wait_for_timeout(600)

            pills = page.evaluate("""() => {
                return Array.from(document.querySelectorAll('.tpl-pill')).map(el => ({
                    text: el.textContent.trim(),
                    x: Math.round(el.getBoundingClientRect().x),
                    y: Math.round(el.getBoundingClientRect().y)
                }));
            }""")
            print(f"  Category pills: {pills}")

            # Click non-"all" category
            for pill in pills:
                if pill.get("text", "").lower() not in ["all", ""]:
                    page.mouse.click(pill["x"] + 10, pill["y"] + 5)
                    page.wait_for_timeout(600)
                    shoot(page, "0136-templates-category-filtered.png")
                    add_manifest("0136-templates-category-filtered.png", "Templates", "Templates filtered by category", f"Click '{pill['text']}' category pill")
                    # Clear filter
                    page.mouse.click(pills[0]["x"] + 5, pills[0]["y"] + 5)
                    page.wait_for_timeout(300)
                    break

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── Template Replace modal + Pro modal ──
        print("\n[3] Template Replace modal")
        try:
            click_rail(page, "templates")
            page.wait_for_timeout(600)

            # Select first template card
            tcard = page.evaluate("() => { const c = document.querySelector('.tcard'); if (!c) return null; const r = c.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }")
            if tcard:
                page.mouse.click(tcard["x"] + tcard["w"]/2, tcard["y"] + tcard["h"]/2)
                page.wait_for_timeout(400)

                # Click "Use This →" nudge button
                nudge_btn = page.evaluate("""() => {
                    const btn = document.querySelector('.tpl-nudge-btn');
                    if (!btn) return null;
                    const r = btn.getBoundingClientRect();
                    return {x: r.x, y: r.y, w: r.width, h: r.height, disabled: btn.disabled};
                }""")
                print(f"  Nudge button: {nudge_btn}")

                if nudge_btn and not nudge_btn.get("disabled"):
                    page.mouse.click(nudge_btn["x"] + nudge_btn["w"]/2, nudge_btn["y"] + nudge_btn["h"]/2)
                    page.wait_for_timeout(800)

                    # Check for replace modal
                    replace_modal = page.evaluate("""() => {
                        const modal = document.querySelector('.tmpl-replace-modal, [class*="replace"], [class*="ReplaceModal"]');
                        return modal ? {found: true, cls: modal.className, text: modal.textContent.trim().slice(0, 100)} : {found: false};
                    }""")
                    print(f"  Replace modal: {replace_modal}")

                    shoot(page, "0137-templates-replace-modal.png")
                    add_manifest("0137-templates-replace-modal.png", "Templates", "Replace confirmation modal", "Select template → click 'Use This →' → Replace modal appears")
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(400)

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ── Final: full canvas clean state ──
        print("\n[4] Final canvas clean state")
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
            page.mouse.click(720, 700)
            page.wait_for_timeout(400)
            shoot(page, "0300-canvas-empty.png")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── Page tab bar ──
        print("\n[5] Page tab bar")
        try:
            page_tabs = page.evaluate("""() => {
                const tabBar = document.querySelector('[class*="page-tab"], [class*="pageTab"], [class*="PageTab"]');
                if (!tabBar) return null;
                const r = tabBar.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  Page tab bar: {page_tabs}")
            if page_tabs and page_tabs.get("w", 0) > 50:
                shoot(page, "0308-canvas-page-tab-bar.png", clip={
                    "x": page_tabs["x"], "y": page_tabs["y"],
                    "width": page_tabs["w"], "height": max(40, page_tabs["h"])
                })
                add_manifest("0308-canvas-page-tab-bar.png", "Canvas", "Page tab bar", "Page tabs at top of canvas showing page name")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── Inspector empty state CTAs ──
        print("\n[6] Inspector empty state close-up")
        try:
            page.keyboard.press("Escape")
            page.mouse.click(720, 700)
            page.wait_for_timeout(500)
            insp_rect = page.evaluate("""() => {
                const el = document.querySelector('.layout-shell__inspector');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            if insp_rect:
                shoot(page, "0400b-inspector-empty-close-up.png", clip={
                    "x": insp_rect["x"], "y": insp_rect["y"],
                    "width": insp_rect["w"], "height": insp_rect["h"]
                })
                add_manifest("0400b-inspector-empty-close-up.png", "Inspector", "Inspector empty state — close-up", "No element selected — CTAs visible")
        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    data = json.loads(manifest_path.read_text())
    print(f"\nPass 6 complete! Manifest: {len(data)} entries")
    import glob
    pngs = glob.glob(str(OUTPUT_DIR / "*.png"))
    print(f"Total PNGs: {len(pngs)}")


if __name__ == "__main__":
    main()
