"""
Replace2 — capture ApplyProgressOverlay and Replace modal.
Flow: apply template 1 → capture progress overlay → wait for elements
      → apply template 2 → capture Replace modal → confirm → done.
"""

import json
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


def canvas_element_count(page: Page) -> int:
    return page.evaluate("""() =>
        Array.from(document.querySelectorAll('[data-aqb-type]')).filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 5 && r.height > 5;
        }).length
    """)


def select_free_card(page: Page, index: int) -> dict | None:
    cards = page.evaluate("""() =>
        Array.from(document.querySelectorAll('.tcard:not(.tcard--locked)')).map(c => ({
            aria: c.getAttribute('aria-label') || '',
            x: Math.round(c.getBoundingClientRect().x),
            y: Math.round(c.getBoundingClientRect().y),
            w: Math.round(c.getBoundingClientRect().width),
            h: Math.round(c.getBoundingClientRect().height)
        }))
    """)
    if not cards or index >= len(cards):
        return None
    return cards[index]


def click_nudge(page: Page) -> bool:
    btn = page.evaluate("""() => {
        const b = document.querySelector('.tpl-nudge-btn');
        if (!b || b.disabled) return null;
        const r = b.getBoundingClientRect();
        return {x: r.x, y: r.y, w: r.width, h: r.height};
    }""")
    if not btn:
        return False
    page.mouse.click(btn["x"] + btn["w"]//2, btn["y"] + btn["h"]//2)
    return True


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, slow_mo=20)
        ctx = browser.new_context(viewport=VIEWPORT, reduced_motion="reduce", color_scheme="dark")
        page = ctx.new_page()

        print("--- Entering editor ---")
        enter_editor(page)
        print(f"  Canvas on entry: {canvas_element_count(page)} elements")

        # ── 1. Apply FIRST template — capture progress overlay ──
        print("\n[1] Apply first template — capture ApplyProgressOverlay")
        try:
            click_rail(page, "templates")

            card0 = select_free_card(page, 0)
            print(f"  Card 0: {card0['aria'] if card0 else 'none'}")
            if card0:
                # Click bottom-right corner (away from preview button at top-left)
                page.mouse.click(card0["x"] + card0["w"] - 12, card0["y"] + card0["h"] - 12)
                page.wait_for_timeout(500)

                nudge_text = page.evaluate("""() => {
                    const n = document.querySelector('.tpl-nudge');
                    return n ? n.textContent.trim().slice(0, 50) : '';
                }""")
                print(f"  Nudge: {nudge_text}")

                # Click "Use This →"
                clicked = click_nudge(page)
                print(f"  Clicked nudge: {clicked}")

                if clicked:
                    # Quickly check for progress overlay (appears briefly)
                    for attempt in range(8):
                        page.wait_for_timeout(200)
                        overlay_cls = page.evaluate("""() => {
                            const ov = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"]');
                            return ov ? ov.className.toString() : '';
                        }""")
                        if overlay_cls:
                            print(f"  Progress overlay found! cls={overlay_cls[:60]}")
                            shoot(page, "0139-templates-apply-progress.png")
                            add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Click 'Use This →' → ApplyProgressOverlay animation shows")
                            break
                        else:
                            print(f"  Attempt {attempt}: no overlay yet")

                    # Wait for template to finish applying
                    page.wait_for_timeout(5000)
                    count1 = canvas_element_count(page)
                    print(f"  Canvas after template 1: {count1} elements")

                    # Also check composer content
                    has_content = page.evaluate("""() => {
                        try {
                            const c = window.__composer__ || window.composer;
                            if (c) return Boolean(c.elements.toHTML()?.trim());
                        } catch {}
                        return null;
                    }""")
                    print(f"  composer.elements.toHTML() has content: {has_content}")
        except Exception as e:
            print(f"  ⚠ {e}")

        # ── 2. Apply SECOND template — should show Replace modal ──
        print("\n[2] Apply second template — expect Replace modal")
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
            click_rail(page, "templates")
            page.wait_for_timeout(500)

            count_before = canvas_element_count(page)
            print(f"  Canvas before 2nd apply: {count_before} elements")

            card1 = select_free_card(page, 1)
            print(f"  Card 1: {card1['aria'] if card1 else 'none'}")
            if card1:
                page.mouse.click(card1["x"] + card1["w"] - 12, card1["y"] + card1["h"] - 12)
                page.wait_for_timeout(500)
                clicked = click_nudge(page)
                page.wait_for_timeout(800)

                # Check for Replace modal
                modal = page.evaluate("""() => {
                    const selectors = [
                        '.tmpl-replace-modal', '[class*="replace-modal"]',
                        '[class*="ReplaceModal"]', '[role="dialog"]'
                    ];
                    for (const sel of selectors) {
                        const el = document.querySelector(sel);
                        if (el) {
                            const r = el.getBoundingClientRect();
                            if (r.width > 100 && r.height > 50) {
                                return {
                                    found: true, sel,
                                    text: el.textContent.trim().slice(0, 80),
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
                print(f"  Modal: {modal}")

                if modal.get("found"):
                    shoot(page, "0137-templates-replace-modal.png")
                    add_manifest("0137-templates-replace-modal.png", "Templates", "Template Replace confirmation modal", "Canvas has content → select new template → 'Use This →' → Replace modal")
                    print("  ✓ Replace modal captured!")

                    # Confirm and wait for progress overlay
                    for btn in modal.get("buttons", []):
                        if any(kw in btn["text"].lower() for kw in ["replac", "apply", "confirm", "yes"]):
                            page.mouse.click(btn["x"] + btn["w"]//2, btn["y"] + 5)
                            page.wait_for_timeout(300)
                            # Check for progress overlay after confirm
                            for _ in range(6):
                                page.wait_for_timeout(200)
                                ov = page.evaluate("""() => {
                                    const ov = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"]');
                                    return ov ? ov.className.toString() : '';
                                }""")
                                if ov:
                                    print(f"  Progress after confirm: {ov[:40]}")
                                    # Already captured in step 1 if found
                                    break
                            break
                    else:
                        page.keyboard.press("Escape")
                else:
                    print("  → No Replace modal shown.")
                    # Capture progress overlay at least
                    for _ in range(10):
                        page.wait_for_timeout(200)
                        ov_cls = page.evaluate("""() => {
                            const ov = document.querySelector('[class*="apply-progress"], [class*="ApplyProgress"]');
                            return ov ? ov.className.toString() : '';
                        }""")
                        if ov_cls:
                            print(f"  Progress overlay (step 2): {ov_cls[:40]}")
                            if not (OUTPUT_DIR / "0139-templates-apply-progress.png").exists():
                                shoot(page, "0139-templates-apply-progress.png")
                                add_manifest("0139-templates-apply-progress.png", "Templates", "Template apply progress overlay", "Click 'Use This →' → ApplyProgressOverlay animation")
                            break
        except Exception as e:
            print(f"  ⚠ {e}")
            page.keyboard.press("Escape")

        # ── 3. Wait for template to fully apply, then capture canvas ──
        print("\n[3] Canvas state after all applies")
        try:
            page.keyboard.press("Escape")
            page.wait_for_timeout(3000)
            count_final = canvas_element_count(page)
            print(f"  Final canvas: {count_final} elements")
            shoot(page, "0099e-editor-after-templates.png")
            add_manifest("0099e-editor-after-templates.png", "Editor", "Editor after multiple template applies", "Final editor state after template workflow")
        except Exception as e:
            print(f"  ⚠ {e}")

        browser.close()

    # Regenerate
    import time, glob as gl

    data = json.loads(manifest_path.read_text())
    all_pngs = sorted(OUTPUT_DIR.glob("*.png"), key=lambda p: p.name)
    existing = {item["file"]: item for item in data}
    final = []
    for png in all_pngs:
        fn = png.name
        final.append(existing.get(fn, {
            "file": fn, "section": "Unknown",
            "state": fn.replace(".png", "").replace("-", " "),
            "how_to_reproduce": f"Screenshot of: {fn}"
        }))
    manifest_path.write_text(json.dumps(final, indent=2))

    sections = {}
    for item in final:
        sections.setdefault(item.get("section", "Other"), []).append(item)
    section_order = [
        "Entry", "Topbar", "Left Rail", "Left Sidebar", "Templates", "Pages",
        "Media", "Design System", "Settings", "Publish",
        "Canvas Footer", "Canvas", "Inspector", "Modals", "Notifications",
        "Empty States", "History", "Layers", "Editor", "Unknown", "Other",
    ]
    ordered = {}
    for s in section_order:
        if s in sections:
            ordered[s] = sections.pop(s)
    ordered.update(sections)

    lines = [
        "# Aquibra Editor — Complete Screenshot Library", "",
        f"> **Total screenshots:** {len(final)}  ",
        f"> **Generated:** {time.strftime('%Y-%m-%d %H:%M')}  ",
        f"> **Viewport:** 1440×900 · Chromium headless · Dark mode", "",
        "---", "", "## Quick Index", "",
    ]
    for section, items in ordered.items():
        anchor = section.lower().replace(" ", "-").replace("/", "")
        lines.append(f"- [{section} ({len(items)})](#{anchor})")
    lines += ["", "---", ""]
    for section, items in ordered.items():
        lines += [f"## {section}", "", "| File | State | How to Reproduce |", "|------|-------|-----------------|"]
        for item in items:
            lines.append(f"| [`{item['file']}`]({item['file']}) | {item['state']} | {item['how_to_reproduce']} |")
        lines.append("")

    readme_path = OUTPUT_DIR / "README.md"
    readme_path.write_text("\n".join(lines))

    pngs = gl.glob(str(OUTPUT_DIR / "*.png"))
    print(f"\n{'='*60}")
    print(f"REPLACE2 COMPLETE! {len(final)} manifest entries, {len(pngs)} PNGs")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
