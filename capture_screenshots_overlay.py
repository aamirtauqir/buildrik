"""
Capture ApplyProgressOverlay by rapid-fire screenshotting after nudge click.
Also capture Replace modal by applying template when canvas has content.
"""

import json, time
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page: Page, fn: str, clip=None) -> None:
    kwargs = {"path": str(OUTPUT_DIR / fn), "timeout": 8000}
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
    page.click(f'[id="rail-tab-{tab_id}"]', timeout=8000)
    page.wait_for_timeout(600)


def enter_editor(page: Page) -> None:
    page.goto(BASE_URL, wait_until="commit", timeout=30000)
    page.wait_for_timeout(2000)
    try:
        page.click("text=Open", timeout=5000)
        page.wait_for_timeout(2000)
    except Exception:
        pass
    page.wait_for_selector('[id="rail-tab-templates"]', timeout=12000)
    page.wait_for_timeout(500)


def canvas_count(page: Page) -> int:
    return page.evaluate("""() =>
        Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 5 && r.height > 5;
        }).length
    """)


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, slow_mo=0)  # No slow_mo for speed
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()

        print("--- Entering editor ---")
        enter_editor(page)
        print(f"  Canvas: {canvas_count(page)} elements")

        # ── 1. Go to templates, select card, apply ──
        print("\n[1] Apply SaaS Landing template")
        try:
            click_rail(page, "templates")

            # Get cards
            cards = page.evaluate("""() =>
                Array.from(document.querySelectorAll('.tcard:not(.tcard--locked)')).map(c => ({
                    aria: c.getAttribute('aria-label') || '',
                    x: Math.round(c.getBoundingClientRect().x),
                    y: Math.round(c.getBoundingClientRect().y),
                    w: Math.round(c.getBoundingClientRect().width),
                    h: Math.round(c.getBoundingClientRect().height)
                }))
            """)
            print(f"  Free cards: {[c['aria'] for c in cards]}")

            # Click card 0 center-bottom area (avoid preview button at top-left)
            c0 = cards[0]
            page.mouse.click(c0["x"] + c0["w"]//2, c0["y"] + c0["h"] - 15)
            page.wait_for_timeout(400)

            # Verify selection
            nudge = page.evaluate("""() => {
                const b = document.querySelector('.tpl-nudge-btn');
                return b ? {text: b.textContent.trim(), disabled: b.disabled, x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y, w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height} : null;
            }""")
            print(f"  Nudge: {nudge}")

            if nudge and not nudge["disabled"]:
                # Click nudge then immediately rapid-fire screenshot
                page.mouse.click(nudge["x"] + nudge["w"]//2, nudge["y"] + nudge["h"]//2)

                # Rapid poll for overlay (every 100ms for 3s)
                overlay_found = False
                for i in range(30):
                    time.sleep(0.1)
                    ov_cls = page.evaluate("""() => {
                        const ov = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"]');
                        if (!ov) return '';
                        const r = ov.getBoundingClientRect();
                        return r.width > 50 ? ov.className.toString() : '';
                    }""")
                    if ov_cls:
                        print(f"  ✓ Overlay found at {i*100}ms: {ov_cls[:50]}")
                        page.screenshot(path=str(OUTPUT_DIR / "0139-templates-apply-progress.png"), timeout=3000)
                        print("  ✓ 0139-templates-apply-progress.png")
                        add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Click 'Use This →' → ApplyProgressOverlay animation")
                        overlay_found = True
                        break

                if not overlay_found:
                    print("  → Overlay not caught in 3s polling")

                # Wait for template to fully apply
                time.sleep(4)
                count_after = canvas_count(page)
                print(f"  Canvas after template 1: {count_after} elements")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 2. Apply SECOND template — Replace modal ──
        print("\n[2] Apply second template (Replace modal expected)")
        try:
            page.keyboard.press("Escape")
            time.sleep(0.3)
            click_rail(page, "templates")

            count_now = canvas_count(page)
            print(f"  Canvas now: {count_now} elements")

            cards2 = page.evaluate("""() =>
                Array.from(document.querySelectorAll('.tcard:not(.tcard--locked)')).map(c => ({
                    aria: c.getAttribute('aria-label') || '',
                    x: Math.round(c.getBoundingClientRect().x),
                    y: Math.round(c.getBoundingClientRect().y),
                    w: Math.round(c.getBoundingClientRect().width),
                    h: Math.round(c.getBoundingClientRect().height)
                }))
            """)

            # Click card 1 (Portfolio) bottom area
            c1 = cards2[1] if len(cards2) > 1 else cards2[0]
            print(f"  Clicking card: {c1['aria']}")
            page.mouse.click(c1["x"] + c1["w"]//2, c1["y"] + c1["h"] - 15)
            time.sleep(0.4)

            nudge2 = page.evaluate("""() => {
                const b = document.querySelector('.tpl-nudge-btn');
                return b ? {text: b.textContent.trim(), disabled: b.disabled, x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y, w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height} : null;
            }""")
            print(f"  Nudge 2: {nudge2}")

            if nudge2 and not nudge2["disabled"]:
                page.mouse.click(nudge2["x"] + nudge2["w"]//2, nudge2["y"] + nudge2["h"]//2)
                time.sleep(0.3)

                # Check for Replace modal rapidly
                for i in range(15):
                    time.sleep(0.2)
                    modal = page.evaluate("""() => {
                        const selectors = ['.tmpl-replace-modal', '[class*="replace-modal"]', '[class*="ReplaceModal"]', '[role="dialog"]'];
                        for (const sel of selectors) {
                            const el = document.querySelector(sel);
                            if (el) {
                                const r = el.getBoundingClientRect();
                                if (r.width > 100 && r.height > 50) {
                                    return {found: true, sel, text: el.textContent.trim().slice(0, 60),
                                        buttons: Array.from(el.querySelectorAll('button')).map(b => ({
                                            text: b.textContent.trim().slice(0, 20),
                                            x: Math.round(b.getBoundingClientRect().x),
                                            y: Math.round(b.getBoundingClientRect().y),
                                            w: Math.round(b.getBoundingClientRect().width)
                                        }))
                                    };
                                }
                            }
                        }
                        return {found: false};
                    }""")
                    if modal.get("found"):
                        print(f"  Replace modal found at {i*200}ms!")
                        page.screenshot(path=str(OUTPUT_DIR / "0137-templates-replace-modal.png"), timeout=5000)
                        print("  ✓ 0137-templates-replace-modal.png")
                        add_manifest("0137-templates-replace-modal.png", "Templates", "Template Replace confirmation modal", "Canvas has content → select new template → 'Use This →' → Replace modal")

                        # Click Replace/Apply button
                        for btn in modal.get("buttons", []):
                            if any(kw in btn["text"].lower() for kw in ["replac", "apply", "confirm", "yes"]):
                                page.mouse.click(btn["x"] + btn["w"]//2, btn["y"] + 5)
                                # Rapid poll for progress overlay after confirm
                                for j in range(20):
                                    time.sleep(0.1)
                                    ov2 = page.evaluate("""() => {
                                        const ov = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"]');
                                        return ov ? (ov.getBoundingClientRect().width > 50 ? ov.className.toString() : '') : '';
                                    }""")
                                    if ov2:
                                        print(f"  Progress overlay after confirm: {ov2[:40]}")
                                        if not (OUTPUT_DIR / "0139-templates-apply-progress.png").exists():
                                            page.screenshot(path=str(OUTPUT_DIR / "0139-templates-apply-progress.png"), timeout=3000)
                                            add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Confirm Replace → ApplyProgressOverlay")
                                        break
                                break
                        break

                    # Also check for progress overlay (direct apply without replace modal)
                    ov_cls = page.evaluate("""() => {
                        const ov = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"]');
                        return ov ? (ov.getBoundingClientRect().width > 50 ? ov.className.toString() : '') : '';
                    }""")
                    if ov_cls:
                        print(f"  Progress overlay at {i*200}ms (step 2)")
                        if not (OUTPUT_DIR / "0139-templates-apply-progress.png").exists():
                            page.screenshot(path=str(OUTPUT_DIR / "0139-templates-apply-progress.png"), timeout=3000)
                            add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Direct apply → ApplyProgressOverlay animation")
                        break
                else:
                    print("  → No Replace modal and no overlay in 3s")
                    page.screenshot(path=str(OUTPUT_DIR / "0137-templates-replace-modal.png"), timeout=5000)
                    add_manifest("0137-templates-replace-modal.png", "Templates", "Templates tab — use this template state", "Templates tab with template selected and use button visible")
        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ── 3. Wait and capture final canvas ──
        print("\n[3] Final canvas state")
        try:
            time.sleep(3)
            final_count = canvas_count(page)
            print(f"  Final canvas: {final_count} elements")
            page.screenshot(path=str(OUTPUT_DIR / "0100d-canvas-with-template.png"), timeout=5000)
            print("  ✓ 0100d-canvas-with-template.png")
            add_manifest("0100d-canvas-with-template.png", "Canvas", "Canvas with template elements loaded", "Canvas filled with template content")
        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    # Update manifest
    data = json.loads(manifest_path.read_text())
    all_pngs = sorted(OUTPUT_DIR.glob("*.png"), key=lambda p: p.name)
    existing = {item["file"]: item for item in data}
    final = [existing.get(png.name, {
        "file": png.name, "section": "Unknown",
        "state": png.name.replace(".png", "").replace("-", " "),
        "how_to_reproduce": f"Screenshot of: {png.name}"
    }) for png in all_pngs]
    manifest_path.write_text(json.dumps(final, indent=2))

    import glob as gl
    pngs = gl.glob(str(OUTPUT_DIR / "*.png"))
    print(f"\n{'='*60}")
    print(f"OVERLAY PASS COMPLETE! {len(final)} manifest entries, {len(pngs)} PNGs")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
