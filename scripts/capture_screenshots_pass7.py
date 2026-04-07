"""Pass 7 — Template preview modal viewport buttons + final states"""

import json
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:5173"
OUTPUT_DIR = Path(__file__).parent / "latest-screenshots"
VIEWPORT = {"width": 1440, "height": 900}
manifest_path = OUTPUT_DIR / "manifest.json"


def shoot(page: Page, fn: str, clip=None) -> None:
    page.wait_for_timeout(600)
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

        # ── 1. Template preview with viewport cycling ──
        print("\n[1] Template preview modal with viewport buttons")
        click_rail(page, "templates")
        page.wait_for_timeout(800)

        try:
            # Hover first card and click Preview button
            tcard = page.evaluate("() => { const c = document.querySelector('.tcard'); const r = c.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }")
            page.mouse.move(tcard["x"] + tcard["w"]/2, tcard["y"] + tcard["h"]/2)
            page.wait_for_timeout(400)

            prev_btn = page.evaluate("() => { const b = document.querySelector('.tcard-prev-btn'); const r = b.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; }")
            page.mouse.click(prev_btn["x"] + prev_btn["w"]/2, prev_btn["y"] + prev_btn["h"]/2)
            page.wait_for_timeout(1500)  # Longer wait for re-render

            # Dump ALL buttons in sidebar drawer now
            all_btns = page.evaluate("""() => {
                const drawer = document.querySelector('.layout-shell__drawer');
                if (!drawer) return [];
                return Array.from(drawer.querySelectorAll('button')).map(b => ({
                    text: b.textContent.trim().slice(0, 20),
                    cls: b.className.toString().slice(0, 50),
                    aria: b.getAttribute('aria-label') || '',
                    pressed: b.getAttribute('aria-pressed') || '',
                    x: Math.round(b.getBoundingClientRect().x),
                    y: Math.round(b.getBoundingClientRect().y),
                    w: Math.round(b.getBoundingClientRect().width),
                    h: Math.round(b.getBoundingClientRect().height)
                }));
            }""")
            print(f"  All buttons in drawer after Preview click:")
            for b in all_btns:
                print(f"    {b}")

            # Also check what class the container has
            container = page.evaluate("""() => {
                const s = document.querySelector('.tpl-shell');
                return s ? {cls: s.className, children: Array.from(s.children).map(c => c.className)} : null;
            }""")
            print(f"  tpl-shell: {container}")

            shoot(page, "0133-templates-preview-modal-desktop.png")
            add_manifest("0133-templates-preview-modal-desktop.png", "Templates", "Template preview modal — Desktop view", "Hover card → click Preview → → desktop viewport")

            # Try clicking viewport buttons by aria-label
            for label, fn, state in [
                ("Tablet", "0134-templates-preview-modal-tablet.png", "Template preview modal — Tablet view"),
                ("Mobile", "0135-templates-preview-modal-mobile.png", "Template preview modal — Mobile view"),
            ]:
                for btn in all_btns:
                    if btn["aria"].lower() == label.lower() or btn["text"].lower() == label.lower():
                        page.mouse.click(btn["x"] + btn["w"]//2, btn["y"] + btn["h"]//2)
                        page.wait_for_timeout(600)
                        shoot(page, fn)
                        add_manifest(fn, "Templates", state, f"Click {label} viewport button")
                        break

            page.keyboard.press("Escape")
            page.wait_for_timeout(500)

        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ── 2. Templates: pro/locked template ──
        print("\n[2] Pro/locked template card")
        try:
            click_rail(page, "templates")
            page.wait_for_timeout(700)

            # Look for tcard--locked
            locked = page.evaluate("""() => {
                const c = document.querySelector('.tcard--locked');
                if (!c) return null;
                const r = c.getBoundingClientRect();
                return {x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  Locked card: {locked}")
            if locked:
                shoot(page, "0138-templates-pro-card.png", clip={"x": locked["x"]-5, "y": locked["y"]-5, "width": locked["w"]+10, "height": locked["h"]+10})
                add_manifest("0138-templates-pro-card.png", "Templates", "PRO/locked template card", "Template card with PRO badge and lock overlay")

        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 3. Sync status indicator ──
        print("\n[3] Sync status indicator")
        try:
            sync_info = page.evaluate("""() => {
                const el = document.querySelector('.sync-status, [class*="sync"], [class*="Sync"]');
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return {cls: el.className, x: r.x, y: r.y, w: r.width, h: r.height};
            }""")
            print(f"  Sync status: {sync_info}")
            if sync_info:
                shoot(page, "0206-topbar-sync-status.png", clip={
                    "x": max(0, sync_info["x"] - 20),
                    "y": 0,
                    "width": 200,
                    "height": 60
                })
                add_manifest("0206-topbar-sync-status.png", "Topbar", "Sync status indicator", "Status indicator in topbar area")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 4. Full editor complete overview ──
        print("\n[4] Final editor overview")
        try:
            page.keyboard.press("Escape")
            # Open Pages tab so sidebar is showing something useful
            click_rail(page, "pages")
            page.wait_for_timeout(600)
            page.mouse.click(720, 600)  # click canvas to deselect
            page.wait_for_timeout(400)
            shoot(page, "0099-editor-full-overview.png")
            add_manifest("0099-editor-full-overview.png", "Editor", "Editor full overview with Pages tab open", "Editor with Pages tab, canvas visible, inspector empty")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 5. Add tab ──
        print("\n[5] Build/Add tab detailed view")
        try:
            click_rail(page, "add")
            page.wait_for_timeout(600)
            shoot(page, "0122b-leftpanel-build-detailed.png")
            add_manifest("0122b-leftpanel-build-detailed.png", "Left Sidebar", "Build panel with element cards", "Click Build rail tab — shows element cards")
        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    data = json.loads(manifest_path.read_text())
    print(f"\nPass 7 complete! Manifest: {len(data)} entries")
    import glob
    pngs = glob.glob(str(OUTPUT_DIR / "*.png"))
    print(f"Total PNGs: {len(pngs)}")


if __name__ == "__main__":
    main()
